import { get } from "svelte/store"
import { initAppleMusicState } from "./api-apple-music"
import { AppleMusicPlayer } from "./music-apple-player"
import { musicDataStore, musicPlayerStore, toastMessages } from "./store"
import { MusicMoodCategory, MusicPlatform, ToastContext, ToastType } from "./enums"

import { 
    sereneCollections, acousticCollections, classicalCollections, 
    lofiCollections, soundtrackCollections, summerCollections, 
    upbeatCollections, zenCollections  
} from "$lib/data-music-collections"

/**
 * Called after every refresh. If user has signed up cntinue music session.
 */
export const initMusicPlatform = () => {     
    const platformCode = getPlatformCode()
    if (platformCode === null) return
    
    loginUser(platformCode, true)
}

/**
 * Attempt to log in user to desired music platform. 
 * Goes through an auth flow process. Called when logging for the first time or after a refresh after a log in.
 * Show a message if there's an issue.
 * 
 * @param platform          Current music streaming platform being used.
 * @param hasUserSignedIn   Has user already logged in before. 
 * @returns                 AsyncResult object.
 */
export const loginUser = async (platform: MusicPlatform, hasUserSignedIn: boolean = false): Promise<AsyncResult> => {
    try {
        if (platform === MusicPlatform.AppleMusic) {
            await initAppleMusicState(hasUserSignedIn)
        }
        return { sucess: true }
    }
    catch(code: any) {
        let toastMessage = createMusicAPIErrorToastMsg(code)
        toastMessages.update((toasts: ToastMsg[]) => [...toasts, toastMessage])

        return { sucess: false }
    }    
}

/**
 * Called when user logs out of music platform.
 * @returns        AsyncResult object.
 */
export const logOutUser = async (): Promise<AsyncResult> => {
    const musicStore = get(musicDataStore)
    const playerStore = get(musicPlayerStore)

    try {
        musicStore!.quit()
        playerStore!.quitPlayer()
        return { sucess: false }
    }
    catch {
        let toastMessage = createMusicAPIErrorToastMsg("400", "Relogin failed. Refresh & try again.")
        toastMessages.update((toasts: ToastMsg[]) => [...toasts, toastMessage])

        console.error("Error logging out user.")
        return { sucess: false }
    }
}

/**
 * Called when user wants to log in again after token has expired.
 * @returns     AsyncResult object.
 */
export const reLoginUser = async (): Promise<AsyncResult> => {
    const musicStore = get(musicDataStore)
    try {
        await musicStore!.reLogInUser()
        const musicPlayer = new AppleMusicPlayer(musicStore!)

        toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
            type: ToastType.Expired,
            context: getPlatformCode()!,
            message: "Log In Success!",
            actionFunction: null
        }])

        return { sucess: true }
    }
    catch(code: any) {
        let toastMessage = createMusicAPIErrorToastMsg(code, "Relogin failed. Refresh & try again.")
        toastMessages.update((toasts: ToastMsg[]) => [...toasts, toastMessage])
        
        console.error("Error relogging in user.")
        return { sucess: false }
    }
}

/**
 * Create a an error toast message.
 * @param errorCode  Error code. "400" is treated as a generic error to the user.
 * @returns          Toast message to be disaplyed in a Toast component.
 */
export const createMusicAPIErrorToastMsg = (errorCode: string, customMsg: string = ""): ToastMsg => {
    const platform = Number(getPlatformCode()!)

    // 401: invalid token, no token, expired token
    if (errorCode === "401") {
        return {
            type: ToastType.Expired,
            context: ToastContext[platform],
            message: customMsg ? customMsg : "Session expired. Log in again to continue.",
            actionFunction: reLoginUser
        }
    }
    else if (errorCode === "403") {
        return {
            type: ToastType.BasicError,
            context: ToastContext[platform],
            message: customMsg ? customMsg : "App authorization denied by the user.",
            actionFunction: null
        }
    }
    else {
        return {
            type: ToastType.BasicError,
            context: ToastContext[platform],
            message: customMsg ? customMsg : "Error occured. Refresh or Log in Again to continue.",
            actionFunction: null
        }
    }
}

/**
 * Set collection as current collection & lay the first track of the collection item clicked.
 * 
 * @param collection      Playlist / album the user has clicked on.
 * @returns               AsyncResult object
 */
export const handlePlaylistItemClicked = async (collection: MusicCollection): Promise<AsyncResult> => {
    const musicData = get(musicDataStore)
    const musicPlayer = get(musicPlayerStore)

    if (collection.id === musicData!.collection?.id) {
        musicData!.removeCurrentMusicCollection()
        musicPlayer!.resetMusicPlayerStateToEmptyState()
        return { sucess: true }
    }

    try {
        musicPlayer!.updateMusicPlayerState({ 
            ...musicPlayer!.state,
            isDisabled: true, 
            isShuffled: false,
            isRepeating: false
        })

        musicData!.updateCurrentCollection(collection)
        musicPlayer!.queueAndPlayNextTrack(collection.id, 0)

        return { sucess: true }
    }
    catch(code: any) {
        let toastMessage = createMusicAPIErrorToastMsg(code)
        toastMessages.update((toasts: ToastMsg[]) => [...toasts, toastMessage])

        return { sucess: false }
    }
}

