import type { PageLoad } from './$types';

export const load = (async () => {
    console.log("goals load")
    return {};
}) satisfies PageLoad;