export enum ErrorCode { 
    YT_PRIVATE_PLAYLIST, YT_PRIVATE_VIDEO, YT_EXPIRED_TOKEN, DEFAULT
}
/* General */
export enum ToastContext {
    AppleMusic, Spotify, YoutubeMusic, Soundcloud, Youtube, Pomodoro
}
export enum ToastType {
    Expired, BasicError, Info
}
export enum SettingsModal { 
    Settings, Youtube, Music, Stats, Appearance 
}

/* Sessions */
export enum SessionState {
    EMPTY,  PAUSED, FOCUSING,  ON_BREAK,  WAITING_TO_PROGRESS_BREAK, 
    WAITING_TO_PROGRESS_FOCUS,  FINISHED,  CANCELED, FINISH_TOO_EARLY
}
export enum SessionModal { 
    Quote, NewSession, ActiveSession 
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