import { tasksViewStore, themeState } from "./store";
import { ContextMenuOption, TaskSettingsOptions, RightSideTab } from "./enums"
import { getElemById, getElemNumStyle } from "./utils-general"
import { 
        MAX_X_CONTEXT_MENU_POS, SUBTASK_HEIGHT, 
        TASK_BOTTOM_PADDING, TASK_HEIGHT_MIN_NO_DESCR 
} from "$lib/utils-right-bar"
import { get } from "svelte/store";


/**
 * State handler for tasks view in the right side bar.
 * Is itself a svelte store that Tasks component listens to for changes.
 */
export class TasksViewManager {
    /* Groups */
    taskGroups: TaskGroup[] = []
    currTaskGroupIdx = -1
    isNewTaskGroupFocused = false
    isMakingNewGroup = false
    isEditingGroup = false
    editingTaskGroupIdx = -1
    pickedTaskGroupIdx = -1

    /* Input Values */
    newText = ""
    
    /* UI */
    selectedTab: RightSideTab = RightSideTab.TASKS
    hasUsedEditShortcut = false

    textAreaHasSpellCheck = false
    hasInputBlurred = false

    constructor(taskGroups: TaskGroup[]) {
        this.taskGroups = taskGroups
        this.currTaskGroupIdx = taskGroups.length === 0 ? -1 : 0

        tasksViewStore.set(this)
2
        this.updateTaskViewState({
            taskGroups,
            currTaskGroupIdx: this.currTaskGroupIdx
        })
    }

    updateTaskViewState(newState: Partial<TasksViewManager>) {
        tasksViewStore.update((data: TasksViewManager | null) => {
            return this.getNewStateObj(data!, newState)
        })
    }

    /**
     * Input handler for all inputs in tasks view.
     * For editing task titles, subtask titles, descriptions, & task groups.
     * For description, updates the task height in real time.
     * 
     * @param event    Input event.
     */
    inputTextHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement | HTMLTextAreaElement
        const targetClass = inputElem.classList.value

