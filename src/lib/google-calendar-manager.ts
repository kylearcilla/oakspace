import { writable, type Writable } from "svelte/store"

import { APIError } from "./errors"
import { toast } from "./utils-toast"
import { APIErrorCode, LogoIcon } from "./enums"
import { getMinsFromStartOfDay } from "./utils-date"
import { toastApiErrorHandler } from "./utils-general"
import { handleGoogleRedirect, refreshGoogleToken } from "./api-google"
import { fetchDayEvents, fetchDayEventsPartial, fetchUserCalendars } from "./api-google-calendar"

export class GoogleCalendarManager {
    accessToken = ""
    refreshToken = ""
    expiresIn = 0
    accessTokenCreationDate: Date | null = null
    calSyncToken = ""

    signedIn = false
    tokenExpired = false
    loading: "sync" | "refresh" | null = null
    lastSyncTimeStamp: Date | null = null
    autoSyncTimeStamp: Date | null = null
    
    calendars: GoogleCalendar[] = []
    events: GoogleCalendarEvent[] = []
    
    state: Writable<GoogleCalendarState> = writable({
        signedIn: false, tokenExpired: false, loading: null
    })
    
    private calendarCache: Map<string, {
        events: GoogleCalendarEvent[]
        lastSyncTime: number
    }> = new Map()

    private CACHE_HIT_SYNC_THRESHOLD_SECS = 20
    private AUTO_REFRESH_INTERVAL_SECS = 5 * 60

    static HOUR_BLOCK_HEIGHT = 45
    MAX_BLOCK_TIME_HEIGHT = 15
    ACTIVE_TOKEN_THRESHOLD_SECS = 60

    constructor({ context }: { context: "continue" | "init" }) {
        if (context === "init") {
            this.handleRedirect()
        }
        else if (context === "continue") {
            this.continueSession()
        }
    }

    /* auth */

    async handleRedirect() {
        try {
            this.setLoading()
            console.log("googlecal - handle redirect")

            const { accessToken, refreshToken, expiresIn } = await handleGoogleRedirect("gcal")
            this.accessToken = accessToken
            this.refreshToken = refreshToken
            this.expiresIn = expiresIn
            this.accessTokenCreationDate = new Date()

            await this.initDayCalsEvents()
            this.saveCalendarData()
            this.setSignedIn(true)

            this.initToast("Logged In!")
        }
        catch (e: any) {
            console.error(e)
            this.onError({ error: new APIError(APIErrorCode.AUTHORIZATION_ERROR) })
            this.quit({ error: true })
        }
        finally {
            this.setLoading(null)
        }
    }

    async continueSession() {
        try {
            console.log("googlecal - continue session")
            this.localCalendarDataFromPrevSession()
            this.setLoading()
            await this.initDayCalsEvents()

            this.autoSyncTimeStamp = new Date()
            this.setSignedIn(true)
        }
        catch(error: any) {
            console.error(error)

            if (error.code === APIErrorCode.EXPIRED_TOKEN) {
                this.onError({ 
                    error, 
                    refreshFunc: async () => {
                        try {
                            await this.refreshAccessToken()
                            await this.initDayCalsEvents()
                        }
                        catch(error: any) {
                            this.quit({ error: true })
                        }
                    }
                })
            }
            else {
                this.onError({ error })
            }
        }
        finally {
            this.setLoading(null)
        }
    }

    /* state */

    async refreshAccessToken() {
        try {
            this.setLoading("refresh")
            const { accessToken, expiresIn } = await refreshGoogleToken(this.refreshToken)
            console.log("googlecal - token refreshed")

            this.accessToken = accessToken
            this.expiresIn = expiresIn
            this.accessTokenCreationDate = new Date()
            
            this.setTokenExpired(false)
            this.saveCalendarData()
        }
        catch(e: any) {
            console.error(e)
            this.onError(e)
        }
        finally {
            this.setLoading(null)
        }
    }

