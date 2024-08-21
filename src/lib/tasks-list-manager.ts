import { createEventDispatcher } from "svelte"
import { get, writable, type Writable } from "svelte/store"

import { toast } from "./utils-toast"
import { 
        addItemToArray, extractNum, extractQuadCSSValue, findAncestor, 
        getDistBetweenTwoPoints, getElemById, getElemTrueHeight, 
        getHozDistanceBetweenTwoElems, getVertDistanceBetweenTwoElems, initFloatElemPos, 
        isEditTextElem, isKeyAlphaNumeric, isNearBorderAndShouldScroll, moveElementInArr, 
        randomArrayElem
} from "./utils-general"
import { LogoIcon } from "./enums"

/**
 * Reusable task list manager component.
 * Supports movable tasks, movalbe subtasks
 * Contains reactive store.
 */
export class TasksListManager {
    options: TasksListOptions
    state: Writable<Omit<TasksListManager, "tasks">>

    /* Options */
    settings: {
        numbered: boolean
        reorder: boolean
        subtasks: boolean
        allowDuplicate: boolean
        removeOnComplete: boolean
        progress: "perc" | "count"
    }
    styling?: {
        list?: StylingOptions
        task?: StylingOptions
        subtask?: StylingOptions
        checkbox?: StylingOptions
        description?: StylingOptions
        num?: StylingOptions
        descriptionInput?: { fontSize: CSSREMVal }
    }
    ui: {
        showDragHandle: boolean
        sidePadding: CSSUnitVal
        hasTaskDivider: boolean
        listHeight: string
    }
    cssVariables: {
        checkBoxFill: string
        checkBoxEmpty: string
        checkIcon: string
        taskBgColor: string
        taskHoverBgColor: string
        floatingItemBgColor: string
        maxTitleLines: number
        maxDescrLines: number
    }
    addBtn: {
        iconScale: number
        doShow: boolean
        style?: StylingOptions
        text: string
        pos: "top" | "bottom"
    }

    /* UI Data */
    taskLayout: { 
        topPadding: number, 
        bottomPadding: number, 
        leftSectionWidth: number
    } | null = null

    containerRef : HTMLElement | null = null
    tasksListContainer: HTMLElement | null = null
    tasksList: HTMLElement | null = null
    justExpandedTask = false
    freshExpand = false     // TODO: GET RID OF THIS
    taskExpandTimeout: NodeJS.Timeout | null = null

    /* Tasks */
    tasks: Writable<Task[]>
    pickedTaskIdx = -1
    pickedTaskHT: number = 0
    pickedTaskDescriptionHT = 0
    pickedTaskGroupIdx = 0
    
    taskCheckBoxJustChecked = -1
    subtasksCheckedFromTaskCheck: number[] = []

    isMakingNewTask = false
    isEditingTitle = false
    isEditingDescription = false
    
    isTitleFocused = false
    isDescriptionFocused = false
    focusedTaskIdx = -1

    prevFocusedTodoIdx = -1

    /* Subtasks */
    editingSubtaskIdx = -1
    subtaskCheckBoxJustChecked = -1
    isAddingNewSubtask = false

    focusedSubtaskIdx = -1

    /* Dragging Functionality */
    dragStartPoint: OffsetPoint | null = null
    dragDistance = 0
    draggingSourceIdx = -1
    allowDrag = false
    
    isDraggingTask = false
    isDraggingSubtask = false
    wasDraggingTask = false
    floatingItem: Task | Subtask | null = null
    
    floatingItemElem: HTMLElement | null = null
    dragOverItemElem: HTMLElement | null = null
    
    dragOverItemElemIdx = -1
    dragStartOffset: OffsetPoint | null = null
    
    floatingItemOffset: OffsetPoint | null = null
    floatingElemStyling: {
        height: string,
        padding: string,
        borderWidth: string
    } | null = null
    
    /* Task Context Menu */
    hasJustClosedContextMenu = false
    isContextMenuOpen = false
    contextMenuX = -1000
    contextMenuY = -1000
    contextMenuWidth = 0

    rightClickedTask: null | { task: Task, idx: number }  = null
    rightClickedSubtask: null | { subtask: Subtask, idx: number } = null

    max: number
    subtaskMax: number
    maxToastMsg: string | null
    subtaskMaxToastMsg: string | null

    /* Misc */
    newText = ""
    cursorPos: OffsetPoint = { left: 0, top: 0 }
    scrollWindowCursorPos: OffsetPoint = { left: 0, top: 0 }
    scrollInterval: NodeJS.Timer | null = null

    hasUsedEditShortcut = false
    doMinimizeAfterEdit = false

    textAreaHasSpellCheck = false
    hasInputBlurred = false
    
    /* Constants */
    STRETCH_DRAG_DISTANCE_THRESHOLD = 5
    FLOATING_WIDTH_PERCENT = 0.75
    FLOATING_MAX_SIDE_OFFSET = 10
    FLOATING_CLIENT_Y_TOP_OFFSET = 150
    FLOATING_SUBTASK_HEIGHT = 40

    TASK_DESCR_LINE_HT = 14
    TASK_BOTTOM_PADDING = 20
    TASK_HT_TRANSITION = "height 0.2s cubic-bezier(.1, .84, .42, .95)"

    DESCRIPTION_BOTTOM_PADDING = 6
    DESCRIPTION_TOP_PADDING = 4
    DESCRIPTON_MIN_HEIGHT = 20

    HOOK_HEIGHT_OFFSET = 3
    
    TASK_HEIGHT_MIN_NO_DESCR: number
    TASK_HEIGHT_MIN_HAS_DESCR: number
    
    REMOVE_ON_COMPLETE_DELAY = 400

    MAX_TITLE_LENGTH = 50
    MAX_TASK_GROUP_TITLE_LENGTH = 5
    MAX_DESCRIPTION_LENGTH = 300
    MAX_X_CONTEXT_MENU_POS = 70

    constructor(options: TasksListOptions) {
        this.options = options
        this.tasks = writable(options.tasks)

        this.contextMenuWidth = extractNum(options.contextMenuOptions.width)[0]

        // wrapper around the whole component
        this.containerRef = options.containerRef

        // settings type
        this.settings = {
            numbered: options.settings?.numbered ?? false,
            subtasks: options.settings?.subtasks ?? true,
            reorder: options.settings?.reorder ?? true,
            allowDuplicate: options.settings?.allowDuplicate ?? true,
            removeOnComplete: options.settings?.removeOnComplete ?? false,
            progress: options.settings?.progress ?? "perc"
        }

        // ui options
        this.ui = {
            showDragHandle: options.ui?.showDragHandle ?? true,
            sidePadding:    options.ui?.sidePadding ?? "18px",
            hasTaskDivider: options.ui?.hasTaskDivider ?? true,
            listHeight:     options.ui?.listHeight ?? "auto"
        }

        // add btn
        this.addBtn = {
            doShow: options.addBtn?.doShow ?? true,
            style: options.addBtn?.style,
            text: options.addBtn?.text ?? "Add an Item",
            pos: options.addBtn?.pos ?? "bottom",
            iconScale: options.addBtn?.iconScale ?? 0.96
        }

        // styling 
        this.styling = {
            checkbox: { width: "10px", margin: "0px 0px 0px 0px" },
            num: { width: "10px", margin: "0px 0px 0px 0px" },
            ...options.styling,
        }

        // css variables
        this.cssVariables = {
            checkBoxFill:        options.cssVariables?.checkBoxFill  ?? "rgba(var(--textColor1), 1)",
            checkBoxEmpty:       options.cssVariables?.checkBoxEmpty ?? "rgba(var(--textColor1), 0.2)",
            checkIcon:           options.cssVariables?.checkIcon     ?? "rgba(var(--textColor2), 1)",
            taskBgColor:         options.cssVariables?.taskBgColor   ?? "rgba(var(--textColor1), 1)",
            taskHoverBgColor:    options.cssVariables?.taskHoverBgColor    ?? "rgba(var(--textColor1), 0.01)",
            floatingItemBgColor: options.cssVariables?.floatingItemBgColor ?? "#141414",
            maxTitleLines:       options.cssVariables?.maxTitleLines ?? 1,
            maxDescrLines:       options.cssVariables?.maxDescrLines ?? 1,
        }

        // caps
        this.max = options.max ?? 25
        this.subtaskMax = options.subtaskMax ?? 25
        this.maxToastMsg = options.maxToastMsg ?? `Task number exceeded.`
        this.subtaskMaxToastMsg = options.subtaskMaxToastMsg ?? `Subtasks number exceeded.`
        
        // set collapsed task height
        const { top: padTop, bottom: padBottom } = extractQuadCSSValue(this.styling?.task?.padding)
        const setTaskHeight = (this.styling?.task?.height ?? 0)

        this.TASK_HEIGHT_MIN_NO_DESCR  = setTaskHeight ? (extractNum(setTaskHeight)[0] + padTop + padBottom) : 40
        this.TASK_HEIGHT_MIN_HAS_DESCR = this.TASK_HEIGHT_MIN_NO_DESCR + this.TASK_DESCR_LINE_HT
        
        this.state = writable(this)
    }

    /**
     *  Get important styling info neded for working with UI later.
     */
    initAfterLoaded(taskListContainerRef: HTMLElement, taskListRef: HTMLElement) {
        this.tasksListContainer = taskListContainerRef
        this.tasksList = taskListRef

        const taskPadding   = extractQuadCSSValue(this.styling?.task?.padding)
        const topPadding    = taskPadding.top ?? 5
        const bottomPadding = taskPadding.bottom ?? 5

        // left section width
        const leftSectionObj   = this.settings.numbered ? this.styling?.num : this.styling?.checkbox
        const { left, right }  = extractQuadCSSValue(leftSectionObj!.margin)
        const leftSectionWidth = extractNum(leftSectionObj!.width!)[0] + left + right + 3
        
        this.taskLayout = {
            topPadding: topPadding,
            bottomPadding: bottomPadding,
            leftSectionWidth
        }

        this.update({ taskLayout: this.taskLayout })
    }

