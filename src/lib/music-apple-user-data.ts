import { musicDataStore } from "./store"
import { MusicUserData, type MusicUserDataStore } from "./music-user-data"

import { getDifferenceInSecs } from "./utils-date"
import { removeAppleMusicTokens, saveMusicUserData, loadMusicUserData, deleteMusicUserData, LIBRARY_COLLECTION_LIMIT, initMusicToast, musicAPIErrorHandler} from "./utils-music"
import { getAppleMusicUserAlbums, getAppleMusicUserLikedTracks, getAppleMusicUserPlaylists } from "./api-apple-music"

import { APIError, AppServerError } from "./errors"
import { APIErrorCode, MusicPlatform, UserLibraryMedia } from "./enums"

/**
 * User data class for the Apple Music Kit API.
 * Manages and stores user data information (including library items) and authorization data.
 */
export class AppleMusicUserData extends MusicUserData implements MusicUserDataStore<AppleMusicUserData> {
    musicKit: any = null
    musicPlayerInstance: any

    // creds
    accessToken = ""       // described as Developer Token in Docs
    refreshToken = ""
    hasTokenExpired = false
    userToken: string = ""
    accessTokenCreationDate: Date | null = null
    tokenExpiresInMs = -1

    // session
    isSignedIn = false
    userDetails: MusicUserDetails | null = null
    currentUserMedia = UserLibraryMedia.Playlists

    // user data

    // user library playlists
    userPlaylists: UserLibraryCollection = {
        items: [],
        hasFetchedAll: false,
        offset: -1,
        totalItems: 0
    }

    // user liked tracks
    userLikedTracks: UserLibraryCollection = {
        items: [],
        hasFetchedAll: false,
        offset: -1,
        totalItems: 0
    }

    // user library albums
    userAlbums: UserLibraryCollection = {
        items: [],
        hasFetchedAll: false,
        offset: -1,
        totalItems: 0
    }

    musicPlatform = MusicPlatform.AppleMusic
    ACTIVE_TOKEN_THRESHOLD_SECS = 60
 
    constructor() { 
        super()
        musicDataStore.set(this)
        this.loadAndSetUserData()
    }

    async init() {
        const hasSignedIn = this.accessToken != ""

        try {
            if (hasSignedIn) {
                this.userToken = await this.initAppleMusic(this.accessToken)            
            }
            else {
                await this.initCreds()
                await this.initUserData()
                
                this.isSignedIn = true
                this.updateState({ isSignedIn: true, currentUserMedia: this.currentUserMedia })
            }
        }
        catch(e: any) {
            const message = e.toString()
            let error = e
            
            // This case occurs when: user closes consent screen, denies, non-subscriber log in
            // TODO: make a special case that shows users why it occured (do this to catch case where user is not a subcriber)
            if (message.includes("AUTHORIZATION_ERROR")) {
                this.quit()
                return
            }
            else if (hasSignedIn) {
                error = new APIError(APIErrorCode.EXPIRED_TOKEN)
            }
            console.error(error)
            throw error
        }
    }

    async initCreds() {
        const tokenData = await this.fetchAPIToken()

        this.accessToken = tokenData.accessToken
        this.tokenExpiresInMs = tokenData.expInMs

        this.accessTokenCreationDate = new Date()
        this.userToken = await this.initAppleMusic(this.accessToken)

        this.updateState({ 
            accessToken: this.accessToken, userToken: this.userToken,
            tokenExpiresInMs: this.tokenExpiresInMs, accessTokenCreationDate: this.accessTokenCreationDate
        })
    }

    /**
     * 
     * Get Apple Music User / Access Token from the back end. 
     * Will be included in the requests to Apple Music API.
     * Needed to initialize Apple Music Kit.
     */
    async fetchAPIToken(): Promise<{ accessToken: string, expInMs: number }> {
        try {
            const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            const res = await fetch("http://localhost:3000/", options)
    
            if (!res.ok) {
                console.error(`Error fetching Apple Music Kit token from app server. Status: ${res.status}`)
                throw new APIError(APIErrorCode.AUTHORIZATION_ERROR)
            }
    
            const data = await res.json()
            return {
                accessToken: data.token,
                expInMs: data.exp
            }
        }
        catch(error: any) {
            console.error(error)
            throw error
        }
    }

    /**
     * From access token, initialize & configure Music Kit and create an instance of it.
     * Invoke user authorization to access user’s Apple Music data & save auth token. 
     * Must be called every time Apple Music Kit is used.
     * 
     * @param accessToken            Access / Dev token returned from server
     * @returns                      Returns token returned from completed authorization flow. Returns null if user is not a subscriber.
     */
    async initAppleMusic (accessToken: string): Promise<string> {
        try {
            const options = { developerToken: accessToken, app: { name: 'Luciole', build: '1.1' } }
            // @ts-ignore
            this.musicKit = MusicKit
        
            if (!this.musicKit) {
                console.error(`Error initializing Music Kit.`)
                throw new APIError(APIErrorCode.APP_SERVER)
            }

            this.musicPlayerInstance = await this.musicKit.configure(options)
            return await this.musicPlayerInstance.authorize()
        }
        catch(e: any) { 
            throw e
        }
    }

