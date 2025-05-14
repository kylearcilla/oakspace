// @ts-nocheck

// avoid checking, issues occur when enums are imported

type User = {
    id: string
    name: string
    profileImg: string
    email: string
    description: string
    created: Date
    pro: boolean
    stats: {
        goalsReached: number
        habitsDone: number
        sessions: number
        focusTime: number
        routinesMade: number
    }
}

/* Misc. */

type Result<T, E> = {
    result: T
    error: E
}

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

type AbsoluteFloatElem = {
    id: string
    dmenuId: string
    bounceId: string
    isHidden: boolean
    props: any
    component: ComponentType
    position: { top: number, left: number } 
    onClose: () => void
}

type DatePickerProps = {
    pickedDate: Date
    onUpdate: (val: { date: Date, dateType?: DateType } | null) => void
    options: DatePickerOptions
}

type TagPickerProps = {
    tag: Tag | null
    onTagClicked: (newTag: Tag | null) => void
}

type TextEntryIcon = {
    type: "img" | "emoji",
    src: string,
    size: "small" | "big"
}

type TextEntry = {
    id: string
    text: string
    styling: "background" | "has-marker" | "default"
    truncate: boolean
    icon: TextEntryIcon | null
    period?: "year" | "quarter" | "month"
    isoDate?: string
}

/* Base. */

type MonthDetailsView = "overview" | "goals" | "habits" | "yr-view"

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

type OverviewOptions = {
    animPhotos: boolean
    textBlock: boolean
    showImgs: boolean
    habitsMark: boolean
    focusTime: boolean
}

type YearViewOptions = {
    emojis: boolean
    showTextEntry: boolean
    showYear: boolean
    pinnedGoals: boolean
}

type EditEntry = DayEntry & {
    g_context: { str: string, checked: number, total: number, items: Goal[] }
    h_context: { str: string, checked: number, total: number } | null
    s_context: { str: string, focusMins: number, items: Session[] } | null
}

type BaseView = {
    banner: BaseBanner
    header: BaseHeader
    leftMargin: boolean
    bulletin: BulletinOptions
}

type BaseBanner = {
    show: boolean
    img: {
        src: string
        center: number
    } | null
}

type BaseHeader = {
    showEntry: boolean
    entry: TextEntry | null
    pos: "top" | "side"
    icon: {
        src: string
        type: "img" | "emoji"
        show: boolean
    } | null
}

type BaseLeftMarginView = {
    habitsView: "month" | "today"
    bulletin: BulletinOptions
}

type BulletinOptions = {
    imgSrc: string
    hasNotes: boolean
    contentsOnHover: boolean
    notes: Note[]
    height: number
    noteIdx: number
}

type Note = {
    id: string
    idx: number
    text: string
    userId: string
}

/* Sidebars */

