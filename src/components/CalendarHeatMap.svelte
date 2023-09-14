<script lang="ts">
	import { months } from "$lib/utils-date"
	import { onMount } from "svelte"
    import { fly } from 'svelte/transition'
    import { quintOut } from 'svelte/easing'

    type MonthGridData = {
        monthIdx: number,
        days: ({ date: Date, hrs: number } | null)[]
    }

    export let tag: Tag
    let prevMonth = new Date()
    let gridData: MonthGridData[] = []
    let calendar: HTMLElement
    let isScrollableTop = true
    let isScrollableBottom = true


    const isSameMonth = (d1: Date, d2: Date) => {
        return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
    }
    const addDaysToDate = (d: Date, n: number): Date => new Date(d.setDate(d.getDate() + n))

    const makeMonthCalendar = (d: Date = new Date()) => {
        const firstDayOfMonth = new Date(d.setDate(1))
        const monthFirstDayOfWeek = firstDayOfMonth.getDay()
        const monthGrid: MonthGridData = {
            monthIdx: d.getMonth(),
            days: Array(42).fill(null)
        }

        let day = 0
        let doKeepGoing = true
        let hasFirstDayFound = false

        for (let w = 0; w < 6 && doKeepGoing; w++) {
            for (let d = 0; d < 7; d++) {
                if (!hasFirstDayFound) {
                    hasFirstDayFound = d === monthFirstDayOfWeek ? true : false
                }
                if (hasFirstDayFound) {
                    let currDay = addDaysToDate(new Date(firstDayOfMonth), day++)
                    let isDaysSameMonth = isSameMonth(currDay, firstDayOfMonth)

                    if (!isDaysSameMonth) {
                        doKeepGoing = false
                        break
                    }

                    let cellsPassed = (w * 7) + (d + 1)
                    monthGrid.days[cellsPassed - 1] = { date: currDay, hrs: Math.random() * 2}
                }
            }
        }
        gridData.unshift(monthGrid)
        gridData = gridData
    }
    const getHeatVal = (hrs: number) => {
        let str = "calendar-heat-map__month-grid-day-color"
        if (0 < hrs && hrs <= 0.5) {
            return str += "--low"
        }
        else if (0.5 < hrs && hrs <= 1) {
            return str += "--regular"
        }
        else if (1 < hrs && hrs <= 1.5) {
            return str += "--med"
        }
        else {
            return str += "--full"
        }
    }
    const makeMonthGrid = () => {
        prevMonth = new Date(prevMonth.setDate(0))
        makeMonthCalendar(prevMonth) 
    }
    const handleScroll = () => {
        const calendarElem = calendar

        const yScrollOffset = calendarElem!.scrollTop;
        const totalScrollableHeight = calendarElem!.scrollHeight;
        const windowHeight = calendarElem!.clientHeight; // container width

        isScrollableTop = yScrollOffset > 0;
        isScrollableBottom = yScrollOffset + windowHeight < totalScrollableHeight - 20
    }

    onMount(() => {
        // this month
        makeMonthCalendar() 

        // last month
        prevMonth = new Date(prevMonth.setDate(0))
        makeMonthCalendar(prevMonth) 

        // last month
        prevMonth = new Date(prevMonth.setDate(0))
        makeMonthCalendar(prevMonth) 

        requestAnimationFrame(() => { calendar!.scrollTop = 400 })
    })
</script>

<div class="calendar-heat-map">
    <div class="calendar-heat-map__days">
        <div class="calendar-heat-map__day">S</div>
        <div class="calendar-heat-map__day">M</div>
        <div class="calendar-heat-map__day">T</div>
        <div class="calendar-heat-map__day">W</div>
        <div class="calendar-heat-map__day">T</div>
        <div class="calendar-heat-map__day">F</div>
        <div class="calendar-heat-map__day">S</div>
    </div>
    <ul class="calendar-heat-map__month-list" bind:this={calendar} on:wheel={handleScroll}>
        <div class="calendar-heat-map__top-padding">
        </div>
        {#if isScrollableTop} 
            <div class="gradient-container gradient-container--horizontal gradient-container--top">
            </div>
        {/if}
        {#each gridData as month}
            <li class="calendar-heat-map__month-grid-container">
                <h3>{months[month.monthIdx]}</h3>
                <ul class="calendar-heat-map__month-grid">
                    {#each month.days as day, idx}
                        <li 
                            class={`calendar-heat-map__month-grid-day ${day === null ? "calendar-heat-map__month-grid-day--empty" : ""}`}
                            in:fly={{ x: 0, y: 20, opacity: 0, duration: 600, delay: 20 * idx, easing: quintOut }}
                        >
                            <div 
                                class={`calendar-heat-map__month-grid-day-color ${getHeatVal(day?.hrs)}`}
                                style={`background-color: ${tag.color}`}
                            >
                            </div>
                            <span>
                                {`${day === null ? "" : day?.date.getDate()}`}
                            </span>
                        </li>
                    {/each}
                </ul>
            </li>
        {/each}
        {#if isScrollableBottom} 
            <div class="gradient-container gradient-container--horizontal gradient-container--bottom">
            </div>
        {/if}
    </ul>
</div>
    
<style lang="scss">
    .gradient-container {
        z-index: 1;
        &--top {
            top: 20px;
            background: linear-gradient(180deg, var(--hoverColor) 15%, transparent);
            height: 60px;
        }
        &--bottom {
            background: linear-gradient(0deg, var(--hoverColor) 20%, transparent);
            height: 30px;
            bottom: 4px;
        }
    }

    .calendar-heat-map {
        position: relative;
        height: 100%;
        overflow: hidden;
        &__top-padding {
            height: 15px;
            width: 100%;
        }
        &__days {
            @include flex-container(center, space-between);
        }
        &__day {
            margin-top: 9px;
            font-weight: 200;
            width: 28px;
            @include center;
        }
        &__month-list {
            overflow-y: scroll;
            height: 89%;

            h3 {
                margin: 0px 0px 4px 0px;
                font-size: 1rem;
                font-weight: 200;
                color: rgba(var(--textColor1), 0.6);
            }
        }
        &__month-grid-container {
            margin-bottom: 15px;

            &:first-child {
            }
            &:last-child {
                margin-bottom: 24px;
            }
        }
        &__month-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-gap: 3.2px;
            row-gap: 3.2px;
            width: 100%;
        }
        &__month-grid-day {
            width: 27px;
            aspect-ratio: 1 / 1;
            color: white;
            font-size: 0.85rem;
            font-weight: 600;
            border-radius: 13.5px;
            background-color: #171619;
            position: relative;

            &--empty {
                background: none;
                height: 0px;
            }

            span {
                @include abs-center;
            }
        }
        &__month-grid-day-color {
            @include pos-abs-top-left-corner(0px, 0px);
            width: 100%;
            height: 100%;
            border-radius: 13.5px;
            @include center;

            &--low {
                opacity: 0;
            }
            &--regular {
                opacity: 0.09;
            }
            &--med {
                opacity: 0.5;
            }
            &--full {
                opacity: 0.95;
            }
        }
    }
</style>