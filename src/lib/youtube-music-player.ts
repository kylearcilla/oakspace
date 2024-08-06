import { musicPlayerStore } from "./store"
import { APIError } from "./errors"
import { getVidDetails, getYtIframeAPIError } from "./api-youtube"
import { setYoutubeScript } from "./utils-youtube"
import { APIErrorCode, MusicMediaType } from "./enums"
import { youtubeAPIErrorHandler } from "./utils-youtube"
import { MusicPlayer, type MusicPlayerStore } from "./music-player"

/**
 * Player class that wraps over the Youtube iFrame API.
 * The app hides the embed iFrame and uses its own.
 * 
 * @extends     MusicPlayer
 * @implements  MusicPlayerStore<YoutubeMusicPlayer>
 * 
 */
export class YoutubeMusicPlayer extends MusicPlayer implements MusicPlayerStore<YoutubeMusicPlayer>  {
    player: any
    playlistClicked: MediaCollection | null = null

    doShowPlayer = true
    hasActiveSession = false
    isReady = false
    isLive  = false
    
    iFramePlaylistId = ""
    iFrameVidId      = ""
    error: any = null
    state = -1
        
    LOAD_PREV_PLAYER_STATE_DELAY = 1000
    static IFRAME_CLASS = "yt-music-player"

    PLAYER_OPTIONS: any = {
        height: "100px", 
        width: "100px",
        playerVars: {
            volume: 50,
            autoplay: 1,
            modestbranding: 1
        },
        events: {
            onReady: null, 
            onStateChange: null,
            onError: null
        }
    }

    constructor() {
        super()
        musicPlayerStore.set(this)
        this.loadAndSetPlayerData()
    }

    /* iFrame API Set Up */

    /**
     * Initialize Youtube iFrame Player API.
     * Must initialize after refreshes.
     */
    async init(initApi: boolean) {
        try {
            await this.initIframePlayerAPI(initApi)
            this.hasActiveSession = true
            this.justInit = initApi

            this.updateState({ 
                doShowPlayer: true, 
                justInit: initApi
            }) 
        }
        catch(error: any) {
            console.error(error)
            this.onError(new APIError(APIErrorCode.PLAYER, "There was a problem initializing the Youtube Player. Please try again later."))
            
            if (!this.hasActiveSession) {
                this.quit()
            }
            throw error
        }
    }

    /**
     * Initialize iFrame Player API asynchrnously
     */
    initIframePlayerAPI = async (initApi: boolean) => {
        this.initEventHandlers()

        if (initApi) {
            setYoutubeScript()
            await this.initPlayerOnAPIReady()
        }
        else {
            this.initPlayerInstance()
        }
    }

    /**
     * Initializes a new YouTube iframe player instance on API ready
     */
    initPlayerOnAPIReady() {
        return new Promise<void>((resolve) => (window as any).onYouTubeIframeAPIReady = () => {
            this.initPlayerInstance()
            resolve()
        })
    }

    initPlayerInstance() {
        // @ts-ignore
        this.player = new YT.Player(YoutubeMusicPlayer.IFRAME_CLASS, this.PLAYER_OPTIONS)
    }


    /**
     * When player has been successfully initiated. 
     * Called when initiated the first time or after refreshes.
     * Sets playlist / video where user left off.
     */
    onYtPlayerReadyHandler = async () => {
        this.initProgressInterval()
        this.justLoaded = true

        if (!this.mediaCollection) {
            return
        }
        if (!this.justInit) {
            // save the state from previous session
            setTimeout(() => {
                this.toggleRepeat(this.isRepeating)
                this.toggleShuffle(this.isShuffled)
                this.toggleMute(this.isMuted)

            }, this.LOAD_PREV_PLAYER_STATE_DELAY)
        }

        try {
            this.player.cuePlaylist({ 
                listType: "playlist",  
                list: this.mediaCollection!.id,  
                index: this.currentIdx,  
                startSeconds: 0 
            })
        }
        catch {
            this.onError(APIErrorCode.PLAYER)
        }
    }

