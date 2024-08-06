import { APIErrorCode, type MusicPlatform, type UserLibraryMedia } from "./enums"
import { APIError } from "./errors"
import { getPlatformString, musicAPIErrorHandler } from "./utils-music"


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
    abstract tokenExpiresInMs : number
    abstract currentUserMedia : UserLibraryMedia

    abstract init(param?: any): void

    // token
    abstract refreshAccessToken(): Promise<void>
    abstract setTokenHasExpired(hasExpired: boolean): void
    abstract hasAccessTokenExpired(): boolean
    abstract verifyAccessToken(): Promise<string>

    // lib
    abstract getMoreLibraryItems(): void
    abstract updateLibraryMedia(media: UserLibraryMedia, isSwitchingTheFirstTime: boolean): void
    abstract refreshLibrary(): void
    abstract getCurrentLibraryDetails(): UserLibraryCollection
    abstract getLibraryDetails(currentUserMedia: UserLibraryMedia): UserLibraryCollection

    onError(error: any, platform: MusicPlatform) {
        console.error(error)

        if (error instanceof APIError) {
            musicAPIErrorHandler(error, platform)
        }
        else {
            musicAPIErrorHandler(new APIError(APIErrorCode.GENERAL, `There was an error with ${getPlatformString(platform)}. Please try again later.`))
        }
    }

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