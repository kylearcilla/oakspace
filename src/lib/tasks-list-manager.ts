import { get, writable, type Writable } from "svelte/store"
import { 
        addItemToArray, extractNum, extractQuadCSSValue, findAncestor, getDistBetweenTwoPoints, getElemById, getElemNumStyle, 
        getElemsByClass, getElemTrueHeight, getHozDistanceBetweenTwoElems, getVertDistanceBetweenTwoElems, initFloatElemPos, isEditTextElem, isKeyAlphaNumeric, isNearBorderAndShouldScroll, moveElementInArr 
} from "./utils-general"

type SubtaskLinkProp = {
    idx: number, height: number, width: number, top: number, left: number
}
type TaskHeightChangeContext = {
    isUserTyping?: boolean
    hasWidthChanged?: boolean
    doAnimate?: boolean
}

/**
 * Reusable task list manager component.
 * Supports movable tasks, movalbe subtasks, linked subtask.
 * Contains reactive store.
 */
export class TasksListManager {
    options: TaskListOptionsInterface
    state: Writable<Omit<TasksListManager, "tasks">>

    /* Options */
    types: Record<TaskListType, boolean> = {
        "subtasks-linked": false,
        "tasks-linked": false,
        "numbered": false,
        "subtasks": false
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
        hideTaskBtn: boolean
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
        subTaskLinkSolidColor: string
        maxTitleLines: number
        maxDescrLines: number
    }
    addBtn: {
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
    subTaskLinkHt: number = 0

    frstSubTaskLinkOffset = 0
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
    STRETCH__DRAG_DISTANCE_THRESHOLD = 5
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
    
    MAX_TITLE_LENGTH = 50
    MAX_TAK_GROUP_TITLE_LENGTH = 5
    MAX_DESCRIPTION_LENGTH = 300
    MAX_X_CONTEXT_MENU_POS = 70

    constructor(options: TaskListOptionsInterface) {
        this.options = options
        this.tasks = writable(options.tasks)

        this.contextMenuWidth = extractNum(options.contextMenuOptions.width)[0]

        // wrapper around the whole component
        this.containerRef = options.containerRef

        // type
        if (options.type) {
            const types = options.type.split(" ")
            this.types["subtasks-linked"] = types.includes("subtasks-linked")
            this.types["numbered"] = types.includes("numbered")
            this.types["tasks-linked"] = types.includes("tasks-linked")
            this.types["subtasks"] = types.includes("subtasks")
        }
        if (this.types["subtasks-linked"]) {
            this.types["subtasks"] = true
        }

        // ui options
        this.ui = {
            showDragHandle: options.ui?.showDragHandle ?? true,
            hideTaskBtn:    options.ui?.hideTaskBtn ?? false,
            sidePadding:    options.ui?.sidePadding ?? "18px",
            hasTaskDivider: options.ui?.hasTaskDivider ?? true,
            listHeight:     options.ui?.listHeight ?? "auto"
        }

        // add btn
        this.addBtn  = {
            style: options.addBtn?.style,
            text: options.addBtn?.text ?? "Add an Item",
            pos: options.addBtn?.pos ?? "bottom"
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
            checkBoxEmpty:       options.cssVariables?.checkBoxEmpty ?? "rgba(var(--textColor1), 0.3)",
            checkIcon:           options.cssVariables?.checkIcon     ?? "rgba(var(--textColor2), 1)",
            taskBgColor:         options.cssVariables?.taskBgColor   ?? "rgba(var(--textColor1), 1)",
            taskHoverBgColor:    options.cssVariables?.taskHoverBgColor    ?? "rgba(var(--textColor1), 0.01)",
            floatingItemBgColor: options.cssVariables?.floatingItemBgColor ?? "#141414",
            maxTitleLines:       options.cssVariables?.maxTitleLines ?? 1,
            maxDescrLines:       options.cssVariables?.maxDescrLines ?? 1,
            subTaskLinkSolidColor: "#313131"
        }
        
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
        const leftSectionObj   = this.types["numbered"] ? this.styling?.num : this.styling?.checkbox
        const { left, right }  = extractQuadCSSValue(leftSectionObj!.margin)
        const leftSectionWidth = extractNum(leftSectionObj!.width!)[0] + left + right
        
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
    addNewTask(atIdx: number, newTask?: Task) {
        let tasks = get(this.tasks)
        const _newTask = newTask || {
            title: "", description: "", isChecked: false, subtasks: [], id: "", idx: tasks.length 
        }

        tasks = addItemToArray(atIdx, tasks, _newTask)
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
        this.minimizeExpandedTask()
        this.addNewTask(atIdx, newTask)
        
        if (!doToggleInput) return

        this.isMakingNewTask = true
        requestAnimationFrame(() => this.onTaskTitleClicked(atIdx))
        
        this.update({ isMakingNewTask: this.isMakingNewTask })
    }


    removeTask(taskIdx: number) {
        const tasks = get(this.tasks!).filter((_: Task, idx: number) => idx != taskIdx)

        // picked task idx may fall on a new one after deletion
        if (this.pickedTaskIdx >= 0) {
            this.minimizeExpandedTask()
        }

        requestAnimationFrame(() => this.updateOpenTaskHeight())

        // if removed task is the current focus the prev task will be focused, next if the first is removed
        this.focusedTaskIdx = Math.max(0, this.focusedTaskIdx - 1)

        // this.dispatch("taskRemoved", taskIdx)
        this.update({ focusedTaskIdx: this.focusedTaskIdx })
        this.tasks.set(tasks)

        if (tasks.length === 0) {
            this.updateTaskFocusIdxFromStroke("", -1)
        }
    }

    /**
     * After updating tasks list, ensure that the ordered indices are respected,
     */
    updateTaskIndices(tasks: Task[]) {
        return tasks.map((task, idx) => ({ ...task, idx }))
    }

    moveTask = (fromIdx: number, toIndex: number) => {
        let tasks = get(this.tasks)
        tasks = moveElementInArr(tasks, fromIdx, toIndex)
        tasks = this.updateTaskIndices(tasks)

        this.tasks.set(tasks)

        // this.dispatch("taskReordered")
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
    addNewSubtask(taskIdx: number, subtaskIdx: number, newSubtask?: Subtask) {
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
        tasks = this.updateSubTaskIndices(tasks, taskIdx)
        this.tasks.set(tasks)

        // this.dispatch("subtaskAdded", { taskIdx, subtaskIdx })
        this.tasks.set(tasks)
    }

    duplicateSubtask(taskIdx: number, dupIdx: number) {
        const dupSubtask = structuredClone(this.getSubtask(taskIdx, dupIdx))!

        this.addingNewSubtask(taskIdx, dupIdx + 1, false, dupSubtask)
    }

    addingNewSubtask(taskIdx: number, subtaskIdx = get(this.tasks)[taskIdx].subtasks!.length, doToggleInput = true, newSubtask?: Subtask) {
        // add empty subtask
        this.addNewSubtask(taskIdx, subtaskIdx, newSubtask)
        requestAnimationFrame(() => this.updateOpenTaskHeight())
        
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

    moveSubtask = (fromIdx: number, toIndex: number) => {
        let tasks = get(this.tasks)
        const task = tasks[this.pickedTaskIdx]

        let subtasks = this.getCurrSubtasks()
        subtasks = moveElementInArr(subtasks, fromIdx, toIndex)

        task.subtasks = subtasks
        tasks = this.updateSubTaskIndices(tasks, this.pickedTaskIdx)
        tasks[this.pickedTaskIdx] = task
        this.tasks.set(tasks)
    }

    updateSubTaskIndices(tasks: Task[], taskIdx: number) {
        const task = tasks[taskIdx]
        task.subtasks = task.subtasks!.map((subtask, idx) => ({ ...subtask, idx }))

        return tasks
    }

    /**
     * Remove given subtask
     * @param taskIdx     Task where desired subtask to be removed belongs.
     * @param subtaskIdx  Subtask to be removed
     * 
     */
    removeSubtask(taskIdx: number, subtaskIdx: number) {
        const tasks = get(this.tasks)
        const subtasks = tasks![taskIdx].subtasks!
        let newSubtasks = subtasks.filter((_, idx: number) => idx != subtaskIdx)
        newSubtasks     = newSubtasks.map((subtask, idx: number) => ({ ...subtask, idx }))

        tasks![this.pickedTaskIdx].subtasks = newSubtasks

        // this.dispatch("subtaskRemoved", { taskIdx, subtaskIdx })
        this.tasks.set(tasks)

        requestAnimationFrame(() => this.updateOpenTaskHeight({ isUserTyping: true }))
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
            pickedTaskIdx: this.pickedTaskIdx, focusedTaskIdx: this.focusedTaskIdx,
            justExpandedTask: true
        })
        this.taskExpandTimeout = setTimeout(() => {
            this.update({  justExpandedTask: true })

        }, this.getTaskTransitionLengthMs())

        requestAnimationFrame(() => this.updateOpenTaskHeight())
        requestAnimationFrame(() => this.focusItemElem(`task-id--${this.focusedTaskIdx}`))
    }

    getTaskTransitionLengthMs() {
        const subtasksLength = this.getCurrSubtasks().length ?? 0

        if (subtasksLength === 0) return 200

        const subtaskAnimDuration = subtasksLength < 8 ? 200 : 95
        const subtaskDelayFactor = subtasksLength < 8 ? 30 : 18

        return subtaskAnimDuration + (subtasksLength - 1) * subtaskDelayFactor
    }

    initSubtaskLink(prop: SubtaskLinkProp) {
        const linkElem = this.getElemById(`subtask-link-id--${prop.idx}`)!
        const svgElem = linkElem.firstChild! as SVGElement
        const pathElem = svgElem.firstChild as SVGPathElement

        linkElem.style.height = prop.height + 'px'
        linkElem.style.width  = prop.width + 'px'
        linkElem.style.top    = prop.top + 'px'
        linkElem.style.left   = prop.left + 'px'

        // svg container
        svgElem.setAttribute("width", prop.width + '')
        svgElem.setAttribute("height", (prop.height + 1) + '')

        // path
        pathElem.setAttribute("d", `M${prop.width} ${prop.height}H9.66992C4.69936 ${prop.height} 0.669922 ${prop.height - 4.0294} 0.669922 ${prop.height - 9}V0.0244141`)
    }

    /**
     * Initialize the positioning of subtask link.
     * Since the bounding properties are affected by transitions, then, adjustments need to be made to work around this.
     * Also affected by other state changes like typing on contenteditable, and container width changes.
     * 
     * Can't do after animation ends as there will be a significany delay in the appearance of checkbox and subtask link.
     * 
     * @param context  The context in which the height will change. 
     *                 Occured where predicted bounding changes will occur.
     */
    initSubtasksLinks(context?: TaskHeightChangeContext) {
        const isTyping = context?.isUserTyping ?? false
        const hasWidthChanged = context?.hasWidthChanged ?? false

        const taskCheckBox = this.getElemById(`task-checkbox-id--${this.pickedTaskIdx}`)!
        let currCheckbox = this.getElemById(`subtask-checkbox-id--${0}`)!

        const taskCheckboxHeight = taskCheckBox.clientHeight
        const checkboxTopMargin = getElemNumStyle(currCheckbox, "margin-top")
        const subtaskCheckboxHeight = currCheckbox.clientHeight + checkboxTopMargin
        const adjustForFirstLink = !hasWidthChanged && !isTyping

        const BORDER_OFFSET = 2

        // offset due to y transform from fade-in animation changing the vertical offset
        let vertDistanceOffset = -2

        if (adjustForFirstLink && this.editingSubtaskIdx < 0) {         // expanded, no editing
            vertDistanceOffset += 5
        }
        else if (adjustForFirstLink && this.editingSubtaskIdx === 0) {  // expanded, first subtask just added
            vertDistanceOffset += 5
        }

        const hozDistance  = this.getHozDistanceBetweenCheckboxElems(taskCheckBox, currCheckbox) + BORDER_OFFSET
        let   vertDistance = this.getVertDistanceBetweenCheckboxElems(taskCheckBox, currCheckbox) + checkboxTopMargin + vertDistanceOffset

        const subtaskLinkWidth  = hozDistance + (taskCheckboxHeight / 2)
        let   subtaskLinkHeight = vertDistance + (subtaskCheckboxHeight / 2)
        let   vertOffset = -1 * (subtaskLinkHeight - (subtaskCheckboxHeight / 2))

        // for first link
        this.initSubtaskLink({
            idx: 0,
            height: subtaskLinkHeight,
            width: subtaskLinkWidth,
            top: vertOffset + 2,
            left: -1 * subtaskLinkWidth
        })

        // for second link
        for (let subtask of this.getCurrSubtasks()) {
            if (subtask.idx === 0) continue

            const isEditingSubtask =  this.editingSubtaskIdx === subtask.idx
            const curveHeightOffset = 10
            const prevLink  =  this.getElemById(`subtask-link-id--${subtask.idx - 1}`)!
            currCheckbox    =  this.getElemById(`subtask-checkbox-id--${subtask.idx}`)!

            vertDistanceOffset = 0

            // new subtask just added
            if (isEditingSubtask && !isTyping) {
                vertDistanceOffset = 5
            }

            vertDistance  = this.getVertDistanceBetweenCheckboxElems(prevLink, currCheckbox) + checkboxTopMargin + vertDistanceOffset
            subtaskLinkHeight = vertDistance + curveHeightOffset

            vertOffset = -1 * (subtaskLinkHeight - (subtaskCheckboxHeight / 2))

            this.initSubtaskLink({
                idx: subtask.idx ,
                height: subtaskLinkHeight,
                width:  subtaskLinkWidth,
                top: vertOffset + 2,
                left: -1 * subtaskLinkWidth
            })
        }
    }

    /**
     * Updates the task height given using its children elements. 
     * Will be set to the height of the selected task elem.
     * Will change when a changes in its children will cause a task height change.
     * 
     * @param context   For adjusting how subtask link heights and positionings are calculated.
     *                       True if there was a subtask transition animation to be accounted for.
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
        let doGetSubtaskHeight = this.types["subtasks"] && this.getCurrSubtasks().length > 0

        if (doGetSubtaskHeight) {
            const subtasksListElement = this.getElemById(`task-subtasks-id--${this.pickedTaskIdx}`)!
            const subtaskTitleInputHeight = subtaskTitleElement?.clientHeight ?? 0
            
            const subtasksHeight = subtasksListElement.clientHeight - subtaskTitleInputHeight


            height += subtasksHeight
            height -= this.taskLayout!.bottomPadding + (this.isDraggingSubtask ? 0 : 10)
        }

        this.update({
            pickedTaskHT: height + 7,
            subTaskLinkHt: this.subTaskLinkHt,
            frstSubTaskLinkOffset: this.frstSubTaskLinkOffset
        })

        const taskElem = this.getTaskElem(this.pickedTaskIdx)
        taskElem.style.height = height + 7 + "px"
        taskElem.style.transition = doAnimate ? this.TASK_HT_TRANSITION : "0s"

        /* Connectors */
        if (doGetSubtaskHeight && this.types["subtasks-linked"] && !this.types["numbered"]) {
            requestAnimationFrame(() => this.initSubtasksLinks(context))
        }
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
     * This is done because.
     * 
     * 1.  Collapsed height can be dynamic. Vary depending on description line number. Set padding.
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
        requestAnimationFrame(() => this.focusTaskTitle())
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
        requestAnimationFrame(() => this.focusDescription())
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
            child: target, queryStr: "subtask-id", queryBy: "id", strict: false, max: 5 
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
        if (this.allowDrag) {
            this.allowDrag = false
            return
        }
        const target = event.target as HTMLElement
        
        if (["P", "I", "H3", "SPAN", "BUTTON", "svg", "circle", "path"].includes(target.tagName) || isEditTextElem(target)) {
            this.toggleInputBlurred(false)
            return
        }
        if (this.didClickOnSubtaskElem(target)) {
            return
        }
        
        // dont minimize when clickout of an input
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
    handleTaskCheckboxClicked(pickedTask: Task) {
        const tasks = get(this.tasks)
        let taskIdx = pickedTask.idx
        tasks![taskIdx].isChecked = !tasks![taskIdx].isChecked

        if (tasks![taskIdx].isChecked) {
            this.taskCheckBoxJustChecked = taskIdx
            let subtasks = this.getSubtasks(pickedTask.idx)!
            
            subtasks.forEach((subtask, idx) => { 
                if (subtask.isChecked) return

                this.subtasksCheckedFromTaskCheck.push(subtask.idx)
                subtasks[idx] = { ...subtask, isChecked: true }
            })
        }
        else if (this.subtasksCheckedFromTaskCheck.length > 0) {
            let subtasks = this.getSubtasks(pickedTask.idx)!

            subtasks.forEach((subtask, idx) => { 
                const wasChecked = this.subtasksCheckedFromTaskCheck.some((subtaskIdx) => subtaskIdx === subtask.idx)
                if (!wasChecked) return

                subtasks[idx] = { ...subtask, isChecked: false }
            })

            tasks![taskIdx].subtasks = subtasks
            this.subtasksCheckedFromTaskCheck = []
        }

        this.tasks.set(tasks)
    }

    doAnimatedCheckedSubtaskTitle(subtaskIdx: number) {
        return this.subtaskCheckBoxJustChecked === subtaskIdx ||
               this.subtasksCheckedFromTaskCheck.some((idx) => idx === subtaskIdx)
    }

    /**
     * Toggle a subtask's checkbox.
     * @param taskIdx  Idx of the the subtask's checkbock's task.
     */
    handleSubtaskCheckboxClicked(subtaskIdx: number) {
        const subtask = this.getSubtask(this.pickedTaskIdx, subtaskIdx)!
        subtask.isChecked = !subtask.isChecked

        if (subtask.isChecked) {
            this.subtaskCheckBoxJustChecked = subtaskIdx
        }

        // this.update({ tasks: this.tasks! })
        this.tasks.set(get(this.tasks))
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

        const { left, top } = this.cursorPos
        const isTask = this.isDraggingTask
        const pointerId = pe.pointerId

        const listElem       = isTask ? this.tasksList! : this.getElemById(`task-subtasks-id--${this.pickedTaskIdx}`)!
        const listChildren   = [...listElem.childNodes].filter((elem) => elem.nodeName === 'LI')

        // dragging over task / subtask
        let overItemIdx = -1
        let overItemElem: HTMLElement | null = null

        listChildren.forEach((item) => {
            const _item              = item as HTMLElement
            const isElemSubtask      = _item.classList[0].includes("subtask")
            const isFloating         = _item.classList?.value.includes("--floating")
            const isOtherItem        = isTask && isElemSubtask ? true : !isTask && !isElemSubtask ? true : false

            const topEdgePosition    = this.getTaskItemOffsetFromTop(_item)
            const bottomEdgePosition = topEdgePosition + _item.clientHeight
            const _top               = this.floatingItemElem ? top : this.dragStartPoint!.top
            
            if (!isOtherItem && !isFloating && _top >= topEdgePosition && _top <= bottomEdgePosition && _item.id) {
                overItemIdx = +_item.id.split("id--")[1]
                overItemElem = item as HTMLElement
                return
            }
        })

        
        // init the dragging element, first over elem will always be the dragging source
        if (!this.floatingItem && overItemElem) {
            const sourceItemIdx = overItemIdx
            const sourceItemElem = overItemElem as HTMLElement

            this.initDragOffsets(sourceItemElem)
            this.floatingItemElem = sourceItemElem
            this.floatingItemElem.setPointerCapture(pointerId)
            this.floatingItem = isTask ? this.getTask(sourceItemIdx)! : this.getCurrentSubtask(sourceItemIdx)

            this.update({ floatingItem: this.floatingItem })

            requestAnimationFrame(() => this.updateOpenTaskHeight())
        }

        if (!this.floatingItem) return

        if (overItemElem && overItemIdx != this.floatingItem!.idx) {
            this.initDragOverElem(overItemIdx, overItemElem as HTMLElement)
        }

        this.updateFloatingTaskPos(pe)
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

            if (this.dragDistance > this.STRETCH__DRAG_DISTANCE_THRESHOLD) {
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
        const floatItemLeftOffset = getHozDistanceBetweenTwoElems(container, sourceElem, false)

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
    updateFloatingTaskPos(pe: PointerEvent) {
        const listWidth         = this.tasksList!.clientWidth
        const floatingItemWidth = listWidth * this.FLOATING_WIDTH_PERCENT
        const floatItemHeight   = this.getElemById(`floating-item-id--${this.floatingItem!.idx}`)?.clientHeight ?? 0

        const { left, top } = initFloatElemPos(
            { width: floatingItemWidth, height: floatItemHeight },
            this.cursorPos!,
            { width: listWidth, height: this.tasksList!.clientHeight },
            this.dragStartOffset!
        )
        
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
                clearInterval(this.scrollInterval!)
                this.scrollInterval = null
            }
        }, 25)
    }

    /**
     * On task element mouse down. 
     * If a valid touch locaiton for drag then allow drag and prevent pointer event from taking over and expanding task.
     * @param event 
     * @returns 
     */
    onTaskPointerDown = (event: PointerEvent) => {
        if (event.button != 0) return

        const target = event.target as HTMLElement
        this.dragStartPoint =  this.cursorPos

        const dragHandleClass = findAncestor({
            child: target, queryStr: "drag-handle",
            max: 4
        })?.classList.value ?? ""

        const containsSubtaskClass = target.classList[0].includes("subtask")

        this.isDraggingSubtask =  (dragHandleClass.includes("subtask__drag-handle") ?? false) ||
                                  (containsSubtaskClass && target.tagName === "LI") ||
                                  (target.classList.value.includes("subtask__content"))

        this.isDraggingTask =   !this.isDraggingSubtask &&
                                (target.tagName === "LI" || 
                                 target.classList.value.includes("task__right") || 
                                 target.classList.value.includes("task__left") ||
                                 target.classList.value.includes("task__title-container") ||
                                 !!dragHandleClass)

        this.update({ 
            isDraggingSubtask: this.isDraggingSubtask, isDraggingTask: this.isDraggingTask 
        })

        if (this.floatingItem) {
            event.preventDefault()
        }
    }
    
    /**
     * On task list mouse up. Complete drag action if there was one.
     * @returns 
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

        // if dragging subtask, keep open
        if (draggedItem === "task") {
            this.pickedTaskIdx = -1
            this.updateTaskFocusIdx(toIdx)
        }
        if (draggedItem === "subtask") {
            this.updateSubtaskFocusIdx(toIdx)
        }

        // do not allow a transition animation on new DOM location
        const taskElem = this.getTaskElem(this.floatingItem.idx)
        taskElem.style.transition = "0s"
        
        // the tasks reorder DOM updatre occurs first 
        // then this update will trigger a recalculation of the updated collapsed task heights from the reorder
        requestAnimationFrame(() => {
            // do this to redo the subtask links set up
            this.updateOpenTaskHeight({ isUserTyping: true, doAnimate: false })
            
            this.floatingItemOffset  =  null
            this.floatingItem = null
            this.floatingItemElem = null
            this.update({ floatingItem: null, floatingItemOffset: null  })
        })
    }

    /* Inputs / Editing Functionality */

    /**
     * Saves current text in input as the new task title.
     * Closes the current task-editing state.
     */
    saveNewTitle() {
        const tasks = get(this.tasks)
        tasks![this.pickedTaskIdx].title = this.newText || "Untitled"
        this.newText = ""
        this.isEditingTitle = false
        this.isMakingNewTask = false

        this.update({ 
            isEditingTitle: this.isEditingTitle,
            isMakingNewTask: this.isMakingNewTask,
            newText: this.newText
        })
        this.tasks.set(tasks)

        // this.dispatch("taskEdited", tasks![this.pickedTaskIdx]!)
    }

    /**
     * Saves current text in input as the new task description text.
     * Closes the current task-editing state.
     */
    saveNewDescription = () => {
        const tasks = get(this.tasks)
        tasks![this.pickedTaskIdx].description = this.newText
        this.newText = ""
        this.textAreaHasSpellCheck = false
        
        this.update({ 
            newText: this.newText,
            textAreaHasSpellCheck: this.textAreaHasSpellCheck
        })
        this.tasks.set(tasks)

        // this.dispatch("taskEdited", tasks![this.pickedTaskIdx]!)
    }

    /**
     * Closes the current task-editing state.
     * Saves current text in input as the new subtask title.
     */
    saveNewSubtask() {
        const tasks = get(this.tasks)
        tasks![this.pickedTaskIdx].subtasks![this.editingSubtaskIdx]!.title = this.newText || "Untitled"
        this.editingSubtaskIdx = -1
        this.newText = ""
        this.isAddingNewSubtask = false

        this.update({ 
            editingSubtaskIdx: this.editingSubtaskIdx,
            newText: this.newText,
            isAddingNewSubtask: this.isAddingNewSubtask
        })
        this.tasks.set(tasks)

        // this.dispatch("subtaskEdited", tasks![this.pickedTaskIdx]!)
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
     * @param hasInputBlurred   An input eleme has been blurred.
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

    focusTaskTitle() {
        this.isEditingTitle = true

        const inputTitleElem = this.getElemById(`task-title-id--${this.pickedTaskIdx}`) as HTMLElement
        inputTitleElem.focus()

        this.update({ isEditingTitle: this.isEditingTitle })


        if (get(this.tasks).length === 1) {
            this.tasksListContainer!.scrollTop = 0
        }
    }

    focusDescription() {
        this.isEditingDescription = true

        const inputTitleElem = this.getElemById(`task-description-input-id--${this.pickedTaskIdx}`) as HTMLElement
        inputTitleElem.focus()

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

        let _newIdx = this.focusedSubtaskIdx

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
     * User to navigate between elements in a Task list.
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
        const fromTaskToTitle  =  noActiveSubElemFocus && (focusTaskDown || focusTaskUp)

        let isForTitle       = (isDown && freshExpand) || (!isDown && this.isDescriptionFocused) || fromTaskToTitle
        let isForDescription = !isForTitle && ((isDown && this.isTitleFocused) || (!isDown && subtaskIdx === 0))

        let isForSubtasks    =  this.types["subtasks"] && isExpanded && !isForDescription && this.focusedTaskIdx === this.pickedTaskIdx
                                && subtasksLength > 0 && ((this.isDescriptionFocused && isDown) || subtaskIdx >= 0)

        if (isForSubtasks) {
            this.isDescriptionFocused = false
            this.updateSubTaskFocusIdxFromStroke(key)
        }
        else if (isForTitle) {
            this.isDescriptionFocused = false
            this.isTitleFocused = true

            this.focusTaskTitle()

            if (fromTaskToTitle && focusTaskUp) {
                this.focusedTaskIdx--
                this.update({ focusedTaskIdx: this.focusedTaskIdx })
            }
        }
        else if (isForDescription) {
            this.isTitleFocused = false
            this.focusedSubtaskIdx = -1
            this.isDescriptionFocused = true
            
            this.focusDescription()
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
     * @param optionIdx   Click Event
     */
    contextMenuOptionClickedHandler (event: Event) {
        const isTaskContextMenu = this.rightClickedTask != null
        const _target = event.target as HTMLElement
        let target   = _target
        
        if (_target.tagName === "BUTTON") {
            target = _target.firstElementChild! as HTMLElement
        }
        else {
            // find the button and get is span child
            target = findAncestor({
                child: target,
                queryStr: "dropdown-menu__option-btn",
                max: 15
            })!

            target = target.firstElementChild! as HTMLElement
        }
        
        const optionTitle = target.innerText
        const taskIdx     = this.rightClickedTask?.idx ?? this.pickedTaskIdx
        const subtaskIdx  = this.rightClickedSubtask?.idx ?? 0

        /* Task Context Menu */
        if (optionTitle === "Rename" && isTaskContextMenu) { 
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
            this.addingNewSubtask(taskIdx)
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
            this.addingNewSubtask(taskIdx, subtaskIdx)
            this.updateSubTaskFocusIdxFromStroke("", subtaskIdx)
        }
        else if (optionTitle === "Add Subtask Below") {
            this.addingNewSubtask(taskIdx, subtaskIdx + 1)
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
        pe.preventDefault()

        if (this.isContextMenuOpen) {
            this.closeContextMenu()
            return
        }

        const subtaskElem = findAncestor({ child: target, queryStr: "subtask-id", queryBy: "id", strict: false, max: 5 })

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

        const { left, top } = initFloatElemPos(
            { height: 220, width: this.contextMenuWidth }, cursorPos,
            { height: containerElem.clientHeight, width: containerElem.clientWidth }
        )

        this.contextMenuX = left
        this.contextMenuY = top
        
        // see if task or subtask context menu
        if (subtaskElem || subtaskIdx >= 0) {
            const clickedSubtaskIdx  = subtaskIdx >= 0 ? subtaskIdx : parseInt(subtaskElem!.id.split("--")[2])
            this.rightClickedSubtask = { subtask: this.getSubtask(taskIdx, subtaskIdx)!, idx: clickedSubtaskIdx }
        }
        else {
            this.rightClickedTask = { task: get(this.tasks)![taskIdx], idx: taskIdx }
        }

        this.update({
            contextMenuY: this.contextMenuY, 
            contextMenuX: this.contextMenuX,
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
        const { left, top } = initFloatElemPos(
            { height: 220, width: this.contextMenuWidth }, cursorPos,
            { height: containerElem.clientHeight, width: containerElem.clientWidth }
        )

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
        const { key, ctrlKey, metaKey, shiftKey } = event

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

        const taskElement       = this.getElemById(`task-id--${focusedIdx}`)! as HTMLElement
        const focusedSubtaskIdx = this.focusedSubtaskIdx
        const hasFocusedSubtask = focusedSubtaskIdx >= 0
        const pickedTaskIdx     = this.pickedTaskIdx
        const isAlphaNumericKey = isKeyAlphaNumeric(event)
        const hasCheckbox       = this.types["numbered"]
        const subtaskLength = this.getSubtasksLength(this.focusedTaskIdx)

        if (key === "Backspace" && !hasFocusedSubtask) {
            this.removeTask(focusedIdx)
        }
        else if (key === "Backspace" && hasFocusedSubtask) {
            this.removeFocusedSubtask()
        }
        else if (key === "Enter" && !hasFocusedSubtask && !hasCheckbox) {
            this.handleTaskCheckboxClicked(this.getTask(focusedIdx)!)
        }
        else if (key === "Enter" && hasFocusedSubtask && !hasCheckbox) {
            this.handleSubtaskCheckboxClicked(focusedSubtaskIdx)
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
        else if (shiftKey && key === "+") {
            this.addingNewSubtask(focusedIdx)
            this.updateSubtaskFocusIdx(subtaskLength - 1)
        }
        else if (metaKey && key === "ArrowUp" && !hasFocusedSubtask) {
            this.addingNewTask(focusedIdx)
        }
        else if (metaKey && key === "ArrowUp" && hasFocusedSubtask) {
            event.preventDefault()

            this.addingNewSubtask(focusedIdx, focusedSubtaskIdx)
            this.updateSubtaskFocusIdx(focusedSubtaskIdx)
        }
        else if (metaKey && key === "ArrowDown" && !hasFocusedSubtask) {
            this.addingNewTask(focusedIdx + 1)
        }
        else if (metaKey && key === "ArrowDown" && hasFocusedSubtask) {
            event.preventDefault()

            this.addingNewSubtask(focusedIdx, focusedSubtaskIdx + 1)
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
     * 
     * Needed because when the state update occurs, the height initialized will be before the element is closed from the update.
     * This re-renders after the close update, which has now closed the open element and inits the right closed height.
     * 
     */
    forceListRerender() {
        requestAnimationFrame(() => this.update({ isEditingTitle: this.isEditingTitle }))
    }

    setMinAfterEdit(doHide = true) {
        this.doMinimizeAfterEdit = doHide
    }

    getHozDistanceBetweenCheckboxElems(higherCheckbox: HTMLElement, lowerCheckbox: HTMLElement) {
        return Math.abs(getHozDistanceBetweenTwoElems(higherCheckbox, lowerCheckbox))
    }

    getVertDistanceBetweenCheckboxElems(higherCheckbox: HTMLElement, lowerCheckbox: HTMLElement) {
        return Math.abs(getVertDistanceBetweenTwoElems(higherCheckbox, lowerCheckbox))
    }

    /**
     * Get the top and bottom padding height and everything between (title and description height and padding).
     * 
     * @param taskIdx   Idx of the task element in question
     */
    getTaskElemHeight(taskIdx: number) {
        // get the padding
        let height = this.taskLayout!.topPadding + this.taskLayout!.bottomPadding

        // title element height
        const titleElement = this.getElemById(`task-title-id--${taskIdx}`)
        if (!titleElement) return -1

        height += getElemTrueHeight(titleElement)

        // description element height
        const descrContainer = this.getElemById(`task-description-id--${taskIdx}`)
        if (!descrContainer) return -1

        height += getElemTrueHeight(descrContainer) + 4

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
        if (newState.subTaskLinkHt != undefined)             newStateObj.subTaskLinkHt = newState.subTaskLinkHt
        if (newState.frstSubTaskLinkOffset != undefined)     newStateObj.frstSubTaskLinkOffset = newState.frstSubTaskLinkOffset
        if (newState.isEditingDescription != undefined)      newStateObj.isEditingDescription = newState.isEditingDescription
        if (newState.isEditingTitle != undefined)            newStateObj.isEditingTitle = newState.isEditingTitle
        if (newState.newText != undefined)                      newStateObj.newText = newState.newText
        if (newState.editingSubtaskIdx != undefined)            newStateObj.editingSubtaskIdx = newState.editingSubtaskIdx
        if (newState.taskCheckBoxJustChecked != undefined)      newStateObj.taskCheckBoxJustChecked = newState.taskCheckBoxJustChecked
        if (newState.subtaskCheckBoxJustChecked != undefined)   newStateObj.subtaskCheckBoxJustChecked = newState.subtaskCheckBoxJustChecked
        if (newState.textAreaHasSpellCheck != undefined)        newStateObj.textAreaHasSpellCheck = newState.textAreaHasSpellCheck
        if (newState.isAddingNewSubtask != undefined)           newStateObj.isAddingNewSubtask = newState.isAddingNewSubtask
        if (newState.rightClickedTask != undefined)             newStateObj.rightClickedTask = newState.rightClickedTask
        if (newState.isMakingNewTask != undefined)              newStateObj.isMakingNewTask = newState.isMakingNewTask
        if (newState.focusedTaskIdx != undefined)               newStateObj.focusedTaskIdx = newState.focusedTaskIdx
        if (newState.focusedSubtaskIdx != undefined)            newStateObj.focusedSubtaskIdx = newState.focusedSubtaskIdx
        if (newState.justExpandedTask != undefined)             newStateObj.justExpandedTask = newState.justExpandedTask

        if (newState.draggingSourceIdx != undefined)            newStateObj.draggingSourceIdx = newState.draggingSourceIdx
        if (newState.dragOverItemElemIdx != undefined)          newStateObj.dragOverItemElemIdx = newState.dragOverItemElemIdx

        if (newState.floatingItemOffset != undefined)           newStateObj.floatingItemOffset = newState.floatingItemOffset
        if (newState.floatingItem != undefined)                 newStateObj.floatingItem = newState.floatingItem
        if (newState.taskLayout != undefined)                   newStateObj.taskLayout = newState.taskLayout
        if (newState.isDraggingTask != undefined)               newStateObj.isDraggingTask = newState.isDraggingTask
        if (newState.isDraggingSubtask != undefined)            newStateObj.isDraggingSubtask = newState.isDraggingSubtask

        if (newState.contextMenuX != undefined)                 newStateObj.contextMenuX = newState.contextMenuX
        if (newState.contextMenuY != undefined)                 newStateObj.contextMenuY = newState.contextMenuY
        if (newState.rightClickedSubtask != undefined)          newStateObj.rightClickedSubtask = newState.rightClickedSubtask
        if (newState.isContextMenuOpen != undefined)            newStateObj.isContextMenuOpen = newState.isContextMenuOpen

        return newStateObj
    }
}