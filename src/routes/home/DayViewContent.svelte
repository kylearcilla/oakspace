<script lang="ts">
	import { onDestroy } from "svelte"

    import { globalContext } from "$lib/store"
    import { getColorTrio } from "$lib/utils-colors"
	import { findClosestColorSwatch } from "$lib/utils-colors"
	import { themeState, weekRoutine, timer } from "$lib/store"
    
    import { RoutinesManager } from "$lib/routines-manager"
    import { getMaskedGradientStyle } from "$lib/utils-general"
	import { GoogleCalendarManager } from "$lib/google-calendar-manager"
	import { getDayIdxMinutes, getTimeFromIdx, isSameDay, minsFromStartToHHMM } from "$lib/utils-date"
	import { getDayRoutineFromWeek, resetDayRoutine, toggleRoutineBlockComplete } from "$lib/utils-routines"

	import ActiveRoutine from "./ActiveRoutine.svelte";
	import BounceFade from "$components/BounceFade.svelte"

    export let checkbox: boolean
    export let richColors: boolean
    export let view: "routines" | "g-cal"
    export let googleCals: GoogleCalendar[]
    export let googleEvents: GoogleCalendarEvent[]
    export let day: Date

    const EVENT_BLOCK_LEFT_OFFSET = 50

    let currTime = getDayIdxMinutes()
    let dayIdx = -1

    let headerHeight = 0
    let focusEventId = ""
    let maskListGradient = ""
    let scrollContainerHeight = 0
    let metaDown = false
    
    let dayViewElem: HTMLElement
    let allDayRef: HTMLElement

    let dRoutine: RoutineBlock[] | DailyRoutine | null = null
    let routineBlocks: RoutineBlockElem[] = []
    let currBlock: { block: RoutineBlock, idx: number } | null = null
    let currBlockDayIdx: number | null = null
    
    $: isLight = !$themeState.isDarkTheme
    $: ambience = $globalContext.ambience
    $: hasAmbience = ambience?.active
    $: routine = $weekRoutine
    $: isToday = isSameDay(new Date(), day)

    // update routine when day changes
    $: if (dayViewElem && day != undefined && routine != undefined) {
        updateDayRoutine(day.getDay())
    }
    $: if (headerHeight >= 0 && allDayRef) {
        onDayHeaderScroll()
    }
    $: if (routine === null) {
        routineBlocks = []
    }

    const unsubscribe = timer.subscribe(() => currTime = getDayIdxMinutes())

    /* google calendar */
    function onDayHeaderScroll() {
        maskListGradient = getMaskedGradientStyle(allDayRef, {
            head: {
                start: "0px",
                end: "20px"
            },
            tail: {
                start: "50%",
                end: "100%"
            }
        }).styling
    }
    function doRenderEvent(e: GoogleCalendarEvent, options: { allowAllDay: boolean }) {
        const { allowAllDay } = options
        const eventCal = googleCals.find((cal) => cal.id === e.calendarId)

        if (eventCal?.isChecked) {
            return eventCal.isChecked && (allowAllDay ? e.allDay : !e.allDay)
        }
        else {
            return false
        }
    }
    function onEventClick(e: Event, url: string) {
        const target  = e.target as HTMLElement
        const classes = target.classList.value

        if (
            !classes.includes("title") && 
            !classes.includes("time-period") && 
            target.tagName != "SPAN"
        ) {
            const newTab = window.open(url, '_blank')
            newTab?.focus()
        }
    }

    /* routines */
    function updateDayRoutine(idx: number) {
        if (dayIdx != idx) {
            resetDayRoutine()
        }
        dRoutine = getDayRoutineFromWeek(routine, idx)
        dayIdx = idx

        if (scrollContainerHeight != undefined) {
            finishEdits()
        }
    }
    function finishEdits() {
        if (!dRoutine) return

        const blocks = "id" in dRoutine ? dRoutine.blocks : dRoutine
        routineBlocks = blocks.map((block) => {
            return RoutinesManager.createRoutineBlockElem(block, scrollContainerHeight)
        })
    }
    function onRoutineClick(e: Event, block: RoutineBlockElem & { idx: number }) {
        const target = e.target as HTMLElement
        const classes = target.classList.value
        const isCheckbox = classes.includes("routine-block-checkbox") || target.tagName === "I"

        if (isCheckbox) return

        currBlock = { block, idx: block.idx }
        currBlockDayIdx = dayIdx
    }

    onDestroy(() => unsubscribe())
