import { get } from "svelte/store"
import { musicDataStore } from "./store"

import { musicAPIErrorHandler, initMusicToast, LIBRARY_COLLECTION_LIMIT, didInitMusicUser, verifyForPlayerSession } from "./utils-music"
import { base64encode, generateCodeVerifier, hashSHA256 } from "./utils-general"

import { APIError } from "./errors"
import { SpotifyMusicUserData } from "./music-spotify-user-data"
import { APIErrorCode, MusicMediaType, MusicPlatform } from "./enums"
import { MusicSettingsManager } from "./music-settings-manager"

const CLIENT_ID     = "ed4c34b3aa704c6fbc88ca3e2957ced4"
const REDIRECT_URI  = "http://localhost:5173/home"
const AUTH_URL      = new URL("https://accounts.spotify.com/authorize")

const SCOPES_ARR = ["streaming", "user-library-read", "user-read-playback-position", "user-read-private", "playlist-read-private", "user-read-currently-playing"]
const SCOPES_STR = SCOPES_ARR.join(" ")

export const TOKEN_URL  = new URL("https://accounts.spotify.com/api/token")

/**
 * 
 * Starts the OAuth 2.0 Auth Flow if logging for the first time.
 * Otherwise, initiate a new store and player if there is any.
 */
export async function initSpotifyMusic() {
    try {
        if (didInitMusicUser()) {
            new SpotifyMusicUserData()
            new MusicSettingsManager(MusicPlatform.Spotify)     // create here since redirect is to home page
            await verifyForPlayerSession(MusicPlatform.Spotify)
        }
        else {
            await requestSpotifyUserAuth()
        }
    }
    catch(error: any) {
        console.error(error)
        musicAPIErrorHandler(new APIError(APIErrorCode.AUTHORIZATION_ERROR))
    }
}

/**
 * Runs when user first connects to Spotify.
 * Sends user to auth consent page to allow user to grant app to Spotify data.
 * After user accepts / declines, will be sent back to the redirect URI.
 * If accepts the auth code in the url after redirect.
 */
export async function requestSpotifyUserAuth() {
    try {
        const codeVerifier = generateCodeVerifier(64)
        localStorage.setItem("code_verifier", codeVerifier)
        localStorage.removeItem("url-code-flag")
    
        const hashed = await hashSHA256(codeVerifier)
        const codeChallenge = base64encode(hashed)
    
        const params =  {
            response_type: 'code', code_challenge_method: 'S256',
            client_id: CLIENT_ID, scope: SCOPES_STR, redirect_uri: REDIRECT_URI,
            code_challenge: codeChallenge
        }
    
        AUTH_URL.search = new URLSearchParams(params).toString()
        window.location.href = AUTH_URL.toString()
    }
    catch (error: any) {
        console.error(error)
        musicAPIErrorHandler(new APIError(APIErrorCode.AUTHORIZATION_ERROR))
    }
}

/**
 * Check to see if app has redirected from the consent page by checking if code param is in URL.
 * Allow the auth success flow only if user has not previously logged in.
 */
export function didSpotifyUserAuthApp() {
    const url =  new URL(window.location.href)
    const spotifyAccessTokenCode = url.searchParams.get('code')

    if (!spotifyAccessTokenCode && localStorage.getItem("code_verifier")) {
        localStorage.removeItem("code_verifier")
    }
    if (!spotifyAccessTokenCode) {
        localStorage.removeItem("url-code-flag")
    }

    return spotifyAccessTokenCode != null
}

/**
 * Runs after a successful user authorization.
 * Parses auth code from the redirect uri and calls success handler if successful.
 */
export async function getSpotifyCodeFromURLAndLogin() {
    try {
        const url =  new URL(window.location.href)
        const spotifyAccessTokenCode = url.searchParams.get('code')

        // flag exists if signing for the first time
        if (!localStorage.getItem("url-code-flag")) {
            await userAuthSuccessHandler(spotifyAccessTokenCode!)
        }
    }
    catch(e: any) {
        console.error(e)
        musicAPIErrorHandler(new APIError(APIErrorCode.AUTHORIZATION_ERROR))
        localStorage.removeItem("code_verifier")
        localStorage.removeItem("url-code-flag")
    }
}