    /* State Updates */

    /**
     * On state changed handler. Only registers case where playlist is replaced / vid changes.
     * Update the current video details.
     * 
     * event.data alludes to different states.
     * 
     * -1 (unstarted)
     *  0 (ended)
     *  1 (playing)
     *  2 (paused)
     *  3 (buffering)
     *  5 (video cued)
     * 
     * @param  event  Event object passed by the iFrame API, stores enum state and player object.          
     */
    oniFrameStateChanged = async (event: any) => {
        const player     = event.target
        const state      = event.data

        this.state = state
        this.updatePlayerState(state, player.getVideoData().isLive)

        if (this.justLoaded && [3, 1].includes(state)) {
            this.justLoaded = false
        }

        // validate data
        const vidDetails = await this.validateMediaItem(player)
        if (!vidDetails) return
        
        this.removeError()
        this.iFramePlaylistId = event.target.getPlaylistId()

        // update media data
        const doNotUpdateItem = state < 0 || state === 5 || vidDetails.id === this.mediaItem?.id
        if (doNotUpdateItem) return

        // init video detals
        const idx = player.getPlaylistIndex()
        this.updateYtMediaItem(vidDetails!, idx)
    }

    updatePlayerState(state: number, isLive: boolean) {
        this.updateState({ 
            isLive,
            isPlaying:     state === 1,
            isDisabled:    state === 3,
            doAllowUpdate: state != 3
        })
    }

