<script lang="ts">
	import { onMount } from 'svelte'

	import { Icon } from '$lib/enums';
	import { themeState } from '$lib/store'
	import { toast } from '$lib/utils-toast'
	import { minsToHHMM } from '$lib/utils-date'
	import { TextEditorManager } from '$lib/inputs'
	import { formatCoreData } from '$lib/utils-routines'
	import { RoutinesManager } from '$lib/routines-manager'
	import { DailyRoutinesManager } from '$lib/routines-daily-manager'

	import { capitalize } from '$lib/utils-general'
	import SvgIcon from '$components/SVGIcon.svelte'
	import EditBlockModal from '../EditBlockModal.svelte'
	import NewRoutineModal from "../NewRoutineModal.svelte"
	import DropdownBtn from '$components/DropdownBtn.svelte'
	import DropdownList from '$components/DropdownList.svelte'
	import ConfirmationModal from '$components/ConfirmationModal.svelte'

    export let manager: DailyRoutinesManager
    export let routines: DailyRoutine[]

    /* DOM */
    let listRef: HTMLElement
    let detailsHeight = 0
    let breakdownHeight = 0
    
    /* routines */
    let deleteConfirm = false
    let editRoutineIdx = -1
    let contextRoutineIdx = -1
    
    let breakdownView = "cores"
    let breakdownOptnOpen = false
    let newRoutineModal = false
    let routinesOpen = true

    let settings = false
    let settingsPos = { left: 0, top: 0 }

    let _dailyRoutines  = manager.dailyRoutines!
    let _editDayRoutine = manager.editDayRoutine
    let _coreBreakdown = manager.coreBreakdown
    let _tagBreakdown = manager.tagBreakdown
    let _editingBlock = manager.editingBlock
    let _editContext = manager.editContext

    $: dailyRoutines  = $_dailyRoutines as DailyRoutine[]
    $: editDayRoutine = $_editDayRoutine as DailyRoutine | null
    $: cores         = $_coreBreakdown
    $: editingBlock  = $_editingBlock
    $: editContext   = $_editContext
    $: tagBreakdown  = $_tagBreakdown ?? []
    $: isLightTheme  = !$themeState.isDarkTheme
    $: focusedId     = editDayRoutine?.id ?? "0"
    $: initTextEditors(editDayRoutine)

    $: detailsMaxHt = `calc(100% - ${detailsHeight + breakdownHeight + 100}px)`

    let titleInput: TextEditorManager
    let description: TextEditorManager

    function setBreakdownView(name: string) {
        breakdownView = name as "cores" | "tags"
        breakdownOptnOpen = false
    }

    /* options */

    function initTextEditors(editDayRoutine: DailyRoutine | null) {
        if (!editDayRoutine) return 

        titleInput = new TextEditorManager({ 
            initValue: editDayRoutine.name,
            placeholder: "Routine Title",
            maxLength: 100,
            id: "routine-title-input",
            doAllowEmpty: false,
            handlers: {
                onBlurHandler: (e, val) => manager.updateTitle(val)
            }
        })
        description = new TextEditorManager({ 
            initValue: editDayRoutine.description,
            placeholder: "Type description here...",
            maxLength: 500,
            id: "routine-description",
            handlers: {
                onBlurHandler: (e, val) => manager.updateDescription(val)
            }
        })
    }

    function onOptnClicked(itemIdx: number, optIdx: number) {
        if (optIdx === 0) {
            editRoutineIdx = -1
            onRoutineClicked(itemIdx)
        }
        else {
            deleteConfirm = true
        }

        contextRoutineIdx = -1
        settings = false
    }

    function onRoutineClicked(routineIdx: number) {
        if (dailyRoutines[routineIdx].id === focusedId)  return
        
        manager.initEditRoutine(dailyRoutines[routineIdx])
    }

    function onContextMenu(e: Event, routineIdx: number) {
        const pe = e as PointerEvent
        pe.preventDefault()

        const container = listRef

        const rect = container.getBoundingClientRect()
        const top  = pe.clientY - rect.top
        let left = pe.clientX - rect.left
        
        editRoutineIdx = routineIdx
        contextRoutineIdx = routineIdx
        settings = true
        settingsPos  = { top, left }
    }

    /* routines */

    function onNewRoutineClicked() {

    }

    function createNewRoutine(newRoutine: DailyRoutine | null) {
        newRoutineModal = false
        if (!newRoutine) return

        manager.newDailyRoutine(newRoutine)

        requestAnimationFrame(() => {
            if (dailyRoutines.length === 1) {
                manager.initEditRoutine(dailyRoutines[0])
            }
        })
    }

    function removeDailyRoutine(idx: number) {
        manager.removeDailyRoutine(dailyRoutines[idx].id)

        toast("success", { 
            message: "Weekly routine deleted." 
        })

        deleteConfirm = false
        editRoutineIdx = -1
    }

    function initRoutine() {
        editRoutineIdx = 2
        manager.initEditRoutine(dailyRoutines[editRoutineIdx])
    }
    
    onMount(() => requestAnimationFrame(() => initRoutine()))
</script>

