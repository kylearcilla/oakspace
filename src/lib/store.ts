import { writable } from 'svelte/store';
import type { MusicData } from './MusicData';
import type { MusicPlayer } from './MusicPlayer';

export const googleData = writable<GoogleUserData>({
    email: '',
    name: '',
    profileImgSrc: ''
})

export const ytCredentials = writable<YoutubeUserCreds>({
    accessToken: '',
    refreshToken: ''
})

export const ytUserData = writable<YoutubeUserData>({
    username: '',
    channelImgSrc: '',
    email: '',
    selectedPlaylistId: -1,
    playlists: []
});

export const currentYtVidId = writable(0)
export const ytCurrentVid = writable<YouTubePlaylist>({
    id: "",
    title: "",
    likeCount: "",
    viewCount: "",
    publishedAt: "",
    channelName: "",
    channelImgSrc: "",
    channelSubs: ""
})

/** Music Stuff */
export const appleMusicPlayerState = writable<MusicPlayer>()
export const musicDataState = writable<MusicData>()

export const appleUserCredentials = writable<AppleUserCredentials>({
    devToken: '',
    musicUserToken: ''
})

export const musicContext = writable<MusicContext>({
    platform: "",
    currentMedia: ""
})

export const userMusicPlaylists = writable<MusicPlaylist[]>([])

export const curentPlaylist = writable<MusicPlaylist>({
    id: "",
    name: "",
    artworkImgSrc: "",
    songCount: 0,
    time: "",
    description: "",
    type: "",
    currentIndex: 0,
})

export const currentTrack = writable<Track | LiveTrack>({
    id: "",
    name: "",
    artist: "",
    collection: "",
    artworkImgSrc: "",
    playlistId: "",
    playlistName: "",
    playlistArtworkSrc: ""
})

export const currentLiveTrack = writable<LiveTrack>({
    id: "",
    name: "",
    author: "",
    artworkImgSrc: "",
    description: ""
})

export const musicPlayerData = writable<MusicPlayerData>({
    message: "",
    doShowPlayer: false,
    isCurrentlyPlaying: false,
    isDisabled: true,
    isRepeating: false,
    isShuffled: false
})