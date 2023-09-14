<script lang="ts">
    import { onMount } from "svelte"
	import * as d3 from 'd3'
	import { colorThemeState } from "$lib/store";
	import { roundToNearestFive } from "$lib/utils-general";

    export let tagMonthlyData: TagMonthlyActivity[]
    export let selectedTag: Tag

    $: {
        if (selectedTag && tagBarContainer && tagBarGraph) {
            initGraph()
        }
    }

    let tagBarContainer: HTMLElement
    let tagBarGraph: HTMLElement
    let isLightTheme = false
    let highlightedKey = -1

    let width: number;
	let height: number;
	const margin = { top: 20, right: 10, bottom: 40, left: 25 }

    // styling
    let tickTextStyling = {
        x: {
            fontWtBase: 200,
            fontWtActive: 300,
            fontColorBase: "rgba(255, 255, 255, 0.4)",
            fontColorActive: "rgba(255, 255, 255, 1)",
            fontSize: 8.7
        },
        y: {
            fontColor: "rgba(255, 255, 255, 0.8)",
            fontWeight: 200,
            fontSize: 8.2,
            fontSizeSm: 8
        }
    }
    let toolTipStyling = {
        TOOL_TIP_LEFT_PLACEMENT_PERCENT_CUTOFF: 0.85,
        TOOL_TIP_INIT_X_OFFSET: 24,
        X_OFFSET_CORRECTION_RIGHT_TOOL_TIP: -12,
        Y_OFFSET_TOOL_TIP: -15,
        toolTipBg: "",
        toolTipFontWeight: ""
    }
    const barStyles = {
        BAR_WIDTH: 8.5,
        BAR_BORDER_RADIUS: 3.5,
        BAR_TRANS_DELAY: 40,
        BAR_TRANS_DUR: 250,
        DEFAULT_BAR_OPACITY: 0.09,
        ACTIVE_BAR_OPACITY: 1
    }

    // tool tip
    let toolTip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null
    let toolTipSessionIcon: d3.Selection<HTMLElement, unknown, HTMLElement, any> | null = null
    let toolTipSessionCount: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null
    let toolTipFocusIcon: d3.Selection<HTMLElement, unknown, HTMLElement, any> | null = null
    let toolTipFocusHrs: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null

    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    function initGraph() {
        // init SVG canvas & bars and chart dimensions
        d3.select(tagBarGraph).html(null)

        width = d3.select(tagBarContainer!).node().getBoundingClientRect().width - margin.left - margin.right;
		height = d3.select(tagBarContainer!).node().getBoundingClientRect().height - margin.top - margin.bottom;

        const maxHours = tagMonthlyData.reduce((prevMax, m) => Math.max(prevMax, m.focusHrs), 0)

        const svg = d3
            .select(tagBarGraph)
            .append("svg")
            .attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${[margin.left, margin.top]})`)
        
        const maxYAxisNum = getMaxYAxisNum(maxHours)
        const ticksCount = maxYAxisNum === 2 ? 4 : 5
        const step = maxYAxisNum / ticksCount
        const yAxisTicks = d3.range(0, maxYAxisNum + step, step)

        // Scales
        const xScale = d3
            .scaleBand()
            .domain(tagMonthlyData.map(d => d.month))
            .range([0, width])
            .paddingInner(0.25)
            .paddingOuter(0.35)

        const yScale = d3
            .scaleLinear()
            .range([height, 0])
            .domain([0, maxYAxisNum])
            
        // axis & text styling & formatting
        const xAxis = svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .attr("class", "xAxis")
            .call(d3.axisBottom(xScale)
                    .tickPadding(12)
                    .tickSizeInner(0)
                    .tickSizeOuter(0)
                    .tickFormat((m) => m.slice(0, 1))
            )

        const yAxis = svg.append('g')
            .attr("class", "yAxis")
            .call(d3.axisLeft(yScale)
                    .tickPadding(maxYAxisNum <= 2 ? 6 : 7)
                    .ticks(ticksCount)
                    .tickValues(yAxisTicks)
                    .tickSizeInner(0)
                    .tickSizeOuter(0)
                    .tickFormat((yAxisTickNum) => getYTickFormat(+yAxisTickNum, maxYAxisNum))
            )

        xAxis.selectAll(".tick text")
            .attr("color", tickTextStyling.x.fontColorBase)
            .attr("font-weight", tickTextStyling.x.fontColorBase)
            .attr("font-size", tickTextStyling.x.fontSize)
            .attr("class", (month: string) => `tag-bar-x-axis-tick tag-bar-x-axis-tick__${month}`)
            
        yAxis.selectAll(".tick text")
            .attr("color", tickTextStyling.y.fontColor)
            .attr("font-weight", tickTextStyling.y.fontWeight)
            .attr("font-size", tickTextStyling.y.fontSize)
            .attr("font-size", maxYAxisNum <= 2 ? tickTextStyling.y.fontSizeSm : tickTextStyling.y.fontSize)


        svg.selectAll(".domain")
            .attr("font-family", "Manrope")
            .attr('stroke-width', '0.4')
            .attr('stroke', 'rgba(150, 150, 150, 0.25)')

        // Grid Styling
        const axis = svg.append('g').attr('class', 'axis')
        const grid = axis.append('g').attr('class', 'grid')

        const vertGridLineStep = step

        grid.selectAll('line.grid-line')
            .data(d3.range(vertGridLineStep, maxYAxisNum + vertGridLineStep, vertGridLineStep))
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
            .data(d3.range(0, tagMonthlyData.length, 1))
            .enter()
            .append("line")
            .attr('x1', domainIdx => xScale(tagMonthlyData[domainIdx].month) + (xScale.bandwidth() / 2))
            .attr('x2', domainIdx => xScale(tagMonthlyData[domainIdx].month) + (xScale.bandwidth() / 2))
            .attr("y1", 0) 
            .attr("y2", height) 
            .attr('stroke-width', 0.4)
            .attr('stroke', 'rgba(150, 150, 150, 0.07)')

        // tool tip
        toolTip = d3.select(tagBarGraph)
            .append("div")
            .style("display", "none")
            .classed("tag-bar-tool-tip", true)

        toolTipSessionIcon = d3
            .select(".tag-bar-tool-tip")
            .append("i")
            .classed("tag-bar-tool-tip__sess-icon fa-regular fa-hourglass-half", true)

        toolTipSessionCount = d3
            .select(".tag-bar-tool-tip")
            .append("div")
            .classed("tag-bar-tool-tip__sess-count", true)

        toolTipFocusIcon = d3
            .select(".tag-bar-tool-tip")
            .append("i")
            .classed("tag-bar-tool-tip__focus-icon fa-brands fa-readme", true)

        toolTipFocusHrs = d3
            .select(".tag-bar-tool-tip")
            .append("div")
            .classed("tag-bar-tool-tip__focus-hrs", true)

    
        // generate bars
        const bars = svg.append("g").attr("class", "stackedBars")

        const groups = bars
            .selectAll("g")
            .data(tagMonthlyData)
            .enter()
            .append("g")
            .style("fill", selectedTag.color)
            .attr("height", function(d) { return height - yScale(0); }) 
            .attr("y", function(d) { return yScale(0); })

        groups.selectAll("path")
            .data(d => tagMonthlyData)
            .enter()
            .append("path")
            .attr("class", "bar")
            .style("cursor", "pointer")
            .attr("fill", selectedTag.color)
            .attr('class', d => "bar bar__" + d.month)
            .attr('d', (d) => {
                    const path = []
                    path.push(`M${(xScale(d.month) + xScale.bandwidth() / 2 - (barStyles.BAR_WIDTH / 2))}, ${yScale(0)}`)
                    path.push("a0,0 0 0 1 0,0")
                    path.push(`h${barStyles.BAR_WIDTH}`)
                    path.push("a0,0 0 0 1 0,0")
                    path.push(`v0`)
                    path.push(`h${-barStyles.BAR_WIDTH}Z`)

                    return path
                }
            )
            .on("mouseover", onMouseOverBar)
            .on("mousemove", onMouseMovesOverBar)
            .on("mouseleave", onMouseLeaveBar)
            .transition()
            .duration(barStyles.BAR_TRANS_DUR)
            .delay((d, domainIdx) => domainIdx * barStyles.BAR_TRANS_DELAY)
            .attr('d', (d, i) => generateBar(d, i, xScale, yScale))
            .style("opacity", barStyles.DEFAULT_BAR_OPACITY)

    }

    // helpers
    function getMaxYAxisNum(maxYNum: number) {
        if (maxYNum > 2) {
            return maxYNum
        }
        else {
            return maxYNum <= 1 ? Math.max(maxYNum, 1) :  Math.max(maxYNum, 2)
        }
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
    function initXTickTextStyling() {
        tickTextStyling.y.fontSize = 9.5
        tickTextStyling.y.fontSize = 9.5
    }
    function generateBar(d: d3.SeriesPoint<{[key: string]: number;}>, i, xScale: any, yScale: any) {
        let rx = barStyles.BAR_BORDER_RADIUS
        let ry = barStyles.BAR_BORDER_RADIUS

        const path = []
        const currrMonth = d.month
        const currMonthVal = d.focusHrs

        const xAxisToTipHeight = yScale(0) - yScale(currMonthVal)

        if (xAxisToTipHeight < 2) {
            rx = xAxisToTipHeight === 0 ? 0 : rx - 2
            ry = xAxisToTipHeight === 0 ? 0 : ry - 2
        }
        
        // draw the stack
        path.push(`M${(xScale(currrMonth) + xScale.bandwidth() / 2 - (barStyles.BAR_WIDTH / 2))}, ${yScale(currMonthVal) + ry}`)
        path.push(`a${rx},${ry} 0 0 1 ${rx},${-ry}`)
        path.push(`h${barStyles.BAR_WIDTH - 2 * rx}`)
        path.push(`a${rx},${ry} 0 0 1 ${rx},${ry}`)
        path.push(`v${height - yScale(currMonthVal) - ry}`)
        path.push(`h${-barStyles.BAR_WIDTH}Z`)

        return path.join(" ")
    }
    function setBarStyling(monthKey: number, isLight: boolean) {
        const color = isLight ? tickTextStyling.x.fontColorActive : tickTextStyling.x.fontColorBase
        const fontWeight = isLight ? tickTextStyling.x.fontWtActive : tickTextStyling.x.fontColorBase
        const opacity = isLight ? barStyles.ACTIVEIGHLIGHTED_BAR_OPACITY : barStyles.DEFAULT_BAR_OPACITY


        d3.selectAll(`.tag-bar-x-axis-tick__${monthKey}`).style("color", color)
        d3.selectAll(`.tag-bar-x-axis-tick__${monthKey}`).style("font-weight", fontWeight)
        d3.selectAll(`.bar__${monthKey}`).style("opacity", opacity)
    }

    // bar event handlers
    function onMouseOverBar(event: MouseEvent, barData: any) {
        console.log(barData)
        toolTip.style("display", "flex")

        toolTipSessionCount.html(barData.sessionsDone)
        toolTipFocusHrs.html(`${barData.focusHrs} ${barData.focusHrs === 1 ? "hr" : "hrs"}`)
    }   
    function onMouseMovesOverBar(event: MouseEvent, barData: any) {
        let [x, y] = d3.pointer(event)
        x += toolTipStyling.TOOL_TIP_INIT_X_OFFSET   // x pos of very right of cursor
        const toolTipWidth = toolTip._groups[0][0].offsetWidth
        const isToolTipOverEdge = x / width > toolTipStyling.TOOL_TIP_LEFT_PLACEMENT_PERCENT_CUTOFF
        const offSetX = isToolTipOverEdge ? toolTipWidth + toolTipStyling.X_OFFSET_CORRECTION_RIGHT_TOOL_TIP : toolTipWidth / 2

        toolTip
            .style("left", (x - offSetX) + "px")
            .style("top", (y + toolTipStyling.Y_OFFSET_TOOL_TIP) + "px")

        setBarStyling(barData.month, true)
    }
    function onMouseLeaveBar(event: MouseEvent, barData: any) { 
        toolTip.style("display", "none")

        if (highlightedKey === barData.month) return
        setBarStyling(barData.month, false)
    }
    onMount(initGraph)
</script>

<div class="tag-bar-container" bind:this={tagBarContainer}>
    <div id="tag-bar" bind:this={tagBarGraph}></div>
</div>

<style global lang="scss">
    .tag-bar-container {
        height: 100%;
        width: 100%;
        display: flex;
        position: relative;
    }

    .tag-bar-x-axis-tick {
        transition: 0.12s ease-in-out;
    }

    .tag-bar-tool-tip {
        @include flex-container(center, _);
        padding: 4px 7px 5px 10px;
        height: 25px;
        position: absolute;
        background: rgba(43, 43, 43, 0.09);
        backdrop-filter: blur(27.5px);
        border: 0.5px solid rgba(182, 182, 182, 0.13);
        border-radius: 12px;
        font-family: "Manrope";

        &__sess-icon {
            margin-right: 5px;
        }
        &__sess-count {
            margin-right: 10px;
            white-space: nowrap;
            font-weight: 300;
        }
        &__focus-icon {
            margin: 2px 5px 0px 0px;
        }
        &__focus-hrs {
            font-weight: 300;
            white-space: nowrap;
        }
    }
</style>