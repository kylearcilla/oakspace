import { get } from "svelte/store"
import { MusicPlayer, type MusicPlayerStore } from "./music-player"
import { musicDataStore, musicPlayerStore, } from "./store"
import { MusicPlaylistShuffler } from "./music-playlist-shuffler"
import { getAppleAlbumDetails, getApplePlaylistDetails, getArtworkSrc, getRadioStationDetails } from "./api-apple-music"
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
    mediaItem: Track | null = null
    mediaCollection: Media | null = null
    isPlayingRadio = false
    isPlaylingLive = false
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
    UNDISABLE_COOLDOWN_AFTER_SKIP_MS = 1000

    undisableTimeout: NodeJS.Timeout | null = null
 
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
                error: null, doShowPlayer: this.mediaItem != null
            })
    
            if (this.mediaCollection) {
                this.queueAndPlayMedia(this.mediaCollection!.id, this.currentIdx, false, false)
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

        this.mediaCollection = null
        this.removeCurrentTrack()
        
        this.updateMusicPlayerState({
            doShowPlayer: false, isPlaying: false, isDisabled: true, isRepeating: false, 
            isShuffled: false, error: null, hasCollectionJustEnded: false, mediaCollection: null
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
                this.queueAndPlayMedia(this.mediaCollection!.id, 0)
                this.updateMediaCollectionIdx(0)
                this.hasReachedEnd = false
                return
            }

            if (this.musicPlayerInstance.isPlaying && this.isPlaylingLive) {
                this.updateMusicPlayerState({ isPlaying: false })
                await this.musicPlayerInstance.stop()      
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
        if (!this.mediaCollection || this.isPlaylingLive) return
        if (this.isShuffled) {
            this.skipToNextRandomTrack()
            return
        }
        
        // here because play & skip prev methods need to see that player reached end state before resetting
        if (this.hasReachedEnd) this.hasReachedEnd = false

        const nextIndex = this.getNextPlaylistIndex()

        if (this.hasReachedEnd) {
            // do not disable as it will not trigger the now-playing event that will undisable player
            this.queueAndPlayMedia(this.mediaCollection!.id, 0, false, false) 
            this.updateMediaCollectionIdx(-1)
        }
        else {
            this.queueAndPlayMedia(this.mediaCollection!.id, nextIndex)
            this.updateMediaCollectionIdx(nextIndex)
        }
    }

    /**
     * Skip to Prev track.
     * If at the start, it will queue up the first again and start it over.
     */
    async skipToPrevTrack() {
        if (!this.mediaCollection || this.isPlaylingLive) return
        this.updateMusicPlayerState({ isDisabled: true })

        if (this.isShuffled) {
            this.skipToPrevRandomTrack()
            return
        }
        const nextIndex = this.getPrevPlaylistIndex()
        this.queueAndPlayMedia(this.mediaCollection!.id, nextIndex)
        this.updateMediaCollectionIdx(nextIndex)
    }

    /**
     * Skips to next track when shuffled
     */
    async skipToNextRandomTrack() {
        const shuffler = this.musicPlaylistShuffler!
        const playlistID = this.mediaCollection!.id

        const nextTrackIndex = shuffler.getNextIndex(this.isRepeating)
        
        if (nextTrackIndex < 0) {
            // do not disable as it will not trigger the now-playing event that will undisable player
            this.queueAndPlayMedia(playlistID, 0, false, false)
        }
        else {
            this.queueAndPlayMedia(playlistID, nextTrackIndex)
        }

        shuffler!.newItemIsPlayingHandler(true, this.isRepeating)
        this.updateMediaCollectionIdx(nextTrackIndex)
    }

    /**
     * Skips to prev track when shuffled
     */
    async skipToPrevRandomTrack() {
        const shuffler = this.musicPlaylistShuffler!
        const playlistID = this.mediaCollection!.id

        const nextTrackIndex = shuffler.getPrevIndex(this.isRepeating)
        this.queueAndPlayMedia(playlistID, nextTrackIndex)

        shuffler!.newItemIsPlayingHandler(false, this.isRepeating)
        this.updateMediaCollectionIdx(nextTrackIndex)
    }

    /**
     * Player will start over after collection is finished.
     * Shuffles a CHUNK_SIZE subset of indices from collection.
     * Will get more if all items have been played.
     */
    toggleShuffle(): void {
        if (!this.mediaCollection) return
        if (!this.mediaCollection || this.isPlayingRadio) return

        const media = this.mediaCollection as Playlist | Album
        const currIndex = this.currentIdx

        this.isShuffled = !this.isShuffled
        this.hasReachedEnd = false

        if (this.isShuffled && currIndex >= MusicPlaylistShuffler.CHUNK_SIZE) {
            // the actual starting idx will be 0
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(-1, media.length)  
            this.musicPlaylistShuffler.indexPointer = -1
        }
        else if (this.isShuffled) {
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(currIndex, media.length)
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
        if (!this.mediaCollection || this.isPlayingRadio) return

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
    async queueAndPlayMedia(id: string, newIndex: number, doPlay: boolean = true, doDisable: boolean = true) {
        try {
            if (this.undisableTimeout) {
                clearTimeout(this.undisableTimeout)
            }

            const isPlaylist = this.mediaCollection!.id.startsWith("pl")

            if (this.isPlayingRadio) {
                await this.musicPlayerInstance.setQueue({ station: id })
            }
            else if (isPlaylist) {
                await this.musicPlayerInstance.setQueue({ playlist: id, startWith: newIndex })
            }
            else {
                await this.musicPlayerInstance.setQueue({ album: id, startWith: newIndex })
            }
    
            this.updateMusicPlayerState({ isPlaying: doPlay, isDisabled: doDisable, doShowPlayer: true })
            if (doPlay) await this.musicPlayerInstance.play() 

            // undisable if nowPlayingItemWillChange method does not execute
            this.undisableTimeout = setTimeout(async () => { 
                this.unDisableMusicPlayer(false)

                if (doPlay) {
                    await this.musicPlayerInstance.play()
                }
            }, this.UNDISABLE_COOLDOWN_AFTER_SKIP_MS)
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
        this.mediaItem = mediaItem
        this.updateMusicPlayerState({ mediaItem })
    }
    
    /**
     * Remove current track from store / local storage.
     */
    removeCurrentTrack(): void {
        this.mediaItem = null
        this.updateMusicPlayerState({ mediaCollection: null })
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
        let media: any = this.mediaCollection
        let isCollection = "length" in this.mediaCollection! ? media.length : -1

        if (isCollection) {
            media as Playlist | Album
        }
        else {
            return -1
        }
        
        this.hasReachedEnd = this.currentIdx + 1 === media.length

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
        let media: any = this.mediaCollection
        let isCollection = "length" in this.mediaCollection! ? media.length : -1

        if (isCollection) {
            media as Playlist | Album
        }
        else {
            return -1
        }

        let prevIdx = 0
        const isAtStart = this.currentIdx === 0

        if (isAtStart && this.isRepeating) return media.length - 1 
        if (isAtStart && !this.isRepeating) return 0

        if (this.hasReachedEnd) {
            prevIdx = media.length - 1
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
    updateMediaCollectionIdx(newIndex: number) {
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
    async updateCurrentMediaAndPlay(newMedia: Media) {
        try {
            this.hasReachedEnd = false
            
            let mediaCollection = newMedia

            const accessToken = get(musicDataStore)!.accessToken
            const isRadio = newMedia.id.startsWith("ra")
            const isPlaylist = newMedia.id.startsWith("pl")

            // fetch for new data
            if (isRadio) {
                mediaCollection = { ...await getRadioStationDetails(newMedia.id, accessToken), author: mediaCollection.author, genre: mediaCollection.genre }
                this.isPlayingRadio = true
                this.isPlaylingLive = (mediaCollection as RadioStation).isLive
            }
            else if (isPlaylist) {
                mediaCollection = { ...mediaCollection, ...await getApplePlaylistDetails(newMedia.id, accessToken) } as Playlist
                this.isPlayingRadio = false
                this.isPlaylingLive = false
            }
            else {
                mediaCollection = { ...mediaCollection, ...await getAppleAlbumDetails(newMedia.id, accessToken) } as Album
                this.isPlayingRadio = false
                this.isPlaylingLive = false
            }
            
            this.mediaCollection = mediaCollection
            this.updateMusicPlayerState({ 
                mediaCollection: this.mediaCollection, hasReachedEnd: false, 
                currentIdx: 0, doShowPlayer: true, isPlayingRadio: this.isPlayingRadio
            })
    
            await this.queueAndPlayMedia(this.mediaCollection!.id, 0)
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
    removeCurrentMedia() {
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

        if (!this.isDisabled) {
            this.updateMusicPlayerState({ isDisabled: true, isPlaying: true })
        }

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

        if (this.undisableTimeout) {
            clearTimeout(this.undisableTimeout)
        }
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
     * Undsiable a disabled player
     * Player is temorarily disabled after a control is used to avoid spamming.
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

        this.currentIdx =      savedData!.currentIdx
        this.mediaItem =       savedData!.mediaItem
        this.mediaCollection = savedData!.mediaCollection
        this.doShowPlayer =    savedData!.doShowPlayer
        this.isPlaying =       savedData!.isPlaying
        this.isDisabled =      savedData!.isDisabled
        this.isRepeating =     savedData!.isRepeating
        this.isShuffled =      savedData!.isShuffled
        this.hasReachedEnd =   savedData!.hasReachedEnd
        this.isPlayingRadio =  !("length" in this.mediaCollection!)

        if (this.isShuffled) {
            const shuffleData = loadMusicShuffleData()
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(shuffleData.trackIndex, shuffleData.songCount, shuffleData)
        }

        this.updateMusicPlayerState({ ...savedData, isPlayingRadio: this.isPlayingRadio })
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

        if (newState.currentIdx != undefined)         newStateObj!.currentIdx = newState.currentIdx
        if (newState.mediaItem != undefined)          newStateObj!.mediaItem = newState.mediaItem
        if (newState.mediaCollection != undefined)    newStateObj!.mediaCollection = newState.mediaCollection
        if (newState.error != undefined)              newStateObj!.error = newState.error
        if (newState.doShowPlayer != undefined)       newStateObj!.doShowPlayer = newState.doShowPlayer
        if (newState.isPlaying != undefined)          newStateObj!.isPlaying = newState.isPlaying
        if (newState.isDisabled != undefined)         newStateObj!.isDisabled = newState.isDisabled
        if (newState.isRepeating != undefined)        newStateObj!.isRepeating = newState.isRepeating
        if (newState.isShuffled != undefined)         newStateObj!.isShuffled = newState.isShuffled
        if (newState.hasReachedEnd != undefined)      newStateObj!.hasReachedEnd = newState.hasReachedEnd
        if (newState.isPlayingRadio != undefined)      newStateObj!.isPlayingRadio = newState.isPlayingRadio

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
            mediaItem: musicPlayerState.mediaItem,
            mediaCollection: musicPlayerState.mediaCollection,
            doShowPlayer: musicPlayerState.doShowPlayer,
            isPlaying: musicPlayerState.isPlaying,
            isDisabled: musicPlayerState.isDisabled,
            isRepeating: musicPlayerState.isRepeating,
            isShuffled: musicPlayerState.isShuffled,
            hasReachedEnd: musicPlayerState.hasReachedEnd
        })
    }

    
}