import { derived, writable } from 'svelte/store'
import type { MusicPlayer } from './music-player'
import type { YoutubePlayer } from './youtube-player'
import type { YoutubeUserData } from './youtube-user-data'
import type { SessionManager } from './session-manager'

import { ShortcutSectionInFocus } from './enums'
import type { DatePickerManager } from './date-picker-manager'
import type { MusicSettingsManager } from './music-settings-manager'
import { WEEKLY_ROUTINES } from '../tests/routines/routines.data'
import type { YoutubeMusicUserData } from './youtube-music-user-data'

/* App UI State */
export const globalContext = writable<GlobalContext>({
    leftBarOpen: true,
    rightBarOpen: true,
    rightBarFixed: false,
    isVideoViewOpen: false,
    freeFloatYt: false,
    leftBar: "wide-float",
    isMusicPlayerOpen: false,
    hasToaster: false,
    minModeSrc: null,
    route: "workspace",
    focusTime: 0,
    shortcutsFocus: ShortcutSectionInFocus.MAIN,
    modalsOpen: [],
    lastKeysPressed: {
        shiftKey: false,
        metaKey: false,
        altKey: false,
        keyCode: ""
    }
})
export const themeState = writable<ThemeState>({
    title: "Dark Mode",
    isDarkTheme: true
})

/* General Authentication Stuff */
export const googleData = writable<GoogleUserData | null>(null)

/* Active Routine */
export const weekRoutine = writable<WeeklyRoutine | null>(WEEKLY_ROUTINES[0])
export const wkRoutine   = derived(weekRoutine, ($weekRoutine) => $weekRoutine, WEEKLY_ROUTINES[0])

/* YT Stuff */
export const ytUserDataStore = writable<YoutubeUserData| null>(null)
export const ytPlayerStore = writable<YoutubePlayer| null>(null)

/* Music Stuff: Music Player State */
export const musicPlayerStore = writable<MusicPlayer | null>(null)
export const musicDataStore = writable<YoutubeMusicUserData | null>(null)

export const musicPlayerManager = writable<MusicPlayerManagerState | null>(null)
export const musicSettingsManager = writable<MusicSettingsManager | null>(null)

/* Session Stuff */
export const sessionManager = writable<SessionManager | null>(null)
export const reviewSession = writable<Session | null>(null)

/* General Stuff */
export const datePickerManager = writable<DatePickerManager | null>(null)

