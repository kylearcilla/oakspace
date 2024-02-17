<script lang="ts">
    import { GoalItemUI, Icon } from "$lib/enums"
	import { goalsManager, editGoalManger, themeState } from "$lib/store"
	import { findAncestorByClass, getVertScrollStatus } from "$lib/utils-general"

	import GoalItem from "../../components/GoalItem.svelte"
	import SVGIcon from "../../components/SVGIcon.svelte"

    export let initGoalInEdit: (goal: Goal) => void

    const BOTTOM_GRADIENT = "linear-gradient(180deg, black 80%, transparent 99%)"
    const GOAL_CARD_CLASS = "goals-board__item"
    const DROP_DIVIDER_BOARD_WIDTH = 179

    let shouldDrag = false
    let isSpaceDown = false
    let isSpacePressedForDrag = false

    let dropTargetElem: HTMLElement | null = null
    let dragSourcElem: HTMLElement | null = null

    let boardCardsContainer: HTMLElement | null = null

    let hasReachedBoardEnd = false
    let maskListGradient = BOTTOM_GRADIENT

    let itemWidth = DROP_DIVIDER_BOARD_WIDTH
    let goalItemView = GoalItemUI.BoardCard

    $: GOAL_CARD_OVER_CLASS = `${GOAL_CARD_CLASS}--${goalItemView === GoalItemUI.BoardCard ? "board-over" : "list-over"}`
    $: { 
        goalItemView = $goalsManager!.boardGoalItemView

        if (goalItemView === GoalItemUI.BoardCard) {
            itemWidth = DROP_DIVIDER_BOARD_WIDTH
        }
        else {
            requestAnimationFrame(() => onWindowResize())
        }
    }

    const goalStatuses = [
        { color: "#CB6E6E", title: "On-Hold"}, 
        { color: "#D2B569", title: "In-Progress"}, 
        { color: "#8FD067", title: "Accomplished"}
    ]
    
    function boardScrollHandler(e: Event) {
        const [hasReachedEnd] = getVertScrollStatus(e.target as HTMLElement)
        hasReachedBoardEnd = hasReachedEnd

        if (!hasReachedBoardEnd) {
            maskListGradient = BOTTOM_GRADIENT
        }
        else {
            maskListGradient = ""
        }
    }

    /* General UI Handlers */
    function goalItemClicked(status: number, idx: number) {
        if (shouldDrag) return

        const goalInEdit = $goalsManager!.getGoalFromStatus(status, idx)!
        initGoalInEdit(goalInEdit)
    }

    /* Board Event Handlers */
    function onGoalCardMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement
        const handleElem = findAncestorByClass(target, "goals-board__item-handle")

        if (!handleElem && !isSpaceDown) {
            return 
        }

        shouldDrag = true
    }
    function onBoardDragEnter() {
        if (!dropTargetElem) return

        dropTargetElem.classList.remove(GOAL_CARD_OVER_CLASS)
        dropTargetElem = null
    }

    /* Drag Event Handlers */
    function onDragStartHandler(event: DragEvent) {        
        event.stopPropagation()

        if (!shouldDrag && !isSpaceDown) {
            event.preventDefault()
            return
        }


        isSpacePressedForDrag = isSpaceDown

        const target = event.target as HTMLElement
        if (target.tagName != "LI" || target.classList.contains("--dragging")) {
            event.preventDefault()
            return
        }
        
        dragSourcElem = target
        target.classList.add(`${GOAL_CARD_CLASS}--dragging`)
    }
    function onDragHandler(event: DragEvent) {
        event.preventDefault()
        return false
    }
    function onDragEndHandler(event: DragEvent) {
        event.stopPropagation()
        resetCurrentDragSourceTarget()
        resetCurrentDropTarget()
        return false
    }
    function onDragOverHandler(event: DragEvent) {

        event.stopPropagation()
        event.preventDefault()
        return false
    }
    function onDragEnterHandler(event: DragEvent) {
        event.stopPropagation()
        const target = event.target as HTMLElement
        const boardItem = findAncestorByClass(target, GOAL_CARD_CLASS)!

        
        if (boardItem.id === dragSourcElem!.id) {
            event.preventDefault()
            return false
        }
        
        resetCurrentDropTarget()
        dropTargetElem = boardItem
        dropTargetElem.classList.add(GOAL_CARD_OVER_CLASS)
    }
    function onDragLeaveHandler(event: DragEvent) {
        event.preventDefault()
        return false
    }
    function onDropHandler(event: DragEvent) {
        console.log("X")
        event.stopPropagation()

        if (!dropTargetElem) {
            event.preventDefault()
            return
        }

        $goalsManager!.updateGoalStatus(dragSourcElem!.id, dropTargetElem!.id)
        
        resetCurrentDragSourceTarget()
        resetCurrentDropTarget()

        return false
    }
    function resetCurrentDragSourceTarget() {
        if (!dragSourcElem) return
        dragSourcElem.classList.remove(`${GOAL_CARD_CLASS}--dragging`)
        dragSourcElem =  null
    }
    function resetCurrentDropTarget() {
        if (!dropTargetElem) return
        dropTargetElem.classList.remove(GOAL_CARD_OVER_CLASS)
        dropTargetElem =  null
    }

    function onWindowResize() {
        if (goalItemView === GoalItemUI.BoardCard) return
        itemWidth = boardCardsContainer?.clientWidth ?? DROP_DIVIDER_BOARD_WIDTH
    }

    /* Keyboard Handlers */
    function handleKeyDown(e: KeyboardEvent) {
        const target = e.target as HTMLElement
        if (e.code != "Space" || ["INPUT", "TEXTAREA"].includes(target.tagName)) return

        e.preventDefault()
        isSpaceDown = true
    }
    function handleKeyUp(e: KeyboardEvent) {
        if (e.code != "Space") return
        isSpaceDown = false

        if (isSpacePressedForDrag) {
            isSpacePressedForDrag = false
        }
        else {
            boardCardsContainer!.scrollTop += 250
        } 
    }

    // onMount(() => onWindowResize())
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} on:resize={onWindowResize}/>

