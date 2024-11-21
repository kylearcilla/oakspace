<script lang="ts">
    import { onMount } from "svelte"
	import type { Writable } from "svelte/store"
	import { globalContext, themeState, weekRoutine } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { TEST_TASKS } from "$lib/mock-data"
	import { toggleActiveRoutine } from "$lib/utils-home"
    import { RoutinesManager } from "$lib/routines-manager"
	import { TextEditorManager, type InputManager } from "$lib/inputs"
	import { getColorTrio, getMaskedGradientStyle } from "$lib/utils-general"
	import { DAYS_OF_WEEK, getDayIdxMinutes, minsFromStartToHHMM } from "$lib/utils-date"
	import { 
            getBlockFromOrderIdx, getCoreStr, getMextTimeCheckPointInfo, getMostRecentBlock, 
            getUpcomingBlock, initCurrentBlock, initTodayRoutine } from "$lib/utils-routines"
    
	import SvgIcon from "../../components/SVGIcon.svelte"
	import TasksList from "../../components/TasksList.svelte"
	import BounceFade from "../../components/BounceFade.svelte"

    export let pos: "left" | "right"

    $: isOpen      = $globalContext.doOpenActiveRoutine
    $: routine     = $weekRoutine
    $: isDarkTheme = $themeState.isDarkTheme
    
    const DESCR_MAX = RoutinesManager.MAX_DESCRIPTION

    let todayRoutine: RoutineBlock[] | DailyRoutine | null = null 
    let doInitNow = true
    let noneActive = false
    let nowBlockIdx = 0
    let isCreatingNewTask = false
    let descriptionInputRef: HTMLElement

    let nowBlock:      { block: RoutineBlock, idx: number } | null = null
    let nextViewBlock: { block: RoutineBlock, idx: number } | null = null
    let prevViewBlock: { block: RoutineBlock, idx: number } | null = null
    
    let hasInitDescr = false
    let isDescrExpanded = false
    let newDescription = ""
    let maskListGradient = ""
    let currDescriptionLength = 0

    // time
    let minuteInterval: NodeJS.Timeout | null = null
    let currTime = getDayIdxMinutes()
    
    let descriptionRef: HTMLElement
    let routineItemsRef: HTMLElement
    let descriptionEditor: Writable<InputManager>

    $: colorTrio    = nowBlock?.block.tag ? getColorTrio((nowBlock as any).block.tag.symbol.color, !isDarkTheme) : ["", "", ""]
    $: todayRoutine = initTodayRoutine(routine, currTime)
    $: initNowBlock(todayRoutine)
    $: initDescriptionEditor(nowBlock?.block?.description ?? "")

    $: {
        doInitNow = !isOpen ? true : doInitNow
        isDescrExpanded = false

        initDescriptionGradient()
    }
    
    /* Blocks */
    function initNowBlock(todayRoutine: RoutineBlock[] | DailyRoutine | null) {
        if (!todayRoutine || !doInitNow) return

        const now  = initCurrentBlock(todayRoutine, currTime.minutes)
        const prev = getMostRecentBlock(currTime.minutes, todayRoutine)
        const next = getUpcomingBlock(currTime.minutes, todayRoutine)

        nextViewBlock = next
        prevViewBlock = prev

        if (now) {
            nowBlockIdx = now.idx
            nowBlock = now
            noneActive = false
            colorTrio = nowBlock.block.tag ? getColorTrio(nowBlock.block.tag.symbol.color, !isDarkTheme) : colorTrio
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

    /* Description */
    function initDescriptionGradient() {
        if (!descriptionRef || !isDarkTheme) return

        maskListGradient = getMaskedGradientStyle(descriptionRef, {
            head: { end: "0%" }, tail: { start: "50%" }
        }).styling
    }
    function initDescriptionEditor(_description: string) {
        if (hasInitDescr) return
        hasInitDescr = true

        descriptionEditor = (new TextEditorManager({ 
            initValue: _description,
            placeholder: "Type description here...",
            doAllowEmpty: true,
            maxLength: DESCR_MAX,
            id: "active-routine-description",
            handlers: {
                onBlurHandler: () => onDescriptionSave(),
                onInputHandler: (e, text, length) => {
                    newDescription = text
                    currDescriptionLength = length
                }
            }
        })).state
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


        nowBlock!.block.description = newDescription        
        newDescription = ""

        requestAnimationFrame(initDescriptionGradient)
    }

    /* Tasks */
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

        isCreatingNewTask = false
        nowBlock!.block.tasks = updatedTasks
    }

    onMount(() => {
        clearInterval(minuteInterval!)
        initDescriptionGradient()

        minuteInterval = setInterval(() => currTime = getDayIdxMinutes(), 1000)
    })
</script>

<BounceFade 
    isHidden={!isOpen}
    position={{ 
        top: "38px", 
        left: pos === "left" ? "0px" : "unset",
        right: pos === "left" ? "unset" : "0px",
    }}
    zIndex={99999}
    onClickOutside={toggleActiveRoutine}
    id={"active-routine--dmenu"}
>
    <div 
        class="active-routine"
        class:active-routine--empty={!nowBlock}
        class:active-routine--light={!isDarkTheme}
    >
        {#if nowBlock}
            {@const description = nowBlock.block.description}
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
                    <button on:click={onNowBlock} title="Go to current block">
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
            <!-- Subheader -->
            {#if nowBlock}
                {@const tag = nowBlock.block.tag}
                {@const activity = nowBlock.block.activity}
                <div class="active-routine__subheader">
                    {#if tag}
                        <div 
                            class="tag"
                            style:--tag-color-primary={tag?.symbol.color.primary}
                            style:--tag-color-1={colorTrio[0]}
                            style:--tag-color-2={colorTrio[1]}
                            style:--tag-color-3={colorTrio[2]}
                            title={tag.name}
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
                        title={activity}
                    >
                        <span>
                            {getCoreStr(activity)}
                        </span>
                    </div>
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
                </div>
            {/if}
            <!-- Description -->
            <div class="active-routine__description-container">
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div 
                    tabindex="0"
                    role="button"
                    class="active-routine__description"
                    class:active-routine__description--no-description={description.length === 0}
                    style={maskListGradient}
                    bind:this={descriptionRef}
                    on:click={() => {
                        isDescrExpanded = true
                        setTimeout(() => descriptionInputRef.focus(), 50)
                    }}
                    on:scroll={initDescriptionGradient}
                >
                    {description.length === 0 ? "No Description" : description}
                </div>
                <BounceFade 
                    isHidden={!isDescrExpanded}
                    position={{ top: "0px", left: "13px" }}
                    styling={{ width: "100%" }}
                    zIndex={100}
                    onClickOutside={() => isDescrExpanded = false}
                >
                    <div class="active-routine__description-floating input-box input-box--border">
                        {#if descriptionEditor}
                            <div 
                                class="active-routine__description-editor text-editor"
                                data-placeholder={$descriptionEditor.placeholder}
                                contenteditable
                                bind:this={descriptionInputRef}
                                bind:innerHTML={$descriptionEditor.value}
                                on:paste={(e) => $descriptionEditor.onPaste(e)}
                                on:input={(e) => $descriptionEditor.onInputHandler(e)}
                                on:focus={(e) => $descriptionEditor.onFocusHandler(e)}
                                on:blur={(e)  => $descriptionEditor.onBlurHandler(e)}
                            >
                            </div>
                        {/if}
                        <div 
                            class="input-box__count"
                            class:input-box__count--over={currDescriptionLength > DESCR_MAX}
                        >
                            {DESCR_MAX - currDescriptionLength}
                        </div>
                    </div>
                </BounceFade>
            </div>
            <!-- Tasks List -->
            {#if nowBlock.block.tasks.length >= 0}
                <div class="active-routine__action-items-header">
                    <div class="flx flx--algn-center">
                        <div class="active-routine__action-items-icon">
                        </div>
                        <div class="active-routine__action-items-title">
                            Action Items
                        </div>
                        <button 
                            class="active-routine__new-item-btn"
                            on:click={() => isCreatingNewTask = !isCreatingNewTask}
                        >
                            <SvgIcon 
                                icon={Icon.Add} 
                                options={{ strokeWidth: 1.8, scale: 0.9 }} 
                            />
                        </button>
                    </div>
                    <div class="flx flx--algn-center">
                        <div class="active-routine__progress">
                            <span>12</span>
                        </div>
                    </div>
                </div>
                <div class="active-routine__action-items" bind:this={routineItemsRef}>
                    <TasksList 
                        on:tasksUpdated={onTasksUpdated}
                        options={{
                            id:   "active-routine",
                            containerRef: routineItemsRef,
                            tasks: TEST_TASKS,
                            isCreatingNewTask,
                            settings: {
                                subtasks: true
                            },
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
                                doShow: false
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
        {:else}
            <div class="text-aln-center">
                <div class="active-routine__no-routine">
                    No Active Routine
                </div>
                <div class="active-routine__no-routine-subtitle">
                    {#if nextViewBlock}
                        {nextViewBlock.block.title}
                        <strong>
                            {getMextTimeCheckPointInfo(todayRoutine) ?? ""}
                        </strong>
                    {:else}
                        Done for the Day!
                    {/if}
                </div>
            </div>
            <div 
                class="active-routine__bottom-container active-routine__btns"
                style="margin-bottom: -5px"
            >
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
        background-color: var(--bg-2);
        border: 1px solid rgba(var(--textColor1), 0.04);
        border-radius: 16px;
        padding: 0px 0px 5px 0px;
        width: 290px;
        position: relative;

        &--light {
            border: 1.5px solid rgba(var(--textColor1), 0.1);
        }
        &--light .input-box {
            @include input-box--light;        
        }
        &--light &__title {
            @include text-style(0.9, 600);
        }
        &--light &__action-items-title {
            @include text-style(0.8, 600);
        }
        &--light &__description {
            @include text-style(0.85, 600);
        }
        &--light &__progress {
            @include text-style(0.4, 500);
        }
        &--light &__time {
            @include text-style(0.6, 500);
        }
        &--light &__no-routine {
            @include text-style(0.95, 600);
        }
        &--light &__no-routine-subtitle {
            @include text-style(0.7, 500);
        }
        &--light &__no-routine-subtitle strong {
            @include text-style(0.4, 500);
        }
        &--empty &__bottom-container {
            padding: 0px 18px 0px 9px;
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
            margin: -5px -5px 0px 0px;
        }
        &__btns button {
            @include text-style(1, 600, 1.14rem);
            @include flex(center);
            opacity: 0.4;
            padding: 4px 6px;
            
            &:nth-last-child(2) {
                padding: 8px 8px;
            }
            &:last-child {
                padding-right: 5px;
            }
            &:disabled {
                opacity: 0.15 !important;
            }
            &:hover {
                opacity: 0.8;
            }
            &:focus-visible {
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
        &__subheader {
            @include flex(center);
            margin: 2px 0px 7px -2px;
            padding: 0px 18px 0px 18px;

            .tag {
                margin: 0px 5px 0px 0px;
                padding: 2.5px 11.5px 2.5px 8px;
                max-width: 105px;
            }
            .tag__title {
                font-size: 1rem;
                font-weight: 600;
            }
            .tag__symbol {
                font-size: 0.7rem !important;
                margin-right: 5px;
            }
        }
        &__time {
            @include text-style(0.2, 400, 1.1rem, "DM Sans");
            white-space: nowrap;
        }
        &__core {
            background-color: rgba(var(--textColor1), 0.07);
            @include text-style(0.7, 600, 1rem);
            padding: 2.5px 11px;
            border-radius: 10px;
            margin-right: 8px;
        }
        &__description-container {
            position: relative;
            margin: 0px 0px 8px 0px;
            @include text-style(0.8, 500, 1.1rem);
        }
        &__description {
            @include text-style(0.4);
            max-height: 48px;
            overflow: scroll;
            padding: 0px 18px 0px 18px;
            max-width: calc(100% - 0px);
            word-wrap: break-word;

            &--no-description {
                opacity: 0.3;
            }
        }
        &__description-floating {
            background-color: var(--bg-3);
            border-radius: 12px;
            padding: 8px 15px 5px 15px;
            max-width: calc(100% - 30px);
        }
        &__description-editor {
            @include text-style(0.75, 600, 1.1rem);
            margin-bottom: 5px;
            padding: 0px;
        }
        .input-box {
            padding-bottom: 25px;
            display: block;

            &__count {
                font-size: 1.1rem;
            }
        }
        &__action-items-header {
            margin: 0px 0px 6px 0px;
            padding: 0px 18px 0px 18px;
            @include flex(center, space-between);
            display: none;
        }
        &__action-items-title {
            @include text-style(0.3, 500, 1.12rem);
            margin-left: -1px;
        }
        &__new-item-btn {
            opacity: 0;
            margin-left: 6px;
            
            &:hover {
                opacity: 1;
            }
            &:active {
                transform: scale(0.85);
            }
        }
        &__progress {
            @include text-style(0.18, 400, 1rem, "DM Mono");
        }
        &__action-items {
            max-height: 280px;
            height: 280px;
            margin-bottom: 0px;
            position: relative;
        }
        &__no-routine {
            @include text-style(0.55, 500, 1.14rem);
            padding: 11px 0px 8px 0px;
        }
        &__no-routine-subtitle {
            @include text-style(0.3, 400, 1.14rem, "DM Sans");
            margin-bottom: 12px;

            strong {
                @include text-style(0.18, 400);
                margin-left: 1.5px;
            }
        }
        &__bottom-container {
            @include flex(center, space-between);
            padding: 6px 18px 0px 18px;
        }
    }
</style>