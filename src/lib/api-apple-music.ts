import { get } from "svelte/store"
import { appleMusicPlayerState, musicDataStore } from "./store"
import { formatTime } from "./utils-date"
import { AppleMusicPlayer } from "./music-apple-player"
import { MusicData } from "./music-data-apple"

enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }

/**
 * Called when user first clicks on the Apple Music Option. 
 * Makes new instances of apple music data and player stores.
 * 
 * @returns          Apple music discover collections list for Serene category.
 * @throws {Error}   Error in initializing music data / player.
 */
export const initAppleMusicState = async () => {
    const musicData = new MusicData(MusicPlatform.AppleMusic)
    try {
        const musicPlayer = new AppleMusicPlayer(musicData)
        appleMusicPlayerState.set(musicPlayer)
        musicDataStore.set(musicData)
    } 
    catch (error) {
        console.error(error)
        throw error
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
 * @returns 
 * @throws {Error}   Error in fetch operation.
 */
export const getUserApplePlaylists = async (): Promise<MusicCollection[]> => {
    try {
        // @ts-ignore
        const music = await MusicKit.getInstance()
        const res = await music.api.music('v1/me/library/playlists')
        if (!res.response.ok) {
            throw new Error(`Error fetching user library playlists: HTTP ${res.response.status} ${res.response.statusText}`)
        }

        return res.data.data.map((playlist: any) => {
            const descriptionText = playlist.attributes?.description?.short ?? playlist.attributes?.description?.standard

            return {
                id: playlist.attributes.playParams.globalId,
                name: playlist.attributes.name,
                description: descriptionText ?? "No Description.",
                artworkImgSrc: playlist.attributes?.artwork ? getArtworkSrc(playlist.attributes?.artwork) : "",
                author: playlist.attributes.curatorName,
                genre: "",
                songCount: 0,
                type: "playlist",
                url: `https://music.apple.com/library/playlist/${playlist.id}`
            }
        })
    } catch (error) {
        console.error(error)
        throw error
    }
}

/**
 * Fetches playlist details for a playlist. 
 * Used for fetching user library playlist details. 
 * Discover collection details are hardcoded in the back end.
 * 
 * @param playlistId 
 * @param token 
 * @returns 
 * @throws {Error}   Error in fetching playlist details
 */
export const getApplePlaylistDetails = async (playlistId: string, token: string): Promise<MusicCollection>  => {
    try {
        const url = `https://api.music.apple.com/v1/catalog/us/playlists/${playlistId}`
        const options = { method: 'GET', headers: { 'Authorization': "Bearer " + token } }

        const res = await fetch(url, options)
        if (!res.ok) { 
            throw new Error(`Error fetching playlist details: HTT: ${res.status} ${res.statusText}`)
        }

        const data = await res.json()

        const trackList: any[] = data.data[0].relationships.tracks.data
        const descriptionText = data.data[0].attributes?.description?.short ?? data.data[0].attributes?.description?.standard

        const playlistData: MusicCollection = {
            id: playlistId,
            name: data.data[0].attributes.name,
            author: "My Library",
            artworkImgSrc: getArtworkSrc(data.data[0].attributes?.artwork),
            songCount: trackList.length,
            description: descriptionText ?? "No Description",
            type: data.data[0].attributes.playParams.kind,
            genre: "",
            url: null
        }
        return playlistData
    } catch (error) {
        console.error(error)
        throw error
    }
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