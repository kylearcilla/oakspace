import { get } from "svelte/store"
import { musicPlayerManager, musicPlayerStore } from "./store"

import { getElemById, getLogoIconFromEnum, looseEqualTo } from "./utils-general"
import { INPUT_RANGE_BG_COLOR, INPUT_RANGE_FG_COLOR, getSeekPositionSecs, getSlidingTextAnimation } from "./utils-music-player"

import { LogoIcon, MusicPlatform, PlaybackGesture } from "./enums"
import type { MusicPlayer } from "./music-player"

/**
 * Manager class, a wrapper over the music player component, that manages UI and music player store changes
 * Only handles music player state changes that is heavily involved with the UI (seek, volume).
 */
export class MusicPlayerManager {
    musicPlatform: MusicPlatform
    playerStore: MusicPlayer | null
    icon: LogoIcon
    iconOptions: LogoContainerOptions
    
    isSeeking = false    
    hasSeeked = false    
    progressValue = "0"
    didJustMouseUp = false
    onCooldown = false

    isVolSeeking = false
    volume       = -1
    isMuted      = false
    hasSeekedToSecs = -1
    isDisabled  = false
    
    progressMs = -1
    durationMs = -1
    mediaItemId: string | null = null
    mouseUpTimeOut: NodeJS.Timeout | null = null

    isPausePlayBtnActive = false
    isPrevBtnActive = false
    isNextBtnActive = false
    hasMediaEventHandlersSet = false
    
    trackTitleElement: HTMLElement | null = null
    trackArtistNameElement: HTMLElement | null = null

    trackPlaybackBar: HTMLInputElement | null = null
    volumeTrackBar:  HTMLInputElement | null = null
    
    trackTitleElAnimationObj: Animation | null = null
    trackArtistElAnimationObj: Animation | null = null

    cooldownTimeOut: NodeJS.Timeout | null = null

    GESTURE_COOL_DOWN_MS = 1200
    LOGO_WIDTH = 19
    BORDER_RADIUS = 100

    MUSIC_PLAYER_ICON_OPTIONS = {
        AppleMusic: { iconWidth: "45%" },
        Spotify: { iconWidth: "80%", hasBgColor: false },
        YoutubeMusic: { iconWidth: "60%" },
        Soundcloud: { iconWidth: "60%" },
        Youtube: { iconWidth: "60%" },
        Google: { iconWidth: "60%" }
    }

    constructor(musicPlatform: MusicPlatform) {
        this.musicPlatform = musicPlatform
        this.playerStore = get(musicPlayerStore)!

        // get the icon enum & options to be used in Icon component
        this.icon = getLogoIconFromEnum(musicPlatform, MusicPlatform)
        
        const iconStrIdx = LogoIcon[this.icon] as keyof typeof this.MUSIC_PLAYER_ICON_OPTIONS
        this.iconOptions = this.MUSIC_PLAYER_ICON_OPTIONS[iconStrIdx]

        musicPlayerManager.set({
            progressMs: this.progressMs, 
            durationMs: this.durationMs,
            trackTitleElAnimationObj: null, 
            trackArtistElAnimationObj: null,
            isSeeking: false,
            isMouseDownOnInput: false, isPausePlayBtnActive: false,
            isPrevBtnActive: false, isNextBtnActive: false,
            onCooldown: false,
            isMuted: false,
            isDisabled: false,
            volume: this.volume
        })

        this.initPlayerElements()
    }

