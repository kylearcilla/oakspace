import { get } from "svelte/store"
import type { MusicPlayer } from "./music-player"
import type { MusicUserData } from "./music-user-data"
import { initAppleMusic } from "./api-apple-music"
import { AppleMusicPlayer } from "./music-apple-player"
import { musicDataStore, musicPlayerStore, toastMessages } from "./store"

import { MusicAPIErrorContext, MusicMoodCategory, MusicPlatform, ToastContext } from "./enums"
import { ApiError, AuthorizationError, ExpiredTokenError, ResourceNotFoundError } from "./errors"

import { 
    sereneCollections, acousticCollections, classicalCollections, 
    lofiCollections, soundtrackCollections, summerCollections, 
    upbeatCollections, zenCollections  
} from "$lib/data-music-collections"
import { findEnumIdxFromDiffEnum } from "./utils-general"

export const USER_PLAYLISTS_REQUEST_LIMIT = 10

export const didInitMusicUser = () => loadMusicUserData() != null

/**
 * Called after every refresh. If user has signed up cntinue music session.
 */
export const continueMusicSession = (musicPlatform: MusicPlatform) => {
    musicLogin(musicPlatform, true)
}

/**
 * Attempt to log in user to desired music platform. 
 * Goes through an auth flow process. Called when logging for the first time or after a refresh after a log in.
 * Makes a new music user and player instance.
 * End of error pipeline.
 * 
 * @param platform          Current music streaming platform being used.
 * @param hasUserSignedIn   Has user already logged in before. 
 * @returns                 AsyncResult object.
 */
export const musicLogin = async (platform: MusicPlatform, hasUserSignedIn: boolean = false): Promise<AsyncResult> => {
    try {
        if (platform === MusicPlatform.AppleMusic) {
            await initAppleMusic(hasUserSignedIn)
        }

        if (hasUserSignedIn) return { sucess: true }

        toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
            context: get(musicDataStore)!.musicPlatform,
            message: "Log in Successful!",
        }])

        return { sucess: true }
    }
    catch(error: any) {
        createMusicAPIErrorToastMsg(error, platform)
        return { sucess: false }
    }    
}

/**
 * Called when user logs out of music platform.
 * @returns        AsyncResult object.
 */
export const musicLogout = async (): Promise<AsyncResult> => {
    const musicStore = get(musicDataStore)
    const playerStore = get(musicPlayerStore)

    try {
        musicStore!.quit()
        playerStore!.quitPlayer()
        return { sucess: false }
    }
    catch(error: any) {
        createMusicAPIErrorToastMsg(error)
        return { sucess: false }
    }
}

/**
 * Called when user wants to log in again after token has expired.
 * @returns     AsyncResult object.
 */
export const refreshMusicSession = async (): Promise<AsyncResult> => {
    const musicStore = get(musicDataStore)
    try {
        await musicStore!.refreshMusicSession()
        new AppleMusicPlayer(true)

        toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
            context: musicStore!.musicPlatform,
            message: "Refresh Success!"
        }])

        return { sucess: true }
    }
    catch(error: any) {
        createMusicAPIErrorToastMsg(error)
        return { sucess: false }
    }
}

/**
 * Create a an error toast message. 
 * Error code used to add context to error. 
 * Used to determine how to handle the error.
 * 
 * @param error         Error thrown from interacting with music user data / player stores.
 * @param musicPlatform Context music platform error occured in.
 * @returns             Toast message to be disaplyed in a Toast component.
 */
export const createMusicAPIErrorToastMsg = (error: Error, musicPlatform?: MusicPlatform) => {
    let toastMessage: ToastMsg

    const platform = musicPlatform === undefined ? get(musicDataStore)!.musicPlatform! : musicPlatform
    const toastContextidx = findEnumIdxFromDiffEnum(platform!, MusicPlatform, ToastContext)! as ToastContext
    const toastContext = ToastContext[toastContextidx]

    // put action function
    if (error instanceof ExpiredTokenError) {
        toastMessage = {
            context: toastContext,
            message: error.message,
            action: {
                msg: "Log in",
                func: () => refreshMusicSession()
            }
        }
    }
    toastMessage = {
        context: toastContext,
        message: error.message,
    }

    toastMessages.update(() => [toastMessage])
}


/**
 * Get the right error object to throw after a failed interaction with the a Music API.
 * Used in cases where an action may retrun multiple types of error.
 * 
 * @param     code      HTTP Status Code error code returned from Youtube Data API
 * @param     context   In what API context is the error origination from
 * @returns             Error type and context will be relevant in how the error will be displayed to the user.
 */
