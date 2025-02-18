import { writable, type Writable } from "svelte/store"

import { APIError } from "./errors"
import { toast } from "./utils-toast"
import { APIErrorCode, LogoIcon } from "./enums"
import { getMinsFromStartOfDay } from "./utils-date"
import { toastApiErrorHandler } from "./utils-general"
import { authGoogleCalendar, fetchDayEvents, fetchUserCalendars } from "./api-google-calendar"

export class GoogleCalendarManager {
    accessToken = ""
    profileImg = ""
    email = ""
    username = ""
    signedIn = false

    tokenExpiresInSecs = 3600
    accessTokenCreationDate: Date | null = null
    tokenExpired = false
    loading: "sync" | "refresh" | null = null
    lastSyncTimeStamp: Date | null = null
    
    calendars: GoogleCalendar[] = []
    events: GoogleCalendarEvent[] = []
    
    state: Writable<{ tokenExpired: boolean, loading: "sync" | "refresh" | null }> = writable({
        tokenExpired: false,
        loading: null
    })
    static HOUR_BLOCK_HEIGHT = 45

    MAX_BLOCK_TIME_HEIGHT = 15
    ACTIVE_TOKEN_THRESHOLD_SECS = 60

    constructor() {
        if (this.hasPrevSession()) {
            this.continueSession()
        }
    }

    /* auth */

    async init() {
        try {
            this.setLoading()
            const res = await authGoogleCalendar()
    
            this.email = res.email
            this.accessToken = res.accessToken
            this.username = res.username
            this.profileImg = res.profileImgSrc
            this.accessTokenCreationDate = new Date()

            await this.setUserData()
            this.saveCalendarData()
            this.initToast("Logged In!")
        }
        catch(e: any) {
            localStorage.removeItem("google-calendar")

            if (e.code !== APIErrorCode.AUTH_DENIED) {
                this.onError({ error: new APIError(APIErrorCode.AUTHORIZATION_ERROR) })
            }
            throw e
        }
        finally {
            this.setLoading(null)
        }
    }

    private async setUserData(date = new Date()) {
        await this.setUserCalendars()
        await this.setDateEvents(date)

        this.lastSyncTimeStamp = new Date()
    }

    async continueSession() {
        try {
            this.localCalendarDataFromPrevSession()
            this.setLoading()
            await this.setUserData()
        }
        catch(e: any) {
            this.onError({ 
                error: e, 
                refreshFunc: async () => {
                    await this.refreshAccessToken()
                    await this.setUserData()
                }
            })
        }
        finally {
            this.setLoading(null)
        }
    }

    async refreshAccessToken() {
        try {
            this.setLoading("refresh")
            const res = await authGoogleCalendar()
            this.accessToken = res.accessToken
            this.accessTokenCreationDate = new Date()
            
            this.initToast("Token Refreshed!")
            this.setTokenExpired(false)
            this.saveCalendarData()
        }
        catch(e: any) {
            if (e.code !== APIErrorCode.AUTH_DENIED) {
                this.onError({ error: new APIError(APIErrorCode.AUTHORIZATION_ERROR) })
            }
            throw e
        }
        finally {
            this.setLoading(null)
        }
    }

    async refreshData(date = new Date) {
        try {
            this.setLoading("sync")
            await this.setUserData(date)
            this.setEventStyles()
        }
        catch(e: any) {
            this.onError({ error: new APIError(APIErrorCode.GENERAL) })
            throw e
        }
        finally {
            this.setLoading(null)
        }
    }

    hasAccessTokenExpired() {
        const currentTime = new Date().getTime()
        const timeElapsed = currentTime - new Date(this.accessTokenCreationDate!).getTime()
        const timeRemaining = (this.tokenExpiresInSecs * 1000) - timeElapsed
    
        const threshold = this.ACTIVE_TOKEN_THRESHOLD_SECS * 1000 
    
        return threshold >= timeRemaining
    }

    verifyAccessToken() {
        if (this.hasAccessTokenExpired()) {
            this.setLoading(null)
            this.setTokenExpired(true)

            throw new APIError(APIErrorCode.EXPIRED_TOKEN)
        }
    }

    /* cal data */

