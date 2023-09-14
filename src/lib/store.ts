import { writable } from 'svelte/store';
import type { MusicData } from './music-data';
import type { MusicPlayer } from './music-player';
import { defaultThemes } from './data-themes';
import type { Session } from './pom-session';

export const homePanelData = writable<any>({
    isNavMenuOpen: true,
    isTaskMenuOpen: true,
    isVideoViewVisible: true,
    isMusicPlayerlarge: true,
})

/* General Authentication Stuff */
export const googleData = writable<GoogleUserData>({
    email: '',
    name: '',
    profileImgSrc: ''
})

/* YT Stuff */
export const ytCredentials = writable<YoutubeUserCreds>({
    accessToken: '',
    refreshToken: ''
})

export const ytUserData = writable<YoutubeUserData>({
    username: '',
    channelImgSrc: '',
    email: '',
    selectedPlaylist: null,
    playlists: []
});

export const currentYtVidId = writable(0)
export const ytCurrentVid = writable<any>({
    id: "",
    title: "",
    likeCount: "",
    viewCount: "",
    publishedAt: "",
    channelName: "",
    channelImgSrc: "",
    channelSubs: ""
})

/* Music Stuff */
export const appleMusicPlayerState = writable<MusicPlayer>()
export const musicDataState = writable<MusicData>()

export const appleUserCredentials = writable<AppleUserCredentials | null>(null)
export const userMusicPlaylists = writable<MusicCollection[] | null>(null)
export const curentPlaylist = writable<MusicCollection | null>(null)
export const currentTrack = writable<Track | null>(null)
export const musicPlayerData = writable<MusicPlayerData | null>(null)

/* Session Stuff */
export const globalSessionObj = writable<Session | null>(null)
export const globalSessionState = writable<ActiveSessionState | null>(null)

/* Color Stuff */
export const colorThemeState = writable<ThemeState>({
    title: "Dark Mode",  // to set styling specific only to Default Dark Mode
    isDarkTheme: true,     // to change styling specific only to dark / light themes
    themeToggleBtnIconColor: "#3F3F3F",
    sectionTitle: "default",
    headerTimeColor: "#BCBCBC",
    twinTheme: {
        sectionName: "defaultThemes",
        index: 1
    }
})