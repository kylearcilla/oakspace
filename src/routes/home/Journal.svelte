<script lang="ts">
	import { GoalStatus, ModalType } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { closeModal } from "$lib/utils-home"
	import { onDestroy, onMount } from "svelte"
	import Modal from "../../components/Modal.svelte"
	import { clickOutside, getElemsByClass } from "$lib/utils-general"
	import { toggleYTIFramePointerEvents } from "$lib/utils-youtube"
    import { goals } from "$lib/utils-journal"
	import { formatDatetoStr } from "$lib/utils-date";

    enum JournalTab {
        Goals, Summary
    }
    enum GoalViewOption {
        Board, History
    }

    let selectedTab = JournalTab.Goals
    let goalViewOption = GoalViewOption.Board
    
    let tabHighlighterClass = ""
    let isGoalsDropdownOpen = false
    let dragSourcElem: HTMLElement | null = null

    let onHoldGoals: Goal[] = []
    let inProgressGoals: Goal[] = []
    let accomplishedGoals: Goal[] = []

    function onTabClicked(e: Event, tab: JournalTab) {
        const target = e.target as HTMLButtonElement
        selectedTab = tab

        initHighlighter(target)

        if (selectedTab === JournalTab.Goals) {
            requestAnimationFrame(() => initGoalsBoard())
        }
    }
    function initHighlighter(tab: HTMLButtonElement) {
        const width = tab.clientWidth
        const offSetLeft = tab.offsetLeft

        tabHighlighterClass = `left: ${offSetLeft}px; width: ${width}px;`
    }
    function onGoalViewOptionClicked(tab: GoalViewOption) {
        goalViewOption = tab
        isGoalsDropdownOpen = false
    }
    function onTagClicked() {

    }

    /* Board Card Events */
    function onMouseDown(event: MouseEvent) {
        console.log(event)
    }
    function onDragStartHandler(event: DragEvent) {
        event.stopPropagation()
        const target = event.target as HTMLElement
        target.style.opacity = "0.3"
        target.style.cursor = "grabbing"
        dragSourcElem = target

        console.log(event)
        
        event!.dataTransfer!.effectAllowed = 'move'
        event!.dataTransfer!.setData('text/html', target.innerHTML)
    }
    function onDragHandler(event: DragEvent) {
        event.preventDefault()
        return false
    }
    function onDragEndHandler(event: DragEvent) {
        event.stopPropagation()
        const target = event.target as HTMLElement
        target.style.opacity = "1"
        target.style.cursor = "pointer"
        dragSourcElem = null
    }
    function onDragOverHandler(event: DragEvent) {
        event.preventDefault()
        return false
    }
    function onDragEnterHandler(event: DragEvent) {
        const target = event.target as HTMLElement

        if (target.tagName != "LI" || target.id === dragSourcElem!.id) {
            event.preventDefault()
            return
        }

        target.classList.add('journal-goals__board-item--over')
    }
    function onDragLeaveHandler(event: DragEvent) {
        const target = event.target as HTMLElement
        target.classList.remove('journal-goals__board-item--over')
    }
    function onDropHandler(event: DragEvent) {
        event.stopPropagation()
        const target = event.target as HTMLElement
        target.classList.remove('journal-goals__board-item--over')

        if (dragSourcElem!.id === target.id || target.tagName != "LI") {
            // event.preventDefault()
            return false
        }

        // duplicate and insert before elem
        const newElement = document.createElement('li')
        newElement.className = "journal-goals__board-item"
        newElement.draggable = true
        newElement.id = dragSourcElem!.id
        newElement.innerHTML = event.dataTransfer!.getData('text/html')

        const firstChild = newElement.firstChild as HTMLElement
        if (firstChild.tagName === "META") {
            newElement.firstChild!.remove()
        }

        addBoardItemDragEventHandlers(newElement)
        target.parentNode!.insertBefore(newElement, target)

        dragSourcElem!.remove()
        dragSourcElem =  null

        return false
    }
    function addToNewStatusArray() {

    }
    function removeFromOldStatusArray() {

    }
    function updateItemStatus() {

    }
    function addBoardItemDragEventHandlers(elem: HTMLElement, isBtnContainer = false) {
        elem.addEventListener("dragover", onDragOverHandler)
        elem.addEventListener("dragenter", onDragEnterHandler)
        elem.addEventListener("dragleave", onDragLeaveHandler)
        elem.addEventListener("drop", onDropHandler)
        elem.addEventListener("drag", onDragHandler)
        
        if (isBtnContainer) return
        
        elem.addEventListener("dragstart", onDragStartHandler)
        elem.addEventListener("dragend", onDragEndHandler)
    }
    function initGoals() {
        const goalsContainer: Goal[][] = [[],[],[]]

        goals.forEach((goal: Goal) => {
            const rowIdx = goal.status
            goalsContainer[rowIdx].push(goal)
        })

        onHoldGoals = new Array(goalsContainer[0].length).fill(null)
        inProgressGoals = new Array(goalsContainer[1].length).fill(null)
        accomplishedGoals = new Array(goalsContainer[2].length).fill(null)

        goalsContainer.forEach((row: Goal[], rowIdx: number) => {
            row.forEach((goal: Goal) => {
                const idx = goal.idx
                if (rowIdx === 0) {
                    onHoldGoals[idx] = goal
                }
                else if (rowIdx === 1) {
                    inProgressGoals[idx] = goal
                }
                else {
                    accomplishedGoals[idx] = goal
                }
            })
        })
    }
    function initGoalsBoard() {
        initGoals()

        requestAnimationFrame(() => {
            const goalCards = getElemsByClass("journal-goals__board-item") as HTMLElement[]
    
            goalCards.forEach((elem: HTMLElement) => {
                const isBtnContainer = elem?.id.includes("add-btn-container")
                elem.draggable = !isBtnContainer
                addBoardItemDragEventHandlers(elem, isBtnContainer)
            })
        })

    }

    onMount(() => {
        const firstTab = getElemsByClass("highlighter-tabs__tab-btn")![0] as HTMLButtonElement
        initHighlighter(firstTab)
        initGoalsBoard()
        toggleYTIFramePointerEvents(false)
    })
    onDestroy(() => toggleYTIFramePointerEvents(true))