    update(newState: Partial<Omit<TasksListManager, "tasks">>) {
        this.state.update((data: Omit<TasksListManager, "tasks"> | null) => this.getNewStateObj(data!, newState))
    }

    /* Tasks Stuff */

    /**
     * Create new task
     * @param atIdx    - Make task at this index
     * @param newTask  - Add task with non-default empty properties. 
     */
    async addNewTask(atIdx: number, newTask?: Task) {
        let tasks = get(this.tasks)
        newTask = newTask || {
            title: "", 
            description: "", 
            isChecked: false, 
            subtasks: [], 
            id: "", 
            idx: tasks.length 
        }

        tasks = addItemToArray(atIdx, tasks, newTask)
        tasks = this.updateTaskIndices(tasks)
        
        this.tasks.set(tasks)
    }

    /**
     * Duplicate a task that is located at a given index.
     * @param dupIdx   - Index of task to be duplicated.
     */
    duplicateTask(dupIdx: number) {
        const dupTask = structuredClone(get(this.tasks)[dupIdx])!

        this.addingNewTask(dupIdx + 1, false, dupTask)
    }

    /**
     * Adding a new task state. Creates a new task. Toggles new task input.
     * 
     * @param atIdx          - Index where task should be added
     * @param doToggleInput  - Display input forrm
     * @param newTask        - Add task with non-default empty properties. 
     */
    addingNewTask(atIdx: number, doToggleInput = true, newTask?: Task) {
        if (get(this.tasks).length === this.max && this.maxToastMsg) {
            toast("warning", { message: this.maxToastMsg })
            return
        }

        this.minimizeExpandedTask()
        this.addNewTask(atIdx, newTask)
        
        if (!doToggleInput) return

        this.isMakingNewTask = true
        requestAnimationFrame(() => this.onTaskTitleClicked(atIdx))
        
        this.update({ isMakingNewTask: this.isMakingNewTask })
    }

    /**
     * Delete task
     * 
     * @param taskIdx    Idx of tadsk being removed
     * @param onComplete  Subtask was removed due to completion
     * 
     */
    async removeTask(taskIdx: number, onComplete = false) {
        let tasks = get(this.tasks!)
        let deletedTask = this.getTask(taskIdx)!
        tasks = tasks.filter((_, idx: number) => idx != taskIdx)
        
        this.tasks.update(() => tasks.map((task, idx) => ({ ...task, idx})))

        if (this.pickedTaskIdx >= 0 && !onComplete) {
            this.minimizeExpandedTask()
            this.updateOpenTaskHeightOnChange()
        }
        this.focusedTaskIdx = Math.max(0, this.focusedTaskIdx - 1)
        this.update({ 
            focusedTaskIdx: this.focusedTaskIdx 
        })

        if (onComplete) return
        if (tasks.length === 0) {
            this.updateTaskFocusIdxFromStroke("", -1)
        }

        this.finalizeRemoveTask(deletedTask)
    }

    async finalizeRemoveTask(task: Task) {
        const undoFunction = () => {
            this.addNewTask(task.idx, { ...task, isChecked: false })
            this.forceListRerender()
        }

        this.clientHandler({
            context: "delete",
            payload: {
                taskId: task.id,
                item: task
            },
            undoFunction
        })
    }

    /**
     * After updating tasks list, ensure that the ordered indices are respected,
     */
    updateTaskIndices(tasks: Task[]) {
        return tasks.map((task, idx) => ({ ...task, idx }))
    }

    moveTask = async (fromIdx: number, toIndex: number) => {
        let tasks = get(this.tasks)

        tasks = moveElementInArr(tasks, fromIdx, toIndex)
        tasks = this.updateTaskIndices(tasks)
        const task = tasks[toIndex]
        
        this.tasks.set(tasks)

        await this.clientHandler({
            context: "reorder",
            payload: { 
                taskId: tasks[fromIdx].id,
                item: task
            }
        })
    }

    /**
     * Called after user has dropped the task to a new location.
     * @param draggedItem   Item dragged
     */
    updateAfterDragMove = (draggedItem: "task" | "subtask") => {
        let fromIdx = this.floatingItem!.idx
        let toIdx = this.dragOverItemElemIdx

        // floating going up will take dest idx place
        // floating going down will take drag over's top nbr
        if (fromIdx < toIdx) {
            toIdx = Math.max(0, toIdx - 1)
        }

        if (draggedItem === "task") {
            this.moveTask(fromIdx, toIdx)
        }
        else {
            this.moveSubtask(fromIdx, toIdx)
        }
    }

    getEditingSubtask() {
        return this.getCurrSubtasks()[this.editingSubtaskIdx]
    }

    getTask(taskIdx: number) {
        if (taskIdx < 0) return null

        return get(this.tasks).find((task) => task.idx === taskIdx)
    }

    getCurrTask() {
        return this.getTask(this.pickedTaskIdx)
    }

    getCurrSubtasks() {
        return this.getSubtasks(this.pickedTaskIdx)!
    }

    getCurrentSubtask(subtaskIdx: number): Subtask | null {
        return this.getSubtask(this.pickedTaskIdx, subtaskIdx)
    }

    getSubtasks(taskIdx: number) {
        return get(this.tasks)![taskIdx].subtasks
    }

    getSubtaskProgress(taskIdx: number) {
        const subtasks = this.getSubtasks(taskIdx)!
        let countDone = subtasks.reduce((prev, subtask) => prev + (subtask.isChecked ? 1 : 0), 0)
        return { countDone, length: subtasks.length }
    }

    /* Subtasks Stuff */

    /**
     * Add a new subtask
     * @param taskIdx   Task idx of task where new subtask will belong.
     */
    async addNewSubtask(taskIdx: number, subtaskIdx: number, newSubtask?: Subtask) {
        let tasks = get(this.tasks)
        const task = tasks[taskIdx]
        const taskSubtasks = task.subtasks!

        const _newSubtask = newSubtask || {
            id: "",
            taskId: "",
            idx: taskSubtasks!.length,
            isChecked: false,
            title: ""
        }

        tasks![taskIdx].subtasks! = addItemToArray(subtaskIdx, taskSubtasks, _newSubtask)
        tasks = this.updateTaskSubTaskIndices(tasks, taskIdx)
        this.tasks.set(tasks)
    }

    duplicateSubtask(taskIdx: number, dupIdx: number) {
        const dupSubtask = structuredClone(this.getSubtask(taskIdx, dupIdx))!

        this.addingNewSubtask({
            taskIdx, 
            subtaskIdx: dupIdx + 1, 
            doToggleInput: false, 
            newSubtask: dupSubtask
        })
    }

    addingNewSubtask(options: {
        taskIdx: number, 
        subtaskIdx?: number, 
        doToggleInput?: boolean, 
        newSubtask?: Subtask
    }) {
        const { 
            taskIdx, 
            subtaskIdx = this.getSubtasks(taskIdx)!.length, 
            doToggleInput = true, 
            newSubtask 
        } = options

        const task         = get(this.tasks)[taskIdx]
        const taskSubtasks = task.subtasks!

        if (taskSubtasks.length === this.subtaskMax && this.subtaskMaxToastMsg) {
            toast("warning", { message: this.subtaskMaxToastMsg })
            return
        }

        // add empty subtask
        this.addNewSubtask(taskIdx, subtaskIdx, newSubtask)
        this.updateOpenTaskHeightOnChange()
        
        this.editingSubtaskIdx = subtaskIdx
        this.isAddingNewSubtask = true

        if (this.pickedTaskIdx != taskIdx) {
            this.expandTask(taskIdx)
        }

        if (!doToggleInput) return

        this.update({
            editingSubtaskIdx: this.editingSubtaskIdx,
            isAddingNewSubtask: this.isAddingNewSubtask
        })

        requestAnimationFrame(() => {
            const newSubtaskInputElem = this.getElemById(`task-subtask-title-input-id--${subtaskIdx}`)
            setTimeout(() => newSubtaskInputElem!.focus(), 250)
        })
    }

    moveSubtask = async (fromIdx: number, toIndex: number) => {
        let tasks = get(this.tasks)
        const task = tasks[this.pickedTaskIdx]
        
        let subtasks = this.getCurrSubtasks()
        subtasks = moveElementInArr(subtasks, fromIdx, toIndex)

        task.subtasks = subtasks
        tasks = this.updateTaskSubTaskIndices(tasks, this.pickedTaskIdx)
        this.tasks.set(tasks)

        await this.clientHandler({
            context: "reorder",
            payload: {
                taskId: task.id,
                subTaskId: subtasks[toIndex].id,
                item: subtasks![toIndex]
            }
        })
    }

    updateTaskSubTaskIndices(tasks: Task[], taskIdx: number) {
        const task = tasks[taskIdx]
        task.subtasks = task.subtasks!.map((subtask, idx) => ({ ...subtask, idx }))

        return tasks
    }

    /**
     * Remove given subtask
     * @param taskIdx     Task where desired subtask to be removed belongs.
     * @param subtaskIdx  Subtask to be removed
     * @param onComplete  Subtask was removed due to completion
     * 
     */
    async removeSubtask(taskIdx: number, subtaskIdx: number, onComplete = false) {
        const tasks = get(this.tasks)
        const subtasks = tasks![taskIdx].subtasks!
        const subtask = subtasks[subtaskIdx]

        let newSubtasks = subtasks.filter((_, idx: number) => idx != subtaskIdx)
        newSubtasks     = newSubtasks.map((subtask, idx: number) => ({ ...subtask, idx }))

        const task = tasks![this.pickedTaskIdx]
        task.subtasks = newSubtasks
        
        this.tasks.set(tasks)
        requestAnimationFrame(() => this.updateOpenTaskHeight())

        if (onComplete) return

        this.finalizeRemoveSubtask(task, subtask)
    }

    async finalizeRemoveSubtask(task: Task, subtask: Subtask) {
        const undoFunction = () => {
            this.addNewSubtask(task.idx, subtask.idx, {
                ...subtask, 
                isChecked: false
            })

            this.updateOpenTaskHeightOnChange()
        }

        this.clientHandler({
            context: "delete",
            payload: {
                taskId: task.id,
                subTaskId: subtask.id,
                item: subtask
            },
            undoFunction
        })
    }


