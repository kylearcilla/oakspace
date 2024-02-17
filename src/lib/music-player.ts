import { APIErrorCode, MusicPlatform } from "./enums"
import { APIError, type CustomError } from "./errors"
import { musicPlayerManager, musicPlayerStore } from "./store"
import { getPlatformString, musicAPIErrorHandler, removeMusicPlayerData, removeMusicShuffleData } from "./utils-music"

/**
 * @abstract 
 * Defines a common interface for different types of music players
 * ...that interact with popular Music Platform APIs (e.g., Spotify, Youtube Music, Apple Music).
 */
export abstract class MusicPlayer {
    abstract currentIdx: number

    // media item will always be playing on the player never collection
    abstract mediaItem: Track | PodcastEpisode | AudioBook | null
    abstract mediaCollection: Media | null

    // all
    abstract error: CustomError | null
    abstract doShowPlayer: boolean
    abstract isPlaying: boolean
    abstract isDisabled: boolean
    abstract isRepeating: boolean
    abstract isBuffering: boolean
    abstract isShuffled: boolean
    abstract isPlayingLive: boolean
    
    // spotify only
    abstract currentDuration: number
    abstract currentPosition: number

    // used to disallow updates if old data is still present after skip or seek
    abstract hasSeekedTo: number
    abstract hasItemUpdated: boolean
    abstract doAllowUpdate: boolean
    
    serverURL = "http://localhost:3000/"

    abstract init(param?: any): Promise<void>;
    abstract togglePlayback(): void;
    abstract skipToNextTrack(): void;
    abstract skipToPrevTrack(): void;
    abstract toggleShuffle(): void;
    abstract toggleRepeat(): void;
    abstract seekTo(time: number): void;
    
    abstract updateMediaCollection(collectionContext: MediaClickedContext): Promise<void>
    abstract loadCurrentItem(doPlay: boolean): void
    abstract removeCurrentCollection(): void
    
    abstract updateState(newPlayerState: Partial<MusicPlayerState>): void
    abstract resetMusicPlayerStateToEmptyState(): void

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

    deleteMusicPlayerData() {
        if (this.isShuffled) { 
            removeMusicShuffleData()
        }
        removeMusicPlayerData()
    }  


    onError(error: any, platform: MusicPlatform) {
        console.error(error)
        this.error = error

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