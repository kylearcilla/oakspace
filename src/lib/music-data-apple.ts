import { musicDataStore } from "./store"
import { getApplePlaylistDetails, getUserPlaylists } from "./api-apple-music"
import { getAccessToken, removeAppleAccessToken, removeAppleAuthToken, removeAppleMusicTokens, removeMusicPlayerState, 
         removeMusicShuffleData, updateAccessToken, updateAppleAuthToken, saveMusicPlatform, getPlatformCode  }  from "./utils-music"
import { MusicPlatform } from "./enums"

/**
 * MusicData class represents the data related to music playback (data & stores), API tokens, and user data & functionality for configuring Music Platform API.
 * Referenced in Music Player Class.
 * 
 * The player itself is a svelte store object / reactive class, initialized during instantiation.
 *
 * @class MusicData
 * @param {MusicPlatform} musicPlatform   The selected music platform (Apple Music, Spotify, Soundcloud, Youtube Music).
 */
export class MusicData {
    musicKit: any = null
    musicPlayerInstance: any
    
    // assume true for now, issue with API where non-sub log in will lead to auth error, so cannot distinguish between failed client permission and non-sub log in
    isUserASubscriber = true 
    isSignedIn = false
    hasTokenExpired = false

    currentIdx = 0
    userPlaylistsOffset = 0
    hasUserPlaylistsLoaded = false
    hasFetchedAllUserPls = false

    musicPlatform: MusicPlatform | null = null
    userPlaylists: MusicCollection[] = []
    track: Track | null = null
    collection: MusicCollection | null = null

    USER_PLAYLISTS_REQUEST_LIMIT = 15
 
    constructor() { 
        musicDataStore.set(this)
    }

    /**
     * Configures new music kit instance.
     * Fetches & stores necessary tokens, user data, and state.
     * Called when user logs in the first time or after a refresh.
     * 
     * @param musicPlatform      Music streaming platfrom user wants to use
     * @param hasUserSignedIn    If user has previously logged in already. Used to decide to fetch saved token or get a new one.
     * 
     * @throws                   Error status from Music Kit Configuration, User Auth, Fetching Access Token from Server 
     */
    initMusicData = async (musicPlatform: MusicPlatform, hasUserSignedIn: boolean): Promise<void> => {
        let token = ""

        this.updateMusicPlatform(musicPlatform)

        if (hasUserSignedIn) {
            token = getAccessToken()
        }
        else {
            token = await this.fetchAPIToken()
        }
        
        const authToken = await this.initAppleMusic(token, hasUserSignedIn)
        updateAppleAuthToken(authToken)
        updateAccessToken(token)
        
        this.isSignedIn = true
        this.getUserApplePlaylists()

        if (hasUserSignedIn) {
            this.loadMusicData()
        }
    }

    /**
     * Get Apple Music User / Access Token from the back end. 
     * Will be included in the requests to Apple Music API.
     * Needed to initialize Apple Music Kit.
     * 
     * @returns         Apple Music User Token (Active for 60 Days by Default)
     * @throws          Error status.
     */
    fetchAPIToken = async (): Promise<string> => {
        const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        const res = await fetch("http://localhost:3000/", options)
        if (!res.ok) {
            console.error(`Error fetching Apple Music Kit Dev Token from Website Server. Status: ${res.status}`)
            throw (res.status)
        }

        const { token } = await res.json()
        return token
    }

    /**
     * From access token, initialize & configure Music Kit and create an instance of it.
     * Invoke user authorization to access user’s Apple Music data & save auth token. 
     * 
     * @param accessToken       Access / Dev token returned from server
     * @param hasUserSignedIn   Used to check if user has already signed in.
     * @returns                 Returns token returned from completed authorization flow. Returns null if user is not a subscriber.
     * @throws                  Error status configuring new Music Kit instance.
     */
    initAppleMusic = async (accessToken: string, hasUserSignedIn: boolean): Promise<string> => {
        try {
            const options = { developerToken: accessToken, app: { name: 'Luciole', build: '1.1' } }
            // @ts-ignore
            this.musicKit = MusicKit
        
            if (!this.musicKit) {
                throw("400")
            }
            this.musicPlayerInstance = await this.musicKit.configure(options)
            return await this.musicPlayerInstance.authorize()
        }
        catch(e: any) { 
            console.error(`Error initializing Music Kit ${e}`)
            const errorStr = e.toString()

            if (hasUserSignedIn) {
                this.hasTokenExpired = true
                throw("401")
            }
            else if (errorStr.includes("AUTHORIZATION_ERROR")) {
                throw("403")
            }
            else {
                throw("400")
            }
        }
    }

