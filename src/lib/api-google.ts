import { throwFireBaseAPIError } from "./api-youtube"
import auth from  "./firebase"
import firebase from "firebase/compat/app"

// Scopes for YouTube Data API
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly"
const CLIENT_ID = "554073039798-fg87ji0n2iki91g6m16129nkbaocmtl6.apps.googleusercontent.com"
const CLIENT_SECRET = "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"
const REDIRECT_URI = "http://localhost:5173/home"

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

/**
 * Initiailze 0Auth 2.0 Flow using Firebase to get access token to utilize Google APIs. 
 * Generates a user consent screen pop-up to grant client app permission.
 * Returns the result after pop flow has completed
 * 
 * @returns  Flow result
 * 
 */
export async function authGoogleUser(scopes: string[]): Promise<any> {
    const provider = new firebase.auth.GoogleAuthProvider()
    scopes.forEach((scope) => {
        provider.addScope(`https://www.googleapis.com/auth/${scope}`)
    })

    const popUpResponse = await auth.signInWithPopup(provider) as any

    return popUpResponse
}