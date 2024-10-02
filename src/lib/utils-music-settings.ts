import { get } from "svelte/store"
import { acousticCollections, podcastCollections, sereneCollections, soundtrackCollections, upbeatCollections, zenCollections } from "./data-music-collections"
import { MusicMediaType, MusicPlatform, UserLibraryMedia } from "./enums"
import { MusicSettingsManager } from "./music-settings-manager"
import { musicSettingsManager } from "./store"

export function initMusicSettings(platform = MusicPlatform.YoutubeMusic) {
    if (platform === undefined) return

    const manager = new MusicSettingsManager()
    const store = get(musicSettingsManager)

    store!.updateLibrary()
    store!.discoverTabBtnClicked("serene")

    return manager
}

/**
 * Requests for more discover media items once scrolled down far enough.
 * @param event   Scroll Event
 */
export async function discoverPlsPaginationScrollHandler(event: Event) {
    const list = event.target as HTMLElement
    // const [hasReachedEnd] = getScrollStatus(list)
    
    // if (!hasReachedEnd) return

    // try {
    //     // hasCollectionItemsLoaded = false
    //     // await: fetch more discover media lists
    //     // hasCollectionItemsLoaded = true
    // }
    // catch(error: any) {
    //     musicAPIErrorHandler(error)
    // }
}

/**
 * Returns the music media items under a discover / mood category based on the current platform.
 * 
 * @param   discoverCategory   Category clicked
 * @param   platformProp       MusicPlatform in object property, used to index for that platform's collection
 * @returns                    Music media items under given mood category for a specific platform.
 */
export function getDiscoverCollectionList(discoverCategory: MusicCollectionGroup, platformProp: MusicPlatformPropNames): MediaCollection[] {
    switch (discoverCategory) {
        case "serene":
            return sereneCollections[platformProp]
        case "upbeat":
            return upbeatCollections[platformProp]
        case "soundtracks":
            return soundtrackCollections[platformProp]
        case "acoustic":
            return acousticCollections[platformProp]
        case "zen":
            return zenCollections[platformProp]
        default:
            return podcastCollections[platformProp]
    }
}

/**
 * @param media 
 * @returns     Get media description.
 */
export function getMediaDescription(media: Media): string {
    const _media: any = media

    if ("description" in media) {
        return _media.description ?? ""
    }

    return ""
}

export function getArtworkCredit(artwork: string | { url: string, artist: string }) {
    const _artwork: any = artwork

    if (typeof artwork === "string") {
        return ""
    }
    else {
        return _artwork.artist
    }
}

/**
 * @param media 
 * @returns     Get media description.
 */
export function getMediaImgSrc(artwork: string | { url: string, artist: string }): string {
    const _artwork: any = artwork

    if (typeof artwork === "string") {
        return artwork as string
    }
    else {
        return _artwork.url
    }
}

/**
 * @param media 
 * @returns     Get media description.
 */
export function getMediaTypeStr(type: MusicMediaType): string {
    if (type === MusicMediaType.SavedAudioBooks) {
        return "My Audiobooks"
    }
    else if (type === MusicMediaType.SavedTracks) {
        return "Liked Tracks"
    }
    else if (type === MusicMediaType.SavedEpisodes) {
        return "My Episodes"
    }
    else {
        return MusicMediaType[type]
    }
}

/**
 * @param media 
 * @returns     Get the number of items of a collection
 */
export function getMediaLength(media: Media): string {
    const _media: any = media

    if ("length" in media) {
        const length = _media.length
        return length > 100 ? "100+" : length + ""
    }

    return "100+"
}

/**
 * @param media 
 * @param type   Media type
 * @returns      Get an item's media info (author, album, description, etc.) to be displayed in the subtitle.
 */
export function getMediaItemInfo(media: Media, type: UserLibraryMedia): any {
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

/**
 * @param media 
 * @param type   M edia type
 * @returns      Get an item's 
 */
export function getMediaContext(media: Media, type: UserLibraryMedia) {
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