    updateState(newState: Partial<MusicPlayerManagerState>) {
        musicPlayerManager.update((state: MusicPlayerManagerState | null) => {
            let _state = state!
            
            if (newState.durationMs != undefined)   _state.durationMs = newState.durationMs
            if (newState.progressMs != undefined)   _state.progressMs = newState.progressMs
            if (newState.trackTitleElAnimationObj != undefined)   _state.trackTitleElAnimationObj = newState.trackTitleElAnimationObj
            if (newState.trackArtistElAnimationObj != undefined)  _state.trackArtistElAnimationObj = newState.trackArtistElAnimationObj
            if (newState.isMouseDownOnInput != undefined)         _state.isMouseDownOnInput = newState.isMouseDownOnInput
            if (newState.isSeeking != undefined)                  _state.isSeeking = newState.isSeeking
            if (newState.isPausePlayBtnActive != undefined)       _state.isPausePlayBtnActive = newState.isPausePlayBtnActive
            if (newState.isPrevBtnActive != undefined)            _state.isPrevBtnActive = newState.isPrevBtnActive
            if (newState.isNextBtnActive != undefined)            _state.isNextBtnActive = newState.isNextBtnActive
            if (newState.onCooldown != undefined)                 _state.onCooldown = newState.onCooldown
            if (newState.volume != undefined)                     _state.volume = newState.volume
            if (newState.isMuted != undefined)                    _state.isMuted = newState.isMuted
            if (newState.isDisabled != undefined)                 _state.isDisabled = newState.isDisabled

            return _state
        })
    }

    /* Controls */
    onPlaybackGesture(gesture: PlaybackGesture) {
        if (gesture === PlaybackGesture.PLAY_PAUSE) {
            this.togglePlayback()
        }
        else if (gesture === PlaybackGesture.SKIP_NEXT) {
            this.skipToNext()
        }
        else if (gesture === PlaybackGesture.SKIP_PREV) {
            this.skipToPRev()
        }
        else if (gesture === PlaybackGesture.SHUFFLE) {
            this.toggleShuffle()
        }
        else  if (gesture === PlaybackGesture.LOOP) {
            this.toggleRepeat()
        }

        const doSetCooldown = [PlaybackGesture.SKIP_NEXT, PlaybackGesture.SKIP_PREV].includes(gesture)
        if (doSetCooldown) {
            this.setCooldown()
        }
    }

    /* State Updates */
    updateMediaItemProgress(progressMs: number) {
        this.progressMs = progressMs
        this.updateState({ progressMs })
    }
    updateMediaItemTimeDuration(durationMs: number) {
        this.durationMs = durationMs
        this.updateState({ durationMs })
    }
    toggleSeeking(isSeeking: boolean) {
        this.isSeeking = isSeeking
        this.updateState({ isSeeking })
    }
    
    /* Listeners */
    onMediaItemUpdate(store: MusicPlayer) {
        const mediaItem = store.mediaItem
        if (!mediaItem || mediaItem.id === this.mediaItemId) return

        this.mediaItemId = mediaItem.id

        this.resetSlidingTextAnimations()
        requestAnimationFrame(() =>this.initSlidingTextAnimations())

        // when media is playing for this site
        if (navigator.mediaSession.metadata && !this.hasMediaEventHandlersSet) {
           this.initMediaSessionEventHandlers()
        }
    }

    onPlaybackUpdate(store: MusicPlayer) {
        const { progressMs, durationMs, isMuted, volume } = store
        const doAllowUpdate = store.doAllowUpdate

        const seekedWrongTime  = this.hasSeekedWrongTime(progressMs)
        const doUpdate         = !this.isSeeking && doAllowUpdate && !seekedWrongTime && durationMs > 0
        const doUpdateDuration = doUpdate && durationMs != this.durationMs
        const doUpdateProgress = doUpdate && progressMs != this.progressMs

        // will be 0 on loading new videos
        if (durationMs === 0) {
            this.updateProgressOnUpdate(0)
        }
        if (doUpdateDuration) {
            this.updateMediaItemTimeDuration(durationMs)
        }
        if (doUpdateProgress) {
            this.updateProgressOnUpdate(progressMs)
            this.hasSeekedToSecs = -1
        }

        // sound
        if (this.isVolSeeking) {
            return
        }

        this.isMuted = isMuted
        this.volume = volume
        this.updateState({ isMuted })
        
        if (this.isMuted) {
            this.updateVolume(0)
        }
        else {
            this.updateVolume(volume)
        }
    }
    handleKeyUp(event: KeyboardEvent) {
        if (event.code !== "Space") return
    }
    handleKeyDown(event: KeyboardEvent) {
        if (event.code !== "Space") return
        // isPausePlayBtnActive = true
    }
    handleResize () {
        this.resetSlidingTextAnimations()
        this.initSlidingTextAnimations()
    }

