 <script lang="ts">
	import { clickOutside } from "$lib/utils-general"
	import { themeState } from "$lib/store"
	import { onMount } from "svelte"
	import { getSelectedKeyInsightData, getProdOverViewData } from "$lib/utils-session-stats"
	import ProdLineChart from "./StatsLineChart.svelte"
	import TagBarGraph from "./StatsTagBarGraph.svelte"
	import ProdStackedBarGraph from "./StatsStackedBarGraph.svelte"
	import CalendarHeatMap from "./StatsHeatMap.svelte"
	import { daysOfWeek, hoursToHhMm } from "$lib/utils-date"
	import StatsTagRanking from "./StatsTagRanking.svelte"

    enum TimeFrame { THIS_WEEK, TWO_WEEKS, THREE_WEEKS, THREE_MONTHS, SIX_MONTHS, THIS_YEAR, ALL_TIME }

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
    ]
    // Time Frame Stacked Bar Graph
    const daySessionData: DaySessionData[] = [
        {
        date: new Date(2023, 7, 20),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 1.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 },
            { tagName: 'school', color: "#EE94A1", hours: 1.0 },
            { tagName: 'swe', color: "#F8B1BB", hours: 3.5 },
            { tagName: 'drawing', color: "#B5A7F0", hours: 1.5 },
        ],
        },
        {
        date: new Date(2023, 7, 21),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 2.5 },
            { tagName: 'reading', color: "#A3C2FF", hours: 2.0 },
            { tagName: 'french', color: "#8280E5", hours: 2.0 },
            { tagName: 'french', color: "#8280E5", hours: 0 },
            { tagName: 'school', color: "#EE94A1", hours: 1.0 },
            { tagName: 'school', color: "#EE94A1", hours: 2.0 },
            { tagName: 'swe', color: "#F8B1BB", hours: 2.0 },
            { tagName: 'meditation', color: "#E4B496", hours: 2.0 },
            { tagName: 'drawing', color: "#B5A7F0", hours: 1.0 },
        ],
        },
        {
        date: new Date(2023, 7, 22),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 1.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 },
        ],
        },
        {
        date: new Date(2023, 7, 23),
        sessions: [],
        },
        {
        date: new Date(2023, 7, 24),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 12.4 },
        ],
        },
        {
        date: new Date(2023, 7, 25),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 3.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 },
            { tagName: 'school', color: "#EE94A1", hours: 1.0 },
            { tagName: 'drawing', color: "#EE94A1", hours: 4.0 },
        ]
        },
        {
        date: new Date(2023, 7, 26),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 3.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 }
        ],
        },
        {
        date: new Date(2023, 7, 27),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 1.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 },
            { tagName: 'school', color: "#EE94A1", hours: 1.0 },
            { tagName: 'swe', color: "#F8B1BB", hours: 3.5 },
            { tagName: 'drawing', color: "#B5A7F0", hours: 1.5 },
        ],
        },
        {
        date: new Date(2023, 7, 28),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 2.5 },
            { tagName: 'reading', color: "#A3C2FF", hours: 2.0 },
            { tagName: 'french', color: "#8280E5", hours: 2.0 },
            { tagName: 'french', color: "#8280E5", hours: 0 },
            { tagName: 'school', color: "#EE94A1", hours: 1.0 },
            { tagName: 'school', color: "#EE94A1", hours: 2.0 },
            { tagName: 'swe', color: "#F8B1BB", hours: 2.0 },
            { tagName: 'meditation', color: "#E4B496", hours: 2.0 },
            { tagName: 'drawing', color: "#B5A7F0", hours: 1.0 },
        ],
        },
        {
        date: new Date(2023, 7, 29),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 1.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 },
        ],
        },
        {
        date: new Date(2023, 7, 30),
        sessions: [],
        },
        {
        date: new Date(2023, 7, 31),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 12.4 },
        ],
        },
        {
        date: new Date(2023, 8, 1),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 3.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 },
            { tagName: 'school', color: "#EE94A1", hours: 1.0 },
            { tagName: 'drawing', color: "#EE94A1", hours: 4.0 },
        ]
        },
        {
        date: new Date(2023, 8, 2),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 3.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 }
        ],
        },
        {
        date: new Date(2023, 8, 3),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 2.5 },
            { tagName: 'reading', color: "#A3C2FF", hours: 2.0 },
            { tagName: 'french', color: "#8280E5", hours: 2.0 },
            { tagName: 'french', color: "#8280E5", hours: 0 },
            { tagName: 'school', color: "#EE94A1", hours: 1.0 },
            { tagName: 'school', color: "#EE94A1", hours: 2.0 },
            { tagName: 'swe', color: "#F8B1BB", hours: 2.0 },
            { tagName: 'meditation', color: "#E4B496", hours: 2.0 },
            { tagName: 'drawing', color: "#B5A7F0", hours: 1.0 },
        ],
        },
        {
        date: new Date(2023, 8, 4),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 1.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 },
        ],
        },
        {
        date: new Date(2023, 8, 5),
        sessions: [],
        },
        {
        date: new Date(2023, 8, 6),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 12.4 },
        ],
        },
        {
        date: new Date(2023, 8, 7),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 1.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 },
            { tagName: 'school', color: "#EE94A1", hours: 1.0 },
            { tagName: 'swe', color: "#F8B1BB", hours: 3.5 },
            { tagName: 'drawing', color: "#B5A7F0", hours: 1.5 },
        ],
        },
        {
        date: new Date(2023, 8, 8),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 3.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 },
            { tagName: 'school', color: "#EE94A1", hours: 1.0 },
            { tagName: 'drawing', color: "#EE94A1", hours: 4.0 },
        ]
        },
        {
        date: new Date(2023, 8, 9),
        sessions: [
            { tagName: 'reading', color: "#A3C2FF", hours: 3.0 },
            { tagName: 'french', color: "#8280E5", hours: 1.0 }
        ],
        },
    ]
    const timeFrameOptions = [
        "This Week", "2 Weeks", "3 Weeks", "3 Months", "6 Months", "This Year", "All Time"
    ]
    // Weekly Avg. Line Chart
    const timeFrameActivityData: TimeFrameActivity[] = [
        {
            timeFrame: "Sunday 0:00-3:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Sunday 3:00-6:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Sunday 6:00-9:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Sunday 9:00-12:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Sunday 12:00-15:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Sunday 15:00-18:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Sunday 18:00-21:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Sunday 21:00-24:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Monday 0:00-3:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Monday 3:00-6:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Monday 6:00-9:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Monday 9:00-12:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Monday 12:00-15:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Monday 15:00-18:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Monday 18:00-21:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Monday 21:00-24:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Tuesday 0:00-3:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Tuesday 3:00-6:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Tuesday 6:00-9:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Tuesday 9:00-12:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Tuesday 12:00-15:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Tuesday 15:00-18:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Tuesday 18:00-21:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Tuesday 21:00-24:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Wednesday 0:00-3:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Wednesday 3:00-6:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Wednesday 6:00-9:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Wednesday 9:00-12:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Wednesday 12:00-15:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Wednesday 15:00-18:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Wednesday 18:00-21:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Wednesday 21:00-24:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Thursday 0:00-3:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Thursday 3:00-6:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Thursday 6:00-9:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Thursday 9:00-12:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Thursday 12:00-15:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Thursday 15:00-18:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Thursday 18:00-21:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Thursday 21:00-24:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Friday 0:00-3:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Friday 3:00-6:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Friday 6:00-9:00",
            allTimeMins: 315,
        },
        {
            timeFrame: "Friday 9:00-12:00",
            allTimeMins: 315,
        },
        {
            timeFrame: "Friday 12:00-15:00",
            allTimeMins: 315,
        },
        {
            timeFrame: "Friday 15:00-18:00",
            allTimeMins: 315,
        },
        {
            timeFrame: "Friday 18:00-21:00",
            allTimeMins: 315,
        },
        {
            timeFrame: "Friday 21:00-24:00",
            allTimeMins: 315,
        },
        {
            timeFrame: "Saturday 0:00-3:00",
            allTimeMins: 315,
        },
        {
            timeFrame: "Saturday 3:00-6:00",
            allTimeMins: 315,
        },
        {
            timeFrame: "Saturday 6:00-9:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Saturday 9:00-12:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Saturday 12:00-15:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Saturday 15:00-18:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Saturday 18:00-21:00",
            allTimeMins: 0,
        },
        {
            timeFrame: "Saturday 21:00-24:00",
            allTimeMins: 0,
        },
    ]
    const allTimeFrameMins = 2520
    const mostActiveTimeFrameIdx = 49

    // Tag Bar Graph
    const tagMonthlyData: TagMonthlyActivity[] = [
        {
            month: "Jan",
            sessionsDone: 2,
            focusHrs: 30.4
        },
        {
            month: "Feb",
            sessionsDone: 4,
            focusHrs: 21
        },
        {
            month: "Mar",
            sessionsDone: 34,
            focusHrs: 0
        },
        {
            month: "Apr",
            sessionsDone: 34,
            focusHrs: 12
        },
        {
            month: "May",
            sessionsDone: 34,
            focusHrs: 18
        },
        {
            month: "Jun",
            sessionsDone: 34,
            focusHrs: 23
        },
        {
            month: "Jul",
            sessionsDone: 34,
            focusHrs: 50
        },
        {
            month: "Aug",
            sessionsDone: 34,
            focusHrs: 67
        },
        {
            month: "Sep",
            sessionsDone: 34,
            focusHrs: 120
        },
        {
            month: "Oct",
            sessionsDone: 34,
            focusHrs: 23
        },
        {
            month: "Nov",
            sessionsDone: 34,
            focusHrs: 2
        },
        {
            month: "Dec",
            sessionsDone: 34,
            focusHrs: 69
        },
    ]

    let chartData: ChartData | null  = null
    let focusTimeData: FocusTimeData | null = null
    let timeFrame: TimeFrame = TimeFrame.THIS_WEEK

    let keySelected: number | null = null
    let xDomainRange = 0

    let highlightedBarChartKey = 0
    let barChartDomainRange = 0

    let isTimeFrameListOpen = false
    let isTagListOpen = false

    let isLightTheme = false
    let timeFrameDataSet = ""
    let timeFrameStr = ""

    let timeFrameInsightData: PordOverViewInisightData | null = null
    let insightData: PordOverViewInisightData | null = null

    let selectedTag = tags[0]

    $: {
        timeFrameStr = getTimeFrameStr(keySelected)
        updateInsightData(keySelected)
    }
    $: {
        getData(timeFrame)
    }

    themeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    const setKey = (newKey: number | null) => {
        keySelected = newKey
    }
    const getTimeFrameStr = (keySelected: number | null) => {
        if (!chartData) return ""

        const timeFrameDataSet = chartData!.dayToBarDataArr
        if (keySelected === null) {
            const startDate = timeFrameDataSet[0].date
            const endDate = timeFrameDataSet[timeFrameDataSet.length - 1].date

            const startDay = startDate.getDate()
            const startMonth = startDate.getMonth()

            const endDay = endDate.getDate()
            const endMonth = endDate.getMonth()

            return `${startMonth + 1}/${startDay} - ${endMonth + 1}/${endDay}`
        }
        const timePointDate = timeFrameDataSet[keySelected].date

        return `${daysOfWeek[timePointDate.getDay()]}  ${timePointDate.getMonth() + 1}/${timePointDate.getDate()}`
    }
    const getTimeFrameData = (timeFrame: TimeFrame) => {
        if (timeFrame === TimeFrame.THIS_WEEK) {
            return daySessionData.slice(0, 7)
        } else if (timeFrame === TimeFrame.TWO_WEEKS) {
            return daySessionData.slice(0, 14)
        } else if (timeFrame === TimeFrame.THREE_WEEKS) {
            return daySessionData.slice(0, 21)
        } else if (timeFrame === TimeFrame.THREE_MONTHS) {
            return daySessionData.slice(0, 3)
        } else if (timeFrame === TimeFrame.SIX_MONTHS) {
            return daySessionData.slice(0, 6)
        } else if (timeFrame === TimeFrame.THIS_YEAR) {
            return daySessionData.slice(0, 12)
        }

        return daySessionData.slice(0, 3)
    }
    const handleTimeFrameSwitcherClicked = (idx: number) => {
        timeFrame = idx
        isTimeFrameListOpen = false
    }
    const handleNewTagClicked = (idx: number) => {
        selectedTag = tags[idx]
        isTagListOpen = false
    }
    const incrementTimeFrameTick = () => {
        if (keySelected === null) {
            keySelected = 0
            return
        }
        keySelected = keySelected === xDomainRange - 1 ? 0 : keySelected + 1
    }
    const decrementTimeFrameTick = () => {
        if (keySelected === null) {
            keySelected = xDomainRange - 1
            return
        }
        keySelected = keySelected === 0 ? xDomainRange - 1 : keySelected - 1
    }
    const getMostActiveTimePeriod = () => {
        const timeFrameStr = timeFrameActivityData[mostActiveTimeFrameIdx].timeFrame
        let day = timeFrameStr.split(" ")[0]
        let [start, end] = timeFrameStr.match(/\d{1,2}(?=:)/g)!
        let str = ""

        switch (start) {
            case "6":
                str = "Early Mornings"
                break
            case "9":
                str = "Late Mornings"
                break
            case "12":
                str = "Early Afternoons"
                break
            case "15":
                str = "Late Afternoons"
                break
            case "18":
                str = "Early Nights"
                break
            default:
                str = "Late Nights"
                break
        }

        if (mostActiveTimeFrameIdx === 0 && start === "0") {
            day = mostActiveTimeFrameIdx === 0 ? "Saturday" : timeFrameActivityData[mostActiveTimeFrameIdx - 1].timeFrame.split(" ")[0]
        }

        return day + " " + str
    }

    function updateInsightData(keySelected: number | null) {
        if (keySelected === null) {
            insightData = timeFrameInsightData!
            return
        }

        const keyData = chartData?.dayToBarDataArr[keySelected]

        insightData = getSelectedKeyInsightData(keyData, keyData.focusHours)
        console.log(insightData)
    }
    function getData(timeFrame: TimeFrame) {
        const prodOverViewData = getProdOverViewData(tags, getTimeFrameData(timeFrame))
        
        chartData = prodOverViewData.chartData
        timeFrameInsightData = {
            tagDistrData: prodOverViewData.timeFrameInsightData.tagDistrData,
            sessionCountData: prodOverViewData.timeFrameInsightData.sessionCountData,
            focusTimeData: prodOverViewData.timeFrameInsightData.focusTimeData
        }
        insightData = timeFrameInsightData
        
        xDomainRange = prodOverViewData.chartData.dayToBarDataArr.length
        timeFrameStr = getTimeFrameStr(null)
        setKey(null)
    }
    
    onMount(() => {
        getData(TimeFrame.THIS_WEEK)
    })
