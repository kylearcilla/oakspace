<script lang="ts">
	import { GoalsManager } from "$lib/goals-manager"
    import { closeModal, openModal } from "$lib/utils-home"
    import { toggleYTIFramePointerEvents } from "$lib/utils-youtube"
    import { JournalTab, GoalViewOption, GoalsDropdown, ModalType, Icon, GoalItemUI} from "$lib/enums"
	import { clickOutside, getFirstHighlighterBtn } from "$lib/utils-general"
	import { goalsManager, globalContext, themeState } from "$lib/store"

	import { onDestroy, onMount } from "svelte"
	import GoalsBoard from "./GoalsBoard.svelte"
	import GoalsHistory from "./GoalsHistory.svelte"
	import Modal from "../../components/Modal.svelte"
	import SVGIcon from "../../components/SVGIcon.svelte"
	import EditGoalModal from "./EditGoalModal.svelte"
	import GoalsRepo from "./GoalsRepo.svelte"
    
    let selectedTab = JournalTab.Goals
    let tabHighlighterClass = ""
    let goalInEdit: Goal | null = null
    let isItemViewCard = true

    const JOURNAL_TAB_CONTAINER_ID = "journal-tabs"

    $: goalViewOption = $goalsManager?.currentGoalView
    $: currentDropDown = $goalsManager?.currentDropDown

    $: {
        if ($goalsManager && (goalViewOption === GoalViewOption.Board)) {
            isItemViewCard = $goalsManager.boardGoalItemView === GoalItemUI.BoardCard
        }
        else if ($goalsManager) {
            isItemViewCard = $goalsManager.repoGoalItemView === GoalItemUI.RepoCard
        }
    }

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
    function onTagClicked() {

    }
    function initGoalInEdit(goal: Goal) {
        goalInEdit = goal
        openModal(ModalType.EditGoal)
    }

    onMount(() => {
        toggleYTIFramePointerEvents(false)
        initHighlighter(getFirstHighlighterBtn(JOURNAL_TAB_CONTAINER_ID))

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
                <div class="journal-tags__header">
                    <h2 class="journal-tags__header-title">Tags</h2>
                    <button class="journal-tags__add-tag-btn">
                        <SVGIcon icon={Icon.Add} options={{ scale: 0.8, strokeWidth: 1.4 }} />
                    </button>
                </div>
                <!-- Tags List -->
                <ul class="journal-tags__list">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <li class="journal-tags__tag" role="button" tabindex="0" on:click={() => onTagClicked()}>
                        <span class="journal-tags__tag-title">All</span>
                    </li>
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
                        <div class="highlighter-tabs__container" id="journal-tabs">
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
                        <div class="journal-goals__options-header">
                            <!-- Filter Buttons  -->
                            <div class="journal-goals__dropdown-container dropdown-container">
                                <button 
                                    class={`journal-goals__filter-dropdown-btn dropdown-btn ${currentDropDown === GoalsDropdown.ViewOption ? "dropdown-btn--active" : ""}`}
                                    on:click={() => $goalsManager?.setCurrentDropdown(GoalsDropdown.ViewOption)}
                                >
                                    <span class="dropdown-btn__title">
                                        {goalViewOption}
                                    </span>
                                    <div class="dropdown-btn__icon dropdown-btn__icon--arrow">
                                        <SVGIcon icon={Icon.Dropdown} />
                                    </div>
                                </button>
                                <!-- View Option Dropdown -->
                                {#if currentDropDown === GoalsDropdown.ViewOption}
                                    <ul 
                                        use:clickOutside on:click_outside={() => $goalsManager?.setCurrentDropdown(null)}
                                        class="journal-goals__dropdown-menu dropdown-menu"
                                    >
                                        <li class={`dropdown-menu__option ${goalViewOption === GoalViewOption.Board ? "dropdown-menu__option--selected" : ""}`}>
                                            <button on:click={() => $goalsManager?.setCurrGoalView(GoalViewOption.Board)}>
                                                <span class="dropdown-menu__option-text">Board</span>
                                                {#if goalViewOption === GoalViewOption.Board}
                                                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                                        <i class="fa-solid fa-check"></i>
                                                    </div>
                                                {/if}
                                            </button>
                                        </li>
                                        <li class={`dropdown-menu__option ${goalViewOption === GoalViewOption.AllGoals ? "dropdown-menu__option--selected" : ""}`}>
                                            <button on:click={() => $goalsManager?.setCurrGoalView(GoalViewOption.AllGoals)}>
                                                <span class="dropdown-menu__option-text">All Goals</span>
                                                {#if goalViewOption === GoalViewOption.AllGoals}
                                                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                                        <i class="fa-solid fa-check"></i>
                                                    </div>
                                                {/if}
                                            </button>
                                        </li>
                                        <li class={`dropdown-menu__option ${goalViewOption === GoalViewOption.History ? "dropdown-menu__option--selected" : ""}`}>
                                            <button on:click={() => $goalsManager?.setCurrGoalView(GoalViewOption.History)}>
                                                <span class="dropdown-menu__option-text">History</span>
                                                {#if goalViewOption === GoalViewOption.History}
                                                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                                        <i class="fa-solid fa-check"></i>
                                                    </div>
                                                {/if}
                                            </button>
                                        </li>
                                    </ul>
                            {/if}
                            </div>
                            <!-- View Options -->
                            <div class="journal-goals__options-btns-container">
                                <!-- View Settings Button -->
                                {#if goalViewOption === GoalViewOption.AllGoals || goalViewOption === GoalViewOption.Board}
                                    <div class="journal-goals__view-btn-container dropdown-elem">
                                        <button 
                                            class="journal-goals__options-btn"
                                            on:click={() => $goalsManager?.setCurrentDropdown(GoalsDropdown.TuneDropdown)}
                                        >
                                            <div class="journal-goals__options-btn-icon"><SVGIcon icon={Icon.Tune}/></div>
                                            View
                                        </button>
                                        <!-- Tune Dropdown -->
                                        {#if currentDropDown === GoalsDropdown.TuneDropdown}
                                            <ul class="journal-goals__options-dropdown dropdown-menu" 
                                                use:clickOutside on:click_outside={() => $goalsManager?.setCurrentDropdown(null)}
                                            >
                                                <li class={`dropdown-menu__option ${!isItemViewCard ? "dropdown-menu__option--selected" : ""}`}>
                                                    <button on:click={() => $goalsManager?.setCurrentGoalItemView(false)}>
                                                        <span class="dropdown-menu__option-text">
                                                            List View
                                                        </span>
                                                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                                            <i class="fa-solid fa-check"></i>
                                                        </div>
                                                    </button>
                                                </li>
                                                <li class={`dropdown-menu__option ${isItemViewCard ? "dropdown-menu__option--selected" : ""}`}>
                                                    <button on:click={() => $goalsManager?.setCurrentGoalItemView(true)}>
                                                        <span class="dropdown-menu__option-text">
                                                            Card View
                                                        </span>
                                                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                                            <i class="fa-solid fa-check"></i>
                                                        </div>
                                                    </button>
                                                </li>
                                            </ul>
                                        {/if}
                                    </div>
                                {/if}
                                <!-- Archived Button -->
                                {#if goalViewOption === GoalViewOption.AllGoals}
                                    <button class="journal-goals__options-btn">
                                        <div class="journal-goals__options-btn-icon">
                                            <SVGIcon icon={Icon.Archive}/>
                                        </div>
                                        Archived
                                    </button>
                                {/if}
                            </div>
                        </div>

                        {#if goalViewOption === GoalViewOption.Board}
                            <GoalsBoard initGoalInEdit={initGoalInEdit} />
                        {:else if goalViewOption === GoalViewOption.AllGoals}
                            <GoalsRepo  initGoalInEdit={initGoalInEdit}/>
                        {:else}
                            <GoalsHistory/>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</Modal>


{#if $globalContext.modalsOpen.includes(ModalType.EditGoal)}
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
            padding: 20px 20px 27px 18px;
        }
        &__content {
            display: flex;
            width: 100%;
            height: calc(100% - 33px);
        }
        &__section-divider {
            height: 0.5px;
            width: 100%;
            background-color: rgba(var(--textColor1), 0.045);

            &--main {
                width: 0.5px;
                height: calc(100% - 25px);
                @include pos-abs-top-right-corner(0px, 0px);
            }
        }
    }

    /* Tag Column */
    .journal-tags {
        min-width: 155px;
        padding-top: 15px;
        padding: 12px 13px 0px 18px;
        position: relative;

        &__header {
            @include flex(center, space-between);
            margin-bottom: 10px;
        }
        &__header-title {
            @include text-style(0.85, 400, 1.2rem);
        }
        &__add-tag-btn {
            opacity: 0.2;
            margin: 3px 5px 0px 0px;

            &:hover {
                opacity: 1;
            }
            &:active {
                transform: scale(0.96)
            }
        }
        &__list {
        }
        &__tag {
            @include flex(center);
            opacity: 0.4;
            transition: 0.05s ease-in-out;
            margin-bottom: 6.5px;
            cursor: pointer;

            &:active {
                transform: scale(0.99);
            }
            &:hover, &:focus, &--chosen {
                opacity: 0.85;
            }

            &-color {
                @include circle(3.5px);
                margin-right: 10px;
            }
            &-title {
                @include text-style(0.9, 300, 1.1rem);
            }
        }
    }
    
    /* Main Tag View */
    .journal-tag-view {
        height: calc(100% - 25px);
        width: calc(100% - 155px);
        display: flex;
        flex-direction: column;

        h2 {
            font-size: 1.85rem;
            font-weight: 400;
        }

        &__top {
        }
        &__header {
            @include flex(center, space-between);
            padding: 15px 0px 0px 25px;
            margin-bottom: 5px;
        }
        &__tag-title {
            @include flex(center, _);

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
        &--light &__options-btn {
            @include text-style(_, 600);
            opacity: 0.45;
            
            &:hover {
                opacity: 0.8;
            }
        }

        &__options-header {
            @include flex(center, space-between);
            padding-right: 20px;
        }
        &__options-dropdown {
            @include pos-abs-top-right-corner(23px, 0px);
        }
        &__view-btn-container {
            position: relative;
        }
        &__options-btns-container {
            display: flex;
            margin-top: 5px;
        }
        &__options-btn {
            @include flex(center);
            @include text-style(1, 400, 1.2rem);
            opacity: 0.2;

            &-icon {
                margin-right: 9px;
                transition: 0.12s ease-in-out;
                @include center;
            }

            &:last-child {
                margin-left: 20px;
            }
            &:hover {
                opacity: 0.7;
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
</style>