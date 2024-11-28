import { writable, type Writable } from "svelte/store"

const DEFAULT_MAX_DEPTH = 5

/**
 * Stores and managese a collection of nested tasks using a directed graph.
 */
export class Tasks {
    private taskMap: Map<string, Task>
    private parents: Map<string | null, string[]>
    private readonly maxDepth: number;
    private openSubtasks: Set<string>

    _store: Writable<Tasks>

    constructor(options: { tasks: Task[], maxDepth?: number }) {
        const { tasks, maxDepth = DEFAULT_MAX_DEPTH } = options
        this._store = writable(this)

        this.taskMap = new Map()
        this.parents = new Map()
        this.maxDepth = maxDepth
        this.openSubtasks = new Set

        tasks.forEach((task) => this.addTask({ task }))
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
        const task = this.taskMap.get(taskId)!
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
                console.log(sibling.idx, "to", sibling.idx + shiftDirection)
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
        newTask.id = crypto.randomUUID()
        newTask.idx = ogTask.idx + 1

        const children = this.getSubtasks(dupId)
        const newChildren = children.map((c) => ({
            ...structuredClone(c),
            parentId: newTask.id,
            id: crypto.randomUUID()
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

    reorderTask(args: { src: Task, target: Task | null, targetParentId: string | null }) {
        const { src, target, targetParentId } = args
        const toSiblings = this.getSubtasks(targetParentId)

        const fromPIdx   = !src.parentId ? -1 : this.getTask(src.parentId)!.idx
        const toPIdx     = !targetParentId ? -1 : this.getTask(targetParentId)!.idx
        const sameParent = src.parentId === targetParentId

        const srcIdx  = src.idx
        const toLast  = !target 
        let targetIdx = target ? target.idx : toSiblings.length - (sameParent ? 1 : 0)

        const direction = (!sameParent ? fromPIdx < toPIdx : srcIdx < targetIdx) ? "down" : "up"
        targetIdx += (direction === "down" && !toLast ? -1 : 0)

        // shift from neighbors
        this.shiftNeighbors({
            parentId: src.parentId,
            idx: src.idx + 1,
            shiftDirection: -1,
        })

        // make room for new neighbor
        this.shiftNeighbors({
            parentId: targetParentId,
            idx: targetIdx,
            shiftDirection: 1
        })

        this.removeChild(src.parentId, src.id)
        this.addChild(targetParentId, src.id)
        
        src.parentId = targetParentId
        src.idx = targetIdx

        this._store.set(this)
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

    updateNewTaskId(oldId: string, newId: string) {
        const task = this.taskMap.get(oldId)!

        this.taskMap.delete(oldId)
        task.id = newId
        this.taskMap.set(newId, task)

        
        if (task.parentId !== null) {
            const siblings = this.parents.get(task.parentId);
            if (siblings) {
                const index = siblings.indexOf(oldId);
                if (index !== -1) siblings[index] = newId;
            }
        }    
    }

    /**
     * Put back all the removed tasks
     * @param task 
     * @param removed 
     */
    onRemoveUndo(task: Task, removed: Task[]) {
        const children = removed.filter(t => t.id != task.id)

        this.addTask({ 
            task: task, type: "new", doUpdate: false 
        })
        children.map((task) => this.addTask({ 
            task, type: "init", doUpdate: false 
        }))

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
        this._toggleComplete(id, task.isChecked)

        this._store.set(this)
    }

    /**
     * Recursive helper function for checking a task and all of its tasks.
     * @param id 
     */
    private _toggleComplete(id: string, isChecked: boolean) {
        const task = this.taskMap.get(id)
        if (isChecked) {
            task!.isChecked = true
        }
        const subtasks = this.parents.get(id) || []

        subtasks.forEach((subtaskId) => {
            this._toggleComplete(subtaskId, isChecked)
        })
    }

    /* queries */

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

    getSiblings(parentId: string | null) {
        return this.getSubtasks(parentId)
    }

    /**
     * Get a task's immediate subtasks
     * @param taskId 
     */
    getSubtasks(taskId: string | null): Task[] {
        const subtasks: Task[] = []
        const childrenIds = this.parents.get(taskId) || []

        for (const childId of childrenIds) {
            const childTask = this.taskMap.get(childId)!

            subtasks.push(childTask)
        }
        return subtasks
    }

    isRootTask(id: string) {
        const rootTaskIds = this.parents.get(null) ?? []
        return rootTaskIds.includes(id)
    }

    /* utils  */

    toggleSubtaskOpen(id: string) {
        if (this.openSubtasks.has(id)) {
            this.openSubtasks.delete(id)
        } 
        else {
            this.openSubtasks.add(id)
        }

        this._store.set(this)
    }

    closeAllSubtasks() {
        this.openSubtasks.clear()
        this._store.set(this)
    }

    isTaskOpen(id: string): boolean {
        return this.openSubtasks.has(id)
    }

    private enforceMaxDepth(parentId: string | null) {
        const currentDepth = this.getDepth(parentId);
        if (currentDepth >= this.maxDepth) {
            throw new Error(`Cannot add or move task: Maximum nested depth of ${this.maxDepth} exceeded.`);
        }   
    }

    private getDepth(parentId: string | null): number {
        let depth = 0;
        let currentParentId = parentId;
    
        while (currentParentId !== null) {
            depth++;
            const parentTask = this.taskMap.get(currentParentId);
            if (!parentTask) break;
            currentParentId = parentTask.parentId;
        }
    
        return depth;
    }
}