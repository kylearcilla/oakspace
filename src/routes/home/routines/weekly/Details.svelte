<script lang="ts">
    import { v4 as uuidv4 } from 'uuid'
    import { themeState, weekRoutine as setWeekRoutine } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { minsToHHMM } from "$lib/utils-date"
	import { TextEditorManager } from "$lib/inputs"
	import { formatCoreData } from "$lib/utils-routines"
	import { RoutinesManager } from "$lib/routines-manager"
	import { WeeklyRoutinesManager } from "$lib/routines-weekly-manager"
	import { capitalize, decrementIdx, insertItemArr, randomArrayElem, removeItemArr } from "$lib/utils-general"
    
	import SvgIcon from "$components/SVGIcon.svelte"
	import EmptyList from "$components/EmptyList.svelte"
	import BounceFade from "$components/BounceFade.svelte"
	import NewRoutineModal from "../NewRoutineModal.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte"
	import DropdownBtn from "$components/DropdownBtn.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import ConfirmationModal from "$components/ConfirmationModal.svelte"

    export let routines: WeeklyRoutine[]
    export let manager: WeeklyRoutinesManager
    export let isMin: boolean

    const WK_ROUTINES_SETTINGS_DROPDOWN_WIDTH  = 140
    const EMPTY_LIST_SUGGESTIONS = [
        "🌿 Wellness Routine",
        "🌱 Flow Routine",
        "💪 Grind Routine",
        "🧘🏼‍♂️ Balanced Routine",
        "☀️ Summer Body Routine",
        "🌻 Slow Summer Routine",
        "📝 Creative Routine",
        "🍃 Slow Routine"
    ]

    let listRef: HTMLElement
    let detailsHeight = 0
    let breakdownHeight = 0
    let loading = false
    let confirmOptions = false

    let titleInput:  TextEditorManager
    let description: TextEditorManager

    let contextIdx = -1
    let setIdx = routines.length > 0 ? 0 : -1
    let editIdx = setIdx
    let setId: string | null = null
    
    /* breakdown */
    let breakdownView = "cores"
    let wkBreakdownVal: "avg" | "sum" = "avg"

    /* settings */
    let routinesOpen = true
    let routinesMenuOpen = false
    let routineMenuPos = { left: 0, top: 0 }

    let newRoutineModal = false
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

    /* edits */

    function initTextEditors(routine: WeeklyRoutine | null) {
        if (!routine || setId === routine.id) return

        setId = routine.id

        titleInput = new TextEditorManager({ 
            initValue: routine.name,
            placeholder: "Routine Title",
            maxLength: RoutinesManager.MAX_TITLE,
            id: "routine-title",
            singleLine: true,
            doAllowEmpty: false,
            handlers: {
                onBlurHandler: (_, val) => {
                    const routine = routines[editIdx]

                    manager.updateTitle(val)
                    routines = routines.map((r) => r.id === routine.id ? {  ...r, name: val } : r)
                }
            }
        })
        description = new TextEditorManager({ 
            initValue: routine.description,
            placeholder: "Type description here...",
            singleLine: true,
            maxLength: RoutinesManager.MAX_DESCRIPTION,
            id: "routine-description",
            handlers: {
                onBlurHandler: (_, val) => {
                    const routine = routines[editIdx]

                    manager.updateDescription(val)
                    routines = routines.map((r) => r.id === routine.id ? {  ...r, description: val } : r)
                }
            }
        })
    }

    function openContextMenu(e: Event, routineIdx: number) {
        if (editContext === "duplicate") {
            manager.closeDuplicateEdit()
        }
        const pe = e as PointerEvent
        pe.preventDefault()

        const container = listRef
        const rect = container.getBoundingClientRect()
        const top  = pe.clientY - rect.top + 15
        let left = pe.clientX - rect.left - 40

        if (isMin) {
            const dropdownWidth = WK_ROUTINES_SETTINGS_DROPDOWN_WIDTH
            const distFromRight = window.innerWidth - pe.clientX
            const cutOff = dropdownWidth - distFromRight

            if (cutOff > 0) {
                left -= cutOff + 10
            }
        }
        
        contextIdx = routineIdx
        routinesMenuOpen = true
        routineMenuPos = { top, left }
    }

    function onSettingOptnClicked(itemIdx: number, optn: string) {
        const isChosen = itemIdx === setIdx

        if (optn === "Unset" && isChosen) {
            contextIdx = -1
            setIdx = -1
            setWeekRoutine.set(null)
        }
        else if (optn === "Set as Current") {
            contextIdx = -1
            setIdx = itemIdx

            setWeekRoutine.set(routines[itemIdx])
        }
        else if (optn === "Duplicate" && !loading) {
            loading = true
            contextIdx = -1
            const newRoutine = structuredClone(routines[contextIdx])
            
            const promise = () => new Promise<void>((resolve) => setTimeout(() => {
                loading = false
                newRoutine.id = uuidv4()
                newRoutine.idx = newRoutine.idx + 1
                
                routines = insertItemArr({ array: routines, item: newRoutine })
                resolve()
            }, 2000))

            toast("promise", { loading: `Duplicating "${newRoutine.name}...` }, promise())
        }
        else if (optn === "Delete") {
            confirmOptions = true
        }
        routinesOpen = !isMin
        routinesMenuOpen = false
    }

    /* routines */

    function onAddRoutine(newRoutine: WeeklyRoutine | DailyRoutine | null) {
        newRoutineModal = false
        if (!newRoutine) return

        const empty = routines.length === 0
        routines.push(newRoutine as WeeklyRoutine)
        routines = routines


        if (empty) {
            requestAnimationFrame(() => onRoutineClicked(0))
        }
    }
    function deleteRoutine() {
        const routine = routines[contextIdx]
        const name = routine.name
        const itemIdx = contextIdx
        const inView = editIdx === contextIdx
        const inSet = setIdx === contextIdx

        confirmOptions = false
        routines = removeItemArr({ array: routines, itemIdx })

        if (inSet) {
            setIdx = -1
            setWeekRoutine.set(null)
        }
        if (inView) {
            editIdx = decrementIdx(editIdx, routines.length)
            manager.setViewRoutine(editIdx >= 0 ? routines[editIdx] : null)
        }
        
        toast("default", {
            message: `"${name}" deleted.`,
            contextId: "routines",
            groupExclusive: true,
            action: {
                label: "Undo",
                onClick: () => {
                    routines = insertItemArr({ array: routines, item: routine })

                    if (inSet) {
                        setIdx = itemIdx
                        setWeekRoutine.set(routine)
                    }
                    if (inView) {
                        editIdx = itemIdx
                        manager.setViewRoutine(routine)
                    }
                }
            }
        })
    }
    function onRoutineClicked(routineIdx: number) {
        if (editContext === "duplicate") {
            manager.closeDuplicateEdit()
        }
        if (routineIdx === editIdx) {
            return
        }
        if (isMin) {
            routinesOpen = false
        }
        editIdx = routineIdx
        manager.setViewRoutine(routines[routineIdx])
    }

    function setBreakdownView(name: string) {
        breakdownView = name as "cores" | "tags"
        breakdownOptnOpen = false
    }
    
