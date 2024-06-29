import jwtDecode from "jwt-decode"
import { googleData } from "$lib/store"
import { initClientApp } from "$lib/api-google"
import YT_PLAYLIST_GROUPS from "$lib/data-yt-playlists"
import type { PageLoad } from "../$types"

export const ssr = false
export const load = (async () => {
    
}) satisfies PageLoad

/**
 * TODO: when no internet connection / can't fetch, functionality below will not run
 */
// export const _initGoogleClient = () => {
//     const googleRes: any = {}

//     initClientApp((res: any) => {
//         const user: any = jwtDecode(res.credential)
//         googleRes.name = user.name
//         googleRes.profileImgSrc = user.picture
//         googleRes.email = user.email

//         googleData.set(googleRes)
//         googleData.subscribe((data: any) => console.log(data))
//     })
// }

