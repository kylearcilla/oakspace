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
 * User data class for the Spotify Web API.
 * Manages and stores user data information (including library items) and authorization data.
 * 
 * @extends     {MusicUserData}
 * @implements  {MusicUserDataStore}
 */
export class SpotifyMusicUserData extends MusicUserData implements MusicUserDataStore<SpotifyMusicUserData> {
    // creds
    accessToken = ""
    refreshToken = ""
    tokenExpiration = 0
    authCode = ""   // code verifier
    hasTokenExpired = false
    accessTokenCreationDate: Date | null = null

    // session
    isSignedIn = false
    
    // user data
    userDetails: MusicUserDetails | null = null
    currentUserMedia = UserLibraryMedia.Playlists

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
        if (this.hasAccessTokenExpired()) {
            this.refreshAccessToken()
        }
    }

    setUserSignedIn() {
        this.isSignedIn = true
        this.updateState({ isSignedIn: true })
    }

    setTokenHasExpired(hasExpired: boolean) {
        this.hasTokenExpired = hasExpired
        this.updateState({ hasTokenExpired: hasExpired })
    }

    /**
     * Check if token has or about to expire. 
     * Called everytime a request to the API is made.
     * @returns Token will expire
     */
    hasAccessTokenExpired() {
        const timeFromCreation = getDifferenceInSecs(new Date(this.accessTokenCreationDate!), new Date())
        return this.REQUEST_NEW_TOKEN_BELOW_SEC_LEFT > this.tokenExpiration - timeFromCreation
    }
    

    /**
     * The requesting of credential data is handled outside the class.
     * The data returned is initialized.
     * @param initData    Important creds data.
     */
    initSpotifyAfterAuth(initData: SpotifyInitData): void {
        this.accessToken = initData.accessToken
        this.refreshToken = initData.refreshToken
        this.tokenExpiration = initData.expiresIn
        this.authCode = initData.authCode
        this.accessTokenCreationDate = new Date()
    
        this.updateState({ 
            ...initData, tokenExpiration: this.tokenExpiration,
            accessTokenCreationDate: new Date(), 
            musicPlatform: this.musicPlatform,
            currentUserMedia: this.currentUserMedia
        })
    }

    /**
     * Initialize user data (profile details & playlists) after user logs in.
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

    /**
     * Get user profile details.
     */
    async getUserProfileData() {
        this.userDetails = await getSpotifyUserData(this.accessToken)
        this.updateState({ userDetails: this.userDetails })
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

            console.log("new access token!", this.accessToken)
    
            this.updateState({ 
                accessToken: this.accessToken, refreshToken: this.refreshToken,
                tokenExpiration: this.tokenExpiration, accessTokenCreationDate: new Date()
            })

            if (this.hasTokenExpired) {
                this.setTokenHasExpired(false)
            }
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
        musicDataStore.set(null)
    }

    /**
     * Update the state of store.
     * Saves to local storage to persist necessary data between refreshes.
     * @param newState  New version of current state
     */
    updateState(newState: Partial<SpotifyMusicUserData>, doSave: boolean = true) {
        musicDataStore.update((data: MusicUserData | null) => this.getNewStateObj(newState, data! as SpotifyMusicUserData))

        if (doSave) this.saveState(newState)
    }

    /**
     * Update the current library media
     * @param media    Media user has chosen.                     
     * @param isSwitchingTheFirstTime   Is chosen for the first time for the session.
     */
    async updateLibraryMedia(media: UserLibraryMedia, isSwitchingTheFirstTime: boolean) {
        try {
            if (this.hasAccessTokenExpired()) {
                await this.refreshAccessToken()
            }

            // if first time request for resource
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
                this.setTokenHasExpired(true)
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
     * Refresh current chosen library media resource for updated data.
     */
    async refreshCurrentLibraryMedia() {
        try {
            if (this.hasAccessTokenExpired()) {
                await this.refreshAccessToken()
            }

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
                this.setTokenHasExpired(true)
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
     * @returns  Returns true if more items were available and false otherwise.
     */
    async getMoreLibraryItems(): Promise<boolean> {
        try {
            if (this.hasAccessTokenExpired()) {
                await this.refreshAccessToken()
            }

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
                this.setTokenHasExpired(true)
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
     * Used to get user's playlists saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content.
     * @param doRefresh             Request for the first page to get fresh resource data.
     * @returns                     Spotify user's saved playlists
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
     * Used to get user's tracks saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content
     * @param doRefresh             Request for the first page to get fresh resource data.
     * @returns                     Spotify user's liked tracks
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

    /**
     * Used to get user's albums saved in their library.
     * Used repeatedly to get more items using pagination.
     * 
     * @param accessToken           Token needed to access user content.
     * @param doRefresh             Request for the first page to get fresh resource data.
     * @returns                     Spotify user's saved albums
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
     * @param doRefresh             Request for the first page to get fresh resource data.
     * @returns                     Spotify user's saved podcast episodes
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
        this.isSignedIn =             savedUserData.isSignedIn!
        this.hasTokenExpired =        savedUserData.hasTokenExpired!
        this.currentUserMedia =       savedUserData.currentUserMedia!

        this.userPlaylists =  savedUserData.userPlaylists!

        if (savedUserData.userLikedTracks) {
            this.userLikedTracks = savedUserData.userLikedTracks
        }
        if (savedUserData.userAlbums) {
            this.userAlbums = savedUserData.userAlbums
        }
        if (savedUserData.userPodcastEps) {
            this.userPodcastEps = savedUserData.userPodcastEps
        }
        if (savedUserData.userAudioBooks) {
            this.userAudioBooks = savedUserData.userAudioBooks
        }

        this.updateState({ ...savedUserData }, false)
    }

    /**
     * Saves updated data to persist state between refreshes.
     * Only saves what it needs to.
     */
    saveState(newState: Partial<SpotifyMusicUserData>) {
        let newData = {} as Partial<SpotifyMusicUserData>

        if (newState.isSignedIn != undefined)       newData.isSignedIn = newState.isSignedIn
        if (newState.musicPlatform != undefined)    newData.musicPlatform = newState.musicPlatform
        if (newState.userDetails != undefined)      newData.userDetails = newState.userDetails
        if (newState.currentUserMedia != undefined) newData.currentUserMedia = newState.currentUserMedia
        if (newState.hasTokenExpired != undefined)  newData.hasTokenExpired = newState.hasTokenExpired

        if (newState.accessTokenCreationDate != undefined)  newData.accessTokenCreationDate = newState.accessTokenCreationDate
        if (newState.accessToken != undefined)              newData.accessToken = newState.accessToken
        if (newState.refreshToken != undefined)             newData.refreshToken = newState.refreshToken
        if (newState.authCode != undefined)                 newData.authCode = newState.authCode
        if (newState.tokenExpiration != undefined)          newData.tokenExpiration = newState.tokenExpiration

        if (newState.userPlaylists != undefined) {
            newData.userPlaylists = {
                offset:        newState.userPlaylists.offset === 0 ? 0 : Math.min(newState.userPlaylists.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         newState.userPlaylists.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll:  Math.min(newState.userPlaylists.items.length, LIBRARY_COLLECTION_LIMIT) < newState.userPlaylists.totalItems ? false : true,
                totalItems:     newState.userPlaylists.totalItems
            }
        }
        if (newState.userLikedTracks != undefined) {
            newData.userLikedTracks = {
                offset:        newState.userLikedTracks.offset === 0 ? 0 : Math.min(newState.userLikedTracks.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         newState.userLikedTracks.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll:  Math.min(newState.userLikedTracks.items.length, LIBRARY_COLLECTION_LIMIT) < newState.userLikedTracks.totalItems ? false : true,
                totalItems:     newState.userLikedTracks.totalItems
            }
        }
        if (newState.userAlbums != undefined) {
            newData.userAlbums = {
                offset:        newState.userAlbums.offset === 0 ? 0 : Math.min(newState.userAlbums.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         newState.userAlbums.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll:  Math.min(newState.userAlbums.items.length, LIBRARY_COLLECTION_LIMIT) < newState.userAlbums.totalItems ? false : true,
                totalItems:     newState.userAlbums.totalItems
            }
        }
        if (newState.userPodcastEps != undefined) {
            newData.userPodcastEps = {
                offset:        newState.userPodcastEps.offset === 0 ? 0 : Math.min(newState.userPodcastEps.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         newState.userPodcastEps.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll: Math.min(newState.userPodcastEps.items.length, LIBRARY_COLLECTION_LIMIT) < newState.userPodcastEps.totalItems ? false : true,
                totalItems:     newState.userPodcastEps.totalItems
            }
        }
        if (newState.userAudioBooks != undefined) {
            newData.userAudioBooks = {
                offset:        newState.userAudioBooks.offset === 0 ? 0 : Math.min(newState.userAudioBooks.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         newState.userAudioBooks.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll:  Math.min(newState.userAudioBooks.items.length, LIBRARY_COLLECTION_LIMIT) < newState.userAudioBooks.totalItems ? false : true,
                totalItems:     newState.userAudioBooks.totalItems
            }
        }
        
        // user token is not saved as a new one is made after refresh
        saveMusicUserData(newData)
    }

    /**
     * @param newState  New state changes to be incorporated
     * @param oldState  Current state
     * @returns         New state with the latest incorporated changes.
     */
    getNewStateObj(newState: Partial<SpotifyMusicUserData>, oldState: SpotifyMusicUserData): SpotifyMusicUserData {
        const newStateObj = oldState

        if (newState.isSignedIn != undefined)       newStateObj.isSignedIn = newState.isSignedIn
        if (newState.musicPlatform != undefined)    newStateObj.musicPlatform = newState.musicPlatform
        if (newState.userDetails != undefined)      newStateObj.userDetails = newState.userDetails
        if (newState.currentUserMedia != undefined) newStateObj.currentUserMedia = newState.currentUserMedia
        if (newState.hasTokenExpired != undefined)  newStateObj.hasTokenExpired = newState.hasTokenExpired
        
        if (newState.userPlaylists != undefined)    newStateObj.userPlaylists = newState.userPlaylists
        if (newState.userLikedTracks != undefined)  newStateObj.userLikedTracks = newState.userLikedTracks
        if (newState.userAlbums != undefined)       newStateObj.userAlbums = newState.userAlbums
        if (newState.userPodcastEps != undefined)   newStateObj.userPodcastEps = newState.userPodcastEps
        if (newState.userAudioBooks != undefined)   newStateObj.userAudioBooks = newState.userAudioBooks

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