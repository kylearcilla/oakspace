import { APIErrorCode, MusicPlatform } from "./enums"
import { APIError, type CustomError } from "./errors"
import { getPlatformString, musicAPIErrorHandler } from "./utils-music"

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

    abstract error: CustomError | null
    abstract doShowPlayer: boolean
    abstract isPlaying: boolean
    abstract isDisabled: boolean
    abstract isRepeating: boolean
    abstract isBuffering: boolean
    abstract isShuffled: boolean
    abstract hasCollectionJustEnded: boolean
    abstract hasReachedEnd: boolean
    abstract currentDuration: number
    abstract currentPosition: number
    abstract doAllowUpdate: boolean
    abstract hasItemUpdated: boolean
    abstract hasSeekedTo: number
    abstract isPlayingLive: boolean

    serverURL = "http://localhost:3000/"

    abstract togglePlayback(): void;
    abstract skipToNextTrack(): void;
    abstract skipToPrevTrack(): void;
    abstract toggleShuffle(): void;
    abstract toggleRepeat(): void;
    // abstract queueAndPlayMedia(playlistId: string, newIndex: number): void
    abstract quit(): void;
    abstract seekTo(time: number): void;

    abstract updateMediaCollection(collectionContext: MediaClickedContext): void
    // abstract updateMediaCollectionIdx(newIndex: number): void
    abstract removeCurrentCollection(): void
    
    abstract toggleShow(doSHow: boolean): void;
    abstract updateState(newPlayerState: MusicPlayerState): void
    abstract resetMusicPlayerStateToEmptyState(): void

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