    /**
     * Remove current focused subtask.
     */
    removeFocusedSubtask() {
        this.removeSubtask(this.pickedTaskIdx, this.focusedSubtaskIdx)

        this.focusedSubtaskIdx = Math.max(0, this.focusedSubtaskIdx - 1)
        this.update({ focusedSubtaskIdx: this.focusedSubtaskIdx })

        if (this.getSubtasks(this.pickedTaskIdx)!.length === 0) {
            this.resetCurrentFocusedSubtaskIdx()
        }
    }

    /**     
     * Get subtask
     * @param taskIdx     Task where desired subtask belongs.
     * @param subtaskIdx  Desired subtask
     * 
     * @returns Desired subtask
     */
    getSubtask(taskIdx: number, subtaskIdx: number): Subtask | null {
        if (taskIdx < 0 || subtaskIdx < 0) return null

        return get(this.tasks)[taskIdx].subtasks![subtaskIdx] ?? null
    }

    getCurrSubtasksLength() {
        return this.getSubtasks(this.pickedTaskIdx)!.length ?? 0
    }

    getSubtasksLength(taskIdx: number) {
        return this.getSubtasks(taskIdx)!.length
    }

    /* Task Visiblity  */

    /**
     * Expand a given task.
     * This expaned task will be the picked and focused one.
     * Sets the height of task based on its elements. 
     * This is done for the height animation as auto will not work.
     * 
     * @param taskIdx  Task idx of the task to be expanded.
     */
    expandTask(taskIdx: number) {
        if (taskIdx === this.pickedTaskIdx) return

        this.freshExpand = true
        this.pickedTaskIdx = taskIdx
        this.focusedTaskIdx = taskIdx

        this.update({ 
            pickedTaskIdx: this.pickedTaskIdx,
            focusedTaskIdx: this.focusedTaskIdx,
            justExpandedTask: true
        })
        this.taskExpandTimeout = setTimeout(() => {
            this.update({  justExpandedTask: true })

        }, this.getTaskTransitionLengthMs())

        this.updateOpenTaskHeightOnChange()
        requestAnimationFrame(() => this.focusItemElem(`task-id--${this.focusedTaskIdx}`))
    }

    getTaskTransitionLengthMs() {
        const hasSubtasks    = this.settings.subtasks && this.getCurrSubtasks().length > 0
        const subtasksLength = hasSubtasks ? this.getCurrSubtasks().length : 0

        if (subtasksLength === 0) return 200

        const subtaskAnimDuration = subtasksLength < 8 ? 200 : 95
        const subtaskDelayFactor = subtasksLength < 8 ? 30 : 18

        return subtaskAnimDuration + (subtasksLength - 1) * subtaskDelayFactor
    }

    /**
     * Updates the task height given using its children elements. 
     * Will be set to the height of the expanded task elem.
     * Will be called when any height changes to its children will cause a task height change.
     * 
     * @param context   Context for the source of height change.
     */
    updateOpenTaskHeight(context?: TaskHeightChangeContext) {
        if (this.pickedTaskIdx < 0) return
        const doAnimate = context?.doAnimate ?? true

        /* Main Task Content Height  */
        let height = this.getTaskElemHeight(this.pickedTaskIdx)
        /* Subtask Editor */
        const subtaskTitleElement = this.getElemById(`task-subtask-title-input-id--${this.editingSubtaskIdx}`)
        if (subtaskTitleElement) {
            height += subtaskTitleElement!.clientHeight
        }

        /* Rest of the Subtasks Height */
        let doGetSubtaskHeight = this.settings.subtasks && this.getCurrSubtasks().length > 0

        if (doGetSubtaskHeight) {
            const subtasksListElement = this.getElemById(`task-subtasks-id--${this.pickedTaskIdx}`)!
            const subtaskTitleInputHeight = subtaskTitleElement?.clientHeight ?? 0
            
            const subtasksHeight = subtasksListElement.clientHeight - subtaskTitleInputHeight


            height += subtasksHeight
            height -= this.isDraggingSubtask ? 0 : 10
        }

        this.update({ pickedTaskHT: height + 7 })

        const taskElem = this.getTaskElem(this.pickedTaskIdx)
        taskElem.style.height = height + 7 + "px"
        taskElem.style.transition = doAnimate ? this.TASK_HT_TRANSITION : "0s"
    }

    updateOpenTaskHeightOnChange() {
        requestAnimationFrame(() => this.updateOpenTaskHeight())
    }

    /**
     * Minimize current expanded task. Reset all data set from expanded task.
     */
    minimizeExpandedTask() {
        this.isEditingTitle = false
        this.isEditingDescription = false
        this.pickedTaskIdx = -1
        this.editingSubtaskIdx = -1
        this.freshExpand = false
        this.justExpandedTask = false

        this.pickedTaskDescriptionHT = 0
        this.pickedTaskHT = 0
        this.taskCheckBoxJustChecked = -1
        this.subtaskCheckBoxJustChecked = -1
        this.focusedSubtaskIdx = -1
        this.subtasksCheckedFromTaskCheck = []

        this.toggleInputBlurred(false)


        if (this.taskExpandTimeout) {
            clearTimeout(this.taskExpandTimeout)
            this.taskExpandTimeout = null
        }

        this.update({ 
            isEditingTitle: false,
            isEditingDescription: false,
            pickedTaskIdx: -1,
            editingSubtaskIdx: -1,
            focusedSubtaskIdx: -1,
            justExpandedTask: false,

            pickedTaskDescriptionHT: this.pickedTaskDescriptionHT,
            pickedTaskHT: this.pickedTaskHT,
            taskCheckBoxJustChecked: this.taskCheckBoxJustChecked,
            subtaskCheckBoxJustChecked: this.subtaskCheckBoxJustChecked,
        })

        this.forceListRerender()
    }

    /**
     * Initialize collapsed task height when a task is rendered.
     * This is done because...
     * 
     * 1.  Collapsed height can be dynamic. Vary depending on description line number.
     * 2.  Initial heights cannot be auto since a declared height is needed for a height animation.
     * 
     * TODO: this gets rendered alot of times
     * 
     * @param task   Task being redered
     * @return       Default fall-back value
     */
    initMinTaskHeight(task: Task) {
        const taskElem     = this.getTaskElem(task.idx)
        const doGetDefault = !this.taskLayout || !taskElem

        if (doGetDefault || task.idx === this.pickedTaskIdx) {
            return
        }
        
        let height = this.getTaskElemHeight(task.idx)
        if (height < 0) return

        
        taskElem.style.height = height + "px"
    }

    /* Task UI Handlers */

    /**
     * Task list item component's title element on click handler.
     * Immediately focuses new title input.
     * Will not expand if user has selectde title.
     * 
     * @param taskIdx   Task idx of task component
     */
    onTaskTitleClicked(taskIdx: number) {
        this.expandTask(taskIdx)
        requestAnimationFrame(() => this.toggleFocusTaskTitle())
    }

    /**
     * Task list item component's title element on click handler.
     * Immediately focuses new title input.
     * Will not expand if user has selectde title.
     * 
     * @param taskIdx   Task idx of task component
     */
    onTaskDescriptionClicked(taskIdx: number) {
        this.expandTask(taskIdx)
        requestAnimationFrame(() => this.toggleFocusDescription())
    }

    /**
     * Task list item component's subtask title element on click handler.
     * Immediately focuses new subtask title input.
     * Will not work if user has highlighted subtask title.
     * 
     * @param taskIdx   Subtask idx of task component
     */
    onSubtaskTitleClicked(subtaskIdx: number) {
        if (window.getSelection()?.toString()) return

        this.editingSubtaskIdx = subtaskIdx

        requestAnimationFrame(() => {
            const inputTextElem = this.getElemById(`task-subtask-title-input-id--${subtaskIdx}`) as HTMLInputElement
            inputTextElem!.focus()
        })

        this.updateSubTaskFocusIdxFromStroke("", subtaskIdx)
        this.update({ editingSubtaskIdx: this.editingSubtaskIdx })
    }

    didClickOnSubtaskElem(target: HTMLElement) {
        return findAncestor({ 
            child: target, queryStr: "subtask-id", queryBy: "id", 
            strict: false, max: 5 
        }) != null
    }

    /**
     * Task elemen on click handler. Only used for expansion and minimization of task.
     * Expands clicked task if not expanded and minimizes otherwise.
     * Will not expand if user has selectde title.
     * 
     * @param event      On click event.
     * @param taskIdx    Idx of task selected.
     */
    onTaskClicked(event: Event, taskIdx: number) { 
        const target = event.target as HTMLElement
        const isEditElem = isEditTextElem(target)

        if (this.allowDrag) {
            this.allowDrag = false
            return
        }
        if (this.isEditingTitle && !isEditElem) {
            this.toggleFocusTaskTitle(false)
        }
        if (this.isEditingDescription && !isEditElem) {
            this.toggleFocusDescription(false)
        }
        if (["P", "I", "H3", "SPAN", "BUTTON", "svg", "circle", "path"].includes(target.tagName) || isEditElem) {
            this.toggleInputBlurred(false)
            return
        }
        if (this.didClickOnSubtaskElem(target)) {
            return
        }
        
        // dont minimize when click out of an input
        if (this.hasInputBlurred) {
            this.toggleInputBlurred(false)
        }
        else if (taskIdx >= 0 && taskIdx === this.pickedTaskIdx) {
            this.minimizeExpandedTask()
        }
        else {
            if (this.pickedTaskIdx >= 0) {
                this.minimizeExpandedTask()
            }
            this.expandTask(taskIdx)
        }
    }

    onSubtaskClicked(taskIdx: number, subtaskIdx: number) {
        if (this.allowDrag) {
            this.allowDrag = false
            return
        }
        this.updateSubtaskFocusIdx(subtaskIdx)
    }