    /**
     * Get user library playlists. 
     * Apple Musisc API does not provide a way to get user details.
     */
    async initUserData() {
        await this.getUserPlaylists()
    }

    setTokenHasExpired(hasExpired: boolean) {
        this.hasTokenExpired = hasExpired
        this.updateState({ hasTokenExpired: hasExpired })

        if (hasExpired) {
            musicAPIErrorHandler(new APIError(APIErrorCode.EXPIRED_TOKEN))
        }
    }

    /**
     * Check if token has or about to expire. 
     * Called everytime a request to the API is made.
     * @returns    Token will expire
     */
    hasAccessTokenExpired() {
        const currentTime = new Date().getTime()
        const timeFromCreation = currentTime - new Date(this.accessTokenCreationDate!).getTime()
        const timeUntilExpiration = this.tokenExpiresInMs - timeFromCreation
    
        const threshold = this.ACTIVE_TOKEN_THRESHOLD_SECS * 1000 
    
        return timeUntilExpiration <= threshold
    }

    async verifyAccessToken() {
        if (this.hasAccessTokenExpired()) {
            await this.refreshAccessToken()
        }
        return this.accessToken
    }

    /**
     * Request new user token after a current token has expired.
     * Separate from initMusicData as other platfroms might do fresh token / relogging in requests differently.
     */
    async refreshAccessToken() {
        try {
            const tokenData = await this.fetchAPIToken()

            console.log("new token!", tokenData)

            this.accessToken = tokenData.accessToken
            this.tokenExpiresInMs = tokenData.expInMs
            this.accessTokenCreationDate = new Date()

            this.updateState({ 
                accessToken: this.accessToken, tokenExpiresInMs: this.tokenExpiresInMs, accessTokenCreationDate: this.accessTokenCreationDate,
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

    /**
     * General error handler. Called by other members.
     * @param error  Error 
     */
    onError(error: any) {
        super.onError(error, MusicPlatform.AppleMusic)
    }

    /**
     * Called when user wants to lout out of music account.
     */
    quit() {
        this.deleteMusicUserData()
        musicDataStore.set(null)
    }

    /**
     * Update the state of user music data.
     * Saves to local storage to persist state between refreshes.
     * @param newState  New version of current state
     */
    updateState(newState: Partial<AppleMusicUserData>, doSave: boolean = true) {
        musicDataStore.update((data: MusicUserData | null) => this.getNewStateObj(newState, data! as AppleMusicUserData))

        if (doSave) this.saveState()
    }

    /**
     * Used to get user's playlists saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content.
     * @param doRefresh             Request for the first page to get fresh resource data.
     * @returns                     AppleMusic user's saved playlists
     */
    async getUserPlaylists(doRefresh = false) {
        let userPlaylists = !doRefresh ? this.userPlaylists : { 
            items: [],
            hasFetchedAll: false,
            offset: 0,
            totalItems: 0
        }

        let offset = Math.max(userPlaylists.offset, 0)
        let res = await getAppleMusicUserPlaylists(LIBRARY_COLLECTION_LIMIT, offset)
        
        userPlaylists = {
            offset: userPlaylists.offset + res.items.length,
            items:  [...userPlaylists.items, ...res.items] as Playlist[],
            hasFetchedAll:  res.items.length < LIBRARY_COLLECTION_LIMIT,
            totalItems: res.total
        } 

        this.updateState({ userPlaylists })
    }

    /**
     * Used to get user's albums saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content.
     * @param doRefresh             Request for the first page to get fresh resource data.
     * @returns                     AppleMusic user's saved albums
     */
    async getUserAlbums(doRefresh = false) {
        let userAlbums = !doRefresh ? this.userAlbums : { 
            items: [],
            hasFetchedAll: false,
            offset: 0,
            totalItems: 0
        }

        let offset = Math.max(userAlbums.offset, 0)
        let res = await getAppleMusicUserAlbums(LIBRARY_COLLECTION_LIMIT, offset)

        userAlbums = {
            offset: userAlbums.offset + res.items.length,
            items:  [...userAlbums.items, ...res.items] as Album[],
            hasFetchedAll:  res.items.length < LIBRARY_COLLECTION_LIMIT,
            totalItems: res.total
        } 

        this.updateState({ userAlbums })
    }    

    /**
     * Used to get user's tracks saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content
     * @param doRefresh             Request for the first page to get fresh resource data.
     * @returns                     AppleMusic user's liked tracks
     */
    async getUserLikedTracks(doRefresh = false) {
        let userLikedTracks = !doRefresh ? this.userLikedTracks : { 
            items: [],
            hasFetchedAll: false,
            offset: 0,
            totalItems: 0
        }
        let offset = Math.max(userLikedTracks.offset, 0)
        let res = await getAppleMusicUserLikedTracks(LIBRARY_COLLECTION_LIMIT, offset)

        userLikedTracks = {
            offset: userLikedTracks.offset + res.items.length,
            items:  [...userLikedTracks.items, ...res.items] as Track[],
            hasFetchedAll:  res.items.length < LIBRARY_COLLECTION_LIMIT,
            totalItems: res.total
        } 

        this.updateState({ userLikedTracks })
    }

    /**
     * Update the current library media
     * @param media    Media user has chosen.                     
     * @param isSwitchingTheFirstTime   Is chosen for the first time for the session.
     */
    async updateLibraryMedia(media: UserLibraryMedia, isSwitchingTheFirstTime: boolean) {
        try {
            await this.verifyAccessToken()

            // if first time request for resource
            if (media === UserLibraryMedia.Albums && isSwitchingTheFirstTime) {
                await this.getUserAlbums()
            }
            else if (media === UserLibraryMedia.LikedTracks && isSwitchingTheFirstTime) {
                await this.getUserLikedTracks()
            }

            this.currentUserMedia = media
            this.updateState({ currentUserMedia: media })
        }
        catch (error: any) {
            if (error instanceof APIError && error.code === APIErrorCode.EXPIRED_TOKEN) {
                this.setTokenHasExpired(true)
                this.onError(error)
            }
            else if (error.code != APIErrorCode.FAILED_TOKEN_REFRESH) {
                this.onError(new APIError(APIErrorCode.GENERAL, `There was an loading your ${media.toLowerCase()} from your library. Please try again later.`))
            }
            throw error
        }
    }

    /**
     * Refresh current chosen library media resource for updated data.
     */
    async refreshCurrentLibraryMedia() {
        try {
            await this.verifyAccessToken()

            if (this.currentUserMedia === UserLibraryMedia.Playlists) {
                await this.getUserPlaylists(true)
            }
            else if (this.currentUserMedia === UserLibraryMedia.Albums) {
                await this.getUserAlbums(true)
            }
            else {
                await this.getUserLikedTracks(true)
            }
        }
        catch (error: any) {
            if (error instanceof APIError && error.code === APIErrorCode.EXPIRED_TOKEN) {
                this.setTokenHasExpired(true)
                this.onError(error)
            }
            else if (error.code != APIErrorCode.FAILED_TOKEN_REFRESH) {
                this.onError(new APIError(APIErrorCode.GENERAL, `There was an refreshing ${this.currentUserMedia.toLowerCase()} from your library. Please try again later.`))
            }
            throw error
        }
    }

    /**
     * Called when the user scrolls to the end of the library list to get more items.
     */
    async getMoreLibraryItems() {
        try {
            await this.verifyAccessToken()

            if (this.currentUserMedia === UserLibraryMedia.Playlists && !this.userPlaylists.hasFetchedAll) {
                await this.getUserPlaylists()
            }
            else if (this.currentUserMedia === UserLibraryMedia.Albums && !this.userAlbums.hasFetchedAll) {
                await this.getUserAlbums()
            }
            else if (this.currentUserMedia === UserLibraryMedia.LikedTracks && !this.userLikedTracks.hasFetchedAll) {
                await this.getUserLikedTracks()
            }
        }
        catch (error: any) {
            if (error instanceof APIError && error.code === APIErrorCode.EXPIRED_TOKEN) {
                this.setTokenHasExpired(true)
                this.onError(error)
            }
            else if (error.code != APIErrorCode.FAILED_TOKEN_REFRESH) {
                this.onError(new APIError(APIErrorCode.GENERAL, `There was an loading more ${this.currentUserMedia.toLowerCase()} from your library. Please try again later.`))
            }
            throw error
        }
    }


    /**
     * @returns  Current chosen library details
     */
    getCurrentLibraryDetails(): UserLibraryCollection {
        return this.getLibraryDetails(this.currentUserMedia!)
    }

    /**
     * @param    currentUserMedia 
     * @returns  Current chosen library details
     */
    getLibraryDetails(currentUserMedia: UserLibraryMedia): UserLibraryCollection {
        if (currentUserMedia === UserLibraryMedia.Playlists) {
            return this.userPlaylists
        }
        else if (currentUserMedia === UserLibraryMedia.Albums) {
            return this.userAlbums
        }
        else {
            return this.userLikedTracks 
        }
    }

    /**
     * @returns Save data from previous session.
     */
    loadAndSetUserData() {
        const savedUserData = loadMusicUserData() as Partial<AppleMusicUserData>
        if (!savedUserData) return

        this.accessTokenCreationDate =  savedUserData.accessTokenCreationDate!,
        this.accessToken =      savedUserData.accessToken!,
        this.userToken =        savedUserData.userToken!,
        this.refreshToken =     savedUserData.refreshToken!,
        this.musicPlatform =    savedUserData.musicPlatform!,
        this.tokenExpiresInMs =    savedUserData.tokenExpiresInMs!
        this.userDetails =          savedUserData.userDetails!
        this.hasTokenExpired =      savedUserData.hasTokenExpired!
        this.isSignedIn =           savedUserData.isSignedIn!
        this.currentUserMedia =     savedUserData.currentUserMedia!

        this.userPlaylists =  savedUserData.userPlaylists!

        if (savedUserData.userLikedTracks) {
            this.userLikedTracks = savedUserData.userLikedTracks
        }
        if (savedUserData.userAlbums) {
            this.userAlbums = savedUserData.userAlbums
        }

        this.verifyAccessToken()
        this.updateState({ ...savedUserData }, false)
    }

    /**
     * Saves updated data to persist state between refreshes.
     * Only saves what it needs to.
     */
    saveState() {
        let newData = {} as AppleMusicUserData
        
        newData.isSignedIn    = this.isSignedIn
        newData.musicPlatform = this.musicPlatform
        newData.userDetails   = this.userDetails
        newData.currentUserMedia = this.currentUserMedia
        newData.hasTokenExpired  = this.hasTokenExpired
        
        newData.userToken        = this.userToken
        newData.tokenExpiresInMs = this.tokenExpiresInMs
        newData.accessToken  = this.accessToken
        newData.refreshToken = this.refreshToken
        newData.tokenExpiresInMs        = this.tokenExpiresInMs
        newData.accessTokenCreationDate = this.accessTokenCreationDate
        
        newData.userPlaylists = {
            offset:        this.userPlaylists.offset === 0 ? 0 : Math.min(this.userPlaylists.offset, LIBRARY_COLLECTION_LIMIT), 
            items:         this.userPlaylists.items.slice(0, LIBRARY_COLLECTION_LIMIT),
            hasFetchedAll: Math.min(this.userPlaylists.items.length, LIBRARY_COLLECTION_LIMIT) < this.userPlaylists.totalItems ? false : true,
            totalItems:    this.userPlaylists.totalItems
        }

        if (this.userLikedTracks.offset >= 0) {
            newData.userLikedTracks = {
                offset:        this.userLikedTracks.offset === 0 ? 0 : Math.min(this.userLikedTracks.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         this.userLikedTracks.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll: Math.min(this.userLikedTracks.items.length, LIBRARY_COLLECTION_LIMIT) < this.userLikedTracks.totalItems ? false : true,
                totalItems:    this.userLikedTracks.totalItems
            }
        }
        if (this.userAlbums.offset >= 0) {
            newData.userAlbums = {
                offset:        this.userAlbums.offset === 0 ? 0 : Math.min(this.userAlbums.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         this.userAlbums.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll: Math.min(this.userAlbums.items.length, LIBRARY_COLLECTION_LIMIT) < this.userAlbums.totalItems ? false : true,
                totalItems:    this.userAlbums.totalItems
            }
        }

        saveMusicUserData(newData)
    }

    /**
     * @param newState  New state changes to be incorporated
     * @param oldState  Current state
     * @returns         New state with the latest incorporated changes.
     */
    getNewStateObj(newState: Partial<AppleMusicUserData>, oldState: AppleMusicUserData): AppleMusicUserData {
        const newStateObj = oldState

        if (newState.isSignedIn != undefined)       newStateObj.isSignedIn = newState.isSignedIn
        if (newState.musicPlatform != undefined)    newStateObj.musicPlatform = newState.musicPlatform
        if (newState.currentUserMedia != undefined) newStateObj.currentUserMedia = newState.currentUserMedia
        if (newState.hasTokenExpired != undefined)  newStateObj.hasTokenExpired = newState.hasTokenExpired
        
        if (newState.userPlaylists != undefined)    newStateObj.userPlaylists = newState.userPlaylists
        if (newState.userLikedTracks != undefined)  newStateObj.userLikedTracks = newState.userLikedTracks
        if (newState.userAlbums != undefined)       newStateObj.userAlbums = newState.userAlbums

        return newStateObj
    }

    /**
     * lear music user and creds data from local storage. 
     */
    deleteMusicUserData() {
        deleteMusicUserData()
        removeAppleMusicTokens()
    }
}
