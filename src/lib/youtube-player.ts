import { get } from "svelte/store"
import { ytPlayerStore } from "./store"
import { APIError } from "./errors"
import { getVidDetails, getYtIframeAPIError } from "./api-youtube"
import { loadYtPlayerData, saveYtPlayerData, deleteYtPlayerData, setYoutubeScript } from "./utils-youtube"
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
    iFrameVidId      = ""

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

    PLAYER_OPTIONS: any = {
        height: "100%", 
        width: "100%",
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
        ytPlayerStore.set(this)
        this.loadAndSetPlayerData()
    }

    /* iFrame API Set Up */

    /**
     * Initialize Youtube iFrame Player API.
     * Must initialize after refreshes.
     */
    async initYtPlayer(initApi: boolean) {
        try {
            await this.initIframePlayerAPI(initApi)
            this.updateYtPlayerState({ doShowPlayer: true }) 
            
            this.hasActiveSession = true
        }
        catch(error: any) {
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
        this.player = new YT.Player(this.IFRAME_CLASS, this.PLAYER_OPTIONS)
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
        if (!this.playlist) return

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

        this.state = state
        // this.updatePlayerState(state)

        if (this.justLoaded && [3, 1].includes(state)) {
            this.justLoaded = false
        }

        // validate data
        const vidDetails = await this.validateMediaItem(player)
        if (!vidDetails) return
        
        this.removeError()
        this.iFramePlaylistId = event.target.getPlaylistId()

        // update media data
        const doNotUpdateItem = state < 0 || state === 5 || vidDetails.id === this.vid?.id
        if (doNotUpdateItem) return


        // video
        const playlistVidIdx = player.getPlaylistIndex()
        this.updateVideo(vidDetails, playlistVidIdx)
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

            let errorMessage = "Playlist couldn't be played due to privacy or embed playback restrictions."
            this.onError(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, errorMessage))
        }, this.LOOK_BACK_DELAY)
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

            // if an invalid playlist is selected when iframe has just loaded with a vid queued (after a refresh)
            // there won't be an iframe state update so do the check here
            await new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    const inactive = [-1, 5].includes(this.state)

                    if (inactive && this.justLoaded) {
                        reject(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Playlist couldn't be played due to privacy or embed playback restrictions."))
                    } 
                    else {
                        resolve()
                    }
                }, 200)
            })
        }
        catch(e: any) {
            console.error(e)
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

        this.updateYtPlayerState({ error: this.error })
        youtubeAPIErrorHandler(this.error)
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