<script lang="ts">
	import { Icon } from "$lib/enums"
	import { clickOutside } from "$lib/utils-general"
    import { datePickerManager, themeState } from "$lib/store"
	import { DatePickerManager } from "$lib/date-picker-manager"
    import SVGIcon from "./SVGIcon.svelte"
	import { onDestroy, onMount } from "svelte"
	import Calendar from "./Calendar.svelte"
	import { BasicCalendar } from "$lib/basic-calendar"
    
    export let pickedDate: Date | null = null
    export let options: DatePickerOptions | null
    export let onCancel: () => void
    export let onApply: (date: Date | null) => void

    let datePickerInput: HTMLInputElement | null = null
    let calendar: BasicCalendar

    $: {
        calendar?._store.subscribe((newCalendar: BasicCalendar) => calendar = newCalendar) 
    }

    function onDateCellPressed(day: any) {
        const basicDay = day as { date: Date, isInCurrMonth: boolean }

        $datePickerManager!.onDateCellPressed(basicDay.date)
        calendar.setNewPickedDate($datePickerManager!.pickedDate)
    }
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
        new DatePickerManager(options!)
        calendar = new BasicCalendar(options!)

        onDateCellPressed(pickedDate)
    })
    onDestroy(() => {
        $datePickerManager!.quit()
    })
</script>

<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)} />

{#if $datePickerManager}
<div 
    class={`date-picker ${$themeState.isDarkTheme ? "" : "date-picker--light"}`}
    use:clickOutside on:outClick={() => onCancel()}
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
    <div class="date-picker__calendar-container">
        <Calendar calendar={calendar} onDateCellPressed={onDateCellPressed}/>
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
        background-color: var(--bg-2);
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
            @include flex(center, space-between);
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
        &__remove-btn {
            padding: 0px 4px 0px 5px;
        }
        &__btns-container {
            @include flex(center);
        }
        &__calendar-container {
            width: 100%;
            padding: 3px 5px 20px 5px;
        }
        &__calendar-divider {
            width: 100;
            height: 0.5px;
            background-color: rgba(var(--textColor1), 0.05);
            margin: 17px auto 14px auto;
        }
        &__bottom-btn-container {
            padding: 0px 12px;
            @include flex(center);
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