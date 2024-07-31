import { get } from "svelte/store"
import { ytPlayerStore } from "./store"
import { APIError } from "./errors"
import { getPlayListItemsDetails, getVidDetails, getYtIframeAPIError } from "./api-youtube"
import { loadYtPlayerData, saveYtPlayerData, deleteYtPlayerData } from "./utils-youtube"
import { APIErrorCode } from "./enums"
import { youtubeAPIErrorHandler } from "./utils-youtube"

/**
 * Used for managing a youtube player, leveraging the YouTube iFrame API
 * Is itself a store / reactive class (initialized in instantiation).
 * Offers methods to control player. Used to play playlists only.
 */
export class YoutubePlayer {
    player: any

    vid: YoutubeVideo | null = null
    playlist: YoutubePlaylist | null = null
    playlistClicked: YoutubePlaylist | null = null
    playlistVidIdx: number | null = null
    
    iFramePlaylistId = ""

    floatLayout      = { width: -1, height: -1, left: -1, top: -1 }
    doShowPlayer     = true
    hasActiveSession = false
    justLoaded       = false
    isReady          = false
    
    error: any = null
    state      = -1
        
    IFRAME_CLASS    = "yt-player"
    LOOK_BACK_DELAY = 1200
    READY_DELAY     = 2000
    lookBackTimeOut: NodeJS.Timeout | null = null

    YT_PLAYER_OPTIONS: any = {
        height: "100%", width: "100%",
        playerVars: {
            rel: 0, 
            volume: 50,
            autoplay: 1,
            // controls: 0,
            showinfo: 0,
            disablekb: 1,
            modestbranding: 1
        },
        events: {
            onReady: null, onStateChange: null, onError: null
        }
    }

    constructor() {
        ytPlayerStore.set(this)
        this.loadAndSetPlayerData()
        this.initEventHandlers()
    }

    /**
     * Initialize Youtbe iFrame Player API.
     * Must initialize after refreshes.
     */
    async initYtPlayer() {
        try {
            await this.initIframePlayerAPI()
            this.initEventHandlers()
            this.updateYtPlayerState({ doShowPlayer: true }) 
            
            this.hasActiveSession = true
        }
        catch(error: any) {
            this.onError(new APIError(APIErrorCode.PLAYER, "There was a problem initializing the Youtbe Player. Please try again later."))
            
            if (!this.hasActiveSession) {
                this.quit()
            }
            throw error
        }
    }

    /**
     * Initialize iFrame Player API asynchrnously
     */
    initIframePlayerAPI = async () => {
        this.setYoutubeScript()
        await this.waitForPlayerReadyAndSetPlayerInstance()
    }

    /**
     * Load the iFrame Player API to app
     */
    setYoutubeScript() {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'

        const ytScriptTag = document.getElementsByTagName('script')[0]
        ytScriptTag!.parentNode!.insertBefore(tag, ytScriptTag)
    }

    /**
     * Initializes a new YouTube iframe player instance on API ready
     */
    waitForPlayerReadyAndSetPlayerInstance() {
        return new Promise<void>((resolve) => (window as any).onYouTubeIframeAPIReady = () => {
            this.initIFramePlayer()
            resolve()
        })
    }

    /**
     * Initializes a new iFrame player instance.
     */
    initIFramePlayer() {
        // @ts-ignore
        this.player = new YT.Player(this.IFRAME_CLASS, this.YT_PLAYER_OPTIONS)
    }
    

    /**
     * Update data store for Youtube Player.
     * @param newData  Incorporate new data from here.
     */
    updateYtPlayerState(newData: Partial<YoutubePlayer>) {
        ytPlayerStore.update((data) => (this.getNewStateObj(newData, data!)))
        this.saveStateData()
    }

    /**
     * When player has been successfully initiated. 
     * Called when initiated the first time or after refreshes.
     * Sets playlist / video where user left off.
     */
    onYtPlayerReadyHandler = async () => {
        this.justLoaded = true
        setTimeout(() => this.isReady = true, this.READY_DELAY)

        if (!this.playlist) {
            return
        } 

        try {
            this.player.cuePlaylist({ 
                listType: "playlist",  list: this.playlist!.id,  
                index: this.playlistVidIdx,  startSeconds: 0 
            })
        }
        catch {
            this.onError(APIErrorCode.PLAYER)
        }
    }

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
        const player    = event.target
        const state     = event.data
        const videoData = player.getVideoData()
        
