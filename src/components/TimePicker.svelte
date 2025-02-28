<script lang="ts">
	import { onMount } from "svelte"

	import { themeState } from "$lib/store"
	import { TimeInputManager } from "$lib/inputs"
	import { clamp, clickOutside, getElemStyle } from "$lib/utils-general"
    import { minsFromStartToHHMM, minsFromStartFromHHMM } from "$lib/utils-date"
    
	import DropdownList from "./DropdownList.svelte"
    
    export let id: string | undefined = undefined
    export let options: TimePickerOptions | undefined = {}
    export let onClick: FunctionParam | undefined = undefined
    export let onSet: (time: number) => void

    const MINS_CHANGE = 5
    const DROPDOWN_OPTION_INTERVAL = 15
    const TIME_PICKER_ID = `${id}--time-picker-input`

    let dropdownOptions: DropdownOption[] = []
    let timePickerRef: HTMLElement
    let currentMins = options?.start ?? 720
    let currentMinsStr = minsFromStartToHHMM(currentMins, false)

    $: maxTime = options?.max ?? 1439
    $: minTime = options?.min ?? 0
    $: isLight = !$themeState.isDarkTheme

    $: if (titleInput) {
        titleInput.updateBounds({ 
            min: minTime, max: maxTime 
        })
    }

    /* inputs */
    let inputElem: HTMLElement
    let active = false
    let closestIdxOption = -1
    let overElems: { target: HTMLElement, cursor: string } [] = []
    
    /* drag stuff */
    let initTouchPointLeft = -1
    let isDragging = false

    let prevOffset = -1
    let preDiff = -1
    let isNegative = false
    
    let titleInput = new TimeInputManager({ 
        id: TIME_PICKER_ID,
        min: minTime,
        max: maxTime,
        initValue: minsFromStartToHHMM(currentMins, false),
        maxLength: 10,
        placeholder: "1:30 PM",
        handlers: { 
            onBlurHandler: (_, timeStr) => onBlurHandler(timeStr)
        }
    })

    /* input stuff */
    function onBlurHandler(timeStr: string) {
        currentMins = minsFromStartFromHHMM(timeStr)
        currentMinsStr = timeStr

        onInputBlurHandler(currentMins)
        setTimeout(() => titleInput!.blur(), 100)
    }
    function toggleInput(doOpen: boolean) {
        if (doOpen) {
            closestIdxOption = options?.start ? Math.ceil(options.start / DROPDOWN_OPTION_INTERVAL) : -1
            active = true
        }
        else {
            active = false
        }
    }
    function onInputBlurHandler(timeMins: number) {
        toggleInput(false)
        setTime(timeMins)
    }
    function setTime(timeMins: number) {
        onSet(clamp(minTime, timeMins, maxTime))
    }

    /* dragging stuff */
    function updateCurrentTime(diff: number) {
        if (diff % 2 != 0 || preDiff === diff) {
            return
        }
        preDiff = diff
        const multiplier = isNegative ? -1 : 1

        currentMins = clamp(
            minTime, 
            Math.round((currentMins + (multiplier * MINS_CHANGE)) / 5) * 5, 
            maxTime
        )
        
        currentMinsStr = minsFromStartToHHMM(currentMins, false)
        titleInput.updateText(currentMinsStr)
    }
    function onPickerDrag(e: MouseEvent) {
        const diff = e.clientX - initTouchPointLeft
        const target = e.target as HTMLElement
        const cursor = getElemStyle(target, "cursor")
        const avoid = target != timePickerRef && cursor != "ew-resize"

        if (avoid && !overElems.find((item) => item.target === target)) {
            target.style.setProperty('cursor', 'ew-resize', 'important')
            overElems.push({ target, cursor })
        }

        isNegative = e.clientX < prevOffset
        prevOffset = e.clientX
        updateCurrentTime(diff)
    }
    function onPickerMouseDown(e: MouseEvent) {
        const target = e.target as HTMLElement
        if (target.isContentEditable) {
            active = true
            return
        }

        isDragging = true
        initTouchPointLeft = e.clientX
        prevOffset = e.clientX

        window.addEventListener("mousemove", onPickerDrag)
        window.addEventListener("mouseup", onPickerMouseUp)
    }
    function onPickerMouseUp() {
        window.removeEventListener("mousemove", onPickerDrag)
        window.removeEventListener("mouseup", onPickerMouseUp)

        isDragging = false
        setTime(currentMins)

        for (let elem of overElems) {
            elem.target.style.cursor = elem.cursor
        }
        overElems = []
    }

    /* misc */
    function onClicked() {
        if (!onClick) return
        onClick()
    }
    function onDropdownOptionClicked(idx: number) {
        active = false
        toggleInput(false)
        
        currentMins = clamp(minTime, idx * DROPDOWN_OPTION_INTERVAL, maxTime)
        currentMinsStr = minsFromStartToHHMM(currentMins, false)
        titleInput.updateText(currentMinsStr)

        setTime(clamp(minTime, idx * DROPDOWN_OPTION_INTERVAL, maxTime))
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

    onMount(() => {
        dropdownOptions = generateDropdownOptions()
        titleInput.initElem()
    })
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
    style:position="relative"
    on:mousedown={() => onClicked()}
>
    <div
        bind:this={timePickerRef}
        role="button"
        tabindex="0"
        id={`${id}--dbtn`}
        class="time-picker"  
        class:time-picker--dragging={isDragging}
        class:time-picker--light={isLight}
        class:time-picker--active={active || isDragging}
        on:mousedown={(e) => {
            onPickerMouseDown(e)
        }}
        on:keydown={(e) => {
            if (e.code === 'Enter' || e.code === 'Space') {
                active = true
                requestAnimationFrame(() => inputElem.focus())
            }
        }}
        use:clickOutside on:outClick={() => active = false}
    >
        <div 
            id={TIME_PICKER_ID}
            spellcheck="false"
            contenteditable
            data-placeholder={titleInput.placeholder}
            class="time-picker__input"
            class:pointer-events-none={isDragging}
            class:no-scroll-bar={true}
            class:hidden={isDragging}
            bind:this={inputElem}
        >
            {currentMinsStr}
        </div>
        {#if isDragging}
            <span class="time-picker__input">
                {currentMinsStr}
            </span>
        {/if}
    </div>
    <DropdownList 
        id={`${id}--time-picker-dropdown`}
        isHidden={!active} 
        options={{
            listItems: dropdownOptions,
            position: { 
                top: "32px", left: "0px" 
            },
            scroll: { 
                bar: true, goToIdx: closestIdxOption 
            },
            onListItemClicked: ({ idx }) => {
                onDropdownOptionClicked(idx)
            },
            styling: { 
                zIndex: 100,
                width: "95px", 
                height: "180px",
                optionWidth: "55px", 
                fontSize: "1.2rem"
            }
        }}
    />
</div>

<style lang="scss">
    .time-picker {
        --bg-opacity: 0.04;
        --hov-opacity: 0.065;

        padding: 6px 12px 6.5px 11px;
        border-radius: 8px;
        white-space: nowrap;
        transition: 0.25s cubic-bezier(.4,0,.2,1);
        position: relative;
        background-color: rgba(var(--textColor1), var(--bg-opacity));
        
        &--light {
            --hov-opacity: 0.085;
            --bg-opacity: 0.04;
        }
        &--light &__input {
            @include text-style(0.9);
        }
        &--active {
            @include txt-color(0.065, "bg");
            box-shadow: rgba(var(--textColor1), 0.1) 0px 0px 0px 2px, 
                        rgba(var(--textColor1), 0.05) 0px 0px 0px 4px;
        }

        &--dragging div[contenteditable] {
            pointer-events: none;
            user-select: none;
        }
        &:hover {
            @include txt-color(var(--hov-opacity), "bg");
        }
        &::before {
            @include abs-top-left;
        }
        &::after {
            @include abs-top-right;
        }
        &::before, &::after {
            content: "";
            height: 100%;
            width: 5px;
            cursor: ew-resize;
        }
        &__input {
            @include text-style(0.95, var(--fw-400-500), 1.285rem);
            cursor: text;
            overflow-x: scroll;
            max-width: 80px;
        }
        span {
            pointer-events: none;
            user-select: none;
        }
    }
</style>