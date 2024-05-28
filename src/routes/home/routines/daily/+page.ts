import type { PageLoad } from './$types';
import { DAILY_ROUTINES } from '../../../../tests/routines/routines.data'

export const ssr = false

export const load = (async () => {
    const isDev = import.meta.env.MODE === "development"

    if (isDev) {
        return { routines: [DAILY_ROUTINES[0]] }
    }
    else {
        return { routines: [DAILY_ROUTINES[0]] }
    }

}) satisfies PageLoad