import { PUBLIC_YT_DATA_V3_API_KEY } from "$env/static/public"
import { authGoogleUser } from "./api-google"
import { throwFireBaseAPIError } from "./api-youtube"
import { APIErrorCode } from "./enums"
import { APIError } from "./errors"
import { formatDateToISO, getIsoDateMinutesFromStartOfDay, minsFromStartToHHMM } from "./utils-date"

const GOOGLE_CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3/"
const MAX_CALS_RESULTS = 50
const MAX_EVENTS_RESULTS = 50

export async function authGoogleCalendar() {
    try {
        const res = await authGoogleUser(["calendar.readonly"])

        return {
            accessToken:   res.credential.accessToken,
            email:         res.additionalUserInfo.profile.email,
            username:      res.additionalUserInfo.profile.name,
            profileImgSrc: res.additionalUserInfo.profile.picture,
        }
    } 
    catch (error: any) {
        throw throwFireBaseAPIError(error)
    }
}

export async function fetchUserCalendars(token: string): Promise<GoogleCalendar[]> {
    const url = new URL(`${GOOGLE_CALENDAR_API_URL}users/me/calendarList`)
    url.searchParams.append('key', PUBLIC_YT_DATA_V3_API_KEY)
    url.searchParams.append('maxResults', MAX_CALS_RESULTS + "")


    const headers = new Headers()
    headers.append("Content-Type", "application/json")
    headers.append("Authorization", `Bearer ${token}`)

    const res = await fetch(url.toString(), { method: "GET", headers: headers })
    const data = await res.json()

    if (!res.ok) {
        const code = data.error.code
        const reason = data.error.errors[0].reason
        const message = data.error.errors[0].message

        console.error(`Error fetching user calendars. Code: ${code}. Reason: ${reason}. Message: ${message}.`)
        throw throwGoogleCalendarAPIError({
            reason,
            message,
            status: code
        })
    }

    const calendars = []

    for (const calendar of data.items) {
        if (calendar.id === "en.usa#holiday@group.v.calendar.google.com") continue

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
            isChecked: true
        })
    }

    return calendars
}

export async function fetchCalendarEventsOnDay(options: { 
    calendar: GoogleCalendar, 
    minTime: string, 
    maxTime: string, 
    token: string 
}): Promise<GoogleCalendarEvent[]> {
    const { calendar, minTime, maxTime, token } = options

    const url = new URL(`${GOOGLE_CALENDAR_API_URL}calendars/${calendar.id}/events`)

    url.searchParams.append('key', PUBLIC_YT_DATA_V3_API_KEY)
    url.searchParams.append('timeMin', minTime)
    url.searchParams.append('timeMax', maxTime)
    url.searchParams.append('maxResults', MAX_EVENTS_RESULTS + "")

    const headers = new Headers()
    headers.append("Content-Type", "application/json")
    headers.append("Authorization", `Bearer ${token}`)
    
    try {
        const res = await fetch(url.toString(), { method: "GET", headers: headers })
        const data = await res.json()

        if (!res.ok) {
            const code = data.error.code
            const reason = data.error.errors[0].reason
            const message = data.error.errors[0].message
    
            console.error(`Error fetching user calendars. Code: ${code}. Reason: ${reason}. Message: ${message}.`)
            throw throwGoogleCalendarAPIError({
                reason,
                message,
                status: code
            })
        }

        const events = []

        for (const event of data.items) {
            const isAllDay = event.start.dateTime === undefined

            events.push({
                id: event.id,
                calendarId: calendar.id,
                title: event.summary ?? "Untitled",
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
        return events
    } 
    catch (error) {
        console.error('Error fetching calendar events:', error)
        throw error
    }
}

export async function fetchDayEvents(options: { 
    calendars: GoogleCalendar[], 
    day: Date, 
    token: string 

}): Promise<GoogleCalendarEvent[]> {

    const { calendars, day, token } = options
    const timeMin = formatDateToISO({ date: day, type: "start" })
    const timeMax = formatDateToISO({ date: day, type: "end" })

    const eventsPromises = calendars.map(calendar =>
        fetchCalendarEventsOnDay({ 
            calendar, 
            minTime: timeMin, 
            maxTime: timeMax, 
            token 
        })
    )

    try {
        return (await Promise.all(eventsPromises)).flat()
    } 
    catch (error) {
        console.error('Error fetching day events:', error)
        throw error
    }
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
    reason?: string,
    message?: string
  }) => {
      const { status, reason, message } = context
  
      if (status === 401) {
          throw new APIError(APIErrorCode.EXPIRED_TOKEN)
      }
      else if (status === 404) {
          throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Requested data unavailable.")
      }
      else if (status === 403) {
          throw new APIError(APIErrorCode.RATE_LIMIT_HIT)
      }
      else {
          throw new APIError(APIErrorCode.GENERAL, "There was an error with Google Calendar API. Please try again later.")
      }
  }
  