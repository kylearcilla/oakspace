import type { MusicData } from "./music-data-apple"
import { musicPlayerStore, } from "./store"
import { getArtworkSrc, isCollectionPlaylist } from "./api-apple-music"
import { MusicPlayer } from "./music-player"
import { MusicPlaylistShuffler } from "./music-playlist-shuffler"

/**
 * A class representing an Apple Music player instance that extends MusicPlayer. 
 * The player itself is a svelte store object / reactive class.
 * 
 * @extends MusicPlayer
 */

export class AppleMusicPlayer extends MusicPlayer {
    musicPlayerInstance: any
    musicData: MusicData

    musicPlaylistShuffler: MusicPlaylistShuffler | null = null

    state: MusicPlayerState = { 
        doShowPlayer: false,
        isPlaying: false,
        error: null,
        isDisabled: true,
        isRepeating: false,
        isShuffled: false,
        hasJustEnded: false
    }
    
    EMPTY_MUSIC_PLAYER_STATE = {
        doShowPlayer: false,
        isPlaying: false,
        isDisabled: true,
        isRepeating: false,
        isShuffled: false,
        error: null,
        hasJustEnded: false
    }
    ACTIVE_MUSIC_PLAYER_STATE = {
        doShowPlayer: true,
        isPlaying: false,
        isDisabled: true,
        isRepeating: false,
        isShuffled: false,
        error: null,
        hasJustEnded: false
    }

    PLAYING_STATE = 2
    PAUSED_STATE = 3
    COLLECTION_JUST_ENDED_STATE = 10
    PLAYER_COOLDOWN_MS = 500
 
    constructor(musicData: MusicData) {
        super()
        this.musicData = musicData
        musicPlayerStore.set(this)

        this.initMusicPlayerState()
    }

    /**
     * Initialize music player state from previously saved state or start over.
     * Start where user left off previously. Attach Event Listeners to Music Kit Instance.
     */
    initMusicPlayerState = async () => {
        // @ts-ignore
        this.musicPlayerInstance = await MusicKit.getInstance()

        // get saved player state
        const savedStateData = this.loadMusicPlayerState() ?? this.EMPTY_MUSIC_PLAYER_STATE

        this.updateMusicPlayerState({ ...savedStateData, isPlaying: false, isDisabled: true })

        if (this.musicData.collection) {
            this.queueAndPlayNextTrack(this.musicData.collection!.id, this.musicData.currentIdx, false)
        }
        if (savedStateData.isShuffled) {
            const shuffleData = this.loadMusicShuffleData()
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(shuffleData.trackIndex, shuffleData.songCount, shuffleData)
        }

        this.unDisableMusicPlayer()
        
        // attach event listners
        this.attachEventHandlers()
    }

    /**
     * Initilize event handlers to Apple Music Kit instance. 
     * Has helpful info in the data passed to handlers about state / data of current player / media.
     */
    private attachEventHandlers = () => {
        this.musicPlayerInstance.addEventListener("nowPlayingItemWillChange", this.nowPlayingItemWillChangeHandler)
        this.musicPlayerInstance.addEventListener("playbackTimeDidChange", this.playbackTimeDidChangeHandler)
        this.musicPlayerInstance.addEventListener("mediaPlaybackError", this.mediaPlaybackErrorHandler)
        this.musicPlayerInstance.addEventListener("mediaCanPlay", this.mediaCanPlayHandler)
        this.musicPlayerInstance.addEventListener("playbackStateDidChange", this.playbackStateDidChangeHandler)
    }

    /**
     * Update the music player store. 
     * The effects will be heared immediately in Music Player Svelte component.
     * Only the state property is updated to avoid full object destructuring.
     * 
     * @param newMusicPlayerState 
     */
    updateMusicPlayerState(newPlayerState: MusicPlayerState) {
        musicPlayerStore.update((player: MusicPlayer | null) => {
            if (!player) return player

            const newState = player
            newState!.state = newPlayerState

            this.saveMusicPlayerState(newPlayerState)
            return newState
        })
    }
    
    /**
     * Called when player is no longer in use. 
     */
    quitPlayer() {
        if (this.state.isShuffled) {
            this.removeMusicShuffleData()
        }
        this.removeMusicPlayerState()
        this.resetMusicPlayerStateToEmptyState()

        musicPlayerStore.set(null)
    }

    /**
     * Resets to empty state.
     * Called when there is no playlist track or quitting plater.
     */
    async resetMusicPlayerStateToEmptyState() {
        if (this.state.isShuffled) {
            this.removeMusicShuffleData()
        } 
        await this.musicPlayerInstance.stop()
        this.updateMusicPlayerState(this.EMPTY_MUSIC_PLAYER_STATE)
    }

