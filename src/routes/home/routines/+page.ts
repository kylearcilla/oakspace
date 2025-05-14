import { redirect } from '@sveltejs/kit';

export const ssr = false

export const load = async (data) => {
	console.log("routines load")
	const route = window.location.href

	if (route === `${data.url.origin}/home/routines/daily`) {
		throw redirect(301, "/home/routines/daily")
	}
	else {
		throw redirect(301, "/home/routines/weekly")
	}
}
