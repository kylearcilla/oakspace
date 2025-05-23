<script lang="ts">
	import { themeState } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { cursorPos } from "$lib/utils-home"
	import { minsToHHMM } from "$lib/utils-date"
    import { capitalize, initFloatElemPos, preventScroll } from "$lib/utils-general"
    import { formatCoreData, isDayRoutinedLinked } from "$lib/utils-routines"
	import type { WeeklyRoutinesManager } from "$lib/routines-weekly-manager"
    
	import SvgIcon from "$components/SVGIcon.svelte"
	import BounceFade from "$components/BounceFade.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte"
	import DropdownBtn from "$components/DropdownBtn.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import ConfirmationModal from "$components/ConfirmationModal.svelte"
	import { SET_DAILY_ROUTINES } from "../../../../tests/routines/routines.data"
	import DropdownOptionIcon from "$components/DropdownOptionIcon.svelte";
    
    const DAILY_ROUTINES: DailyRoutine[] = SET_DAILY_ROUTINES
    const DAY_DROPDOWN_WIDTH = 255

    export let viewOptn: "all" | "mtwt" | "fss" | "today"
    export let containerWidth: number
    export let daysInView: string[]
    export let weekRoutine: WeeklyRoutine | null
    export let manager: WeeklyRoutinesManager
    export let locked: boolean
    export let isMin: boolean

    let _dayBreakdown   = manager.dayBreakdown
    
    let viewOptionOpen = false
    let breakdownOpen = false
    let dailyRoutineContext: "Link" | "Replace" | null = null

    let breakdownColIdx = -1
    let breakdownView: "cores" | "tags" = "cores"
    let breakdownSettings = false
    let breakdownXPos = ""
    
    let routinesMenuOffset = -1
    let breakdownViewMenu = false
    let containerRef: HTMLElement | null = null

    $: light = !$themeState.isDarkTheme
    $: dayBreakdown = $_dayBreakdown

    let confirmOptions: {
        text: string,
        onCancel: () => void,
        onOk: () => void
    } | null = null

    _dayBreakdown.subscribe((data) => {
        if (!data) return
        
        breakdownXPos = setDayBreakdownXOffset(breakdownColIdx, daysInView.length)
    })

    /* breakdown view */
    function setDayBreakdownXOffset(breakdownColIdx: number, numViewDays: number) {
        if (numViewDays === 1) {
            return `calc(50% - ${(DAY_DROPDOWN_WIDTH / 2) - 30}px)`
        }
        else if (numViewDays === 7) {
            return `clamp(10px, calc(((100% / ${numViewDays}) * ${breakdownColIdx}) + 0px), calc(100% - ${DAY_DROPDOWN_WIDTH + 10}px))`
        }
        else {
            return `clamp(10px, calc(((100% / ${numViewDays}) * ${breakdownColIdx}) + 40px), calc(100% - ${DAY_DROPDOWN_WIDTH}px))`
        }
    }
    function toggleViewOption() {
        viewOptionOpen = !viewOptionOpen
    }
    function closeDayBreakdown() {
        breakdownColIdx = -1
        breakdownView = "cores"
    }
    function setBreakdownForDay(dayIdx: number | null) {
        breakdownSettings = false

        if (dayIdx === breakdownColIdx) {
            breakdownOpen = false
        }
        else if (dayIdx != null) {
            breakdownColIdx = dayIdx
            breakdownOpen = true
            manager.setDayBreakdown(dayIdx)
        }
    }
    function setBreakdownView(view: string) {
        breakdownView = view as "cores" | "tags"
        breakdownViewMenu = false
    }
    function parseViewOption(view: "all" | "mtwt" | "fss" | "today") {
        if (view === "today") {
            return "Today"
        }
        else if (view === "mtwt") {
            return "MTWT"
        }
        else if (view === "fss") {
            return "FSS"
        }
        else if (view === "all") {
            return "Weekly"
        }
    }

    /* options */
    function onNewDayRoutine(idx: number) {
        const onCancel = () => {
            breakdownSettings = false
            confirmOptions = null
            breakdownOpen = false
            dailyRoutineContext = null
            manager.setDayBreakdown(null)
        }
        const linkRoutine = () => {
            manager.linkDayRoutine(chosenDayRoutine)
            onCancel()
        }
        
        const chosenDayRoutine = DAILY_ROUTINES[idx]
        const isEmpty = dayBreakdown!.blocksLength === 0

        if (isEmpty) { 
            linkRoutine()
        }
        else {
            confirmOptions = {
                text: "Are you sure you want to replace this routine?",
                onCancel,
                onOk: () => linkRoutine()
            }
        }
    }
    function onDayRoutinesClicked(e: Event) {
        const target = e.target as HTMLElement
        const optnText = target.innerText.trim()

        const onCancel = () => {
            breakdownSettings = false
            confirmOptions = null
            breakdownOpen = false
            dailyRoutineContext = null
        }

        if (optnText === "Unlink routine") {
            confirmOptions = {
                text: "Are you sure you want to unlink this routine?",
                onCancel,
                onOk: () => {
                    manager.unlinkSetDailyRoutine()
                    onCancel()
                },
            }
        }
        else if (optnText === "Link a Routine" || optnText === "Replace Routine") {
            initDailyRoutineContext(optnText)
        }
        else if (optnText === "Clear routine") {
            confirmOptions = {
                text: "Are you sure you want to clear this routine?",
                onCancel,
                onOk: () => {
                    manager.clearDayRoutine()
                    onCancel()
                }
            }
        }
        else if (optnText === "Use template") {
        }
    }
    function initDailyRoutineContext(optnText: string) {
        if (optnText === "Link a Routine") {
            dailyRoutineContext = "Link"
        }
        else if (optnText === "Replace Routine") {
            dailyRoutineContext = "Replace"
        }
        const { left, top } = cursorPos
        const { left: c_left, top: c_top } = containerRef!.getBoundingClientRect()

        const pos = initFloatElemPos({
            dims: { 
                height: 400,
                width: 200
            }, 
            containerDims: { 
                height: containerRef!.clientHeight, 
                width: containerRef!.clientWidth
            },
            cursorPos: {
                left: left - c_left,
                top: top - c_top
            }
        })

        routinesMenuOffset = pos.left
        breakdownSettings = false
    }

    function onDailyRoutineListItemClicked(idx: number) {
        onNewDayRoutine(idx)
    }
