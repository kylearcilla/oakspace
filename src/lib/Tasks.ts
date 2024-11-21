import { writable, type Writable } from "svelte/store"

const DEFAULT_MAX_DEPTH = 5

/**
 * Stores and managese a collection of nested tasks using a directed graph.
 */
export class Tasks {
    private taskMap: Map<string, Task>
    private adjacencyList: Map<string | null, string[]>
    private readonly maxDepth: number;
    private openSubtasks: Set<string>

    _store: Writable<Tasks>

    constructor(options: { tasks: Task[], maxDepth?: number }) {
        const { tasks, maxDepth = DEFAULT_MAX_DEPTH } = options
        this._store = writable(this)

        this.taskMap = new Map()
        this.adjacencyList = new Map()
        this.maxDepth = maxDepth
        this.openSubtasks = new Set
        
        tasks.forEach((task) => this.addTask({ task }))
    }

    getTask(id: string): Task | undefined  {
        return this.taskMap.get(id)
    }

    getLength() {
        return this.taskMap.size
    }

    addTask(args: { task: Task, type?: "init" | "new", doUpdate?: boolean }) {
        const { task, type = "init", doUpdate = true } = args

        // create parent if there isn't one
        if (!this.adjacencyList.has(task.parentId)) {
            this.adjacencyList.set(task.parentId!, [])
        }

        // add as child to parent
        // root tasks will have "null" as a parent
        this.adjacencyList.get(task.parentId)!.push(task.id)

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

    private shiftNeighbors(args: {
        parentId: string | null
        idx: number
        shiftDirection: 1 | -1
    }) {
        const { parentId, idx, shiftDirection } = args
        const siblings = this.getSiblings(parentId)

        if (siblings.length === idx) return
        
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i]
            if (sibling && sibling.idx >= idx) {
                sibling.idx += shiftDirection
            }
        }
    }

    removeTask(taskId: string) {
        const task = this.taskMap.get(taskId)!
        const parentId = task.parentId

        // remove children
        const children = this.adjacencyList.get(taskId) || []
        children.forEach((childId) => this.removeTask(childId))

        // remove references
        this.taskMap.delete(taskId)
        this.adjacencyList.delete(taskId)

        // shift sibling indices
        this.shiftNeighbors({
            parentId: task.parentId,
            idx: task.idx + 1,
            shiftDirection: -1,
        })

        // remove self from parent's children
        const siblings = this.getSiblings(parentId)
                            .map((s) => s?.id)
                            .filter((id) => id !== taskId)

        this.adjacencyList.set(parentId, siblings)
        this._store.set(this)
    }

    duplicateTask(dupId: string) {
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
    }

    moveTask(taskId: string, newParentId: string | null, newIndex: number) {
        const task = this.taskMap.get(taskId)
        if (!task) return

        // Remove task from current parent's adjacency list
        if (task.parentId !== null) {
            const siblings = this.adjacencyList.get(task.parentId) || []
            this.adjacencyList.set(
                task.parentId,
                siblings.filter((id) => id !== taskId)
            )
        }

        // Update task's parentId
        task.parentId = newParentId

        // Add task to new parent's adjacency list at the specified index
        const newSiblings = this.adjacencyList.get(newParentId) || []
        newSiblings.splice(newIndex, 0, taskId)
        this.adjacencyList.set(newParentId, newSiblings)

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
        
        console.log(structuredClone(task))
        task[type] = text
        console.log(task)
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
        const subtasks = this.adjacencyList.get(id) || []

        subtasks.forEach((subtaskId) => {
            this._toggleComplete(subtaskId, isChecked)
        })
    }

    getHierarchy(parentId: string | null = null): Task[] {
        return (this.adjacencyList.get(parentId) || []).map((childId) => {
            const task = this.taskMap.get(childId)!;
            return {
                ...task,
                subtasks: this.getHierarchy(task.id),
            }
        })
    }

    isRootTask(id: string) {
        const rootTaskIds = this.adjacencyList.get(null) ?? []
        return rootTaskIds.includes(id)
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
        const childrenIds = this.adjacencyList.get(taskId) || []

        for (const childId of childrenIds) {
            const childTask = this.taskMap.get(childId)!

            subtasks.push(childTask)
        }
        return subtasks
    }

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