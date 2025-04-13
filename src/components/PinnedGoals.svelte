<script lang="ts">
    import GoalCard from "$components/GoalCard.svelte"
	import EmptyList from "$components/EmptyList.svelte"

    export let goals: Goal[]
    export let onReorder: (srcGoal: Goal, targetGoal: Goal) => void
    
    // for goal view manager used in goals page
    export let dragTarget: GoalDragTarget | null | undefined = undefined
    export let onDragEnter: ((e: DragEvent, goal: Goal) => void) | undefined = undefined
    export let onDragLeave: (() => void) | undefined = undefined
    
    let srcGoal: Goal | null = null
    let targetGoal: Goal | null = null
    let listRef: HTMLElement
    let insideDrag = false  // draggin within inside

    $: if (!dragTarget) targetGoal = null
    
    function sortCallback(a: Goal, b: Goal) {
        return a.pinIdx! - b.pinIdx!
    }

    /* reorder */
    function onInDragStart(e: DragEvent, goal: Goal) {
        if (!insideDrag) {
            e.preventDefault()
            return
        }
    
        // inside dragging only
        srcGoal = goal 
        listRef.addEventListener("dragover", onInDragOver)
        listRef.addEventListener("dragend", onInDragEnd)

        e.dataTransfer?.setData("text", "")
        e.dataTransfer!.effectAllowed = "move"
    }
    function onInDragOver(e: DragEvent) {
        e.preventDefault()

        const target = e.target as HTMLElement
        const elem = target.closest(".card-container") as HTMLElement

        if (elem) {
            const id = elem.dataset.id || ""

            if (id !== targetGoal?.id) {
                targetGoal = goals.find(g => g.id === id)!
            }
        }
    }
    function onInDragEnd() {
        if (srcGoal && targetGoal && srcGoal.id !== targetGoal.id) {
            onReorder(srcGoal, targetGoal)
        }

        listRef.removeEventListener("dragover", onInDragOver)
        listRef.removeEventListener("dragend", onInDragEnd)
        
        srcGoal = null
        targetGoal = null
        insideDrag = false
    }
</script>

<div class="pinned" role="list" bind:this={listRef}>
    {#each goals.sort((a, b) => sortCallback(a, b)) as goal, _ (goal.id)}
        <div 
            role="listitem"
            data-drag-context={"pinned-goal"}
            data-idx={goal.pinIdx}
            data-id={goal.id}
            aria-label="listitem"
            class="card-container drop-left-border"
            class:drop-left-border--over={targetGoal?.id === goal.id}
            draggable="true"
            on:dragstart={(e) => {
                // all listeners below are for dragging from outside
                onInDragStart(e, goal)
            }}
            on:dragleave|self={() => {
                targetGoal = null

                if (!insideDrag && onDragLeave) {
                    onDragLeave()
                }
            }}
            on:dragover={(e) => {
                if (!insideDrag) {
                    e.preventDefault()
                }
            }}
            on:dragenter={(e) => {
                if (!insideDrag && onDragEnter) {
                    onDragEnter(e, goal)
                }
                if (!insideDrag) {
                    targetGoal = goal
                }
            }}
        >
            <div 
                class="drag-handle"
                on:pointerdown={() => insideDrag = true}
                on:pointerup={() => insideDrag = false}
            >
            </div>
            <div class:no-pointer-events={!!targetGoal}>
                <GoalCard options={{ type: "hoz", tag: true, img: true }} {goal} />
            </div>
        </div>
    {:else}
        <div class="empty">
            <EmptyList 
                emptyText="Pinned goals go here."
                subtitle="What Gets Seen, Gets Done"
            />
        </div>
    {/each} 
</div>

<style lang="scss">
    .pinned {
        display: flex;
        padding-bottom: 4px;
        overflow-x: auto;
        width: 100%;
    }
    
    .card-container {
        min-width: max-content;
        position: relative;
    }

    .drag-handle {
        @include abs-top-left;
        width: calc(100% - 10px);
        height: 2px;
        cursor: grab;
        z-index: 100;

        &:active {
            cursor: grabbing;
        }
    }
    .empty {
        width: 100%;
        @include center;
        height: 80px;
    }
</style>