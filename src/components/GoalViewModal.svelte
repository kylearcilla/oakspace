<script lang="ts">
    import { onMount } from "svelte"
	import { themeState } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { getYearBounds } from "$lib/utils-home"
	import { TextEditorManager } from "$lib/text-editor"
	import { datePicker, imageUpload, tagPicker } from "$lib/pop-ups"
	import { formatDateLong, isSameDay } from "$lib/utils-date"
	import { clamp, isVoid, kebabToNormal, normalToKebab, randomArrayElem } from "$lib/utils-general"
	import { addGoal, closeViewGoal, deleteGoal, getDueDateDistStr, updateGoal } from "$lib/utils-goals"

    import Modal from "./Modal.svelte"
	import Loader from "./Loader.svelte"
	import SvgIcon from "./SVGIcon.svelte"
	import ImgModal from "./ImgModal.svelte"
	import TasksList from "./TasksList.svelte"
	import DropdownBtn from "./DropdownBtn.svelte"
	import SettingsBtn from "./SettingsBtn.svelte"
	import DropdownList from "./DropdownList.svelte"
	import TagPickerBtn from "./TagPickerBtn.svelte"
	import AccomplishedIcon from "./AccomplishedIcon.svelte"
	import ConfirmationModal from "./ConfirmationModal.svelte"

    export let goal: Goal
    export let type: "new" | "edit" = "edit"

    const DESCRIPTION_ID = "goal-description"
    const MAX_MILESTONES = 20
    const SIDE_PADDING = "20px"
    const SMALL_WIDTH = 480

    const DESCRIPTION_PLACEHOLDER = [
        "Outline your vision for this goal...",
        "Clarify your vision for this goal...",
        "Write your vision for this goal...",
    ]

    $: light = !$themeState.isDarkTheme

    let width = 0
    let numbered = false
    let dateOptnWidth = 55
    
    let { name, description, due, tag, img, status, dueType, big = false, completedDate, tasks, pinIdx } = goal

    let newTaskFlag = false
    let allowTasks = true
    let pinned = !isVoid(pinIdx) && pinIdx! >= 0

    let options = false
    let dateOpen = false
    let statusOpen = false
    let tagsOpen = false
    let imgOpen = false
    let dateContext: "due-date" | "completed-date" | null = null
    let dueDateStr = getDueDateStr()
    
    let saving = false
    let editHasBeenMade = false
    let confirmContext: "delete" | "unsaved" | null = null

    let initDragY = -1
    let ogDragVal = 0

    let titleElem: HTMLElement
    let tasksRef: HTMLElement
    let imgRef: HTMLImageElement | null = null

    new TextEditorManager({ 
        id: DESCRIPTION_ID,
        initValue: goal?.description ?? "",
        placeholder: randomArrayElem(DESCRIPTION_PLACEHOLDER),
        maxLength: 1000,
        singleLine: false,
        allowFormatting: true,
        handlers: {
            onInputHandler: () => goal.description !== description && toggleEditMade()
        }
    })
    function setImgPosition(optn: string) {
        if (optn === "Header") {
            img!.type = "header"
        }
        else if (optn === "Left") {
            img!.type = "float-left"
        }
        else {
            img!.type = "float-right"
        }
        img = img

        toggleEditMade()
    }
    function setStatus(_status: string) {
        status = normalToKebab(_status) as GoalStatus
        statusOpen = false

        status !== goal.status && toggleEditMade()

        if (status === "accomplished") {
            completedDate = new Date()
        }
        else {
            completedDate = null
        }
    }
    function updateDueDate(val: { date: Date, dateType?: DateType } | null) {
        if (!val) return

        due = val.date
        dueType = val.dateType!
        dueDateStr = getDueDateStr()

        if (!isSameDay(due, goal.due) || dueType !== goal.dueType) {
            toggleEditMade()
        }
    }
    function updateCompletedDate(val: { date: Date, dateType?: DateType } | null) {
        if (!val) return

        completedDate = val.date
        toggleEditMade()
    }
    async function toggleEditMade() {
        editHasBeenMade = true
    }
    function optionsClicked(optn: string) {
        if (optn === "Remove Image") {
            img = null
        }
        else if (optn === "Delete Goal") {
            confirmContext = "delete"
        }
        else if (optn === "Save & Close") {
            saveAndClose()
        }
        else {
            imageUpload.init({
                onSubmitImg: (src) => {
                    img ||= { src: "", type: "header", center: 50 }
                    img.src = src
                }
            })
        }
        toggleEditMade()
        options = false
    }
    function onTaskChange(_tasks: Task[]) {
        tasks = _tasks as GoalActionItem[]
    }
    function toggleTagPicker() {
        tagsOpen = !tagsOpen
        tagsOpen ? initTagPicker() : tagPicker.close()
    }
    function initTagPicker() {
        tagsOpen = true
        tagPicker.init({
            tag: tag ?? null,
            onClose: () => {
                tagsOpen = false
            },
            onSubmitTag: (_tag) => {
                tag = _tag
                tagsOpen = false
                if (tag?.id != goal.tag?.id) {
                    toggleEditMade()
                }
            }
        })
    }

    /* drag */
    function dragDown(pe: PointerEvent) {
        if (pe.button != 0 || img?.type != "header") {
            return
        }
        const target = pe.target as HTMLElement
        initDragY = pe.clientY

        target.setPointerCapture(pe.pointerId)
        ogDragVal = img?.center ?? 0
    }
    function onDrag(pe: PointerEvent) {
        if (initDragY < 0) {
            return
        }
        const offset = initDragY - pe.clientY
        const target = pe.target as HTMLElement
        const naturalHeight = imgRef!.naturalHeight 
        const percOffset = ((offset / naturalHeight) * 100) * 2.5

        target.style.cursor = "ns-resize"

        img!.center = clamp(0, ogDragVal + percOffset, 100)
        img = img
    }
    function onDragEnd(pe: PointerEvent) {
        ogDragVal = 0
        initDragY = -1

        const target = pe.target as HTMLElement
        target.style.cursor = "pointer"
    }

    /* connclude */
    async function saveData() {
        const update = {
            name, description, tag, status,
            img, dueType, due, big, completedDate, pinned, tasks
        }
        if (type === "edit") {
            await updateGoal({  goal, update })
        }
        else {
            const newGoal = { ...goal, ...update, creationDate: new Date() } 
    
            if (newGoal.status === "accomplished" && !newGoal.completedDate) {
                newGoal.completedDate = new Date()
            }
            await addGoal(newGoal)
        }
    }
    async function close() {
        options = false
        try {
            if (confirmContext === "delete") {
                saving = true
                await deleteGoal(goal)
                initToast("delete")
            }
        }
        catch(e: any) {
            initToast("delete", false)
        }
        finally {
            confirmContext = null
            saving = false
            requestAnimationFrame(() => closeViewGoal())
        }
    }
    function onAttemptClose() {
        if (saving) {
            return
        }
        else if (editHasBeenMade) {
            confirmContext = "unsaved"
        }
        else {
            close()
        }
    }
    async function saveAndClose() {
        if (saving) return
        try {
            saving = true
            await saveData()
        }
        catch(e: any) {
            initToast("error")
        }
        finally {
            close()
            saving = false
        }
    }
    /* utils */
    function getDueDateStr() {
        return getDueDateDistStr({ due, dueType, type: "date", min: false }).dueStr
    }
    function toggleDatePicker(context: "due-date" | "completed-date") {
        dateContext = context
        dateOpen = !dateOpen

        if (dateOpen) {
            initDatePicker(context)
        }
        else {
            datePicker.close()
            dateContext = null
        }
    }
    function initDatePicker(context: "due-date" | "completed-date") {
        const status = context === "completed-date"
        const onUpdate = status ? updateCompletedDate : updateDueDate
        const pickedDate = status ? completedDate! : due

        const { minDate, maxDate } = getYearBounds()

        datePicker.init({
            id: context,
            onClose: () => {
                dateOpen = false
                dateContext = null
            },
            props: {
                pickedDate,
                onUpdate,
                options: {
                    minDate, maxDate, dateType: status ? undefined : dueType
                }
            }
        })
    }
    function initToast(context: "error" | "delete", success = true) {
        const message = context === "error" 
            ? "Error saving changes."
            : success ? `"${goal.name}" deleted.` : "Error deleting goal."

        toast(context === "error" ? "error" : "info", {
            message,
            contextId: "goal-view-modal", 
            groupExclusive: true
        })
    }

    onMount(() => {
        if (!name) titleElem.focus()
    })
