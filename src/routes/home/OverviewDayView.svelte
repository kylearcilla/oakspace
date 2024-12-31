<script lang="ts">
	import { onDestroy, onMount } from "svelte"
    
	import { themeState, weekRoutine } from "$lib/store"
	import { RoutinesManager } from "$lib/routines-manager"
	import { findClosestColorSwatch } from "$lib/utils-colors"
	import { GoogleCalendarManager } from "$lib/google-calendar-manager"
    import { getColorTrio, getMaskedGradientStyle } from "$lib/utils-general"
	import { getDayIdxMinutes, getTimeFromIdx, isSameDay, minsFromStartToHHMM } from "$lib/utils-date"
	import { getDayRoutineFromWeek, resetDayRoutine, toggleRoutineBlockComplete } from "$lib/utils-routines"
    
	import Modal from "../../components/Modal.svelte"
	import ActiveRoutine from "./ActiveRoutine.svelte"

    export let checkbox: boolean
    export let richColors: boolean
    export let dayOptn: "routine" | "calendar" | null
    export let googleCals: GoogleCalendar[]
    export let googleEvents: GoogleCalendarEvent[]
    export let day: Date

    const EVENT_BLOCK_LEFT_OFFSET = 50

    let headerHeight = 0
    let dayViewElem: HTMLElement
    let allDayRef: HTMLElement
    let maskListGradient = ""
    let minuteInterval: NodeJS.Timeout | null = null
    let focusEventId = ""
    let scrollContainerHeight = 0
    let scrollTop = 0

    let currTime = getDayIdxMinutes()
    let dayIdx = -1

    let dRoutine: RoutineBlock[] | DailyRoutine | null = null
    let routineBlocks: RoutineBlockElem[] = []
    let isRoutineOpen = false

    let routineBlockView: RoutineBlockElem & { idx: number } | null = null
    
    $: isLight = !$themeState.isDarkTheme
    $: routine = $weekRoutine
    $: isToday = isSameDay(new Date(), day)

    $: {
        // update routine when day changes
        const idx = day.getDay()

        if (dayIdx != idx) {
            resetDayRoutine()
        }
        dRoutine = getDayRoutineFromWeek(routine, idx)
        dayIdx = idx

        if (scrollContainerHeight != undefined) {
            updateRoutineBlocks()
        }
    }
    $: if (headerHeight >= 0 && allDayRef) {
        onDayHeaderScroll()
    }

    /* google calendar */
    function onDayHeaderScroll() {
        if (!$themeState.isDarkTheme) return

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

        return (eventCal!.isChecked) && (allowAllDay ? e.allDay : !e.allDay)
    }
    function onEventClick(e: Event, url: string) {
        const target  = e.target as HTMLElement
        const classes = target.classList.value

        if (
            !classes.includes("title") && 
            !classes.includes("time-period") && 
            target.tagName != "SPAN"
        ) {
            window.open(url, '_blank')
        }
    }

    /* routines */
    function onDayScroll(event: Event) {
        const target = event.target as HTMLElement
        scrollTop = target.scrollTop
    }
    function updateRoutineBlocks() {
        if (!dRoutine) return

        const blocks = "id" in dRoutine ? dRoutine.blocks : dRoutine

        routineBlocks = blocks.map((block) => {
            return RoutinesManager.createRoutineBlockElem(block, scrollContainerHeight)
        })
    }
    function onRoutineClick(e: Event, block: RoutineBlockElem & { idx: number }) {
        const target = e.target as HTMLElement
        const classes = target.classList.value
        const isCheckbox = classes.includes("routine-blocks__block-checkbox") || target.tagName === "I"

        if (isRoutineOpen || isCheckbox) {
            return
        }

        isRoutineOpen = true
        routineBlockView = {
            block,
            idx: block.idx
        }
    }
    onMount(() => {
        minuteInterval = setInterval(() => currTime = getDayIdxMinutes(), 1000)
    })
    onDestroy(() => clearInterval(minuteInterval!))
</script>

<div 
    class="day-view" 
    class:day-view--light={isLight}
    style:--EVENTS_COUNT={googleEvents.length}
    style:--HOUR_BLOCK_HEIGHT={`${GoogleCalendarManager.HOUR_BLOCK_HEIGHT}px`}
