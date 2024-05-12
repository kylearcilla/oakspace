<script lang="ts">
	import { InputManager, TimeInputManager } from "$lib/inputs"
	import { themeState } from "$lib/store"
    import { minsFromStartToHHMM, prefer12HourFormat } from "$lib/utils-date"
	import { clamp, clickOutside, getElemStyle } from "$lib/utils-general"
	import { onMount } from "svelte/internal"
	import DropdownList from "./DropdownList.svelte"
	import type { Writable } from "svelte/store"
    
    export let id: string | undefined = undefined
    export let options: TimePickerOptions | undefined = {}
    export let onClick: FunctionParam | undefined = undefined
    export let onSet: (time: number) => void

    let dropdownOptions: DropdownOption[] = []

    let timePickerRef: HTMLElement
    
    $: currentTime = options?.start ?? 720
    $: maxTime = options?.max ?? 1439
    $: minTime = options?.min ?? 0
    
    $: isLight = !$themeState.isDarkTheme
    $: timeStr = minsFromStartToHHMM(currentTime, false)
    $: initTitleInput(timeStr)

    /* Input Stuff */
    let inputElem: HTMLElement
    let isInputActive = false
    let titleInput: Writable<InputManager>
    let closestIdxOption = -1
    
    /* Drag Stuff */
    let draggedOverElems: { target: HTMLElement, cursor: string } [] = []
    let initTouchPointLeft = -1
    let isDragging = false

    let prevOffset = -1
    let isNegative = false
    let prevVal = -1

    const VALID_DRAG_TRHESHOLD = 2
    const MINS_CHANGE = 5
    const DROPDOWN_OPTION_INTERVAL = 15

    /* Input Stuff */
    function toggleInput(doOpen: boolean) {
        if (doOpen) {
            closestIdxOption = options?.start ? Math.ceil(options.start / DROPDOWN_OPTION_INTERVAL) : -1
            isInputActive = true
        }
        else {
            isInputActive = false
        }
    }
    function initTitleInput(timeStr: string) {
        titleInput = (new TimeInputManager({ 
            min: minTime,
            max: maxTime,
            initValue: timeStr,
            placeholder: "",
            maxLength: 10,
            id: "routine-time-input",
            handlers: { 
                onBlurHandler: (e, timeMins) => onInputBlurHandler(e, timeMins),
                onError: () => onError()
            }
        })).state
    }
    function onInputBlurHandler(e: FocusEvent, timeMins: number) {
        const target = e.relatedTarget as HTMLElement
        const className = target?.classList.value ?? ""

        if (!target || !className.includes("option-btn")) {
            toggleInput(false)
            _onSet(timeMins)
        }
    }
    function _onSet(timeMins: number) {
        const _timeMins = clamp(minTime, timeMins, maxTime)
        onSet(_timeMins)
    }
    function onError() {

    }

    /* Dragging Stuff */
    function updateCurrentTime(diff: number) {
        if (diff % 2 != 0 || prevVal === diff) return

        prevVal = diff
        const multiplier = isNegative ? -1 : 1

        currentTime = clamp(minTime, currentTime + (multiplier * MINS_CHANGE), maxTime);
    }
    function onPickerMouseDown(e: MouseEvent) {
        initTouchPointLeft = e.clientX
        prevOffset = e.clientX

        window.addEventListener("mousemove", onPickerDrag)
        window.addEventListener("mouseup", onPickerMouseUp)
    }
    function onPickerDrag(e: MouseEvent) {
        const diff = e.clientX - initTouchPointLeft
        const target = e.target as HTMLElement

        if (isInputActive || Math.abs(diff) < VALID_DRAG_TRHESHOLD) {
            return
        }
        if (!isDragging) {
            isDragging = true
            document.body.style.setProperty('cursor', 'ew-resize', 'important');
            timePickerRef.style.cursor = "ew-resize"
            document.body.style.userSelect = "none"
        }
        
        const cursor = getElemStyle(target, "cursor")
        const isNonResize = target != timePickerRef && cursor != "ew-resize"

        // ensure that ew-resize is respected throughout
        if (isNonResize && !draggedOverElems.find((item) => item.target === target)) {
            target.style.setProperty('cursor', 'ew-resize', 'important');
            draggedOverElems.push({ target, cursor })
        }

        isNegative = e.clientX < prevOffset
        prevOffset = e.clientX
        updateCurrentTime(diff)
    }
    function onDropdownOptionClicked(e: Event, idx: number) {
        isInputActive = false
        toggleInput(false)

        const newVal = clamp(minTime, idx * DROPDOWN_OPTION_INTERVAL, maxTime)
        
        _onSet(newVal)
    }
    function onPickerMouseUp() {
        window.removeEventListener("mousemove", onPickerDrag)
        window.removeEventListener("mouseup", onPickerMouseUp)

        if (!isDragging) {
            toggleInput(true)
            requestAnimationFrame(() => inputElem!.focus())
            return
        }

        isDragging = false
        _onSet(currentTime)
        
        document.body.style.cursor = "auto"
        timePickerRef.style.cursor = "pointer"

        for (let elem of draggedOverElems) {
            elem.target.style.cursor = elem.cursor
        }
        draggedOverElems = []
    }

    /* General */
    function onClicked() {
        if (!onClick) return
        onClick()
    }
    function generateDropdownOptions(min = 0, max = 1425) {
        const options: DropdownOption[] = []

        for (let i = min; i <= max; i += DROPDOWN_OPTION_INTERVAL) {
            const str = minsFromStartToHHMM(i, false) 
            options.push({ 
                name: str.split(" ")[0],
                rightIcon: { type: "unit", icon: str.split(" ")[1] }
            })
        }
        return options
    }

    onMount(() => dropdownOptions = generateDropdownOptions())
