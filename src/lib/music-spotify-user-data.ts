import { get } from "svelte/store"
import { musicDataStore } from "./store"
import { APIErrorCode, MusicPlatform, UserLibraryMedia } from "./enums"
import { MusicUserData, type MusicUserDataStore } from "./music-user-data"
import { 
         saveMusicUserData, 
         loadMusicUserData, deleteMusicUserData, musicAPIErrorHandler
} from "./utils-music"
import { LIBRARY_COLLECTION_LIMIT, getSpotfifyUserLikedTracks, getSpotfifyUserPlaylists, getSpotifyUserAlbums, getSpotifyUserAudioBooks, getSpotifyUserData, getUserPodcastsEps, refreshAccessToken } from "./api-spotify"
import { APIError } from "./errors"
import { getDifferenceInSecs } from "./utils-date"

/**
 * User data class for the Apple Music Musc Kit API. Extends MusicUsesrData Abastract class.
 * Manages and stores user data information, app tokens, and authorization functionality.
 * Errors are handled in function calls to this instance.
 * 
 * @extends     {MusicUserData}
 * @implements  {MusicUserDataStore}
 */
export class SpotifyMusicUserData extends MusicUserData implements MusicUserDataStore<SpotifyMusicUserData> {
    accessToken = ""
    refreshToken = ""
    tokenExpiration = 0
    tokenExpCountDown = -1
    tokenInterval: NodeJS.Timer | null = null
    authCode = ""   // code verifier
    accessTokenCreationDate: Date | null = null
    hasTokenExpired = false

    hadPreviousSession = false
    isSignedIn = false
    userDetails: MusicUserDetails | null = null

    currentUserMedia = UserLibraryMedia.Playlists
    currentUserLibrary: UserLibraryCollection | null = null

    // user library albums
    userPlaylists: UserLibraryCollection = {
        items: [],
        hasFetchedAll: false,
        offset: 0,
        totalItems: 0
    }

    // user liked tracks
    userLikedTracks: UserLibraryCollection = {
        items: [],
        hasFetchedAll: false,
        offset: 0,
        totalItems: 0
    }

    // user library albums
    userAlbums: UserLibraryCollection = {
        items: [],
        hasFetchedAll: false,
        offset: 0,
        totalItems: 0
    }

    // user library podcast episodes
    userPodcastEps: UserLibraryCollection = {
        items: [],
        hasFetchedAll: false,
        offset: 0,
        totalItems: 0
    }

    // user library audiobook chapters
    userAudioBooks: UserLibraryCollection = {
        items: [],
        hasFetchedAll: false,
        offset: 0,
        totalItems: 0
    }

    musicPlatform = MusicPlatform.Spotify
    
    CLIENT_ID = "ed4c34b3aa704c6fbc88ca3e2957ced4"
    REDIRECT_URI = "http://localhost:5173/home"
    REQUEST_NEW_TOKEN_BELOW_SEC_LEFT = 60
    
    constructor(initData: SpotifyInitData | null, hasUserSignedIn = false) { 
        super()
        musicDataStore.set(this)
        
        if (hasUserSignedIn) {
            this.loadAndSetUserData()
        }
        else {
            this.initSpotifyAfterAuth(initData!)
            this.initUserData()
        }
        
        if (this.hasTokenExpired) {
            musicAPIErrorHandler(new APIError(APIErrorCode.EXPIRED_TOKEN))   
        }
        else {
            this.initTokenTimeOut()
        }
    }

    /**
     * The requesting of credential data is handled outside the class.
     * Here, the data returned is initialized.
     * Called for the first time when user first logs in.
     * @param initData 
     */
    initSpotifyAfterAuth(initData: SpotifyInitData): void {
        this.accessToken = initData.accessToken
        this.refreshToken = initData.refreshToken
        this.tokenExpiration = initData.expiresIn
        this.authCode = initData.authCode
        this.accessTokenCreationDate = new Date()
    
        this.updateState({ ...initData, accessTokenCreationDate: new Date() })
    }

    initTokenTimeOut() {
        const timeFromCreation = getDifferenceInSecs(new Date(this.accessTokenCreationDate!), new Date())
        this.tokenExpCountDown = this.tokenExpiration - timeFromCreation

        this.tokenInterval = setInterval(() => {
            this.tokenExpCountDown-- 

            if (this.tokenExpCountDown < this.REQUEST_NEW_TOKEN_BELOW_SEC_LEFT) {
                clearInterval(this.tokenInterval!)
                this.refreshAccessToken()
            }
        }, 1000)
    }

