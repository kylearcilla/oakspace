// @ts-nocheck

// avoid checking, issues occur when enums are imported

/* Misc. */
type Result<T, E> = {
    result: T
    error: E
}
InputOptions
type HhMmFormat = "full-letters" | "mid-letters" | "min-letters" | "numbers"

type RoutineBlockEditContext = "old-stretch" | "lift" | "details" | "new-stretch" | "duplicate"

type Position = "top-left" | "top" | "top-right" | "bottom-left" | "middle" | "right" | "left" | "bottom-right" | "bottom"

type IconOptions = {
    id?: string
    width?: number
    height?: number
    strokeWidth?: number
    scale?: number
    color?: string
    opacity?: number   
    fullOnHover?: boolean
}

type AsyncButtonOptions = {
    title: string
    isLoading: boolean
    actionFunc: AsyncFunc
    styling?: StylingOptions
}

type RoutineActvity = keyof RoutineCores

type InputOptions = {
    id?: string
    placeholder?: string
    defaultText?: string
    initValue: string
    maxLength?: number
    doAllowEmpty?: boolean
    handlers?: {
        onInputHandler?: FunctionParam
        onBlurHandler?: FunctionParam
        onFocusHandler?: FunctionParam
        onError?: FunctionParam
    }
}

type TextEntryIcon = {
    type: "img" | "emoji",
    src: string,
    size: "small" | "big"
}

type TextEntryOptions = {
    entry: string
    styling: "background" | "has-marker" | "default"
    date: Date
    truncate: boolean
    icon: TextEntryIcon | null
}

/* Base. */

type Banner = {
    src: string
    center: number
}

type BaseOptions = {
    view: "month" | "year"
    header: "top" | "side"
    banner: boolean
    margin: boolean
}

type BaseHeader = {
    icon: Icon & { show: boolean }
    showText: boolean
    pos: "top" | "side"
}

type BaseEventContext = "header" | "banner" | "options"

type BaseEventDetail = {
    context: BaseEventContext
    payload: BaseHeader | Banner | BaseOptions
}

type BaseDispatcher = (type: "base", detail: BaseEventDetail, options?: DispatchOptions) => boolean

type WeeklHabits = {
    emojis: boolean
    dayProgress: boolean

}

type ThoughtEntry = {
    icon: {
        type: string,
        src: string
    } | null,
    styling: "styled" | "default" | "block"
    date: Date
}

type Bulletin = {
    img: string
    hasNotes: boolean
    contentsOnHover: boolean
    notes: string[]
    noteIdx: number
}


/* icon picker */

type IconPicker = {
    id: string
    isOpen: boolean
    position: OffsetPoint
    onSubmitIcon: (icon: Icon) => void
    imgOptions?: ImgUploadOptions
}

type Icon = {
    src: string
    type: IconType
}

type IconType = "emoji" | "img"

/* emojis */

type EmojiPicker = {
    position: OffsetPoint,
    isOpen: boolean,
    onSubmitEmoji: (emoji: Emoji) => void
}

type EmojiData = {
    id: string
    name: string
    keywords: string[]
    shortcodes: string
    version: number
    src?: string
    aliases?: string[]
    emoticons?: string[]
    skins?: {
        src?: string
        native: string
        unified: string
        shortcodes?: string
    }[]
}

type Emoji = Omit<EmojiData, "skins" | "version"> & {
    skin: number
    native: string
    unified: string
    shortcodes: string
}

/* images  */

type ImageUpload = {
    constraints?: ImgUploadConstraints
    exclude?: Array<'jpeg' | 'png' | 'gif' | 'webp' | 'svg'>
    isOpen: boolean
    position: OffsetPoint
    onSubmitImg: (src: string) => void
}

type ImgUploadOptions = {
    onSubmitImg: (src: string) => void
    maxSizeMb?: number
    exclude?: string[]
    dims?: DimConstraints
}

type ImgUploadConstraints = {
    maxSizeMb: number
    formats: string[]
    dims?: DimConstraints
}