</script>


<svelte:window on:keydown={e => {
    if (e.metaKey && e.key === "s") {
        e.preventDefault()

        if (editHasBeenMade && name) {
            saveAndClose()
        }
    }
}} />

<Modal 
    options={{ 
        borderRadius: "7px", 
        scaleUp: true,
        overflowY: "scroll", 
        overflowX: "scroll"
    }} 
    onClickOutSide={() => {
        tagPicker.close()
        if (tagsOpen) {
        }
        if (dateOpen){
            datePicker.close()
        }
        onAttemptClose()
    }}
>
    <div 
        bind:clientWidth={width}
        class="goal"
        class:goal--no-img={!img}
        class:goal--header-img={img?.type === "header"}
        class:goal--float-img={img && img.type.startsWith("float")}
        class:goal--no-tasks={!allowTasks}
        class:goal--light={light}
        class:goal--min={width < SMALL_WIDTH}
        style:--side-padding={SIDE_PADDING}
    >   
        <div class="goal__top" style:flex-direction={img?.type === "float-right" ? "row-reverse" : "row"}>
            {#if img}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div 
                    class="goal__img goal__img--side-menu"
                    on:pointerdown={dragDown}
                    on:pointermove={onDrag}
                    on:pointerup={onDragEnd}
                    on:dblclick={() => imgOpen = !imgOpen}
                >
                <img 
                    bind:this={imgRef}
                    style:object-position={`center ${img.center}%`}
                    src={img.src} 
                    alt={name} 
                />
                </div>
            {/if}
            <div class="goal__header-container">
                <div class="goal__header">
                    <div class=goal__title>
                        <input 
                            bind:this={titleElem}
                            bind:value={name} 
                            spellcheck="false"
                            class="goal__title-input" 
                            placeholder="new goal name..."
                            maxlength={200}
                            on:change={() => name !== goal.name && toggleEditMade()}
                        />
                        {#if completedDate}
                            <div class="goal__subtitle">
                                <AccomplishedIcon /> 
                                <span>Completed on</span>
                                <button 
                                    data-dmenu-id="completed-date"
                                    class="goal__subtitle-btn"
                                    on:click={() => {
                                        toggleDatePicker("completed-date")
                                    }}
                                >
                                    <span>{formatDateLong(completedDate)}</span>
                                </button>
                            </div>
                        {/if}
                    </div>
                    <div class="flx">
                        {#if saving}
                            <div class="goal__spinner" style:position="relative">
                                <Loader visible={true} />
                            </div>
                        {/if}
                        <div 
                            class="goal__settings-btn"
                            class:goal__settings-btn--unsaved={editHasBeenMade && !saving}
                        >
                            <SettingsBtn 
                                id={"goal-options"} onClick={() => options = !options}
                            />
                        </div>
                    </div>
                    <DropdownList 
                        id={"goal-options"}
                        isHidden={!options} 
                        options={{
                            listItems: [
                                {
                                    name: editHasBeenMade ? "Save & Close" : "",
                                    rightIcon: {
                                        type: "hotkey",
                                        icon: ["meta", "s"]
                                    },
                                    divider: true,
                                },
                                {
                                    name: "Big Goal",
                                    active: big ?? false,
                                    onToggle: () => {
                                        big = !big
                                        toggleEditMade()
                                    }
                                },
                                {
                                    name: "Pinned",
                                    active: pinned,
                                    divider: true,
                                    onToggle: () => {
                                        pinned = !pinned
                                        toggleEditMade()
                                    }
                                },
                                {
                                    sectionName: "Action Items",
                                },
                                {
                                    name: "Show",
                                    active: allowTasks,
                                    divider: !allowTasks,
                                    onToggle: () => {
                                        allowTasks = !allowTasks
                                        toggleEditMade()
                                    }
                                },
                                {
                                    name: allowTasks ? "Numbered" : "",
                                    active: numbered,
                                    divider: allowTasks,
                                    onToggle: () => {
                                        numbered = !numbered
                                        toggleEditMade()
                                    }
                                },
                                {
                                    sectionName: "Image",
                                },
                                { 
                                    name: img ? "Position" : "",
                                    pickedItem: img?.type === "header" ? "Header" : img?.type === "float-left" ? "Left" : "Right",
                                    items: [
                                        { name: "Header" },
                                        { name: "Left" },
                                        { name: "Right" }
                                    ],
                                    onListItemClicked: ({ name }) => {
                                        setImgPosition(name)
                                    }
                                },
                                {
                                    name: img ? "Change Image" : "Add Image",
                                    divider: !img,
                                },
                                {
                                    name: img ? "Remove Image" : "",
                                    divider: true
                                },
                                {
                                    name: type === "new" ? "Cancel" : "Delete Goal"
                                }
                            ],
                            styling: {
                                minWidth: "150px",
                            },
                            position: { 
                                top: "30px", right: "0px" 
                            },
                            onListItemClicked: ({ name }) => {
                                optionsClicked(name)
                            },
                            onClickOutside: () => {
                                options = false
                            }
                        }}
                    />
                </div>
                <div class="goal__options">
                    <div class="goal__first-row">
                        <div class="goal__info" style:margin-right="25px">
                            <div class="goal__info-title" style:width={`${dateOptnWidth}px`}>
                                Do By
                            </div>
                            <div class="goal__info-content">
                                <DropdownBtn 
                                    id={"due-date"}
                                    isActive={dateOpen && dateContext === "due-date"}
                                    options={{
                                        noBg: false,
                                        title: dueDateStr,
                                        onClick: () => {
                                            toggleDatePicker("due-date")
                                        },
                                        styles: { 
                                            fontSize: "1.285rem", 
                                            padding: "7px 10px 8px 11px" 
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                        <div class="goal__info" style:margin-left="0px">
                            <div class="goal__info-title" style:width={`${dateOptnWidth}px`}>
                                Tag
                            </div>
                            <div class="goal__info-content">
                                <TagPickerBtn 
                                    {tag}
                                    onClick={() => {
                                        toggleTagPicker()
                                    }}
                                    styling={{ 
                                        borderRadius: "12px" 
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div class="goal__info">
                        <div class="goal__info-title" style:width={`${dateOptnWidth}px`}>
                            Status
                        </div>
                        <div class="goal__info-content">
                            <DropdownBtn 
                                id={"status"}
                                isActive={statusOpen}
                                options={{
                                    noBg: false,
                                    title: kebabToNormal(status),
                                    onClick: () => {
                                        statusOpen = !statusOpen
                                    },
                                    styles: { 
                                        fontSize: "1.285rem", 
                                        padding: "7px 10px 8px 11px" 
                                    }
                                }} 
                            />
                            <DropdownList 
                                id={"status"}
                                isHidden={!statusOpen} 
                                options={{
                                    listItems: [
                                        { name: "Not Started"  },
                                        { name: "In Progress"  },
                                        { name: "Accomplished" }
                                    ],
                                    pickedItem: kebabToNormal(status),
                                    position: { 
                                        top: "34px", left: "0px" 
                                    },
                                    styling: {
                                        width: "130px"
                                    },
                                    onListItemClicked: ({ name }) => {
                                        setStatus(name)
                                    },
                                    onClickOutside: () => {
                                        statusOpen = false
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
        
                <div>
                    <div class="goal__info-title">
                        Description
                    </div>
                    <div 
                        id={DESCRIPTION_ID}
                        class="goal__description text-editor"
                        aria-label="Description"
                        contenteditable
                        spellcheck="false"
                        bind:textContent={description}
                    />
                </div>
            </div>
        </div>
        <div class="goal__list" class:hidden={!allowTasks}>
            <div class="goal__list-header">
                <div class="flx-center">
                    <div class="goal__info-title" style:margin="1px 8px 0px 0px">
                        Action Items
                    </div>
                    <button 
                        class="goal__add-btn"
                        on:click={() => newTaskFlag = !newTaskFlag}
                    >
                        <SvgIcon 
                            icon={Icon.Add} 
                            options={{ scale: 1.15, strokeWidth: 1.2, opacity: 0.8 }}
                        />
                    </button>
                </div>

                <div class="flx-center" style:margin-top="1px">
                    {#if allowTasks}
                        {@const rootTasks = tasks.filter((task) => task.parentId === null)}
                        <div class="fraction">
                            {#if tasks.length > 0 && !numbered}
                                {rootTasks.filter((task) => task.isChecked).length} 
                                <div class="fraction__slash">/</div> 
                            {/if}
                            {rootTasks.length}
                        </div>
                    {/if}
                </div>
            </div>
            <div 
                class="goal__list-body" 
                class:goal__list-body--empty={tasks.length === 0}
                bind:this={tasksRef}
            >
                {#if tasksRef}
                    <TasksList
                        {newTaskFlag}
                        {onTaskChange}
                        {tasks}
                        allowInitTasksCall={false}
                        options={{
                            id: "goal_tasks",
                            context: "modal",
                            hotkeyFocus: "default",
                            handlers: {
                                onTaskUpdate: () => toggleEditMade(), 
                                onAddTask: () => toggleEditMade(), 
                                onDeleteTask: () => toggleEditMade()
                            },
                            settings: {
                                checkSubtasks: false,
                                allowDuplicate: false,
                                numbered,
                                removeOnComplete: false,
                                max: MAX_MILESTONES,
                                maxDepth: 2
                            },
                            ui: { 
                                sidePadding: "20px",
                                fontSize: "1.45rem",
                                padding: "9px 0px 7px 0px",
                                hasTaskDivider: true
                            },
                            rootRef: tasksRef
                        }}
                    />
                {/if}
                {#if tasks.length === 0}
                    <span class="goal__list-empty">
                       No Action Items
                    </span>
                {/if}
            </div>
        </div>
    </div>
</Modal>

{#if confirmContext} 
    {@const text = confirmContext === "delete" ? "Are you sure you want to delete this goal?" : "Discard Unsaved Changes"}
    {@const confirmText = confirmContext === "delete" ? "Yes, I'm sure" : "Yes, Discard"}

    <ConfirmationModal 
        {text}
        {confirmText}
        onCancel={() => confirmContext = null}
        onOk={close}
    /> 
{/if}

{#if imgOpen && img}
    <ImgModal 
        img={{ src: img.src }} 
        onClickOutside={() => imgOpen = false}
    />
{/if}


<style lang="scss">
    .goal {
        min-height: 400px;
        max-height: 85vh;
        position: relative;
        max-width: 600px;
        width: 90vw;
        padding-bottom: 12px;
         
        --description-max-height: 240px;
        --task-max-height: 600px;

        &--light &__info-title {
            @include text-style(1);
        }
        &--light &__list-empty {
            @include text-style(0.15);
        }
        &--light &__description {
            @include text-style(1);
        }

        /* no tasks */
        &--no-tasks {
            --description-max-height: 490px;
        }
        &--no-tasks#{&}--header-img {
            max-width: 630px;
            --description-max-height: 500px;
        }
        /* no img */
        &--no-tasks#{&}--no-img {
            min-height: 500px;
            max-width: 520px;
        }
        &--no-img {
            max-width: 600px;
        }
        /* header img */
        &--header-img#{&}--no-tasks {
            max-width: 580px;
            min-height: 570px;
        }
        &--header-img {
            max-width: 650px;
            --description-max-height: 140px;
        }
        &--header-img &__top {
            padding-top: 155px;
        }
        /* float img */
        &--float-img#{&}--no-tasks {
            min-height: 570px;
            max-width: 640px;
        }
        &--float-img {
            max-width: 700px;
        }
        &--float-img &__header-container {
            width: calc(100% - 220px);
        }
        &--float-img &__info {
            margin-bottom: 5px;
        }
        &--float-img &__img {
            min-width: 200px;
            width: 200px;
            height: auto;
            max-height: 350px;
            margin: 14px 0px 15px 0px;
            border-radius: 4px;
            position: relative;
        }
        &__top {
            @include flex(flex-start, space-between);
            height: auto;
            padding: 5px var(--side-padding) 0px var(--side-padding);
            width: 100%;
        }
        &__options {
            margin-bottom: 20px;
        }
        &__first-row {
            display: flex;
            flex-wrap: wrap;
        }
        &__title {
            @include text-style(1, var(--fw-400-500), 1.7rem);
            width: 100%;
            position: relative;
            margin-right: 20px;
            
            input {
                width: 100%;

                &::placeholder {
                    opacity: 0.265;
                }
            }
        }
        &__subtitle {
            margin-top: 8px;
            @include flex(center);

            span {
                @include text-style(0.4, var(--fw-400-500), 1.25rem);
                margin-left: 6px;
                opacity: 0.6;
            }
            button:hover span {
                opacity: 0.8;
                text-decoration: underline;
            }
        }
        &__save {
            @include text-style(1, var(--fw-400-500), 1.35rem);
            white-space: nowrap;
            margin-right: 12px;
            opacity: 0.1;
            
            &:hover {
                opacity: 0.25;
            }
        }
        &__header-container {
            width: 100%;
        }
        &__header {
            position: relative;
            padding: 10px 0px 12px 0px;
            @include flex(flex-start, space-between);
        }
        &__img {
            margin: 0px 0px 4px 0px;
            width: 100%;
            height: 150px;
            border-radius: 4px;
            overflow: hidden;
            @include abs-top-left(0px);
            
            img {
                cursor: pointer;
                float: left;
                width: 100%;
                height: 100%;
                object-fit: cover;
                min-height: 130px;
            }
        }
        &__info {
            margin: 0px 5px 3px 0px;
            @include flex(center);
            
            &:last-child {
                border-bottom: none;
            }
        }
        &__info-title {
            @include text-style(0.25, var(--fw-400-500), 1.45rem);
            margin-right: 10px;
        }
        &__info-content {
            position: relative;
            margin-top: 4px;
        }
        &__description {
            @include text-style(0.85, var(--fw-400-500), 1.45rem);
            overflow: unset;
            overflow-y: scroll;
            margin: 10px 0px 18px 2px;
            max-height: var(--description-max-height);

            &:empty:before {
                content: attr(data-placeholder);
                opacity: 0.12;
            }
        }
        &__list-header {
            width: 100%;
            padding: 9px 20px 1px 20px;
            @include flex(center, space-between);
        }
        &__list-body {
            position: relative;
            height: calc(100%);
            overflow-y: scroll;
            min-height: 300px;
            max-height: var(--task-max-height);
            margin: 2px 0px 10px 0px;
        }
        .fraction {
            @include text-style(0.35, var(--fw-400-500), 1.4rem);

            &__slash { 
                font-size: 1.15rem !important;
                font-weight: 500;
                margin: 0px 6px;
            }
        }
        &__list-empty {
            margin: 1px 0px 0px 20px;
            @include text-style(0.085, var(--fw-400-500), 1.4rem);
        }
        &__add-btn {
            @include center;
            @include square(22px, 7px);
            opacity: 0.25;
            margin-top: 1px;
            
            &:hover {
                background-color: rgba(var(--textColor1), 0.12);
                opacity: 0.5;
            }
        }
        &__spinner {
            @include circle(18px);
            margin-right: 5px;
        }
        &__settings-btn {
            @include flex(center);
            margin-top: -4px;
            position: relative;

            &--unsaved::before {
                content: "";
                @include circle(4px);
                @include abs-top-left(10px, -10px);
                background-color: rgba(var(--textColor1), 0.1);
            }
        }
    }
</style>