export const getMusicAPIError = (code: number, context: MusicAPIErrorContext) => {
    let message = "Error interacting with Music Data API."
  
    if (code === 401) {
        return new ExpiredTokenError("Session Expired. Log in Again to continue.")
    }
    else if (code === 403 && context === MusicAPIErrorContext.TRACK) {
      return new AuthorizationError("Issue with requested track or request is not properly authorized.")
    }
    else if (code === 403 && (context === MusicAPIErrorContext.PLAYLIST || context === MusicAPIErrorContext.ALBUM)) {
      return new AuthorizationError("Issue with requested playlist / album or request is not properly authorized.")
    }
    else if (code === 403 && (context === MusicAPIErrorContext.USER_AUTHORIZATION)) {
      return new AuthorizationError("App authorization failed.")
    }
    else if (code === 404 && (context === MusicAPIErrorContext.PLAYLIST || context === MusicAPIErrorContext.ALBUM)) {
      return new ResourceNotFoundError("Requested playlist / album failed. Track may not exist.")
    }
    else if (code === 404 && context === MusicAPIErrorContext.TRACK) {
      return new ResourceNotFoundError("Requested track failed Track may not exist.")
    }
    else if (code === 404 && context === MusicAPIErrorContext.USER_AUTHORIZATION) {
      return new ResourceNotFoundError("User does not exist.")
    }
    else {
      return new ApiError(message)
    }
  }

/**
 * Set collection as current collection & lay the first track of the collection item clicked.
 * 
 * @param collection      Playlist / album the user has clicked on.
 * @returns               AsyncResult object
 */
export const handlePlaylistItemClicked = async (collection: MusicCollection): Promise<AsyncResult> => {
    const musicPlayer = get(musicPlayerStore)

    if (collection.id === musicPlayer!.collection?.id) {
        musicPlayer!.removeCurrentMusicCollection()
        return { sucess: true }
    }

    try {
        musicPlayer!.updateCurrentCollectionAndPlay(collection)
        return { sucess: true }
    }
    catch(error: any) {
        createMusicAPIErrorToastMsg(error)
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
        await music!.fetchMoreUserPlaylists()

    }
    catch(error: any) {
        createMusicAPIErrorToastMsg(error)
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
    catch(error: any) {
        createMusicAPIErrorToastMsg(error)
    }
}

/**
 * Return the playlists & albums under a discover / mood category based on the current platform.
 * 
 * @param moodTitle     Current collection title
 * @param platformProp  To string index platform property name from DiscoverCollection
 * @returns             Playlists & albums under given mood category.
 */
export const getDiscoverCollectionList = (discoverCategory: MusicMoodCategory, platformProp: MusicPlatformPropNames): MusicCollection[] => {
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

/* Load */
export const loadMusicUserData = (): Partial<MusicUserData> | null => {
    if (!localStorage.getItem("music-user-data")) return null
    
    return JSON.parse(localStorage.getItem("music-user-data")!)
} 
export const loadMusicPlayerState = (): MusicPlayer | null => {
    if (!localStorage.getItem("music-player-data")) return null
    
    return JSON.parse(localStorage.getItem("music-player-data")!)
} 
export const loadMusicShuffleData = (): MusicShufflerData => {
    return JSON.parse(localStorage.getItem("music-shuffle-data")!)
}

/* Updates */
export const saveMusicUserData = (userData: Partial<MusicUserData>) => {
    localStorage.setItem("music-user-data", JSON.stringify(userData))
}
export const saveMusicPlayerData = (playerState: Partial<MusicPlayer>) => {
    localStorage.setItem("music-player-data", JSON.stringify(playerState))
}
export const saveMusicShuffleData = (shuffleData: MusicShufflerData) => {
    return localStorage.setItem("music-shuffle-data", JSON.stringify(shuffleData))
}

/* Removals */
export const deleteMusicUserData = (): void => {
    localStorage.removeItem("music-user-data")
}
export const removeAppleMusicTokens = () => {
    localStorage.removeItem("music.y5xn9fm7bj.itua")
    localStorage.removeItem("music.y5xn9fm7bj.itre")
    localStorage.removeItem("music.y5xn9fm7bj.media-user-token")
    localStorage.removeItem("mk-player-tsid")
}
export const removeMusicPlayerData = (): void => {
    localStorage.removeItem("music-player-data")
}
export const removeMusicShuffleData = (): void => {
    localStorage.removeItem("music-shuffle-data")
}