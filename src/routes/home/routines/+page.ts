import { redirect } from '@sveltejs/kit';

export const ssr = false

export const load = (data) => {
	const route = window.location.href

	console.log("X")

	if (route === `${data.url.origin}/home/routines/daily`) {
		throw redirect(301, "/home/routines/daily")
	}
	else {
		throw redirect(301, "/home/routines/weekly")
	}
}
