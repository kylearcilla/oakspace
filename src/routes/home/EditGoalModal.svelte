<script lang="ts">
	import { onDestroy, onMount } from "svelte"
    
	import Modal from "../../components/Modal.svelte"
	import SVGIcon from "../../components/SVGIcon.svelte"
	import ImgUpload from "../../components/ImgUpload.svelte"

	import { editGoalManger, goalsManager, globalContext, themeState } from "$lib/store"
	import { closeModal } from "$lib/utils-home"
	import { clickOutside, getVertScrollStatus } from "$lib/utils-general"
	import { formatDatetoStr } from "$lib/utils-date"
	import { EditGoalManager } from "$lib/edit-goal-manager"
	import { ModalType, GoalStatus, Icon, EditGoalContextMenu } from "$lib/enums"
	import { MAX_GOAL_DESCRIPTION_LENGTH, MAX_GOAL_TITLE_LENGTH, TEST_MILESTONES } from "$lib/utils-goals"
	import TasksList from "../../components/TasksList.svelte";

    export let goalToEdit: Goal | null

    enum Dropdown {
        Tag, Status, DueDate, TagSection, GenSection
    }

    let isTagDropdownListOpen = false
    let isStatusDropdownListOpen = false
    let isTagSectionListOpen = false

    let hasSpaceAboveMilestoneList = false
    let hasSpaceBelowMilestoneList = true
    let maskListGradient = ""
    let milestoneListRef: HTMLElement
    
    function newTaskAdded(e: CustomEvent) {
        console.log(e.detail)
    }


    let tags = [ { name: "french", color: "#9997FE", symbol: "🇫🇷" }, { name: "swe", color: "#FF8B9C", symbol: "👨‍💻" } ]

    function pickedDate() {
        const isEditingMilestone = $editGoalManger!.editingMilestoneIdx >= 0
        if (isEditingMilestone) {
            return $editGoalManger!.milestones[$editGoalManger!.editingMilestoneIdx].date
        }
        else {
            return $editGoalManger!.dueDate
        }
    }
    function displayDateStr(date: Date | null, emptyStr = "-") {
        return date ? formatDatetoStr(date, { year: "numeric", month: "short", day: "numeric" }) : emptyStr
    }
    function onDatePickerSubmitted(date: Date | null) {
        const isEditMilestone = $editGoalManger!.editingMilestoneIdx >= 0

        if (isEditMilestone) {
            $editGoalManger!.editMileStoneFinishDate(date)
        }
        else {
            $editGoalManger!.editGoalDate(date)
        }
    }
    function tagSectionOptionClicked(targetSectionId: number) {
        const targetSection = $goalsManager!.goalSections[targetSectionId]

        const srcSectionIdx = {
            sectionId: $editGoalManger!.sectionId,
            sectionItemIdx: $editGoalManger!.sectionIdx
        }
        const targetSectionIdx = {
            sectionId: targetSection.orderIdx,
            sectionItemIdx: targetSection.length
        }

        $goalsManager!.moveSectionItem(srcSectionIdx, targetSectionIdx)
        $editGoalManger!.updateSectionIdx(targetSectionIdx)

        isTagSectionListOpen = false
    }
    function statusListDropdownOptClicked(newStatus: GoalStatus) {
        $editGoalManger!.editNewStatus(newStatus)
        isStatusDropdownListOpen = false
    }
    function onDropdownClicked(e: Event, dropdown: Dropdown) {
        if (dropdown === Dropdown.DueDate) {
            $editGoalManger!.onContextMenu(e, EditGoalContextMenu.Date)
            return
        }
        isStatusDropdownListOpen = dropdown === Dropdown.Status && !isStatusDropdownListOpen
        isTagDropdownListOpen    = dropdown === Dropdown.Tag && !isTagDropdownListOpen
        isTagSectionListOpen     = dropdown === Dropdown.TagSection && !isTagSectionListOpen
    }
    function tagListDropdownOptClicked(tag: Tag) {
        $editGoalManger!.editNewTag(tag)
        isTagDropdownListOpen = false
    }
    function keyboardShortcutsHandler(event: KeyboardEvent) {
        $editGoalManger!.keyboardShortcutHandler(event)
    }
    function onWindowResize() {
        if ($editGoalManger!.datePickerPos === "") return
        $editGoalManger!.updateActivePicker()
    }
    onMount(() => {
        new EditGoalManager(goalToEdit)
        requestAnimationFrame(() => $editGoalManger!.bindElems())
    })
    onDestroy(() => {
        $editGoalManger!.quit()
    })
</script>