    async autoRefreshHandler(focusDate: Date) {
        if (!this.signedIn || this.loading) {
            return
        }
        if (!this.autoSyncTimeStamp) {
            this.autoSyncTimeStamp = new Date()
        }
        const now = new Date()
        const diff = now.getTime() - this.autoSyncTimeStamp.getTime()
        
        if (diff < this.AUTO_REFRESH_INTERVAL_SECS * 1000) {
            return this.lastSyncTimeStamp
        }
        try {
            this.autoSyncTimeStamp = now
            this.setLoading("sync")
            console.log("googlecal - auto refresh")
            console.log(diff)
            await this.refreshDayEvents(focusDate)
        } 
        catch (e) {
            console.error(e)
            this.onError({ error: e })
        } 
        finally {
            this.setLoading(null)
        }
    }

    async refreshDayEvents(day: Date) {
        console.log("refresh day events")
        try {
            this.setLoading("sync")
            this.lastSyncTimeStamp = new Date()
    
            await this._initDayCalsEvents({ day, type: "partial" })

            this.setCacheForDate(day)
            this.setEventStyles()
            return this.events
        }
        catch(e: any) {
            console.error(e)
            this.onError({ error: e })
        }
        finally {
            this.setLoading(null)
        }
    }

    hasAccessTokenExpired() {
        const currentTime = new Date().getTime()
        const timeElapsed = currentTime - this.accessTokenCreationDate!.getTime()
        const timeRemaining = (this.expiresIn * 1000) - timeElapsed
        const threshold = this.ACTIVE_TOKEN_THRESHOLD_SECS * 1000 
    
        return timeRemaining <= threshold
    }

    async verifyAccessToken() {
        if (this.hasAccessTokenExpired()) {
            try {
                await this.refreshAccessToken()
            }
            catch {
                this.setTokenExpired(true)
                throw new APIError(APIErrorCode.EXPIRED_TOKEN)
            }
        }
    }

    /* data */

    /**
     * For refreshes, new date focus.
     * @param date  Date currently in view.
     */
    private async initDayCalsEvents(date = new Date()) {
        const cache = this.getCacheForDate(date)
        if (cache) {
            console.log("google cal - found cache for", this.getDateKey(date))
            
            if (this.doSyncOnCacheFetch(cache.lastSyncTime)) {
                console.log("google cal - cache stale, doing partial sync")

                await this._initDayCalsEvents({ day: date, type: "partial" })
                this.setCacheForDate(date)
                this.lastSyncTimeStamp = new Date()
            }
            else {
                this.events = cache.events
                this.lastSyncTimeStamp = new Date(cache.lastSyncTime)
            }
        }
        else {
            console.log("google cal - no cache, doing full sync")
            await this._initDayCalsEvents({ day: date, type: "full" })
            this.setCacheForDate(date)
            this.lastSyncTimeStamp = new Date()
        }
    }

    private async _initDayCalsEvents({ day, type }: { day: Date, type: "partial" | "full" }) {
        await this.initCals({ type })
        await this.initDayEvents({ day, type })
    }

    async initCals({ type = "full" }: { type?: "partial" | "full" } = {}) {
        await this.verifyAccessToken()
    
        if (type === "full") {
            await this.fullCalendarsFetch()
        }
        else if (type === "partial") {
            await this.partialCalendarsFetch()
        }
    
        return this.calendars
    }

    async initDayEvents({ day, type = "full" }: { 
        day: Date, type?: "partial" | "full" 
    }) {
        await this.verifyAccessToken()
        
        if (type === "full") {
            await this.fullEventsFetch(day)
        }
        else if (type === "partial") {
            await this.partialEventsFetch(day)
        }

        return this.events
    }

    async fullCalendarsFetch() {
        const { syncToken, cals } = await fetchUserCalendars({ token: this.accessToken })
        this.calSyncToken = syncToken
        this.calendars = cals as GoogleCalendar[]
    }

    async fullEventsFetch(day: Date) {
        const eventsData = await fetchDayEvents({
            day, token: this.accessToken, calendars: this.calendars
        })
        this.events = []

        eventsData.forEach(({ events, syncToken, id }) => {
            const _events = events as GoogleCalendarEvent[]
            const cal = this.calendars.find(cal => cal.id === id)!

            this.events.push(..._events)
            cal.syncToken = syncToken
        })
    }

    /* partial syncs */

    async partialCalendarsFetch() {
        const updates =  await fetchUserCalendars({
            token: this.accessToken,
            syncToken: this.calSyncToken
        })
        this.handlePartialCalsResponse(updates)
    }

