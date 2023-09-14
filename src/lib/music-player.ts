import type { MusicData } from "./music-data" 

export abstract class MusicPlayer {
    abstract musicPlayerData: MusicPlayerData
    abstract musicData: MusicData

    serverURL = "http://localhost:3000/"

    abstract updateMusicPlayerData(newMusicPlayerData: MusicPlayerData): void
    abstract togglePlayback(): void;
    abstract resetMusicPlayerData(): void;
    abstract resetMusicPlayerDataToEmptyState(): void
    abstract skipToNextTrack(): void;
    abstract skipToPrevTrack(): void;
    abstract toggleShuffle(): void;
    abstract toggleRepeat(): void;
    abstract queueAndPlayNextTrack(playlistId: string, newIndex: number): void
}