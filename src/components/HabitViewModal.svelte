<script lang="ts">
	import { onMount } from "svelte"
	import { Icon } from "$lib/enums"
    import { habitTracker, themeState } from "$lib/store"

	import { TextEditorManager } from "$lib/inputs"
	import { emojiPicker, imageUpload } from "$lib/pop-ups"
	import { isDowIdxRequired } from "$lib/utils-habits-data";
	import { clamp, clickOutside, kebabToNormal, normalToKebab } from "$lib/utils-general"
	import { getHabitStreak, onUpdateHabit, deleteHabit, addHabit, getHabiViewtData, getMinYear } from "$lib/utils-habits"

	import Modal from "./Modal.svelte"
	import SvgIcon from "./SVGIcon.svelte"
	import HeatMap from "./HeatMap.svelte"
	import BounceFade from "./BounceFade.svelte"
	import { DAYS_OF_WEEK } from "$lib/utils-date"
	import SettingsBtn from "./SettingsBtn.svelte"
	import DropdownBtn from "./DropdownBtn.svelte"
	import ConfirmBtns from "./ConfirmBtns.svelte"
	import DropdownList from "./DropdownList.svelte"
	import ConfirmationModal from "./ConfirmationModal.svelte"

    export let habit: Habit
    export let type: "edit" | "new" = "edit"
    export let onNewFinish: (() => void) | undefined = undefined

    const HABIT_TITLE_ID = "habit-title"
    const DESCRIPTION_ID = "habit-description"
    const CAPTION_ID = "habit-caption"
    const TOD_MAP = {
        "morning": "🌤️ Morning",
        "afternoon": "☀️ Afternoon",
        "evening": "🌙 Evening",
        "all-day": "🔖 All Day"
    }

    let { name, symbol, img, freqType, frequency, timeOfDay, description, caption } = habit

    let stats: HabitYearMetrics | null = null
    let now = new Date()

    let deleteConfirm = false
    let imgRef: HTMLImageElement | null = null
    let intervalTitleWidth = 0
    let timeInfoWidth = 0
    let initDragY = -1
    let ogDragVal = 0

    let containerRef: HTMLElement

    let todOpen = false
    let dowOpen = false
    
    let numPickerOpen = false
    let intervalOpen = false
    let numVal = 0

    let closing = false
    let yearHeatMap: HabitHeatMapData[] | null = null
    let currYear = now.getFullYear()
    let minYear = getMinYear()
    let options = false
    let intervalStr = ""

    let loading = false
    let titleElem: HTMLElement
    $: setFreqStr(freqType, frequency)
    $: light = !$themeState.isDarkTheme
    $: isYearCurr = currYear === now.getFullYear()

    $: if (!intervalOpen) {
        verifyFreq()
    }

    habitTracker.subscribe(() => updateYear(currYear))

    new TextEditorManager({ 
        id: HABIT_TITLE_ID,
        initValue: name,
        doAllowEmpty: false,
        placeholder: "no title...",
        singleLine: true,
        maxLength: 100,
    })
    new TextEditorManager({ 
        id: CAPTION_ID,
        initValue: caption,
        placeholder: "no caption",
        singleLine: true,
        maxLength: 50,
    })
    new TextEditorManager({ 
        id: DESCRIPTION_ID,
        initValue: description,
        placeholder: "no description...",
        maxLength: 1000,
    })

    async function updateYear(yr: number) {
        const max = now.getFullYear()
        if (yr > max || yr < minYear) return
        
        currYear = yr
        loading = true

        const data = await getHabiViewtData(habit, currYear)
        yearHeatMap = data.yearHeatMap
        stats = data.stats

        loading = false
    }
    function setFreqStr(freqType: string, frequency: number) {
        if (freqType === "daily") {
            intervalStr = "Daily"
        } 
        else if (freqType === "per-week") {
            intervalStr = `${frequency}× per week`
        } 
        else {
            const selectedDays = DAYS_OF_WEEK
                .map((d, idx) => isDowIdxRequired(frequency, idx) ? d.slice(0, 2) : null)
                .filter((d): d is string => d !== null)

            intervalStr = `${selectedDays.join(", ")}`
        }
    }
    function onIntervalChooose(name: string) {
        if (name === "Daily") {
            freqType = "daily"
            intervalOpen = false
        }
    }
    function onPerWeekBtnClick(dir: "up" | "down") {
        if (freqType !== "per-week") {
            frequency = 1
            numVal = 1
            freqType = "per-week"
            return 
        }
        if (dir === "up") {
            numVal = Math.min(7, numVal + 1)
        }
        else {
            numVal = Math.max(1, numVal - 1)
        }
        frequency = numVal
    }
    function verifyFreq() {
        if (freqType != "day-of-week") {
            return
        }
        if (frequency === 127 || frequency === 0) {
            frequency = 1
            freqType = "daily"

            setFreqStr(freqType, frequency)
        }
    }
    function toggleDowIdx(dowIdx: number)  {
        if (freqType !== "day-of-week") {
            frequency = 0b0000000
            freqType = "day-of-week"
        }

        frequency ^= 1 << (6 - dowIdx)
    }
    function onTodChoose(optn: string) {
        timeOfDay = normalToKebab(optn) as "morning" | "afternoon" | "evening" | "all-day"
        todOpen = false
    }
    function onOptionsClicked(name: string) {
        if (name === "Remove Image") {
            img = null
        }
        else if (name === "Delete Habit") {
            deleteConfirm = true
        }
        else {
            imageUpload.init({
                onSubmitImg: (src) => img = { src, center: 0 }
            })
        }

        options = false
    }
    /* drag */
    function dragDown(pe: PointerEvent) {
        if (pe.button != 0) {
            return
        }
        const target = pe.target as HTMLElement
        initDragY = pe.clientY

        target.setPointerCapture(pe.pointerId)
        ogDragVal = img?.center ?? 0
    }
    function onDrag(pe: PointerEvent) {
        if (initDragY < 0) {
            return
        }
        const offset = initDragY - pe.clientY
        const target = pe.target as HTMLElement
        const naturalHeight = imgRef!.naturalHeight 
        const percOffset = ((offset / naturalHeight) * 100) * 2.5

        target.style.cursor = "ns-resize"

        img!.center = clamp(0, ogDragVal + percOffset, 100)
        img = img
    }
    function onDragEnd(pe: PointerEvent) {
        ogDragVal = 0
        initDragY = -1

        const target = pe.target as HTMLElement
        target.style.cursor = "default"
    }
    async function onSave() {
        closing = true
        loading = true

        const promise = new Promise(async (res) => {
            const updateHabit = { 
                ...habit!, name: name || "Untitled", symbol, img, freqType, frequency, timeOfDay, description, caption 
            }

            if (type === "new") {
                await addHabit({ ...updateHabit, createdAt: new Date() })
            }
            else {
                await onUpdateHabit(updateHabit)
            }
            res(true)
        })

        await promise
        loading = false

        if (type === "new") {
            onNewFinish?.()
        }
        else {
            closeViewHabit()
        }
    }
    function closeViewHabit() {
        habitTracker.update((state) => ({ ...state, viewHabit: null }))
    }
    async function _deleteHabit() {
        deleteConfirm = true
        await deleteHabit(habit)
        closeViewHabit()
    }

    onMount(() => {
        if (!name) titleElem.focus()
    })
