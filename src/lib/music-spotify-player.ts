import { spotifyIframeStore, } from "./store"

import { getIFrameMediaUri } from "./api-spotify"
import { APIErrorCode, MediaEmbedType, MusicMediaType, MusicPlatform } from "./enums"
import { initFloatingEmbed } from "./utils-home"
import { loadMusicPlayerState, musicAPIErrorHandler, saveMusicPlayerData } from "./utils-music"
import { APIError } from "./errors"

/**
 * User data class that uses the Spotify iFrame API to play music.
 * The player itself is a svelte store object / reactive class, initialized during instantiation.
 * 
 */
export class SpotifyMusicPlayer {
    controller: any
    mediaItem: Track | PodcastEpisode | AudioBook | null = null
    mediaCollection: Media | null = null

    doShowPlayer = false
    isPlaying = false
    error: any = null

    undisableTimeout: NodeJS.Timeout | null = null

    PLAYER_OPTIONS = {
        uri: '',
        width: '100%',
        height: '100%'
    }
 
    constructor() {
        initFloatingEmbed(MediaEmbedType.Spotify)
        spotifyIframeStore.set(this)
        this.loadAndSetPlayerData()
    }

    /**
     * Initialize Spotify iFrame Player API.
     */
    async initIframePlayerAPI(media: Media) {
        try {
            const _media = media ? media : this.mediaCollection ? this.mediaCollection : this.mediaItem!
            this.PLAYER_OPTIONS.uri = getIFrameMediaUri(_media)
            this.loadSpotifyiFrameAPI()
            await this.waitForPlayerReadyAndSetPlayerInstance()
        }
        catch(error) {
            const msg = "There was an error initialize Spotify Player."
            console.error(msg, error)
            musicAPIErrorHandler(new APIError(APIErrorCode.PLAYER, msg), MusicPlatform.Spotify)
        }
    }

    /**
     * Load the iFrame Player API asynchornously
     */
    loadSpotifyiFrameAPI() {
        const body = document.getElementsByTagName('body')[0]

        const script = document.getElementsByTagName('script')[0]
        script.src = 'https://open.spotify.com/embed/iframe-api/v1'
        script.async = true
        body.appendChild(script)
    }

    /**
     * Allow Spotify iFrame API to attach iframe player on designated HTML Element
     * Wait for this and resolve afterwards.
     */
    waitForPlayerReadyAndSetPlayerInstance(): Promise<void> {
        // @ts-ignore
        return new Promise<void>((resolve) => window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
            const element = document.getElementById('spotify-iframe');
            IFrameAPI.createController(element, this.PLAYER_OPTIONS, (controller: any) => this.createControllerCallback(controller))
            resolve()
        })
    }

    /**
     * Create a controller after initialized to configure the Embed and to control playback.
     * @param controller 
     */
    createControllerCallback(controller: any) {
        this.controller = controller 
        this.controller.addListener('playback_update', (e: any) => {
            console.log(e)
        });
    }

    /**
     * Initialize new resource for iFrame player to play.
     * @param media 
     */
    initNewResource(media: Media) {
        try {
            const uri = getIFrameMediaUri(media)
    
            if ([MusicMediaType.Track, MusicMediaType.PodcastEpisode, MusicMediaType.AudioBook].includes(media.type)) {
                this.mediaItem = media as Track | PodcastEpisode | AudioBook
                this.mediaCollection = null
            }
            else {
                this.mediaCollection = media
                this.mediaItem = null
            }
    
            this.controller!.loadUri(uri)
            this.controller!.play()
            this.updateState({ mediaItem: this.mediaItem, mediaCollection: this.mediaCollection })
        }
        catch(error) {
            const msg = "There was an error playing requested resource."
            console.error(msg, error)
            musicAPIErrorHandler(new APIError(APIErrorCode.PLAYER, msg), MusicPlatform.Spotify)
        }
    }


    /**
     * Update the state of store.
     * Saves to local storage to persist necessary data between refreshes.
     * @param newState  New version of current state
     */
    updateState(newState: Partial<SpotifyMusicPlayer>, doSave: boolean = true) {
        spotifyIframeStore.update((data: SpotifyMusicPlayer | null) => this.getNewStateObj(newState, data! as SpotifyMusicPlayer))

        if (doSave) this.saveState(newState)
    }

    /**
     * Load and set from previous music player session.
     */
    loadAndSetPlayerData() {
        const savedData = loadMusicPlayerState()

        if (!savedData) return

        this.mediaItem =       savedData!.mediaItem
        this.mediaCollection =     savedData!.mediaCollection
        this.doShowPlayer =    savedData!.doShowPlayer
        this.isPlaying =       savedData!.isPlaying

        this.updateState({...savedData }, false)
    }

    /**
     * Saves updated data to persist state between refreshes.
     * Only saves what it needs to.
     */
    saveState(newState: Partial<SpotifyMusicPlayer>) {
        let newData = {} as Partial<SpotifyMusicPlayer>

        if (newState.mediaItem != undefined)       newData.mediaItem = newState.mediaItem
        if (newState.mediaCollection != undefined) newData.mediaCollection = newState.mediaCollection
        if (newState.error != undefined)           newData.error = newState.error
        if (newState.doShowPlayer != undefined)    newData.doShowPlayer = newState.doShowPlayer
        if (newState.isPlaying != undefined)       newData.isPlaying = newState.isPlaying

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
    getNewStateObj(newState: Partial<SpotifyMusicPlayer>, oldState: SpotifyMusicPlayer): SpotifyMusicPlayer {
        const newStateObj = oldState

        if (newState.mediaItem != undefined)          newStateObj!.mediaItem = newState.mediaItem
        if (newState.mediaCollection != undefined)    newStateObj!.mediaCollection = newState.mediaCollection
        if (newState.error != undefined)              newStateObj!.error = newState.error
        if (newState.doShowPlayer != undefined)       newStateObj!.doShowPlayer = newState.doShowPlayer
        if (newState.isPlaying != undefined)          newStateObj!.isPlaying = newState.isPlaying

        return newStateObj
    }
}