    quit() {
        musicPlayerManager.set(null)
    }

    /**
     * Sets a coold down to actions that may overwhelm the API.
     * If on cool-down user gestures to perform these actions will be temporarily disabled
     */
    setCooldown(onCooldown = true) {
        if (onCooldown && !this.onCooldown) {
            this.onCooldown = true
            this.updateState({ onCooldown: true })
            
            this.cooldownTimeOut = setTimeout(() => {
                this.clearCooldown()

            }, this.GESTURE_COOL_DOWN_MS)
        }
        else if (!onCooldown && this.onCooldown) {
            this.clearCooldown()
        }
    }

    clearCooldown() {
        if (!this.cooldownTimeOut) return

        clearTimeout(this.cooldownTimeOut)
        this.cooldownTimeOut = null
        
        this.onCooldown = false
        this.updateState({ onCooldown: false })
    }

    /* Seek */

    /**
     * Handler for when progress updates
     */
    updateProgressOnUpdate(progressMs: number) {
        this.updateMediaItemProgress(progressMs)

        this.progressValue = `${this.durationMs >= 0 ? ((this.progressMs / this.durationMs) * 100) : 0}`
        this.updatePlaybackBarStyleAfterUpdate()
    }

    /**
     * Handler on input events from input range element.
     */
    trackProgressOnInput() {
        this.toggleSeeking(true)

        this.progressValue = this.trackPlaybackBar!.value
        this.updatePlaybackBarStyleAfterUpdate()

        this.updateMediaItemProgress((+this.progressValue / 100) * this.durationMs)
    }

    /**
     * Handler on input events from input range element.
     */
    trackProgressOnChange() {
        this.progressValue = this.trackPlaybackBar!.value
        const seekedTo     = getSeekPositionSecs(+this.progressValue, this.durationMs)

        // prevents seeing previous time data while seeking during transition to new media item
        const isNearEnd = looseEqualTo(this.durationMs / 1000, seekedTo, 2)
        if (isNearEnd && !this.cooldownTimeOut) {
            this.setCooldown()
        }

        this.hasSeekedToSecs = seekedTo
        this.updatePlaybackBarStyleAfterUpdate()

        this.seekTo(this.hasSeekedToSecs)
        this.toggleSeeking(false)
    }

    /**
     * Updates the look of the progress bar.
     */
    updatePlaybackBarStyleAfterUpdate() {
        this.trackPlaybackBar!.style.background = `linear-gradient(to right, ${INPUT_RANGE_FG_COLOR} 0%, ${INPUT_RANGE_FG_COLOR} ${this.progressValue}%, ${INPUT_RANGE_BG_COLOR} ${this.progressValue}%, ${INPUT_RANGE_BG_COLOR} 100%)`
        this.trackPlaybackBar!.value = `${this.progressValue}`
    }

    /* Volume */
    volumneOnInput() {
        this.isVolSeeking = true
        this.updateVolume(+this.volumeTrackBar!.value)
    }
    volumneOnChange() {
        this.isVolSeeking = false
        this.setPlayVolume(+this.volumeTrackBar!.value)
    }
    updateVolume(val: number) {
        if (!this.volumeTrackBar) {
            return
        }
        val = Math.floor(val)
        
        this.volumeTrackBar.style.background = `linear-gradient(to right, ${INPUT_RANGE_FG_COLOR} 0%, ${INPUT_RANGE_FG_COLOR} ${val}%, ${INPUT_RANGE_BG_COLOR} ${val}%, ${INPUT_RANGE_BG_COLOR} 100%)`
        this.volumeTrackBar!.value = val + ""
        
        this.volume  = val
        this.updateState({ volume: val })
    }