/**
 * Runs after a successful user authorization.
 * Runs after a first-time log in or a log in during an expired-token state.
 * Will request for new access token and initialize a new Spotify Data Store.
 * 
 * @param code    Code verifier required for PKCE Authorization	
 */
async function userAuthSuccessHandler(code: string) {
    const codeVerifier = localStorage.getItem("code_verifier")!
    const res = await getSpotifyAcessToken(code, codeVerifier)

    await initSpotifyAfterAuth({
        accessToken: res.access_token, expiresIn: res.expires_in,
        refreshToken: res.refresh_token, authCode: codeVerifier
    })
    
    localStorage.setItem("url-code-flag", JSON.stringify(true))
    initMusicToast(MusicPlatform.Spotify, "Log in Success!")
}

/**
 * Initialize data store from Spotify after a successful OAuth 2.0 Flow
 * Runs during first-time logins or refresh after an expired token state.
 * 
 * @param initData   Credentials data after creds request after successful request.
 */
async function initSpotifyAfterAuth(initData: SpotifyInitData) {
    if (!get(musicDataStore)) {
        new SpotifyMusicUserData()
        new MusicSettingsManager(MusicPlatform.Spotify)
    }

    await get(musicDataStore)!.init(initData)
}

/**
 * Request for acces token for important creds 
 * @param code            Code from URL
 * @param codeVerifier    Code from PKCE OAuth auth flow	
 * @returns               Important creds data for requesting user data.
 */
export async function getSpotifyAcessToken(code: string, codeVerifier: string): Promise<SpotifyAuthTokenResponse> {
    const headers = new Headers({ 
        "Content-Type": "application/x-www-form-urlencoded" 
    })
    const body = new URLSearchParams({
        client_id: CLIENT_ID, redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code, code_verifier: codeVerifier
    })

    const res = await fetch("https://accounts.spotify.com/api/token", { method: 'POST', headers, body })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a Spotify Web API access token. \n URL: ${res.url} \n Status: ${res.status} \n Error: ${data.error}. \n Description: ${data.error_description}.`)
        throwSpotifyAPIError(res.status, data.error.message)
    }

    return data
}

/**
 * Gets a new creds data using refresh token from previous request to the token endpoint.
 * @param   refreshToken  Refresh token used to get a fresh access token.
 * @returns               Updated creds data.
 */
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyAuthTokenResponse> {
    try {
        const headers = new Headers({
            "Content-Type": "application/x-www-form-urlencoded"
        })
        const body =  new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: CLIENT_ID
        })

        const res = await fetch(TOKEN_URL, { method: 'POST', headers, body })
        const data = await res.json()

        if (!res.ok) {
            console.error(`There was an error refreshing token. \n URL: ${res.url} \n Status: ${res.status} \n Error: ${data.error}. \n Description: ${data.error_description}.`)
            throwSpotifyAPIError(res.status, data.error.message)
        }

        return data
    }
    catch(e: any) {
        if (e instanceof TypeError) {
            throw new APIError(APIErrorCode.AUTHORIZATION_ERROR, "There was an error continuing your Spotify session. Please try or log in again.")
        }
        else {
            throw e
        }
    }
}

/**
 * @param    accessToken 
 * @returns  Spotify user profile data.
 */
export async function getSpotifyUserData(accessToken: string): Promise<MusicUserDetails> {
    const headers = new Headers({ "Authorization": `Bearer ${accessToken}` })
    const res = await fetch("https://api.spotify.com/v1/me", { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a user's profile data. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError(res.status, data.error.message)
    }
    return {
        id: data.id,
        username: data.display_name,
        url: data.external_urls.spotify,
        isPremiumUser: data.product === "premium",
        profileImgSmall: data.images[0].url,
        profileImgBig: data.images.length > 1 ? data.images[1].url : ""
    }
}

/**
 * @param accessToken 
 * @param offset      Offset for pagination
 * @returns           User's playlists from their library
 */
export async function getSpotfifyUserPlaylists(accessToken: string, offset: number, limit = LIBRARY_COLLECTION_LIMIT): Promise<{ items: Playlist[], total: number }> {
    const headers = new Headers({
        "Authorization": `Bearer ${accessToken}`
    })
    const res  = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a user's saved playlists. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError(res.status, data.error.message)
    }

    const playlists: Playlist[] = (data.items as any[]).map((pl: any) => {
        return {
            id: pl.id,
            name: pl.name,
            author: pl.owner.display_name,
            authorUrl: pl.owner.external_urls.spotify,
            artworkImgSrc: pl.images[pl.images.length < 2 ? 0 : 1].url,
            genre: "",
            url: pl.external_urls.spotify,
            length: pl.tracks.total,
            type: MusicMediaType.Playlist,
            description: pl?.description ?? ""
        } as Playlist
    })
    return { 
        items: playlists,
        total: data.total
    }
}

/**
 * @param accessToken 
 * @param offset      Offset for pagination
 * @returns           User's saved tracks from their library
 */
export async function getSpotfifyUserLikedTracks(accessToken: string, offset: number, limit = LIBRARY_COLLECTION_LIMIT): Promise<{ items: Track[], total: number }> {
    const headers = new Headers({ "Authorization": `Bearer ${accessToken}` })
    const res  = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a user's saved tracks. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError(res.status, data.error.message)
    }

    const tracks: Track[] = (data.items as any[]).map((item: any) => {
        return {
            id: item.track.id,
            name: item.track.name,
            author: item.track.artists[0].name,
            authorUrl: "",
            artworkImgSrc: item.track.album.images[item.track.album.images.length < 2 ? 0 : 1].url,
            genre: "",
            url: item.track.external_urls.spotify,
            duration: item.track.duration_ms,
            album: item.track.album.name,
            albumId: item.track.album.id,
            type: MusicMediaType.Track,
            playlistId: "",
            fromLib: true
        }
    })
    return { 
        items: tracks,
        total: data.total
    }
}

/**
 * @param accessToken 
 * @param offset      Offset for pagination
 * @returns           User's saved albums from their library
 */
export async function getSpotifyUserAlbums(accessToken: string, offset: number, limit = LIBRARY_COLLECTION_LIMIT): Promise<{ items: Album[], total: number }> {
    const headers = new Headers({ "Authorization": `Bearer ${accessToken}` })
    const res  = await fetch(`https://api.spotify.com/v1/me/albums?limit=${limit}&offset=${offset}`, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a user's saved albums. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError(res.status, data.error.message)
    }

    const albums: Album[] = (data.items as any[]).map((item: any) => {
        return {
            id: item.album.id,
            name: item.album.name,
            author: item.album.artists[0].name,
            authorUrl: item.album.artists[0].external_urls.spotify,
            type: MusicMediaType.Album,
            url: item.album.external_urls.spotify,
            length: item.album.total_tracks,
            artworkImgSrc: item.album.images[item.album.images.length < 2 ? 0 : 1].url,
            genre: item.album.genres.length === 0 ? "" : item.album.genres[0],
            description: "",
            fromLib: true
        }
    })
    return { 
        items: albums,
        total: data.total
    }
}