type DimConstraints = {
    height?: {
        max?: number
        min?: number
    },
    width?: {
        max?: number
        min?: number
    }
}

type ProgressRingOptions = {
    size?: number
    strokeWidth?: number
    style?: "colored" | "default"
}

type ModalOptions = {
    borderRadius?: string
    overflowX?: string
    overflowY?: string
    overflow?: string
    zIndex?: string
    closeOnEsc?: boolean
    height?: string
    hingeDown?: boolean
    scaleUp?: boolean
}


/* Activity Calendar */

type DayEntry = {
    date: Date
    highlightImg: HighlightImg | null
    focusMins: number
    habits: number
    goals?: any[]
}

type DayEntryUpdatePayload = {
    img?: {
        src?: string
        caption?: string
    }
    text?: string
}

type HighlightImg = {
    src: string
    caption: string
}

type DayThoughtEntry = {
    width: number
    fontStyle: "basic" | "stylish" | "fancy" | "cute"
    title: string
    text: string
}

/* Time */

type TimeInputOptions = {
    min?: number
    max?: number
} & InputOptions

type TimeInputValue = {
    num: number,
    isAM: boolean
}

type TimePickerOptions = {
    min?: number,
    max?: number,
    start?: number
}

type TimeString = `${number}h` | `${number}m` | `${number}s` | `${number}d`

type DropdownBtnOptions = {
    title: string | null
    allowEmpty?: boolean
    hasArrow?: boolean
    noBg?: boolean
    arrowLeft?: boolean
    arrowOnHover?: boolean
    styles?: StylingOptions
    onClick: FunctionParam
    onRemove?: FunctionParam
}

type OffsetPoint = {
    top: number, left: number
}

type HotKeyCombo = string[]

type DropDownOptionIconType = "default" | "fa" | "logo" | "unit" | "hotkey" | "right-arrow" | "check" | "svg"

type DropdownOptnIcon = {
    type: DropDownOptionIconType
    icon?: string | HotKeyCombo | LogoIcon | Icon
    logoColored?: boolean
    styling?: StylingOptions   
    transform?: string
}

type DropdownOption = {
    name: string,
    leftIcon?: DropdownOptnIcon
    rightIcon?: DropdownOptnIcon
    onPointerOver?: ((params?: { e: PointerEvent, item: DropdownOption, childLeft: number }) => void)
    onPointerLeave?: ({ e: PointerEvent, item: DropdownOption }) => void
    divider?: boolean
}

type DropdownOptionSection = {
    sectionName?: string
    font?: "default" | "mono"
}

type DOMQueryOption = "id" | "class" | "tag"

type AncestoryQueryOptions = {
    child: HTMLElement
    queryStr: string
    queryBy?: DOMQueryOption
    max?: number
    strict?: boolean
}

type CSSAbsPos = {
    top?: string, left?: string, bottom?: string, right?: string
}

type RangeInputOptions = {
    updateOnSeek?: boolean
    disabled?: boolean
    bg?: string
    fg?: string
    height?: number
    thumbSize?: number
}

type DropdownToggleOption = {
    name: string
    active: boolean
    divider?: boolean
    onToggle: () => void
}

type DropdownListItem = DropdownOptionSection | DropdownOption | DropdownToggleOption

type DropdownItemClickedContext = {
    event: Event, 
    idx: number, 
    name: string, 
    parentName?: string
}

type DropdownListOptions = {
    context?: "side-bar" | "modal" | "default"
    listItems: DropdownListItem[]
    fixPos?: boolean
    parentContext?: {
        container?: HTMLElement
        childId: string
    }
    parent?: {
        id: string,
        optnIdx: number
        optnName: string
    }
    pickedItem?: string | number
    onListItemClicked?: (context: DropdownItemClickedContext) => void
    onClickOutside?: FunctionParam
    onDismount?: FunctionParam
    onPointerLeave?: FunctionParam
    position?: CSSAbsPos
    scroll?: {
        bar?: boolean
        goToIdx?: number
    }
    styling?: {
        zIndex?: number
        width?: string
        minWidth?: CSSUnitVal
        maxWidth?: CSSUnitVal
        height?: string
        minHeight?: CSSUnitVal
        maxHeight?: string
        optionWidth?: string
        optionHeight?: string
        fontSize?: string,
        fontFamily?: string
        overflow?: "scroll" | "visible"
    }
}

