import { ytPlayerStore } from "./store"

import { APIError } from "./errors"
import { APIErrorCode } from "./enums"
import { youtubeAPIErrorHandler } from "./utils-youtube"
import { getVidDetails, getYtIframeAPIError } from "./api-youtube"
import { loadYtPlayerData, saveYtPlayerData, deleteYtPlayerData, setYoutubeScript } from "./utils-youtube"


export class YoutubePlayer {
    player: any

    vid: YoutubeVideo | null = null
    playlist: YoutubePlaylist | null = null
    playlistClicked: YoutubePlaylist | null = null
    playlistVidIdx: number | null = null
    
    iFrameVidId = ""
    isPlaying = false
    isRepeating = false
    isShuffled = false
    show = true

    loadedBefore = false
    isFetchingVid = false
    volume = 50

    // is playing isolated video
    isoVideo = false
    error: any = null
    state = -1
        
    static readonly IFRAME_ID = "yt-player"
    readonly LOAD_PREV_PLAYER_STATE_DELAY = 1000
    readonly AUTO_PLAY_DELAY = 1200
    readonly READY_DELAY = 2000

    options: any = {
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
        this.loadData()
    }

    async initYtPlayer() {
        try {
            await this.initIframePlayerAPI()
        }
        catch(error: any) {
            this.onError(new APIError(APIErrorCode.PLAYER, "There was a problem initializing the Youtube Player. Please try again later."))
            
            if (!this.loadedBefore) {
                this.quit()
            }
        }
    }

    /* API Initialization */

    initIframePlayerAPI = async () => {
        this.initEventHandlers()

        // initialize API if not already
        if (!window.YT) {
            setYoutubeScript()
            await this.initPlayerOnAPIReady()
        }
        else {
            this.initPlayerInstance()
        }
    }

    initPlayerOnAPIReady() {
        return new Promise<void>((resolve) => window.onYouTubeIframeAPIReady = () => {
            this.initPlayerInstance()
            resolve()
        })
    }

    initPlayerInstance() {
        this.player = new YT.Player(YoutubePlayer.IFRAME_ID, this.options)
    }

    initEventHandlers() {
        this.options.events.onReady = this.onYtPlayerReadyHandler
        this.options.events.onStateChange = this.oniFrameStateChanged
        this.options.events.onError = this.onIframeError
    }

    onIframeError = (error: any) => {
        const { data: errorCode, target } = error

        if (errorCode === null || errorCode === undefined) return
        this.onError(getYtIframeAPIError(errorCode, target))
    }


    update(newData: Partial<YoutubePlayer>) {
        ytPlayerStore.update((data) => (this.getNewStateObj(newData, data!)))
        
        saveYtPlayerData({
            vid:            this.vid!,
            playlist:       this.playlist!,
            playlistVidIdx: this.playlistVidIdx!,
            isRepeating:    this.isRepeating,
            isShuffled:     this.isShuffled,
            volume:         this.volume,
            show:           this.show,
            isoVideo:       this.isoVideo
        })
    }

    /* handlers */

