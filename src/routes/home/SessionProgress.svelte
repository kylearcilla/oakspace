<script lang="ts">
	import { globalContext, sessionManager, themeState } from "$lib/store"
	import { formatTimeToHHMM, isSameDay, startOfDay, TOTAL_DAY_SECS } from "$lib/utils-date"

    export let width: number

    const LINE_WIDTH = 2
    const BOOK_END_LINE_COUNT = 12
    const LINE_SPACING = 2

    const SVG_ITEM_WIDTH = LINE_WIDTH + LINE_SPACING
    const BOOKEND_SVG_WIDTH = BOOK_END_LINE_COUNT * SVG_ITEM_WIDTH

    const NORMAL_LINE_HEIGHT = 9
    const LONG_LINE_HEIGHT = 13
    
    const ABMIENT_ACTIVE_OPACITY = 0.6
    const DATA_ATTR_INACTIVE_OPACITY = "data-inactive-opacity"
    
    let progressRef: HTMLElement
    let lineSectionWidth = 30
    let timeStampCount = 5
    let totalLength = 0
    
    let activeColorRGB = ""
    let breakColor = "" // paused + break
    let baseOpacity = 0
    let headColor = "#FFFFFF"
    let textOpacity = 0.5
    
    $: context = $globalContext
    $: light = !$themeState.isDarkTheme
    $: location = context.sessionLocation
    $: store = $sessionManager
    $: inWorkspace = location === "workspace"

    $: onWidthResize(width)

    /* store*/
    $: elapsedSecs = store!.elapsedSecs
    $: session = store!.session
    $: state = store!.state
    $: startTime = session.startTime
    $: segments = store!.segments
    $: isPlaying = store!.isPlaying
    $: visEnd  = _formatTimeToHHMM(store!.visEnd)

    /* visualizer */
    let currVisEnd = ""
    let justInit = false
    let progressStart: Date
    let progressEnd: Date
    let progressStartOfDay = 0
    let progressEndOfDay = 0
    let currLineProgress = 0
    let currLineIdx = -1
    let currLine: SVGRectElement
    let timeStamps: string[] = []
    let nowPosition = 0
    let currentTime = ""

    /* progress */
    let lineNumber  = (timeStampCount - 1) * lineSectionWidth
    let secsPerLine = Math.floor(totalLength / lineNumber)

    $: currLineSecs = Math.floor(elapsedSecs % secsPerLine)
    $: complete     = elapsedSecs > 0 && currLineSecs === 0
    $: lineProgress = complete ? 1 : currLineSecs / secsPerLine

    $: if (currVisEnd != visEnd) {
        currVisEnd = visEnd
        getProgressTimes(store!.visEnd)
    }

    // $: vars are initially undefined
    $: if (!justInit && store && secsPerLine && currLineSecs && state === "focus") {        
        justInit = true
        currLineProgress = lineProgress
    }
    $: if (lineSectionWidth && secsPerLine) {
        updateVisualizer()
    }
    $: if (elapsedSecs != undefined) {
        paintProgress()
        currentTime = _formatTimeToHHMM(new Date())
    }
    $: if (light != undefined && location) {
        initColor(light, location)
    }

    /* ui */
    function getProgressTimes(visEnd: Date) {
        if (!visEnd) return

        progressStart = store!.visStart
        progressEnd = visEnd
        progressStartOfDay = startOfDay(progressStart)

        if (isSameDay(progressStart, progressEnd)) {
            progressEndOfDay = startOfDay(progressEnd)
        }
        else {
            progressEndOfDay = startOfDay(progressEnd) + TOTAL_DAY_SECS
        }
        totalLength = progressEndOfDay - progressStartOfDay
        secsPerLine = Math.floor(totalLength / lineNumber)

        updateVisualizer()
    }

    function updateVisualizer() {
        currLineIdx = getCurrIdx()
        toggleTransition(currLine, false)

        initTimeStamps()

        requestAnimationFrame(() => {
            offsetTimeStamps()
            repaintProgress()
            paintProgress()
            paintSegments()
        })
    }

    function getIdxFromDate(date: Date) {
        const sameDay = isSameDay(date, session.startTime)
        const nowStartSecs = startOfDay(date)
        let secs = 0

        if (sameDay) {
            secs = startOfDay(date) - progressStartOfDay
        }
        else {
            secs = nowStartSecs + TOTAL_DAY_SECS - progressStartOfDay
        }

        return { idx: Math.floor(secs / secsPerLine), secs }
    }

    function getCurrIdx() {
        return getIdxFromDate(new Date()).idx
    }

    /* paint */
    function paintSegments() {
        console.log(segments)
        segments.forEach((s) => paintSegment(s))
    }

    function paintProgress() {
        const transition = state === "to-break" || state === "to-focus"
        const timeStampsLength = timeStamps.length
        const lines = getMainLines()
        
        if (!lines || timeStampsLength === 0) {
            return
        }
        if (currLineIdx < 0 || lineProgress === 1) {
            currLineIdx = getCurrIdx()
        }
        
        const line = lines[currLineIdx]

        if (!line) {
            return
        }
        if (!currLine) {
            toggleTransition(line, true)
        }
        if (!isPlaying || state === "break" || transition) {
            paintCurrLineOnBreak(line)
        }
        else if (isPlaying) {
            currLineProgress += (1 / secsPerLine)
            paintCurrLineOnFocus(line)
        }
        if (lineProgress === 1) {
            currLineProgress = 0
        }

        updateNowPosition(line)
    }

    function paintCurrLineOnBreak(line: SVGRectElement) {
        if (currLine && currLine != line) {
            const useInactive = currLineProgress < 0.35
            const color = useInactive ? breakColor : `rgba(${activeColorRGB}, ${currLineProgress})`

            currLine.style.fill = color
            toggleTransition(currLine, false)
            toggleTransition(line, true)
        }
        line.style.fill = headColor
        currLine = line
    }

    function paintCurrLineOnFocus(line: SVGRectElement) {
        const progOpacity = Math.min(currLineProgress, inWorkspace ? ABMIENT_ACTIVE_OPACITY : 1)
        const opacity = Math.max(progOpacity, 0.35)

        if (currLine && currLine != line) {
            currLine.style.fill = `rgba(${activeColorRGB}, ${opacity})`
            toggleTransition(currLine, false)
            
            line.style.fill = `rgba(${activeColorRGB}, ${opacity})`
            toggleTransition(line, true)
            currLineProgress = 0
        }
        line.style.fill = `rgba(${activeColorRGB}, ${opacity})`
        currLine = line
    }

    function repaintProgress() {
        paintSegment({
            type: "progress",
            start: startTime,
            end: new Date()
        })
    }

    function paintSegment(segment: SessionProgressSegment) {
        const timeStampsLength = timeStamps.length
        const lines = getMainLines()
        if (!lines || timeStampsLength === 0) {
            return
        }

        const { type, start, end } = segment
        const { idx: startIdx, secs: startSecs } = getIdxFromDate(new Date(start))
        const { idx: endIdx, secs: endSecs } = getIdxFromDate(new Date(end))

        if (startIdx < 0 || startIdx >= lines.length) return
        if (endIdx < 0 || endIdx >= lines.length)     return

        for (let i = startIdx; i <= endIdx; i++) {
            if (i === currLineIdx) continue
            const line = lines[i]
            const inactive  = type === "break" || type === "paused"
            const lineStartSecs = i * secsPerLine
            const lineEndSecs = lineStartSecs + secsPerLine

            // multiple inactive segments can share the same line
            const prevBreakOpacity = parseFloat(line.getAttribute(DATA_ATTR_INACTIVE_OPACITY) ?? "0")
            const prevBreakSecs   = Math.floor((secsPerLine * prevBreakOpacity))

            let totalBreak = 0, frac = 0

            // bookend lines for inactive states can have partial opacity
            if (i === startIdx && i === endIdx && inactive) {
                totalBreak = endSecs - startSecs + prevBreakSecs
                frac       = totalBreak / secsPerLine
                colorLine({ line, type, idx: i, activeOpacity: 1 - Math.min(frac, 1) })
            }
            else if (i === startIdx && inactive) {
                totalBreak = lineEndSecs - startSecs + prevBreakSecs
                frac       = totalBreak / secsPerLine
                colorLine({ line, type, idx: i, activeOpacity: 1 - Math.min(frac, 1) })
            }
            else if (i === endIdx && inactive) {
                totalBreak = endSecs - lineStartSecs + prevBreakSecs
                frac       = totalBreak / secsPerLine
                colorLine({ line, type, idx: i, activeOpacity: 1 - Math.min(frac, 1) })
            }
            else {
                colorLine({ line, type, idx: i })
            }
        }
    }

    function colorLine({ line, type, idx, activeOpacity }: { 
        line: SVGRectElement 
        type: SessionState | "progress" 
        idx: number 
        activeOpacity?: number 
    }) {
        const pastInactive = activeOpacity != undefined && (type === "paused" || type === "break")
        const breakOpacity = parseFloat(breakColor.split(",")[1])
        const aOpacity = Math.min(activeOpacity ?? 1, inWorkspace ? ABMIENT_ACTIVE_OPACITY : 1)

        if (idx >= currLineIdx && type === "break") {
            line.style.fill = breakColor
        }
        else if (pastInactive) {
            line.setAttribute(DATA_ATTR_INACTIVE_OPACITY, `${Math.max(1 - aOpacity, 0)}`)
            line.style.fill = `rgba(${activeColorRGB}, ${Math.max(aOpacity, breakOpacity)})`
        }
        else if (type === "progress") {
            line.style.fill = `rgba(${activeColorRGB}, ${aOpacity})`
        }
        else {
            line.style.fill = breakColor
        }
    }

    function toggleTransition(line: SVGRectElement | null | undefined, hasTransition: boolean) {
        if (!line) return
        line.style.transition = hasTransition ? "fill ease-in-out 0.5s" : "none"
    }

    function initColor(light: boolean, sessionLocation: "workspace" | "default" | undefined) {
        if (sessionLocation === "workspace") {
            activeColorRGB = "240, 240, 240"
            breakColor = "rgba(var(--textColor1), 0.25)"
            baseOpacity = 0.065
            headColor = "#FFFFFF"
            textOpacity = 0.2
        }
        else if (light) {
            activeColorRGB = "var(--ringColor)"
            breakColor = "rgba(var(--textColor1), 0.35)"
            baseOpacity = 0.09
            headColor = "rgba(var(--ringColor))"
            textOpacity = 0.385
        }
        else {
            activeColorRGB = "var(--ringColor)"
            breakColor = "rgba(var(--textColor1), 0.2)"
            headColor = "#FFFFFF"
            baseOpacity = 0.07
            textOpacity = 0.185
        }
    }

    /* time stamps */
    function initTimeStamps() {
        const times: string[] = []
        const interval = (progressEnd.getTime() - progressStart.getTime()) / (timeStampCount - 1)

        for (let i = 0; i < timeStampCount; i++) {
            const newTime = new Date(progressStart.getTime() + interval * i)
            times.push(_formatTimeToHHMM(newTime))
        }

        timeStamps = times
    }
    function offsetTimeStamps() {
        const timeStamps = document.getElementsByClassName("progress__segment-time")
        for (let i = 1; i < timeStamps.length - 2; i++) {
            const elem = timeStamps[i] as HTMLElement
            const width = elem.clientWidth
            elem.style.left = `-${(width / 2) - 3}px`
        }
    }

    /* utils */
    function getMainLines() {
        return document.querySelectorAll(".progress__line-svg--main") as unknown as SVGRectElement[]
    }
    
    function onWidthResize(width: number) {
        if (width <= 650) {
            lineSectionWidth = 32
            timeStampCount = 4
        }
        else if (width <= 680) {
            lineSectionWidth = 30
            timeStampCount = 5
        }
        else if (width <= 940) {
            lineSectionWidth = 32
        }
        else {
            timeStampCount = 5
            lineSectionWidth = 40
        }
        lineNumber = (timeStampCount - 1) * lineSectionWidth
        secsPerLine = Math.floor(totalLength / lineNumber)
    }

    function updateNowPosition(line: SVGRectElement) {
        const rect = line.getBoundingClientRect()
        const containerRect = progressRef.getBoundingClientRect()

        nowPosition = rect.left - containerRect.left + (LINE_WIDTH / 2)
    }

    function _formatTimeToHHMM(date: Date) {
        return formatTimeToHHMM(date, true).toLowerCase()
    }
