<script lang="ts">
	import { GoalsManager } from "$lib/goals-manager"
    import { closeModal, openModal } from "$lib/utils-home"
    import { toggleYTIFramePointerEvents } from "$lib/utils-youtube"
    import { JournalTab, GoalViewOption, ModalType } from "$lib/enums"
	import { clickOutside, getElemsByClass } from "$lib/utils-general"
	import { goalsManager, homeViewLayout, themeState } from "$lib/store"

	import { onDestroy, onMount } from "svelte"
	import GoalsBoard from "./GoalsBoard.svelte"
	import GoalsHistory from "./GoalsHistory.svelte"
	import Modal from "../../components/Modal.svelte"
	import EditGoalModal from "./EditGoalModal.svelte"

    let selectedTab = JournalTab.Goals
    let goalViewOption = GoalViewOption.Board
    
    let tabHighlighterClass = ""
    let isGoalsDropdownOpen = false
    let goalInEdit: Goal | null = null

    const HIGHLIGHTER_TAB_CLASS= "highlighter-tabs__tab-btn"

    function onTabClicked(e: Event, tab: JournalTab) {
        const target = e.target as HTMLButtonElement
        selectedTab = tab

        initHighlighter(target)
    }
    function initHighlighter(tab: HTMLButtonElement) {
        const width = tab.clientWidth
        const offSetLeft = tab.offsetLeft

        tabHighlighterClass = `left: ${offSetLeft}px; width: ${width}px;`
    }
    function onGoalViewOptionClicked(tab: GoalViewOption) {
        goalViewOption = tab
        isGoalsDropdownOpen = false

        if (tab === GoalViewOption.History) {
            requestAnimationFrame(() =>  $goalsManager?.updateYrTitle(0))
        }
    }
    function onTagClicked() {

    }
    function initGoalInEdit(goal: Goal) {
        goalInEdit = goal
        openModal(ModalType.EditGoal)
    }

    onMount(() => {
        toggleYTIFramePointerEvents(false)

        const firstTab = getElemsByClass(HIGHLIGHTER_TAB_CLASS)![0] as HTMLButtonElement
        initHighlighter(firstTab)

        if ($goalsManager) return

        new GoalsManager()

        $goalsManager!.initGoals()
        $goalsManager!.getMoreAccomplishments()
        $goalsManager!.updateYrTitle()
    })
    onDestroy(() => { 
        toggleYTIFramePointerEvents(true)
    })
</script>


