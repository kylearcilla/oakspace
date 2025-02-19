import { PUBLIC_YT_DATA_V3_API_KEY } from "$env/static/public"

import { authGoogleUser } from "./api-google"
import { getOAuthRedirectData, setOatuhRedirectContext } from "./utils-home"
import { formatDateToISO, getIsoDateMinutesFromStartOfDay } from "./utils-date"

import { APIError } from "./errors"
import { APIErrorCode } from "./enums"
import { GoogleCalendarManager } from "./google-calendar-manager"

const GOOGLE_CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3/"
const MAX_CALS_RESULTS = 50
const MAX_EVENTS_RESULTS = 50

export function authGoogleCalendar() {
    authGoogleUser(["calendar.readonly"])
    setOatuhRedirectContext("gcal")
}

/* cals */

export async function fetchUserCalendars({ token, syncToken }: { token: string, syncToken?: string }): Promise<FetchCalendarsResponse> {
    const url = new URL(`${GOOGLE_CALENDAR_API_URL}users/me/calendarList`)
    url.searchParams.append('key', PUBLIC_YT_DATA_V3_API_KEY)
    url.searchParams.append('maxResults', MAX_CALS_RESULTS + "")

    if (syncToken) {
        url.searchParams.append('syncToken', syncToken)
    }

    const headers = new Headers()
    headers.append("Content-Type", "application/json")
    headers.append("Authorization", `Bearer ${token}`)

    const res = await fetch(url.toString(), { method: "GET", headers })
    const data = await res.json()

    if (!res.ok) {
        googleCalApiErrorHandler({ error: data.error, context: "cals" })
    }

    const calendars = []
    for (const calendar of data.items) {
        if (calendar.id.includes("holiday@")) {
            continue
        }
        else if (calendar.deleted) {
            calendars.push({ id: calendar.id, deleted: true as true })
        }
        else {
            calendars.push({
                id: calendar.id,
                color: {
                    id: calendar.colorId,
                    fgColor: calendar.foregroundColor,
                    bgColor: calendar.backgroundColor,
                },
                title: calendar.summary,
                description: calendar.description ?? "",
                user: "",
                email: "",
                syncToken: "",
                isChecked: true,
            })
        }
    }
    return { cals: calendars, syncToken: data.nextSyncToken }
}



/* events  */

function handleCalEventsRes({ calendar, data }: { calendar: GoogleCalendar, data: any }): FetchCalDayEventsResponse {
    const events = []
    for (const event of data.items) {
        if (event.status === "cancelled" && !event.htmlLink) {
            events.push({ 
                id: event.id,  status: "cancelled" as "cancelled"
            })
            continue
        }
        else {
            let isAllDay = !event.start?.dateTime
            if (!isAllDay) {
                const startDate = new Date(event.start.dateTime)
                const endDate = new Date(event.end.dateTime)
    
                if (startDate.getDate() !== endDate.getDate()) {
                    isAllDay = true
                }
            }
            events.push({
                id: event.id,
                calendarId: calendar.id,
                title: event.summary ?? "(No Title)",
                color: calendar.color,
                allDay: isAllDay,
                timeStart: isAllDay ? -1 : getIsoDateMinutesFromStartOfDay(event.start.dateTime),
                timeEnd: isAllDay ? -1 : getIsoDateMinutesFromStartOfDay(event.end.dateTime),
                url: event.htmlLink,
                idx: -1,
                top: "0px",
                left: "0px",
                height: "0px",
                width: "0px"
            })
        }
    }

    return { events, syncToken: data.nextSyncToken, id: calendar.id }
}

