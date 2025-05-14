
import { WEEKLY_ROUTINES, SET_DAILY_ROUTINES } from '../../../../tests/routines/routines.data';
import type { PageLoad } from './$types';

export const ssr = false

export const load = (async () => {
    console.log("weekly load")
    const isDev = import.meta.env.MODE === "development"
    

    if (isDev) {
        return { week: WEEKLY_ROUTINES, day: SET_DAILY_ROUTINES }
    }
    else {
        return { week: WEEKLY_ROUTINES, day: SET_DAILY_ROUTINES }
    }

}) satisfies PageLoad