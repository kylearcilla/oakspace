import { redirect } from "@sveltejs/kit"

export const load = async ({ url }) => {
    const { api, redirectBackUrl } = getOauthRedirectContext()
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (api) {
        localStorage.setItem(`${api}-code`, code ?? "")
        localStorage.setItem(`${api}-error`, error ?? "")
        localStorage.setItem(`${api}-state`, state ?? "")
    }

	throw redirect(301, redirectBackUrl ?? "/home")
}

function getOauthRedirectContext(): { 
    api: "gcal" | "tapi" | null, redirectBackUrl: string | null 
} {
    const context = localStorage.getItem("oauth-redirect-context")
    localStorage.removeItem("oauth-redirect-context")
    
    if (!context) {
        return { api: null, redirectBackUrl: null }
    }
    return JSON.parse(context)
}