import { get } from "svelte/store"
import { musicDataStore, spotifyIframeStore, toastMessages } from "./store"

import { hasUserSignedIn, musicAPIErrorHandler } from "./utils-music"
import { base64encode, generateCodeVerifier, hashSHA256 } from "./utils-general"

import { APIError } from "./errors"
import { APIErrorCode, MediaEmbedType, MusicMediaType, MusicPlatform } from "./enums"
import { SpotifyMusicUserData } from "./music-spotify-user-data"
import { SpotifyMusicPlayer } from "./music-spotify-player"
import { initFloatingEmbed } from "./utils-home"

const CLIENT_ID     = "ed4c34b3aa704c6fbc88ca3e2957ced4"
const REDIRECT_URI  = "http://localhost:5173/home"
const AUTH_URL      = new URL("https://accounts.spotify.com/authorize")
const SCOPES_ARR    = [
    "streaming", "user-library-read", "user-read-playback-position", 
    "user-read-private", "playlist-read-private", "user-read-currently-playing"
]
const SCOPES_STR = SCOPES_ARR.join(" ")

export const TOKEN_URL  = new URL("https://accounts.spotify.com/api/token")
export const LIBRARY_COLLECTION_LIMIT = 25

/**
 * Starts the OAuth 2.0 Auth Flow if logging for the first time or initializes new store if continuing a session.
 */
export function initSpotifyMusic() {
    if (hasUserSignedIn()) {
        new SpotifyMusicUserData(null, true)

        if (didSetSpotifyiFrameAPI()) { 
            initSpotifyiFramePlayer() 
        }
    }
    else {
        requestSpotifyUserAuth()
    }
}

/**
 * Runs when user first connects to Spotify.
 * Sends user to auth consent page to allow user to grant app to Spotify data.
 * After user accepts / declines, will be sent back to the redirect URI.
 * If accepts the auth code in the url after redirect.
 */
export async function requestSpotifyUserAuth() {
    const codeVerifier = generateCodeVerifier(64)
    localStorage.setItem("code_verifier", codeVerifier)
    localStorage.removeItem("redirected-from-spotify-consent-page")

    const hashed = await hashSHA256(codeVerifier)
    const codeChallenge = base64encode(hashed)

    const params =  {
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: SCOPES_STR,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: REDIRECT_URI
    }

    AUTH_URL.search = new URLSearchParams(params).toString()
    window.location.href = AUTH_URL.toString()
}

/**
 * Check to see if app has redirected from the consent page by checking if code param is in URL.
 */
export function didSpotifyUserAuthApp() {
    const url =  new URL(window.location.href)
    const spotifyAccessTokenCode = url.searchParams.get('code')

    if (!spotifyAccessTokenCode && localStorage.getItem("code_verifier")) {
        localStorage.removeItem("code_verifier")
    }

    return spotifyAccessTokenCode != null
}

/**
 * Runs after a successful user authorization.
 * Parses auth code from the redirect uri and calls success handler if successful.
 */
export function getSpotifyCodeFromURLAndLogin() {
    const url =  new URL(window.location.href)
    const spotifyAccessTokenCode = url.searchParams.get('code')

    // here, only check if we don't have an access token OR access token has expired
    if (spotifyAccessTokenCode && !localStorage.getItem("redirected-from-spotify-consent-page")) {
        userAuthSuccessHandler(spotifyAccessTokenCode)
    }
}

/**
 * Runs after a successful user authorization.
 * Runs after a first-time log in or a log in during token state.
 * Will request for new access token and initialize a new Spotify Data Store.
 * 
 * @param code    Code verifier required for PKCE Authorization	
 */
