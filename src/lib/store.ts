import { writable } from 'svelte/store';

export const googleData = writable({
    email: '',
    name: '',
    profileImgSrc: ''
})

export const ytCredentials = writable({
    accessToken: '',
    refreshToken: ''
})

export const ytUserData = writable({
    username: '',
    channelImgSrc: '',
    email: '',
    selectedPlaylistId: -1,
    playlists: []
});

type YouTubePlaylist = {
    id: string;
    title: string;
    channelTitle: string;
    thumbnailURL: string;
    vidCount: number;
};

export const currentYtVidId = writable(0)
export const ytCurrentVid = writable({
    id: "",
    title: "",
    likeCount: "",
    viewCount: "",
    publishedAt: "",
    channelName: "",
    channelImgSrc: "",
    channelSubs: ""
})