{#if $goalsManager}
<div 
    class={`goals-board ${goalItemView === GoalItemUI.BoardList ? "goals-board--list" : ""} ${$themeState.isDarkTheme ? "" : "goals-board--light"}`} 
    on:dragenter={onBoardDragEnter}
>
    <!-- Column Headers -->
    <div class="goals-board__col-container">
        {#if goalItemView === GoalItemUI.BoardCard}
            {#each goalStatuses as status, idx}
                <div class="goals-board__col">
                    <div class="goals-board__col-header">
                        <div class="flx flx--algn-center flx--space-between">
                            <div class="flx flx--algn-center">
                                <div class={`goals-board__col-header-dot goals-board__col-header-dot--${idx}`}></div>
                                <div class="goals-board__col-header-title">
                                    {status.title}
                                </div>
                                <div class="goals-board__col-header-count">
                                    {$goalsManager?.userGoals[idx].length}
                                </div>
                            </div>
                            <button class="goals-board__col-header-add-btn">
                                +
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
    <!-- Board Cards Container -->
    <div 
        class={`goals-board__cards-container ${isSpaceDown ? "goals-board__cards-container--grabbing" : ""}`}
        style={`overflow-y: ${$editGoalManger ? "hidden" : "scroll"}; -webkit-mask-image: ${maskListGradient}; mask-image: ${maskListGradient};`}
        bind:this={boardCardsContainer}
        on:scroll={boardScrollHandler} 
    >
        {#each goalStatuses as status, statusIdx}
            <div class="goals-board__col">
                {#if goalItemView === GoalItemUI.BoardList}
                    <div class="goals-board__col-header">
                        <div class="flx flx--algn-center flx--space-between">
                            <div class="flx flx--algn-center">
                                <div class={`goals-board__col-header-dot goals-board__col-header-dot--${statusIdx}`}></div>
                                <div class="goals-board__col-header-title">
                                    {goalStatuses[statusIdx].title}
                                </div>
                                <div class="goals-board__col-header-count">
                                    {$goalsManager?.userGoals[statusIdx].length}
                                </div>
                            </div>
                            <button class="goals-board__col-header-add-btn">
                                +
                            </button>
                        </div>
                        <div class="goals-board__col-header-divider goals-board__divider"></div>
                    </div>
                {/if}
                <ul class="goals-board__col-goals-list" >
                    {#each $goalsManager?.userGoals[statusIdx] as goal, idx}
                        {#if goal}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <li 
                                class={`goals-board__item ${goalItemView === GoalItemUI.BoardList ? "goals-board__item--list" : "goals-board__item--card"}`}
                                id={`goal--${statusIdx}-${goal.idx}`}
                                draggable="true"
                                on:click={() => goalItemClicked(statusIdx, goal?.idx ?? 0)}
                                on:mousedown={(e) => onGoalCardMouseDown(e)}
                                on:dragover={onDragOverHandler}
                                on:dragenter={onDragEnterHandler}
                                on:dragleave={onDragLeaveHandler}
                                on:drop={onDropHandler}
                                on:drag={onDragHandler}
                                on:dragstart={onDragStartHandler}
                                on:dragend={onDragEndHandler}
                            >
                                {#if idx != 0}
                                    <div class="goals-board__item-divider goals-board__divider"></div>
                                {/if}
                                <div class="goals-board__item-drop-divider">
                                    <svg xmlns="http://www.w3.org/2000/svg" width={itemWidth} height="2" viewBox={`0 0 ${itemWidth} 2`} fill="none">
                                        <path d={`M0.567383 0.545898H${itemWidth}`} stroke-opacity="0.65" stroke-dasharray="3 3"/>
                                    </svg>
                                </div>
                                <div class="goals-board__item-handle goals-board-handle">
                                    <div class="goals-board__item-handle-dots goals-board-handle__dots">
                                        <SVGIcon icon={Icon.DragDots} options={{ scale: 0.8 }}/>
                                    </div>
                                </div>
                                <GoalItem goal={goal} status={statusIdx} appearance={goalItemView} />
                            </li>
                        {/if}
                    {/each}
                    <li 
                        class="goals-board__item goals-board__item--btn-container" 
                        style={`${goalItemView === GoalItemUI.BoardList ? "height: 40px;" : ""}`}
                        id={`goal--${statusIdx}--1`}
                        on:dragover={onDragOverHandler}
                        on:dragenter={onDragEnterHandler}
                        on:dragleave={onDragLeaveHandler}
                        on:drop={onDropHandler}
                    >
                        <div class="goals-board__item-drop-divider goals-board__divider">
                            <svg xmlns="http://www.w3.org/2000/svg" width={itemWidth} height="2" viewBox={`0 0 ${itemWidth} 2`} fill="none">
                                <path d={`M0.567383 0.545898H${itemWidth}`} stroke-opacity="0.65" stroke-dasharray="3 3"/>
                            </svg>
                        </div>
                        <button class="goals-board__col-add-new-goal-btn">
                            <SVGIcon icon={Icon.Add} options={{ scale: 0.65, strokeWidth: 1.6 }}/>
                            <span>New Goal</span>
                        </button>
                    </li>
                </ul>
            </div>
        {/each}
    </div>
</div>
{/if}

<style lang="scss">
    $board-col-gap: 20px;
    $board-top-offset-gap: 48px;
    $board-frame-top-offset-gap: 26px;
    $board-item-width: 195px;

    .goals-board {
        margin-top: 20px;
        position: relative;
        max-height: calc(100% - $board-top-offset-gap);
        height: calc(100% - $board-top-offset-gap);
        overflow-x: scroll;
        width: 100%;
        padding-left: 25px;

        &--light &__item {
            &--btn-container button {
                font-weight: 500;
            }
        }
        &--light &__col-header-title {
            @include text-style(0.95, 600);
        }
        &--light &__col-header-count {
            @include text-style(0.3, 500);
        }
        &--light &__divider {
            @include divider(rgba(black, 0.05));
        }
        &--light#{&}--list &__item:hover {
            background-color: rgba(black, 0.02);
        }
        &--light &__col-add-new-goal-btn span {
            @include text-style(1, 600);
        }

        &--list {
            margin-top: 10px;
            padding-left: 0px;
        }
        &--list &__cards-container {
            display: block;
        }
        &--list &__item {
            width: 100%;
            padding: 0px 0px 12px 25px;

            &:nth-last-child(2){
                margin-bottom: 5px;
            }
            &:hover {
                background-color: rgba(white, 0.008);
            }
        }
        &--list &__item-divider {
            display: block;
        }
        &--list &__col {
            margin: 0px 0px 0px 0px;

            &-add-new-goal-btn {
                margin: -3px 20px 0px 0px;
                float: right;
            }
        }
        &--list &__col-header {
            padding: 0px 20px 0px 25px;
            width: 100%;
        }

        &__divider {
            @include divider(rgba(white, 0.045));
        }

        /* Board */
        &__cards-container {
            display: flex;
            max-height: calc(100% - $board-frame-top-offset-gap);
            overflow-y: scroll;
            overflow-x: hidden;
            width: 100%;
            min-width: 650px;
            scroll-behavior: smooth;

            &--grabbing * {
                cursor: grab !important;
            }
        }
        &__item {
            width: $board-item-width;
            position: relative;
            cursor: pointer;
            height: auto;
            transition: 0.12s ease-in-out;
            
            &:active {
                transform: scale(0.997);
            }
            &--dragging {
                cursor: grabbing !important;
                opacity: 0.3;
            }
            &--dragging * {
                cursor: grabbing !important;
            }
            &--list:hover &-handle-dots {
                @include visible(0.09);
            }
            &--list &-handle {
                @include pos-abs-top-left-corner(50%);
                transform: translateY(-50%);
            }
            &--list &-handle-dots:hover {
                opacity: 0.5;
            } 
            &--board-over &-drop-divider {
                opacity: 1;
                padding: 15px 0px 15px 0px;
            }
            &--list-over &-drop-divider {
                opacity: 0.5;
                padding: 0px 0px 15px 0px;
            }
            &--list-over &-divider {
                display: none;
            }
            &--btn-container {
                height: 150px;
                width: 100%;
                background: none !important;

                &:active {
                    transform: scale(1);
                }
                &:hover, &:focus {
                    filter: brightness(1);
                }
            }
            &--btn-container &-drop-divider {
                background: none;
            }
        }
        &__item-handle {
            width: 100%;
            height: 8px;
            cursor: grab;
            z-index: 1;
            @include flex(center);
            @include pos-abs-top-left-corner(5px);

            &:active {
                cursor: grabbing !important;
            }
        }
        &__item-divider {
            @include pos-abs-top-left-corner;
            @include divider(rgba(white, 0.045), 0.5px, calc(100% - 50px));
            margin-left: 25px;
            display: none;
        }
        &__item-drop-divider {
            width: 100%;
            @include flex(center, center);
            transition: 0.12s ease-in-out;
            opacity: 0;
            padding-top: 5px;
            
            path {
                stroke: rgba(var(--textColor1), 0.24);
            }
        }

        /* Board Columns */
        &__col {
            margin-right: $board-col-gap;
        }
        &__col-goals-list {
            &:hover .goals-board__col-add-new-goal-btn {
                @include visible(0.35);
            }
            &:hover .goals-board__col-add-new-goal-btn:hover {
                opacity: 0.8;
            }
        }
        &__col-container {
            @include flex(center, _);
        }
        &__col-add-new-goal-btn {
            @include flex(center, _);
            @include not-visible;
            cursor: pointer;
            margin-top: 6px;
            
            &:active {
                transform: scale(0.99);
            }
            span {
                @include text-style(_, 400, 1.2rem);
                margin-left: 7px;
            }
        }
        &__col-header {
            margin: 0px 6px 0px 0px;
            min-width: $board-item-width;
            position: relative;

            &:hover &-add-btn {
                color: rgba(var(--textColor1), 0.2);
            }

            &-dot {
                @include circle(3px);
                margin-right: 10px;
                
                &--0 {
                    background-color: #CB6E6E;
                }
                &--1 {
                    background-color: #D2B569;
                }
                &--2 {
                    background-color: #8FD067;
                }
            }
            &-add-btn {
                @include text-style(0, 200, 2.1rem);

                &:hover {
                    color: rgba(var(--textColor1), 0.75) !important;
                }
                &:active {
                    transform: scale(0.94);
                }
            }
            &-title {
                margin-right: 15px;
                @include elipses-overflow;
                @include text-style(0.7, 300, 1.17rem);
            }
            &-count {
                font-family: "DM Mono";
                @include text-style(0.2, _, 1.2rem);
            }
            &-divider {
                margin: 3px 0px 5px 0px;
            }
        }
    }

    .goals-board-handle {
        cursor: grab;
        &:active {
            cursor: grabbing;
        }
        &__dots {
            transition: 0.12s ease-in-out;
            @include not-visible;
        }
    }
</style>