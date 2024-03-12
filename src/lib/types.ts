// @ts-nocheck

// avoid checking, issues occur when enums are imported

/* Misc. */
type Result<T, E> = {
    result: T
    error: E
}
InputOptions
type HhMmFormat = "full-letters" | "mid-letters" | "min-letters" | "numbers"

type IconOptions = {
    id?: string
    width?: number
    height?: number
    strokeWidth?: number
    scale?: number
    color?: string
    opacity?: number   
}

type RoutineCores = { 
    sleeping: {
        status: CoreStatus
        totalTime: number
        avgTime: number
        total: number
    },
    working: {
        status: CoreStatus
        totalTime: number
        avgTime: number
        total: number
    },
    mind: {
        status: CoreStatus
        totalTime: number
        avgTime: number
        total: number
    },
    awake: {
        status: CoreStatus
        totalTime: number
        avgTime: number
        total: number
    },
    body: {
        status: CoreStatus
        totalTime: number
        avgTime: number
        total: number
    },
    selfCare: {
        status: CoreStatus
        totalTime: number
        avgTime: number
        total: number
    }
}

type RoutineActvity = keyof RoutineCores

type InputOptions = {
    id?: string
    placeholder: string,
    initValue: string
    maxLength?: number
    handlers?: {
        onInputHandler?: FunctionParam
        onBlurHandler?: FunctionParam
        onFocusHandler?: FunctionParam
    }
}

type DropdownBtn = {
    "title": string
    "hasArrow?": boolean
    "arrowOnHover?": boolean
    "hasBg?": boolean
    "onClick": FunctionParam
    "styles?": {
        "font-size?": string
        "padding?": string
    }
}

type DropdDownListItem = {
    name: string,
    leftIcon?: string,
    rightIcon?: string
}

type DropdownListOptions = {
    listItems: DropdDownListItem[]
    pickedItemIdx?: number
    onListItemClicked: FunctionParam
    onClickOutside: FunctionParam
    position?: {
        top?: string, left?: string, bottom?: string, right?: string
    }
    checkOptions?: {
        currentItemChecked: string
    }
    zIndex?: number
    width?: string
}

type Color = {
    id: string
    light1: string
    light2: string
    light3: string
    dark1: string
    dark2: string
    dark3: string
}

type WeekBlocks = {
    Mon: RoutineBlock[], Tue: RoutineBlock[]
    Wed: RoutineBlock[], Thu: RoutineBlock[]
    Fri: RoutineBlock[], Sat: RoutineBlock[]
    Sun: RoutineBlock[]
}
type WeekBlockElems = {
    Mon: RoutineBlockElem[], Tue: RoutineBlockElem[]
    Wed: RoutineBlockElem[], Thu: RoutineBlockElem[]
    Fri: RoutineBlockElem[], Sat: RoutineBlockElem[]
    Sun: RoutineBlockElem[]
}
type TagBreakDown = {
    tag: Tag,
    data: {
        avgTime: number,
        totalTime : number,
        total: number
    }
}
type RoutineBlock = {
    title: string
    color: Color
    startTime: number
    endTime: number
    tag: Tag | null
    activity: RoutineActvity | null
}
type RoutineBlockElem = {
    id: string, height: number, xOffset: string, yOffset: string,
    startTimeStr: string, endTimeStr: string
} & RoutineBlock

