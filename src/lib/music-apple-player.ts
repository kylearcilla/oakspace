import { get } from "svelte/store"
import { MusicPlayer, type MusicPlayerStore } from "./music-player"
import { musicDataStore, musicPlayerStore, } from "./store"
import { MusicPlaylistShuffler } from "./music-playlist-shuffler"
import { getAppleAlbumDetails, getApplePlaylistDetails, getArtworkSrc, isCollectionPlaylist } from "./api-apple-music"
import { PlayerError } from "./errors"

import { 
    loadMusicPlayerState, loadMusicShuffleData, 
    removeMusicPlayerData, removeMusicShuffleData, saveMusicPlayerData 
} from "./utils-music"

/**
 * A class representing an Apple Music player instance that extends MusicPlayer. 
 * The player itself is a svelte store object / reactive class, initialized during instantiation.
 * Errors are handled via an event listener in the music player.
 * 
 * @extends     MusicPlayer
 * @implements  MusicPlayerStore<AppleMusicPlayer>
 */
export class AppleMusicPlayer extends MusicPlayer implements MusicPlayerStore<AppleMusicPlayer> {
    musicPlayerInstance: any
    musicPlaylistShuffler: MusicPlaylistShuffler | null = null

    currentIdx = 0
    lastCollectionIdx = 0
    track: Track | null = null
    collection: MusicCollection | null = null
    doShowPlayer = false
    isPlaying = false
    error: any = null
    isDisabled = true
    isRepeating = false
    isShuffled = false
    hasCollectionJustEnded = false
    hasReachedEnd = false
    hasFinishedPlaylist = false

    PLAYING_STATE = 2
    PAUSED_STATE = 3
    COLLECTION_JUST_ENDED_STATE = 10
    PLAYER_COOLDOWN_MS = 500
 
    constructor(didInitApplePlayer: boolean = false) {
        super()
        musicPlayerStore.set(this)

        if (didInitApplePlayer) this.loadAndSetPlayerData()
        this.initMusicPlayerState()
    }

    /**
     * Initialize music player state from previously saved state or start over.
     * Start where user left off previously. Attach Event Listeners to Music Kit Instance.
     * 
     * @throws  {Error}    Error initializing Music Kit API.
     */
    async initMusicPlayerState () {
        try {
            // @ts-ignore
            this.musicPlayerInstance = await MusicKit.getInstance()
    
            this.updateMusicPlayerState({ 
                isPlaying: false, isDisabled: true, 
                error: null, doShowPlayer: this.track != null
            })
    
            if (this.collection) {
                this.queueAndPlayNextTrack(this.collection!.id, this.currentIdx, false, false)
                this.unDisableMusicPlayer()
            }
    
            this.attachEventHandlers()
        }
        catch(e: any) {
            console.error(`Error initializing Apple Music Kit. Error: ${e}`)
            this.updateMusicPlayerState({ error: e })
            throw e
        }
    }

    /**
     * Initilize event handlers to Apple Music Kit instance. 
     * Has helpful info in the data passed to handlers about state / data of current player / media.
     */
    private attachEventHandlers() {
        // use arrow function to use "this" instance as the lexical context
        this.musicPlayerInstance.addEventListener("nowPlayingItemWillChange", (e: any) => this.nowPlayingItemWillChangeHandler(e))
        this.musicPlayerInstance.addEventListener("playbackTimeDidChange", (e: any) => this.playbackTimeDidChangeHandler(e))
        this.musicPlayerInstance.addEventListener("mediaPlaybackError", (e: any) => this.mediaPlaybackErrorHandler(e))
        this.musicPlayerInstance.addEventListener("mediaCanPlay", (e: any) => this.mediaCanPlayHandler(e))
    }

    /**
     * Update the current state of music player. 
     * Save the data to local storage.
     * Object destructuring is avoided as it fails to include inherited types from abstract class.
     * 
     * @param newMusicPlayerState   New state
     */
    updateMusicPlayerState(newPlayerState: Partial<AppleMusicPlayer>) {
        musicPlayerStore.update((player: MusicPlayer | null) => {
            return this.getNewStateObj(newPlayerState, player! as AppleMusicPlayer)
        })

        this.saveState()
    }
    
