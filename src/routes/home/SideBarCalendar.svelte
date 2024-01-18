<script lang="ts">
	import { ProductivityCalendar } from "$lib/productivity-calendar";
	import { onMount } from "svelte";
	import Calendar from "../../components/Calendar.svelte";
	import { formatTimeToHHMM, getDifferenceInSecs, getTotalSecondsFromStartOfDay, isSameDay } from "$lib/utils-date";
	import { clickOutside, getElemById, getScrollStatus } from "$lib/utils-general";

    let calendar: ProductivityCalendar | null = null
    let dayViewElem: HTMLElement | null = null
    let maskListGradient = ""

    type DayViewSession = {
        title: string,
        tag: {
            title: string,
            symbol: string,
            color: string
        },
        startTime: Date,
        endTime: Date,
        todosDone: number,
        todos: number
    }
    type DayViewSessionElem = {
        details: DayViewSession
        height: number
        yOffset: number
        startTimeStr: string
        endTimeStr: string
    }

    let finishedSessions: DayViewSession[] = [
        {
            title: "Read a Book",
            tag: {
                title: "Reading",
                symbol: "📖",
                color: "#A3C2FF"
            },
            startTime: new Date(2024, 0, 17, 6, 30),
            endTime: new Date(2024, 0, 17, 7, 30),
            todosDone: 6,
            todos: 6
        },
        {
            title: "Read a Book",
            tag: {
                title: "SWE",
                symbol: "👨‍💻",
                color: "#FFC4A3"
            },
            startTime: new Date(2024, 0, 17, 11, 30),
            endTime: new Date(2024, 0, 17, 15, 30),
            todosDone: 15,
            todos: 15
        },
        // {
        //     title: "Read a Book",
        //     tag: {
        //         title: "SWE",
        //         symbol: "👨‍💻",
        //         color: "#FFC4A3"
        //     },
        //     startTime: new Date(2024, 0, 17, 16, 0),
        //     endTime: new Date(2024, 0, 17, 16, 10),
        //     todosDone: 15,
        //     todos: 15
        // },
        {
            title: "French",
            tag: {
                title: "French",
                symbol: "🇫🇷",
                color: "#FFA3C4"
            },
            startTime: new Date(2024, 0, 17, 16, 20),
            endTime: new Date(2024, 0, 17, 17, 0),
            todosDone: 15,
            todos: 15
        },
        // {
        //     title: "Meditation",
        //     tag: {
        //         title: "Mind",
        //         symbol: "🧘🏼‍♂️",
        //         color: "#C3F493"
        //     },
        //     startTime: new Date(2024, 0, 17, 17, 0),
        //     endTime: new Date(2024, 0, 17, 17, 30),
        //     todosDone: 0,
        //     todos: 0
        // },
        {
            title: "Push Workout",
            tag: {
                title: "Exercise",
                symbol: "💪",
                color: "#FFE0A3"
            },
            startTime: new Date(2024, 0, 17, 17, 30),
            endTime: new Date(2024, 0, 17, 20, 30),
            todosDone: 0,
            todos: 0
        },
    ]
    let finishedSessionElems: DayViewSessionElem[] | null = null

    $: {
        calendar?._store.subscribe((newCalendar: ProductivityCalendar) => calendar = newCalendar) 
    }

    function getSessionClasses(sessionElem: DayViewSessionElem) {
        const classes: string[] = []

        if (sessionElem.height < 12) {
            classes.push("overview__session--xsm")
        }
        if (sessionElem.height < 20) {
            classes.push("overview__session--sm")
        }
        if (sessionElem.height < 34) {
            classes.push("overview__session--md")
        }

        return classes.join(" ")
    }
    function onSessionClicked(sessionElem: DayViewSessionElem, idx: number) {
        if (sessionElem.height >= 34) return

        const _sessionElem = getElemById(`session-id--${idx}`)!
        _sessionElem.classList.add("overview__session--magnify")
        _sessionElem.classList.remove(`overview__session--${sessionElem.height < 12 ? "xsm" : sessionElem.height < 20 ? "sm" : "md"}`)
    }
    function onSesssionClickAway(sessionElem: DayViewSessionElem, idx: number) {
        if (sessionElem.height >= 34) return

        const _sessionElem = getElemById(`session-id--${idx}`)!
        _sessionElem.classList.remove("overview__session--magnify")
        _sessionElem.classList.add(`overview__session--${sessionElem.height < 12 ? "xsm" : sessionElem.height < 20 ? "sm" : "md"}`)
    }

    function onDateCellPressed(day: any) {
        const productivityDay = day as ProductivityDay
        if (!productivityDay.hadSession) return

        const newDay = isSameDay(calendar!.pickedDate, day.date) ? null : day.date
        calendar!.setNewPickedDate(newDay)
    }
    function createDaySessionElems() {
        finishedSessions.forEach((session: DayViewSession) => {
            const elapsedTimeMins = getDifferenceInSecs(session.startTime, session.endTime) / 60
            const heightPerc = elapsedTimeMins / 1440
            const yOffsetPerc = (getTotalSecondsFromStartOfDay(session.startTime) / 60) / 1440
            const dayContainerHt = dayViewElem!.scrollHeight + 7

            finishedSessionElems!.push({
                details: session,
                height: heightPerc * dayContainerHt,
                yOffset: (yOffsetPerc * dayContainerHt) + 6,
                startTimeStr: formatTimeToHHMM(session.startTime),
                endTimeStr: formatTimeToHHMM(session.endTime),
            })
        })
    }
    function getTime(timeIdx: number) {
        const suffix = timeIdx < 12 ? "AM" : "PM";
        const formattedHour = timeIdx % 12 === 0 ? 12 : timeIdx % 12;

        return `${formattedHour} ${suffix}`;
    }
    function dayViewScrollHandler(event: Event) {
        const target = event.target as HTMLElement
        const [hasReachedEnd, hasReachedTop] = getScrollStatus(target!)

        if (!hasReachedEnd && !hasReachedTop) {
            maskListGradient = "linear-gradient(180deg, transparent 0%, black 10%, black 80%, transparent 100%)"
        }
        else if (!hasReachedTop) {
            maskListGradient = "linear-gradient(180deg, transparent 0%, black 10%)"
        }
        else if (!hasReachedEnd) {
            maskListGradient = "linear-gradient(180deg, black 85%, transparent 100%)"
        }
    }

    onMount(() => {
        calendar = new ProductivityCalendar(null)
        maskListGradient = "linear-gradient(180deg, black 85%, transparent 100%)"

        finishedSessionElems = []
        createDaySessionElems()
    })