</script>

<Modal onClickOutSide={() => closeModal(ModalType.Journal)} options={{ overflowY: "hidden" }}>
    <div class={`journal ${$themeState.isDarkTheme ? "journal--dark" : "journal--light"}`}>
        <div class="journal__header">
            <h1 class="modal-bg__content-title">Journal</h1>
        </div>
        <div class="journal__section-divider journal__section-divider--header"></div>
        <div class="journal__content">
            <div class="journal-tags">
                <h2>Tags</h2>
                <button class="journal-tags__add-tag-btn">
                    <span class="journal-tags__add-tag-btn-text">New Tag</span>
                    <span class="journal-tags__add-tag-btn-icon">+</span>
                </button>
                <ul class="journal-tags__list">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <li class="journal-tags__tag" role="button" tabindex="0" on:click={() => onTagClicked()}>
                        <div class="journal-tags__tag-color" style={`background-color: #A3C2FF`}></div>
                        <span class="journal-tags__tag-title">
                            Reading
                        </span>
                    </li>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <li class="journal-tags__tag" role="button" tabindex="0" on:click={() => onTagClicked()}>
                        <div class="journal-tags__tag-color" style={`background-color: #F8B1BB`}></div>
                        <span class="journal-tags__tag-title">
                            Law School
                        </span>
                    </li>
                </ul>
                <div class="journal__section-divider journal__section-divider--main"></div>
            </div>
            <div class="journal-tag-view">
                <div class="journal-tag-view__top">
                    <div class="journal-tag-view__header">
                        <div class="journal-tag-view__tag-title">
                            <h2>Reading</h2>
                            <div class="journal-tag-view__tag-symbol" style={`background-color: #A3C2FF`}>
                                📖
                            </div>
                        </div>
                        <div class="journal-tag-view__settings-btn">
                        </div>
                    </div>
                    <div class="journal-tag-view__details">
                        <p class="journal-tag-view__tag-description">
                            “A reader lives a thousand lives before he dies, said Jojen. The man who never reads lives only one.” – George RR Martin.
                        </p>
                    </div>
                    <div class="journal-tag-view__tabs highlighter-tabs">
                        <div class="highlighter-tabs__container">
                            <button 
                                    on:click={(e) => onTabClicked(e, JournalTab.Goals)} 
                                    class={`highlighter-tabs__tab-btn highlighter-tabs__tab-btn--profile ${selectedTab == JournalTab.Goals ? "highlighter-tabs__tab-btn--selected" : ""}`}
                            >
                                Goals
                            </button>
                            <button 
                                    on:click={(e) => onTabClicked(e, JournalTab.Summary)}  
                                    class={`highlighter-tabs__tab-btn highlighter-tabs__tab-btn--plan ${selectedTab == JournalTab.Summary ? "highlighter-tabs__tab-btn--selected" : ""}`}
                            >
                                Summary
                            </button>
                        </div>
                        <div class="highlighter-tabs__divider journal__section-divider journal__section-divider--tabs"></div>
                        <div class="highlighter-tabs__highlighter" style={tabHighlighterClass}> </div>
                    </div>
                </div>
                {#if selectedTab === JournalTab.Goals}
                    <div class="journal-goals">
                        <!-- Filter Buttons  -->
                        <div 
                            class="journal-goals__dropdown-container dropdown-container"
                        >
                            <button 
                                class={`journal-goals__filter-dropdown-btn dropdown-btn ${isGoalsDropdownOpen ? "dropdown-btn--active" : ""}`}
                                on:click={() => isGoalsDropdownOpen = !isGoalsDropdownOpen}
                            >
                                <span class="dropdown-btn__title">
                                    {GoalViewOption[goalViewOption]}
                                </span>
                                <div class="dropdown-btn__icon dropdown-btn__icon--arrow">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="6" height="5" viewBox="0 0 6 5" fill="none">
                                        <path d="M2.76221 4.45654L0.343848 0.267823L5.18057 0.267822L2.76221 4.45654Z" fill="#5A5A5A"/>
                                    </svg>
                                </div>
                            </button>
                            <ul 
                                use:clickOutside on:click_outside={() => isGoalsDropdownOpen &&= !isGoalsDropdownOpen }
                                class={`journal-goals__dropdown-menu dropdown-menu ${!isGoalsDropdownOpen ? "dropdown-menu--hidden" : ""}`}
                            >
                                <li class={`dropdown-menu__option ${goalViewOption === GoalViewOption.Board ? "dropdown-menu__option--selected" : ""}`}>
                                    <button on:click={() => onGoalViewOptionClicked(GoalViewOption.Board)}>
                                        <span class="dropdown-menu__option-text">Board</span>
                                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                            <i class="fa-solid fa-check"></i>
                                        </div>
                                    </button>
                                </li>
                                <li class={`dropdown-menu__option ${goalViewOption === GoalViewOption.History ? "dropdown-menu__option--selected" : ""}`}>
                                    <button on:click={() => onGoalViewOptionClicked(GoalViewOption.History)}>
                                        <span class="dropdown-menu__option-text">History</span>
                                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                            <i class="fa-solid fa-check"></i>
                                        </div>
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div class="journal-goals__board">
                            <div class="journal-goals__board-col-container">
                                <div class="journal-goals__board-col-header">
                                    <div class="journal-goals__board-col-header-dot journal-goals__board-col-header-dot--on-hold"></div>
                                    <div class="journal-goals__board-col-header-title">
                                        On-Hold
                                    </div>
                                    <div class="journal-goals__board-col-header-count">
                                        1
                                    </div>
                                </div>
                                <div class="journal-goals__board-col-header">
                                    <div class="journal-goals__board-col-header-dot journal-goals__board-col-header-dot--in-progress"></div>
                                    <div class="journal-goals__board-col-header-title">
                                        In-Progress
                                    </div>
                                    <div class="journal-goals__board-col-header-count">
                                        6
                                    </div>
                                </div>
                                <div class="journal-goals__board-col-header">
                                    <div class="journal-goals__board-col-header-dot journal-goals__board-col-header-dot--accomplished"></div>
                                    <div class="journal-goals__board-col-header-title">
                                        Accomplished
                                    </div>
                                    <div class="journal-goals__board-col-header-count">
                                        3
                                    </div>
                                </div>
                            </div>
                            <div class="journal-goals__board-cards-container" on:scroll={(e) => e.preventDefault()}>
                                <!-- On Hold -->
                                <div class="journal-goals__board-col">
                                    <ul class="journal-goals__board-col-goals-list">
                                        {#each onHoldGoals as goal}
                                            <li class="journal-goals__board-item" id={`goal--0-${goal.idx}`}>
                                                <div class="journal-goals__board-item-divider">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="2" viewBox="0 0 200 2" fill="none">
                                                        <path d="M0.567383 0.545898H215.092" stroke-opacity="0.65" stroke-dasharray="3 3"/>
                                                    </svg>
                                                </div>
                                                <div class="journal-goals__goal">
                                                    <h5 class="journal-goals__goal-name" title={goal.title}>
                                                        {goal.title}
                                                    </h5>
                                                    <p class="journal-goals__goal-description" title={goal.description}>
                                                        {goal.description}
                                                    </p>
                                                    <div class="flx flx--algn-center flx--space-between">
                                                        <div class="flx">
                                                            <div class="journal-goals__goal-status flx flx--algn-center">
                                                                <div class="journal-goals__goal-status-dot" style={`background-color: #CB6E6E`}></div>
                                                                <span>On-Hold</span>
                                                            </div>
                                                            {#if goal.milestones.length > 0}
                                                                <div class="journal-goals__goal-milestones" title="Milestones">
                                                                    {`${goal.milestonesDone} / ${goal.milestones.length}`}
                                                                </div>
                                                            {/if}
                                                        </div>
                                                        <div class="journal-goals__goal-time-period" title="Start / End Date">July '23</div>
                                                    </div>
                                                </div>
                                            </li>
                                        {/each}
                                        <li 
                                            class="journal-goals__board-item journal-goals__board-item--btn-container" 
                                            id="add-btn-container--on-hold"
                                        >
                                            <div class="journal-goals__board-item-divider">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="2" viewBox="0 0 200 2" fill="none">
                                                    <path d="M0.567383 0.545898H215.092" stroke-opacity="0.65" stroke-dasharray="3 3"/>
                                                </svg>
                                            </div>
                                            <button class="journal-goals__board-col-add-new-goal-btn">
                                                <span>+</span>
                                                Add New Goal
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                <!-- In Progress -->
                                <div class="journal-goals__board-col">
                                    <ul class="journal-goals__board-col-goals-list">
                                        {#each inProgressGoals as goal}
                                            <li class="journal-goals__board-item" id={`goal--1-${goal.idx}`}>
                                                <div class="journal-goals__board-item-divider">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="2" viewBox="0 0 200 2" fill="none">
                                                        <path d="M0.567383 0.545898H215.092" stroke-opacity="0.65" stroke-dasharray="3 3"/>
                                                    </svg>
                                                </div>
                                                <div class="journal-goals__goal">
                                                    <h5 class="journal-goals__goal-name" title={goal.title}>
                                                        {goal.title}
                                                    </h5>
                                                    <p class="journal-goals__goal-description" title={goal.description}>
                                                        {goal.description}
                                                    </p>
                                                    <div class="flx flx--algn-center flx--space-between">
                                                        <div class="flx">
                                                            <div class="journal-goals__goal-status flx flx--algn-center">
                                                                <div class="journal-goals__goal-status-dot" style={`background-color: #D2B569`}></div>
                                                                <span>On-Hold</span>
                                                            </div>
                                                            {#if goal.milestones.length > 0}
                                                                <div class="journal-goals__goal-milestones" title="Milestones">
                                                                    {`${goal.milestonesDone} / ${goal.milestones.length}`}
                                                                </div>
                                                            {/if}
                                                        </div>
                                                        <div class="journal-goals__goal-time-period" title="Start / End Date">July '23</div>
                                                    </div>
                                                </div>
                                            </li>
                                        {/each}
                                        <li 
                                            class="journal-goals__board-item journal-goals__board-item--btn-container" 
                                            id="add-btn-container--in-progress"
                                        >
                                            <div class="journal-goals__board-item-divider">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="2" viewBox="0 0 200 2" fill="none">
                                                    <path d="M0.567383 0.545898H215.092" stroke-opacity="0.65" stroke-dasharray="3 3"/>
                                                </svg>
                                            </div>
                                            <button class="journal-goals__board-col-add-new-goal-btn">
                                                <span>+</span>
                                                Add New Goal
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                <!-- Accomplished -->
                                <div class="journal-goals__board-col">
                                    <ul class="journal-goals__board-col-goals-list">
                                        {#each accomplishedGoals as goal}
                                            <li class="journal-goals__board-item" id={`goal--2-${goal.idx}`}>
                                                <div class="journal-goals__board-item-divider">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="2" viewBox="0 0 200 2" fill="none">
                                                        <path d="M0.567383 0.545898H215.092" stroke-opacity="0.65" stroke-dasharray="3 3"/>
                                                    </svg>
                                                </div>
                                                <div class="journal-goals__goal">
                                                    <h5 class="journal-goals__goal-name" title={goal.title}>
                                                        {goal.title}
                                                    </h5>
                                                    <p class="journal-goals__goal-description" title={goal.description}>
                                                        {goal.description}
                                                    </p>
                                                    <div class="flx flx--algn-center flx--space-between">
                                                        <div class="flx">
                                                            <div class="journal-goals__goal-status flx flx--algn-center">
                                                                <div class="journal-goals__goal-status-dot" style={`background-color: #8FD067`}></div>
                                                                <span>On-Hold</span>
                                                            </div>
                                                            {#if goal.milestones.length > 0}
                                                                <div class="journal-goals__goal-milestones" title="Milestones">
                                                                    {`${goal.milestonesDone} / ${goal.milestones.length}`}
                                                                </div>
                                                            {/if}
                                                        </div>
                                                        <div class="journal-goals__goal-time-period" title="Start / End Date">July '23</div>
                                                    </div>
                                                </div>
                                            </li>
                                        {/each}
                                        <li 
                                            class="journal-goals__board-item journal-goals__board-item--btn-container
                                            " id="add-btn-container--accomplished"
                                        >
                                            <div class="journal-goals__board-item-divider">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="2" viewBox="0 0 200 2" fill="none">
                                                    <path d="M0.567383 0.545898H215.092" stroke-opacity="0.65" stroke-dasharray="3 3"/>
                                                </svg>
                                            </div>
                                            <button class="journal-goals__board-col-add-new-goal-btn">
                                                <span>+</span>
                                                Add New Goal
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                {:else}
                {/if}
            </div>
        </div>
    </div>
</Modal>

<style global lang="scss">
    @import "../../scss/highlighter-tabs.scss";
    @import "../../scss/dropdown.scss";

    $board-col-gap: 20px;
    $board-item-width: 195px;
    $board-top-offset-gap: 48px;
    $board-frame-top-offset-gap: 26px;

    .journal {
        width: 88vw;
        height: 85vh;
        min-width: 390px;
        max-width: 1100px;

        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &--dark .dropdown-btn {
            @include dropdown-btn-dark;
            background-color: rgba(var(--textColor1), 0.032);
        }
        &--light {

        }

        &__header {
            height: 23px;
            margin-bottom: 10px;
            padding: 20px 20px 27px 25px;
        }
        &__content {
            display: flex;
            width: 100%;
            height: calc(100% - 33px);

            h2 {
                font-size: 1.85rem;
                font-weight: 400;
            }
        }
        &__section-divider {
            height: 0.5px;
            width: 100%;
            background-color: rgba(var(--textColor1), 0.045);

            &--header {
            }
            &--main {
                height: 100%;
                width: 0.5px;
                height: calc(100% - 25px);
                @include pos-abs-top-right-corner(0px, 0px);
            }
            &--tabs {
            }
        }
    }

    /* Tag Column */
    .journal-tags {
        min-width: 155px;
        padding-top: 15px;
        padding: 18px 0px 0px 25px;
        position: relative;

        &__add-tag-btn {
            @include flex-container(center, _);
            margin: 15px 0px 18px 0px;
            opacity: 0.3;

            &:hover, &:focus {
                opacity: 1;
            }
            &-icon {
                font-weight: 300;
                font-size: 1.4rem !important;
                margin-left: 5px;
            }
            &-text {
                font-weight: 300;
                font-size: 1.3rem;
            }
        }
        &__list {
        }
        &__tag {
            @include flex-container(center, _);
            opacity: 0.5;
            transition: 0.1s ease-in-out;
            margin-bottom: 6px;
            cursor: pointer;

            &:active {
                transform: scale(0.98);
            }
            &:hover, &:focus, &--chosen {
                opacity: 1;
            }

            &-color {
                @include circle(3.5px);
                margin-right: 10px;
            }
            &-title {
                font-weight: 300;
                font-size: 1.15rem;
            }
        }
    }
    
    /* Main Tag View */
    .journal-tag-view {
        height: calc(100% - 25px);
        width: calc(100% - 155px);
        display: flex;
        flex-direction: column;

        &__top {
        }
        &__header {
            @include flex-container(center, space-between);
            padding: 18px 0px 0px 25px;
            margin-bottom: 5px;
        }
        &__tag-title {
            @include flex-container(center, _);

            h2 {
                margin-right: 9px;
            }
        }
        &__tag-symbol {
            @include circle(13px);
            @include center;
            font-size: 0.65rem;
        }
        &__details {
        }
        &__tabs {
        }
        &__tag-description {
            padding: 5px 12px 0px 25px;
            margin-bottom: 18px;
            font-weight: 300;
            color: rgba(var(--textColor1), 0.25);
            font-size: 1.3rem;
            min-width: 0px;
        }
        .highlighter-tabs {
            &__container {
                padding-left: 25px;
            }

            button {
                font-size: 1.45rem;
            }
        }
    }

    /* Goals View */
    .journal-goals {
        padding: 18px 0px 0px 25px;
        min-height: 0px;
        height: 100%;
        width: 100%;

        &__dropdown-container .dropdown-menu {
            @include pos-abs-top-left-corner(32px, 0px);
        }
        &__filter-dropdown-btn {

        }
        &__board {
            gap: 15px;
            margin-top: 20px;
            position: relative;
            max-height: calc(100% - $board-top-offset-gap);
            height: calc(100% - $board-top-offset-gap);
            overflow-x: scroll;
            width: 100%;
            
            &-cards-container {
                display: flex;
                max-height: calc(100% - $board-frame-top-offset-gap);
                overflow-y: scroll;
                overflow-x: hidden;
                width: 100%;
                min-width: 650px;
            }
            &-item {
                width: $board-item-width;
                transition: 0.12s ease-in-out;
                cursor: pointer;

                &:active {
                    transform: scale(0.994);
                }
                &:hover, &:focus {
                    filter: brightness(1.12);            
                }
                * {
                    pointer-events: none;
                }

                &--dragging {
                    opacity: 0.3;
                }
                &--over &-divider {
                    opacity: 1;
                    padding: 15px 0px 15px 0px;
                }
                &--btn-container {
                    height: 150px;

                    * {
                        pointer-events: auto;
                    }
                }
            }

            &-item-divider {
                width: 100%;
                @include flex-container(center, center);
                transition: 0.1s ease-in-out;
                opacity: 0;
                padding-top: 5px;
                
                path {
                    stroke: rgba(var(--textColor1), 0.24);
                }
            }
        }

        /* Columns */
        &__board-col {
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
        &__board-col-header {
            @include flex-container(center, _);
            margin: 0px $board-col-gap 4px 0px;
            min-width: $board-item-width;

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
            &-title {
                font-size: 1.17rem;
                font-weight: 300;
                margin-right: 15px;
                opacity: 0.4;
                @include elipses-overflow;
            }
            &-count {
                font-size: 1.2rem;
                opacity: 0.2;
            }
        }

        /* Goal Card */
        &__goal {
            background-color: var(--bentoBoxBgColor);
            box-shadow: var(--bentoBoxShadow);
            border-radius: 15px;
            padding: 10.5px 14px 12.5px 16px;
            font-weight: 300;
            border: 0.5px solid rgba(var(--textColor1), 0.029);
            position: relative;
            transition: 0.12s ease-in-out;
            cursor: pointer;
            
            &-name, &-description, &-status-dot, &-status, &-milestones, &-time-period {
                cursor: text !important;
                font-size: 1.075rem;
            }
            &-name {
                font-size: 1.24rem;
                font-weight: 500;
                color: rgba(var(--textColor1), 0.77);
                margin-bottom: 6px;
                width: fit-content;
                max-width: 95%;
                @include multi-line-elipses-overflow(2);
            }
            &-description {
                color: rgba(var(--textColor1), 0.36);
                font-size: 1.15rem;
                margin-bottom: 14px;
                width: fit-content;
            }
            &-status-dot {
                @include circle(2.5px);
                margin-right: 7px;
            }
            &-status {
                color: rgba(var(--textColor1), 0.44);
                font-weight: 400;
                margin-right: 10px;
            }
            &-milestones {
                color: rgba(var(--textColor1), 0.24);
            }
            &-time-period {
                color: rgba(var(--textColor1), 0.24);
            }
        }
    }
</style>