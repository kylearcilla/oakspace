<script lang="ts">
    import { onMount } from "svelte"
	import { globalContext, themeState, weekRoutine } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { TextEditorManager } from "$lib/inputs"
	import { toggleActiveRoutine } from "$lib/utils-home"
    import { RoutinesManager } from "$lib/routines-manager"
	import { getMaskedGradientStyle } from "$lib/utils-general"
	import { getDayIdxMinutes, minsFromStartToHHMM } from "$lib/utils-date"
	import { 
            getBlockFromOrderIdx, getNextBlockInfo, getMostRecentBlock, 
            getUpcomingBlock, getCurrentBlock, getDayRoutineFromWeek, updateActiveRoutine
    } from "$lib/utils-routines"
    
	import SvgIcon from "../../components/SVGIcon.svelte"
    import { findElemVertSpace, getElemById } from "../../lib/utils-general"
	import TasksList from "../../components/TasksList.svelte";
	import BounceFade from "../../components/BounceFade.svelte"

    $: isOpen      = $globalContext.doOpenActiveRoutine
    $: routine     = $weekRoutine
    $: isDarkTheme = $themeState.isDarkTheme

    let INPUT_ID = "active-routine-description"
    let blockIdxRef = -1
    
    const DESCR_MAX = RoutinesManager.MAX_DESCRIPTION

    let todayRoutine: RoutineBlock[] | DailyRoutine | null = null 
    let doInitNow = true
    let noneActive = false
    let nowBlockIdx = 0
    let isCreatingNewTask = false

    let nowBlock:      { block: RoutineBlock, idx: number } | null = null
    let nextViewBlock: { block: RoutineBlock, idx: number } | null = null
    let prevViewBlock: { block: RoutineBlock, idx: number } | null = null
    
    // time
    let minuteInterval: NodeJS.Timeout | null = null
    let currTime = getDayIdxMinutes()
    
    // description 
    let descriptionRef: HTMLElement
    let routineItemsRef: HTMLElement
    let textEditorElem: HTMLElement
    let textGradient = ""
    
    let text = ""
    let renderFlag = false
    let editor: TextEditorManager

    $: todayRoutine = getDayRoutineFromWeek(routine, currTime.dayIdx)
    $: initNowBlock(todayRoutine)

    $: {
        doInitNow = isOpen ? doInitNow :true
    }
    $: if (isOpen != undefined) {
        onBlockUpdate()
    }
    
    /* blocks */
    function initNowBlock(todayRoutine: RoutineBlock[] | DailyRoutine | null, force = false) {
        if (!todayRoutine || !doInitNow) return
        
        const now  = getCurrentBlock(todayRoutine, currTime.minutes)
        const prev = getMostRecentBlock(currTime.minutes, todayRoutine)
        const next = getUpcomingBlock(currTime.minutes, todayRoutine)
        
        if (now && blockIdxRef === now.idx && !force) {
            return
        }

        nextViewBlock = next
        prevViewBlock = prev
        blockIdxRef = now?.idx ?? -1

        if (now) {
            nowBlockIdx = now.idx
            nowBlock = now
            noneActive = false
        }
        else {
            noneActive = true
            nowBlock = null
        }
        requestAnimationFrame(() => onBlockUpdate())
    }
    function getBlock(dir: "next" | "prev") {
        if (!todayRoutine) return

        if (doInitNow && noneActive) {
            const viewBlock = dir === "next" ? nextViewBlock : prevViewBlock
            if (!viewBlock) return

            nowBlock = viewBlock
            nowBlockIdx = viewBlock.idx
        }
        else {
            nowBlockIdx = dir === "next" ? nowBlockIdx + 1 : nowBlockIdx - 1
            nowBlock = getBlockFromOrderIdx(nowBlockIdx, todayRoutine)
        }
        doInitNow = false

        prevViewBlock = getBlockFromOrderIdx(nowBlockIdx - 1, todayRoutine)
        nextViewBlock = getBlockFromOrderIdx(nowBlockIdx + 1, todayRoutine)

        requestAnimationFrame(() => onBlockUpdate())
    }
    function onBlockUpdate() {
        handleGradient(textEditorElem)
        const editorElem = getElemById(INPUT_ID)

        if (!editorElem) {
            editor = null
        }
        else if (!editor && editorElem) {
            editor = initDescriptionEditor()
        }
        if (editor) {
            const description = nowBlock?.block.description ?? ""
            editor.updateText(description)
            text = description
        }

        renderFlag = !renderFlag
    }

    /* description */
    function initDescriptionEditor() {
        return new TextEditorManager({ 
            placeholder: "no description...",
            allowFormatting: false,
            maxLength: DESCR_MAX,
            id: INPUT_ID,
            handlers: {
                onInputHandler: (_, val) => {
                    text = val
                },
                onBlurHandler: () => {
                    onDescriptionSave()
                }
            }
        })
    }
    function handleGradient(elem: HTMLElement) {
        if (!isDarkTheme || !elem) return

        textGradient = getMaskedGradientStyle(elem, {
            head: {
                end: "50px"
            },
            tail: {
                start: "10%",
                end: "100%"
            }
        }).styling
    }

    /* updates */
    function onDescriptionSave() {
        descrFocused = false

        updateActiveRoutine({
            updates: { 
                description: text 
            },
            startTime: nowBlock!.block.startTime,
            dayIdx: currTime.dayIdx
        })

    }
    function onTasksUpdated(tasks: Task[]) {
        updateActiveRoutine({
            updates: { 
                tasks
            },
            dayIdx: currTime.dayIdx,
            startTime: nowBlock!.block.startTime,
        })
    }

    onMount(() => {
        clearInterval(minuteInterval!)
        handleGradient(textEditorElem)
        editor = initDescriptionEditor()

        minuteInterval = setInterval(() => currTime = getDayIdxMinutes(), 1000)
    })
