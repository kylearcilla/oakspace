import type { PageLoad } from './$types';
import { SET_DAILY_ROUTINES, WEEKLY_ROUTINES } from '../../../../tests/routines/routines.data'

export const ssr = false

export const load = (async () => {
    console.log("daily load")
    const isDev = import.meta.env.MODE === "development"

    if (isDev) {
        return { week: WEEKLY_ROUTINES, day: SET_DAILY_ROUTINES }
    }
    else {
        return { week: WEEKLY_ROUTINES, day: SET_DAILY_ROUTINES }
    }

}) satisfies PageLoad