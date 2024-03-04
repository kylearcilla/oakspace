import { get } from "svelte/store"
import { MusicPlayer, type MusicPlayerStore } from "./music-player"
import { musicDataStore, musicPlayerStore, } from "./store"
import { MusicPlaylistShuffler } from "./music-playlist-shuffler"
import { getAppleAlbumDetails, getApplePlaylistDetails, getArtworkSrc, getLibTrackItem, getRadioStationDetails, throwMusicKitError } from "./api-apple-music"
import { APIError } from "./errors"

import { loadMusicPlayerData, loadMusicShuffleData, removeMusicShuffleData, saveMusicPlayerData } from "./utils-music"
import { APIErrorCode, MusicMediaType, MusicPlatform } from "./enums"

/**
 * A class representing an Apple Music player instance that extends MusicPlayer. 
 * The player itself is a svelte store object / reactive class, initialized during instantiation.
 * Errors are handled via an event listener in the music player.
 * Plays collections except for user's library tracks. Collection have a 100 Cap
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
    
    hasItemUpdated = false
    doAllowUpdate = true
    hasSeekedTo = -1
    
    doShowPlayer = false
    hasFinishedPlaylist = false
 
    constructor() {
        super()
        musicPlayerStore.set(this)
        this.loadAndSetPlayerData()
    }

    /**
     * Initialize music player state from previously saved state or start over.
     * Start where user left off previously. Attach Event Listeners to Music Kit Instance.
     * 
     */
    async init() {
        try {
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
        this.musicPlayerInstance.addEventListener("playbackStateDidChange", () => this.onPlaybackUpdate())
    }

    onPlaybackUpdate() {
        if (!this.musicPlayerInstance) return

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
    }

    /**
     * Called after a media change request was processed successfully and the new item has been successfully loaded by the iFrame Player.
     */
    mediaItemHasChanged() {
        this.undisablePlayer()
    }

    /**
     * Plays / pauses player.
     * @throws  {Player Error}    Error working with Music Kit API.
     */
    async togglePlayback() {
        try {
            // pause does not work on live radio stations
            if (this.musicPlayerInstance.isPlaying && this.isPlayingLive) {
                await this.musicPlayerInstance.stop()
            }
            else if (this.musicPlayerInstance.isPlaying) {
                this.musicPlayerInstance.pause()      
            }
            else {
                await this.musicPlayerInstance.play()
            }
        }
        catch(error: any) {
            console.error(`Apple Music Kit error with toggling playback. Error: ${error}`)
            this.onError(throwMusicKitError(error))
        }
    }

    /**
     * Skip to Next track.
     * If album / collection has just ended, it will prep the player to play the 0th index.
     */
    async skipToNextTrack() {
        if (this.isPlayingLive) return

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
        if (this.isPlayingLive) return

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
            if (this.isPlayingLive) return

            const length = this.getCurrCollectionLength()    
            this.isShuffled = !this.isShuffled

            if (this.isShuffled) {
                this.musicPlaylistShuffler = new MusicPlaylistShuffler(this.currentIdx, length)
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
        if (this.isPlayingLive) return

        this.isRepeating = !this.isRepeating
        this.updateState({ isRepeating: this.isRepeating })
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
            this.mediaItem = await this.getLibTrackItemFromIdx(this.mediaCollection!, nextIdx) as Track
        }

        this.loadCurrentItem(doPlay)
        this.updateState({ mediaItem: this.mediaItem, currentIdx: nextIdx })
    }

    /**
     * 
     * @returns See if the MuscKit playing a single song and not a collection (album, playlist, radio station)
     */
    hasQueuedAnItem() {
        return [ MusicMediaType.SavedTracks ].includes(this.mediaCollection!.type)
    }

    /**
     * For playing collections, there is a 100-item cap for the player.
     * When playing user lib saved tracks, there will be no cap since each item is palyed individually.
     * 
     * @returns Length of current media.
     */
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
            const type = this.mediaCollection!.type
            const collectionId = this.mediaCollection?.id ?? ""
            
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
            this.onError(throwMusicKitError(error))
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
            if (!this.doShowPlayer) {
                this.toggleShow(true)
            }

            const collection = context.collection
            const collectionType = collection.type
            const hasClickedLibTrack = collection.type === MusicMediaType.SavedTracks
            const isFromLib = context.collection.fromLib

            const _idx = hasClickedLibTrack ? context.idx : 0
            await this.validateAndGetAccessToken()

            let _mediaCollection

            // to update hardcoded playlist data, lib media is always updated for the consistency check
            
            if (!isFromLib && collectionType === MusicMediaType.RadioStation) {
                _mediaCollection = { ...context.collection, ...await getRadioStationDetails(collection.id), author: collection.author, genre: collection.genre }
                this.isPlayingRadio = true
                this.isPlayingLive = (_mediaCollection as RadioStation).isLive
            }
            else if (!isFromLib && collectionType === MusicMediaType.Playlist) {
                _mediaCollection = { ...context.collection, ...await getApplePlaylistDetails(collection.id) } as Playlist
            }
            else if (!isFromLib && collectionType === MusicMediaType.Album) {
                _mediaCollection = { ...context.collection, ...await getAppleAlbumDetails(collection.id) } as Album
            }
            else {
                _mediaCollection = context.collection
            }

            if (collectionType != MusicMediaType.RadioStation) {
                this.isPlayingRadio = false
                this.isPlayingLive = false
            }

            this.mediaCollection = _mediaCollection
            this.currentIdx = _idx

            // Player can only play up to 100 items at a time.
            if (collectionType != MusicMediaType.SavedTracks) {
                this.mediaCollection.length = Math.min(this.mediaCollection.length, 100)
            }

            if (collectionType === MusicMediaType.SavedTracks) {
                this.mediaItem = context.itemClicked as Track
            }

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
    async getLibTrackItemFromIdx(mediaCollection: MediaCollection, idx: number) {
        if (mediaCollection.type === MusicMediaType.SavedTracks) {
            return await getLibTrackItem(idx)
        }
        else {
            return null
        }
    }

    toggleShow(doShow: boolean): void {
        if (!doShow && this.isPlaying) {
            this.togglePlayback()
        }
        super.toggleShow(doShow)
    }

    /**
     * Update current track state & save in local storage.
     * @param mediaItem  Current track playing from collection.
     */
    updateCurrentMediaItem(mediaItem: Track): void {
        this.mediaItem = mediaItem
        this.updateState({ mediaItem })
    }

    /**
     * Resets to empty state.
     * Called when there is no playlist or quitting plater.
     */
    async resetMusicPlayerStateToEmptyState() {
        try {
            await this.musicPlayerInstance.stop()

            this.mediaCollection = null
            this.mediaItem = null

            this.isPlaying = false
            this.isRepeating = false
            this.isShuffled = false
            this.doShowPlayer = false
            
            this.musicPlaylistShuffler = null
            removeMusicShuffleData()
            
            this.updateState({
                isPlaying: false, isRepeating: false, isShuffled: false, doShowPlayer: false, mediaCollection: null, mediaItem: null
            })
        }
        catch(error: any) {
            console.error(`Apple Music Kit error with stopping player. Error: ${error}`)
            this.onError(throwMusicKitError(error))
        }
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
            this.undisablePlayer()
        }
    }

    /**
     * Called when there is an error in the Music Kit instance.
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private async mediaPlaybackErrorHandler(event: any) {
        console.error(`Playback error with Apple Music Kit. ${event}`)
        this.onError(new APIError(APIErrorCode.PLAYER))

        // this.updateState({ isDisabled: true, error: event })
    }

    /**
     * Called when player is about to change media item. 
     * Used to update the media item locally.
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private async nowPlayingItemWillChangeHandler(event: any) {
        if (!event.item) return
        const item = event.item
        const attrs = item.attributes

        const mediaItem = {
            id: item.id,
            name: attrs.name,
            author: attrs.artistName,
            collection: item.albumName,
            artworkImgSrc: getArtworkSrc(attrs.artwork),
            playlistId: item._container.id,
            playlistName: item._container.attributes?.name,
            playlistArtworkSrc: item._container.attributes?.artwork ? getArtworkSrc(item._container.attributes?.artwork) : "",
            duration: attrs.durationInMillis, 
            album: attrs.albumName ?? "", albumId: "", authorUrl: "", url: "", 
            genre: attrs.genreNames != undefined ? attrs.genreNames[0] : "",
            type: MusicMediaType.Track, fromLib: this.mediaCollection!.fromLib
        }

        // lib playlists do not contain info data from req
        if (this.mediaCollection!.length < 0) {
            this.mediaCollection!.length = this.musicPlayerInstance?.queue?._queueItems?.length ?? -1
            this.updateState({  mediaCollection: this.mediaCollection })
        }
        if (!this.mediaCollection!.artworkImgSrc) {    
            this.mediaCollection!.artworkImgSrc = mediaItem.artworkImgSrc
            this.updateState({  mediaCollection: this.mediaCollection })
        }
        
        this.updateCurrentMediaItem(mediaItem)
        this.mediaItemHasChanged()
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

    async quit() {
        await this.musicPlayerInstance.stop()
        super.quit()
    }

    /**
     * General error handler.
     * @param error  Error 
     */
    onError(error: any) {
        super.onError(error, MusicPlatform.AppleMusic)
    }

    /**
     * Load and set from previous music player session.
     */
    loadAndSetPlayerData() {
        const savedData = loadMusicPlayerData() as AppleMusicPlayer
        if (!savedData) return

        this.mediaItem =       savedData!.mediaItem
        this.mediaCollection = savedData!.mediaCollection
        this.currentIdx =      savedData!.currentIdx

        this.isRepeating =     savedData!.isRepeating
        this.isShuffled =      savedData!.isShuffled
        this.doShowPlayer =    savedData!.doShowPlayer
        this.isPlayingLive =   savedData!.isPlayingLive

        if (this.isShuffled) {
            const shuffleData = loadMusicShuffleData()
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(shuffleData!.trackIndex, shuffleData!.songCount, shuffleData)
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

        if (newState.mediaItem != undefined)       newStateObj!.mediaItem = newState.mediaItem
        if (newState.mediaCollection != undefined) newStateObj!.mediaCollection = newState.mediaCollection

        if (newState.currentIdx != undefined)      newStateObj!.currentIdx = newState.currentIdx

        if (newState.isPlaying != undefined)       newStateObj!.isPlaying = newState.isPlaying
        if (newState.isDisabled != undefined)      newStateObj!.isDisabled = newState.isDisabled
        if (newState.isRepeating != undefined)     newStateObj!.isRepeating = newState.isRepeating
        if (newState.isShuffled != undefined)      newStateObj!.isShuffled = newState.isShuffled
        if (newState.isBuffering != undefined)     newStateObj!.isBuffering = newState.isBuffering
        if (newState.isPlayingLive != undefined)   newStateObj!.isPlayingLive = newState.isPlayingLive
        
        if (newState.isPlaying != undefined)       newStateObj!.isPlaying = newState.isPlaying
        if (newState.isDisabled != undefined)      newStateObj!.isDisabled = newState.isDisabled
        if (newState.isRepeating != undefined)     newStateObj!.isRepeating = newState.isRepeating
        if (newState.isShuffled != undefined)      newStateObj!.isShuffled = newState.isShuffled
        if (newState.doShowPlayer != undefined)    newStateObj!.doShowPlayer = newState.doShowPlayer
        if (newState.error != undefined)           newStateObj!.error = newState.error

        return newStateObj
    }  
}