    setUserSignedIn() {
        this.isSignedIn = true
        this.updateState({ isSignedIn: true })
    }

    /**
     * Get a new access token using a refresh token from earlier response.
     */
    async refreshAccessToken() {
        try {
            const data = await refreshAccessToken(this.refreshToken)
    
            this.accessToken = data.access_token
            this.refreshToken = data.refresh_token
            this.tokenExpiration = data.expires_in
            this.accessTokenCreationDate = new Date()
    
            console.log(`New refresh token! ${this.refreshToken}`)
    
            this.updateState({ 
                accessToken: this.accessToken, refreshToken: this.refreshToken,
                tokenExpiration: this.tokenExpiration, tokenExpCountDown: this.tokenExpCountDown 
            })
    
            this.initTokenTimeOut()
        }
        catch(error: any) {
            musicAPIErrorHandler(new APIError(APIErrorCode.FAILED_TOKEN_REFRESH))
        }
    }

    /**
     * Called when user wants to lout out of music account.
     */
    quit() {
        this.deleteMusicUserData()
        if (this.tokenInterval) {
            clearInterval(this.tokenInterval)
        }
        musicDataStore.set(null)
    }


    /**
     * Update the state of user music data.
     * Saves to local storage to persist state between refreshes.
     * @param newState  New version of current state
     */
    updateState(newState: Partial<SpotifyMusicUserData>, doSave: boolean = true) {
        musicDataStore.update((data: MusicUserData | null) => {
            return this.getNewStateObj(newState, data! as SpotifyMusicUserData)
        })

        if (doSave) this.saveState()
    }

    async updateLibraryMedia(media: UserLibraryMedia, isSwitchingTheFirstTime: boolean) {
        try {
            if (media === UserLibraryMedia.Albums && isSwitchingTheFirstTime) {
                await this.getUserAlbums()
            }
            else if (media === UserLibraryMedia.Audiobooks && isSwitchingTheFirstTime) {
                await this.getUserAudiobooks()
            }
            else if (media === UserLibraryMedia.LikedTracks && isSwitchingTheFirstTime) {
                await this.getUserLikedTracks()
            }
            else if (media === UserLibraryMedia.PodcastEps && isSwitchingTheFirstTime) {
                await this.getUserPodcastsEps()
            }

            this.currentUserMedia = media
            this.updateState({ currentUserMedia: media })
        }
        catch (error: any) {
            if (error instanceof APIError && error.code === APIErrorCode.EXPIRED_TOKEN) {
                this.setTokenHasExpired()
                musicAPIErrorHandler(error)
            }
            else if (error instanceof TypeError) {
                musicAPIErrorHandler(new APIError(APIErrorCode.GENERAL, "There was an error with Spotify. Try again later"))
            }
            else {
                musicAPIErrorHandler(error)
            }
            throw error
        }
    }

    async refreshCurrentLibraryMedia() {
        try {
            if (this.currentUserMedia === UserLibraryMedia.Playlists) {
                await this.getUserPlaylists(true)
            }
            else if (this.currentUserMedia === UserLibraryMedia.Albums) {
                await this.getUserAlbums(true)
            }
            else if (this.currentUserMedia === UserLibraryMedia.PodcastEps) {

                await this.getUserPodcastsEps(true)
            }
            else if (this.currentUserMedia === UserLibraryMedia.Audiobooks) {

                await this.getUserAudiobooks(true)
            }
            else {
                await this.getUserLikedTracks(true)
            }
        }
        catch (error: any) {
            if (error instanceof APIError && error.code === APIErrorCode.EXPIRED_TOKEN) {
                this.setTokenHasExpired()
                musicAPIErrorHandler(error)
            }
            else if (error instanceof TypeError) {
                musicAPIErrorHandler(new APIError(APIErrorCode.GENERAL, "There was an error with Spotify. Try again later"))
            }
            else {
                musicAPIErrorHandler(error)
            }
            throw error
        }
    }

