import { redirect } from "@sveltejs/kit";

export const load = async ({ url }) => {
    const redirectBackUrl = localStorage.getItem("redirect-back-url")
    localStorage.removeItem("redirect-back-url")

    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    localStorage.setItem("tapi-code", code ?? "")
    localStorage.setItem("tapi-error", error ?? "")
    localStorage.setItem("tapi-ostate", state ?? "")

	throw redirect(301, redirectBackUrl ?? "/home")
}