import type { PageLoad } from './$types';
import { SET_DAILY_ROUTINES } from '../../../../tests/routines/routines.data'

export const ssr = false

export const load = (async () => {
    const isDev = import.meta.env.MODE === "development"

    if (isDev) {
        return { routines: [] }
    }
    else {
        return { routines: [] }
    }

}) satisfies PageLoad