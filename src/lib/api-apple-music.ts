
import { AppleMusicUserData } from "./music-apple-user-data"
import { APIErrorCode, MusicAPIErrorContext, MusicMediaType, MusicPlatform } from "./enums"
import { APIError, ExpiredTokenError } from "./errors"
import { loadMusicPlayerData, musicAPIErrorHandler, removeAppleMusicTokens } from "./utils-music"
import { SpotifyMusicPlayer } from "./music-spotify-player"
import { get } from "svelte/store"
import { musicPlayerStore } from "./store"
import { AppleMusicPlayer } from "./music-apple-player"

const ARTWORK_WIDTH = 400
const ARTWORK_LENGTH = 400

/**
 * Initializes Apple Music Data & Music Player.
 * Called also when continuing a session or refreshing as session occurs.
 * 
 * @throws {APIError}            Error from Music Kit Configuration
 * @throws {AuthorizationError}  Error from Music Kit authorization step.
 * @throws {AppServerError}      Error fetching token from app server.
 */
export async function initAppleMusic() {
    try {
        let musicData = new AppleMusicUserData()
        await musicData.initMusicData()
        
        verifyForPlayerSession()
    } 
    catch (error: any) { 
        musicAPIErrorHandler(new APIError(APIErrorCode.AUTHORIZATION_ERROR, "There was an error initializing Apple Music."))
        throw(error)
    }
}


export function verifyForPlayerSession() {
    const playerData = loadMusicPlayerData()

    // if (playerData?.currentIdx === undefined) {
    //     removeMusicPlayerData()
    // }

    // const didHaveSession = playerData != null && playerData.currentIdx != undefined

    if (playerData) {
        initAppleMusicPlayer() 
    }
}


export async function initAppleMusicPlayer() {
    new AppleMusicPlayer()
    const player = get(musicPlayerStore)! as AppleMusicPlayer
    await player.initAppleMusicPlayer()
}

/**
 * Handler for when an media item has been clicked to be played
 * @param media   
 * @param idx   
 */
export async function handleAppleMusicyMediaItemClicked(collectionContext: MediaClickedContext) {
    try {
        let appleMusicPlayer = get(musicPlayerStore)
        
        if (!appleMusicPlayer) {
            await initAppleMusicPlayer()
            appleMusicPlayer = get(musicPlayerStore) 
        }
        await appleMusicPlayer!.updateMediaCollection(collectionContext)
        appleMusicPlayer!.loadCurrentItem(true)
    }
    catch(error: any) {
        if (error.code != undefined && error.code === APIErrorCode.PLAYER) {
            musicAPIErrorHandler(error)
        }
    }
}


/**
 * API Music GET request for fetching user library playlists.
    * 
 * @param   reqLimit User playlist response limit
 * @param   offSet   The next page or group of user playlists to fetch.
 * @returns          User playlists
 */
