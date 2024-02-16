import { get } from "svelte/store"
import { musicDataStore, musicPlayerStore, toastMessages } from "./store"

import { getAppleMusicUserAlbums, getAppleMusicUserLikedTracks, getAppleMusicUserPlaylists, handleAppleMusicyMediaItemClicked, initAppleMusic } from "./api-apple-music"
import type { SpotifyMusicPlayer } from "./music-spotify-player"
import { findEnumIdxFromDiffEnum, getScrollStatus } from "./utils-general"
import { 
    getSpotfifyUserLikedTracks, getSpotfifyUserPlaylists, getSpotifyUserAlbums, getSpotifyUserAudioBooks, getUserPodcastsEps, 
    handleSpotifyMediaItemClicked, initSpotifyMusic
} from "./api-spotify"
import { 
    sereneCollections, acousticCollections, classicalCollections, 
    lofiCollections, soundtrackCollections, summerCollections, 
    upbeatCollections, zenCollections  
} from "$lib/data-music-collections"

import type { MusicPlayer } from "./music-player"
import type { AppleMusicUserData } from "./music-apple-user-data"
import type { SpotifyMusicUserData } from "./music-spotify-user-data"
import { 
    APIErrorCode, MusicMediaType, MusicMoodCategory, 
    MusicPlatform, ToastContext, UserLibraryMedia 
} from "./enums"
import { APIError } from "./errors"

export const USER_PLAYLISTS_REQUEST_LIMIT = 10
export const SPOTIFY_IFRAME_ID = "spotify-iframe"

export function didInitMusicUser() { 
    loadMusicUserData() != null
}

/**
 * Called after every refresh. If user has signed up cntinue music session.
 */
export async function continueMusicSession(musicPlatform: MusicPlatform) {
    await musicLogin(musicPlatform)
}

/**
 * Attempt to log in user to desired music platform. 
 * Goes through an auth flow process. Called when logging for the first time or after a refresh after a log in.
 * Makes a new music user and player instance.
 * End of error pipeline.
 * 
 * @param platform          Current music streaming platform being used.
 * @param hasUserSignedIn   Has user already logged in before. 
 */
export async function musicLogin(platform: MusicPlatform) {
    if (platform === MusicPlatform.AppleMusic) {
        await initAppleMusic()
    }
    else if (platform === MusicPlatform.Spotify) {
        await initSpotifyMusic()
    }
}

export function musicLoginSuccessHandler(platform: MusicPlatform) {
    toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
        context: platform,
        message: "Log in Successful!",
    }])
}

/**
 * Called when user logs out of music platform.
 */
export async function musicLogout() {
    const musicStore = get(musicDataStore)
    const playerStore = get(musicPlayerStore)

    try {
        musicStore!.quit()
        playerStore!.quit()
    }
    catch(error: any) {
        musicAPIErrorHandler(error)
    }
}

/**
 * Called when user wants to log in again after token has expired.
 */
export async function refreshMusicSession() {
    const musicStore = get(musicDataStore)
    await musicStore!.refreshAccessToken()

    toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
        context: musicStore!.musicPlatform,
        message: "Refresh Success!"
    }])
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
export function musicAPIErrorHandler(error: APIError, musicPlatform?: MusicPlatform) {
    let toastMessage: ToastMsg

    const platform = musicPlatform === undefined ? get(musicDataStore)!.musicPlatform! : musicPlatform
    const platformStr = getPlatformString(platform)

    const toastContext = findEnumIdxFromDiffEnum(platform!, MusicPlatform, ToastContext)!

    if (error.code === APIErrorCode.EXPIRED_TOKEN) {
        toastMessage = {
            context: toastContext,
            message: error.message ?? "Token has expired. Log in again to continue.",
            action: {
                msg: "Continue session",
                func: () => refreshMusicSession()
            }
        }
    }
    else if (error.code === APIErrorCode.PLAYER) {
        toastMessage = {
            context: toastContext,
            message: error.message ?? "There was an error with the player. Try refreshing the page.",
        }
    }
    else if (error.code === APIErrorCode.AUTHORIZATION_ERROR) {
        toastMessage = {
            context: toastContext,
            message: error.message ?? `${platformStr} authorization failed.`,
        }
    }
    else if (error.code === APIErrorCode.RATE_LIMIT_HIT) {
        toastMessage = {
            context: toastContext,
            message: "Rate limit exceeded. Try again later.",
        }
    }
    else if (error instanceof TypeError) {
        toastMessage = {
            context: toastContext,
            message: error.message ?? "There was an error. Please try again."
        }
    }
    else {
        toastMessage = {
            context: toastContext,
            message: error.message ?? `There was an error with ${platformStr} Please try again later.` ,
        }
    }

    toastMessages.update(() => [toastMessage])
}

