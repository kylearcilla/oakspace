<script lang="ts">
	import BounceFade from "../../components/BounceFade.svelte"
	import { globalContext, themeState, weekRoutine } from "$lib/store"
	import { onMount } from "svelte"
	import { DAYS_OF_WEEK, getDayIdxMinutes, minsFromStartToHHMM } from "$lib/utils-date"
	import { getBlockFromOrderIdx, getCoreStr, getMostRecentBlock, getUpcomingBlock, initCurrentBlock, initTodayRoutine } from "$lib/utils-routines"
	import { getColorTrio, getMaskedGradientStyle } from "$lib/utils-general"
	import TasksList from "../../components/TasksList.svelte"
	import { TEST_TASKS } from "$lib/utils-right-bar"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import { Icon } from "$lib/enums"
	import { toggleActiveRoutine } from "$lib/utils-home";
	import { TextEditorManager, type InputManager } from "$lib/inputs";
	import type { Writable } from "svelte/store";

    $: isOpen      = $globalContext.doOpenActiveRoutine
    $: routine     = $weekRoutine
    $: isDarkTheme = $themeState.isDarkTheme

    let todayRoutine: RoutineBlock[] | DailyRoutine | null = null 
    let nowBlockIdx = 0
    let colorTrio = ["", "", ""]
    let isDescrExpanded = false
    
    let nowBlock:      { block: RoutineBlock, idx: number } | null = null
    let nextViewBlock: { block: RoutineBlock, idx: number } | null = null
    let prevViewBlock: { block: RoutineBlock, idx: number } | null = null
    
    let newDescription = ""
    let doInitNow = true
    let hasInitDescr = false
    let noneActive = false

    // time
    let minuteInterval: NodeJS.Timeout | null = null
    let currTime = getDayIdxMinutes()

    let descriptionRef: HTMLElement
    let routineItemsRef: HTMLElement
    let descriptionEditor: Writable<InputManager>
    let maskListGradient = ""

    $: todayRoutine = initTodayRoutine(routine, currTime)
    $: colorTrio    = nowBlock ? getColorTrio(nowBlock.block.color, !isDarkTheme) : ["", "", ""]
    $: initNowBlock(todayRoutine)
    $: initDescriptionEditor(nowBlock?.block?.description ?? "")

    $: {
        doInitNow = !isOpen ? true : doInitNow
        isDescrExpanded = false

        initDescriptionGradient()
    }
    
    function initNowBlock(todayRoutine: RoutineBlock[] | DailyRoutine | null) {
        if (!todayRoutine || !doInitNow) return

        const now = initCurrentBlock(todayRoutine, currTime.minutes)
        const prev = getMostRecentBlock(currTime.minutes, todayRoutine)
        const next = getUpcomingBlock(currTime.minutes, todayRoutine)

        nextViewBlock = next
        prevViewBlock = prev

        if (now) {
            nowBlockIdx = now.idx
            nowBlock = now
            noneActive = false
            
            colorTrio = getColorTrio(nowBlock.block.color, !isDarkTheme)
        }
        else {
            noneActive = true
            nowBlock = null
        }

        requestAnimationFrame(initDescriptionGradient)
    }
    function onNowBlock() {
        doInitNow = true
        hasInitDescr = false

        initNowBlock(todayRoutine)
    }
    function onPrevBlock() {
        if (!todayRoutine) return
        hasInitDescr = false

        if (doInitNow && noneActive) {
            if (!prevViewBlock) return

            nowBlock    = prevViewBlock
            nowBlockIdx = prevViewBlock.idx
        }
        else {
            nowBlockIdx--
            nowBlock = getBlockFromOrderIdx(nowBlockIdx, todayRoutine)
        }
        doInitNow = false

        prevViewBlock = getBlockFromOrderIdx(nowBlockIdx - 1, todayRoutine)
        nextViewBlock = getBlockFromOrderIdx(nowBlockIdx + 1, todayRoutine)

        requestAnimationFrame(initDescriptionGradient)
    }
    function onNextBlock() {
        if (!todayRoutine) return
        hasInitDescr = false

        if (doInitNow && noneActive) {
            if (!nextViewBlock) return

            nowBlock    = nextViewBlock
            nowBlockIdx = nextViewBlock.idx
        }
        else {
            nowBlockIdx++
            nowBlock = getBlockFromOrderIdx(nowBlockIdx, todayRoutine)
        }
        doInitNow = false
    
        prevViewBlock = getBlockFromOrderIdx(nowBlockIdx - 1, todayRoutine)
        nextViewBlock = getBlockFromOrderIdx(nowBlockIdx + 1, todayRoutine)


        requestAnimationFrame(initDescriptionGradient)
    }
    function initDescriptionGradient() {
        if (!descriptionRef) return

        maskListGradient = getMaskedGradientStyle(descriptionRef, {
            head: { end: "0%" }, tail: { start: "0%" }
        }).styling
    }
    function initDescriptionEditor(_description: string) {
        if (hasInitDescr) return
        hasInitDescr = true

        descriptionEditor = (new TextEditorManager({ 
            initValue: _description,
            placeholder: "Type description here...",
            doAllowEmpty: true,
            maxLength: 500,
            id: "active-routine-description",
            handlers: {
                onBlurHandler: () => onDescriptionSave(),
                onInputHandler: (e, text) => newDescription = text
            }
        })).state
    }

    function onExpandDescription() {
        isDescrExpanded = true
    }

    function onDescriptionSave() {
        hasInitDescr = false
        isDescrExpanded = false

        // update the source routine
        weekRoutine.update((routine) => {
            if (!routine) return null

            const { dayIdx } = currTime
            const currDayKey = DAYS_OF_WEEK[dayIdx] as keyof WeeklyRoutineBlocks
            let newDayRoutine = todayRoutine!

            let blocks = "id" in newDayRoutine ? newDayRoutine.blocks : newDayRoutine
            blocks     = blocks.map((block) => block.startTime === nowBlock!.block.startTime ? { ...block, description: newDescription } : block)

            if ("id" in newDayRoutine) {
                newDayRoutine.blocks = blocks
            }
            else {
                newDayRoutine = blocks
            }

            return { ...routine!, blocks: { ...routine.blocks, [currDayKey]: newDayRoutine }}
        })

        initDescriptionGradient()
        newDescription = ""
    }

    function onTasksUpdated(event: CustomEvent) {
        if (!nowBlock) return
        const updatedTasks = event.detail

        // update the source routine
        weekRoutine.update((routine) => {
            if (!routine) return null

            const { dayIdx } = currTime
            const currDayKey = DAYS_OF_WEEK[dayIdx] as keyof WeeklyRoutineBlocks
            let newDayRoutine = todayRoutine!

            let blocks = "id" in newDayRoutine ? newDayRoutine.blocks : newDayRoutine
            blocks     = blocks.map((block) => block.startTime === nowBlock!.block.startTime ? { ...block, tasks: updatedTasks } : block)

            if ("id" in newDayRoutine) {
                newDayRoutine.blocks = blocks
            }
            else {
                newDayRoutine = blocks
            }

            return { ...routine!, blocks: { ...routine.blocks, [currDayKey]: newDayRoutine }}
        })
    }

    onMount(() => {
        clearInterval(minuteInterval!)
        initDescriptionGradient()

        minuteInterval = setInterval(() => currTime = getDayIdxMinutes(), 1000)
    })
