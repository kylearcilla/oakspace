<script lang="ts">
	import { onMount } from "svelte"
    import { themeState } from "$lib/store"
	import { capitalize } from "$lib/utils-general"
	import { DatePickerCalendar } from "$lib/date-picker-calendar"

	import Calendar from "./Calendar.svelte"
	import BounceFade from "./BounceFade.svelte";
	import DropdownList from "./DropdownList.svelte"
    
    export let isOpen: boolean
	export let pickedDate: Date
	export let options: DatePickerOptions
    export let dateType: DateType
	export let onClose: () => void
	export let onUpdate: (val: { date: Date, dateType: DateType } | null) => void

    $: light = !$themeState.isDarkTheme

    let calendar = new DatePickerCalendar(options)
	let errorMsg = ""
    let nowYear = new Date().getFullYear()
    let typeOptions = false
    let inputText = ""

    const { position = { top: "0px", left: "0px" } } = options ?? {}

    function onDayUpdate(day: Date) {
        inputText = calendar.formatDateByType(day)
        pickedDate = day
        onUpdate({ date: day, dateType })
	}
	function submitUserInput() {
        const data = calendar.extractDateFromInput(inputText)

        if (data.str) {
            inputText = data.str
            pickedDate = data.date!

        }
        else {
            errorMsg = data.errorMsg!
        }
	}
    function updateDateType(optn: string) {
        dateType = optn as "day" | "month" | "year" | "quarter"
        calendar.setDateType(dateType)

        onUpdate({ date: pickedDate!, dateType })
        submitUserInput()

        typeOptions = false
    }

	// Handle date input change
	function onDateInputChange() {
		if (!errorMsg) return
        errorMsg = ""
	}

	// Check date bounds
	function keyboardShortcutsHandler(e: KeyboardEvent) {
		const target = e.target as HTMLInputElement

		if (e.key === "Enter" && target.tagName === "INPUT") {
			submitUserInput()
		}
	}
	onMount(() => {
        inputText = calendar.formatDateByType(pickedDate!)
        pickedDate = pickedDate!
    })
</script>

<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)} />

<BounceFade 
    {position}
    id="date-picker--dmenu"
    isHidden={!isOpen}
    onClickOutside={() => onClose()}
>
    <div 
        class="date-picker"
        class:date-picker--light={light}
    >
        <div class="date-picker__header">
            <div class="date-picker__input-container">
                <input 
                    type="text"
                    class="date-picker-input"
                    placeholder="Apr 14, Q3 {nowYear}" 
                    maxLength={30}
                    on:input={onDateInputChange}
                    bind:value={inputText}
                />
                <button 
                    class="date-picker__due-type"
                    on:click={() => typeOptions = !typeOptions}
                >
                    {dateType[0].toUpperCase()}
                </button>

                <DropdownList 
                    id={"due-type"}
                    isHidden={!typeOptions} 
                    options={{
                        listItems: [
                            { sectionName: "Date Type" },
                            { name: "Day" },
                            { name: "Month" },
                            { name: "Quarter" },
                            { name: "Year" },
                        ],
                        pickedItem: capitalize(dateType),
                        position: { 
                            top: "35px", right: "0px" 
                        },
                        styling: {
                            width: "85px"
                        },
                        onListItemClicked: ({ name }) => {
                            updateDateType(name.toLowerCase())
                        },
                        onClickOutside: () => {
                            typeOptions = false
                        }
                    }}
                />
            </div>
            {#if errorMsg}
                <div class="date-picker__input-error-msg">
                    {errorMsg}
                </div>
            {/if}
        </div>
        <div style:padding="7px 5px 0px 5px">
            <Calendar 
                {calendar} 
                {onDayUpdate} 
                focusDate={pickedDate} 
                context="date-picker"
            />
        </div>
    </div>
</BounceFade>

<style lang="scss">
    .date-picker {
        width: 220px;
        border-radius: 10px;
        padding-bottom: 9px;
        background-color: #181717;
        border: var(--bentoBoxBorder);
        box-shadow: var(--bentoBoxShadow);

        --cancel-btn-opacity: 0.025;
        &--light {
            --cancel-btn-opacity: 0.065;
        }
        &--light &__ok {
            color: var(--modalBgColor) !important;
        }

        &__header {
            border-bottom: 1.5px dashed rgba(var(--textColor1), 0.05);
            padding: 0px 2px 8px 2px;

            button {
                opacity: 1;
                &:hover {
                    opacity: 0.5;
                }
            }
        }
        input {
            flex: 1;
            @include text-style(0.9, 400, 1.3rem);
            padding: 1px 0px 2px 0px;
            
            &::placeholder {
                @include text-style(0.3);
            }
        }
        &__input-container {
            @include flex(center, space-between);
            padding: 9px 12px 0px 12px;
            position: relative;
        }
        &__due-type {
            @include text-style(_, 400, 1.335rem, "Geist Mono");
            margin-left: 4px;
        }
        &__input-error-msg {
            @include text-style(_, 400, 1.3rem);
            color: rgba(212, 115, 115, 0.8);
            padding: 8px 0px 2px 12px;
        }
        &__btns-container {
            @include flex(center);
        }
    }
</style>