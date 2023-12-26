<script lang="ts">
	import { Icon } from "$lib/enums"
	import { clickOutside } from "$lib/utils-general"
    import { isSameDay, months } from "$lib/utils-date"
    import { datePickerManager, themeState } from "$lib/store"
	import { DatePickerManager } from "$lib/date-picker-manager"
    import SVGIcon from "./SVGIcon.svelte"
	import { onDestroy, onMount } from "svelte"
    
    export let pickedDate: Date | null = null
    export let options: DatePickerOptions | null
    export let onCancel: () => void
    export let onApply: (date: Date | null) => void

    let datePickerInput: HTMLInputElement | null = null
    let today = new Date()

    function onCancelClicked() {
        $datePickerManager!.quit()
        onCancel()
    }
    function onApplyClicked() {
        const pickedDate = submitUserInput()
        if (pickedDate) onApply(pickedDate)
    }
    function submitUserInput() {
        const inputText = $datePickerManager!.datePickerInput!.value
        return $datePickerManager!.submitInputText(inputText)
    }
    function onDateInputChange() {
        const hasError = $datePickerManager!.errorMsg
        if (!hasError) return
        $datePickerManager!.setError(null)
    }

    // keyboard shortcuts
    function keyboardShortcutsHandler(e: KeyboardEvent) {
        const target = e.target as HTMLInputElement
        const key = e.key

        const isOnInput = target.tagName === "INPUT"

        if (isOnInput && key === "Enter") {
            submitUserInput()
        }
        else if (key === "Enter") {
            onApplyClicked()
        }
        else if (isOnInput && key === "Escape") {
            datePickerInput!.value = $datePickerManager!.pickedDateStr
        }
        else if (key === "Escape") {
            onCancel()
        }
    }

    onMount(() => {
        new DatePickerManager(pickedDate, options!)
    })
    onDestroy(() => {
        $datePickerManager!.quit()
    })
</script>

<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)} />

