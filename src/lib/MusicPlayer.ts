import type { MusicData } from "./MusicData" 

export abstract class MusicPlayer {
    abstract isPlaying: boolean 
    abstract musicPlayerData: MusicPlayerData
    abstract musicData: MusicData

    serverURL = "http://localhost:3000/"

    abstract togglePlayback(): void;
    abstract resetMusicPlayerData(): void;
    abstract skipToNextTrack(): void;
    abstract skipToPrevTrack(): void;
    abstract toggleShuffle(): void;
    abstract toggleRepeat(): void;
    abstract queueAndPlayNextTrack(playlistId: string, newIndex: number): void
}