    /**
     * Called when player is no longer in use. 
     */
    quitPlayer() {
        this.deleteMusicPlayerData()
    }

    /**
     * Resets to empty state.
     * Called when there is no playlist or quitting plater.
     */
    async resetMusicPlayerStateToEmptyState() {
        if (this.isShuffled) removeMusicShuffleData()

        await this.musicPlayerInstance.stop()

        this.collection = null
        this.removeCurrentTrack()
        
        this.updateMusicPlayerState({
            doShowPlayer: false, isPlaying: false, isDisabled: true, isRepeating: false, 
            isShuffled: false, error: null, hasCollectionJustEnded: false, collection: null
        })
    }

    /**
     * Hide music player component.
     */
    async hideMusicPlayer() {
        if (this.musicPlayerInstance.isPlaying) {
            await this.musicPlayerInstance.pause()
        } 

        this.updateMusicPlayerState({ isPlaying: false })
        this.updateMusicPlayerState({ doShowPlayer: false })
    }

    /**
     * Plays / pauses player.
     * @throws  {Player Error}    Error working with Music Kit API.
     */
    async togglePlayback() {
        try {
            if (this.hasReachedEnd) {
                this.queueAndPlayNextTrack(this.collection!.id, 0)
                this.updateCurrentCollectionIdx(0)
                this.hasReachedEnd = false
                return
            }
            else if (this.musicPlayerInstance.isPlaying) {
                this.updateMusicPlayerState({ isPlaying: false })
                await this.musicPlayerInstance.pause()
            } 
            else {
                this.updateMusicPlayerState({ isPlaying: true })
                await this.musicPlayerInstance.play()
            }
    
            this.unDisableMusicPlayer()
        }
        catch(e: any) {
            console.error(`Error using Apple Music Kit (playback). Error: ${e}`)
            this.updateMusicPlayerState({ error: new PlayerError("Error occured. Refresh the page or play a different item. ")})
            throw e
        }
    }

    /**
     * Skip to Next track.
     * If album / collection has just ended, it will prep the player to play the 0th index.
     */
    async skipToNextTrack() {
        if (this.isShuffled) {
            this.skipToNextRandomTrack()
            return
        }
        
        // here because play & skip prev methods need to see that player reached end state before resetting
        if (this.hasReachedEnd) this.hasReachedEnd = false

        const nextIndex = this.getNextPlaylistIndex()

        if (this.hasReachedEnd) {
            // do not disable as it will not trigger the now-playing event that will undisable player
            this.queueAndPlayNextTrack(this.collection!.id, 0, false, false) 
            this.updateCurrentCollectionIdx(-1)
        }
        else {
            this.queueAndPlayNextTrack(this.collection!.id, nextIndex)
            this.updateCurrentCollectionIdx(nextIndex)
        }
    }

    /**
     * Skip to Prev track.
     * If at the start, it will queue up the first again and start it over.
     */
    async skipToPrevTrack() {
        if (this.isShuffled) {
            this.skipToPrevRandomTrack()
            return
        }
        const nextIndex = this.getPrevPlaylistIndex()
        this.queueAndPlayNextTrack(this.collection!.id, nextIndex)
        this.updateCurrentCollectionIdx(nextIndex)
    }

    /**
     * Skips to next track when shuffled
     */
    async skipToNextRandomTrack() {
        const shuffler = this.musicPlaylistShuffler!
        const playlistID = this.collection!.id

        const nextTrackIndex = shuffler.getNextIndex(this.isRepeating)
        
        if (nextTrackIndex < 0) {
            // do not disable as it will not trigger the now-playing event that will undisable player
            this.queueAndPlayNextTrack(playlistID, 0, false, false)
        }
        else {
            this.queueAndPlayNextTrack(playlistID, nextTrackIndex)
        }

        shuffler!.newItemIsPlayingHandler(true, this.isRepeating)
        this.updateCurrentCollectionIdx(nextTrackIndex)
    }