    /**
     * Hide music player.
     */
    hideMusicPlayer() {
        this.updateMusicPlayerState({ ...this.state, doShowPlayer: false })
    }


    /**
     * Plays / pauses player.
     */
    async togglePlayback() {
        if (this.musicPlayerInstance.isPlaying) {
            this.updateMusicPlayerState({ ...this.state, isPlaying: false })
            await this.musicPlayerInstance.pause()
        } 
        else {
            this.updateMusicPlayerState({ ...this.state, isPlaying: true })
            await this.musicPlayerInstance.play()
        }

        this.unDisableMusicPlayer()

        if (this.state.hasJustEnded) {
            this.updateMusicPlayerState({ ...this.state, hasJustEnded: false })
        }
    }

    /**
     * Skip to Next track.
     * If at the end, it will queue up the first, but won't play immediately.
     * 
     */
    async skipToNextTrack() {
        if (this.state.isShuffled) {
            this.skipToNextRandomTrack()
            return
        }

        const nextIndex = this.musicData.getNextPlaylistIndex(this.state.isRepeating, this.state.hasJustEnded)

        if (this.state.hasJustEnded) {
            this.updateMusicPlayerState({ ...this.state, hasJustEnded: false })
            this.queueAndPlayNextTrack(this.musicData.collection!.id, nextIndex, true)
        }
        else if (nextIndex < 0) {
            this.updateMusicPlayerState({ ...this.state, hasJustEnded: true })
            this.queueAndPlayNextTrack(this.musicData.collection!.id, 0, false, false)
        }
        else {
            this.queueAndPlayNextTrack(this.musicData.collection!.id, nextIndex)
        }
    }

    /**
     * Skip to Prev track.
     * If at the start, it will queue up the first again and start it over.
     * 
     */
    async skipToPrevTrack() {
        if (this.state.isShuffled) {
            this.skipToPrevRandomTrack()
            return
        }
        const nextIndex = this.musicData.getPrevPlaylistIndex(this.state.isRepeating)

        if (nextIndex < 0) {
            this.queueAndPlayNextTrack(this.musicData.collection!.id, 0)
            this.updateMusicPlayerState({ ...this.state, hasJustEnded: true })
            return
        }

        this.queueAndPlayNextTrack(this.musicData.collection!.id, nextIndex)

        if (this.state.hasJustEnded) {
            this.updateMusicPlayerState({ ...this.state, hasJustEnded: false })
        }
    }

    /**
     * Skips to next track when shuffled
     */
    skipToNextRandomTrack = async () => {
        const shuffler = this.musicPlaylistShuffler!
        const playlistID = this.musicData.collection!.id

        const nextTrackIndex = shuffler.getNextIndex(this.state.isRepeating, this.state.hasJustEnded)
        const state = shuffler.getState()

        // when reached the and next is played, plat the first not the 2nd item
        if (this.state.hasJustEnded) {
            this.queueAndPlayNextTrack(playlistID, shuffler.trackIndex)
            this.updateMusicPlayerState({ ...this.state, hasJustEnded: false })
        }
        else if (state === shuffler.HAS_ENDED_NO_CHUNKS) {
            shuffler.resetPlaylistShufflerForRepeat()

            this.queueAndPlayNextTrack(playlistID, shuffler.trackIndex, this.state.isRepeating, false)
            this.updateMusicPlayerState({ ...this.state, hasJustEnded: true })
        }
        else if (state === shuffler.CAN_CONTINUE_CHUNK) {
            this.queueAndPlayNextTrack(playlistID, nextTrackIndex)
        }
        else if (state === shuffler.HAS_ENDED_AND_MORE_CHUNKS) {
            shuffler.initNextChunk()
            this.queueAndPlayNextTrack(playlistID, shuffler.getNextIndex())
        }
    }

    /**
     * Skips to prev track when shuffled
     */
    skipToPrevRandomTrack = async () => {
        const shuffler = this.musicPlaylistShuffler!
        const playlistID = this.musicData.collection!.id

        const nextTrackIndex = shuffler.getPrevIndex(this.state.isRepeating)

        if (nextTrackIndex >= 0) {
            this.queueAndPlayNextTrack(playlistID, nextTrackIndex)
        } 
        else {
            this.queueAndPlayNextTrack(playlistID, 0)
            this.updateMusicPlayerState({ ...this.state, hasJustEnded: true })
        }

        if (this.state.hasJustEnded) {
            this.updateMusicPlayerState({ ...this.state, hasJustEnded: false })
        }
    }


