import type { MusicPlatform, UserLibraryMedia } from "./enums"


/**
 * @abstract
 * MusicData class represents the data related to music playback (data & stores), API tokens, and user data & functionality for configuring Music Platform API.
 * The player itself is a svelte store object / reactive class, initialized during instantiation.
 */
export abstract class MusicUserData {
    abstract isSignedIn: boolean
    abstract accessToken: string
    abstract musicPlatform: MusicPlatform | null
    abstract userDetails: MusicUserDetails | null
    abstract hasTokenExpired: boolean
    abstract currentUserMedia : UserLibraryMedia

    abstract refreshAccessToken(): Promise<void>

    abstract getMoreLibraryItems(): Promise<boolean>
    abstract getCurrentLibraryDetails(): UserLibraryCollection
    abstract updateLibraryMedia(media: UserLibraryMedia, isSwitchingTheFirstTime: boolean): void
    abstract getLibraryDetails(currentUserMedia: UserLibraryMedia): UserLibraryCollection
    abstract refreshCurrentLibraryMedia(): void
    abstract setTokenHasExpired(hasExpired: boolean): void

    abstract quit(): void
}

/**
 * @interface
 * A music user data object that keeps store state and saves it between re-freshes.
 */
export interface MusicUserDataStore<T> {
    updateState(newState: Partial<T>): void
    getNewStateObj(newState: Partial<T>, oldState: T): T
    loadAndSetUserData(): void
    saveState(newState: Partial<T>): void
    deleteMusicUserData(): void
}