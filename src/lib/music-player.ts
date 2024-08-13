import { APIErrorCode, MusicPlatform } from "./enums"
import { APIError, type CustomError } from "./errors"
import { MusicPlaylistShuffler } from "./music-playlist-shuffler"
import { musicPlayerManager, musicPlayerStore } from "./store"
import { getPlatformString, loadMusicPlayerData, musicAPIErrorHandler, removeMusicPlayerData, saveMusicPlayerData } from "./utils-music"

/**
 * @abstract 
 * Defines a common interface for different types of music players
 * ...that interact with popular Music Platform APIs (e.g., Spotify, Youtube Music, Apple Music).
 */
export abstract class MusicPlayer {
    mediaItem:       Media | null = null
    mediaCollection: MediaCollection | null = null

    currentIdx = -1

    // player state
    error: CustomError | null = null
    doShowPlayer  = false
    isPlaying     = false
    isDisabled    = false
    isRepeating   = false
    isBuffering   = false
    isShuffled    = false
    isLive        = false
    justLoaded    = false
    justInit      = false
    
    progressMs = 0
    durationMs = 0
    isMuted = false
    volume  = 25

    musicPlaylistShuffler: MusicPlaylistShuffler | null = null

    // used to disallow updates if old data is still present after skip or seek
    hasSeekedTo    = -1
    hasItemUpdated = false
    hasReachedEnd  = false
    doAllowUpdate  = true

    platform: MusicPlatform = MusicPlatform.YoutubeMusic

    abstract init(justInit: boolean): Promise<void>;
    abstract togglePlayback(): void;
    abstract toggleMute(): void;
    abstract skipToNextTrack(): void;
    abstract skipToPrevTrack(): void;
    abstract seekTo(time: number): void;
    abstract setVolume(volume: number): void;
    
    abstract updateMediaCollection(collectionContext: MediaClickedContext): Promise<void>
    abstract playMediaCollection(): void
    abstract updateState(newPlayerState: Partial<MusicPlayerState>, doSave?: boolean): void

    updateMediaTime(posMs: number, durMs: number) {
        this.progressMs = posMs
        this.durationMs = durMs
    }

    toggleRepeat(): void {
        try {
            this.isRepeating = !this.isRepeating
            this.updateState({ isRepeating: this.isRepeating })
        }
        catch(e) {
            this.onError(e, this.platform)
        }
    }

    toggleShuffle(flag?: boolean): void {
        try {
            const media = this.mediaCollection
            const currIndex = this.currentIdx

            this.isShuffled = flag != undefined ? flag : !this.isShuffled    
            this.hasReachedEnd = false

            if (this.isShuffled) {
                this.musicPlaylistShuffler = new MusicPlaylistShuffler(currIndex, media!.length)
            }
            else {
                this.musicPlaylistShuffler!.quit()
                this.musicPlaylistShuffler = null
            }
    
            this.updateState({ isShuffled: this.isShuffled })
        }
        catch (error: any) {
            console.error("There was an error toggling shuffle.")
            this.onError(error, this.platform)
        }
    }

    /**
     * If track is close from the beginning, then resetart.
     * @returns Should restart current track
     */
    shouldRestartTrackAfterSkipPrev() {
        const trackProgressPerc = (this.progressMs / this.durationMs) * 100
        return !this.isRepeating && (this.currentIdx === 0 || trackProgressPerc > 15)   
    }

    toggleShow(doShow: boolean) {
        this.doShowPlayer = doShow
        this.updateState({ doShowPlayer: doShow })
    }

    undisablePlayer() {
        this.isDisabled = false
        this.updateState({ isDisabled: false })
    }

    disablePlayer() {
        this.isDisabled = true
        this.updateState({ isDisabled: true })
    }

    quit() {
        this.deleteMusicPlayerData()
        musicPlayerStore.set(null)
        musicPlayerManager.set(null)
    }

    /**
     * Load and set from previous music player session.
     */
    loadAndSetPlayerData() {
        const savedData = loadMusicPlayerData()
        if (!savedData) return

        this.mediaItem       =  savedData!.mediaItem
        this.mediaCollection =  savedData!.mediaCollection
        this.currentIdx      =  savedData!.currentIdx

        this.isRepeating     =  savedData!.isRepeating
        this.isShuffled      =  savedData!.isShuffled
        this.volume          =  savedData!.volume
        this.isMuted         =  savedData!.isMuted
        this.doShowPlayer    =  savedData!.doShowPlayer
        this.justInit        =  savedData!.justInit    
        this.isPlaying       = false
        
        this.updateState({...savedData }, false)
    }

    /**
     * Saves updated data to persist state between refreshes.
     * Only saves what it needs=.
     */
    saveState() {
        let newData = {} as MusicPlayer

        newData.mediaItem       = this.mediaItem
        newData.mediaCollection = this.mediaCollection
        newData.currentIdx      = this.currentIdx
        newData.volume          = this.volume
        newData.isMuted         = this.isMuted

        newData.isRepeating  = this.isRepeating
        newData.isShuffled   = this.isShuffled
        newData.doShowPlayer = this.doShowPlayer

        saveMusicPlayerData(newData)
    }

    /**
     * Delete player data.
     */
    deleteMusicPlayerData() {
        removeMusicPlayerData()
    }


    onError(error: any, platform: MusicPlatform) {
        console.error(error)
        this.error = error
        platform = MusicPlatform.YoutubeMusic

        if (error instanceof APIError) {
            musicAPIErrorHandler(error, platform)
        }
        else {
            musicAPIErrorHandler(new APIError(APIErrorCode.PLAYER, `There was an error with ${getPlatformString(platform)}. Please try again later.`))
        }
    }
}


/**
 * @interface
 * An music player object that keeps store state and saves it between re-freshes.
 */
export interface MusicPlayerStore<T> {
    updateState(newState: Partial<T>): void
    getNewStateObj(newState: Partial<T>, oldState: T): T
    loadAndSetPlayerData(): void
    saveState(newState: Partial<T>): void
    deleteMusicPlayerData(): void
}