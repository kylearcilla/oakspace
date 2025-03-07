import { derived, writable } from 'svelte/store'
import type { YoutubePlayer } from './youtube-player'
import type { YoutubeUserData } from './youtube-user-data'
import type { SessionManager } from './session-manager'

import type { DatePickerManager } from './date-picker-manager'
import { WEEKLY_ROUTINES } from '../tests/routines/routines.data'
import { themes } from './data-themes'

/* global ui */
export const globalContext = writable<GlobalContext>({
    leftBarOpen: true,
    rightBarOpen: true,
    rightBarFixed: false,
    leftBarFixed: false,
    hasToaster: false,
    route: "workspace",
    hotkeyFocus: "default",
    modalsOpen: []
})
export const themeState = writable<ThemeState>({
    isDarkTheme: true,
    lightTheme: "light",
    current: themes[0],
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

/* youtube */
export const ytUserDataStore = writable<YoutubeUserData| null>(null)
export const ytPlayerStore = writable<YoutubePlayer| null>(null)

/* session */
export const sessionManager = writable<SessionManager | null>(null)

/* general */
export const datePickerManager = writable<DatePickerManager | null>(null)