        this.newText = inputElem.value
    }

    /**
     * Input on focus handler for all inputs in tasks view.
     * Initializes shared input text variable.
     * 
     * @param event    Focus event.
     */
    onInputFocusHandler(event: FocusEvent) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value

        // close task group input when clicking on a new input
        if (!targetClass.includes("new-task-group-title-input") && (this.isEditingGroup || this.isMakingNewGroup)) {
            this.closeEditState()
        }

        if (targetClass.includes("new-task-group-title-input")) {
            // class styling modifier for focus styling as underline is outside of input elem
            this.isNewTaskGroupFocused = true
            this.updateTaskViewState({ isNewTaskGroupFocused: true })   
        }
    }

    /**
     * Input on blur handler for all inputs in tasks view.
     * By default, focusing out of an input will save input text except for editing / making new group.
     * Focusing out will also not automatically minimize the task.
     * 
     * @param event    Focus event.
     */
    onInputBlurHandler(event: FocusEvent) {
        const target = event.target as HTMLElement
        const relatedTarget = event.relatedTarget as HTMLElement
        const targetClass = target.classList.value
        const relatedTargetClass = relatedTarget?.classList.value ?? ""

        // both using a shortcut and clicking away will cause a blur
        // this should only handle click-away blurs
        if (this.hasUsedEditShortcut) {
            this.hasUsedEditShortcut = false
            return
        }
        else if (relatedTargetClass.includes("tab-btn")) {
            this.closeEditState()
            return
        }

        // Input Shortcut Pressed 
        if (targetClass.includes("task-group-title-input")) {
            this.isNewTaskGroupFocused = false
            this.updateTaskViewState({ isNewTaskGroupFocused: false })
        }

        this.toggleInputBlurred(true)
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

    /**
     * Close current editing state if there is one.
     */
    closeEditState() {
        // this should be first to handle close task group edit state when clicking on a new input elem
        if (this.isEditingGroup || this.isMakingNewGroup) {
            this.isEditingGroup = false
            this.isMakingNewGroup = false
            this.isNewTaskGroupFocused = false
            this.newText = ""

            this.updateTaskViewState({ 
                isEditingGroup: false, isMakingNewGroup: false, 
                isNewTaskGroupFocused: true, newText: ""
            })
        }
    }
    /* Groups */

    /**
     * Get tasks from ta task group.
     * @param   taskGroupIdx  Task group idx whose tasks are desired.
     * @returns tasks of a given group
     */
    getTaskGroupTasks(taskGroupIdx: number) {
        return this.taskGroups[taskGroupIdx]
    }

    /**
     * Update current task group
     * @param taskGroupIdx 
     */
    updateTaskGroup(taskGroupIdx: number) {
        this.currTaskGroupIdx = taskGroupIdx

        this.updateTaskViewState({
            currTaskGroupIdx: this.currTaskGroupIdx,
        })
    }

    /**
     * Saves current text in input as the new task group title.
     * Closes the current task-editing state.
     * Will not save if user has clicked 'Esc.'
     * 
     * @param doSave   Save the current text.
     */
    saveNewTaskGroupTitle(doSave: boolean) {
        if (doSave && this.isEditingGroup) {
            this.taskGroups[this.currTaskGroupIdx].title = this.newText
        }
        else if (doSave && this.isMakingNewGroup) {
            this.taskGroups.push({ title: this.newText, tasks: [] })
            this.updateTaskGroup(this.taskGroups.length - 1)
        }

        this.newText = ""
        this.isEditingGroup = false
        this.isMakingNewGroup = false

        this.updateTaskViewState({ 
            newText: "",
            isEditingGroup: false,
            isMakingNewGroup: false,
            taskGroups: this.taskGroups
        })
    }

    /**
     * Deletes current task group.
     */
    deleteTaskGroup() {
        this.taskGroups = this.taskGroups.filter((taskGroup: TaskGroup, idx: number) => this.currTaskGroupIdx != idx)
        const newTaskGroupIdx = this.taskGroups.length === 0 ? -1 : Math.max(this.currTaskGroupIdx - 1, 0)
        this.updateTaskGroup(newTaskGroupIdx)

        this.updateTaskViewState({ taskGroups: this.taskGroups })
    }

    /**
     * Task group dropdown list handler
     * @param taskGroupIdx   New task group idx.
     */
    taskGroupDropdownHandler(taskGroupIdx: number) {
        this.updateTaskGroup(taskGroupIdx)
    }

    /**
     * Settings handler for tasks view settings.
     * 
     * @param option   Option user has clicked. 
     */
    tasksSettingsHandler(option: TaskSettingsOptions) {
        if (option === TaskSettingsOptions.MAKE_NEW_TASK_GROUP) {
            this.isMakingNewGroup = true
        }
        else if (option === TaskSettingsOptions.RENAME_TASK_GROUP) {
            this.isEditingGroup = true
        }
        else {
            this.deleteTaskGroup()
        }

        this.updateTaskViewState({
            isMakingNewGroup: this.isMakingNewGroup,
            isEditingGroup: this.isEditingGroup
        })
    }

    /* Misc. Handlers */

    /**
     * Toggle input description spell check.
     * True if focusing and false if blurred.
     * Used to give the illusion focusing and blurring will change textarea to p tag and vice-versa.
     */
    toggleSpellCheck() {
        this.textAreaHasSpellCheck = !this.textAreaHasSpellCheck
        this.updateTaskViewState({ textAreaHasSpellCheck: this.textAreaHasSpellCheck })
    }

    /**
     * Shortcut handler for tasks view component.
     * @param event   Keyboard event
     */
    keyboardShortcutHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value
        const key = event.key
        const tag = target.tagName

        // prevent scroll when editing
        if (event.code === "Space" && tag != "INPUT" && tag != "TEXTAREA") {
            event.preventDefault()
        }

        // GENERAL SHORTCUTS
        if (["BODY", "LI"].includes(tag) && key === "ArrowUp" || key === "ArrowDown") {
            event.preventDefault()                  // don't allow arrow keys to move scroll
        }

        const isEditing = ["INPUT", "TEXTAREA"].includes(tag)
        const isEditShortCut = (key === "Enter" || key ==="Escape") && isEditing

        // EDITING SHORTCUTS
        if (isEditShortCut && targetClass.includes("task")) {
            this.saveNewTaskGroupTitle(key === "Enter")
        }
    }

    /* Misc. */
    hasTabBarClicked() {
        this.closeEditState()
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
    getNewStateObj(oldState: TasksViewManager, newState: Partial<TasksViewManager>): TasksViewManager {
        const newStateObj = oldState

        if (newState.textAreaHasSpellCheck != undefined)        newStateObj.textAreaHasSpellCheck = newState.textAreaHasSpellCheck
        if (newState.newText != undefined)                      newStateObj.newText = newState.newText
        if (newState.isNewTaskGroupFocused != undefined)        newStateObj.isNewTaskGroupFocused = newState.isNewTaskGroupFocused
        if (newState.currTaskGroupIdx != undefined)             newStateObj.currTaskGroupIdx = newState.currTaskGroupIdx
        if (newState.taskGroups != undefined)                   newStateObj.taskGroups = newState.taskGroups
        if (newState.isEditingGroup != undefined)               newStateObj.isEditingGroup = newState.isEditingGroup
        if (newState.isMakingNewGroup != undefined)             newStateObj.isMakingNewGroup = newState.isMakingNewGroup

        return newStateObj
    }
}