async function getUserAlbums(platform: MusicPlatform, offset: number,limit: number) {
    const musicStore = get(musicDataStore)!
    const accessToken = await musicStore.verifyAccessToken() as string

    if (platform === MusicPlatform.AppleMusic) {
        const userToken = (musicStore as AppleMusicUserData).userToken

        return await getAppleMusicUserAlbums(limit, offset, { accessToken, userToken} )
    }
    else if (platform === MusicPlatform.Spotify) {
        return await getSpotifyUserAlbums(accessToken, offset, limit)
    }
    return null
}

async function getUserPlaylist(platform: MusicPlatform, offset: number,limit: number) {
    const musicStore = get(musicDataStore)!
    const accessToken = await musicStore.verifyAccessToken() as string

    if (platform === MusicPlatform.AppleMusic) {
        const userToken = (musicStore as AppleMusicUserData).userToken

        return await getAppleMusicUserPlaylists(limit, offset, { accessToken, userToken} )
    }
    else if (platform === MusicPlatform.Spotify) {
        return await getSpotfifyUserPlaylists(accessToken, offset, limit)
    }
    return null
}

async function getUserLikedTracks(platform: MusicPlatform, offset: number,limit: number) {
    const musicStore = get(musicDataStore)!
    const accessToken = await musicStore.verifyAccessToken() as string

    if (platform === MusicPlatform.AppleMusic) {
        const userToken = (musicStore as AppleMusicUserData).userToken

        return await getAppleMusicUserLikedTracks(limit, offset, { accessToken, userToken} )
    }
    else if (platform === MusicPlatform.Spotify) {
        return await getSpotfifyUserLikedTracks(accessToken, offset, limit)
    }
}


/* Media Item Clicked Listeners */

/**
 * Set collection as current collection & lay the first track of the collection item clicked.
 * 
 * @param collection  Media the user has clicked on.
 * @param idx         Idx location of clicked
 */
export async function handlePlaylistItemClicked (collection: MediaCollection, itemClicked: Media, idx: number) {
    const musicData = get(musicDataStore)
    const musicPlayer = get(musicPlayerStore)
    const selectContext = { collection, itemClicked, idx }

    
    if (musicData!.musicPlatform === MusicPlatform.Spotify) {
        handleSpotifyMediaItemClicked(selectContext)
    }
    else if (musicData!.musicPlatform === MusicPlatform.AppleMusic) {
        console.log("B")
        handleAppleMusicyMediaItemClicked(selectContext)
    }


    // if (collection!.id === musicPlayer!.mediaCollection?.id) {
    //     musicPlayer!.removeCurrentCollection()
    // }
    // try {
    //     musicPlayer!.updateMediaCollection({ collection, itemClicked, idx })
    // }
    // catch(error: any) {
    //     musicAPIErrorHandler(error)
    // }
}

/**
 * Get the collection associated with the library clicked.
 * If not a collection (clicked on a track from saved tracks for example), then create a library for it.
 * Ensure that the media user clicks is consistent with the actual media located in that index (undeleted, unmoved).
 * 
 * @param mediaClicked  Clicked media
 * @returns             Media associated collection
 */ 
