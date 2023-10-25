import { AppleMusicPlayer } from "./music-apple-player"
import { AppleMusicUserData } from "./music-apple-user-data"
import { MusicAPIErrorContext } from "./enums"
import { getMusicAPIError } from "./utils-music"
import { ExpiredTokenError } from "./errors"

const ARTWORK_WIDTH = 400
const ARTWORK_LENGTH = 400

/**
 * Initializes Apple Music Data & Music Player.
 * Called also when continuing a session or refreshing as session occurs.
 * 
 * @param  isUserLoggedIn   If user has already logged in.
 * @throws {APIError}            Error from Music Kit Configuration
 * @throws {AuthorizationError}  Error from Music Kit authorization step.
 * @throws {AppServerError}      Error fetching token from app server.
 */
export const initAppleMusic = async (isUserLoggedIn = false) => {
    let musicData = null
    let musicPlayer = null

    try {
        musicData = new AppleMusicUserData(isUserLoggedIn)
        await musicData.initMusicData()

        musicPlayer = new AppleMusicPlayer(isUserLoggedIn)
    } 
    catch (error: any) { 
        if (!(error instanceof ExpiredTokenError)) {
            musicData?.quit()
            musicPlayer?.quitPlayer()
        }
        throw(error)
    }
}

/**
 * API Music GET request for fetching user library playlists.
 * 
 * @param   reqLimit User playlist response limit
 * @param   offSet   The next page or group of user playlists to fetch.
 * @returns          User playlists
 * @throws {APIError}           Error interacting with Apple Music Kit API.
 * @throws {ExpiredTokenError}  Fetch for user playlists failed due to expired token.
 */
export const getUserPlaylists = async (reqLimit: number, offSet: number, tokens: { accessToken: string, userToken: string}): Promise<MusicCollection[]> => {
    const url = `https://api.music.apple.com/v1/me/library/playlists?limit=${reqLimit}&offset=${offSet}`
    const headers = {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Music-User-Token': `${tokens.userToken}`,
    }

    const res = await fetch(url, {method: 'GET', headers: headers })
    const data = await res.json()
    
    if (!res.ok) {
        console.error(`Error fetching user playlists. Error: ${data.errors[0]}`)
        throw getMusicAPIError(data.errors[0].status, MusicAPIErrorContext.USER_PLAYLISTS)
    }
    
    const playlistData = []
    const playlists = data.data

    for (let i = 0; i < playlists.length; i++) {
        const playlist = playlists[i];
        const descriptionText = playlist.attributes?.description?.short ?? playlist.attributes?.description?.standard

        const playlistObj = {
            id: playlist.attributes.playParams.globalId,
            name: playlist.attributes.name,
            description: descriptionText ?? "No Description.",
            artworkImgSrc: playlist.attributes?.artwork ? getArtworkSrc(playlist.attributes.artwork) : "",
            author: "My Library",
            genre: "",
            songCount: 0,
            type: "Playlist",
            url: `https://music.apple.com/library/playlist/${playlist.id}`
        };
        
        playlistData.push(playlistObj)
    }

    return playlistData
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
export const getApplePlaylistDetails = async (playlistId: string, token: string): Promise<MusicCollection>  => {
    const url = `https://api.music.apple.com/v1/catalog/us/playlists/${playlistId}`
    const options = { method: 'GET', headers: { 'Authorization': "Bearer " + token } }

    const res = await fetch(url, options)
    const data = await res.json()
    
    if (!res.ok) { 
        console.error(`Error fetching playlist details. Details: ${data.errors[0]}.`)
        throw getMusicAPIError(data.errors[0].status, MusicAPIErrorContext.PLAYLIST)
    }

    const trackList: any[] = data.data[0].relationships.tracks.data
    const descriptionText = data.data[0].attributes?.description?.short ?? data.data[0].attributes?.description?.standard

    const href = data.data[0].href
    let mediaUrl = ""

    if (href.includes("pl.u")) {
        mediaUrl = `library/playlist/${playlistId}`
    }
    else {
        mediaUrl = data.data[0].attributes.url
    }

    const playlistData: MusicCollection = {
        id: playlistId,
        name: data.data[0].attributes.name,
        author: data.data[0].attributes.curatorName,
        artworkImgSrc: data.data[0]?.attributes?.artwork ? getArtworkSrc(data.data[0].attributes.artwork) : "",
        songCount: trackList.length,
        description: descriptionText ?? "",
        type: "Playlist",
        genre: "",
        url: mediaUrl
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
export const getAppleAlbumDetails = async (albumId: string, token: string): Promise<MusicCollection>  => {
    const url = `https://api.music.apple.com/v1/catalog/us/albums/${albumId}`
    const options = { method: 'GET', headers: { 'Authorization': "Bearer " + token } }

    const res = await fetch(url, options)
    const data = await res.json()
    
    if (!res.ok) { 
        console.error(`Error fetching playlist details. Details: ${data.errors[0]}.`)
        throw getMusicAPIError(data.errors[0].status, MusicAPIErrorContext.PLAYLIST)
    }
    

    const trackList: any[] = data.data[0].relationships.tracks.data
    const descriptionText = data.data[0].attributes?.description?.short ?? data.data[0].attributes?.description?.standard

    const playlistData: MusicCollection = {
        id: albumId,
        name: data.data[0].attributes.name,
        author: data.data[0].attributes.artistName,
        artworkImgSrc: data.data[0]?.attributes?.artwork ? getArtworkSrc(data.data[0].attributes.artwork) : "",
        songCount: trackList.length,
        description: descriptionText ?? "",
        type: "Album",
        genre: data.data[0].attributes.genreNames[0],
        url: data.data[0].attributes.url
    }
    return playlistData
}

/**
 * Checks to see if a collection is an album or playlist.
 * An album id has only numbers while playlist id starts with a "pl.""
 * 
 * @param collectionId  An apple music collection object either has a playlist id or album id. 
 * @returns 
 */
export const isCollectionPlaylist = (collectionId: string) => {
    return collectionId.includes("pl.")
}

/**
 * Returns a formatted artwork URL.
 * 
 * @returns 
 */
export const getArtworkSrc = (artwork: any) => {
    try {
        // @ts-ignore
        return MusicKit.formatArtworkURL(artwork, ARTWORK_WIDTH, ARTWORK_LENGTH)
    }
    catch {
        return ""
    }
}