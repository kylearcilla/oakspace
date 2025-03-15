import { ytUserStore } from "./store"

import { APIError } from "./errors"
import { toast } from "./utils-toast"
import { APIErrorCode, LogoIcon } from "./enums"
import { getUserYtPlaylists } from "./api-youtube"
import { toastApiErrorHandler } from "./utils-general"
import { handleGoogleRedirect, refreshGoogleToken } from "./api-google"
import { 
        deleteYtUserData, 
        saveYtUserData, 
        loadYtUserData, 
        USER_PLS_MAX_PER_REQUEST
} from "./utils-youtube"

export class YoutubeUserData {
    signedIn = false
    username = ""
    profileImgSrc = ""
    email = ""
    
    nextPageToken = ""
    playlists: YoutubePlaylist[] = []
    playlistsLength = 0
    fetchedAllItems = false
    reqIdx = 0
    
    accessToken = ""
    refreshToken = ""
    accessTokenCreationDate: Date | null = null
    expiresIn = 3600
    tokenExpired = false

    error: any = null
    loading = false

    ACTIVE_TOKEN_THRESHOLD_SECS = 60
    
    constructor({ context }: { context: "init" | "continue" }) {
        ytUserStore.set(this)

        if (context === "init") {
            this.handleRedirect()
        }
        else if (context === "continue") {
            this.continueSession()
        }
    }

    async handleRedirect() {
        try {
            this.setLoading(true)
            const { accessToken, refreshToken, expiresIn, userInfo } = await handleGoogleRedirect("yt")

            this.expiresIn = expiresIn
            this.accessToken = accessToken
            this.refreshToken = refreshToken
            this.accessTokenCreationDate = new Date()
            this.username = userInfo.name
            this.profileImgSrc = userInfo.pictureSrc
            this.email = userInfo.email
    
            await this.getUserPlaylists()
    
            this.signedIn = true
            this.initToast("Logged In!")
            
            this.update({ 
                signedIn: true,
                username: this.username,
                profileImgSrc: this.profileImgSrc,
                email: this.email
            })
            this.setLoading(false)
        }
        catch (e: any) {
            console.error(e)
            this.onError({ error: new APIError(APIErrorCode.AUTHORIZATION_ERROR) })
            this.quit({ error: true })
        }
    }

    async continueSession() {
        this.loadAndSetUserData()
    }

    update(newData: Partial<YoutubeUserData>, doSave: boolean = true) {
        ytUserStore.update((data: YoutubeUserData | null) => this.getNewStateObj(newData, data!))

        if (doSave) {
            this.saveYtUserData()
        }
    }

    /* tokens */

    hasAccessTokenExpired() {
        const currentTime = new Date().getTime()
        const timeElapsed = currentTime - this.accessTokenCreationDate!.getTime()
        const timeRemaining = (this.expiresIn * 1000) - timeElapsed
        const threshold = this.ACTIVE_TOKEN_THRESHOLD_SECS * 1000 
    
        return timeRemaining <= threshold
    }

    async verifyAccessToken() {
        if (this.hasAccessTokenExpired()) {
            try {
                await this.refreshAccessToken()
            }
            catch {
                this.setTokenHasExpired(true)
                throw new APIError(APIErrorCode.EXPIRED_TOKEN)
            }
        }
        return true
    }

    async refreshAccessToken() {
        try {
            this.setLoading(true)
            const { accessToken, expiresIn } = await refreshGoogleToken(this.refreshToken)
        
            this.accessToken = accessToken
            this.accessTokenCreationDate = new Date()
            this.expiresIn = expiresIn

            this.saveYtUserData()
            this.setTokenHasExpired(false)
        }
        catch(e: any) {
            console.error(e)
            this.onError(e)
        }
        finally {
            this.setLoading(false)
        }
    }

    setTokenHasExpired(hasExpired: boolean) {
        this.tokenExpired = hasExpired
        this.update({ tokenExpired: hasExpired }, false)
    }

    /* api */

    async refreshUserPlaylists() {
        try {
            this.setLoading(true)
            await this.getUserPlaylists(true)
        }
        catch(error: any) {
            console.error(error)
            this.onError(error)
        }
        finally {
            this.setLoading(false)
        }
    }

    async getMorePlaylists() {
        try {
            if (this.fetchedAllItems) {
                return  
            }
            this.setLoading(true)
            await this.getUserPlaylists()
        }
        catch(error: any) {
            console.error(error)
            this.onError(error)
        }
        finally {
            this.setLoading(false)
        }
    }