    /**
     * 
     * Check to see if Youtube video can be played.
     * If not show an error.
     * 
     * Used to catch the following error cases of playing an invalid video in a public playlist (non-first video).
     */
    validateMediaItem = async (player: any) => {
        const playlist  = player.getPlaylist()

        // will be empty on -1, 5 states
        // note playlist will always be > 1, validate after collection choice
        if (playlist.length === 0) return null
        
        const idx       = player.getPlaylistIndex()
        const currVidId = playlist[idx]

        // if already validated the same id, do not check again
        if (currVidId === this.iFrameVidId) return null

        const vidDetails = await getVidDetails(currVidId)

        this.iFrameVidId = currVidId

        if (!vidDetails) {
            this.onError(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Video couldn't be played due to privacy restriction."))
            return null
        }
        else if (vidDetails.embeddable != undefined && !vidDetails.embeddable) {
            this.onError(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Video couldn't be played due to embed restriction."))
            return null
        }
        else {
            return vidDetails
        }
    }

    /**
     * Initialize event handlers for iFrame Player to be used.
     * Youtube Player state updates are triggered by events dispatched from Youtube API.
     */
    initEventHandlers() {
        this.PLAYER_OPTIONS.events.onReady = this.onYtPlayerReadyHandler
        this.PLAYER_OPTIONS.events.onStateChange = this.oniFrameStateChanged
        this.PLAYER_OPTIONS.events.onError = this.onIframeError
    }

    initProgressInterval() {
        setInterval(() => this.updateProgress(), 1000)
    }

    updateProgress() {
        // loaded after a refresh
        if (this.player.getPlayerState() === 5) return

        try {
            this.updateState({
                progressMs: this.player.getCurrentTime() * 1000,
                volume: this.player.getVolume(),
                durationMs: this.player.getDuration() * 1000
            })
        }
        catch {
            this.onError(APIErrorCode.PLAYER)
        }
    }
    
    /* Controls */
    togglePlayback(): void {
        try {
            if (this.state === 1) {
                this.player.pauseVideo()
            }
            else if (this.state === 2 || this.state === 5) {
                this.player.playVideo()
            }
            if (this.player.getPlayerState() === 5) {
                this.initVolumeOnMediaCue(this.isMuted, this.volume)
            }
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    async skipToNextTrack() {
        try {
            this.player.nextVideo()
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    async skipToPrevTrack() {
        try {
            this.player.previousVideo()
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    /**
     * Seeks to a specific position in the media playback.
     * @param posSecs - The position to seek to, in secs
     */
    seekTo(posSecs: number) {
        try {
            this.player.seekTo(posSecs, true)
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    toggleRepeat(doRepeat?: boolean): void {
        try {
            this.isRepeating = doRepeat != undefined ? doRepeat : !this.isRepeating 

            this.player.setLoop(this.isRepeating)
            this.updateState({ isRepeating: this.isRepeating })
        }
        catch(e) {
            this.onError(e)
        }
    }

    toggleShuffle(doShuffle?: boolean): void {
        try {
            this.isShuffled = doShuffle != undefined ? doShuffle : !this.isShuffled 
            this.player.setShuffle(this.isShuffled)
            this.updateState({ isShuffled: this.isShuffled })
        }
        catch (error: any) {
            this.onError(error)
        }
    }
    
    toggleMute(doMute?: boolean): void {
        try {
            this.isMuted = doMute != undefined ? doMute : !this.isMuted

            if (!this.isMuted) {
                this.player.unMute()
            }
            else {
                console.log("muting")
                this.player.mute()
            }
            this.updateState({ isMuted: this.isMuted })
            // this.player.isMuted()
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    setVolume(volume: number) {
        console.log("setVolume", volume)
        try {
            this.volume = volume
            this.player.setVolume(volume)
            this.updateState({ volume })
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    /**
     * 
     * Initialize volume while iframe is in queued state.
     * setVolume() does not work.
     */
    initVolumeOnMediaCue(isMute: boolean, volume: number) {
        setTimeout(() => this.player.mute(), 100)
        
        if (!isMute) {
            setTimeout(() => this.player.unMute(), 200)
        }
        setTimeout(() => this.setVolume(volume), 300)
    }

    /* Media */ 
    /**
     * Load current item in the player
     * Cannot force a pause when loading a new item using Spotify iFrame API.
     * 
     * @param doPlay   Play item
     */
    async playMediaCollection(doPlay = true) {
        if (this.state === 3 ) return   // if a prev loaded vid was buffering do not cue a new playlist
        this.removeError()
        
        try {
            this.player.stopVideo()
            this.player!.loadPlaylist({ 
                list:     this.mediaCollection!.id, 
                listType: "playlist",
                index:    0
            })
    
            // allow state change handler to set playlist to disallow player from setting an invalid playlist
            this.playlistClicked = this.mediaCollection
        }
        catch(e: any) {
            console.log({ e })
            if (e.code === APIErrorCode.PLAYER_MEDIA_INVALID) {
                this.onError(e)
            }
            else {
                this.onError(new APIError(APIErrorCode.PLAYER))
            }
        }
    }

    updateYtMediaItem(vid: YoutubeVideo, playlistVidIdx: number) {
        this.mediaItem = {
            id:            vid.id,
            name:          vid.title,
            author:        vid.channelName,
            authorUrl:     vid.channelUrl,
            artworkImgSrc: vid.thumbnailSrc,
            type:          MusicMediaType.Track,
            fromLib:       false,
            genre:         "",
            url:           ""
        }
        this.currentIdx = playlistVidIdx
        this.updateState({ 
            mediaItem: this.mediaItem, 
            currentIdx: this.currentIdx 
        })
    }

    updateYtMediaCollection(collection: MediaCollection) {
        this.updateMediaCollection({ 
            collection,
            idx: 0
        })
    }

    /**
     * Initialize new resource for iFrame player to play.
     * Will always be a media collection
     * 
     * @param media 
     */
    async updateMediaCollection(context: MediaClickedContext) {
        try {
            if (this.mediaCollection?.id === context.collection.id) {
                return
            }
            if (!this.doShowPlayer) {
                this.toggleShow(true)
            }

            this.mediaCollection = context.collection!
            this.currentIdx = context.idx

            this.updateState({ 
                mediaCollection: this.mediaCollection, 
                currentIdx: this.currentIdx 
            })
        }
        catch(error) {
            this.onError(error)
            throw error
        }
    }

    /* Errors */

    /**
     * iFrame API Error Handler based on the iFrame API Docs.
     * https://developers.google.com/youtube/iframe_api_reference
     *
     * @param error   Error returned by Youtube Player API
     */
    onIframeError = (error: any) => {
        const { data, target } = error
        const errorCode = data

        if (errorCode === null || errorCode === undefined || !this.isReady) return
        this.onError(getYtIframeAPIError(errorCode, target))
    }

    /**
     * Update error. Will show error to user if necessary.
     * @param error 
     */
    onError(error: any) {
        if (this.error) return

        const isAPINotLoadedYetMsg = /^this\.player\.\w+\s*is not a function$/.test(error.message)

        if (isAPINotLoadedYetMsg) {
            this.error = new APIError(APIErrorCode.PLAYER, "Player hasn't loaded yet. Try again later.")
        }
        else if (error.code != undefined) {
            this.error = error
        }
        else {
            this.error = new APIError(APIErrorCode.PLAYER)
        }

        this.updateState({ error: this.error })
        youtubeAPIErrorHandler(this.error)
    }

    removeError() {
        this.error = null
        this.updateState({ error: null })
    }

    /* State Updates */

    /**
     * Update data store for Youtube Player.
     * @param newData  Incorporate new data from here.
     */
    updateState(newState: Partial<YoutubeMusicPlayer>, doSave: boolean = true) {
        musicPlayerStore.update((data: MusicPlayer | null) => { 
            return this.getNewStateObj(newState, data! as YoutubeMusicPlayer)
        })

        if (doSave) this.saveState()
    }

    /**
     * Get the updated version of the old state. 
     * This is done to avoid destructuring as methods will not be incorporated.
     * 
     * @param newState   New changes to be incorporated
     * @param oldState   Old version of the data to be updated with the new changes.
     */
    getNewStateObj(newState: Partial<YoutubeMusicPlayer>, oldState: YoutubeMusicPlayer) {
        const newStateObj = oldState

        if (newState.mediaItem != undefined)       newStateObj!.mediaItem = newState.mediaItem
        if (newState.mediaCollection != undefined) newStateObj!.mediaCollection = newState.mediaCollection

        if (newState.currentIdx != undefined)      newStateObj!.currentIdx = newState.currentIdx
        if (newState.durationMs != undefined)      newStateObj!.durationMs = newState.durationMs
        if (newState.progressMs != undefined)      newStateObj!.progressMs = newState.progressMs
        if (newState.volume != undefined)          newStateObj!.volume = newState.volume
        if (newState.isMuted != undefined)         newStateObj!.isMuted = newState.isMuted
        if (newState.isLive != undefined)          newStateObj!.isLive = newState.isLive

        if (newState.isPlaying != undefined)       newStateObj!.isPlaying = newState.isPlaying
        if (newState.isDisabled != undefined)      newStateObj!.isDisabled = newState.isDisabled
        if (newState.isRepeating != undefined)     newStateObj!.isRepeating = newState.isRepeating
        if (newState.isShuffled != undefined)      newStateObj!.isShuffled = newState.isShuffled
        if (newState.isBuffering != undefined)     newStateObj!.isBuffering = newState.isBuffering

        if (newState.error != undefined)           newStateObj!.error = newState.error
        if (newState.doShowPlayer != undefined)    newStateObj!.doShowPlayer = newState.doShowPlayer
        if (newState.doAllowUpdate != undefined)   newStateObj!.doAllowUpdate = newState.doAllowUpdate
        if (newState.hasItemUpdated != undefined)  newStateObj!.hasItemUpdated = newState.hasItemUpdated

        return newStateObj
    }

    /* Misc */
    quit() {
        this.player.stopVideo()
        // @ts-ignore
        window.onYouTubeIframeAPIReady = null

        super.quit()
    }

    /**
     * Hide / show Youtube Player. 
     * Stops current video from playing.
     * Will not inmount player off the dom.
     */
    toggledShowPlayer() {
        this.doShowPlayer = !this.doShowPlayer
        this.player.stopVideo()
        this.updateState({ doShowPlayer: this.doShowPlayer })
    }
}