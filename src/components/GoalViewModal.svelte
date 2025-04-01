<script lang="ts">
    import { onMount } from "svelte"

	import { Icon } from "$lib/enums"
	import { GOALS } from "$lib/mock-data-goals"
	import { TEST_TASKS } from "$lib/mock-data"
	import { TextEditorManager } from "$lib/inputs"
	import { formatDateLong, isSameDay } from "$lib/utils-date"
	import { absoluteDropdown, imageUpload } from "$lib/pop-ups"
	import { getDueDateDistStr, setViewGoal, updateGoal } from "$lib/utils-goals"
	import { clamp, kebabToNormal, normalToKebab, randomArrayElem } from "$lib/utils-general"

    import Modal from "./Modal.svelte"
	import SvgIcon from "./SVGIcon.svelte"
	import TasksList from "./TasksList.svelte"
	import TagPicker from "./TagPicker.svelte"
	import DatePicker from "./DatePicker.svelte"
	import DropdownBtn from "./DropdownBtn.svelte"
	import SettingsBtn from "./SettingsBtn.svelte"
	import DropdownList from "./DropdownList.svelte"
	import TagPickerBtn from "./TagPickerBtn.svelte"
	import ConfirmationModal from "./ConfirmationModal.svelte"
	import Loader from "./Loader.svelte";
	import { toast } from "$lib/utils-toast";

    export let goal: Goal = GOALS[3]
    export let type: "new" | "edit" = "edit"

    const DESCRIPTION_ID = "goal-description"
    const MAX_MILESTONES = 20
    const SIDE_PADDING = "20px"
    const SMALL_WIDTH = 480

    const DESCRIPTION_PLACEHOLDER = [
        "Outline your vision for this goal.",
        "Clarify your vision for this goal.",
        "Write your vision for this goal here...",
    ]

    let width = 0
    let tasks = TEST_TASKS
    let imgWidth = 200
    
    // let tasks = []
    let numbered = false
    let dateOptnWidth = 55
    let tagOpen = false

    let { name, description, due, tag, img, status, dueType = "day", big = false, completedDate } = goal
    let options = false
    let allowTasks = true
    let newTaskFlag = false
    let editHasBeenMade = false
    let saving = false
    let dateOpen = false
    let statusOpen = false
    let dueDateStr = getDueDateStr()
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
            onInputHandler: () => toggleEditMade()
        }
    })
    function getDueDateStr() {
        return getDueDateDistStr({ due, dueType, type: "date", min: false }).dueStr
    }
    function updateImgPosition(optn: string) {
        img!.type = optn as "header" | "float-left" | "float-right"
        img = img
    }
    function setStatus(_status: string) {
        status = _status as GoalStatus
        statusOpen = false
        toggleEditMade()
    }
    function toggleEditMade() {
        editHasBeenMade = true
    }
    function optionsClicked(optn: string) {
        if (optn === "Remove Image") {
            img = null
        }
        else if (optn === "Delete Goal") {

        }
        else if (optn === "Save and Close") {
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
        options = false
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
        target.style.cursor = "default"
    }

    /* concnlude */
    function onAttemptClose() {
        if (saving) {
            return
        }
        else if (editHasBeenMade || type === "new") {
            confirmContext = "unsaved"
        }
        else {
            confirmUnsavedClose()
        }
    }
    function confirmUnsavedClose() {
        confirmContext = null
        setViewGoal(null)
    }
    async function saveAndClose() {
        try {
            saving = true
            await updateGoal({ goal, update: goal })
        }
        catch {
            setViewGoal(null)
            toast("error", { message: "Error saving your changes." })
        }
        finally {
            saving = false
        }
    }
    onMount(() => {
        if (!name) titleElem.focus()
    })
</script>

<Modal 
    options={{ 
        borderRadius: "7px", 
        scaleUp: true,
        overflowY: "scroll", 
        overflowX: "scroll"
    }} 
    onClickOutSide={() => {
        onAttemptClose()
    }}
>
    <div 
        class="goal"
        class:goal--no-img={!img}
        class:goal--header-img={img?.type === "header"}
        class:goal--float-img={img && img.type.startsWith("float")}
        class:goal--no-tasks={!allowTasks || tasks.length === 0}
        class:goal--min={width < SMALL_WIDTH}
        bind:clientWidth={width}
        style:--side-padding={SIDE_PADDING}
    >   
        <div class="goal__top" style:flex-direction={img?.type === "float-right" ? "row-reverse" : "row"}>
            {#if img}
                <div 
                    class="goal__img goal__img--side-menu"
                    on:pointerdown={dragDown}
                    on:pointermove={onDrag}
                    on:pointerup={onDragEnd}
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
                            spellcheck="false"
                            class="goal__title-input" 
                            bind:value={name} 
                            placeholder="Untitled"
                            maxlength={200}
                            on:blur={() => name ||= "Untitled"}
                            on:input={() => toggleEditMade()}
                        />
                        {#if completedDate}
                            <div class="goal__subtitle">
                                Accomplished on {formatDateLong(completedDate)}
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
                                    name: editHasBeenMade ? "Save and Close" : "",
                                    divider: true,
                                },
                                {
                                    name: "Big Goal",
                                    active: big ?? false,
                                    onToggle: () => big = !big
                                },
                                {
                                    name: "Action Items",
                                    active: allowTasks,
                                    divider: !allowTasks,
                                    onToggle: () => allowTasks = !allowTasks
                                },
                                {
                                    name: allowTasks ? "Numbered" : "",
                                    active: numbered,
                                    divider: allowTasks,
                                    onToggle: () => numbered = !numbered
                                },
                                {
                                    sectionName: "Image",
                                },
                                { 
                                    name: img ? "Position" : "",
                                    pickedItem: kebabToNormal(img?.type || ""),
                                    items: [
                                        { name: "Header" },
                                        { name: "Float Left" },
                                        { name: "Float Right" }
                                    ],
                                    onListItemClicked: ({ name }) => {
                                        updateImgPosition(normalToKebab(name))
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
                                width: "170px",
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
                                Date
                            </div>
                            <div class="goal__info-content">
                                <DropdownBtn 
                                    id={"date-picker"}
                                    isActive={dateOpen}
                                    options={{
                                        noBg: false,
                                        title: dueDateStr,
                                        onClick: () => {
                                            dateOpen = !dateOpen
                                        },
                                        styles: { 
                                            fontSize: "1.285rem", 
                                            padding: "7px 10px 8px 11px" 
                                        }
                                    }} 
                                />
                                <DatePicker 
                                    isOpen={dateOpen}
                                    pickedDate={due}
                                    dateType={dueType}
                                    onClose={() => {
                                        dateOpen = false
                                    }}
                                    onUpdate={(val) => { 
                                        if (val) {
                                            due = val.date
                                            dueType = val.dateType
                                            dueDateStr = getDueDateStr()
                                            toggleEditMade()
                                        }
                                    }}
                                    options={{
                                        position: {
                                            top: "32px", left: "0px"
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
                                    active={tagOpen}
                                    onClick={() => {
                                        tagOpen = !tagOpen
                                        if (tagOpen) {
                                            absoluteDropdown.init({ 
                                                component: TagPicker,
                                                offset: { 
                                                    top: -15, left: -35
                                                },
                                                props: {
                                                    tag,
                                                    isOpen: tagOpen,
                                                    position: {
                                                        top: "32px",
                                                        left: "0px"
                                                    },
                                                    onTagClicked: (newTag) => {
                                                        if (newTag) {
                                                            tag = newTag
                                                            toggleEditMade()
                                                        } 
                                                        else {
                                                            tagOpen = false
                                                        }
                                                    }
                                                }
                                            })
                                        }
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
                                    pickedItem: kebabToNormal(goal.status),
                                    position: { 
                                        top: "32px", left: "0px" 
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
                <div class="flx">
                    <div class="goal__info-title" style:margin="1px 10px 0px 0px">
                        Action Items
                    </div>
                    <button 
                        class="goal__add-btn"
                        on:click={() => newTaskFlag = !newTaskFlag}
                    >
                        <SvgIcon 
                            icon={Icon.Add} 
                            options={{ scale: 1.09, strokeWidth: 1.8, opacity: 0.7 }}
                        />
                    </button>
                </div>
                <div class="flx-algn-center">
                    {#if allowTasks && tasks.length > 0}
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
                        allowInitTasksCall={false}
                        tasks={tasks}
                        onTaskChange={(_tasks) => {
                            toggleEditMade()
                            tasks = _tasks
                        }}
                        options={{
                            id: "goal-tasks",
                            context: "modal",
                            hotkeyFocus: "default",
                            settings: {
                                checkSubtasks: false,
                                allowDuplicate: false,
                                numbered,
                                removeOnComplete: false,
                                max: MAX_MILESTONES,
                                maxDepth: 2
                            },
                            ui: { 
                                sidePadding: "24px",
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
                        Empty
                    </span>
                {/if}
            </div>
        </div>
    </div>
</Modal>

{#if confirmContext} 
    {@const text = confirmContext === "delete" ? "Delete" : "Discard Changes"}
    {@const confirmText = confirmContext === "delete" ? "Yes, Delete" : "Yes, Discard"}

    <ConfirmationModal 
        {text}
        {confirmText}
        onCancel={() => confirmContext = null}
        onOk={confirmUnsavedClose}
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
            max-width: 540px;
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
            max-width: 600px;
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
            min-height: 130px;
            max-height: 350px;
            margin: 14px 0px 15px 0px;
            border-radius: 4px;
            overflow: hidden;
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
            }
        }
        &__subtitle {
            margin-top: 8px;
            @include text-style(0.2, var(--fw-400-500), 1.25rem);
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
            overflow: hidden;
            @include abs-top-left(0px);

            img {
                float: left;
                width: 100%;
                height: 100%;
                object-fit: cover;
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
            margin: 5px 0px 10px 0px;

            &--empty {
                min-height: 100px;
            }
        }
        .fraction {
            @include text-style(0.35, var(--fw-400-500), 1.4rem);

            &__slash { 
                font-size: 1.2rem !important;
                margin: 0px 7px;
            }
        }
        &__list-empty {
            margin: 1px 0px 0px 20px;
            @include text-style(0.15, var(--fw-400-500), 1.5rem);
        }
        &__add-btn {
            @include center;
            @include circle(20px);

            opacity: 0.2;
            
            &:hover {
                opacity: 0.6;
                background-color: rgba(var(--textColor1), 0.1);
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