    async getUserPlaylists(fresh = false) {
        await this.verifyAccessToken()
        if (fresh) {
            this.nextPageToken = ""
            this.playlistsLength = 0
            this.playlists = []
            this.fetchedAllItems = false
            this.reqIdx = 0
        }

        const firstReqAfterReload = this.reqIdx === 0 && this.playlists.length > 0

        const fetchPlaylists = async () => {
            const res = await getUserYtPlaylists({
                accessToken: this.accessToken, 
                nextPageToken: this.nextPageToken, 
                max: USER_PLS_MAX_PER_REQUEST
            })
    
            this.reqIdx++
            this.nextPageToken = res.nextPageToken
            this.playlistsLength = res.playlistsTotal

            return res
        }
        let res = await fetchPlaylists()

        // first req after reload ensure data is fresh
        if (firstReqAfterReload) {
            this.playlists = res.playlists
            res = await fetchPlaylists()
        }
        this.playlists.push(...res.playlists)
        this.fetchedAllItems = res.playlists.length < USER_PLS_MAX_PER_REQUEST

        this.update({ 
            playlists: this.playlists, 
            fetchedAllItems: this.fetchedAllItems
        })
        this.saveYtUserData()
    }

    /* utils */

    setLoading(loading: boolean) {
        this.loading = loading
        this.update({ loading }, false)
    }

    initToast(msg: string) {
        toast("default", {
            icon:    LogoIcon.Youtube,
            message:    "Youtube",
            description: msg,
        })
    }

    onError({ error, refreshFunc = () => this.refreshAccessToken() }: { 
        error: any
        refreshFunc?: () => void 
    }) {
        error = error.code === undefined ? new APIError(APIErrorCode.GENERAL) : error
        this.error = error
        this.update({ error }, false)

        toastApiErrorHandler({
            error,
            title: "Youtube",
            logoIcon: LogoIcon.Youtube,
            contextId: "youtube",
            ...(error.code === APIErrorCode.EXPIRED_TOKEN && {
                action: {
                    label: "Continue session",
                    onClick: () => refreshFunc()
                }
            })
        })
    }

    quit(options: { error?: boolean } = { error: false }) {
        this.update({ signedIn: false }, false)
        ytUserStore.set(null)

        deleteYtUserData()

        if (!options.error) {
            this.initToast("Logged Out!")
        }
    }

    /* state */

    loadAndSetUserData() {
        const userData = loadYtUserData()!

        this.accessToken = userData.accessToken
        this.refreshToken = userData.refreshToken
        this.accessTokenCreationDate = new Date(userData.accessTokenCreationDate!)

        this.username = userData.username
        this.profileImgSrc = userData.profileImgSrc
        this.email = userData.email
        this.playlists = userData.playlists
        this.playlistsLength = userData.playlistsLength

        this.signedIn = true

        this.update({ 
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            accessTokenCreationDate: this.accessTokenCreationDate,
            username: this.username,
            profileImgSrc: this.profileImgSrc,
            email: this.email,
            signedIn: true,
            playlists: this.playlists,
            playlistsLength: this.playlistsLength
         })
    }
    
    saveYtUserData() {
        saveYtUserData({
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            accessTokenCreationDate: this.accessTokenCreationDate!,

            username: this.username!,
            profileImgSrc: this.profileImgSrc!,
            email: this.email!,

            playlists: this.playlists.slice(0, USER_PLS_MAX_PER_REQUEST),
            playlistsLength: this.playlistsLength
        })
    }

    getNewStateObj(newState: Partial<YoutubeUserData>, oldState: YoutubeUserData) {
        const newStateObj = oldState

        if (newState.username != undefined)        newStateObj.username = newState.username
        if (newState.profileImgSrc != undefined)   newStateObj.profileImgSrc = newState.profileImgSrc
        if (newState.email != undefined)           newStateObj.email = newState.email
        if (newState.signedIn != undefined)        newStateObj.signedIn = newState.signedIn
        if (newState.playlists != undefined)       newStateObj.playlists = newState.playlists
        if (newState.fetchedAllItems != undefined) newStateObj.fetchedAllItems = newState.fetchedAllItems
        if (newState.loading != undefined)         newStateObj.loading = newState.loading
        if (newState.tokenExpired != undefined)    newStateObj.tokenExpired = newState.tokenExpired
        if (newState.error != undefined)           newStateObj.error = newState.error

        return newStateObj
    }
}