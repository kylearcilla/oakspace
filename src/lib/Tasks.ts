import { writable, type Writable } from "svelte/store"
import { v4 as uuidv4 } from 'uuid'
const DEFAULT_MAX_DEPTH = 5

/**
 * Stores and managese a collection of nested tasks using a directed graph.
 */
export class Tasks {
    private taskMap: Map<string, Task>
    private parents: Map<string | null, string[]>
    private openTasks: Set<string>
    maxDepth: number

    _store: Writable<Tasks>

    constructor(options: { tasks: Task[], maxDepth?: number }) {
        const { tasks, maxDepth = DEFAULT_MAX_DEPTH } = options
        this._store = writable(this)

        this.taskMap = new Map()
        this.parents = new Map()
        this.maxDepth = maxDepth
        this.openTasks = new Set

        tasks.forEach((task) => this.addTask({ task, doUpdate: false }))
        this._store.set(this)
    }

    /**
     * 
     * @param args 
     * @param args.type  "init" Task to be inserted as part of a batch of siblings (so no neighbor shifting)
     *                   "new"  New task to be inserted into siblings
     * 
     * @param args.doUpdate  Do update store
     * @param args.task      Task to be added
     */
    addTask(args: { task: Task, type?: "init" | "new", doUpdate?: boolean }) {
        const { task, type = "init", doUpdate = true } = args

        // create parent if there isn't one
        if (!this.parents.has(task.parentId)) {
            this.parents.set(task.parentId!, [])
        }

        // add as child to parent
        // root tasks will have "null" as a parent
        this.parents.get(task.parentId)!.push(task.id)

        // when adding a new task, shift the indices accordingly
        if (type === "new") {
            this.shiftNeighbors({
                idx: task.idx,
                parentId: task.parentId,
                shiftDirection: 1
            })
        }
        
        this.taskMap.set(task.id, task)

        if (doUpdate) {
            this._store.set(this)
        }
    }

    removeTask(taskId: string): Task[] {
        const task = this.taskMap.get(taskId)
        if (!task) return []
        
        const parentId = task.parentId
    
        // Remove children and collect all removed tasks
        const removedChildren = this.removeChildren(task.id)
    
        // Remove task from taskMap and parent references
        this.taskMap.delete(taskId)
        this.parents.delete(taskId)
    
        this.shiftNeighbors({
            parentId,
            idx: task.idx + 1,
            shiftDirection: -1,
        })
        this.removeChild(parentId, taskId)
        this._store.set(this)
    
        // Return all removed tasks (including the current task)
        return [task, ...removedChildren]
    }

    removeCompletedTasks() {
        const completedTasks = this.getAllTasks().filter(task => task?.isChecked)
        completedTasks.forEach(task => this.removeTask(task.id))

        return completedTasks
    }
    
    private removeChildren(id: string): Task[] {
        const children = this.parents.get(id) || []
        const removed: Task[] = []
    
        children.forEach((childId) => {
            removed.push(...this.removeTask(childId))
        });
    
        this.parents.delete(id)
        return removed
    }

