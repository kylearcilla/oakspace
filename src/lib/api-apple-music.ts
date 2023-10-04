import { AppleMusicPlayer } from "./music-apple-player"
import { MusicData } from "./music-data-apple"
import { MusicPlatform } from "./enums"
import { getAccessToken, getAppleAuthToken } from "./utils-music"

/**
 * Initializes Apple Music Data & Music Player.
 * Makes new instances of apple music data and player stores.
 * Handles init errors / expired tokens erros for all music.
 * Called when user logs into Apple Music the first time.
 * Called also when a refresh occurs.
 * 
 * @param  isUserLoggedIn   If user has already logged in.
 * @throws {Error}          Error in initializing music data / player.
 */
export const initAppleMusicState = async (isUserLoggedIn = false) => {
    let musicData: MusicData

    try {
        musicData = new MusicData()
        await musicData.initMusicData(MusicPlatform.AppleMusic, isUserLoggedIn)
        
        new AppleMusicPlayer(musicData)
    } 
    catch (errorCode: any) { 
        // do not quit during expired token case, user should still be logged in
        if (!isUserLoggedIn) {
            musicData!.quit()
            musicData!.clearPlayerDataAfterLogIn()
        }
        throw(errorCode)
    }
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
 * API Music GET request for fetching user library playlists.
 * 
 * @param            reqLimit     User playlist response limit
 * @param            offSet       The next page or group of user playlists to fetch.
 * @returns 
 * @throws {Error}   Error in fetch operation.
 */
export const getUserPlaylists = async (reqLimit: number, offSet: number): Promise<MusicCollection[]> => {
    const url = `https://api.music.apple.com/v1/me/library/playlists?limit=${reqLimit}&offset=${offSet}`
    const headers = {
        'Authorization': `Bearer ${getAccessToken()}`,
        'Music-User-Token': `${getAppleAuthToken()}`,
    }

    const res = await fetch(url, {method: 'GET', headers: headers })
    const playlistData = []

    if (!res.ok) {
        console.error("Error fetching user playlists.")
        throw (res.status)
    }

    const data = await res.json()
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
 * Fetches playlist details for a user playlists only. 
 * Discover collection details are hardcoded in the back end so no API request needed.
 * 
 * @param playlistId  
 * @param token       Acess / Dev token.
 * @returns           Collection of user's playlists from their library
 * @throws            Error status from request.
 */
export const getApplePlaylistDetails = async (playlistId: string, token: string): Promise<MusicCollection>  => {
    const url = `https://api.music.apple.com/v1/catalog/us/playlists/${playlistId}`
    const options = { method: 'GET', headers: { 'Authorization': "Bearer " + token } }

    const res = await fetch(url, options)
    if (!res.ok) { 
        console.error(`Error fetching playlist details. Status: ${res.status} Status Text: ${res.statusText}`)
        throw (res.status)
    }

    const data = await res.json()

    const trackList: any[] = data.data[0].relationships.tracks.data
    const descriptionText = data.data[0].attributes?.description?.short ?? data.data[0].attributes?.description?.standard

    const playlistData: MusicCollection = {
        id: playlistId,
        name: data.data[0].attributes.name,
        author: data.data[0].attributes.curatorName,
        artworkImgSrc: data.data[0]?.attributes?.artwork ? getArtworkSrc(data.data[0].attributes.artwork) : "",
        songCount: trackList.length,
        description: descriptionText ?? "No Description",
        type: "Playlist",
        genre: "",
        url: `https://music.apple.com/library/playlist/${playlistId}`
    }
    return playlistData
}

/**
 * Returns a formatted artwork URL.
 * 
 * @returns 
 */
export const getArtworkSrc = (artwork: any) => {
    try {
        // @ts-ignore
        return MusicKit.formatArtworkURL(artwork, 200, 200)
    }
    catch {
        return ""
    }
}