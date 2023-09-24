import type { Writable } from "svelte/store";
import type { MusicData } from "./music-data-apple";
import { musicPlayerData } from "./store";
import { getArtworkSrc, isCollectionPlaylist } from "./api-apple-music";
import { MusicPlayer } from "./music-player";
import { MusicPlaylistShuffler } from "./music-playlist-shuffler"

/**
 * A class representing an Apple Music player instance that extends MusicPlayer.
 * @extends MusicPlayer
 */

export class AppleMusicPlayer extends MusicPlayer {
    musicPlayerInstance: any
    musicData: MusicData

    musicPlayerState: Writable<MusicPlayerState | null> 
    musicPlaylistShuffler: MusicPlaylistShuffler | null = null

    canPlayerPlay = false
    
    EMPTY_MUSIC_PLAYER_STATE = {
        message: "",
        doShowPlayer: false,
        isCurrentlyPlaying: false,
        isDisabled: true,
        isRepeating: false,
        isShuffled: false
    }
    ACTIVE_MUSIC_PLAYER_STATE = {
        message: "",
        doShowPlayer: true,
        isCurrentlyPlaying: false,
        isDisabled: true,
        isRepeating: false,
        isShuffled: false
    }

    musicPlayerData: MusicPlayerState = this.EMPTY_MUSIC_PLAYER_STATE

    PLAYING_STATE = 2
    PAUSED_STATE = 3
    PLAYLIST_END_STATE = 10
    PLAYER_COOLDOWN_MS = 500
 
    /* Global Store Data */
    constructor(musicData: MusicData) {
        super()
        this.musicData = musicData
        this.musicPlayerState = musicPlayerData
        this.initMusicPlayerState()

        // @ts-ignore
        this.musicPlayerInstance = MusicKit.getInstance()
        this.attachEventListeners()
    }

    /* Load data for state persistence */
    initMusicPlayerState = () => {
        setTimeout(() => {
            const musicPlayerData = this.loadMusicPlayerState() ?? this.musicPlayerData
            // @ts-ignore
            this.musicPlayerInstance = MusicKit.getInstance()
            if (!this.musicPlayerInstance) {
                this.updateMusicPlayerState({ ...musicPlayerData, message: "Music Kit Unavailable!", doShowPlayer: false })
                return
            }

            const id = this.musicData.currentPlaylist?.id
            const collectionType = this.musicData.currentPlaylist?.type

            this.musicPlayerInstance.setQueue({
                ...(collectionType === "playlist" ? { playlist: id } : { album: id }),
                startWith: this.musicData.currentIdx 
            })
            
            this.updateMusicPlayerState({ ...musicPlayerData, message: "Web Comnponents Loaded!", isCurrentlyPlaying: false, isDisabled: false, doShowPlayer: true })

            if (this.musicPlayerData.isShuffled) {
                this.musicPlaylistShuffler = new MusicPlaylistShuffler(-1, -1, this.loadMusicShuffleData())
            }

            this.unDisableMusicPlayer()
        }, 700);
    }

    private isUserLoggedIn = () => {
        return localStorage.getItem("music-platform")
    }

    /* Init Event Listeners */
    private attachEventListeners = () => {
        this.musicPlayerInstance.addEventListener("nowPlayingItemWillChange", this.nowPlayingItemWillChangeHandler);
        this.musicPlayerInstance.addEventListener("playbackTimeDidChange", this.playbackTimeDidChangeHandler);
        this.musicPlayerInstance.addEventListener("mediaPlaybackError", this.mediaPlaybackErrorHandler);
        this.musicPlayerInstance.addEventListener("mediaCanPlay", this.mediaCanPlayHandler);
        this.musicPlayerInstance.addEventListener("queuePositionDidChange", this.queuePositionDidChangeHandler);
        this.musicPlayerInstance.addEventListener("playbackStateDidChange", this.playbackStateDidChangeHandler);
    }

