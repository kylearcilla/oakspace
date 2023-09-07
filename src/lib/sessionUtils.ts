import type { Session } from "./Session";
import { hoursToHhMm } from "./helper";

const tags = [
    {
        name: "school",
        color: "#9997FE"
    },
    {
        name: "swe",
        color: "#FF8B9C"
    },
    {
        name: "reading",
        color: "#CFAB96"
    },
    {
        name: "french",
        color: "#DBB47A"
    },
    {
        name: "meditation",
        color: "#93DB7A"
    },
    {
        name: "drawing",
        color: "#6967BC"
    },
    {
        name: "restTime",
        color: "#A3C2FF"
    }
]
const data: DaySessionData[] = [
    {
      date: new Date(2023, 8, 3),
      sessions: [
        { name: 'reading', color: "#A3C2FF", hours: 2.5 },
        { name: 'reading', color: "#A3C2FF", hours: 2.0 },
        { name: 'french', color: "#8280E5", hours: 2.0 },
        { name: 'french', color: "#8280E5", hours: 0 },
        { name: 'school', color: "#EE94A1", hours: 1.0 },
        { name: 'school', color: "#EE94A1", hours: 2.0 },
        { name: 'swe', color: "#F8B1BB", hours: 2.0 },
        { name: 'meditation', color: "#E4B496", hours: 2.0 },
        { name: 'drawing', color: "#B5A7F0", hours: 1.0 },
      ],
    },
    {
      date: new Date(2023, 8, 4),
      sessions: [
        { name: 'reading', color: "#A3C2FF", hours: 1.0 },
        { name: 'french', color: "#8280E5", hours: 1.0 },
      ],
    },
    {
      date: new Date(2023, 8, 5),
      sessions: [],
    },
    {
      date: new Date(2023, 8, 6),
      sessions: [
        { name: 'reading', color: "#A3C2FF", hours: 12.4 },
      ],
    },
    {
      date: new Date(2023, 8, 7),
      sessions: [
        { name: 'reading', color: "#A3C2FF", hours: 1.0 },
        { name: 'french', color: "#8280E5", hours: 1.0 },
        { name: 'school', color: "#EE94A1", hours: 1.0 },
        { name: 'swe', color: "#F8B1BB", hours: 3.5 },
        { name: 'drawing', color: "#B5A7F0", hours: 1.5 },
      ],
    },
    {
      date: new Date(2023, 8, 8),
      sessions: [
        { name: 'reading', color: "#A3C2FF", hours: 3.0 },
        { name: 'french', color: "#8280E5", hours: 1.0 },
        { name: 'school', color: "#EE94A1", hours: 1.0 },
        { name: 'drawing', color: "#EE94A1", hours: 4.0 },
      ]
    },
    {
      date: new Date(2023, 8, 9),
      sessions: [
        { name: 'reading', color: "#A3C2FF", hours: 3.0 },
        { name: 'french', color: "#8280E5", hours: 1.0 }
      ],
    }
]

type SessionData = { name: string, hours: number, color: string  }

/* Get 3 most spent-on tags for a day */
const getSortedTags = (sessions: TagBarSegmentStat[]) => {
    return sessions.sort((a, b) => b.hrsTimesTen - a.hrsTimesTen);
}

const makeStackedBarDataObj = (obj: any) => {
    return tags.reduce((obj: any, tag) => {
        obj[tag.name] = 0; 
        return obj
    }, obj)
}

/**
 * Create data to be fed into productivity overview section given current time frame
 * @returns stackedBarData (map betewen day and day data), tag distribution data, max focus time for week, tag info
 */