    /**
     * Toggle a task's checkbox.
     * @param taskIdx  Idx of the the checkbock's task.
     */
    async toggleTaskComplete(pickedTask: Task) {
        const tasks = get(this.tasks)
        const taskIdx = pickedTask.idx 
        tasks![taskIdx].isChecked = !tasks![taskIdx].isChecked

        const isChecked = tasks![taskIdx].isChecked

        if (this.settings.subtasks && !this.settings.removeOnComplete) {
            this.updateSubtasksOnTaskCompleteToggle(pickedTask, isChecked)
        }

        this.tasks.set(tasks)
        this.updateOpenTaskHeightOnChange()

        this.finalizeTaskToggleComplete(pickedTask, taskIdx, isChecked)
    }

    finalizeTaskToggleComplete(pickedTask: Task, taskIdx: number, isChecked: boolean) {
        const clientHandlerParam: TaskListClientHandlerContext = {
            context: isChecked ? "complete" : "incomplete",
            payload: {
                taskId: pickedTask.id,
                item: pickedTask
            }
        }

        if (!this.settings.removeOnComplete) {
            this.clientHandler(clientHandlerParam)
        }
        else if (isChecked) {
            const undoFunction = () => {
                this.addNewTask(taskIdx, { ...pickedTask, isChecked: false })
                this.forceListRerender()

                clientHandlerParam.payload.item.isChecked = false

                this.clientHandler({  ...clientHandlerParam, context: "incomplete" })
            }
            const deleteTask = () => {
                this.minimizeExpandedTask()
                this.removeTask(taskIdx, true)

                this.clientHandler({ 
                    ...clientHandlerParam, undoFunction 
                })
            }
            setTimeout(deleteTask, this.REMOVE_ON_COMPLETE_DELAY)
        }
    }

    /**
     * 
     * If a task was checked, check all its subtasks
     * If this was done and then user unchecks, uncheck the checked from the prev operaton
     * 
     * @param pickedTask Task whose completion was just toggled.
     * @param isChecked  Was task checked.
     */
    updateSubtasksOnTaskCompleteToggle(pickedTask: Task, isChecked: boolean) {
        const tasks = get(this.tasks)
        const taskIdx = pickedTask.idx 

        // check all subtasks on task check
        if (isChecked) {
            this.taskCheckBoxJustChecked = taskIdx
            let subtasks = this.getSubtasks(pickedTask.idx)!
            
            subtasks.forEach((subtask, idx) => { 
                if (subtask.isChecked) return

                this.subtasksCheckedFromTaskCheck.push(subtask.idx)
                subtasks[idx] = { ...subtask, isChecked: true }
            })
        }
        // uncheck all the just-checked ones after task un-check
        else if (this.subtasksCheckedFromTaskCheck.length > 0) {
            let subtasks = this.getSubtasks(pickedTask.idx)!

            subtasks.forEach((subtask, idx) => { 
                const wasChecked = this.subtasksCheckedFromTaskCheck.some((subtaskIdx) => {
                    return subtaskIdx === subtask.idx
                })
                if (wasChecked) { 
                    subtasks[idx] = { ...subtask, isChecked: false }
                }
            })

            tasks![taskIdx].subtasks = subtasks
            this.subtasksCheckedFromTaskCheck = []
        }
    }

    doAnimatedCheckedSubtaskTitle(subtaskIdx: number) {
        return this.subtaskCheckBoxJustChecked === subtaskIdx ||
               this.subtasksCheckedFromTaskCheck.some((idx) => idx === subtaskIdx)
    }

    /**
     * Toggle a subtask's checkbox.
     * @param subtaskIdx  Idx of the the subtask's checkbock's task.
     */
    async toggleSubtaskComplete(subtaskIdx: number) {
        const task = this.getCurrTask()!
        const subtask     = this.getSubtask(this.pickedTaskIdx, subtaskIdx)!
        subtask.isChecked = !subtask.isChecked

        if (subtask.isChecked) {
            this.subtaskCheckBoxJustChecked = subtaskIdx
        }

        if (!this.settings.removeOnComplete) {
            task.isChecked = this.getCurrSubtasks().every((s) => s.isChecked)
        }

        this.tasks.set(get(this.tasks))
        this.updateOpenTaskHeightOnChange()

        this.finalizeToggleSubtaskComplete(task, subtask, subtask.isChecked)
    }

    finalizeToggleSubtaskComplete(task: Task, subtask: Subtask, isChecked: boolean) {
        const clientHandlerParam: TaskListClientHandlerContext = {
            context: isChecked ? "complete" : "incomplete",
            payload: { 
                item: subtask,
                taskId: task.id,
                subTaskId: subtask.id
            }
        }

        if (!this.settings.removeOnComplete) {
            this.clientHandler(clientHandlerParam)
        }
        else if (isChecked) {
            const undoFunction = () => {
                this.addNewSubtask(task.idx, subtask.idx, {
                    ...subtask,
                    isChecked: false
                })
                this.updateOpenTaskHeightOnChange()

                clientHandlerParam.payload.item.isChecked = false
                this.clientHandler({ 
                    ...clientHandlerParam,
                    context: "incomplete" 
                })
            }
            const deleteSubtask = () => {
                this.removeSubtask(task.idx, subtask.idx, true)

                this.clientHandler({ 
                    ...clientHandlerParam, 
                    undoFunction 
                })
            }

            setTimeout(deleteSubtask, this.REMOVE_ON_COMPLETE_DELAY)
        }
    }

    /**
     * Drag and drop handler for tasks and subtasks
     * Initializes floating task
     * 
     * Updates the currently drag over task.
     * Updates the positioning of floating task element.
     * 
     */
    taskSubtaskDragHandler(pe: PointerEvent) {
        if (!this.isDraggingTask && !this.isDraggingSubtask) return
        pe.preventDefault()

        const isTask = this.isDraggingTask
        const pointerId = pe.pointerId

        const { overItemIdx, overItemElem } = this.findDragOverItem()
        const isDraggingOpenTask = isTask && this.pickedTaskIdx >= 0

        if (!overItemElem) {
            return
        }
        if (isDraggingOpenTask) {
            this.minimizeExpandedTask()
        }

        // init the dragging element, first over elem will always be the dragging source
        const isInitDrag = !this.floatingItem && overItemElem
        
        if (isInitDrag) {
            const sourceItemIdx = overItemIdx
            const sourceItemElem = overItemElem as HTMLElement

            this.initDragOffsets(sourceItemElem)
            this.floatingItemElem = sourceItemElem
            this.floatingItemElem.setPointerCapture(pointerId)
            this.floatingItem = isTask ? this.getTask(sourceItemIdx)! : this.getCurrentSubtask(sourceItemIdx)

            this.update({ floatingItem: this.floatingItem })

            this.updateOpenTaskHeightOnChange()
        }
        else if (overItemIdx != this.floatingItem!.idx) {
            this.initDragOverElem(overItemIdx, overItemElem as HTMLElement)
        }

        this.updateFloatingTaskPos()
    }

    /**
     * Find the element that user is dragging over
     * 
     * @returns The idx positon of item. The HTML element of that item.=
     */
    findDragOverItem() {
        const { top } = this.cursorPos
        const isTask = this.isDraggingTask

        const listElem     = isTask ? this.tasksList! : this.getElemById(`task-subtasks-id--${this.pickedTaskIdx}`)!
        const listChildren = [...listElem.childNodes].filter((elem) => elem.nodeName === 'LI')

        // dragging over task / subtask
        let overItemIdx = -1
        let overItemElem: HTMLElement | null = null

        listChildren.forEach((item) => {
            const _item          = item as HTMLElement
            const isElemSubtask  = _item.getAttribute("data-task-type") === "subtask"
            const isFloating     = _item.classList?.value.includes("--floating")
            const isOtherItem    = (isTask && isElemSubtask) ? true : ((!isTask && !isElemSubtask) ? true : false)

            const topEdgePosition    = this.getTaskItemOffsetFromTop(_item)
            const bottomEdgePosition = topEdgePosition + _item.clientHeight
            const _top               = this.floatingItemElem ? top : this.dragStartPoint!.top
            
            if (!isOtherItem && !isFloating && _top >= topEdgePosition && _top <= bottomEdgePosition && _item.id) {
                overItemIdx = +_item.id.split("id--")[1]
                overItemElem = item as HTMLElement
                return
            }
        })

        return { overItemIdx, overItemElem }
    }

    onTaskListPointerMove = (event: PointerEvent) => {
        if (!this.tasksList) return

        // update cursor positions
        const windowRect = this.tasksListContainer!.getBoundingClientRect()
        const tasksList = this.tasksList!.getBoundingClientRect()
        
        const blocksLeft = event.clientX - tasksList.left
        const blocksTop = event.clientY - tasksList.top

        const windowLeft = event.clientX - windowRect.left
        const windowTop = event.clientY - windowRect.top
        
        this.cursorPos = { left: blocksLeft, top: blocksTop }
        this.scrollWindowCursorPos = { left: windowLeft, top: windowTop }

        // see if drag and drop state should be initialized
        if (this.dragStartPoint && !this.allowDrag) {
            this.dragDistance = getDistBetweenTwoPoints(this.dragStartPoint!, this.cursorPos!)

            if (this.dragDistance > this.STRETCH_DRAG_DISTANCE_THRESHOLD) {
                this.allowDrag = true
            }
        }
        if (this.allowDrag) {
            this.taskSubtaskDragHandler(event)
        }
    }

    /**
     * Set the task element being dragged over.
     * @param dragOverIdx        Idx position of element being dragged over
     * @param dragOverItemElem   HTML element of task
     */
    initDragOverElem(dragOverIdx: number, dragOverItemElem: HTMLElement) {
        if (this.dragOverItemElemIdx === dragOverIdx) return

        this.dragOverItemElemIdx  = dragOverIdx
        this.dragOverItemElem = dragOverItemElem

        this.update({ dragOverItemElemIdx: this.dragOverItemElemIdx })
    }

