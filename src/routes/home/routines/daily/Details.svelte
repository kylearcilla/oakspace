<script lang="ts">
    import { onMount } from 'svelte'
    import { v4 as uuidv4 } from 'uuid'
    
	import { Icon } from '$lib/enums'
	import { themeState } from '$lib/store'
	import { toast } from '$lib/utils-toast'
	import { minsToHHMM } from '$lib/utils-date'
	import { TextEditorManager } from '$lib/inputs'
	import { formatCoreData } from '$lib/utils-routines'
	import { DailyRoutinesManager } from '$lib/routines-daily-manager'
	import { capitalize, decrementIdx, insertItemArr, randomArrayElem, removeItemArr } from '$lib/utils-general'

	import SvgIcon from '$components/SVGIcon.svelte'
	import EmptyList from '$components/EmptyList.svelte'
	import EditBlockModal from '../EditBlockModal.svelte'
	import NewRoutineModal from "../NewRoutineModal.svelte"
	import DropdownBtn from '$components/DropdownBtn.svelte'
	import SettingsBtn from '$components/SettingsBtn.svelte'
	import DropdownList from '$components/DropdownList.svelte'
	import ConfirmationModal from '$components/ConfirmationModal.svelte'

    export let manager: DailyRoutinesManager
    export let routines: DailyRoutine[]
    export let initIdx: number

    const EMPTY_LIST_SUGGESTIONS = [
        "💪 Grind Day",
        "🌱 Flow Day",
        "☀️ Early Morning Routine",
        "🧘🏼‍♂️ Zen Day",
        "🌿 Chill Day",
        "🌻 Weekend Chill",
        "🏋️‍♂️ Push Day ",
        "💪 Pull Day ",
        "📝 Creative Routine",
    ]

    /* DOM */
    let listRef: HTMLElement
    let detailsHeight = 0
    let breakdownHeight = 0
    let loading = false
    
    /* routines */
    let deleteConfirm = false
    let contextIdx = -1
    
    let breakdownView = "cores"
    let breakdownOptnOpen = false
    let newRoutineModal = false
    let routinesOpen = true
    
    let settings = false
    let settingsPos = { left: 0, top: 0 }
    
    let _editDayRoutine = manager.editDayRoutine
    let _coreBreakdown = manager.coreBreakdown
    let _tagBreakdown = manager.tagBreakdown
    let _editingBlock = manager.editingBlock
    let _editContext = manager.editContext
    
    $: editIdx = initIdx
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

    /* details */
    function setBreakdownView(name: string) {
        breakdownView = name as "cores" | "tags"
        breakdownOptnOpen = false
    }

    function onRoutineClicked(idx: number) {
        editIdx = idx
        manager.initEditRoutine(routines[idx])
    }

    /* items */
    function initTextEditors(editDayRoutine: DailyRoutine | null) {
        if (!editDayRoutine) return 

        titleInput = new TextEditorManager({ 
            initValue: editDayRoutine.name,
            placeholder: "Routine Title",
            maxLength: 100,
            id: "routine-title",
            doAllowEmpty: false,
            handlers: {
                onBlurHandler: (_, name) => {
                    const routine = routines[editIdx]

                    routines = routines.map((r) => r.id === routine.id ? {  ...r, name } : r)
                    manager.updateTitle(name)
                }
            }
        })
        description = new TextEditorManager({ 
            initValue: editDayRoutine.description,
            placeholder: "Type description here...",
            maxLength: 500,
            id: "routine-description",
            handlers: {
                onBlurHandler: (_, description) => {
                    const routine = routines[editIdx]

                    routines = routines.map((r) => r.id === routine.id ? {  ...r, description } : r)
                    manager.updateDescription(description)
                }
            }
        })
    }

    function addRoutine(newRoutine: DailyRoutine) {
        routines.push(newRoutine)
        routines = routines
    }

    function duplicateRoutine() {
        const newRoutine = structuredClone(routines[contextIdx])
        const promise = () => new Promise<void>((resolve) => setTimeout(() => {
            newRoutine.id = uuidv4()
            newRoutine.idx = newRoutine.idx + 1
            
            routines = insertItemArr({ array: routines, item: newRoutine })
            resolve()
        }, 2000))

        toast("promise", { loading: `Duplicating "${newRoutine.name}"...` }, promise())
    }

    function deleteRoutine() {
        const routine = routines[contextIdx]
        const name = routine.name
        const inView = editIdx === contextIdx
        const itemIdx = contextIdx

        routines = removeItemArr({ 
            array: routines, 
            itemIdx: routines.findIndex(r => r.id === routine.id)
        })
        if (inView) {
            editIdx = decrementIdx(editIdx, routines.length)
            manager.initEditRoutine(routines[editIdx])
        }
        toast("default", {
            message: `"${name}" deleted.`,
            contextId: "routines",
            groupExclusive: true,
            action: {
                label: "Undo",
                onClick: () => {
                    routines = insertItemArr({ array: routines, item: routine })
                    console.log(structuredClone(routines))
                    
                    if (inView) {
                        editIdx = itemIdx
                        requestAnimationFrame(() => manager.initEditRoutine(routines[itemIdx]))
                    }
                }
            }
        })
        contextIdx = -1
    }

    /* options */
    function onSettingOptnClicked(optn: string) {
        if (optn === "View") {
            onRoutineClicked(contextIdx)
            contextIdx = -1
        }
        else if (optn === "Duplicate" && !loading) {
            duplicateRoutine()
            contextIdx = -1
        }
        else if (optn === "Delete") {
            deleteConfirm = true
        }
        settings = false
    }

    function openContextMenu(e: Event, routineIdx: number) {
        const pe = e as PointerEvent
        pe.preventDefault()

        const container = listRef
        const rect = container.getBoundingClientRect()
        const top  = pe.clientY - rect.top + 15
        let left = pe.clientX - rect.left - 40
        
        contextIdx = routineIdx
        settings = true
        settingsPos  = { top, left }
    }

    /* routines */
    function onAddRoutine(newRoutine: DailyRoutine | WeeklyRoutine | null) {
        newRoutineModal = false
        if (!newRoutine) return

        const empty = routines.length === 0
        addRoutine(newRoutine as DailyRoutine)

        if (empty) {
            requestAnimationFrame(() => manager.initEditRoutine(routines[0]))
        }
    }