    async setUserCalendars() {
        this.lastSyncTimeStamp = new Date()
        this.verifyAccessToken()
        this.calendars = await fetchUserCalendars(this.accessToken)
        this.saveCalendarData()

        return this.calendars
    }

    async setDateEvents(day: Date) {
        this.verifyAccessToken()
        this.events = await fetchDayEvents({
            day,
            token: this.accessToken,
            calendars: this.calendars
        })
        this.saveCalendarData()

        return this.events
    }

    async updateDayEvents(day: Date) {
        try {
            if (this.loading) return []
            this.setLoading("sync")
            this.lastSyncTimeStamp = new Date()
    
            await this.setDateEvents(day)

            this.setEventStyles()
            this.setLoading(null)
            return this.events
        }
        catch(e: any) {
            this.onError({ error: e })
        }
    }

    /* ui */
    
    setEventStyles() {
        const containerHeight = this.getContainerHeight()

        this.events = this.events.map((e) => ({
            ...e,
            top:    e.allDay ? "0px" : `${Math.floor((e.timeStart / 1440) * containerHeight)}px`,
            height: e.allDay ? "0px" : `${Math.floor(((Math.max(e.timeEnd - e.timeStart, this.MAX_BLOCK_TIME_HEIGHT)) / 1440) * containerHeight)}px`,
            left:   "0px",
            width:  "90%"
        }))


        this.handleCollisions()
        this.saveCalendarData()
        return this.events
    }

    toggleViewCalendar(calendarId: string) {
        this.calendars = this.calendars.map((cal) => {
            return {
                ...cal,
                isChecked: cal.id === calendarId ?!cal.isChecked : cal.isChecked
            }
        })
        return this.calendars
    }

    getContainerHeight() {
        return GoogleCalendarManager.HOUR_BLOCK_HEIGHT * 24
    }


    handleCollisions() {
        const collisions = this.getCollisions()

        for (let i = 0; i < collisions.length; i++) {
            const idx   = i -= (i >= 15 ? 12 : 0)
            const event = collisions[i]

            event.idx = idx + 1
            this.setOverlapBoxLeftPosAndWidth(event)
        }
    }

    setOverlapBoxLeftPosAndWidth(event: GoogleCalendarEvent) {
        switch (event.idx) {
            case 1:
                event.left = 'calc((100% - 0px) * 0 + 0px)';
                event.width = "calc((100% - 4px) * 1)";
                break;
            case 2:
                event.left = "calc((100% - 0px) * 0.2 + 0px)";
                event.width = "calc((100% - 4px) * 0.80)";
                break;
            case 3:
                event.left = "calc((100% - 0px) * 0.45 + 0px)";
                event.width = "calc((100% - 4px) * 0.55)";
                break;
            case 4:
                event.left = "calc((100% - 0px) * 0.0 + 0px)";
                event.width = "calc((100% - 4px) * 0.44)";
                break;
            case 5:
                event.left = "calc((100% - 0px) * .5 + 0px)";
                event.width = "calc((100% - 4px) * 0.35)";
                break;
            case 6:
                event.left = "calc((100% - 0px) * 0.1 + 0px)";
                event.width = "calc((100% - 4px) * 0.4)";
                break;
            case 7:
                event.left = "calc((100% - 0px) * 0.5 + 0px)";
                event.width = "calc((100% - 4px) * 0.5)";
                break;
            case 8:
                event.left = "calc((100% - 0px) * 0.25 + 0px)";
                event.width = "calc((100% - 4px) * 0.25)";
                break;
            case 9:
                event.left = "calc((100% - 0px) * 0.55 + 0px)";
                event.width = "calc((100% - 4px) * 0.35)";
                break;
            case 10:
                event.left = "calc((100% - 0px) * 0.55 + 0px)";
                event.width = "calc((100% - 16px) * 0.15)";
                break;
            case 11:
                event.left = "calc((100% - 0px) * 0.70 + 0px)";
                event.width = "calc((100% - 16px) * 0.15)";
                break;
            case 12:
                event.left = "calc((100% - 0px) * 0.85 + 0px)";
                event.width = "calc((100% - 16px) * 0.15)";
                break;
            case 13:
                event.left = "calc((100% - 0px) * 0.05 + 0px)";
                event.width = "calc((100% - 16px) * 0.25)";
                break;
            case 14:
                event.left = "calc((100% - 0px) * 0.30 + 0px)";
                event.width = "calc((100% - 16px) * 0.25)";
                break;
            case 15:
                event.left = "calc((100% - 0px) * 0.55 + 0px)";
                event.width = "calc((100% - 16px) * 0.25)";
                break;
            default:
              break
          }
    }

