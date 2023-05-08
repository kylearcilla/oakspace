import { get } from "svelte/store";
import { musicContext, userMusicPlaylists, curentPlaylist, musicPlayerData, currentTrack } from "./store";
import { formatTime } from "./helper";

/* Authentication */

/* Utils */
export const getUserApplePlaylists = async () => {
    // @ts-ignore
    const music = await MusicKit.getInstance()
    const res = await music.api.music('v1/me/library/playlists')
    const playlistsArr: any = []

    for (let playlist of res.data.data) {
        const descriptionText = playlist.attributes?.description?.short ?? playlist.attributes?.description?.standard
        playlistsArr.push({
            id: playlist.attributes.playParams.id,
            globalId: playlist.attributes.playParams.globalId,
            name: playlist.attributes.name,
            description: descriptionText ?? "No Description.",
            artworkSrc: getArtwork(playlist.attributes?.artwork),
            isOwn: playlist.attributes.canEdit
        })
    }

    return playlistsArr
}

export const getArtwork = (artwork: any) => {
    if (!artwork) return ""
    // @ts-ignore
    const imgSrc = MusicKit.formatArtworkURL(artwork, 200, 200);
    return imgSrc
}

export const getAppleMusicPlaylistDetails = async (playlistId: string, token: string): Promise<MusicPlaylist | null>  => {
    const url = `https://api.music.apple.com/v1/catalog/us/playlists/${playlistId}`
    const options = {
        method: 'GET',
        headers: {
            'Authorization': "Bearer " + token
        }
    }

    const res = await fetch(url, options)
                        .then((response: any) => response.json())
                        .then((data: any) => data)
                        .catch((error: any) => console.log("ERRO BITCH!", error))

    const trackList: any[] = res.data[0].relationships.tracks.data
    const totalTime = trackList.reduce((sum, x) =>  sum + x.attributes.durationInMillis, 0)
    const descriptionText = res.data[0].attributes?.description?.short ?? res.data[0].attributes?.description?.standard
    
    const playlistData: MusicPlaylist = {
        id: playlistId,
        name: res.data[0].attributes.name,
        artworkImgSrc: getArtwork(res.data[0].attributes?.artwork),
        songCount: trackList.length,
        time: formatTime(totalTime),
        description: descriptionText ?? "No Description",
        type: res.data[0].attributes.playParams.kind,
        currentIndex: 0,
    }

    return playlistData
}
