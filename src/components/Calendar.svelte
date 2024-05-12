<script lang="ts">
    import SVGIcon from "./SVGIcon.svelte"

	import { onMount } from "svelte"
	import { themeState } from "$lib/store"
	import type { Calendar } from "$lib/calendar"
	import { DateBoundState, Icon } from "$lib/enums"
	import { isSameDay, months } from "$lib/utils-date"
	import { ProductivityCalendar } from "$lib/productivity-calendar"

    enum CalendarType {
        Basic, Productivity
    }

    export let calendar: Calendar
    export let onDateCellPressed: any

    let type: CalendarType | null = null

    function initDayClasses(day: any) {
        if (type === CalendarType.Basic) return
        
        const classes = []
        const prodDay = day as ProductivityDay

        if (prodDay.hadGoal) {
            classes.push("calendar__month-day--had-goal")
        }
        if (prodDay.hadSession) {
            classes.push("calendar__month-day--had-session")
        }

        return classes.join(" ")
    }
    function initDayTitle(day: any) {
        if (type === CalendarType.Basic) return

        const prodDay = day as ProductivityDay

        if (prodDay.hadGoal && prodDay.hadSession) {
            return "Accomplished a goal and completed a session."
        }
        if (prodDay.hadGoal) {
            return "Accomplished a goal."
        }
        if (prodDay.hadSession) {
            return "Completed a Session."
        }
    }

    onMount(() => {
        if (calendar instanceof ProductivityCalendar) {
            type = CalendarType.Productivity
        }
        else {
            type = CalendarType.Basic
        }
    })
</script>