    /**
     * Initialize user data after user first logs in.
     * Include profile data and user playlists.
     */
    async initUserData() {
        try {
            await this.getUserProfileData()
            await this.getUserPlaylists()

            this.setUserSignedIn()
        }
        catch(error: any) {
            this.quit()
            musicAPIErrorHandler(error, MusicPlatform.Spotify)
        }
    }

    getCurrentLibraryDetails(): UserLibraryCollection {
        return this.getLibraryDetails(this.currentUserMedia!)
    }

    getLibraryDetails(currentUserMedia: UserLibraryMedia): UserLibraryCollection {
        if (currentUserMedia === UserLibraryMedia.Playlists) {
            return this.userPlaylists
        }
        else if (currentUserMedia === UserLibraryMedia.Albums) {
            return this.userAlbums
        }
        else if (currentUserMedia === UserLibraryMedia.PodcastEps) {

            return this.userPodcastEps
        }
        else if (currentUserMedia === UserLibraryMedia.Audiobooks) {

            return this.userAudioBooks
        }
        else {
            return this.userLikedTracks
        }
    }

    /**
     * Called when the user scrolls to the end of the library list to get more items.
     * @returns  Returns true if more items were available and false if no more is left.
     */
    async getMoreLibraryItems(): Promise<boolean> {
        try {
            if (this.currentUserMedia === UserLibraryMedia.Playlists) {
                if (this.userPlaylists.hasFetchedAll) return false
    
                await this.getUserPlaylists()
            }
            else if (this.currentUserMedia === UserLibraryMedia.Albums) {
                if (this.userAlbums.hasFetchedAll) return false
    
                await this.getUserAlbums()
            }
            else if (this.currentUserMedia === UserLibraryMedia.PodcastEps) {
                if (this.userPodcastEps.hasFetchedAll) return false
                
                await this.getUserPodcastsEps()
            }
            else if (this.currentUserMedia === UserLibraryMedia.Audiobooks) {
                if (this.userAudioBooks.hasFetchedAll) return false
                
                await this.getUserAudiobooks()
            }
            else if (this.currentUserMedia === UserLibraryMedia.LikedTracks) {
                if (this.userLikedTracks.hasFetchedAll) return false
                
                await this.getUserLikedTracks()
            }
            return true
        }
        catch (error: any) {
            if (error instanceof APIError && error.code === APIErrorCode.EXPIRED_TOKEN) {
                this.setTokenHasExpired()
                musicAPIErrorHandler(error)
            }
            else if (error instanceof TypeError) {
                musicAPIErrorHandler(new APIError(APIErrorCode.GENERAL, "There was an error with Spotify. Try again later"))
            }
            else {
                musicAPIErrorHandler(error)
            }

            throw error
        }
    }
    
    /**
     * Get user profile details.
     */
    async getUserProfileData() {
        this.userDetails = await getSpotifyUserData(this.accessToken)
        this.updateState({ userDetails: this.userDetails })
    }