<Modal onClickOutSide={() => closeModal(ModalType.Journal)} options={{ overflowY: "hidden" }}>
    <div class={`journal ${$themeState.isDarkTheme ? "journal--dark" : "journal--light"}`}>
        <div class="journal__header">
            <h1 class="modal-bg__content-title">Journal</h1>
        </div>
        <div class="journal__section-divider journal__section-divider--header"></div>
        <!-- Content -->
        <div class="journal__content">
            <div class="journal-tags">
                <h2>Tags</h2>
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
                <button class="journal-tags__add-tag-btn">
                    <span class="journal-tags__add-tag-btn-icon">+</span>
                    <span class="journal-tags__add-tag-btn-text">Make New Tag</span>
                </button>
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
                    <div class={`journal-goals ${$themeState.isDarkTheme ? "" : "journal-goals--light"}`}>
                        <!-- Filter Buttons  -->
                        <div class="journal-goals__dropdown-container dropdown-container">
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
                                        {#if goalViewOption === GoalViewOption.Board}
                                            <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                                <i class="fa-solid fa-check"></i>
                                            </div>
                                        {/if}
                                    </button>
                                </li>
                                <li class={`dropdown-menu__option ${goalViewOption === GoalViewOption.History ? "dropdown-menu__option--selected" : ""}`}>
                                    <button on:click={() => onGoalViewOptionClicked(GoalViewOption.History)}>
                                        <span class="dropdown-menu__option-text">History</span>
                                        {#if goalViewOption === GoalViewOption.History}
                                            <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                                <i class="fa-solid fa-check"></i>
                                            </div>
                                        {/if}
                                    </button>
                                </li>
                            </ul>
                        </div>
                        {#if goalViewOption === GoalViewOption.Board}
                            <GoalsBoard initGoalInEdit={initGoalInEdit} />
                        {:else}
                            <GoalsHistory/>
                        {/if}
                    </div>
                {:else}
                {/if}
            </div>
        </div>
    </div>
</Modal>


{#if $homeViewLayout.modalsOpen.includes(ModalType.EditGoal)}
    <EditGoalModal goalToEdit={goalInEdit} />
{/if}

<style global lang="scss">
    @import "../../scss/highlighter-tabs.scss";
    @import "../../scss/dropdown.scss";

    $board-col-gap: 20px;
    $board-item-width: 195px;
    $board-top-offset-gap: 48px;
    $board-frame-top-offset-gap: 26px;

    .journal {
        width: 88vw;
        height: 88vh;
        min-width: 390px;
        max-width: 1100px;

        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &--dark .dropdown-btn {
            @include dropdown-btn-dark;
            background-color: rgba(var(--textColor1), 0.032);
        }
        &--light &__section-divider {
            height: 1px;
            background-color: rgba(var(--textColor1), 0.05);
            
            &--main {
                height: calc(100% - 25px);
                width: 1px;
            }
        }
        &--light &__content h2 {
            font-weight: 500;
        }
        &--light .highlighter-tabs {
            @include highlighter-tabs-light-mode;

            &__divider {
                height: 1px;
                background-color: rgba(var(--textColor1), 0.05);
            }
        }
        &--light &-tags {
            &__add-tag-btn span {
                font-weight: 500;
                color: rgba(var(--textColor1), 0.98);
            }
            &__tag {
                opacity: 1;

                &:hover {
                    opacity: 0.7;
                }
            }
            &__tag-title {
                font-weight: 600;
                color: rgba(var(--textColor1), 0.64);
            }
        }
        &--light &-tag-view {
            &__tag-description {
                font-weight: 500;
                color: rgba(var(--textColor1), 0.55);
            }
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

        h2 {
            margin-bottom: 15px;
        }

        &__add-tag-btn {
            @include flex-container(center, _);
            margin: 15px 0px 0px 0px;
            opacity: 0.3;
            display: none;

            &:hover, &:focus {
                opacity: 1;
            }
            &-icon {
                font-weight: 100;
                font-size: 1.6rem;
            }
            &-text {
                margin-left: 8px;
                font-weight: 300;
                font-size: 1.2rem;
            }
        }
        &__list {
        }
        &__tag {
            @include flex-container(center, _);
            opacity: 0.5;
            transition: 0.05s ease-in-out;
            margin-bottom: 9px;
            cursor: pointer;

            &:active {
                transform: scale(0.98);
            }
            &:hover, &:focus, &--chosen {
                opacity: 0.85;
            }

            &-color {
                @include circle(4px);
                margin-right: 10px;
            }
            &-title {
                font-weight: 300;
                font-size: 1.24rem;
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
        padding: 18px 0px 0px 0px;
        min-height: 0px;
        height: 100%;
        width: 100%;

        &--light &__filter-dropdown-btn {
            box-shadow: none;
            background-color: rgba(black, 0.032);
        }
        &--light &__history-year-view {
            &-row-title {
                @include text-style(0.6, 500);
            }
            &-row-count {
                @include text-style(0.3, 500);
            }
        }
        &--light &__history-item {
            &-date {
                @include text-style(0.45, 600);
            }
            &-details-title {
                @include text-style(0.9, 500);
            }
            &-details-type, &-details-arrow {
                @include text-style(0.55, 500);
            }
            &-details-goal {
                @include text-style(0.65, 500);
            }
        }
        &--light &__history-timeline {
            &-month {
                @include text-style(1, 600);
            }
        }

        &__dropdown-container .dropdown-menu {
            @include pos-abs-top-left-corner(35px, 0px);
            margin-left: 25px;
        }
        &__filter-dropdown-btn {
            margin-left: 25px;
        }
    }

    .goals-board {
        margin-top: 20px;
        position: relative;
        max-height: calc(100% - $board-top-offset-gap);
        height: calc(100% - $board-top-offset-gap);
        overflow-x: scroll;
        width: 100%;
        padding-left: 25px;

        &--light &-item {
            &:hover, &:focus {
                filter: brightness(1.02);
            }

            &--btn-container button {
                font-weight: 500;
            }
        }
        &--light &-col-header {
            &-title {
                font-weight: 600;
                color: rgba(var(--textColor1), 0.78);
            }
            &-count {
                font-weight: 500;
                color: rgba(var(--textColor1), 0.3);
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
                transform: scale(0.994);
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
                font-size: 1.17rem;
                font-weight: 300;
                margin-right: 15px;
                color: rgba(var(--textColor1), 0.7);
                @include elipses-overflow;
            }
            &-count {
                font-size: 1.2rem;
                color: rgba(var(--textColor1), 0.2);
            }
        }
    }

    /* Goal Card */
    .goal-card {
        background-color: var(--bentoBoxBgColor);
        box-shadow: var(--bentoBoxShadow);
        border-radius: 15px;
        padding: 10.5px 14px 12.5px 16px;
        font-weight: 300;
        border: 0.5px solid rgba(var(--textColor1), 0.029);
        position: relative;
        transition: 0.12s ease-in-out;
        position: relative;

        &--light  {
            border-color: transparent;
            }
        &--light &__name { 
            font-weight: 600;
            color: rgba(var(--textColor1), 0.85);
        }
        &--light &__description {
            font-weight: 400;
            color: rgba(var(--textColor1), 0.5);
        }
        &--light &__status {
            font-weight: 600;
            color: rgba(var(--textColor1), 0.7);
        }
        &--light &__milestones {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.3);
        }
        &--light &__time-period span {
            font-weight: 600;
            color: rgba(var(--textColor1), 0.35);
        }

        
        &__name, &__description, &__status-dot, &__status, &__milestones, &__time-period {
            cursor: text;
            user-select: text;
            font-size: 1.075rem;
        }
        &__name {
            font-size: 1.24rem;
            font-weight: 500;
            color: rgba(var(--textColor1), 0.77);
            margin-bottom: 6px;
            width: fit-content;
            max-width: 95%;
            @include multi-line-elipses-overflow(2);
        }
        &__description {
            color: rgba(var(--textColor1), 0.36);
            font-size: 1.15rem;
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
            color: rgba(var(--textColor1), 0.44);
            font-weight: 400;
            margin-right: 6.5px;
            @include flex-container(center, _);
        }
        &__milestones {
            color: rgba(var(--textColor1), 0.24);
        }
        &__time-period span {
            color: rgba(var(--textColor1), 0.24);
        }
    }
</style>