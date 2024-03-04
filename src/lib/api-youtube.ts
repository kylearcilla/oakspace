import auth from  "./firebase"
import firebase from "firebase/compat/app"

import { APIErrorCode, ErrorCode, YTAPIErrorContext } from "./enums"
import { shorterNum } from "./utils-general"
import { getAuth, signOut } from "firebase/auth"
import { PUBLIC_YT_DATA_V3_API_KEY } from '$env/static/public'
import { APIError, ApiError, AuthorizationError, CustomError, ExpiredTokenError, PlayerError, ResourceNotFoundError } from "./errors"

const YT_DATA_API_URL = "https://youtube.googleapis.com/youtube/v3"

/**
 * Initiailze 0Auth 2.0 Flow using Firebase to get access token to utilize Google APIs. 
 * Generates a user consent screen pop-up to grant client app permission.
 * Returns an access token and user account metadata.
 * 
 * @returns  User profile data & credentials (no refresh token provided)
 * 
 */
export const authYoutubeClient = async (): Promise<YTOAuthResponse> => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider()
    provider.addScope("https://www.googleapis.com/auth/youtube.readonly")
    const popUpResponse = await auth.signInWithPopup(provider) as any
    const credential = popUpResponse.credential

      const authYoutubeClientResponse = {
        accessToken: credential.accessToken,
        email: popUpResponse.additionalUserInfo.profile.email,
        username: popUpResponse.additionalUserInfo.profile.name,
        profileImgSrc: popUpResponse.additionalUserInfo.profile.picture,
      }

      return authYoutubeClientResponse

  } catch (error: any) {
      console.error(error)
      throw throwFireBaseAPIError(error)
  }
}

/**
 * Logs out user using current authentication instance set up from the sign up.
 * TODO: Must investigate error cases for signOut.
 */
export const logOutUser = async () => {
  try {
    await signOut(getAuth())
  }
  catch(e) {
    throw new APIError(APIErrorCode.LOG_OUT)
  }
}

/**
 * Requests new fresh token. Calls the same Firebase method when logging in.
 * Does not actually get a new token from a refresh token (unavailable with firebase)
 * 
 * @returns Fresh new token from auth response.
 */
export const getFreshToken = async (): Promise<string> => {
  try {
      const provider = new firebase.auth.GoogleAuthProvider()
      provider.addScope("https://www.googleapis.com/auth/youtube.readonly")
      const popUpResponse = await auth.signInWithPopup(provider) as any
      const credential = popUpResponse.credential

      return credential.accessToken

  } catch (error: any) {
    console.error(error)

    throw throwFireBaseAPIError(error)
  }
}

/**
 * Make a GET request to Youtube Data API to get video details.
 * 
 * @param   accessToken 
 * @returns User personal playlist details.
 * @throws  Error status rom fetching user playlists
 */
export const getUserYtPlaylists = async (accessToken: string, max: number, nextPageToken: string = ""): Promise<YoutubeUserPlaylistResponse> => {
  const url = `${YT_DATA_API_URL}/playlists?part=snippet%2CcontentDetails&maxResults=${max}&mine=true&key=${PUBLIC_YT_DATA_V3_API_KEY}&pageToken=${nextPageToken}`
  
  const headers = new Headers()
  headers.append("Content-Type", "application/json")
  headers.append("Authorization", `Bearer ${accessToken}`)
  
  const res = await fetch(url, { method: "GET", headers: headers, })
  const data = await res.json()
  
  if (!res.ok) {
    console.error(`Error fetching user playlists. Location: ${data.error.errors[0].location}. Message: ${data.error.message}.`)
    throw throwYoutubeDataAPIError(data.error.code)
  }

  const playlists: YoutubePlaylist[] = []

  data.items.map((playlist: any) => {
      playlists.push({
          id: playlist.id,
          title: playlist.snippet.title,
          description: playlist.snippet.description,
          vidCount: playlist.contentDetails.itemCount,
          channelId: playlist.snippet.channelId,
          channelTitle: playlist.snippet.channelTitle,
          thumbnailURL: playlist.snippet.thumbnails.medium.url,
          firstVidId: null,
          channelImgSrc: "",
          channelURL: ""
      })
  })

  return {
    userPlaylists: playlists,
    userPlsNextPageToken: data?.nextPageToken,
    userPlaylistsTotal: data.pageInfo.totalResults
  }
}

/**
 * Make a GET request to Youtube Data API to get video details and another one to get video channel details.
 * 
 * @param videoId Vid in question.
 * @returns       Youtube Video playlist details.
 */
