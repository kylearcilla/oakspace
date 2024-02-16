import { get } from "svelte/store"
import { musicPlayerManager, musicPlayerStore } from "./store"

import { findEnumIdxFromDiffEnum, getElemById } from "./utils-general"
import { INPUT_RANGE_BG_COLOR, getSeekPositionSecs, getSlidingTextAnimation } from "./utils-music-player"

import { LogoIcon, MusicPlatform } from "./enums"
import type { AppleMusicPlayer } from "./music-apple-player"
import type { SpotifyMusicPlayer } from "./music-spotify-player"
/**
 * Manager class for handling state changes from music data class and changes from user gestures.
 * Handles Music Player UI chanegs.
 */
export class MusicPlayerManager {
    musicPlatform: MusicPlatform
    playerStore: AppleMusicPlayer | SpotifyMusicPlayer | null
    icon: LogoIcon
    iconOptions: LogoContainerOptions
    
    isSeeking = false    
    progressValue = "0"
    isMouseDownOnInput = false
    hasOnChangeFired = false
    didJustMouseUp = false
    
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
    musicPlaybackBar: HTMLInputElement | null = null
    
    trackTitleElAnimationObj: Animation | null = null
    trackArtistElAnimationObj: Animation | null = null

    ACTIVE_TO_INACTIVE_BTN_DEAY = 150
    LOGO_WIDTH = 19
    BORDER_RADIUS = 100
    MUSIC_PLAYER_ICON_OPTIONS = {
        AppleMusic: { iconWidth: "45%" },
        Spotify: { iconWidth: "80%", hasBgColor: false },
        YoutubeMusic: { iconWidth: "60%" },
        Soundcloud: { iconWidth: "60%" },
        Youtube: { iconWidth: "60%" },
        Google: { iconWidth: "60%" },
        Luciole: { iconWidth: "60%" }
    }