</script>

<div 
    class="routine" 
    class:routine--light={light}
    class:routine--isMin={isMin}
    bind:this={containerRef}
>
    <div class="routine__options" class:routine__options--open={viewOptionOpen}>
        <button 
            data-dmenu-id="view-option"
            class="routine__options-dbtn"
            disabled={locked}
            on:click={toggleViewOption}
        >
            <span>
                {parseViewOption(viewOptn)}
            </span>
        </button>
        <DropdownList 
            id="view-option"
            isHidden={!viewOptionOpen} 
            options={{
                pickedItem: parseViewOption(viewOptn),
                listItems: [
                    { name: "Today", rightIcon: { type: "hotkey", icon: ["1"] } }, 
                    { name: "Weekly", rightIcon: { type: "hotkey", icon: ["2"] } }, 
                    { name: "M T W T", rightIcon: { type: "hotkey", icon: ["3"] } }, 
                    { name: "F S S", rightIcon: { type: "hotkey", icon: ["4"] } }
                ],
                position: { 
                    top: "22px", left: containerWidth < 640 ? "0px" : "10px" 
                },
                styling: { 
                    zIndex: 2000 
                },
                onClickOutside: () => {
                    viewOptionOpen = false
                },
                onListItemClicked: ({ idx }) => {
                    manager.updateCurrViewOption(idx)
                    viewOptionOpen = false
                },
            }}
        />
    </div>

    <div class="routine__days-container" on:scroll|preventDefault={preventScroll}>
        <div class="routine__days">
            {#each daysInView as day, idx}
                {@const dayKey = manager.getDayKey(day)}
                {@const linked = isDayRoutinedLinked(weekRoutine, dayKey)}
                <div class="routine__day">
                    <div 
                        class="routine__days-header"
                        class:routine__days-header--active={breakdownColIdx === idx && breakdownOpen}
                        title={linked ? "This routine is linked to a presetdaily routine." : ""}
                    >
                        <button 
                            data-dmenu-id={`day-breakdown--${idx}`}
                            class="routine__days-btn" 
                            class:routine__days-btn--linked={linked}
                            disabled={!weekRoutine}
                            on:click={() => setBreakdownForDay(idx)}
                        >
                            {#if containerWidth < 800}
                                {day.substring(0, 1)}
                            {:else if containerWidth < 1100}
                                {day.substring(0, 3)}
                            {:else}
                                {day}s
                            {/if}
                            {#if weekRoutine}
                                <div 
                                    class="routine__arrow" 
                                    class:routine__arrow--active={breakdownColIdx === idx}
                                >
                                    <SvgIcon 
                                        icon={Icon.Dropdown}
                                        options={{ scale: 1.3, strokeWidth: 1.7 }}
                                    />
                                </div>
                            {/if}
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    {#if dayBreakdown}
        <BounceFade
            dmenuId="day-breakdown"
            isHidden={!breakdownOpen}
            onDismount={closeDayBreakdown}
            zIndex={100}
            onClickOutside={() => {
                breakdownOpen = false
            }}
            position={{ 
                top: "35px", left: breakdownXPos 
            }}
        >
            {@const { linkedRoutine } = dayBreakdown}
            {@const linked = !!linkedRoutine}
            {@const title = linked ? linkedRoutine.name : "Not Linked"}
            <div 
                class="routine__day-breakdown dmenu"
                style:width={`${DAY_DROPDOWN_WIDTH}px`}
                class:routine__day-breakdown--unlinked={!linked}
            >
                <div 
                    class="routine__day-breakdown-header"
                    style:height="23px"
                    class:hidden={!linked}
                >
                    <div 
                        title={title}
                        class="routine__name"
                        class:routine__name--unlinked={!linked}
                    >
                        {title}
                    </div>
                </div>

                <div class="routine__settings-btn">
                    <SettingsBtn 
                        id="day-breakdown-optns"
                        onClick={() => breakdownSettings = !breakdownSettings}
                    />
                </div>
    
                <div class="routine__breakdown-header">
                    <DropdownBtn 
                        id={"day-breakdown"}
                        isActive={breakdownViewMenu}
                        options={{
                            arrowOnHover: true,
                            title: capitalize(breakdownView),
                            onClick: () => {
                                breakdownViewMenu = !breakdownViewMenu
                            },
                            styles: { 
                                fontSize: "1.3rem", 
                                padding: "4px 12px 4px 11px", 
                                margin: "0px 0px 0px -10px"
                            }
                        }} 
                    />
                </div>
    
                <div class="routine__stat-breakdown">
                    {#if breakdownView === "cores"}
                        {@const cores = dayBreakdown.cores}
                        {@const prop = "totalTime"}
    
                        <div class="routine__stats-col">
                            <div class="routine__stat">
                                <div class="routine__stat-title">Sleeping</div>
                                <div class="routine__stat-num">
                                    {formatCoreData(cores.sleeping[prop])}
                                </div>
                            </div>
                            <div class="routine__stat">
                                <div class="routine__stat-title">Awake</div>
                                <div class="routine__stat-num">
                                    {formatCoreData(cores.awake[prop])}
                                </div>
                            </div>
                        </div>
                        <div class="routine__stats-divider"></div>
                        <div class="routine__stats-col">
                            <div class="routine__stat">
                                <div class="routine__stat-title">Working</div>
                                <div class="routine__stat-num">
                                    {formatCoreData(cores.working[prop])}
                                </div>
                            </div>
                            <div class="routine__stat">
                                <div class="routine__stat-title">Self-Care</div>
                                <div class="routine__stat-num">
                                    {formatCoreData(cores.selfCare[prop])}
                                </div>
                            </div>
                        </div>
                        <div class="routine__stats-divider"></div>
                        <div class="routine__stats-col">
                            <div class="routine__stat">
                                <div class="routine__stat-title">Mind</div>
                                <div class="routine__stat-num">
                                    {formatCoreData(cores.mind[prop])}
                                </div>
                            </div>
                            <div class="routine__stat">
                                <div class="routine__stat-title">Body</div>
                                <div class="routine__stat-num">
                                    {formatCoreData(cores.body[prop])}
                                </div>
                            </div>
                        </div>
                    {:else}
                        {#each dayBreakdown.tags as tagData, idx}
                            {@const data = tagData.data}
                            <div class="routine__stat routine__stat--tag">
                                <div class="routine__stat-title-container">
                                    <span style:font-size="1.185rem">
                                        {tagData.tag.symbol.emoji}
                                    </span>
                                    <div class="routine__stat-title">
                                        {tagData.tag.name}
                                    </div>
                                </div>
                                <div class="routine__stat-num">
                                    {minsToHHMM(data.totalTime)}
                                </div>
                            </div>
                            {#if (idx + 1) % 2 === 0 && idx !== dayBreakdown.tags.length - 1}
                                <div class="routine__stats-divider"></div>
                            {/if}
                        {:else}
                            <div class="routine__breakdown-empty">
                                Empty
                            </div>
                        {/each}
                    {/if}
                </div>                 
                
                <DropdownList 
                    id={"day-breakdown"}
                    isHidden={!breakdownViewMenu} 
                    options={{
                        listItems: [
                            { name: "Cores" }, { name: "Tags" }
                        ],
                        pickedItem: breakdownView,
                        position: { 
                            top: "50px", left: "10px"
                        },
                        styling:  { 
                            width: "80px" 
                        },
                        onClickOutside: () => {
                            breakdownViewMenu = false
                        },
                        onListItemClicked: ({ name }) => setBreakdownView(name.toLowerCase())
                    }}
                />
    
                <DropdownList 
                    id="day-breakdown-optns"
                    isHidden={!breakdownSettings} 
                    options={{
                        listItems: [
                            { 
                                name: linked ? "Replace Routine" : "",
                                rightIcon: {
                                    type: "svg",
                                    icon: Icon.ChevronRight
                                }
                            },
                            { 
                                name: linked ? "Unlink Routine" : "",
                                divider: dayBreakdown.blocksLength > 0
                            },
                            {
                                name: !linked ? "Link a Routine" : "",
                                divider: dayBreakdown.blocksLength > 0,
                                rightIcon: {
                                    type: "svg",
                                    icon: Icon.ChevronRight
                                }
                            },
                            {
                                name: dayBreakdown.blocksLength > 0 ? "Clear routine" : ""
                            }
                        ],
                        position: { 
                            top: "30px", right: "10px"
                        },
                        styling:  { 
                            minWidth: "140px" 
                        },
                        onListItemClicked: ({ event }) => {
                            onDayRoutinesClicked(event)
                        },
                        onClickOutside: () => {
                            breakdownSettings = false
                        },
                        rootRef: containerRef
                    }}
                />
    
            </div>
        </BounceFade>
    {/if}
</div>

<BounceFade
    isHidden={!dailyRoutineContext}
    zIndex={500}
    onClickOutside={() => {
        dailyRoutineContext = null
    }}
    position={{ 
        top: "45px", left: `${routinesMenuOffset}px` 
    }}
>
    <ul 
        data-dmenu-id="day-routines"
        class="dmenu"
        class:dmenu--light={light}
        style:min-width={"100px"}
        style:--font-size="1.3rem"
    >
        <li class="dmenu__section-name">
            {dailyRoutineContext === "Link" ? "Link a Routine" : "Replace Routine"}
        </li>

        <div
            style:max-height="300px"
            style:overflow="scroll"
        >
            {#each DAILY_ROUTINES as routine, idx}
                {@const selected = dayBreakdown?.linkedRoutine?.name === routine.name}
                <li 
                    class="dmenu__option"
                    class:dmenu__option--selected={selected}
                >
                    <button 
                        class="dmenu__option-btn" 
                        on:click={() => onDailyRoutineListItemClicked(idx)}
                    >
                        <span class="dmenu__option-text">
                            {routine.name}
                        </span>
                        {#if selected}
                            <DropdownOptionIcon dir="r" icon={{ type: "check" }}/>
                        {/if}
                    </button>
                </li>
            {/each}
        </div>
    </ul>
</BounceFade>

{#if confirmOptions} 
    <ConfirmationModal {...confirmOptions} />
{/if}

<style lang="scss">
    @use "../../../../scss/components/routines.scss" as *;
    @use "../../../../scss/dropdown.scss" as *;

    .routine {
        width: 100%;
        height: 43px;
        border-bottom: var(--divider-border);
        display: flex;
        align-items: center;

        $hr-col-width--min: 40px;
        --day-btn-opacity: 0.8;
        --breakdown-border-opacity: 0.05;
        
        &--light {
            --day-btn-opacity: 1;
            --breakdown-border-opacity: 0.145;
        }
        &--light &__day-breakdown {
            @include contrast-bg("bg-2");
        }
        &--isMin {
            padding: 0px;
            border-top: var(--divider-border);
        }
        &--isMin &__days-container {
            width: 100%;
            margin-left: 0px;
        }
        &--isMin &__options {
            width: $hr-col-width--min;
            padding-left: 0px;
        }
        &__options {
            width: 60px;
            position: relative;
            @include center;
        }
        &__options button {
            position: relative;
            transition: 0.2s transform cubic-bezier(.4,0,.2,1);
            padding: 2px 4px;
            opacity: 0.5;
            @include flex(center);
            @include text-style(0.65, var(--fw-400-500), 1.1rem);

            &:hover {
                opacity: 0.85;
            }
        }
        &__days {
            display: flex;
            justify-content: space-between;
            min-width: var(--min-width);
            width: 100%;
            position: absolute;
        }
        &__days-container {
            width: calc(100% - 60px);
            margin-top: 8px;
            height: 35px;
            position: relative;
            overflow: hidden;
        }
        &__day {
            width: calc((100% / var(--days-length)));
            position: relative;
            @include center;
        }
        &__days-header {
            height: 25px;
            width: 100%;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        &__days-btn {
            position: relative;
            padding: 4px 4px;
            @include flex(center);
            @include text-style(var(--day-btn-opacity), var(--fw-400-500), 1.2rem, "Geist Mono");
                        
            &:hover {
                opacity: 0.75;
            }
            &--linked::before {
                content: "*";
                @include abs-top-left(3px, -14px);
                @include text-style(0.35, 200, 2rem, "Geist Mono");
            }
        }
        &__days-btn:hover &__arrow {
            @include visible(0.45);
        }
        &__arrow {
            margin-left: 7px;
            transition: 0.2s cubic-bezier(.4,0,.2,1);
            transform: rotate(0deg);
            opacity: 0.35;
            @include abs-top-right(5px, -14px);
            @include not-visible;

            &--active {
                transform: rotate(90deg);
            }
        }
        &__name {
            @include text-style(0.6, var(--fw-400-500), 1.35rem);
            @include elipses-overflow;
            max-width: calc(100% - 30px);
        }
        &__name--unlinked {
            opacity: 0.75;
        }
        &__settings-btn {
            transform: scale(1);
            @include abs-top-right(4px, 12px);
        }
        &__stat-breakdown {
            position: relative;
            padding-top: 5px;
        }
        &__day-breakdown {
            min-width: 210px;
            width: auto !important;
            overflow: visible;
            padding: 5px 16px 15px 14px;
            border: none !important;
        }
        &__day-breakdown-header {
            @include flex(center, space-between);
            position: relative;
            width: calc(100% + 2px);
            margin: 2px 0px 4px 0px;
        }
    }
    .dmenu__option-btn {
        max-width: 240px;
    }
    .dmenu__option--selected .dmenu__option-text {
        max-width: calc(100% - 30px);
        @include elipses-overflow;
    }
</style>