<script lang="ts">
	import { TEST_GOALS } from "$lib/mock-data"
	import GoalCard from "../../../components/GoalCard.svelte";
	import ProgressRing from "../../../components/ProgressRing.svelte";
	import { themeState } from "../../../lib/store";
	import { getTagFromName, kebabToNormal } from "../../../lib/utils-general";
    import { getColorTrio } from "$lib/utils-colors"
	import { getSectionProgress, reorderGoals, sectionGoals } from "../../../lib/utils-goals"

    export let options: {
        grouping?: "tag" | "status"
    } | undefined = undefined

    let goals = TEST_GOALS
    let sortedGoals: Goal[][] = []
    let grouping = options?.grouping ?? "status"

    const tags: Tag[] = Array.from(new Set(TEST_GOALS.map(goal => goal.tag)))
    const tagsStr     = tags.map((tag) => tag.name)
    const statuses    = ["not-started", "in-progress", "accomplished"]

    let isDragging = false
    let dragGoalSrc: Goal | null = null
    let dragGoalTarget: Goal | null = null

    let sections = statuses    
    let sectionMap: { [key: string]: number } 

    $: isLight = !$themeState.isDarkTheme
    $: if (options?.grouping) {
        initSections()
    }

    function initSections() {
        grouping = options.grouping
        if (grouping === "status") {
            sections = statuses
        }
        else {
            sections = tagsStr
        }
        initSecMap()
        sortGoals()
    }
    function initSecMap() {
        sectionMap = {}
        sections.forEach((name, idx) => sectionMap[name] = idx)
    }
    function sortGoals() {
        sortedGoals = []
        sortedGoals = sectionGoals({ sections, goals, grouping })
    }

    /* drag */
    function onGoalDrag(e: DragEvent, goal: any) {
        e.dataTransfer.effectAllowed = "move"

        if (!isDragging) {
            e.preventDefault()
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
    function reorderBoard(srcGoal: Goal | string, target: Goal | string) {
        reorderGoals({ srcGoal, target, goals, grouping, sectionMap })
        sortGoals()
    }
    
</script>

<div 
    class="goals"
    class:goals--light={isLight}
    class:goals--tag-view={grouping === "tag"}
>
    {#each sections as section, secIdx (secIdx)}
        {@const sec = kebabToNormal(section)}
        {@const goals = sortedGoals[secIdx]}
        {@const isTag    = grouping === "tag"}
        {@const tag      = isTag ? getTagFromName(sec) : undefined}
        {@const tagColor = isTag ? getColorTrio(tag.symbol.color, isLight) : ["", "", ""]}
        {@const { done, total } = getSectionProgress({ sortedGoals, secIdx })}

        <div class="goals__col">
            <div class="goals__col-header">
                <div 
                    class={`goals__col-name-container goals__col-name-container--${section}`}
                    class:tag={isTag}
                    class:tag--light={isTag && isLight}
                    style:--tag-color-primary={tag?.symbol.color.primary}
                    style:--tag-color-1={tagColor[0]}
                    style:--tag-color-2={tagColor[1]}
                    style:--tag-color-3={tagColor[2]}
                >
                    <div 
                        class="goals__col-icon"
                        class:tag__symbol={isTag}
                    >
                        {#if isTag}
                            {tag.symbol.emoji}
                        {:else}
                            {secIdx === 0 ? "📌" : secIdx === 1 ? "✍️" : "🎉"}
                        {/if}
                    </div>
                    <div class="goals__col-name" class:tag__title={isTag}>
                        {sec}
                    </div>
                </div>
                <div class="goals__col-count flx">
                    {#if !isTag}
                        {sortedGoals[secIdx].length}
                    {:else if total > 0}
                        <div class="fraction">
                            {Math.floor(done / total * 100)}%
                        </div>
                        <div class="goals__progress-ring">
                            <ProgressRing 
                                progress={done / total} 
                                options={{ style: "rich-colored" }}    
                            />
                        </div>
                    {/if}
                </div>
            </div>
            <div class="goals__list">
                {#each goals as goal (goal.name + `${secIdx}`)}
                    <div 
                        draggable="true"
                        on:dragstart={(e) => onGoalDrag(e, goal)}
                        on:dragover={(e) => onGoalDragOver(e, goal)}
                        on:dragleave={onDragLeave}
                        on:dragend={onGoalDragEnd}
                        class="goals__goal dg-over-el"
                        class:dg-over-el--over={dragGoalTarget?.name === goal.name}
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
                                img: true, 
                                due: false,
                                tag: grouping === "status",
                                completed: sec === "Accomplished", 
                                progress: "default"
                        }}
                        />
                    </div>
                {/each}
                <div 
                    on:dragover={(e) => onGoalDragOver(e, section)}
                    on:dragleave={onDragLeave}
                    on:dragend={onGoalDragEnd}
                    class="goals__goal goals__goal--ghost dg-over-el"
                    class:dg-over-el--over={dragGoalTarget === section}
                >
                </div>
            </div>
        </div>
    {/each}
</div>

<style lang="scss">
    .goals {
        display: flex;
        
        &--light &__col-name-container {
            font-weight: 600;
        }
        &--light &__col-count {
            @include text-style(0.35, 500);
        }
        &--light &__col-name-container--not-started {
            color: rgba(var(--textColor1), 0.8);
            background-color: rgba(var(--textColor1), 0.05);
        }
        &--light &__col-name-container--in-progress {
            color: #846e41;
            background-color: #FEF4BF;
        }
        &--light &__col-name-container--accomplished {
            color: #537151;
            background-color: #e5f2c9;
        }
        &--light &__col-count .fraction {
            font-weight: 500;
        }

        &__col {
            min-width: 190px;
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
        &__col-name-container {
            @include text-style(_, 500, 1.28rem);
            display: flex;
            padding: 4px 15px 5px 10px !important;
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
            @include text-style(0.35, 400, 1.25rem, "DM Sans");
        }
        &__list {
            position: relative;
            max-width: 205px;
        }
        &__goal {
            position: relative;
            
            &--ghost {
                height: 60px;
                width: 100%;
            }
        }
        .fraction {
            margin: -3px 7px 0px 0px;
            opacity: 0.7;
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
        .tag {
            &__title {
                font-size: 1.25rem;
            }
        }
    }
</style>