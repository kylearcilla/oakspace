<script lang="ts">
	import { onDestroy, onMount } from "svelte"
    
	import Modal from "../../components/Modal.svelte"
	import DatePicker from "../../components/DatePicker.svelte"
	import SVGIcon from "../../components/SVGIcon.svelte"
	import ImgUpload from "./ImgUpload.svelte";

	import { editGoalManger, homeViewLayout, themeState } from "$lib/store"
	import { closeModal } from "$lib/utils-home"
	import { clickOutside, findAncestorByClass, getScrollStatus } from "$lib/utils-general"
	import { formatDatetoStr } from "$lib/utils-date"
	import { EditGoalManager } from "$lib/edit-goal-manager"
	import { ModalType, GoalStatus, EditMilestoneOption, Icon, EditGoalOption, EditGoalContextMenu } from "$lib/enums"
	import { MAX_GOAL_DESCRIPTION_LENGTH, MAX_GOAL_TITLE_LENGTH, getGoalStatusString } from "$lib/utils-goals"


    export let goalToEdit: Goal | null

    enum Dropdown {
        Tag, Status, DueDate
    }

    let isTagDropdownListOpen = false
    let isStatusDropdownListOpen = false

    let hasSpaceAboveMilestoneList = false
    let hasSpaceBelowMilestoneList = true
    let maskListGradient = ""

    let dragSourcElem: HTMLElement | null = null
    let dropTargetElem: HTMLElement | null = null

    let shouldDrag = false

    let tags = [ { name: "french", color: "#9997FE", symbol: "🇫🇷" }, { name: "swe", color: "#FF8B9C", symbol: "👨‍💻" } ]

    const today = new Date()

    /* Drag Handlers */
    function onMilestoneMouseDown(event: Event) {
        const target = event.target as HTMLElement
        const dotsParent = findAncestorByClass(target, "edit-goal__milestone-drag-handle")

        shouldDrag = dotsParent != null ? true : false
    }
    function onDragStartHandler(event: DragEvent) {
        event.stopPropagation()

        if (!shouldDrag) {
            event.preventDefault()
            return
        }

        const target = event.target as HTMLElement
        if (target.tagName != "LI" || target.classList.contains("--dragging")) {
            event.preventDefault()
            return
        }
        
        dragSourcElem = target
        target.classList.add('edit-goal__milestone--dragging')
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
        const milestone = findAncestorByClass(target, "edit-goal__milestone")!

        const dragSrcIdx = Number(dragSourcElem!.id.split("--")[1])
        const dragDestIdx = Number(milestone.id.split("--")[1])
        const cutOffIdx = $editGoalManger!.milestones.length - $editGoalManger!.milestonesDone    // allow hover on first finished elem
        
        if (dragDestIdx > cutOffIdx || dragSrcIdx === dragDestIdx) {
            event.preventDefault()
            return false
        }
        
        resetCurrentDropTarget()
        dropTargetElem = milestone
        dropTargetElem.classList.add('edit-goal__milestone--over')
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

        let fromIdx = Number(dragSourcElem!.id.split("--")[1])
        let toIdx = Number(dropTargetElem!.id.split("--")[1])                                       // idx of the elem hovering over
        let cutOffIdx = $editGoalManger!.milestones.length - $editGoalManger!.milestonesDone        // allow hover on first finished elem

        if (fromIdx > cutOffIdx) {
            return false
        }

        // src going down will take dest idx - 1 place
        // src going up will take dest idx place
        if (fromIdx < toIdx) {
            toIdx = Math.max(0, toIdx - 1)
        }

        $editGoalManger!.moveElemInMilestone(fromIdx, toIdx)
        
        resetCurrentDragSourceTarget()
        resetCurrentDropTarget()
        return false
    }
    function resetCurrentDragSourceTarget() {
        if (!dragSourcElem) return
        dragSourcElem.classList.remove('edit-goal__milestone--dragging')
        dragSourcElem =  null
    }
    function resetCurrentDropTarget() {
        if (!dropTargetElem) return
        dropTargetElem.classList.remove('edit-goal__milestone--over')
        dropTargetElem =  null
    }

    function pickedDate() {
        const isEditingMilestone = $editGoalManger!.editingMilestoneIdx >= 0
        if (isEditingMilestone) {
            return $editGoalManger!.milestones[$editGoalManger!.editingMilestoneIdx].endDate
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
    function settingsBtnClickedHandler() {

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
    }
    function tagListDropdownOptClicked(tag: Tag) {
        $editGoalManger!.editNewTag(tag)
        isTagDropdownListOpen = false
    }
    function updateMaskListGradient() {
        if (hasSpaceAboveMilestoneList && hasSpaceBelowMilestoneList) {
            maskListGradient = "linear-gradient(180deg, transparent 0.2%, black 10%, black 80%, transparent 99%)"
        }
        else if (hasSpaceAboveMilestoneList) {
            maskListGradient = "linear-gradient(180deg, transparent 0.2%, black 10%)"
        }
        else {
            maskListGradient = "linear-gradient(180deg, black 80%, transparent 99%)"
        }
    }
    function milestoneListScrollHandler(e: Event) {
        const [hasReachedEnd, hasReachedTop] = getScrollStatus(e.target as HTMLElement)

        hasSpaceAboveMilestoneList = !hasReachedTop
        hasSpaceBelowMilestoneList = !hasReachedEnd

        updateMaskListGradient()
    }
    function keyboardShortcutsHandler(event: KeyboardEvent) {
        $editGoalManger!.keyboardShortcutHandler(event)
    }
    function onWindowResize() {
        if ($editGoalManger!.datePickerPos === "") return
        $editGoalManger!.updateActivePicker()
    }
    onMount(() => {
        updateMaskListGradient()
        new EditGoalManager(goalToEdit)

        requestAnimationFrame(() => $editGoalManger!.bindElems())
    })
    onDestroy(() => {
        $editGoalManger!.quit()
    })
</script>

<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)} on:resize={onWindowResize}/>

