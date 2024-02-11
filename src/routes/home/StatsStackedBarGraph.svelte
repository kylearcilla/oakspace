<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { roundToNearestFive } from '$lib/utils-general'
	import { daysOfWeek, hoursToHhMm, months } from '$lib/utils-date'
	import { themeState } from "$lib/store"

    enum TimeFrame { THIS_WEEK, TWO_WEEKS, THREE_WEEKS, THREE_MONTHS, SIX_MONTHS, THIS_YEAR, ALL_TIME }

    export let chartData: ChartData
    export let timeFrame: TimeFrame
    export let keySelected: number | null
    export let setKey: (newKey: number | null) => void

    let isLightTheme = false
	let barGraph: HTMLElement
    let toolTip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null
    let toolTipTagCircle: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null
    let toolTipTagTitle: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null
    let toolTipTagHours: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null

    $: {
        if (keySelected != null) {
            setBarStyling(null, false)
            setBarStyling(keySelected, true)
        }
    }
    $: {
        if (barGraph != null && timeFrame != null) {
            initGraph()
        }
    }
    
    const tagToColorMap = new Map<string, string>()
    
	let width: number;
	let height: number;
	const margin = { top: 20, right: 20, bottom: 60, left: 25 }

    let barStyles = {
        barWidth: 5,
        barCornerRadius: 1.5,
        barTransitionDelay: 50,
        barTransitionDuration: 500,
    }
    let tickTextStyling = {
        x: {
            fontWtLight: 200,
            fontWtMed: 300,
            fontColorDark: "rgba(255, 255, 255, 0.4)",
            fontColorLight: "rgba(255, 255, 255, 0.65)",
            fontSize: 9.5
        },
        y: {
            fontWeight: 300,
            fontSize: 9.5,
            fontSizeSm: 8.9
        }
    }

    themeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    const DEFAULT_BAR_OPACITY = 0.96
    const LOW_BAR_OPACITY = 0.67

    const TOOL_TIP_INIT_X_OFFSET = 24
    const TOOL_TIP_LEFT_PLACEMENT_PERCENT_CUTOFF = 0.8
    const X_OFFSET_CORRECTION_RIGHT_TOOL_TIP = -10
    const Y_OFFSET_TOOL_TIP = -15

    function initGraph() {
        chartData.tags.forEach((t: any) => tagToColorMap.set(t.name, t.color))
        initBarStyles()
        initXTickTextStyling()

        // init SVG canvas & bars and chart dimensions
        d3.select(barGraph).html(null)
            .on("click", onClickChartArea)

        width = d3.select(barGraph!).node().getBoundingClientRect().width - margin.left - margin.right;
		height = d3.select(barGraph!).node().getBoundingClientRect().height - margin.top - margin.bottom;

        const svg = d3
            .select(barGraph)
            .append("svg")
            .attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${[margin.left, margin.top]})`)

        // Stack Data
        const tagSegments = chartData.tags.map((t) => t.name)
        const stack = d3.stack().keys(tagSegments)
        const stackData = stack(chartData.dayToBarDataArr)

        // Colors
        const colors = chartData.tags.map((t) => tagToColorMap.get(t.name))
        const colorScale = d3.scaleOrdinal(colors)

        // Dynamic Y Tick Count & Values
        const maxYAxisNum = getMaxYAxisNum(chartData.maxHours)
        const maxYAxisNumTimesTen = maxYAxisNum * 10

        const ticksCount = (maxYAxisNum === 2 || maxYAxisNum === 24) ? 4 : 5
        const step = maxYAxisNum / ticksCount
        const stepTimesTen = step * 10

        const yAxisTicks = d3.range(0, maxYAxisNum + step, step).map((x: number) => (x * 10).toFixed(1))

        // Scales
        const xScale = d3
            .scaleBand()
            .domain(chartData.dayToBarDataArr.map(d => d.date))
            .range([0, width])
            .paddingInner(0.25)
            .paddingOuter(0.35)

        const yScale = d3
            .scaleLinear()
            .range([height, 0])
            .domain([0, maxYAxisNumTimesTen])

        // axis & text styling & formatting
        const xAxis = svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .attr("class", "xAxis")
            .call(d3.axisBottom(xScale)
                    .tickPadding(12)
                    .tickSizeInner(0)
                    .tickSizeOuter(0)
                    .tickFormat(getXTickFormat)
            )

        const yAxis = svg.append('g')
            .attr("class", "yAxis")
            .call(d3.axisLeft(yScale)
                    .tickPadding(maxYAxisNum <= 2 ? 6 : 8)
                    .ticks(ticksCount)
                    .tickValues(yAxisTicks)
                    .tickSizeInner(0)
                    .tickSizeOuter(0)
                    .tickFormat((yAxisTickNum) => getYTickFormat(+yAxisTickNum / 10, maxYAxisNum))
                )

        let count = 0

        xAxis.selectAll(".tick text")
            .attr("color", tickTextStyling.x.fontColorLight)
            .attr("font-weight", tickTextStyling.x.fontWtMed)
            .attr("font-size", tickTextStyling.x.fontSize)
            .attr("cursor", "pointer")
            .style("transition", "0.1s ease-in-out")
            .attr("class", (d: any) => `xAxis-tick xAxis-tick__${count++}`)
            .on("mouseover", onMouseOverXTick)
            .on("mouseleave", onMouseLeaveXTick)
            .on("click", onClickXTick)
            
        yAxis.selectAll(".tick text")
            .attr("color","rgba(255, 255, 255, 1")
            .attr("font-weight", tickTextStyling.y.fontWeight)
            .attr("font-size", maxYAxisNum <= 2 ? tickTextStyling.y.fontSizeSm : tickTextStyling.y.fontSize)

        svg.selectAll(".domain")
            .attr("font-family", "Manrope")
            .attr('stroke-width', '0.4')
            .attr('stroke', 'rgba(150, 150, 150, 0.25)')

        // Grid Styling
        const axis = svg.append('g').attr('class', 'axis')
        const grid = axis.append('g').attr('class', 'grid')

        const vertGridLineStep = stepTimesTen / 2

        grid.selectAll('line.grid-line')
            .data(d3.range(vertGridLineStep, ((maxYAxisNum + step) * 10) - vertGridLineStep, vertGridLineStep))
            .enter()
            .append('line')
            .attr('x1', '0%')
            .attr('x2', width)
            .attr('y1', yTickVal => yScale(yTickVal))
            .attr('y2', yTickVal => yScale(yTickVal))
            .attr('stroke-width', 0.4)
            .attr('stroke', 'rgba(150, 150, 150, 0.1)')
            .style("stroke-dasharray", "2 2")

        grid.selectAll(".vertical-line")
            .data(d3.range(0, chartData.dayToBarDataArr.length, 1))
            .enter()
            .append("line")
            .attr('x1', domainIdx => xScale(chartData.dayToBarDataArr[domainIdx].date) + (xScale.bandwidth() / 2))
            .attr('x2', domainIdx => xScale(chartData.dayToBarDataArr[domainIdx].date) + (xScale.bandwidth() / 2))
            .attr("y1", 0) 
            .attr("y2", height) 
            .attr('stroke-width', 0.4)
            .attr('stroke', 'rgba(150, 150, 150, 0.07)')
        
        // tool tip
        toolTip = d3.select(barGraph)
            .append("div")
            .style("display", "none")
            .classed("stacked-bar-tool-tip", true)

        toolTipTagCircle = d3
            .select(".stacked-bar-tool-tip")
            .append("div")
            .classed("stacked-bar-tool-tip__tag-circle", true)

        toolTipTagTitle = d3
            .select(".stacked-bar-tool-tip")
            .append("div")
            .classed("stacked-bar-tool-tip__tag-title", true)

        toolTipTagHours = d3
            .select(".stacked-bar-tool-tip")
            .append("div")
            .classed("stacked-bar-tool-tip__tag-hours", true)

        // generate bars
        const stackedBars = svg.append("g").attr("class", "stackedBars")

        // @ts-ignore
        const groups = stackedBars
            .selectAll("g")
            .data(stackData)
            .enter()
            .append("g")
            .style("fill", d => colorScale(d.key))
            .attr("height", function(d) { return height - yScale(0); }) 
            .attr("y", function(d) { return yScale(0); })

        groups.selectAll("path")
            .data(d => d, d => d.data.key)
            .enter()
            .append("path")
            .attr("class", "bar")
            .attr('class', d => "bar-segment bar-segment__" + d.data.key)
            .style("cursor", "pointer")
            .attr('d', (d) => {
                    const path = []
                    path.push(`M${(xScale(d.data.date) + xScale.bandwidth() / 2 - (barStyles.barWidth / 2))}, ${yScale(0)}`)
                    path.push("a0,0 0 0 1 0,0")
                    path.push(`h${barStyles.barWidth}`)
                    path.push("a0,0 0 0 1 0,0")
                    path.push(`v0`)
                    path.push(`h${-barStyles.barWidth}Z`)

                    return path
                }
            )
            .on("mouseover", onMouseOverSegment)
            .on("mousemove", onMouseMoveOverBar)
            .on("mouseleave", onMouseLeaveBar)
            .on("click", onClickSegment)
            .transition()
            .duration(barStyles.barTransitionDuration)
            .delay((d, domainIdx) => domainIdx * barStyles.barTransitionDelay)
            .attr('d', (d, domainIdx) => generateBarSegment(d, domainIdx, xScale, yScale))
            .style("opacity", "1")
    }

    // graph styling
    function initBarStyles () {
        if (timeFrame === TimeFrame.THIS_WEEK) {
            barStyles.barWidth = 5
            barStyles.barCornerRadius = 1.5
            barStyles.barTransitionDelay = 45
            barStyles.barTransitionDuration = 425
        }
        else if (timeFrame === TimeFrame.TWO_WEEKS) {
            barStyles.barWidth = 5
            barStyles.barCornerRadius = 1.45
            barStyles.barTransitionDelay = 30
            barStyles.barTransitionDuration = 330
        }
        else if (timeFrame === TimeFrame.THREE_WEEKS) {
            barStyles.barWidth = 3.7
            barStyles.barCornerRadius = 1
            barStyles.barTransitionDelay = 30
            barStyles.barTransitionDuration = 350
        }
        else if (timeFrame === TimeFrame.THREE_MONTHS) {
            barStyles.barWidth = 15
            barStyles.barCornerRadius = 3
            barStyles.barTransitionDelay = 100
            barStyles.barTransitionDuration = 600
        }
        else if (timeFrame === TimeFrame.SIX_MONTHS) {
            barStyles.barWidth = 5.8
            barStyles.barCornerRadius = 1.6
            barStyles.barTransitionDelay = 75
            barStyles.barTransitionDuration = 400
        }
        else if (timeFrame === TimeFrame.THIS_YEAR) {
            barStyles.barWidth = 5
            barStyles.barCornerRadius = 1.5
            barStyles.barTransitionDelay = 50
            barStyles.barTransitionDuration = 420
        }
        else if (timeFrame === TimeFrame.ALL_TIME) {
            barStyles.barWidth = 20
            barStyles.barCornerRadius = 2.4
            barStyles.barTransitionDelay = 150
            barStyles.barTransitionDuration = 500
        }
    }
    function initXTickTextStyling() {
        if (chartData.dayToBarDataArr.length > 7) {
            tickTextStyling.x.fontSize = 8
        }
        else {
            tickTextStyling.x.fontSize = 9.5
        }
    }
    function setBarStyling(keySelected: number | null, isLight: boolean) {
        const barOpacity = !isLight ? LOW_BAR_OPACITY : DEFAULT_BAR_OPACITY
        const fontWeight = !isLight ? tickTextStyling.x.fontWtLight : tickTextStyling.x.fontWtMed
        const textColor = !isLight ? tickTextStyling.x.fontColorDark : tickTextStyling.x.fontColorLight
        const tickClass = keySelected === null ? ".xAxis-tick" : `.xAxis-tick__${keySelected}`
        const segmentClass = keySelected === null ? ".bar-segment" : `.bar-segment__${keySelected}`

        d3.selectAll(tickClass).style("color", textColor)
        d3.selectAll(tickClass).style("font-weight", fontWeight)
        d3.selectAll(segmentClass).style("opacity", barOpacity)
    }

    // helpers
    function generateBarSegment(d: d3.SeriesPoint<{[key: string]: number;}>, domainIdx: number, xScale: any, yScale: any) {
        const currBarUpperBound = chartData.dayToBarDataArr![domainIdx].focusHours
        let rx = 0, ry = 0
    
        if (currBarUpperBound === 0) return ''

        const currBarSegmentUpperBound = d[1]
        const isCurrBarSegmentLast = currBarSegmentUpperBound === currBarUpperBound
        
        if (isCurrBarSegmentLast) { 
            rx = barStyles.barCornerRadius
            ry = barStyles.barCornerRadius
        }

        const path = []

        if (!yScale(d[1])) return ""
        
        // draw the stack
        if (d[1] - d[0] > 0) {
            path.push(`M${(xScale(d.data.date) + xScale.bandwidth() / 2 - (barStyles.barWidth / 2))}, ${yScale(d[1]) + ry}`)
            path.push(`a${rx},${ry} 0 0 1 ${rx},${-ry}`)
            path.push(`h${barStyles.barWidth - 2 * rx}`)
            path.push(`a${rx},${ry} 0 0 1 ${rx},${ry}`)
            path.push(`v${yScale(d[0]) - yScale(d[1]) - ry}`)
            path.push(`h${-barStyles.barWidth}Z`)

        } else {
            path.push(`M${(xScale(d.data.date) + xScale.bandwidth() / 2 - (barStyles.barWidth / 2))}, ${yScale(d[1])}`)
            path.push("a0,0 0 0 1 0,0")
            path.push(`h${barStyles.barWidth}`)
            path.push("a0,0 0 0 1 0,0")
            path.push(`v${yScale(d[0]) - yScale(d[1])}`)
            path.push(`h${-barStyles.barWidth}Z`)
        }
        return path.join(" ")
    }
    function getYTickFormat(yAxisTickNum: number, maxYAxisNum: number) {
        if (maxYAxisNum <= 1) {
            return d3.format("0.0f")(60 * yAxisTickNum) + "m"
        }
        else if (maxYAxisNum <= 2) {
            return d3.format(Number.isInteger(yAxisTickNum) ? "0.0f" : "0.1f")(yAxisTickNum) + "h"
        }
        else {
            return d3.format("0.0f")(yAxisTickNum) + "h"
        }
    }
    function getXTickFormat(d: any) {
        if (timeFrame === TimeFrame.THIS_WEEK) {
            return daysOfWeek[d.getDay()].slice(0, 2)
        }
        else if ([TimeFrame.TWO_WEEKS, TimeFrame.THREE_WEEKS].includes(timeFrame)) {
            return daysOfWeek[d.getDay()].slice(0, 1)
        }
        else if ([TimeFrame.THREE_MONTHS, TimeFrame.SIX_MONTHS].includes(timeFrame)) {
            return months[d.getMonth()]
        }
        else if (timeFrame === TimeFrame.THIS_YEAR) {
            return months[d.getMonth()].slice(0, 1)
        }

        return d.getFullYear()
    }
    function getMaxYAxisNum(maxYNumTimesTen: number) {
        const maxYNum = maxYNumTimesTen / 10
        if (maxYNum > 2) {
            return Math.min(roundToNearestFive(maxYNum), 24)
        }
        else {
            return maxYNum <= 1 ? Math.max(maxYNum, 1) :  Math.max(maxYNum, 2)
        }
    }

    // event listeners
    function onClickChartArea(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (["path", "text"].includes(target.localName)) return

        setBarStyling(null, true)
        setKey(null)
    }
    function onMouseOverSegment(event: MouseEvent, segmentData: any){
        const segmentName = event.target.parentNode.__data__.key 
        const segmentHours = segmentData[1] - segmentData[0]

        toolTip.style("display", "flex")

        toolTipTagCircle.style("background-color", `${tagToColorMap.get(segmentName)}`)
        toolTipTagTitle.html(`${segmentName}`)
        toolTipTagHours.html(`${hoursToHhMm(segmentHours / 10)}`)
    }   
    function onMouseMoveOverBar(event: MouseEvent, segmentData: any) {
        let [x, y] = d3.pointer(event)
        x += TOOL_TIP_INIT_X_OFFSET   // x pos of very right of cursor
        const toolTipWidth = toolTip._groups[0][0].offsetWidth
        const isToolTipOverEdge = x / width > TOOL_TIP_LEFT_PLACEMENT_PERCENT_CUTOFF
        const offSetX = isToolTipOverEdge ? toolTipWidth + X_OFFSET_CORRECTION_RIGHT_TOOL_TIP : toolTipWidth / 2

        toolTip
            .style("left", (x - offSetX) + "px")
            .style("top", (y + Y_OFFSET_TOOL_TIP) + "px")

        if (keySelected === null) {
            setBarStyling(segmentData.data.key, false)
        }
        else if (segmentData.data.key != keySelected) {
            setBarStyling(segmentData.data.key, true)
        }
    }
    function onClickSegment(event: Event, segmentData: any) {
        setBarStyling(null, false)
        setKey(segmentData.data.key)
    }
    function onMouseLeaveBar(event: MouseEvent, segmentData: any){ 
        toolTip.style("display", "none")

        if (keySelected === segmentData.data.key) {
            return
        } 
        else if (keySelected != null) {
            setBarStyling(segmentData.data.key, false)
        }
        else {
            setBarStyling(null, true)
        }
    }
    function onMouseOverXTick(event: MouseEvent) {
        const target = event.target as HTMLElement
        const key = +target.classList[1].split("__")[1]

        if (keySelected === null) {
            setBarStyling(key, false)
        }
        else if (keySelected != key) {
            setBarStyling(key, true)
        }
    }
    function onMouseLeaveXTick(event: MouseEvent) {
        const target = event.target as HTMLElement
        const key = +target.classList[1].split("__")[1]
        
        if (keySelected === null) {
            setBarStyling(key, true)
        }
        else if (keySelected != key) {
            setBarStyling(key, false)
        }
    }
    function onClickXTick(event: MouseEvent) {
        const target = event.target as HTMLElement
        const key = +target.classList[1].split("__")[1]

        setBarStyling(null, false)
        setKey(key)
    }
    
    onMount(initGraph)
</script>

<div class="bar-graph">
	<div id="segmented-bar-graph" bind:this={barGraph}></div>
</div>

<style global lang="scss">
	.bar-graph {
        position: relative;
		height: 100%;
		display: flex;
	}
	
	#segmented-bar-graph {
		width: 100%;
		height: 100%;
		background: none;
	}

    .bar-segment {
        // opacity: 1 !important;
    }

    .xAxis-tick {
        transition: 0.15s ease-in-out;
        &:focus {
            color: rgba(255, 255, 255, 0.8) !important;
        }
        &:active {
            transform: scale(0.95)
        }
    }

    .stacked-bar-tool-tip {
        @include flex(center, _);
        padding: 4px 7px 5px 7px;
        height: 25px;
        position: absolute;
        background: rgba(43, 43, 43, 0.09);
        backdrop-filter: blur(27.5px);
        border: 0.5px solid rgba(182, 182, 182, 0.13);
        border-radius: 12px;
        font-family: "Manrope";

        &__tag-circle {
            @include circle(5px);
            margin-right: 5px;
        }
        &__tag-title {
            margin-right: 8px;
        }
        &__tag-hours {
            white-space: nowrap;
        }
    }
</style>

