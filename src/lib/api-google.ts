import { getOAuthRedirectData, removeOAuthRedirectData } from "./utils-home"

// Scopes for YouTube Data API
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly"
const CLIENT_ID = "554073039798-fg87ji0n2iki91g6m16129nkbaocmtl6.apps.googleusercontent.com"
const CLIENT_SECRET = "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"
const REDIRECT_URI = "http://localhost:5173/home/oauth-callback"

const OAUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"

declare const google: any

/**
 *  Initialies two client object: google client app (for signing in with google)
 *  Render a google sign in button. 
 * 
*/
export const initClientApp = (googleSignInCallback: any) => {
    const google = window.google
    
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: googleSignInCallback  // will call back once user grants permission
    })

    google.accounts.id.renderButton(
        document.getElementById("signInDiv"),
        { theme: "outline", size: "large"}
    )
}


export function authGoogleUser(scopes: string[]) {
    const scopeString = scopes.map(scope => `https://www.googleapis.com/auth/${scope}`).join(" ")
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: scopeString,
        access_type: 'offline',
        prompt: 'consent'
    })
    const authUrl = `${OAUTH_ENDPOINT}?${params}`

    window.location.href = authUrl
}

export async function handleGoogleRedirect(): Promise<any> {
    const oauthData = getOAuthRedirectData("gcal")
    if (!oauthData || !oauthData.code) {
        throw new Error("Authorization code not found")
    }
    const { code, error, state } = oauthData

    if (error) {
        throw new Error(error)
    }

    const response = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
        }),
    })

    const { access_token, refresh_token, expires_in } = await response.json()

    return {
        accessToken: access_token, 
        expiresIn: expires_in,
        refreshToken: refresh_token
    }
}

export async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string, expiresIn: number }> {
    const response = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        })
    })

    const { access_token, expires_in } = await response.json()

    return {
        accessToken: access_token,
        expiresIn: expires_in
    }
}