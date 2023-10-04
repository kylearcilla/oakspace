import { get } from "svelte/store"
import { ErrorCode } from "./enums"
import { ytPlayerStore } from "./store"
import { type CustomError, ApiError } from "./errors"
import { getPlayListDetails, getVidDetails } from "./api-youtube"
import { deleteVidIdx, deleteYoutubePlaylistData, deleteYoutubeVidData, loadVidIdx, 
         loadYtPlaylistData, loadYtVidData, saveVidIdx, saveYoutubePlaylistData, saveYoutubeVidData } 
        from "./utils-youtube"

/**
 * Youtube Player class for initializing a Youtube iFrame Player using YouTube Player API
 * Is itself a store / reactive class (initialized in instantiation).
 * Offers methods to control player. Used to play playlists only.
 * Decoupled from Youtube Data. 
 */
export class YoutubePlayer {
    // @ts-ignore
    player: any
    vid: YoutubeVideo | null = null
    playlist: YoutubePlaylist | null = null
    playlistVidIdx: number | null = null
    error: CustomError | null = null
        
    IFRAME_CLASS = "home-yt-player"
    YT_PLAYER_OPTIONS: YoutubePlayerOptions = {
        height: "100%",
        width: "100%",
        playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
            volume: 50
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
        this.initEventHandlers()
    }

    /**
     * Initialize Youtbe iFrame Player API.
     * If there's data from a previous session, play that playlist and update video details.
     * 
     * @throws  {ApiError}    Error initializing iFrame Player. Issue with saved playlist.
     */
    initYtPlayer = async () => {
        try {
            await this.intIframePlayerAPI()

            if (!this.playlist) return
            this.playPlaylist(this.playlist)
            this.updateVideo(this.vid!)
        }
        catch(e) {
            if (e instanceof TypeError) return
            throw e
        }
    }

