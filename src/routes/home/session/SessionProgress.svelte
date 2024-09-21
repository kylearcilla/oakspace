<script lang="ts">
	import { globalContext, sessionManager, themeState } from "$lib/store"
	import { formatTimeToHHMM, isSameDay, startOfDay, TOTAL_DAY_SECS } from "$lib/utils-date"

    export let width: number

    const LINE_WIDTH = 2
    const BOOK_END_LINE_COUNT = 12

    const PROGRESS_HEAD_COLOR = "#FFFFFF"
    const DATA_ATTR_INACTIVE_OPACITY = "data-inactive-opacity"

    let lineSectionWidth = 30
    let timeStampCount = 5
    let totalLength = 0
    
    $: context = $globalContext
    $: activeColorRGB = context.ambience ? "var(--fgColor1)" :  "196, 234, 47"
    $: inactiveColor = context.ambience ? "rgba(var(--textColor1), 0.2)" : "rgba(var(--textColor1), 0.1)"

    $: if (width) {
        onWidthResize(width)
    }

    /* store*/
    $: store = $sessionManager
    $: elapsedSecs = store!.elapsedSecs
    $: session = store!.session
    $: state = store!.state
    $: startTime = session.startTime
    $: segments = store!.segments
    $: isPlaying = store!.isPlaying
    $: visEnd  = formatTimeToHHMM(store!.visEnd)
    
    /* visualizer */
    let currVisEnd = ""
    let justInit = false
    let progressStart: Date
    let progressEnd: Date
    let progressStartOfDay = 0
    let progressEndOfDay = 0
    let currLineProgress = 0
    let currLineIdx = -1
    let currentLineElem: HTMLElement
    let timeStamps: string[] = []


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
        toggleTransition(currentLineElem, false)

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
        if (!currentLineElem) {
            toggleTransition(line, true)
        }
        if (!isPlaying || state === "break" || transition) {
            paintProgressOnBreak(line)
        }
        else if (isPlaying) {
            currLineProgress += (1 / secsPerLine)
            paintProgressOnActive(line)
        }
        if (lineProgress === 1) {
            currLineProgress = 0
        }
    }
    function paintProgressOnBreak(line: HTMLElement) {
        if (currentLineElem && currentLineElem != line) {
            const useInactive = currLineProgress < 0.35
            const color = useInactive ? inactiveColor : `rgba(${activeColorRGB}, ${currLineProgress})`

            currentLineElem.style.backgroundColor = color
            toggleTransition(currentLineElem, false)
            toggleTransition(line, true)
        }
        line.style.backgroundColor = PROGRESS_HEAD_COLOR
        currentLineElem = line
    }
    function paintProgressOnActive(line: HTMLElement) {
        if (currentLineElem && currentLineElem != line) {
            const opacity    = Math.min(Math.max(currLineProgress, 0.35), 1)
            currentLineElem.style.backgroundColor = `rgba(${activeColorRGB}, ${opacity})`
            toggleTransition(currentLineElem, false)

            
            line.style.backgroundColor = `rgba(${activeColorRGB}, 0.35)`
            toggleTransition(line, true)
            currLineProgress = 0
        }
        line.style.backgroundColor = `rgba(${activeColorRGB}, ${Math.max(currLineProgress, 0.35)})`
        currentLineElem = line
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
        const { idx: startIdx, secs: startSecs }  = getIdxFromDate(new Date(start))
        const { idx: endIdx, secs: endSecs }  = getIdxFromDate(new Date(end))

        if (startIdx < 0 || startIdx >= lines.length) return
        if (endIdx < 0 || endIdx >= lines.length)     return

        for (let i = startIdx; i <= endIdx; i++) {
            if (i === currLineIdx) continue
            const line = lines[i]
            const inactive  = type === "break" || type === "paused"
            const lineEndSecs = (startIdx * secsPerLine) + secsPerLine
            const lineStartSecs = (endIdx * secsPerLine) + 1

            // multiple inactive segments can share the same line
            const inactiveOpacity = parseFloat(line.getAttribute(DATA_ATTR_INACTIVE_OPACITY) ?? "0")
            const prevBreakSecs   = Math.floor((secsPerLine * inactiveOpacity))

            let totalBreak = 0, frac = 0

            // bookend lines for inactive states can have partial opacity
            if (i === startIdx && i == endIdx && inactive) {
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
    function colorLine(args: { line: HTMLElement, type: SessionState | "progress", idx: number, activeOpacity?: number }) {
        const { line, type, idx, activeOpacity } = args
        const pastInactiveSegment = activeOpacity != undefined && (type === "paused" || type === "break")

        if (idx >= currLineIdx && type === "break") {
            line.style.backgroundColor = inactiveColor
        }
        else if (pastInactiveSegment) {
            line.setAttribute(DATA_ATTR_INACTIVE_OPACITY, `${1 - activeOpacity}`)
            line.style.backgroundColor = activeOpacity === 0 ? inactiveColor : `rgba(${activeColorRGB}, ${Math.max(activeOpacity, 0.15)})`
        }
        else if (type === "progress") {
            line.style.backgroundColor = `rgb(${activeColorRGB})`
        }
        else {
            line.style.backgroundColor = inactiveColor
        }
    }
    function toggleTransition(line: HTMLElement | null | undefined, hasTransition: boolean) {
        if (!line) return

        line.style.transition = hasTransition ? "ease-in-out 0.5s" : "none"
    }

    /* time stamps */
    function initTimeStamps() {
        const times: string[] = []
        const interval = (progressEnd.getTime() - progressStart.getTime()) / (timeStampCount - 1)

        for (let i = 0; i < timeStampCount; i++) {
            const newTime = new Date(progressStart.getTime() + interval * i)
            times.push(formatTimeToHHMM(newTime))
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
        return document.getElementsByClassName("progress__line--main") as unknown as HTMLElement[]
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
</script>

<div
    class="progress"
    style:--line-width={`${LINE_WIDTH}px`}
    style:--txt-opacity={`${context.ambience ? "0.065" : "0.045"}`}
>
    <div class="progress__segment-container">
        {#each new Array(BOOK_END_LINE_COUNT) as _}
            <div class="progress__line"></div>
        {/each}
    </div>
    {#key secsPerLine}
        <div class="progress__segment-container">
            {#each timeStamps as time, timeIdx}
                {@const linesBefore = (timeIdx * lineSectionWidth) + timeIdx}
                {@const isFirst = timeIdx === 0}
                {@const isLast = timeIdx === timeStamps.length - 1}
                {@const is2ndLast = timeIdx === timeStamps.length - 2}
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
                        {#each new Array(lineSectionWidth) as _, idx}
                            <div 
                                id={`session-line--${linesBefore + idx}`}
                                class="progress__line"
                                class:progress__line--main={true}
                                class:progress__line--long={idx === 0 || is2ndLast && idx === lineSectionWidth - 1}
                            >
                            </div>
                        {/each}
                    {/if}
                </div>
            {/each}
        </div>
    {/key}
    <div class="progress__segment-container">
        {#each new Array(BOOK_END_LINE_COUNT) as _}
            <div class="progress__line"></div>
        {/each}
    </div>
</div>

<style lang="scss">
    .progress {
        --gradient-length: 60px;
        height: 40px;
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
            margin: 0px 0px 0px 0px;
        }
        &__segment {
            position: relative;
            @include flex(flex-start);

            &--last {
                display: none;
            }
        }
        &__segment-time {
            @include text-style(0.185, 400, 1.1rem, "DM Mono");
            @include abs-bottom-left(-24px);
            white-space: nowrap;

            &--last {
                @include abs-bottom-right(-24px);
                left: unset;
            }
        }
        &__line {
            background-color: rgba(var(--textColor1), var(--txt-opacity));
            margin-right: 2px;
            height: 9px;
            min-width: var(--line-width);
            border-radius: 6px;
            
            &--long {
                height: 13px;
            }
        }
    }
</style>