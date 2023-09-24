type HomePandelData = {
    isNavMenuOpen: boolean
    isTaskMenuOpen: boolean
    isVideoViewOpen: boolean
}

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
type SessionResult = { 
    score: number, 
    medal: Medal ,
    message: string,
    resultImgUrl: string
}
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
}
  
type AppleMusicUserCollection = {
    artworkSrc: string
    description: string
    globalId: string
    id: string
    isOwn: true
    name: string
}

type MusicCollection = {
    id: string,
    name: string,
    author: string,
    artworkImgSrc: string,
    songCount: number,
    genre: string,
    description: string,
    type: string,
    url: string | null,
};

type MusicDiscoverCollection = {
    name: string,
    author: string,
    artworkImgSrc: string,
    description: string,
    genre: string,
    songCount: number,
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

type MusicPlayerState = {
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
type SessionData = { 
    tagName: string, 
    hours: number, 
    color: string  
}

type DaySessionData = {
    date: Date,
    sessions: SessionData[]
}

type ProdOverviewData = { 
    chartData: ChartData
    timeFrameInsightData: PordOverViewInisightData
}

type PordOverViewInisightData = {
    tagDistrData: TagDistrDataPoint[],
    sessionCountData: SessionCountData
    focusTimeData: FocusTimeData
}

type ChartData = {
    dayToBarDataArr: any[]
    maxHours: number,
    tags: Tag[]
}

type TagDistrDataPoint = { 
    name: string, 
    color: string, 
    hours: number,
    hoursStr: string,
    fraction: number
}

type SessionCountData = {
    isDay: boolean,
    percChange: number
    count: number
}

type FocusTimeData = {
    isDay: boolean
    percChange: number
    hours: number
}

type TimeFrameActivity = {
    timeFrame: string
    allTimeMins: number
}

type TagMonthlyActivity = {
    month: string,
    sessionsDone: number
    focusHrs: number
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
    midPanelAccentColor1: string,
    midPanelAccentColor2: string,
    midPanelAccentColor3: string,
    midPanelAccentTextColor: string,
    sidePanelBorder: string,
    sidePanelShadow: string,
    dropdownMenuBgColor: string,
    prodMenuViewShadow: string
}