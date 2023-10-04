import { get } from "svelte/store"
import { ErrorCode } from "./enums"
import { ytUserDataStore } from "./store"
import { AuthorizationError, type CustomError } from "./errors"
import { authYoutubeClient,  getFreshToken,  getUserYtPlaylists, logOutUser } from "./api-youtube"
import { deleteYtUserData, deleteYtCredentials, saveYtCredentials, saveYtUserData, loadYtCredentials, loadYtUserData } from "./utils-youtube"

/**
 * Used to initialize Youtube user data. 
 * Leverages Firebase for Google Authentication for Youtube Log In.
 * Is itself a reactive class / data store (set during instantiation).
 * Allows users to play user playlists with Youtube Player.
 */
export class YoutubeUserData {
    hasUserSignedIn = false
    username: string | null = null
    profileImgSrc: string | null = null
    email: string | null = null
    error: CustomError | null = null
    
    userPlaylists: YoutubePlaylist[] = []
    userPlaylistsNextPageToken: string | null = null
    userPlaylistLength: number | null = null
    hasFetchedAllUserPls = false
    
    accessToken: string | null = null
    refreshToken: string | null = null
    
    USER_PLS_MAX_PER_REQUEST = 15
    
    constructor() {
        ytUserDataStore.set(this)
    }

    /**
     * Init auth flow and if user approves consent, save the result from OAuth Flow response.
     * @throws {ApiError}             Error working with Firebase API
     * @throws {AuthorizationError}   Error authorization app (thrown when user closes consent screen)
     */
    initYtData = async () => {
        try {
            const authRes = await authYoutubeClient()
            this.setUserDataFromOAuthResponse(authRes)
            this.hasUserSignedIn = true
        }
        catch(error) {
            ytUserDataStore.set(null)
            throw (error)
        }
    }

    /**
     * Save OAuth Flow response data to current Youtube User Data Instance.
     * @param res                      Response from OAuth 2.0 Flow
     * @throws {AuthorizationError}    Error requesting personal user data.
     * @throws {ApiError}              Error working Youtube Data API.
     */
    setUserDataFromOAuthResponse = async (res: YTOAuthResponse) => {
        try {
            const ytCreds: YoutubeUserCreds = {
                accessToken: res.accessToken,
                refreshToken: ""
            }

            const userPlsResponse = await this.getYtUserPlaylistData(ytCreds.accessToken)

            const ytUserData: YoutubeUserInfo = {
                username: res.username,
                profileImgSrc: res.profileImgSrc,
                email: res.email,
                userPlaylists: userPlsResponse.userPlaylists,
                userPlaylistsNextPageToken: userPlsResponse.userPlaylistsNextPageToken,
                userPlaylistLength: userPlsResponse.userPlaylistLength
            }

            this.accessToken = ytCreds.accessToken
            this.refreshToken = ytCreds.refreshToken

            this.username = ytUserData.username
            this.profileImgSrc = ytUserData.profileImgSrc
            this.email = ytUserData.email
            this.userPlaylists = ytUserData.userPlaylists
            this.userPlaylistsNextPageToken = ytUserData.userPlaylistsNextPageToken
            this.userPlaylistLength = ytUserData.userPlaylistLength

            let hasFetchedAllUserPls = false
            hasFetchedAllUserPls = ytUserData.userPlaylists.length < this.USER_PLS_MAX_PER_REQUEST ? true : false
            this.hasFetchedAllUserPls = hasFetchedAllUserPls

            this.updateYoutubeUserData({ ...get(ytUserDataStore)!, ...ytCreds, ...ytUserData, hasFetchedAllUserPls })

            saveYtCredentials(ytCreds)
            saveYtUserData(ytUserData)
        }
        catch(error) {
            throw error
        }
    }

    updateYoutubeUserData = (newData: YoutubeUserData) => {
        ytUserDataStore.update((data: YoutubeUserData | null) => ({ ...data!, ...newData }))
    }

