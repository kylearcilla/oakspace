export enum ErrorCode { 
    YT_PRIVATE_PLAYLIST, YT_PRIVATE_VIDEO, YT_EXPIRED_TOKEN, DEFAULT, MUSIC_EXPIRED_TOKEN
}
/* General */
export enum Icon {
    AppleMusic, Spotify, YoutubeMusic, Soundcloud, Youtube, Session, Google, Luciole
}
export enum ToastContext {
    AppleMusic, Spotify, YoutubeMusic, Soundcloud, Youtube, Session, Google, Luciole
}
export enum ModalType { 
    Settings, Youtube, Music, Stats, Appearance, Quote, NewSession, ActiveSession,
    EditSession, SesssionFinished, SessionCanceled, Shortcuts
}
export enum HrsMinsFormatOption {
    LETTERS, MIN_LETTERS, NO_LETTERS
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

/* Music */
export enum MusicMoodCategory { 
    Serene, Lofi, Upbeat, Soundtracks, Acoustic, Classical, Zen, Summer 
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