export async function getLibMediaCollection(mediaClicked: Media, itemIdx: number): Promise<MediaCollection> {
    const musicStore = get(musicDataStore)!
    const accessToken = await musicStore.verifyAccessToken() as string
    const platform = musicStore.musicPlatform

    let mediaCollection: MediaCollection

    console.log("mediaClicked", mediaClicked)

    if (mediaClicked.type === MusicMediaType.Playlist) {
        const details = (await getUserPlaylist(platform, itemIdx, 1))!

        if (!details || details.total === 0 || details.items[0].id != mediaClicked.id) {
            throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Outdated library. Please refresh.")
        }
        else {
            mediaCollection = details.items[0] as MediaCollection
        }
    }
    else if (mediaClicked.type === MusicMediaType.Album) {
        const details = (await getUserAlbums(platform, itemIdx, 1))!

        if (!details || details.total === 0 || details.items[0].id != mediaClicked.id) {
            throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Outdated library. Please refresh.")
        }
        else {
            mediaCollection = details.items[0] as MediaCollection
        }
    }
    else if (mediaClicked.type === MusicMediaType.PodcastEpisode) {
        const details = await getUserPodcastsEps(accessToken, itemIdx, 1)

        if (!details || details.total === 0 || details.items[0].id != mediaClicked.id) {
            throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Outdated library. Please refresh.")
        }

        const artwork = musicStore.userDetails?.profileImgBig ?? details.items[0].artworkImgSrc

        mediaCollection = {
            id: "",
            name: "My Library",
            description: "Your saved podcast episodes.",
            artworkImgSrc: artwork ?? details.items[0].artworkImgSrc,
            author: musicStore.userDetails!.username,
            authorUrl: musicStore.userDetails!.url,
            genre: "",
            type: MusicMediaType.SavedEpisodes,
            length: details.total,
            fromLib: true,
            url: ""
        }
    }
    else if (mediaClicked.type === MusicMediaType.Track) {
        const details = (await getUserLikedTracks(platform, itemIdx, 1))!

        if (!details || details.total === 0 || details.items[0].id != mediaClicked.id) {
            throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Outdated library. Please refresh.")
        }
        
        const artwork = musicStore.userDetails?.profileImgBig ?? details.items[0].artworkImgSrc

        mediaCollection = {
            id: "",
            name: "My Library",
            description: "Your saved tracks.",
            artworkImgSrc: artwork ?? details.items[0].artworkImgSrc,
            author: musicStore.userDetails?.username ?? "",
            authorUrl: musicStore.userDetails?.url ?? "",
            genre: "",
            type: MusicMediaType.SavedTracks,
            length: details.total,
            fromLib: true,
            url: ""
        } 
    }
    else {
        const details = await getSpotifyUserAudioBooks(accessToken, itemIdx, 1)!

        if (!details || details.total === 0 || details.items[0].id != mediaClicked.id) {
            throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Outdated library. Please refresh.")
        }

        const artwork = musicStore.userDetails?.profileImgBig ?? details.items[0].artworkImgSrc

        mediaCollection = {
            id: "",
            name: "My Library",
            description: "Your saved audiobooks. (These are preview-only.)",
            artworkImgSrc: artwork ?? details.items[0].artworkImgSrc,
            author: musicStore.userDetails!.username,
            authorUrl: musicStore.userDetails!?.url,
            genre: "",
            type: MusicMediaType.SavedAudioBooks,
            length: details.total,
            url: "",
            fromLib: true
        }
    }

    return mediaCollection!
}

export function isMediaTypeACollection(type: MusicMediaType): boolean {
    return [
        MusicMediaType.Playlist, 
        MusicMediaType.Album,
        MusicMediaType.SavedTracks,
        MusicMediaType.SavedAudioBooks,
        MusicMediaType.SavedEpisodes
    ].includes(type)
}

/* Discover Section */

/**
 * Scroll handler for discover media lists list component that has pagination.
 * Requests for more discover media lists once scrolled down far enough.
 * @param event 
 */
export async function discoverPlsPaginationScrollHandler(event: Event) {
    const list = event.target as HTMLElement
    const [hasReachedEnd] = getScrollStatus(list)
    
    if (!hasReachedEnd) return

    try {
        // hasCollectionItemsLoaded = false
        // await: fetch more discover media lists
        // hasCollectionItemsLoaded = true
    }
    catch(error: any) {
        musicAPIErrorHandler(error)
    }
}

/**
 * Returns the music media items under a discover / mood category based on the current platform.
 * 
 * @param moodTitle     Current collection title
 * @param platformProp  To string index platform property name from DiscoverCollection
 * @returns             Music media items under given mood category.
 */