type DailyRoutine = {
    id: string
    name: string
    description: string
    blocks: RoutineBlock[]
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

type FunctionParam = ((...args: any[]) => any) | ((...args: any[]) => Promise<any>)

// maps string section to corresponging theme arrays
type AppearanceSectionToThemeMap = { 
    default: DefaultTheme[], 
    light: ColorTheme[],
    dark: ColorTheme[],
    image: ImageTheme[],
    video: VideoTheme[]
}

type LogoContainerOptions = {
    hasBgColor?: boolean
    containerWidth?: string
    iconWidth?: string
    borderRadius?: string
}

/* Authentication */
type GoogleUserData = {
    email: string,
    name: string,
    profileImgSrc: string
}


type KeyContext = {
    shiftKey: boolean
    metaKey: boolean
    altKey: boolean
    keyCode: string
}
  
/* Home */
type GlobalContext = {
    isNavMenuOpen: boolean
    isTaskMenuOpen: boolean
    isVideoViewOpen: boolean
    isMusicPlayerOpen: boolean
    hasToaster: boolean
    minModeSrc: string | null
    isLeftWideMenuOpen: boolean
    shortcutsFocus: ShortcutSectionInFocus
    modalsOpen: ModalType[]
    lastKeysPressed: KeyContext
}

type ToastInitOptions = {
    message: string
    action?: {
        label: string,
        onClick: (event: MouseEvent) => void
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


type HozScrollMaskedGradient = {
    styling: string,
    scrollStatus: HozScrollStatus
}

type VertScrollMaskedGradient = {
    styling: string,
    scrollStatus: VertScrollStatus
}
  

type HozScrollStatus = {
    hasReachedEnd: boolean,
    hasReachedStart: boolean,
    details: { 
        scrollLeft: number
        scrollWidth: number
        windowWidth: number 
    }
}

type VertScrollStatus = {
    hasReachedBottom: boolean,
    hasReachedTop: boolean,
    details: { 
        scrollTop: number
        scrollHeight: number
        windowHeight: number 
    }
}

/* Tasks */
type TaskGroup = {
    title: string,
    tasks: Task_[]
}
type Task_ = {
    title: string,
    subtasks: SubTask_[],
    description: string,
    isFinished: boolean
}
type SubTask_ = {
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

type ColorSwatch = {
    id: string
    primary: string
    light1: string
    light2: string
    light3: string
    dark1:  string
    dark2:  string
    dark3: string
}

type Tag = {
    id: string
    name: string,
    symbol: {
        color: ColorSwatch,
        emoji: string
    }
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

interface Task {
    id: string,
    idx: number,
    isChecked: boolean,
    title: string,
    description: string
    subtasks?: Subtask[]
}
interface Subtask implements Omit<Task, "description" | "subtasks"> { 
    id: string,
    idx: number,
    isChecked: boolean,
    title: string,
    taskId: string
}

type TaskListType = "ordered" | "tasks-linked" | "subtasks-linked" | "dated" | "subtasks"

type TaskListTypeCombos = `${TaskListType} ${TaskListType} ${TaskListType} ${TaskListType}` | 
                          `${TaskListType} ${TaskListType} ${TaskListType}` | 
                          `${TaskListType} ${TaskListType}` |
                          `${TaskListType}` | null

type TaskListReorder = {
    taskId: string
    newIdx: number
    oldIdx: number
}

type CSSPxVal   = `${number}px`
type CSSREMVal   = `${number}rem`
type CSSUnitVal = CSSPxVal | `${number}%`
type CSSMultiDimPxVal = `${number}px` | 
                        `${number}px ${number}px` | 
                        `${number}px ${number}px ${number}px` | 
                        `${number}px ${number}px ${number}px ${number}px` 

type ContextMenuOptions = {
    width: CSSUnitVal
}

type ElemDimensions = {
    padding?: CSSMultiDimPxVal
    margin?: CSSMultiDimPxVal
    height?: CSSPxVal
    width?: CSSUnitVal
    color?: string
    backgroundColor?: string
    fontSize?: CSSREMVal
}

type TasksListOptions<TaskListTypeCombos> = {
    id: string
    type: TaskListTypeCombos
    tasks: Task[]
    styling?: {
        list?: ElemDimensions
        task?: ElemDimensions
        subtask?: ElemDimensions
        checkbox?: ElemDimensions
        description?: ElemDimensions
        descriptionInput?: { fontSize: CSSREMVal }
    }
    handlers?: {
        onTaskEdit: (task: Task) => any
        onSubtaskEdit: (subtask: Subtask) => any
        onListReorder: (action: TaskListOptions) => any
        onTasksUpdated?: () => any
    }
    ui?: {
        showDragHandle?: boolean
        hideTaskBtn?: boolean
        isMin?: boolean
        sidePadding?: CSSUnitVal
        hasTaskDivider?: boolean
    }
    cssVariables?: {
        checkBoxFill?: string
        checkBoxEmpty?: string
        checkIcon?: string
        taskBgColor?: string
        taskHoverBgColor?: string
        floatingTaskBgColor?: string
    },
    dragAndDrop?: DragAndDropHandler
    contextMenuOptions: ContextMenuOptions
}

interface TaskListOptionsInterface extends TasksListOptions<TaskType> { }

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
    [platform in MusicPlatformPropNames]: Partial<Media & { length: number}>[]
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
    accessTokenCreationDate: Date
}

type YoutubeUserPlaylistResponse = {
    userPlaylists: YoutubePlaylist[]
    userPlsNextPageToken: string
    userPlaylistsTotal: number
}

type YoutubePlaylistResponse = {
    videos: YoutubeVideo[]
    nextPageToken: string
    playlistLength: number
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
interface Milestone implements Task { 
    id: string,
    idx: number,
    isChecked: boolean,
    title: string,
    description: string
    date: Date | null 
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