export async function userAuthSuccessHandler(code: string) {
    const codeVerifier = localStorage.getItem("code_verifier")!
    localStorage.setItem("redirected-from-spotify-consent-page", JSON.stringify(true))

    try {
        const refreshHasFailed = hasUserSignedIn()
        const res = await getSpotifyAcessToken(code, codeVerifier)

        initSpotifyAfterAuth({
            accessToken: res.access_token, expiresIn: res.expires_in,
            refreshToken: res.refresh_token, authCode: codeVerifier
        }, refreshHasFailed)

        toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
            context: get(musicDataStore)!.musicPlatform,
            message: refreshHasFailed ? "Session refreshed!" : "Log in Successful!"
        }])
    }
    catch(e: any) {
        localStorage.removeItem("code_verifier")
        localStorage.removeItem("redirected-from-spotify-consent-page")

        musicAPIErrorHandler(e, MusicPlatform.Spotify)
    }
}

/**
 * Initialize data store from Spotify after a successful OAuth 2.0 Flow.
 * Initalizes with important credentials data from the flow.
 * Runs during first-time logins or logins during an expired token state.
 * 
 * @param initData 
 */
export const initSpotifyAfterAuth = async (initData: SpotifyInitData, refreshHasFailed: boolean) => {
    if (refreshHasFailed) {
        const musicStore = get(musicDataStore)! as SpotifyMusicUserData
        musicStore.initSpotifyAfterAuth(initData)
    }
    else {
        new SpotifyMusicUserData(initData)
    }
}

/**
 * Request for acces token for important creds 
 * @param code            Code from URL
 * @param codeVerifier    Code from PKCE OAuth auth flow	
 * @returns               Important creds data for requesting user data.
 */
export async function getSpotifyAcessToken(code: string, codeVerifier: string): Promise<SpotifyAuthTokenResponse> {
    try {
        const headers = new Headers({
            "Content-Type": "application/x-www-form-urlencoded"
        })
        const body = new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier
        })
        const res = await fetch("https://accounts.spotify.com/api/token", { method: 'POST', headers, body })
        const data = await res.json()

        if (!res.ok) {
            console.error(`There was an error getting a Spotify Web API access token. \n URL: ${res.url} \n Status: ${res.status} \n Error: ${data.error}. \n Description: ${data.error_description}.`)
            throwSpotifyAPIError({ status: res.status, message: data.error.message })
        }
    
        return data
    }
    catch(e: any) {
        if (e instanceof TypeError) {
            throw new APIError(APIErrorCode.FAILED_TOKEN_REFRESH)
        }
        throw e
    }
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
            throwSpotifyAPIError({ status: res.status, message: data.error.message })
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
    const headers = new Headers({
        "Authorization": `Bearer ${accessToken}`
    })
    const res = await fetch("https://api.spotify.com/v1/me", { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a user's profile data. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError({ status: res.status, message: data.error.message })
    }
    return {
        id: data.id,
        username: data.display_name,
        url: data.external_urls.spotify,
        isPremiumUser: data.product === "premium",
        profileImg: data.images[0].url
    }
}

/**
 * @param accessToken 
 * @param offset      Offset for pagination
 * @returns           User's playlists from their library
 */
export async function getSpotfifyUserPlaylists(accessToken: string, offset: number): Promise<{ items: Playlist[], total: number }> {
    try {
        const headers = new Headers({
            "Authorization": `Bearer ${accessToken}`
        })
        const res = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${LIBRARY_COLLECTION_LIMIT}&offset=${offset}`, { method: 'GET', headers })
        const data = await res.json()

        if (!res.ok) {
            console.error(`There was an error getting a user's saved playlists. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
            throwSpotifyAPIError({ status: res.status, message: data.error.message })
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
    catch(e: any) {
        throw e
    }
}

/**
 * @param accessToken 
 * @param offset      Offset for pagination
 * @returns           User's saved tracks from their library
 */
export async function getSpotfifyUserLikedTracks(accessToken: string, offset: number): Promise<{ items: Track[], total: number }> {
    try {
        const headers = new Headers({
            "Authorization": `Bearer ${accessToken}`
        })
        const res = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${LIBRARY_COLLECTION_LIMIT}&offset=${offset}`, { method: 'GET', headers })
        const data = await res.json()

        if (!res.ok) {
            console.error(`There was an error getting a user's saved tracks. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
            throwSpotifyAPIError({ status: res.status, message: data.error.message })
        } 

        console.log(data)

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
                playlistName:  ""
            }
        })
        return { 
            items: tracks,
            total: data.total
        }
    }
    catch(e: any) {
        throw e
    }
}

