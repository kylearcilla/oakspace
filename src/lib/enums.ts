export enum ErrorCode { 
    YT_PRIVATE_PLAYLIST, YT_PRIVATE_VIDEO, YT_EXPIRED_TOKEN, DEFAULT, MUSIC_EXPIRED_TOKEN
}
export enum APIErrorCode {
    EXPIRED_TOKEN, FAILED_TOKEN_REFRESH, LOGIN_IN, LOG_OUT, RESOURCE_NOT_FOUND, RESOURCE_UNAVAILABLE, 
    AUTHORIZATION_ERROR, UNAUTHORIZED, API_ERROR, GENERAL, RATE_LIMIT_HIT, PLAYER, APP_SERVER, AUTH_DENIED,
    PLAYER_MEDIA_INVALID, API_SERVER, FULL_SYNC_REQUIRED
}
/* General */
export enum CoreStatus {
    Healthy, Normal, Lacking
}
export enum TextTab {
    Workspace, Productivity, Goals, Habits, Mindhub, Routines
}
export enum LogoIcon {
    YoutubeMusic, Youtube, Session, Google, Somara, Todoist, GoogleCal
}
export enum Icon {
    Settings, Dropdown, Add, Close, ChevronLeft, ChevronRight, DragDots, Archive, Tune, Sun, Moon, Pin, Sublink,
    ColorSun, ColorMoon, MiniPlayer
}
export enum ModalType { 
    Settings, Music, Themes, Quote, NewSession, ActiveSession,
    EditSession, SesssionFinished, SessionCanceled, Shortcuts, ImgUpload, CustomVidBg,
    EditGoal, EditRoutine, Confirmation, SessionSummary, Text, Spaces, Upgrade
}
export enum ToasterPosition {
    TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT, TOP_CENTER, BOTTOM_CENTER
}
export enum HrsMinsFormatOption {
    LETTERS, MIN_LETTERS, NO_LETTERS
}
export enum ShortcutSectionInFocus {
    MAIN, TASK_BAR
}

/* Dates */
export enum DatePickerError {
    InvalidYr, BeyondMin, BeyondMax, InBounds, Invalid
}

export enum DateBoundState{
    InvalidYr, BeyondMin, BeyondMax, InBounds
}

/* Sessions */
export enum SessionState {
    EMPTY, FOCUSING, ON_BREAK, WAITING_TO_PROGRESS_BREAK, 
    WAITING_TO_PROGRESS_FOCUS, FINISHED, CANCELED, FINISH_TOO_EARLY,
    TOOK_TOO_LONG
}
export enum ProgressVisualPartType {
    FOCUS, BREAK, CHECKPOINT
}

/* Youtube */
export enum YTAPIErrorContext { 
    USER_LOGIN, USER_PLAYLISTS, VIDEO, CHANNEL, PLAYLIST 
}
export enum YTMediaLinkType {
    PLAYLIST, VIDEO
}

/* Toasts */
export enum SwipeStateTypes {
	SwipedOut = 'SwipedOut',
	SwipedBack = 'SwipedBack',
	NotSwiped = 'NotSwiped'
}