</script>

<div class="time-picker-container" on:mousedown={() => onClicked()}>
    <div 
        id={`${id}--dropdown-btn`}
        class="time-picker" 
        class:time-picker--light={isLight}
        class:time-picker--default-width={isDragging || isInputActive}
        class:time-picker--active-input={isInputActive}
        class:select-none={isDragging}
        on:mousedown={onPickerMouseDown}
        use:clickOutside on:click_outside={() => isInputActive = false}
        bind:this={timePickerRef}
    >
        {#if isInputActive}
            <input 
                type="text"
                name="time-picker-input" 
                id="time-picker"
                aria-label="Time"
                spellcheck="false"
                placeholder={$titleInput.placeholder}
                maxlength={$titleInput.maxLength}
                bind:value={$titleInput.value}
                bind:this={inputElem}
                on:blur={(e) => $titleInput.onBlurHandler(e)}
                on:input={(e) => $titleInput.onInputHandler(e)}
            >
        {:else}
            <span>
                {timeStr}
            </span>
        {/if}
    </div>
    <div class="time-picker__dropdown">
        <DropdownList 
            id={`${id}--time-picker-dropdown`}
            isHidden={!isInputActive} 
            options={{
                listItems: dropdownOptions,
                position: { top: "-6px", right: "0px" },
                scroll:   { bar: true, goToIdx: closestIdxOption },
                onListItemClicked: onDropdownOptionClicked,
                styling: { 
                    zIndex: 100,
                    width: "85px", height: "180px",
                    optionWidth: "55px", fontFamily: "DM Sans"
                }
            }}
        />
    </div>
</div>

<style lang="scss">
    $width: 70px;
    $dropdown-width: 85px;

    .time-picker {
        @include txt-color(0.04, "bg");
        @include text-style(0.65, 300, 1.18rem, "DM Sans");
        padding: 4px 11px 4px 11px;
        border-radius: 10px;
        cursor: pointer;
        width: $width;
        white-space: nowrap;
        transition: 0.12s ease-in-out;
        position: relative;

        &--light {
            @include txt-color(0.055, "bg");
            @include text-style(0.75, 500);
        }
        &--default-width {
            width: $width !important;
        }
        &--active-input {
            @include txt-color(0.08, "bg");
        }
        &:active {
            transform: scale(0.994);
        }
        &::before, &::after {
            content: "";
            height: 100%;
            width: 5px;
            cursor: ew-resize;
        }
        &::before {
            @include abs-top-left;
        }
        &::after {
            @include abs-top-right;
        }

        &-container {
            width: $width;
            position: relative;
        }
        &__dropdown {
            @include abs-top-left(32px, 0px);
            width: $dropdown-width !important;
        }
        input {
            width: 100%;
            overflow-x: scroll;
            cursor: text !important;
        }
        span {
            opacity: 1;
        }
    }
</style>