async function fetchCalDayEvents({ 
    calendar, 
    token,
    minTime, 
    maxTime, 
    partial = false
}: { 
    calendar: GoogleCalendar
    token: string
    minTime?: string
    maxTime?: string
    partial?: boolean
    syncToken?: string
}): Promise<FetchCalDayEventsResponse> {

    const url = new URL(`${GOOGLE_CALENDAR_API_URL}calendars/${calendar.id}/events`)
    url.searchParams.append('key', PUBLIC_YT_DATA_V3_API_KEY)
    url.searchParams.append('singleEvents', "true")

    if (partial && calendar.syncToken) {
        url.searchParams.append('syncToken', calendar.syncToken)
    } 
    else {
        url.searchParams.append('timeMin', minTime!)
        url.searchParams.append('timeMax', maxTime!)
        url.searchParams.append('maxResults', MAX_EVENTS_RESULTS + "")
    }

    const headers = new Headers()
    headers.append("Content-Type", "application/json")
    headers.append("Authorization", `Bearer ${token}`)
    
    try {
        const res = await fetch(url.toString(), { method: "GET", headers })
        const data = await res.json()

        if (!res.ok) {
            googleCalApiErrorHandler({ error: data.error, context: "events" })
        }
        return handleCalEventsRes({ calendar, data })
    } 
    catch (error) {
        console.error('Error fetching calendar events:', error)
        throw error
    }
}

export async function fetchDayEventsPartial({ day, calendars, token }: { 
    day: Date
    calendars: GoogleCalendar[]
    token: string
}): Promise<FetchCalDayEventsResponse[]> {

    const timeMin = formatDateToISO({ date: day, type: "start" })
    const timeMax = formatDateToISO({ date: day, type: "end" })

    const eventsPromises = calendars.map(calendar => fetchCalDayEvents({ 
        calendar, 
        token, 
        partial: true,
        minTime: timeMin,
        maxTime: timeMax
    }))
    return await Promise.all(eventsPromises)
}

export async function fetchDayEvents({ calendars, day, token }: { 
    calendars: GoogleCalendar[]
    day: Date
    token: string
}): Promise<FetchCalDayEventsResponse[]> {

    const timeMin = formatDateToISO({ date: day, type: "start" })
    const timeMax = formatDateToISO({ date: day, type: "end" })

    const eventsPromises = calendars.map(calendar => 
        fetchCalDayEvents({ 
            calendar, 
            minTime: timeMin, 
            maxTime: timeMax, 
            token 
        })
    )
    return await Promise.all(eventsPromises)
}

export function googleCalApiErrorHandler({ error, context }: { error: any, context: "cals" | "events" }) {
    const code = error.code
    const reason = error.errors[0].reason
    const message = error.errors[0].message
    const errorContext = `Error fetching ${context === "cals" ? "user calendars" : "calendar events"}.`

    console.error(`${errorContext} Code: ${code}. Reason: ${reason}. Message: ${message}.`)
    throw throwGoogleCalendarAPIError({
        message,
        status: code
    })
}


/**
 * Get the right error object to throw after a failed request.
 * Codes / error messages are based on Google Calendar API docs.
 * 
 * https://developers.google.com/calendar/api/guides/errors
 * 
 * @param   code     HTTP Status error code returned from Youtube Data API
 * @param   context  In what API context is the error originating from
 * @returns          Error type and context will be relevant in how the error will be displayed to the user.
 */
const throwGoogleCalendarAPIError = (context: {
    status?: number,
    message?: string
  }) => {
      const { status, message } = context
  
      if (status === 401) {
          throw new APIError(APIErrorCode.EXPIRED_TOKEN)
      }
      else if (status === 404) {
          throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Requested data unavailable.")
      }
      else if (status === 403 && message === "insufficientPermissions") {
          throw new APIError(APIErrorCode.AUTH_DENIED, "Authorization failed. Required permissions not granted.")
      }
      else {
          throw new APIError(APIErrorCode.GENERAL, "There was an error. Please try again later.")
      }
}

export function initGoogleCal() {
    const oauthData = getOAuthRedirectData("gcal")
    const data = localStorage.getItem("google-calendar")

    if (oauthData) {
        return new GoogleCalendarManager({ context: "init" })
    }
    else if (data) {
        return new GoogleCalendarManager({ context: "continue" })
    }
    else {
        return null
    }
}