    /**
     * Skips to prev track when shuffled
     */
    async skipToPrevRandomTrack() {
        const shuffler = this.musicPlaylistShuffler!
        const playlistID = this.collection!.id

        const nextTrackIndex = shuffler.getPrevIndex(this.isRepeating)
        this.queueAndPlayNextTrack(playlistID, nextTrackIndex)

        shuffler!.newItemIsPlayingHandler(false, this.isRepeating)
        this.updateCurrentCollectionIdx(nextTrackIndex)
    }

    /**
     * Player will start over after collection is finished.
     * Shuffles a CHUNK_SIZE subset of indices from collection.
     * Will get more if all items have been played.
     */
    toggleShuffle(): void {
        const currIndex = this.currentIdx
    
        this.isShuffled = !this.isShuffled
        this.hasReachedEnd = false

        if (this.isShuffled && currIndex >= MusicPlaylistShuffler.CHUNK_SIZE) {
            // the actual starting idx will be 0
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(-1, this.collection!.songCount)  
            this.musicPlaylistShuffler.indexPointer = -1
        }
        else if (this.isShuffled) {
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(currIndex, this.collection!.songCount)
        }
        else {
            this.musicPlaylistShuffler!.quit()
            this.musicPlaylistShuffler = null
        }

        this.updateMusicPlayerState({ isDisabled: true, isShuffled: this.isShuffled })
        this.unDisableMusicPlayer()
    }

    /**
     * Toggle repeat for player. 
     */
    toggleRepeat(): void {
        this.isRepeating = !this.isRepeating
        this.updateMusicPlayerState({ isDisabled: true, isRepeating: this.isRepeating })
        this.unDisableMusicPlayer()
    }

    /**
     * Queues up a media collection item to be played.
     * By default, plays the given idx in that collection from the start and disables the player to avoid spamming.
     * Will be disabled later in the nowPlayingItemWillChange handler (triggers when a new playing item has changed).
     * 
     * 
     * @param id          Id of media item
     * @param newIndex    Index of track to be played within music collection
     * @param doPlay      Do immediatley start playing?
     * @param doDisable   Do disable player temporarily to avoid spamming.
     * 
     */
    async queueAndPlayNextTrack(id: string, newIndex: number, doPlay: boolean = true, doDisable: boolean = true) {
        try {
            const isPlaylist = isCollectionPlaylist(id)

            if (isPlaylist) {
                await this.musicPlayerInstance.setQueue({ playlist: id, startWith: newIndex })
            }
            else {
                await this.musicPlayerInstance.setQueue({ album: id, startWith: newIndex })
            }
    
            this.updateMusicPlayerState({ isPlaying: doPlay, isDisabled: doDisable, doShowPlayer: true })
            if (doPlay) await this.musicPlayerInstance.play() 
        }
        catch(e: any) {
            console.error(`Apple Music Kit error with qeueue. Error: ${e}`)
            this.updateMusicPlayerState({ error: new PlayerError("Error occured. Refresh the page or play a different item.") })
        }
    }

    /**
     * Update current track state & save in local storage.
     * @param mediaItem  Current track playing from collection.
     */
    updateCurrentTrack(mediaItem: Track): void {
        this.track = mediaItem
        this.updateMusicPlayerState({ track: mediaItem })
    }
    
    /**
     * Remove current track from store / local storage.
     */
    removeCurrentTrack(): void {
        this.track = null
        this.updateMusicPlayerState({ track: null })
    }
    
