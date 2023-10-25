import { get } from "svelte/store"
import { ytPlayerStore, ytUserDataStore } from "./store"
import { type CustomError, ApiError, ResourceNotFoundError, PlayerError } from "./errors"
import { getPlayListDetails, getVidDetails, getYtIframeAPIError } from "./api-youtube"
import { loadYtPlayerData, saveYtPlayerData, deleteYtPlayerData } from "./utils-youtube-player"

/**
 * Youtube Player class for initializing a Youtube iFrame Player using YouTube Player API
 * Is itself a store / reactive class (initialized in instantiation).
 * Offers methods to control player. Used to play playlists only.
 * Decoupled from Youtube Data. 
 * Errors are handled by an error handler in the Youtube View component that listens to changes in the error property.
 */
export class YoutubePlayer {
    // @ts-ignore
    player: any
    vid: YoutubeVideo | null = null
    playlist: YoutubePlaylist | null = null
    playlistVidIdx: number | null = null
    error: any = null
    doShowPlayer = false
    stoppedState = false
    hasJustInit = false
        
    IFRAME_CLASS = "home-yt-player"
    LOOK_BACK_DELAY = 2000

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

    constructor(hasUserSignedIn: boolean) {
        ytPlayerStore.set(this)

        if (hasUserSignedIn) {
            this.loadAndSetPlayerData()
        }
        else {
            this.updateYtPlayerState({ doShowPlayer: true }) 
        }

        this.initEventHandlers()
    }

    /**
     * Initialize Youtbe iFrame Player API.
     * If there's data from a previous session, play that playlist and update video details.
     */
    async initYtPlayer() {
        await this.intIframePlayerAPI()
    }

    /**
     * Initialize iFrame Player API asynchrnously
     * @throws  {ApiError}   Error initializing iFrame Player API
     */
    async intIframePlayerAPI() {
        try {
            this.setYoutubeScript()
            await this.waitForPlayerReadyAndSetPlayerInstance()
        }
        catch {
            const error = new ApiError("Error initializing Youtube iFrame Player API")
            this.setError(error)
            console.error(error)
            throw error
        }
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
     * Reset data store, clears local storage, resets Youtube Player API
     */
    quitPlayer() {
        ytPlayerStore.set(null)
        this.clearYoutubeUserData()
        this.player.stopVideo()

        // @ts-ignore
        window.onYouTubeIframeAPIReady = null
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
        this.hasJustInit = true

        if (!this.playlist) return 
        try {

            if (this.playlistVidIdx === null) {
                let firstVidId = this.playlist!.firstVidId ?? (await getPlayListDetails(this.player.playlist.id)).firstVidId
                const vid = await getVidDetails(firstVidId!)
                this.updateVideo(vid, 0)
            }
            this.player.cuePlaylist({ 
                listType: "playlist",  list: this.playlist!.id,  
                index: this.playlistVidIdx,  startSeconds: 0 
            })
        }
        catch(e: any) {
            this.setError(e)
        }
    }

    /**
     * On state changed handler. Only registers case where playlist is replaced / vid changes.
     * Update the current video details.
     * 
     * @param  event  Event object passed by the iFrame API, stores enum state and player object.          
     */
    onVidIdxChangedHandler = async (event: any) => {
        const player = event.target
        const vidData = player.playerInfo.videoData
        const state = event.data
        console.log(state)
        console.log(player.playerInfo)

        // unlisted video
        this.unlistedVidHandler(state)
        if (state === 5 && this.hasJustInit) {
            this.hasJustInit = false
        }

        // vid-specific errors  will not show up on error handler only here
        if (vidData.errorCode) { 
            this.onYtErrorHandler(event)
            return
        }

        const vidId = player.getVideoData().video_id
        if (state < 0 || state === 5 || !this.playlist || !vidId || vidId === this.vid?.id) return

        if (this.error) this.removeError()

        try {
            const playlistVidIdx = player.getPlaylistIndex()
            const vid = await getVidDetails(vidId)

            this.updateVideo(vid, playlistVidIdx)
        }
        catch(e: any) {
            this.setError(e)        // error if id does not exists or is privated
        }
    }


    /**
     * @param error   Error returned by Youtube Player API
     */
    onYtErrorHandler = (error: any) => {
        const errorCode = error.target.playerInfo.videoData.errorCode

        // vid-specific error codes will not show up here onlt on the on-state change handler
        if (errorCode === null) return
        console.error(`There was an error with the Youtube iFrame API. Error code: ${errorCode}.`)

        this.setError(getYtIframeAPIError(errorCode))
    }

    /**
     * Unlisted video check and handler.
     * Check to see that if a player has been queued up (when user chooses a new playlist) w/o it ever going to PLAYING state 
     * then an unlisted video has been reached.
     * 
     * Queued to Play State Sequences:
     * 
     * Valid Video     -1, 5, -1, 3, 1
     * Unlisted Video: -1 5 
     */
    unlistedVidHandler = (state: number) => {
        if (this.hasJustInit || ![1, 5].includes(state)) return

        if (state === 1) { 
            this.stoppedState = true
            return
        }

        this.stoppedState = false
        
        setTimeout(() => {
            if (this.stoppedState || this.error) return  // state has reached 1 state (above)

            console.error("Playlist video is unlisted.")
            this.setError(new PlayerError("Playlist / video unavailable. Playback on other websites has been disabled by video owner."))

        }, this.LOOK_BACK_DELAY)
    }

    /**
     * Initialize event handlers for iFrame Player to be used.
     * Youtube Player state updates are triggered by events dispatched from Youtube API.
     */
    initEventHandlers() {
        // event handlers are arrow functions as lexical context ("this" instance) is needed
        this.YT_PLAYER_OPTIONS.events.onReady = this.onYtPlayerReadyHandler
        this.YT_PLAYER_OPTIONS.events.onStateChange = this.onVidIdxChangedHandler
        this.YT_PLAYER_OPTIONS.events.onError = this.onYtErrorHandler
    }

    /**
     * Triggers when user wants to play a new playlist.
     */
    async playPlaylist(playlist: YoutubePlaylist, startingIdx: number = 0) {    
        try {
            console.log(playlist.title)
            if (this.error) this.removeError()
            
            this.player.stopVideo()
            const res = await getPlayListDetails(playlist.id)
            
            this.updateCurrentPlaylist({ ...playlist, vidCount: res.vidCount })
            this.player!.loadPlaylist({ list: playlist.id, listType: "playlist", index: startingIdx })
        }
        catch(e: any) {
            console.error(e)   
            if (e instanceof TypeError) return
            if (e instanceof ResourceNotFoundError) this.removeCurrentPlaylist()
            this.setError(e)
        }
    }

    /**
     * Update error.
     * 
     * @param error 
     */
    setError(error: CustomError) {
        this.error = error
        console.log("A")
        this.updateYtPlayerState({ error })
    }

    /**
     * Remove current error.
     */
    removeError() {
        this.error = null
        this.updateYtPlayerState({ error: null })
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
        const savedData = loadYtPlayerData()!
        this.updateYtPlayerState({ ...savedData })
    }

    saveStateData() {
        const player = get(ytPlayerStore)!

        saveYtPlayerData({
            vid: player.vid!,
            playlist: player.playlist!,
            playlistVidIdx: player.playlistVidIdx!,
            doShowPlayer: player.doShowPlayer
        })
    }

    /**
     * Clear youtube user and creds data from local storage. 
     */
    clearYoutubeUserData() {
        deleteYtPlayerData()
    }
}