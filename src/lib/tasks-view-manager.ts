import { get, writable, type Writable } from "svelte/store"

import { APIError } from "./errors"
import { APIErrorCode, LogoIcon, RightSideTab } from "./enums"

import { toast } from "./utils-toast"
import { TEST_INBOX_TASKS } from "./utils-right-bar"
import { getCheerEmoji, getElemById, removeItemFromArray, toastApiErrorHandler } from "./utils-general"
import { 
        addTodoistTask, authTodoistAPI, deleteTodoistTask, didTodoistAPIRedirect, 
        initTodoistAPI, syncTodoistUserItems, updateTodoistTask, 
        updateTodoistTaskCompletion 
} from "./api-todoist"


/**
 * State handler for tasks view in the right side bar.
 * Is itself a svelte store that Tasks component listens to for changes.
 */
export class TasksViewManager {
    /* Groups */
    taskGroups: TaskGroup[] = []
    todoistTasks: TaskGroup | null = null
    currTaskGroup: TaskGroup = TEST_INBOX_TASKS

    currTaskGroupIdx = -1     // used to idx user task group (not including todoist + inbox)
    currTaskGroupAbsIdx = -1  // used in dropdown list
    isMakingNewGroup = false
    isEditingGroup = false

    /* Todoist */
    onTodoist = false
    todoistInboxProjectId = ""
    todoistLinked = false
    todoistAccessToken = ""
    todoistSyncToken = ""

    /* Input Values */
    newText = ""
    
    /* UI */
    selectedTab: RightSideTab = RightSideTab.TASKS
    hasUsedEditShortcut = false

    textAreaHasSpellCheck = false
    hasInputBlurred = false
    store!: Writable<TasksViewManager>

    LOADING_TOAST_DURATION = 15_000

    static TASK_GROUP_INPUT_ID = "task-group-input"

    SYNC_TODOIST_OPTION: DropdownListItem = {
        name: "Sync Todoist",
        leftIcon: {
            type: "logo",
            icon: LogoIcon.Todoist,
            logoColored: false,
            styling: {
                height: "13px",
                width: "13px",
                margin: "0px 10px 0px 0px"
            }
        }
    }
    SYNCED_TODOIST_OPTIONS: DropdownListItem = {
        sectionName: "Todoist",
        options: [
            { 
                name: "Refresh Sync", 
                rightIcon: {
                    type: "fa",
                    icon: "fa-solid fa-arrows-rotate",
                }
            },
            { 
                name: "Log Out",
                rightIcon: {
                    type: "fa",
                    icon: "fa-solid fa-right-from-bracket",
                }
            }
        ]
    }

    constructor(taskGroups: TaskGroup[]) {
        this.store = writable(this)
        this.taskGroups = taskGroups
        
        if (this.hasSession()) {
            this.loadAndSetPlayerData()
        }
        else {
            this.currTaskGroupIdx = taskGroups.length === 0 ? -1 : 0
            this.currTaskGroupAbsIdx = this.todoistLinked ? 1 : 0
            this.currTaskGroup = TEST_INBOX_TASKS
            
            this.update({
                taskGroups,
                currTaskGroup: this.currTaskGroup,
                currTaskGroupAbsIdx: this.currTaskGroupAbsIdx,
                currTaskGroupIdx: this.currTaskGroupIdx
            })
        }
        if (didTodoistAPIRedirect()) {
            toast("promise",
                {
                    icon: LogoIcon.Todoist,
                    loading: 'Logging in...',
                    success: "Todoist sync successful!",
                    error: 'Error occured. Please try again.'
                },
                this.continueTodoistAPIOAuthFlow()
            )
        }
    }

    update(newState: Partial<TasksViewManager>) {
        let state = get(this.store)
        
        this.store.update((data: TasksViewManager | null) => {
            state = this.getNewStateObj(data!, newState)!
            return state
        })

        this.saveStateData(state)
    }

