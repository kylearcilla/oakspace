<script lang="ts">
	import { onDestroy, onMount } from "svelte"

    import type { GoalStatus } from "$lib/enums"
	import { formatDateLong } from "$lib/utils-date"
	import { findAncestorByClass, getScrollStatus } from "$lib/utils-general"
	import { goalsManager, editGoalManger, themeState } from "$lib/store"

    export let initGoalInEdit: (goal: Goal) => void

    let shouldDrag = false
    let isSpaceDown = false
    let isSpacePressedForDrag = false

    let dropTargetElem: HTMLElement | null = null
    let dragSourcElem: HTMLElement | null = null

    let boardCardsContainer: HTMLElement | null = null
    let goalInViewId: string | null = null

    let hasReachedBoardEnd = false
    let maskListGradient = ""

    const goalStatuses = [
        { color: "#CB6E6E", title: "On-Hold"}, 
        { color: "#D2B569", title: "In-Progress"}, 
        { color: "#8FD067", title: "Accomplished"}
    ]
    const GOAL_CARD_CLASS = "goals-board__item"
    
    function boardScrollHandler(e: Event) {
        const [hasReachedEnd] = getScrollStatus(e.target as HTMLElement)
        hasReachedBoardEnd = hasReachedEnd

        if (!hasReachedBoardEnd) {
            maskListGradient = "linear-gradient(180deg, black 80%, transparent 99%)"
        }
    }

    /* General UI Handlers */
    function goalItemClicked(goalId: string) {
        let status = parseInt(goalId[6]) as GoalStatus
        let idx = parseInt(goalId.substring(8, goalId.length), 10)

        const goalInEdit = $goalsManager!.getGoal(status, idx)!
        initGoalInEdit(goalInEdit)
    }

    /* Board Event Handlers */
    function onGoalCardClicked() {
        if (!goalInViewId) return
        goalItemClicked(goalInViewId)
        goalInViewId = null
    }
    function onGoalCardMouseDown(event: MouseEvent, id: string) {
        const target = event.target as HTMLElement
        shouldDrag = target.classList.value.includes("item-handle")

        if (!shouldDrag && (target.tagName === "DIV" || target.tagName === "IMG")) {
            goalInViewId = id
        }
    }
    function onBoardDragEnter() {
        if (!dropTargetElem) return

        dropTargetElem.classList.remove(`${GOAL_CARD_CLASS}--over`)
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
        dropTargetElem.classList.add(`${GOAL_CARD_CLASS}--over`)
    }
    function onDragLeaveHandler(event: DragEvent) {
        event.preventDefault()
        return false
    }
    function onDropHandler(event: DragEvent) {
        event.stopPropagation()

        if (!dropTargetElem) {
            event.preventDefault()
            return
        }

        // duplicate and insert before elem
        // const newElement = document.createElement('li')
        // newElement.className = `"${GOAL_CARD_CLASS}
        //`newElement.draggable = true
        // newElement.id = dragSourcElem!.id
        // newElement.innerHTML = event.dataTransfer!.getData('text/html')

        $goalsManager!.updateGoalStatus(dragSourcElem!.id, dropTargetElem!.id)

        // const firstChild = newElement.firstChild as HTMLElement
        // if (firstChild.tagName === "META") {
        //     newElement.firstChild!.remove()
        // }

        // addBoardItemDragEventHandlers(newElement)
        // dropTargetElem!.parentNode!.insertBefore(newElement, dropTargetElem!)

        // dragSourcElem!.remove()
        
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
        dropTargetElem.classList.remove(`${GOAL_CARD_CLASS}--over`)
        dropTargetElem =  null
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
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

{#if $goalsManager}
<div 
    class={`goals-board ${$themeState.isDarkTheme ? "" : "goals-board--light"}`} 
    on:dragenter={onBoardDragEnter}
>
    <!-- Column Headers -->
    <div class="goals-board__col-container">
        <div class="goals-board__col-header">
            <div class="flx flx--algn-center">
                <div class="goals-board__col-header-dot goals-board__col-header-dot--on-hold"></div>
                <div class="goals-board__col-header-title">
                    On-Hold
                </div>
                <div class="goals-board__col-header-count">
                    {$goalsManager?.userGoals[0].length}
                </div>
            </div>
            <button class="goals-board__col-header-add-btn">
                +
            </button>
        </div>
        <div class="goals-board__col-header">
            <div class="flx flx--algn-center">
                <div class="goals-board__col-header-dot goals-board__col-header-dot--in-progress"></div>
                <div class="goals-board__col-header-title">
                    In-Progress
                </div>
                <div class="goals-board__col-header-count">
                    {$goalsManager?.userGoals[1].length}
                </div>
            </div>
            <button class="goals-board__col-header-add-btn">
                +
            </button>
        </div>
        <div class="goals-board__col-header">
            <div class="flx flx--algn-center">
                <div class="goals-board__col-header-dot goals-board__col-header-dot--accomplished"></div>
                <div class="goals-board__col-header-title">
                    Accomplished
                </div>
                <div class="goals-board__col-header-count">
                    {$goalsManager?.userGoals[2].length}
                </div>
            </div>
            <button class="goals-board__col-header-add-btn">
                +
            </button>
        </div>
    </div>
    <!-- Board Cards Container -->
    <div 
        class={`goals-board__cards-container ${isSpaceDown ? "goals-board__cards-container--grabbing" : ""}`}
        style={`overflow-y: ${$editGoalManger ? "hidden" : "scroll"}; -webkit-mask-image: ${maskListGradient}; mask-image: ${maskListGradient};`}
        bind:this={boardCardsContainer}
        on:scroll={boardScrollHandler} 
    >
        {#each goalStatuses as status, idx}
            <div class="goals-board__col">
                <ul class="goals-board__col-goals-list" >
                    {#each $goalsManager?.userGoals[idx] as goal}
                        {#if goal}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <li 
                                class="goals-board__item" id={`goal--${idx}-${goal?.idx}`}
                                draggable="true"
                                on:click={onGoalCardClicked}
                                on:mousedown={(e) => onGoalCardMouseDown(e, `goal--${idx}-${goal?.idx}`)}
                                on:dragover={onDragOverHandler}
                                on:dragenter={onDragEnterHandler}
                                on:dragleave={onDragLeaveHandler}
                                on:drop={onDropHandler}
                                on:drag={onDragHandler}
                                on:dragstart={onDragStartHandler}
                                on:dragend={onDragEndHandler}
                            >
                                <div class="goals-board__item-divider">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="2" viewBox="0 0 200 2" fill="none">
                                        <path d="M0.567383 0.545898H215.092" stroke-opacity="0.65" stroke-dasharray="3 3"/>
                                    </svg>
                                </div>
                                <div class={`goal-card ${$themeState.isDarkTheme ? "" : "goal-card--light"}`}>
                                    <div class="goals-board__item-handle"></div>
                                    {#if !goal.isImgHidden}
                                        <img class="goal-card__img" src={goal?.imgSrc} alt="goal-img" />
                                    {/if}
                                    <div class="goal-card__details">
                                        <h5 class="goal-card__name" title={goal?.title}>
                                            {goal?.title}
                                        </h5>
                                        {#if goal.dueDate}
                                            <span class="goal-card__target-date" title="Target Date">
                                                {formatDateLong(goal.dueDate)}
                                            </span>
                                        {/if}
                                        <p class="goal-card__description" title={goal?.description}>
                                            {goal?.description}
                                        </p>
                                        <div class="goal-card__bottom-details">
                                            <div class="goal-card__status">
                                                <div class="goal-card__status-dot" style={`background-color: ${status.color}`}></div>
                                                <span>{status.title}</span>
                                            </div>
                                            {#if goal?.milestones && goal.milestones.length > 0}
                                                <div class="goal-card__milestones" title="Milestones">
                                                    {`${goal?.milestonesDone} / ${goal?.milestones.length}`}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        {/if}
                    {/each}
                    <li 
                        class="goals-board__item goals-board__item--btn-container" 
                        id={`goal--${idx}--1`}
                        on:dragover={onDragOverHandler}
                        on:dragenter={onDragEnterHandler}
                        on:dragleave={onDragLeaveHandler}
                        on:drop={onDropHandler}
                    >
                        <div class="goals-board__item-divider">
                            <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="2" viewBox="0 0 200 2" fill="none">
                                <path d="M0.567383 0.545898H215.092" stroke-opacity="0.65" stroke-dasharray="3 3"/>
                            </svg>
                        </div>
                        <button class="goals-board__col-add-new-goal-btn">
                            <span>+</span>
                            Add New Goal
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
            &:hover, &:focus {
                filter: brightness(1.02);
            }

            &--btn-container button {
                font-weight: 500;
            }
        }
        &--light &__col-header {
            &-title {
                @include text-style(0.8, 600);
            }
            &-count {
                @include text-style(0.3, 500);
            }
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
            transition: 0.09s ease-in-out;
            cursor: pointer;
            position: relative;

            &:active {
                transform: scale(0.997);
            }
            &:hover, &:focus {
                filter: brightness(1.12);
            }

            &--dragging {
                cursor: grabbing !important;
                opacity: 0.3;
            }
            &--dragging * {
                cursor: grabbing !important;
            }
            &--over &-divider {
                opacity: 1;
                padding: 15px 0px 15px 0px;
            }
            &--btn-container {
                height: 150px;

                &:active {
                    transform: scale(1);
                }
                &:hover, &:focus {
                    filter: brightness(1);
                }
            }
        }
        &__item-handle {
            width: 100%;
            height: 10px;
            @include pos-abs-top-left-corner(2px, 0px);
            cursor: grab;

            &:active {
                cursor: grabbing !important;
            }
            
        }
        &__item-divider {
            width: 100%;
            @include flex-container(center, center);
            transition: 0.1s ease-in-out;
            opacity: 0;
            padding-top: 5px;
            
            path {
                stroke: rgba(var(--textColor1), 0.24);
            }
        }

        /* Board Columns */
        &__col {
            margin-right: $board-col-gap;

            &:hover &-add-new-goal-btn {
                opacity: 0.3;
            }
            &-container {
                @include flex-container(center, _);
            }
            &-add-new-goal-btn {
                @include flex-container(center, _);
                font-size: 1.15rem;
                font-weight: 300;
                opacity: 0;
                padding-bottom: 100px;
                cursor: pointer;
                margin-top: 6px;
                
                &:active {
                    transform: scale(0.99);
                }
                &:hover {
                    opacity: 0.5 !important;
                }
                span {
                    margin-right: 7px;
                    font-size: 1.4rem;
                }
            }
        }
        &__col-header {
            @include flex-container(center, space-between);
            margin: 0px $board-col-gap 0px 0px;
            min-width: $board-item-width;

            &:hover &-add-btn {
                color: rgba(var(--textColor1), 0.2);
            }

            &-dot {
                @include circle(3px);
                margin-right: 10px;
                
                &--on-hold {
                    background-color: #CB6E6E;
                }
                &--in-progress {
                    background-color: #D2B569;
                }
                &--accomplished {
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
        }
    }

    /* Goal Card */
    .goal-card {
        background-color: var(--bentoBoxBgColor);
        box-shadow: var(--bentoBoxShadow);
        border-radius: 15px;
        padding: 7.5px 7.5px 11px 7.5px;
        font-weight: 300;
        border: 0.5px solid rgba(var(--textColor1), 0.029);
        position: relative;
        transition: 0.12s ease-in-out;
        position: relative;

        &--light  {
            border-color: transparent;
            }
        &--light &__name { 
            @include text-style(0.87, 600);
        }
        &--light &__description {
            @include text-style(0.58, 500, 1.15rem);
        }
        &--light &__status {
            @include text-style(0.8, 600);
        }
        &--light &__milestones {
            @include text-style(0.5, 500);
        }
        &--light &__target-date {
            @include text-style(0.3, 400, 1.1rem);
        }

        &__img {
            width: 100%;
            margin-bottom: 9px;
            border-radius: 10px;
            object-fit: cover;
            height: 110px;
        }
        &__details {
            padding: 1px 7px 0px 3px;
        }
        &__name, &__description, &__status-dot, &__status, &__milestones {
            cursor: text;
            user-select: text;
            font-size: 1.08rem;
        }
        &__name {
            @include text-style(0.77, 500, 1.24rem);
            margin-bottom: 6px;
            width: fit-content;
            max-width: 95%;
            @include multi-line-elipses-overflow(2);
        }
        &__target-date {
            @include text-style(0.24, 200, 1.1rem);
            margin-bottom: 7px;
            display: inline-block;
            font-family: "DM Sans";
        }
        &__description {
            @include text-style(0.36, _, 1.15rem);
            margin-bottom: 14px;
            width: fit-content;
            white-space: pre-wrap;
            word-break: break-word;
            @include multi-line-elipses-overflow(11);
        }
        &__bottom-details {
            @include flex-container(center, space-between);
        }
        &__bottom-details-left {
            @include flex-container(center, _);
        }
        &__status-dot {
            @include circle(2.5px);
            margin-right: 7px;
        }
        &__status {
            @include text-style(0.44, 400);
            margin-right: 6.5px;
            @include flex-container(center, _);
        }
        &__milestones {
            @include text-style(0.24);
            font-family: "DM Sans";

        }
    }
</style>