</script>

<div class="details">
    <div 
        class="routine"
        class:routine--light={isLightTheme}
        class:routine--empty={routines.length === 0}
    >
        {#if editDayRoutine}
            <div class="routine__details" bind:clientHeight={detailsHeight}>
                <div class="routine__details-header">
                    <div 
                        id="routine-title"
                        class="routine__title"
                        aria-label="Title"
                        contenteditable
                        data-placeholder={titleInput.placeholder}
                        bind:textContent={titleInput.value}
                    >
                    </div>
                </div>
                <div 
                    id="routine-description"
                    class="routine__description"
                    aria-label="Description"
                    contenteditable
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
                    {/each}
                {/if}
                </div>
            </div>
        {/if}

        <!-- collection -->
        <div 
            class="routine__routines" 
            style:--routines-height={`${routines.length === 0 ? "auto" : detailsMaxHt}`}
            bind:this={listRef}
        >
            <div class="routine__routines-header">
                <div class="routine__routines-left">
                    <DropdownBtn
                        id="routines-list"
                        isActive={routinesOpen}
                        options={{
                            title: "Items",
                            arrowOnHover: true,
                            noBg: true,
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
                        on:click={() => newRoutineModal = true}
                    >
                        <SvgIcon 
                            icon={Icon.Add} 
                            options={{ scale: 1, strokeWidth: 1.8 }} 
                        />
                    </button>
                </div>
                <span 
                    class="routine__routines-count" 
                    style:margin-right="6px"
                >
                    {routines.length}
                </span>
            </div>
            {#if routinesOpen || routines.length === 0}
                <ul style:margin-right="8px">
                    {#each routines.sort((a, b) => a.idx - b.idx) as routine, routineIdx (routine.id)}
                        <li 
                            class="routine-item"
                            class:routine-item--clicked={routine.id === focusedId}
                            class:routine-item--active={routineIdx === contextIdx}
                        >
                            <button
                                on:click={() => {
                                    onRoutineClicked(routineIdx)
                                }}
                                on:keydown={(e) => {
                                    if (e.code === 'Enter' || e.code === 'Space') {
                                        e.preventDefault()
                                        onRoutineClicked(routineIdx)
                                    }
                                }}
                            >
                                {routine.name}
                            </button>
                            <div class="routine-item__settings-btn">
                                <SettingsBtn 
                                    id={"routines"}
                                    onClick={(e) => openContextMenu(e, routineIdx)}
                                />
                            </div>
                        </li>
                    {:else}
                        {@const subtitle = randomArrayElem(EMPTY_LIST_SUGGESTIONS)}
                        <div style:margin="36px 12px 0px 0px">
                            <EmptyList 
                                loading={false}
                                emptyText="No Daily Routines"
                                subtitle={subtitle}
                                buttonText="Add a Routine"
                                onButtonClick={() => newRoutineModal = true}
                            />
                        </div>
                    {/each}
                </ul>
            {/if}
            <DropdownList
                id={"daily-routines"}
                isHidden={!settings}
                options={{
                    listItems: [
                        { name: "View" },
                        { name: "Duplicate", divider: true },
                        { name: "Delete" }
                    ],
                    onListItemClicked: ({ name }) => {
                        onSettingOptnClicked(name)
                    },
                    onClickOutside: () => {
                        settings = false
                        contextIdx = -1
                    },
                    styling: { 
                        zIndex: 2001 
                    },
                    position: {
                        top: settingsPos.top + "px",
                        left: settingsPos.left + "px"
                    }
                }}
            />
        </div>
    </div>
    <div class="details__divider"></div>
</div>

{#if editContext === "details" && editingBlock}
    <EditBlockModal block={editingBlock} routineManager={manager} />
{/if}

{#if deleteConfirm} 
    <ConfirmationModal 
        text="Are you sure you want to proceed with deleting this daily routine?"
        type="delete"
        onOk={() => {
            deleteRoutine()
            deleteConfirm = false
        }}
        onCancel={() => { 
            deleteConfirm = false
            editIdx = -1
        }}
    /> 
{/if}

{#if newRoutineModal}
    <NewRoutineModal type="daily" onFinishEdit={onAddRoutine} />
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
        padding-right: 15px;

        &__divider {
            @include abs-top-right(0px, 15px);
            width: 1px;
            height: 100%;
            border-right: var(--divider-border);
        }
    }
    .routine {
        width: 280px;
        position: relative;

        &--empty {
            width: 220px;
        }
    }
</style>