export async function getAppleMusicUserPlaylists (reqLimit: number, offSet: number, tokens: { accessToken: string, userToken: string}): Promise<{ items: Playlist[], total: number }> {
    const url = `https://api.music.apple.com/v1/me/library/playlists?limit=${reqLimit}&offset=${offSet}`
    const headers = {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Music-User-Token': `${tokens.userToken}`,
    }

    const res = await fetch(url, {method: 'GET', headers: headers })
    const data = await res.json()
    
    if (!res.ok) {
        const status = data.errors[0].status
        const message = data.errors[0].detail
        console.error(`Error fetching user playlists. \n URL: ${res.url} \n Status: ${status} \n Details: ${message}.`)
        throw throwAppleMusicAPIError(Number(status), `${message}`)
    }
    
    const playlistData: Playlist[] = []
    const playlists = data.data

    console.log(data)

    for (let i = 0; i < playlists.length; i++) {
        const playlist = playlists[i];
        const descriptionText = playlist.attributes?.description?.short ?? playlist.attributes?.description?.standard

        const playlistObj = {
            id: playlist.attributes.playParams.id,
            name: playlist.attributes.name,
            description: descriptionText ?? "No Description.",
            artworkImgSrc: playlist.attributes?.artwork ? getArtworkSrc(playlist.attributes.artwork) : "",
            author: "My Library",
            authorUrl: "",
            genre: "",
            length: 0,
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
/**
 * API Music GET request for fetching user library playlists.
    * 
 * @param   reqLimit User playlist response limit
 * @param   offSet   The next page or group of user playlists to fetch.
 * @returns          User playlists
 */
export async function getAppleMusicUserAlbums (reqLimit: number, offSet: number, tokens: { accessToken: string, userToken: string}): Promise<{ items: Album[], total: number }> {
    const url = `https://api.music.apple.com/v1/me/library/albums?limit=${reqLimit}&offset=${offSet}`
    const headers = {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Music-User-Token': `${tokens.userToken}`,
    }

    const res = await fetch(url, {method: 'GET', headers: headers })
    const data = await res.json()
    
    if (!res.ok) {
        console.error(`Error fetching user playlists. Details: ${data.errors[0].detail}. Status: ${data.errors[0].status}.`)
        throw throwAppleMusicAPIError(Number(data.errors[0].status), data.errors[0].detail)
    }

    console.log(data)
    
    const albums = data.data
    const _albums: Album[] = []

    for (let i = 0; i < albums.length; i++) {
        const album = albums[i];
        const attrs = album.attributes

        const albumObj = {
            id: attrs.playParams.id,
            name: attrs.name,
            description: "",
            artworkImgSrc: attrs?.artwork ? getArtworkSrc(attrs.artwork) : "",
            author: attrs.artistName,
            authorUrl: "",
            genre: attrs.genreNames[0],
            length: 0,
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

/**
 * API Music GET request for fetching user library playlists.
    * 
 * @param   reqLimit User playlist response limit
 * @param   offSet   The next page or group of user playlists to fetch.
 * @returns          User playlists
 */
export async function getAppleMusicUserLikedTracks (reqLimit: number, offSet: number, tokens: { accessToken: string, userToken: string}): Promise<{ items: Track[], total: number }> {
    const url = `https://api.music.apple.com/v1/me/library/songs?limit=${reqLimit}&offset=${offSet}`
    const headers = {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Music-User-Token': `${tokens.userToken}`,
    }

    const res = await fetch(url, {method: 'GET', headers: headers })
    const data = await res.json()
    
    if (!res.ok) {
        const status = data.errors[0].status
        const message = data.errors[0].detail
        console.error(`Error fetching user playlists. \n URL: ${res.url} \n Status: ${status} \n Details: ${message}.`)
        throw throwAppleMusicAPIError(Number(status), `${message}`)
    }
    
    const likedSongs = data.data
    const _likedSongs: Track[] = []

    console.log(data)

    for (let i = 0; i < likedSongs.length; i++) {
        const song = likedSongs[i];
        const attrs = song.attributes

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

/**
 * Fetches playlist details.
 * 
 * @param playlistId  
 * @param token       Acess / Dev token.
 * @returns           Collection of user's playlists from their library
 * 
 * @throws {APIError}               Error interacting with Apple Music Kit API.
 * @throws {ExpiredTokenError}      Fetch for playlist failed due to expired token.
 * @throws {ResourceNotFoundError}  If requested playlist does not exist.
 */
export async function getApplePlaylistDetails (playlistId: string, token: string): Promise<Playlist>  {
    const url = `https://api.music.apple.com/v1/catalog/us/playlists/${playlistId}`
    const options = { method: 'GET', headers: { 'Authorization': "Bearer " + token } }

    const res = await fetch(url, options)
    const data = await res.json()
    
    if (!res.ok) { 
        const status = data.errors[0].status
        const message = data.errors[0].detail
        console.error(`Error fetching user playlists. \n URL: ${res.url} \n Status: ${status} \n Details: ${message}.`)
        throw throwAppleMusicAPIError(Number(status), `${message}`)
    }

    const trackList: any[] = data.data[0].relationships.tracks.data
    const descriptionText = data.data[0].attributes?.description?.short ?? data.data[0].attributes?.description?.standard
    console.log(data)

    const href = data.data[0].href
    let mediaUrl = ""

    // a use library playlist
    if (href.includes("pl.u")) {
        mediaUrl = `library/playlist/${playlistId}`
    }
    else {
        mediaUrl = data.data[0].attributes.url
    }

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

/**
 * Fetches album details. 
 * 
 * @param albumId  
 * @param token       Acess / Dev token.
 * @returns           Collection of user's playlists from their library
 * 
 * @throws {APIError}               Error interacting with Apple Music Kit API.
 * @throws {ExpiredTokenError}      Fetch for album failed due to expired token.
 * @throws {ResourceNotFoundError}  If requested album does not exist.
 */
export async function getRadioStationDetails(radioStationId: string, token: string): Promise<RadioStation> {
    const url = `https://api.music.apple.com/v1/catalog/us/stations/${radioStationId}`
    const options = { method: 'GET', headers: { 'Authorization': "Bearer " + token } }

    const res = await fetch(url, options)
    const data = await res.json()
    
    if (!res.ok) { 
        const status = data.errors[0].status
        const message = data.errors[0].detail
        console.error(`Error fetching user playlists. \n URL: ${res.url} \n Status: ${status} \n Details: ${message}.`)
        throw throwAppleMusicAPIError(Number(status), `${message}`)
    }
    
    const notes = data.data[0].attributes?.editorialNotes
    const descriptionText = notes.standard ?? notes.short ?? notes.tagline
    console.log(data)

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

/**
 * Fetches album details. 
 * 
 * @param albumId  
 * @param token       Acess / Dev token.
 * @returns           Collection of user's playlists from their library
 * 
 * @throws {APIError}               Error interacting with Apple Music Kit API.
 * @throws {ExpiredTokenError}      Fetch for album failed due to expired token.
 * @throws {ResourceNotFoundError}  If requested album does not exist.
 */
export async function getAppleAlbumDetails (albumId: string, token: string): Promise<Album>  {
    const url = `https://api.music.apple.com/v1/catalog/us/albums/${albumId}?extend=artistUrl`
    const options = { method: 'GET', headers: { 'Authorization': "Bearer " + token } }

    const res = await fetch(url, options)
    const data = await res.json()
    
    if (!res.ok) { 
        const status = data.errors[0].status
        const message = data.errors[0].detail
        console.error(`Error fetching user playlists. \n URL: ${res.url} \n Status: ${status} \n Details: ${message}.`)
        throw throwAppleMusicAPIError(Number(status), `${message}`)
    }
    
    
    console.log(data)
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


/**
 * API Music GET request for fetching user library playlists.
    * 
 * @param   reqLimit User playlist response limit
 * @param   offSet   The next page or group of user playlists to fetch.
 * @returns          User playlists
 */
export async function getArtistDeteails (artistId: string, tokens: { accessToken: string, userToken: string }):
     Promise<{ name: string, id: string, songIds: string[] }> 
{
    const url = `https://api.music.apple.com/v1/catalog/us/artists/${artistId}?views=top-songs`
    const headers = {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Music-User-Token': `${tokens.userToken}`,
    }

    const res = await fetch(url, {method: 'GET', headers: headers })
    const data = await res.json()
    
    if (!res.ok) {
        const status = data.errors[0].status
        const message = data.errors[0].detail
        console.error(`Error fetching user playlists. \n URL: ${res.url} \n Status: ${status} \n Details: ${message}.`)
        throw throwAppleMusicAPIError(Number(status), `${message}`)
    }
    
    console.log(data)
    const songIds: string[] = []
    const attrs = data.attributes
    const topSongs = data.data.views["top-songs"].data
    
    for (let i = 0; i < topSongs.length; i++) {
        songIds.push(topSongs[i].id)
    }

    return {
        name: attrs.name, id: data.id, songIds
    }
}

export async function getArtistTopSongs (artistId: string, offset: number, accessToken: string ): Promise<string[]> {
    const url = `https://api.music.apple.com/v1/catalog/us/artists/${artistId}/view/top-songs?offset=${offset}`
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
    }

    const res = await fetch(url, { method: 'GET', headers: headers })
    const data = await res.json()
    
    if (!res.ok) {
        const status = data.errors[0].status
        const message = data.errors[0].detail
        console.error(`Error fetching user playlists. \n URL: ${res.url} \n Status: ${status} \n Details: ${message}.`)
        throw throwAppleMusicAPIError(Number(status), `${message}`)
    }
    
    console.log(data)
    const songIds: string[] = []
    const topSongs = data
    
    for (let i = 0; i < topSongs.length; i++) {
        songIds.push(topSongs[i].id)
    }

    return songIds
}

export async function getLibTrackItem(idx: number, tokens: { accessToken: string, userToken: string}): Promise<Track> {
    return (await getAppleMusicUserLikedTracks(1, idx, tokens)).items[0]
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