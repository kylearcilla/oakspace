<script lang="ts">
	import { TEST_GOALS } from "$lib/mock-data"
	import GoalCard from "../../../components/GoalCard.svelte";

    const COL_IDS = ["not-started", "in-progress", "accomplished"] 
    
    const COL_ID_MAP: { [key: string]: number } = {
        "not-started": 0,
        "in-progress": 1,
        "accomplished": 2,
    }
    
    const _goals = TEST_GOALS
    
    let goals: Goal[][] = []

    let isDragging = false
    let dragGoalSrc: Goal | null = null
    let dragGoalTarget: Goal | null = null

    sortGoals(_goals)

    function sortGoals(n: Goal[]) {
        goals = [
            n.filter(goal => goal.status === "not-started")
                .sort((a, b) => a.order.progress - b.order.progress),
            
            n.filter(goal => goal.status === "in-progress")
                .sort((a, b) => a.order.progress - b.order.progress),

            n.filter(goal => goal.status === "accomplished")
                .sort((a, b) => a.order.progress - b.order.progress)
        ]
    }

    /* drag */
    function onGoalDrag(e: DragEvent, goal: any) {
        e.dataTransfer.effectAllowed = "move"

        if (!isDragging) {
            e.preventDefault()
            console.log("A")
            return
        }

        dragGoalSrc = goal
    }
    function onGoalDragOver(e: DragEvent, target: any) {
        e.preventDefault()

        if (typeof target == "string") {
            dragGoalTarget = target
        }
        if (target?.name != dragGoalSrc?.name) {
            dragGoalTarget = target
        }
    }
    function onDragLeave() {
        dragGoalTarget = null
    }
    function onGoalDragEnd() {
        if (dragGoalTarget) {
            reorderBoard(dragGoalSrc, dragGoalTarget)
        }
        isDragging = false
        dragGoalSrc = null
        dragGoalTarget = null
    }
    function reorderBoard(srcGoal: Goal | string, targetGoal: Goal | string) {
        const toLast  = typeof targetGoal === "string"
        const srcStatus = srcGoal.status
        const targetStatus  = toLast ? targetGoal : targetGoal.status

        const srcSecIdx = COL_ID_MAP[srcStatus]
        const toSecIdx  = COL_ID_MAP[targetStatus]
        const sameSec   = srcSecIdx === toSecIdx

        const srcOrder  = srcGoal.order.progress
        const lastOrder = _goals.filter((goal: any) => goal.status === targetStatus).length 

        const toIdx       = toLast ? lastOrder : targetGoal.order.progress
        const betweenSec  = srcStatus != targetStatus
        const direction   = (betweenSec ? srcSecIdx < toSecIdx : srcOrder < toIdx) ? "up" : "down"

        const targetOrder = Math.max(toIdx + (direction === "up" && sameSec ? -1 : 0), 0)

        _goals
            .filter((goal: Goal) => goal.status === srcStatus)
            .forEach((goal: Goal) => {
                if (direction === "up" && goal.order.progress > srcOrder) {
                    goal.order.progress--
                } 
                else if (!sameSec && direction === "down" && goal.order.progress > srcOrder) {
                    goal.order.progress--
                }
                else if (sameSec && direction === "down" && goal.order.progress < srcOrder) {
                    goal.order.progress++
                }
            })
        _goals
            .filter((goal: Goal) => goal.status === targetStatus)
            .forEach((goal: Goal) => {
                if (direction === "up" && goal.order.progress >= targetOrder) {
                    goal.order.progress++
                } 
                else if (!sameSec && direction === "down" && goal.order.progress >= targetOrder) {
                    goal.order.progress++
                }
                else if (sameSec && direction === "down" && goal.order.progress <= targetOrder) {
                    goal.order.progress--
                }
            })

        srcGoal.order.progress = targetOrder
        srcGoal.status = targetStatus 

        sortGoals(_goals)
    }
    
</script>

<div class="goals">
        {#each ["Not Started", "In Progress", "Accomplished"] as col, idx}
            {@const colId = COL_IDS[idx]}
            <div class="goals__col">
                <div class="goals__col-header">
                    <div class={`goals__col-title goals__col-title--${colId}`}>
                        <div class="goals__col-icon">
                            {idx === 0 ? "📌" : idx === 1 ? "✍️" : "🎉"}
                        </div>
                        {col}
                    </div>
                    <div class="goals__col-count">
                        {goals[idx].length}
                    </div>
                </div>
                <div class="goals__list">
                    {#each goals[idx] as goal (goal.name + `${idx}`)}
                        <div 
                            draggable="true"
                            on:dragstart={(e) => onGoalDrag(e, goal)}
                            on:dragover={(e) => onGoalDragOver(e, goal)}
                            on:dragleave={onDragLeave}
                            on:dragend={onGoalDragEnd}
                            class="goals__goal"
                            class:goals__goal--drag-over={dragGoalTarget?.name === goal.name}
                        >
                            <div 
                                class="goals__goal-handle"
                                on:pointerdown={() => isDragging = true}
                                on:pointerup={() => isDragging = false}    
                            >
                            </div>
                            <GoalCard 
                                {goal} 
                                onClick={() => {}}
                                options={{ 
                                    img: true, due: false, completed: col === "Accomplished" }}
                            />
                        </div>
                    {/each}
                    <div 
                        on:dragover={(e) => onGoalDragOver(e, colId)}
                        on:dragleave={onDragLeave}
                        on:dragend={onGoalDragEnd}
                        class="goals__goal goals__goal--ghost"
                        class:goals__goal--drag-over={dragGoalTarget === colId}
                    >
                    </div>
                </div>
            </div>
        {/each}
</div>

<style lang="scss">
    .goals {
        margin-top: 12px;
        display: flex;
        max-width: 620px;

        &__col {
            width: calc(100% / 3);
            margin-right: 25px;
        }
        &__col-header {
            @include flex(center, space-between);
            padding: 2px 2px 2px 2px;;
            border-radius: 12px;
            margin-bottom: 8px;
            white-space: nowrap;
        }
        &__col-icon {
            font-size: 1rem;
            margin: 1px 10px 0px 0px;
            color: white !important;
        }
        &__col-title {
            @include text-style(_, 500, 1.2rem);
            display: flex;
            padding: 4px 15px 7px 10px;
            border-radius: 8px;
            margin-right: 10px;

            &--not-started {
                color: rgba(var(--textColor1), 0.5);
                background-color: rgba(var(--textColor1), 0.03);
            }
            &--in-progress {
                color: #F9E59D;
                background-color: rgba(#F9E59D, 0.04);
            }
            &--accomplished {
                color: #D4F1AD;
                background-color: rgba(#D4F1AD, 0.05);
            }
        }
        &__col-count {
            @include text-style(0.2, 400, 1.25rem, "DM Mono");
        }
        &__list {
            position: relative;
            max-width: 200px;
        }
        &__goal {
            position: relative;
            
            &--ghost {
                height: 60px;
                width: 100%;
            }
            &--drag-over::before {
                opacity: 0.4!important;
            }
            &::before {
                opacity: 0;
                content: " ";
                width: calc(100% - 20px);
                height: 2px;
                transition: 0.08s ease-in-out;
                @include abs-top-left(-4px, 10px);
                background-color: #71B8FF;
            }
        }
        &__goal-handle {
            width: 100%;
            height: 5px;
            @include abs-top-left;
            cursor: grab !important;
            z-index: 10;
            
            &:active {
                cursor: grabbing !important;
            }
        }
    }
</style>