        this.state = state
        this.iFramePlaylistId = event.target.getPlaylistId()

        this.disabledVidPlaypackHandler(state, player.getPlaylistIndex())

        // do not update vid id unless necessary
        const vidId          = videoData.video_id
        const doNotUpdateVid = state < 0 || state === 5 || !vidId || vidId === this.vid?.id

        if (this.justLoaded && [3, 1].includes(state)) {
            this.justLoaded = false
        }
        if (doNotUpdateVid) {
            return
        }
        if (this.error) {
            this.removeError()
        }

        try {
            // playlist
            if (this.iFramePlaylistId != this.playlist?.id) {
                this.playlist = this.playlistClicked

                const { playlistLength } = await getPlayListItemsDetails(this.playlist!.id)
                this.updateCurrentPlaylist({ ...this.playlist!, vidCount: playlistLength })
            }

            // video
            const playlistVidIdx = player.getPlaylistIndex()
            const vid = await getVidDetails(vidId)

            this.updateVideo(vid, playlistVidIdx)
        }
        catch(e: any) {
            this.onError(e)        // error if id does not exists or is privated
        }
    }


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
     * Handles cases where user selects a playlist that cannot be played.
     * Private or unlisted playlist. Or embed playback disabled. 
     * Also for public but vid queued up is private / unlisted / embed playback disabled.
     * 
     * New Queued Playlist Queued Up State Sequences:
     * 
     * Valid:    -1, 5, ... 3, 1
     * Invalid:  -1 5 
     * 
     * Sees is the player is stuck at state 5. If so then player's media is invalid.
     * 
     */
    disabledVidPlaypackHandler = (state: number, playlistIdx: number) => {
        const isCueLoading = [-1, 5].includes(state)
        
        // only call when a playlist / video is first being cueued
        // the invalid pattern also occurs when the iframe is first loaded (after a refresh)
        if (this.justLoaded || !isCueLoading || this.lookBackTimeOut) {
            return
        }
        
        this.lookBackTimeOut = setTimeout(() => {
            this.clearLookBackTimeout()

            // if playlist idx > 1 and error, let the onError handle that
            if ([0, 1, 2, 3].includes(this.player.playerInfo.playerState) || playlistIdx > 0) {
                return
            } 

            console.log(this.state)

            let errorMessage = "Playlist couldn't be played due to privacy or embed playback restrictions."
            this.onError(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, errorMessage))
        }, this.LOOK_BACK_DELAY)
    }

    /**
     * Initialize event handlers for iFrame Player to be used.
     * Youtube Player state updates are triggered by events dispatched from Youtube API.
     */
    initEventHandlers() {
        this.YT_PLAYER_OPTIONS.events.onReady = this.onYtPlayerReadyHandler
        this.YT_PLAYER_OPTIONS.events.onStateChange = this.oniFrameStateChanged
        this.YT_PLAYER_OPTIONS.events.onError = this.onIframeError
    }

    /**
     * Triggers when user wants to play a new playlist.
     */
    async playPlaylist(playlist: YoutubePlaylist, startingIdx = 0) {    
        if (this.error)           this.removeError()
        if (this.lookBackTimeOut) this.clearLookBackTimeout()
        if (this.state === 3 )    return   // if a prev loaded vid was buffering do not cue a new playlist

        try {


            this.player.stopVideo()
            this.player!.loadPlaylist({ list: playlist.id, listType: "playlist", index: startingIdx })
    
            // allow state change handler to set playlist to disallow player from setting an invalid playlist
            this.playlistClicked = playlist

            // if an invalid playlist is selected when suer just loaded, there won't be an iframe state update
            await new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    if (this.state < 0 && this.justLoaded) {
                        reject(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Playlist couldn't be played due to privacy or embed playback restrictions."))
                    } 
                    else {
                        resolve()
                    }
                }, 200)
            })
        }
        catch(e: any) {
            if (e.code === APIErrorCode.PLAYER_MEDIA_INVALID) {
                this.onError(e)
            }
            else {
                this.onError(new APIError(APIErrorCode.PLAYER))
            }
        }
    }

    /**
     * Update the video being shown in the video details under the player.
     * @param vid   Video currentply playing
     */
    updateVideo(vid: YoutubeVideo, playlistVidIdx: number) {
        this.vid = vid
        this.playlistVidIdx = playlistVidIdx
        this.updateYtPlayerState({ vid, playlistVidIdx })
    }

    /**
     * Update the playlist being played.
     * @param playlist       Playlist user wants to play
     */
    updateCurrentPlaylist(playlist: YoutubePlaylist) {
        this.playlist = playlist

        this.updateYtPlayerState({ 
            playlist,
            playlistVidIdx: 0
        })
        return playlist
    }

    removeCurrentPlaylist() {
        try {
            this.player.stopVideo()
        }
        catch {
            this.onError(APIErrorCode.PLAYER)
        }

        this.playlist = null
        this.vid = null
        this.playlistVidIdx = null

        this.updateYtPlayerState({ playlist: null, vid: null, playlistVidIdx: null })
    }

    /**
     * Update error. Will show error to user if necessary.
     * @param error 
     */
    onError(error: any) {
        this.error = error
        this.updateYtPlayerState({ error })
        youtubeAPIErrorHandler(error)
    }

    /**
     * Reset data store, clears local storage, resets Youtube Player API
     */
    quit() {
        ytPlayerStore.set(null)
        this.clearYoutubeUserData()

        this.player.stopVideo()

        // @ts-ignore
        window.onYouTubeIframeAPIReady = null
    }

    removeError() {
        this.error = null
        this.updateYtPlayerState({ error: null })
    }

    updateFloatPosition(floatLayout: BoxLayout) {
        this.floatLayout = structuredClone(floatLayout)
        this.updateYtPlayerState({ floatLayout: this.floatLayout })
    }

    /**
     * Hide / show Youtube Player. 
     * Stops current video from playing.
     * Will not inmount player off the dom.
     */
    toggledShowPlayer() {
        this.doShowPlayer = !this.doShowPlayer
        this.player.stopVideo()
        this.updateYtPlayerState({ doShowPlayer: this.doShowPlayer })
    }

    clearLookBackTimeout() {
        if (this.lookBackTimeOut) {
            clearTimeout(this.lookBackTimeOut)
            this.lookBackTimeOut = null
        }
    }

    /**
     * Get the updated version of the old state. 
     * This is done to avoid destructuring as methods will not be incorporated.
     * 
     * @param newState   New changes to be incorporated
     * @param oldState   Old version of the data to be updated with the new changes.
     */
    getNewStateObj(newState: Partial<YoutubePlayer>, oldState: YoutubePlayer) {
        const newStateObj = oldState

        if (newState.vid != undefined)             newStateObj.vid = newState.vid
        if (newState.playlist != undefined)        newStateObj.playlist = newState.playlist
        if (newState.playlistVidIdx != undefined)  newStateObj.playlistVidIdx = newState.playlistVidIdx
        if (newState.doShowPlayer != undefined)    newStateObj.doShowPlayer = newState.doShowPlayer
        if (newState.floatLayout != undefined)     newStateObj.floatLayout = newState.floatLayout

        return newStateObj
    }

    /**
     * Load youtube creds and user data from local storage.
     * Called everytime user refreshes and Yotube Data has to be re-initialized.
     * Updates the state.
     */
    loadAndSetPlayerData() {
        const savedData = loadYtPlayerData()
        if (!savedData) return

        this.hasActiveSession = true
        this.updateYtPlayerState({ ...savedData })
    }

    saveStateData() {
        const player = get(ytPlayerStore)!
        saveYtPlayerData({
            vid:            player.vid!,
            playlist:       player.playlist!,
            playlistVidIdx: player.playlistVidIdx!,
            floatLayout:    player.floatLayout!,
            doShowPlayer:   player.doShowPlayer
        })
    }

    /**
     * Clear youtube user and creds data from local storage. 
     */
    clearYoutubeUserData() {
        deleteYtPlayerData()
    }
}