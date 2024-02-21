
import { AppleMusicUserData } from "./music-apple-user-data"
import { APIErrorCode, LogoIcon, MusicMediaType, MusicPlatform } from "./enums"
import { APIError } from "./errors"
import { didInitMusicUser, initMusicToast, musicAPIErrorHandler, verifyForPlayerSession } from "./utils-music"
import { MusicSettingsManager } from "./music-settings-manager"

const ARTWORK_WIDTH = 400
const ARTWORK_LENGTH = 400

/**
 * Initializes Apple Music Data store and player if there was a session.
 * Called also when continuing a session or refreshing as session occurs.
 */
export async function initAppleMusic() {
    try {
        const hasSignedIn = didInitMusicUser()
        const musicData = new AppleMusicUserData()
        await musicData.init()
        await verifyForPlayerSession(MusicPlatform.AppleMusic)

        if (hasSignedIn) {
            new MusicSettingsManager(MusicPlatform.AppleMusic)
        }
        else {
            initMusicToast(MusicPlatform.AppleMusic, "Log in Success!")
        }
    } 
    catch (error: any) { 
        musicAPIErrorHandler(new APIError(APIErrorCode.AUTHORIZATION_ERROR))
    }
}
/**
 * API Music GET request for fetching usverifyForPlayerSessioner library playlists.
    * 
 * @param   limit User playlist response limit
 * @param   offset   The next page or group of user playlists to fetch.
 * @returns          User playlists
 */
export async function getAppleMusicUserPlaylists (limit: number, offset: number): Promise<{ items: Playlist[], total: number }> {
    try {
        // @ts-ignore
        const music = MusicKit.getInstance()
        await music.authorize()

        const res = await music.api.music('v1/me/library/playlists', { limit, offset })
        const reqRes = res.response

        if (!reqRes.ok) {
            console.error(`Error fetching user playlists. \n URL: ${reqRes.url} \n Status: ${reqRes.status}`)
            throw throwAppleMusicAPIError(Number(reqRes.status))
        }

        const playlistData = res.data.data
        const playlists: Playlist[] = []

        for (let playlist of playlistData) {
            const attrs = playlist.attributes

            // if media has just been deleted, it can still appear breifly in the response but without some details
            if (attrs.name === undefined) continue

            const descriptionText = attrs?.description?.short ?? attrs?.description?.standard
            playlists.push({
                id: attrs.playParams.id,
                name: attrs.name,
                description: descriptionText ?? "No Description.",
                artworkImgSrc: attrs?.artwork ? getArtworkSrc(attrs.artwork) : "",
                author: "My Library",
                authorUrl: "",
                genre: "",
                length: -1,
                url: `https://music.apple.com/library/playlist/${playlist.id}`,
                type: MusicMediaType.Playlist,
                fromLib: true
            })
        }

        return {
            items: playlists,
            total: res.data.meta.total
        }
    }
    catch (error: any) {
        console.error(error)
        throw error instanceof APIError ? error : throwMusicKitError(error)
    }
}
/**
 * API Music GET request for fetching user library playlists.
    * 
 * @param   limit User playlist response limit
 * @param   offset   The next page or group of user playlists to fetch.
 * @returns          User playlists
 */
export async function getAppleMusicUserAlbums (limit: number, offset: number): Promise<{ items: Album[], total: number }> {
    try {
        // @ts-ignore
        const music = MusicKit.getInstance()
        await music.authorize()
        
        const res = await music.api.music('v1/me/library/albums', { limit, offset })
        const reqRes = res.response

        if (!reqRes.ok) {
            console.error(`Error fetching user playlists. \n URL: ${reqRes.url} \n Status: ${reqRes.status}`)
            throw throwAppleMusicAPIError(Number(reqRes.status))
        }
        
        const albumsData = res.data.data
        const albums: Album[] = []

        for (let album of albumsData) {
            const attrs = album.attributes
            if (attrs.name === undefined) continue
            
            albums.push({
                id: attrs.playParams.id,
                name: attrs.name,
                description: "",
                artworkImgSrc: attrs?.artwork ? getArtworkSrc(attrs.artwork) : "",
                author: attrs.artistName,
                authorUrl: "",
                genre: attrs.genreNames[0],
                length: -1,
                url: `https://music.apple.com/library/albums/${album.id}`,
                type: MusicMediaType.Album,
                fromLib: true
            })
        }
        return {
            items: albums,
            total: res.data.meta.total
        }
    }
    catch (error: any) {
        console.error(error)
        throw error instanceof APIError ? error : throwMusicKitError(error)
    }
}