{#if $datePickerManager}
<div 
    class={`date-picker ${$themeState.isDarkTheme ? "" : "date-picker--light"}`}
    use:clickOutside on:click_outside={() => onCancel()}
>
    <!-- Date Picker Header -->
    <div class="date-picker__header">
        <div class="date-picker__input-container">
            <input 
                class="date-picker-input" id="date-picker-input"
                placeholder="2022, Dec 2023" value={$datePickerManager.pickedDateStr} 
                on:input={onDateInputChange}
                bind:this={datePickerInput}
            />
            {#if $datePickerManager.pickedDate}        
                <button 
                    class="date-picker__remove-btn"
                    on:click={() => $datePickerManager?.setNewPickedDate(null)}
                >
                    <SVGIcon icon={Icon.Close} />
                </button>
            {/if}
        </div>
        {#if $datePickerManager.errorMsg}
            <div class="date-picker__input-error-msg">
                {$datePickerManager.errorMsg}
            </div>
        {/if}
    </div>
    <div class="date-picker__header-divider">
        <svg xmlns="http://www.w3.org/2000/svg" width="220" height="2" viewBox="0 0 220 2" fill="none">
            <path d="M0.552734 0.755859H340.584" stroke-width="0.3" stroke-dasharray="2.2 2.2"/>
        </svg>
    </div>
    <!-- Focus Header -->
    <div class="date-picker__focus">
        <div class="date-picker__focus-header">
            <div class="date-picker__month-title">
                <strong>
                    {months[$datePickerManager.currMonth.monthIdx].substring(0, 3)}
                </strong> 
                {$datePickerManager.currMonth.year}
            </div>
            <div class="date-picker__btns-container">
                <button 
                    class="date-picker__next-prev-btn"
                    on:click={() => $datePickerManager?.getPrevMonthCalendar()}
                    disabled={!$datePickerManager.isPrevMonthAvailable}
                >
                    <SVGIcon icon={Icon.ChevronLeft}/>
                </button>
                <button
                    class="date-picker__today-btn"
                    on:click={() => $datePickerManager?.getThisMonth()}
                >
                    Today
                </button>
                <button 
                    class="date-picker__next-prev-btn"
                    on:click={() => $datePickerManager?.getNextMonthCalendar()}
                    disabled={!$datePickerManager.isNextMonthAvailable}
                >
                <SVGIcon icon={Icon.ChevronRight}/>
            </button>
            </div>
        </div>
        <div class="date-picker__days-of-week">
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
    <div class="date-picker__calendar">
        <ul>
            {#each $datePickerManager.currMonth.days as day}
                <li class={`date-picker__calendar-day-container ${day ? "" : "date-picker__calendar-day-container--empty"}`}>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        role="button" tabindex="0"
                        class={`date-picker__calendar-day 
                                    ${day ? "date-picker__calendar-day--fill" : ""}
                                    ${day != null && $datePickerManager.isDateInBounds(day.date).result ? "" : "date-picker__calendar-day--disabled"}
                                    ${day != null && isSameDay(day.date, today) ? "date-picker__calendar-day--today" : ""}
                                    ${day != null && isSameDay(day.date, $datePickerManager.pickedDate) ? "date-picker__calendar-day--picked" : ""}
                                    ${day != null && !day.isInCurrMonth ? "date-picker__calendar-day--not-curr-month" : ""}
                        `}
                        on:click={() => $datePickerManager?.onDateCellPressed(day)}
                    >
                        {`${day === null ? "" : day?.date.getDate()}`}
                    </div>
                </li>
            {/each}
        </ul>
    </div>
    <!-- Buttons Container -->
    <div class="date-picker__bottom-btn-container">
        <button 
            class="date-picker__cancel-btn" tabindex="0"
            on:click={onCancelClicked}
        >
            Cancel
        </button>
        <button 
            class="date-picker__submit-btn" tabindex="0"
            on:click={onApplyClicked}
        >
            Apply
        </button>
    </div>
</div>
{/if}

<style lang="scss">
    .date-picker {
        width: 220px;
        border-radius: 12px;
        padding-bottom: 12px;
        background-color: var(--dropdownMenuBgColor1);
        border: var(--bentoBoxBorder);
        box-shadow: var(--bentoBoxShadow);

        &--light &__header input {
            @include text-style(0.85, 500);

            &::placeholder {
                @include text-style(0.15, 400);
            }
        }
        &--light &__header button {
            opacity: 0.2;
            &:hover {
                opacity: 0.8;
            }
        }
        &--light &__header-divider path {
            stroke: rgba(var(--textColor1), 0.38);
        }
        &--light &__input-error-msg {
            @include text-style(_, 500, 1.05rem);
            color: rgba(212, 115, 115, 0.85);
        }
        &--light &__today-btn {
            @include text-style(0.9, 600);
        }
        &--light &__next-prev-btn {
            opacity: 0.7;

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
        &--light &__days-of-week * {
            @include text-style(0.5, 500);
        }
        &--light &__calendar-day {
            @include text-style(0.94, 500);

            &--fill {
                background: rgba(var(--textColor1), 0.05);
            }
            &--fill:hover {
                background: rgba(var(--textColor1), 0.1);
            }
            &--today {
                @include text-style(0.89);
                background: rgba(var(--textColor1), 0.1);
            }
            &--picked {
                background: rgba(var(--textColor1), 1) !important;
                color: white !important;
            }
            &--not-curr-month {
                opacity: 0.35 !important;
            }
            &--disabled {
                opacity: 0.6;
            }
        }
        &--light &__bottom-btn-container button {
            @include text-style(_, 600);
        }
        &--light &__cancel-btn {
            background-color: rgba(black, 0.03);
        }

        &__header {
            input {
                flex: 1;
                font-family: "DM Sans";
                @include text-style(0.9, 300, 1.27rem);

                &::placeholder {
                    @include text-style(0.1);
                }
            }
            button {
                opacity: 1;
                &:hover {
                    opacity: 0.5;
                }
            }
        }
        &__input-container {
            @include flex-container(center, space-between);
            padding: 10px 12px 0px 12px;
        }
        &__input-error-msg {
            @include text-style(_, 300, 1.05rem);
            color: rgba(212, 115, 115, 0.8);
            font-family: "DM Sans";
            padding: 4px 0px 0px 12px;
            margin: -1px 0px -2px 0px;
        }
        &__header-divider {
            padding: 0px 0px 13px 0px;
            height: 2px;
            path {
                stroke: rgba(var(--textColor1), 0.2);
            }
        }
        &__focus-header {
            @include flex-container(center, space-between);
            padding: 4px 12px 0px 12px;
        }
        &__btns-container {
            @include flex-container(center);
        }
        &__remove-btn {
            padding: 0px 4px 0px 5px;
        }
        &__today-btn {
            @include text-style(0.2, 300, 1.29rem);
            margin: 0px 5px;
            padding: 0px 7px;
            
            &:hover {
                @include text-style(0.6);
            }
        }
        &__next-prev-btn {
            @include center;
            opacity: 0.2;
            padding: 5px;

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
            padding: 15px 12px 6px 12px;
            width: 100%;

            * {
                @include text-style(1, 300, 1rem);
                @include center;
                width: 28px;
            }
        }
        &__calendar {
            height: 175px;
            width: 100%;
            padding: 0px 12px 25px 12px;
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
            &--focus .date-picker__month-title {
                display: none;
            }
        }
        &__calendar-day {
            font-family: "DM Mono";
            @include center;
            @include text-style(0.7, 300, 1rem);
            @include circle(90%);
            transition: 0.04s ease-in-out;
            user-select: none;

            &-container {
                height: 28px;
                width: 28px;
                @include center;

                &--empty {
                    height: 0px;
                    width: 0px;
                }
            }
            
            &--fill {
                cursor: pointer;
                background: rgba(var(--textColor1), 0.02);
            }
            &--fill {
                &:hover {
                    @include text-style(0.89);
                    background: rgba(var(--textColor1), 0.08);
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
            &:active {
                transform: scale(0.98);
            }
        }
        &__calendar-divider {
            width: 100;
            height: 0.5px;
            background-color: rgba(var(--textColor1), 0.05);
            margin: 17px auto 14px auto;
        }
        &__bottom-btn-container {
            padding: 0px 12px;
            @include flex-container(center);
            width: 100%;
            
            button {
                height: 28px;
                @include center;
                @include text-style(_, 400, 1.1rem);
                border-radius: 4px;

                &:hover {
                    opacity: 0.9;
                }
            }
        }
        &__cancel-btn {
            width: 35%;
            margin-right: 5px;
            background-color: rgba(white, 0.03);
            @include text-style(0.8);
        }
        &__submit-btn {
            width: calc((100% - 35%) - 5px);
            color: rgba(var(--textColor1), 1);
            background-color: rgba(var(--fgColor1), 1);
        }
        &__dummy-top-padding {
            height: 50px;
            width: 100%;
        }
    }
</style>