type DayViewOptions = {
    view: "cal" | "tasks"
    calView: "g-cal" | "routines"
    googleCal: {
        colors: boolean
    }
    routines: {
        checkbox: boolean
        colors: boolean
    }
    header: {
        img: {
            src: string
            top: number
        } | null
        show: boolean
    }
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
    position: OffsetPoint
    isOpen: boolean
    dmenuId: string
    onSubmitEmoji: (emoji: Emoji) => void
    onClose?: () => void
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

type TagPicker = {
    tag: Tag | null
    position: OffsetPoint
    isOpen: boolean
    onClose?: () => void
    onSubmitTag: (tag: Tag) => void
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
    autoOpacity?: boolean
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

type DropDownOptionIconType = "default" | "fa" | "logo" | "unit" | "hotkey" | "right-arrow" | "check" | "svg" | "txt"

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
    onPointerOver?: ((params?: { e: PointerEvent, item: DropdownOption, childXPos: number }) => void)
    onPointerLeave?: ({ e: PointerEvent, item: DropdownOption }) => void
    divider?: boolean
    childId?: string
    leftOffset?: number
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

type DropdownMenuOption = {
    name: string
    divider?: boolean
    pickedItem?: string
    items: { name: string }[]
    onListItemClicked: (context: DropdownItemClickedContext) => void
}

type DropdownTwinOption = {
    twinItems: { name: string, faIcon: string, size?: string  }[]
    pickedItem?: string
    onListItemClicked: (context: DropdownItemClickedContext) => void
}

type DropdownListItem = DropdownOptionSection | DropdownOption | DropdownToggleOption | DropdownMenuOption | DropdownTwinOption

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
    parentId?: string
    rootRef?: HTMLElement
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
    dmenuId: string
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

type DatePickerOptions = CalendarOptions & { position?: CSSAbsPos, dateType?: DateType }

type DateType = "day" | "month" | "year" | "quarter"

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
    user: User
    fontStyle: "mono" | "system"
    showStats: boolean
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
    id: string
    text: string
    bgImgSrc: string
    artCredit: string
    quoteCredit: string
    dark: boolean | null
    portrait: boolean | null
    liked: boolean
    likes: number
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

type TagSymbol = {
    color: Color,
    emoji: string
}

type Tag = {
    id: string
    idx: number
    name: string,
    symbol: TagSymbol
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
    title: string,
    description: string
    isChecked: boolean,
    parentId: string | null
    userId: string
    sessionId?: string
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

type TaskGroup = {
    title: string,
    tasks: Task[]
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

interface TodoistTask extends Task {
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
    id: string
    name: string
    symbol: string
    caption: string
    description: string
    streak: number
    frequency: number
    createdAt: Date
    freqType: "daily" | "day-of-week" | "per-week"
    timeOfDay: "morning" | "afternoon" | "evening" | "all-day"
    img: ImgHeader | null
    order: {
        default: number
        tod: number
    }
}

type HabitStore = {
    habits: Habit[]
    monthMetrics: HabitMonthMetrics | null
    activeStreak: HabitActiveStreak | null
    yearMetrics: HabitYearMetrics | null
    yearHeatMap: HabitHeatMapData[] | null
    viewHabit: Habit | null
}

type HabitActiveStreak = {
    count: number
    start: Date
    base: number
}

type HabitMonthMetrics = {
    year: number
    monthIdx: number
    habitsDone: number
    habitsDue: number
    perfectDays: number
    missedDays: number
    missed: number
    longestStreak?: {
        count: number
        start: Date | null
        end: Date | null
    }
}

type HabitYearMetrics = Omit<HabitMonthMetrics, "monthIdx">

type HabitYearData = {
    name: string
    data: HabitMonthChunk
}

type HabitDayData = {
    required: boolean
    complete: boolean
    date: Date
    noData?: boolean
    beyondBounds?: boolean
}

type HabitHeatMapData = {
    date: Date
    done: number
    due: number
    trueDone: number
    noData?: boolean
}

type HabitMonthKey = `${number}-${number}`

type HabitMonthChunk = Record<HabitMonthKey, number>

type HabitHeatMapDay = {
    date: Date
    isInCurrMonth: boolean
    done: number
    due: number
    trueDone: number
    // for individual habits
    noData?: boolean
    beyondBounds?: boolean
}

type HabitPageOptions = {
    leftMargin: boolean
    showIcon: boolean
    heatmap: boolean
    yearEntry: boolean
    monthEntry: boolean
    linkImgBanner: boolean
    viewStyling: "table" | "card"
}

type HabitCardOptions = {
    style: "tall" | "wide"
    xAsChecked: boolean
}

type HabitTableOptions = {
    view: "default" | "time-of-day"
    stats: boolean
    emojis: boolean
    allowCaptions: boolean
    checkboxStyle: "box" | "minimal"
    bottomDetails: boolean
    progress: {
        numbers: boolean
        percentage: boolean
    }
}

type 

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

type PeriodEntry = {
    entry: TextEntry | null
    pinnedId: string | null

  }
type YearEntry = PeriodEntry & {
    bannerImg: {
        src: string
        center: number
    } | null
    smallImg: string
}

type GoalYearData = YearEntry & {
    goals: Goal[]
}
type GoalMonthData = PeriodEntry & {
    goals: Goal[]
}
type GoalQuarterData = PeriodEntry & {
    goals: Goal[]
}

type GoalsViewState = {
    sortedGoals: Goal[][]
    pinnedGoals: Goal[]
    sections: string[]
    viewProgress: number
    yrProgress: number
    pinnedGoal: Goal | null
}

type GoalsViewUIState = {
    dragTarget: GoalDragTarget | null,
    closedSections: boolean[],
    openGoalId: string,
    contextMenuPos: { left: number, top: number }
    contextMenuOpen: boolean
    statusOpen: boolean
    statusMenuPos: { left: number, top: number }
    editGoal: Goal | null
    deleteConfirm: boolean
}

type GoalsPageOptions = {
    showIcon: boolean
    pinned: boolean
    leftCol: boolean
    showYearEntry: boolean
    showMonthEntry: boolean
    progressBars: boolean
    heatmap: boolean
    heatmapEmojis: boolean
    carousel: boolean
    marginLeftView: MarginLeftViewOptions
}

type MarginLeftViewOptions = {
    showPinned: boolean
    showNext: boolean
    showOverdue: boolean
    heights: {
        pinnedHeight: number
        upcomingHeight: number
        overdueHeight: number
    }
}


type GoalIdxUpdate = {
    id: string  // goal id
    y?: {d?: number, s?: number, t?: number}  // year indices (default, status, tag)
    q?: {d?: number, s?: number, t?: number}  // quarter indices
    m?: {d?: number, s?: number, t?: number}  // month indices
  }

type GoalsViewOptions = {
    view: "list" | "board"
    progress: number
    list: GoalsListOptions
    board: GoalsBoardOptions
    period?: "month" | "quarter"
}

type GoalsListOptions = {
    grouping: "status" | "tag" | "default"
    showProgress: boolean
    due: boolean
    dueType: "date" | "distance"
}

type GoalsBoardOptions = {
    grouping: "status" | "tag"
    showProgress: boolean
    due: boolean
    dueType: "date" | "distance"
    imgs: boolean
}

type GoalDragTarget = {
    type: "pinnedGoal" | "goal" | "month"
    data: string | Goal | number  // list, board goal OR month num OR carousel pinned goal
}

type GoalsStore = {
    init: boolean
    viewGoal: {
        goal: Goal
        type: "new" | "edit"
    } | null
    goals: Goal[]
    yearData: {
        year: number
        data: GoalYearData | null
    }
    quarterData: {
        quarter: number
        data: GoalQuarterData | null
    }
    monthData: {
        month: number
        data: GoalMonthData | null
    }
    view: GoalsViewManager | null
}

type DueType = "day" | "month" | "quarter" | "year" | "someday"

type PeriodType = "year" | "month" | "quarter"

type GoalStatus = "not-started" | "in-progress" | "accomplished"

type GoalViewSection = "status" | "tag" | "default"

type GoalViewTimeFrame = {
    year: number,
    period: string
}

type GoalAddContext = {
    timeFrame: GoalViewTimeFrame
    section?: {
        name: GoalViewSection
        valueId: string
    }
    day?: Date
}

type Goal = {
  id: string
  name: string
  big?: boolean
  due: Date
  dueType: DateType
  description: string
  tag: Tag | null
  creationDate: Date
  status: GoalStatus
  tasks: GoalActionItem[]
  img: {
    src: string
    type: "header" | "float-left" | "float-right"
    center: number
  } | null
  completedDate?: Date | null
  pinIdx?: number | null
  y_order: { 
    default: number
    status: number
    tag: number
  }
  q_order: { 
    default: number
    status: number
    tag: number
  }
  m_order: { 
    default: number
    status: number
    tag: number
  }
}

type GoalUpdateData = {
    name: string
    description: string
    due: Date
    tag: Tag | null
    img: {
        src: string
        type: "header" | "float-left" | "float-right"
        center: number
    } | null
    status: GoalStatus
    dueType: DateType
    big: boolean
    completedDate?: Date | null
    tasks: GoalActionItem[]
    pinned: boolean
}

interface GoalActionItem extends Task {
    goalId: string
}

type YearHeatMapData = {
    date: Date
    goals: Goal[]
}
  
/* theme stuff */
type ThemeState = {
    isDarkTheme: boolean
    lightTheme: string
    darkTheme: string
    current: Theme
}

type ThemePreview = {
    name: string
    isDark: boolean
    borderColor: string
    signaturecolor: string
    bg1: string
    bg2: string
    bg3: string
    fg1: string
    fg2: string
    fg3: string
    fg4: string
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
    bentoBoxorder: string
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

type ImgHeader = {
    src: string
    center: number
}