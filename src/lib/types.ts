// avoid checking, issues occur when enums are imported
// @ts-nocheck

/* Misc. */
type AsyncResult = {
    sucess: boolean
    message?: string
}

type Result<T, E> = {
    result: T
    error: E
}

// Dates 
type MonthData = {
    monthIdx: number,
    firstDay: Date,    
    year: number,
    days: ({ date: Date, isInCurrMonth: boolean })[]
}

type ProductivityDay = {
    date: Date, 
    isInCurrMonth: boolean, 
    hadGoal: boolean, 
    hadSession: boolean
}

type ProductivityDate = {
    monthIdx: number,
    firstDay: Date,    
    year: number,
    days: ProductivityDay[]
} 

type CalendarOptions = {
    forwards?: boolean
    minDate?: Date | null 
    maxDate?: Date | null 
}

type DatePickerOptions = CalendarOptions

type FunctionParam = ((...args: any[]) => any) | ((...args: any[]) => Promise<any>) | null

// maps string section to corresponging theme arrays
type AppearanceSectionToThemeMap = { 
    default: DefaultTheme[], 
    light: ColorTheme[],
    dark: ColorTheme[],
    image: ImageTheme[],
    video: VideoTheme[]
}

type LogoContainerOptions = {
    hasBgColor?: boolean      // default: has bg
    containerWidth?: string,  // default: 24px
    iconWidth?: string,       // default: 50%, can be px
    borderRadius?: string,    // default: 100%
}

/* Authentication */
type GoogleUserData = {
    email: string,
    name: string,
    profileImgSrc: string
}
  
/* Home */
type HomeLayout = {
    isNavMenuOpen: boolean,
    isTaskMenuOpen: boolean,
    isVideoViewOpen: boolean,
    isMusicPlayerOpen: boolean,
    minModeSrc: string | null,
    isLeftWideMenuOpen: boolean,
    shortcutsFocus: ShortcutSectionInFocus
    modalsOpen: ModalType[]
}

type Toaster = {
    toasts: ToastItem[]
    position: ToasterPosition
    // deleteToast: (idx: number) => void
    // addToast: (toast: ToastItem) => void
}
interface ToastItem {
    context: ToastContext
    message: string
    action?: {
        func: FunctionParam
        text: string
    }
}
interface DOMToastItem extends ToastItem {
    offsets: {
        start: string,
        end: string
    }
    scales: {
        start: string,
        end: string
    }
    opacity: {
        start: number,
        end: number
    }
}


type Quote = {
    text: string,
    bgImgSrc: string,
    artCredit: string,
    quoteCredit: string
}

type HozScrollStatus = {
    hasReachedEnd: boolean,
    hasReachedStart: boolean,
    status: { 
        scrollLeft: number
        scrollWidth: number
        windowWidth: number 
    }
}

type VertScrollStatus = {
    hasReachedBottom: boolean,
    hasReachedTop: boolean,
    status: { 
        scrollTop: number
        scrollHeight: number
        windowHeight: number 
    }
}

/* Tasks */
type TaskGroup = {
    title: string,
    tasks: Task[]
}
type Task = {
    title: string,
    subtasks: SubTask[],
    description: string,
    isFinished: boolean
}
type SubTask = {
    title: string, 
    isFinished: boolean
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
    color: string,
    symbol: string
}

