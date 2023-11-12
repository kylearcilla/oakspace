import auth from  "./firebase"
import firebase from "firebase/compat/app"

import { ErrorCode, YTAPIErrorContext } from "./enums"
import { shorterNum } from "./utils-general"
import { getAuth, signOut } from "firebase/auth"
import { PUBLIC_YT_DATA_V3_API_KEY } from '$env/static/public'
import { ApiError, AuthorizationError, CustomError, ExpiredTokenError, PlayerError, ResourceNotFoundError } from "./errors"

const YT_DATA_API_URL = "https://youtube.googleapis.com/youtube/v3"

/**
 * Initiailze 0Auth 2.0 Flow using Firebase to get access token to utilize Google APIs. 
 * Generates a user consent screen pop-up to grant client app permission.
 * Returns an access token and user account metadata. Pass responses in callback function.
 * 
 * @returns                       User profile data & credentials (no refresh token provided)
 * @throws {AuthorizationError}   Occurs from a failed app authorization flow like consent screen closing.
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
      const errorStr = error.toString()
      const matches = errorStr.match(/\(([^)]+)\)/)
      const contextCode = matches[1]

      let errorMsg = "Youtube authorization failed, try again."
      console.error(`Error authorizing Youtube Client. ${error}`)

      if (contextCode === "auth/popup-closed-by-user") {
        errorMsg = "User app authorization denied (consent screen closed)."
      } 

      throw new AuthorizationError(errorMsg)
  }
}

/**
 * Requests new fresh token. Calls the same Firebase method when logging in.
 * Does not actually get a new token from a refresh token (unavailable with firebase)
 * 
 * @returns   Fresh new token from auth response.
 */
export const getFreshToken = async (): Promise<string> => {
  try {
      const provider = new firebase.auth.GoogleAuthProvider()
      provider.addScope("https://www.googleapis.com/auth/youtube.readonly")
      const popUpResponse = await auth.signInWithPopup(provider) as any
      const credential = popUpResponse.credential

      return credential.accessToken

  } catch (error: any) {
      const errorStr = error.toString()
      const matches = errorStr.match(/\(([^)]+)\)/)
      const contextCode = matches[1]

      let errorMsg = ""
      console.error(`Error authorizing Youtube Client. ${error}`)

      if (contextCode === "auth/popup-closed-by-user") {
        errorMsg = "User app authorization denied (consent screen closed)."
      } 

      throw new AuthorizationError(errorMsg)
  }
}

/**
 * Logs out user using current authentication instance set up from the sign up.
 * TODO: Must investigate error cases for signOut.
 * 
 * @throws {CustomError}   Error from sign out. General CustomError for now.
 */
export const logOutUser = async () => {
  try {
    await signOut(getAuth())
  }
  catch(e) {
    throw new CustomError("There was problem signing you out. Try again.")
  }
}

/**
 * Make a GET request to Youtube Data API to get video details.
 * 
 * @param accessToken 
 * @returns                        User personal playlist details.
 * @throws                         Error status rom fetching user playlists
 * @throws  {ApiError}             Error working with Youtube Data API
 * @throws  {AuthorizationError}   Error requesting user data
 * @throws  {ExpiredTokenError}    Error requesting user data due to expired token.
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
    throw getYtApiError(data.error.code, YTAPIErrorContext.USER_PLAYLISTS)
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
    userPlaylistsNextPageToken: data?.nextPageToken,
    userPlaylistLength: data.pageInfo.totalResults
  }
}

/**
 * Make a GET request to Youtube Data API to get video details and another one to get video channel details.
 * 
 * @param videoId                     Vid in question.
 * @returns                           Youtube Video playlist details.
 * @throws  {ApiError}                Error working with Youtube Data API
 * @throws  {ResourceNotFoundError}   Resource does not exist, deleted, privated.
 */