    /* Edits  */

    initNewGroupEdit() {
        this.isMakingNewGroup = true

        this.update({
            isMakingNewGroup: this.isMakingNewGroup,
        })

        requestAnimationFrame(() => {
            getElemById(TasksViewManager.TASK_GROUP_INPUT_ID)!.focus()
        })
    }
    
    initEditGroupEdit() {
        this.isEditingGroup = true
        
        this.update({
            isEditingGroup: this.isEditingGroup,
        })

        requestAnimationFrame(() => {
            getElemById(TasksViewManager.TASK_GROUP_INPUT_ID)!.focus()
        })
    }

    /**
     * 
     * @param event    Input event.
     * 
     * On input handler for editing task groups.
     */
    inputTextHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement
        this.newText = inputElem.value
    }

    /**
     * On blur handler for edit task group.
     * @param event    Focus event.
     */
    onInputBlurHandler() {
        return
        this.finishGroupEdit()
    }

    /* Groups */

    /**
     * Get tasks from ta task group.
     * 
     * @param   taskGroupIdx  Task group idx whose tasks are desired.
     * @returns tasks of a given group
     */
    getTaskGroupTasks(taskGroupIdx: number) {
        return this.taskGroups[taskGroupIdx]
    }

    /**
     * Update current, in-view task group.
     * 
     * @param taskGroup Task group to be viewed. 
     */
    updateTaskGroup(options: {
        taskGroup: TaskGroup, 
        idx: number, 
        onTodoist?: boolean
    }) {
        const { taskGroup, idx, onTodoist = false } = options
        this.currTaskGroup = taskGroup
        this.currTaskGroupIdx = idx
        this.onTodoist = onTodoist

        this.update({
            currTaskGroup: this.currTaskGroup,
            currTaskGroupIdx: this.currTaskGroupIdx,
            onTodoist: this.onTodoist
        })
    }

    /**
     * 
     * Saves edit changes. Used for making new groups or editing roups.
     */
    finishGroupEdit() {
        this.newText = this.newText ? this.newText : "Untitled"

        if (this.isEditingGroup && this.currTaskGroupIdx >= 0) {
            this.taskGroups[this.currTaskGroupIdx].title = this.newText
        }
        else if (this.isMakingNewGroup) {
            this.taskGroups.push({ title: this.newText, tasks: [] })
        }
        
        // update current
        if (this.isEditingGroup) {
            this.currTaskGroup = this.taskGroups[this.currTaskGroupIdx]
        }
        else {
            this.currTaskGroup = this.taskGroups[this.taskGroups.length - 1]
        }

        const title = this.newText
        const wasMakingNewGroup = this.isMakingNewGroup

        this.newText = ""
        this.isEditingGroup = false
        this.isMakingNewGroup = false

        this.update({ 
            newText: "",
            isEditingGroup: false,
            isMakingNewGroup: false,
            currTaskGroup: this.currTaskGroup,
            taskGroups: this.taskGroups
        })

        if (wasMakingNewGroup) {
            this.initToast({ message: `New group "${title}" created.` })
        }
    }

    /**
     * Deletes current task group.
     */
    deleteTaskGroup() {
        const title = this.currTaskGroup.title
        this.taskGroups = this.taskGroups.filter((group: TaskGroup) => {
            return group.title != this.currTaskGroup.title
        })

        if (this.taskGroups.length === 0) {
            this.updateTaskGroup({ 
                taskGroup: TEST_INBOX_TASKS, 
                idx: -1
            })
        }
        else {
            const newIdx = Math.max(this.currTaskGroupIdx - 1, 0)
            this.updateTaskGroup({ 
                taskGroup: this.taskGroups[newIdx],
                idx: newIdx
            })
        }

        this.update({ taskGroups: this.taskGroups })
        this.initToast({ message: `"${title}" successfully deleted.` })
    }

    /* Dropdown Handlers */

    /**
     * Task group dropdown list handler
     * @param orderIdx   Task group drpodown order idx.
     */
    taskGroupDropdownHandler(orderIdx: number) {
        const todoistLinked = this.todoistLinked

        if (orderIdx === 0 && todoistLinked) {
            this.updateTaskGroup({ 
                taskGroup: this.todoistTasks!, 
                idx: -1,
                onTodoist: true
            })
        }
        else if ((orderIdx === 1 && todoistLinked) || orderIdx === 0) {
            this.updateTaskGroup({ 
                taskGroup: TEST_INBOX_TASKS, 
                idx: -1,
                onTodoist: false
            })
        }
        else {
            const idx = orderIdx - (todoistLinked ? 2 : 1)
            this.updateTaskGroup({ 
                taskGroup: this.taskGroups[idx], 
                idx,
                onTodoist: false
            })
        }
        this.update({
            currTaskGroupAbsIdx: orderIdx
        })
    }

    loginTodoist() {
        this.initTodoist()
        toast("promise", { loading: 'Logging in...' }, this.initTodoist())
    }

    /* Todoist Functionality */
    async initTodoist() {
        await initTodoistAPI()
        
        // navigation to consent screen takes time
        return new Promise<void>((resolve) => setTimeout(() => resolve(), this.LOADING_TOAST_DURATION))
    }

    logoutTodoist() {
        this.onTodoist = false
        this.todoistInboxProjectId = ""
        this.todoistLinked = false
        this.todoistAccessToken = ""
        this.todoistSyncToken = ""

        this.updateTaskGroup({ 
            taskGroup: TEST_INBOX_TASKS,
            idx: -1
        })
        this.initToast({
            icon: LogoIcon.Todoist,
            message: "Account disconnected."
        })
        this.update({
            onTodoist: false,
            todoistInboxProjectId: "",
            todoistLinked: false,
            todoistAccessToken: "",
            todoistSyncToken: ""
        })
    }

    async continueTodoistAPIOAuthFlow() {
        try {
            const authRes = await authTodoistAPI()
            this.todoistAccessToken = authRes.access_token
            await this.getTodistUserItems()

            this.todoistLinked = true
            this.update({ 
                todoistLinked: true  
            })
            this.updateTaskGroup({ 
                taskGroup: this.todoistTasks!,
                idx: -1,
                onTodoist: true
            })
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    async getTodistUserItems() {
        try {
            const { tasks, syncToken, projectId } = await syncTodoistUserItems({ 
                accessToken: this.todoistAccessToken,
                inboxProjectId: this.todoistInboxProjectId,
                syncToken: "*"
            })

            this.todoistTasks = { title: "Inbox", tasks }
            this.todoistSyncToken = syncToken
            
            if (projectId) {
                this.todoistInboxProjectId = projectId
            }
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    refreshTodoist() {
        toast("promise",
            {
                icon: "fa-solid fa-circle-check",
                loading: 'Refreshing...',
                success: "Refreshed!",
                error: 'Error occured. Please try again.'
            },
            this.initPartialSync(),
        )
    }

    /**
     * Find the corresponding updated item from the returned sync tasks from partial sync.
     * @param syncTasks  Updated items from last sync.
     * @param task       The updated item's correspond local item.
     * @returns          Update context from the patial sync.
     */
    getTaskSyncAction(syncTasks: TodoistTask[], task: Task | Subtask): TodoistItemPartialSyncOntext {
        const isSubtask = "parentId" in task
        const idx = syncTasks.findIndex((s) => s.id === task.id)

        if (idx < 0) {
            return { action: "none", syncTask: null, idx: -1 }
        }

        const syncTask = structuredClone(syncTasks[idx])

        if (syncTask.isDeleted) {
            return { action: "deleted", syncTask, idx }
        }
        else if (isSubtask && syncTask.parentId != task.parentId) {
            return { action: "parent_changed", syncTask, idx }
        }
        else {
            return { action: "updated", syncTask, idx }
        }
    }

    /**
     * Initalize a partial sync. 
     * Incorporates changes last made after a full or last partial sync.
     */
    async initPartialSync() {
        try {
            const { tasks: syncTasks, syncToken } = await syncTodoistUserItems({ 
                accessToken: this.todoistAccessToken,
                syncToken: this.todoistSyncToken,
                inboxProjectId: this.todoistInboxProjectId
            })

            const todoistTasks = this.todoistTasks!.tasks
            const updatedTasks: Task[] = []
            const newSubtasks: Subtask[] = []
            
            // process the sync tasks to update current tasks
            for (let i = 0; i < todoistTasks.length; i++) {
                const task = todoistTasks[i]
                const subtasks = task.subtasks!
                const taskSubtasks = []
    
                // process subtasks first
                for (let j = 0; j < subtasks.length; j++) {
                    const subtask = subtasks[j]
                    const { action, syncTask, idx } = this.getTaskSyncAction(syncTasks, subtask)
    
                    if (syncTask) {
                        removeItemFromArray(idx, syncTasks)
                    }
                    if (action === "deleted") {
                        continue
                    }
                    else if (action === "parent_changed" && syncTask!.parentId) {
                        // moved
                        newSubtasks.push(syncTask!)
                    }
                    else if (action === "parent_changed") {
                        // became a task
                        updatedTasks.push(syncTask!)
                    }
                    else if (action === "updated" && !syncTask!.isChecked) {
                        taskSubtasks!.push(syncTask!)
                    }
                    else if (action === "none") {
                        taskSubtasks!.push(subtask)
                    }
                }

                const { action, syncTask, idx } = this.getTaskSyncAction(syncTasks, task)

                if (syncTask) {
                    removeItemFromArray(idx, syncTasks)
                }
                if (action === "deleted") {
                    continue
                }
                else if (action === "parent_changed" && syncTask!.parentId) {
                    // became a subtask
                    newSubtasks.push({ ...syncTask! })
                }
                else if (action === "updated" && !syncTask!.isChecked) {
                    updatedTasks.push({ ...syncTask!, subtasks: taskSubtasks })
                }
                else if (action === "none") {
                    updatedTasks.push({ ...task!, subtasks: taskSubtasks })
                }
            }
            
            // incorporate any new tasks from the sync
            syncTasks
                .forEach((t) => t.parentId ? newSubtasks.push(t) : updatedTasks.push(t))

            // incorporate any new subtasks
            for (let subtask of newSubtasks) {
                // subtasks that have children are excluded
                const parentIdx = updatedTasks.findIndex(p => p.id === subtask.parentId)
                if (parentIdx < 0) continue
    
                updatedTasks[parentIdx].subtasks!.push(subtask)
            }
    
            this.todoistSyncToken = syncToken
            this.todoistTasks = { 
                title: "Inbox", tasks: TasksViewManager.sortTasks(updatedTasks)
            }

            this.update({ currTaskGroup: this.todoistTasks })
        }
        catch(e) {
            this.onError(new APIError(APIErrorCode.GENERAL, "There was an error syncing your Todoist data."))
        }
    }
    
    /* API Handlers */

    onTaskUpdate = async (context: TaskUpdateContext) => {
        const { 
            action,
            payload: { taskId, subTaskId, item, tasks },
            undoFunction
        } = context

        const { title: name, id: orderIdx, isChecked: complete } = item
        const description = "description" in item ? item.description : ""
        const isRecurring = "isRecurring" in item ? item.isRecurring as boolean : undefined
        const dueDate    = "due" in item ? item.due as string : undefined

        try {
            if (this.todoistLinked && ["complete", "incomplete"].includes(action)) {
                const couldOccurSameDay = isRecurring && dueDate?.includes("T")

                await updateTodoistTaskCompletion({
                    accessToken: this.todoistAccessToken,
                    syncToken: this.todoistSyncToken,
                    taskId: subTaskId ? subTaskId : taskId,
                    isRecurring,
                    dueDate,
                    complete: complete!
                })

                // if (couldOccurSameDay) {
                //     this.initPartialSync()
                // }
                this.todoistTasks = { ...this.todoistTasks!, tasks }
            }
            else if (this.todoistLinked) {
                await updateTodoistTask({
                    accessToken: this.todoistAccessToken,
                    syncToken: this.todoistSyncToken,
                    taskId: subTaskId ? subTaskId : taskId,
                    name,
                    description
                })
            }

            this.currTaskGroup = { ...this.currTaskGroup, tasks }

            if (action != "complete") return

            this.initUndoHandler({ 
                action: "complete", 
                name, 
                func: undoFunction 
            })
        }
        catch(error: any) {
            this.onError(error)
        }
    }
    
    onAddTask = async (context: TaskAddContext) => {
        const { payload: { tasks, taskId, name }, undoFunction } = context
        let id = ""

        try {
            if (this.todoistLinked) {
                 id = (await addTodoistTask({
                    accessToken: this.todoistAccessToken,
                    projectId: this.todoistInboxProjectId,
                    parentId: taskId,
                    name
                })).taskId

                this.todoistTasks = { ...this.todoistTasks!, tasks }
            }

            this.currTaskGroup = { ...this.currTaskGroup, tasks }
            this.initUndoHandler({
                name, 
                action: "add", 
                func: undoFunction
            })
        }
        catch(error: any) {
            this.onError(error)
        }
        finally {
            return { id }
        }
    }

    onDeleteTask = async (context: TaskDeleteContext) => {
        const { payload: { taskId, tasks, subTaskId, name }, undoFunction } = context
        try {
            if (this.todoistLinked) {
                await deleteTodoistTask({
                    accessToken: this.todoistAccessToken,
                    taskId: subTaskId ? subTaskId : taskId
                })
            }

            this.currTaskGroup = { ...this.currTaskGroup, tasks }
            this.initUndoHandler({
                name, 
                action: "delete", 
                func: undoFunction
            })
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    /* Toasts */

    /**
     * Initializes a toast element with an undo function.
     * @param context 
     */
    initUndoHandler(context: {
        action: TaskUpdateActions | "add" | "delete",
        name?: string,
        func?: FunctionParam
    }) {
        const { action, name, func } = context
        const todoist = this.todoistLinked
        const group = this.currTaskGroup

        if (action === "add" && todoist) {
            this.initToast({
                icon: LogoIcon.Todoist,
                message: `"${name}" added to ${!todoist ? `"${group.title}"` : "your Inbox"}.`
            })
        } 
        else if (action === "delete") {
            this.initUndoToast({
                icon: !todoist ? undefined : LogoIcon.Todoist,
                description: `"${name}" deleted from ${!todoist ? `${group.title}` : "your Inbox"}.`,
                func
            })
        }
        else if (action === "complete") {
            this.initUndoToast({
                icon: getCheerEmoji(),
                description: `"${name}" completed!`,
                func
            })
        }
    }

    /**
     * Creates a toast with an undo function.
     * @param options  Toast details (description + function).
     */
    initUndoToast(options: { icon?: string | LogoIcon, description: string, func?: FunctionParam }) {
        const { description, func, icon } = options
        if (!func) return

        toast("default", {
            icon,
            message: description,
            contextId: "todos",
            groupExclusive: true,
            action: {
                label: "Undo", 
                onClick: () => func()
            }
        })
    }

    initToast(options: { icon?: string | LogoIcon, message: string, description?: string }) {
        const { description, message, icon } = options

        toast("default", {
            icon,
            message,
            description,
            contextId: "todos"
        })
    }

    /* handlers */

    onError(error: any) {
        toastApiErrorHandler({ 
            error, 
            logoIcon: LogoIcon.Todoist,
            title: "Todoist"
        })
    }

    getTaskSettingsDropdown(): DropdownListItem[] {
        const nativeTaskOptions = {
            options: [
                { name: "New Group" },
                ...(this.currTaskGroup.title === "Inbox" || this.onTodoist ? [] : [{ name: "Rename Group" }]),
                ...(this.currTaskGroup.title === "Inbox" || this.onTodoist ? [] : [{ name: "Delete Group" }])
            ]
        }
        return [
            nativeTaskOptions, 
            this.todoistLinked ? this.SYNCED_TODOIST_OPTIONS : this.SYNC_TODOIST_OPTION as DropdownListItem
        ]
    }

    /**
     * Sort by alphabetical order
     * 
     * @param tasks 
     * @returns     Sorted tasks
     */
    static sortTasks(tasks: Task[]) {
        let orderIdx = 0
        tasks.sort((a, b) => a.title.localeCompare(b.title));
        tasks.forEach(task => {
            task.idx = orderIdx++

            if (task.subtasks!.length === 0) return

            let subtaskOrderIdx = 0

            task.subtasks!.sort((a, b) => a.title.localeCompare(b.title))
            task.subtasks!.forEach(subtask => subtask.idx = subtaskOrderIdx++)
        })

        return tasks
    }

    /* state */
    
    hasSession() {
        return localStorage.getItem("tasks") != null
    }

    saveStateData(state: TasksViewManager) {
        localStorage.setItem("tasks", JSON.stringify({
            currTaskGroup: state.currTaskGroup!,
            currTaskGroupIdx: state.currTaskGroupIdx!,
            currTaskGroupAbsIdx: state.currTaskGroupAbsIdx!,
            onTodoist: state.onTodoist!,
            todoistInboxProjectId: state.todoistInboxProjectId!,
            todoistLinked: state.todoistLinked!,
            todoistAccessToken: state.todoistAccessToken!,
            todoistTasks: state.todoistTasks!,
            todoistSyncToken: state.todoistSyncToken!
        }))
    }

    loadAndSetPlayerData() {
        if (!this.hasSession()) return
        const savedData = JSON.parse(localStorage.getItem("tasks")!) as Partial<TasksViewManager>

        this.currTaskGroup = savedData.currTaskGroup!
        this.currTaskGroupIdx = savedData.currTaskGroupIdx!
        this.currTaskGroupAbsIdx = savedData.currTaskGroupAbsIdx!
        this.onTodoist = savedData.onTodoist!
        this.todoistInboxProjectId = savedData.todoistInboxProjectId!
        this.todoistLinked = savedData.todoistLinked!
        this.todoistAccessToken = savedData.todoistAccessToken!
        this.todoistTasks = savedData.todoistTasks!
        this.todoistSyncToken = savedData.todoistSyncToken!

        this.update({ ...savedData })
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
        if (newState.newText != undefined)               oldState.newText = newState.newText
        if (newState.currTaskGroupIdx != undefined)      oldState.currTaskGroupIdx = newState.currTaskGroupIdx
        if (newState.currTaskGroupAbsIdx != undefined) oldState.currTaskGroupAbsIdx = newState.currTaskGroupAbsIdx
        if (newState.todoistLinked != undefined)         oldState.todoistLinked = newState.todoistLinked
        if (newState.onTodoist != undefined)             oldState.onTodoist = newState.onTodoist
        if (newState.taskGroups != undefined)            oldState.taskGroups = newState.taskGroups
        if (newState.isEditingGroup != undefined)        oldState.isEditingGroup = newState.isEditingGroup
        if (newState.currTaskGroup != undefined)         oldState.currTaskGroup = newState.currTaskGroup
        if (newState.isMakingNewGroup != undefined)      oldState.isMakingNewGroup = newState.isMakingNewGroup

        return oldState
    }
}