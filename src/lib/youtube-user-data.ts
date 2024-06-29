import { APIError, type CustomError } from "./errors"
import { ytUserDataStore } from "./store"
import { authYoutubeClient,  getFreshToken,  getUserYtPlaylists, logOutUser } from "./api-youtube"
import { deleteYtUserData, deleteYtCredentials, saveYtCredentials, 
         saveYtUserData, loadYtCredentials, loadYtUserData, USER_PLS_MAX_PER_REQUEST, youtubeAPIErrorHandler 
} from "./utils-youtube"
import { APIErrorCode } from "./enums"

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
    username = ""
    profileImgSrc = ""
    email = ""
    error: CustomError | null = null
    
    userPlaylists: YoutubePlaylist[] = []
    userPlsNextPageToken = ""
    userPlsSecondPageToken = ""
    userPlaylistsTotal = 0
    hasFetchedAllUserPls = false
    
    accessToken = ""
    refreshToken = ""
    accessTokenCreationDate: Date | null = null
    tokenExpiresInSecs = 3600
    hasTokenExpired = false

    ACTIVE_TOKEN_THRESHOLD_SECS = 60
    
    constructor() {
        ytUserDataStore.set(this)
        this.loadAndSetUserData()
    }

    /**
     * Init auth flow and if user approves consent, save the result from OAuth Flow response.
     * Required to initialize new instance. 
     * Placed in a different method since async due to Auth Flow.
     */
    async init() {
        const hasSignedIn = this.accessToken != ""
        try {
            if (hasSignedIn) return
            
            const authRes = await authYoutubeClient()
            await this.initData(authRes)
        }
        catch(error: any) {
            if (!hasSignedIn) {
                this.quit()
            }
            if (error.code === APIErrorCode.AUTH_DENIED)  {
                throw error
            }
            else {
                throw new APIError(APIErrorCode.AUTHORIZATION_ERROR, error.message)
            }
        }
    }

    /**
     * Initializes credential data and user data.
     */
    async initData(res: YTOAuthResponse) {
        const ytCreds: YoutubeUserCreds = {
            accessToken: res.accessToken,
            refreshToken: "",
            accessTokenCreationDate: new Date()
        }
        const ytUserData = {
            username: res.username,
            profileImgSrc: res.profileImgSrc,
            email: res.email
        }

        this.accessToken = ytCreds.accessToken
        this.accessTokenCreationDate = new Date()

        this.username = ytUserData.username
        this.profileImgSrc = ytUserData.profileImgSrc
        this.email = ytUserData.email

        await this.getUserPlaylists()

        this.userPlsSecondPageToken = this.userPlsNextPageToken

        this.hasUserSignedIn = true
        this.updateYoutubeUserData({ 
            ...ytCreds, ...ytUserData, hasUserSignedIn: true,
            userPlsSecondPageToken: this.userPlsSecondPageToken
        })
    }

    hasAccessTokenExpired() {
        const currentTime = new Date().getTime()
        const timeElapsed = currentTime - new Date(this.accessTokenCreationDate!).getTime()
        const timeRemaining = (this.tokenExpiresInSecs * 1000) - timeElapsed
    
        const threshold = this.ACTIVE_TOKEN_THRESHOLD_SECS * 1000 
    
        return threshold >= timeRemaining
    }

    setTokenHasExpired(hasExpired: boolean) {
        this.hasTokenExpired = hasExpired
        this.updateYoutubeUserData({ hasTokenExpired: hasExpired })
    }

    async verifyAccessToken() {
        if (this.hasAccessTokenExpired()) {
            throw new APIError(APIErrorCode.EXPIRED_TOKEN)
        }
        return this.accessToken
    }

    /**
     * Renew expired access token to continue fetching user playlists.
     * Does not get a fresh token from a refresh token (can't do with Firebase).
     * Forces a re-login to get a fresh token.
     */
    async refreshAccessToken() {
        try {
            const accessToken = await getFreshToken()

            this.accessToken = accessToken
            this.accessTokenCreationDate = new Date()

            this.updateYoutubeUserData({ 
                accessToken: this.accessToken, 
                accessTokenCreationDate: this.accessTokenCreationDate
            })

            if (this.hasTokenExpired) {
                this.setTokenHasExpired(false)
            }
        }
        catch(error) {
            this.onError(new APIError(APIErrorCode.FAILED_TOKEN_REFRESH))
            throw error
        }
    }

    onError(error: any) {
        console.error(error)
        if (error instanceof APIError) {
            youtubeAPIErrorHandler(error)
        }
        else {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.GENERAL, `There was an error with Youtube. Please try again later.`))
        }
    }

    /**
     * Clears user data. 
     */
    async logOutUser() {
        try {
            await logOutUser()
        }
        finally {
            this.quit()
        }
    }

    quit() {
        ytUserDataStore.set(null)
        this.clearYoutubeUserData()
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

    async refreshUserPlaylists() {
        try {
            await this.verifyAccessToken()
            await this.getUserPlaylists(true)

            this.userPlsSecondPageToken = this.userPlsNextPageToken
            this.updateYoutubeUserData({ userPlsSecondPageToken: this.userPlsSecondPageToken })            
        }
        catch(error: any) {
            if (error.code === APIErrorCode.EXPIRED_TOKEN) {
                this.setTokenHasExpired(true)
                this.onError(error)
            }
            else if (error.code === APIErrorCode.RESOURCE_NOT_FOUND){
                this.onError(new APIError(APIErrorCode.RESOURCE_NOT_FOUND, error.message))
            }
            else {
                this.onError(new APIError(APIErrorCode.GENERAL, `There was an refreshing your playlists. Please try again later.`))
            }
            throw error
        }
    }

    async loadMorePlaylistItems() {
        try {
            if (this.hasFetchedAllUserPls) return

            await this.verifyAccessToken()
            await this.getUserPlaylists()
        }
        catch(error: any) {
            if (error instanceof APIError && error.code === APIErrorCode.EXPIRED_TOKEN) {
                this.setTokenHasExpired(true)
                this.onError(error)
            }
            else {
                this.onError(new APIError(APIErrorCode.GENERAL, `There was an error loading more playlists from your library. Please try again later.`))
            }
            throw error
        }
    }

    /**
     * Used to get user's playlists saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content.
     * @param doRefresh             Request for the first page to get fresh resource data.
     * @returns                     Youtube user's saved playlists
     */
    async getUserPlaylists(doRefresh = false) {
        if (doRefresh) {
            this.userPlsNextPageToken = ""
            this.userPlaylistsTotal = 0
            this.userPlaylists = []
            this.hasFetchedAllUserPls = false
        }

        const playlistResponse = await getUserYtPlaylists(
            this.accessToken, USER_PLS_MAX_PER_REQUEST, this.userPlsNextPageToken
        )

        this.userPlsNextPageToken =      playlistResponse.userPlsNextPageToken
        this.userPlaylistsTotal         =  playlistResponse.userPlaylistsTotal
        this.userPlaylists              =  [...this.userPlaylists, ...playlistResponse.userPlaylists]
        this.hasFetchedAllUserPls       =  playlistResponse.userPlaylists.length < USER_PLS_MAX_PER_REQUEST

        this.updateYoutubeUserData({ 
            userPlaylists:        this.userPlaylists,  
            userPlaylistsTotal:   this.userPlaylistsTotal,
            hasFetchedAllUserPls: this.hasFetchedAllUserPls,
        })
    }

    /**
     * Load youtube creds and user data from local storage.
     * Called everytime user refreshes and Yotube Data has to be re-initialized.
     */
    loadAndSetUserData() {
        const ytCreds = loadYtCredentials()
        const userData = loadYtUserData()

        if (!ytCreds || !userData) return

        this.accessToken      = ytCreds.accessToken
        this.refreshToken     = ytCreds.refreshToken
        this.accessTokenCreationDate = ytCreds.accessTokenCreationDate
        this.hasUserSignedIn  = true

        this.username      = userData.username!
        this.profileImgSrc = userData.profileImgSrc!
        this.email         = userData.email!
        
        this.userPlaylists               = userData.userPlaylists!
        this.userPlaylistsTotal          = userData.userPlaylistsTotal!
        this.userPlsSecondPageToken = userData.userPlsSecondPageToken
        this.userPlsNextPageToken   = userData.userPlsSecondPageToken

        this.updateYoutubeUserData({ ...ytCreds, ...userData, hasUserSignedIn: true })
    }

    saveYtCredentials() {
        saveYtCredentials({
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            accessTokenCreationDate: this.accessTokenCreationDate!
        })
    }
    
    saveYtUserData() {
        saveYtUserData({
            username:       this.username!,
            profileImgSrc:  this.profileImgSrc!,
            email:          this.email!,
            accessTokenCreationDate:  this.accessTokenCreationDate!,
            userPlaylists:            this.userPlaylists!.slice(0, USER_PLS_MAX_PER_REQUEST),
            userPlaylistsTotal:       this.userPlaylistsTotal!,
            userPlsSecondPageToken: this.userPlsSecondPageToken
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

        if (newState.username != undefined)             newStateObj.username = newState.username
        if (newState.profileImgSrc != undefined)        newStateObj.profileImgSrc = newState.profileImgSrc
        if (newState.email != undefined)                newStateObj.email = newState.email
        if (newState.hasUserSignedIn != undefined)      newStateObj.hasUserSignedIn = newState.hasUserSignedIn
        if (newState.userPlaylists != undefined)        newStateObj.userPlaylists = newState.userPlaylists
        if (newState.userPlaylistsTotal != undefined)   newStateObj.userPlaylistsTotal = newState.userPlaylistsTotal
        if (newState.hasFetchedAllUserPls != undefined) newStateObj.hasFetchedAllUserPls = newState.hasFetchedAllUserPls

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