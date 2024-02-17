
import { AppleMusicUserData } from "./music-apple-user-data"
import { APIErrorCode, MusicMediaType, MusicPlatform } from "./enums"
import { APIError } from "./errors"
import { didInitMusicUser, musicAPIErrorHandler, verifyForPlayerSession } from "./utils-music"

const ARTWORK_WIDTH = 400
const ARTWORK_LENGTH = 400

/**
 * Initializes Apple Music Data store and player if there was a session.
 * Called also when continuing a session or refreshing as session occurs.
 */
export async function initAppleMusic() {
    try {
        let musicData = new AppleMusicUserData()
        await musicData.initMusicData()
        await verifyForPlayerSession(MusicPlatform.AppleMusic)
    } 
    catch (error: any) { 
        musicAPIErrorHandler(new APIError(APIErrorCode.AUTHORIZATION_ERROR, "There was an error initializing Apple Music."))
        throw(error)
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
            throw throwAppleMusicAPIError(Number(reqRes.status), "")
        }

        const data = res.data
        const playlistData: Playlist[] = []
        const playlists = data.data

        for (let i = 0; i < playlists.length; i++) {
            const playlist = playlists[i];
            const attrs = playlist.attributes

            // if media has just been deleted, it can still appear breifly in the response but without some details
            if (attrs.name === undefined) continue

            const descriptionText = attrs?.description?.short ?? attrs?.description?.standard

            const playlistObj = {
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
            }
            
            playlistData.push(playlistObj)
        }

        return {
            items: playlistData,
            total: data.meta.total
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
            throw throwAppleMusicAPIError(Number(reqRes.status), "")
        }
        
        const data = res.data    
        const albums = data.data
        const _albums: Album[] = []

        for (let i = 0; i < albums.length; i++) {
            const album = albums[i];
            const attrs = album.attributes

            if (attrs.name === undefined) continue

            const albumObj = {
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
            }
            
            _albums.push(albumObj)
        }
        return {
            items: _albums,
            total: data.meta.total
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
            throw throwAppleMusicAPIError(Number(reqRes.status), "")
        }
        
        const data = res.data    
        const likedSongs = data.data
        const _likedSongs: Track[] = []
    
        for (let i = 0; i < likedSongs.length; i++) {
            const song = likedSongs[i];
            const attrs = song.attributes

            if (attrs.name === undefined) continue
    
            const songObj = {
                id: song.id,
                name: attrs.name,
                description: "",
                artworkImgSrc: attrs?.artwork ? getArtworkSrc(attrs.artwork) : "",
                author: attrs.artistName,
                authorUrl: "",
                genre: attrs.genreNames[0],
                url: `https://music.apple.com/library/song/${song.id}`,
                type: MusicMediaType.Track,
                fromLib: true,
                duration: attrs.durationInMillis, 
                album: "", albumId: "", songId: "", playlistId: "",
            }
            
            _likedSongs.push(songObj)
        }
    
        return {
            items: _likedSongs,
            total: data.meta.total
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
            throw throwAppleMusicAPIError(Number(reqRes.status), "")
        }
    
        const data = res.data
        console.log(res)
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
            throw throwAppleMusicAPIError(Number(reqRes.status), "")
        }
    
        const data = res.data
        const notes = data.data[0].attributes?.editorialNotes
        const descriptionText = notes.standard ?? notes.short ?? notes.tagline
    
    
        const radioStationData: RadioStation = {
            id: radioStationId,
            name: data.data[0].attributes.name,
            isLive: data.data[0].attributes.isLive,
            author: "",
            artworkImgSrc: data.data[0]?.attributes?.artwork ? getArtworkSrc(data.data[0].attributes.artwork) : "",
            description: descriptionText ?? "",
            genre: "",
            url: data.data[0].attributes.url,
            authorUrl: "", type: MusicMediaType.RadioStation,
            fromLib: true
        }
        return radioStationData
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
            throw throwAppleMusicAPIError(Number(reqRes.status), "")
        }
    
        const data = res.data
        const attrs = data.data[0].attributes
        const trackList: any[] = data.data[0].relationships.tracks.data
        const descriptionText = attrs?.editorialNotes?.short ?? attrs?.editorialNotes?.standard
    
        const albumData: Album = {
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
        return albumData
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
 * @param     error     Error context extracted from the API reesponse
 * @returns             API error with proper context using a code and message.
 */
export function throwAppleMusicAPIError(status: number, message: string) {
    if (status === 401 && message === "The access token expired") {
        throw new APIError(APIErrorCode.EXPIRED_TOKEN, "Token expired. Log in again to continue.")
    }
    else if (status === 404) {
        throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Requested media unavailable.")
    }
    else if (status === 429) {
        throw new APIError(APIErrorCode.RATE_LIMIT_HIT)
    }
    else if (message === "AUTHORIZATION_ERROR") {
        throw new APIError(APIErrorCode.AUTHORIZATION_ERROR)
    }
    else {
        throw new APIError(APIErrorCode.GENERAL, "There was an error with Spotify. Please try again later.")
    }
}