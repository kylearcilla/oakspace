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
  
type MusicCollection = {
    id: string,
    name: string,
    author: string,
    artworkImgSrc: string,
    songCount: number,
    time: string,
    description: string,
    type: string,
    url: string | null,
    currentIndex: number,
};

type MusicDiscoverCollection = {
    title: string,
    author: string,
    artworkSrc: string,
    description: string,
    genre: string,
    length: number,
    albumId: string | null,
    playlistId: string | null
    url: string | null
}


type AppleUserCredentials = {
    devToken: string,
    musicUserToken: string
}

type MusicContext = {
    platform: MusicPlatform | null,
    platformName: string | null
}

type MusicPlayerData = {
    message: string,
    doShowPlayer: boolean,
    isCurrentlyPlaying: boolean,
    isDisabled: boolean,
    isRepeating: boolean,
    isShuffled: boolean
}

type MusicCollectionCategory = {
    title: string,
    artworkSrc: string,
    artworkBlurredSrc: string,
    artistCredit: string,
    description: string,
}

type MusicCollectionCategoryCollections = {
    appleMusic: MusicCollection[],
    spotify: MusicCollection[],
    soundcloud: MusicCollection[]
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
    selectedPlaylist: YoutubePlaylist | null,
    playlists: YoutubePlaylist[]
}

type YoutubePlaylist = {
    id: string,
    title: string,
    description: string,
    vidCount: number,
    channelId: string,
    thumbnailURL: string,
}

type YoutubeVideo = {
    id: string
    title: string
    likeCount: number
    viewCount: number
    publishedAt: string
    channelName: string
    channelImgSrc: string
    channelSubs: number
};

/* Custom Themes */
type Theme = {
    title: string,
    sectionDetails: {
        title: string
        index: number
    }
    properties: ThemeData
}

type DefaultTheme = Theme & {
    thumbnailImgSrc: string
}

type ColorTheme = Theme & {
    colorPalette: string[] | null,
}

type ImageTheme = Theme & {
    fullImgSrc: string
    artist: string
}

type VideoTheme = Theme & {
    vidUrl: string,
    channelName: string,
    channelImgSrc: string
}

type ThemeData = {
    isDark: boolean,
    hasTwin: boolean,
    primaryBgColor: string,
    secondaryBgColor: string,
    tertiaryBgColor: string,
    fgColor1: string,
    fgColor2: string,
    fgColor3: string,
    fgColor4: string,
    menuBorderVal: string,
    borderVal: string,
    borderVal2: string,
    shadowVal: string,
    shadowVal2: string,
    sessionBgColor: string,
    sessionBorderVal: string,
    sessionShadowVal: string,
    themeToggleBtnBgColor: string,
    iconToggleBtnBgColor: string,
    highlighterToggleBtnBgColor: string,
    activeSessionItemBorderVal: string,
    activeSessionItemShadowVal: string,
    textColor1: string,
    textColor2: string,
    profibleBorderColor: string,
    themeHighlightBorderColor: string,
    hoverColor: string,
    tabColor: string,
    tabHighlightColor: string,
    tabHighlightBoxShadow: string,
    tabColorTextColor: string,
    modalBgColor: string,
    modalFgColor: string,
    gridItemBorderVal: string,
    gridItemShadowVal: string,
    headerElementBgColor: string,
    headerElementBorderVal: string,
    dividerColor: string,
    pomBgColor: string,
    pomIconColor: string,
    muiscPlayerBgColor: string,
    musicProgressBgColor: string,
    navMenuBgColor: string,
    taskViewBgColor: string,
    pomProgressBarFgColor: string,
    pomProgressBarFgBoxShadow: string,
    pomProgressBgColor: string,
    pomProgressPlaybackBtnColor: string,
    navIconColor: string,
    navIconBgColor: string
}