    getTaskItemOffsetFromTop(item: HTMLElement) {
        const container = this.tasksListContainer!

        return getVertDistanceBetweenTwoElems(container, item, false) + this.tasksListContainer!.scrollTop
    }

    /**
     * Initialize the left offset position based on the initial x position of cursor when user first drags after a touch down.
     * This will be used to ensure that the drag point will be on the position the user has clicked and not always int he top right corner.
     * @param left   Initial left position.
     */
    initDragOffsets(sourceElem: HTMLElement) {
        const container = this.tasksListContainer!
        const { top: cTop, left: cLeft } = this.cursorPos

        const floatItemTopOffset  = this.getTaskItemOffsetFromTop(sourceElem)
        const floatItemLeftOffset = getHozDistanceBetweenTwoElems({
            left: { elem: container, edge: "left" },
            right: { elem: sourceElem, edge: "left" }
        })

        const listWidth         = this.tasksList!.clientWidth
        const floatingItemWidth = listWidth * this.FLOATING_WIDTH_PERCENT

        const offset = { left: 0, top: 0 }

        offset.top  = cTop - floatItemTopOffset 
        offset.left = cLeft - floatItemLeftOffset 

        offset.left -= cLeft >= floatingItemWidth ? cLeft - floatingItemWidth : 0

        this.dragStartOffset = offset
    }

    /**
     * Update the floating position of the flaoting task element.
     * @param left  Left offset from list 
     * @param top   Top offset from list 
     */
    updateFloatingTaskPos() {
        const listWidth         = this.tasksList!.clientWidth
        const floatingItemWidth = listWidth * this.FLOATING_WIDTH_PERCENT
        const floatItemHeight   = this.getElemById(`floating-item-id--${this.floatingItem!.idx}`)?.clientHeight ?? 0

        const { left, top } = initFloatElemPos({
            dims: { 
                height: floatItemHeight, 
                width: floatingItemWidth 
            }, 
            containerDims: { 
                height: this.tasksList!.clientHeight, 
                width: listWidth 
            },
            cursorPos: this.cursorPos,
            clientOffset: this.dragStartOffset!
        })

        this.floatingItemOffset = { top, left }
        this.update({ floatingItemOffset: this.floatingItemOffset  })

        this.scrollWhenNearContainerBounds()
    }

    /**
     * If cursor is near the borders while a block is being lifted do a scroll to the direction of the border the block is going to.
     * If far from the borders, avoid scrolling.
     */
    scrollWhenNearContainerBounds() {
        if (this.scrollInterval) return
        
        this.scrollInterval = setInterval(() => {
            let moveDirection = isNearBorderAndShouldScroll(this.tasksListContainer!, this.scrollWindowCursorPos)
            
            if (moveDirection === "up") {
                this.tasksListContainer!.scrollTop -= 10
            }
            else if (moveDirection === "down") {
                this.tasksListContainer!.scrollTop += 10
            }
            else if (moveDirection === "right") {
                this.tasksListContainer!.scrollLeft += 10
            }
            else if (moveDirection === "left") {
                this.tasksListContainer!.scrollLeft -= 10
            }
            else if (!moveDirection) {
                clearInterval(this.scrollInterval! as any)
                this.scrollInterval = null
            }
        }, 25)
    }

    /**
     * Used solely for initializing drag states when
     * user clicks on a task.
     * 
     * @param event  
     * @param taskIdx   Idx of the task pointerdowned
     */
    onTaskPointerDown = (event: PointerEvent, taskIdx: number) => {
        if (event.button != 0 || !this.settings.reorder) return

        const target = event.target as HTMLElement
        this.dragStartPoint =  this.cursorPos

        const taskElem = this.getTaskElem(taskIdx)
        const fromTop = event.clientY - taskElem.getBoundingClientRect().top
        const classStr = target.classList.value
        const tag = target.tagName
        const containsSubtaskClass = classStr.includes("subtask")
        const dragHandleClass = findAncestor({
            child: target, queryStr: "drag-handle",
            max: 4
        })?.classList.value ?? ""

        this.isDraggingSubtask = (dragHandleClass.includes("subtask__drag-handle") ?? false) ||
                                 (containsSubtaskClass && tag === "LI") ||
                                 (classStr.includes("subtask__title")) ||
                                 (classStr.includes("subtask__right")) ||
                                 (classStr.includes("subtask__content"))

        this.isDraggingTask = (!this.isDraggingSubtask) &&
                              ((tag === "LI" && fromTop < 40) || 
                              (classStr.includes("task__right")) || 
                              (classStr.includes("task__top")) || 
                              (classStr.includes("task__left")) ||
                              (classStr.includes("task__title")) ||
                              (!!dragHandleClass))

        if (!this.isDraggingSubtask && !this.isDraggingTask) {
            return
        }
        this.update({ 
            isDraggingSubtask: this.isDraggingSubtask, 
            isDraggingTask: this.isDraggingTask 
        })

        if (this.floatingItem) {
            event.preventDefault()
        }
    }
    
    /**
     * On task list mouse up. Complete drag action if there was one.
     */
    onTaskListPointerUp = () => {
        // dragging state is toggled on after click
        // so dragging state cannot be toggled off immediately after a mouse up
        // since floating elem will not be initialized until after a mouse move
  
        const draggedItem   = this.allowDrag ? (this.isDraggingTask ? "task" : "subtask") : null

        this.isDraggingTask    = false
        this.isDraggingSubtask = false
        this.dragStartOffset   = null
        this.dragDistance   = 0
        this.dragStartPoint = null

        this.update({ isDraggingSubtask: false, isDraggingTask: false })

        // allow on click to take over
        if (!this.floatingItem) return

        let fromIdx = this.floatingItem!.idx
        let toIdx = this.dragOverItemElemIdx

        if (fromIdx < toIdx) {
            toIdx = Math.max(0, toIdx - 1)
        }

        // reset drag over elem ui
        if (this.dragOverItemElem) {
            this.updateAfterDragMove(draggedItem!)

            this.dragOverItemElemIdx = -1
            this.dragOverItemElem?.classList.remove(`${draggedItem}--drag-over`)
            this.dragOverItemElem = null
        }

        // do not allow a transition animation on new DOM location
        const taskElem = this.getTaskElem(this.floatingItem.idx)
        taskElem.style.transition = "0s"
        
        // the tasks reorder DOM updatre occurs first 
        // then this update will trigger a recalculation of the updated collapsed task heights from the reorder
        requestAnimationFrame(() => {
            // do this to redo the subtask links set up
            this.updateOpenTaskHeight()
            
            this.floatingItemOffset  =  null
            this.floatingItem = null
            this.floatingItemElem = null
            this.update({ floatingItem: null, floatingItemOffset: null  })

            // if dragging subtask, keep open
            if (draggedItem === "task") {
                this.pickedTaskIdx = -1
                this.updateTaskFocusIdx(toIdx)
            }
            if (draggedItem === "subtask") {
                this.updateSubtaskFocusIdx(toIdx)
            }
        })
    }

    /* Inputs / Editing Functionality */

    /**
     * Saves current text in input as the new task title.
     * Closes the current task-editing state.
     */
    async saveNewTitle() {
        const newTitle = this.newText
        const newTask = this.isMakingNewTask

        this.newText = ""
        this.isEditingTitle = false
        this.isMakingNewTask = false

        const tasks = get(this.tasks)
        const editTask = tasks![this.pickedTaskIdx]

        if (!editTask.title && editTask.title === newTitle) return

        editTask.title = newTitle || "Untitled"

        this.update({ 
            isEditingTitle: this.isEditingTitle,
            isMakingNewTask: this.isMakingNewTask,
            newText: this.newText
        })
        this.tasks.set(tasks)
        this.finalizeNewTitle(editTask, newTask)
    }

    async finalizeNewTitle(task: Task, newTask: boolean) {
        const clientHandlerParam: TaskListClientHandlerContext = {
            context: "add",
            payload: {
                taskId: task.id,
                item: task
            }
        }

        if (newTask) {
            const { id: newId } = await this.clientHandler(clientHandlerParam)

            this.tasks.update((tasks) => tasks.map((task) => (
                task.id === task.id ? { ...task, id: newId } : task)
            ))
        }
        else {
            await this.clientHandler({ ...clientHandlerParam, context: "name" })
        }
    }

    saveNewDescription = async () => {
        const newDescription = this.newText
        this.newText = ""
        this.textAreaHasSpellCheck = false

        const tasks = get(this.tasks)
        const task = tasks![this.pickedTaskIdx]

        if (!task.description && newDescription === task.description) return

        task.description = newDescription
        this.update({ 
            newText: this.newText,
            textAreaHasSpellCheck: this.textAreaHasSpellCheck
        })
        this.tasks.set(tasks)
        this.finalizeNewDescription(task, newDescription)
    }

    async finalizeNewDescription(task: Task, description: string) {
        this.clientHandler({
            context: "description",
            payload: { 
                taskId: task.id,
                item: task
            }
        })
    }

    /**
     * Adds a title to the newly created subtak.
     */
    async saveNewSubtask() {
        const newSubtask = this.isAddingNewSubtask
        const tasks = get(this.tasks)
        const task = this.getCurrTask()!
        const subtask = this.getEditingSubtask()
        subtask.title = this.newText || "Untitled"

        this.editingSubtaskIdx = -1
        this.newText = ""
        this.isAddingNewSubtask = false

        this.update({ 
            editingSubtaskIdx: this.editingSubtaskIdx,
            newText: this.newText,
            isAddingNewSubtask: this.isAddingNewSubtask
        })
        this.tasks.set(tasks)
        this.finalizeNewSubtaskTitle(task, subtask, newSubtask)
    }
    async finalizeNewSubtaskTitle(task: Task, subtask: Subtask, newSubtask: boolean) {
        const clientHandlerParam: TaskListClientHandlerContext = {
            context: "add",
            payload: {
                taskId: task.id,
                subTaskId: subtask.id,
                item: subtask
            }
        }

        if (newSubtask) {
            const { id: newId } = await this.clientHandler(clientHandlerParam)

            task.subtasks! = task.subtasks!.map((t) => (
                subtask.id === t.id ? { ...t, id: newId } : t
            ))

            this.tasks.update((tasks) => tasks.map((t) => (
                task.id === t.id ? task : t)
            ))
        }
        else {
            await this.clientHandler({ ...clientHandlerParam, context: "name" })
        }
    }

