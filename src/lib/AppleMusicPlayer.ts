import type { Writable } from "svelte/store";
import type { MusicData } from "./MusicData";
import { formatTime } from "./helper";
import { curentPlaylist, musicPlayerData } from "./store";
import { getArtwork } from "./apple-music-api";
import { MusicPlayer } from "./MusicPlayer";
import { MusicPlaylistShuffler } from "./MusicPlaylistShuffler"

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
        this.musicPlayerState = musicPlayerData
        this.initMusicPlayerData()

        
        // @ts-ignore
        this.musicKit = MusicKit
        this.musicPlayerInstance = this.musicKit.getInstance()

        this.attachEventListeners()
    }

    /* Load data for state persistence */
    initMusicPlayerData = () => {
        
        setTimeout(() => {
            const musicPlayerData = this.loadMusicPlayerData() ?? this.musicPlayerData
            // @ts-ignore
            this.musicPlayerInstance = MusicKit.getInstance()
            if (!this.musicPlayerInstance) {
                this.updateMusicPlayerData({ ...musicPlayerData, message: "Music Kit Unavailable!", doShowPlayer: false })
                return
            }
            
            this.musicPlayerInstance.setQueue({
                playlist: this.musicData.currentPlaylist?.id, 
                startWith: this.musicData.currentPlaylist?.currentIndex 
            });
            
            this.updateMusicPlayerData({ ...musicPlayerData, message: "READY!", isDisabled: false, doShowPlayer: true, isCurrentlyPlaying: false  })

            if (this.musicPlayerData.isShuffled) {
                this.musicPlaylistShuffler = new MusicPlaylistShuffler(-1, -1, this.loadMusicShuffleData())
            }

        }, 700);
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
        this.musicPlayerInstance.addEventListener("mediaSkipAvailable", this.mediaCanSkipHandler);
    }

    /* Player Data */
    private loadMusicPlayerData = () => {
        if (!localStorage.getItem("music-player-data")) return null
    
        return JSON.parse(localStorage.getItem("music-player-data")!)
    } 
    private loadMusicShuffleData = () => {
        return JSON.parse(localStorage.getItem("music-shuffle-data")!)
    }
    updateMusicPlayerData(newMusicPlayerData: MusicPlayerData) {
        this.musicPlayerState.update((data: any) => { 
            const newState =  { ...data, ...newMusicPlayerData } 
            this.musicPlayerData = newMusicPlayerData

            return newState
        })

        localStorage.setItem("music-player-data", JSON.stringify(newMusicPlayerData))
    }
    resetMusicPlayerData() {
        if (this.musicPlayerData.isShuffled) {
            this.musicPlaylistShuffler = null
            localStorage.removeItem("music-shuffle-data")
        } 

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
        this.musicPlayerState.update((data: any) => { return { ...data, isDisabled: true } })
        
        if (this.musicPlayerInstance.isPlaying) {
            await this.musicPlayerInstance.pause()
            this.isPlaying = false
        } 
        else {
            await this.musicPlayerInstance.play()
            this.isPlaying = true
        }
        this.musicPlayerData.isDisabled = false
    }
    skipToNextRandomTrack = async () => {
        const musicPlayerData = this.musicPlayerData
        const shuffler = this.musicPlaylistShuffler!
        const playlistID = this.musicData.currentPlaylist!.id

        const nextTrackIndex = shuffler.getNextIndex(this.musicPlayerData.isRepeating)
        const state = shuffler.getState()

        if (state === shuffler.CAN_CONTINUE_CHUNK) {
            this.queueAndPlayNextTrack(playlistID, nextTrackIndex)
        }
        else if (state === shuffler.HAS_ENDED_AND_MORE_CHUNKS) {
            shuffler.initNextChunk()
            this.queueAndPlayNextTrack(playlistID, shuffler.getNextIndex())
        }
        else if (state === shuffler.HAS_ENDED_NO_CHUNKS) {
            shuffler.resetPlaylistShufflerForRepeat()

            if (musicPlayerData.isRepeating) {
                this.queueAndPlayNextTrack(playlistID, shuffler.startTrackIndex)
            }
            else {
                this.queueAndPlayNextTrack(playlistID, shuffler.startTrackIndex, false)
            }
        }
    }
    skipToPrevRandomTrack = async () => {
        const shuffler = this.musicPlaylistShuffler!
        const playlistID = this.musicData.currentPlaylist!.id

        const nextTrackIndex = shuffler.getPrevIndex(this.musicPlayerData.isRepeating)
        const isTrackIndexValid = nextTrackIndex >= 0  // when at starting position

        if (isTrackIndexValid) {
            this.queueAndPlayNextTrack(playlistID, nextTrackIndex)
        } 
        else {
            musicPlayerData.update((data: any) => { return { ...data, isDisabled: false } })
        }

    }
    async skipToNextTrack() {
        musicPlayerData.update((data: any) => { return { ...data, isDisabled: true } })
        await this.musicPlayerInstance.pause()

        if (this.musicPlayerData.isShuffled) {
            this.skipToNextRandomTrack()
            return
        }

        const nextIndex = this.musicData.getNextPlaylistIndex(this.musicPlayerData.isRepeating)
        if (nextIndex < 0) {
            this.queueAndPlayNextTrack(this.musicData.currentPlaylist!.id, 0, false)
            return
        }

        this.queueAndPlayNextTrack(this.musicData.currentPlaylist!.id, nextIndex)
    }
    async skipToPrevTrack() {
        musicPlayerData.update((data: any) => { return { ...data, isDisabled: true } })
        await this.musicPlayerInstance.pause()

        if (this.musicPlayerData.isShuffled) {
            this.skipToPrevRandomTrack()
            return
        }
        this.musicPlayerData.isDisabled = true
        const nextIndex = this.musicData.getPrevPlaylistIndex(this.musicPlayerData.isRepeating)

        if (nextIndex < 0) {
            musicPlayerData.update((data: any) => { return { ...data, isDisabled: false } })
            return
        }

        this.queueAndPlayNextTrack(this.musicData.currentPlaylist!.id, nextIndex)
    }
    queueAndPlayNextTrack = async (playlistId: string, newIndex: number, doPlay: boolean = true) => {
        await this.musicPlayerInstance.setQueue({ playlist: playlistId, startWith: newIndex });
        this.musicData.updateCurrentPlaylistIdx(newIndex)

        if (doPlay) this.musicPlayerInstance.play()
        this.musicPlayerData.isDisabled = false
    }
    toggleShuffle(): void {
        const musicPlayerData = this.musicPlayerData
        const currPlaylist = this.musicData.currentPlaylist!

        const currIndex = currPlaylist.currentIndex
        const songCount = currPlaylist.songCount

        if (currIndex >= songCount) {
            console.log("Playlist index out of bounds!")
            return
        }

        musicPlayerData.isShuffled = !musicPlayerData.isShuffled

        if (musicPlayerData.isShuffled) {
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(currIndex, songCount)
        }
        else {
            this.musicPlaylistShuffler = null
            localStorage.removeItem("music-shuffle-data")
        }

        this.musicPlayerState.update((data: any) => { 
            const newData = { ...data, isShuffled:  musicPlayerData.isShuffled }
            this.updateMusicPlayerData({ ...data, isShuffled:  musicPlayerData.isShuffled })
            return newData
        })
    }
    toggleRepeat(): void {
        // when shuffled, and looped is off, create new shuffle ordering
        if (this.musicPlayerData.isRepeating && this.musicPlayerData.isShuffled) {
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(
                this.musicData.currentPlaylist!.currentIndex, 
                this.musicData.currentPlaylist!.songCount
            )
        }

        this.musicPlayerState.update((data: any) => { 
            this.musicPlayerData.isRepeating = !data.isRepeating

            const newData = { ...data, isRepeating: this.musicPlayerData.isRepeating }
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
    mediaCanSkipHandler = async (event: any) => {
        this.musicPlayerState.update((data: any) => {
            return { ...data, isDisabled: false }
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
        if (event.state === this.PLAYING_STATE) {
            this.musicPlayerState.update((data: any) => {
                return { ...data, message: "Playing!", isCurrentlyPlaying: true, isDisabled: false }
            })
        }
        else if (event.state == this.PAUSED_STATE) {
            this.musicPlayerState.update((data: any) => {
                return { ...data, message: "Pausing!", isCurrentlyPlaying: false, isDisabled: false  }
            })
        }
        else if (event.state == this.PLAYLIST_END_STATE && this.musicPlayerData.isRepeating) {
            await this.musicPlayerInstance.setQueue({ playlist: this.musicData.currentPlaylist!.id, startWith: 0 }); 
            this.musicPlayerInstance.play()
        }
    }
}