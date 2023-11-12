import type { MusicPlatform } from "./enums"


/**
 * @abstract
 * MusicData class represents the data related to music playback (data & stores), API tokens, and user data & functionality for configuring Music Platform API.
 * The player itself is a svelte store object / reactive class, initialized during instantiation.
 */
export abstract class MusicUserData {
    abstract isUserASubscriber: boolean
    abstract isSignedIn: boolean
    abstract hasTokenExpired: boolean
    abstract userPlaylistsOffset: number
    abstract hasFetchedAllUserPls: boolean
    abstract userPlaylists: MusicCollection[]
    abstract accessToken: string
    abstract musicPlatform: MusicPlatform | null

    abstract initMusicData(hasUserSignedIn: boolean): void
    abstract refreshMusicSession(): Promise<void>
    abstract quit(): void
    abstract setMusicUserPlaylistData(): Promise<void>
    
    abstract fetchMoreUserPlaylists(): Promise<void>
    abstract removeUserPlaylists(): void
}

/**
 * @interface
 * A music user data object that keeps store state and saves it between re-freshes.
 */
export interface MusicUserDataStore<T> {
    updateState(newState: Partial<T>): void
    getNewStateObj(newState: Partial<T>, oldState: T): T
    loadAndSetUserData(): void
    saveState(): void
    deleteMusicUserData(): void
}