    private shiftNeighbors(args: {
        parentId: string | null
        idx: number
        shiftDirection: 1 | -1
    }) {
        const { parentId, idx, shiftDirection } = args
        const siblings = this.getSiblings(parentId)

        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i]
            if (sibling && sibling.idx >= idx) {
                sibling.idx += shiftDirection
            }
        }
    }
    addChild(parentId: string | null, taskId: string) {
        if (!this.parents.has(parentId)) {
            this.parents.set(parentId, [])
        }
        this.parents.get(parentId)!.push(taskId)
    }

    removeChild(parentId: string | null, taskId: string) {
        const siblings = this.getSiblings(parentId)
                                .map((s) => s?.id)
                                .filter((id) => id !== taskId)

        this.parents.set(parentId, siblings)
    }

    duplicateTask(dupId: string): Task[] {
        const ogTask = this.taskMap.get(dupId)!
        const newTask = structuredClone(ogTask)
        newTask.id = uuidv4()
        newTask.idx = ogTask.idx + 1

        const children = this.getSubtasks(dupId)
        const newChildren = children.map((c) => ({
            ...structuredClone(c),
            parentId: newTask.id,
            id: uuidv4()
        }))

        this.addTask({ 
            task: newTask, type: "new", doUpdate: false 
        })
        newChildren.map((task) => this.addTask({ 
            task, type: "init", doUpdate: false 
        }))

        this._store.set(this)
        return [newTask, ...newChildren]
    }

    reorderTask({ src, target, action, targetParentId }: { 
        src: Task, 
        target: Task, 
        action: "nbr-top" | "nbr-bottom" | "child",
        targetParentId: string | null 
    }) {
        const srcIdx = src.idx
        const targetIdx = target.idx
        const sameParent = src.parentId === targetParentId
        let toIdx
        
        if (action === "child") {
            const targetChildren = this.getSubtasks(target.id)
            toIdx = targetChildren.length
            targetParentId = target.id
        } 
        else {
            toIdx = action === "nbr-bottom" ? targetIdx + 1 : targetIdx
            
            if (sameParent && srcIdx < toIdx) {
                toIdx--
            }
        }

        // Remove from old position
        this.shiftNeighbors({
            parentId: src.parentId,
            idx: srcIdx + 1,
            shiftDirection: -1,
        })

        // Make space at new position
        this.shiftNeighbors({
            parentId: targetParentId,
            idx: toIdx,
            shiftDirection: 1
        })

        // Update parent relationships
        this.removeChild(src.parentId, src.id)
        this.addChild(targetParentId, src.id)
        
        src.parentId = targetParentId
        src.idx = toIdx

        this._store.set(this)
        return src
    }

    renameTask(taskId: string, newTitle: string) {
        const task = this.taskMap.get(taskId)
        if (!task) return

        task.title = newTitle
        this._store.set(this)
    }

    editTaskText(args: { type: "title" | "description", text: string, id: string }) {
        const { type, text, id } = args
        const task = this.taskMap.get(id)
        if (!task) return
        
        task[type] = text
        this._store.set(this)
    }

    /**
     * Put removed tasks back into the task list.
     * Can handle both single task + children removal and multiple task removal.
     * 
     * @param args.parentTask Optional parent task that was removed with its children
     * @param args.removed    Array of tasks that were removed
     */
    onRemoveUndo(args: { parentTask?: Task, removed: Task[] }) {
        const { parentTask, removed } = args

        if (parentTask) {
            const children = removed.filter(t => t.id !== parentTask.id)

            this.addTask({ 
                task: parentTask, 
                type: "new", 
                doUpdate: false 
            })
            children.forEach(task => this.addTask({ 
                task, 
                type: "init", 
                doUpdate: false 
            }))
        } 
        else {
            removed.forEach(task => this.addTask({
                task,
                type: "new",
                doUpdate: false
            }))
        }

        this._store.set(this)
    }

    /**
     * Toggle a task's checkbox true or false.
     * @param id Task id
     */
    toggleTaskComplete(id: string) {
        const task = this.taskMap.get(id)
        if (!task) return

        task.isChecked = !task.isChecked
        this._store.set(this)
    }

    /* queries */

    getTaskCount({ rootOnly }: { rootOnly?: boolean }): number {
        if (rootOnly) {
            return this.getRootTasks().length
        } 
        else {
            return this.getAllTasks().length
        }
    }

    getSubtaskCount(parentId: string | null): number {
        return this.getSubtasks(parentId).length
    }

    getAllTasks() {
        return Array.from(this.taskMap.values())
    }

    getTask(id: string): Task | undefined  {
        return this.taskMap.get(id)
    }

    getLength() {
        return this.taskMap.size
    }

    getRootTasks() {
        const tasks = this.getSubtasks(null)
        return tasks.sort((a: Task, b: Task) => a.idx - b.idx)
    }

    getRootTask(id: string): Task | null {
        const task = this.getTask(id)
        if (!task) return null

        const parentId = task.parentId
        if (!parentId) return task

        return this.getRootTask(parentId)
    }

    updateTaskId(id: string, newId: string) {
        const task = this.taskMap.get(id)
        if (!task) return

        // Update taskMap
        this.taskMap.delete(id)
        task.id = newId
        this.taskMap.set(newId, task)

        // Update task as a parent
        if (this.parents.has(id)) {
            const children = this.parents.get(id)
            this.parents.delete(id)
            this.parents.set(newId, children!)
        }

        // Update task as a child in its parent's children list
        const parentId = task.parentId  // could be null for root tasks
        const siblings = this.parents.get(parentId)
        if (siblings) {
            const index = siblings.indexOf(id)
            if (index !== -1) {
                siblings[index] = newId
            }
        }

        // Update openTasks set
        if (this.openTasks.has(id)) {
            this.openTasks.delete(id)
            this.openTasks.add(newId)
        }

        this._store.set(this)
    }

    getSiblings(parentId: string | null) {
        return this.getSubtasks(parentId)
    }

    getTaskLineageCount(id: string): number {
        const task = this.getTask(id)
        if (!task) return 0

        let count = 1
        let parentId = task.parentId

        while (parentId) {
            count++
            const parent = this.getTask(parentId)
            if (!parent) break
            parentId = parent.parentId
        }

        return count
    }
    
    isAtMaxDepth(id: string): boolean {
        const task = this.getTask(id)
        if (!task) return false

        const lineageCount = this.getTaskLineageCount(id)
        return lineageCount >= this.maxDepth
    }

    /**
     * Get a task's immediate subtasks
     * @param taskId 
     */
    getSubtasks(taskId: string | null): Task[] {
        const subtasks: Task[] = []
        const childrenIds = this.parents.get(taskId) || []

        for (const childId of childrenIds) {
            const childTask = this.taskMap.get(childId)

            if (childTask) {
                subtasks.push(childTask)
            }
        }
        return subtasks
    }

    isRootTask(id: string) {
        const rootTaskIds = this.parents.get(null) ?? []
        return rootTaskIds.includes(id)
    }

    /* utils  */

    toggleTaskOpen(id: string) {
        if (this.isTaskOpen(id)) {
            this.openTasks.delete(id)
        } 
        else {
            this.openTasks.add(id)
        }

        this._store.set(this)
    }

    closeAllTasks() {
        this.openTasks.clear()
        this._store.set(this)
    }

    isTaskOpen(id: string): boolean {
        return this.openTasks.has(id)
    }
}