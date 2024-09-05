<script lang="ts">
	import { sessionManager } from "$lib/store"
	import { floatCompare } from "$lib/utils-general"
	import { formatTimeToHHMM, isSameDay, startOfDay, TOTAL_DAY_SECS } from "$lib/utils-date"

    export let width: number

    const LINE_WIDTH = 2
    const BOOK_END_LINE_COUNT = 8

    const ACTIVE_COLOR_RGB = "196, 234, 47"
    const PROGRESS_HEAD_COLOR = "#FFFFFF"
    const INVACTIVE_COLOR = "rgba(var(--textColor1), 0.095)"

    let totalLength = 0
    let lineSectionWidth = 30
    let timeStampCount = 5

    $: if (width) {
        onWidthResize(width)
    }

    $: store = $sessionManager
    $: elapsedSecs = store!.elapsedSecs
    $: session = store!.session
    $: state = store!.state
    $: startTime = session.startTime
    $: segments = store!.segments
    $: isPlaying = store!.isPlaying
    $: visEnd  = store!.visEnd 

    $: lineNumber   = (timeStampCount - 1) * lineSectionWidth
    $: secsPerLine  = Math.floor(totalLength / lineNumber)
    $: currLineSecs = Math.floor(elapsedSecs % secsPerLine)
    $: lineProgress = currLineSecs / secsPerLine

    let justInit = false
    let progressStart: Date
    let progressEnd: Date
    let progressStartOfDay = 0
    let progressEndOfDay = 0
    let currLineProgress = 0
    
    let currLineIdx = -1
    let currentLineElem: HTMLElement
    let timeStamps: string[] = []
    
    $: getProgressTimes(visEnd)

    // $: vars are initially undefined
    $: if (!justInit && store && secsPerLine) {
        justInit = true
        currLineProgress = lineProgress
    }
    $: if (lineSectionWidth && secsPerLine) {
        updateVisualizer()
    }
    $: if (elapsedSecs != undefined) {
        paintProgress()
        getProgressLineIdx()
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
    }
    function updateVisualizer() {
        currLineIdx = getProgressLineIdx()
        toggleTransition(currentLineElem, false)

        initTimeStamps()

        requestAnimationFrame(() => {
            offsetTimeStamps()
            repaintProgress()
            paintProgress()
            paintSegments()
        })
    }
    function getProgressLineIdx() {
        const currSecs = startOfDay(new Date()) - progressStartOfDay

        return Math.floor(currSecs / secsPerLine)
    }

    /* paint */
    function paintSegments() {
        segments.forEach((s) => paintSegment(s))
    }
    function paintProgress() {
        if (state === "to-break" || state === "to-focus") {
            return
        }
        const timeStampsLength = timeStamps.length
        const lines = getMainLines()
        
        if (!lines || timeStampsLength === 0) {
            return
        }
        if (currLineIdx < 0 || lineProgress * 100 < 1) {
            currLineIdx = getProgressLineIdx()
        }
        
        const line = lines[currLineIdx]

        if (!currentLineElem) {
            toggleTransition(line, true)
        }
        if (!isPlaying || state === "break") {
            paintProgressOnBreak(line)
        }
        else if (isPlaying) {
            paintProgressOnActive(line)
        }
    }
    function paintProgressOnBreak(line: HTMLElement) {
        if (currentLineElem && currentLineElem != line) {
            const useInactive = currLineProgress < 0.35
            const color = useInactive ? INVACTIVE_COLOR : `rgba(${ACTIVE_COLOR_RGB}, ${currLineProgress})`

            console.log("paintProgressOnBreak", currLineProgress, currLineIdx)

            currentLineElem.style.backgroundColor = color
            toggleTransition(currentLineElem, false)
            
            line.style.backgroundColor = PROGRESS_HEAD_COLOR
            toggleTransition(line, true)
            currLineProgress = 0
        }
        else {
            line.style.backgroundColor = PROGRESS_HEAD_COLOR
        }

        currentLineElem = line
    }
    function paintProgressOnActive(line: HTMLElement) {
        if (currentLineElem && currentLineElem != line) {
            const isComplete = floatCompare({ x: currLineProgress, op: "≥", y: 1 - (1 / secsPerLine)})
            const opacity    = isComplete ? 1 : Math.min(Math.max(currLineProgress, 0.35), 1)
            currentLineElem.style.backgroundColor = `rgba(${ACTIVE_COLOR_RGB}, ${opacity})`
            toggleTransition(currentLineElem, false)

            console.log("paintProgressOnActive", currLineProgress, currLineIdx)
            
            line.style.backgroundColor = `rgba(${ACTIVE_COLOR_RGB}, 0.35)`
            toggleTransition(line, true)
            currLineProgress = 0
        }
        else {
            currLineProgress += (1 / secsPerLine)
            line.style.backgroundColor = `rgba(${ACTIVE_COLOR_RGB}, ${Math.max(currLineProgress, 0.35)})`
        }

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
        const startSecs = startOfDay(new Date(start)) - progressStartOfDay
        const endSecs   = startOfDay(new Date(end)) - progressStartOfDay
        const startIdx = Math.floor(startSecs / secsPerLine)
        const endIdx   = Math.floor(endSecs / secsPerLine)

        for (let i = startIdx; i <= endIdx; i++) {
            if (i === currLineIdx) continue
            const line = lines[i]
            const lineColor  = line.style.backgroundColor ?? ""
            const fullActive = lineColor === `rgb(${ACTIVE_COLOR_RGB})`
            const colorArr  = lineColor.split(",")
            const inactive  = type === "break" || type === "paused"
            const arrLength = colorArr.length

            // multiple inactive can segments share the same line
            // thus multiple segments can contribute to lowering the lines opacity
            let inactiveOpacity = arrLength === 4 && !fullActive ? parseFloat(colorArr[3]) : 0

            // bookend lines for inactive states can have partial opacity
            // 1. a segment's length fits in an line or
            // 2. part of a segment fits is part of the line line
            if (i === startIdx && i == endIdx && inactive) {
                const frac = ((endSecs - startSecs) / secsPerLine) + inactiveOpacity
                const activeOpacity = 1 - Math.min(frac, 1) 

                colorLine({ line, type, idx: i, activeOpacity })
            }
            else if (i === startIdx && inactive) {
                const lineEndSecs = (startIdx * secsPerLine) + secsPerLine
                const frac = ((lineEndSecs - startSecs) / secsPerLine) + inactiveOpacity
                const activeOpacity = 1 - Math.min(frac, 1) 

                colorLine({ line, type, idx: i, activeOpacity })
            }
            else if (i === endIdx && inactive) {
                const lineStartSecs = (endIdx * secsPerLine) + 1
                const frac = ((endSecs - lineStartSecs) / secsPerLine) + inactiveOpacity
                const activeOpacity = 1 - Math.min(frac, 1) 

                colorLine({ line, type, idx: i, activeOpacity })
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
            line.style.backgroundColor = INVACTIVE_COLOR
        }
        else if (pastInactiveSegment) {
            line.style.backgroundColor = activeOpacity === 0 ? INVACTIVE_COLOR : `rgba(${ACTIVE_COLOR_RGB}, ${Math.max(activeOpacity, 0.15)})`
        }
        else if (type === "progress") {
            line.style.backgroundColor = `rgb(${ACTIVE_COLOR_RGB})`
        }
        else {
            line.style.backgroundColor = INVACTIVE_COLOR
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
    }
</script>

<div
    class="progress"
    style:--line-width={`${LINE_WIDTH}px`}
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
            @include text-style(0.12, 400, 1.1rem, "DM Mono");
            @include abs-bottom-left(-24px);
            white-space: nowrap;

            &--last {
                @include abs-bottom-right(-24px);
                left: unset;
            }
        }
        &__line {
            background-color: rgba(var(--textColor1), 0.045);
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