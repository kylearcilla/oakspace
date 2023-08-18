import type { Writable } from "svelte/store"
import { curentPlaylist, currentTrack, userMusicPlaylists } from "./store"
import { getPlaylistDetails, getUserApplePlaylists } from "./apple-music-api"

enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }

export class MusicData {
    musicKit: any = null
    musicPlayerInstance: any;

    musicPlatform: MusicPlatform | null = null
    currentMediaItem: Track | null = null
    userPlaylists: MusicCollection[] = []
    currentPlaylist: MusicCollection | null = null

    userPlaylistsState: Writable<MusicCollection[] | null>
    currentTrackState: Writable<Track | null>
    curentPlaylistState: Writable<MusicCollection | null>

    constructor(musicPlatform: MusicPlatform) { 
        this.musicPlatform = musicPlatform
        this.currentTrackState = currentTrack
        this.curentPlaylistState = curentPlaylist
        this.userPlaylistsState = userMusicPlaylists

        localStorage.setItem("music-platform", JSON.stringify(musicPlatform));
    }

    authUser = async () => await this.initUser()

    /* Authentication */
    initUser = async () => {
        const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } }

        try {
            const response = await fetch("http://localhost:3000/", options);
            const data = await response.json();
            let isSuccessful = false;
            
            this.updateAccessToken(data.token);
            
            try {
                isSuccessful = await this.initAppleMusic();
            } catch (appleMusicError) {
                console.error("Error in initAppleMusic:", appleMusicError);
                return appleMusicError
            }
    
            return { ...data, isSuccessful };
        } catch (fetchError) {
            console.error("Fetch error:", fetchError);
            return fetchError;
        }
    }

    initAppleMusic = async () => {
        const devToken = this.getAccessToken();
        if (devToken === "") return false;

        const options = { developerToken: devToken, app: { name: 'Luciole', build: '1.1' } }

        // @ts-ignore
        this.musicKit = MusicKit
    
        if (this.musicKit) {
            await this.musicKit.configure(options);
            this.musicPlayerInstance = this.musicKit.getInstance()
            const authToken = await this.musicPlayerInstance.authorize()
            this.updateAppleAuthToken(authToken)
            return true
        }
        
        return false;
    }

    /* Tracks */
    updateCurrentTrack(mediaItem: Track) {
        this.currentMediaItem = mediaItem
        this.currentTrackState.update(() => mediaItem)

        localStorage.setItem("music-current-track", JSON.stringify(mediaItem))
    }
    removeCurrentTrack() {
        this.currentMediaItem = null
        this.currentTrackState.set(null)

        localStorage.removeItem("music-current-track")
    }

    getNextPlaylistIndex(isRepeating: boolean): number {
        if (!this.currentPlaylist) return -1

        const isAtEnd = this.currentPlaylist.currentIndex === this.currentPlaylist.songCount - 1

        if (isAtEnd && isRepeating) return 0
        if (isAtEnd && !isRepeating) return -1
        return  this.currentPlaylist.currentIndex + 1
    }

    getPrevPlaylistIndex(isRepeating: boolean): number {
        if (!this.currentPlaylist) return -1

        const isAtStart = this.currentPlaylist.currentIndex === 0

        if (isAtStart && isRepeating) return this.currentPlaylist.songCount - 1 
        if (isAtStart && !isRepeating) return -1

        return  this.currentPlaylist.currentIndex - 1
    }

    getNextRandomIndex(): number {
        return Math.floor(Math.random() * this.currentPlaylist!.songCount)
    }

    updateCurrentPlaylistIdx(newIndex: number) {
        if (!this.currentPlaylist) return

        this.updateCurrentPlaylist({ ...this.currentPlaylist, currentIndex: newIndex })
    }

    /* Current Playlist */
    async setNewPlaylist(playlistId: string) {
        const newPlaylist = await this.getPlaylistDetails(playlistId)
        if (!newPlaylist) return

        this.updateCurrentPlaylist(newPlaylist)
    }

    updateCurrentPlaylist(newCurrentPlaylist: MusicCollection) {
        this.currentPlaylist = newCurrentPlaylist

        this.curentPlaylistState.update((data: any) => {
            const newData = { ...data, ...newCurrentPlaylist }
            localStorage.setItem("music-current-collection", JSON.stringify(newData))

            return newData
        })
    }

    removeCurrentMusicCollection() {
        this.currentPlaylist = null
        this.curentPlaylistState.set(null)

        localStorage.removeItem("music-current-collection")
        this.removeCurrentTrack()
    }

    private async getPlaylistDetails(playlistId: string): Promise<MusicCollection | null>  {
        if (this.musicPlatform === MusicPlatform.AppleMusic) {
            return await getPlaylistDetails(playlistId, this.getAccessToken())
        }
        
        return null
    }

    /* Current Album */
    async setNewAlbum(album: MusicCollection) {
        this.updateCurrentPlaylist(album)
	}

    /* User Library Playlists */
    async setUserPlaylists() {
        const userPlaylistsResults = await this.getUserPlaylists()
        if (!userPlaylistsResults) return

        this.updateUserPlaylists(userPlaylistsResults, false)
    }

    private async getUserPlaylists(): Promise<MusicCollection[] | null>  {
        if (this.musicPlatform === MusicPlatform.AppleMusic) {
            return await getUserApplePlaylists()
        }

        return null
    }

    private updateUserPlaylists(userPlaylists: MusicCollection[], isLoading: boolean) {
        this.userPlaylists = userPlaylists
        this.userPlaylistsState.update((data) => {
            localStorage.setItem("music-user-playlists", JSON.stringify(userPlaylists))
            return userPlaylists
        })
    }

    /* Tokens */
    getAccessToken = (): string => {
        return localStorage.getItem("music-access-token") ?? "";
    }
    updateAccessToken = (token: string) => {
        localStorage.setItem("music-access-token", token)
    }
    getAppleAuthToken = (): string => {
        return localStorage.getItem("apple-music-auth-token") ?? "";
    }
    updateAppleAuthToken = (authToken: string) => {
        localStorage.setItem("apple-music-auth-token", authToken)
    }
    
    /* General Music Data */
    loadMusicData = () => {
        const currentPlaylist = this.loadCurrentPlaylist()
        if (currentPlaylist) this.updateCurrentPlaylist(currentPlaylist)
        
        const currentUserPlaylists = this.loadUserPlaylists()
        if (currentUserPlaylists) this.updateUserPlaylists(currentUserPlaylists, true)
        
        const currTrack = this.loadCurrentTrack()
        if (currTrack)  this.updateCurrentTrack(currTrack)
    }

    private loadCurrentPlaylist = () => {
        if (!localStorage.getItem("music-current-collection")) return null
        return JSON.parse(localStorage.getItem("music-current-collection")!)
    }
    private loadCurrentTrack = () => {
        if (!localStorage.getItem("music-current-track")) return null
        return JSON.parse(localStorage.getItem("music-current-track")!)
    }

    private loadUserPlaylists = () => {
        if (!localStorage.getItem("music-user-playlists")) return null
    
        return JSON.parse(localStorage.getItem("music-user-playlists")!)
    }
}