<script lang="ts">
    import SVGIcon from "./SVGIcon.svelte"

	import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { SideCalendar } from "$lib/side-calendar"
	import { isSameDay, months } from "$lib/utils-date"

    export let isDisabled = false
    export let calendar: SideCalendar
    export let context: "date-picker" | "side-menu"
    export let focusDate: Date | null = new Date()
    export let onDayUpdate: (date: Date) => void

    let currMonth = calendar.currMonth
    let nextMoAvailable = calendar.nextMoAvailable
    let prevMoAvailable = calendar.prevMoAvailable

    $: {
        calendar.setNewPickedDate(focusDate)
        currMonth = calendar.currMonth
    }

    function _onDayUpdate(day: Date) {
        if (!isDisabled) {
            const _day = new Date(day)
            _day.setHours(0, 0, 0, 0)
            onDayUpdate(_day)
        }
    }
    function onNowClicked() {
        currMonth = calendar.getThisMonth()

        if (context === "side-menu") {
            focusDate = new Date()
            onDayUpdate(focusDate)
        }

        nextMoAvailable = true
        prevMoAvailable = true
    }
    function updateMonth(direction: "prev" | "next") {
        if (direction === "prev") {
            currMonth = calendar.getPrevMonthCalendar()
        }
        else {
            currMonth = calendar.getNextMonthCalendar()
        }
        nextMoAvailable = calendar.nextMoAvailable
        prevMoAvailable = calendar.prevMoAvailable 
    }
</script>

<div 
    class="calendar"
    class:calendar--date-picker={context === "date-picker"}
    class:calendar--light={!$themeState.isDarkTheme}
>
    <div class="calendar__focus">
        <div class="calendar__focus-header">
            <div class="calendar__month-title">
                <strong>
                    {months[currMonth.monthIdx]}
                </strong> 
                {currMonth.year}
            </div>
            <div class="calendar__btns-container">
                <button 
                    class="calendar__next-prev-btn"
                    disabled={!prevMoAvailable}
                    on:click={() => updateMonth("prev")}
                >
                    <SVGIcon 
                        icon={Icon.ChevronLeft}
                        options={{ scale: 1.4 }}
                    />
                </button>
                <button
                    disabled={isDisabled}
                    title="Go to current month."
                    class="calendar__today-btn"
                    on:click={() =>  onNowClicked()}
                >
                    •
                </button>
                <button 
                    class="calendar__next-prev-btn"
                    disabled={!nextMoAvailable}
                    on:click={() => updateMonth("next")}
                >
                    <SVGIcon 
                        icon={Icon.ChevronRight}
                        options={{ scale: 1.4 }}
                    />
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
            {#each currMonth.days as day}
                {@const inbounds = calendar.dateInBounds(day.date)}
                <li class="calendar__month-day-container">
                    <button 
                        class="calendar__month-day"
                        class:calendar__month-day--not-curr-month={!day.isInCurrMonth}
                        class:calendar__month-day--today={isSameDay(day.date, new Date())}
                        class:calendar__month-day--picked={isSameDay(day.date, focusDate)}
                        disabled={!inbounds}
                        on:click={() => _onDayUpdate(day.date)}
                    >
                        {`${day.date.getDate()}`}
                    </button>
                </li>
            {/each}
        </ul>
    </div>
</div>

<style lang="scss">
    .calendar {
        --today-opacity: 0.08;   

        &--light {
            --today-opacity: 0.065;
        }
        &--light &__today-btn {
            @include text-style(0.3);
        }
        &--light &__next-prev-btn {
            opacity: 0.4;

            &:disabled {
                opacity: 0.16 !important;
            }
            &:hover {
                opacity: 0.5;
            }
        }
        &--light &__month-title {
            @include text-style(0.28);
        }
        &--light &__month-title strong {
            @include text-style(1);
        }
        &--light &__days-of-week * {
            @include text-style(0.9);
        }
        &--light &__month-day {
            &:hover {
                background: rgba(var(--textColor1), 0.09);
            }
            &--not-curr-month {
                opacity: 0.2 !important;
            }
        }
        &--light &__today-btn {
            opacity: 0.4;
            &:hover {
                opacity: 0.8;
            }
        }
        &--light &__next-prev-btn {
            opacity: 0.26;
            
            &:hover {
                opacity: 0.5;
            }
            &:disabled {
                opacity: 0.1;
            }
        }
        &--date-picker &__focus-header {
            padding: 0px 4px 7px 8px;
        }
        
        &__focus-header {
            @include flex(center, space-between);
            padding: 0px 4px 2px 8px;
        }
        &__btns-container {
            @include flex(center);
        }
        &__today-btn {
            @include text-style(0.2, 300, 1.75rem);
            @include center;
            @include circle(12px);
            transition: 0.1s ease-in-out;
            padding: 0px 5px;
            opacity: 1 !important;
            
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
                opacity: 0.05 !important;
            }
            &:hover {
                opacity: 0.6;
            }
            &:active {
                transform: scale(0.9);
            }
        }
        &__month-title {
            @include text-style(0.4, var(--fw-400-500), 1.3rem);
            margin-left: 1px;

            strong {
                @include text-style(1, var(--fw-400-500));
                margin-right: 3px;
            }
        }
        &__days-of-week {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            padding: 5px 1px 2px 1px;
            width: 100%;
        }
        &__days-of-week * {
            @include text-style(0.4, var(--fw-400-500), 1.1rem, "Geist Mono");
            @include center;
        }
        &__month {
            width: 100%;
            padding: 0px 1px 0px 1px;
            margin-top: 3px;

            ul {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
            }
        }
        &__month-day {
            @include center;
            @include text-style(0.85, var(--fw-400-500), 1.15rem);
            @include circle(20px);
            user-select: none;
            position: relative;
            opacity: 0.95;
            cursor: pointer;

            &:hover {
                @include text-style(1);
                background: rgba(var(--textColor1), 0.05);
                opacity: 1;
            }
            &:active {
                transition: 0.1s ease-in-out;
                transform: scale(0.98);
            }

            &-container {
                @include center;
                height: 26px;
            }
            &--today {
                color: rgba(var(--textColor1), 1) !important;
                background-color: rgba(var(--textColor1), var(--today-opacity)) !important;
                @include circle(22px);
                opacity: 1;
            }
            &--picked {
                background: var(--calMarkColor) !important;
                font-weight: 500;
                @include circle(22px);
                color: var(--elemTextColor) !important;
                opacity: 1;
            }
            &--not-curr-month {
                opacity: 0.25 !important;
            }
            &--not-curr-month:hover {
                background-color: rgba(var(--textColor1), 0.08) !important;
            }
        }
    }
</style>