export const getVidDetails = async (videoId: string): Promise<YoutubeVideo> => {
    let url = `${YT_DATA_API_URL}/videos?part=snippet,status,statistics,id&id=${videoId}&key=${PUBLIC_YT_DATA_V3_API_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    console.log(res)

    if (!res.ok) {
      console.error(`Error fetching video details: Location: ${data.error.errors[0].location}. Message: ${data.error.message}}.`)
      throw getYtApiError(data.error.code, YTAPIErrorContext.VIDEO)
    }

    const channelDetails = await getChannelDetails(data.items[0].snippet.channelId)
    console.log(data.items[0])

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
 * @param playlistId 
 * @returns                           Youtube Playlist details.
 * @throws  {ApiError}                Error working with Youtube Data API
 * @throws  {ResourceNotFoundError}   Resource does not exist, deleted, privated.
 */
export const getPlayListItemsDetails = async (playlistId: string, maxResults = 1): Promise<YoutubePlaylistResponse> => {
  const url = `${YT_DATA_API_URL}/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${PUBLIC_YT_DATA_V3_API_KEY}`

  const headers = new Headers()
  headers.append("Content-Type", "application/json")

  const res = await fetch(url, { method: "GET", headers: headers, })
  const data = await res.json()

  if (!res.ok) {
    console.error(`Error fetching playlist details: Location: ${data.error.errors[0].location}. Message: ${data.error.message}.`)
    throw getYtApiError(data.error.code, YTAPIErrorContext.PLAYLIST)
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
    throw getYtApiError(data.error.code, YTAPIErrorContext.PLAYLIST)
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
 * @param channelId 
 * @returns                           Youtube Channel details
 * @throws  {ApiError}                Error working with Youtube Data API
 * @throws  {ResourceNotFoundError}   Channel does not exist or deleted
 */
export const getChannelDetails = async (channelId: string): Promise<YoutubeChannel> => {
  const url = `${YT_DATA_API_URL}/channels?part=snippet%2Cstatistics&id=${channelId}&key=${PUBLIC_YT_DATA_V3_API_KEY}`

  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok) {
    console.error(`Error fetching channel details: Location: ${data.error.errors[0].location}. Message: ${data.error.message}}.`)
    throw getYtApiError(data.error.code, YTAPIErrorContext.CHANNEL)
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
 * @param   code     HTTP Status error code returned from Youtube Data API
 * @param   context  In what API context is the error origination from
 * @returns          Error type and context will be relevant in how the error will be displayed to the user.
 */
const getYtApiError = (code: number, context: YTAPIErrorContext) => {
  let message = "Error interacting with Youtube Data API."

  if (code === 401) {
    return new ExpiredTokenError("Session Expired. Log in again to continue.")
  }
  else if (code === 403 && context === YTAPIErrorContext.USER_LOGIN) {
    return new AuthorizationError("User log in failed. Try again.")
  }
  else if (code === 403 && context === YTAPIErrorContext.USER_PLAYLISTS) {
    return new AuthorizationError("Request channel associated with your account is either closed or suspended.")
  }
  else if (code === 403 && context === YTAPIErrorContext.PLAYLIST) {
    return new AuthorizationError("Issue with request playlist or request is not properly authorized.")
  }
  else if (code === 404 && context === YTAPIErrorContext.CHANNEL) {
    return new ResourceNotFoundError("Youtube channel does not exist")
  }
  else if (code === 404 && context === YTAPIErrorContext.PLAYLIST) {
    return new ResourceNotFoundError("Requested playlist failed. Note that private playlists cannot be played.")
  }
  else if (code === 404 && context === YTAPIErrorContext.VIDEO) {
    return new ResourceNotFoundError("Requested video failed. Note that private videos cannot be played.")  
  }
  else if (code === 404 && context === YTAPIErrorContext.USER_LOGIN) {
    return new ResourceNotFoundError("User does not exist.")
  }
  else {
    return new ApiError(message)
  }
}

/**
 * Return the appopriate error with the right context based on the error code return from Youtube iFrame API.
 * @param   error           Error code returned from Youtube iFrame Player API
 * @returns {PlayerError}   Error returned to be handled.
 */
export const getYtIframeAPIError = (errorMsg: string) => {
  if (errorMsg === "api.invalidparam") {
      return new PlayerError("Player error has occured. Refresh or try a new item.")
  }
  else if (errorMsg === "auth") {
    return new PlayerError("Owner has disabled video playback. Click on a different video to continue.", ErrorCode.YT_PRIVATE_VIDEO)
  }
  else {
    return new PlayerError("Player error has occured. Refresh or try a new item.")
  }
}