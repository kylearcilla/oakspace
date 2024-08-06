import { get } from "svelte/store";
import { MusicMediaType, MusicPlatform } from "./enums";
import { musicDataStore, ytUserDataStore } from "./store";
import { YoutubeUserData } from "./youtube-user-data";
import { deleteMusicUserData, loadMusicUserData, saveMusicUserData } from "./utils-music";
import { USER_PLS_MAX_PER_REQUEST, initToast } from "./utils-youtube";

export class YoutubeMusicUserData extends YoutubeUserData {
    musicPlatform = MusicPlatform.YoutubeMusic
    userDetails: MusicUserDetails 

    constructor() {
        super(musicDataStore, false)
        
        this.forMusic = true
        this.loadAndSetUserData()
        
        this.userDetails = {
            id: "",
            username: this.username,
            url: "",
            isPremiumUser: false,
            profileImgSmall: this.profileImgSrc,
            profileImgBig: ""
        }
    }

    initFromVideoData() {
        const data = get(ytUserDataStore)!

        this.isSignedIn = true
        this.username = data.username
        this.profileImgSrc = data.profileImgSrc
        this.email = data.email
        
        this.userPlaylists = data.userPlaylists
        this.userPlsNextPageToken = data.userPlsSecondPageToken
        this.userPlsSecondPageToken = data.userPlsSecondPageToken
        this.userPlaylistsTotal = data.userPlaylistsTotal
        this.hasFetchedAllUserPls = false
        
        this.accessToken = data.accessToken
        this.refreshToken = data.refreshToken
        this.accessTokenCreationDate = data.accessTokenCreationDate
        this.tokenExpiresInSecs = data.tokenExpiresInSecs
        this.hasTokenExpired = data.hasTokenExpired


        this.updateYoutubeUserData({ 
            email: this.email,
            username: this.username,
            profileImgSrc: this.profileImgSrc,
            userPlaylists: this.userPlaylists,  
            userPlaylistsTotal: this.userPlaylistsTotal,
            userPlsSecondPageToken: this.userPlsSecondPageToken,
            accessTokenCreationDate: this.accessTokenCreationDate
        })
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
            this.saveYtUserData()
        }
    }

    getLibrary(): UserLibraryCollection {
        return {
            items: this.userPlaylists.map((item) => ({
                id: item.id,
                name: item.title,
                author: item.channelTitle,
                authorUrl: item.channelURL,
                artworkImgSrc: item.thumbnailURL,
                genre: "",
                url: "",
                type: MusicMediaType.Playlist,
                length: item.vidCount,
                description: ""
            })),
            hasFetchedAll: this.hasFetchedAllUserPls,
            offset:        this.userPlaylists.length,
            totalItems:    this.userPlaylistsTotal
        }
    }

    async getMoreLibraryItems() {
        await this.loadMorePlaylistItems()
    }

    async refreshLibrary() {
        await this.refreshUserPlaylists()
    }

    /**
     * Load youtube creds and user data from local storage.
     * Called everytime user refreshes and Yotube Data has to be re-initialized.
     */
    loadAndSetUserData() {
        const userData = loadMusicUserData()
        if (!userData) return

        this.accessToken      = userData.accessToken
        this.refreshToken     = userData.refreshToken
        this.accessTokenCreationDate = userData.accessTokenCreationDate
        this.isSignedIn  = true

        this.username      = userData.username!
        this.profileImgSrc = userData.profileImgSrc!
        this.email         = userData.email!
        
        this.userPlaylists          = userData.userPlaylists!
        this.userPlaylistsTotal     = userData.userPlaylistsTotal!
        this.userPlsSecondPageToken = userData.userPlsSecondPageToken
        this.userPlsNextPageToken   = userData.userPlsSecondPageToken

        this.updateYoutubeUserData({ ...userData, isSignedIn: true })
    }

    saveYtUserData() {
        saveMusicUserData({
            username:       this.username!,
            profileImgSrc:  this.profileImgSrc!,
            email:          this.email!,
            accessTokenCreationDate:  this.accessTokenCreationDate!,
            accessToken:            this.accessToken!,
            refreshToken:           this.refreshToken!,
            userPlaylists:          this.userPlaylists!.slice(0, USER_PLS_MAX_PER_REQUEST),
            userPlaylistsTotal:     this.userPlaylistsTotal!,
            userPlsSecondPageToken: this.userPlsSecondPageToken
        })
    }

    quit() {
        this.store!.set(null)
        deleteMusicUserData()
    }
}