type Color = {
    primary: string
    name: string
    light1: string
    light2: string
    light3: string
    dark1: string
    dark2: string
    dark3: string
    dark4: string
}

type ColorPicker = {
    isOpen: boolean
    position: OffsetPoint
    onSubmitColor: (color: Color) => void
    onClose?: () => void
    picked: Color | null
}

/* Routines */

type RoutineBlock = {
    title: string
    color: Color
    description: string
    startTime: number
    endTime: number
    order?: BlockOrderContext | null
    tag: Tag | null
    activity: RoutineActvity | null
    tasks: Task[]
    done?: boolean
    allowDescription: boolean 
    allowTasks: boolean
}

type RoutineBlockElem = {
    id: string, height: number, xOffset: number, yOffset: number
} & RoutineBlock

type RoutineEditBlock = RoutineBlockElem & { 
    isDragging: boolean
    dropArea?: {
        top: number,
        left: number
        offsetIdx: number
        doShow: boolean
    } 
}

type DailyRoutine = {
    id: string
    name: string
    description: string
    idx: number
    blocks: RoutineBlock[]
}

type WeeklyRoutine = {
    id: string
    name: string
    description: string
    idx: number
    blocks: WeeklyRoutineBlocks
}

type WeeklyRoutineBlocks = {
    Monday: RoutineBlock[] | DailyRoutine, Tuesday: RoutineBlock[] | DailyRoutine
    Wednesday: RoutineBlock[] | DailyRoutine, Thursday: RoutineBlock[] | DailyRoutine
    Friday: RoutineBlock[] | DailyRoutine, Saturday: RoutineBlock[] | DailyRoutine
    Sunday: RoutineBlock[] | DailyRoutine
}

type WeekBlockElems = {
    Monday: RoutineBlockElem[], Tuesday: RoutineBlockElem[]
    Wednesday: RoutineBlockElem[], Thursday: RoutineBlockElem[]
    Friday: RoutineBlockElem[], Saturday: RoutineBlockElem[]
    Sunday: RoutineBlockElem[]
}

type RoutineTags = {
    tag: Tag
    data: {
        avgTime: number
        totalTime : number
        total: number
    }
}

type RoutineCores = { 
    sleeping: {
        status: CoreStatus | null
        totalTime: number
        avgTime: number
        total: number
    },
    working: {
        status: CoreStatus | null
        totalTime: number
        avgTime: number
        total: number
    },
    mind: {
        status: CoreStatus | null
        totalTime: number
        avgTime: number
        total: number
    },
    awake: {
        status: CoreStatus | null
        totalTime: number
        avgTime: number
        total: number
    },
    body: {
        status: CoreStatus | null
        totalTime: number
        avgTime: number
        total: number
    },
    selfCare: {
        status: CoreStatus | null
        totalTime: number
        avgTime: number
        total: number
    }
}

type BlockOrderContext = "first" | "only" | "middle" | "last"

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

type AsyncFunc = ((...args: any[]) => Promise<any>)

// maps string section to corresponging theme arrays
type AppearanceSectionToThemeMap = { 
    default: DefaultTheme[], 
    light: ColorTheme[],
    dark: ColorTheme[]
}