</script>

<div class="overview">
    <!-- Calendar -->
    <div class="overview__calendar-container">
        {#if calendar}
            <Calendar calendar={calendar} onDateCellPressed={onDateCellPressed} />
        {/if}
    </div>
    <!-- Day View -->
    <div class="overview__day-view">
        <div class="overview__day-view-day-details">
            <span>Jan 10</span>
            <span>10 Sessions</span>
        </div>
        <div 
            class="overview__session-list-container"
            style={`-webkit-mask-image: ${maskListGradient}; mask-image: ${maskListGradient};`}
            bind:this={dayViewElem}
            on:scroll={dayViewScrollHandler}
        >
            {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                <div class="overview__hour-block">
                    <div class="flx flx--algn-center">
                        <span>{getTime(timeIdx)}</span>
                        <div class="overview__hour-block-hoz-divider">
                            <svg xmlns="http://www.w3.org/2000/svg" width="148" height="2" viewBox="0 0 148 2" fill="none">
                                <path d="M0.122925 0.850098H195.602" stroke-width="0.7" stroke-dasharray="3 3"/>
                            </svg>
                        </div>
                        <div class="overview__hour-block-vert-divider">
                            <svg xmlns="http://www.w3.org/2000/svg" width="2" height="28" viewBox="0 0 2 28" fill="none">
                                <path d="M1.25684 0.614746V32.5658" stroke-width="0.9" stroke-dasharray="2 2"/>
                            </svg>
                        </div>
                    </div>
                </div>
            {/each}
            <ul class="overview__session-list">
                {#if finishedSessionElems}
                    {#each finishedSessionElems as session, idx}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div 
                            class={`overview__session ${getSessionClasses(session)}`}
                            style={`height: ${session.height}px; top: ${session.yOffset}px;`}
                            title={`${session.details.title} \n${session.startTimeStr} - ${session.endTimeStr}`}
                            id={`session-id--${idx}`}
                            on:click={() => onSessionClicked(session, idx)}
                            use:clickOutside on:click_outside={() => onSesssionClickAway(session, idx)}
                        >
                            <div class="overview__session-content">
                                <div class="flx flx--algn-center">
                                    <div 
                                        class="overview__session-tag" 
                                        title={session.details.tag.title}
                                        style={`background-color: ${session.details.tag.color}`}
                                    >
                                        {session.details.tag.symbol}
                                    </div>
                                    <span class="overview__session-title">
                                        {session.details.title}
                                    </span>
                                </div>
                                <div class="overview__session-time-period">
                                    <span>{session.startTimeStr}</span>
                                    <span>-</span>
                                    <span>{session.endTimeStr}</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}
            </ul>
        </div>
    </div>
</div>


<style lang="scss">
    .overview {
        height: 100%;
        &__calendar-container {
            margin: 11px 0px 5px 0px;
            padding: 0px 2px;
        }
        &__day-view {
            width: 100%;
            padding: 0px 11px 0px 10px;
            height: calc(100% - 294px);
        }
        &__day-view-day-details {
            @include flex-container(center, space-between);
            margin-bottom: 2px;
            height: 14px;

            span {
                @include text-style(0.5, 300, 1.05rem, "DM Sans");

                &:last-child {
                    opacity: 0.4;
                }
            }
        }
        &__session-list-container {
            width: 100%;
            position: relative;
            overflow-y: scroll;
            height: calc(100% - 14px);
            padding-top: 14px;

            &::-webkit-scrollbar {
                display: none;
            }
        }
        &__hour-block {
            position: relative;
            height: 50px;

            span {
                @include text-style(0.3, 300, 0.94rem, "DM Sans");
                margin-right: 0px;
                width: 40px;
                white-space: nowrap;
            }
        }
        &__hour-block-hoz-divider {
            @include flex-container(center);
            path {
                stroke: rgba(var(--textColor1), 0.07);
            }
        }
        &__hour-block-vert-divider {
            @include pos-abs-top-left-corner(16px, 10px);
            path {
                stroke: rgba(var(--textColor1), 0.17);
            }
        }
        &__session {
            position: absolute;
            background-color: red;
            left: 50px;
            width: 70%;
            background-color: var(--dropdownMenuBgColor2);
            border-radius: 9px;
            overflow: hidden;
            transition: 0.12s ease-in-out;
            cursor: pointer;
            border: 0.5px solid #1a1a1a;

            &:hover {
                // filter: brightness(1.08);
            }

            // xsm element magnified
            &--magnify {
                transition: 0.2s cubic-bezier(.1,.84,.27,1.02);
                transform: scale(1.1);
                z-index: 1000;
                height: 100px !important;
                border-radius: 10px !important;
                box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.17);
            }
            &--magnify &-tag {
                transform: scale(1) !important;
                height: 10px !important;
                width: 10px !important;
            }
            &--magnify &-content {
                top: 4px !important;
                display: block !important;
            }
            &--magnify &-title {
                font-size: 1rem !important;
            }
            &--magnify &-time-period {
                margin-left: 17px !important;
            }

            // adjustments based on height
            &--xsm:active, &--sm:active, &--md:active {
                transform: scale(0.97);
            }
            &--md &-content {
                @include flex-container(center);
            }
            &--md &-time-period {
                margin-left: 9.5px;
            }
            &--sm &-content {
                top: 0px;
            }
            &--xsm &-tag {
                transform: scale(0.8);
            }
            &--xsm &-content {
                top: -2px !important;
            }
            &--xsm &-content * {
                cursor: pointer;
            }
            &--sm {
                border-radius: 3px;
            }
            &--sm &-title {
                font-size: 0.9rem;
            }
            &--sm &-tag {
                @include circle(9px);
                font-size: 0.62rem;
            }
            &--sm &-time-period span {
                font-size: 0.89rem;
            }

            &-content {
                @include pos-abs-top-left-corner(5px, 7px);
            }
            &-title {
                @include text-style(0.8, 400, 1.09rem, "DM Sans");
                @include elipses-overflow;
                max-width: 100px;
                cursor: text;
            }
            &-tag {
                @include center;
                @include circle(12px);
                font-size: 0.62rem;
                margin-right: 6px;
            }
            &-time-period {
                margin: 1px 0px 0px 17px;
                white-space: nowrap;
            }
            &-time-period span {
                cursor: text;
                @include text-style(0.3, 300, 1rem, "DM Sans");

                &:nth-last-child(2) {
                    margin: 0px 3px;
                }
            }
        }
    }
</style>