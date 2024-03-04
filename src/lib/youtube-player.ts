import { get } from "svelte/store"
import { ytPlayerStore } from "./store"
import { PlayerError, APIError } from "./errors"
import { getPlayListItemsDetails, getVidDetails, getYtIframeAPIError } from "./api-youtube"
import { loadYtPlayerData, saveYtPlayerData, deleteYtPlayerData } from "./utils-youtube"
import { APIErrorCode } from "./enums"
import { youtubeAPIErrorHandler } from "./utils-youtube"

/**
 * Youtube Player class for initializing a Youtube iFrame Player using YouTube Player API
 * Is itself a store / reactive class (initialized in instantiation).
 * Offers methods to control player. Used to play playlists only.
 * Decoupled from Youtube Data. 
 */
export class YoutubePlayer {
    player: any
    vid: YoutubeVideo | null = null
    playlist: YoutubePlaylist | null = null
    playlistClicked: YoutubePlaylist | null = null
    playlistVidIdx: number | null = null
    error: any = null
    doShowPlayer = true
    hasActiveSession = false
    hasActiveiFrameSession = false
        
    iFramePlaylistId = ""
    IFRAME_CLASS = "home-yt-player"
    LOOK_BACK_DELAY = 1000
    lookBackTimeOut: NodeJS.Timeout | null = null

    YT_PLAYER_OPTIONS: YoutubePlayerOptions = {
        height: "100%", width: "100%",
        playerVars: {
            rel: 0, volume: 50,
            autoplay: 1, modestbranding: 1,
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
    async initIframePlayerAPI() {
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
        ytScriptTag.id = "ytScriptTag"
        ytScriptTag!.parentNode!.insertBefore(tag, ytScriptTag)
    }

    /**
     * Initializes a new YouTube iframe player instance.
     * Waits for YoutubeAPI on iFrame API to fire the event then initializes a player.
     * Resolves the promise afterwards
     * 
     * @throws   Error that occured when initializing Youtube iFrame API
     */
    waitForPlayerReadyAndSetPlayerInstance(): Promise<void> {
        // @ts-ignore
        return new Promise<void>((resolve) => window.onYouTubeIframeAPIReady = () => {
            // @ts-ignore
            this.player = new YT.Player(this.IFRAME_CLASS, this.YT_PLAYER_OPTIONS)
            resolve()
        })
    }
    

    /**
     * Update data store for Youtube Player.
     * @param newData  Incorporate new data from here.
     */
    updateYtPlayerState(newData: Partial<YoutubePlayer>) {
        ytPlayerStore.update((data: YoutubePlayer | null) => { 
           return this.getNewStateObj(newData, data!)
        })

        this.saveStateData()
    }

    /**
     * When player has been successfully initiated. 
     * Called when initiated the first time or after refreshes.
     * Sets playlist / video where user left off.
     */
    onYtPlayerReadyHandler = async () => {
        this.hasActiveiFrameSession = true

        if (!this.playlist) return 
        try {
            this.player.cuePlaylist({ 
                listType: "playlist",  list: this.playlist!.id,  
                index: this.playlistVidIdx,  startSeconds: 0 
            })
        }
        catch(e: any) {
            this.onError(e)
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
     *  5 (video cued).
     * 
     * @param  event  Event object passed by the iFrame API, stores enum state and player object.          
     */
    oniFrameStateChanged = async (event: any) => {
        const player = event.target
        const state = event.data
        this.iFramePlaylistId = event.target.getPlaylistId()

        // edge case when first vid is not valid
        this.disabledVidPlaypackHandler(state)
        if (state === 5 && this.hasActiveiFrameSession) {
            this.hasActiveiFrameSession = false
        }

        // do not update vid id unless necessary
        const vidId  = player.getVideoData().video_id
        const doNotUpdateVid = state < 0 || state === 5 || !vidId || vidId === this.vid?.id

        if (doNotUpdateVid) return
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
        console.error(error)
        const errorCode = error.data

        if (errorCode === null) return
        this.onError(getYtIframeAPIError(errorCode))
    }

    /**
     * Handles cases where user selects a playlist whose first vid's ability to be played in other sites has been disabled.
     * 
     * New Queued Playlist Queued Up State Sequences:
     * 
     * Valid Video:         -1, 5, ... 3, 1
     * Video with disabled: -1 5 
     * 
     * This method waits and checks if the state has progressed from 5. If so then it's a valid video.
     * Also at state 5, the playlist array in the player will be empty. 
     */
    disabledVidPlaypackHandler = (state: number) => {
        if (this.hasActiveiFrameSession || ![-1, 5].includes(state) || this.lookBackTimeOut) return
        
        this.lookBackTimeOut = setTimeout(() => {
            this.lookBackTimeOut = null
            const playerInfo = this.player.playerInfo

            // player's playlist will still contain prev playlist after removeCurrentPlaylist() is triggered
            if ([1, 3].includes(playerInfo.playerState) || playerInfo.playlist.length > 0) return 

            this.onError(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Playback on other websites has been disabled by playlist owner."))
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
    async playPlaylist(playlist: YoutubePlaylist, startingIdx: number = 0) {    
        if (this.error)           this.removeError()
        if (this.lookBackTimeOut) clearTimeout(this.lookBackTimeOut)
        
        this.player.stopVideo()
        this.player!.loadPlaylist({ list: playlist.id, listType: "playlist", index: startingIdx })

        // allow state change handler to set playlist to disallow player from setting an invalid playlist
        this.playlistClicked = playlist
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
        this.player.stopVideo()

        this.playlist = null
        this.vid = null
        this.playlistVidIdx = null

        this.updateYtPlayerState({ playlist: null, vid: null, playlistVidIdx: null })
    }

    /**
     * Update error.
     * 
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

    /**
     * Remove current error.
     */
    removeError() {
        this.error = null
        this.updateYtPlayerState({ error: null })
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