    /**
     * Input handler for all inputs in tasks view.
     * For editing task titles, subtask titles, descriptions, & task groups.
     * For description, updates the task height in real time.
     * 
     * @param event    Input event.
     */
    inputTextHandler = (_: InputEvent, newVal: string) => {
        this.newText = newVal
        requestAnimationFrame(() => this.updateOpenTaskHeight({ isUserTyping: true }))
    }

    /**
     * Input on focus handler for all inputs in tasks view.
     * Initializes shared input text variable.
     * 
     * @param event    Focus event.
     */
    onInputFocusHandler = (event: FocusEvent) => {
        const tasks = get(this.tasks)
        const target = event.target as HTMLElement
        const targetClass = target.classList.value

        // close task group input when clicking on a new input
        if (targetClass.includes("subtask__title-input")) {
            this.newText = this.getSubtask(this.pickedTaskIdx, this.editingSubtaskIdx)!.title
        }
        else if (targetClass.includes("title-input")) {
            this.newText = tasks![this.pickedTaskIdx].title
        }
        else if (targetClass.includes("description")) {
            this.newText = tasks![this.pickedTaskIdx].description!
        }
    }

    /**
     * Input on blur handler for all inputs in tasks view.
     * By default, focusing out of an input will save input text except for editing / making new group.
     * Focusing out will also not automatically minimize the task.
     * 
     * @param event    Focus event.
     */
    onInputBlurHandler = (event: FocusEvent) => {
        const target = event.target as HTMLInputElement
        const relatedTarget = event.relatedTarget as HTMLElement
        const targetClass = target.classList.value

        if (this.pickedTaskIdx < 0) return

        // Input Shortcut Pressed 
        if (targetClass.includes("subtask__title-input")) {
            this.saveNewSubtask()
        }
        else if (targetClass.includes("title-input")) {
            this.saveNewTitle()
        }
        else if (targetClass.includes("description")) {
            this.saveNewDescription()
        }

        this.toggleInputBlurred(true)

        // if min after edit is set to true and user just edits and saves w/o doing anything else, minimize the target
        if (this.doMinimizeAfterEdit && !relatedTarget) {
            this.minimizeExpandedTask()
            this.setMinAfterEdit(false)
        }
    }

    /**
     * Triggered when an input element has been blurred.
     * Used to distinguish between focusing out of an input elem by click away vs. using an editing shortcut.
     * 
     * @param hasInputBlurred   An input elemet has been blurred.
     */
    toggleInputBlurred(hasInputBlurred: boolean) {
        this.hasInputBlurred = hasInputBlurred
    }

    /* Focus Functionality */

    /**
     * Focus a given task elem id. Attach focus event listeners.
     * Used for tasks and subtasks.
     * @param focusElemId   The id of the task elem to be focused.
     */
    focusItemElem(focusElemId: string) {
        const taskElem = this.getElemById(focusElemId)!
        taskElem.focus()
        
        taskElem.addEventListener('blur', this.focusedTaskOnBlurHandler)
        taskElem.addEventListener('focus', this.refocusItemElem)
    }

    /**
     * Refocus to a task elem that has already been focused and blurred.
     * Used for tasks and subtasks.
     * @param event  Focus Event
     */
    refocusItemElem = (event: FocusEvent) => {
        if (event.relatedTarget) return
    
        this.focusedTaskIdx = this.prevFocusedTodoIdx
        this.update({ focusedTaskIdx: this.prevFocusedTodoIdx })
    }

    /**
     * Blur handler for when a current focused task loses focus.
     * Removes prev focused task if user does moves to a new focus task so blurs away from clicking away.
     * Removes also event listeners if necessary.
     * 
     * @param event  Focus Event
     */
    focusedTaskOnBlurHandler = (event: FocusEvent) => {
        const relatedTarget = event.relatedTarget as HTMLElement
        const taskElement = event.target as HTMLElement
        const isMovingToNewFocusTask = relatedTarget != null

        // do not remove listeners when user clicks away, they will be needed on refocus
        if (isMovingToNewFocusTask) {
            taskElement.removeEventListener('blur', this.focusedTaskOnBlurHandler)
            taskElement.removeEventListener('focus', this.refocusItemElem)
        }

        this.prevFocusedTodoIdx = this.focusedTaskIdx
        this.update({ prevFocusedTodoIdx: this.focusedTaskIdx })
    }

    /**
     * Removes current focused subtask.
     */
    resetCurrentFocusedSubtaskIdx() {
        this.focusedSubtaskIdx = -1
        this.update({ focusedSubtaskIdx: this.focusedSubtaskIdx })
    }

    /**
     * Removes current focused task.
     */
    resetCurrentFocusedTaskdx() {
        this.focusedTaskIdx = -1
        this.update({ focusedTaskIdx: this.focusedTaskIdx })
    }

    toggleFocusTaskTitle(doFocus = true) {
        const inputTitleElem = this.getElemById(`task-title-id--${this.pickedTaskIdx}`) as HTMLElement
        if (doFocus) {
            inputTitleElem.focus()
        }
        else {
            inputTitleElem.blur()
        }
        this.isEditingTitle = doFocus
        this.update({ isEditingTitle: this.isEditingTitle })

        if (get(this.tasks).length === 1) {
            this.tasksListContainer!.scrollTop = 0
        }
    }

    toggleFocusDescription(doFocus = true) {
        const inputTitleElem = this.getElemById(`task-description-input-id--${this.pickedTaskIdx}`) as HTMLElement
        if (doFocus) {
            inputTitleElem.focus()
        }
        else {
            inputTitleElem.blur()
        }

        this.isEditingDescription = doFocus
        this.update({ isEditingDescription: this.isEditingDescription })
    }

    updateSubtaskFocusIdx(newSubtaskIdx: number) {
        this.focusedSubtaskIdx = newSubtaskIdx
        this.update({ focusedSubtaskIdx: newSubtaskIdx })

        if (newSubtaskIdx >= 0) {
            this.focusItemElem(`subtask-id--${newSubtaskIdx}`)
        }
    }

    /**
     * Update the current subtask focus idx after arrow keystoke was pressed.
     * Increments or decrements depending on which key is pressed.
     * Will reset and move to a prev or text task if idx goes out of bounds.
     * 
     * @param key  Top or borrom key
     */
    updateSubTaskFocusIdxFromStroke(key: string, newIdx?: number) {
        const subtasklength = this.getCurrSubtasks()!.length
        let _newIdx = this.focusedSubtaskIdx

        if (newIdx != undefined && newIdx >= 0) {
            _newIdx = newIdx
        }
        else if (key === "ArrowUp") {
            _newIdx--
        } 
        else if (key === "ArrowDown") {
            _newIdx++

            if (_newIdx === subtasklength) {
                this.resetCurrentFocusedSubtaskIdx()
                this.updateTaskFocusIdxFromStroke(key)
                return
            }
        }

        this.updateSubtaskFocusIdx(_newIdx)
    }

    updateTaskFocusIdx(newTaskIdx: number) {
        this.focusedTaskIdx = newTaskIdx

        this.update({ focusedTaskIdx: newTaskIdx })

        if (newTaskIdx >= 0) {
            this.focusItemElem(`task-id--${newTaskIdx}`)
        }
    }

    /**
     * Update the current task focus idx after arrow keystoke was pressed.
     * Increments or decrements depending on which key is pressed.
     * 
     * @param key   Top or bottom key
     */
    updateTaskFocusIdxFromStroke(key: string, idx?: number) {
        const tasksLength = get(this.tasks).length
        if (tasksLength === 0) return

        let _newIdx = this.focusedTaskIdx

        if (idx != undefined) {
            _newIdx = idx
        }
        if (key === "ArrowUp") {
            _newIdx--
            _newIdx = _newIdx < 0 ? tasksLength - 1 : _newIdx
        } 
        else if (key === "ArrowDown") {
            _newIdx++
            _newIdx = _newIdx === tasksLength ? 0 : _newIdx
        }

        this.updateTaskFocusIdx(_newIdx)
    }

    /**
     * User to navigate between elements.
     * This includes title, description, subtasks, and other tasks.
     * @param key   Arrow key pressed.
     */
    handleArrowkeyPressed(key: string) {
        const isDown         = key === "ArrowDown"
        const isExpanded     = this.pickedTaskIdx >= 0
        const freshExpand    = isExpanded && this.freshExpand

        // if no task is expanded, move through the tasks
        if (this.pickedTaskIdx < 0) {
            this.updateTaskFocusIdxFromStroke(key)
            return
        }

        // if title is focused and up, the task is now in focus
        if (this.isTitleFocused && !isDown) {
            this.isTitleFocused = false
            this.isDescriptionFocused = false
            this.updateTaskFocusIdxFromStroke(key)

            return
        }

        const subtaskIdx      = this.focusedSubtaskIdx
        const subtasksLength  = this.getCurrSubtasksLength()
        const noActiveSubElemFocus  = !this.isDescriptionFocused && !this.isTitleFocused && subtaskIdx < 0

        // moving task focus up / down to an expanded task
        const focusTaskDown    = isDown && this.focusedTaskIdx + 1 === this.pickedTaskIdx
        const focusTaskUp      = !isDown && this.focusedTaskIdx - 1 === this.pickedTaskIdx
        const fromTaskToTitle  = noActiveSubElemFocus && (focusTaskDown || focusTaskUp)

        let isForTitle       = (isDown && freshExpand) || (!isDown && this.isDescriptionFocused) || fromTaskToTitle
        let isForDescription = !isForTitle && ((isDown && this.isTitleFocused) || (!isDown && subtaskIdx === 0))

        let isForSubtasks    =  this.settings.subtasks && isExpanded && !isForDescription && this.focusedTaskIdx === this.pickedTaskIdx
                                && subtasksLength > 0 && ((this.isDescriptionFocused && isDown) || subtaskIdx >= 0)

        if (isForSubtasks) {
            this.isDescriptionFocused = false
            this.updateSubTaskFocusIdxFromStroke(key)
        }
        else if (isForTitle) {
            this.isDescriptionFocused = false
            this.isTitleFocused = true

            this.toggleFocusTaskTitle()

            if (fromTaskToTitle && focusTaskUp) {
                this.focusedTaskIdx--
                this.update({ focusedTaskIdx: this.focusedTaskIdx })
            }
        }
        else if (isForDescription) {
            this.isTitleFocused = false
            this.focusedSubtaskIdx = -1
            this.isDescriptionFocused = true
            
            this.toggleFocusDescription()
        }
        else {
            this.isDescriptionFocused = false
            this.updateTaskFocusIdxFromStroke(key)
        }

        this.freshExpand = false
    }