</script>

<Modal 
    options={{ 
        borderRadius: "10px", 
        scaleUp: true,
        overflowY: "visible", 
        overflowX: "visible"
    }} 
    onClickOutSide={() => {
        if (type === "edit") {
            onSave()
        }
    }}
>
    <div 
        bind:this={containerRef}
        class="habit"
        class:habit--light={light}
        class:habit--no-img={!img}
        class:habit--new={type === "new"}
        style:--bg-opacity={light ? 0.1 : 0.4}
    >
        {#if img}
            <div class="habit__img">
                <div 
                    class="habit__img-overlay"
                    on:pointerdown={dragDown}
                    on:pointermove={onDrag}
                    on:pointerup={onDragEnd}
                >
                </div>
                <img 
                    bind:this={imgRef}
                    style:object-position={`center ${img.center}%`}
                    src={img.src} 
                    alt={name} 
                />
            </div>
        {/if}

        <div class="habit__content">
            <div class="habit__header">
                <button 
                    class="habit__symbol"
                    on:click={() => {
                        emojiPicker.init({
                            onSubmitEmoji: (emoji) => {
                                symbol = emoji.native
                            }
                        })
                    }}
                >
                    {symbol}
                </button>
                <div class=habit__title>
                    <div 
                        bind:this={titleElem}
                        id={HABIT_TITLE_ID}
                        contenteditable
                        spellcheck="false"
                        bind:textContent={name}
                    />
                </div>
                <div class="habit__settings-btn">
                    <SettingsBtn 
                        id={"habit-options"}
                        onClick={() => options = !options}
                    />
                </div>
                <DropdownList 
                    id={"habit-options"}
                    isHidden={!options} 
                    options={{
                        listItems: [
                            {
                                name: img ? "Change Image" : "Add Image"
                            },
                            {
                                name: "Remove Image",
                                divider: true
                            },
                            {
                                name: type === "new" ? "Cancel" : "Delete Habit"
                            }
                        ],
                        position: { 
                            bottom: "-100px", right: "0px" 
                        },
                        styling: {
                            width: "130px"
                        },
                        onListItemClicked: ({ name }) => {
                            onOptionsClicked(name)
                        },
                        onClickOutside: () => {
                            options = false
                        }
                    }}
                />
            </div>
            <div style:padding="2px 0px 6px 0px">
                <div class="flx-center">
                    <div class="habit__info" bind:clientWidth={timeInfoWidth}>
                        <div class="habit__info-title" style:width={`${intervalTitleWidth}px`}>
                            Time
                        </div>
                        <div class="habit__info-content">
                            <DropdownBtn 
                                id={"tod"}
                                isActive={todOpen}
                                options={{
                                    noBg: false,
                                    title: TOD_MAP[timeOfDay],
                                    onClick: () => {
                                        todOpen = !todOpen
                                    },
                                    styles: { 
                                        fontSize: "1.285rem", 
                                        padding: "6px 10px 6.5px 10px",
                                        height: "15px"
                                    }
                                }} 
                            />
                            <DropdownList 
                                id={"tod"}
                                isHidden={!todOpen} 
                                options={{
                                    listItems: [
                                        {
                                            name: "Morning"
                                        },
                                        {
                                            name: "Afternoon"
                                        },
                                        {
                                            name: "Evening"
                                        },
                                        {
                                            name: "All Day"
                                        }
                                    ],
                                    pickedItem: kebabToNormal(timeOfDay),
                                    position: { 
                                        top: "32px", left: "0px" 
                                    },
                                    onListItemClicked: ({ name }) => {
                                        onTodChoose(name)
                                    },
                                    onClickOutside: () => {
                                        todOpen = false
                                    }
                                }}
                            />
                        </div>
                        <div 
                            class="habit__info-title" 
                            style:width="auto"
                            style:margin="0px 10px 0px 20px"
                        >
                            Caption
                        </div>
                    </div>
                    <div 
                        style:max-width={`calc(100% - ${timeInfoWidth}px)`}
                        id={CAPTION_ID}
                        class="text-editor habit__caption"
                        contenteditable
                        spellcheck="false"
                        bind:textContent={caption}
                    />
                </div>
                <div class="habit__info" style:margin-top="1.5px">
                    <div 
                        class="habit__info-title"
                        bind:clientWidth={intervalTitleWidth}
                    >
                            Interval
                    </div>
                    <div class="habit__info-content">
                        <DropdownBtn 
                            id={"tod-dropdown"}
                            isActive={intervalOpen}
                            options={{
                                noBg: false,
                                title: intervalStr,
                                onClick: () => {
                                    intervalOpen = !intervalOpen
                                },
                                styles: { 
                                    fontSize: "1.285rem", 
                                    padding: "6px 10px 6.5px 10px" 
                                }
                            }} 
                        />
                        <div use:clickOutside on:outClick={() => intervalOpen = false}>
                            <DropdownList 
                                id="interval-dropdown"
                                isHidden={!intervalOpen} 
                                options={{
                                    listItems: [
                                        {
                                            name: "Daily"
                                        },
                                        {
                                            name: "Per Week",
                                            childId: "per-week",
                                            onPointerOver: () => {
                                                numPickerOpen = closing ? false : true
                                            },
                                            onPointerLeave: () => {
                                                numPickerOpen = false
                                            }
                                        },
                                        {
                                            name: "Day of Week",
                                            childId: "dow",
                                            onPointerOver: () => {
                                                dowOpen = closing ? false : true
                                            },
                                            onPointerLeave: () => {
                                                dowOpen = false
                                            }
                                        }
                                    ],
                                    pickedItem: kebabToNormal(freqType),
                                    position: { 
                                        top: "29px", left: "0px" 
                                    },
                                    styling: { 
                                        width: "130px"
                                    },
                                    onListItemClicked: ({ name }) => {
                                        onIntervalChooose(name)
                                    }
                                }}
                            />

                            <BounceFade
                                isHidden={!numPickerOpen || !intervalOpen || dowOpen}
                                position={{ top: "60px", left: "132px" }}
                            >
                                {@const isPerWeek = freqType === "per-week"}
                                <div
                                    class="dmenu-container"
                                    class:dmenu-container--child={true}
                                    on:pointerleave={() => numPickerOpen = false}
                                >
                                    <div 
                                        data-dmenu-id="interval-dropdown"
                                        data-child-id="per-week"
                                        class="habit__num-picker dmenu"
                                    >
                                        <button on:click={() => onPerWeekBtnClick("down")}>
                                            -
                                        </button>
                                        <span class:lo-fi={!isPerWeek}>
                                            {isPerWeek ? numVal : "--"}
                                        </span>
                                        <button on:click={() => onPerWeekBtnClick("up")}>
                                            +
                                        </button>
                                    </div>
                                </div>
                            </BounceFade>
                            <BounceFade
                                isHidden={!dowOpen || !intervalOpen || numPickerOpen}
                                position={{ top: "90px", left: "132px" }}
                            >
                                {@const freq = freqType === "day-of-week" ? frequency : 0b0000000}
                                <div
                                    class="dmenu-container"
                                    class:dmenu-container--child={true}
                                    on:pointerleave={() => dowOpen = false}
                                >
                                    <div 
                                        data-dmenu-id="interval-dropdown"
                                        data-child-id="dow"
                                        class="habit__dow-menu dmenu"
                                        style:--font-size="1.3rem"
                                    >
                                        {#each DAYS_OF_WEEK as day, idx}
                                            <li class="dmenu__toggle-optn dmenu__option--static">
                                                <span class="dmenu__option-heading">
                                                    {day.slice(0, 3)}
                                                </span>
                                                <button 
                                                    class="habit__dow-btn"
                                                    class:habit__dow-btn--checked={(freq & (1 << (6 - idx))) !== 0}
                                                    on:click={() => toggleDowIdx(idx)}
                                                >
                                                    <i class="fa-solid fa-check"></i>
                                                </button>
                                            </li>
                                        {/each}
                                    </div>
                                </div>
                            </BounceFade>
                        </div>
                    </div>
                </div>
            </div>

            <div 
                class="habit__info-title"
                style:margin="3px 0px 9px 0px"
            >
                Description
            </div>
            <div 
                id={DESCRIPTION_ID}
                class="habit__description text-editor"
                aria-label="Description"
                contenteditable
                spellcheck="false"
                bind:textContent={description}
            />

            {#if type === "edit"}
                <div class="habit__stats-container">
                    <div class="habit__stats-header">
                        <h2>{currYear}</h2>
                        <div class="flx">
                            <button 
                                class="habit__now"
                                class:hidden={isYearCurr}
                                on:click={() => updateYear(now.getFullYear())}                        
                            >
                                Go Back
                            </button>
                            <button 
                                on:click={() => updateYear(currYear - 1)}
                                disabled={currYear === minYear}
                                class="habit__arrow"
                                style:margin-left="10px"
                            >
                                <div style:margin-left={"-2px"}>
                                    <SvgIcon 
                                        icon={Icon.ChevronLeft} options={{ scale: 1.4 }}
                                    />
                                </div>
                            </button>
                            <button 
                                on:click={() => updateYear(currYear + 1)}
                                class="habit__arrow"
                                style:margin-left="10px" 
                                disabled={isYearCurr}
                            >
                                <div style:margin-right={"-2px"}>
                                    <SvgIcon icon={Icon.ChevronRight} options={{ scale: 1.4 }}/>
                                </div>
                            </button>
                        </div>
                    </div>
                    {#if stats}
                        {@const { habitsDone, habitsDue, missed, longestStreak } = stats}
                        {@const zero = habitsDue === 0}
                        {@const isYearCurr = true}
                        {@const activeStreak = getHabitStreak(habit)}

                        <div 
                            class="habit__stats stats"
                            class:stats--light={light}
                        >
                            {#if activeStreak >= 0 && currYear === now.getFullYear()}
                                <div 
                                    class="stat" 
                                    class:hidden={!isYearCurr}
                                    style:margin-right="20px"
                                >
                                    <div class="stat__bottom">
                                        <div class="flx">
                                            <span class="stat__value">
                                                {activeStreak}
                                            </span>
                                            <span class="stat__unit">
                                                {activeStreak === 1 ? "day" : "days"}
                                            </span>
                                        </div>
                                        <span class="stat__label">Active Streak</span>
                                    </div>     
                                </div>
                            {/if}
                            {#if longestStreak}
                                <div class="stat" style:margin-right="25px">
                                    <div class="stat__bottom">
                                        <div class="flx">
                                            <span class="stat__value">
                                                {zero ? "--" : longestStreak.count}
                                            </span>
                                            <span class="stat__unit">
                                                {zero ? "" : longestStreak.count === 1 ? "day" : "days"}
                                        </span>
                                    </div>
                                    <span class="stat__label">Longest Streak</span>
                                    </div>                    
                                </div>
                            {/if}
                            <div class="stat" style:margin-right="25px">
                                <div class="stat__bottom">
                                    <div class="flx">
                                        <span class="stat__value">
                                            {zero ? "--" : Math.floor((habitsDone / habitsDue) * 100)}
                                        </span>
                                        <span class="stat__unit" style:margin="0px 0px 0px 5px">
                                            {zero ? "" : "%"}
                                        </span>
                                    </div>
                                    <span class="stat__label">Consistency</span>
                                </div>                    
                            </div>
                            <div class="stat">
                                <div class="stat__bottom">
                                    <div class="flx">
                                        <span class="stat__value">
                                            {zero ? "--" : missed}
                                        </span>
                                        <span class="stat__unit">
                                            {zero ? "" : missed === 1 ? "time" : "times"}
                                        </span>
                                    </div>
                                    <span class="stat__label">Missed</span>
                                </div>
                            </div>
                        </div>
                    {/if}
                    {#if containerRef && yearHeatMap}
                        <div class="habit__heat-map">
                            <HeatMap 
                                type="habits"
                                data={yearHeatMap}
                                year={currYear} 
                                modalRef={containerRef}
                                options={{ single: true, cellType: "small" }}
                            />
                        </div>
                    {/if}
                </div>
            {/if}

            {#if type === "new"}
                <div style:padding-bottom="18px">
                    <ConfirmBtns 
                        confirmText="Add Habit"
                        disabled={name === ""}
                        isLoading={loading}
                        onOk={async () => {
                            onSave()
                        }}
                        onCancel={() => {
                            if (onNewFinish) {
                                onNewFinish()
                            }
                        }}
                    />
                </div>
            {/if}
        </div>
    </div>
</Modal>

{#if deleteConfirm} 
    <ConfirmationModal 
        text="You sure? <br><br> All data & history for this habit will be lost forever!"
        type="delete"
        onOk={() => {
            _deleteHabit()
        }}
        onCancel={() => { 
            deleteConfirm = false
        }}
    /> 
{/if}

<style lang="scss">
    @import "../scss/dropdown.scss";
    @import "../scss/stats.scss";

    .habit {
        width: 90vw;
        max-width: 600px;
        border-radius: 13px;
        position: relative;

        --no-img-width: 560px;
        --empty-text-opacity: 0.1;

        &--light {
            --empty-text-opacity: 0.2;
        }
        &--light .text-editor {
            @include text-style(1);
            opacity: 1 !important;
        }
        &--light &__info-title {
            @include text-style(0.95);
        }
        &--light &__num-picker {
            @include contrast-bg("bg-3"); 
        }
        &--light &__dow-menu {
            @include contrast-bg("bg-3"); 
        }
        &--new {
            width: 500px;
            --no-img-width: 460px;
        }
        &--new &__description {
            min-height: 190px;
            max-height: 200px;
            margin-bottom: 20px;
            width: 100%;
        }
        &--no-img {
            width: var(--no-img-width);
        }
        &--no-img &__content {
            padding-top: 0px;
            width: 100%;
        }
        &--no-img &__header {
            width: 100%;
            padding: 5px 0px 0px 0px;
            @include flex(center);
        }
        &--no-img &__symbol {
            font-size: 2rem;
            margin: 0px 10px 0px 0px;
        }

        &__img {
            height: 150px;
            width: 100%;
            @include abs-top-left;
            width: 100%;
            z-index: 0;
            border-radius: 10px 10px 0px 0px;
            overflow: hidden;

            img {
                height: 100%;
                width: 100%;
                object-fit: cover;
                position: relative;
            }
        }
        &__img-overlay {
            content: "";
            @include abs-top-left;
            width: 100%;
            height: 100%;
            z-index: 100;
            background: linear-gradient(to bottom, rgba(0,0,0, var(--bg-opacity)) 100%, rgba(0,0,0, var(--bg-opacity)) 100%);
        }
        &__content {
            padding: 100px 20px 2px 20px
        }
        &__header {
            margin: 9px 0px 4px 0px;
            position: relative;
            width: 100%;
        }
        &__title {
            @include text-style(1, var(--fw-400-500), 1.8rem);
            width: fit-content;
            position: relative;
        }
        &__symbol {
            @include text-style(1, _, 3.5rem);
            margin: 7px 0px 1px 0px;
            transition-property: transform;
        }
        &__settings-btn {
            @include abs-bottom-right(5px, -1px);
        }
        &__caption {
            @include text-style(1, var(--fw-400-500));
            min-width: 100px;
            white-space: nowrap;
            overflow: scroll;
            margin: -2px 0px 0px 0px;
            opacity: 0.95;

            &::-webkit-scrollbar {
                display: none;
            }
        }
        &__dow-menu {
            min-width: 70px;
            border-radius: 8px;
            padding: 2px 2px 5px 1px;
            span {
                @include text-style(1, var(--fw-400-500), 1.25rem);
            }
        }
        li {
            @include flex(center, space-between);
        }
        &__dow-btn {
            @include center;
            @include square(15px, 1px);
            background-color: rgba(var(--textColor1), 0.05);

            &:hover {
                background-color: rgba(var(--textColor1), 0.065);
            }
            &--checked {
                background-color: var(--elemColor1) !important;
            }
            &--checked i {
                display: block !important;
            }
            i {
                display: none;
                color: white;
                font-size: 0.85rem;
            }
        }
        &__info {
            @include flex(center);
            margin: 5.5px 5px 5px 0px;
        }
        &__info-title {
            @include text-style(0.35, var(--fw-400-500), 1.4rem);
            margin: 0px 16px 3px 0px;
        }   
        &__info-content {
            position: relative;
        }
        &__num-picker {
            @include flex(center);
            @include contrast-bg("bg-2");
            padding: 5px;
            border-radius: 7px;
            z-index: 100;

            button {
                @include square(24px, 4px);
                @include center;
                opacity: 0.8;
                background-color: rgba(var(--textColor1), 0.05);
                @include text-style(1, var(--fw-400-500), 1.5rem);

                &:hover {
                    opacity: 1;
                }
            }
            span {
                margin: 0px 17px;
                white-space: nowrap;
                @include text-style(1, var(--fw-400-500), 1.2rem, "Geist Mono");
            }
        }
        &__description {
            @include text-style(1, var(--fw-400-500), 1.45rem);
            min-height: 60px;
            max-height: 140px;
            width: 90%;
        }
        &__now {
            @include text-style(_, var(--fw-400-500), 1.3rem);
            opacity: 0.2;
            &:hover {
                opacity: 0.75;
            }
        }
        &__arrow {
            opacity: 0.45;
            @include center;
            @include circle(25px);
            
            &:disabled {
                opacity: 0.1 !important;
            }
            &:hover {
                opacity: 1;
                background-color: rgba(var(--textColor1), 0.06);
            }
        }
        &__stats-header {
            @include flex(center, space-between);
            border-top: var(--divider-border);
            margin-top: 20px;
            padding: 8px 0px 7px 0px;

            h2 {
                @include text-style(1, var(--fw-400-500), 1.7rem);
            }
        }
        &__stats {
            margin: 1px 0px 26px 0px;
        }
        &__heat-map {
            padding: 0px 0px 20px 0px;
        }
    }
    .stat {
        &__bottom {
            font-size: 1.4rem;
        }
        &__label {
            margin-top: 5px;
            font-size: 1.38rem;
        }
        &__unit, &__value {
            font-family: unset;
            font-weight: var(--fw-400-500);
        }
    }
    .text-editor:empty:before {
        opacity: var(--empty-text-opacity);
    }
</style>