    /* Player Data */
    private loadMusicPlayerState = () => {
        if (!localStorage.getItem("music-player-data")) return null
    
        return JSON.parse(localStorage.getItem("music-player-data")!)
    } 
    private loadMusicShuffleData = () => {
        return JSON.parse(localStorage.getItem("music-shuffle-data")!)
    }
    updateMusicPlayerState(newMusicPlayerState: MusicPlayerState) {
        this.musicPlayerState.update((data: any) => { 
            const newState =  { ...data, ...newMusicPlayerState } 

            this.musicPlayerData = newState
            localStorage.setItem("music-player-data", JSON.stringify(newState))

            return newState
        })
    }
    async resetMusicPlayerStateToEmptyState() {
        this.resetMusicPlayerState()
        await this.musicPlayerInstance.stop()
        this.musicPlayerState.set(this.EMPTY_MUSIC_PLAYER_STATE)
    }
    resetMusicPlayerState() {
        if (this.musicPlayerData.isShuffled) {
            this.musicPlaylistShuffler = null
            localStorage.removeItem("music-shuffle-data")
        } 
        this.musicPlayerData = this.EMPTY_MUSIC_PLAYER_STATE
    }
    hideMusicPlayer() {
        this.updateMusicPlayerState({ ...this.musicPlayerData, doShowPlayer: false })
    }

