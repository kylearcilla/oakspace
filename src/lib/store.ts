import { writable } from 'svelte/store'
import type { YoutubePlayer } from './youtube-player'
import type { SessionManager } from './session-manager'
import type { YoutubeUserData } from './youtube-user-data'

import { themes } from './data-themes'
import { WEEKLY_ROUTINES } from '../tests/routines/routines.data'

/* global ui */
export const globalContext = writable<GlobalContext>({
    user: {
        createdAt: new Date()
    },
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
    monthMetrics: null,
    activeStreak: null,
    viewHabit: null,
    yearMetrics: null,
    yearHeatMap: []
})

export const goalTracker = writable<GoalsStore>({
    init: false,
    viewGoal: null,
    goals: [],
    yearData: { 
        year: new Date().getFullYear(),
        data: null
    },
    quarterData: {
        quarter: 1,
        data: null
    },
    monthData: {
        month: 1,
        data: null
    },
    view: null
})

/* general authentication stuff */
export const googleData = writable<GoogleUserData | null>(null)

/* routine */
export const weekRoutine = writable<WeeklyRoutine | null>(WEEKLY_ROUTINES[0])

/* youtube */
export const ytUserStore = writable<YoutubeUserData| null>(null)
export const ytPlayerStore = writable<YoutubePlayer| null>(null)

/* session */
export const sessionManager = writable<SessionManager | null>(null)