    constructor(musicPlatform: MusicPlatform) {
        this.musicPlatform = musicPlatform
        this.playerStore = get(musicPlayerStore)!

        // get the icon enum & options to be used in Icon component
        const platformIconEnumIdx = findEnumIdxFromDiffEnum(musicPlatform, MusicPlatform, LogoIcon)
        this.icon = platformIconEnumIdx === null ? LogoIcon.Luciole : platformIconEnumIdx as LogoIcon

        
        const iconStrIdx = LogoIcon[this.icon] as keyof typeof this.MUSIC_PLAYER_ICON_OPTIONS
        this.iconOptions = this.MUSIC_PLAYER_ICON_OPTIONS[iconStrIdx]

        musicPlayerManager.set({
            progressMs: this.progressMs, 
            durationMs: this.durationMs,
            trackTitleElAnimationObj: null, 
            trackArtistElAnimationObj: null,
            isSeeking: false,
            isMouseDownOnInput: false,
            isPausePlayBtnActive: false,
            isPrevBtnActive: false,
            isNextBtnActive: false
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

            return _state
        })
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
    
    toggleIsMouseDownOnInput(isMouseDownOnInput: boolean) {
        this.isMouseDownOnInput = isMouseDownOnInput
        this.updateState({ isMouseDownOnInput })
    }


    /* Listeners */
    onMediaItemUpdate(store: AppleMusicPlayer | SpotifyMusicPlayer) {
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

    onPlaybackUpdate(store: AppleMusicPlayer | SpotifyMusicPlayer) {
        const _progressMs = store!.currentPosition
        const _durationMs = store!.currentDuration
        const doAllowUpdate = store!.doAllowUpdate

        // isSeeking will be false despite clearing timeout on mousedown
        const doUpdate = !this.isSeeking && !this.isMouseDownOnInput && doAllowUpdate
        const doUpdateDuration = doUpdate && _durationMs != this.durationMs
        const doUpdateProgress = doUpdate && _progressMs != this.progressMs

        // update only when neeeded
        if (!doUpdateDuration && !doUpdateProgress) return

        if (doUpdateDuration) {
            this.updateMediaItemTimeDuration(_durationMs)
        }
        if (doUpdateProgress) {
            this.updateMediaItemProgress(_progressMs)
        }

        this.updateProgressOnUpdate()
    }
    handleKeyUp(event: KeyboardEvent) {
        if (event.code !== "Space") return
        // togglePlayback()
        // isPausePlayBtnActive = false
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

    /* Input RangeFunctionality */
    updateProgressOnUpdate() {
        if (!this.trackPlaybackBar || this.isSeeking || this.didJustMouseUp) return

        this.progressValue = `${this.durationMs >= 0 ? ((this.progressMs / this.durationMs) * 100) : 0}`
        this.updatePlaybackBarStyleAfterUpdatte()
    }
    trackProgressOnInput() {
        this.progressValue = this.trackPlaybackBar!.value
        this.updatePlaybackBarStyleAfterUpdatte()

        this.updateMediaItemProgress((+this.progressValue / 100) * this.durationMs)
    }
    trackProgressOnChange() {
        this.hasOnChangeFired = true
        this.didJustMouseUp = false
        this.changeProgressValueAfterGesture(this.trackPlaybackBar!.value)
    }
    changeProgressValueAfterGesture(val: string) {
        this.progressValue = val
        this.updatePlaybackBarStyleAfterUpdatte()

        const seekToSecs = getSeekPositionSecs(+this.progressValue, this.durationMs)
        this.seekTo(seekToSecs)

        this.toggleSeeking(false)
    }
    updatePlaybackBarStyleAfterUpdatte() {
        this.trackPlaybackBar!.style.background = `linear-gradient(to right, white 0%, white ${this.progressValue}%, ${INPUT_RANGE_BG_COLOR} ${this.progressValue}%, ${INPUT_RANGE_BG_COLOR} 100%)`
        this.trackPlaybackBar!.value = `${this.progressValue}`
    }
    onInputMouseDown() {
        if (this.musicPlatform === MusicPlatform.Spotify && (get(musicPlayerStore)! as SpotifyMusicPlayer).doIgnoreAutoPlay) {
            return
        }

        this.toggleSeeking(true)
        this.toggleIsMouseDownOnInput(true)
    }
    onInputMouseUp(e: MouseEvent) {
        this.toggleIsMouseDownOnInput(false)
        this.didJustMouseUp = true

        // onChange sometimes will not fire when it should
        this.mouseUpTimeOut = setTimeout(() => {
            this.mouseUpTimeOut = null
            clearTimeout(this.mouseUpTimeOut!)
            
            if (this.hasOnChangeFired) return

            const progressVal = (e.offsetX / this.trackPlaybackBar!.clientWidth) * 100
            this.changeProgressValueAfterGesture(`${Math.min(Math.max(0, progressVal), 100)}`)
            this.didJustMouseUp = false
            this.hasOnChangeFired = false
        }, 0)
    }

    /* Player Functionality  */
    togglePlayback() {
        this.playerStore!.togglePlayback()
    }
    seekTo(secs: number) {
        this.playerStore!.seekTo(secs)
    }
    skipToNext() {
        this.playerStore!.togglePlayback()
    }
    skipToPRev() {
        this.playerStore!.togglePlayback()
    }

    /* Media Session */
    initMediaSessionEventHandlers() {
        this.hasMediaEventHandlersSet = true
        navigator.mediaSession.setActionHandler('play', () => { 
            this.isPausePlayBtnActive = true
            this.togglePlayback()

            setTimeout(() => this.isPausePlayBtnActive = false, this.ACTIVE_TO_INACTIVE_BTN_DEAY)
        })
        navigator.mediaSession.setActionHandler('pause', () => { 
            this.isPausePlayBtnActive = true
            this.togglePlayback()
            
            setTimeout(() => this.isPausePlayBtnActive = false, this.ACTIVE_TO_INACTIVE_BTN_DEAY)
        })
        navigator.mediaSession.setActionHandler('previoustrack', () => { 
            this.isPrevBtnActive = true
            this.skipToPRev()

            setTimeout(() => this.isPrevBtnActive = false, this.ACTIVE_TO_INACTIVE_BTN_DEAY)
        })
        navigator.mediaSession.setActionHandler('nexttrack', () => { 
            this.isNextBtnActive = true
            this.skipToNext()

            setTimeout(() => this.isNextBtnActive = false, this.ACTIVE_TO_INACTIVE_BTN_DEAY)
        })
    }

    /* Animations */

    /**
     * Make sliding text animations for Track title / subtitle.
     */
    initSlidingTextAnimations() {
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
        this.musicPlaybackBar = getElemById("volume-input")! as HTMLInputElement
    }
}