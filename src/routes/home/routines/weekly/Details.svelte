<script lang="ts">
    import { themeState, weekRoutine as setWeekRoutine } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { minsToHHMM } from "$lib/utils-date"
	import { TextEditorManager } from "$lib/inputs"
	import { capitalize } from "$lib/utils-general"
	import { formatCoreData } from "$lib/utils-routines"
	import { RoutinesManager } from "$lib/routines-manager"
	import { WeeklyRoutinesManager } from "$lib/routines-weekly-manager"
    
	import SvgIcon from "$components/SVGIcon.svelte"
	import NewRoutineModal from "../NewRoutineModal.svelte"
	import BounceFade from "$components/BounceFade.svelte"
	import DropdownBtn from "$components/DropdownBtn.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import ConfirmationModal from "$components/ConfirmationModal.svelte"

    export let WEEK_ROUTINES: WeeklyRoutine[]
    export let manager: WeeklyRoutinesManager
    export let isMin: boolean

    const WK_ROUTINES_SETTINGS_DROPDOWN_WIDTH  = 140

    let listRef: HTMLElement
    let detailsHeight = 0
    let breakdownHeight = 0

    let titleInput:  TextEditorManager
    let description: TextEditorManager

    let editRoutineIdx = -1
    let setRoutineIdx = WEEK_ROUTINES.length > 0 ? 0 : -1
    let viewRoutineIdx = setRoutineIdx
    let setId: string | null = null
    
    /* breakdown */
    let breakdownView = "cores"
    let wkBreakdownVal: "avg" | "sum" = "avg"

    /* settings*/
    let clickedRoutineIdx = -1
    let routinesOpen = true
    let newRoutineModal = false
    let routinesMenuOpen = false
    let routineMenuPos = { left: 0, top: 0 }
    let breakdownOptnOpen = false

    /* stores */
    let _weekRoutine = manager.weekRoutine
    let _coreBreakdown = manager.coreBreakdown
    let _tagBreakdown = manager.tagBreakdown
    let _editContext = manager.editContext
    
    $: weekRoutine = $_weekRoutine
    $: coreBreakdown = $_coreBreakdown
    $: tagBreakdown = $_tagBreakdown
    $: editContext = $_editContext
    
    $: light = !$themeState.isDarkTheme
    $: detailsMaxHt = `calc(100% - ${detailsHeight + breakdownHeight + 100}px)`
    
    $: routinesOpen = isMin ? false : true
    $: initTextEditors(weekRoutine)

    let confirmOptions: {
        text: string,
        onCancel: FunctionParam,
        onOk: FunctionParam,
        options: ConfirmOptions,
    } | null = null

    /* edits */

    function initTextEditors(routine: WeeklyRoutine | null) {
        if (!routine || setId === routine.id) return

        setId = routine.id

        titleInput = new TextEditorManager({ 
            initValue: routine.name,
            placeholder: "Routine Title",
            maxLength: RoutinesManager.MAX_TITLE,
            id: "routine-title",
            doAllowEmpty: false,
            handlers: {
                onBlurHandler: (_, val) => {
                    manager.updateTitle(val)
                    WEEK_ROUTINES = WEEK_ROUTINES.map((routine, idx) => idx != viewRoutineIdx ? routine : { 
                        ...routine!, name: val 
                    })
                }
            }
        })
        description = new TextEditorManager({ 
            initValue: routine.description,
            placeholder: "Type description here...",
            maxLength: RoutinesManager.MAX_DESCRIPTION,
            id: "routine-description",
            handlers: {
                onBlurHandler: (_, val) => {
                    manager.updateDescription(val)
                    WEEK_ROUTINES = WEEK_ROUTINES.map((routine, idx) => idx != viewRoutineIdx ? routine : { 
                        ...routine!, description: val 
                    })
                }
            }
        })
    }

    function onRoutineContextMenu(e: Event, routineIdx: number) {
        if (editContext === "duplicate") {
            manager.closeDuplicateEdit()
        }

        const pe = e as PointerEvent
        pe.preventDefault()

        const container = listRef
        const rect = container.getBoundingClientRect()
        const top  = pe.clientY - rect.top

        clickedRoutineIdx = routineIdx

        let left = pe.clientX - rect.left

        if (isMin) {
            const dropdownWidth = WK_ROUTINES_SETTINGS_DROPDOWN_WIDTH
            const distFromRight = window.innerWidth - pe.clientX
            const cutOff = dropdownWidth - distFromRight

            if (cutOff > 0) {
                left -= cutOff + 10
            }
        }
        
        editRoutineIdx = routineIdx
        routinesMenuOpen = true
        routineMenuPos = { top, left }
    }

    function onSettingOptnClicked(itemIdx: number, optn: string) {
        const isChosen = itemIdx === setRoutineIdx

        if (optn === "Unselect Routine" && isChosen) {
            editRoutineIdx = -1
            setRoutineIdx = -1

            setWeekRoutine.set(null)
        }
        else if (optn === "Choose as Current") {
            editRoutineIdx = -1
            setRoutineIdx = itemIdx

            setWeekRoutine.set(WEEK_ROUTINES[itemIdx])
        }
        else if (optn === "Delete Routine") {
            confirmOptions = {
                text: "Are you sure you want to proceed with deleting this weekly routine?",
                onOk: onDeleteRoutine,
                onCancel: () => {
                    confirmOptions = null
                    editRoutineIdx = -1
                },
                options: { 
                    ok: "Delete", caption: "Heads Up!", type: "delete"  
                }
            }
        }

        routinesOpen = !isMin
        routinesMenuOpen = false
    }

    /* routines */
    function onAddRoutine(newRoutine: WeeklyRoutine | null) {
        newRoutineModal = false
        if (!newRoutine) return
        
        WEEK_ROUTINES.push(newRoutine)
        WEEK_ROUTINES = WEEK_ROUTINES

        if (WEEK_ROUTINES.length === 1) {
            onRoutineClicked(0)
        }
    }
    function onDeleteRoutine() {
        confirmOptions = null
        WEEK_ROUTINES = WEEK_ROUTINES.filter((_, routineIdx) => routineIdx != editRoutineIdx)

        if (setRoutineIdx === editRoutineIdx) {
            setRoutineIdx = -1
        }
        if (editRoutineIdx === viewRoutineIdx) {
            editRoutineIdx = -1
            viewRoutineIdx = -1

            manager.updateCurrentWeekRoutine(null)
            setWeekRoutine.set(null)
        }

        toast("success", { message: "Weekly routine deleted." })
    }
    function onRoutineClicked(routineIdx: number) {
        if (editContext === "duplicate") {
            manager.closeDuplicateEdit()
        }
        if (routineIdx === viewRoutineIdx) {
            return
        }
        if (isMin) {
            routinesOpen = false
        }
        
        viewRoutineIdx = routineIdx
        manager.updateCurrentWeekRoutine(WEEK_ROUTINES[routineIdx])
    }

    function setBreakdownView(name: string) {
        breakdownView = name as "cores" | "tags"
        breakdownOptnOpen = false
    }