</script>

 <div class="modal-bg">
    <div use:clickOutside on:click_outside={() => console.log("")} class="modal-bg__content">
        <div class={`stats ${isLightTheme ? "" : "stats--dark"}`}>
            <div class="stats__left">
                <!-- Header -->
                <div class="stats__header">
                    <h1 class="modal-bg__content-title">Statistics</h1>
                    <p class="modal-bg__content-copy">
                        Get a bird's eye view of your session trends through different time frames.
                    </p>
                </div>
                <div class="prod-overview">
                    <!-- Prod Overview Header -->
                    <div class="prod-overview__header">
                        <h2>Productivity Overview</h2>
                        <div class="flx flx--algn-center">
                            <div class="prod-overview__time-frame-slider-wrapper">
                                <button on:click={decrementTimeFrameTick}>
                                    <i class="fa-solid fa-chevron-left"></i>
                                </button>
                                <span>{`${timeFrameStr}`}</span>
                                <button on:click={incrementTimeFrameTick}>
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                            <div class="prod-overview__time-frame-dropdown-container dropdown-container">
                                <button class="prod-overview__time-frame-dropdown-btn dropdown-btn trans-btn" on:click={() => { isTimeFrameListOpen = !isTimeFrameListOpen }}>
                                    <div class="dropdown-btn__title">
                                        {timeFrameOptions[timeFrame]}
                                    </div>
                                    <div class="dropdown-btn__arrows">
                                        <div class="dropdown-btn__arrows-triangle-up">
                                            <i class="fa-solid fa-chevron-up"></i>
                                        </div>
                                        <div class="dropdown-btn__arrows-triangle-down">
                                            <i class="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </div>
                                </button>
                                {#if isTimeFrameListOpen}
                                    <ul use:clickOutside on:click_outside={() => isTimeFrameListOpen = false} class="dropdown-menu">
                                        {#each timeFrameOptions as tf, idx} 
                                            <li class={`dropdown-menu__option ${idx === timeFrame ? "dropdown-menu__option--selected" : ""}`}>
                                                <button class="dropdown-element" on:click={() => handleTimeFrameSwitcherClicked(idx)}>
                                                    <p>{tf}</p>
                                                    {#if idx === timeFrame}
                                                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--right">
                                                            <i class="fa-solid fa-check"></i>
                                                        </div>
                                                    {/if }
                                                </button>
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                        </div>
                    </div>
                    <div class="prod-overview__top-row">
                        <!-- Graph View -->
                        <div class="prod-graph-view prod-overview__bento-box">
                            <div class="prod-overview__bento-box-header">
                                <h4>This Week</h4>
                                <p>Pulling stats from <strong>{`${timeFrameStr}`}</strong></p>
                            </div>
                            {#if chartData}
                                <ProdStackedBarGraph 
                                    chartData={chartData} 
                                    timeFrame={timeFrame} 
                                    keySelected={keySelected} 
                                    setKey={setKey} 
                                />
                            {/if}
                        </div>
                        <!-- Stats View -->
                        <div class="prod-stats-view prod-overview__bento-box">
                            <div class="prod-stats-view__top-row">
                                <!-- Session Count Stat -->
                                <div class="prod-stats-view__stat prod-stats-view__bento-box">
                                    <div class="prod-stats-view__stat-header">
                                        <div class="prod-stats-view__stat-header-icon">
                                            <i class="fa-regular fa-hourglass-half"></i>
                                        </div>
                                        {#if insightData?.sessionCountData && !insightData.sessionCountData.isDay}
                                            <div class="prod-stats-view__stat-header-percentage">
                                                <div class="flx flx--algn-center">
                                                    <i class={`fa-solid fa-${insightData?.sessionCountData.percChange < 0 ? "arrow-down" : "arrow-up"}`}></i>
                                                    <span>{insightData?.sessionCountData.percChange}</span>
                                                </div>
                                                    <span class="prod-stats-view__stat-header-time">Since Last Week</span>
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="prod-stats-view__stat-info">
                                        <h5>{insightData?.sessionCountData?.count}</h5>
                                        <span>{`${insightData?.sessionCountData?.isDay ? "Sessions Completed" : "Dail Session Average"}`}</span>
                                    </div>
                                </div>
                                <!-- Session Focust Time Stat -->
                                <div class="prod-stats-view__stat prod-stats-view__bento-box">
                                    <div class="prod-stats-view__stat-header">
                                        <div class="prod-stats-view__stat-header-icon">
                                            <i class="fa-brands fa-readme"></i>
                                        </div>
                                        {#if insightData?.focusTimeData && !insightData.focusTimeData.isDay}
                                            <div class="prod-stats-view__stat-header-percentage">
                                                <div class="flx">
                                                    <i class={`fa-solid fa-${insightData?.focusTimeData.percChange < 0 ? "arrow-down" : "arrow-up"}`}></i>
                                                    <span>{insightData?.focusTimeData.percChange}</span>
                                                </div>
                                                <span class="prod-stats-view__stat-header-time">Since Last Week</span>
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="prod-stats-view__stat-info">
                                        {#if insightData?.focusTimeData}
                                            <h5>{`${hoursToHhMm(insightData?.focusTimeData.hours)}`}</h5>
                                        {/if}
                                        <span>{`${insightData?.focusTimeData?.isDay ? "Total Focus Time" : "Focus Time Average"}`}</span>
                                    </div>
                                </div>
                            </div>
                            <!-- Session Tag Distribution List -->
                            <div class="prod-stats-view__bottom-row">
                                <div class="prod-stats-view__tag-distribution prod-stats-view__bento-box">
                                    <div class="prod-overview__bento-box-header">
                                        <h4>Tag Distribution</h4>
                                    </div>
                                    <div class="prod-stats-view__tag-list-header">
                                        <div class="prod-stats-view__tag-list-header-item prod-stats-view__tag-list-header-item--tag-name">
                                            Tag Name
                                        </div>
                                        <div class="prod-stats-view__tag-list-header-item prod-stats-view__tag-list-header-item--avg">
                                            Daily Avg.
                                        </div>
                                        <div class="prod-stats-view__tag-list-header-item prod-stats-view__tag-list-header-item--percentage">
                                            %
                                        </div>
                                    </div>
                                    {#if insightData?.tagDistrData}
                                        <ul>
                                            {#each insightData.tagDistrData as tagData}
                                                <li class="prod-stats-view__tag-list-item">
                                                    <div class="prod-stats-view__tag-list-item-col prod-stats-view__tag-list-item-col--tag-name">
                                                        <div class="prod-stats-view__tag-list-item-color" style={`background-color: ${tagData.color};`}></div>
                                                        <div class="prod-stats-view__tag-list-item-name">{tagData.name}</div>
                                                    </div>
                                                    <div class="prod-stats-view__tag-list-item-col prod-stats-view__tag-list-item-col--avg">
                                                        {tagData.hoursStr}
                                                    </div>
                                                    <div class="prod-stats-view__tag-list-item-col prod-stats-view__tag-list-item-col--percentage">
                                                        {`${(tagData.fraction * 100).toFixed(0)}`}
                                                    </div>
                                                </li>
                                            {/each}
                                        </ul>
                                    {/if}
                                    <div class="gradient-container gradient-container--horizontal gradient-container--bottom">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="prod-overview__bottom-row">
                        <!-- My Tags List -->
                        <div class="my-tags-list prod-overview__bento-box">
                            <div class="prod-overview__bento-box-header">
                                <h4>My Tags</h4>
                                <p>7 Tags</p>
                            </div>
                            <ul>
                                {#each tags as tag}
                                    <li class="my-tags-list__list-item">
                                        <div class="my-tags-list__list-item-color" style={`background-color: ${tag.color};`}>
                                        </div>
                                        <div class="my-tags-list__list-item-name">
                                            {tag.name}
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                        <!-- Weekly Avg. Line Graph -->
                        <div class="weekly-avg-graph prod-overview__bento-box">
                            <div class="prod-overview__bento-box-header">
                                <h4>Weekly Avg.</h4>
                                <p>Most focused on <strong>{getMostActiveTimePeriod()}</strong></p>
                            </div>
                            <ProdLineChart 
                                timeFrameActivityData={timeFrameActivityData}
                                allTimeFrameMins={allTimeFrameMins}
                                mostActiveTimeFrameIdx={mostActiveTimeFrameIdx}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div class="stats__right">
                <div class="tag-panel bento-box">
                    <h4>Top Tags</h4>
                    <!-- My Top Tags -->
                    <div class="tag-ranking-wrapper tag-panel__bento-box">
                        <StatsTagRanking />
                    </div>
                    <!-- Tag Overview -->
                    <div class="tag-overview">
                        <div class="tag-overview__header">
                            <h4>Tag Overview</h4>
                            <div class="tag-overview__dropdown-btn-container dropdown-container">
                                <button class="tag-overview__dropdown-btn dropdown-btn dropdown-btn--small trans-btn" on:click={() => { isTagListOpen = !isTagListOpen }}>
                                    <div class="dropdown-btn__icon" style={`background-color: ${selectedTag.color}`}></div>
                                    <div class="dropdown-btn__title">
                                        {selectedTag.name}
                                    </div>
                                    <div class="dropdown-btn__arrows">
                                        <div class="dropdown-btn__arrows-triangle-up">
                                            <i class="fa-solid fa-chevron-up"></i>
                                        </div>
                                        <div class="dropdown-btn__arrows-triangle-down">
                                            <i class="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </div>
                                </button>
                                {#if isTagListOpen}
                                    <ul use:clickOutside on:click_outside={() => isTagListOpen = false} class="dropdown-menu">
                                        {#each tags as tag, idx} 
                                            <li class={`dropdown-menu__option ${tag.name === selectedTag.name ? "dropdown-menu__option--selected" : ""}`}>
                                                <button class="dropdown-element" on:click={() => handleNewTagClicked(idx)}>
                                                    <div class="dropdown-menu__option-icon" style={`background-color: ${tag.color}`}></div>
                                                    <p>{tag.name}</p>
                                                    {#if tag.name === selectedTag.name}
                                                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--right">
                                                            <i class="fa-solid fa-check"></i>
                                                        </div>
                                                    {/if}
                                                </button>
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                        </div>
                        <div class="tag-heat-map tag-panel__bento-box">
                            <h5>Heat Map</h5>
                            <CalendarHeatMap tag={selectedTag} />
                        </div>
                        <div class="tag-bar-graph tag-panel__bento-box">
                            <div class="tag-bar-graph__header">
                                <h5>Monthly Trends</h5>
                            </div>
                            <TagBarGraph
                                tagMonthlyData={tagMonthlyData}
                                selectedTag={selectedTag}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
 </div>

 <style lang="scss">
    @import "../../scss/dropdown.scss";
    $bento-box-padding: 7px;

    .modal-bg {
        
        &__content {
            overflow-y: scroll;
            overflow-x: scroll;
        }
        &__content-title {
            margin-bottom: 10px;
        }
        &__content-copy {
            font-size: 1.2rem;
            font-weight: 300;
        }
        
    }
    .stats {
        width: 960px;
        height: 700px;
        display: flex;
        padding: $settings-modal-padding;

        &__header {
            height: 12%;
        }
        &__left {
            width: 71%;
        }
        &__right {
            width: 29%;
        }

        .dropdown-container {
            position: relative;
        }
        .dropdown-btn {
            background-color: var(--modalBgAccentColor);
        }
        .dropdown-menu {
            top: 35px;
            width: 100%;
        }

        /* Dark Theme */
        &--dark .dropdown-btn {
            @include dropdown-btn-dark;
        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
    }
    /**** Left Side ****/
    .prod-overview {
        height: 88%;
        &__bento-box {
            width: 50%;
            height: 100%;
            background-color: var(--bentoBoxBgColor);
            padding: 15px 18px 0px 18px;
            border-radius: 15px;
            margin-right: $bento-box-padding;

            h4 {
                font-weight: 500;
                font-size: 1.34rem
            }
            p {
                font-size: 1.05rem;
                color: rgba(var(--textColor1), 0.45);
                font-weight: 400;
            }
            strong {
                color: rgba(var(--textColor1), 1);
                font-weight: 400;
                width: 65px;
                text-align: right;
                display: inline-block;
                font-size: 1.04rem;
            }
            span {

            }
        }
        &__bento-box-header {
            @include flex-container(baseline, space-between);
        }
        &__header {
            margin: 0px $bento-box-padding 14px 0px;
            @include flex-container(center, space-between);

            h2 {
                font-size: 1.45rem;
            }
        }
        &__top-row {
            margin-bottom: $bento-box-padding;
        }
        &__top-row, &__bottom-row { 
            display: flex;
            height: calc((100% - ($bento-box-padding + 42px)) / 2);
            width: 100%;
        }
        /* Right Side Btns */
        &__time-frame-slider-wrapper {
            margin-right: 10px;
            span {
                font-size: 1.14rem;
                font-weight: 500;
                padding: 0px 11px;
                width: 90px;
                text-align: center;
                display: inline-block;
            }   
            button {
                padding: 0px 10px;
                color: rgba(var(--textColor1), 0.45);
                transition: 0.14s ease-in-out;
                font-size: 0.92rem;

                &:hover {
                    color: rgba(var(--textColor1), 1);
                }
                &:active {
                    scale: 0.9;
                }
            }
        }
        &__time-frame-dropdown-container {
            position: relative;
            transition: 0.15s ease-in-out;
        }
    }
    /* Graph View */
    .prod-graph-view {

    }
    /* Stats View */
    .prod-stats-view {
        background: none;
        padding: 0px;

        &__top-row {
            display: flex;
            height: 37%;
        }
        &__top-row, &__bottom-row {
            width: 100%;
        }
        &__bottom-row {
            height: 60.4%;
        }
        &__bento-box {
            background-color: var(--bentoBoxBgColor);
            border-radius: 10px;
            padding: 10px 18px 0px 15px;
            position: relative;

            h4 {
                font-size: 1.14rem;
            }
        }
        /* Session Average + Focus Time Average */
        &__stat {
            width: 50%;
            border-radius: 10px;
            
            &:first-child {
                margin-right: $bento-box-padding;
            }
        }
        &__stat-header {
            @include flex-container(center, space-between);
            height: 27px;
        }
        &__stat-header-icon {
            i {
                font-size: 1.6rem;
            }
        }
        &__stat-header-percentage {
            i {
                margin-right: 8px;
            }
            span {
                font-weight: 300;
            }
        }
        &__stat-header-time {
            color: rgba(var(--textColor1), 0.4);
            font-weight: 300;
        }
        &__stat-info {
            @include pos-abs-bottom-left-corner(12px, 15px);

            h5 {
                margin-bottom: 1px;
                font-size: 1.8rem;
                font-weight: 300;
            }
            span {
                color: rgba(var(--textColor1), 0.4);
                font-weight: 400;
            }
        }
        /* Tag Distribution List */
        &__tag-distribution {
            margin-top: $bento-box-padding;
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
        }
        &__tag-list-header {
            margin-top: 10px;
            display: flex;
            color: rgba(var(--textColor1), 0.45);
            font-weight: 300;
        }
        &__tag-list-header-item {
            font-size: 0.94rem;
            &--tag-name {
                width: 43%;
            }
            &--avg {
                text-align: center;
                width: 20%;
            }
            &--percentage {
                width: 37%;
                text-align: right;
            }
        }
        ul {
            height: 72%;
            overflow-y: scroll;
        }
        &__tag-list-item {
            display: flex;
            margin-bottom: 8px;

            &:first-child {
                margin-top: 14px;
            }
            &:last-child {
                margin-bottom: 40px;
            }
        }
        &__tag-list-item-color {
            @include circle(5px);
        }
        &__tag-list-item-name {
            margin-left: 14px;
        }
        &__tag-list-item-col {
            font-weight: 300;
            &--tag-name {
                width: 43%;
                @include flex-container(center, _);
            }
            &--avg {
                text-align: center;
                width: 20%;
                color: rgba(var(--textColor1), 0.25);
            }
            &--percentage {
                width: 37%;
                text-align: right;
                color: rgba(var(--textColor1), 0.25);
            }
        }
    }
    /* My Tags */
    .my-tags-list {
        ul {
            margin-top: 20px;
            height: 85%;
            overflow-y: scroll;
        }
        &__list-item {
            @include flex-container(center, _);
            margin-bottom: 6px;
        }
        &__list-item-color {
            @include circle(7px);
            margin-right: 10px;
        }
        &__list-item-name {
            font-size: 1.2rem;
            color: rgba(var(--textColor1), 0.8);
        }
    }
    .weekly-avg-graph {
        h4 {
            white-space: nowrap;
            margin-right: 10px;
        }
        p {
            white-space: nowrap;
            font-size: 0.95rem;
        }
        strong {
            font-size: 0.95rem;
            width: auto;
            margin-left: 3px;
        }
    }
    /**** Right Side ****/
    .tag-panel {
        height: 100%;
        padding: 16px 18px;
        border-radius: 15px;
        h4 {
            font-size: 1.32rem;
            font-weight: 500;
            margin-bottom: 11px;
        }

        &__bento-box {
            background-color: var(--hoverColor);
            border-radius: 14px;
            padding: 11px 14px;
            h5 {
                font-size: 1.15rem;
                font-weight: 500;
            }
        }
    }
    .tag-ranking-wrapper  {
        margin-bottom: 20px;
    }
    /* Tag Overview */
    .tag-overview {
        height: 72%;
        &__header {
            @include flex-container(center, space-between);
            margin-bottom: 12px;
        }

        .dropdown-btn {
            &__icon {
                @include circle(5px);
            }
        }
        .dropdown-menu {
            &__option-icon {
                @include circle(5px);
            }
        }
    }
    /* Heat Map */
    .tag-heat-map {
        margin-bottom: 10px;
        height: 60%;
    }
    /* Bar Graph */
    .tag-bar-graph {
        height: 40%;
        position: relative;

        &__header {
            @include flex-container(center, space-between);
        }
    }
 </style>