{#if type != null}
<div class={`calendar ${$themeState.isDarkTheme ? "" : "calendar--light"} calendar--${CalendarType[type].toLowerCase()}`}>
    <div class="calendar__focus">
        <div class="calendar__focus-header">
            <div class="calendar__month-title">
                <strong>
                    {months[calendar.currMonth.monthIdx].substring(0, 3)}
                </strong> 
                {calendar.currMonth.year}
            </div>
            <div class="calendar__btns-container">
                <button 
                    class="calendar__next-prev-btn"
                    on:click={() => calendar.getPrevMonthCalendar()}
                    disabled={!calendar.isPrevMonthAvailable}
                >
                    <SVGIcon icon={Icon.ChevronLeft}/>
                </button>
                <button
                    title="Go to current month."
                    class="calendar__today-btn"
                    on:click={() => calendar.getThisMonth()}
                >
                    •
                </button>
                <button 
                    class="calendar__next-prev-btn"
                    on:click={() => calendar.getNextMonthCalendar()}
                    disabled={!calendar.isNextMonthAvailable}
                >
                <SVGIcon icon={Icon.ChevronRight}/>
            </button>
            </div>
        </div>
        <div class="calendar__days-of-week">
            <div>S</div>
            <div>M</div>
            <div>T</div>
            <div>W</div>
            <div>T</div>
            <div>F</div>
            <div>S</div>
        </div>
    </div>
    <!-- Month Calendar -->
    <div class="calendar__month">
        <ul>
            {#each calendar.currMonth.days as day}
                <li class={`calendar__month-day-container ${day ? "" : "calendar__month-day-container--empty"}`}>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        role="button" tabindex="0" title={initDayTitle(day)}
                        class={`calendar__month-day 
                                    ${day.isInCurrMonth ? "" : "calendar__month-day--not-curr-month"}
                                    ${calendar.getDateBoundState(day.date) === DateBoundState.InBounds ? "" : "calendar__month-day--disabled"}
                                    ${isSameDay(day.date, new Date) ? "calendar__month-day--today" : ""}
                                    ${isSameDay(day.date, calendar.pickedDate) ? "calendar__month-day--picked" : ""}
                                    ${initDayClasses(day)}
                        `}
                        on:click={() => onDateCellPressed(day)}
                    >
                        {`${day.date.getDate()}`}
                    </div>
                </li>
            {/each}
        </ul>
    </div>
</div>
{/if}

<style lang="scss">
    .calendar {
        // light / dark themes adjustments
        &--light &__today-btn {
            @include text-style(0.5, 600);
        }
        &--light &__next-prev-btn {
            opacity: 0.4;

            &:disabled {
                opacity: 0.16;
            }
            &:disabled:hover {
                opacity: 0.16;
            }
            &:hover {
                opacity: 0.5;
            }
        }
        &--light &__month-title {
            @include text-style(0.28, 500);
            strong {
                @include text-style(0.9, 500);
            }
        }
        &--light &__month-day--had-goal::after {
            color: rgba(var(--textColor1), 0.3) !important;
        }
        &--light &__days-of-week *, &--light#{&}--productivity &__days-of-week * {
            @include text-style(0.5, 500);
        }
        &--light &__month-day {
            @include text-style(0.85, 500);

            &:hover {
                background: rgba(var(--textColor1), 0.1);
            }
            &--today {
                @include text-style(0.89);
                background: rgba(var(--textColor1), 0.1);
            }
            &--picked {
                background: rgba(var(--fgColor2), 1) !important;
                color: rgba(var(--textColor2), 1) !important;
                border-color: transparent;
            }
            &--not-curr-month {
                opacity: 0.35;
            }
            &--disabled {
                opacity: 0.9;
            }
        }
        &--light#{&}--productivity &__today-btn {
            opacity: 0.4;
            &:hover {
                opacity: 0.8;
            }
        }
        &--light#{&}--productivity &__next-prev-btn {
            opacity: 0.26;
            
            &:hover {
                opacity: 0.5;
            }
            &:disabled {
                opacity: 0.1;
            }
        }
        &--light#{&}--productivity &__month-day {
            @include text-style(0.5);
            font-weight: 600 !important;

            &:hover {
                background: rgba(var(--textColor1), 0.04);
            }
            &--today {
                @include text-style(0.89);
                background: rgba(var(--fgColor1), 1);
                color: rgba(var(--textColor2), 1) !important;
            }
            &--picked {
                background: rgba(var(--fgColor2), 1) !important;
                color: rgba(var(--textColor2), 1) !important;
                border-color: transparent;
            }
            &--had-session:active {
                transition: 0.1s ease-in-out;
                transform: scale(0.93);
            }
            &--had-session {
                cursor: pointer;
                @include text-style(0.9, 500);
            }
            &--not-curr-month {
                opacity: 0.4 !important;
            }
        }

        /* Calendar Type Specific Styling */
        &--basic &__month-day-container {
            aspect-ratio: 1 / 1;
        }
        &--productivity &__days-of-week {
            padding-bottom: 4px; 
            * {
                @include text-style(0.5, 300, 0.97rem);
            }
        }
        &--productivity &__month-day {
            @include text-style(0.28, 300, 1rem, "DM Sans");
            width: 80%; 
            height: 100%;
            background: none;
            border-radius: 10px;
            border: 0.5px solid transparent;
            cursor: default;
            
            &:hover {
                background: rgba(var(--textColor1), 0.04);
            }
            &:active {
                transform: scale(1);
            }
            &--picked {
                background-color: rgba(var(--textColor1), 0.03) !important;
                color: rgba(var(--textColor1), 0.7) !important;
                border: 0.5px solid rgba(var(--textColor1), 0.04) ;
            }
            &--had-session:active {
                transition: 0.1s ease-in-out;
                transform: scale(0.93);
            }
            &--had-session {
                cursor: pointer;
                @include text-style(0.6, 500);
            }
            &-container {
                height: 28px;
            }
        }
        &--productivity &__month-day--had-goal::after {
            content: "*";
            @include text-style(0.23, 300, 1.2rem,"Manrope");
            @include abs-bottom-left(-6.5px, 50%);
            transform: translateX(-50%);
        }
        
        &__focus-header {
            @include flex(center, space-between);
            padding: 4px 4px 0px 8px;
        }
        &__btns-container {
            @include flex(center);
        }
        &__today-btn {
            @include text-style(0.2, 300, 1.29rem);
            @include center;
            transition: 0.1s ease-in-out;
            width: 12px;
            height: 12px;
            padding: 0px 5px;
            
            &:hover {
                @include text-style(0.6);
            }
            &:active {
                transform: scale(0.8);
            }
        }
        &__next-prev-btn {
            @include center;
            opacity: 0.2;
            padding: 5px;
            transition: 0.1s ease-in-out;

            &:disabled {
                opacity: 0.05;
            }
            &:disabled:hover {
                opacity: 0.05;
            }
            &:hover {
                opacity: 0.6;
            }
            &:active {
                transform: scale(0.9);
            }
        }
        &__month-title {
            font-family: "DM Sans";
            @include text-style(0.4, 200, 1.27rem);

            strong {
                @include text-style(1, 300, 1.27rem);
                margin-right: 3px;
            }
        }
        &__days-of-week {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            font-family: "DM Sans";
            padding: 15px 1px 6px 1px;
            width: 100%;

            * {
                @include text-style(1, 300, 1.1rem);
                @include center;
            }
        }
        &__month {
            height: 175px;
            width: 100%;
            padding: 0px 1px 25px 1px;
            margin-bottom: 5px;

            ul {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                grid-gap: 0px;
                row-gap: 0px;
                width: 100%;
                margin-top: 7px;
            }

            &--focus ul {
                margin-top: 1px;
            }
            &--focus .calendar__month-title {
                display: none;
            }
        }
        &__month-day {
            font-family: "DM Mono";
            @include center;
            @include text-style(0.7, 300, 1rem);
            @include circle(90%);
            user-select: none;
            position: relative;
            background: rgba(var(--textColor1), 0.02);
            cursor: pointer;

            &:hover {
                @include text-style(0.89);
                background: rgba(var(--textColor1), 0.08);
            }
            &:active {
                transition: 0.1s ease-in-out;
                transform: scale(0.98);
            }

            &-container {
                @include center;

                &--empty {
                    height: 0px;
                    width: 0px;
                }
            }
        
            &--today {
                @include text-style(0.89);
                background: rgba(var(--textColor1), 0.08);
            }
            &--picked {
                background-color: white !important;
                color: #111010 !important;
                font-weight: 500 !important;
            }
            &--not-curr-month {
                opacity: 0.25 !important;
            }
            &--disabled {
                opacity: 0.52;
            }
        }
    }
</style>
