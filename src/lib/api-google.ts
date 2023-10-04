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