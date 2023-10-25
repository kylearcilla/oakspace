import type { Session } from "./pom-session"
import { hoursToHhMm } from "./utils-date"
import { decimalAdd } from "./utils-general"

type DayActivityData = {
    date: Date,
    sessions: any[]
}
type AggrDayData = {
    totalSessions: number
    totalFocusHrs: number
    tagAggregatedMap: Map<string, { hours: number, color: string }>
}

type TagAggrDayData = {
    dateStr: string,
    date: Date,
    sessionsCount: number,
    focusHours: number,
    focusHoursStr: string,
    segments: TagSegmentData[],
}

type TagSegmentData = {
    name: string, 
    color: string,
    hrsTimesTen: number
}

/**
 * @param tags User tags
 * @param data Raw data of session activity over a selected time frame
 * @returns Data to be displayed in the productivity overview section
 */
export const getProdOverViewData = (tags: Tag[], data: DayActivityData[]): ProdOverviewData => {
    const dayToAggrTagMap = new Map<string, TagAggrDayData>()
    let maxHours = 0

    // Construct mapping between day and segment data associated with it
    data.forEach((day: DayActivityData) => {
        // aggregegate session data in terms of tags
        const aggregatedTagData = aggregateRawTagData(day.sessions)

        // convert map to an array of aggregated tag objects for curr day
        const tagAggrArr: TagSegmentData[] = []
        aggregatedTagData.tagAggregatedMap.forEach((sessionData, sessionName) => {
            tagAggrArr.push({ 
                name: sessionName, 
                hrsTimesTen: sessionData.hours, 
                color: sessionData.color 
            })
        })
        dayToAggrTagMap.set(day.date.toISOString(), {
            dateStr: day.date.toISOString(),
            date: day.date,
            sessionsCount: aggregatedTagData.totalSessions,
            focusHours: aggregatedTagData.totalFocusHrs,
            segments: tagAggrArr,
            focusHoursStr: hoursToHhMm(aggregatedTagData.totalSessions),
        })
    })

    // Contruct prod overview section data sets from the produced map
    const tagDistrData =  getTimeFrameDistrData(dayToAggrTagMap, data.length)
    const dayToBarDataArr: any[] = []
    let key = 0

    // Make array objects to be fed into stacked bar chart
    dayToAggrTagMap.forEach((dayData: TagAggrDayData, day: string) => {
        const dataObj: any = {}

        dataObj["key"] = key++
        dataObj["date"] = dayData.date
        dataObj["focusHours"] = dayData.focusHours
        dataObj["focusHoursStr"] = dayData.focusHoursStr
        dataObj["sessionsCount"] = dayData.sessionsCount
        dataObj["data"] = makeAllTagsObj(tags)
        
        dayData.segments.forEach((tagSegment: TagSegmentData) => dataObj[tagSegment.name] = tagSegment.hrsTimesTen)
        dayData.segments.forEach((tagSegment: TagSegmentData) => dataObj.data[tagSegment.name] = {
            name: tagSegment.name,
            hours: tagSegment.hrsTimesTen / 10,
            color: tagSegment.color
        })

        dayToBarDataArr.push(dataObj)
        maxHours = Math.max(maxHours, dayData.focusHours)
    })

    return {
        chartData: {
            dayToBarDataArr,
            maxHours,
            tags
        },
        timeFrameInsightData: {
            tagDistrData: tagDistrData,
            sessionCountData: { count: 3, isDay: false, percChange: 0.3 },
            focusTimeData: { hours: 3.4, isDay: false, percChange: -0.3 }
        }
    }
}

/**
 * 
 * @param sessions User's completed session for a time frame point
 * @returns Aggregated tag, total focus hours / sessions data for a given time frame
 */