    /**
     * Used to get user's playlists saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content.
     * @returns                     Spotify user's saved playlists
     * @throws {APIError}           Error interacting with Spotify Web Player API
     */
    async getUserPlaylists(doRefresh = false) {
        let userPlaylists = !doRefresh ? this.userPlaylists : { 
            items: [],
            hasFetchedAll: false,
            offset: 0,
            totalItems: 0
        }
        let res = await getSpotfifyUserPlaylists(this.accessToken, userPlaylists.offset)

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
     * @returns                     Spotify user's saved albums
     * @throws {APIError}           Error interacting with Spotify Web Player API
     */
    async getUserAlbums(doRefresh = false) {
        let userAlbums = !doRefresh ? this.userAlbums : { 
            items: [],
            hasFetchedAll: false,
            offset: 0,
            totalItems: 0
        }
        let res = await getSpotifyUserAlbums(this.accessToken, userAlbums.offset)

        userAlbums = {
            offset: userAlbums.offset + res.items.length,
            items:  [...userAlbums.items, ...res.items] as Album[],
            hasFetchedAll:  res.items.length < LIBRARY_COLLECTION_LIMIT,
            totalItems: res.total
        } 
        this.updateState({ userAlbums })
    }
    /**
     * Used to get user's podcast episodes saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content
     * @returns                     Spotify user's saved podcast episodes
     * @throws {APIError}           Error interacting with Spotify Web Player API
     */
    async getUserPodcastsEps(doRefresh = false) {
        let userPodcastEps = !doRefresh ? this.userPodcastEps : { 
            items: [],
            hasFetchedAll: false,
            offset: 0,
            totalItems: 0
        }
        let res = await getUserPodcastsEps(this.accessToken, userPodcastEps.offset)

        userPodcastEps = {
            offset: userPodcastEps.offset + res.items.length,
            items:  [...userPodcastEps.items, ...res.items] as PodcastEpisode[],
            hasFetchedAll:  res.items.length < LIBRARY_COLLECTION_LIMIT,
            totalItems: res.total
        } 
        this.updateState({ userPodcastEps })
    }
    /**
     * Used to get user's audiobooks saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content
     * @returns                     Spotify user's saved audio books
     * @throws {APIError}           Error interacting with Spotify Web Player API
     */
    async getUserAudiobooks(doRefresh = false) {
        let userAudioBooks = !doRefresh ? this.userAudioBooks : { 
            items: [],
            hasFetchedAll: false,
            offset: 0,
            totalItems: 0
        }
        let res = await getSpotifyUserAudioBooks(this.accessToken, userAudioBooks.offset)

        userAudioBooks = {
            offset: userAudioBooks.offset + res.items.length,
            items:  [...userAudioBooks.items, ...res.items] as AudioBook[],
            hasFetchedAll:  res.items.length < LIBRARY_COLLECTION_LIMIT,
            totalItems: res.total
        } 
        this.updateState({ userAudioBooks })
    }                                               

    /**
     * Used to get user's tracks saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content
     * @returns                     Spotify user's liked tracks
     * @throws {APIError}           Error interacting with Spotify Web Player API
     */
    async getUserLikedTracks(doRefresh = false) {
        let userLikedTracks = !doRefresh ? this.userLikedTracks : { 
            items: [],
            hasFetchedAll: false,
            offset: 0,
            totalItems: 0
        }
        let res = await getSpotfifyUserLikedTracks(this.accessToken, userLikedTracks.offset)

        userLikedTracks = {
            offset: userLikedTracks.offset + res.items.length,
            items:  [...userLikedTracks.items, ...res.items] as Track[],
            hasFetchedAll:  res.items.length < LIBRARY_COLLECTION_LIMIT,
            totalItems: res.total
        } 
        this.updateState({ userLikedTracks })
    }

    setTokenHasExpired() {
        this.hasTokenExpired = true
        this.updateState({ hasTokenExpired: true })
    }

    /**
     * @returns Save data from previous session.
     */
    loadAndSetUserData() {
        const savedUserData = loadMusicUserData()! as Partial<SpotifyMusicUserData>

        this.accessTokenCreationDate =  savedUserData.accessTokenCreationDate!,
        this.accessToken =      savedUserData.accessToken!,
        this.refreshToken =     savedUserData.refreshToken!,
        this.authCode =         savedUserData.authCode!,
        this.musicPlatform =    savedUserData.musicPlatform!,
        this.tokenExpiration =        savedUserData.tokenExpiration!
        this.userDetails =            savedUserData.userDetails!
        this.currentUserMedia =       savedUserData.currentUserMedia!
        this.isSignedIn =             savedUserData.isSignedIn!
        this.tokenExpiration =        savedUserData.tokenExpiration!
        this.hasTokenExpired =        savedUserData.hasTokenExpired!

        this.userPlaylists =    savedUserData.userPlaylists!
        this.userLikedTracks =  savedUserData.userLikedTracks!
        this.userAlbums =       savedUserData.userAlbums!
        this.userPodcastEps =   savedUserData.userPodcastEps!
        this.userAudioBooks =   savedUserData.userAudioBooks!

        this.updateState({ ...savedUserData })
    }

    /**
     * Saves updated data to persist state between refreshes.
     * Only saves what it needs to.
     */
    saveState() {
        const data = get(musicDataStore)! as SpotifyMusicUserData
        
        // user token is not saved as a new one is made after refresh
        saveMusicUserData({
            accessToken:     data.accessToken,
            musicPlatform:   data.musicPlatform,
            authCode:        data.authCode,
            refreshToken:    data.refreshToken,
            userDetails:     data.userDetails,
            currentUserMedia:  data.currentUserMedia,
            isSignedIn:        data.isSignedIn,
            accessTokenCreationDate:  data.accessTokenCreationDate,
            tokenExpiration:          data.tokenExpiration,
            hasTokenExpired:          data.hasTokenExpired,
            
            userPlaylists: {
                 ...data.userPlaylists, 
                offset:        data.userPlaylists.offset === 0 ? 0 : Math.min(data.userPlaylists.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         data.userPlaylists.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll: Math.min(data.userPlaylists.items.length, LIBRARY_COLLECTION_LIMIT) < data.userPlaylists.totalItems ? false : true
            },
            userAlbums: {
                 ...data.userAlbums, 
                offset:        data.userAlbums.offset === 0 ? 0 : Math.min(data.userAlbums.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         data.userAlbums.items.slice(0, LIBRARY_COLLECTION_LIMIT) ,
                hasFetchedAll: Math.min(data.userAlbums.items.length, LIBRARY_COLLECTION_LIMIT) < data.userAlbums.totalItems ? false : true
            },
            userAudioBooks: {
                 ...data.userAudioBooks, 
                offset:        data.userAudioBooks.offset === 0 ? 0 : Math.min(data.userAudioBooks.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         data.userAudioBooks.items.slice(0, LIBRARY_COLLECTION_LIMIT) ,
                hasFetchedAll: Math.min(data.userAudioBooks.items.length, LIBRARY_COLLECTION_LIMIT) < data.userAudioBooks.totalItems ? false : true
            },
            userLikedTracks: {
                 ...data.userLikedTracks, 
                offset:        data.userLikedTracks.offset === 0 ? 0 : Math.min(data.userLikedTracks.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         data.userLikedTracks.items.slice(0, LIBRARY_COLLECTION_LIMIT) ,
                hasFetchedAll: Math.min(data.userLikedTracks.items.length, LIBRARY_COLLECTION_LIMIT) < data.userLikedTracks.totalItems ? false : true
            },
            userPodcastEps: {
                 ...data.userPodcastEps, 
                offset:        data.userPodcastEps.offset === 0 ? 0 : Math.min(data.userPodcastEps.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         data.userPodcastEps.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll: Math.min(data.userPodcastEps.items.length, LIBRARY_COLLECTION_LIMIT) < data.userPodcastEps.totalItems ? false : true
             }
        })
    }

    /**
     * @param newState  New state changes to be incorporated
     * @param oldState  Current state
     * @returns         New state with the latest incorporated changes.
     */
    getNewStateObj(newState: Partial<SpotifyMusicUserData>, oldState: SpotifyMusicUserData): SpotifyMusicUserData {
        const newStateObj = oldState

        if (newState.isSignedIn != undefined)          newStateObj.isSignedIn = newState.isSignedIn
        if (newState.accessToken != undefined)            newStateObj.accessToken = newState.accessToken
        if (newState.musicPlatform != undefined)          newStateObj.musicPlatform = newState.musicPlatform
        if (newState.authCode != undefined)               newStateObj.authCode = newState.authCode
        if (newState.refreshToken != undefined)           newStateObj.refreshToken = newState.refreshToken
        if (newState.userDetails != undefined)            newStateObj.userDetails = newState.userDetails
        if (newState.currentUserMedia != undefined)       newStateObj.currentUserMedia = newState.currentUserMedia
        if (newState.accessTokenCreationDate != undefined)  newStateObj.accessTokenCreationDate = newState.accessTokenCreationDate
        if (newState.tokenExpiration != undefined)          newStateObj.tokenExpiration = newState.tokenExpiration
        if (newState.hasTokenExpired != undefined)        newStateObj.hasTokenExpired = newState.hasTokenExpired
        
        if (newState.userPlaylists != undefined)          newStateObj.userPlaylists = newState.userPlaylists
        if (newState.userAlbums != undefined)             newStateObj.userAlbums = newState.userAlbums
        if (newState.userAudioBooks != undefined)         newStateObj.userAudioBooks = newState.userAudioBooks
        if (newState.userPodcastEps != undefined)         newStateObj.userPodcastEps = newState.userPodcastEps
        if (newState.userLikedTracks != undefined)        newStateObj.userLikedTracks = newState.userLikedTracks

        return newStateObj
    }

    /**
     * clear music user data and creds data from local storage. 
     */
    deleteMusicUserData() {
        localStorage.removeItem("code_verifier")
        localStorage.removeItem("redirected-from-spotify-consent-page")

        deleteMusicUserData()
    }
}