/**
 * @param accessToken 
 * @param offset      Offset for pagination
 * @returns           User's saved albums from their library
 */
export async function getSpotifyUserAlbums(accessToken: string, offset: number): Promise<{ items: Album[], total: number }> {
    const headers = new Headers({
        "Authorization": `Bearer ${accessToken}`
    })
    const res = await fetch(`https://api.spotify.com/v1/me/albums?limit=${LIBRARY_COLLECTION_LIMIT}&offset=${offset}`, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a user's saved albums. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError({ status: res.status, message: data.error.message })
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
            description: ""
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
export async function getUserPodcastsEps(accessToken: string, offset: number): Promise<{ items: PodcastEpisode[], total: number }> {
    const headers = new Headers({
        "Authorization": `Bearer ${accessToken}`
    })
    const res = await fetch(`https://api.spotify.com/v1/me/episodes?limit=${LIBRARY_COLLECTION_LIMIT}&offset=${offset}`, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a user's saved podcast episodes. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError({ status: res.status, message: data.error.message })
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
            duration: item.episode.duration_ms
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
export async function getSpotifyUserAudioBooks(accessToken: string, offset: number): Promise<{ items: AudioBook[], total: number }> {
    const headers = new Headers({
        "Authorization": `Bearer ${accessToken}`
    })
    const res = await fetch(`https://api.spotify.com/v1/me/audiobooks?limit=${LIBRARY_COLLECTION_LIMIT}&offset=${offset}`, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok) {
        console.error(`There was an error getting a user's saved audiobooks. \n URL: ${res.url} \n Status: ${res.status} \n Description: ${data.error.message}.`)
        throwSpotifyAPIError({ status: res.status, message: data.error.message })
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
            description: item.description
        }
    })
    return { 
        items: audioBooks,
        total: data.total
    }
}

export function didSetSpotifyiFrameAPI() {
    return localStorage.getItem("music-player-data") != null
}

export async function initSpotifyiFramePlayer(media?: Media) {
    new SpotifyMusicPlayer()
    const player = get(spotifyIframeStore)!
    let _media = media

    if (!media) {
        _media = player.mediaCollection ?? player.mediaItem!
    }
    await player.initIframePlayerAPI(_media!)
}

export async function handleSpotifyMediaItemClicked(media: Media) {
    let spotifyPlayer = get(spotifyIframeStore)

    if (!spotifyPlayer) {
        await initSpotifyiFramePlayer(media)
        spotifyPlayer = get(spotifyIframeStore)

    }
    spotifyPlayer!.initNewResource(media)
}

export function getIFrameMediaUri(media: Media) {
    const parsedUrl = new URL(media.url)
    const pathnameParts = parsedUrl.pathname.split('/').filter(Boolean)
    const resourceType = pathnameParts[0]

    return `spotify:${resourceType}:${media.id}`
}

/**
 * Get the right error object to throw after a failed interaction with the a Spotify Music API.
 * Error message shown as a toast is handled by the error handler.
 * 
 * @param     error     Error context extracted from the API reesponse
 * @returns             API error with proper context using a code and message.
 */
export function throwSpotifyAPIError(error: { status: number, message: string }) {
    if (error.status === 401 && error.message === "The access token expired") {
        throw new APIError(APIErrorCode.EXPIRED_TOKEN, "Token expired. Log in again to continue.")
    }
    else if (error.status === 404) {
        throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Requested media unavailable.")
    }
    else if (error.status === 429) {
        throw new APIError(APIErrorCode.RATE_LIMIT_HIT, "Sorry, the app has exceeded the rate limit. Please try again later.")
    }
    else {
        throw new APIError(APIErrorCode.GENERAL, "There was an error with Spotify. Please try again later.")
    }
  }