    /**
     * Request new user token after a current token has expired.
     * Separate from initMusicData as other platfroms might do fresh token / relogging in requests differently.
     * 
     * @throws   Error status in re-loggin in user.
     */
    reLogInUser = async () => {
        try {
            let token = ""
            token = await this.fetchAPIToken()
    
            const authToken = await this.initAppleMusic(token, true)
            this.hasTokenExpired = false
            updateAppleAuthToken(authToken)
            updateAccessToken(token)
        
            this.updateMusicPlatform(getPlatformCode()!)
            this.getUserApplePlaylists()
        }
        catch {
            console.error("Error re-logging in user")
            throw new Error("Error re-loggin in user")
        }
    }

    /**
     * Called when user wants to lout out of music account.
     */
    quit = async () => {
        this.isSignedIn = false
        this.removeCurrentMusicCollection()
        this.removeUserPlaylists()
        removeAppleAccessToken()
        removeAppleAuthToken()
        removeAppleMusicTokens()

        musicDataStore.set(null)

        // This will cause a 403 on fetching user playlists after a prev log out
        // if (this.isUserASubscriber) {
        //     await this.musicPlayerInstance.unauthorize()  
        // }
    }

    /**
     * Removes data saved by music player.
     * Handled here since player store obj won't be instantiated due to a failure in auth (expired token).
     */
    clearPlayerDataAfterLogIn = () => {
        removeMusicPlayerState()
        removeMusicShuffleData()
    }

    /**
     * Update current track state & save in local storage.
     * @param mediaItem  Current track playing from collection.
     */
    updateCurrentTrack(mediaItem: Track): void {
        musicDataStore.update((data: MusicData | null) => { 
            data!.track = mediaItem
            return data
        })

        localStorage.setItem("music-current-track", JSON.stringify(mediaItem))
    }

    /**
     * Remove current track from store / local storage.
     */
    removeCurrentTrack(): void {
        musicDataStore.update((data: MusicData | null) => { 
            data!.track = null
            return data
        })

        localStorage.removeItem("music-current-track")
    }

    /**
     * Get the next index to be played. If @ end, go to the first.
     * @param isRepeating    If looped is on.
     * @param hasJustEnded   If collection has just ended and next is pressed, make sure the first item is played.
     * @returns              The next index. -1 If end has been reached and not looped.
     */
    getNextPlaylistIndex(isRepeating: boolean, hasJustEnded: boolean): number {
        if (!this.collection) return -1

        const isAtEnd = this.currentIdx === this.collection.songCount - 1

        if (isAtEnd && isRepeating) return 0
        if (isAtEnd && !isRepeating) return -1

        if (hasJustEnded) {
            this.updateCurrentCollectionIdx(-1)
        }

        return this.currentIdx + 1
    }

    /**
     * Get the next index to be played. If @ start, go to the last.
     * @param isRepeating  If looped is on.
     * @returns            The prev index. -1 If at the start. 
     */
    getPrevPlaylistIndex(isRepeating: boolean): number {
        if (!this.collection) return -1

        const isAtStart = this.currentIdx === 0

        if (isAtStart && isRepeating) return this.collection.songCount - 1 
        if (isAtStart && !isRepeating) return -1

        return this.currentIdx - 1
    }

    /**
     * Updates the current index.
     * @param newIndex 
     */
    updateCurrentCollectionIdx(newIndex: number): void {
        if (!this.collection) return

        this.currentIdx = newIndex
        localStorage.setItem("music-idx", newIndex + "")
    }

