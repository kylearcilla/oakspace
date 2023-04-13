import { initClientApp } from "$lib/yt-api";

import jwtDecode from "jwt-decode";
import { googleData } from "$lib/store";


export const ssr = false;
export const load = () => {
    
}

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