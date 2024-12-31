<script lang="ts">
    import { onDestroy, onMount } from "svelte"
	import { themeState, weekRoutine } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { TextEditorManager } from "$lib/inputs"
    import { getElemById } from "../../lib/utils-general"
    import { RoutinesManager } from "$lib/routines-manager"
	import { getMaskedGradientStyle } from "$lib/utils-general"
	import { getDayIdxMinutes, minsFromStartToHHMM } from "$lib/utils-date"
	import { 
            getBlockFromOrderIdx, getNextBlockInfo, getMostRecentBlock, 
            getUpcomingBlock, getCurrentBlock, getDayRoutineFromWeek, updateActiveRoutine
    } from "$lib/utils-routines"
    
	import SvgIcon from "../../components/SVGIcon.svelte"
	import TasksList from "../../components/TasksList.svelte"

    export let isOpen: boolean
    export let type: "active" | "side-menu" = "active"
    export let currDayIdx: number | undefined = undefined
    export let currBlock: { block: RoutineBlock, idx: number } | undefined = undefined

    $: routine     = $weekRoutine
    $: isDarkTheme = $themeState.isDarkTheme

    const INPUT_ID = "active-routine-description" 
    const DESCR_MAX = RoutinesManager.MAX_DESCRIPTION

    let todayRoutine: RoutineBlock[] | DailyRoutine | null = null 
    let doInitNow = true
    let noneActive = false
    let nowBlockIdx = type === "side-menu" ? currBlock.idx : null

    $: nowBlock = type === "side-menu" ? currBlock : null
    let nextViewBlock: { block: RoutineBlock, idx: number } | null = null
    let prevViewBlock: { block: RoutineBlock, idx: number } | null = null
    
    // time
    let minuteInterval: NodeJS.Timeout | null = null
    let currTime = getDayIdxMinutes()
    
    // description 
    let routineItemsRef: HTMLElement
    let textEditorElem: HTMLElement
    let textGradient = ""
    
    let renderFlag = false
    let editor: TextEditorManager
    
    $: dayIdx = currDayIdx ?? currTime.dayIdx
    $: tasks = nowBlock?.block.tasks ?? []
    $: description = nowBlock?.block.description ?? ""

    $: {
        todayRoutine = getDayRoutineFromWeek(routine, dayIdx)
    }
    $: {
        initNowBlock(todayRoutine)
        onBlockUpdate()
    }
    $: {
        doInitNow = isOpen ? doInitNow : true
    }

    /* blocks */
    function initNowBlock(todayRoutine: RoutineBlock[] | DailyRoutine | null) {
        if (!todayRoutine) return

        const mins = (type === "side-menu" || !doInitNow) ? nowBlock.block.startTime : currTime.minutes
        const now  = getCurrentBlock(todayRoutine, mins)
        const prev = getMostRecentBlock(mins, todayRoutine)
        const next = getUpcomingBlock(mins, todayRoutine)

        nextViewBlock = next
        prevViewBlock = prev

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
            if (!viewBlock) {
                return
            }

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
            editor.updateText(description)
        }

        renderFlag = !renderFlag
    }
    function initDescriptionEditor() {
        return new TextEditorManager({
            initValue: description,
            placeholder: "no description...",
            allowFormatting: false,
            maxLength: DESCR_MAX,
            id: INPUT_ID,
            handlers: {
                onBlurHandler: (_, val) => {
                    description = val
                    saveBlock({ 
                        description
                    })
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
    function saveBlock(updates: Partial<RoutineBlock>) {
        updateActiveRoutine({
            updates,
            startTime: nowBlock!.block.startTime,
            dayIdx
        })
    }

    onMount(() => {
        handleGradient(textEditorElem)
        editor = initDescriptionEditor()

        if (type != "active") return

        clearInterval(minuteInterval!)
        minuteInterval = setInterval(() => {
            currTime = getDayIdxMinutes()
            dayIdx = currTime.dayIdx
        }, 1000)
    })
    onDestroy(() => clearInterval(minuteInterval!))
</script>

<div 
    class="active-routine"
    class:active-routine--empty={!nowBlock}
    class:active-routine--light={!isDarkTheme}
    class:active-routine--side-menu={type === "side-menu"}
    style:padding-bottom={tasks.length > 0 ? "2px" : "8px"}
    style:width={type === "side-menu" ? tasks.length > 0 ? "500px" : description ? "440px" : "400px" : "340px"}
>
    {#if nowBlock}
        {@const { description, title, startTime, endTime } = nowBlock.block}
        <div 
            class="active-routine__header"
            class:r-flx-sb={type === "side-menu"}
        >
            <div class="flx">
                <button 
                    class="active-routine__checkbox"
                    class:active-routine__checkbox--checked={nowBlock.block.done}
                    class:hidden={dayIdx !== currTime.dayIdx}
                    on:click={() => {
                        saveBlock({
                            done: !nowBlock.block.done
                        })
                    }}
                >
                    <i class="fa-solid fa-check"></i>
                </button>  
                <!-- title -->
                <div 
                    class="active-routine__title" {title}
                    class:strike={nowBlock.block.done}
                >
                    {title}
                </div>
            </div>
            <!-- buttons -->
            <div 
                class="active-routine__btns" 
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
            <div 
                class="active-routine__action-items" 
                style:margin-top={"-3px"}
                bind:this={routineItemsRef}
            >
                {#key renderFlag}
                    <TasksList
                        {tasks}
                        allowInitTasksCall={false}
                        onTaskChange={(tasks) => {
                            saveBlock({ tasks })
                        }}
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
                        {getNextBlockInfo(todayRoutine).info ?? ""}
                    </strong>
                {:else}
                    Done for the Day!
                {/if}
            </div>
        </div>
        <div class="active-routine__bottom-container active-routine__btns">
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


<style lang="scss">
    @import "../../scss/inputs.scss";

    .active-routine {
        background-color: #1e1e1e;
        border: 1.5px solid rgba(var(--textColor1), 0.03);
        border-radius: 9px;
        padding: 0px 0px 5px 0px;
        position: relative;

        &--side-menu {
            border-radius: 8px;
            border: none;
            padding: 3px 0px 12px 0px;
            min-height: 100px;
            background: var(--modalBgColor)
        }
        &--side-menu &__time {
            margin-bottom: 10px;
        }
        &--light .input-box {
            @include input-box--light;        
        }
        &--light &__title {
            @include text-style(0.9, 600);
        }
        &--light &__description {
            @include text-style(0.85, 600);
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
            padding: 2px 18px 0px 18px;
            margin: 2px 0px 2px 0px;
            height: 35px;
        }
        &__title {
            @include text-style(1, 500, 1.54rem);
            @include elipses-overflow;
            margin: 0px 12px 0px 0px;
            min-width: 0px;
            max-height: 60px;
            cursor: default;
        }
        &__title.strike {
            opacity: 0.5;
        }
        &__checkbox {
            @include square(14px, 5px);
            background-color: rgba(var(--textColor1), 0.05);
            border: 1.5px solid rgba(var(--textColor1), 0.05);
            margin: 2px 10px 0px 0px;
            @include center;
            font-size: 1rem;
            
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
            @include text-style(0.3, 400, 1.48rem, "DM Sans");
            white-space: nowrap;
            margin: 2px 0px 8px 18px;
        }
        &__description {
            padding: 0px 17px 10px 17px;
            @include text-style(0.65, 400, 1.5rem);
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
        &__action-items {
            position: relative;
        }
        &__no-routine {
            @include text-style(0.3, 500, 1.4rem);
            padding: 15px 0px 8px 0px;
        }
        &__no-routine-subtitle {
            @include text-style(0.8, 400, 1.45rem, "DM Sans");
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

            span {
                font-size: 1.35rem !important;
            }
            button:active {
                transform: scale(0.99);
            }
        }
    }
</style>