>
    <div 
        class="day-view__header"
        bind:clientHeight={headerHeight}
    >
        <span>All Day</span>
        <div 
            bind:this={allDayRef}
            on:scroll={onDayHeaderScroll}
            class="day-view__header-events no-scroll-bar"
            style={maskListGradient}
        >
            {#if dayOptn === "calendar"}
                {#each googleEvents.filter((e) => {
                    return doRenderEvent(e, { allowAllDay: true })
                }) as event}

                    {@const colorSwatch  = findClosestColorSwatch(event.color.bgColor)}
                    {@const colorTrio    = getColorTrio(colorSwatch, isLight)}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        role="button" 
                        tabindex="0" 
                        class="event-block event-block--all-day"
                        style:--event-color-primary={colorSwatch.primary}
                        style:--event-color-1={colorTrio[0]}
                        style:--event-color-2={colorTrio[1]}
                        style:--event-color-3={colorTrio[2]}
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
                        <div class="event-block__content">
                            <div class="event-block__title">
                                {event.title}
                            </div>
                            <div class="event-block__spine"></div>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    </div>
    <div 
        class="day-view__scroll-container no-scroll-bar"
        style:height={`calc(100% - ${headerHeight}px)`}
        on:scroll={onDayScroll}
    >
        <div 
            bind:this={dayViewElem}
            class="day-view__col"
        >
            <!-- Blocks -->
            <div 
                class="day-view__col-container" bind:clientHeight={scrollContainerHeight}
            >
                <div 
                    class="day-view__col-blocks routine-blocks"    
                    class:routine-blocks--light={isLight}
                    class:routine-blocks--no-rich-colors={!richColors}
                >
                    {#if dayOptn === "calendar"}
                        <!-- Events -->
                        {#each googleEvents as event}
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
                                class={`event-block ${overlapIdx >= 0 ? `box-${overlapIdx}` : ""}`}
                                class:event-block--light={isLight}
                                class:event-block--small={heightNum <= 40 && !isFocused}
                                class:event-block--focused={isFocused}
                                class:box-ontop={overlapIdx === 0}
                                class:hidden={!doRenderEvent(event, { allowAllDay: false })}
                                style:top={`calc(${event.top} + 1px)`}
                                style:left={`calc(${event.left} + ${EVENT_BLOCK_LEFT_OFFSET + 14}px)`}
                                style:width={`calc(${event.width} - 12px)`}
                                style:height={isFocused ? heightNum <= 40 ? "80px" : event.height : event.height}
                                style:--event-color-primary={colorSwatch.primary}
                                style:--event-color-1={colorTrio[0]}
                                style:--event-color-2={colorTrio[1]}
                                style:--event-color-3={colorTrio[2]}
                                on:focus={() => { 
                                    focusEventId = event.id
                                }}
                                on:blur={() => { 
                                    focusEventId = ""
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
                                <div class="event-block__content">
                                    <div class="event-block__title">
                                        {event.title}
                                    </div>
                                    <div class="event-block__time-period">
                                        <span>{startTimeStr}</span>
                                        <span>-</span>
                                        <span>{endTimeStr}</span>
                                    </div>
                                    <div class="event-block__spine"></div>
                                </div>
                            </div>
                        {/each}
                    {:else}
                        {#each routineBlocks as block, blockIdx (blockIdx)}
                            {@const colorTrio    = getColorTrio(block.color, isLight)}
                            {@const startTimeStr = minsFromStartToHHMM(block.startTime)}
                            {@const endTimeStr   = minsFromStartToHHMM(block.endTime)}
                            {@const done  = block.done}
                            <div 
                                role="button"
                                tabIndex={0}
                                class="routine-blocks__block"
                                class:routine-blocks__block--checkbox={checkbox}
                                class:routine-blocks__block--checked={done}
                                style:top={`${block.yOffset}px`}
                                style:--block-height={`${block.height}px`}
                                style:--block-color-1={colorTrio[0]}
                                style:--block-color-2={colorTrio[1]}
                                style:--block-color-3={colorTrio[2]}
                                title={`${block.title} \n${startTimeStr} - ${endTimeStr}`}
                                on:click={(e) => {
                                    onRoutineClick(e, {
                                        ...block, idx: blockIdx
                                    })
                                }}
                                on:keydown={(e) => {
                                    if (e.key === 'Enter' || e.code === 'Space') {
                                        e.preventDefault()
                                    }
                                }}
                            >
                                <div class="routine-blocks__block-content">
                                    {#if isToday}
                                        <button 
                                            on:click={() => toggleRoutineBlockComplete(blockIdx, currTime)}
                                            title="Toggle routine completion"
                                            class="routine-blocks__block-checkbox"
                                            class:routine-blocks__block-checkbox--checked={done}
                                        >
                                            <i class="fa-solid fa-check"></i> 
                                        </button>
                                    {/if}
                                    <div>
                                        <div class="flx flx--algn-center">
                                            <span 
                                                class="routine-blocks__block-title"
                                                class:block-title-strike={done}
                                            >
                                                {block.title}
                                            </span>
                                        </div>
                                        <div class="routine-blocks__block-time-period">
                                            <span>{startTimeStr}</span>
                                            <span>-</span>
                                            <span>{endTimeStr}</span>
                                        </div>
                                        <div class="routine-blocks__block-spine"></div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {/if}

                    <!-- Now Line -->
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
                            <div class="hour-blocks__block-vert-divider">
                                <svg xmlns="http://www.w3.org/2000/svg" width="2" height="27" viewBox="0 0 0 0" fill="none">
                                    <path d="M1.25684 0.614746V 28" stroke-width="1" stroke-dasharray="2 2"/>
                                </svg>
                            </div>
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

    {#if isRoutineOpen}
        <Modal 
            options={{ 
                borderRadius: "8px",
                scaleUp: true
            }} 
            onClickOutSide={() => isRoutineOpen = false}
    >
            <ActiveRoutine
                type="side-menu"
                isOpen={isRoutineOpen} 
                currDayIdx={day.getDay()}
                currBlock={routineBlockView }
            />
        </Modal>
    {/if}
</div>

<style lang="scss">
    @import "../../scss/day-box.scss";
    @import "../../scss/components/routines.scss";
    $header-left-offset: 16px;

    .day-view {
        width: 100%;
        height: calc(100% - 38px);

        &--light &__header {
            border-bottom: 1.5px solid rgba(var(--textColor1), 0.075);
            span {
                @include text-style(0.3, 600);
            }
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
            padding: 5.5px 0px 7px 0px;
            
            span {
                white-space: nowrap;
                margin-left: 1px;
                @include text-style(0.14, 500, 1.1rem);
            }
        }
        &__header-events {
            max-height: 80px;
            overflow-y: scroll;
            width: calc(100% - $header-left-offset) !important;
            margin-left: $header-left-offset !important;
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

    .routine-blocks {
        &--light#{&}--no-rich-colors &__block-time-period {
            @include text-style(0.4);
        }
        &--no-rich-colors &__block {
            i {
                color: rgba(var(--textColor1), 1) !important;
            }
            .block-title-strike::after {
                background-color: rgba(var(--textColor1), 0.65) !important;
            }
            &-content {
                // border: 1.5px solid rgba(var(--textColor1), 0.025);
                background-color: var(--sessionBlockColor) !important;
                padding-left: 9px;
                border-radius: 9px;
            }
            &-title {
                @include text-style(1);
            }
            &-time-period {
                @include text-style(0.3);
            }
            &-spine {
                display: none;
            }
            &-checkbox {
                background-color: rgba(var(--textColor1), 0.05);

                &--checked, 
                &:hover {
                    background-color: rgba(var(--textColor1), 0.25); 
                }
            }
        }

        &__block {
            left: 70px;
            width: 135px;

            &::after, &::before {
                cursor: pointer !important;
            }
            &:active {
                transform: scale(1);
            }
        }
        &__block i {
            display: none;
            font-size: 0.9rem;
            color: rgba(var(--block-color-1), 1);
        }
        &__block-title {
            margin-top: -2px;
        }
        &__block--checkbox &__block-content {
            padding: 6px 5px 5px 8px;
        }
        &__block--checkbox &__block-checkbox {
            display: flex;
        }
        &__block--checked {
            opacity: 0.6;
        }
        &__block--checked i {
            display: block;
        }
        &__block-content {
            display: flex;
            align-items: flex-start;
            padding-top: 5px;
        }
        &__block-checkbox {
            @include square(16px, 6px);
            @include center;
            margin-right: 5px;
            background-color: rgba(var(--block-color-1), 0.05);
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


    .event-block {
        position: absolute;
        transition: transform 0.1s cubic-bezier(.4,0,.2,1);
        cursor: pointer;
        border-top: 1px solid var(--rightBarBgColor);

        &--light &__title {
            font-weight: 600 !important;
        }
        &:active {
            transform: scale(0.99);
        }
        &:focus-visible {
            transform: scale(1.01);
        }
        &:focus-visible &-content {
            @include border-focus;
        }
        
        &--all-day {
            position: relative;
            height: 20px;
        }
        &--all-day &__content {
            padding-top: 1.5px;
        }
        &--focused {
            z-index: calc(var(--EVENTS_COUNT) + 1) !important;
            transform: scale(1.04);

            &:active {
                transform: scale(1.03) !important;
            }
        }
        &--session &__content {
            background-color: var(--bg-3) !important;
            border: 1px solid rgba(var(--textColor1), 0.03);
        }
        &--session &__title {
            @include text-style(1);
        }
        &--session &__time-period {
            @include text-style(0.3);
        }
        &--small &__content {
            @include flex(center)
        }
        &--small &__title {
            margin-right: 10px;
            min-width: 60px !important;
            @include elipses-overflow;
        }
        &--header {
            position: relative;
            height: 20px;
        }
        &--header &__content {
            padding-top: 1px;
            font-size: 1.1rem;
        }
        &__content {
            background-color: rgba(var(--event-color-2), 1);
            padding: 5px 8px 5px 11px;
            overflow: hidden;
            white-space: nowrap;
            position: relative;
            height: 100%;
            border-left: none;
            border-radius: 6px;
        }
        &__title {
            @include text-style(_,  500, 1.05rem);
            cursor: text;
            margin-bottom: 3px;
            width: min-content;
            color: rgb(var(--event-color-1));
        }
        &__time-period {
            @include text-style(_, 500, 1rem, "DM Sans");
            color: rgba(var(--event-color-3), 1);
            width: min-content;
            
            span {
                cursor: text;
                display: inline-block;
                width: min-content;
            }
        }
        &__spine {
            @include abs-top-left(0px, 0px);
            height: calc(100%);
            width: 4px;
            background-color: rgba(var(--event-color-1), 0.9);
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