    handlePartialCalsResponse(updates: FetchCalendarsResponse) {
        console.log("google cal - handle partial cals response")
        const { syncToken, cals } = updates
        this.calSyncToken = syncToken

        cals.forEach((calendar) => {
            const idx = this.calendars.findIndex(c => c.id === calendar.id)
            const deleted = "deleted" in calendar
            
            if (deleted) {
                idx >= 0 && (this.calendars.splice(idx, 1))
            } 
            else if (idx >= 0) {
                this.calendars[idx] = calendar
            } 
            else {
                this.calendars.push(calendar)
            }
        })
    }

    async partialEventsFetch(day: Date) {
        const updates = await fetchDayEventsPartial({
            token: this.accessToken, calendars: this.calendars, day
        })
        this.handlePartialEventsResponse(updates)

        this.events = this.getCacheForDate(day)!.events
        this.setEventStyles()
    }

    handlePartialEventsResponse(updates: FetchCalDayEventsResponse[]) {
        updates.forEach(({ events: updatedEvents, syncToken, id }) => {
            const calendar = this.calendars.find(cal => cal.id === id)
            calendar!.syncToken = syncToken
            
            updatedEvents.forEach((event: FetchEventResponse) => {
                const cancelled = "status" in event
                
                if (cancelled) {
                    this.calendarCache.forEach((cache, dateKey) => {
                        cache.events = cache.events.filter(e => e.id !== event.id)
                        this.calendarCache.set(dateKey, cache)
                    })
                } 
                else if (event.startDay) {
                    const dayKey = event.startDay
                    const cache = this.calendarCache.get(dayKey)
                    if (cache) {
                        const idx = cache.events.findIndex(e => e.id === event.id)

                        if (idx >= 0) {
                            cache.events[idx] = event
                        }
                        else {
                            cache.events.push(event)
                        }
                        this.calendarCache.set(dayKey, cache)
                    }
                }
            })
        })
    }


    /* cache */

    private getDateKey(date: Date): string {
        const d = new Date(date)
        d.setHours(0, 0, 0, 0)
        return d.toISOString().split('T')[0]
    }

    private getCacheForDate(date: Date) {
        return this.calendarCache.get(this.getDateKey(date))
    }

    private setCacheForDate(date: Date) {
        this.calendarCache.set(this.getDateKey(date), {
            events: this.events,
            lastSyncTime: Date.now()
        })
    }

    private doSyncOnCacheFetch(lastSyncTime: number): boolean {
        if (!lastSyncTime) return true
        
        const now = Date.now()
        const secsSinceLastSync = (now - lastSyncTime) / 1000
        return secsSinceLastSync >= this.CACHE_HIT_SYNC_THRESHOLD_SECS
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

    async updateDayEvents(day: Date) {
        try {
            this.setLoading("sync")
            await this.initDayCalsEvents(day)
            this.setEventStyles()

            return this.events
        }
        catch(e: any) {
            this.onError({ error: e })
        }
        finally {
            this.setLoading(null)
        }
    }

    watchUpcomingEvents() {
        if (!this.events) return
        const nowMins = getMinsFromStartOfDay(new Date())
        
        this.events.forEach(event => {
            if (!event.allDay && event.timeStart - nowMins === 5) {
                this.initToast(`"${event.title}" starting in 5 minutes`)
            }
        })
    }

    setSignedIn(signedIn: boolean) {
        this.signedIn = signedIn
        this.state.update((state) => ({ ...state, signedIn }))
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

    quit(options: { error?: boolean } = { error: false }) {
        this.calendars = []
        this.events = []
        this.setSignedIn(false)

        localStorage.removeItem("google-calendar")

        if (!options.error) {
            this.initToast("Logged Out!")
        }
    }

    saveCalendarData() {
        localStorage.setItem('google-calendar', JSON.stringify({
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            expiresIn: this.expiresIn,
            accessTokenCreationDate: this.accessTokenCreationDate,
            calSyncToken: this.calSyncToken
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
        this.refreshToken = calendar.refreshToken
        this.expiresIn = calendar.expiresIn
        this.accessTokenCreationDate = new Date(calendar.accessTokenCreationDate)
        this.calendars = calendar.calendars
        this.events = calendar.events
        this.calSyncToken = calendar.calSyncToken
    }
}