</script>

<BounceFade 
    isHidden={!isOpen}
    position={{ top: "44px", left: "13px" }}
    zIndex={100}
    onClickOutside={toggleActiveRoutine}
    id={"active-routine--dropdown-menu"}
>
    <div 
        class="active-routine"
        class:active-routine--empty={!nowBlock}
    >
        {#if nowBlock}
            <div class="active-routine__header">
                <!-- Title -->
                <div 
                    class="active-routine__title"
                    title={nowBlock.block.title}
                >
                    {`${nowBlock.block.title}`}
                </div>
                <!-- Buttons -->
                <div class="active-routine__btns">
                    <button 
                        on:click={onPrevBlock}
                        disabled={prevViewBlock === null}
                        title="Go to prev block"
                    >
                        <div class="active-routine__block-icon">
                            <SvgIcon icon={Icon.ChevronLeft} options={{ scale: 0.85 }}/>
                        </div>
                    </button>
                    <button 
                        on:click={onNowBlock}
                        title="Go to current block"
                    >
                        <div class="active-routine__now-icon">
                        </div>
                    </button>
                    <button 
                        on:click={onNextBlock}
                        disabled={nextViewBlock === null}
                        title="Go to mext block"
                    >
                        <div 
                            class="active-routine__block-icon"
                            class:active-routine__block-icon--second={true}
                        >
                            <SvgIcon icon={Icon.ChevronRight} options={{ scale: 0.85 }}/>
                        </div>
                    </button>
                </div>
            </div>
            <!-- Categories -->
            {#if nowBlock && (nowBlock.block.tag || nowBlock.block.activity)}
                {@const tag = nowBlock.block.tag}
                {@const activity = nowBlock.block.activity}
                <div class="active-routine__categories">
                    {#if tag}
                        <div 
                            class="tag"
                            style:--tag-color-primary={tag?.symbol.color.primary}
                            style:--tag-color-1={colorTrio[0]}
                            style:--tag-color-2={colorTrio[1]}
                            style:--tag-color-3={colorTrio[2]}
                        >
                            <span class="tag__symbol">
                                {tag?.symbol.emoji}
                            </span>
                            <div class="tag__title">
                                {tag?.name}
                            </div>
                        </div>
                    {/if}
                    <div 
                        class="active-routine__core" 
                        class:hidden={!activity}
                    >
                        <span>
                            {getCoreStr(activity)}
                        </span>
                    </div>
                </div>
            {/if}
            <!-- Description -->
            {#if nowBlock.block.description}
                <div class="active-routine__description-container">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        class="active-routine__description"
                        style={maskListGradient}
                        bind:this={descriptionRef}
                        on:click={onExpandDescription}
                        on:scroll={initDescriptionGradient}
                    >
                        {nowBlock.block.description}
                    </div>
                    <BounceFade 
                        isHidden={!isDescrExpanded}
                        position={{ top: "0px", left: "13px" }}
                        styling={{ width: "100%" }}
                        zIndex={100}
                        onClickOutside={() => isDescrExpanded = false}
                    >
                        <div class="active-routine__description-floating">
                            {#if descriptionEditor}
                                <div 
                                    class="active-routine__description-editor text-editor"
                                    data-placeholder={$descriptionEditor.placeholder}
                                    contenteditable
                                    bind:innerHTML={$descriptionEditor.value}
                                    on:paste={(e) => $descriptionEditor.onPaste(e)}
                                    on:input={(e) => $descriptionEditor.onInputHandler(e)}
                                    on:focus={(e) => $descriptionEditor.onFocusHandler(e)}
                                    on:blur={(e)  => $descriptionEditor.onBlurHandler(e)}
                                >
                                </div>
                            {/if}
                        </div>
                    </BounceFade>
                </div>
            {/if}
            <!-- Tasks List -->
            {#if nowBlock.block.tasks.length >= 0}
                <div class="active-routine__action-items-header">
                    <div class="flx flx--algn-center">
                        <div class="active-routine__action-items-icon">
                        </div>
                        <div class="active-routine__action-items-title">
                            Action Items
                        </div>
                    </div>
                    <div class="active-routine__progress">
                        <span>3</span>
                        <span>/</span>
                        <span>12</span>
                    </div>
                </div>
                <div class="active-routine__action-items" bind:this={routineItemsRef}>
                    <TasksList 
                        on:tasksUpdated={onTasksUpdated}
                        options={{
                            id:   "edit-routine",
                            containerRef: routineItemsRef,
                            tasks: TEST_TASKS,
                            styling: {
                                task: { 
                                    fontSize: "1.12rem", height: "30px", padding: "5px 0px 5px 0px" 
                                },
                                subtask: {
                                    fontSize: "1.12rem", padding: "8px 0px 9px 0px" 
                                },
                                checkbox: { 
                                    width: "9.5px", height: "9.5px", margin: "1px 10px 0px 18px" 
                                },
                                description: { 
                                    padding: "4px 0px 2px 0px", fontSize: "1rem"
                                },
                                descriptionInput: { 
                                    fontSize: "1.23rem"
                                }
                            },
                            addBtn: {
                                pos: "bottom",
                                iconScale: 0.96,
                                style: {
                                    fontSize: "1.18rem", margin: "10px 0px 0px 18px"
                                }
                            },
                            cssVariables: { 
                                maxDescrLines: 2 
                            },
                            contextMenuOptions: { 
                                width: "170px" 
                            },
                            ui: { 
                                hasTaskDivider: false,
                                sidePadding: "18px", 
                                listHeight: "100%"
                            }
                        }}
                    />
                </div>
            {/if}
            <div 
                class="active-routine__bottom-container"
                class:active-routine__bottom-container--has-tasks={nowBlock.block.tasks.length >= 0}
            >
                <!-- Time -->
                <div class="active-routine__time">
                    {#if nowBlock}
                        <span>
                            {minsFromStartToHHMM(nowBlock.block.startTime)}
                        </span>
                        <span>-</span>
                        <span>
                            {minsFromStartToHHMM(nowBlock.block.endTime)}
                        </span>
                    {/if}
                </div>
                <!-- Week Routine -->
                <div class="active-routine__wk-routine">
                    {routine?.name}
                </div>
            </div>
        {:else}
            <div class="text-aln-center">
                <div class="active-routine__no-routine">
                    No Active Routine
                </div>
                <div class="active-routine__no-routine-subtitle">
                    {#if nextViewBlock}
                        Deep Work in <strong>6h 20m</strong>
                    {:else}
                        Done for the Day!
                    {/if}
                </div>
            </div>
            <div class="active-routine__bottom-container active-routine__btns">
                <button 
                    on:click={onPrevBlock}
                    disabled={prevViewBlock === null}
                    title="Go to prev block"
                >
                    <div class="active-routine__block-icon">
                        <SvgIcon icon={Icon.ChevronLeft} options={{ scale: 0.85 }}/>
                    </div>
                    <span style="margin-left: 12px">Prev</span>
                </button>
                <button 
                    on:click={onNextBlock}
                    disabled={nextViewBlock === null}
                    title="Go to mext block"
                >
                    <span style="margin-right: 12px">Next</span>
                    <div 
                        class="active-routine__block-icon"
                        class:active-routine__block-icon--second={true}
                    >
                        <SvgIcon icon={Icon.ChevronRight} options={{ scale: 0.85 }}/>
                    </div>
            </button>
            </div>
        {/if}
    </div>
</BounceFade>


<style lang="scss">
    @import "../../scss/inputs.scss";

    .active-routine {
        background-color: var(--navMenuBgColor);
        border: 1px solid rgba(var(--textColor1), 0.04);
        border-radius: 16px;
        padding: 0px 0px 9px 0px;
        width: 290px;
        position: relative;

        &--empty &__bottom-container {
            padding: 0px 18px 0px 19px;
            margin-top: -8px;
        }

        &__header {
            @include flex(center, space-between);
            padding: 9px 18px 0px 18px;
        }
        &__title {
            @include text-style(0.8, 500, 1.18rem);
            @include elipses-overflow;
            margin: 0px 12px 5px 0px;
            min-width: 0px;
            max-height: 60px;
            cursor: default;
        }
        &__btns {
            @include flex(center);
            margin-top: -5px;
        }
        &__btns button {
            @include text-style(_, 500, 1.14rem);
            @include flex(center);
            opacity: 0.22;
            padding: 0px 2px;
            
            &:nth-last-child(2) {
                padding: 8px 8px;
            }
            &:last-child {
                padding-right: 0px;
            }
            &:disabled {
                opacity: 0.1 !important;
            }
            &:hover {
                opacity: 0.8;
            }
            &:active {
                transform: scale(0.9);
            }
        }
        &__now-icon {
            @include circle(2.5px);
            margin: 0px 4px;
            background-color: rgba(var(--textColor1), 0.85);
        }
        &__categories {
            @include flex(center);
            margin: 4px 0px 7px -2px;
            padding: 0px 18px 0px 18px;

            .tag {
                margin: 0px 5px 0px 0px;
                padding: 2px 11.5px 2px 9.5px;
            }
            .tag__title {
                font-size: 1rem;
                font-weight: 500;
            }
            .tag__symbol {
                font-size: 0.7rem !important;
                margin-right: 5px;
            }
        }
        &__core {
            background-color: rgba(var(--textColor1), 0.05);
            @include text-style(0.7, 400, 1rem);
            padding: 2.5px 11px;
            border-radius: 10px;
        }
        &__description-container {
            position: relative;
            margin-bottom: 10px;
        }
        &__description {
            @include text-style(0.5, 400, 1.18rem);
            max-height: 50px;
            overflow: scroll;
            padding: 0px 18px 0px 18px;
            cursor: pointer;
        }
        &__description-floating {
            background: #181818;
            border: 1px solid rgba(var(--textColor1), 0.1);
            border-radius: 12px;
            padding: 9px 12px 9px 12px;
            width: calc(100% - 36px);
        }
        &__description-editor {
            @include text-style(0.7, 400, 1.17rem);
            padding: 0px;
        }
        &__action-items-header {
            margin: 2px 0px 6px 0px;
            padding: 0px 18px 0px 18px;
            @include flex(center, space-between);
        }
        &__action-items-icon {

        }
        &__action-items-title {
            @include text-style(0.9, 400, 1.12rem);
        }
        &__progress {
            @include text-style(0.4, 400, 1.1rem, "DM Sans");
        }
        &__action-items {
            max-height: 200px;
            height: 200px;
            margin-bottom: 5px;
            position: relative;
        }
        &__no-routine {
            @include text-style(0.55, 400, 1.14rem);
            padding: 11px 0px 6px 0px;
        }
        &__no-routine-subtitle {
            @include text-style(0.2, 400, 1.14rem, "DM Sans");
            margin-bottom: 16px;

            strong {
                @include text-style(0.3, 400);
                margin-left: 1.5px;
            }
        }
        &__bottom-container {
            @include flex(center, space-between);
            padding: 6px 18px 0px 19px;
        }
        &__bottom-container--has-tasks {
            @include abs-bottom-right(14px, 0px);
            padding-bottom: 0px;
        }
        &__time {
            @include text-style(0.4, 400, 1.1rem, "DM Sans");
            white-space: nowrap;
        }
        &__wk-routine {
            display: none;
            @include text-style(0.1, 400, 1.1rem, "DM Sans");
        }
    }
</style>