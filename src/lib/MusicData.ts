import type { Writable } from "svelte/store"
import { curentPlaylist, currentTrack, musicContext, userMusicPlaylists } from "./store"
import { getAppleMusicPlaylistDetails, getUserApplePlaylists } from "./apple-music-api"

export class MusicData {
    musicKit: any = null
    musicPlayerInstance: any;

    musicContext: MusicContext = {
        platform: "",
        currentMedia: ""
    }
    currentMediaItem: Track | LiveTrack | null = null
    userPlaylists: MusicPlaylist[] = []
    currentPlaylist: MusicPlaylist | null = null

    userPlaylistsState: Writable<MusicPlaylist[]>
    currentTrackState: Writable<Track | LiveTrack>
    curentPlaylistState: Writable<MusicPlaylist>
    musicContextState: Writable<MusicContext>

    constructor() { 
        this.currentTrackState = currentTrack
        this.curentPlaylistState = curentPlaylist
        this.musicContextState = musicContext
        this.userPlaylistsState = userMusicPlaylists

    }

    authUser = async () => await this.initUser()

    /* Authentication */
    initUser = async () => {
        const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } }

        return await fetch("http://localhost:3000/", options)
                        .then((response: any) => response.json())
                        .then(async (data: any) => {
                                this.updateAccessToken(data.token)
                                const isSuccessful = await this.initAppleMusic()
                                return { ...data, isSuccessful }
                        })
                        .catch((error: any) => { error })
    }

    initAppleMusic = async () => {
        const devToken = this.getAccessToken();
        if (devToken === "") return;

        const options = { developerToken: devToken, app: { name: 'Luciole', build: '1.1' } }

        // @ts-ignore
        this.musicKit = MusicKit
    
        if (this.musicKit) {
            await this.musicKit.configure(options);
            this.musicPlayerInstance = this.musicKit.getInstance()
            const authToken = await this.musicPlayerInstance.authorize()
    
            this.updateMusicContext({ platform: "apple music", currentMedia: "" })
            return this.updateAppleAuthToken(authToken)
        }
        
        return false;
    }

    /* Tracks */
    updateCurrentTrack(mediaItem: Track | LiveTrack) {
        this.currentMediaItem = mediaItem
        this.currentTrackState.update(() => mediaItem)

        localStorage.setItem("music-current-track", JSON.stringify(mediaItem))
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
        console.log(newPlaylist)
        if (!newPlaylist) return

        this.updateCurrentPlaylist(newPlaylist)
    }

    private async getPlaylistDetails(playlistId: string): Promise<MusicPlaylist | null>  {
        if (this.musicContext.platform === "apple music") {
            return await getAppleMusicPlaylistDetails(playlistId, this.getAccessToken())
        }

        return null
    }

    updateCurrentPlaylist(newCurrentPlaylist: MusicPlaylist) {
        this.currentPlaylist = newCurrentPlaylist

        this.curentPlaylistState.update((data: any) => {
            const newData = { ...data, ...newCurrentPlaylist }
            localStorage.setItem("music-current-playlist", JSON.stringify(newData))

            return newData
        })
    }

    /* User Library Playlists */
    async setUserPlaylists() {
        const userPlaylistsResults = await this.getUserPlaylists()
        if (!userPlaylistsResults) return

        this.updateUserPlaylists(userPlaylistsResults, false)
    }

    private async getUserPlaylists(): Promise<MusicPlaylist[] | null>  {
        if (this.musicContext.platform === "apple music") {
            return await getUserApplePlaylists()
        }

        return null
    }

    private updateUserPlaylists(userPlaylists: MusicPlaylist[], isLoading: boolean) {
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
    updateMusicContext(newMusicContext: MusicContext) {
        this.musicContext = newMusicContext
        musicContext.set(newMusicContext)

        localStorage.setItem("music-context", JSON.stringify(newMusicContext))
    }

    loadMusicData = () => {
        const currentPlaylist = this.loadCurrentPlaylist()
        if (currentPlaylist) this.updateCurrentPlaylist(currentPlaylist)
        
        const currentUserPlaylists = this.loadUserPlaylists()
        if (currentUserPlaylists) this.updateUserPlaylists(currentUserPlaylists, true)
        
        const currTrack = this.loadCurrentTrack()
        if (currTrack)  this.updateCurrentTrack(currTrack)
    }

    private loadCurrentPlaylist = () => {
        if (!localStorage.getItem("music-current-playlist")) return null
        return JSON.parse(localStorage.getItem("music-current-playlist")!)
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