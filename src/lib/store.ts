import { derived, writable } from 'svelte/store'
import type { YoutubePlayer } from './youtube-player'
import type { YoutubeUserData } from './youtube-user-data'
import type { SessionManager } from './session-manager'

import { ShortcutSectionInFocus } from './enums'
import type { DatePickerManager } from './date-picker-manager'
import { WEEKLY_ROUTINES } from '../tests/routines/routines.data'

/* global ui */
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
    shortcutsFocus: "default",
    modalsOpen: [],
    lastKeysPressed: {
        shiftKey: false,
        metaKey: false,
        altKey: false,
        keyCode: ""
    }
})
export const themeState = writable<ThemeState>({
    isDarkTheme: true,
    lightTheme: "light",
    darkTheme: "dark"
})

export const timer = writable<{ date: Date }>({ date: new Date() })

export const habitTracker = writable<HabitStore>({
    habits: [],
    metrics: null
})

/* general authentication stuff */
export const googleData = writable<GoogleUserData | null>(null)

/* routine */
export const weekRoutine = writable<WeeklyRoutine | null>(WEEKLY_ROUTINES[0])
export const wkRoutine   = derived(weekRoutine, ($weekRoutine) => $weekRoutine, WEEKLY_ROUTINES[0])

/* youtube */
export const ytUserDataStore = writable<YoutubeUserData| null>(null)
export const ytPlayerStore = writable<YoutubePlayer| null>(null)

/* session */
export const sessionManager = writable<SessionManager | null>(null)
export const reviewSession = writable<Session | null>(null)

/* general */
export const datePickerManager = writable<DatePickerManager | null>(null)

