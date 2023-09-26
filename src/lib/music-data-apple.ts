import { musicDataStore } from "./store"
import { getApplePlaylistDetails, getUserApplePlaylists } from "./api-apple-music"

enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }

/**
 * MusicData class represents the data related to music playback (data & stores), API tokens, and user data & functionality for configuring Music Platform API.
 * Referenced in Music Player Class.
 * 
 * The player itself is a svelte store object / reactive class.
 *
 * @class MusicData
 * @param {MusicPlatform} musicPlatform - The selected music platform (Apple Music, Spotify, Soundcloud, Youtube Music).
 */
export class MusicData {
    musicKit: any = null
    musicPlayerInstance: any

    isSignedIn = false

    currentIdx = 0

    /* Music Context */
    musicPlatform: MusicPlatform | null = null

    /* Store Objects */
    userPlaylists: MusicCollection[] | null = null
    track: Track | null = null
    collection: MusicCollection | null = null
 
    /**
     * Set music data store since it's needed when attempting to initialize music data.
     */
    constructor() { 
        musicDataStore.set(this)
    }

    /**
     * Called after making a new MusicData instance.
     * Configures new music kit instance.
     * Fetches & stores necessary tokens, user data, and current state.
     * 
     * @param musicPlatform      Do not request already loaded data from Apple Music API
     * @param hasUserSignedIn    Has User already signed in? 
     * 
     * @throws {Error}           Error in Music Kit Configuration, User Auth, Fetching Access Token from Server 
     */
    initMusicData = async (musicPlatform: MusicPlatform, hasUserSignedIn: boolean): Promise<void>  => {
        const token = await this.fetchAPIToken()
        const authToken = await this.initAppleMusic(token)

        this.updateAccessToken(token)
        this.updateAppleAuthToken(authToken)
        this.updateMusicPlatform(musicPlatform)

        this.isSignedIn = true
    
        if (hasUserSignedIn) {
            this.loadMusicData()
        } 
        else {
            this.setUserPlaylists()
        }
    }

    /**
     * Get Apple Music User / Access Token from the back end. 
     * Will be included in the HTTP requests to Apple Music API.
     * Needed to initialize Apple Music Kit.
     * 
     * @returns         Apple Music User Token (Active for 60 Days by Default)
     * @throws {Error}  Error in fetching Apple Music Kit Dev Token
     */
    fetchAPIToken = async (): Promise<string> => {
        const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        const res = await fetch("http://localhost:3000/", options)
        if (!res.ok) {
            throw new Error(`Error fetching Apple Music Kit Dev Token: HTTP ${res.status} ${res.statusText}`)
        }

        const { token } = await res.json()
        return token
    }

    /**
     * From access token, initialize & configure Music Kit and create an instance of it.
     * Invoke user authorization to access user’s Apple Music data & save auth token. 
     * 
     * @param accessToken   Access / Dev token returned from server
     * @returns             Returns token returned from completed authorization flow
     * @throws {Error}      Error in configuring new Music Kit instance. User rejects auth request.
     */
    initAppleMusic = async (accessToken: string): Promise<string> => {
        if (!accessToken) {
            throw new Error ("Error initializing Apple Music: No Apple Music Token")
        }

        const options = { developerToken: accessToken, app: { name: 'Luciole', build: '1.1' } }

        // @ts-ignore
        this.musicKit = MusicKit
    
        if (!this.musicKit) {
            throw new Error ("Error initializing Apple Music: music kit is absent")
        }
        
        this.musicPlayerInstance = await this.musicKit.configure(options)
        return await this.musicPlayerInstance.authorize()  // initialize authorize flow
    }