</script>

<div class="wrapper" style:--text-opacity={textOpacity}>
    <div class="wrapper__now" style:left={`${nowPosition}px`}>
        <div class="wrapper__now-time">{currentTime}</div>
    </div>
    <div
        bind:this={progressRef}
        class="progress"
        class:progress--light={light}
        style:--line-width={`${LINE_WIDTH}px`}
        style:--base-opacity={baseOpacity}
        style:--indicator-position={`${nowPosition}px`}
    >
        <div class="progress__segment-container">
            <svg height={LONG_LINE_HEIGHT} width={BOOKEND_SVG_WIDTH}>
                {#each new Array(BOOK_END_LINE_COUNT) as _, i}
                    {@const x = i * SVG_ITEM_WIDTH}
                    <rect 
                        x={x} 
                        y="0" 
                        width={LINE_WIDTH} 
                        height={NORMAL_LINE_HEIGHT} 
                        rx="0.8" 
                        class="progress__line-svg"
                    />
                {/each}
            </svg>
        </div>
        {#key secsPerLine}
            <div class="progress__segment-container">
                {#each timeStamps as time, timeIdx}
                    {@const isFirst = timeIdx === 0}
                    {@const isLast = timeIdx === timeStamps.length - 1}
                    {@const is2ndLast = timeIdx === timeStamps.length - 2}
                    {@const linesBefore = (timeIdx * lineSectionWidth) + timeIdx}
                    {@const svgWidth = lineSectionWidth * SVG_ITEM_WIDTH}
                    
                    <div 
                        class="progress__segment"
                        class:progress__segment--first={isFirst}
                        class:progress__segment--last={isLast}
                    >
                        <!-- time stamp -->
                        <div class="progress__segment-time">
                            {time}
                        </div>
                        {#if is2ndLast}
                            <div 
                                class="progress__segment-time"
                                class:progress__segment-time--last={true}
                            >
                                {timeStamps[timeIdx + 1]}
                            </div>
                        {/if}
    
                        <!-- lines -->
                        {#if !isLast}
                            <svg height={LONG_LINE_HEIGHT} width={svgWidth}>
                                {#each new Array(lineSectionWidth) as _, idx}
                                    {@const x = idx * SVG_ITEM_WIDTH}
                                    {@const long = idx === 0 || (is2ndLast && idx === lineSectionWidth - 1)}
                                    {@const height = long ? LONG_LINE_HEIGHT : NORMAL_LINE_HEIGHT}
                                    {@const radius = long ? 1.25 : 0.8}
                                    
                                    <rect 
                                        id={`session-line--${linesBefore + idx}`}
                                        x={x} 
                                        y="0" 
                                        width={LINE_WIDTH} 
                                        height={height} 
                                        rx={radius} 
                                        class="progress__line-svg progress__line-svg--main"
                                        class:progress__line-svg--long={long}
                                    />
                                {/each}
                            </svg>
                        {/if}
                    </div>
                {/each}
            </div>
        {/key}
        <div class="progress__segment-container">
            <svg height={LONG_LINE_HEIGHT} width={BOOKEND_SVG_WIDTH}>
                {#each new Array(BOOK_END_LINE_COUNT) as _, i}
                    {@const x = i * SVG_ITEM_WIDTH}
                    <rect 
                        x={x} 
                        y="0" 
                        width={LINE_WIDTH} 
                        height={NORMAL_LINE_HEIGHT} 
                        rx="0.8" 
                        class="progress__line-svg"
                    />
                {/each}
            </svg>
        </div>
    </div>
</div>

<style lang="scss">
    .progress {
        --gradient-length: 60px;
        --indicator-position: 0px;
        height: 40px;
        position: relative;
        -webkit-mask-image: linear-gradient(
                        90deg, 
                        transparent 0px, black var(--gradient-length), 
                        black calc(100% - var(--gradient-length)), transparent 100%
                    );
        mask-image: linear-gradient(
                        90deg, 
                        transparent 0px, black var(--gradient-length), 
                        black calc(100% - var(--gradient-length)), transparent 100%
                    );
        @include flex(flex-start, center);

        &__segment-container {
            @include flex(flex-start);
            height: 13px;
            margin: 0;
        }
        &__segment {
            position: relative;
            @include flex(flex-start);

            &--last {
                display: none;
            }
        }
        &__segment-time {
            @include text-style(var(--text-opacity), var(--fw-400-500), 1.2rem);
            @include abs-bottom-left(-26px);
            white-space: nowrap;

            &--last {
                @include abs-bottom-right(-26px);
                left: unset;
            }
        }
        &__line-svg {
            fill: rgba(var(--textColor1), var(--base-opacity));
            
            &--main {
                transition: fill 0.3s ease;
            }
        }
    }

    .wrapper {
        position: relative;

        &:hover &__now {
            @include visible;
        }
        &__now {
            position: absolute;
            width: 2px;
            height: 18px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
            transition: 0.2s ease-in-out;
            @include not-visible;
        }
        &__now::after {
            position: absolute;
            top: -18px;
            transform: translateX(-50%);
            content: " ";
            @include circle(2px);
            background: rgba(var(--textColor1), var(--text-opacity));
        }

        &__now-time {
            position: absolute;
            top: -36px;
            transform: translateX(-50%);
            @include text-style(var(--text-opacity), var(--fw-400-500), 1.1rem);
            white-space: nowrap;
            padding: 2px 4px;
            border-radius: 3px;
        }
    }
</style>