<div class="details">
    {#if editDayRoutine}
        <div class="routine" class:routine--light={isLightTheme}>
            <!-- details -->
            <div class="routine__details" bind:clientHeight={detailsHeight}>
                <div class="routine__details-header">
                    <div 
                        class="routine__title"
                        aria-label="Title"
                        contenteditable
                        data-placeholder={titleInput.placeholder}
                        bind:textContent={titleInput.value}
                    >
                    </div>
                </div>
                <div 
                    class="routine__description"
                    aria-label="Description"
                    contenteditable
                    data-placeholder={description.placeholder}
                    bind:textContent={description.value}
                >
                </div>
            </div>

            <!-- breakdown -->
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
                            {#if cores}
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
                                    {minsToHHMM(data.totalTime)}
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

            <!-- collection -->
            <div 
                class="routine__routines" 
                style:--routines-height={`${dailyRoutines.length === 0 ? "auto" : detailsMaxHt}`}
                bind:this={listRef}
            >
                <div class="routine__routines-header">
                    <div class="routine__routines-left">
                        <DropdownBtn
                            id="routines-list"
                            isActive={routinesOpen}
                            options={{
                                title: "Routines",
                                onClick: () => { 
                                    routinesOpen = !routinesOpen
                                },
                                styles: { 
                                    fontSize: "1.385rem",
                                    padding: "4px 2px 4px 11px", 
                                    margin: "0px 0px 0px -10px"
                                }
                            }} 
                        />
                        <button 
                            class="routine__routines-addbtn"
                            on:click={() => onNewRoutineClicked()}
                        >
                            <SvgIcon 
                                icon={Icon.Add} 
                                options={{ scale: 1, strokeWidth: 1.8 }} 
                            />
                        </button>
                    </div>
                    <span class="routine__routines-count">
                        {routines.length}
                    </span>
                </div>
                {#if routinesOpen}
                    <ul>
                        {#each dailyRoutines as routine, routineIdx}
                            <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
                            <li 
                                role="button"
                                tabindex="0"
                                class="routine-item" 
                                class:routine-item--clicked={routine.id === focusedId}
                                class:routine-item--active={routineIdx === contextRoutineIdx}
                                on:click={() => {
                                    onRoutineClicked(routineIdx)
                                }}
                                on:contextmenu={(e) => {
                                    onContextMenu(e, routineIdx)
                                }}
                                on:keydown={(e) => {
                                    if (e.code === 'Enter' || e.code === 'Space') {
                                        e.preventDefault()
                                        onRoutineClicked(routineIdx);
                                    }
                                }}
                            >
                                <span>
                                    {routine.name}
                                </span>
                            </li>
                        {/each}
                    </ul>
                {/if}
                <DropdownList
                    id={"daily-routines"}
                    isHidden={!settings}
                    options={{
                        listItems: [
                            { name: "View Routine" },
                            { name: "Delete Routine" }
                        ],
                        onListItemClicked: ({ idx }) => {
                            onOptnClicked(editRoutineIdx, idx)
                        },
                        onClickOutside: () => {
                            settings = false
                            contextRoutineIdx = -1
                        },
                        styling: { 
                            width: "140px", zIndex: 2001 
                        },
                        position: {
                            top: settingsPos.top + "px",
                            left: settingsPos.left + "px"
                        }
                    }}
                />
                {#if dailyRoutines.length === 0}
                    <span class="routine__routines-empty">
                        Empty
                    </span>
                {/if}
            </div>
        </div>
    {/if}

    <div class="details__divider"></div>
</div>

{#if editContext === "details" && editingBlock}
    <EditBlockModal block={editingBlock} routineManager={manager} />
{/if}

{#if deleteConfirm} 
    <ConfirmationModal 
        text="Are you sure you want to proceed with deleting this weekly routine?"
        onCancel={() => { 
            deleteConfirm = false
            editRoutineIdx = -1
        }}
        onOk={() => removeDailyRoutine(editRoutineIdx)}
        options={{ ok: "Delete", caption: "Heads Up!", type: "delete" }}
    /> 
{/if}

{#if newRoutineModal}
    <NewRoutineModal 
        onFinishEdit={createNewRoutine}
        isForWeek={false}
        bounds={{ 
            titleMax: RoutinesManager.MAX_TITLE, descrMax: RoutinesManager.MAX_DESCRIPTION
        }}
    />
{/if}

<style lang="scss">
    @import "../../../../scss/day-box.scss";
    @import "../../../../scss/dropdown.scss";
    @import "../../../../scss/inputs.scss";
    @import "../../../../scss/components/routines.scss";

    $hour-blocks-top-offset: 55px;
    $hour-block-height: 50px;
    
    $xlg-blocks-left-offset: 30px;
    $lg-blocks-left-offset: 12px;
    $md-blocks-left-offset: 30px;
    $sm-blocks-left-offset: 8px;

    .details {
        display: flex;
        position: relative;
        height: 100%;

        &__divider {
            @include abs-top-right(0px, 15px);
            width: 1px;
            height: 100%;
            border-right: var(--divider-border);
        }
    }
    .routine {
        padding-top: 15px;
        width: 290px;
        position: relative;
    }
</style>
