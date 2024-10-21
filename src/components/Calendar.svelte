<script lang="ts">
    import SVGIcon from "./SVGIcon.svelte"

	import { onMount } from "svelte"
	import { themeState } from "$lib/store"
	import { Icon } from "$lib/enums"
	import { isSameDay, months } from "$lib/utils-date"
	import { ProductivityCalendar } from "$lib/productivity-calendar"

    enum CalendarType {
        Basic, Productivity
    }
    export let isDisabled = false
    export let calendar: ProductivityCalendar
    export let focusDate: Date | null = new Date()
    export let onDayUpdate: (date: Date) => void

    let type: CalendarType | null = null
    $: store = calendar._store

    $: if ($store.pickedDate != focusDate && focusDate && !isDisabled) {
        $store.setNewPickedDate(focusDate)
    }

    function _onDayUpdate(day: Date) {
        if (isDisabled) return
        
        onDayUpdate(day)
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
<div 
    class={`calendar calendar--${CalendarType[type].toLowerCase()}`}
    class:calendar--light={!$themeState.isDarkTheme}
>
    <div class="calendar__focus">
        <div class="calendar__focus-header">
            <div class="calendar__month-title">
                <strong>
                    {months[$store.currMonth.monthIdx]}
                </strong> 
                {$store.currMonth.year}
            </div>
            <div class="calendar__btns-container">
                <button 
                    class="calendar__next-prev-btn"
                    on:click={() => $store.getPrevMonthCalendar()}
                    disabled={!$store.isPrevMonthAvailable}
                >
                <SVGIcon 
                    icon={Icon.ChevronLeft}
                    options={{
                        scale: 1.5, height: 12, width: 12, strokeWidth: 1.4
                    }}
                />
                </button>
                <button
                    disabled={isDisabled}
                    title="Go to current month."
                    class="calendar__today-btn"
                    on:click={() => $store.getThisMonth()}
                >
                    •
                </button>
                <button 
                    class="calendar__next-prev-btn"
                    on:click={() => $store.getNextMonthCalendar()}
                    disabled={!$store.isNextMonthAvailable}
                >
                <SVGIcon 
                    icon={Icon.ChevronRight}
                    options={{
                        scale: 1.5, height: 12, width: 12, strokeWidth: 1.4
                    }}
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
            {#each $store.currMonth.days as day}
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
                        class:calendar__month-day--picked={isSameDay(day.date, $store.pickedDate)}
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
        /* light / dark themes adjustments */
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
        &--light &__days-of-week *,
         &--light#{&}--productivity &__days-of-week * {
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
            &--not-curr-month {
                opacity: 0.4 !important;
            }
        }

        /* Calendar Type Specific Styling */
        &--basic &__month-day-container {
            aspect-ratio: 1 / 1;
        }
        &--productivity &__month-day {
            @include text-style(0.6, 500, 1.08rem, "DM Sans");
            width: 80%; 
            height: 100%;
            background: none;
            border-radius: 11px;
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
            @include text-style(0.2, 300, 1.29rem);
            @include center;
            transition: 0.1s ease-in-out;
            width: 12px;
            height: 12px;
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
            font-family: "DM Sans";
            @include text-style(0.4, 300, 1.35rem);

            strong {
                @include text-style(1, 400);
                margin-right: 3px;
            }
        }
        &__days-of-week {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            font-family: "DM Sans";
            padding: 12px 1px 0px 1px;
            width: 100%;

            * {
                @include text-style(0.4, 500, 0.97rem);
                @include center;
            }
        }
        &__month {
            width: 100%;
            padding: 0px 1px 25px 1px;

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
            @include text-style(0.7, 300, 1.1rem);
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
                color:rgba(var(--textColor1), 0.7);
                background: rgba(var(--textColor1), 0.04) !important;
            }
            &--picked {
                font-weight: 500;
                background-color: rgba(var(--textColor1), 0.04) !important;
                color: rgba(var(--textColor1), 1) !important;
                border: 1px solid rgba(var(--textColor1), 0.05);
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