    /**
     * Renew expired access token to continue fetching user playlists.
     * Does not get a fresh token from a refresh token (can't do with Firebase).
     * Forces a re-login to get a fresh token.
     * 
     * @throws {ApiError}             Error working with Firebase API
     * @throws {AuthorizationError}   Error authorization app (thrown when user closes consent screen)
     */
    getFreshToken = async () => {
        try {
            const accessToken = await getFreshToken()
            saveYtCredentials({ refreshToken: this.refreshToken ?? "", accessToken })
            this.accessToken = accessToken
            this.updateYoutubeUserData(({ ...get(ytUserDataStore)!, accessToken, error: null }))
        }
        catch(e) {
            throw e
        }
    }

    /**
     * Clears user data. 
     * 
     * @throws {CustomError}      Uses custom error for now.
     */
    logOutUser = async () => {
        try {
            await logOutUser()
            ytUserDataStore.set(null)
            this.clearYoutubeUserData()
        }
        catch(e) {
            throw e
        }
    }

    /**
     * Update current error.
     * @param error  Error
     */
    setError = (error: CustomError) => {
        this.error = error
        this.updateYoutubeUserData({ ...get(ytUserDataStore)!, error })
    }

    /**
     * Remove current error.
     */
    removeError = () => {
        this.error = null
        this.updateYoutubeUserData({ ...get(ytUserDataStore)!, error: null })
    }

    /**
     * Fetches user playlists.
     * @param accessToken              Token needed to access user content.
     * @returns 
     * @throws {AuthorizationError}       Error requesting personal user data.
     * @throws {ApiError}                 Error working Youtube Data API
     */
    getYtUserPlaylistData = async (accessToken: string): Promise<YoutubeUserPlaylistResponse> => {
        try {
            return await getUserYtPlaylists(accessToken, this.USER_PLS_MAX_PER_REQUEST)
        }
        catch(error) {
            throw error
        }
    }

    /**
     * Fetches the next USER_PLS_MAX_PER_REQUEST using a next page token.
     * If the resetults is less than USER_PLS_MAX_PER_REQUEST, no more items left.
     * 
     * @throws {AuthorizationError}       Error requesting personal user data from expired token.
     * @throws {ApiError}                 Error working Youtube Data API
     */
    fetchMoreUserPlaylists = async () => {
        try {
            const res = await getUserYtPlaylists(this.accessToken!, this.USER_PLS_MAX_PER_REQUEST, this.userPlaylistsNextPageToken!)
            const moreYtPlaylists = res.userPlaylists

            this.userPlaylists = [...this.userPlaylists, ...moreYtPlaylists]
            this.hasFetchedAllUserPls = moreYtPlaylists.length < this.USER_PLS_MAX_PER_REQUEST
            this.userPlaylistsNextPageToken = res.userPlaylistsNextPageToken

            this.updateYoutubeUserData({ 
                ...get(ytUserDataStore)!, 
                userPlaylists: this.userPlaylists,  
                hasFetchedAllUserPls: this.hasFetchedAllUserPls,
                userPlaylistsNextPageToken: this.userPlaylistsNextPageToken
            })
        }
        catch(error: any) {
            let e = error
            if (error instanceof AuthorizationError) {
                e.code = ErrorCode.YT_EXPIRED_TOKEN
            }
            this.setError(e)
            throw error
        }
    }

    /**
     * Load youtube creds and user data from local storage.
     * Called everytime user refreshes and Yotube Data has to be re-initialized.
     */
    loadAndSetUserData = () => {
        const ytCreds = loadYtCredentials()!
        const userData = loadYtUserData()!

        this.accessToken = ytCreds.accessToken
        this.refreshToken = ytCreds.refreshToken

        this.username = userData.username
        this.profileImgSrc = userData.profileImgSrc
        this.email = userData.email
        this.userPlaylists = userData.userPlaylists
        this.userPlaylistsNextPageToken = userData.userPlaylistsNextPageToken
        this.userPlaylistLength = userData.userPlaylistLength

        this.updateYoutubeUserData({ ...get(ytUserDataStore)!, ...ytCreds, ...userData, hasUserSignedIn: true })
    }

    /**
     * Clear youtube user and creds data from local storage. 
     */
    clearYoutubeUserData = () => {
        deleteYtCredentials()
        deleteYtUserData()
    }
}