</script>

<div 
    class="routine"
    class:routine--light={light}
    class:routine--min={isMin}
    class:routine--empty={routines.length === 0}
>
    {#if weekRoutine}
        <div class="routine__details" bind:clientHeight={detailsHeight}>
            <div class="routine__details-header">
                <div 
                    id={titleInput.id}
                    class="routine__title text-editor"
                    class:starred={setIdx === editIdx}
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
        style:--routines-height={`${isMin || routines.length === 0 ? "auto" : detailsMaxHt}`}
        bind:this={listRef}
    >
        <div class="routine__routines-header">
            <div class="routine__routines-left">
                {#key isMin}
                    <DropdownBtn
                        id="routines-list"
                        isActive={routinesOpen}
                        options={{
                            title: "Items",
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
            <span class="routine__routines-count" style:margin-right="6px">
                {routines.length}
            </span>
        </div>

        <BounceFade
            id="routines-list--dmenu"
            zIndex={100}
            isHidden={!routinesOpen && routines.length > 0}
            isAnim={isMin}
            onClickOutside={() => {
                if (isMin) {
                    routinesOpen = false
                    routinesMenuOpen = false
                }
            }}
        >
            <ul 
                class="routine__routines-list"
                style:width={routines.length === 0 ? "210px" : "260px"}
                style:--routines-dropdown-max-height={`${isMin ? "auto" : "calc(100% - 80px)"}`}
            >
                {#each routines.sort((a, b) => a.idx - b.idx) as routine, idx (routine.id)}
                    <li 
                        class="routine-item"
                        class:routine-item--clicked={idx === editIdx}
                        class:routine-item--active={idx === contextIdx}
                        class:routine-item--chosen={idx === setIdx}
                    >
                        <button
                            on:click={() => {
                                onRoutineClicked(idx)
                            }}
                            on:keydown={(e) => {
                                if (e.key === 'Enter' || e.code == "Space") {
                                    e.preventDefault()
                                    onRoutineClicked(idx);
                                }
                            }}
                        >
                            <span>
                                {routine.name}
                            </span>
                        </button>
                        <div class="routine-item__settings-btn">
                            <SettingsBtn 
                                id={"routines"}
                                onClick={(e) => openContextMenu(e, idx)}
                            />
                        </div>
                    </li>
                {:else}
                    {@const subtitle = randomArrayElem(EMPTY_LIST_SUGGESTIONS)}
                    <div style:margin="28px 12px 0px 0px">
                        <EmptyList 
                            loading={false}
                            emptyText="No Weekly Routines"
                            subtitle={subtitle}
                            buttonText="Add a Routine"
                            onButtonClick={() => newRoutineModal = true}
                        />
                    </div>
                {/each}
            </ul>
        </BounceFade>

        <DropdownList
            id={"routines"}
            isHidden={!routinesMenuOpen}
            options={{
                listItems: [
                    {  name: contextIdx === setIdx ? "Unset" : "Set as Current" },
                    {  name: "Duplicate", divider: true },
                    {  name: "Delete"  }
                ],
                onListItemClicked: ({ name }) => {
                    onSettingOptnClicked(contextIdx, name)
                },
                onClickOutside: () => {
                    routinesMenuOpen = false
                    contextIdx = -1
                },
                styling: { 
                    zIndex: 2001 
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
        type="delete" 
        text="Are you sure you want to proceed with deleting this weekly routine?"
        onOk={deleteRoutine}
        onCancel={() => {
            confirmOptions = false
            contextIdx = -1
        }}
    /> 
{/if}

{#if newRoutineModal}
    <NewRoutineModal type="weekly" onFinishEdit={onAddRoutine} />
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
        &--min {
            width: calc(100% + 10px) !important;
        }
        &--min &__title {
            max-height: 30px;
            max-width: calc(100% - 60px);
            @include truncate-lines(1);
        }
        &--min &__description {
            height: 40px;
            overflow: scroll;
        }
        &--min &__breakdown {
            display: none;
        }
        &--min &__routines-count {
            display: none;
        }
        &--min &__routines {
            @include abs-top-right(8px, -25px);
            width: 120px;
            margin: 0px;
            height: auto;
        }
        &--min &__routines-left {
            flex-direction: row-reverse;
        }
        &--min &__routines-left button {
            margin-right: 4px;
        }
        &--min &__routines-list {
            width: 200px !important;
            margin: 0px 0px 0px -130px;
            max-height: 300px;
            padding: 6px 18px 6px 12px;
            border-radius: 8px;
            overflow-y: scroll;
            height: auto;
            @include contrast-bg("bg-3");
        }
        &--empty {
            width: 220px;
        }
 
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

