<script lang="ts">
	import { GoalItemUI, GoalStatus, Icon } from "$lib/enums"
	import { goalsManager, themeState } from "$lib/store"
	import { findAncestor, getElemById } from "$lib/utils-general"
	import SVGIcon from "../../components/SVGIcon.svelte"
	import GoalItem from "../../components/GoalItem.svelte"
	import { onMount } from "svelte";

    export let initGoalInEdit: (goal: Goal) => void

    const DROP_DIVIDER_BOARD_WIDTH = 179

    const GOAL_ITEM_CLASS = "goals-repo-item"
    const GOAL_SECTION_CLASS = "goals-repo__section"
    const GOAL_SECTION_OVER_CLASS = `${GOAL_SECTION_CLASS}--over`

    let shouldDrag = false
    let isSpaceDown = false
    let isSpacePressedForDrag = false

    let dropTargetElem: HTMLElement | null = null
    let dragSourcElem: HTMLElement | null = null

    let goalsRepoContainer: HTMLElement | null = null

    let goalItemWidth = DROP_DIVIDER_BOARD_WIDTH
    let goalSectionWdith = DROP_DIVIDER_BOARD_WIDTH
    let goalItemView = GoalItemUI.RepoCard
    let isDraggingItem = true
    let newSectionTitle = ""

    $: { 
        goalItemView = $goalsManager!.repoGoalItemView

        if (goalItemView === GoalItemUI.RepoCard) {
            goalItemWidth = DROP_DIVIDER_BOARD_WIDTH
        }
        else {
            onWindowResize()
        }
    }
    $: GOAL_ITEM_OVER_CLASS = `${GOAL_ITEM_CLASS}--${goalItemView === GoalItemUI.RepoCard ? "card-over" : "list-over"}`

    function onSectionNameClicked(sectionIdx: number) {
        if (sectionIdx === 0) return
        $goalsManager!.setSectionEdit(sectionIdx)

        requestAnimationFrame(() => {
            const inputElem = getElemById(`section-title-input--${sectionIdx}`)! as HTMLInputElement
            inputElem!.focus()
        })
    }
    function inputTextHandler(event: Event) {
        const target = event.target as HTMLInputElement
        newSectionTitle = target.value
    }
    function onNewTitleInputSubmit() {
        if ($goalsManager!.sectionEditIdx! < 0) {
            $goalsManager!.addNewSection(newSectionTitle)
        }
        else {
            $goalsManager!.changeSectionTitle(newSectionTitle)
        }

        newSectionTitle = ""
    }
    function onNewTitleInputCancel() { 
        $goalsManager!.setSectionEdit(null)
        newSectionTitle = ""
    }

    /* Board Event Handlers */
    function onGoalCardClicked(sectionIdx: number, idx: number) {
        if (shouldDrag) return

        const clickedGoal = $goalsManager!.getGoalFromSection(sectionIdx, idx)
        initGoalInEdit(clickedGoal)
    }
    function onGoalCardMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement

        const dotsParent = findAncestor(target, "goals-repo-handle")

        if (!dotsParent && !isSpaceDown) {
            return 
        }

        const isItemElem = target?.classList.value.includes("item") || dotsParent?.classList.value.includes("item")
        shouldDrag = true
        
        if (isItemElem) {
            isSpacePressedForDrag = true
            isDraggingItem = true
        }
        else if (dotsParent) {
            isDraggingItem = false
        }
    }
    function onBoardDragEnter() {
        if (!dropTargetElem) return

        dropTargetElem.classList.remove(isDraggingItem ? GOAL_ITEM_OVER_CLASS : GOAL_SECTION_OVER_CLASS)
        dropTargetElem = null
    }

    /* Drag Event Handlers */
    function onDragStartHandler(event: DragEvent) {
        event.stopPropagation()

        if (!shouldDrag) {
            event.preventDefault()
            return
        }

        const target = event.target as HTMLElement
        const className = target.classList.value
        
        if (!GOAL_SECTION_CLASS.includes(className) && GOAL_SECTION_CLASS.includes(className)) {
            event.preventDefault()
            return
        }
        
        dragSourcElem = target
        target.classList.add(`${isDraggingItem ? GOAL_ITEM_CLASS : GOAL_SECTION_CLASS}--dragging`)
    }
    function onDragHandler(event: DragEvent) {
        event.preventDefault()
        return false
    }
    function onDragEndHandler(event: DragEvent) {
        event.stopPropagation()

        resetCurrentDragSourceTarget()
        resetCurrentDropTarget()

        shouldDrag = false
        isDraggingItem = true

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
        const boardItem = findAncestor(target, isDraggingItem ? GOAL_ITEM_CLASS : GOAL_SECTION_CLASS)!

        if (!boardItem || boardItem.id === "goal-section--0") {
            event.preventDefault()
            return
        }
        if (boardItem.id === dragSourcElem!.id) {
            event.preventDefault()
            return false
        }
        
        resetCurrentDropTarget()
        dropTargetElem = boardItem
        dropTargetElem.classList.add(isDraggingItem ? GOAL_ITEM_OVER_CLASS : GOAL_SECTION_OVER_CLASS)
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

        if (isDraggingItem) {
            $goalsManager!.onSectionItemDropHandler(dragSourcElem!.id, dropTargetElem!.id)
        }
        else {
            $goalsManager!.moveSection(dragSourcElem!.id, dropTargetElem!.id)
        }
        
        resetCurrentDragSourceTarget()
        resetCurrentDropTarget()
        return false
    }
    function resetCurrentDragSourceTarget() {
        if (!dragSourcElem) return
        dragSourcElem.classList.remove(`${isDraggingItem ? GOAL_ITEM_CLASS : GOAL_SECTION_CLASS}--dragging`)
        dragSourcElem =  null
    }
    function resetCurrentDropTarget() {
        if (!dropTargetElem) return
        dropTargetElem.classList.remove(isDraggingItem ? GOAL_ITEM_OVER_CLASS : GOAL_SECTION_OVER_CLASS)
        dropTargetElem =  null
    }
    function onWindowResize() {
        goalSectionWdith = goalsRepoContainer?.clientWidth ?? DROP_DIVIDER_BOARD_WIDTH
        if (goalItemView === GoalItemUI.RepoCard) return

        goalItemWidth = goalsRepoContainer?.clientWidth ?? DROP_DIVIDER_BOARD_WIDTH
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
            // boardCardsContainer!.scrollTop += 250
        }
    }

    onMount(() => {
        onWindowResize()
    })
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} on:resize={onWindowResize}/>

