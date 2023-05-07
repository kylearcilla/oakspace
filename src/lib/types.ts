type GoogleUserData = {
    email: string,
    name: string,
    profileImgSrc: string
}

/* Music Stuff */
enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }

type Track = {
    id: string;
    name: string;
    artist: string;
    collection: string;
    artworkImgSrc: string;
    playlistId: string;
    playlistName: string;
    playlistArtworkSrc: string;
};

type LiveTrack = {
    id: string,
    name: string,
    author: string,
    artworkImgSrc: string,
    description: string
};
  
type MusicPlaylist = {
    id: string,
    name: string,
    artworkImgSrc: string,
    songCount: number,
    time: string,
    description: string,
    type: string,
    currentIndex: number,
};

type AppleUserCredentials = {
    devToken: string,
    musicUserToken: string
}

type MusicContext = {
    platform: string,
    currentMedia: string
}

type MusicPlayerData = {
    message: string,
    doShowPlayer: boolean,
    isCurrentlyPlaying: boolean,
    isDisabled: boolean,
    isRepeating: boolean,
    isShuffled: boolean
}


/* Video Stuff */

type YoutubeUserCreds = {
    accessToken: string,
    refreshToken: string
}

type YoutubeUserData = {
    username: string,
    channelImgSrc: string,
    email: string,
    selectedPlaylistId: number,
    playlists: YouTubePlaylist[]
}

type YouTubePlaylist = {
    id: string
    title: string
    likeCount: string
    viewCount: string
    publishedAt: string
    channelName: string
    channelImgSrc: string
    channelSubs: string
};
