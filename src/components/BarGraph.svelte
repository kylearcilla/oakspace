<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { getChartData } from '$lib/sessionUtils';
	import { hoursToHhMm } from '$lib/helper';

	let barGraph: HTMLElement;
    let dayToBarDataArr: any[] | null = null
    let maxHours: number = 0 
    let sessionsColorMap: { name: string, color: string }[] | null = null
    let keySelected: number | null = null

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const tagToColorMap = new Map<string, string>()
    
	let width: number;
	let height: number;
	const margin = { top: 20, right: 20, bottom: 60, left: 25 }
    const BAR_WIDTH = 7
    const BAR_CORNER_RADIUS = 2.6

    const DEFAULT_BAR_OPACITY = 0.7
    const HOVERED_BAR_OPACITY = 1

    const TOOL_TIP_DIR_PERCENT_CUTOFF = 0.72
    const OFFSET_X_LEFT_TOOL_TIP = 20
    const OFFSET_X_RIGHT_TOOL_TIP = 35
    const OFFSET_Y_TOOL_TIP = 5

    const highlightBar = (d: any) => {
        keySelected = d.data.key
        d3.selectAll(`.xAxis_${keySelected}`).style("color", "rgba(255, 255, 255, 1)")
        d3.selectAll(`.xAxis_${keySelected}`).style("font-weight", "500")
        d3.selectAll(`.bar-segment__${keySelected}`).style("opacity", HOVERED_BAR_OPACITY)

    }
    
    const deHighlightBar = () => {
        d3.selectAll(`.xAxis_${keySelected}`).style("color", "rgba(255, 255, 255, 0.4)")
        d3.selectAll(`.bar-segment__${keySelected}`).style("opacity", DEFAULT_BAR_OPACITY)
        keySelected = null
    }

    const initGraph = () => {
        d3.select(barGraph).html(null)
            .on("click", (event: any) => {
                if (event.target.localName === "path") return
                deHighlightBar()
            })


        width = d3.select(barGraph!).node().getBoundingClientRect().width - margin.left - margin.right;
		height = d3.select(barGraph!).node().getBoundingClientRect().height - margin.top - margin.bottom;

        const svg = d3
            .select(barGraph)
            .append("svg")
            .attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${[margin.left, margin.top]})`)

        
        const bars = svg.append("g").attr("class", "bars")

        // Scales
        const maxYAxisVal = Math.min(maxHours + 20, 240)

        const xScale = d3
            .scaleBand()
            .domain(dayToBarDataArr.map(d => d.date))
            .range([0, width])
            .paddingInner(0.25)
            .paddingOuter(0.35)

        const yScale = d3
            .scaleLinear()
            .range([height, 0])
            .domain([0, maxYAxisVal])

        // Stack Data
        const tagSegments = sessionsColorMap.map((t) => t.name)
        const stack = d3.stack().keys(tagSegments)
        const stackData = stack(dayToBarDataArr)

        // Colors
        const colors = sessionsColorMap.map((t) => tagToColorMap.get(t.name))
        const colorScale = d3.scaleOrdinal(colors)

        // Grid
        const axis = svg.append('g').attr('class', 'axis')
        const grid = axis.append('g').attr('class', 'grid')

        grid.selectAll('line.grid-line')
            .data(d3.range(20, maxYAxisVal + 10, 20))
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
            .data(d3.range(0, dayToBarDataArr.length, 1))
            .enter()
            .append("line")
            .attr('x1', domainIdx => xScale(dayToBarDataArr[domainIdx].date) + (xScale.bandwidth() / 2))
            .attr('x2', domainIdx => xScale(dayToBarDataArr[domainIdx].date) + (xScale.bandwidth() / 2))
            .attr("y1", 0) 
            .attr("y2", height) 
            .attr('stroke-width', 0.4)
            .attr('stroke', 'rgba(150, 150, 150, 0.07)')
            
        // axis & text styling
        const xAxis = svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .attr("class", "xAxis")
            .call(d3.axisBottom(xScale)
                    .tickPadding(12)
                    .tickSizeInner(0)
                    .tickSizeOuter(0)
                    .tickFormat((d) => daysOfWeek[d.getDay()].slice(0, 2))
            )

        const yAxis = svg.append('g')
            .attr("class", "yAxis")
            .call(d3.axisLeft(yScale)
                    .ticks(10)
                    .tickPadding(12)
                    .tickSizeInner(0)
                    .tickSizeOuter(0)
                    .tickFormat((d) =>  d3.format('.0f')(d / 10)))

        svg.selectAll(".domain")
            .attr("font-family", "Manrope")

        xAxis.selectAll(".tick text")
            .attr("color","rgba(255, 255, 255, 0.4)")
            .attr("font-weight", "300")
            .attr("font-size", "9.5")
            .style("transition", "0.1s ease-in-out")
            .attr("class", (d: any, ) => `xAxis_${d}`)
            
        yAxis.selectAll(".tick text")
            .attr("color","rgba(255, 255, 255, 1")
            .attr("font-weight", "400")
            .attr("font-size", "9.5")

        svg.selectAll(".domain")
            .attr('stroke-width', '0.4')
            .attr('stroke', 'rgba(150, 150, 150, 0.25)')

        // @ts-ignore
        const groups = bars
            .selectAll("g")
            .data(stackData)
            .enter()
            .append("g")
            .style("fill", d => colorScale(d.key))

        // tool tip
        const toolTip = d3.select(barGraph)
            .append("div")
            .style("display", "none")
            .classed("stacked-bar-tool-tip", true)

        const toolTipTagCircle = d3
            .select(".stacked-bar-tool-tip")
            .append("div")
            .classed("stacked-bar-tool-tip__tag-circle", true)

        const toolTipTagTitle = d3
            .select(".stacked-bar-tool-tip")
            .append("div")
            .classed("stacked-bar-tool-tip__tag-title", true)

        const toolTipTagHours = d3
            .select(".stacked-bar-tool-tip")
            .append("div")
            .classed("stacked-bar-tool-tip__tag-hours", true)

        const onMouseOverSegment = (event: any, segmentData: any) => {
            const segmentName = event.target.parentNode.__data__.key 
            const segmentHours = segmentData[1] - segmentData[0]

            toolTip.style("display", "flex")

            toolTipTagCircle.style("background-color", `${tagToColorMap.get(segmentName)}`)
            toolTipTagTitle.html(`${segmentName}`)
            toolTipTagHours.html(`${hoursToHhMm(segmentHours / 10)}`)
        }
        const onMouseMove = (event: any, segmentData: any) => {
            const [x, y] = d3.pointer(event)
            const toolTipWidth = toolTip._groups[0][0].offsetWidth
            const offSetX = x / width > TOOL_TIP_DIR_PERCENT_CUTOFF ? -1 * (toolTipWidth - OFFSET_X_LEFT_TOOL_TIP) : OFFSET_X_RIGHT_TOOL_TIP

            toolTip
                .style("left", (x + offSetX) + "px")
                .style("top", (y + OFFSET_Y_TOOL_TIP) + "px")

            d3.selectAll(`.bar-segment__${segmentData.data.key}`).style("opacity", HOVERED_BAR_OPACITY )
        }
        const onMouseLeave = (event: any, segmentData: any) => {
            toolTip.style("display", "none")

            if (keySelected === segmentData.data.key) return

            d3.selectAll(`.bar-segment__${segmentData.data.key}`).style("opacity", DEFAULT_BAR_OPACITY)
        }
        const onClick = (event: any, segmentData: any) =>  {
            if (keySelected != null) {
                deHighlightBar()
            }
            highlightBar(segmentData)
        }
        
        groups.selectAll("path")
            .data(d => d, d => d.data.key)
            .enter()
            .append("path")
            .attr("class", "bar")
            .attr('class', d => "bar-segment bar-segment__" + d.data.key)
            .attr('d', (d, idx) => {
                    const currBarUpperBound = dayToBarDataArr![idx].focusHours
                    let rx = 0, ry = 0
                
                    if (currBarUpperBound === 0) return ''

                    const currBarSegmentUpperBound = d[1]
                    const isCurrBarSegmentLast = currBarSegmentUpperBound === currBarUpperBound
                    
                    if (isCurrBarSegmentLast) { 
                        rx = BAR_CORNER_RADIUS
                        ry = BAR_CORNER_RADIUS
                    }

                    const path = []
                    
                    // draw the stack
                    if (d[1] - d[0] > 0) {
                        path.push(`M${(xScale(d.data.date) + xScale.bandwidth() / 2 - (BAR_WIDTH / 2))}, ${yScale(d[1]) + ry}`)
                        path.push(`a${rx},${ry} 0 0 1 ${rx},${-ry}`)
                        path.push(`h${BAR_WIDTH - 2 * rx}`)
                        path.push(`a${rx},${ry} 0 0 1 ${rx},${ry}`)
                        path.push(`v${yScale(d[0]) - yScale(d[1]) - ry}`)
                        path.push(`h${-BAR_WIDTH}Z`)

                    } else {
                        path.push(`M${(xScale(d.data.date) + xScale.bandwidth() / 2 - (BAR_WIDTH / 2))}, ${yScale(d[1])}`)
                        path.push("a0,0 0 0 1 0,0")
                        path.push(`h${BAR_WIDTH}`)
                        path.push("a0,0 0 0 1 0,0")
                        path.push(`v${yScale(d[0]) - yScale(d[1])}`)
                        path.push(`h${-BAR_WIDTH}Z`)
                    }
                    return path.join(" ")
                }
            )
            .on("mouseover", onMouseOverSegment)
            .on("mousemove", onMouseMove)
            .on("mouseleave", onMouseLeave)
            .on("click", onClick)

            d3.selectAll(".bar-segment")
                .style("opacity", DEFAULT_BAR_OPACITY)
                .style("cursor", "pointer")
                .style("transition", "0.1s ease-in-out")
    }

    onMount(() => {
        const chartData = getChartData()
        sessionsColorMap = chartData!.tags
        maxHours = chartData!.maxHours
        dayToBarDataArr = chartData!.dayToBarDataArr
        sessionsColorMap.forEach((t: any) => tagToColorMap.set(t.name, t.color))

		initGraph();
		window.addEventListener('resize', initGraph);
        
	})
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
    .stacked-bar-tool-tip {
        @include flex-container(center, _);
        padding: 4px 7px 5px 7px;
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

        }
    }
</style>