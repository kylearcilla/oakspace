<script lang="ts">
	import { onMount } from "svelte";
	import * as d3 from 'd3';
	import { daysOfWeek, twentyFourTwo12HourFormat } from "$lib/helper";
	import { colorThemeState } from "$lib/store"

    export let timeFrameActivityData: TimeFrameActivity[]
    export let allTimeFrameMins: number
    export let mostActiveTimeFrameIdx: number

    let isLightTheme = false
	let lineGraph: HTMLElement
	let lineGraphContainer: HTMLElement

    let width: number;
	let height: number;
	const margin = { top: 20, right: 20, bottom: 60, left: 25 }

    let lineGraphStyling = {
        strokeColor: "",
        circleStrokeWidth: 0,
        circleStrokeColor: "#A3C2FF",
        circleFillColor: "white",
        gradientFillColor: "",
        lineStrokeColor: "#A3C2FF",
        areaColor: "#A3C2FF",
        lineStrokeWidth: 2.2,

    }
    let tickTextStyling = {
        x: {
            fontWeight: 300,
            fontSize: 8.7
        },
        y: {
            fontWeight: 300,
            fontSize: 8.5
        }
    }
    let toolTipStyling = {

    }

    const LINE_HEIGHT_MED_LOW_BOUND = 70
    const LINE_HEIGHT_MED_UP_BOUND = 130
    const LINE_GRAPH_GRADIENT_FILL_OPACITY = 0.2

    const TOOL_TIP_LEFT_PLACEMENT_PERCENT_CUTOFF = 0.78
    const X_OFFSET_LEFT_TOOL_TIP = 60
    const X_OFFSET_RIGHT_TOOL_TIP = -70
    const Y_OFFSET_TOOL_TIP = 20

    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    const initGraph = () => {
        d3.select(lineGraph).html(null)

        width = d3.select(lineGraphContainer!).node().getBoundingClientRect().width - margin.left - margin.right
		height = d3.select(lineGraphContainer!).node().getBoundingClientRect().height - margin.top - margin.bottom

        const maxPerc = (timeFrameActivityData[mostActiveTimeFrameIdx].allTimeMins / allTimeFrameMins) * 100

        const svg = d3
            .select(lineGraph)
            .append("svg")
            .attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${[margin.left, margin.top]})`)

        // Dynamic Y Tick Count & Values
        const maxYAxisNum = getMaxYAxisNum(maxPerc)
        const ticksCount = maxYAxisNum === 2 ? 4 : 5
        const step = maxYAxisNum / ticksCount
        const yAxisTicks = d3.range(0, maxYAxisNum + step, step).map((x: number) => x.toFixed(1))

        // scales
        const xScale = d3
                        .scaleLinear()
                        .range([0, width])
                        .domain([0, timeFrameActivityData.length])
        const yScale = d3
                        .scaleLinear()
                        .range([height, 0])
                        .domain([0, Math.min(maxYAxisNum, 100)])

        // x axis
        const xAxis = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale)
                    .tickPadding(12)
                    .tickSizeInner(0)
                    .tickSizeOuter(0)
                    .tickValues([0, 1, 2, 3, 4, 5, 6])
                    .tickFormat((i) => daysOfWeek[i].slice(0, 2))
            )
            
        const xTickOffsetLeft = (width + 8) / 7  

        xAxis
            .selectAll(".x.axis .tick text")
            .attr('x', (i) => i * xTickOffsetLeft)
            .attr("color","rgba(255, 255, 255, 0.8)")
            .attr("font-weight", `${tickTextStyling.x.fontWeight}`)
            .attr("font-size", `${tickTextStyling.x.fontSize}`)
            .attr("cursor", "pointer")

        // y axis
        const yAxis = svg.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(yScale)
                        .tickPadding(12)
                        .ticks(ticksCount)
                        .tickValues(yAxisTicks)
                        .tickSizeInner(0)
                        .tickSizeOuter(0)
                        .tickFormat((yAxisTickNum) =>
                            d3.format(maxYAxisNum <= 2 ? "0.1f" : "0.0f")(yAxisTickNum) + "%"
                        )
                )

        yAxis.selectAll(".tick text")
            .attr("color","rgba(255, 255, 255, 1")
            .attr("font-weight", `${tickTextStyling.y.fontWeight}`)
            .attr("font-size", `${tickTextStyling.y.fontSize}`)
            .attr("x", "-8")

        svg.selectAll(".domain")
            .attr("font-family", "Manrope")
            .attr('stroke-width', '0.4')
            .attr('stroke', 'rgba(150, 150, 150, 0.25)')
        
        const vertGridLineStep = step / 2

        // Grid Styling
        const axis = svg.append('g').attr('class', 'axis')
        const grid = axis.append('g').attr('class', 'grid')

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
            .data(d3.range(0, timeFrameActivityData.length, 4))
            .enter()
            .append("line")
            .attr('x1', domainIdx => xScale(domainIdx))
            .attr('x2', domainIdx => xScale(domainIdx))
            .attr("y1", 0) 
            .attr("y2", height) 
            .attr('stroke-width', 0.4)
            .attr('stroke', 'rgba(150, 150, 150, 0.07)')

        // gradient fill
        const area = d3
            .area()
            .x((d, i) => xScale(i))
            .y0(height)
            .y1((d) => yScale((d.allTimeMins / allTimeFrameMins) * 100))
            .curve(d3.curveCardinal.tension(0.995))

        const areaPath = svg
            .append("path")
            .data([timeFrameActivityData])
            .attr("class", "area")
            .attr("d", area)
            .attr("opacity", "0")
            .transition()
            .delay(500)
            .duration(700)
            .attr("opacity", `${LINE_GRAPH_GRADIENT_FILL_OPACITY}`)

        const getColorOffset = () => {
            const yOffsetForTop = yScale(maxPerc)
            if (0 < yOffsetForTop && yOffsetForTop < LINE_HEIGHT_MED_LOW_BOUND) {
                return "4%"
            }
            else if (LINE_HEIGHT_MED_LOW_BOUND < yOffsetForTop && yOffsetForTop < LINE_HEIGHT_MED_UP_BOUND) {
                return "30%"
            }
            else {
                return "55%"
            }
        }

        svg.append("linearGradient")
                .attr("id", "area-gradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", '0%').attr("y1", '0%') 
                .attr("x2", '0%').attr("y2", '100%') 
                .selectAll("stop")
                .data(() => {
                    return [
                        { offset: `${getColorOffset()}`, color: `${lineGraphStyling.areaColor}` },
                        { offset: "100%", color: "transparent" }
                    ]
                })
                .enter().append("stop")
                    .attr("offset", (d) => d.offset)
                    .attr("stop-color", (d) => d.color)


        // line graph stroke
        const valueline = d3
            .line()
            .x((d, i) => xScale(i))
            .y((d) => yScale((d.allTimeMins / allTimeFrameMins) * 100))
            .curve(d3.curveCardinal.tension(0.985))
        const linePath = svg
            .append("path")
            .data([timeFrameActivityData])
            .attr("class", "line")
            .attr("d", valueline)
        const pathLength = linePath.node().getTotalLength();

        linePath
            .attr("stroke-dasharray", pathLength)
            .attr("stroke-dashoffset", pathLength)
            .attr("stroke-width", 3)
            .transition()
            .duration(1000)
            .attr("stroke-width", 0)
            .attr("stroke-dashoffset", 0)
            .attr("stroke", `${lineGraphStyling.lineStrokeColor}`)
            .attr("stroke-width", `${lineGraphStyling.lineStrokeWidth}`)

        // circle focus thing
        const focus = svg
            .append("g")
            .attr("class", "focus")
            .style("display", "none");

        focus
            .append("line")
            .attr("class", "x")
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0.5)
            .attr("y1", 0)
            .attr("y2", height);

        focus
            .append("line")
            .attr("class", "y")
            .style("opacity", 0)

        focus
            .append("circle")
            .attr("class", "y")
            .style("fill", `${lineGraphStyling.circleFillColor}`)
            .style("stroke", `${lineGraphStyling.circleStrokeColor}`)
            .style("stroke-width", "2px")
            .attr("r", 4)

        // tool tip
        const toolTip = d3.select(lineGraph)
            .append("div")
            .style("display", "none")
            .classed("line-bar-tool-tip", true)

        const toolTipDayOfWeek = d3
            .select(".line-bar-tool-tip")
            .append("div")
            .classed("line-bar-tool-tip__day", true)

        const toolTipTimeFrame = d3
            .select(".line-bar-tool-tip")
            .append("div")
            .classed("line-bar-tool-tip__time-frame", true)

        const toolTipPerc = d3
            .select(".line-bar-tool-tip")
            .append("div")
            .classed("line-bar-tool-tip__perc", true)

        svg
            .append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", () => focus.style("display", null))
            .on("mouseout", () => focus.style("display", "none"))
            .on("mouseleave", () => toolTip.style("display", "none"))
            .on("touchmove mousemove", onMouseMoveOverChart);

        function onMouseMoveOverChart(event: MouseEvent) {
            const [xPos, yPos] = d3.pointer(event)
            const x0 = Math.floor(xScale.invert(xPos))
            const d =  timeFrameActivityData[x0]
            const perc = (d.allTimeMins / allTimeFrameMins) * 100
    
            focus
                .select("circle.y")
                .attr("transform", "translate(" + xPos + "," + yScale(perc) + ")");
            
            focus
                .select(".x")
                .attr("transform", "translate(" +  xPos + "," + yScale(perc) + ")")
                .attr("y2", height - yScale(perc))
                .attr("stroke", lineGraphStyling.circleStrokeColor)


            const timeFrameStr = d.timeFrame
            const offSetX = xPos / width > TOOL_TIP_LEFT_PLACEMENT_PERCENT_CUTOFF ? X_OFFSET_RIGHT_TOOL_TIP : -1 * (90 - X_OFFSET_LEFT_TOOL_TIP)

            toolTip
                .style("display", "flex")
            toolTip
                .style("left", (xPos + offSetX) + "px")
                .style("top", (yScale(perc) - Y_OFFSET_TOOL_TIP) + "px")


            let [start, end] = timeFrameStr.match(/\d{1,2}(?=:)/g)!
            const isDiffHalf = start === "9" && end === "12" || start === "18" && end === "24"

            start = twentyFourTwo12HourFormat(+start)
            end = twentyFourTwo12HourFormat(+end)

            toolTipDayOfWeek.html(timeFrameStr.slice(0, 3))
            toolTipTimeFrame.html((isDiffHalf ? start : start.slice(0, -2)) + " - " + end)
            toolTipPerc.html(perc.toFixed(1) + "%")
        }
    }

    function roundToNearestFive(n: number) {
	    return Math.ceil(n / 5) * 5
    }
    function getMaxYAxisNum(maxYNum: number) {
        if (maxYNum > 2) {
            return roundToNearestFive(maxYNum)
        }
        else {
            return maxYNum <= 1 ? Math.max(maxYNum, 1) :  Math.max(maxYNum, 2)
        }
    }

    onMount(initGraph)
</script>

<div class="line-graph-container" bind:this={lineGraphContainer}>
	<div id="line-graph" bind:this={lineGraph}></div>
</div>

<style global lang="scss">
    .line-graph-container {
        height: 100%;
        width: 100%;
        display: flex;
        position: relative;
    }
    svg {
        text-align: center;
    }
    path.line {
        fill: none;
    }
    
    path.area {
        fill: url(#area-gradient);					
        stroke-width: 0px;
    }

    .x.axis g line,
    .y.axis g line {
        fill: none;
        opacity: 0;
    }

    .line-bar-tool-tip {
        @include flex-container(center, _);
        padding: 4px 7px 5px 7px;
        height: 25px;
        position: absolute;
        background: rgba(43, 43, 43, 0.09);
        backdrop-filter: blur(27.5px);
        border: 0.5px solid rgba(182, 182, 182, 0.13);
        border-radius: 12px;
        min-width: 90px;
        font-family: "Manrope";

        &__day {
            margin-right: 4px;
            font-weight: 500;
        }
        &__time-frame {
            margin-right: 8px;
            font-weight: 200;
            white-space: nowrap;
        }
        &__perc {
        }
    }
</style>