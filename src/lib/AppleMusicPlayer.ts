import type { Writable } from "svelte/store";
import type { MusicData } from "./MusicData";
import { formatTime } from "./helper";
import { curentPlaylist, musicPlayerData } from "./store";
import { getArtwork } from "./apple-music-api";
import { MusicPlayer } from "./MusicPlayer";
import { MusicPlaylistShuffler } from "./PlaylistShuffler"

/**
 * A class representing an Apple Music player instance that extends MusicPlayer.
 * @extends MusicPlayer
 * 
 */

export class AppleMusicPlayer extends MusicPlayer {
    musicKit: any = null
    musicPlayerInstance: any;
    musicData: MusicData;
    musicPlayerData: MusicPlayerData  = {
        message: "",
        doShowPlayer: false,
        isCurrentlyPlaying: false,
        isDisabled: true,
        isRepeating: false,
        isShuffled: false
    }
    
    musicPlayerState: Writable<MusicPlayerData> 
    isPlaying: boolean = false

    musicPlaylistShuffler: MusicPlaylistShuffler | null = null

    PLAYING_STATE = 2
    PAUSED_STATE = 3
    PLAYLIST_END_STATE = 10

    /* Global Store Data */
    constructor(musicData: MusicData) {
        super();
        this.musicData = musicData
        this.initMusicPlayerData()

        this.musicPlayerState = musicPlayerData
        
        // @ts-ignore
        this.musicKit = MusicKit
        this.musicPlayerInstance = this.musicKit.getInstance()

        this.attachEventListeners()
    }

    /* Load data for state persistence */
    initMusicPlayerData = () => {
        const musicPlayerData = this.loadMusicPlayerData() ?? this.musicPlayerData
        this.updateMusicPlayerData(musicPlayerData)

        setTimeout(() => {
            // @ts-ignore
            this.musicPlayerInstance = MusicKit.getInstance()
            if (!this.musicPlayerInstance) {
                this.musicPlayerState.update((data: any) => { return { ...data, message: "Music Kit Unavailable!", doShowPlayer: false } })
                return
            }

            this.musicPlayerInstance.setQueue({
                playlist: this.musicData.currentPlaylist?.id, 
                startWith: this.musicData.currentPlaylist?.currentIndex 
            });

            this.musicPlayerState.update((data: any) => { return { ...data, message: "READY!", isDisabled: false }} )
        }, 700);
    }

    private loadMusicPlayerData = () => {
        if (!localStorage.getItem("music-player-data")) return null
    
        return JSON.parse(localStorage.getItem("music-player-data")!)
    }
     
    /* Init Event Listeners */
    private attachEventListeners = () => {
        this.musicPlayerState.update((data: any) => {
            return { ...data, message: "Web Comnponents Loaded!", doShowPlayer: true }
        })

        this.musicPlayerInstance.addEventListener("nowPlayingItemWillChange", this.nowPlayingItemWillChangeHandler);
        this.musicPlayerInstance.addEventListener("playbackTimeDidChange", this.playbackTimeDidChangeHandler);
        this.musicPlayerInstance.addEventListener("mediaPlaybackError", this.mediaPlaybackErrorHandler);
        this.musicPlayerInstance.addEventListener("mediaCanPlay", this.mediaCanPlayHandler);
        this.musicPlayerInstance.addEventListener("queuePositionDidChange", this.queuePositionDidChangeHandler);
        this.musicPlayerInstance.addEventListener("playbackStateDidChange", this.playbackStateDidChangeHandler);
    }

    /* Player Data */
    getMusicPlayerData(): MusicPlayerData | null {
        return this.musicPlayerData
    }
    updateMusicPlayerData(newMusicPlayerData: MusicPlayerData) {
        this.musicPlayerData = newMusicPlayerData

        localStorage.setItem("music-player-data", JSON.stringify(newMusicPlayerData))
    }
    resetMusicPlayerData() {
        if (this.musicPlayerData.isShuffled) this.musicPlaylistShuffler = null

        this.musicPlayerData = {
            message: "",
            doShowPlayer: false,
            isCurrentlyPlaying: false,
            isDisabled: true,
            isRepeating: false,
            isShuffled: false
        }
    }

