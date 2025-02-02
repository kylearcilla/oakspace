<script lang="ts">
    import SVGIcon from "./SVGIcon.svelte"

	import { onMount } from "svelte"
	import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { SideCalendar } from "$lib/side-calendar"
	import { isSameDay, months } from "$lib/utils-date"

    export let isDisabled = false
    export let calendar: SideCalendar
    export let focusDate: Date | null = new Date()
    export let onDayUpdate: (date: Date) => void

    let type: "default" | "side" = "default"
    let currMonth = calendar.currMonth
    let pickedDate = new Date()
    let isNextMonthAvailable = calendar.isNextMonthAvailable
    let isPrevMonthAvailable = calendar.isPrevMonthAvailable

    function _onDayUpdate(day: Date) {
        if (isDisabled) return
        
        pickedDate = calendar.setNewPickedDate(day)
        currMonth = calendar.currMonth
        onDayUpdate(pickedDate)
    }
    function updateMonth(direction: "prev" | "next") {
        if (direction === "prev") {
            currMonth = calendar.getPrevMonthCalendar()
        }
        else {
            currMonth = calendar.getNextMonthCalendar()
        }
        isNextMonthAvailable = calendar.isNextMonthAvailable
        isPrevMonthAvailable = calendar.isPrevMonthAvailable 
    }
    onMount(() => {
        if (calendar instanceof SideCalendar) {
            type = "side"
        }
        else {
            type = "default"
        }
    })
</script>

{#if type != null}
<div 
    class={`calendar calendar--${type}`}
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
                    disabled={!isPrevMonthAvailable}
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
                    on:click={() => {
                        currMonth = calendar.getThisMonth()
                        pickedDate = new Date()
                        onDayUpdate(pickedDate)
                    }}
                >
                    •
                </button>
                <button 
                    class="calendar__next-prev-btn"
                    disabled={!isNextMonthAvailable}
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
                <li 
                    class="calendar__month-day-container"
                    class:calendar__month-day-container--empty={!day}
                >
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        role="button" 
                        tabindex="0" 
                        class="calendar__month-day"
                        class:calendar__month-day--not-curr-month={!day.isInCurrMonth}
                        class:calendar__month-day--today={isSameDay(day.date, new Date())}
                        class:calendar__month-day--picked={isSameDay(day.date, pickedDate)}
                        on:keydown={(e) => {
                            if (e.key === 'Enter' || e.code === 'Space') {
                                e.preventDefault()
                                _onDayUpdate(day.date)
                            }
                        }}
                        on:click={() => {
                            _onDayUpdate(day.date)
                        }}
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
        --today-opacity: 0.045;   

        &--light {
            --today-opacity: 0.065;
        }
        &--light &__today-btn {
            @include text-style(0.3);
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
        &--light#{&}--side &__today-btn {
            opacity: 0.4;
            &:hover {
                opacity: 0.8;
            }
        }
        &--light#{&}--side &__next-prev-btn {
            opacity: 0.26;
            
            &:hover {
                opacity: 0.5;
            }
            &:disabled {
                opacity: 0.1;
            }
        }

        /* Calendar Type Specific Styling */
        &--basic &__month-day-container {
            aspect-ratio: 1 / 1;
        }
        &--side &__month-day {
            background: none;
            cursor: pointer;
            
            &:hover {
                background: rgba(var(--textColor1), 0.04);
            }
            &-container {
                height: 28px;
            }
        }
        
        &__focus-header {
            @include flex(center, space-between);
            padding: 0px 4px 0px 8px;
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
            @include text-style(0.4, var(--fw-300-400), 1.285rem, "Geist Mono");
            margin-left: 1px;

            strong {
                @include text-style(1, var(--fw-400-500));
                margin-right: 3px;
            }
        }
        &__days-of-week {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            padding: 8px 1px 2px 1px;
            width: 100%;
        }
        &__days-of-week * {
            @include text-style(0.4, var(--fw-400-500), 1.2rem, "Geist Mono");
            @include center;
        }
        &__month {
            width: 100%;
            padding: 0px 1px 0px 1px;
            margin-top: 3px;

            ul {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                grid-gap: 0px;
                row-gap: 0px;
                width: 100%;
            }

            &--focus ul {
                margin-top: 1px;
            }
            &--focus .calendar__month-title {
                display: none;
            }
        }
        &__month-day {
            @include center;
            @include text-style(0.85, var(--fw-400-500), 1.19rem);
            user-select: none;
            position: relative;
            @include circle(25px);
            opacity: 0.95;
            background: rgba(var(--textColor1), 0.02);
            cursor: pointer;

            &:hover {
                @include text-style(1);
                background: rgba(var(--textColor1), 0.15);
                opacity: 1;
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
                color: rgba(var(--textColor1), 1) !important;
                background-color: rgba(var(--textColor1), var(--today-opacity)) !important;
                @include circle(22px);
                opacity: 1;
            }
            &--picked {
                background: #FF5151 !important;
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
            &--disabled {
                opacity: 0.52;
            }
        }
    }
</style>
