type GoogleUserData = {
    email: string,
    name: string,
    profileImgSrc: string
}

type Quote = {
    text: string,
    bgImgSrc: string,
    artCredit: string,
    quoteCredit: string
}

/* Session Stuff */
type Medal = "🏅" | "🥈" | "🥉"
type SessionResult = { score: number, medal: Medal }
type Tag = {
    name: string,
    color: string
}
type SessionInputs = {
    name: string,
    tag: Tag
    poms: number,
    focusTime: number,
    breakTime: number,
    todos: string[]
    calculatedEndTime: Date | null,
    totalElapsedTime: string | null,
    timePeriodString: string | null
}

enum SessionState {
    EMPTY, 
    PAUSED, 
    FOCUSING, 
    ON_BREAK, 
    WAITING_TO_PROGRESS_BREAK, 
    WAITING_TO_PROGRESS_FOCUS, 
    FINISHED, 
    CANCELED, 
    FINISH_TOO_EARLY
}

type ActiveSessionState = {
    name: string,
    tag: Tag,
    pomTime: number,
    pomPeriods: number,
    breakTime: number,
    startTime: Date,
    calculatedEndTime: Date
    totalElapsedTime: string,
    timePeriodString: string,
    currentIndex: number,
    todos: { title: string, isChecked: boolean }[],
    todosCheckedCount: number,
    currentTime: { minutes: number, seconds: number } | null,
    currentPomPeriod: number,
    sessionState: SessionState,
    resultScore: SessionResult | null,
    pomMessage: string    
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
    isRecPlaylist: boolean
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

/* Analytics Stuff */
type ProdOverviewData = { 
    dayToBarDataArr: TagBarStat[]
    tagDistrMap: Map<string, TagDistrData>,
    maxHours: number,
    tags: { name: string, color: string }[],
}

type DayData = { 
    totalSessions: number, 
    totalHours: number, 
    sessionData: TagBarSegmentStat[] 
}

type GraphChartData = {
    maxHours: number
    chartDataMap: Map<string, TagBarStat>
}

type SessionWeeklyData = {
    tagDistributionMap: Map<string, TagDistrData>,
    avgSessions: number,
    avgFocusTime: number
}

type SessionDailyData = {
    tagDistributionMap: Map<string, TagDistrData>,
    sessionCount: number,
    focusTimeCount: number
}

type TagBarStat = {
    dateStr: string,
    date: Date,
    sessionsCount: number,
    focusHours: number,
    focusHoursStr: string,
    segments: TagBarSegmentStat[],
}

type TagBarSegmentStat = {
    name: string, 
    color: string,
    hrsTimesTen: number
}

type TagDistrData = { 
    name: string, 
    color: string, 
    hrsTimesTen: number, 
    hoursStr: string,
}

type DaySessionData = {
    date: Date,
    sessions: any[]
}

  
/* Theme Stuff */
type ThemeState = {
    title: string,  // to set styling specific only to Default Dark Mode
    isDarkTheme: boolean,     // to change styling specific only to dark / light themes
    themeToggleBtnIconColor: string,
    sectionTitle: string,
    headerTimeColor: string,
    twinTheme: {
        sectionName: string,
        index: number
    } | null
}

type Theme = {
    title: string,
    sectionDetails: {     // allows for easy selection of right theme from different array 
        title: string     // ...types instead of looking for theme w/ the right name
        index: number 
    }
    properties: ThemeData,
    twinTheme: {
        sectionName: string,
        index: number
    } | null
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
    isHeaderElementTextLight: boolean,
    primaryBgColor: string,
    secondaryBgColor: string,
    tertiaryBgColor: string,
    fgColor1: string,
    fgColor2: string,
    sessionBgColor: string,
    sessionBorderVal: string,
    sessionShadowVal: string,
    textColor1: string,
    textColor2: string,
    hoverColor: string,
    hoverColor2: string,
    hoverColor3: string,
    tabColor: string,
    tabHighlightColor: string,
    tabHighlightBoxShadow: string,
    headerElementBgColor: string,
    headerElementBorderVal: string,
    headerElementTextColor: string,
    headerElementShadow: string,
    headerTimeColor: string,
    modalBgAccentColor: string,
    modalBgColor: string,
    bentoBoxBgColor: string,
    bentoBoxBorder: string,
    bentoBoxShadow: string,
    muiscPlayerBgColor: string,
    musicProgressFgColor: string,
    navMenuBgColor: string,
    navIconColor: string,
    navIconBgColor: string,
    themeToggleBtnBgColor: string,
    iconToggleBtnBgColor: string,
    highlighterToggleBtnBgColor: string,
    midPanelBorder: string,
    midPanelShadow: string,            
    midPanelBaseColor: string,
    midPanelAccentColor: string,
    midPanelAccentAltColor: string,
    midPanelAccentTextColor: string,
    sidePanelBorder: string,
    sidePanelShadow: string,
    dropdownMenuBgColor: string,
    prodMenuViewShadow: string
}