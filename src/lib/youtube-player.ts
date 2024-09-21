import { ytPlayerStore } from "./store"

import { APIError } from "./errors"
import { APIErrorCode } from "./enums"
import { youtubeAPIErrorHandler } from "./utils-youtube"
import { getVidDetails, getYtIframeAPIError } from "./api-youtube"
import { loadYtPlayerData, saveYtPlayerData, deleteYtPlayerData, setYoutubeScript } from "./utils-youtube"

/**
 * Manager for a youtube player, leveraging the YouTube iFrame API
 * Is itself a store / reactive class (initialized in instantiation).
 * Used to play playlists and videos only for Youtube Player and Live Ambient Spaces (videos).
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
    isPlaying = false
    doShowPlayer     = true
    hasActiveSession = false
    isFetchingVid    = false
    justLoaded       = false
    isReady          = false
    volume: number = 50
    
    // is playing isolated video (not being played)
    isoVideo  = false
    error: any = null
    state      = -1
        
    static IFRAME_ID    = "yt-player"
    AUTO_PLAY_DELAY = 1200
    READY_DELAY     = 2000

    PLAYER_OPTIONS: any = {
        height: "100%", 
        width: "100%",
        playerVars: {
            volume: this.volume,
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
    async initYtPlayer() {
        try {
            await this.initIframePlayerAPI()
            this.update({ doShowPlayer: true }) 
            
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
    initIframePlayerAPI = async () => {
        this.initEventHandlers()

        // @ts-ignore
        if (!window.YT) {
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
        this.player = new YT.Player(YoutubePlayer.IFRAME_ID, this.PLAYER_OPTIONS)
    }

    /**
     * Update data store for Youtube Player.
     * @param newData  Incorporate new data from here.
     */
    update(newData: Partial<YoutubePlayer>) {
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

            if (this.isoVideo) {
                this.player.cueVideoById({ 
                    videoId: this.vid!.id
                })

                setTimeout(() => {
                    this.player.playVideo()
                }, this.AUTO_PLAY_DELAY)
            }
            else {
                this.player.cuePlaylist({ 
                    listType: "playlist",
                    list: this.playlist!.id,  
                    index: this.playlistVidIdx,  
                    startSeconds: 0 
                })
            }
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
        if (this.isPlaying && state === 2) {
            this.isPlaying = false
            this.update({ isPlaying: false })
        }
        else if (!this.isPlaying && state === 1) {
            this.isPlaying = true
            this.update({ isPlaying: true })
        } 


        if (this.isoVideo) return

        // validate data
        const vidDetails = await this.validateMediaItem(player)
        if (!vidDetails) return
        
        this.removeError()
        this.iFramePlaylistId = event.target.getPlaylistId()

        // update media data
        const doNotUpdateItem = state === 3 || state === 5 || vidDetails.id === this.vid?.id
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
        if (playlist.length === 0 || this.isFetchingVid) return null
        
        const idx       = player.getPlaylistIndex()
        const currVidId = playlist[idx]

        // if already validated the same id, do not check again
        if (currVidId === this.iFrameVidId) return null

        this.isFetchingVid = true
        const vidDetails = await getVidDetails(currVidId)

        this.isFetchingVid = false
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
     * Initialize event handlers for iFrame Player to be used.
     * Youtube Player state updates are triggered by events dispatched from Youtube API.
     */
    initEventHandlers() {
        this.PLAYER_OPTIONS.events.onReady = this.onYtPlayerReadyHandler
        this.PLAYER_OPTIONS.events.onStateChange = this.oniFrameStateChanged
        this.PLAYER_OPTIONS.events.onError = this.onIframeError
    }

    async togglePlayback(doPlay?: boolean) {
        try {
            if (this.state === 1 || doPlay === false) {
                this.player.pauseVideo()
            }
            else if (this.state === 2 || this.state === 5 || doPlay) {
                this.player.playVideo()
            }
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    /**
     * Plays an video
     */
    async playVideo(video: YoutubeVideo) {    
        if (this.error)         this.removeError()
        if (this.state === 3 )  return   // if a prev loaded vid was buffering do not cue a new playlist

        this.isoVideo = true
        this.vid = video
        this.update({ 
            isoVideo: true,
            vid: video
        })

        try {
            if (!this.player.stopVideo) {
                window.location.reload()
                return
            }

            this.player.stopVideo()
            this.player!.loadVideoById(video.id)
        }
        catch(e: any) {
            this.onError(e)
        }
    }

    /**
     * Play a new playlist.
     */
    async playPlaylist(playlist: YoutubePlaylist, startingIdx = 0) {    
        if (this.error)           this.removeError()
        if (this.state === 3 )    return   // if a prev loaded vid was buffering do not cue a new playlist

        this.isoVideo = false
        this.update({ isoVideo: false })

        try {
            this.playlistClicked = playlist
            this.update({ playlist })

            if (!this.player.stopVideo) {
                window.location.reload()
                return
            }

            this.player.stopVideo()
            this.player!.loadPlaylist({ 
                list: playlist.id, 
                listType: "playlist", 
                index: startingIdx
            })
        }
        catch(e: any) {
            this.onError(e)
        }
    }

    /**
     * When playing an isolated video (not associated with current playlist), switch back to playing the playlist.
     * If there is no playlist just stop the player.
     * @returns  Returns true if there was a playlist and switched back to it.
     */
    async backToPlaylist() { 
        try {
            this.isoVideo = false
            this.update({ isoVideo: false })
            
            if (this.playlist) {
                this.player.cuePlaylist({ 
                    listType: "playlist",
                    list: this.playlist!.id,  
                    index: this.playlistVidIdx,  
                    startSeconds: 0 
                })

                return false
            }
            else {
                this.player.stopVideo()
                return true
            }
        }
        catch (e: any) {
            this.onError(e)
            return false
        }
    }

    /**
     * Update the video being shown in the video details under the player.
     * @param vid   Video currentply playing
     */
    updateVideo(vid: YoutubeVideo, playlistVidIdx: number) {
        this.vid = vid
        this.playlistVidIdx = playlistVidIdx
        this.update({ vid, playlistVidIdx })
    }

    /**
     * Update the playlist being played.
     * @param playlist       Playlist user wants to play
     */
    updateCurrentPlaylist(playlist: YoutubePlaylist) {
        this.playlist = playlist

        this.update({ 
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

        this.update({ 
            playlist: null, vid: null, playlistVidIdx: null
        })
    }

    /**
     * Update error. Will show error to user if necessary.
     * @param error 
     */
    onError(error: any) {
        if (this.error) return
        console.error(error)

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

        this.update({ error: this.error })
        youtubeAPIErrorHandler(this.error)
    }

    /**
     * Reset data store, clears local storage, resets Youtube Player API
     */
    quit() {
        ytPlayerStore.set(null)
        this.clearYoutubePlayerData()
        this.player.stopVideo()
    }

    removeError() {
        this.error = null
        this.update({ error: null })
    }

    updateFloatPosition(floatLayout: BoxLayout) {
        this.floatLayout = structuredClone(floatLayout)
        this.update({ floatLayout: this.floatLayout })
    }

    setVolume(volume: number) {
        try {
            this.volume = volume
            this.player.setVolume(volume)
            this.update({ volume })
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    /**
     * Hide / show Youtube Player. 
     * Stops current video from playing.
     * Will not inmount player off the dom.
     */
    toggledShowPlayer() {
        this.doShowPlayer = !this.doShowPlayer
        this.player.stopVideo()
        this.update({ doShowPlayer: this.doShowPlayer })
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
        if (newState.isPlaying != undefined)       newStateObj.isPlaying = newState.isPlaying

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
        this.isoVideo  = savedData.isoVideo
        this.volume  = savedData.volume
        this.update({ ...savedData })
    }

    saveStateData() {
        saveYtPlayerData({
            vid:            this.vid!,
            playlist:       this.playlist!,
            playlistVidIdx: this.playlistVidIdx!,
            floatLayout:     this.floatLayout!,
            doShowPlayer:    this.doShowPlayer,
            volume:   this.volume,
            isoVideo: this.isoVideo
        })
    }

    /**
     * Clear youtube user and creds data from local storage. 
     */
    clearYoutubePlayerData() {
        deleteYtPlayerData()
    }
}