    /**
     * Player will start over after collection is finished.
     * Shuffles a CHUNK_SIZE subset of indices from collection.
     */
    toggleShuffle(): void {
        const currPlaylist = this.musicData.collection!
        const currIndex = this.musicData.currentIdx
        const songCount = currPlaylist.songCount
    
        if (!this.state.isShuffled && currIndex >= MusicPlaylistShuffler.CHUNK_SIZE) {
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(-1, this.musicData.collection!.songCount)
            this.musicPlaylistShuffler.indexPointer = -1
        }
        else if (!this.state.isShuffled) {
            this.musicPlaylistShuffler = new MusicPlaylistShuffler(currIndex, songCount)
        }

        this.updateMusicPlayerState({ ...this.state, isDisabled: true, isShuffled: !this.state.isShuffled })
        this.unDisableMusicPlayer()
    }

    /**
     * Toggle repeat for player. 
     */
    toggleRepeat(): void {
        this.updateMusicPlayerState({ ...this.state, isDisabled: true, isRepeating: !this.state.isRepeating })
        this.unDisableMusicPlayer()
    }

    /**
     * Called by every method that plays a track.
     * 
     * @param id          Id of media item
     * @param newIndex    Index of track to be played within music collection
     * @param doPlay      Do immediatley start playing?
     * @param doDIsable   Do disable player temporarily. If so it will eventually undisable after playlist item has changed delay.
     */
    queueAndPlayNextTrack = async (id: string, newIndex: number, doPlay: boolean = true, doDisable: boolean = true) => {        
        this.updateMusicPlayerState({ ...this.state, isPlaying: doPlay, isDisabled: doDisable, doShowPlayer: true })

        const isPlaylist = isCollectionPlaylist(id)

        if (isPlaylist) {
            await this.musicPlayerInstance.setQueue({ playlist: id, startWith: newIndex })
        }
        else {
            await this.musicPlayerInstance.setQueue({ album: id, startWith: newIndex })
        }

        this.musicData.updateCurrentCollectionIdx(newIndex)

        if (doPlay) this.musicPlayerInstance.play()
    }

    /**
     * Called when the player is availabled to be played
     * 
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private mediaCanPlayHandler = async () => {
        if (this.state.isDisabled) {
            this.unDisableMusicPlayer(false)
        }
    }

    /**
     * Called when there is an error in the player
     * 
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private mediaPlaybackErrorHandler = async (event: any) => {
        this.updateMusicPlayerState({ ...this.state, isDisabled: true, error: event })
    }

    /**
     * Called when player is about to change media item. 
     * Used to update the media item locally.
     * 
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private nowPlayingItemWillChangeHandler = async (event: any) => {
        if (!event.item) return
        if (!this.state.doShowPlayer) {
            this.updateMusicPlayerState(this.ACTIVE_MUSIC_PLAYER_STATE)
        }
        this.updateMusicPlayerState({ ...this.state, isDisabled: true, isPlaying: true })
    
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
    
    /**
     * Called everytime playback time changes. 
     * Used to update music data when player is about to naturally end.
     * 
     * @param event   Event data passed in by Apple Music Kit instance.
     */
    private playbackTimeDidChangeHandler = async (event: any) => {
        if (event.currentPlaybackTimeRemaining != 0) return

        this.skipToNextTrack()
    }
    /**
     * Called everytime player state changes, paused, played, skipped, etc...
     * 
     * @param event 
     */
    private playbackStateDidChangeHandler = async (event: any) => {
        if (event.state == this.COLLECTION_JUST_ENDED_STATE && this.state.isRepeating) {
            await this.musicPlayerInstance.setQueue({ playlist: this.musicData.collection!.id, startWith: 0 }) 
            this.musicPlayerInstance.play()
        }
    }
    /**
     * Undisabled current music player after a cooldown.
     * Player temorarily disabled after a control is used to avoid spamming.
     */
    private unDisableMusicPlayer = (doWait = true): void => {
        setTimeout(() => {
            this.updateMusicPlayerState({ ...this.state, isDisabled: false, doShowPlayer: true  })
        }, doWait ? this.PLAYER_COOLDOWN_MS : 0)
    }

    private saveMusicPlayerState = (playerState: MusicPlayerState): void => {
        localStorage.setItem("music-player-data", JSON.stringify(playerState))
    }
    private loadMusicPlayerState = (): MusicPlayerState => {
        if (!localStorage.getItem("music-player-data")) {
            return this.EMPTY_MUSIC_PLAYER_STATE
        }
    
        return JSON.parse(localStorage.getItem("music-player-data")!)
    } 
    private loadMusicShuffleData = (): MusicShufflerState => {
        return JSON.parse(localStorage.getItem("music-shuffle-data")!)
    }
    private removeMusicShuffleData = (): void => {
        localStorage.removeItem("music-shuffle-data")
    }
    private removeMusicPlayerState = (): void => {
        localStorage.removeItem("music-player-data")

    }
}