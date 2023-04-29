import { get } from "svelte/store";
import { musicData } from "./store";
import { formatTime } from "./helper";

export const intAppleMusicUser = async () => {
    const url = "http://localhost:3000/"
    return await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    })
      .then((response: any) => response.json())
      .then(async (data: any) => {
            saveAppleMusicUserToken(data.token)
            return await initAppleMusic()
      })
      .catch((error: any) => { error })
}

export const initAppleMusic = async () => {
    const devToken = localStorage.getItem("apple-music-user-token") ?? "";

    if (devToken === "") {
        console.log("no devToken!")
        return;
    }

    // @ts-ignore
    if (MusicKit) {
        console.log("HELLO!")
        // @ts-ignore
        await MusicKit.configure({
            developerToken: devToken,
            app: {
                name: 'My Cool Web App',
                build: '1.1',
            },
        });
        // @ts-ignore
        const music = MusicKit.getInstance()
        const authToken = await music.authorize()
        return saveAuthToken(authToken)
    }
    
    return false;
}

export const getDevToken = () => {
    return localStorage.getItem("apple-music-user-token") ?? "";
}
export const getAppleAuthToken = () => {
    return localStorage.getItem("apple-music-auth-token") ?? "";
}

export const saveAppleMusicUserToken = (token: string) => {
    localStorage.setItem("apple-music-user-token", token)
}

export const saveAuthToken = (authToken: string) => {
    localStorage.setItem("apple-music-auth-token", authToken)
    return true;
}

export const getUserDetails = async (token: string) => {
    return await fetch('https://api.music.apple.com/v1/me', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
        },
    })
    .then(response => response.json())
    .then(data => {
        return data
    })
    .catch(error => error);
}

export const getUserPlaylists = async () => {
    // @ts-ignore
    const music = await MusicKit.getInstance()
    const res = await music.api.music('v1/me/library/playlists')
    const playlistsArr: any = []

    console.log(res.data.data)

    for (let playlist of res.data.data) {
        playlistsArr.push({
            id: playlist.attributes.playParams.id,
            globalId: playlist.attributes.playParams.globalId,
            name: playlist.attributes.name,
            description: playlist.attributes?.description?.standard ?? "No Description.",
            artworkSrc: getArtwork(playlist.attributes?.artwork),
            isOwn: playlist.attributes.canEdit
        })
    }

    musicData.update((data) => {
        return { 
            ...data,
            platform: "apple",
            playlists: playlistsArr
        }
    })

    localStorage.setItem("music-data", JSON.stringify(get(musicData)))
    return playlistsArr
}

export const loadUserMusicData = () => {
    if (!localStorage.getItem("music-data")) return null

    return JSON.parse(localStorage.getItem("music-data")!)
}

export const getArtwork = (artwork: any) => {
    if (!artwork) return ""
    // @ts-ignore
    const imgSrc = MusicKit.formatArtworkURL(artwork, 200, 200);
    console.log(imgSrc);
    return imgSrc
}

export const getPlaylistDetails = async (id: string) => {
    // @ts-ignore
    const music = await MusicKit.getInstance()
    const url = `https://api.music.apple.com/v1/catalog/us/playlists/${id}`
    console.log(music)

    const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': "Bearer " + getDevToken()
        }
    })
      .then((response: any) => {
        console.log(response)
        return response.json()
      })
      .then((data: any) => data)
      .catch((error: any) => { 
        console.log(error)
      })

    console.log(res)
    const trackList: any[] = res.data[0].relationships.tracks.data
    const totalTime = trackList.reduce((sum, x) =>  sum + x.attributes.durationInMillis, 0)
    
    const playlistData = {
        id: id,
        name: res.data[0].attributes.name,
        artworkImgSrc: getArtwork(res.data[0].attributes?.artwork),
        songCount: trackList.length,
        time: formatTime(totalTime),
        description: res.data[0].attributes?.description?.standard ?? "",
        type: res.data[0].attributes.playParams.kind
    }

    console.log("SDOIFJSDOIFJSDOFIJ")
    console.log(playlistData)

    // @ts-ignore
    musicData.update((data) => {
        return {
          ...data,
          playerData: {
            ...data.playerData,
            currentPlaylist: playlistData
          }
        }
      })

    localStorage.setItem("music-data", JSON.stringify(get(musicData)))
    return playlistData
}