{#if $goalsManager}
<div class={`goals-repo ${!$themeState.isDarkTheme ? "goals-repo--light" : ""}`} bind:this={goalsRepoContainer}>
    {#each $goalsManager.goalSections as section, sectionIdx}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div 
            class={`goals-repo__section ${goalItemView === GoalItemUI.RepoCard ? "goals-repo__section--card-view" : ""}`}
            id={`goal-section--${sectionIdx}`}
            draggable="true"
            on:mousedown={onGoalCardMouseDown}
            on:dragover={onDragOverHandler}
            on:dragenter={onDragEnterHandler}
            on:dragleave={onDragLeaveHandler}
            on:drop={onDropHandler}
            on:drag={onDragHandler}
            on:dragstart={onDragStartHandler}
            on:dragend={onDragEndHandler}
        >
            <div class="goals-repo__section-drop-divider">
                <svg xmlns="http://www.w3.org/2000/svg" width={goalSectionWdith} height="2" viewBox={`0 0 ${goalSectionWdith} 2`} fill="none">
                    <path d={`M0.567383 0.545898H${goalSectionWdith}`} stroke-opacity="0.65" stroke-dasharray="3 3"/>
                </svg>
            </div>
            <!-- Header  -->
            <div class={`goals-repo-header 
                                ${section.isExpanded ? "" : "goals-repo-header--minimized"}
                                ${$goalsManager.sectionEditIdx === sectionIdx ? "goals-repo-header--editing" : ""}
                        `}>
                <div class="goals-repo-header__details-wrapper">
                    <div class="goals-repo-header__details">
                        <button class="goals-repo-header__dropdown-btn" on:click={() => $goalsManager?.toggleExpandGoalSection(sectionIdx)}>
                            <SVGIcon icon={Icon.Dropdown} />
                        </button>
                        {#if $goalsManager.sectionEditIdx === sectionIdx}
                            <div class="goals-repo-header__input input-box">
                                <input
                                    type="text"
                                    name="section-title-input" 
                                    id={`section-title-input--${sectionIdx}`}
                                    spellcheck="false"
                                    value={section.name}
                                    maxlength={25}
                                    placeholder="New Name"
                                    on:input={inputTextHandler}
                                    on:blur={onNewTitleInputSubmit}
                                />
                                <div class="input-box__btn-container">
                                    <button 
                                        on:click={onNewTitleInputSubmit}
                                        class="input-box__btn input-box__btn--submit"
                                        disabled={newSectionTitle.length >= 25}
                                    >
                                        Submit
                                    </button>
                                    <button on:click={onNewTitleInputCancel} class="input-box__btn input-box__btn--cancel">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <h3 class="goals-repo-header__name" on:click={() => onSectionNameClicked(sectionIdx)}>
                                {section.name}
                            </h3>
                        {/if}
                    </div>
                    <div class="flx">
                        <span class="goals-repo-header__section-count">
                            {section.length}
                        </span>
                    </div>
                </div>
                <div class="goals-repo-header__divider goals-repo__divider"></div>
                {#if sectionIdx != 0}
                    <div class="goals-repo-header__handle goals-repo-handle">
                        <div class="goals-repo-header__handle-dots goals-repo-handle__dots">
                            <SVGIcon icon={Icon.DragDots} options={{ scale: 0.8 }}/>
                        </div>
                    </div>
                {/if}
            </div>
            <ul class={`goals-repo__section-list 
                            ${section.isExpanded ? "" : "goals-repo__section-list--hidden"}
                            ${isSpaceDown ? "goals-repo__section-list--grabbing" : ""}
                        `}
            >
                    <!-- Goal Item -->
                    {#each $goalsManager.goalSectionItems[sectionIdx] as goal, idx}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li 
                            class={`goals-repo-item ${goalItemView === GoalItemUI.RepoList ? "goals-repo-item--list" : "goals-repo-item--card"}`}
                            id={`goal--${goal.sectionId}-${goal.sectionIdx}`}
                            draggable="true"
                            on:click={() => onGoalCardClicked(sectionIdx, idx)}
                            on:dragover={onDragOverHandler}
                            on:dragenter={onDragEnterHandler}
                            on:dragleave={onDragLeaveHandler}
                            on:drop={onDropHandler}
                            on:drag={onDragHandler}
                            on:dragstart={onDragStartHandler}
                            on:dragend={onDragEndHandler}
                        >
                            {#if idx != 0}
                                <div class="goals-repo-item__divider goals-repo__divider"></div>
                            {/if}
                            <div class="goals-repo-item__drop-divider">
                                {#if goalItemView === GoalItemUI.RepoList}
                                    <svg xmlns="http://www.w3.org/2000/svg" width={goalItemWidth} height="2" viewBox={`0 0 ${goalItemWidth} 2`} fill="none">
                                        <path d={`M0.567383 0.545898H${goalItemWidth}`} stroke-opacity="0.65" stroke-dasharray="3 3"/>
                                    </svg>
                                {:else}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height="73" viewBox="0 0 2 73" fill="none">
                                        <path d="M0.955078 0.0712891V72.6367" stroke-opacity="0.65" stroke-width="1.2" stroke-dasharray="3 3"/>
                                    </svg>
                                {/if}
                            </div>
                            <div class="goals-repo-item__handle goals-repo-handle">
                                <div class="goals-repo-item__handle-dots goals-repo-handle__dots">
                                    <SVGIcon icon={Icon.DragDots} options={{ scale: 0.8 }}/>
                                </div>
                            </div>
                            <GoalItem goal={goal} status={goal.status} appearance={goalItemView} />
                        </li>
                    {/each}
                    <!-- Bottom Padding -->
                    <li 
                        class={`goals-repo-item goals-repo-item--dummy ${goalItemView === GoalItemUI.RepoList ? "goals-repo-item--list" : "goals-repo-item--card"}`}
                        id={`goal--${sectionIdx}--1`}
                        on:dragover={onDragOverHandler}
                        on:dragenter={onDragEnterHandler}
                        on:dragleave={onDragLeaveHandler}
                        on:drop={onDropHandler}
                    >
                        <div class="goals-repo-item__drop-divider">
                            {#if goalItemView === GoalItemUI.RepoList}
                                <svg xmlns="http://www.w3.org/2000/svg" width={goalItemWidth} height="2" viewBox={`0 0 ${goalItemWidth} 2`} fill="none">
                                    <path d={`M0.567383 0.545898H${goalItemWidth}`} stroke-opacity="0.65" stroke-dasharray="3 3"/>
                                </svg>
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" width="2" height="73" viewBox="0 0 2 73" fill="none">
                                    <path d="M0.955078 0.0712891V72.6367" stroke-opacity="0.65" stroke-width="1.2" stroke-dasharray="3 3"/>
                                </svg>
                            {/if}
                        </div>
                    </li>
            </ul>
        </div>
    {/each}
    <div 
        class="goals-repo__section goals-repo__section--dummy"
        id={`goal-section--${-1}`}
        on:dragover={onDragOverHandler}
        on:dragenter={onDragEnterHandler}
        on:dragleave={onDragLeaveHandler}
        on:drop={onDropHandler}
    >
        <div class="goals-repo__section-drop-divider" style="margin: 0px">
            <svg xmlns="http://www.w3.org/2000/svg" width={goalItemWidth} height="2" viewBox={`0 0 ${goalItemWidth} 2`} fill="none">
                <path d={`M0.567383 0.545898H${goalItemWidth}`} stroke-opacity="0.65" stroke-dasharray="3 3"/>
            </svg>
        </div>
        {#if $goalsManager.sectionEditIdx === -1}
            <div class="goals-repo-header__input input-box">
                <input
                    type="text"
                    name="section-title-input" 
                    id={`section-title-input--${-1}`}
                    spellcheck="false"
                    maxlength={25}
                    placeholder="New Name"
                    on:input={inputTextHandler}
                    on:blur={onNewTitleInputSubmit}
                />
                <div class="input-box__btn-container">
                    <button 
                        on:click={onNewTitleInputSubmit}
                        class="input-box__btn input-box__btn--submit"
                        disabled={newSectionTitle.length >= 25}
                    >
                        Submit
                    </button>
                    <button on:click={onNewTitleInputCancel} class="input-box__btn input-box__btn--cancel">
                        Cancel
                    </button>
                </div>
            </div>
        {:else}
            <button class="goals-repo__add-section-btn" on:click={() => onSectionNameClicked(-1)}>
                <SVGIcon icon={Icon.Add} options={{ scale: 0.65, strokeWidth: 1.6 }}/>
                <span>New Section</span>
            </button>
        {/if}
    </div>
</div>
{/if}

<style lang="scss">
    @import "../../scss/inputs.scss";
    $padding-left: 25px;
    $goal-card-width: 145px;

    .goals-repo {
        margin-top: 7px;
        height: calc(100% - 32px);
        overflow-y: scroll;

        $root: goals-repo;

        &--light &-header__name {
            @include text-style(0.95, 600);
        }
        &--light &-header__section-count {
            @include text-style(0.4, 400);   
        }
        &--light &-header__dropdown-btn:hover {
            background-color: rgba(black, 0.1);
        }
        &--light &__divider {
            @include dark-divider(0.05);
        }
        &--light &-item:hover {
            background-color: rgba(black, 0.02);
        }
        &--light &__add-section-btn {
            
            span {
                @include text-style(1, 600);
            }
        }
        
        &__section {
            position: relative;
            width: 100%;

            &--dragging {
                opacity: 0.2;
            }
            &--dragging &-list {
                display: none !important;
            }
            &--over &-drop-divider {
                opacity: 0.5;
                padding: 10px 0px 10px 0px;
            }
            &--card-view &-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, calc($goal-card-width + 7px));
                padding: 0px $padding-left 5px $padding-left;
            }
            &--card-view #{$root}-header {
                padding-bottom: 6px;
            }
            &--dummy {
                height: 40px;
                margin: 0px $padding-left 0px $padding-left;
                width: calc(100% - (2 * $padding-left));
            }
            &--dummy:hover {
                #{$root}__add-section-btn {
                    @include visible;
                    opacity: 0.35;           
                }
                #{$root}__add-section-btn:hover {
                    opacity: 0.8;
                }
            }
        }
        &__section-list {
            width: 100%;

            &--hidden {
                display: none !important;
            }
            &--grabbing * {
                cursor: grab !important;
            }
        }
        &__section-drop-divider {
            @include flex(center, center);
            transition: 0.1s ease-in-out;
            opacity: 0;
            padding-top: 6px;
            width: calc(100% - 50px);
            margin: 0px 25px;

            path {
                stroke: rgba(var(--textColor1), 0.24);
            }
        }
        &__add-section-btn {
            @include not-visible;
            @include flex(center);
            
            span {
                @include text-style(_, 400, 1.2rem);
                margin-left: 4px;
            }
        }
        &__divider {
            @include divider(0.045);
        }
    }
    .goals-repo-handle {
        cursor: grab;

        &:active {
            cursor: grabbing;
        }
        &__dots {
            transition: 0.12s ease-in-out;
            @include not-visible;
        }
    }
    .goals-repo-header {
        padding: 6px 25px 0px $padding-left;

        &--minimized &__dropdown-btn {
            transform: rotate(-90deg);
        }
        &--editing &__dropdown-btn {
            display: none;
        }
        &--editing &__handle {
            display: none;
        }
        &--editing &__divider {
            opacity: 0;
        }
        &--editing &__section-count {
            display: none;
        }

        &:hover &__handle-dots {
            @include visible(0.09);

            &:hover {
                opacity: 0.5;
            }
        }
        
        &__details {
            @include flex(center);
            width: 100%;
        }
        &__details-wrapper {
            @include flex(center, space-between);
            width: 100%;
        }
        &__dropdown-btn {
            transition: 0.1s ease-in-out;
            transform-origin: center;
            opacity: 0.4;
            margin: 0px 4px 0px -5px;
            transform: rotate(0deg);
            @include circle(18px);
            @include center;
            
            &:hover {
                background-color: rgba(white, 0.1);
            }
            &:active {
                transform: scale(0.9);
            }
        }
        &__input {
            width: 100%;
            input {
                width: 100%;
            }
        }
        &__name {
            @include text-style(0.6, 400, 1.25rem);
            cursor: text;
        }
        &__section-count {
            @include text-style(0.25, 200, 1.2rem);   
            font-family: "DM Mono";
        }
        &__divider {
            margin: 7px 0px 5px 0px;
        }
        &__handle {
            @include abs-top-left(12px);
        }
    }
    .goals-repo-item {
        padding: 0px 0px 12px $padding-left;
        transition: 0.07s ease-in-out;
        position: relative;
        cursor: pointer;

        &:active {
            transform: scale(0.995);
        }
        &:hover {
            background-color: rgba(white, 0.008);
        }
        &:hover &__handle-dots {
            opacity: 0.08;
            visibility: visible;

            &:hover {
                opacity: 0.5;
            }
        }

        &--dragging {
            cursor: grabbing !important;
            opacity: 0.3;
        }
        &--dragging * {
            cursor: grabbing !important;
        }
        &--card {
            padding: 0px;
        }
        &--card {
            margin-bottom: 7px;
            background-color: transparent !important;

            &:active {
                transform: scale(0.98);
            }
        }
        &--card &__drop-divider {
            @include abs-top-left;
            display: block;
        }
        &--card &__handle {
            height: 5px;
            z-index: 1000;
            width: $goal-card-width;
            transform: translateY(40%);
        }
        &--card &__divider {
            display: none;
        }
        &--card &__handle-dots {
            display: none !important;
        }
        &--list &__handle-dots {
            display: block;
        }
        &--card-over {
            padding-left: 15px;
        }
        &--card-over {
            height: 90px;
        }
        &--card-over &__drop-divider {
            opacity: 0.5;
        }
        &--list-over &__drop-divider {
            opacity: 0.5;
            padding: 10px 0px 10px 0px;
        }
        &--list-over &__divider {
            display: none;
        }
        &--dummy {
            position: relative;
            background: none !important;
        }
        
        &__divider {
            margin-left: 25px;
            @include divider(0.045, 0.5px, calc(100% - 50px));
            @include abs-top-left;
        }
        &__drop-divider {
            width: 100%;
            @include flex(center, center);
            transition: 0.1s ease-in-out;
            opacity: 0;
            padding-top: 6px;

            path {
                stroke: rgba(var(--textColor1), 0.3);
            }
        }
        &__handle {
            transform: translateY(100%);
            @include abs-top-left;
        }
    }
</style>