export function getDiscoverCollectionList(discoverCategory: MusicMoodCategory, platformProp: MusicPlatformPropNames): Media[] {
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
export function getPlatformString(platform: MusicPlatform): string {
    if (platform === MusicPlatform.AppleMusic) {
        return "Apple Music"
    }
    else if (platform === MusicPlatform.YoutubeMusic) {
        return "Youtube Music"
    }
    else{
        return MusicPlatform[platform]
    }
}

/**
 * Based on current platform being used, get the proper platform 
 * ...property of the discover collection object item.
 * 
 * @param platFormIdx  Enum platform index
 * @returns            Music Discover Property name of current platform
 */
export function getPlatformNameForDiscoverObj(platFormIdx: MusicPlatform): MusicPlatformPropNames {
    let platform = MusicPlatform[platFormIdx].toLowerCase()
    platform = platform === "applemusic" ? "appleMusic" : platform

    return platform as MusicPlatformPropNames
}

/* Media Item Displays */

export function getMediaDescription(media: Media): string {
    const _media: any = media

    if ("description" in media) {
        return _media.description ?? ""
    }

    return "-"
}

export function getMediaLength(media: Media): string {
    const _media: any = media

    if ("length" in media) {
        const length = _media.length
        return length > 100 ? "100+" : length
    }

    return "-"
}

export function getLibraryItemDescription(mediaItem: Media) {
    const _mediaItem = mediaItem as any

    if ("description" in mediaItem) {
        return _mediaItem.description
    }

    return ""
}

export function getLibraryMediaItemInfo(media: Media, type: UserLibraryMedia): any {
    const _media = media as any

    if (type === UserLibraryMedia.LikedTracks) {
        return { artist: media.author, album: _media.album }
    }
    else if (type === UserLibraryMedia.Audiobooks) {
        return { author: media.author }
    }
    else if (type === UserLibraryMedia.PodcastEps) {
        return { show: media.author, description: _media.description }
    }
    else if (type === UserLibraryMedia.Playlists) {
        return { owner: media.author, length: _media.length, description: _media.description }
    }
    else if (type === UserLibraryMedia.Albums) {
        return { artist: media.author }
    }

    return null
}

export function getLibraryMediaTitle(media: Media, type: UserLibraryMedia) {
    const _media = media as any

    if (type === UserLibraryMedia.LikedTracks) {
        return `"${media.name}" by ${media.author} from "${_media.album}"`
    }
    else if (type === UserLibraryMedia.Audiobooks) {
        return `"${media.name}" written by ${media.author}`
    }
    else if (type === UserLibraryMedia.PodcastEps) {
        return `"${media.name}" from show: "${_media.show}" ${_media.description != "" ? `. Description: ${_media.description}` : ""}`
    }
    else if (type === UserLibraryMedia.Playlists) {
        return `"${media.name}" by ${media.author} ${_media.description != "" ? `. Description: ${_media.description}` : ""}`
    }
    else if (type === UserLibraryMedia.Albums) {
        return `"${media.name}" by ${_media.author}`
    }

    return ""
}


/* Load */
export function hasUserSignedIn() {
    const hasData = localStorage.getItem("music-user-data") != null
    if (!hasData) {
        removeAppleMusicTokens()
        removeMusicPlayerData() 
        removeMusicShuffleData() 
    }
    return hasData
}

export function loadMusicUserData(): Partial<AppleMusicUserData | SpotifyMusicUserData> | null {
    if (!localStorage.getItem("music-user-data")) return null
    
    return JSON.parse(localStorage.getItem("music-user-data")!)
} 
export function loadMusicPlayerData(): MusicPlayer | null {
    if (!localStorage.getItem("music-player-data")) return null
    
    return JSON.parse(localStorage.getItem("music-player-data")!)
} 
export function loadMusicShuffleData(): MusicShufflerData {
    return JSON.parse(localStorage.getItem("music-shuffle-data")!)
}

/* Updates */

/**
 * Incorporates changes to currently-saved user data
 * @param userData   New data changes.
 */
export function saveMusicUserData(newState: AppleMusicUserData | SpotifyMusicUserData) {
    localStorage.setItem("music-user-data", JSON.stringify(newState))
}
export function saveMusicPlayerData(newState: MusicPlayer | SpotifyMusicPlayer) {
    localStorage.setItem("music-player-data", JSON.stringify(newState))
}
export function saveMusicShuffleData(shuffleData: MusicShufflerData) {
    return localStorage.setItem("music-shuffle-data", JSON.stringify(shuffleData))
}

/* Removals */
export function deleteMusicUserData(): void {
    localStorage.removeItem("music-user-data")
}
export function removeAppleMusicTokens() {
    localStorage.removeItem("music.y5xn9fm7bj.itua")
    localStorage.removeItem("music.y5xn9fm7bj.itre")
    localStorage.removeItem("music.y5xn9fm7bj.media-user-token")
    localStorage.removeItem("mk-player-tsid")
}
export function removeMusicPlayerData(): void {
    localStorage.removeItem("music-player-data")

}
export function removeMusicShuffleData(): void {
    localStorage.removeItem("music-shuffle-data")
}