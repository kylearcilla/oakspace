import type { CustomError } from "./errors"

/**
 * @abstract 
 * Defines a common interface for different types of music players
 * ...that interact with popular Music Platform APIs (e.g., Spotify, Youtube Music, Apple Music).
 */
export abstract class MusicPlayer {
    abstract currentIdx: number
    abstract track: Track | null
    abstract collection: MusicCollection | null
    abstract error: CustomError | null
    abstract doShowPlayer: boolean
    abstract isPlaying: boolean
    abstract isDisabled: boolean
    abstract isRepeating: boolean
    abstract isShuffled: boolean
    abstract hasCollectionJustEnded: boolean
    abstract hasReachedEnd: boolean

    serverURL = "http://localhost:3000/"

    abstract togglePlayback(): void;
    abstract skipToNextTrack(): void;
    abstract skipToPrevTrack(): void;
    abstract toggleShuffle(): void;
    abstract toggleRepeat(): void;
    abstract queueAndPlayNextTrack(playlistId: string, newIndex: number): void
    abstract quitPlayer(): void;

    abstract updateCurrentCollectionAndPlay(newCurrentPlaylist: MusicCollection): void
    abstract updateCurrentCollectionIdx(newIndex: number): void
    abstract removeCurrentMusicCollection(): void
    
    abstract hideMusicPlayer(): void;
    abstract updateMusicPlayerState(newPlayerState: MusicPlayerState): void
    abstract resetMusicPlayerStateToEmptyState(): void
}


/**
 * @interface
 * An music player object that keeps store state and saves it between re-freshes.
 */
export interface MusicPlayerStore<T> {
    updateMusicPlayerState(newState: Partial<T>): void
    getNewStateObj(newState: Partial<T>, oldState: T): T
    loadAndSetPlayerData(): void
    saveState(): void
    deleteMusicPlayerData(): void
}