import { musicDataStore } from "./store"
import { APIErrorCode, MusicPlatform, UserLibraryMedia } from "./enums"
import { MusicUserData, type MusicUserDataStore } from "./music-user-data"
import { 
         saveMusicUserData, 
         loadMusicUserData, deleteMusicUserData, musicAPIErrorHandler, LIBRARY_COLLECTION_LIMIT
} from "./utils-music"
import { 
    getSpotfifyUserLikedTracks, getSpotfifyUserPlaylists, getSpotifyUserAlbums, getSpotifyUserAudioBooks, 
    getSpotifyUserData, getUserPodcastsEps, refreshAccessToken
} from "./api-spotify"
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
    tokenExpiresInMs = 0
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

    // user library podcast episodes
    userPodcastEps: UserLibraryCollection = {
        items: [],
        hasFetchedAll: false,
        offset: -1,
        totalItems: 0
    }

    // user library audiobook chapters
    userAudioBooks: UserLibraryCollection = {
        items: [],
        hasFetchedAll: false,
        offset: -1,
        totalItems: 0
    }

    musicPlatform = MusicPlatform.Spotify
    ACTIVE_TOKEN_THRESHOLD_SECS = 60
    
    constructor() { 
        super()
        musicDataStore.set(this)
        this.loadAndSetUserData()
    }

    /**
     * The requesting of credential data is handled outside the class after a redirect following a successful auth.
     * @param initData    Important creds data.
     */
    async init(initData: SpotifyInitData) {
        try {
            this.accessToken = initData.accessToken
            this.refreshToken = initData.refreshToken
            this.tokenExpiresInMs = initData.expiresIn
            this.authCode = initData.authCode
            this.accessTokenCreationDate = new Date()
        
            this.updateState({ 
                ...initData, tokenExpiresInMs: this.tokenExpiresInMs,
                accessTokenCreationDate: new Date(), 
                musicPlatform: this.musicPlatform,
                currentUserMedia: this.currentUserMedia
            })
    
            await this.initUserData()
        }
        catch(error) {
            if (!this.isSignedIn) this.quit()
            throw error
        }
    }

    /**
     * Initialize user data (profile details & playlists) after user logs in.
     */
    async initUserData() {
        await this.getUserProfileData()
        await this.getUserPlaylists()

        this.setUserSignedIn()
    }

    setUserSignedIn() {
        this.isSignedIn = true
        this.updateState({ isSignedIn: true })
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
     * @returns    Will token expire
     */
    hasAccessTokenExpired() {
        const timeFromCreation = getDifferenceInSecs(new Date(this.accessTokenCreationDate!), new Date())
        const timeLeft = this.tokenExpiresInMs - timeFromCreation
        return timeLeft < this.ACTIVE_TOKEN_THRESHOLD_SECS
    }

    /**
     * Check if token is still valid. If not, get a new one.
     * Called everytime a request to the API is made.
     * @returns     Fresh access token.
     */
    async verifyAccessToken() {
        if (this.hasAccessTokenExpired()) {
            await this.refreshAccessToken()
        }
        return this.accessToken
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
            this.tokenExpiresInMs = data.expires_in * 1000
            this.accessTokenCreationDate = new Date()
    
            this.updateState({ 
                accessToken: this.accessToken, refreshToken: this.refreshToken,
                tokenExpiresInMs: this.tokenExpiresInMs, accessTokenCreationDate: new Date()
            })

            if (this.hasTokenExpired) {
                this.setTokenHasExpired(false)
            }
        }
        catch(error: any) {
            this.onError(new APIError(APIErrorCode.FAILED_TOKEN_REFRESH))
            throw error
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

        if (doSave) this.saveState()
    }

    /**
     * Update the current library media
     * @param media                    Media user has chosen.                     
     * @param isSwitchingTheFirstTime   Is chosen for the first time for the session.
     */
    async updateLibraryMedia(media: UserLibraryMedia, isSwitchingTheFirstTime: boolean) {
        try {
            await this.verifyAccessToken()

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
            else if (this.currentUserMedia === UserLibraryMedia.PodcastEps && !this.userPodcastEps.hasFetchedAll) {

                await this.getUserPodcastsEps()
            }
            else if (this.currentUserMedia === UserLibraryMedia.Audiobooks && !this.userAudioBooks.hasFetchedAll) {

                await this.getUserAudiobooks()
            }
            else if (this.currentUserMedia === UserLibraryMedia.LikedTracks && !this.userLikedTracks.hasFetchedAll) {

                await this.getUserLikedTracks()
            }
        }
        catch (error: any) {
            if (error instanceof APIError && error.code === APIErrorCode.EXPIRED_TOKEN) {
                this.setTokenHasExpired(true)
                musicAPIErrorHandler(error)
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
        let offset = Math.max(0, userPlaylists.offset)
        let res = await getSpotfifyUserPlaylists(this.accessToken, offset)

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
        let offset = Math.max(0, userLikedTracks.offset)
        let res = await getSpotfifyUserLikedTracks(this.accessToken, offset)

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
        let offset = Math.max(0, userAlbums.offset)
        let res = await getSpotifyUserAlbums(this.accessToken, offset)

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
        let offset = Math.max(0, userPodcastEps.offset)
        let res = await getUserPodcastsEps(this.accessToken, offset)

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
        let offset = Math.max(0, userAudioBooks.offset)
        let res = await getSpotifyUserAudioBooks(this.accessToken, offset)

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
        const savedUserData = loadMusicUserData() as Partial<SpotifyMusicUserData>
        if (!savedUserData) return

        this.accessTokenCreationDate =  savedUserData.accessTokenCreationDate!,
        this.accessToken =      savedUserData.accessToken!,
        this.refreshToken =     savedUserData.refreshToken!,
        this.authCode =         savedUserData.authCode!,
        this.musicPlatform =    savedUserData.musicPlatform!,
        this.tokenExpiresInMs =    savedUserData.tokenExpiresInMs!
        this.userDetails =         savedUserData.userDetails!
        this.hasTokenExpired =     savedUserData.hasTokenExpired!
        this.isSignedIn =          savedUserData.isSignedIn!
        this.currentUserMedia =    savedUserData.currentUserMedia!

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
     * General error handler. Called by other members.
     * @param error  Error 
     */
    onError(error: any) {
        super.onError(error, MusicPlatform.Spotify)
    }

    /**
     * Saves updated data to persist state between refreshes.
     * Only saves what it needs to.
     */
    saveState() {
        let newData = {} as SpotifyMusicUserData

        newData.isSignedIn    = this.isSignedIn
        newData.musicPlatform = this.musicPlatform
        newData.userDetails   = this.userDetails
        newData.currentUserMedia = this.currentUserMedia
        newData.hasTokenExpired  = this.hasTokenExpired

        newData.authCode      = this.authCode
        newData.accessToken   = this.accessToken
        newData.refreshToken  = this.refreshToken
        newData.tokenExpiresInMs        = this.tokenExpiresInMs
        newData.accessTokenCreationDate = this.accessTokenCreationDate

        newData.userPlaylists = {
            offset:        this.userPlaylists.offset === 0 ? 0 : Math.min(this.userPlaylists.offset, LIBRARY_COLLECTION_LIMIT), 
            items:         this.userPlaylists.items.slice(0, LIBRARY_COLLECTION_LIMIT),
            hasFetchedAll: Math.min(this.userPlaylists.items.length, LIBRARY_COLLECTION_LIMIT) < this.userPlaylists.totalItems ? false : true,
            totalItems:    this.userPlaylists.totalItems
        }

        if (this.userLikedTracks) {
            newData.userLikedTracks = {
                offset:        this.userLikedTracks.offset === 0 ? 0 : Math.min(this.userLikedTracks.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         this.userLikedTracks.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll: Math.min(this.userLikedTracks.items.length, LIBRARY_COLLECTION_LIMIT) < this.userLikedTracks.totalItems ? false : true,
                totalItems:    this.userLikedTracks.totalItems
            }
        }
        if (this.userAlbums) {
            newData.userAlbums = {
                offset:        this.userAlbums.offset === 0 ? 0 : Math.min(this.userAlbums.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         this.userAlbums.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll: Math.min(this.userAlbums.items.length, LIBRARY_COLLECTION_LIMIT) < this.userAlbums.totalItems ? false : true,
                totalItems:    this.userAlbums.totalItems
            }
        }
        if (this.userPodcastEps) {
            newData.userPodcastEps = {
                offset:        this.userPodcastEps.offset === 0 ? 0 : Math.min(this.userPodcastEps.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         this.userPodcastEps.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll: Math.min(this.userPodcastEps.items.length, LIBRARY_COLLECTION_LIMIT) < this.userPodcastEps.totalItems ? false : true,
                totalItems:    this.userPodcastEps.totalItems
            }
        }
        if (this.userAudioBooks) {
            newData.userAudioBooks = {
                offset:        this.userAudioBooks.offset === 0 ? 0 : Math.min(this.userAudioBooks.offset, LIBRARY_COLLECTION_LIMIT), 
                items:         this.userAudioBooks.items.slice(0, LIBRARY_COLLECTION_LIMIT),
                hasFetchedAll: Math.min(this.userAudioBooks.items.length, LIBRARY_COLLECTION_LIMIT) < this.userAudioBooks.totalItems ? false : true,
                totalItems:    this.userAudioBooks.totalItems
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

        deleteMusicUserData()
    }
}