type SessionInputData = {
    name: string
    tag: Tag
    pomTime: number
    pomPeriods: number
    breakTime: number
    startTime: Date
    isPlaying: boolean
    endTime: Date | null
    calculatedEndTime: Date
    totalElapsedTime: string
    timePeriodString: string
    currentIndex: number
    currentPomPeriod: number
    lastFinishedPeriodIdx
    sessionResult: SessionResult | null
    todos: { title: string, isChecked: boolean }[]
    todosCheckedCount: number
    pomMessage: string,
    state: SessionState
    result: SessionResult | null
    currentTime: { minutes: number, seconds: number },
    userFocusTimeSecs: number,
    userBreakTimeSecs: number,
    currentSessionTimeSecs: number,
    sessionDurationMins: number,
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

type FloatingMediaEmbed = {
    mediaEmbedType: MediaEmbedType
    topPos: string
    leftPos: string
    fixed: MediaEmbedFixed
    width: string
    height: string
    leftTransform?: string
    topTransform?: string
}

type ProgressVisualPart = {
    type: ProgressVisualPartType
    offSetPerc: number,
    widthPerc: number | null, 
    periodIdx: number,
    segmentIdx: number
}

/* Music Stuff */
// music player plays media
type UserLibraryCollection = {
    items: Album[] | Playlist[] | Track[] | AudioBook[] | PodcastEpisode[] | Artist[]
    hasFetchedAll: boolean
    offset: number
    totalItems: number
}

type MusicMediaSelectContext = {
    collection: MediaMediaCollection
    itemClicked: Media
    idx: number
}

type MediaCollection = Playlist | Album | ArtistTopSongs | LibTracks | LibAlbums | LibEpisodes | LibAudiobooks

interface Media {
    id: string
    name: string
    author: string
    authorUrl: string
    artworkImgSrc: string
    genre: string
    url: string
    type: MusicMediaType
    fromLib: boolean
}

interface ArtistTopSongs extends Media {
    length: number
    description: string
}
interface Playlist extends Media {
    length: number
    description: string
}
interface Album extends Media {
    length: number
    description: string
}
interface Track extends Media {
    duration: number
    album: string
    albumId: string
    playlistId: string
}
interface PodcastEpisode extends Media {
    description: string
    duration: number
}
interface RadioStation extends Media {
    description: string
    isLive: boolean
}
interface AudioBook extends Media {
    description: string
}

// Library
interface LibTracks extends Media {
    length: number
    description: string
}
interface LibAlbums extends Media {
    length: number
    description: string
}
interface LibEpisodes extends Media {
    length: number
    description: string
}
interface LibAudiobooks extends Media {
    length: number
    description: string
}

type MediaClickedContext = {
    collection: MediaCollection
    itemClicked: Media
    idx: number
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
}

type MusicPlayerManagerState = {
    progressMs: number
    durationMs: number
    trackTitleElAnimationObj: Animation | null
    trackArtistElAnimationObj: Animation | null
    isSeeking: boolean
    isMouseDownOnInput: boolean
    isPausePlayBtnActive: boolean
    isPrevBtnActive: boolean
    isNextBtnActive: boolean
    onCooldown: boolean
}

type MusicPlayerState = {
    doShowPlayer: boolean,
    isPlaying: boolean,
    error: any,
    isDisabled: boolean,
    isRepeating: boolean,
    isShuffled: boolean,
    hasJustEnded: boolean
}

type MusicShufflerData = {
    startTrackIndex: number,
    trackIndex: number
    indexPointer: number,
    shuffledIndexes: number[],
    songCount: number
    totalPlayed: number
    hasCompleted: boolean
    state: MusicShufflerState
}

type MusicPlatformPropNames = "appleMusic" | "spotify"

type DiscoverCollection = {
    [platform in MusicPlatformPropNames]: Media[]
}

type MusicContext = {
    platform: MusicPlatform | null,
    platformName: string | null
}

type MusicCollectionCategory = {
    moodType: MusicMoodCategory
    artworkSrc: string
    artworkBlurredSrc: string
    artistCredit: string
    description: string
}

type MusicCollectionCategoryCollections = {
    appleMusic: MusicCollection[],
    spotify: MusicCollection[],
    soundcloud: MusicCollection[]
}

type MusicUserDataChildren = AppleMusicUserData | SpotifyMusicUserData

/* Apple Music Stuff */
type AppleMusicUserCollection = {
    artworkSrc: string
    description: string
    globalId: string
    id: string
    isOwn: true
    name: string
}

type AppleUserCredentials = {
    devToken: string,
    musicUserToken: string
}

/* Spotify Music Stuff */
type SpotifyInitData = {
    accessToken: string
    expiresIn: number
    refreshToken: string
    authCode: string
}
type SpotifyAuthTokenResponse = {
    access_token: string
    expires_in: number
    scope: string
    refresh_token: string
    tokenType: string
}
type MusicUserDetails = {
    id: string,
    username: string,
    url: string,
    isPremiumUser: boolean
    profileImgSmall: string
    profileImgBig: string
}

/* Youtube Stuff */
type YTOAuthResponse = {
    accessToken: string,
    email: string,
    username: string,
    profileImgSrc: string,
}

type YoutubeUserCreds = {
    accessToken: string,
    refreshToken: string
}

type YoutubeUserPlaylistResponse = {
    userPlaylists: YoutubePlaylist[]
    userPlaylistsNextPageToken: string
    userPlaylistLength: number
}

type YoutubePlaylistResponse = {
    videos: YoutubeVideo[]
    nextPageToken: string
    playlistLength: number
}

type YoutubeUserInfo = {
    username: string,
    profileImgSrc: string,
    email: string,
    userPlaylists: YoutubePlaylist[]
    userPlaylistsNextPageToken: string
    userPlaylistLength: number
    hasFetchedAllUserPls: boolean
}

type YoutubePlayerData = {
    playlist: YoutubePlaylist
    vid: YoutubeVideo
    playlistVidIdx: number
    doShowPlayer: boolean
}

type YoutubePlaylist = {
    id: string,
    title: string,
    description: string,
    vidCount: number,
    channelId: string,
    channelTitle: string,
    thumbnailURL: string,
    channelImgSrc: string,
    channelURL: string,
    firstVidId: string | null
}

type YoutubePlayerOptions = {
    height: string,
    width: string,
    playerVars: { autoplay: number, modestbranding: number, rel: number, volume: number }
    events: {
        onReady: null | ((...args: any[]) => void) | ((...args: any[]) => Promise<void>),
        onStateChange: null | ((...args: any[]) => void) | ((...args: any[]) => Promise<void>),
        onError: null | ((...args: any[]) => void) | ((...args: any[]) => Promise<void>),
    }
}

type YoutubeChannel = {
    channelId: string
    channelName: string
    channelImgSrc: string
    channelSubs: string
    channelUrl: string
}

type YoutubeVideo = {
    id: string
    title: string
    likeCount: string
    viewCount: string
    publishedAt: string
    channelId: string
    channelName: string
    channelImgSrc: string
    channelSubs: string
    channelUrl: string
};

type YoutubeMediaId = { 
    type: YTMediaLinkType
    id: string 
}

/* Goals */
type Goal = {
    id: string
    tag: Tag
    title: string
    description: string
    dueDate: Date | null
    creationDate: Date
    accomplishedDate: Date | null
    status: GoalStatus
    milestonesDone: number,
    milestones: Milestone[]
    idx: number
    globalIdx: number
    sectionId: number
    sectionIdx: number
    imgSrc: string
    isImgHidden: boolean
    isArchived: boolean
    isPinned: boolean
}
type GoalSection = {
    name: string
    orderIdx: number
    length: number
    isExpanded: boolean
    tagRef: ""
}
type Milestone = {
    title: string
    id: string
    idx: number
    endDate: Date | null
}
type GoalSectionItemId = {
    sectionId: number,
    sectionItemIdx: number
}
type YrAccomplishmentsOverview = {
    newGoals: number,
    milestonesReached: number,
    goalsAccomplished: number,
    accomplishments: Accomplishment[]
}
type Accomplishment = {
    title: string
    date: Date
    tagRef: {
        id: string
        title: string
        symbol: string,
        color: string
    },
    goalRef: {
        id: string
        title: string
    }
    isMilestone: boolean
}

/* Analytics Stuff */
type SessionInputData = { 
    tagName: string, 
    hours: number, 
    color: string  
}

type DaySessionData = {
    date: Date,
    sessions: SessionInputData[]
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
    title: string
    isDarkTheme: boolean
    themeToggleBtnIconColor: string
    twinTheme: { sectionName: keyof AppearanceSectionToThemeMap, index: number } | null
}

interface Theme {
    title: string
    sectionDetails: { title: keyof AppearanceSectionToThemeMap, index: number }
}

interface ColorTheme extends Theme {
    colorPalette: string[]
    styling: ColorThemeProps
    twinTheme: { sectionName: keyof AppearanceSectionToThemeMap, index: number } | null
}

interface DefaultTheme extends ColorTheme {
    thumbnailImgSrc: string
}

interface ImageTheme extends Theme {
    fullImgSrc: string
    thumbnailImgSrc: string
    artist: string
}

interface VideoTheme extends Theme {
    vidSrc: string
    thumbnailSrc: string
    channelName: string
}

type ColorThemeProps = {
    isDark: boolean
    hasTwin: boolean
    primaryBgColor: string
    fgColor1: string
    fgColor2: string
    sessionBgColor: string
    sessionBorderVal: string
    sessionShadowVal: string
    textColor1: string
    textColor2: string
    hoverColor: string
    hoverColor2: string
    hoverColor3: string
    tabColor: string
    tabHighlightColor: string
    tabHighlightBoxShadow: string
    headerBgColor: string
    headerBorder: string
    headerBoxShadow: string
    headerTextColor: string
    headerIconColor: string
    headerProgressColor1: string
    headerProgressColor2: string
    headerTrackColor1: string
    headerTrackColor2: string
    baseProgressColor1: string
    baseProgressColor2: string
    baseTrackColor1: string
    baseTrackColor2: string
    progressBallGlow: string
    pomToolTipBgColor: string
    pomToolTipTextColor: string
    modalBgAccentColor: string
    modalBgColor: string
    bentoBoxBgColor: string
    bentoBoxBorder: string
    bentoBoxShadow: string
    muiscPlayerBgColor: string
    musicProgressFgColor: string
    navMenuBgColor: string
    navIconColor: string
    navIconBgColor: string
    navMenuBorder: string
    navMenuBoxShadow: string
    wideLeftBarColor: string
    wideLeftBarBorder: string
    wideLeftBarBoxShadow: string
    wideLeftBarTabColor: string
    wideLeftBarTabIconColor: string
    sessionBlockColor: string
    rightBarMindNoteBgColor: string
    themeToggleBtnBgColor: string
    iconToggleBtnBgColor: string
    highlighterToggleBtnBgColor: string
    midPanelBorder: string
    midPanelShadow: string            
    midPanelBaseColor: string
    midPanelAccentColor1: string
    midPanelAccentColor2: string
    midPanelAccentColor3: string
    midPanelAccentTextColor: string
    sidePanelBorder: string
    sidePanelShadow: string
    sidePanelTabBgColor: string
    sidePanelTabHighlightColor: string
    sidePanelLightAccentColor: string
    rightBarBgColor: string
    rightBarBgBoxShadow: string
    tasksCheckBoxColorDefault: string
    tasksCheckBoxColorComplete: string
    tasksSubtaskFocusColor: string
    tasksCheckColor: string
    tasksLightTextColor: string
    dropdownMenuBgColor1: string
    dropdownMenuBgHoverColor1: string
}