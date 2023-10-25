import type { CustomError } from "./errors"
import { ytUserDataStore } from "./store"
import { authYoutubeClient,  getFreshToken,  getUserYtPlaylists, logOutUser } from "./api-youtube"
import { deleteYtUserData, deleteYtCredentials, saveYtCredentials, 
         saveYtUserData, loadYtCredentials, loadYtUserData, USER_PLS_MAX_PER_REQUEST 
} from "./utils-youtube"

/**
 * Used to initialize Youtube user data. 
 * Leverages Firebase for Google Authentication for Youtube Log In.
 * Is itself a reactive class / data store (set during instantiation).
 * Stores and manages state for user-related data including tokens to fetch user data.
 * Errors are handled by functions calls to this instance.
 */
export class YoutubeUserData {
    didUserSign = false
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
    
    constructor(didUserSign: boolean = false) {
        ytUserDataStore.set(this)
        this.didUserSign = didUserSign
    }

    /**
     * Init auth flow and if user approves consent, save the result from OAuth Flow response.
     * Required to initialize new instance. 
     * Placed in a different method since async due to Auth Flow.
     * 
     * @throws {ApiError}             Error working with Firebase API
     * @throws {AuthorizationError}   Error authorization app (thrown when user closes consent screen)
     */
    async initYtData() {
        try {
            if (this.didUserSign) {
                this.loadAndSetUserData()
                this.hasUserSignedIn = true
                return
            }
            
            const authRes = await authYoutubeClient()
            this.hasUserSignedIn = true
            this.setUserDataFromOAuthResponse(authRes)
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
    async setUserDataFromOAuthResponse(res: YTOAuthResponse) {
        try {

            const ytCreds: YoutubeUserCreds = {
                accessToken: res.accessToken,
                refreshToken: ""
            }
            const ytUserData = {
                username: res.username,
                profileImgSrc: res.profileImgSrc,
                email: res.email
            }

            this.accessToken = ytCreds.accessToken
            this.refreshToken = ytCreds.refreshToken

            this.username = ytUserData.username
            this.profileImgSrc = ytUserData.profileImgSrc
            this.email = ytUserData.email

            await this.setYtUserPlaylistData(res.accessToken)
            this.updateYoutubeUserData({ ...ytCreds, ...ytUserData, hasUserSignedIn: true })
        }
        catch(error) {
            throw error
        }
    }

    /**
     * Update store data and save state in local storage.
     * @param newData   New data to be incorporated.
     */
    updateYoutubeUserData(newData: Partial<YoutubeUserData>, doSave: boolean = true) {
        ytUserDataStore.update((data: YoutubeUserData | null) => { 
            return this.getNewStateObj(newData, data!)
        })

        if (doSave) {
            this.saveYtCredentials()
            this.saveYtUserData()
        }
    }

    /**
     * Renew expired access token to continue fetching user playlists.
     * Does not get a fresh token from a refresh token (can't do with Firebase).
     * Forces a re-login to get a fresh token.
     * Fetch playlists.
     * 
     * @throws {ApiError}             Error working with Firebase API
     * @throws {AuthorizationError}   Error authorization app (thrown when user closes consent screen)
     */
    async getFreshToken() {
        try {
            const accessToken = await getFreshToken()
            this.accessToken = accessToken
            this.updateYoutubeUserData(({ accessToken, error: null }))
            this.setYtUserPlaylistData(accessToken)
        }
        catch(e) {
            throw e
        }
    }

    /**
     * Clears user data. 
     * @throws {Error}    Uses custom error for now.
     */
    async logOutUser() {
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
     * @param error          Error
     */
    setError(error: CustomError) {
        this.error = error
        this.updateYoutubeUserData({ error })
    }

    /**
     * Remove current error.
     */
    removeError() {
        this.error = null
        this.updateYoutubeUserData({ error: null })
    }

    /**
     * Fetches and updates state after fetching user playlists and important metadata.
     * Used to get fresh user playlist data.
     * 
     * @param accessToken              Token needed to access user content.
     * @returns                        Youtube user playlis meta data (playlists, next page token, length)
     * @throws {AuthorizationError}    Error requesting personal user data.
     * @throws {ApiError}              Error working Youtube Data API
     */
    async setYtUserPlaylistData (accessToken: string) {
        try {
            const playlistResponse = await getUserYtPlaylists(accessToken, USER_PLS_MAX_PER_REQUEST)

            this.userPlaylistsNextPageToken = playlistResponse.userPlaylistsNextPageToken
            this.userPlaylistLength = playlistResponse.userPlaylistLength
            this.userPlaylists = playlistResponse.userPlaylists
            this.hasFetchedAllUserPls = this.userPlaylists.length < USER_PLS_MAX_PER_REQUEST ? true : false

            this.updateYoutubeUserData({ ...playlistResponse, hasFetchedAllUserPls: this.hasFetchedAllUserPls })
        }
        catch(error) {
            throw error
        }
    }

    /**
     * Fetches the next USER_PLS_MAX_PER_REQUEST using a next page token.
     * Called subsequently, after the initial user playlists request has been called.
     * 
     * @throws {ExpiredTokenError}       Error requesting personal user data from expired token.
     * @throws {ApiError}                Error working Youtube Data API
     */
    async fetchMoreUserPlaylists() {
        try {
            const res = await getUserYtPlaylists(this.accessToken!, USER_PLS_MAX_PER_REQUEST, this.userPlaylistsNextPageToken!)
            const moreYtPlaylists = res.userPlaylists

            this.userPlaylists = [...this.userPlaylists, ...moreYtPlaylists]
            this.hasFetchedAllUserPls = moreYtPlaylists.length < USER_PLS_MAX_PER_REQUEST
            this.userPlaylistsNextPageToken = res.userPlaylistsNextPageToken

            // do not save subseq playlist response data in local storage, will always use the initial request after a refresh
            this.updateYoutubeUserData({ 
                userPlaylists: this.userPlaylists,  
                hasFetchedAllUserPls: this.hasFetchedAllUserPls,
                userPlaylistsNextPageToken: this.userPlaylistsNextPageToken
            }, false)
        }
        catch(error: any) {
            this.setError(error)
            throw error
        }
    }

    /**
     * Load youtube creds and user data from local storage.
     * Called everytime user refreshes and Yotube Data has to be re-initialized.
     */
    loadAndSetUserData() {
        const ytCreds = loadYtCredentials()!
        const userData = loadYtUserData()!

        this.accessToken = ytCreds.accessToken
        this.refreshToken = ytCreds.refreshToken

        this.username = userData.username!
        this.profileImgSrc = userData.profileImgSrc!
        this.email = userData.email!
        this.userPlaylists = userData.userPlaylists!
        this.userPlaylistsNextPageToken = userData.userPlaylistsNextPageToken!
        this.userPlaylistLength = userData.userPlaylistLength!

        this.updateYoutubeUserData({ ...ytCreds, ...userData, hasUserSignedIn: true })
    }

    saveYtCredentials() {
        saveYtCredentials({
            accessToken: this.accessToken!,
            refreshToken: this.refreshToken!
        })
    }
    
    saveYtUserData() {
        saveYtUserData({
            username: this.username!,
            profileImgSrc: this.profileImgSrc!,
            email: this.email!,
            userPlaylists: this.userPlaylists!.slice(0, USER_PLS_MAX_PER_REQUEST),
            userPlaylistLength: this.userPlaylistLength!,
            userPlaylistsNextPageToken: this.userPlaylistsNextPageToken!
        })
    }

    /**
     * Get the updated version of the old state. 
     * This is done to avoid destructuring as methods will not be incorporated.
     * 
     * @param newState   New changes to be incorporated
     * @param oldState   Old version of the data to be updated with the new changes.
     */
    getNewStateObj(newState: Partial<YoutubeUserData>, oldState: YoutubeUserData) {
        const newStateObj = oldState

        if (newState.username != undefined)                    newStateObj.username = newState.username
        if (newState.profileImgSrc != undefined)               newStateObj.profileImgSrc = newState.profileImgSrc
        if (newState.email != undefined)                       newStateObj.email = newState.email
        if (newState.accessToken != undefined)                 newStateObj.accessToken = newState.accessToken
        if (newState.refreshToken != undefined)                newStateObj.refreshToken = newState.refreshToken
        if (newState.hasUserSignedIn != undefined)             newStateObj.hasUserSignedIn = newState.hasUserSignedIn
        if (newState.userPlaylists != undefined)               newStateObj.userPlaylists = newState.userPlaylists
        if (newState.userPlaylistsNextPageToken != undefined)  newStateObj.userPlaylistsNextPageToken = newState.userPlaylistsNextPageToken
        if (newState.userPlaylistLength != undefined)          newStateObj.userPlaylistLength = newState.userPlaylistLength
        if (newState.hasFetchedAllUserPls != undefined)          newStateObj.hasFetchedAllUserPls = newState.hasFetchedAllUserPls

        return newStateObj
    }

    /**
     * Clear youtube user and creds data from local storage. 
     */
    clearYoutubeUserData() {
        deleteYtCredentials()
        deleteYtUserData()
    }
}