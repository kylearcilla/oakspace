import { redirect } from '@sveltejs/kit';

export const ssr = false

export const load = () => {
	throw redirect(301, "/home/routines/weekly");
}