    /**
     * When player has been successfully initiated. 
     * Called when initiated the first time or after refreshes.
     * Sets playlist / video where user left off.
     */
    onYtPlayerReadyHandler = async () => {

        // save the state from previous session
        if (this.loadedBefore) {
            setTimeout(() => {
                this.toggleRepeat(this.isRepeating)
                this.toggleShuffle(this.isShuffled)
                this.setVolume(this.volume)

            }, this.LOAD_PREV_PLAYER_STATE_DELAY)
        }

        try {
            if (this.isoVideo) {
                this.player.cueVideoById({ 
                    videoId: this.vid!.id
                })
            }
            else if (this.playlist) {
                this.player.cuePlaylist({ 
                    listType: "playlist",
                    list:  this.playlist.id,  
                    index: this.playlistVidIdx,  
                    startSeconds: 0 
                })
            }
        }
        catch(e: any) {
            this.onError(APIErrorCode.PLAYER)
        }

        this.loadedBefore = true
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
        const player = event.target
        const state = event.data

        this.state = state

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

    /* controls */

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

    toggleRepeat(doRepeat?: boolean): void {
        try {
            this.isRepeating = doRepeat != undefined ? doRepeat : !this.isRepeating 

            this.player.setLoop(this.isRepeating)
            this.update({ isRepeating: this.isRepeating })
        }
        catch(e) {
            this.onError(e)
        }
    }

    toggleShuffle(doShuffle?: boolean): void {
        try {
            this.isShuffled = doShuffle != undefined ? doShuffle : !this.isShuffled 
            this.player.setShuffle(this.isShuffled)
            this.update({ isShuffled: this.isShuffled })
        }
        catch (error: any) {
            this.onError(error)
        }
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
     * Get the current player from the API itself.
     */
    calibrateVolume() {
        if (this.player) {
            this.volume = this.player.getVolume()
            this.update({ volume: this.volume })
        }
    }

    toggleShow(doShow?: boolean) {
        this.show = doShow === undefined ? !this.show : doShow
        this.update({ show: this.show })

        if (this.show) {
            this.player.playVideo()
        }
        else {
            this.player.pauseVideo()
        }
    }

    async playVideo(video: YoutubeVideo) {    
        if (this.error) {
            this.removeError()
        }
        if (this.state === 3 ){
            return   // if a prev loaded vid was buffering do not cue a new playlist
        }

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
            this.player.loadVideoById(video.id)
        }
        catch(e: any) {
            this.onError(e)
        }
    }

    async playPlaylist(playlist: YoutubePlaylist, startingIdx = 0) {    
        if (this.error) {
            this.removeError()
        }
        if (this.state === 3 ) {
            return   // if a prev loaded vid was buffering do not cue a new playlist
        }

        this.isoVideo = false
        this.update({ isoVideo: false })

        try {
            if (!this.player.stopVideo) {
                window.location.reload()
                return
            }

            this.player.stopVideo()
            this.updateCurrentPlaylist(playlist)
            this.player.loadPlaylist({ 
                list: playlist.id, 
                listType: "playlist", 
                index: startingIdx
            })
        }
        catch(e: any) {
            this.onError(e)
        }
    }

    updateVideo(vid: YoutubeVideo, playlistVidIdx: number) {
        this.vid = vid

        if (!this.isoVideo) {
            this.playlistVidIdx = playlistVidIdx
        }
        this.update({ vid, playlistVidIdx })
    }

    updateCurrentPlaylist(playlist: YoutubePlaylist | null) {
        this.playlist = playlist

        this.update({ 
            playlist,
            playlistVidIdx: playlist ? 0 : null
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

    onError(error: any) {
        if (this.error) return

        const notLoaded = /^this\.player\.\w+\s*is not a function$/.test(error.message)

        if (notLoaded) {
            this.error = new APIError(APIErrorCode.PLAYER, "Just a moment! The player is still loading.")
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

    quit() {
        ytPlayerStore.set(null)
        this.clearYoutubePlayerData()

        if (this.player) {
            this.player.stopVideo()
        }
    }

    removeError() {
        this.error = null
        this.update({ error: null })
    }

    getNewStateObj(newState: Partial<YoutubePlayer>, oldState: YoutubePlayer) {
        const newStateObj = oldState

        if (newState.vid != undefined)             newStateObj.vid = newState.vid
        if (newState.playlist != undefined)        newStateObj.playlist = newState.playlist
        if (newState.playlistVidIdx != undefined)  newStateObj.playlistVidIdx = newState.playlistVidIdx
        if (newState.volume != undefined)            newStateObj.volume = newState.volume
        if (newState.isPlaying != undefined)       newStateObj.isPlaying = newState.isPlaying
        if (newState.isRepeating != undefined)     newStateObj.isRepeating = newState.isRepeating
        if (newState.isShuffled != undefined)      newStateObj.isShuffled = newState.isShuffled
        if (newState.isoVideo != undefined)      newStateObj.isoVideo = newState.isoVideo
        if (newState.show != undefined)      newStateObj.show = newState.show

        return newStateObj
    }

    loadData() {
        const savedData = loadYtPlayerData()
        if (!savedData) return

        this.loadedBefore = true
        this.volume = savedData.volume
        this.show = savedData.show

        this.update({ ...savedData })
    }

    clearYoutubePlayerData() {
        deleteYtPlayerData()
    }
}