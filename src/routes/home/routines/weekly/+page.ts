
import { WEEKLY_ROUTINES } from '../../../../tests/routines/routines.data';
import type { PageLoad } from './$types';

export const ssr = false

export const load = (async () => {
    const isDev = import.meta.env.MODE === "development"

    if (isDev) {
        return { routines: WEEKLY_ROUTINES }
    }
    else {
        return { routines: WEEKLY_ROUTINES }
    }

}) satisfies PageLoad