/**
 * @param accessToken 
 * @param offset      Offset for pagination
 * @returns           User's saved podcast episodes from their library
 */
export async function getUserPodcastsEps(accessToken: string, offset: number, limit = LIBRARY_COLLECTION_LIMIT): Promise<{ items: PodcastEpisode[], total: number }> {
    const headers = new Headers({ "Authorization": `Bearer ${accessToken}` })
    const res  = await fetch(`https://api.spotify.com/v1/me/episodes?limit=${limit}&offset=${offset}`, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a user's saved podcast episodes. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError(res.status, data.error.message)
    }

    const podcastEps: PodcastEpisode[] = (data.items as any[]).map((item: any) => {
        return {
            id: item.episode.id,
            name: item.episode.name,
            author: item.episode.show.name,
            authorUrl: item.episode.show.external_urls.spotify,
            type: MusicMediaType.PodcastEpisode,
            url: item.episode.external_urls.spotify,
            artworkImgSrc: item.episode.images[item.episode.images.length < 2 ? 0 : 1].url,
            genre: "",
            description: item.episode.description,
            duration: item.episode.duration_ms,
            fromLib: true
        }
    })
    return { 
        items: podcastEps,
        total: data.total
    }
}

/**
 * @param accessToken 
 * @param offset      Offset for pagination
 * @returns           User's saved audiobooks from their library
 */
