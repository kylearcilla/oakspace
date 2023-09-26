import { musicPlayerStore, musicDataStore } from "./store"
import { AppleMusicPlayer } from "./music-apple-player"
import { MusicData } from "./music-data-apple"

enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }

/**
 * Initializes Apple Music Data & Music Player.
 * Makes new instances of apple music data and player stores.
 * 
 * @param  isUserLoggedIn   If user has already logged in.
 * @throws {Error}          Error in initializing music data / player.
 */
export const initAppleMusicState = async (isUserLoggedIn = false) => {
    const musicData = new MusicData()
    await musicData.initMusicData(MusicPlatform.AppleMusic, isUserLoggedIn)

    const musicPlayer = new AppleMusicPlayer(musicData)

    return musicPlayer
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
 * @returns 
 * @throws {Error}   Error in fetch operation.
 */
export const getUserApplePlaylists = async (): Promise<MusicCollection[]> => {
    // @ts-ignore
    const music = await MusicKit.getInstance()
    const res = await music.api.music('v1/me/library/playlists')

    if (!res.response.ok) {
        throw new Error(`Error fetching user library playlists: HTTP ${res.response.status} ${res.response.statusText}`)
    }

    const playlistData = []
    const data = res.data.data

    for (let i = 0; i < data.length; i++) {
        const playlist = data[i];
        const descriptionText = playlist.attributes?.description?.short ?? playlist.attributes?.description?.standard;

        // gloal id is used to play playlist so Purchase Music playlist will not included
        if (!playlist.attributes.playParams.globalId) continue
        
        const playlistObj = {
            id: playlist.attributes.playParams.globalId,
            name: playlist.attributes.name,
            description: descriptionText ?? "No Description.",
            artworkImgSrc: playlist.attributes?.artwork ? getArtworkSrc(playlist.attributes.artwork) : "",
            author: playlist.attributes.curatorName,
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
 * @param token 
 * @returns 
 * @throws {Error}   Error in fetching playlist details
 */
export const getApplePlaylistDetails = async (playlistId: string, token: string): Promise<MusicCollection>  => {
    const url = `https://api.music.apple.com/v1/catalog/us/playlists/${playlistId}`
    const options = { method: 'GET', headers: { 'Authorization': "Bearer " + token } }

    const res = await fetch(url, options)
    if (!res.ok) { 
        throw new Error(`Error fetching playlist details: HTTP: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()

    const trackList: any[] = data.data[0].relationships.tracks.data
    const descriptionText = data.data[0].attributes?.description?.short ?? data.data[0].attributes?.description?.standard

    const playlistData: MusicCollection = {
        id: playlistId,
        name: data.data[0].attributes.name,
        author: "My Library",
        artworkImgSrc: data.data[0].attributes?.artwork ? getArtworkSrc(data.data[0].attributes.artwork) : "",
        songCount: trackList.length,
        description: descriptionText ?? "No Description",
        type: "Playlist",
        genre: "",
        url: null
    }
    return playlistData
}

/**
 * Returns a formatted artwork URL.
 * 
 * @returns 
 */
export const getArtworkSrc = (artwork: any) => {
    // @ts-ignore
    return MusicKit.formatArtworkURL(artwork, 200, 200)
}