    /**
     * Updates the current playlist. Updates the playlist store.
     * @param newCurrentPlaylist 
     */
    updateCurrentCollection(newCurrentPlaylist: MusicCollection): void {
        musicDataStore.update((data: MusicData | null) => { 
            data!.collection = newCurrentPlaylist
            return data
        })

        localStorage.setItem("music-current-collection", JSON.stringify(newCurrentPlaylist))
    }

    /**
     * Remove current collection, also remove current track as a result.
     */
    removeCurrentMusicCollection(): void {
        musicDataStore.update((data: MusicData | null) => { 
            data!.collection = null
            return data
        })

        localStorage.removeItem("music-current-collection")
        this.removeCurrentTrack()
    }

    /**
     * Get playlist details using Apple Music API.
     * 
     * @param   playlistId 
     * @returns            Collection object (playlist or album) details.
     * @throws             Error status from fetching user playlist details. 
     */
    async getPlaylistDetails(playlistId: string): Promise<MusicCollection>  {
        return await getApplePlaylistDetails(playlistId, getAccessToken())
    }

    /**
     * Fetches user library playlists using Apple Music API and updates state.
     * Empty if there is an error. 
     * After each call, the API will return the next USER_PLAYLISTS_REQUEST_LIMIT items
     * @throws             Error status from fetching user playlist details. 
     */
    async getUserApplePlaylists(): Promise<void> {
        musicDataStore.update((data: MusicData | null) => { 
            data!.hasUserPlaylistsLoaded = false
            return data
        })

        let playlists: MusicCollection[] = []
        
        try {
            if (this.isUserASubscriber && this.musicPlatform === MusicPlatform.AppleMusic) {
                playlists = await getUserPlaylists(this.USER_PLAYLISTS_REQUEST_LIMIT, this.userPlaylistsOffset)
            }

            this.updateUserPlaylists([...this.userPlaylists, ...playlists], playlists.length < this.USER_PLAYLISTS_REQUEST_LIMIT)
        }
        catch(code) { 
            musicDataStore.update((data: MusicData | null) => { 
                data!.hasUserPlaylistsLoaded = true
                return data
            })
            throw (code)
        }
    }
    
    /**
     * Update user playlists state from fetched user library playlists.
     * @param userPlaylists 
    */
   private updateUserPlaylists(userPlaylists: MusicCollection[], hasFetchedAllUserPls: boolean): void {
        musicDataStore.update((data: MusicData | null) => { 
            data!.userPlaylists = userPlaylists
            data!.hasUserPlaylistsLoaded = true
            data!.userPlaylistsOffset += this.USER_PLAYLISTS_REQUEST_LIMIT
            data!.hasFetchedAllUserPls = hasFetchedAllUserPls

            return data
        })
    }

    /**
     * Empty user playlists.
     */
    private removeUserPlaylists(): void {
        musicDataStore.update((data: MusicData | null) => { 
            data!.userPlaylists = []
            return data
        })
    }

    /**
     * Save what platform user logged in with.
     * @param musicPlatform   Current music platform.
     */
    updateMusicPlatform = (musicPlatform: MusicPlatform):void => {
        this.musicPlatform = musicPlatform
        saveMusicPlatform(musicPlatform)
    }
    
    /**
     * Initializes music data from local storage.
     */
    loadMusicData = (): void => {
        const collection = this.loadCurrentPlaylist()
        if (collection) this.updateCurrentCollection(collection)
        
        const currTrack = this.loadCurrentTrack()
        if (currTrack)  this.updateCurrentTrack(currTrack)

        
        const idx = this.loadCurrentCollectionIdx()
        if (idx)  this.updateCurrentCollectionIdx(idx)
    }

    private loadCurrentPlaylist = (): MusicCollection | null => {
        if (!localStorage.getItem("music-current-collection")) return null
        return JSON.parse(localStorage.getItem("music-current-collection")!)
    }
    private loadCurrentTrack = (): Track | null => {
        if (!localStorage.getItem("music-current-track")) return null
        return JSON.parse(localStorage.getItem("music-current-track")!)
    }
    private loadCurrentCollectionIdx = (): number | null => {
        if (!localStorage.getItem("music-idx")) return null
        return JSON.parse(localStorage.getItem("music-idx")!)
    }
}