</script>


<div 
    class="routine"
    class:routine--light={light}
    class:routine--narrow={isMin}
>
    {#if weekRoutine}
        <div class="routine__details" bind:clientHeight={detailsHeight}>
            <div class="routine__details-header">
                <div 
                    id={titleInput.id}
                    class="routine__title text-editor"
                    class:starred={setRoutineIdx === viewRoutineIdx}
                    aria-label="Title"
                    contenteditable
                    spellcheck="false"
                    data-placeholder={titleInput.placeholder}
                    bind:textContent={titleInput.value}
                >
                </div>
            </div>
            <div 
                id={description.id}
                class="routine__description text-editor"
                aria-label="Description"
                contenteditable
                spellcheck="false"
                data-placeholder={description.placeholder}
                bind:textContent={description.value}
            >
            </div>
        </div>
        <div class="routine__breakdown" bind:clientHeight={breakdownHeight}>
        <div class="routine__breakdown-header">
            <DropdownBtn 
                id={"breakdown-option"}
                isActive={breakdownOptnOpen}
                options={{
                    title: capitalize(breakdownView),
                    arrowOnHover: true,
                    styles: { 
                        fontSize: "1.3rem", 
                        padding: "4px 12px 4px 11px",
                        margin: "0px 0px 0px -10px",
                        fontFamily: "Geist Mono"
                    },
                    onClick: () => { 
                        breakdownOptnOpen = !breakdownOptnOpen
                    }
                }}
            />
            <div class="routine__breakdown-btns">
                <button 
                    class="routine__breakdown-btn" 
                    class:full-opacity={wkBreakdownVal === "avg"}
                    on:click={() => wkBreakdownVal = "avg"}
                >
                    Avg
                </button>
                <button 
                    class="routine__breakdown-btn" 
                    class:full-opacity={wkBreakdownVal === "sum"}
                    on:click={() => wkBreakdownVal = "sum"}
                >
                    Sum
                </button>
            </div>
            <DropdownList 
                id={"breakdown-option"}
                isHidden={!breakdownOptnOpen} 
                options={{
                    listItems: [
                        { name: "Cores" }, { name: "Tags" }
                    ],
                    pickedItem: breakdownView,
                    position: { 
                        top: "32px", left: "10px" 
                    },
                    styling:  { 
                        width: "80px" 
                    },
                    onClickOutside: () => { 
                        breakdownOptnOpen = false
                    },
                    onListItemClicked: ({ name }) => {
                        setBreakdownView(name.toLowerCase())
                    }
                }}
            />
        </div>
        <!-- Cores -->
            <div class="routine__stat-breakdown">
                {#if breakdownView === "cores"}
                    <div>
                        {#if coreBreakdown}
                            {@const prop = wkBreakdownVal === "avg" ? "avgTime" : "totalTime"}
                            <div class="routine__stats-col">
                                <div class="routine__stat">
                                    <div class="routine__stat-title">Sleeping</div>
                                    <div class="routine__stat-num">
                                        {formatCoreData(coreBreakdown.sleeping[prop])}
                                    </div>
                                </div>
                                <div class="routine__stat">
                                    <div class="routine__stat-title">Awake</div>
                                    <div class="routine__stat-num">
                                        {formatCoreData(coreBreakdown.awake[prop])}
                                    </div>
                                </div>
                            </div>
                            <div class="routine__stats-divider"></div>
                            <div class="routine__stats-col">
                                <div class="routine__stat">
                                    <div class="routine__stat-title">Working</div>
                                    <div class="routine__stat-num">
                                        {formatCoreData(coreBreakdown.working[prop])}
                                    </div>
                                </div>
                                <div class="routine__stat">
                                    <div class="routine__stat-title">Self-Care</div>
                                    <div class="routine__stat-num">
                                        {formatCoreData(coreBreakdown.selfCare[prop])}
                                    </div>
                                </div>
                            </div>
                            <div class="routine__stats-divider"></div>
                            <div class="routine__stats-col">
                                <div class="routine__stat">
                                    <div class="routine__stat-title">Mind</div>
                                    <div class="routine__stat-num">
                                        {formatCoreData(coreBreakdown.mind[prop])}
                                    </div>
                                </div>
                                <div class="routine__stat">
                                    <div class="routine__stat-title">Body</div>
                                    <div class="routine__stat-num">
                                        {formatCoreData(coreBreakdown.body[prop])}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {:else}
                    {#each tagBreakdown as tagData, idx}
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
                                {minsToHHMM(wkBreakdownVal === "avg" ? data.avgTime : data.totalTime)}
                            </div>
                        </div>
                        {#if (idx + 1) % 2 === 0 && idx !== tagBreakdown.length - 1}
                            <div class="routine__stats-divider"></div>
                        {/if}
                    {:else}
                        <div class="routine__breakdown-empty">
                            Empty
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    {/if}

    <div 
        class="routine__routines"
        style:--routines-height={`${isMin || WEEK_ROUTINES.length === 0 ? "auto" : detailsMaxHt}`}
        bind:this={listRef}
    >
        <div class="routine__routines-header">
            <div class="routine__routines-left">
                {#key isMin}
                    <DropdownBtn
                        id="routines-list"
                        isActive={routinesOpen}
                        options={{
                            title: "Routines",
                            noBg: true,
                            arrowOnHover: true,
                            onClick: () => { 
                                routinesOpen = !routinesOpen
                                routinesMenuOpen = false
                            },
                            styles: { 
                                fontSize: "1.385rem",
                                padding: "4px 2px 4px 11px", 
                                margin: "0px 0px 0px -10px"
                            }
                        }} 
                    />
                {/key}
                <button 
                    class="routine__routines-addbtn"
                    on:click={() => newRoutineModal = true}
                >
                    <SvgIcon 
                        icon={Icon.Add} 
                        options={{ scale: 1, strokeWidth: 1.8 }} 
                    />
                </button>
            </div>
            <span class="routine__routines-count">
                {WEEK_ROUTINES.length}
            </span>
        </div>

        <BounceFade
            id="routines-list--dmenu"
            zIndex={100}
            isHidden={!routinesOpen}
            isAnim={isMin}
            onClickOutside={() => {
                if (isMin) {
                    routinesOpen = false
                    routinesMenuOpen = false
                }
            }}
        >
            <ul class="routine__routines-list"
                style:--routines-dropdown-max-height={`${isMin ? "auto" : "calc(100% - 80px)"}`}
            >
                {#each WEEK_ROUTINES as weekRoutine, idx}
                    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
                    <li 
                        role="button"
                        tabindex="0"
                        class="routine-item"
                        class:routine-item--clicked={idx === viewRoutineIdx}
                        class:routine-item--active={idx === clickedRoutineIdx}
                        class:routine-item--chosen={idx === setRoutineIdx}
                        on:click={() => onRoutineClicked(idx)}
                        on:contextmenu={(e) => onRoutineContextMenu(e, idx)}
                        on:keydown={(e) => {
                            if (e.key === 'Enter' || e.code == "Space") {
                                e.preventDefault()
                                onRoutineClicked(idx);
                            }
                        }}
                    >
                        <span>{weekRoutine.name}</span>
                        <i class="fa-solid fa-check"></i>
                    </li>
                {/each}
                {#if WEEK_ROUTINES.length === 0}
                    <span class="routine__collection-empty">
                        Empty
                    </span>
                {/if}
            </ul>
        </BounceFade>

        <DropdownList
            id={"routines"}
            isHidden={!routinesMenuOpen}
            options={{
                listItems: [
                    {  name: editRoutineIdx === setRoutineIdx ? "Unselect Routine" : "Choose as Current" },
                    {  name: "Delete Routine"  }
                ],
                onListItemClicked: ({ name }) => {
                    onSettingOptnClicked(editRoutineIdx, name)
                    clickedRoutineIdx = -1
                },
                onClickOutside: () => {
                    routinesMenuOpen = false
                    clickedRoutineIdx = -1
                },
                styling: { 
                    width: "140px", zIndex: 2001 
                },
                position: {
                    top: routineMenuPos.top + "px",
                    left: routineMenuPos.left + "px"
                }
            }}
        />
    </div>
</div>

{#if confirmOptions} 
    <ConfirmationModal 
        text={confirmOptions.text}
        onCancel={confirmOptions.onCancel}
        onOk={confirmOptions.onOk}
        options={confirmOptions.options}
    /> 
{/if}

{#if newRoutineModal}
    <NewRoutineModal 
        onFinishEdit={onAddRoutine}
        isForWeek={true}
        bounds={{ 
            titleMax: RoutinesManager.MAX_TITLE, 
            descrMax: RoutinesManager.MAX_DESCRIPTION
        }}
    />
{/if}


<style lang="scss">
    @import "../../../../scss/inputs.scss";
    @import "../../../../scss/day-box.scss";
    @import "../../../../scss/dropdown.scss";
    @import "../../../../scss/components/routines.scss";

    $hr-col-height: 50px;
    $hr-col-width: 60px;
    $hr-col-width--min: 40px;

    .routine {
        &--light &__description {
            @include text-style(0.65);
        }
        &--light &__chosen-routine {
            @include text-style(0.4);
        }
        &--light &__week {
            border-left: 1px solid rgba(var(--textColor1), 0.08);
        }
        &--narrow {
            width: calc(100% - 20px) !important;
        }
        &--narrow &__details {
            margin-bottom: 0px;
        }
        &--narrow &__title {
            max-height: 30px;
            max-width: calc(100% - 60px);
            @include truncate-lines(1);
        }
        &--narrow &__description {
            height: 40px;
            overflow: scroll;
        }
        &--narrow &__breakdown {
            display: none;
        }
        &--narrow &__routines-count {
            display: none;
        }
        &--narrow &__routines {
            @include abs-top-right(8px, -25px);
            width: 120px;
            margin: 0px;
            height: auto;
        }
        &--narrow &__routines-left {
            flex-direction: row-reverse;
        }
        &--narrow &__routines-left button {
            margin-right: 4px;
        }
        &--narrow &__routines-list {
            width: 190px;
            margin: 0px 0px 0px -90px;
            max-height: 300px;
            padding: 6px 18px 6px 12px;
            border-radius: 8px;
            height: auto;
            @include contrast-bg("bg-3");
        }

        padding-top: 15px;
        width: 280px;
        position: relative;

        &__details {
            width: 90%;
        }
        &__title.starred::after {
            bottom: -6px;
            right: -1px;
        }
        &__week {
            height: calc(100% - 55px);
            width: calc(100% - 280px);
            border-left: 1px solid rgba(var(--textColor1), 0.04);
            overflow: hidden;
            position: relative;
        }
    }
</style>

