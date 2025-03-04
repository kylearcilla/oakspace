<script lang="ts">
    import { onDestroy, onMount } from "svelte"
	import { themeState, weekRoutine } from "$lib/store"

	import { Icon } from "$lib/enums"
    import { timer } from "$lib/store"
	import { getMaskedGradientStyle } from "$lib/utils-general"
	import { getDayIdxMinutes, minsFromStartToHHMM } from "$lib/utils-date"
	import { 
            getBlockFromIdx, getNextBlockInfo, getMostRecentBlock, 
            getUpcomingBlock, getCurrentBlock, getDayRoutineFromWeek, updateActiveRoutine
    } from "$lib/utils-routines"
    
	import SvgIcon from "$components/SVGIcon.svelte"
	import TasksList from "$components/TasksList.svelte"

    export let isOpen: boolean
    export let type: "active" | "side-menu" = "active"
    export let block: { block: RoutineBlock, idx: number } | undefined = undefined
    export let currDayIdx: number | undefined = undefined

    $: routine = $weekRoutine
    $: light = !$themeState.isDarkTheme

    let todayRoutine: RoutineBlock[] | DailyRoutine | null = null 
    let currTime = getDayIdxMinutes()
    let nowBlock  = block ?? null
    let nowBlockIdx = null
    
    let nextBlock: { block: RoutineBlock, idx: number } | null = null
    let prevBlock: { block: RoutineBlock, idx: number } | null = null
    let tasks: Task[] = []
    
    let routineItemsRef: HTMLElement
    let textEditorElem: HTMLElement
    let textGradient = ""
    let renderFlag = false
    let doInitNow = true
    let noneActive = false
    
    $: dayIdx = currDayIdx ?? currTime.dayIdx
    $: tasks  = nowBlock?.block?.tasks ?? []

    $: {
        todayRoutine = getDayRoutineFromWeek(routine, dayIdx)
        initNowBlock(todayRoutine)
    }
    $: {
        doInitNow = isOpen ? doInitNow : true
    }
    const unsubscribe = timer.subscribe(() => currTime = getDayIdxMinutes())

    function initNowBlock(todayRoutine: RoutineBlock[] | DailyRoutine | null) {
        if (!todayRoutine) return

        const mins = (type === "side-menu" || !doInitNow) ? nowBlock!.block.startTime : currTime.minutes
        const now  = getCurrentBlock(todayRoutine, mins)
        const prev = getMostRecentBlock(mins, todayRoutine)
        const next = getUpcomingBlock(mins, todayRoutine)

        nextBlock = next
        prevBlock = prev

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
            const viewBlock = dir === "next" ? nextBlock : prevBlock
            if (!viewBlock) {
                return
            }

            nowBlock = viewBlock
            nowBlockIdx = viewBlock.idx
        }
        else {
            nowBlockIdx = dir === "next" ? nowBlockIdx! + 1 : nowBlockIdx! - 1
            nowBlock = getBlockFromIdx(nowBlockIdx, todayRoutine)
        }
        doInitNow = false

        prevBlock = getBlockFromIdx(nowBlockIdx - 1, todayRoutine)
        nextBlock = getBlockFromIdx(nowBlockIdx + 1, todayRoutine)

        requestAnimationFrame(() => onBlockUpdate())
    }
    function onBlockUpdate() {
        handleGradient(textEditorElem)
        renderFlag = !renderFlag
    }
    function handleGradient(elem: HTMLElement) {
        if (!elem) return

        textGradient = getMaskedGradientStyle(elem, {
            head: {
                start: "2px",
                end: "2px"
            },
            tail: {
                start: "10%",
                end: "100%"
            }
        }).styling
    }
    function saveBlock(updates: Partial<RoutineBlock>) {
        updateActiveRoutine({
            updates,
            startTime: nowBlock!.block.startTime,
            dayIdx
        })
    }
    onMount(() => {
        handleGradient(textEditorElem)
        if (todayRoutine) {
            initNowBlock(todayRoutine)
            onBlockUpdate()
        }
    })
    onDestroy(() => unsubscribe())
</script>

<div 
    class="active-routine"
    class:active-routine--empty={!nowBlock}
    class:active-routine--light={light}
    class:active-routine--side-menu={type === "side-menu"}