    /**
     * Initialize iFrame Player API asynchrnously
     * @throws  {ApiError}   Error initializing iFrame Player API
     */
    intIframePlayerAPI = async () => {
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
    setYoutubeScript = () => {
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
    waitForPlayerReadyAndSetPlayerInstance = (): Promise<void> => {
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
    quitPlayer = () => {
        ytPlayerStore.set(null)
        this.clearYoutubeUserData()
        // @ts-ignore
        window.onYouTubeIframeAPIReady = null
        document.getElementById("player")!.remove()
    }

    /**
     * Update data store for Youtube Player.
     * @param newData  Incorporate new data from here.
     */
    updateYtPlayerState = (newData: YoutubePlayer) => {
        ytPlayerStore.update((data: YoutubePlayer | null) => ({ ...data!, ...newData }))
    }

    /**
     * When player has been successfully initiated. 
     * Called when initiated the first time or after refreshes.
     * Sets playlist / video where user left off.
     * 
     * @throws {ResourceNotFoundError}     Occurs if playlist or first video of a playlist cannot (deleted, private, doesn't exist)
     * @throws {ApiError}                  Error working Youtube Data API
     */
    onYtPlayerReadyHandler = async () => {
        if (!this.playlist?.id) return 

        // after a refresh, player will be initialized by not active, cannot set the video from state event listener
        if (!this.playlistVidIdx) {
            let firstVidId = this.playlist.firstVidId ?? (await this.getYtPlaylist(this.playlist.id)).firstVidId

            const vid = await this.getVideoDetails(firstVidId!)
            this.updateVideo(vid)
        }

        this.player?.cuePlaylist({ list: this.playlist!.id,  listType: "playlist", playlistVidIdx: this.playlistVidIdx })
    }

    /**
     * On state changed handler. Only registers case where playlist is replaced / vid changes.
     * Update the current video details.
     * 
     * @throws {ResourceNotFoundError}     Occurs if next video of a playlist cannot (deleted, private, doesn't exist)
     * @throws {ApiError}                  Error working Youtube Data API
     */
    onVidIdxChangedHandler = async (e: any) => {
        const vidId = this.player?.getVideoData().video_id
        if (e.data < 0 || e.data === 5 || !this.playlist || vidId === this.vid?.id) return

        const playlistVidIdx = this.player?.getPlaylistIndex()
        const vid = await this.getVideoDetails(vidId)
        this.updateVideo(vidId)

        this.playlistVidIdx = playlistVidIdx
        this.updateYtPlayerState({ ...get(ytPlayerStore)!, playlistVidIdx, vid })

        saveYoutubeVidData(vid)
        saveVidIdx(playlistVidIdx)
    }

    /**
     * @param error   Error returned by Youtube Player API
     */
    onYtErrorHandler = (error: any) => {
        this.setError(error)
        console.error(error)
    }

    /**
     * Initialize event handlers for iFrame Player to be used.
     * Youtube Player state updates are triggered by events dispatched from Youtube API.
     */
    initEventHandlers = () => {
        this.YT_PLAYER_OPTIONS.events.onReady = this.onYtPlayerReadyHandler
        this.YT_PLAYER_OPTIONS.events.onStateChange = this.onVidIdxChangedHandler
        this.YT_PLAYER_OPTIONS.events.onError = this.onYtErrorHandler
    }

    /**
     * Triggers when user wants to play a new playlist.
     * @throws {ResourceNotFoundError}    Occurs when playlist is privated, deleted, or doesn't not exist.
     * @throws {ApiError}                 Error working Youtube Data API
     */
    playPlaylist = async (playlist: YoutubePlaylist) => {
        if (this.error?.code === ErrorCode.YT_PRIVATE_PLAYLIST) this.removeError()
        this.player.stopVideo()
        
        try {
            await this.getYtPlaylist(playlist.id)
        }
        catch {
            this.removeCurrentPlaylist()
            return 
        }

        this.updateCurrentPlaylist(playlist)
        this.player!.loadPlaylist({ list: playlist.id, listType: "playlist", index: 0 })
    }

    /**
     * Update error.
     * 
     * @param error 
     */
    setError = (error: CustomError) => {
        this.error = error
        this.updateYtPlayerState({ ...get(ytPlayerStore)!, error })
    }

    /**
     * Remove current error.
     */
    removeError = () => {
        this.error = null
        this.updateYtPlayerState({ ...get(ytPlayerStore)!, error: null })
    }

    /**
     * Update the video being shown in the video details under the player.
     * @param vid   Video currentply playing
     */
    updateVideo = (vid: YoutubeVideo) => {
        this.vid = vid
        this.updateYtPlayerState({ ...get(ytPlayerStore)!, vid })
        saveYoutubeVidData(vid)
    }

    /**
     * Get video details. Called when a playlist is initialized and playlist video changes.
     * @param ytVidId        Id of video requested.
     * @throws {ResourceNotFoundError}    Occurs when vid is privated, deleted, or doesn't not exist.
     * @throws {ApiError}                 Error working Youtube Data API
     */
    getVideoDetails = async (ytVidId: string) => {
        try {
            return await this.getYtVidDetails(ytVidId)
        }
        catch(error: any) {
            this.setError(error)
            throw error
        }
    }

    /**
     * Update the playlist being played.
     * @param playlist       Playlist user wants to play
     */
    updateCurrentPlaylist = (playlist: YoutubePlaylist) => {
        this.playlist = playlist
        this.updateYtPlayerState({ ...get(ytPlayerStore)!, playlist })
        saveYoutubePlaylistData(playlist)
        return playlist
    }

    removeCurrentPlaylist = () => {
        this.player.stopVideo()

        this.playlist = null
        this.vid = null
        this.playlistVidIdx = null

        this.updateYtPlayerState({ ...get(ytPlayerStore)!, playlist: null, vid: null, playlistVidIdx: null })

        deleteYoutubePlaylistData()
        deleteVidIdx()
        deleteYoutubeVidData()
    }

    /**
     * Fetch an individual Youtube Playlist to display info in "Not Playing" section.
     * @param playlistId                  Id of new playlist.
     * @returns                           Youtube playlist data.
     * @throws {ResourceNotFoundError}    Occurs when vid is privated, deleted, or doesn't not exist.
     * @throws {ApiError}                 Error working Youtube Data API
     */
    getYtPlaylist = async (playlistId: string): Promise<YoutubePlaylist> => {
        try {
            return await getPlayListDetails(playlistId)
        }
        catch(error: any) {
            const e = error
            e.code = ErrorCode.YT_PRIVATE_PLAYLIST
            this.setError(e)
            throw e
        }
    }

    /**
     * Fetch an individual Youtube Video to display info the description section of the Youtube Player.
     * @returns                           Youtube video data.
     * @throws {ResourceNotFoundError}    Occurs when vid is privated, deleted, or doesn't not exist.
     * @throws {ApiError}                 Error working Youtube Data API
     */
    getYtVidDetails = async (vidId: string): Promise<YoutubeVideo> => {
        try {
            return await getVidDetails(vidId)
        }
        catch(error: any) {
            const e = error
            e.code = ErrorCode.YT_PRIVATE_VIDEO
            this.setError(e)
            throw e
        }
    }

    /**
     * Load youtube creds and user data from local storage.
     * Called everytime user refreshes and Yotube Data has to be re-initialized.
     */
    loadAndSetPlayerData = () => {
        const playlist = loadYtPlaylistData()
        const playlistVidIdx = loadVidIdx() ?? 0
        const vid = loadYtVidData()

        this.playlist = playlist
        this.playlistVidIdx = playlistVidIdx
        this.vid = vid

        this.updateYtPlayerState({ ...get(ytPlayerStore)!, playlist, playlistVidIdx, vid })
    }

    /**
     * Clear youtube user and creds data from local storage. 
     */
    clearYoutubeUserData = () => {
        deleteYoutubePlaylistData()
        deleteYoutubeVidData()
        deleteVidIdx()
    }
}