    /**
     * Get the next index to be played. If @ end, go to the first.
     * If has reached the end, prep the player to play the first idx if next is pressed.
     * 
     * @param isRepeating              If looped is toggled on.
     * @param hasCollectionJustEnded   If collection has just ended and next is pressed, make sure the first item is played.
     * @returns                        The next index. -1 If end has been reached and not looped. Preps the player to play 0th idx when next is pressed.
     */
    getNextPlaylistIndex(): number {
        this.hasReachedEnd = this.currentIdx + 1 === this.collection!.songCount

        if (this.hasReachedEnd && this.isRepeating) {
            this.hasReachedEnd = false
            return 0
        }
        if (this.hasReachedEnd && !this.isRepeating) return -1

        return this.currentIdx + 1
    }
    
    /**
     * Get the next index to be played. If @ start, go to the last.
     * If playlist has finished and stopped, prep the player to play the last if next is pressed.
     * @returns            The prev index. -1 If at the start. 
     */
    getPrevPlaylistIndex(): number {
        let prevIdx = 0
        const isAtStart = this.currentIdx === 0

        if (isAtStart && this.isRepeating) return this.collection!.songCount - 1 
        if (isAtStart && !this.isRepeating) return 0

        if (this.hasReachedEnd) {
            prevIdx = this.collection!.songCount - 1
            this.hasReachedEnd = false
        }
        else {
            prevIdx = this.currentIdx - 1
        }

        return prevIdx
    }
    
    /**
     * Updates the current index.
     * @param newIndex 
     */
    updateCurrentCollectionIdx(newIndex: number) {
        this.currentIdx = newIndex
        this.updateMusicPlayerState({ currentIdx: newIndex })
    }
    
    /**
     * Updates the current playlist. Updates the playlist store.
     * Have to make additional request to get song count.
     * 
     * @param  newCollection        New collection chosen by user to play.
     * @throws {TokenExpiredError}  401 Error when making requests using access tokens to Music Kit API.       
     * @throws {APIError}           Any other issue with making request. Abstracted as API error to user
     */
    async updateCurrentCollectionAndPlay(newCollection: MusicCollection) {
        try {
            this.hasReachedEnd = false
            
            let collectionDetails 
            const accessToken = get(musicDataStore)!.accessToken
    
            if (newCollection.type === "Album") {
                collectionDetails = await getAppleAlbumDetails(newCollection.id, accessToken)
            } else {
                collectionDetails = await getApplePlaylistDetails(newCollection.id, accessToken)
            }
    
            newCollection.songCount = collectionDetails.songCount
            newCollection.description = collectionDetails.description != "" ? collectionDetails.description : newCollection.description
            
            this.collection = newCollection
            this.updateMusicPlayerState({ collection: newCollection, hasReachedEnd: false, currentIdx: 0, doShowPlayer: true })
    
            await this.queueAndPlayNextTrack(newCollection.id, 0)
        }
        catch(e: any) {
            this.updateMusicPlayerState({ error: e })
            throw e
        }
    }

    /**
     * Remove current collection.
     * This will reset the player to an empty state.
     */
    removeCurrentMusicCollection() {
        this.resetMusicPlayerStateToEmptyState()
    }

    /**
     * Called when the player is availabled to be played
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private async mediaCanPlayHandler(e: any) {
        if (this.isDisabled) {
            this.unDisableMusicPlayer(false)
        }
    }

    /**
     * Called when there is an error in the Music Kit instance.
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private async mediaPlaybackErrorHandler(event: any) {
        console.log("ERROR OCCURED")
        console.error(`Playback error with Apple Music Kit. ${event}`)
        this.updateMusicPlayerState({ isDisabled: true, error: event })
    }

    /**
     * Called when player is about to change media item. 
     * Used to update the media item locally.
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private async nowPlayingItemWillChangeHandler(event: any) {

        if (!event.item) return
        this.updateMusicPlayerState({ isDisabled: true, isPlaying: true })

        const mediaItem = {
            id: event.item.id,
            name: event.item.attributes.name,
            artist: event.item.attributes.artistName,
            collection: event.item.albumName,
            artworkImgSrc: getArtworkSrc(event.item.attributes.artwork),
            playlistId: event.item._container.id,
            playlistName: event.item._container.attributes.name,
            playlistArtworkSrc: event.item._container.attributes?.artwork ? getArtworkSrc(event.item._container.attributes?.artwork) : ""
        }
        
        this.updateCurrentTrack(mediaItem)
        this.unDisableMusicPlayer()
    }
    
    /**
     * Called everytime playback time changes. 
     * Used to update music data when player is about to naturally end.
     * Calls skip to next track to make needed state changes.
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private async playbackTimeDidChangeHandler(event: any) {
        if (event.currentPlaybackTimeRemaining != 0) return
        this.skipToNextTrack()
    }

    /**
     * Undisabled current music player after a cooldown.
     * Player temorarily disabled after a control is used to avoid spamming.
     */
    private unDisableMusicPlayer(doWait = true) {
        setTimeout(() => {
            this.updateMusicPlayerState({ isDisabled: false, doShowPlayer: true, error: null })
        }, doWait ? this.PLAYER_COOLDOWN_MS : 0)
    }