    /* Context Menu */

    /**
     * Fired everytimee user clicks outside context menu.
     * Will fire everytime as context menu is always on the DOM.
     * So do not close if there is no active context menu.
     */
    onContextMenuClickedOutsideHandler() {
        if (this.isContextMenuOpen) {
            this.closeContextMenu()
        }
    }

    /**
     * Called when user clicks an option from Task or Subtask dropdown menu
     * 
     * @param optionIdx   Click Event
     */
    contextMenuOptionClickedHandler (context: DropdownItemClickedContext) {
        const forTask = this.rightClickedTask != null
        const optionTitle = context.name
        const taskIdx     = this.rightClickedTask?.idx ?? this.pickedTaskIdx
        const subtaskIdx  = this.rightClickedSubtask?.idx ?? 0

        /* Task Context Menu */
        if (optionTitle === "Rename" && forTask) { 
            this.onTaskTitleClicked(taskIdx)
        }
        else if (optionTitle === "Rename") {
            this.onSubtaskTitleClicked(subtaskIdx)   
        }
        else if (optionTitle === "Delete Task") {
            this.removeTask(taskIdx)
            this.minimizeExpandedTask()
        }
        else if (optionTitle === "Delete Subtask") {
            this.removeSubtask(this.pickedTaskIdx, subtaskIdx)
        }
        else if (optionTitle === "Add Subtask") {
            this.addingNewSubtask({ taskIdx })
        }
        else if (optionTitle === "Add Task Above") {
            this.addingNewTask(taskIdx)
        }
        else if (optionTitle === "Add Task Below") {
            this.addingNewTask(taskIdx + 1)
        }
        else if (optionTitle === "Duplicate Task") {
            this.duplicateTask(taskIdx)
        }
        else if (optionTitle === "Add Subtask Above") {
            this.addingNewSubtask({ taskIdx, subtaskIdx })
            this.updateSubTaskFocusIdxFromStroke("", subtaskIdx)
        }
        else if (optionTitle === "Add Subtask Below") {
            this.addingNewSubtask({ taskIdx, subtaskIdx: subtaskIdx + 1})
            this.updateSubTaskFocusIdxFromStroke("", subtaskIdx + 1)
        }
        else if ("Duplicate Subtask") {
            this.duplicateSubtask(taskIdx, subtaskIdx)
        }

        this.closeContextMenu()
    }

    /**
     * Close (hide) context menu and reset all data set from invoking the context menu.
     */
    closeContextMenu = () => {
        this.isContextMenuOpen = false
        this.update({ isContextMenuOpen: false })
        
        // allow for dropdown-menu fade out animation to finish
        setTimeout(() => {
            this.contextMenuX = -1000
            this.contextMenuY = -1000
            this.rightClickedSubtask = null
            this.rightClickedTask = null
            this.hasJustClosedContextMenu = true

            this.update({
                rightClickedSubtask: this.rightClickedSubtask,
                rightClickedTask: this.rightClickedTask,
                contextMenuX: this.contextMenuX,
                contextMenuY: this.contextMenuY
            })
        }, 100)
    }

    /**
     * Open a context menu. 
     * Two types, one for a task and subtask. Uses target element class to distinguish.
     * @param event         Pointer event from right click
     * @param taskIdx       Task idx user has right clicked
     * @param subtaskIdx    Subtask idx whose settings btn user has right clicked. Will be < 0 if user clicked on task instead.
     *                      If subtask elem itself was clicked, the idx will be captured from the id of target elem. 
     * @returns
     */
    openContextMenu = (event: Event, taskIdx: number, subtaskIdx = -1) => {
        const pe = event as PointerEvent
        const target = pe.target as HTMLElement
        const targetClass = target.classList.value

        const subtaskElem = findAncestor({ 
            child: target, queryStr: "subtask-id", queryBy: "id", 
            strict: false, max: 5 
        })

        if (["INPUT", "TEXTAREA", "H3"].includes(target.tagName) || targetClass.includes("checkbox") && !subtaskElem) {  
            this.contextMenuX = -1
            this.contextMenuY = -1
            return
        }

        const containerElem = this.tasksListContainer!
        const scrollTop     = this.tasksListContainer!.scrollTop

        const cursorPos = {
            left: this.cursorPos.left,
            top: this.cursorPos.top - scrollTop
        }

        const { left, top } = initFloatElemPos({
            dims: { height: 220, width: this.contextMenuWidth + 10 }, cursorPos,
            containerDims: { height: containerElem.clientHeight, width: containerElem.clientWidth }
        })
        
        // see if task or subtask context menu
        if (subtaskElem || subtaskIdx >= 0) {
            const clickedSubtaskIdx  = subtaskIdx >= 0 ? subtaskIdx : parseInt(subtaskElem!.id.split("--")[2])
            this.rightClickedSubtask = { subtask: this.getSubtask(taskIdx, subtaskIdx)!, idx: clickedSubtaskIdx }
        }
        else {
            this.rightClickedTask = { task: get(this.tasks)![taskIdx], idx: taskIdx }
        }

        this.update({
            contextMenuY: top, 
            contextMenuX: left,
            rightClickedSubtask: this.rightClickedSubtask,
            rightClickedTask: this.rightClickedTask,
            isContextMenuOpen: true
        })
    }

    openSubtaskContextMenu = (taskIdx: number, subtaskIdx: number) => {
        this.rightClickedSubtask = { subtask: this.getSubtask(taskIdx, subtaskIdx)!, idx: subtaskIdx }

        const containerElem = this.tasksListContainer!
        const scrollTop     = this.tasksListContainer!.scrollTop

        const cursorPos = {
            left: this.cursorPos.left,
            top: this.cursorPos.top - scrollTop
        }
        const { left, top } = initFloatElemPos({
            dims: { height: 220, width: this.contextMenuWidth + 10 }, 
            cursorPos,
            containerDims: { height: containerElem.clientHeight, width: containerElem.clientWidth },
        })

        this.contextMenuX = left
        this.contextMenuY = top

        this.update({
            contextMenuY: this.contextMenuY, 
            contextMenuX: this.contextMenuX,
            rightClickedSubtask: this.rightClickedSubtask,
            rightClickedTask: this.rightClickedTask,
            isContextMenuOpen: true
        })
    }

    /**
     * Shortcut handler for tasks view component.
     * @param event   Keyboard event
     */
    keyboardShortcutHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        const isEditing = isEditTextElem(target)
        const { key, metaKey, shiftKey } = event

        // prevent scroll when editing
        if (event.code === "Space" && !isEditing) {
            event.preventDefault()
        }
        if (metaKey && key === "d") {
            event.preventDefault()
        }
        
        // arrow shortcuts
        if (!isEditing && !shiftKey && !metaKey && (key === "ArrowUp" || key === "ArrowDown")) {
            // don't allow arrow keys to move scroll
            event.preventDefault()                  
            this.handleArrowkeyPressed(key)
        }
        else if (!isEditing && key === "Escape") {
            event.preventDefault()
            this.minimizeExpandedTask()
        }

        // finishing edits
        const isEditShortCut = (key === "Enter" || key === "Escape") && isEditing
        if (isEditShortCut) {
            target.blur()
        }

        // focused index hot keys
        const focusedIdx = this.focusedTaskIdx
        if (focusedIdx < 0 || isEditing) return

        const hasSubtasks       = this.settings.subtasks
        const taskElement       = this.getElemById(`task-id--${focusedIdx}`)! as HTMLElement
        const focusedSubtaskIdx = this.focusedSubtaskIdx
        const hasFocusedSubtask = hasSubtasks && focusedSubtaskIdx >= 0
        const pickedTaskIdx     = this.pickedTaskIdx
        const isAlphaNumericKey = isKeyAlphaNumeric(event)

        if (key === "Backspace" && !hasFocusedSubtask) {
            this.removeTask(focusedIdx)
        }
        else if (key === "Backspace" && hasFocusedSubtask) {
            this.removeFocusedSubtask()
        }
        else if (key === "Enter" && !hasFocusedSubtask) {
            this.toggleTaskComplete(this.getTask(focusedIdx)!)
        }
        else if (key === "Enter" && hasFocusedSubtask) {
            this.toggleSubtaskComplete(focusedSubtaskIdx)
        }
        else if (key === "Escape") {
            taskElement.blur()
            this.resetCurrentFocusedSubtaskIdx()
        }
        else if (event.code === "Space") {
            if (pickedTaskIdx >= 0) {
                this.minimizeExpandedTask()
            }
            if (pickedTaskIdx < 0 || pickedTaskIdx >= 0 && pickedTaskIdx != focusedIdx) {
                this.expandTask(focusedIdx)
            }
        }
        else if (shiftKey && key === "+" && hasSubtasks) {
            const subtaskLength = this.getSubtasksLength(this.focusedTaskIdx)

            this.addingNewSubtask({ taskIdx: focusedIdx })
            this.updateSubtaskFocusIdx(subtaskLength - 1)
        }
        else if (metaKey && key === "ArrowUp" && !hasFocusedSubtask) {
            this.addingNewTask(focusedIdx)
        }
        else if (metaKey && key === "ArrowUp" && hasFocusedSubtask) {
            event.preventDefault()

            this.addingNewSubtask({ 
                taskIdx: focusedIdx, subtaskIdx: focusedSubtaskIdx 
            })
            this.updateSubtaskFocusIdx(focusedSubtaskIdx)
        }
        else if (metaKey && key === "ArrowDown" && !hasFocusedSubtask) {
            this.addingNewTask(focusedIdx + 1)
        }
        else if (metaKey && key === "ArrowDown" && hasFocusedSubtask) {
            event.preventDefault()

            this.addingNewSubtask({ 
                taskIdx: focusedIdx, 
                subtaskIdx: focusedSubtaskIdx + 1
            })
            this.updateSubtaskFocusIdx(focusedSubtaskIdx + 1)
        }
        else if (metaKey && key === "d" && !hasFocusedSubtask) {
            this.duplicateTask(focusedIdx)
        }
        else if (metaKey && key === "d" && hasFocusedSubtask) {
            this.duplicateSubtask(focusedIdx, focusedSubtaskIdx)
            this.updateSubtaskFocusIdx(focusedSubtaskIdx + 1)
        }
        else if (hasFocusedSubtask && isAlphaNumericKey) {
            this.onSubtaskTitleClicked(focusedSubtaskIdx)
        }

