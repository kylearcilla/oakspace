export enum ErrorCode { 
    YT_PRIVATE_PLAYLIST, YT_PRIVATE_VIDEO, YT_EXPIRED_TOKEN, DEFAULT, MUSIC_EXPIRED_TOKEN
}
export enum APIErrorCode {
    EXPIRED_TOKEN, FAILED_TOKEN_REFRESH, LOGIN_IN, LOG_OUT, RESOURCE_NOT_FOUND, RESOURCE_UNAVAILABLE, AUTHORIZATION_ERROR, UNAUTHORIZED, API_ERROR, GENERAL, RATE_LIMIT_HIT
}
/* General */
export enum LogoIcon {
    AppleMusic, Spotify, YoutubeMusic, Soundcloud, Youtube, Session, Google, Luciole
}
export enum Icon {
    Settings, Dropdown, Add, Close, ChevronLeft, ChevronRight, DragDots, Archive, Tune, Sun, Moon, Pin
}
export enum ToastContext {
    AppleMusic, Spotify, YoutubeMusic, Soundcloud, Youtube, Session, Google, Luciole
}
export enum ModalType { 
    Settings, Youtube, Music, Stats, Journal, Appearance, Quote, NewSession, ActiveSession,
    EditSession, SesssionFinished, SessionCanceled, Shortcuts, ImgUpload, CustomVidBg,
    EditGoal
}
export enum HrsMinsFormatOption {
    LETTERS, MIN_LETTERS, NO_LETTERS
}
export enum ShortcutSectionInFocus {
    MAIN, TASK_BAR
}

/* Dates */
export enum DatePickerUserInput {
    InvalidYr, BeyondMin, BeyondMax, InBounds, Invalid
}

export enum DateBoundState{
    InvalidYr, BeyondMin, BeyondMax, InBounds
}

/* Image Upload */
export enum ImgUploadInput {
    Error, TooBig, TooSmall, InvalidFormat, InvalidURL
}

/* Tasks */
export enum RightSideTab { 
    TASKS, OVERVIEW
}
export enum TaskSettingsOptions {
    MAKE_NEW_TASK_GROUP, RENAME_TASK_GROUP, DELETE_TASK_GROUP
}
export enum ContextMenuOption {
    ADD_SUBTASK, DELETE_TASK, DELETE_SUBTASK
}

/* Goals */
export enum GoalStatus {
    OnHold , InProgress, Accomplished
}
export enum JournalTab {
    Goals, Summary
}
export enum GoalsDropdown { 
    ViewOption,
    TuneDropdown
}
export enum GoalItemUI {
    RepoList, BoardList, RepoCard, BoardCard 
}
export enum GoalViewOption {
    Board = "Board", History = "History", AllGoals = "All Goals"
}
export enum GoalItemView {
    List, Board
}
export enum EditMilestoneOption {
    EditTitle, ChangeDate, Delete
}
export enum EditGoalOption {
    ChangeImage, ToggleHideImg, DelteGoal, RemoveImage, TogglePinGoal
}
export enum EditGoalContextMenu {
    Milestone, Date, Img, Goal
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

/* Music */
export enum MusicMoodCategory { 
    Serene = "Serene", Lofi = "Lo-Fi", Upbeat = "Upbeat", Soundtracks = "Soundtracks", 
    Acoustic = "Acoustic", Classical = "Classical", Zen = "Zen", Summer = "Summer"
}
export enum MusicPlatform { 
    AppleMusic, Spotify, YoutubeMusic, Soundcloud 
}
export enum MusicAPIErrorContext {
    USER_AUTHORIZATION, USER_RELOGIN, USER_PLAYLISTS, APP_SERVER, TRACK, ALBUM, PLAYLIST, PLAYER
}
export enum MusicShufflerState {
    CAN_CONTINUE_CHUNK, HAS_ENDED_AND_MORE_CHUNKS, HAS_ENDED_NO_CHUNKS,
}
export enum MusicMediaType {
    Playlist, Track, RadioStation, Podcast
}
export enum UserLibraryMedia {
    Playlists = "Playlists", LikedTracks = "Tracks", Albums = "Albums", PodcastEps = "Episodes", Audiobooks = "Audiobooks"
}