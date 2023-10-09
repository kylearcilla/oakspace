import { writable } from 'svelte/store'
import type { Session } from './pom-session'
import type { MusicPlayer } from './music-player'
import type { MusicData } from './music-data-apple'
import type { YoutubePlayer } from './youtube-player'
import type { YoutubeUserData } from './youtube-data'

/* App UI State */
export const homeViewLayout = writable<HomeLayout>({
    isNavMenuOpen: true,
    isTaskMenuOpen: true,
    isVideoViewOpen: false,
    isMusicPlayerOpen: false,
    minModeSrc: null,
    settingsModal: null
})
export const themeState = writable<ThemeState>({
    title: "Dark Mode",
    isDarkTheme: true,
    themeToggleBtnIconColor: "#3F3F3F",
    twinTheme: { sectionName: "default", index: 1 }
})
export const toastMessages = writable<ToastMsg[]>([])

/* General Authentication Stuff */
export const googleData = writable<GoogleUserData | null>(null)

/* YT Stuff */
export const ytUserDataStore = writable<YoutubeUserData| null>(null)
export const ytPlayerStore = writable<YoutubePlayer| null>(null)

/* Music Stuff: Music Player State */
export const musicPlayerStore = writable<MusicPlayer | null>(null)
export const musicDataStore = writable<MusicData | null>(null)

/* Session Stuff */
export const sessionStore = writable<Session | null>(null)