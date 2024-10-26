import { derived, writable } from 'svelte/store'
import type { MusicPlayer } from './music-player'
import type { YoutubePlayer } from './youtube-player'
import type { YoutubeUserData } from './youtube-user-data'
import type { SessionManager } from './session-manager'

import type { GoalsManager } from './goals-manager'
import { ShortcutSectionInFocus } from './enums'
import type { EditGoalManager } from './edit-goal-manager'
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
    doOpenActiveRoutine: false,
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
    isDarkTheme: true,
    themeToggleBtnIconColor: "#3F3F3F",
    twinTheme: { sectionName: "default", index: 1 }
})

/* General Authentication Stuff */
export const googleData = writable<GoogleUserData | null>(null)

/* Home View Stuff */
export const mediaEmbedStore = writable<FloatingMediaEmbed | null>(null)

/* Active Routine */
export const weekRoutine = writable<WeeklyRoutine | null>(WEEKLY_ROUTINES[0])
export const wkRoutine   = derived(weekRoutine, ($weekRoutine) => $weekRoutine, WEEKLY_ROUTINES[0])

/* Goals Stuff */
export const goalsManager = writable<GoalsManager | null>(null)
export const editGoalManger = writable<EditGoalManager | null>(null)

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