export async function getSpotifyUserAudioBooks(accessToken: string, offset: number, limit = LIBRARY_COLLECTION_LIMIT): Promise<{ items: AudioBook[], total: number }> {
    const headers = new Headers({ "Authorization": `Bearer ${accessToken}` })
    const res  = await fetch(`https://api.spotify.com/v1/me/audiobooks?limit=${limit}&offset=${offset}`, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a user's saved audiobooks. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError(res.status, data.error.message)
    }

    const audioBooks: AudioBook[] = (data.items as any[]).map((item: any) => {
        return {
            id: item.id,
            name: item.name,
            author: item.authors[0].name,
            authorUrl: "",
            type: MusicMediaType.AudioBook,
            url: item.external_urls.spotify,
            artworkImgSrc: item.images[item.images.length < 2 ? 0 : 1].url,
            genre: "",
            description: item.description,
            fromLib: true
        }
    })
    return { 
        items: audioBooks,
        total: data.total
    }
}

/**
 * @param accessToken 
 * @param pos      position of element is offset
 * @returns        User's saved audiobooks from their library
 */
export async function getPlaylistItem(accessToken: string, playlistId: string, pos: number): Promise<Track> {
    const headers = new Headers({ "Authorization": `Bearer ${accessToken}` })
    const res  = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=1&offset=${pos}`, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a collection's item. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError(res.status, data.error.message)
    }

    const item = data.items[0]

    return {
        id: item.track.id,
        name: item.track.name,
        author: item.track.artists[0].name ?? item.track.artists[0].type,
        authorUrl: item.track.artists[0].href,
        artworkImgSrc: item.track.album.images[item.track.album.images.length < 2 ? 0 : 1].url,
        genre: "",
        url: item.track.external_urls.spotify,
        duration: item.track.duration_ms,
        album: item.track.album.name,
        albumId: item.track.album.id,
        type: MusicMediaType.Track,
        playlistId: "",
        fromLib: true
    }
}

/**
 * @param accessToken 
 * @param pos      position of element is offset
 * @returns        User's saved audiobooks from their library
 */
export async function getAlbumItem(accessToken: string, albumId: string, pos: number): Promise<Track> {
    const headers = new Headers({ "Authorization": `Bearer ${accessToken}` })
    const res  = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=1&offset=${pos}`, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a collection's item. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError(res.status, data.error.message)
    }

    const item = data.items[0]

    return {
        id: item.id,
        name: item.name,
        author: item.artists[0].name,
        authorUrl: item.artists[0].external_urls.spotify,
        type: MusicMediaType.Album,
        url: item.external_urls.spotify,
        duration: item.duration_ms,
        artworkImgSrc: "",
        genre: "",
        album: "",
        albumId: "",
        playlistId: "",
        fromLib: true
    }
}

/**
 * @param accessToken 
 * @param pos      position of element is offset
 * @returns        User's saved audiobooks from their library
 */
export async function getLibTracksItem(accessToken: string,  pos: number): Promise<Track> {
    return (await getSpotfifyUserLikedTracks(accessToken, pos, 1)).items[0]
}

/**
 * @param accessToken 
 * @param pos      position of element is offset
 * @returns        User's saved audiobooks from their library
 */
export async function getLibPodcastEpisdesItem(accessToken: string,  pos: number): Promise<PodcastEpisode> {
    return (await getUserPodcastsEps(accessToken, pos, 1)).items[0]

}

/**
 * @param accessToken 
 * @param pos      position of element, is offset
 * @returns           User's saved audiobooks from their library
 */
export async function getLibAudiobooksItem(accessToken: string,  pos: number): Promise<AudioBook> {
    return (await getSpotifyUserAudioBooks(accessToken, pos, 1)).items[0]
}

/**
 * 
 * @param media  Get URI from media
 * @returns     URI to be loaded into the iFrame Player
 */
export function getSpotifyMediaUri(media: Media) {
    const parsedUrl = new URL(media.url)
    const pathnameParts = parsedUrl.pathname.split('/').filter(Boolean)
    const resourceType = pathnameParts[0]

    return `spotify:${resourceType}:${media.id}`
}

/**
 * Get the right error object to throw after a failed interaction with the a Spotify Music API.
 * Error message shown as a toast is handled by the error handler.
 * 
 * Spotify Web API Errrors: https://developer.spotify.com/documentation/web-api/concepts/api-calls
 * 
 * @param     error   Error context extracted from the API reesponse
 * @returns           API error with proper context using a code and message.
 */
export function throwSpotifyAPIError(status: number, message: string) {
    if (status === 401 && message === "The access token expired") {
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