>
    {#if nowBlock}
        {@const { description, title, startTime, endTime, done } = nowBlock.block}
        <div class="active-routine__header">
            <div class="flx">
                <button 
                    class="active-routine__checkbox"
                    class:active-routine__checkbox--checked={done}
                    class:hidden={dayIdx !== currTime.dayIdx}
                    on:click={() => {
                        saveBlock({ done: !done })
                    }}
                >
                    <i class="fa-solid fa-check"></i>
                </button>  
                <div 
                    {title}
                    class="active-routine__title" 
                    class:strike={done}
                >
                    {title}
                </div>
            </div>
            <!-- buttons -->
            <div class="active-routine__btns" class:hidden={type === "side-menu"}>
                <button 
                    on:click={() => getBlock("prev")}
                    disabled={prevBlock === null}
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
                    class:obscured={type === "side-menu"}
                    on:click={() => {
                        doInitNow = true
                        initNowBlock(todayRoutine)
                    }} 
                >
                </button>
                <button 
                    on:click={() => getBlock("next")}
                    disabled={nextBlock === null}
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
        <div 
            class="active-routine__time" 
            class:hidden={!nowBlock || type === "side-menu"}
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
            class="active-routine__description"
            class:active-routine__description--no-tasks={tasks.length === 0}
            class:active-routine__description--side-menu={type === "side-menu"}
            class:hidden={!description}
            style={textGradient}
            contenteditable="true"
            bind:this={textEditorElem}
            on:pointerdown|preventDefault
            on:scroll={() => handleGradient(textEditorElem)}
        >
            {@html description}
        </div>
        <!-- tasks -->
        <div 
            class="active-routine__action-items" 
            bind:this={routineItemsRef}
        >
            {#key renderFlag}
                <TasksList
                    tasks={tasks}
                    allowInitTasksCall={false}
                    onTaskChange={(tasks) => saveBlock({ tasks })}
                    options={{
                        id: "active-routine",
                        hotkeyFocus: "default",
                        settings: {
                            allowEdit: false,
                            maxDepth: 2
                        },
                        ui: { 
                            sidePadding: "17px",
                            fontSize: "1.425rem",
                            checkboxDim: "15px",
                            padding: "9px 0px 6px 0px",
                            hasTaskDivider: true
                        },
                        rootRef: routineItemsRef
                    }}
                />
            {/key}
        </div>
    {:else}
        <div style:text-align="center">
            <div class="active-routine__empty">
                No Active Routine
            </div>
            <div class="active-routine__empty-subtitle">
                {#if nextBlock}
                    <strong>
                        {getNextBlockInfo(todayRoutine).info ?? ""}
                    </strong>
                {:else}
                    Done for the day! 👏
                {/if}
            </div>
        </div>
        <div class="active-routine__bottom-container active-routine__btns">
            <button 
                disabled={prevBlock === null}
                title="Go to prev block"
                style:margin-left="-2px"
                on:click={() => getBlock("prev")}
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
                disabled={nextBlock === null}
                title="Go to next block"
                style:margin-right="-10px"
                on:click={() => getBlock("next")}
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

<style lang="scss">
    @import "../../scss/inputs.scss";

    .active-routine {
        border-radius: 13px;
        padding: 2px 0px 0px 0px;
        position: relative;
        width: 340px;
        max-width: 340px;
        @include contrast-bg("bg-3");

        &--light &__description {
            @include text-style(1);
        }
        &--light &__time {
            @include text-style(0.6);
        }
        &--light &__empty {
            @include text-style(0.95);
        }
        &--light &__empty-subtitle {
            @include text-style(0.7);
        }
        &--light &__empty-subtitle strong {
            @include text-style(0.4);
        }
        &--empty &__bottom-container {
            padding: 0px 18px 6px 9px;
        }
        &--side-menu &__title{
            max-width: 310px;
        }

        &__header {
            @include flex(center, space-between);
            padding: 2px 18px 0px 16px;
            margin: 2px 0px 5px 0px;
            height: 35px;
        }
        &__title {
            @include text-style(1, var(--fw-400-500), 1.65rem, "Geist Mono");
            @include elipses-overflow;
            margin: 1px 20px 0px 0px;
            min-width: 0px;
            max-width: 210px;
            height: 20px;
        }
        &__title.strike {
            opacity: 0.5;
        }
        &__checkbox {
            @include square(15px, 0px);
            background-color: rgba(var(--textColor1), 0.08);
            margin: 4px 10px 0px 0px;
            font-size: 1rem;
            @include center;
            
            &:hover {
                background-color: rgba(var(--textColor1), 0.1);
            }
            &--checked {
                background-color: var(--elemColor1) !important;
                color: var(--elemTextColor);
            }
            &--checked i {
                display: block !important;
            }
            i {
                display: none;
            }
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
            }
            &[title="Go to current block"]:before {
                content: "•";
                @include abs-center;
            }
            &:last-child {
                padding-right: 5px;
            }
            &:disabled {
                opacity: 0.1 !important;
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
                @include text-style(1, 400, 1.2rem);
            }
        }
        &__time {
            @include text-style(0.3, var(--fw-400-500), 1.35rem);
            white-space: nowrap;
            margin: -2px 0px 0px 15px
        }
        &__description {
            padding: 9px 17px 4px 15px;
            @include text-style(0.65, var(--fw-400-500), 1.39rem);
            overflow: scroll;
            max-height: 100px;
            
            &--no-tasks {
                max-height: 200px;
                padding-bottom: 10px;
            }
            &--side-menu {
                padding-top: 0px;
                margin: -2px 0px 5px 0px;
            }
        }
        &__divider {
            height: 2px;
            margin: 0px 18px 0px 18px;
            border-top: 1.5px dashed rgba(var(--textColor1), 0.07);
        }
        &__action-items {
            position: relative;
            max-height: 400px;
            overflow: auto;
            margin-top: 1px;
        }
        &__empty {
            @include text-style(0.3, var(--fw-400-500), 1.395rem);
            padding: 16px 0px 7px 0px;
        }
        &__empty-subtitle {
            @include text-style(0.8, var(--fw-400-500), 1.45rem, "DM Sans");
            margin-bottom: 12px;

            strong {
                @include text-style(0.2, var(--fw-400-500));
            }
        }
        &__bottom-container {
            @include flex(center, space-between);
            padding: 6px 12px 0px 12px;
            margin: 0px 0px 4px 0px;

            span {
                font-size: 1.35rem !important;
            }
            button:active {
                transform: scale(0.99);
            }
        }
    }
</style>