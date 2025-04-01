import { APIError } from "./errors"
import { APIErrorCode } from "./enums"
import { shorterNum } from "./utils-general"
import { authGoogleUser } from "./api-google"
import { YoutubeUserData } from "./youtube-user-data"
import { PUBLIC_YT_DATA_V3_API_KEY } from '$env/static/public'
import { getOAuthRedirectData, setOatuhRedirectContext } from "./utils-home"

const YT_DATA_API_URL = "https://youtube.googleapis.com/youtube/v3"

export function authYoutubeClient() {
  authGoogleUser(["youtube.readonly"])
  setOatuhRedirectContext("yt")
}

export function initYoutubeUserData() {
  const oauthData = getOAuthRedirectData("yt")
  const data = localStorage.getItem("youtube-user-data")

  if (oauthData) {
      return new YoutubeUserData({ context: "init" })
  }
  else if (data) {
      return new YoutubeUserData({ context: "continue" })
  }
  else {
      return null
  }
}

export async function getUserYtPlaylists({ accessToken, max, nextPageToken = "" }: { 
  accessToken: string 
  max: number 
  nextPageToken?: string 
}): Promise<YoutubeUserPlaylistResponse> {

  const url = new URL(`${YT_DATA_API_URL}/playlists`)
  url.searchParams.append("part", "snippet,contentDetails")
  url.searchParams.append("maxResults", max.toString())
  url.searchParams.append("mine", "true")
  url.searchParams.append("key", PUBLIC_YT_DATA_V3_API_KEY)

  if (nextPageToken) {
    url.searchParams.append("pageToken", nextPageToken)
  }
  
  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`
  })
  const res = await fetch(url.toString(), { method: "GET", headers })
  const data = await res.json()
  
  if (!res.ok) {
      console.error(data)
      
      throw throwYoutubeDataAPIError({
        location: data.error.errors[0].location,
        message: data.error.errors[0].message,
        code: data.error.code,
        status: data.error.status
      })
  }

  const playlists: YoutubePlaylist[] = []
 
  data.items.forEach((playlist: any) => {
    const { snippet, contentDetails } = playlist

      playlists.push({
          id: playlist.id,
          title: snippet.title,
          description: snippet.description,
          vidCount: contentDetails.itemCount,
          channelTitle: snippet.channelTitle,
          thumbnailURL: snippet.thumbnails.medium.url,
          firstVidId: null
      })
  })

  return {
    playlists,
    nextPageToken: data?.nextPageToken,
    playlistsTotal: data.pageInfo.totalResults
  }
}

export async function getVidDetails(videoId: string): Promise<YoutubeVideo | null> {
    const url = new URL(`${YT_DATA_API_URL}/videos`)
    url.searchParams.append("part", "snippet,status,statistics,id")
    url.searchParams.append("id", videoId)
    url.searchParams.append("key", PUBLIC_YT_DATA_V3_API_KEY)
    
    const res = await fetch(url.toString())
    const data = await res.json()

    if (!res.ok) {
      console.error(data)

      throw throwYoutubeDataAPIError({
        location: data.error.errors[0].location,
        message: data.error.errors[0].message,
        code: data.error.code,
        status: data.error.status
      })
    }

    if (data.items.length === 0) return null

    return {
        id: data.items[0].id,
        title: data.items[0].snippet.title,
        likeCount: shorterNum(data.items[0].statistics.likeCount),
        viewCount: shorterNum(data.items[0].statistics.viewCount),
        publishedAt: data.items[0].snippet.publishedAt,
        thumbnailSrc: data.items[0].snippet.thumbnails.medium,
        channelName: data.items[0].snippet.channelTitle,
        embeddable: data.items[0].status.embeddable
    }
}

export async function getPlayListItemsDetails ({ playlistId, maxResults = 1 }: { 
  playlistId: string 
  maxResults?: number
}): Promise<YoutubePlaylistResponse> {

  const url = new URL(`${YT_DATA_API_URL}/playlistItems`)
  url.searchParams.append("part", "snippet,id")
  url.searchParams.append("maxResults", maxResults.toString())
  url.searchParams.append("playlistId", playlistId)
  url.searchParams.append("key", PUBLIC_YT_DATA_V3_API_KEY)
  
  const headers = new Headers({ "Content-Type": "application/json" })
  const res = await fetch(url.toString(), { method: "GET", headers })
  const data = await res.json()

  if (!res.ok) {
    console.error(data)

    throw throwYoutubeDataAPIError({
      location: data.error.errors[0].location,
      message: data.error.errors[0].message,
      code: data.error.code,
      status: data.error.status
    })
  }

  if (data.items.length === 0) {
      return {
          videos: [],
          nextPageToken: "",
          playlistLength: 0
      }
  }

  const playlistItems: YoutubeVideo[] = []
  
  for (const plItem of data.items) {
      playlistItems.push({
        id: plItem.snippet.resourceId.videoId,
        title: plItem.snippet.title,
        likeCount: "",
        viewCount: "",
        thumbnailSrc: plItem.snippet.thumbnails?.default?.url ?? "",
        publishedAt: plItem.snippet.publishedAt,
        channelName: plItem.snippet?.videoOwnerChannelTitle
      })
  }

  return {
    videos: playlistItems,
    nextPageToken: data.nextPageToken,
    playlistLength: data.pageInfo.totalResults,
  }
}

export async function getPlaylistDetails(playlistId: string): Promise<YoutubePlaylist | null> {
  const url = new URL(`${YT_DATA_API_URL}/playlists`)
  url.searchParams.append("part", "id,snippet")
  url.searchParams.append("id", playlistId)
  url.searchParams.append("key", PUBLIC_YT_DATA_V3_API_KEY)
  
  const headers = new Headers({
    "Content-Type": "application/json",
  })
  const res = await fetch(url.toString(), { method: "GET", headers })
  const data = await res.json()

  if (!res.ok) {
    console.error(data)

    throw throwYoutubeDataAPIError({
      location: data.error.errors[0].location,
      message: data.error.errors[0].message,
      code: data.error.code,
      status: data.error.status
    })
  }

  if (data.items.length === 0) return null

  return {
    id: data.items[0].id,
    title: data.items[0].snippet.title,
    description: data.items[0].snippet.description,
    vidCount: -1,
    channelTitle: data.items[0].snippet.channelTitle,
    thumbnailURL: data.items[0].snippet.thumbnails.medium.url,
    firstVidId: null
  }
}

/**
 * Get the right error object to throw after a failed request.
 * Codes / error messages are based on Youtube Data v3 API docs.
 * 
 * https://developers.google.com/youtube/v3/docs/errors 
 * 
 * @param   code     HTTP Status error code returned from Youtube Data API
 * @param   context  In what API context is the error originating from
 * @returns          Error type and context will be relevant in how the error will be displayed to the user.
 */
function throwYoutubeDataAPIError({ status, code, location, message }: {
  status?: number,
  code?: number,
  location?: string,
  message?: string
}) {
    if (code === 404) {
      console.log("A")
      throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Requested media unavailable.")
    }
    else if (message === "Invalid Credentials") {
      console.log("B")
      throw new APIError(APIErrorCode.EXPIRED_TOKEN)
    }
    else {
      console.log("C")
        throw new APIError(APIErrorCode.GENERAL, "There was an error with Youtube. Please try again later.")
    }
}

/**
 * Return the appopriate error with the right context based on the error code return from Youtube iFrame API.
 * https://developers.google.com/youtube/iframe_api_reference
 * 
 * @param error  Error code returned from Youtube iFrame Player API
 */
export function getYtIframeAPIError(code: number, target?: any) {
  const playlistIdx = target?.getPlaylistIndex() ?? -1

  if (code === 2) {
    return new APIError(APIErrorCode.PLAYER, "Player error. Invalid playlist / video id.")
  }
  else if (code === 5) {
    return new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Player error. This content cannot be played.")
  }
  else if (code === 100) {
    return new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Player error. Resource request not found.")
  }
  else if (code === 150 && playlistIdx > 0) {
    return new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Video couldn't be played due to privacy or embed playback restrictions.")
  }
  else if (code === 101 || code === 150) {
    return new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Playlist couldn't be played due to privacy or embed playback restrictions.")
  }
  else {
    return new APIError(APIErrorCode.PLAYER)
  }
}