type LogoOptions = {
    hasBgColor?: boolean
    containerWidth?: string
    iconWidth?: string
    borderRadius?: string
    colored?: boolean
    scale?: number
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
type HotkeyContext = "side-bar" | "default"  

type GlobalContext = {
    leftBarOpen: boolean
    leftBarFixed: boolean
    rightBarOpen: boolean
    rightBarFixed: boolean
    route: string
    hasToaster: boolean
    hotkeyFocus: HotkeyContext
    modalsOpen: ModalType[]
    ambience?: AmbientOptions
    sessionLocation?: "workspace" | "default"
    routineView?: {
        dayIdx: number
        block: { block: RoutineBlock, idx: number } 
    } | null
}

type FontStyle = "default" | "stylish" | "fancy" | "cute" | "mono"

type AmbientOptions = {
    active: boolean
    opacity: number
    spacesOpen: boolean
    styling: "solid" | "blur" | "clear"
    space: AmbientSpace
    showTime: boolean
    fontStyle: FontStyle
}

type AmbientSpace = {
    title: string
    subtitle: string
    description?: string
    thumbnail: string
    sourceId: string
    type: "wallpaper" | "video" | "playlist"
    group: AmbientSpaceGenres | "user"
}

type AmbientSpaceGenres = "nature" | "sci-fi" | "weather" | "city" | "worlds" |  "lofi" | "architecture"

type AmbientSpaceGroupKey = AmbientSpaceGenres | "user" | "popular"

type AmbientSpaceGroup = {
    [key in AmbientSpaceGenres]: {
      wallpapers: AmbientSpace[]
      videos: AmbientSpace[]
      playlists: AmbientSpace[]
    }
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
    dark?: boolean
    portrait?: boolean
}


type HozScrollMaskedGradient = {
    styling: string,
    scrollStatus: HozScrollStatus
}

type VertScrollMaskedGradient = {
    styling: string,
    scrollStatus: VertScrollStatus
}

type BoxSize = {
    width: number,
    height: number
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
    tasks: Task[]
}

/* Session Stuff */

type Session = {
    id: string
    name: string
    mode: SessionMode
    focusTime: number
    breakTime: number
    allowSfx: boolean
    allowChime: boolean
    startTime: Date
    todos: Task[]
    result?: {
        endTime: Date
        focusCount: number
        breakCount: number
        pauseCount: number
        elapsedSecs: number
        totalFocusTime: number
        totalBreakTime: number
        periods?: number
    }
}

type SessionMode = "pom" | "flow"

type SessionState = "focus" | "paused" | "break" | "to-focus" | "to-break" | "done"

type SessionProgressSegment = {
    type: SessionState | "progress"
    start: Date
    end: Date
}

type Medal = "🏅" | "🥈" | "🥉"

type SessionResult = { 
    score: number, 
    medal: Medal ,
    message: string,
    resultImgUrl: string
}

type Tag = {
    id: string
    orderIdx: number
    name: string,
    symbol: {
        color: Color,
        emoji: string
    }
}

type ProgressVisualPart = {
    type: ProgressVisualPartType
    offSetPerc: number,
    widthPerc: number | null, 
    periodIdx: number,
    segmentIdx: number
}

/* tasks */

interface Task {
    id: string,
    idx: number,
    isChecked: boolean,
    title: string,
    description: string
    parentId: string | null
}

/* task list */
type TasksListOptions = {
    id: string
    hotkeyFocus: HotkeyContext
    context?: "side-bar" | "modal" | "default"
    rootRef: HTMLElement
    handlers?: TaskListHandlers
    settings?: {
        maxDepth?: number,
        numbered?: boolean,
        checkSubtasks?: boolean,
        allowDuplicate?: boolean,
        allowEdit?: boolean,
        tasksLinked?: boolean
        maxTitleLines?: number
        maxDescrLines?: number
        maxTitleLength?: number
        maxDescrLength?: number
        subtasks?: boolean
        reorder?: boolean
        removeOnComplete?: boolean
        max?: number,
        maxSubtasks?: number,
        addBtn?: {
            iconScale?: number,
            doShow?: boolean,
            style?: StylingOptions,
            text?: string,
            pos?: "top" | "bottom",
        }
    }
    ui?: {
        fontSize?: CSSTextSize
        menuWidth?: CSSUnitVal
        maxHeight?: CSSUnitVal
        padding?: CSSMultiDimPxVal
        borderRadius?: CSSPxVal
        sidePadding?: CSSUnitVal
        hasTaskDivider?: boolean
        listHeight?: CSSUnitVal
        checkboxDim?: CSSUnitVal
    }
}

/* todoist api  */

type TaskUpdateActions = "description" | "name" | "completion" | "reorder" | "new-parent"
type TaskAddActions = "add" | "duplicate"
type TaskActionPayload = {
    task: Task
    tasks: Task[]
}

type TaskListClientHandlerContext = {
    context: TaskUpdateActions | TaskAddActions | "delete"
    payload: TaskActionPayload
    undoFunction?: FunctionParam
}

type TaskUpdateContext = {
    action: TaskUpdateActions
    payload: TaskActionPayload
    undoFunction?: FunctionParam
    removeOnComplete?: boolean
}

type TaskAddContext = {
    action: TaskAddActions
    payload: TaskActionPayload & {
        added: Task[]
    }
}

type TaskDeleteContext = {
    payload: {
        task: Task | null
        tasks: Task[]
        removed: Task[]
    }
    undoFunction?: FunctionParam
}

type TaskListHandlersRes = {
    context: "tasks" | "todoist" | "goal" | "routine-block"
}

type TaskListHandlers = {
    onTaskUpdate: (context: TaskUpdateContext) => Promise<void>
    onAddTask:    (context: TaskAddContext) => Promise<{ id: string } | void>
    onDeleteTask: (context: TaskDeleteContext) => Promise<void>
}

/* task client handlers */

interface TodoistTask extends Omit<Task, "subtasks"> {
    isRecurring: boolean
    due: Date | null
    isDeleted: boolean
}

type TodoistItemPartialSyncOntext = {
    action: "none" | "deleted" | "updated"
    syncTask?: TodoistTask | null
    idx: number
}

/* APIs */

type CSSPxVal   = `${number}px`
type CSSREMVal   = `${number}rem`
type CSSTextSize = `${number}px` | `${number}rem`
type CSSUnitVal = CSSPxVal | `${number}%` | `calc(${string})` | "auto"
type CSSMultiDimPxVal = `${number}px` | 
                        `${number}px ${number}px` | 
                        `${number}px ${number}px ${number}px` | 
                        `${number}px ${number}px ${number}px ${number}px` 

type ContextMenuOptions = {
    width: CSSUnitVal
}

type DayBreakdown = {
    cores: RoutineCores,
    tags: RoutineTags[],
    day: keyof WeeklyRoutineBlocks,
    dayIdx: number,
    blocksLength: number
    linkedRoutine: {
        name: string,
        description: string,
    } | null
}

type StylingOptions = {
    width?: CSSUnitVal
    maxWidth?: CSSUnitVal
    minWidth?: CSSUnitVal
    height?: CSSUnitVal
    maxHeight?: CSSUnitVal
    minHeight?: CSSUnitVal
    padding?: CSSMultiDimPxVal
    margin?: CSSMultiDimPxVal
    fontSize?: CSSREMVal
    fontWeight?: string
    position?: "static" | "absolute" | "relative"
    color?: string
    borderRadius?: CSSPxVal
    backgroundColor?: string
    fontFamily?: string
    opacity?: number
    zIndex?: number
}

/* habits. */
type Habit = {
    name: string
    symbol: string
    target: string | null
    streak: number
    freqType: "daily" | "day-of-week" | "per-week"
    frequency: number
    data: string
    timeOfDay: "morning" | "afternoon" | "evening" | "all-day"
    order: {
        default: number
        tod: number
    }
}

type HabitStore = {
    habits: Habit[]
    metrics: HabitMetrics | null
}

type HabitMetrics = {
    habitsDone: number
    habitsDue: number
    perfectDays: number
    missedDays: number
    missed: number
    activeStreak: {
        base: number
        streak: number
        start: Date
    }
}

type HabitYearData = {
    name: string
    data: HabitMonthChunk
}

type HabitMonthKey = `${number}-${number}`

type HabitMonthChunk = Record<HabitMonthKey, number>

type HabitHeatMapDay = {
    date: Date
    isInCurrMonth: boolean
    done: number
    due: number
}


/* Youtube Stuff */
type GoogleAuthResponse = {
    accessToken: string
    refreshToken: string
    expiresIn: number
}

type YoutubeUserState = {
    username: string
    profileImgSrc: string
    email: string
    signedIn: boolean
    playlists: YoutubePlaylist[]
    playlistsTotal: number
    fetchedAllItems: boolean
    loading: boolean
    tokenExpired: boolean
    error: any
}

type YoutubeUserCreds = {
    accessToken: string,
    refreshToken: string
    accessTokenCreationDate: Date
}

type YoutubeUserPlaylistResponse = {
    playlists: YoutubePlaylist[]
    nextPageToken: string
    playlistsTotal: number
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
    show: boolean
    isRepeating: boolean
    isShuffled: boolean
    isoVideo: boolean
    volume: number
    view: "float" | "embed"
}

type BoxLayout = { 
    width: number 
    height: number 
    top: number 
    left: number 
}

type YoutubePlaylist = {
    id: string
    title: string
    description: string
    vidCount: number
    channelTitle: string
    thumbnailURL: string
    firstVidId: string | null
}

type YoutubePlaylistGroup = {
    title: string
    playlists: YoutubePlaylist[]
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
    thumbnailSrc: string
    channelName: string
    embeddable?: boolean
}

type YoutubeMediaId = { 
    type: YTMediaLinkType
    id: string 
}

/* Google Calendar */
type GoogleCalendar = {
    id: string
    color: {
        id: string
        bgColor: string
        fgColor: string
    }
    title: string
    description: string
    user: string
    email: string
    isChecked: boolean
    syncToken: string
}

type GoogleCalendarEvent = {
    id: string
    calendarId: string
    title: string
    color: {
        id: string
        fgColor: string
        bgColor: string
    }
    allDay: boolean
    startDay: string
    endDay: string
    timeStart: number
    timeEnd: number
    idx: number
    url: string
    height: string
    top: string
    left: string
    width: string
}

type GoogleCalendarState = {
    tokenExpired: boolean
    signedIn: boolean
    loading: "sync" | "refresh" | null
}

type FetchCalendarsResponse = { 
    cals: (GoogleCalendar | { id: string, deleted: true })[]
    syncToken: string 
}

type FetchEventResponse = GoogleCalendarEvent | { id: string, status: "cancelled" }

type FetchCalDayEventsResponse = {
    events: FetchEventResponse[]
    syncToken: string
    id: string
}

/* Goals */

type DueType = "day" | "month" | "quarter" | "year" | "someday"
type GoalStatus = "not-started" | "in-progress" | "accomplished"

type Goal = {
  id: string
  name: string
  due?: Date
  dueType?: DueType
  description?: string
  tag?: Tag
  creationDate: Date
  status: GoalStatus
  milestones?: Milestone[]
  imgSrc?: string
  isPinned?: boolean
  bOrder: { 
    default: number
    status: number
    tag: number
  }
}

type Milestone = {
    id: string
    name: string
    idx: number
    done: boolean
}
  
/* theme stuff */
type ThemeState = {
    isDarkTheme: boolean
    lightTheme: string
    darkTheme: string
    current: Theme
}

type Theme = {
    name: string
    styling: ThemeStyling
}

type ThemeStyling = {
    isDark: boolean
    bg1: string
    bg2: string
    bg3: string
    fgColor1: string
    fgColor2: string
    textColor1: string
    textColor2: string
    lightColor1: string
    lightColor2: string
    ringColor: string
    heatMapColor: string
    calMarkColor: string
    textEntryBgColor: string
    modalBgAccentColor: string
    modalBgColor: string
    bentoBoxBgColor: string
    bentoBoxBorder: string
    bentoBoxShadow: string
    navMenuBgColor: string
    navBtnColor: string
    navBtnBgColor: string
    sessionBlockColor: string
    rightBarBgColor: string
    elemColor1: string
    elemColor2: string
    starColor: string
    elemTextColor: string
    cardBgColor: string
    cardHovColor: string
}


type SideBarViews = {
    view: "tasks" | "cal"
    calView: "routine" | "g-cal"
}