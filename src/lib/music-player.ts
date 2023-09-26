import type { MusicData } from "./music-data-apple" 

/**
 * Defines a common interface for different types of music players
 * ...that interact with popular Music Platform APIs (e.g., Spotify, Youtube Music, Apple Music).
 */
export abstract class MusicPlayer {
    abstract musicData: MusicData
    abstract state: MusicPlayerState

    serverURL = "http://localhost:3000/"

    abstract togglePlayback(): void;
    abstract skipToNextTrack(): void;
    abstract skipToPrevTrack(): void;
    abstract toggleShuffle(): void;
    abstract toggleRepeat(): void;
    abstract queueAndPlayNextTrack(playlistId: string, newIndex: number): void
    abstract quitPlayer(): void;
    
    abstract hideMusicPlayer(): void;
    abstract updateMusicPlayerState(newPlayerState: MusicPlayerState): void
    abstract resetMusicPlayerStateToEmptyState(): void
}