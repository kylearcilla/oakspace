<script lang="ts">
    import { v4 as uuidv4 } from 'uuid'
    import { themeState, weekRoutine as setWeekRoutine } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { minsToHHMM } from "$lib/utils-date"
	import { TextEditorManager } from "$lib/inputs"
	import { formatCoreData } from "$lib/utils-routines"
	import { WeeklyRoutinesManager } from "$lib/routines-weekly-manager"
	import { capitalize, decrementIdx, insertItemArr, randomArrayElem, removeItemArr, reorderItemArr } from "$lib/utils-general"
    
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

    const { MAX_TITLE, MAX_DESCRIPTION } = WeeklyRoutinesManager
    const TITLE_ID = "routine-title"
    const DESCRIPTION_ID = "routine-description"
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

    let contextId: string = ""
    let editId: string = ""
    let setId: string = ""
    let idRef: string = ""

    let srcId: string = ""
    let targetId: string = ""
    
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

    $: {
        setId = $setWeekRoutine?.id || ""
        editId = weekRoutine?.id || ""
    }

    /* edits */

    function initTextEditors(routine: WeeklyRoutine | null) {
        if (!routine || idRef === routine.id) return

        idRef = routine.id

        titleInput = new TextEditorManager({ 
            id: TITLE_ID,
            initValue: routine.name,
            placeholder: "Routine Title",
            maxLength: MAX_TITLE,
            singleLine: true,
            doAllowEmpty: false,
            handlers: {
                onBlurHandler: (_, val) => {
                    const routine = routines.find(r => r.id === editId)
                    if (!routine) return

                    manager.updateTitle(val)
                    routines = routines.map((r) => r.id === routine.id ? {  ...r, name: val } : r)
                }
            }
        })
        description = new TextEditorManager({ 
            id: DESCRIPTION_ID,
            initValue: routine.description,
            placeholder: "Type description here...",
            singleLine: true,
            maxLength: MAX_DESCRIPTION,
            handlers: {
                onBlurHandler: (_, val) => {
                    const routine = routines.find(r => r.id === editId)
                    if (!routine) return

                    manager.updateDescription(val)
                    routines = routines.map((r) => r.id === routine.id ? {  ...r, description: val } : r)
                }
            }
        })
    }

    function openContextMenu(e: Event, routineId: string) {
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
        
        contextId = routineId
        routinesMenuOpen = true
        routineMenuPos = { top, left }
    }

    function onSettingOptnClicked(routineId: string, optn: string) {
        const isChosen = routineId === setId
        const routine = routines.find(r => r.id === routineId)
        if (!routine) return

        if (optn === "Unset" && isChosen) {
            contextId = ""
            setId = ""
            setWeekRoutine.set(null)
        }
        else if (optn === "Set as Current") {
            contextId = ""
            setId = routine.id
            setWeekRoutine.set(routine)
        }
        else if (optn === "Duplicate" && !loading) {
            loading = true
            contextId = ""
            const newRoutine = structuredClone(routine)
            
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

        if (empty && routines.length > 0) {
            requestAnimationFrame(() => onRoutineClicked(routines[0].id))
        }
    }
    
    function deleteRoutine() {
        const routine = routines.find(r => r.id === contextId)
        if (!routine) return

        const arrIdx = routines.findIndex(r => r.id === contextId)
        const inView = editId === contextId
        const inSet = setId === contextId

        confirmOptions = false
        routines = removeItemArr({ array: routines, itemIdx: routine.idx })

        if (inSet) {
            setId = ""
            setWeekRoutine.set(null)
        }
        if (inView) {
            const nextIdx = decrementIdx(arrIdx, routines.length)
            const nextRoutine = nextIdx >= 0 ? routines[nextIdx] : null
            editId = nextRoutine?.id || ""
            manager.setViewRoutine(nextRoutine)
        }
    }
    
    function onRoutineClicked(routineId: string) {
        if (editContext === "duplicate") {
            manager.closeDuplicateEdit()
        }
        if (routineId === editId) {
            return
        }
        if (isMin) {
            routinesOpen = false
        }
        
        const routine = routines.find(r => r.id === routineId)
        if (!routine) return
        
        editId = routineId
        manager.setViewRoutine(routine)
    }

    function setBreakdownView(name: string) {
        breakdownView = name as "cores" | "tags"
        breakdownOptnOpen = false
    }


    /* drag and drop */
    function onDragStart(e: DragEvent) {
        const target = e.target as HTMLElement
        srcId = target.dataset.id!
        
        listRef.addEventListener("dragover", onDrag)
        listRef.addEventListener("dragend", onDragEnd)

        e.dataTransfer?.setData("text", "")
        e.dataTransfer!.effectAllowed = "move"
    }
    function onDrag(e: DragEvent) {
        e.preventDefault()

        const target = e.target as HTMLElement
        const elem = target.closest(".routine-item") as HTMLElement

        if (elem) {
            targetId = elem.dataset.id || ""
        }
    }
    function onDragEnd() {
        if (srcId && targetId) {
            const srcIdx = routines.findIndex(r => r.id === srcId)
            const targetIdx = routines.findIndex(r => r.id === targetId)

            routines = reorderItemArr({ array: routines, srcIdx, targetIdx })
        }

        listRef.removeEventListener("dragover", onDrag)
        listRef.removeEventListener("dragend", onDragEnd)
        
        srcId = ""
        targetId = ""
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
                    id={TITLE_ID}
                    class="routine__title text-editor"
                    class:starred={setId === weekRoutine.id}
                    aria-label="Title"
                    contenteditable
                    spellcheck="false"
                    bind:textContent={titleInput.value}
                >
                </div>
            </div>
            <div 
                id={DESCRIPTION_ID}
                class="routine__description text-editor"
                aria-label="Description"
                contenteditable
                spellcheck="false"
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
                        padding: "4px 12px 4px 11px",
                        margin: "0px 0px 0px -10px",
                        fontSize: "1.375rem",
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
                {#each routines.sort((a, b) => a.idx - b.idx) as routine (routine.id)}
                    <li 
                        class="routine-item drop-top-border"
                        class:drop-top-border--over={targetId === routine.id}
                        class:routine-item--clicked={routine.id === editId}
                        class:routine-item--active={routine.id === contextId}
                        class:starred={routine.id === setId}
                        draggable="true"
                        data-id={routine.id}
                        on:dragstart={onDragStart}
                    >
                        <button
                            on:click={() => {
                                onRoutineClicked(routine.id)
                            }}
                            on:keydown={(e) => {
                                if (e.key === 'Enter' || e.code == "Space") {
                                    e.preventDefault()
                                    onRoutineClicked(routine.id)
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
                                onClick={(e) => openContextMenu(e, routine.id)}
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
                    {  name: contextId === setId ? "Unset" : "Set as Current" },
                    {  name: "Duplicate", divider: true },
                    {  name: "Delete"  }
                ],
                onListItemClicked: ({ name }) => {
                    onSettingOptnClicked(contextId, name)
                },
                onClickOutside: () => {
                    routinesMenuOpen = false
                    contextId = ""
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
            contextId = ""
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
        width: 280px;
        position: relative;

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
    .routine-item.starred:after {
        top: 4px; 
        right: 2px;
    }
    .starred {
        position: relative;
        
        &::after {
            @include abs-top-right(15px, -5px);
            @include text-style(0.45, 300, 2rem);
            height: min-content;
            content: "*";
        }
    }
</style>