        // w/o this, heights won't be calculated correctly
        this.forceListRerender()
    }

    /* Helpers */

    /**
     * Force a list re-render after a minimizing an open task.
     */
    forceListRerender() {
        requestAnimationFrame(() => this.update({ isEditingTitle: this.isEditingTitle }))
    }

    setMinAfterEdit(doHide = true) {
        this.doMinimizeAfterEdit = doHide
    }

    async clientHandler(options: TaskListClientHandlerContext): Promise<any> {
        const { context, payload, undoFunction } = options

        if (!this.options.handlers) return
        const tasks = get(this.tasks)

        try {
            if (["description", "name", "complete", "incomplete", "reorder"].includes(context)) {
                await this.options.handlers.onTaskUpdate({
                    action: context as TaskUpdateActions,
                    payload: {
                        tasks,
                        taskId: payload.taskId!,
                        subTaskId: payload.subTaskId,
                        item: payload.item
                    },
                    undoFunction
                })
            }
            else if (context === "add") {
                return await this.options.handlers.onAddTask({
                    payload: {
                        tasks,
                        taskId: payload.taskId,
                        subTaskId: payload.subTaskId,
                        name: payload.item.title!
                    },
                    undoFunction
                })
            }
            else {
                await this.options.handlers.onDeleteTask({
                    payload: {
                        tasks,
                        taskId: payload.taskId!,
                        name: payload.item.title!,
                        subTaskId: payload.subTaskId
                    },
                    undoFunction
                })
            }
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    /**
     * Manually calculate the height of a task.
     * Add the heights of ite children plus the padding.
     * 
     * @param taskIdx   Idx of the task element in question.
     */
    getTaskElemHeight(taskIdx: number) {
        // get the padding
        let height = this.taskLayout!.topPadding

        // title element height
        const titleElement = this.getElemById(`task-title-id--${taskIdx}`)
        if (!titleElement) return -1

        height += getElemTrueHeight(titleElement)

        // description element height
        const descrContainer = this.getElemById(`task-description-id--${taskIdx}`)
        if (!descrContainer) return -1

        if (descrContainer.classList.contains("hidden")) {
            // just get the bottom padding set for the task
            height += this.taskLayout!.bottomPadding
        }
        else {
            // bottom padding is calculated along with the description height
            // description height + padding
            height += getElemTrueHeight(descrContainer) + 4
        }

        return height
    }

    getTaskElem(taskIdx: number) {
        return this.getElemById(`task-id--${taskIdx}`)!
    }

    /**
     * Get an element unique to this instance of current task list.
     * @param queryId  Id of query element
     * @returns        Element queried for
     */
    getElemById(queryId: string) {
        const idPrefix = this.options.id
        return getElemById(`${idPrefix}--${queryId}`)
    }

    onError(error: any) {
        console.error(error)
    }

    /**
     * Get the context menu options for both tasks and subtasks.
     * @returns 
     */
    getContextMenuOptions(): { tasksOptions: DropdownListItem[], subTaskOptions: DropdownListItem[] } {
        const { subtasks, allowDuplicate } = this.settings
        const addSubtaskOptn = subtasks ? [{
            name: "Add Subtask",
            rightIcon: {
                type: "hotkey",
                icon: ["shift", "plus"]
            }
        } as DropdownOption] : []

       return {
            tasksOptions: [
                {
                    options: [
                        { 
                            name: "Rename"
                        },
                        ...addSubtaskOptn
                    ]
                },
                {
                    options: [
                        { 
                            name: "Add Task Above",
                            rightIcon: {
                                type: "hotkey",
                                icon: ["meta", "up"]
                            }
                        },
                        { 
                            name: "Add Task Below",
                            rightIcon: {
                                type: "hotkey",
                                icon: ["meta", "down"]
                            }
                        },
                        ...(allowDuplicate ? [{ 
                            name: "Duplicate Subtask",
                            rightIcon: {
                                type: "hotkey",
                                icon: ["meta", "d"]
                            }
                        }] : [])
                    ]
                },
                { 
                    name: "Delete Task",
                    rightIcon: {
                        type: "hotkey",
                        icon: ["meta", "delete"]
                    }
                }
            ]as  DropdownListItem[],
            subTaskOptions: [
                { 
                    options: [{ name: "Rename" }] 
                },
                {
                    options: [
                        { 
                            name: "Add Subtask Above",
                            rightIcon: {
                                type: "hotkey",
                                icon: ["meta", "up"]
                            }
                        },
                        { 
                            name: "Add Subtask Below",
                            rightIcon: {
                                type: "hotkey",
                                icon: ["meta", "down"]
                            }
                        },
                        ...(allowDuplicate ? [{ 
                            name: "Duplicate Subtask",
                            rightIcon: {
                                type: "hotkey",
                                icon: ["meta", "d"]
                            }
                        }] : [])
                    ]
                },
                { 
                    name: "Delete Subtask",
                    rightIcon: {
                        type: "hotkey",
                        icon: ["meta", "delete"]
                    }
                },
            ] as  DropdownListItem[]
       } 
    }

    /**
     * 
     * Get the updated version of the old state. 
     * This is done to avoid destructuring as methods will not be preserved.
     * Will only update the UI-relevant data that needs to be listned in the UI.
     * 
     * @param newState  New state changes to be incorporated
     * @param oldState  Current state
     * @returns         New state with the latest incorporated changes.
     */
    getNewStateObj(oldState: Omit<TasksListManager, "tasks">, newState: Partial<Omit<TasksListManager, "tasks">>): Omit<TasksListManager, "tasks"> {
        const newStateObj = oldState

        if (newState.pickedTaskIdx != undefined)             newStateObj.pickedTaskIdx = newState.pickedTaskIdx
        if (newState.pickedTaskHT != undefined)              newStateObj.pickedTaskHT = newState.pickedTaskHT
        if (newState.pickedTaskDescriptionHT != undefined)   newStateObj.pickedTaskDescriptionHT = newState.pickedTaskDescriptionHT
        if (newState.isEditingDescription != undefined)      newStateObj.isEditingDescription = newState.isEditingDescription
        if (newState.isEditingTitle != undefined)            newStateObj.isEditingTitle = newState.isEditingTitle
        if (newState.newText != undefined)                    newStateObj.newText = newState.newText
        if (newState.editingSubtaskIdx != undefined)          newStateObj.editingSubtaskIdx = newState.editingSubtaskIdx
        if (newState.taskCheckBoxJustChecked != undefined)    newStateObj.taskCheckBoxJustChecked = newState.taskCheckBoxJustChecked
        if (newState.subtaskCheckBoxJustChecked != undefined) newStateObj.subtaskCheckBoxJustChecked = newState.subtaskCheckBoxJustChecked
        if (newState.textAreaHasSpellCheck != undefined)      newStateObj.textAreaHasSpellCheck = newState.textAreaHasSpellCheck
        if (newState.isAddingNewSubtask != undefined)         newStateObj.isAddingNewSubtask = newState.isAddingNewSubtask
        if (newState.rightClickedTask != undefined)           newStateObj.rightClickedTask = newState.rightClickedTask
        if (newState.isMakingNewTask != undefined)            newStateObj.isMakingNewTask = newState.isMakingNewTask
        if (newState.focusedTaskIdx != undefined)             newStateObj.focusedTaskIdx = newState.focusedTaskIdx
        if (newState.focusedSubtaskIdx != undefined)          newStateObj.focusedSubtaskIdx = newState.focusedSubtaskIdx
        if (newState.justExpandedTask != undefined)           newStateObj.justExpandedTask = newState.justExpandedTask

        if (newState.draggingSourceIdx != undefined)          newStateObj.draggingSourceIdx = newState.draggingSourceIdx
        if (newState.dragOverItemElemIdx != undefined)        newStateObj.dragOverItemElemIdx = newState.dragOverItemElemIdx

        if (newState.floatingItemOffset != undefined)         newStateObj.floatingItemOffset = newState.floatingItemOffset
        if (newState.floatingItem != undefined)               newStateObj.floatingItem = newState.floatingItem
        if (newState.taskLayout != undefined)                 newStateObj.taskLayout = newState.taskLayout
        if (newState.isDraggingTask != undefined)             newStateObj.isDraggingTask = newState.isDraggingTask
        if (newState.isDraggingSubtask != undefined)          newStateObj.isDraggingSubtask = newState.isDraggingSubtask

        if (newState.contextMenuX != undefined)               newStateObj.contextMenuX = newState.contextMenuX
        if (newState.contextMenuY != undefined)               newStateObj.contextMenuY = newState.contextMenuY
        if (newState.rightClickedSubtask != undefined)        newStateObj.rightClickedSubtask = newState.rightClickedSubtask
        if (newState.isContextMenuOpen != undefined)          newStateObj.isContextMenuOpen = newState.isContextMenuOpen

        return newStateObj
    }
}