/**
 * API Music GET request for fetching user library playlists.
    * 
 * @param   limit User playlist response limit
 * @param   offset   The next page or group of user playlists to fetch.
 * @returns          User playlists
 */
export async function getAppleMusicUserLikedTracks (limit: number, offset: number): Promise<{ items: Track[], total: number }> {
    try {
        // @ts-ignore
        const music = MusicKit.getInstance()
        await music.authorize()
        
        const res = await music.api.music('v1/me/library/songs', { limit, offset })
        const reqRes = res.response
    
        if (!reqRes.ok) {
            console.error(`Error fetching user playlists. \n URL: ${reqRes.url} \n Status: ${reqRes.status}`)
            throw throwAppleMusicAPIError(Number(reqRes.status))
        }
        
        const songsData = res.data.data
        const songs: Track[] = []
    
        for (let song of songsData) {
            const attrs = song.attributes
            if (attrs.name === undefined) continue
        
            songs.push({
                id: song.id,
                name: attrs.name,
                artworkImgSrc: attrs?.artwork ? getArtworkSrc(attrs.artwork) : "",
                author: attrs.artistName,
                authorUrl: "",
                genre: attrs.genreNames[0],
                url: `https://music.apple.com/library/song/${song.id}`,
                type: MusicMediaType.Track,
                fromLib: true,
                duration: attrs.durationInMillis, 
                album: "", albumId: "", playlistId: "",
            })
        }
    
        return {
            items: songs,
            total: res.data.meta.total
        }
    }
    catch (error: any) {
        console.error(error)
        throw error instanceof APIError ? error : throwMusicKitError(error)
    }
}

/**
 * Fetches playlist details.
 * 
 * @param playlistId  
 * @param token       Acess / Dev token.
 * @returns           Collection of user's playlists from their library
 */
export async function getApplePlaylistDetails(playlistId: string): Promise<Playlist>  {
    try {
        // @ts-ignore
        const music = MusicKit.getInstance()
        await music.authorize()
        
        const res = await music.api.music(`v1/catalog/us/playlists/${playlistId}`, { l: 'en-us' })
        const reqRes = res.response
        
        if (!reqRes.ok) {
            console.error(`Error fetching playlist details. \n URL: ${reqRes.url} \n Status: ${reqRes.status}`)
            throw throwAppleMusicAPIError(Number(reqRes.status))
        }
    
        const data = res.data
        const trackList: any[] = data.data[0].relationships.tracks.data
        const descriptionText = data.data[0].attributes?.description?.short ?? data.data[0].attributes?.description?.standard
    
        let mediaUrl = data.data[0].attributes.url
    
        const playlistData: Playlist = {
            id: playlistId,
            name: data.data[0].attributes.name,
            author: data.data[0].attributes.curatorName,
            artworkImgSrc: data.data[0]?.attributes?.artwork ? getArtworkSrc(data.data[0].attributes.artwork) : "",
            length: trackList.length,
            description: descriptionText ?? "",
            genre: "",
            url: mediaUrl,
            authorUrl: "", 
            type: MusicMediaType.Playlist,
            fromLib: true
        }
        return playlistData
    }
    catch (error: any) {
        console.error(error)
        throw error instanceof APIError ? error : throwMusicKitError(error)
    }
}

/**
 * Fetches album details. 
 * 
 * @param albumId  
 * @param token       Acess / Dev token.
 * @returns           Collection of user's playlists from their library
 */
export async function getRadioStationDetails(radioStationId: string): Promise<RadioStation> {
    try {
        // @ts-ignore
        const music = MusicKit.getInstance()
        await music.authorize()
        
        const res = await music.api.music(`v1/catalog/us/stations/${radioStationId}`, { l: 'en-us' })
        const reqRes = res.response
        
        if (!reqRes.ok) {
            console.error(`Error fetching radio station details. \n URL: ${reqRes.url} \n Status: ${reqRes.status}`)
            throw throwAppleMusicAPIError(Number(reqRes.status))
        }
    
        const item = res.data.data[0]
        const notes = item.attributes?.editorialNotes
        const descriptionText = notes.standard ?? notes.short ?? notes.tagline
    
        return {
            id: radioStationId,
            name: item.attributes.name,
            isLive: item.attributes.isLive,
            author: "",
            artworkImgSrc: item?.attributes?.artwork ? getArtworkSrc(item.attributes.artwork) : "",
            description: descriptionText ?? "",
            genre: "",
            url: item.attributes.url,
            authorUrl: "", type: MusicMediaType.RadioStation,
            fromLib: true
        }
    }
    catch(error: any) {
        console.error(error)
        throw error instanceof APIError ? error : throwMusicKitError(error)
    }
}