    /**
     * Called when user no longer wants to use music.
     */
    quit = () => {
        this.removeCurrentMusicCollection()
        this.removeUserPlaylists()
        this.removeAppleAccessToken()
        this.removeAppleAuthToken()
        this.removeAppleMusicTokens()

        musicDataStore.set(null)
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
     * 
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
     * 
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
     * 
     * @param newIndex 
     */
    updateCurrentCollectionIdx(newIndex: number): void {
        if (!this.collection) return
        this.currentIdx = newIndex
    }

    /**
     * Updates the current playlist. Updates the playlist store.
     * 
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
     * @throws  {Error}    Error in fetching user playlist details. 
     */
    async getPlaylistDetails(playlistId: string): Promise<MusicCollection>  {
        return await getApplePlaylistDetails(playlistId, this.getAccessToken())
    }

    /**
     * Fetches user library playlists using Apple Music API and updates state.
     * Empty if there is an error.
     */
    async setUserPlaylists(): Promise<void> {
        try {
            let userPlaylistsResults: MusicCollection[] = []
            
            if (this.musicPlatform === MusicPlatform.AppleMusic) {
                userPlaylistsResults = await getUserApplePlaylists()
            }
            this.updateUserPlaylists(userPlaylistsResults)
        }
        catch(error) {
            console.error(error)
            this.updateUserPlaylists([])
        }
    }
    
    /**
     * Update user playlists state from fetched user library playlists.
     * 
     * @param userPlaylists 
    */
   private updateUserPlaylists(userPlaylists: MusicCollection[]): void {
        musicDataStore.update((data: MusicData | null) => { 
            data!.userPlaylists = userPlaylists
            return data
        })

        localStorage.setItem("music-user-playlists", JSON.stringify(userPlaylists))
    }
    private removeUserPlaylists(): void {
        musicDataStore.update((data: MusicData | null) => { 
            data!.userPlaylists = null
            return data
        })

        localStorage.removeItem("music-user-playlists")
    }

    /* Setting and Loading API Tokens */
    getAccessToken = (): string => {
        return localStorage.getItem("music-access-token") ?? ""
    }
    getAppleAuthToken = (): string => {
        return localStorage.getItem("apple-music-auth-token") ?? ""
    }
    updateMusicPlatform = (musicPlatform: MusicPlatform) => {
        this.musicPlatform = musicPlatform
        localStorage.setItem("music-platform", JSON.stringify(musicPlatform))
    }
    updateAccessToken = (token: string) => {
        localStorage.setItem("music-access-token", token)
    }
    updateAppleAuthToken = (authToken: string): void => {

        localStorage.setItem("apple-music-auth-token", authToken)
    }
    removeAppleAuthToken = () => {
        localStorage.removeItem("apple-music-auth-token")
        localStorage.removeItem("music.y5xn9fm7bj.media-user-token")
    }
    removeAppleAccessToken = () => {
        localStorage.removeItem("music-access-token")
    }
    removeAppleMusicTokens = () => {
        localStorage.removeItem("music.y5xn9fm7bj.itua")
        localStorage.removeItem("music-platform")
        localStorage.removeItem("music.y5xn9fm7bj.itre")
        localStorage.removeItem("mk-player-tsid")
    }
    
    /**
     * Initializes music data from local storage.
     */
    loadMusicData = (): void => {
        const collection = this.loadCurrentPlaylist()
        if (collection) this.updateCurrentCollection(collection)
        
        const currentUserPlaylists = this.loadUserPlaylists()
        if (currentUserPlaylists) this.updateUserPlaylists(currentUserPlaylists)
        
        const currTrack = this.loadCurrentTrack()
        if (currTrack)  this.updateCurrentTrack(currTrack)
    }

    private loadCurrentPlaylist = (): MusicCollection | null => {
        if (!localStorage.getItem("music-current-collection")) return null
        return JSON.parse(localStorage.getItem("music-current-collection")!)
    }
    private loadCurrentTrack = (): Track | null => {
        if (!localStorage.getItem("music-current-track")) return null
        return JSON.parse(localStorage.getItem("music-current-track")!)
    }
    private loadUserPlaylists = (): MusicCollection[] => {
        if (!localStorage.getItem("music-user-playlists")) return []
    
        return JSON.parse(localStorage.getItem("music-user-playlists")!)
    }
}