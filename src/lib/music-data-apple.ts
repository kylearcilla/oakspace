import type { Writable } from "svelte/store"
import { curentPlaylist, currentTrack, userPlaylistsStore } from "./store"
import { getApplePlaylistDetails, getUserApplePlaylists } from "./api-apple-music"

enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }

/**
 * MusicData class represents the data related to music playback (data & stores), API tokens, and user data & functionality for configuring Music Platform API.
 * Not information related to Music Player (paused, shuffled, skip, next etc..).
 * Used to init a new Music Player instance which also contains contains a reference to it. 
 *
 * @class MusicData
 * @param {MusicPlatform} musicPlatform - The selected music platform (Apple Music, Spotify, Soundcloud, Youtube Music).
 */
export class MusicData {
    musicKit: any = null
    musicPlayerInstance: any

    currentIdx = 0

    /* Music Context */
    musicPlatform: MusicPlatform | null = null
    currentMediaItem: Track | null = null
    userPlaylists: MusicCollection[] = []
    currentPlaylist: MusicCollection | null = null

    /* Store Objects */
    userPlaylistsStore: Writable<MusicCollection[] | null>
    currentTrackState: Writable<Track | null>
    curentPlaylistState: Writable<MusicCollection | null>

    constructor(musicPlatform: MusicPlatform) { 
        this.musicPlatform = musicPlatform
        this.currentTrackState = currentTrack
        this.curentPlaylistState = curentPlaylist
        this.userPlaylistsStore = userPlaylistsStore

        localStorage.setItem("music-platform", JSON.stringify(musicPlatform))
        this.initMusicData()
    }

    /**
     * Called after making a new MusicData instance.
     * Configures new music kit instance.
     * Fetches & stores necessary tokens, user data, and current state.å
     */
    initMusicData = async (): Promise<void>  => {
        const token = await this.fetchAPIToken()
        this.updateAccessToken(token)

        const authToken = await this.initAppleMusic()
        this.updateAppleAuthToken(authToken)

        this.loadMusicData()
        this.setUserPlaylists()
    }

    /**
     * Get Apple Music User / Access Token from the back end. 
     * Will be included in the HTTP requests to Apple Music API.
     * Needed to initialize Apple Music Kit.
     * 
     * @returns Apple Music User Token (Active for 60 Days by Default)
     */
    fetchAPIToken = async (): Promise<string> => {
        const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } }

        try {
            const res = await fetch("http://localhost:3000/", options)
            if (!res.ok) {
                throw new Error(`Error fetching Apple Music Kit Dev Token: HTTP ${res.status} ${res.statusText}`)
            }

            const { token } = await res.json()
            return token
        } catch (fetchError) {
            throw fetchError
        }
    }

    /**
     * From access token, initialize & configure Music Kit and create an instance of it.
     * Invoke user authorization to access user’s Apple Music data & save auth token. 
     * 
     * 
     * @returns Returns token returned from completed authorization flow
     */
    initAppleMusic = async (): Promise<string> => {
        try {
            const accessToken = this.getAccessToken()
            if (!accessToken) {
                throw new Error ("Error initializing Apple Music: No Apple Music Token")
            }
    
            const options = { developerToken: accessToken, app: { name: 'Luciole', build: '1.1' } }
    
            // @ts-ignore
            this.musicKit = MusicKit
        
            if (!this.musicKit) {
                throw new Error ("Error initializing Apple Music: music kit is absent")
            }
            
            const isntance = await this.musicKit.configure(options)
            this.musicPlayerInstance = this.musicKit.getInstance() 

            return await this.musicPlayerInstance.authorize()  // initialize authorize flow
        } 
        catch (appleMusicError) {
            throw appleMusicError
        }
    }

    /**
     * Update current track state & save in local storage.
     * @param mediaItem  Current track playing from collection.
     */
    updateCurrentTrack(mediaItem: Track): void {
        this.currentMediaItem = mediaItem
        this.currentTrackState.update(() => mediaItem)

        localStorage.setItem("music-current-track", JSON.stringify(mediaItem))
    }

    /**
     * Remove current track from store / local storage.
     */
    removeCurrentTrack(): void {
        this.currentMediaItem = null
        this.currentTrackState.set(null)

        localStorage.removeItem("music-current-track")
    }

    /**
     * Get the next index to be played. If @ end, go to the first.
     * 
     * @param isRepeating   If looped is on.
     * @returns             The next index. -1 If end has been reached
     */
    getNextPlaylistIndex(isRepeating: boolean): number {
        if (!this.currentPlaylist) return -1

        const isAtEnd = this.currentIdx === this.currentPlaylist.songCount - 1

        if (isAtEnd && isRepeating) return 0
        if (isAtEnd && !isRepeating) return -1
        return  this.currentIdx + 1
    }

    /**
     * Get the next index to be played. If @ start, go to the last.
     * 
     * @param isRepeating  If looped is on.
     * @returns            The prev index. -1 If at the start. 
     */
    getPrevPlaylistIndex(isRepeating: boolean): number {
        if (!this.currentPlaylist) return -1

        const isAtStart = this.currentIdx === 0

        if (isAtStart && isRepeating) return this.currentPlaylist.songCount - 1 
        if (isAtStart && !isRepeating) return -1

        return this.currentIdx - 1
    }

    /**
     * Updates the current index.
     * 
     * @param newIndex 
     */
    updateCurrentCollectionIdx(newIndex: number): void {
        if (!this.currentPlaylist) return
        this.currentIdx = newIndex
    }

    /**
     * Updates the current playlist. Updates the playlist store.
     * 
     * @param newCurrentPlaylist 
     */
    updateCurrentCollection(newCurrentPlaylist: MusicCollection): void {
        this.currentPlaylist = newCurrentPlaylist

        this.curentPlaylistState.update((data: any) => {
            const newData = { ...data, ...newCurrentPlaylist }
            localStorage.setItem("music-current-collection", JSON.stringify(newData))

            return newData
        })
    }

    /**
     * Remove current collection. Will hide music player.
     */
    removeCurrentMusicCollection(): void {
        this.currentPlaylist = null
        this.curentPlaylistState.set(null)

        localStorage.removeItem("music-current-collection")
        this.removeCurrentTrack()
    }

    /**
     * Get playlist details using Apple Music API.
     * 
     * @param playlistId 
     * @returns           Collection object (playlist or album) details.
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
        catch {
            this.updateUserPlaylists([])
        }
    }
    
    /**
     * Update user playlists state from fetched user library playlists.
     * 
     * @param userPlaylists 
    */
   private updateUserPlaylists(userPlaylists: MusicCollection[]): void {
        this.userPlaylists = userPlaylists
        this.userPlaylistsStore.update((data) => {
            localStorage.setItem("music-user-playlists", JSON.stringify(userPlaylists))
            return userPlaylists
        })
    }

    /* Setting and Loading API Tokens */
    getAccessToken = (): string => {
        return localStorage.getItem("music-access-token") ?? "";
    }
    updateAccessToken = (token: string) => {
        localStorage.setItem("music-access-token", token)
    }
    getAppleAuthToken = (): string => {
        return localStorage.getItem("apple-music-auth-token") ?? "";
    }
    updateAppleAuthToken = (authToken: string): void => {
        localStorage.setItem("apple-music-auth-token", authToken)
    }
    
    /**
     * Initializes music data from local storage.
     */
    loadMusicData = (): void => {
        const currentPlaylist = this.loadCurrentPlaylist()
        if (currentPlaylist) this.updateCurrentCollection(currentPlaylist)
        
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