/**
 * Scroll handler for user playlists list component that has pagination.
 * Requests for more user playlists once scrolled down far enough.
 * @param event 
 */
export const userPlsPaginationScrollHandler = async (event: Event) => {
    const list = event.target as HTMLElement
    const scrollTop = list.scrollTop
    const scrollHeight = list!.scrollHeight 
    const clientHeight = list!.clientHeight 
    const hasReachedEnd = scrollTop >= scrollHeight - clientHeight

    const music = get(musicDataStore)
    
    if (!hasReachedEnd) return

    try {
        if (music!.hasFetchedAllUserPls) return
        await music!.getUserApplePlaylists()
    }
    catch(code: any) {
        let toastMessage = createMusicAPIErrorToastMsg(code)
        toastMessages.update((toasts: ToastMsg[]) => [...toasts, toastMessage])
    }
}

/**
 * Scroll handler for discover playlists list component that has pagination.
 * Requests for more discover playlists once scrolled down far enough.
 * @param event 
 */
export const discoverPlsPaginationScrollHandler = async (event: Event) => {
    const list = event.target as HTMLElement
    const scrollTop = list.scrollTop
    const scrollHeight = list!.scrollHeight 
    const clientHeight = list!.clientHeight 
    const hasReachedEnd = scrollTop >= scrollHeight - clientHeight
    
    if (!hasReachedEnd) return

    try {
        // hasCollectionItemsLoaded = false
        // await: fetch more discover playlists
        // hasCollectionItemsLoaded = true
    }
    catch(code: any) {
        let toastMessage = createMusicAPIErrorToastMsg(code)
        toastMessages.update((toasts: ToastMsg[]) => [...toasts, toastMessage])
    }
}

/**
 * Return the playlists & albums under a discover / mood category based on the current platform.
 * 
 * @param moodTitle     Current collection title
 * @param platformProp  To string index platform property name from DiscoverCollection
 * @returns             Playlists & albums under given mood category.
 */
export const getClickedDiscoverCollectionCardList = (discoverCategory: MusicMoodCategory, platformProp: MusicPlatformPropNames): MusicCollection[] => {
    switch (discoverCategory) {
        case MusicMoodCategory.Serene:
            return sereneCollections[platformProp]
        case MusicMoodCategory.Lofi:
            return lofiCollections[platformProp]
        case MusicMoodCategory.Upbeat:
            return upbeatCollections[platformProp]
        case MusicMoodCategory.Soundtracks:
            return soundtrackCollections[platformProp]
        case MusicMoodCategory.Acoustic:
            return acousticCollections[platformProp]
        case MusicMoodCategory.Classical:
            return classicalCollections[platformProp]
        case MusicMoodCategory.Zen:
            return zenCollections[platformProp]
        case MusicMoodCategory.Summer:
            return summerCollections[platformProp]
    }
}

/**
 * Get the music current platform as a string
 * 
 * @param platFormIdx  Enum platform index
 * @returns            Current music platform title
 */
export const getCurrMusicPlatformName = (platFormIdx: number): string => {
    const platform = MusicPlatform[platFormIdx]
    return platform === "AppleMusic" ? "Apple Music" : platform
}

/**
 * Based on current platform being used, get the proper platform 
 * ...property of the discover collection object item.
 * 
 * @param platFormIdx  Enum platform index
 * @returns            Music Discover Property name of current platform
 */
export const getPlatformNameForDiscoverObj = (platFormIdx: MusicPlatform): MusicPlatformPropNames => {
    let platform = MusicPlatform[platFormIdx].toLowerCase()
    platform = "applemusic" ? "appleMusic" : platform

    return platform as MusicPlatformPropNames
}

/**
 * Get the platform code. Will be present if user has logged in.
 * 
 * @returns  0 (Apple Music), 1 (Spotify), 2 (Youtube), 4 (Soundcloud)
 */
export const getPlatformCode = (): MusicPlatform | null => {
    const platformCode = localStorage.getItem("music-platform")
    if (platformCode === null) return null

    return Number(platformCode)
}


export const getAccessToken = (): string => {
    return localStorage.getItem("music-access-token") ?? ""
}
export const getAppleAuthToken = (): string => {
    return localStorage.getItem("apple-music-auth-token") ?? ""
}

export const saveMusicPlatform = (musicPlatform: MusicPlatform) => {
    localStorage.setItem("music-platform", JSON.stringify(musicPlatform))
}
export const updateAccessToken = (token: string) => {
    localStorage.setItem("music-access-token", token)
}
export const updateAppleAuthToken = (authToken: string): void => {

    localStorage.setItem("apple-music-auth-token", authToken)
}

export const removeAppleAuthToken = () => {
    localStorage.removeItem("apple-music-auth-token")
    localStorage.removeItem("music.y5xn9fm7bj.media-user-token")
}
export const removeAppleAccessToken = () => {
    localStorage.removeItem("music-access-token")
}
export const removeAppleMusicTokens = () => {
    localStorage.removeItem("music.y5xn9fm7bj.itua")
    localStorage.removeItem("music-platform")
    localStorage.removeItem("music.y5xn9fm7bj.itre")
    localStorage.removeItem("mk-player-tsid")
}
export const removeMusicShuffleData = (): void => {
    localStorage.removeItem("music-shuffle-data")
}
export const removeMusicPlayerState = (): void => {
    localStorage.removeItem("music-player-data")
}