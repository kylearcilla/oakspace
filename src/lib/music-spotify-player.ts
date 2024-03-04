import { musicDataStore, musicPlayerStore, } from "./store"
import { get } from "svelte/store"

import { initFloatingEmbed } from "./utils-home"
import { MusicPlayer, type MusicPlayerStore } from "./music-player"
import { MusicPlaylistShuffler } from "./music-playlist-shuffler"
import { SPOTIFY_IFRAME_ID, isMediaTypeACollection, loadMusicPlayerData, loadMusicShuffleData, removeMusicPlayerData, removeMusicShuffleData, saveMusicPlayerData } from "./utils-music"

import { APIError } from "./errors"
import { APIErrorCode, MediaEmbedType, MusicMediaType, MusicPlatform } from "./enums"
import { getAlbumItem, getSpotifyMediaUri, getLibAudiobooksItem, getLibPodcastEpisdesItem, getLibTracksItem, getPlaylistItem, getPlaylistDetails, getAlbumDetails } from "./api-spotify"

/**
 * User data class that wraps over the Spotify iFrame API.
 * The player itself is a store object / reactive class, initialized during instantiation.
 * iFrame player only plays individual tracks as there is a cap for playlists and albums.
 * The app hides the embed iFrame and uses its own.
 * 
 * @extends     MusicPlayer
 * @implements  MusicPlayerStore<SpotifyMusicPlayer>
 * 
 */
export class SpotifyMusicPlayer extends MusicPlayer implements MusicPlayerStore<SpotifyMusicPlayer> {
    controller: any
    mediaItem: Track | PodcastEpisode | AudioBook | null = null
    mediaCollection: MediaCollection | null = null
    musicPlaylistShuffler: MusicPlaylistShuffler | null = null

    // media state
    currentIdx = -1
    currentDuration = -1
    currentPosition = -1

    // player state
    isPlaying = false
    isDisabled = false
    isRepeating = false
    isShuffled = false
    isBuffering = false
    isPlayingLive = false
    error: any = null

    hasReachedEnd = false
    hasCollectionJustEnded = false
    hasSeekedTo = -1
    hasItemUpdated = false
    
    doShowPlayer = false
    doIgnoreAutoPlay = false
    doAllowUpdate = true

    naturalEndTimeout: NodeJS.Timer | null = null
    
    PROGRESS_TO_NEX_DELAY = 1000
    PLAYER_OPTIONS = {
        width: '100%', height: '100%',
        uri: ''
    }
 
    constructor() {
        super()
        musicPlayerStore.set(this)
        this.loadAndSetPlayerData()
    }
    
    /**
     * Initialize Spoify iFrame Player API and play clicked or saved media item.
     * Used for the first time or continuing a session.
     * 
     * @param startCollection   Initial media collection. Is null if continuing a session.
     * @param idx               Position of media item clicked by the user. 
     *                          If a collection, this will be 0. If an item, this represetns the idx location of the track.
    */
   async init(context?: MediaClickedContext) {
       try {
            initFloatingEmbed(MediaEmbedType.Spotify)
            this.loadSpotifyiFrameAPI()
            this.doIgnoreAutoPlay = true

            if (context) {
                await this.updateMediaCollection(context)
            }
            
            this.PLAYER_OPTIONS.uri = getSpotifyMediaUri(this.mediaItem!)

            await this.waitForPlayerReadyAndSetPlayerInstance()
            this.loadCurrentItem()

            if (!this.doShowPlayer) this.toggleShow(true)
        }
        catch(error: any) {
            if (this.isDisabled) this.undisablePlayer()
            if (context)  this.quit()  // if init for the first time
            
            throw new APIError(APIErrorCode.PLAYER, "There was an error initializing Spotify player. Try again later.")
        }
    }