export const getChartData = (): ProdOverviewData => {
    const graphData = new Map<string, DayData>()
    let maxHours = 0

    // Construct mapping between day and segment data associated with it
    data.forEach((day: DaySessionData) => {
        let totalSessions = 0
        let totalHours = 0

        const sessionDayData = new Map<string, { hours: number, color: string }>()

        // aggregegate session data
        day.sessions.forEach((session: SessionData) => {
            totalSessions++
            const hrsTimesTen = Math.round(session.hours * 10) // multiple by 10 to avoid floating
            totalHours += hrsTimesTen

            sessionDayData.set(session.name, {
                    hours: sessionDayData.has(session.name) ? sessionDayData.get(session.name)!.hours + hrsTimesTen : hrsTimesTen,
                    color: session.color
            })
        })

        // create day : dayData entry
        const sessionDayDataArray: TagBarSegmentStat[] = []
        sessionDayData.forEach((sessionData, sessionName) => {
            sessionDayDataArray.push({ name: sessionName, hrsTimesTen: sessionData.hours, color: sessionData.color })
        })
        graphData.set(day.date.toISOString(), {
            totalSessions,
            totalHours,
            sessionData: sessionDayDataArray
        })
    })

    // Contruct prod overview section data sets from the produced map
    const dayToBarDataMap = getDayToBarDataMap(graphData)
    const tagDistrMap =  getTagDistrMap(graphData)
    const dayToBarDataArr: any[] = []
    let count = 0

    dayToBarDataMap.forEach((dayData: TagBarStat, day: string) => {
        const dataObj: any = {}

        dataObj["key"] = count++
        dataObj["date"] = dayData.date
        dataObj["focusHours"] = dayData.focusHours
        dataObj["focusHoursStr"] = dayData.focusHoursStr
        dataObj["sessionsCount"] = dayData.sessionsCount
        
        const dayDataObj = makeStackedBarDataObj(dataObj)
        dayData.segments.forEach((segment: TagBarSegmentStat) => dayDataObj[segment.name] = segment.hrsTimesTen)

        dayToBarDataArr.push(dayDataObj)
        maxHours = Math.max(maxHours, dayData.focusHours)
    })

    return { dayToBarDataArr, tagDistrMap, maxHours, tags }
}

  
/**
 * Data for Productivity Overview: Segemented Bar Chart
 * 
 * @param data a map that maps sessionData to a date
 * @returns a map that maps bar graph info to a date
 */
const getDayToBarDataMap = (graphData: Map<string, DayData>): Map<string, TagBarStat> => {
    // key: day, value: segmented bar graph data
    const segmentedWeeklyData = new Map<string, TagBarStat>()

    graphData.forEach((daySessionData, dayStr) => {
        const top3TagsArr = getSortedTags(daySessionData.sessionData)

        segmentedWeeklyData.set(dayStr, {
            dateStr: dayStr,
            date: new Date(dayStr),
            sessionsCount: daySessionData.totalSessions,
            focusHours: daySessionData.totalHours, 
            focusHoursStr: hoursToHhMm(daySessionData.totalHours),
            segments: top3TagsArr,
          })
    })

    return segmentedWeeklyData
}

/**
 * Data for Productivity Overview: Tag Distribution Info Section (Non - Day: weekly, monthly, yearly)
 * 
 * @param data a map that maps sessionData to a date
 * @returns a map that maps avg focus time for each day in a week per each session
 */
const getTagDistrMap = (graphData: Map<string, DayData>): Map<string, TagDistrData> => {
    // key: session, value: weekly focus average
    let tagDistributionMap = new Map<string, TagDistrData>() 

    // Merge Session Data for Whole Week
    graphData.forEach((daySessionData) => {
        for (let session of daySessionData.sessionData) {

            let hrs = session.hrsTimesTen

            if (tagDistributionMap.has(session.name)) {
                const sum = tagDistributionMap.get(session.name)!.hrsTimesTen + session.hrsTimesTen     
                hrs = Math.round(sum) / 100
            }

            tagDistributionMap.set(session.name, {
                name: session.name,
                color: session.color,
                hrsTimesTen: hrs,
                hoursStr: "",
            })
        }
    })

    // Calculate the average focus time in a day per session
    tagDistributionMap.forEach((session, name) => {
        tagDistributionMap.set(name, { ...session, hoursStr: hoursToHhMm(session.hrsTimesTen / data.length) })
    })


    return tagDistributionMap 
}

/**
 * Data for Productivity Overview: Tag Distribution Info Section (Daily)
 * 
 * @param data a map that maps sessionData to a date
 * @returns session data for that day
 */
  const getDailySessionData = (dayStr: string, graphData: Map<string, DayData>): DayData => {
    const dayData = graphData.get(dayStr)
    if (!dayData) throw new Error("Date does not exist in data.")

    return dayData
}