import { get } from "svelte/store"
import { MusicPlayer, type MusicPlayerStore } from "./music-player"
import { musicDataStore, musicPlayerStore, } from "./store"
import { MusicPlaylistShuffler } from "./music-playlist-shuffler"
import { getAppleAlbumDetails, getApplePlaylistDetails, getArtistDeteails, getArtistTopSongs, getArtworkSrc, getLibTrackItem, getRadioStationDetails } from "./api-apple-music"
import { APIError, PlayerError } from "./errors"

import { 
    loadMusicPlayerData, loadMusicShuffleData, 
    removeMusicPlayerData, removeMusicShuffleData, saveMusicPlayerData 
} from "./utils-music"
import { APIErrorCode, MusicMediaType, MusicPlatform } from "./enums"
import type { AppleMusicUserData } from "./music-apple-user-data"

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
    mediaItem:  Track | PodcastEpisode | AudioBook | null = null
    mediaCollection: MediaCollection | null = null
    
    // media state
    currentIdx = 0
    currentPosition = -1
    currentDuration = -1
    
    // player state
    isPlaying = false
    isDisabled = true
    isRepeating = false
    isShuffled = false
    isBuffering = false
    error: any = null
    
    lastCollectionIdx = 0
    isPlayingRadio = false
    isPlayingLive = false
    
    hasReachedEnd = false
    hasCollectionJustEnded = false
    hasItemUpdated = false
    doAllowUpdate = true
    hasSeekedTo = -1
    
    doShowPlayer = false
    hasFinishedPlaylist = false

    // Apple Musc Kit States
    PLAYING_STATE = 2
    PAUSED_STATE = 3
    COLLECTION_JUST_ENDED_STATE = 10
    PLAYER_COOLDOWN_MS = 500
    UNDISABLE_COOLDOWN_AFTER_SKIP_MS = 1000

    undisableTimeout: NodeJS.Timeout | null = null
 
    constructor() {
        super()
        musicPlayerStore.set(this)
        this.loadAndSetPlayerData()
    }

    /**
     * Initialize music player state from previously saved state or start over.
     * Start where user left off previously. Attach Event Listeners to Music Kit Instance.
     * 
     * @throws  {Error}    Error initializing Music Kit API.
     */
    async initAppleMusicPlayer() {
        try {
            console.log("INIT MUSIC PLAYER")
            // @ts-ignore
            this.musicPlayerInstance = await MusicKit.getInstance()
    
            this.attachEventHandlers()

            if (this.mediaCollection) {
                await this.loadCurrentItem(false)
            }
        }
        catch(e: any) {
            console.error(`Error initializing Apple Music Kit. Error: ${e}`)
            this.deleteMusicPlayerData()
            throw new APIError(APIErrorCode.PLAYER, "There was an error initializing Apple Music player. Try again later.")
        }
    }

    /**
     * Verify the access token has not expired. If so request for a new one and return.
     * @returns   Fresh access token
     */
    async validateAndGetAccessToken(): Promise<string> {
        await get(musicDataStore)!.verifyAccessToken()
        return get(musicDataStore)!.accessToken
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
        this.musicPlayerInstance.addEventListener("playbackStateDidChange", (e: any) => this.onPlaybackUpdate(e))
    }

    onPlaybackUpdate(e: any) {
        const isPlaying = this.musicPlayerInstance.isPlaying
        this.isPlaying = isPlaying
        this.updateState({ isPlaying: isPlaying })
    }

    /**
     * Update the current state of music player. 
     * Save the data to local storage.
     * Object destructuring is avoided as it fails to include inherited types from abstract class.
     * 
     * @param newMusicPlayerState   New state
     */
    updateState(newPlayerState: Partial<AppleMusicPlayer>) {
        musicPlayerStore.update((player: MusicPlayer | null) => {
            return this.getNewStateObj(newPlayerState, player! as AppleMusicPlayer)
        })

        this.saveState()
    }

    /**
     * Called when a new media item will be loaded.
     * Player changes to an "in-between" state that goes back to a playing state after the next media item has been successfully loaded.
     */
    mediaItemWillChange() {
        this.disablePlayer()
        // this.updateMediaTime(0, -1)
        
        this.hasItemUpdated = true
        this.updateState({ hasItemUpdated: true })
    }

    /**
     * Called after a media change request was processed successfully and the new item has been successfully loaded by the iFrame Player.
     */
    mediaItemHasChanged() {
        this.hasItemUpdated = false
        this.isDisabled = false
        this.updateState({ hasItemUpdated: false, isDisabled: false })
    }

    /**
     * Plays / pauses player.
     * @throws  {Player Error}    Error working with Music Kit API.
     */
    async togglePlayback() {
        try {
            if (this.hasReachedEnd) {
                this.loadCurrentItem(false)
                this.updateMediaCollectionIdx(0)
                this.hasReachedEnd = false
                return
            }

            // isPlaying state from instance is not always accurate
            if (this.musicPlayerInstance.isPlaying && this.isPlayingLive) {
                await this.musicPlayerInstance.stop()      
            }
            else if (this.musicPlayerInstance.isPlaying) {
                await this.musicPlayerInstance.pause()      
            }
            else {
                await this.musicPlayerInstance.play()
            }
            
            this.undisablePLayer()
        }
        catch(e: any) {
            console.error(`Error using Apple Music Kit (playback). Error: ${e}`)
            this.updateState({ error: new PlayerError("Error occured. Refresh the page or play a different item. ")})
            throw e
        }
    }

    /**
     * Skip to Next track.
     * If album / collection has just ended, it will prep the player to play the 0th index.
     */
    async skipToNextTrack() {
        try {
            await this.loadNextMediaItem(true)
        }
        catch(error: any) {
            this.mediaItemHasChanged()
            this.onError(error)
        }
    }

    /**
     * Skip to Prev track.
     * If at the start, it will queue up the first again and start it over.
     */
    async skipToPrevTrack() {
        try {
            const doSkipNext = this.currentIdx === 0 && !this.isPlaying
            if (doSkipNext) return

            await this.loadNextMediaItem(false)
        }
        catch(error: any) {
            this.mediaItemHasChanged()
            this.onError(error)
        }
    }

    /**
     * Player will start over after collection is finished.
     * Shuffles a CHUNK_SIZE subset of indices from collection.
     * Will get more if all items have been played.
     */
    toggleShuffle(): void {
        try {
            if (this.isPlayingRadio) return

            const currIndex = this.currentIdx
            const length = this.getCurrCollectionLength()
    
            this.isShuffled = !this.isShuffled
            this.hasReachedEnd = false

            if (this.isShuffled) {
                this.musicPlaylistShuffler = new MusicPlaylistShuffler(currIndex, length)
            }
            else {
                this.musicPlaylistShuffler!.quit()
                this.musicPlaylistShuffler = null
            }
    
            this.updateState({ isShuffled: this.isShuffled })
        }
        catch (error: any) {
            console.error("There was an error toggling shuffle.")
            this.onError(error)
        }
    }

    /**
     * Toggle repeat for player. 
     */
    toggleRepeat(): void {
        if (this.isPlayingRadio) return

        this.isRepeating = !this.isRepeating
        this.updateState({ isDisabled: true, isRepeating: this.isRepeating })

        this.undisablePLayer()
    }

    /**
     * Load the next index and corresponding media item based on seeking prev or next.
     * Updates the state and plays the item.
     * @param isNext   Is seeking for next index.
     */
    async loadNextMediaItem(isNext: boolean): Promise<void> {
        this.mediaItemWillChange()

        let shuffler = this.musicPlaylistShuffler
        let nextIdx = 0
        let doPlay = true

        if (isNext && shuffler) {
             nextIdx = shuffler.getNextIndex(this.isRepeating)
             doPlay = shuffler.indexPointer === 0 ? this.isRepeating : true
             nextIdx = Math.max(nextIdx, 0)
        }
        else if (isNext) {
            nextIdx = this.getNextIndex()
            doPlay = nextIdx === 0 ? this.isRepeating : true
        }
        else if (!isNext && shuffler) {
            nextIdx = shuffler.getPrevIndex(this.isRepeating)
        }
        else {
            nextIdx = this.getPrevIndex()
        }
                
        this.currentIdx = nextIdx

        if (this.mediaCollection!.type === MusicMediaType.SavedTracks) {
            this.mediaItem = await this.getItemFromIdx(this.mediaCollection!, nextIdx) as Track
        }

        // TODO: media item will be update do now playing item will change handler

        this.loadCurrentItem(doPlay)
        this.updateState({ mediaItem: this.mediaItem, currentIdx: nextIdx })
    }

    hasQueuedAnItem() {
        return [ MusicMediaType.SavedTracks ].includes(this.mediaCollection!.type)
    }

    getCurrCollectionLength() {
        return this.hasQueuedAnItem() ? this.mediaCollection!.length : this.musicPlayerInstance.queue._queueItems.length
    }

    /**
     */
    getNextIndex(): number {
        const hasReachEnd = this.currentIdx + 1 === this.getCurrCollectionLength()

        if (hasReachEnd) {
            return 0
        }
        else {
            return this.currentIdx + 1
        }
    }
    
    /**
     */
    getPrevIndex(): number {
        if (this.isRepeating) {
            return this.currentIdx > 0 ? this.currentIdx - 1 : this.getCurrCollectionLength() - 1
        }
        else {
            return Math.max(0, this.currentIdx - 1)
        }
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
    async loadCurrentItem(doPlay: boolean = true) {
        try {            
            this.mediaItemWillChange()

            const type = this.mediaCollection!.type
            const collectionId = this.mediaCollection?.id ?? ""

            console.log("loadCurrentItem", this.mediaCollection)
            
            if (type === MusicMediaType.RadioStation) {
                await this.musicPlayerInstance.setQueue({ station: collectionId })
            }
            else if (type === MusicMediaType.Playlist) {
                await this.musicPlayerInstance.setQueue({ playlist: collectionId, startWith: this.currentIdx })
            }
            else if (type === MusicMediaType.Album) {
                await this.musicPlayerInstance.setQueue({ album: collectionId, startWith: this.currentIdx })
            }
            else {
                // for an individual track
                const itemId = this.mediaItem!.id
                await this.musicPlayerInstance.setQueue({ song: itemId })  // for saved tracks and artists' top songs
            }

            if (doPlay) { 
                await this.musicPlayerInstance.play() 
            }

        }
        catch(error: any) {
            console.error(`Apple Music Kit error with qeueue. Error: ${error}`)
            
            const errorStr = error.toString().split(":")[0].trim()
            if (errorStr === "CONTENT_UNAVAILABLE") {
                this.onError(new APIError(APIErrorCode.PLAYER, "This collection is empty."))
            }
            else {
                this.onError(new APIError(APIErrorCode.PLAYER, "Player error. Refresh the page or play a different item."))
            }
        }
        finally {
            this.mediaItemHasChanged()
        }
    }

    seekTo(time: number): void {

    }

    /**
     * Update current playing collection. 
     * Media item will not be updated as it's gather from the object the API returns from an updated when the collection has been loeaded.
     * @param context 
     */
    async updateMediaCollection(context: MediaClickedContext) {
        try {
            this.mediaItemWillChange()

            const collection = context.collection
            const collectionType = collection.type
            const hasClickedLibTrack = collection.type === MusicMediaType.SavedTracks
            const isFromLib = context.collection.fromLib

            const _idx = hasClickedLibTrack ? context.idx : 0
            const accessToken = await this.validateAndGetAccessToken()
        

            let _mediaCollection

            // fetching here to get data that was not hardcoded in
            // TODO see if this can be done by getting the media returned by the willItemChange event (not lib since they always contain updated stuff)
            if (!isFromLib && collectionType === MusicMediaType.RadioStation) {
                _mediaCollection = { ...context.collection, ...await getRadioStationDetails(collection.id, accessToken), author: collection.author, genre: collection.genre }
                this.isPlayingRadio = true
                this.isPlayingLive = (_mediaCollection as RadioStation).isLive
            }
            else if (!isFromLib && collectionType === MusicMediaType.Playlist) {
                _mediaCollection = { ...context.collection, ...await getApplePlaylistDetails(collection.id, accessToken) } as Playlist
                this.isPlayingRadio = false
                this.isPlayingLive = false
            }
            else if (!isFromLib && collectionType === MusicMediaType.Album) {
                _mediaCollection = { ...context.collection, ...await getAppleAlbumDetails(collection.id, accessToken) } as Album
                this.isPlayingRadio = false
                this.isPlayingLive = false
            }
            else {
                _mediaCollection = context.collection
            }

            console.log("updateMediaCollection")
            this.mediaCollection = _mediaCollection
            this.currentIdx = _idx

            if (collectionType === MusicMediaType.SavedTracks) {
                this.mediaItem = context.itemClicked as Track
            }

            console.log("mediaCollection", this.mediaCollection)
            console.log("mediaItem", this.mediaItem)
            console.log("currentIdx", this.currentIdx)

            this.updateState({ 
                mediaCollection: this.mediaCollection,
                currentIdx: this.currentIdx, isPlayingLive: this.isPlayingLive
            })
        }
        catch(error) {
            this.onError(error)
            this.mediaItemHasChanged()

            throw error
        }
    }


    /**
     * Used when we want to play individual songs as opposesd to loading a collection in aplaylist
     * @param mediaCollection 
     * @param idx              Idx position of desired item.
     * @returns                Media item stored in that idx.
     */
    async getItemFromIdx(mediaCollection: MediaCollection, idx: number) {
        const accessToken = await this.validateAndGetAccessToken()
        const musicStore = get(musicDataStore) as AppleMusicUserData
        const userToken = musicStore.userToken

        let creds = { accessToken, userToken }

        if (mediaCollection.type === MusicMediaType.SavedTracks) {
            return await getLibTrackItem(idx, creds)
        }
        else {
            return null
        }
    }



    async getArtistInfo(artistId: string) {
        const accessToken = await this.validateAndGetAccessToken()
        const musicStore = get(musicDataStore) as AppleMusicUserData
        const userToken = musicStore.userToken

        let creds = { accessToken, userToken }

        return await getArtistDeteails(artistId, creds)
    }

    updateMediaCollectionIdx(idx: number) {
        this.currentIdx = idx
        this.updateState({ currentIdx: this.currentIdx })
    }

    toggleShow(doShow: boolean): void {
        if (!doShow && this.isPlaying) {
            this.togglePlayback()
        }

        this.doShowPlayer = doShow
        this.updateState({ doShowPlayer: doShow })

    }

    /**
     * Update current track state & save in local storage.
     * @param mediaItem  Current track playing from collection.
     */
    updateCurrentMediaItem(mediaItem: Track): void {
        console.log(mediaItem)
        this.mediaItem = mediaItem
        this.updateState({ mediaItem })
    }

    /**
     * Called when player is no longer in use. 
     */
    quit() {
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
        this.mediaItem = null
        
        this.updateState({
            doShowPlayer: false, isPlaying: false, isDisabled: true, isRepeating: false, 
            isShuffled: false, error: null, hasCollectionJustEnded: false, mediaCollection: null, mediaItem: null 
        })
    }

    removeCurrentCollection(): void {
        this.resetMusicPlayerStateToEmptyState()
    }

    /**
     * Called when the player is availabled to be played
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private async mediaCanPlayHandler(e: any) {
        if (this.isDisabled) {
            this.undisablePLayer(false)
        }
    }

    /**
     * Called when there is an error in the Music Kit instance.
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private async mediaPlaybackErrorHandler(event: any) {
        console.log("ERROR OCCURED")
        console.error(`Playback error with Apple Music Kit. ${event}`)
        this.updateState({ isDisabled: true, error: event })
    }

    /**
     * General error handler. Called by other members.
     * @param error  Error 
     */
    onError(error: any) {
        super.onError(error, MusicPlatform.AppleMusic)
    }

    /**
     * Called when player is about to change media item. 
     * Used to update the media item locally.
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private async nowPlayingItemWillChangeHandler(event: any) {
        if (!event.item) return

        if (!this.isDisabled) {
            this.updateState({ isDisabled: true, isPlaying: true })
        }


        console.log("nowPlayingItemWillChangeHandler", event)

        const mediaItem = {
            id: event.item.id,
            name: event.item.attributes.name,
            author: event.item.attributes.artistName,
            collection: event.item.albumName,
            artworkImgSrc: getArtworkSrc(event.item.attributes.artwork),
            playlistId: event.item._container.id,
            playlistName: event.item._container.attributes?.name,
            playlistArtworkSrc: event.item._container.attributes?.artwork ? getArtworkSrc(event.item._container.attributes?.artwork) : "",
            duration: 0, album: "", albumId: "", authorUrl: "", genre: "", url: "", type: "", fromLib: false
        }
        
        this.updateCurrentMediaItem(mediaItem)
        this.undisablePLayer()

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

    disablePlayer() {
        this.isDisabled = true
        this.updateState({ isDisabled: true })
    }

    /**
     * Undsiable a disabled player
     * Player is temorarily disabled after a control is used to avoid spamming.
     */
    private undisablePLayer(doWait = true) {
        setTimeout(() => {
            this.updateState({ isDisabled: false, doShowPlayer: true, error: null })
        }, doWait ? this.PLAYER_COOLDOWN_MS : 0)
    }

    /**
     * Load and set from previous music player session.
     */
    loadAndSetPlayerData() {
        const savedData = loadMusicPlayerData() as AppleMusicPlayer

        this.mediaItem =       savedData!.mediaItem
        this.mediaCollection = savedData!.mediaCollection
        this.currentIdx =      savedData!.currentIdx

        this.isRepeating =     savedData!.isRepeating
        this.isShuffled =      savedData!.isShuffled
        this.doShowPlayer =    savedData!.doShowPlayer
        this.isPlayingLive =   savedData!.isPlayingLive

        if (this.isShuffled) {
            const shuffleData = loadMusicShuffleData()
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(shuffleData.trackIndex, shuffleData.songCount, shuffleData)
        }

        this.updateState({ ...savedData, isPlayingRadio: this.isPlayingRadio })
    }

    /**
     * Save player state to persist state between refreshes.
     */
    saveState() {
        let newData = {} as AppleMusicPlayer
        newData.mediaItem =       this.mediaItem
        newData.mediaCollection = this.mediaCollection
        newData.currentIdx =      this.currentIdx

        newData.isRepeating =     this.isRepeating
        newData.isShuffled =      this.isShuffled

        newData.doShowPlayer =   this.doShowPlayer
        newData.isPlayingLive =  this.isPlayingLive

        saveMusicPlayerData(newData)
    }

    deleteMusicPlayerData() {
        if (this.isShuffled) { 
            removeMusicShuffleData()
        }
        removeMusicPlayerData()
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

        if (newState.mediaItem != undefined)          newStateObj!.mediaItem = newState.mediaItem
        if (newState.mediaCollection != undefined)    newStateObj!.mediaCollection = newState.mediaCollection

        if (newState.currentIdx != undefined)         newStateObj!.currentIdx = newState.currentIdx
        // if (newState.currentDuration != undefined)    newStateObj!.currentDuration = newState.currentDuration
        // if (newState.currentPosition != undefined)    newStateObj!.currentPosition = newState.currentPosition

        if (newState.isPlaying != undefined)          newStateObj!.isPlaying = newState.isPlaying
        if (newState.isDisabled != undefined)         newStateObj!.isDisabled = newState.isDisabled
        if (newState.isRepeating != undefined)        newStateObj!.isRepeating = newState.isRepeating
        if (newState.isShuffled != undefined)         newStateObj!.isShuffled = newState.isShuffled
        if (newState.isBuffering != undefined)        newStateObj!.isBuffering = newState.isBuffering
        if (newState.isPlayingLive != undefined)     newStateObj!.isPlayingLive = newState.isPlayingLive
        
        if (newState.isPlaying != undefined)          newStateObj!.isPlaying = newState.isPlaying
        if (newState.isDisabled != undefined)         newStateObj!.isDisabled = newState.isDisabled
        if (newState.isRepeating != undefined)        newStateObj!.isRepeating = newState.isRepeating
        if (newState.isShuffled != undefined)         newStateObj!.isShuffled = newState.isShuffled
        if (newState.hasReachedEnd != undefined)      newStateObj!.hasReachedEnd = newState.hasReachedEnd
        if (newState.doShowPlayer != undefined)       newStateObj!.doShowPlayer = newState.doShowPlayer
        if (newState.error != undefined)              newStateObj!.error = newState.error

        return newStateObj
    }  
}