    /**
     * Load the Spotify iFrame Player API asynchornously.
     */
    loadSpotifyiFrameAPI() {
        const body = document.getElementsByTagName('body')[0]

        const script = document.getElementsByTagName('script')[0]
        script.src = 'https://open.spotify.com/embed/iframe-api/v1'
        script.async = true
        body.appendChild(script)
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
     * Allow Spotify iFrame API to attach iframe player on designated HTML Element
     * Wait for this and resolve afterwards.
     */
    waitForPlayerReadyAndSetPlayerInstance(): Promise<void> {
        return new Promise<void>((resolve, reject) => (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => {
            try {
                const element = document.getElementById(SPOTIFY_IFRAME_ID);
                IFrameAPI.createController(element, this.PLAYER_OPTIONS, (controller: any) => this.createControllerCallback(controller))
                resolve()
            }
            catch(error: any) {
                reject(error)
            }
        })
    }

    /**
     * Create a controller after initialized to configure the Embed and to control playback.
     * @param controller  Controller object returned by the API after creating the controller.
     */
    createControllerCallback(controller: any) {
        this.controller = controller 
        this.controller.addListener('playback_update', (e: any) => this.onPlaybackUpdate(e.data))
        this.controller.addListener('error', (e: any) => this.onSpotifyiFramePlayerError(e.data))
    }

    /**
     * Update the state of the player using event object returned by the iFrame API.
     * @param data    Event object that contains info about current state of the player.
     */
    onPlaybackUpdate(data: any) {
        if (data.isBuffering) return

        const hasOldPosAfterSeek = Math.abs(data.position - this.hasSeekedTo) > 500
        const hasOldDataAfterSkip = this.hasItemUpdated && (data.position != 0 || data.duration === this.currentDuration)

        // do not register updates if player still shows old data after skip to next / prev
        if (hasOldDataAfterSkip) {
            this.updateMediaTime(0, -1)
        }
        else {
            this.mediaItemHasChanged()
            this.updateMediaTime(data.position, data.duration)

            // after skip, sometimes old-data-after-seek state will remain from prev seek
            if (!hasOldPosAfterSeek) this.hasSeekedTo = -1
        }

        // do not update if player still shows old data after seek
        if (this.hasSeekedTo > 0 && hasOldPosAfterSeek) {
            this.doAllowUpdate = false
            this.updateState({ doAllowUpdate: false})
            return
        }

        this.doAllowUpdate = true
        this.error = null

        // sometimes player will bypass the browser autoplay restriction, so let it go to a playing state to be consistent with UI
        if (this.doIgnoreAutoPlay && this.currentPosition > 0) {
            this.doIgnoreAutoPlay = false
        }
        
        // most times browsers will not allow auto play despite iFrame set to autoplay
        // so do not allow into a playing state
        this.isPlaying = !data.isPaused && !this.doIgnoreAutoPlay

        if (!this.naturalEndTimeout && this.willCurrentMediaEnd(data)) {

            this.naturalEndTimeout = setTimeout(() => {
                this.skipToNextTrack()
                clearTimeout(this.naturalEndTimeout!)

                this.naturalEndTimeout = null
            }, this.PROGRESS_TO_NEX_DELAY)
        }

        this.updateState({ 
            isPlaying: this.isPlaying, doAllowUpdate: this.doAllowUpdate,
            hasSeekedTo: this.hasSeekedTo
        })
    }

    updateMediaTime(pos: number, dur: number) {
        this.currentPosition = pos
        this.currentDuration = dur

        this.updateState({
            currentDuration: dur, currentPosition: pos
        })
    }

    /**
     * @param data Data returned by iFrame API after a state update 
     * @returns    If the current media is about to end based on its duration and current position
     */
    willCurrentMediaEnd(data: any): boolean {
        if (data.duration === 0 || data.position === 0) return false

        const diffMs = data.duration - data.position
        return diffMs === 0
    }

    clearNaturalEndTimeout() {
        if (!this.naturalEndTimeout) return

        clearTimeout(this.naturalEndTimeout)
        this.naturalEndTimeout = null
    }

    /**
     * Called when a new media item will be loaded.
     * Player changes to an "in-between" state that goes back to a playing state after the next media item has been successfully loaded.
     */
    mediaItemWillChange() {
        this.disablePlayer()
        this.updateMediaTime(0, -1)
        
        this.hasItemUpdated = true
        this.updateState({ hasItemUpdated: true })
    }

    /**
     * Called after a media change request was processed successfully and the new item has been successfully loaded by the iFrame Player.
     */
    mediaItemHasChanged() {
        if (!this.hasItemUpdated) return

        this.hasItemUpdated = false
        this.updateState({ hasItemUpdated: false })
    }

    togglePlayback(): void {
        if (this.doIgnoreAutoPlay) {   // if browser blocks autoplay,
            this.controller.play()
            this.doIgnoreAutoPlay = false
        }
        else {
            this.controller.togglePlay()
        }
    }

    async skipToNextTrack() {
        this.clearNaturalEndTimeout()

        try {    
            await this.loadNextMediaItem(true)
        }
        catch(error: any) {
            this.mediaItemHasChanged()
            this.onError(error)
        }
    }

    async skipToPrevTrack() {
        this.clearNaturalEndTimeout()

        try {
            if (this.shouldRestartTrackAfterSkipPrev()) {
                this.controller.playFromStart()
                this.undisablePlayer()
            }
            else {
                await this.loadNextMediaItem(false)
            }
        }
        catch(error: any) {
            this.mediaItemHasChanged()
            this.onError(error)
        }
    }

    /**
     * Seeks to a specific position in the media playback.
     * If the specified position is less than 1 second, the media playback starts from the beginning.
     * @param posSecs - The position to seek to, in seconds.
     */
    seekTo(posSecs: number) {
        this.hasSeekedTo = posSecs * 1000
        if (posSecs === 0) {
            this.controller.playFromStart()
        }
        else {
            this.controller.seek(posSecs)
        }
    }

    toggleRepeat(): void {
        this.isRepeating = !this.isRepeating
        this.updateState({ isRepeating: this.isRepeating })
    }

    toggleShuffle(): void {
        try {
            const media = this.mediaCollection as Playlist | Album
            const currIndex = this.currentIdx
    
            this.isShuffled = !this.isShuffled
            this.hasReachedEnd = false
    

            if (this.isShuffled) {
                this.musicPlaylistShuffler = new MusicPlaylistShuffler(currIndex, media.length)
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
     * Load the next index and corresponding media item based on seeking prev or next.
     * Updates the state and plays the item.
     * 
     * @param isNext   Is seeking for next index.
     */
    async loadNextMediaItem(isNext: boolean): Promise<void> {
        this.mediaItemWillChange()

        let shuffler = this.musicPlaylistShuffler
        let nextIdx = 0
        let doPlay = true

        if (isNext && shuffler) {
             nextIdx = shuffler.getNextIndex(this.isRepeating)
             doPlay = nextIdx >= 0 ? true : false  // has shuffle end
             nextIdx = Math.max(nextIdx, 0)
        }
        else if (isNext) {
            nextIdx = this.getNextIndex()
            doPlay = this.currentIdx === 0 ? this.isRepeating : true
        }
        else if (!isNext && shuffler) {
            nextIdx = shuffler.getPrevIndex(this.isRepeating)
        }
        else {
            nextIdx = this.getPrevIndex()
        }
                
        this.currentIdx = nextIdx
        this.mediaItem = await this.getItemFromIdx(this.mediaCollection!, nextIdx)

        this.loadCurrentItem(doPlay)
        this.updateState({ mediaItem: this.mediaItem, currentIdx: nextIdx })
    }

    /**
     * Get the next collection index and update the current index
     */
    getNextIndex() {
        const hasReachEnd = this.currentIdx + 1 === this.mediaCollection!.length

        if (hasReachEnd) {
            return 0
        }
        else {
            return this.currentIdx + 1
        }
    }

    /**
     * Get the prev playlist index and update the current index
     */
    getPrevIndex() {
        if (this.isRepeating) {
            return this.currentIdx > 0 ? this.currentIdx - 1 : this.mediaCollection!.length - 1
        }
        else {
            return Math.max(0, this.currentIdx - 1)
        }
    }

    /**
     * If track is close from the beginning, then resetart.
     * @returns Should restart current track
     */
    shouldRestartTrackAfterSkipPrev() {
        const trackProgressPerc = (this.currentPosition / this.currentDuration) * 100
        return !this.isRepeating && (this.currentIdx === 0 || trackProgressPerc > 15)   
    }

    /**
     * Load current item in the player
     * Cannot force a pause when loading a new item using Spotify iFrame API.
     * @param doPlay   Play item
     */
    async loadCurrentItem(doPlay = true) {
        const uri = getSpotifyMediaUri(this.mediaItem!)
        this.controller!.loadUri(uri)

        if (this.isDisabled) this.undisablePlayer()

        if (doPlay) {
            this.controller!.play()
        }
        else {
            this.controller!.play()
            // this.controller!.pause() does not work
        }
    }

    /**
     * Initialize new resource for iFrame player to play.
     * Will always be a media collection
     * @param media 
     */
    async updateMediaCollection(context: MediaClickedContext) {
        try {
            if (!this.doShowPlayer) {
                this.toggleShow(true)
            }

            const accessToken = await this.validateAndGetAccessToken()
            const isMediaCollection = isMediaTypeACollection(context.itemClicked.type) 
            const _idx = isMediaCollection ? 0 : context.idx
            const isFromLib = context.collection.fromLib
            const collectionType = context.collection.type
            const mediaItem = await this.getItemFromIdx(context.collection!, _idx)
            
            this.mediaCollection = context.collection!
            
            // make sure hard-coded reccommended media always has updated data
            if (!isFromLib && collectionType === MusicMediaType.Playlist) {
                this.mediaCollection = { 
                        ...context.collection, 
                        ...await getPlaylistDetails(accessToken, context.collection.id),
                        author: context.collection.author,
                        authorUrl: context.collection.authorUrl
                    }
                }
                else if (!isFromLib && collectionType === MusicMediaType.Album) {
                    this.mediaCollection = { 
                        ...context.collection, 
                        ...await getAlbumDetails(accessToken, context.collection.id),
                        author: context.collection.author,
                        authorUrl: context.collection.authorUrl
                }
            }

            this.currentIdx = _idx
            this.mediaItem = mediaItem

            this.updateState({ 
                mediaItem: this.mediaItem, mediaCollection: this.mediaCollection, currentIdx: this.currentIdx 
            })
        }
        catch(error) {
            this.onError(error)
            this.mediaItemHasChanged()

            throw error
        }
    }

    /**
     * Get a playable media item from a collection from index
     * If collection no longer exists request will throw an error.
     * May return an inconsistent item (item that may have not existed at that location)
     * 
     * @param mediaCollection   Item where collection belongs.
     * @param idx               Idx position of desired item.
     * @returns                 Media item stored in that idx.
     */
    async getItemFromIdx(mediaCollection: MediaCollection, idx: number) {
        const accessToken = await this.validateAndGetAccessToken()

        if (mediaCollection.type === MusicMediaType.Playlist) {
            return await getPlaylistItem(accessToken, mediaCollection.id, idx)
        }
        else if (mediaCollection.type === MusicMediaType.SavedTracks) {
            return await getLibTracksItem(accessToken, idx)
        }
        else if (mediaCollection.type === MusicMediaType.Album) {
            return {
                ...await getAlbumItem(accessToken, mediaCollection.id, idx),
                         artworkImgSrc: mediaCollection.artworkImgSrc,
                         album: mediaCollection.name, albumId: mediaCollection.id,
                         genre: mediaCollection.genre
            } as Track
        }
        else if (mediaCollection.type === MusicMediaType.SavedEpisodes) {
            return await getLibPodcastEpisdesItem(accessToken, idx)
        }
        else if (mediaCollection.type === MusicMediaType.SavedAudioBooks) {
            return await getLibAudiobooksItem(accessToken, idx)
        }
        else {
            return null
        }
    }

    /**
     * There must always be an item loaded for the Spotify iFrame Player.
     * So this is not possible without completely quitting. 
     * Will just have to quit player and initialize again.
     */
    removeCurrentCollection() {
        this.quit()
    }

    resetMusicPlayerStateToEmptyState() {
        this.quit()
    }

    quit(): void {
        if (this.controller) {
            this.controller.destroy()
        }
        super.quit()
    }

    toggleShow(doShow: boolean) {
        if (!doShow && this.isPlaying) {
            this.togglePlayback()
        }

        super.toggleShow(doShow)
    }

    /**
     * Call back called by the Spotify iFrame API
     * @param error  error passed in by the Spotify iFrame API
     */
    onSpotifyiFramePlayerError(error: any) {
        console.error(`There was an error with the Spotify iFrame API. Error. Error: ${error}`)
        this.onError(error)
    }

    /**
     * General error handler. Called by other members.
     * @param error  Error 
     */
    onError(error: any) {
        super.onError(error, MusicPlatform.Spotify)
    }

    /**
     * Update the state of store.
     * Saves to local storage to persist necessary data between refreshes.
     * @param newState  New version of current state
     */
    updateState(newState: Partial<SpotifyMusicPlayer>, doSave: boolean = true) {
        musicPlayerStore.update((data: MusicPlayer | null) => { 
            return this.getNewStateObj(newState, data! as SpotifyMusicPlayer)
        })

        if (doSave) this.saveState()
    }

    /**
     * Load and set from previous music player session.
     */
    loadAndSetPlayerData() {
        const savedData = loadMusicPlayerData() as SpotifyMusicPlayer
        if (!savedData) return

        this.mediaItem =        savedData!.mediaItem
        this.mediaCollection =  savedData!.mediaCollection
        this.currentIdx =       savedData!.currentIdx
        this.currentDuration =  savedData!.currentDuration

        this.isRepeating =      savedData!.isRepeating
        this.isShuffled  =      savedData!.isShuffled
        this.doShowPlayer =     savedData!.doShowPlayer
        this.isPlaying =        false

        if (this.isShuffled) {
            const shuffleData = loadMusicShuffleData()
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(shuffleData!.trackIndex, shuffleData!.songCount, shuffleData)
        }

        this.updateState({...savedData }, false)
    }

    /**
     * Saves updated data to persist state between refreshes.
     * Only saves what it needs to.
     */
    saveState() {
        let newData = {} as SpotifyMusicPlayer

        newData.mediaItem =       this.mediaItem
        newData.mediaCollection = this.mediaCollection
        newData.currentIdx =      this.currentIdx
        // newData.currentDuration = this.currentDuration

        newData.isRepeating =     this.isRepeating
        newData.isShuffled =      this.isShuffled

        newData.doShowPlayer =   this.doShowPlayer

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
    getNewStateObj(newState: Partial<SpotifyMusicPlayer>, oldState: SpotifyMusicPlayer): SpotifyMusicPlayer {
        const newStateObj = oldState

        if (newState.mediaItem != undefined)          newStateObj!.mediaItem = newState.mediaItem
        if (newState.mediaCollection != undefined)    newStateObj!.mediaCollection = newState.mediaCollection

        if (newState.currentIdx != undefined)         newStateObj!.currentIdx = newState.currentIdx
        if (newState.currentDuration != undefined)    newStateObj!.currentDuration = newState.currentDuration
        if (newState.currentPosition != undefined)    newStateObj!.currentPosition = newState.currentPosition

        if (newState.isPlaying != undefined)          newStateObj!.isPlaying = newState.isPlaying
        if (newState.isDisabled != undefined)         newStateObj!.isDisabled = newState.isDisabled
        if (newState.isRepeating != undefined)        newStateObj!.isRepeating = newState.isRepeating
        if (newState.isShuffled != undefined)         newStateObj!.isShuffled = newState.isShuffled
        if (newState.isBuffering != undefined)        newStateObj!.isBuffering = newState.isBuffering

        if (newState.error != undefined)              newStateObj!.error = newState.error
        if (newState.doShowPlayer != undefined)       newStateObj!.doShowPlayer = newState.doShowPlayer
        if (newState.doAllowUpdate != undefined)      newStateObj!.doAllowUpdate = newState.doAllowUpdate
        if (newState.hasItemUpdated != undefined)     newStateObj!.hasItemUpdated = newState.hasItemUpdated
        if (newState.hasSeekedTo != undefined)        newStateObj!.hasSeekedTo = newState.hasSeekedTo

        return newStateObj
    }
}