/**
 * Fetches album details. 
 * 
 * @param albumId  
 * @param token       Acess / Dev token.
 * @returns           Collection of user's playlists from their library
 */
export async function getAppleAlbumDetails (albumId: string): Promise<Album>  {
    try {
        // @ts-ignore
        const music = MusicKit.getInstance()
        await music.authorize()
        
        const res = await music.api.music(`v1/catalog/us/albums/${albumId}`, { l: 'en-us' })
        const reqRes = res.response
        
        if (!reqRes.ok) {
            console.error(`Error fetching album details. \n URL: ${reqRes.url} \n Status: ${reqRes.status}`)
            throw throwAppleMusicAPIError(Number(reqRes.status))
        }
    
        const data = res.data
        const attrs = data.data[0].attributes
        const trackList: any[] = data.data[0].relationships.tracks.data
        const descriptionText = attrs?.editorialNotes?.short ?? attrs?.editorialNotes?.standard
    
        return {
            id: albumId,
            name: attrs.name,
            author: attrs.artistName,
            artworkImgSrc: data.data[0]?.attributes?.artwork ? getArtworkSrc(attrs.artwork) : "",
            length: trackList.length,
            description: descriptionText ?? "",
            genre: attrs.genreNames[0],
            url: attrs.url,
            authorUrl: attrs.artistUrl, type: MusicMediaType.Album,
            fromLib: true
        }
    }
    catch(error: any) {
        console.error(error)
        throw error instanceof APIError ? error : throwMusicKitError(error)
    }
}

export async function getLibTrackItem(idx: number): Promise<Track> {
    return (await getAppleMusicUserLikedTracks(1, idx)).items[0]
}

/**
 * Checks to see if a collection is an album or playlist.
 * An album id has only numbers while playlist id starts with a "pl.""
 * 
 * @param collectionId  An apple music collection object either has a playlist id or album id. 
 * @returns 
 */
export function isCollectionPlaylist(collectionId: string) {
    return collectionId.includes("pl.")
}

/**
 * Returns a formatted artwork URL.
 * 
 * @returns 
 */
export function getArtworkSrc(artwork: any) {
    try {
        // @ts-ignore
        return MusicKit.formatArtworkURL(artwork, ARTWORK_WIDTH, ARTWORK_LENGTH)
    }
    catch {
        return ""
    }
}

/**
 * Handler for errors that occurs when working withe Music Kit. Also catches error that are not from Music Kit.
 * Example Musict Kit error content;
 * "CONTENT_UNAVAILABLE: No item data is available for the current media queue"
 * 
 * Music Kit Errors: https://js-cdn.music.apple.com/musickit/v3/docs/index.html?path=/docs/reference-javascript-mkerror--page
 * 
 * @param error 
 * @returns 
 */
export function throwMusicKitError(error: any) {
    const errorStrArr = error.toString().split(":")

    // error message can be a status token
    const msg = errorStrArr.length === 2 && errorStrArr[1].length > 1 ? errorStrArr[1] : "Player error. Refresh the page or play a different item."
    
    return new APIError(APIErrorCode.PLAYER, msg)
}

/**
 * Get the right error object to throw after a failed interaction with the a Spotify Music API.
 * Error message shown as a toast is handled by the error handler.
 * 
 * Apple Music API Errors: https://developer.apple.com/documentation/applemusicapi/common_objects/http_status_codes
 * 
 * @param  error Error context extracted from the API reesponse
 * @returns    API error with proper context using a code and message.
 */
export function throwAppleMusicAPIError(status: number) {
    if (status === 401) {
        throw new APIError(APIErrorCode.AUTHORIZATION_ERROR, "Invalid Credentials.")
    }
    else if (status === 404) {
        throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Requested media unavailable.")
    }
    else if (status === 429) {
        throw new APIError(APIErrorCode.RATE_LIMIT_HIT)
    }
    else {
        throw new APIError(APIErrorCode.GENERAL, "There was an error with Spotify. Please try again later.")
    }
}