    /* Controls */
    async togglePlayback() {
        if (this.musicPlayerInstance.isPlaying) {
            this.updateMusicPlayerState({ ...this.musicPlayerData, isCurrentlyPlaying: false })
            await this.musicPlayerInstance.pause()
        } 
        else {
            this.updateMusicPlayerState({ ...this.musicPlayerData, isCurrentlyPlaying: true })
            await this.musicPlayerInstance.play()
        }
        this.unDisableMusicPlayer()
    }
    /* Skipping While Shuffled */
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
            this.queueAndPlayNextTrack(playlistID, shuffler.startTrackIndex, musicPlayerData.isRepeating)
        }
    }
    skipToPrevRandomTrack = async () => {
        const shuffler = this.musicPlaylistShuffler!
        const playlistID = this.musicData.currentPlaylist!.id

        const nextTrackIndex = shuffler.getPrevIndex(this.musicPlayerData.isRepeating)
        const isTrackIndexValid = nextTrackIndex >= 0  // invalid when @ starting position

        if (isTrackIndexValid) {
            this.queueAndPlayNextTrack(playlistID, nextTrackIndex)
        } 

    }
    /* Skipping Tracks */
    async skipToNextTrack() {
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
        if (this.musicPlayerData.isShuffled) {
            this.skipToPrevRandomTrack()
            return
        }
        const nextIndex = this.musicData.getPrevPlaylistIndex(this.musicPlayerData.isRepeating)

        if (nextIndex < 0) {
            this.unDisableMusicPlayer()
            return
        }

        this.queueAndPlayNextTrack(this.musicData.currentPlaylist!.id, nextIndex)
    }
    /* Playing Track */
    queueAndPlayNextTrack = async (id: string, newIndex: number, doPlay: boolean = true) => {
        this.updateMusicPlayerState({ ...this.musicPlayerData, isDisabled: true })
        const isPlaylist = isCollectionPlaylist(id)

        if (isPlaylist) {
            await this.musicPlayerInstance.setQueue({ playlist: id, startWith: newIndex });
        }
        else {
            await this.musicPlayerInstance.setQueue({ album: id, startWith: newIndex });
        }

        this.musicData.updateCurrentCollectionIdx(newIndex)

        // for when current playlist / album ends and queue fist song
        if (doPlay) this.musicPlayerInstance.play()
    }

    /* Other Controls */
    toggleShuffle(): void {
        const musicPlayerData = this.musicPlayerData
        const currPlaylist = this.musicData.currentPlaylist!

        const currIndex = this.musicData.currentIdx
        const songCount = currPlaylist.songCount
    
        if (currIndex >= MusicPlaylistShuffler.CHUNK_SIZE) {
            console.log("Playlist index out of bounds!")
            return
        }

        musicPlayerData.isShuffled = !musicPlayerData.isShuffled

        if (musicPlayerData.isShuffled) {
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(currIndex, songCount)
        }
        
        const newData = { ...musicPlayerData, isDisabled: true, isShuffled:  musicPlayerData.isShuffled }
        this.updateMusicPlayerState(newData)
        this.unDisableMusicPlayer()
    }
    toggleRepeat(): void {
        // When shuffle is on and not looped: create new shuffle ordering, start from 0
        // ...to avoid shuffling large playlists (so if current idx is 100, shuffle will range from 0 to CHUNK_SIZE not 0 to 100)
        // ...shuffled playlist will be played on the next track
        if (this.musicPlayerData.isRepeating && this.musicPlayerData.isShuffled) {
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(
                this.musicPlaylistShuffler!.startTrackIndex, 
                this.musicData.currentPlaylist!.songCount
            )

            // Very next will be the starting index
            // handles case where user toggles repeat when outside of shuffled indices range
            this.musicPlaylistShuffler.indexPointer = -1
        }

        this.updateMusicPlayerState({
            ...this.musicPlayerData,
            isDisabled: true,
            isRepeating: !this.musicPlayerData.isRepeating,
        })
        this.unDisableMusicPlayer()
    }

    /* Event Handlers for Music Player */
    mediaCanPlayHandler = async () => {
        this.canPlayerPlay = true

        if (this.musicPlayerData.isDisabled) {
            this.updateMusicPlayerState({ ...this.musicPlayerData, isDisabled: false })
        }
    }
    mediaPlaybackErrorHandler = async (event: any) => {
        this.musicPlayerState.update((data: any) => {
            return { ...data, message: "Error has occured!", isDisabled: true }
        })
        this.canPlayerPlay = false
    }
    nowPlayingItemWillChangeHandler = async (event: any) => {
        if (!event.item) return
        if (!this.musicPlayerData.doShowPlayer) {
            this.updateMusicPlayerState(this.ACTIVE_MUSIC_PLAYER_STATE)
        }
        this.updateMusicPlayerState({ ...this.musicPlayerData, isDisabled: true, isCurrentlyPlaying: true })
    
        const mediaItem = {
            id: event.item.id,
            name: event.item.attributes.name,
            artist: event.item.attributes.artistName,
            collection: event.item.albumName,
            artworkImgSrc: getArtworkSrc(event.item.attributes.artwork),
            playlistId: event.item._container.id,
            playlistName: event.item._container.attributes.name,
            playlistArtworkSrc: getArtworkSrc(event.item._container.attributes.artwork)
        }
        
        this.musicData.updateCurrentTrack(mediaItem)
        this.unDisableMusicPlayer()
    }
    playbackTimeDidChangeHandler = async (event: any) => {
        if (event.currentPlaybackTimeRemaining === 0) {
            this.skipToNextTrack()
        }
    }
    queuePositionDidChangeHandler = async (event: any) => {
        // if (event.oldPosition === -1) {
        //     this.updateMusicPlayerState({ ...this.musicPlayerData, isCurrentlyPlaying: true })
        //     return
        // }
    }
    playbackStateDidChangeHandler = async (event: any) => {
        if (event.state == this.PLAYLIST_END_STATE && event.state != this.PLAYLIST_END_STATE && this.musicPlayerData.isRepeating) {
            await this.musicPlayerInstance.setQueue({ playlist: this.musicData.currentPlaylist!.id, startWith: 0 }); 
            this.musicPlayerInstance.play()
        }
    }
    unDisableMusicPlayer = () => {
        setTimeout(() => {

            if (!this.canPlayerPlay) return
            this.updateMusicPlayerState({ ...this.musicPlayerData, isDisabled: false })
        }, this.PLAYER_COOLDOWN_MS);
    }
}