    /* Controls */
    async togglePlayback() {
        this.musicPlayerData.isDisabled = true
        if (this.musicPlayerInstance.isPlaying) {
            await this.musicPlayerInstance.pause()
            this.isPlaying = false
        } else {
            await this.musicPlayerInstance.play()
            this.isPlaying = true
        }
        this.musicPlayerData.isDisabled = false
    }
    skipToNextRandomTrack = async () => {
        this.musicPlayerData.isDisabled = true
        let nextIndex = this.musicPlaylistShuffler!.getNextIndex()

        if (nextIndex < 0 && this.musicPlaylistShuffler!.hasChunksLeft()) {
            this.musicPlaylistShuffler!.handlePlaylistHasEnded()
            nextIndex = this.musicPlaylistShuffler!.getNextIndex()
        }

        if (nextIndex < 0 && this.musicPlaylistShuffler!.hasCompleted) {
            this.musicPlaylistShuffler!.resetPlaylistShuffler()
            nextIndex = this.musicPlaylistShuffler!.getNextIndex()

            this.musicData.updateCurrentPlaylistIdx(nextIndex)
            this.queueAndPlayNextTrack(this.musicData.currentPlaylist!.id, nextIndex)
        }
        else if (nextIndex < 0) {
            this.musicData.updateCurrentPlaylistIdx(this.musicPlaylistShuffler!.startingIndex)
            if (this.musicPlayerData.isRepeating) {
                this.musicPlaylistShuffler!.resetPlaylistShufflerForRepeat()
                this.queueAndPlayNextTrack(this.musicData.currentPlaylist!.id, this.musicPlaylistShuffler!.startingIndex)
            } else {
                this.queueAndPlayNextTrack(this.musicData.currentPlaylist!.id, this.musicPlaylistShuffler!.startingIndex, false)
                this.musicPlaylistShuffler!.hasCompleted = true
            }
        } else {
            this.musicPlaylistShuffler!.handlePlaylistHasEnded()
            this.musicData.updateCurrentPlaylistIdx(nextIndex)
            this.queueAndPlayNextTrack(this.musicData.currentPlaylist!.id, nextIndex)
        }

    }
    skipToNextTrack(): void {
        this.musicPlayerData.isDisabled = true
        if (this.musicPlayerData.isShuffled) {
            this.skipToNextRandomTrack()
            return
        }

        const nextIndex = this.musicData.getNextPlaylistIndex()
        this.musicData.updateCurrentPlaylistIdx(nextIndex)
        this.queueAndPlayNextTrack(this.musicData.currentPlaylist!.id, nextIndex)
    }
    skipToPrevTrack(): void {
        this.musicPlayerData.isDisabled = true
        const nextIndex = this.musicData.getPrevPlaylistIndex()

        this.musicData.updateCurrentPlaylistIdx(nextIndex)
        this.queueAndPlayNextTrack(this.musicData.currentPlaylist!.id, nextIndex)
    }
    queueAndPlayNextTrack = async (playlistId: string, newIndex: number, doPlay: boolean = true) => {
        await this.musicPlayerInstance.setQueue({ playlist: playlistId, startWith: newIndex });
        if (doPlay) this.musicPlayerInstance.play()
        this.musicPlayerData.isDisabled = false
    }
    toggleShuffle(): void {
        this.musicPlayerData.isShuffled = !this.musicPlayerData.isShuffled

        if (this.musicPlayerData.isShuffled) {
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(
                    this.musicData.currentPlaylist!.currentIndex, 
                    this.musicData.currentPlaylist!.songCount, 
                )
        }
        else {
            this.musicPlaylistShuffler = null
        }

        this.musicPlayerState.update((data: any) => { 
            const newData = { ...data, isShuffled:  this.musicPlayerData.isShuffled }
            this.updateMusicPlayerData({ ...data, isShuffled:  this.musicPlayerData.isShuffled })
            return newData
        })
    }
    toggleRepeat(): void {
        this.musicPlayerState.update((data: any) => { 
            this.musicPlayerData.isRepeating = !data.isRepeating

            const newData = { ...data, isRepeating: !data.isRepeating }
            this.updateMusicPlayerData(newData)

            return newData
        })
    }

    /* Event Handlers */
    nowPlayingItemWillChangeHandler = async (event: any) => {
        if (!event.item) return
    
        const isSong = event.item.playParams.kind === "song"
        const mediaItem = {
            id: event.item.id,
            name: event.item.attributes.name,
            artist: event.item.attributes.artistName,
            collection: event.item.albumName,
            artworkImgSrc: getArtwork(event.item.attributes.artwork),
            playlistId: event.item._container.id,
            playlistName: event.item._container.attributes.name,
            playlistArtworkSrc: getArtwork(event.item._container.attributes.artwork)
        }
        
        this.musicData.updateCurrentTrack(mediaItem)
    }
    playbackTimeDidChangeHandler = async (event: any) => {
        if (this.musicPlayerData.isShuffled && event.currentPlaybackTimeRemaining === 0) {
            this.skipToNextRandomTrack()
        }
    }
    mediaPlaybackErrorHandler = async (event: any) => {
        this.musicPlayerState.update((data: any) => {
            return { ...data, message: "Error has occured!", isDisabled: true }
        })
    }
    mediaCanPlayHandler = async (event: any) => {
        this.musicPlayerState.update((data: any) => {
            return { ...data, message: "Playing!", isDisabled: false }
        })
    }
    queuePositionDidChangeHandler = async (event: any) => {
        if (event.oldPosition === -1) { // after a refresh
            this.musicPlayerState.update((data: any) => {
                return { ...data, message: "Setting Up!", isDisabled: false }
            })
            return
        }
        this.musicPlayerState.update((data: any) => {
            return { ...data, message: "Setting Up!", isDisabled: true }
        })
    }
    playbackStateDidChangeHandler = async (event: any) => {
        console.log(event)
        if (event.state === this.PLAYING_STATE) {
            this.musicPlayerState.update((data: any) => {
                return { ...data, message: "Playing!", isCurrentlyPlaying: true }
            })
        }
        else if (event.state == this.PAUSED_STATE) {
            this.musicPlayerState.update((data: any) => {
                return { ...data, message: "Pausing!", isCurrentlyPlaying: false }
            })
        }
        else if (event.state == this.PLAYLIST_END_STATE && this.musicPlayerData.isRepeating) {
            await this.musicPlayerInstance.setQueue({ playlist: this.musicData.currentPlaylist!.id, startWith: 0 }); 
            this.musicPlayerInstance.play()
        }
    }
}