function aggregateRawTagData(sessions: SessionInputData[]): AggrDayData {
    const data = {
        totalSessions: 0,
        totalFocusHrs: 0,
        tagAggregatedMap: new Map<string, { hours: number, color: string }>()
    }

    sessions.forEach((session: SessionInputData) => {
        data.totalSessions++
        const hrsTimesTen = Math.round(session.hours * 10) // multiple by 10 to avoid floating
        data.totalFocusHrs += hrsTimesTen

        data.tagAggregatedMap.set(session.tagName, {
                hours: data.tagAggregatedMap.has(session.tagName) ? data.tagAggregatedMap.get(session.tagName)!.hours + hrsTimesTen : hrsTimesTen,
                color: session.color
        })
    })

    return data
}

/**
 * 
 * @param dayToAggrTagMap mapping between day and aggregated session data
 * @param dataRange total length of raw data (length of time frame)
 * @returns a map that maps avg focus time for each day in a week per each session
 */
function getTimeFrameDistrData(dayToAggrTagMap: Map<string, TagAggrDayData>, dataRange: number): TagDistrDataPoint[] {
    let tagToTimeFrameStatsMap = new Map<string, TagDistrDataPoint>() 
    let totalHours = 0

    // loop over each time frame point's session data to aggregate all tag data over time frame
    dayToAggrTagMap.forEach((daySessionData) => {
        for (let session of daySessionData.segments) {

            let hrs = session.hrsTimesTen / 10

            if (tagToTimeFrameStatsMap.has(session.name)) {
                hrs = decimalAdd(tagToTimeFrameStatsMap.get(session.name)!.hours, hrs)
            }

            tagToTimeFrameStatsMap.set(session.name, {
                name: session.name,
                color: session.color,
                hours: hrs,
                hoursStr: "",
                fraction: 0
            })
        }
    })

    // calculate the average focus time for each session give day
    tagToTimeFrameStatsMap.forEach((session, name) => {
        tagToTimeFrameStatsMap.set(name, { ...session, hoursStr: hoursToHhMm(session.hours / dataRange) })
    })

    // sort and calculate fraction
    const tagRawDatarArr: TagDistrDataPoint[] = []
    
    tagToTimeFrameStatsMap.forEach((dataPoint: TagDistrDataPoint, key: string) => {
        tagRawDatarArr.push(dataPoint)
        totalHours += dataPoint.hours
    })

    tagRawDatarArr.sort((a, b) => b.hours - a.hours)
    
    return tagRawDatarArr.map((data: TagDistrDataPoint) => (
        { name: data.name, color: data.color, hours: data.hours, hoursStr: data.hoursStr, fraction: data.hours / totalHours }
    ))
}

/**
 * 
 * @param tags All user tags with colors
 * @returns An object of user tags with given tag data, to be attached stacked bar chart dataset
 */
function makeAllTagsObj(tags: Tag[]) {
    return tags.reduce((dayData: any, tag) => {
        dayData[tag.name] = {
            name: tag.name,
            hours: 0,
            color: tag.color
        };
        return dayData
    }, {})
}

/**
 * 
 * @param keyData Highlighted time frame key data
 * @param totalHoursTimesTen Total focus time hours for that time frame key * 10
 * @returns insight data
 */
export const getSelectedKeyInsightData = (keyData: any, totalHoursTimesTen: number): PordOverViewInisightData => {
    const tagDistrData: any[] = []
    const totalFocusHours = totalHoursTimesTen / 10

    for (const tagName in keyData.data) {
        const tagStats = keyData.data[tagName]
        if (tagStats.hours === 0) continue
        tagDistrData.push({ name: tagName, hoursStr: hoursToHhMm(tagStats.hours), fraction: tagStats.hours / totalFocusHours, color: tagStats.color })
    }

    tagDistrData.sort((a, b) => b.fraction - a.fraction);

    return {
        tagDistrData: tagDistrData,
        sessionCountData: { count: keyData.sessionsCount, isDay: true, percChange: 0 },
        focusTimeData: { hours: totalFocusHours, isDay: true, percChange: 0 }
    }
}