export const getVidDetails = async (videoId: string): Promise<YoutubeVideo> => {
    let url = `${YT_DATA_API_URL}/videos?part=snippet,status,statistics,id&id=${videoId}&key=${PUBLIC_YT_DATA_V3_API_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok) {
      console.error(`Error fetching video details: Location: ${data.error.errors[0].location}. Message: ${data.error.message}}.`)
      throw throwYoutubeDataAPIError(data.error.code)
    }

    const channelDetails = await getChannelDetails(data.items[0].snippet.channelId)

    return {
        id: data.items[0].id,
        title: data.items[0].snippet.title,
        likeCount: shorterNum(data.items[0].statistics.likeCount),
        viewCount: shorterNum(data.items[0].statistics.viewCount),
        publishedAt: data.items[0].snippet.publishedAt,
        channelName: data.items[0].snippet.channelTitle,
        channelImgSrc: channelDetails.channelImgSrc,
        channelId: channelDetails.channelId,
        channelSubs: channelDetails.channelSubs,
        channelUrl: channelDetails.channelUrl
    }
}

/**
 * Make a GET request to Youtube Data API to get playlist items details and another one to get video channel details.
 * 
 * @param   playlistId 
 * @returns Youtube Playlist details.
 */
export const getPlayListItemsDetails = async (playlistId: string, maxResults = 1): Promise<YoutubePlaylistResponse> => {
  const url = `${YT_DATA_API_URL}/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${PUBLIC_YT_DATA_V3_API_KEY}`

  const headers = new Headers()
  headers.append("Content-Type", "application/json")

  const res = await fetch(url, { method: "GET", headers: headers, })
  const data = await res.json()

  if (!res.ok) {
    console.error(`Error fetching playlist details: Location: ${data.error.errors[0].location}. Message: ${data.error.message}.`)
    throw throwYoutubeDataAPIError(data.error.code)
  }

  const playlistItems: YoutubeVideo[] = []

  data.items.map(async (plItem: any) => {
    const channelDetails = await getChannelDetails(data.items[0].snippet.channelId)

    playlistItems.push({
      id: plItem.id,
      title: plItem.snippet.title,
      likeCount: "",
      viewCount: "",
      publishedAt: plItem.snippet.publishedAt,
      channelId: plItem.snippet.videoOwnerChannelId,
      channelName: plItem.snippet.videoOwnerChannelTitle,
      channelImgSrc: channelDetails.channelImgSrc,
      channelSubs: channelDetails.channelSubs,
      channelUrl: channelDetails.channelUrl
    })
  })

  return {
    videos: playlistItems,
    nextPageToken: data.nextPageToken,
    playlistLength: data.pageInfo.totalResults,
  }
}


/**
 * Get playlist details. 
 * Note that vid count (-1) and first vid id (null) values will not be included as the are not contains in the request.
 * @param playlistId   Requested playlist id.
 * @returns            Youtube playlist id data.
 */
export const getPlaylistDetails = async (playlistId: string): Promise<YoutubePlaylist> => {
  const url = `${YT_DATA_API_URL}/playlists?part=id,snippet&id=${playlistId}&key=${PUBLIC_YT_DATA_V3_API_KEY}`

  const headers = new Headers()
  headers.append("Content-Type", "application/json")

  const res = await fetch(url, { method: "GET", headers: headers, })
  const data = await res.json()

  if (!res.ok) {
    console.error(`Error fetching playlist details: Location: ${data.error.errors[0].location}. Message: ${data.error.message}.`)
    throw throwYoutubeDataAPIError(data.error.code)
  }

  const channelDetails = await getChannelDetails(data.items[0].snippet.channelId)

  return {
    id: data.items[0].id,
    title: data.items[0].snippet.title,
    description: data.items[0].snippet.description,
    vidCount: -1,
    channelId: data.items[0].snippet.channelId,
    channelTitle: data.items[0].snippet.channelTitle,
    thumbnailURL: data.items[0].snippet.thumbnails.medium.url,
    firstVidId: null,
    channelImgSrc: channelDetails.channelImgSrc,
    channelURL: channelDetails.channelUrl
  }
}


/**
 * Make a GET request to Youtube Data API to get channel details.
 * 
 * @param   channelId 
 * @returns Youtube Channel details
 */
export const getChannelDetails = async (channelId: string): Promise<YoutubeChannel> => {
  const url = `${YT_DATA_API_URL}/channels?part=snippet%2Cstatistics&id=${channelId}&key=${PUBLIC_YT_DATA_V3_API_KEY}`

  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok) {
    console.error(`Error fetching channel details: Location: ${data.error.errors[0].location}. Message: ${data.error.message}}.`)
    throw getYtIframeAPIError(data.error.code)
  }

  return {
    channelId: data.items[0].id,
    channelName: data.items[0].snippet.title,
    channelImgSrc: data.items[0].snippet.thumbnails.default.url,
    channelSubs: shorterNum(data.items[0].statistics.subscriberCount),
    channelUrl: data.items[0].snippet.customUrl
  }
}

/**
 * Get the right error object to throw after a failed request.
 * Codes / error messages are based on Youtube Data v3 API.
 * 
 * Based on Core API Errors from Docs
 * https://developers.google.com/youtube/v3/docs/errors 
 * 
 * @param   code     HTTP Status error code returned from Youtube Data API
 * @param   context  In what API context is the error origination from
 * @returns          Error type and context will be relevant in how the error will be displayed to the user.
 */
const throwYoutubeDataAPIError = (status: number) => {
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
        throw new APIError(APIErrorCode.GENERAL, "There was an error with Youtube. Please try again later.")
    }
}

/**
 * Finds the right error to throw based on the error returned by Firebase.
 * TODO: need to find documentation
 * 
 * @param error 
 */
function throwFireBaseAPIError(error: any) {
    const errorStr = error.toString()
    const matches = errorStr.match(/\(([^)]+)\)/)
    const contextCode = matches[1]

    console.log(contextCode)

    if (["auth/popup-closed-by-user", "auth/user-cancelled"].includes(contextCode)) {
      throw new APIError(APIErrorCode.AUTH_DENIED)
    }
    else {
      throw new APIError(APIErrorCode.AUTHORIZATION_ERROR)
    }
}

/**
 * Return the appopriate error with the right context based on the error code return from Youtube iFrame API.
 * @param error  Error code returned from Youtube iFrame Player API
 */
export function getYtIframeAPIError(code: number) {
  if (code === 2) {
    return new APIError(APIErrorCode.PLAYER, "Player error. Invalid playlist / video id.")
  }
  else if (code === 5) {
    return new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Player error. This content cannot be played.")
  }
  else if (code === 100) {
    return new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Player error. Resource request not found.")
  }
  else if (code === 101 || code === 150) {
    return new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Player error. Playback on other websites has been disabled by playlist owner.")
  }
  else {
    return new APIError(APIErrorCode.PLAYER)
  }
}