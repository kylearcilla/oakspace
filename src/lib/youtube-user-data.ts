import { APIError, type CustomError } from "./errors"
import { musicDataStore, ytUserDataStore } from "./store"
import { authYoutubeClient,  getFreshToken,  getUserYtPlaylists, logOutUser } from "./api-youtube"
import { 
        deleteYtUserData, 
        deleteYtCredentials, 
        saveYtCredentials, 
        saveYtUserData, 
        loadYtCredentials, 
        loadYtUserData, 
        USER_PLS_MAX_PER_REQUEST, 
        youtubeAPIErrorHandler, 
        initToast
} from "./utils-youtube"
import { APIErrorCode, LogoIcon } from "./enums"
import { get, type Writable } from "svelte/store"
import { toast } from "./utils-toast"

/**
 * Manages a logged Youtube user's data. 
 * Leverages Firebase for Google Authentication for Youtube Log In.
 * Is itself a reactive class / data store (set during instantiation).
 */
export class YoutubeUserData {
    isSignedIn    = false
    username      = ""
    profileImgSrc = ""
    email         = ""
    error: any = null
    forMusic = false
    
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

    store: Writable<YoutubeUserData | null> | null = null

    ACTIVE_TOKEN_THRESHOLD_SECS = 60
    
    constructor(store: Writable<YoutubeUserData | null>, doLoadData = true) {
        store.set(this)

        this.store = store

        if (doLoadData) {
            this.loadAndSetUserData()
        }
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
    async initData(res: GoogleAuthResponse) {
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

        this.isSignedIn = true
        this.updateYoutubeUserData({ 
            ...ytCreds, ...ytUserData, isSignedIn: true,
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
            toast("default", {
                message: "Youtube",
                description: "Token has expired. Log in again to continue.",
                logoIcon: LogoIcon.Youtube,
                action: {
                    label:  "Continue session",
                    onClick: () => this.refreshAccessToken()
                }
            })

            this.setTokenHasExpired(true)

            return false
        }
        return true
    }

    /**
     * Renew expired access token to continue fetching user playlists.
     * Does not get a fresh token from a refresh token (can't do with Firebase).
     * Forces a re-login to get a fresh token.
     */
    async refreshAccessToken() {
        try {
            const accessToken    = await getFreshToken()
            const freshTokenData = {
                token: accessToken, creationDate: new Date() 
            }

            this.updateOtherYtStoreToken(freshTokenData)
            this.updateTokenAfterRefresh(freshTokenData)

            initToast("Token refreshed!")
        }
        catch(error: any) {
            if (error.code != APIErrorCode.AUTH_DENIED) {
                this.onError(new APIError(APIErrorCode.FAILED_TOKEN_REFRESH))
            }
        }
    }

    onError(error: any) {
        console.error(error)
        this.error = error
        this.updateYoutubeUserData({ error })
    
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
        this.store!.set(null)
        deleteYtCredentials()
        deleteYtUserData()
    }

    /**
     * Update store data and save state in local storage.
     * @param newData   New data to be incorporated.
     */
    updateYoutubeUserData(newData: Partial<YoutubeUserData>, doSave: boolean = true) {
        this.store!.update((data: YoutubeUserData | null) => { 
            return this.getNewStateObj(newData, data!)
        })

        if (doSave) {
            this.saveYtCredentials()
            this.saveYtUserData()
        }
    }

    async refreshUserPlaylists() {
        try {
            const isTokenValid = await this.verifyAccessToken()
            if (!isTokenValid) return

            await this.getUserPlaylists(true)

            this.userPlsSecondPageToken = this.userPlsNextPageToken
            this.updateYoutubeUserData({ userPlsSecondPageToken: this.userPlsSecondPageToken })            
        }
        catch(error: any) {
            console.error(error)
            
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

            const isTokenValid = await this.verifyAccessToken()
            if (!isTokenValid) return

            await this.getUserPlaylists()
        }
        catch(error: any) {
            console.error(error)

            if (error?.code === APIErrorCode.EXPIRED_TOKEN) {
                this.setTokenHasExpired(true)
                this.onError(error)
            }
            else {
                this.onError(new APIError(APIErrorCode.GENERAL, `There was an error loading more playlists from your library. Please try again later.`))
            }
            throw error
        }
    }

    updateOtherYtStoreToken(creds: { token: string, creationDate: Date }) {
        if (this.forMusic) {
            const store = get(ytUserDataStore)

            if (store?.username === this.username) {
                store.updateTokenAfterRefresh(creds)
            }
        }
        else {
            const store = get(musicDataStore)

            if (store?.username === this.username) {
                store.updateTokenAfterRefresh(creds)
            }
        }
    }

    updateTokenAfterRefresh(creds: { token: string, creationDate: Date }) {
        const { token, creationDate } = creds

        this.accessToken = token
        this.accessTokenCreationDate = creationDate

        this.updateYoutubeUserData({ 
            accessToken: token, 
            accessTokenCreationDate: creationDate
        })

        if (this.hasTokenExpired) {
            this.setTokenHasExpired(false)
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
        this.isSignedIn  = true

        this.username      = userData.username!
        this.profileImgSrc = userData.profileImgSrc!
        this.email         = userData.email!
        
        this.userPlaylists               = userData.userPlaylists!
        this.userPlaylistsTotal          = userData.userPlaylistsTotal!
        this.userPlsSecondPageToken = userData.userPlsSecondPageToken
        this.userPlsNextPageToken   = userData.userPlsSecondPageToken

        this.updateYoutubeUserData({ ...ytCreds, ...userData, isSignedIn: true })
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
            userPlaylistsTotal:     this.userPlaylistsTotal!,
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
        if (newState.isSignedIn != undefined)           newStateObj.isSignedIn = newState.isSignedIn
        if (newState.userPlaylists != undefined)        newStateObj.userPlaylists = newState.userPlaylists
        if (newState.userPlaylistsTotal != undefined)   newStateObj.userPlaylistsTotal = newState.userPlaylistsTotal
        if (newState.hasFetchedAllUserPls != undefined) newStateObj.hasFetchedAllUserPls = newState.hasFetchedAllUserPls

        return newStateObj
    }
}