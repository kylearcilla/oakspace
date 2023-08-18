import { initClientApp } from "$lib/yt-api";

import jwtDecode from "jwt-decode";
import { googleData } from "$lib/store";


export const ssr = false;
export const load = () => {
    
}

/**
 * TODO: when no internet connection / can't fetch, functionality below will not run
 */
export const _initGoogleClient = () => {
    const googleRes: any = {}

    initClientApp((res: any) => {
        const user: any = jwtDecode(res.credential);
        googleRes.name = user.name;
        googleRes.profileImgSrc = user.picture;
        googleRes.email = user.email;

        googleData.set(googleRes);
        googleData.subscribe((data: any) => console.log(data))
    })
}


export const _initMusicKit = () => {
    console.log("📌 Initializing Music Kit")
    _initMusicKit2()
    // document.addEventListener('musickitloaded', async function () {
    //     try {
    //         // @ts-ignore
    //         await MusicKit.configure({
    //             developerToken: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjJTUjhGNzRCUUIifQ.eyJpc3MiOiJZNVhOOUZNN0JKIiwiaWF0IjoxNjgyMDAyMzgxLCJleHAiOjE2ODIwMDQxODF9.wLz6IKSCwwB99dQrIiYTd2LPR_SQIBwHrsMdusqI7EXSh-Lob8vr1VIcm36H4Vx-hjxd_ICrU62LWzZ_p_l9_g',
    //             app: {
    //                 name: 'My Cool Web App',
    //                 build: '1.1',
    //             },
    //         });
    //     } catch (err) {
    //         console.log(err)
    //     }
    //     console.log("📌 Success Loading")
    //     // @ts-ignore
    //     const music = MusicKit.getInstance();
    //     console.log(music)
    // });
}

export const _initMusicKit2 = async () => {
    // @ts-ignore
    console.log(MusicKit)
    // @ts-ignore
    if (MusicKit) {
        console.log("HELLO!")
        // @ts-ignore
        await MusicKit.configure({
            developerToken: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjJTUjhGNzRCUUIifQ.eyJpc3MiOiJZNVhOOUZNN0JKIiwiaWF0IjoxNjgyMDA0MjEzLCJleHAiOjE2ODIwMDYwMTN9.wxB7fnGbmbsvGavLAQQNXxfdW3J99-FDYaMUBYm3BzaF9nVJt9O-uOBrm9nO3oAWJIOoPt3u959CGlMckyTnYg',
            app: {
                name: 'My Cool Web App',
                build: '1.1',
            },
        });
        // @ts-ignore
        const music = MusicKit.getInstance();
    }
}

export const _authAppleUser = async () => {
    console.log("📌 Authorizing Music Kit")
    // @ts-ignore
    const music = MusicKit.getInstance()
    console.log(music)
    const token = await music.authorize()
    return token
}