<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)} on:resize={onWindowResize}/>

{#if $editGoalManger}
<Modal 
    onClickOutSide={() => closeModal(ModalType.EditGoal)} 
    options={{ overflow: "visible" }}
>
    <div class={`edit-goal ${$themeState.isDarkTheme ? "edit-goal--dark" : "edit-goal--light"}`} id="edit-goal-modal">
    <div class="edit-goal__left" id="edit-goal-modal--left-side">
        <div class="edit-goal__left-upper">
                <!-- ★ Header  -->
                <div class="edit-goal__header">
                    <div class="edit-goal__title">
                        {#if $editGoalManger.isEditingTitle}
                            <input
                                type="text"
                                name="goal-title-input" 
                                id={`goal-title-input`}
                                class="edit-goal__title-input"
                                value={`${$editGoalManger.newText}`}
                                maxlength={MAX_GOAL_TITLE_LENGTH}
                                placeholder="New Goal Title"
                                on:input={(e) => $editGoalManger?.inputTextHandler(e)}
                                on:focus={(e) => $editGoalManger?.onInputFocusHandler(e)}
                                on:blur={(e) => $editGoalManger?.onInputBlurHandler(e)}
                            >
                        {:else}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <h2 on:click={() => $editGoalManger?.onGoalTitleClicked()}>
                                {$editGoalManger.title}
                            </h2>
                        {/if}
                    </div>
                    <button class="edit-goal__edit-btn dropdown-elem" on:click={(e) => $editGoalManger?.onContextMenu(e, EditGoalContextMenu.Goal)}>
                        <SVGIcon icon={Icon.Settings}/>
                    </button>
                </div>
                <!-- ★ Description -->
                <div class="edit-goal__description">
                    {#if $editGoalManger.isTextAreaActive}
                        <textarea
                            rows="1"
                            id={`goal-description-input`}
                            class="edit-goal__description-text-area"
                            maxlength={MAX_GOAL_DESCRIPTION_LENGTH}
                            placeholder={"No Description"}
                            value={$editGoalManger.newText}
                            spellcheck={$editGoalManger.textAreaHasSpellCheck}
                            style={`height: ${$editGoalManger.descrTextAreaHt}px`}
                            on:keydown={(e) => e.key === "Enter" ? e.preventDefault() : null}
                            on:focus={(e) => $editGoalManger?.onInputFocusHandler(e)}
                            on:input={(e) => $editGoalManger?.inputTextHandler(e)}
                            on:blur={(e) => $editGoalManger?.onInputBlurHandler(e)}
                        />
                    {:else}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <p on:click={e => $editGoalManger?.onDescriptionClicked(e)}>
                            {$editGoalManger.description}
                        </p>
                    {/if}
                </div>
            </div>
            <div class="edit-goal__left-lower" bind:this={milestoneListRef}>
                <!-- ★ Milestones List -->
                <div class="edit-goal__milestones">
                    <div class="edit-goal__milestones-header">
                        <h3>Milestones</h3>
                        <div class="edit-goal__milestone-progress">
                            {#if $editGoalManger.milestones.length > 0}
                                {$editGoalManger.milestonesDone}
                                <span>/</span>
                            {/if}
                            {$editGoalManger.milestones.length}
                        </div>
                    </div>
                    <div class="edit-goal__milestones-list">
                        {#if milestoneListRef}
                            <TasksList 
                                on:newTaskAdded={newTaskAdded}
                                options={{
                                    id:   "edit-goal",
                                    type: "subtasks",
                                    containerRef: milestoneListRef,
                                    tasks: TEST_MILESTONES.map((t) => ({ ...t, subtasks: [] })),
                                    styling: {
                                        task:             { fontSize: "1.3rem", height: "46px", padding: "12px 0px 12px 0px" },
                                        subtask:          { fontSize: "1.3rem", padding: "12px 0px 12px 0px" },
                                        descriptionInput: { fontSize: "1.3rem" }
                                    },
                                    contextMenuOptions: { width: "170px" },
                                    ui:                 { sidePadding: "24px" }
                                }}
                            />
                        {/if}
                    </div>
                </div>
                <div class="edit-goal__new-milestone-container">
                    <!-- ★ New Milestone Button -->
                    {#if $editGoalManger?.isMakingNewMilestone}
                        <div class="edit-goal__new-milestone-input-container input-box" id="new-milestone-input-container">
                            <input
                                type="text"
                                name="new-milestone-input" 
                                id="new-milestone-input"
                                class="edit-goal__new-milestone-input"
                                spellcheck="false"
                                value={`${$editGoalManger.newText}`}
                                maxlength={25}
                                placeholder="New Milestone"
                                on:input={(e) => $editGoalManger?.inputTextHandler(e)}
                                on:focus={(e) => $editGoalManger?.onInputFocusHandler(e)}
                            />
                            <div class="input-box__btn-container">
                                <button 
                                    on:click={() => $editGoalManger?.saveNewMilestone()}
                                    class="input-box__btn input-box__btn--submit"
                                    disabled={($editGoalManger?.newText?.length ?? 0) >= 25}
                                >
                                    Add
                                </button>
                                <button 
                                    on:click={() => $editGoalManger?.saveNewMilestone(false)}
                                    class="input-box__btn input-box__btn--cancel"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    {:else}
                        <button class="edit-goal__add-milestone-btn" on:click={() => $editGoalManger?.newMilestoneBtnClicked()}>
                            <span>New Milestone</span>
                            <span>+</span>
                        </button>
                    {/if}
                </div>
            </div>
        </div>
        <div class="edit-goal__right">
            <!-- ★ Img Container -->
            {#if $editGoalManger.imgSrc}
                <div class="edit-goal__img-container">
                    <img src={$editGoalManger.imgSrc} alt="Goal img" on:contextmenu={(e) => $editGoalManger?.onContextMenu(e, EditGoalContextMenu.Img)}>
                </div>
            {/if}
            <!-- ★ Details Column -->
            <div class="edit-goal__details-container">
                <h5>Details</h5>
                <!-- ★ Tag -->
                <div class={`edit-goal__detail edit-goal__tag ${!$editGoalManger.tag ? "edit-goal__tag--empty" : ""} edit-goal__detail--dropdown`}>
                    <div class="edit-goal__detail-title">
                        Tag
                    </div>
                    <div class="edit-goal__tag-dropdown-container">
                        <button 
                            class={`edit-goal__tag-btn dropdown-btn ${isTagDropdownListOpen ? "dropdown-btn--active" : ""}`}
                            on:click={(e) => onDropdownClicked(e, Dropdown.Tag)}
                        >
                            <div class="dropdown-btn__icon">
                                <div class="edit-goal__tag-btn-symbol">
                                    {$editGoalManger.tag?.symbol}
                                </div>
                            </div>
                            <span class="edit-goal__tag-btn-name dropdown-btn__title">
                                {$editGoalManger.tag?.name ?? "Empty"}
                            </span>
                            <div class={`dropdown-btn__icon ${$editGoalManger.tag ? "dropdown-btn__icon--arrow" : ""}`}>
                                {#if $editGoalManger.tag}
                                    <SVGIcon icon={Icon.Dropdown}/>
                                {:else}
                                    <SVGIcon icon={Icon.Add}/>
                                {/if}
                            </div>
                        </button>
                        {#if isTagDropdownListOpen}
                            <ul 
                                class="edit-goal__status-dropdown dropdown-menu"
                                use:clickOutside on:click_outside={() => isTagDropdownListOpen = false }
                            >
                                {#each tags as tag}
                                    <li class={`dropdown-menu__option ${$editGoalManger?.tag?.name === tag.name ? "dropdown-menu__option--selected" : ""}`}>
                                        <!-- <button on:click={() => tagListDropdownOptClicked(tag)}>
                                            <div class="dropdown-menu__option-icon">
                                                <div class="edit-goal__status-dropdown-tag-symbol">
                                                    {tag.symbol}
                                                </div>
                                            </div>
                                            <span class="dropdown-menu__option-text">
                                                {tag.name}
                                            </span>
                                            <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                                <i class="fa-solid fa-check"></i>
                                            </div>
                                        </button> -->
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                    <div class="edit-goal__detail-divider"></div>
                </div>
                <div class="edit-goal__detail edit-goal__status edit-goal__detail--dropdown">
                    <div class="edit-goal__detail-title">
                        Tag Section
                    </div>
                    <div class="edit-goal__status-dropdown-container">
                        <button 
                            class={`edit-goal__status-btn dropdown-btn ${isTagSectionListOpen ? "dropdown-btn--active" : ""}`}
                            on:click={(e) => onDropdownClicked(e, Dropdown.TagSection)}
                        >
                            <span class="edit-goal__status-btn-name dropdown-btn__title">
                                {$goalsManager?.goalSections[$editGoalManger.sectionId].name}
                            </span>
                            <div class="dropdown-btn__icon dropdown-btn__icon--arrow">
                                <SVGIcon icon={Icon.Dropdown}/>
                            </div>
                        </button>
                        {#if isTagSectionListOpen && $goalsManager}
                            <ul 
                                class="edit-goal__status-dropdown dropdown-menu" 
                                use:clickOutside on:click_outside={() => isTagSectionListOpen = false}
                            >
                                {#each $goalsManager.goalSections as section}
                                    <li class="dropdown-menu__option">
                                        <button on:click={() => tagSectionOptionClicked(section.orderIdx)}>
                                            <span class="dropdown-menu__option-text">
                                                {section.name}
                                            </span>
                                            <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                                <i class="fa-solid fa-check"></i>
                                            </div>
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                    <div class="edit-goal__detail-divider"></div>
                </div>
            </div>
        </div>
    </div>
</Modal>
{/if}

{#if $globalContext.modalsOpen.includes(ModalType.ImgUpload)}
    <ImgUpload
        title="Goal Image"
        inputPlaceHolder="1500 px wide images are ideal."
        onSubmit={(imgSrc) => $editGoalManger?.editGoalImgSrc(imgSrc)}
    />
{/if}

<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import "../../scss/inputs.scss";

    .edit-goal {
        width: 75vw;
        height: 75vh;
        max-width: 800px;
        min-width: 550px;
        display: flex;
        position: relative;

        .dropdown-btn {
            background-color: transparent;
            padding: 5px 8px;
            border-radius: 6px;
            width: 100%;
            align-items: baseline;
            transition: 0.02s ease-in-out;
            box-shadow: none;

            &:active {
                transform: scale(0.994);
            }
            &:hover {
                background-color: rgba(black, 0.024);
            }

            &__title {
                @include text-style(0.9, 300, 1.2rem);
            }
        }

        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &--dark .dropdown-btn { 
            @include dropdown-btn-dark;
        }
        &--light .input-box { 
            @include input-box--light;
        }
        &--light .dropdown-btn {

        }
        &--light &__title {
            h2, input {
                @include text-style(1, 600);
            }
        }
        &--light .dropdown-btn {
            &__title {
                @include text-style(0.91, 500);
            }
        }
        &--light &__description {
            p, textarea {
                @include text-style(0.6, 400);
            }
        }
        &--light &__milestone {
            &:hover {
                background-color: rgba(black, 0.02);
            }
            &:hover .edit-goal__milestone-edit-btn {
                opacity: 0.4;
            }

            &-header h3 {
                @include text-style(1, 500);
            }
            &-progress {
                @include text-style(0.4, 500);
            }
        }
        &--light &__add-milestone-btn {
            opacity: 0.8;
            
            &:hover {
                opacity: 0.4;
            }
        }
        &--light &__add-milestone-btn span {
            &:first-child {
                @include text-style(0.9, 500);
            }
            &:last-child {
                @include text-style(0.9, 200);
            }
        }
        &--light &__right {
            background-color: rgba(black, 0.015);
        }
        &--light &__detail {
            &-title {
                @include text-style(0.55, 500);
            }
            &-date {
                @include text-style(0.8, 500);
            }
            &-divider {
                background-color: rgba(var(--textColor1), 0.07);
            }
        }
        &--light &__due-date .dropdown-btn__title {
            @include text-style(0.8, 500);
        }
        &--light &__due-date-close-btn {
            opacity: 0.15;
            &:hover {
                opacity: 0.9;
            }
        }

        &__left {
            width: calc(100% - 197px);
            padding: 20px 0px 20px 0px;
            position: relative;

            &-upper {
                height: 28%;
                overflow: hidden;
                padding: 0px 20px 0px 25px;
            }
            &-lower {
                position: relative;
                height: calc(100% - 28%);
            }
        }
        &__right {
            width: 197px;
            background-color: rgba(black, 0.3);
        }
        &__date-picker-container {
            position: absolute;
        }
        &__context-menu {
            position: absolute;
        }

        &__header {
            @include flex(center, space-between);
            margin-bottom: 12px;
            width: 100%;
        }
        &__title h2, &__title input {
            @include text-style(1, 400, 1.7rem);
        }
        &__title {
            width: 100%;
        }
        &__title input {
            width: 100%;
            &::placeholder {
                @include text-style(0.3, 300, 1.6rem);
            }
        }
        &__edit-btn {
            @include circle(24px);
            @include center;
            opacity: 0.4;
            @include abs-top-right(14px, 14px);
            
            &:hover {
                opacity: 0.8;
                background-color: rgba(var(--textColor1), 0.08);
            }
        }
        &__description, &__description textarea {
            @include text-style(0.3, 300, 1.35rem);
        }
        &__description {
            height: 110px;
            overflow-y: scroll;
            
            p {
                white-space: pre-wrap;
                word-break: break-word;
            }
        }
        &__description textarea {
            width: 100%;

            &::placeholder {
                @include text-style(0.15, 300, 1.35rem);
            }
        }
        &__milestones {
            width: 100%;
            height: calc(100% - 20px);
            padding-top: 20px;
        }
        &__milestones-header {
            @include flex(center, space-between);
            margin-bottom: 8px;
            padding: 0px 20px 0px 25px;

            h3 {
                @include text-style(0.9, 500, 1.52rem);
            }
        }
        &__milestone-progress {
            font-family: "DM Mono";
            @include text-style(0.4, 200, 1.2rem);
            @include flex(center);
            span {
                font-family: "Manrope";
                margin: 0px 5px;
            }
        }
        &__milestones-list {
            width: 100%;
            height: calc(100% - (15px));
            padding: 4px 0px 30px 2px;

            &--short {
                max-height: calc(100% - (20.5px + 22px));
            }
        }
        &__add-milestone-btn {
            display: flex;
            height: 20px;
            padding: 0px 20px 0px 25px;
            opacity: 0.32;

            &:hover {
                opacity: 0.8;
            }
            &:active {
                transform: scale(0.995);
            }

            span {
                display: block;
                &:first-child {
                    margin-top: 2.5px;
                    @include text-style(0.9, 400, 1.3rem);
                }
                &:last-child {
                    margin-left: 9px;
                    @include text-style(0.9, 200, 1.7rem);
                }
            }
        }
        &__img-container {
            height: 100px;
            
            img {
                border-top-right-radius: 12px;
                height: 100%;
                width: 100%;
                object-fit: cover;
            }
        }
        &__details-container {
            padding: 15px 20px 0px 15px;

            h5 {
                @include text-style(0.9, 500, 1.6rem);
                margin-bottom: 15px;
            }
        }
        &__detail {
            &--dropdown &-title {
                margin-bottom: 4.5px;
            }
            &-title {
                @include text-style(0.7, 400, 1.14rem);
                margin-bottom: 8px;
            }
            &-date {
                @include text-style(0.4, 300, 1.1rem);
                font-family: "DM Mono";
            }
            &-date-btn {
                margin-left: -8px !important;
            }
            &-divider {
                background-color: rgba(var(--textColor1), 0.045);
                width: 100%;
                height: 0.4px;
                margin: 10px 0px 14px 0px;
            }
        }
        &__tag .dropdown-btn, &__status .dropdown-btn {
            margin-left: -5px;
            
            &:hover &__icon:last-child {
                opacity: 0.9 !important;
            }
            &__icon {
                &:last-child {
                    margin-right: 5px;
                }
                &:last-child svg {
                    position: absolute;
                    bottom: 2px;
                }
            }
        }
        &__tag--empty .dropdown-btn {
            &__title {
                @include text-style(0.2, 300, 1.2rem);
            }
            &__icon {
                &:first-child {
                    display: none;
                }
            }
        }
        &__tag-btn-symbol {
            @include center;
            @include circle(10px);
            margin-right: 2px;
            font-size: 1.2rem;
        }
        &__status .dropdown-btn {

        }
        &__status-btn {
            &-dot-container {
                margin-right: 12px !important;
            }
            &-dot {
                @include circle(3px);
                font-size: 1.2rem;
                @include abs-top-left(-6px, 0px);

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
        }
        &__status-dropdown {
            &-tag-dot {
                @include circle(3px);

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
        }
        &__creation-date {

        }
        &__due-date .dropdown-btn {
            margin-left: -9px;
            &__icon {
                margin-left: 2px;
            }
        }
        &__due-date {
            position: relative;

            &--no-date .dropdown-btn {
                margin-left: -8px;
                opacity: 0.6;
                
                &:hover {
                    opacity: 0.85;
                }
            }
            &--no-date .dropdown-btn__title {
                font-family: "Manrope";
                @include text-style(0.2, 300, 1.3rem);
            }
            &--no-date .dropdown-btn__icon path {
                stroke: rgba(var(--textColor1), 0.15);
            }
        }
        &__due-date .dropdown-btn__title {
            @include text-style(0.4, 300, 1.1rem);
            font-family: "DM Mono";
        }
        &__due-date-close-btn {
            @include abs-top-right(24px, -5px);
            @include circle(22px);
            @include center;
            opacity: 0.06;
    
            &:active {
                transform: scale(0.96);
            }
            &:hover {
                opacity: 0.4;
                background: rgba(var(--textColor1), 0.05);
            }
        }
    }
</style>