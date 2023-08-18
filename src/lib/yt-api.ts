import firebase from "firebase/compat/app";
import auth from  "./firebase";
import jwtDecode from "jwt-decode";
import { ytCredentials, ytUserData } from "./store";

// Replace with your client ID and secret
const CLIENT_ID = "554073039798-fg87ji0n2iki91g6m16129nkbaocmtl6.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:5173/home";
const KEY = "AIzaSyDDkpi29J7e7sPeFc98Ajg_DBcrq_qPjHo"

// Scopes for YouTube Data API
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly";

declare const google: any;

/**
 *  Initialies two client object: google client app (for signing in with google)
 *  Render a google sign in button. 
 * 
*/
export const initClientApp = (googleSignInCallback: any) => {
    const google = window.google
    
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: googleSignInCallback  // will call back once user grants permission
    })

    google.accounts.id.renderButton(
        document.getElementById("signInDiv"),
        { theme: "outline", size: "large"}
    )
}



/**
 * Initiailze 0Auth 2.0 Flow using Firebase to get access token to utilize Google APIs. 
 * Generates a user consent screen pop-up to grant client app permission.
 * Returns an access token and user account metadata. Pass responses in callback function.
 * 
 * @param callback Calls callback function that init global store after user has allowed client to use user data. 
 * 
*/
export const initOAuth2Client = async () => {
    const provider = new firebase.auth.GoogleAuthProvider()
    provider.addScope("https://www.googleapis.com/auth/youtube.readonly")

    try {
        const popUpResponse = await auth.signInWithPopup(provider) as any
        const credential = popUpResponse.credential

        let ytCreds: YoutubeUserCreds = {
            accessToken: "",
            refreshToken: ""
        }
        let ytUserData: any = {
            username: "",
            channelImgSrc: "",
            email: ""
        }
    
        ytCreds.accessToken = credential!.accessToken
        ytUserData.email = popUpResponse!.additionalUserInfo!.profile!.email
        ytUserData.username = popUpResponse!.additionalUserInfo!.profile!.name
        ytUserData.channelImgSrc = popUpResponse!.additionalUserInfo!.profile!.picture
    
        intUserYtData(ytUserData, ytCreds.accessToken)
        initYtCreds(ytCreds)

    } catch (error) {
        console.log(error)
    }
}

export const initYtCreds = (ytCreds: any) => {
  ytCredentials.set({ ...ytCreds });
  saveYtCredentials(ytCreds);
}

export const intUserYtData = async (ytData: YoutubeUserData, accessToken: string) => {
  const userPlaylists = await getUserYtPlaylists(accessToken)
  
  ytUserData.update((data) => ({ ...data, ...ytData, playlists: userPlaylists }))
  saveYtUserData({ ...ytData, playlists: userPlaylists });
}

export const resetYtUserData = () => {
  ytUserData.update((data: YoutubeUserData) => {
      return {
          ...data,
          username: '',
          channelImgSrc: '',
          email: '',
          playlists: [],
          selectedPlaylist: data?.selectedPlaylist?.isRecPlaylist ? data.selectedPlaylist : null
      }
  });
  ytCredentials.update(() => ({ accessToken: '', refreshToken: '' }));
  deleteYtCredentials()
  deleteYtUserData()
}

export const getUserYtPlaylists = async (accessToken: string): Promise<YoutubePlaylist[]> => {
  const playlists: YoutubePlaylist[] = []
  const results = await getUserPlaylists(accessToken)
  const playlistResults: [] = results.items

  playlistResults.map((playlist: any) => {
      playlists.push({
          id: playlist.id,
          title: playlist.snippet.title,
          description: playlist.snippet.description,
          vidCount: playlist.contentDetails.itemCount,
          channelId: playlist.snippet.channelId,
          thumbnailURL: playlist.snippet.thumbnails.medium.url,
          isRecPlaylist: false
      });
  })
  return playlists
}

/* Local Storage */

export const saveYtCredentials = (ytCredentials: any) => {
    localStorage.setItem('yt-credentials', JSON.stringify(ytCredentials));
}

export const deleteYtCredentials = () => {
    localStorage.removeItem('yt-credentials');
}

export const deleteYtUserData = () => {
    localStorage.removeItem('yt-user-data');
    localStorage.removeItem("")
    localStorage.removeItem("currentVidId")
}

export const saveYtUserData = (ytUserData: any) => {
    localStorage.setItem('yt-user-data', JSON.stringify(ytUserData));
}

/* Youtube API Requests */

export const getUserPlaylists = async (accessToken: string) => {
    const key = KEY ?? "";
    const url = `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet%2CcontentDetails&maxResults=30&mine=true&key=${key}`;
  
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${accessToken}`);
  
    return fetch(url, {
      method: "GET",
      headers: headers,
    })
      .then((res) => res.json())
      .then((data) => data)
      .catch((error) => { throw new Error(error) });
  };
  
  export const getVidDetails = async (videoId: string) => {
    const key = KEY ?? "";
    let url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics,id&id=${videoId}&key=${key}`;
  
    return fetch(url)
      .then((res) => res.json())
      .then((data) => data)
      .catch((error) => { throw new Error(error) });
  };
  
  export const getChannelDetails = async (channelId: string) => {
    const key = KEY ?? "";
    const url = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet%2Cstatistics&id=${channelId}&key=${key}`;
    return fetch(url)
      .then((res) => res.json())
      .then((data) => data)
      .catch((error) => { throw new Error(error) });
  };
  
  export const getPlayListDetails = async (playlistId: string) => {
    const key = KEY ?? "";
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${playlistId}&key=${key}`;
  
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
  
    return fetch(url, {
      method: "GET",
      headers: headers,
    })
      .then((res) => res.json())
      .then((data) => data)
      .catch((error) => { throw new Error(error) });
  };