</script>

<BounceFade 
    isHidden={!isOpen}
    position={{ 
        top: "38px", 
        left: "10px",
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
            {@const { description, title, startTime, endTime, tasks } = nowBlock.block}
            <div class="active-routine__header">
                <!-- title -->
                <div class="active-routine__title" {title}>
                    {title}
                </div>
                <!-- buttons -->
                <div class="active-routine__btns">
                    <button 
                        on:click={() => getBlock("prev")}
                        disabled={prevViewBlock === null}
                        title="Go to prev block"
                    >
                        <SvgIcon 
                            icon={Icon.ChevronLeft}
                            options={{
                                scale: 1.5, height: 12, width: 12, strokeWidth: 1.4
                            }}
                        />
                    </button>
                    <button 
                        title="Go to current block"
                        on:click={() => {
                            doInitNow = true
                            initNowBlock(todayRoutine, true)
                        }} 
                    >
                    </button>
                    <button 
                        on:click={() => getBlock("next")}
                        disabled={nextViewBlock === null}
                        title="Go to next block"
                    >
                        <SvgIcon 
                            icon={Icon.ChevronRight}
                            options={{
                                scale: 1.5, height: 12, width: 12, strokeWidth: 1.4
                            }}
                        />
                    </button>
                </div>
            </div>
            <!-- time -->
            <div 
                class="active-routine__time" 
                class:hidden={!nowBlock}
                style="margin-right: 10px"
            >
                <span>
                    {minsFromStartToHHMM(startTime)}
                </span>
                <span>-</span>
                <span>
                    {minsFromStartToHHMM(endTime)}
                </span>
            </div>
            <!-- description -->
            <div 
                id={INPUT_ID}
                class="active-routine__description"
                class:active-routine__description--no-tasks={tasks.length === 0}
                class:hidden={!description}
                contenteditable
                spellcheck="false"
                style={textGradient}
                bind:this={textEditorElem}
                on:scroll={() => handleGradient(textEditorElem)}
            >
                {description}
            </div>
             <!-- tasks -->
             {#if tasks.length > 0}
                <!-- <div class="active-routine__divider"></div> -->
                <div class="active-routine__action-items-header">
                    <div class="flx flx--algn-center">
                        <div class="active-routine__action-items-icon">
                        </div>
                        <div class="active-routine__action-items-title">
                            Items
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
                </div>
                <div 
                    class="active-routine__action-items" 
                    style:margin-top={text ? "-12px" : "-10px"}
                    bind:this={routineItemsRef}
                >
                    {#key renderFlag}
                        <TasksList
                            onTaskChange={onTasksUpdated}
                            {tasks}
                            options={{
                                id: "active-routine-block",
                                type: "side-menu",
                                settings: {
                                    maxDepth: 3
                                },
                                ui: { 
                                    hasTaskDivider: true,
                                    maxHeight: "280px"
                                },
                                containerRef: routineItemsRef
                            }}
                        />
                    {/key}
                </div>
            {/if}
        {:else}
            <!-- empty ui -->
            <div class="text-aln-center">
                <div class="active-routine__no-routine">
                    No Active Routine
                </div>
                <div class="active-routine__no-routine-subtitle">
                    {#if nextViewBlock}
                        {nextViewBlock.block.title}
                        <strong>
                            {getNextBlockInfo(todayRoutine) ?? ""}
                        </strong>
                    {:else}
                        Done for the Day!
                    {/if}
                </div>
            </div>
            <div 
                class="active-routine__bottom-container active-routine__btns"
            >
                <button 
                    on:click={() => getBlock("prev")}
                    disabled={prevViewBlock === null}
                    title="Go to prev block"
                >
                    <SvgIcon 
                        icon={Icon.ChevronLeft}
                            options={{
                                scale: 1.5, height: 12, width: 12, strokeWidth: 1.4
                            }}
                    />
                    <span style:margin-left="10px">
                        Prev
                    </span>
                </button>
                <button 
                    on:click={() => getBlock("next")}
                    disabled={nextViewBlock === null}
                    title="Go to next block"
                >
                    <span style:margin-right="10px">
                        Next
                    </span>
                    <SvgIcon 
                        icon={Icon.ChevronRight}
                        options={{
                            scale: 1.5, height: 12, width: 12, strokeWidth: 1.4
                        }}
                    />
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
        border: 1.5px solid rgba(var(--textColor1), 0.03);
        border-radius: 9px;
        padding: 0px 0px 5px 0px;
        width: 340px;
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
            margin: 2px 0px 3px 0px;
        }
        &__title {
            @include text-style(1, 500, 1.4rem);
            @include elipses-overflow;
            margin: 0px 12px 2px 0px;
            min-width: 0px;
            max-height: 60px;
            cursor: default;
        }
        &__btns {
            @include flex(center);
            margin: 0px -10px 0px 0px;
        }
        &__btns button {
            @include text-style(1, 600, 1.14rem);
            @include flex(center);
            opacity: 0.4;
            padding: 4px 6px;
            
            &[title="Go to current block"] {
                padding: 8px 8px;
                position: relative;
                @include circle(6px);

                &::before {
                    content: "•";
                    @include abs-center;
                }
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

            span {
                @include text-style(1, 400, 1.2rem, "DM Mono");
            }
        }
        &__time {
            @include text-style(0.3, 400, 1.3rem, "DM Sans");
            white-space: nowrap;
            margin: 0px 0px 10px 18px;
        }
        &__description {
            padding: 0px 17px 10px 17px;
            @include text-style(0.65, 400, 1.45rem);
            overflow: scroll;
            max-height: 100px;
            
            &--no-tasks {
                max-height: 200px;
            }
        }
        &__divider {
            height: 2px;
            margin: 0px 18px 0px 18px;
            border-top: 1.5px dashed rgba(var(--textColor1), 0.07);
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
        &__action-items {
            position: relative;
        }
        &__no-routine {
            @include text-style(0.3, 500, 1.4rem);
            padding: 15px 0px 8px 0px;
        }
        &__no-routine-subtitle {
            @include text-style(0.8, 400, 1.4rem, "DM Sans");
            margin-bottom: 20px;

            strong {
                @include text-style(0.2, 400);
                margin-left: 1.5px;
            }
        }
        &__bottom-container {
            @include flex(center, space-between);
            padding: 6px 12px 0px 12px;
            margin: 0px 0px 4px 0px;

            button:active {
                transform: scale(0.99);
            }
        }
    }
</style>