    /* Player Functionality  */
    togglePlayback() {
        this.playerStore!.togglePlayback()
    }
    toggleMute() {
        this.playerStore!.toggleMute()
    }
    toggleShuffle() {
        this.playerStore!.toggleShuffle()
    }
    toggleRepeat() {
        this.playerStore!.toggleRepeat()
    }
    seekTo(secs: number) {
        this.playerStore!.seekTo(secs)
    }
    skipToNext() {
        this.hasSeekedToSecs = -1
        this.playerStore!.skipToNextTrack()
    }
    skipToPRev() {
        this.hasSeekedToSecs = -1
        this.playerStore!.skipToPrevTrack()
    }
    setPlayVolume(vol: number) {
        this.playerStore!.setVolume(vol)
    }

    /* Utils */

    /**
     * 
     * Checks if the player briefly jumps to the old progress time after a seek.
     * Sometimes the player will briefly jump to the previous time and back to the right time.
     * Ensures that the new progress to will always be at the place where the user will seeked to.
     * 
     * @param playerProgress  Current progress spit out by the player.
     * @returns               Checks if the progress player's current progress time doesn't match the just-seeked-to time. 
     */
    hasSeekedWrongTime(playerProgress: number) {
        if (this.hasSeekedToSecs < 0) return false

        // if near end, the progress will soon be 0 seconds so the new progress time is expected to be different
        const hasSeekedToSecsNearEnd = playerProgress < 1000 && looseEqualTo(this.durationMs / 1000, this.hasSeekedToSecs, 2)
        if (hasSeekedToSecsNearEnd) {
            return false
        }

        return !looseEqualTo(this.hasSeekedToSecs, playerProgress / 1000, 10)
    }

    /* Media Session */
    initMediaSessionEventHandlers() {
        this.hasMediaEventHandlersSet = true
        navigator.mediaSession.setActionHandler('play', () => { 
            this.isPausePlayBtnActive = true
            this.togglePlayback()

            setTimeout(() => this.isPausePlayBtnActive = false, this.GESTURE_COOL_DOWN_MS)
        })
        navigator.mediaSession.setActionHandler('pause', () => { 
            this.isPausePlayBtnActive = true
            this.togglePlayback()
            
            setTimeout(() => this.isPausePlayBtnActive = false, this.GESTURE_COOL_DOWN_MS)
        })
        navigator.mediaSession.setActionHandler('previoustrack', () => { 
            this.isPrevBtnActive = true
            this.skipToPRev()

            setTimeout(() => this.isPrevBtnActive = false, this.GESTURE_COOL_DOWN_MS)
        })
        navigator.mediaSession.setActionHandler('nexttrack', () => { 
            this.isNextBtnActive = true
            this.skipToNext()

            setTimeout(() => this.isNextBtnActive = false, this.GESTURE_COOL_DOWN_MS)
        })
    }

    /* Animations */

    /**
     * Make sliding text animations for Track title / subtitle.
     */
    initSlidingTextAnimations() {
        if (!this.trackTitleElement) {
            this.initPlayerElements()
        }

        this.trackTitleElAnimationObj = getSlidingTextAnimation(this.trackTitleElement!)
        this.trackArtistElAnimationObj = getSlidingTextAnimation(this.trackArtistNameElement!)

        this.updateState({
            trackTitleElAnimationObj: this.trackTitleElAnimationObj,
            trackArtistElAnimationObj: this.trackArtistElAnimationObj
        })
    }

    /**
     * Reset sliding text animation to create a new one.
     * Happens everytime the track container's width changes.
     */
    resetSlidingTextAnimations() {
        this.trackTitleElAnimationObj?.cancel()
        this.trackArtistElAnimationObj?.cancel()
    }

    /**
     * After a DOM update, get these elements again.
     */
    initPlayerElements() {
        this.trackTitleElement = getElemById("track-title")!
        this.trackArtistNameElement = getElemById("track-artist")!

        this.trackPlaybackBar = getElemById("playback-input")! as HTMLInputElement
        this.volumeTrackBar = getElemById("volume-input")! as HTMLInputElement
    }
}