</script>

<svelte:window 
    on:keydown={(e) => e.key === 'Meta' && (metaDown = true)}
    on:keyup={(e) => e.key === 'Meta' && (metaDown = false)}
/>

<div 
    class="day-view" 
    class:day-view--light={isLight}
    class:day-view--no-color={!richColors}
    style:--EVENTS_COUNT={googleEvents?.length ?? 0}
    style:--HOUR_BLOCK_HEIGHT={`${GoogleCalendarManager.HOUR_BLOCK_HEIGHT}px`}
>
    <div class="day-view__header" bind:clientHeight={headerHeight}>
        {#if view === "routines"}
            <span class="day-view__routine-name">
                {routine?.name ?? "Routine"}
            </span>
        {:else}
            <span class="day-view__all-day">
                All Day
            </span>
        {/if}
        {#if view === "g-cal"}
            {@const events = googleEvents ?? []}
            <div 
                bind:this={allDayRef}
                on:scroll={onDayHeaderScroll}
                class="day-view__header-events no-scroll-bar"
                style={maskListGradient}
            >
                {#each events.filter((e) => doRenderEvent(e, { allowAllDay: true })) as event}
                    {@const colorSwatch  = findClosestColorSwatch(event.color.bgColor)}
                    {@const colorTrio    = getColorTrio(colorSwatch, isLight)}
                    <div 
                        role="button" 
                        tabindex="0" 
                        class="routine-block routine-block--all-day"
                        style:--block-color-1={colorTrio[0]}
                        style:--block-color-2={colorTrio[1]}
                        style:--block-color-3={colorTrio[2]}
                        on:click={(e) => {
                            if (metaDown) {
                                onEventClick(e, event.url)
                            }
                        }}
                        on:dblclick={(e) => { 
                            onEventClick(e, event.url)
                        }}
                        on:keydown={(e) => {
                            if (e.key === 'Enter' || e.code === 'Space') {
                                e.preventDefault()
                                onEventClick(e, event.url)
                            }
                        }}
                    >
                        <div class="routine-block__content" style:padding-top={"4px"}>
                            <div class="routine-block__title">
                                {event.title}
                            </div>
                            <div class="routine-block__spine"></div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
    <div 
        class="day-view__scroll-container no-scroll-bar"
        style:height={`calc(100% - ${headerHeight}px)`}
    >
        <div bind:this={dayViewElem} class="day-view__col">
            <!-- Blocks -->
            <div 
                class="day-view__col-container" bind:clientHeight={scrollContainerHeight}
            >
                <div 
                    class="day-view__col-blocks routine-blocks"    
                    class:routine-blocks--light={isLight}
                >
                    {#if view === "g-cal"}
                        <!-- Events -->
                        {#each googleEvents ?? [] as event}
                            {@const colorSwatch  = findClosestColorSwatch(event.color.bgColor)}
                            {@const colorTrio    = getColorTrio(colorSwatch, isLight)}
                            {@const startTimeStr = minsFromStartToHHMM(event.timeStart)}
                            {@const endTimeStr   = minsFromStartToHHMM(event.timeEnd)}
                            {@const heightNum    = parseInt(event.height)}
                            {@const isFocused    = focusEventId === event.id}
                            {@const overlapIdx   = event.idx}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <div 
                                role="button"
                                tabindex="0"
                                data-color={event.color.bgColor}
                                class="routine-block"
                                class:routine-block--bordered={hasAmbience && ambience?.styling !== "solid"}
                                class:routine-block--focused={isFocused}
                                class:routine-block--light={isLight}
                                class:box-ontop={overlapIdx === 0}
                                class:hidden={!doRenderEvent(event, { allowAllDay: false })}
                                style:top={`calc(${event.top} + 1px)`}
                                style:left={`calc(${event.left} + ${EVENT_BLOCK_LEFT_OFFSET + 14}px)`}
                                style:width={`calc(${event.width} - 12px)`}
                                style:--block-height={isFocused ? heightNum <= 40 ? "80px" : event.height : event.height}
                                style:--block-color-1={colorTrio[0]}
                                style:--block-color-2={colorTrio[1]}
                                style:--block-color-3={colorTrio[2]}
                                on:focus={() => { 
                                    focusEventId = event.id
                                }}
                                on:blur={() => { 
                                    focusEventId = ""
                                }}
                                on:click={(e) => {
                                    if (metaDown) {
                                        onEventClick(e, event.url)
                                    }
                                }}
                                on:dblclick={(e) => { 
                                    onEventClick(e, event.url)
                                }}
                                on:keydown={(e) => {
                                    if (e.key === 'Enter' || e.code === 'Space') {
                                        e.preventDefault()
                                        onEventClick(e, event.url)
                                    }
                                }}
                            >
                                <div class="routine-block__content">
                                    <div>
                                        <div class="flx flx--algn-center">
                                            <span class="routine-block__title">
                                                {event.title}
                                            </span>
                                        </div>
                                        <div class="routine-block__time-period">
                                            <span>{startTimeStr}</span>
                                            <span>-</span>
                                            <span>{endTimeStr}</span>
                                        </div>
                                        <div class="routine-block__spine"></div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {:else}
                        {#each routineBlocks as block, blockIdx (blockIdx)}
                            {@const colorTrio    = getColorTrio(block.color, isLight)}
                            {@const startTimeStr = minsFromStartToHHMM(block.startTime)}
                            {@const endTimeStr   = minsFromStartToHHMM(block.endTime)}
                            {@const done  = block.done}
                            <!-- svelte-ignore a11y-interactive-supports-focus -->
                            <div 
                                role="button"
                                tabIndex={0}
                                class="routine-block"
                                class:routine-block--checkbox={checkbox}
                                class:routine-block--checked={done}
                                class:routine-block--bordered={hasAmbience && ambience?.styling !== "solid"}
                                style:top={`${block.yOffset}px`}
                                style:--block-height={`${block.height}px`}
                                style:--block-color-1={colorTrio[0]}
                                style:--block-color-2={colorTrio[1]}
                                style:--block-color-3={colorTrio[2]}
                                title={`${block.title} \n${startTimeStr} - ${endTimeStr}`}
                                on:click={(e) => {
                                    onRoutineClick(e, { ...block, idx: blockIdx })
                                }}
                                on:keydown={(e) => {
                                    if (e.key === 'Enter' || e.code === 'Space') {
                                        e.preventDefault()
                                    }
                                }}
                            >
                                <div 
                                    class="routine-block__content"
                                    style:border-bottom={`0.5px solid var(--bg-1)`}
                                >
                                    {#if isToday}
                                        <button 
                                            on:click={() => toggleRoutineBlockComplete(blockIdx, currTime)}
                                            title="Toggle routine completion"
                                            class="routine-block__checkbox"
                                            class:routine-block__checkbox--checked={done}
                                        >
                                            <i class="fa-solid fa-check"></i> 
                                        </button>
                                    {/if}
                                    <div>
                                        <div class="flx flx--algn-center">
                                            <span 
                                                class="routine-block__title"
                                                class:block-title-strike={done}
                                            >
                                                {block.title}
                                            </span>
                                        </div>
                                        <div class="routine-block__time-period">
                                            <span>{startTimeStr}</span>
                                            <span>-</span>
                                            <span>{endTimeStr}</span>
                                        </div>
                                        <div class="routine-block__spine"></div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {/if}

                    <div 
                        class="now-line"
                        class:hidden={!isSameDay(new Date(), day)}
                        style:top={`calc(${(currTime.minutes / 1440) * 100}% - 0px)`}
                        style:left={`${EVENT_BLOCK_LEFT_OFFSET + 4}px`}
                        style:width={`calc(100% - var(--DAY_VIEW_SIDE_MARGINS))`}
                    >
                        <div class="now-line__content"></div>
                    </div>
                </div>
            </div>

            <!-- Hour Blocks -->
            <div class="hour-blocks-container scroll-bar-hidden">
                <div 
                    class="hour-blocks"
                    class:hour-blocks--light={isLight}
                >
                    {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                        {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                        {@const height         = (60 / 1440) * 100}
                        <div 
                            class="hour-blocks__block"
                            class:hidden={timeIdx === 0}
                            style:height={`${height}%`}
                            style:top={`calc(${headOffsetPerc}% - 1.5px)`}
                        >
                            <span>
                                {getTimeFromIdx(timeIdx).toLowerCase()}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Grid -->
            <div 
                class="wk-grid"
                class:wk-grid--light={isLight}
            >
                <div class="wk-grid__hoz-lines">
                    {#if dayViewElem}
                        {@const leftOffset = 40}
                        {@const width = dayViewElem.clientWidth - leftOffset}

                        {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                            {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                            {@const height = (60 / 1440) * 100}
                            <div 
                                class="wk-grid__hoz-line"
                                class:hidden={timeIdx === 0}
                                style:top={`calc(${headOffsetPerc}% - 2px)`}
                                style:left={`${leftOffset}px`}
                                style:height={`${height}%`}
                            >
                                <div class="wk-grid__hoz-line-content">
                                    <svg xmlns="http://www.w3.org/2000/svg" {width} height="2" viewBox={`0 0 ${width} 2`} fill="none">
                                        <path d={`M0 1H ${width}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                    </svg>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<BounceFade 
    isHidden={!currBlock || currBlockDayIdx === null}
    fixPos={true}
    zIndex={9000}
    offsetContext="side-bar"
    onClickOutside={() => {
        currBlock = null
        currBlockDayIdx = null
    }}
>
    {#if currBlock && currBlockDayIdx !== null}
        <div class="active-routine">
            <ActiveRoutine 
                isOpen={true}
                type="side-menu" 
                block={currBlock} 
                currDayIdx={currBlockDayIdx} 
            />
        </div>
    {/if}
</BounceFade>

<style lang="scss">
    @use "../../scss/day-box.scss" as *;
    @use "../../scss/components/routines.scss" as *;
    .day-view {
        width: 100%;
        height: calc(100% - 38px);

        &--light &__header {
            border-bottom: 1.5px solid rgba(var(--textColor1), 0.075);
        }
        &--light &__header span {
            @include text-style(0.3);
        }
        &--light .now-line {
            height: 2px;
        }

        /* header */
        &__header {
            padding: 3px 0px 0px 0px;
            margin-left: var(--DAY_VIEW_SIDE_MARGINS);
            width: calc(100% - (var(--DAY_VIEW_SIDE_MARGINS) * 2));
            display: flex;
            border-bottom: 0.5px solid rgba(var(--textColor1), 0.055);
            padding: 2px 0px 7px 0px;
            
            span {
                @include text-style(0.14, var(--fw-400-500), 1.1rem);
                white-space: nowrap;
            }
        }
        &__routine-name {
            max-width: 90%;
            margin-left: 1px;
        }
        &__all-day {
            max-width: 100%;
            font-size: 1rem !important;
            margin-top: 2px;
            @include text-style(_, _, _, "system");
        }
        &__header-events {
            max-height: 80px;
            overflow-y: scroll;
            width: calc(100% - 13px) !important;
            margin-left: 13px !important;
            position: relative;
        }
        &__header-btn {
            @include text-style(_, 500, 1.24rem);
            margin: 0px 16px 2px 0px;
            opacity: 0.2;

            &:hover {
                opacity: 0.4;
            }
            &--active:hover {
                opacity: 0.8;
            }
            &--active {
                opacity: 0.8;
            }
        }
        &__header-count {
            @include text-style(0.12, 400, 1.2rem, "DM Sans");
        }
            
        /* scroll column */
        &__scroll-container {
            overflow-y: scroll;
            position: relative;
        }
        &__col {
            height: 100%;
            width: 100%;
            position: relative;
        }
        &__col-container {
            height: calc((var(--HOUR_BLOCK_HEIGHT) * 24));
            width: 100%;
            @include abs-top-left;
        }
        &__col-blocks {
            height: 100%;
            width: 76%;
            position: relative;
            z-index: 1;
        }
    }

    .day-view--no-color .routine-block {
        i {
            color: rgba(var(--textColor1), 1) !important;
        }
        .block-title-strike::after {
            background-color: rgba(var(--textColor1), 0.65) !important;
        }
        &__content {
            background-color: var(--sessionBlockColor) !important;
        }
        &__title {
            @include text-style(1);
        }
        &__time-period {
            @include text-style(0.35);
        }
        &__spine {
            background-color: rgba(var(--textColor1), 0.5);
        }
        &__checkbox {
            background-color: rgba(var(--textColor1), 0.05);

            &--checked, &:hover {
                background-color: rgba(var(--textColor1), 0.25); 
            }
        }
    }

    .routine-block {
        left: 62px;
        width: 120px;

        &::after, &::before {
            cursor: pointer !important;
        }
        &:active {
            transform: scale(0.998);
        }
        i {
            display: none;
            font-size: 0.9rem;
            color: rgba(var(--block-color-1), 1);
        }
        &--all-day {
            position: relative;
            height: 20px;
            left: 0;
            width: auto;
        }
        &--focused {
            z-index: calc(var(--EVENTS_COUNT) + 1) !important;
            transform: scale(1.04);
            box-shadow: 0px 0px 10px rgba(black, 0.1);

            &:active {
                transform: scale(1.03) !important;
            }
        }
        &--checkbox &__content {
            padding: 6px 5px 5px 8px;
        }
        &--checkbox &__checkbox {
            display: flex;
        }
        &--checked {
            opacity: 0.6;
        }
        &--checked i {
            display: block;
        }
        &--bordered &-content {
            border: 1.5px solid rgba(var(--textColor1), 0.05);
        }

        &__title {
            margin-top: -2px;
        }
        &__content {
            display: flex;
            align-items: flex-start;
        }
        &__checkbox {
            @include square(16px, 6px);
            @include center;
            margin: 0px 6px 0px 4px;
            background-color: rgba(var(--block-color-1), 0.1);
            display: none;
            
            &:hover {
                background-color: rgba(var(--block-color-1), 0.2);
            }
        }
    }


    .block-title-strike {
        opacity: 0.6;
        position: relative; 

        &::after {
            content: ' ';
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            height: 1.5px;
            background-color: rgba(var(--block-color-1), 0.65);
        }
        
        &--animated {
            &::after {
                animation: 0.22s strike ease-in-out forwards 1;
            }
        }
    }
    .wk-grid {
        @include abs-top-left;
        height: calc((var(--HOUR_BLOCK_HEIGHT) * 24));
        padding: 0px var(--DAY_VIEW_SIDE_MARGINS);
        z-index: 0;
        width: calc(100% - var(--DAY_VIEW_SIDE_MARGINS));
    }
    .now-line {
        z-index: calc(var(--EVENTS_COUNT));
        width: calc(100% + 5px);

    }
    .hour-blocks {
        height: calc((var(--HOUR_BLOCK_HEIGHT) * 24));
        
        span {
            margin-left: 3px;
        }
        &-container {
            padding: 0px var(--DAY_VIEW_SIDE_MARGINS);
            height: calc((var(--HOUR_BLOCK_HEIGHT) * 24));
        }
        &__block {
            left: -7px;
        }
    }
    .box-ontop {
        border: 1px solid var(--black1);
        box-shadow: none;
        z-index: 3;
    }

    .box-1 {
        z-index: 2
    }

    .box-2 {
        z-index: 4
    }

    .box-3 {
        z-index: 5
    }

    .box-4 {
        z-index: 6
    }

    .box-5 {
        z-index: 7
    }

    .box-6 {
        z-index: 8
    }

    .box-7 {
        z-index: 9
    }

    .box-8 {
        z-index: 10
    }

    .box-9 {
        z-index: 11
    }

    .box-10 {
        z-index: 12
    }

    .box-11 {
        z-index: 13
    }

    .box-12 {
        z-index: 14
    }

    .box-13 {
        z-index: 15
    }

    .box-14 {
        z-index: 16
    }

    .box-15 {
        z-index: 17
    }

    .box-16 {
        z-index: 18
    }

    .box-17 {
        z-index: 19
    }

    .box-18 {
        z-index: 20
    }

    .box-lastbox {
        z-index: 21;
    }
</style>