    getCollisions() {
        const overlaps: GoogleCalendarEvent[] = []
        const events = this.events.sort((a, b) => parseInt(a.top) - parseInt(b.top))
        
        for (let i = 0; i < events.length; i++) {
            const e1 = events[i]
            if (e1.allDay) continue

            // see if a block overlaps with any other event
            for (let j = i + 1; j < events.length; j++) {
                const e2 = events[j]
                if (e2.allDay) continue 

                const [e1Top, e1Bottom] = [
                    parseInt(e1.top),
                    parseInt(e1.top) + parseInt(e1.height)
                ]
                const [e2Top, e2Bottom] = [
                    parseInt(e2.top), 
                    parseInt(e2.top) + parseInt(e2.height)
                ]

                // if e1 is above e2 but e1 ends after e2 starts
                if (e1Top < e2Bottom && e1Bottom > e2Top) {
                    if (!overlaps.includes(e1)) {
                        overlaps.push(e1)
                    }
                    if (!overlaps.includes(e2)) {
                        overlaps.push(e2)
                    }
                }
            }
        }

        return overlaps.sort((a, b) => parseInt(a.top) - parseInt(b.top))
    }

    /* utils */

    watchUpcomingEvents() {
        if (!this.events) return
        const nowMins = getMinsFromStartOfDay(new Date())
        
        this.events.forEach(event => {
            if (event.allDay) return
            
            const timeUntilStart = event.timeStart - nowMins
            if (timeUntilStart === 5) {
                this.initToast(`${event.title} starting in 5 minutes`)
            }
        })
    }

    setLoading(loading: "sync" | "refresh" | null = "sync") {
        this.loading = loading
        this.state.update((state) => ({ ...state, loading }))
    }

    setTokenExpired(isTokenExpired: boolean) {
        this.tokenExpired = isTokenExpired
        this.state.update((state) => ({ ...state, tokenExpired: isTokenExpired }))
    }

    onError({ error, refreshFunc = () => this.refreshAccessToken() }: { 
        error: any
        refreshFunc?: () => void 
    }) {
        console.error(error)
        error = error.code === undefined ? new APIError(APIErrorCode.GENERAL) : error

        toastApiErrorHandler({
            error,
            title: "Google Calendar",
            logoIcon: LogoIcon.GoogleCal,
            contextId: "google-calendar",
            ...(error.code === APIErrorCode.EXPIRED_TOKEN && {
                action: {
                    label: "Continue session",
                    onClick: () => refreshFunc()
                }
            })
        })
    }

    initToast(msg: string) {
        toast("default", {
            icon:    LogoIcon.GoogleCal,
            message:    "Google Calendar",
            description: msg,
        })
    }

    /* state */

    quit() {
        this.signedIn = false
        this.calendars = []
        this.events = []

        localStorage.removeItem("google-calendar")
        this.initToast("Logged Out!")
    }

    saveCalendarData() {
        localStorage.setItem('google-calendar', JSON.stringify({
            accessToken: this.accessToken,
            accessTokenCreationDate: this.accessTokenCreationDate,
            profileImg: this.profileImg,
            email:      this.email,
            username:   this.username
        }))
    }

    hasPrevSession() {
        const data = localStorage.getItem("google-calendar")
        return data !== null
    }

    localCalendarDataFromPrevSession() {
        const data = localStorage.getItem("google-calendar")
        if (!data) return

        const calendar = JSON.parse(data)

        this.accessToken = calendar.accessToken
        this.accessTokenCreationDate = new Date(calendar.accessTokenCreationDate)
        this.profileImg = calendar.profileImg
        this.email = calendar.email
        this.username = calendar.username

        this.calendars = calendar.calendars
        this.events = calendar.events

        this.signedIn = true
    }
}

export function initGoogleCalSession() {
    const data = localStorage.getItem("google-calendar")

    if (data) {
        return new GoogleCalendarManager()
    }
    else {
        return null
    }
}