    /**
     * Load and set from previous music player session.
     */
    loadAndSetPlayerData() {
        const savedData = loadMusicPlayerState()

        this.currentIdx =    savedData!.currentIdx
        this.track =         savedData!.track
        this.collection =    savedData!.collection
        this.error =         savedData!.error
        this.doShowPlayer =  savedData!.doShowPlayer
        this.isPlaying =     savedData!.isPlaying
        this.isDisabled =    savedData!.isDisabled
        this.isRepeating =   savedData!.isRepeating
        this.isShuffled =    savedData!.isShuffled
        this.hasReachedEnd = savedData!.hasReachedEnd

        if (this.isShuffled) {
            const shuffleData = loadMusicShuffleData()
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(shuffleData.trackIndex, shuffleData.songCount, shuffleData)
        }

        this.updateMusicPlayerState({ ...savedData })
    }

    /**
     * Get the updated version of the old state. 
     * This is done to avoid destructuring as methods will not be incorporated.
     * 
     * @param newState  New state changes to be incorporated
     * @param oldState  Current state
     * @returns         New state with the latest incorporated changes.
     */
    getNewStateObj(newState: Partial<AppleMusicPlayer>, oldState: AppleMusicPlayer): AppleMusicPlayer {
        const newStateObj = oldState

        if (newState.currentIdx != undefined)     newStateObj!.currentIdx = newState.currentIdx
        if (newState.track != undefined)          newStateObj!.track = newState.track
        if (newState.collection != undefined)     newStateObj!.collection = newState.collection
        if (newState.error != undefined)          newStateObj!.error = newState.error
        if (newState.doShowPlayer != undefined)   newStateObj!.doShowPlayer = newState.doShowPlayer
        if (newState.isPlaying != undefined)      newStateObj!.isPlaying = newState.isPlaying
        if (newState.isDisabled != undefined)     newStateObj!.isDisabled = newState.isDisabled
        if (newState.isRepeating != undefined)    newStateObj!.isRepeating = newState.isRepeating
        if (newState.isShuffled != undefined)     newStateObj!.isShuffled = newState.isShuffled
        if (newState.hasReachedEnd != undefined)  newStateObj!.hasReachedEnd = newState.hasReachedEnd

        return newStateObj
    }

    deleteMusicPlayerData() {
        if (this.isShuffled) removeMusicShuffleData()
        removeMusicPlayerData()
        musicPlayerStore.set(null)
    }

    /**
     * Save player state to persist state between refreshes.
     */
    saveState() {
        const musicPlayerState = get(musicPlayerStore)!
        saveMusicPlayerData({
            currentIdx: musicPlayerState.currentIdx,
            track: musicPlayerState.track,
            collection: musicPlayerState.collection,
            doShowPlayer: musicPlayerState.doShowPlayer,
            isPlaying: musicPlayerState.isPlaying,
            isDisabled: musicPlayerState.isDisabled,
            isRepeating: musicPlayerState.isRepeating,
            isShuffled: musicPlayerState.isShuffled,
            hasReachedEnd: musicPlayerState.hasReachedEnd
        })
    }

    
}