{#if $editGoalManger}
<Modal onClickOutSide={() => closeModal(ModalType.EditGoal)} options={{ overflow: "visible" }}>
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
                    {#if $editGoalManger.isEditingDescription}
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
            <div class="edit-goal__left-lower">
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
                    <ul 
                        class={`edit-goal__milestones-list ${$editGoalManger.isMakingNewMilestone ? "edit-goal__milestones-list--short" : ""}`}
                        on:scroll={milestoneListScrollHandler}
                        style={`-webkit-mask-image: ${maskListGradient}; mask-image: ${maskListGradient};`}
                    >
                        {#each $editGoalManger.milestones as milestone, idx}
                            <!-- ★ Milestone -->
                            <li 
                                class={`edit-goal__milestone ${milestone.endDate ? "edit-goal__milestone--checked" : ""}`}
                                id={`milestone-id--${idx}`}
                                draggable={milestone.endDate ? false : true}
                                on:contextmenu={(e) => $editGoalManger?.onMilestoneSettings(e, idx)}
                                on:mousedown={onMilestoneMouseDown}
                                on:dragover={onDragOverHandler}
                                on:dragenter={onDragEnterHandler}
                                on:dragleave={onDragLeaveHandler}
                                on:drop={onDropHandler}
                                on:drag={onDragHandler}
                                on:dragstart={onDragStartHandler}
                                on:dragend={onDragEndHandler}
                            >
                                <div class={`edit-goal__milestone-divider ${idx === 0 ? "edit-goal__milestone-divider--hidden" : ""}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="2" fill="none">
                                        <path d="M0.777344 1.19531H755.139" stroke-width="0.8" stroke-dasharray="2.5 2.5"/>
                                    </svg>
                                </div>
                                <div class="edit-goal__milestone-drag-handle">
                                    <div class="edit-goal__milestone-drag-handle-dots">
                                        <SVGIcon icon={Icon.DragDots} />
                                    </div>
                                </div>
                                <div class="edit-goal__milestone-top-details">
                                    <div class="edit-goal__milestone-check-box-container">
                                        <button 
                                            class="edit-goal__milestone-check-box"
                                            on:click={() => $editGoalManger?.toggleCheckMilestone(idx)}
                                        >
                                            <i class="fa-solid fa-check"></i>
                                        </button>
                                        {#if idx != $editGoalManger.milestones.length - 1}
                                            <div class="edit-goal__milestone-dotted-line">
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    width="3" height={`${milestone.endDate ? "40" : "35"}`}
                                                    viewBox={`0 0 3 ${milestone.endDate ? "40" : "35"}`}
                                                    fill="none"
                                                >
                                                    <path 
                                                        d={`M1.6875 0.219727L1.6875 ${milestone.endDate ? "40" : "35"}`}
                                                        stroke-width="1.2" stroke-dasharray="1.6 1.6"
                                                    />
                                                </svg>
                                            </div>
                                        {/if}
                                    </div>
                                    {#if $editGoalManger.editingMilestoneIdx === idx && $editGoalManger.isEditingMilestoneTitle}
                                        <input
                                            type="text"
                                            name="milestone-title-input" 
                                            id={`milestone-title-input`}
                                            class="edit-goal__milestone-title-input"
                                            value={`${$editGoalManger.newText}`}
                                            maxlength={50}
                                            placeholder="New Milestone Title"
                                            on:input={(e) => $editGoalManger?.inputTextHandler(e)}
                                            on:focus={(e) => $editGoalManger?.onInputFocusHandler(e)}
                                            on:blur={(e) => $editGoalManger?.onInputBlurHandler(e)}
                                        />
                                    {:else}
                                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                                        <h4 
                                            class={`edit-goal__milestone-title ${milestone.endDate ? "strike" : ""}`}
                                            on:click={e => $editGoalManger?.onMilestoneClicked(idx)}
                                        >
                                            {milestone.title}
                                        </h4>
                                    {/if}
                                </div>
                                <div>
                                    <span class="edit-goal__milestone-date">
                                        {displayDateStr(milestone.endDate)}
                                    </span>
                                </div>
                                <button class="edit-goal__milestone-edit-btn dropdown-elem" on:click={(e) => $editGoalManger?.onMilestoneSettings(e, idx)}>
                                    <SVGIcon icon={Icon.Settings}/>
                                </button>
                            </li>
                        {/each}
                    </ul>
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
                                    disabled={($editGoalManger?.newText?.length ?? 0) >= 25}
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
                                    <li class="dropdown-menu__option">
                                        <button on:click={() => tagListDropdownOptClicked(tag)}>
                                            <div class="dropdown-menu__option-icon">
                                                <div class="edit-goal__status-dropdown-tag-symbol">
                                                    {tag.symbol}
                                                </div>
                                            </div>
                                            <span class="dropdown-menu__option-text">
                                                {tag.name}
                                            </span>
                                            {#if tag.name === $editGoalManger.tag?.name}
                                                <div class="dropdown-menu__option-icon">
                                                    <i class="fa-solid fa-check"></i>
                                                </div>
                                            {/if}
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                    <div class="edit-goal__detail-divider"></div>
                </div>
                <!-- ★ Status -->
                <div class="edit-goal__detail edit-goal__status edit-goal__detail--dropdown">
                    <div class="edit-goal__detail-title">
                        Status
                    </div>
                    <div class={`edit-goal__status edit-goal__status--${$editGoalManger.status}`}>
                        <div class="edit-goal__status-dot"></div>
                        <span class="edit-goal__status-name"></span>
                    </div>
                    <div class="edit-goal__status-dropdown-container">
                        <button 
                            class={`edit-goal__status-btn dropdown-btn ${isStatusDropdownListOpen ? "dropdown-btn--active" : ""}`}
                            on:click={(e) => onDropdownClicked(e, Dropdown.Status)}
                        >
                            <div class="edit-goal__status-btn-dot-container dropdown-btn__icon">
                                <div class={`edit-goal__status-btn-dot edit-goal__status-btn-dot--${$editGoalManger.status}`}>
                                </div>
                            </div>
                            <span class="edit-goal__status-btn-name dropdown-btn__title">
                                {getGoalStatusString($editGoalManger.status)}
                            </span>
                            <div class="dropdown-btn__icon dropdown-btn__icon--arrow">
                                <SVGIcon icon={Icon.Dropdown}/>
                            </div>
                        </button>
                        {#if isStatusDropdownListOpen}
                            <ul class="edit-goal__status-dropdown dropdown-menu" use:clickOutside on:click_outside={() => isStatusDropdownListOpen = false}>
                                {#each [GoalStatus.OnHold, GoalStatus.InProgress, GoalStatus.Accomplished] as status}
                                    <li class="dropdown-menu__option">
                                        <button on:click={() => statusListDropdownOptClicked(status)}>
                                            <div class="dropdown-menu__option-icon">
                                                <div 
                                                    class={`edit-goal__status-dropdown-tag-dot edit-goal__status-dropdown-tag-dot--${status}`}
                                                >
                                                </div>
                                            </div>
                                            <span class="dropdown-menu__option-text">
                                                {getGoalStatusString(status)}
                                            </span>
                                            {#if $editGoalManger.status === status}
                                                <div class="dropdown-menu__option-icon">
                                                    <i class="fa-solid fa-check"></i>
                                                </div>
                                            {/if}
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                    <div class="edit-goal__detail-divider"></div>
                </div>
                <!-- ★ Creation Date -->
                <div class="edit-goal__creation-date edit-goal__detail">
                    <div class="edit-goal__detail-title">
                        Creation Date
                    </div>
                    <span class="edit-goal__detail-date">{displayDateStr($editGoalManger.creationDate)}</span>
                    <div class="edit-goal__detail-divider"></div>
                </div>
                <!-- ★ Due Date -->
                <div class={`edit-goal__due-date ${!$editGoalManger?.dueDate ? "edit-goal__due-date--no-date" : ""} edit-goal__detail`}>
                    <div class="edit-goal__detail-title">
                        Due Date
                    </div>
                    <div class="edit-goal__date-picker-dropdown-container">
                        <div class="edit-goal__date-picker-dropdown-btn-container">
                            <button 
                                class="edit-goal__detail-date-btn dropdown-btn"
                                on:click={(e) => onDropdownClicked(e, Dropdown.DueDate)}
                            >
                                <span class="dropdown-btn__title">
                                    {displayDateStr($editGoalManger.dueDate, "None")}
                                </span>
                                {#if !$editGoalManger.dueDate}
                                    <div class="dropdown-btn__icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 11 10" fill="none">
                                            <path d="M5.72529 9.89258V0.21875M10.5625 5.05536L0.888672 5.05537" stroke="#5A5A5A" stroke-width="1.2"/>
                                        </svg>
                                    </div>
                                {/if}
                            </button>
                            {#if $editGoalManger.dueDate}
                                <button class="edit-goal__due-date-close-btn" on:click={() => $editGoalManger?.editGoalDate(null)}>
                                    <SVGIcon icon={Icon.Close}/>
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- ★ Floating Elems  -->
        {#if $editGoalManger.datePickerPos}
            <div 
                class="edit-goal__date-picker-container" style={$editGoalManger.datePickerPos}
                use:clickOutside on:click_outside={() => $editGoalManger?.closeDatePicker()}
            >
                <DatePicker 
                    pickedDate={pickedDate()}
                    onApply={onDatePickerSubmitted} 
                    onCancel={() => $editGoalManger?.closeDatePicker()} 
                    options={{ 
                        forwards: $editGoalManger.editingMilestoneIdx < 0,
                        maxDate: $editGoalManger.editingMilestoneIdx < 0 ? null : today,
                        minDate: $editGoalManger.editingMilestoneIdx < 0 ? today : null
                    }}
                />
            </div>
        {/if}
        {#if $editGoalManger.milestoneContextMenuPos}
            <ul 
                class="edit-goal__context-menu dropdown-menu" 
                style={$editGoalManger.milestoneContextMenuPos}
                use:clickOutside on:click_outside={() => $editGoalManger?.closeMilestoneContextMenu()}
            >
                <li class="dropdown-menu__option">
                    <button on:click={(e) => $editGoalManger?.milestoneOptionClicked(e, EditMilestoneOption.EditTitle)}>
                        <span class="dropdown-menu__option-text">
                            Edit Title
                        </span>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button on:click={(e) => $editGoalManger?.milestoneOptionClicked(e, EditMilestoneOption.Delete)}>
                        <span class="dropdown-menu__option-text">
                            Delete Milestone
                        </span>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button on:click={(e) => $editGoalManger?.milestoneOptionClicked(e, EditMilestoneOption.ChangeDate)}>
                        <span class="dropdown-menu__option-text">
                            Change Date
                        </span>
                    </button>
                </li>
            </ul>
        {/if}
        {#if $editGoalManger.imgContextMenuPos}
            <ul 
                class="edit-goal__context-menu dropdown-menu" 
                style={$editGoalManger.imgContextMenuPos}
                use:clickOutside on:click_outside={() => $editGoalManger?.closeImgContextMenu()}
            >
                <li class="dropdown-menu__option">
                    <button on:click={() => $editGoalManger?.goalOptionClicked(EditGoalOption.ChangeImage)}>
                        <span class="dropdown-menu__option-text">
                            Replace Image
                        </span>
                    </button>
                </li>
                {#if $editGoalManger.imgSrc}
                    <li class="dropdown-menu__option">
                        <button on:click={() => $editGoalManger?.goalOptionClicked(EditGoalOption.ToggleHideImg)}>
                            <span class="dropdown-menu__option-text">
                                {#if $editGoalManger.isImgHidden}
                                    Show Image
                                {:else}
                                    Hide Image
                                {/if}
                            </span>
                        </button>
                    </li>
                {/if}
                {#if $editGoalManger.imgSrc}
                    <li class="dropdown-menu__option">
                        <button on:click={() => $editGoalManger?.goalOptionClicked(EditGoalOption.RemoveImage)}>
                            <span class="dropdown-menu__option-text">
                                Remove Image
                            </span>
                        </button>
                    </li>
                {/if}
            </ul>
        {/if}
        {#if $editGoalManger.goalContextMenuPos}
            <ul 
                class="edit-goal__context-menu dropdown-menu" 
                style={$editGoalManger.goalContextMenuPos}
                use:clickOutside on:click_outside={() => $editGoalManger?.closeGoalContextMenu()}
            >
            
                {#if !$editGoalManger.imgSrc}    
                    <li class="dropdown-menu__option">
                        <button on:click={() => $editGoalManger?.goalOptionClicked(EditGoalOption.ChangeImage)}>
                            <span class="dropdown-menu__option-text">Add Image</span>
                        </button>
                    </li>
                {/if}
                <li class="dropdown-menu__option">
                    <button on:click={() => $editGoalManger?.goalOptionClicked(EditGoalOption.DelteGoal)}>
                        <span class="dropdown-menu__option-text">
                            Delete Goal
                        </span>
                    </button>
                </li>
            </ul>
        {/if}
    </div>
</Modal>
{/if}

{#if $homeViewLayout.modalsOpen.includes(ModalType.ImgUpload)}
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
        display: flex;
        max-width: 800px;
        min-width: 550px;
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
            &:hover .edit-goal__milestone-drag-handle {
                opacity: 1;
            }

            &--checked .edit-goal__milestone-title {
                opacity: 0.45;
            }
            &--over .edit-goal__milestone-divider path {
                stroke: black;
                stroke-opacity: 0.16;
            }

            &-header h3 {
                @include text-style(1, 500);
            }
            &-progress {
                @include text-style(0.4, 500);
            }
            &-date {
                @include text-style(0.3, 500);
            }
            &-title {
                @include text-style(0.95, 500);
            }
            &-check-box {
                border: 1.5px solid rgba(var(--textColor1), 0.8);
            }
            &-divider {
                background-color: rgba(var(--textColor1), 0.05);
            }
            &-title {
                
            }
            h4, input {
                @include text-style(0.85, 500);
            }
            input::placeholder {
                @include text-style(0.14, 500, 1.3rem);
            }
            &-edit-btn {
                &:hover {
                    background-color: rgba(var(--textColor1), 0.08);
                    opacity: 0.9 !important;
                }
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
            @include flex-container(center, space-between);
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
            @include pos-abs-top-right-corner(14px, 14px);
            
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
        }
        &__milestones-header {
            @include flex-container(center, space-between);
            margin-bottom: 8px;
            padding: 0px 20px 0px 25px;

            h3 {
                @include text-style(0.9, 500, 1.52rem);
            }
        }
        &__milestone-progress {
            font-family: "DM Mono";
            @include text-style(0.4, 200, 1.2rem);
            @include flex-container(center);
            span {
                font-family: "Manrope";
                margin: 0px 5px;
            }
        }
        &__milestones-list {
            width: 100%;
            max-height: calc(100% - (20.5px + 10px));
            overflow-y: scroll;
            padding: 4px 0px 30px 2px;

            &--short {
                max-height: calc(100% - (20.5px + 22px));
            }
        }
        &__milestone-top-details {
            @include flex-container(center, _);
            margin-bottom: 3px;
        }
        &__milestone {
            padding: 0px 0px 8px 25px;
            position: relative;
            transition: 0.12s ease-in-out;

            &:first-child {
                margin-top: 8px;
            }
            &:hover {
                background-color: rgba(white, 0.007);
            }
            &:hover &-edit-btn {
                visibility: visible;
                opacity: 0.3;
            }
            &:hover &-drag-handle {
                visibility: visible;
                opacity: 0.8;
            }

            &--dragging {
                opacity: 0.15;
                cursor: grabbing;
            }
            &--dragging &-dotted-line {
                opacity: 0;
            }
            &--over {
                background-color: rgba(white, 0.007);
            }
            &--over &-divider {
                background-color: transparent;
                display: block !important;

                svg {
                    display: block;
                }
                path {
                    stroke: #C2C2C2;
                    stroke-opacity: 0.12;
                }
            }
            &--checked {
                padding-bottom: 12px;
            }
            &--checked &-title {
                opacity: 0.5;
            }
            &--checked &-drag-handle {
                display: none;
            }
            &--checked &-dotted-line {
                @include pos-abs-bottom-left-corner(-46px, 4px);
            }
            &--checked &-check-box {
                background-color: rgba(var(--textColor1), 1);

                &:hover {
                    background-color: rgba(var(--textColor1), 0.7);
                }
                i {
                    display: block;
                }
            }

            &-divider {
                width: calc(100% - calc(12px + 16px));
                height: 0.5px;
                background-color: rgba(var(--textColor1), 0.03);
                margin: 0px 0px 8px calc(12px + 16px);
                position: relative;

                &--hidden {
                    background-color: transparent;       
                }

                svg {
                    @include pos-abs-top-left-corner(0px, 0px);
                    display: none;
                }
            }
            &-edit-btn {
                @include pos-abs-top-right-corner(5px, 5px);
                @include circle(25px);
                @include center;
                visibility: hidden;
                opacity: 0;
                
                &:active {
                    transform: scale(0.95);
                }
                &:hover {
                    background-color: rgba(var(--textColor1), 0.04);
                    opacity: 0.6 !important;
                }
            }
            &-check-box-container {
                width: 12px;
                height: 12px;
                margin: 2px 16px 0px 0px;
                @include center;
                position: relative;
            }
            &-check-box {
                border: 1px solid rgba(var(--textColor1), 0.4);
                @include circle(100%);
                @include center;

                &:hover {
                    background-color: rgba(var(--textColor1), 0.12);
                }
                &:active {
                    transform: scale(0.96);
                }

                i {
                    display: none;
                    font-size: 0.83rem;
                    color: var(--modalBgColor);
                }
            }
            &-dotted-line {
                @include pos-abs-bottom-left-corner(-41px, 4px);

                path {
                    stroke: rgba(var(--textColor1), 0.2);
                }
            }
            &-title {
                white-space: pre-wrap;
                word-wrap: break-word;
                transition: 0.12s ease-in-out;
            }
            &-title, &-title-input {
                @include text-style(0.9, 300, 1.3rem);
            }
            &-title-input {
                width: 100%;

                &::placeholder {
                    @include text-style(0.14, 300, 1.3rem);
                }
            }
            &-date {
                margin-left: calc(12px + 16px);
                @include text-style(0.4, 300, 1.1rem);
                font-family: "DM Mono";
            }
            &-drag-handle {
                cursor: grab;
                @include pos-abs-top-left-corner(0px, 0px);
                transform: translateY(50%);
                visibility: hidden;
                opacity: 0;
                
            }
            &-drag-handle-dots {
                opacity: 0.1;
                transform: scale(0.8);
            }
        }
        &__new-milestone-container {
            @include flex-container(center, space-between);
            width: 100%;
            padding-right: 25px;
        }
        &__new-milestone-input-container {
            margin: -15px 0px 30px 25px;
            width: 100%;

            input {
                padding-top: 0px;                
                white-space: pre-wrap;
                word-wrap: break-word;
                width: 100%;
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
            
            &:hover &__icon {
                &:last-child {
                    opacity: 0.9 !important;
                }
            }
            &__icon {
                &:last-child {
                    opacity: 0.2;
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
                @include pos-abs-top-left-corner(-6px, 0px);

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
            @include pos-abs-top-right-corner(24px, -5px);
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