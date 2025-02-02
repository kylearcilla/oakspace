<script lang="ts">
	import { onMount } from "svelte";
    import { getColorTrio } from "$lib/utils-colors"
	import GoalCard from "../../../components/GoalCard.svelte";
	import { getTagFromName, kebabToNormal } from "../../../lib/utils-general";
	import { themeState } from "../../../lib/store";

    export let manager: GoalsManager
    export let options: GoalsView
    export let pinnedGoal: Goal

    let store: GoalsViewState | null = null
    let containerRef: HTMLElement
    let width = 0

    $: grouping = options.grouping
    $: showProgress = options.showProgress
    $: showDue = options.due
    $: dueType = options.dueType
    $: isLight = !$themeState.isDarkTheme

    $: manager.initSections(grouping)
    $: if (manager.state) {
        manager.state.subscribe((data) => {
            store = data
        })
    }

    function update() {
        grouping = options.boardGrouping
    }
    onMount(() => manager.initContainerRef(containerRef))
</script>

<div 
    bind:this={containerRef}
    bind:clientWidth={width}
    class="goals"
    class:goals--light={isLight}
    class:goals--tag-view={grouping === "tag"}
>
    {#if store}
        {@const { sortedGoals, sections, dragTarget, editGoal, pinnedGoal } = store }

        {#each sections as section, secIdx (secIdx)}
            {@const sec = kebabToNormal(section)}
            {@const goals = sortedGoals[secIdx]}
            {@const isTag    = grouping === "tag"}
            {@const tag      = isTag ? getTagFromName(sec) : undefined}
            {@const tagColor = isTag ? getColorTrio(tag.symbol.color, isLight) : ["", "", ""]}
            {@const { done, total } = manager.getSectionProgress(secIdx)}

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
                        <div class:tag__title={isTag} style:margin-top={"1px"}>
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
                        {/if}
                    </div>
                </div>
                <div class="goals__list">
                    {#each goals as goal (goal.id)}
                        <div 
                            draggable="true"
                            data-idx={goal.bOrder.status}
                            class="goals__goal dg-over-el"
                            class:dg-over-el--over={dragTarget?.name === goal.name}
                            class:hidden={pinnedGoal?.id === goal.id}
                            on:dragstart={(e) => manager.onDrag(e, goal)}
                            on:dragover={(e) => manager.onDragOver(e, goal)}
                            on:dragleave={(e) => manager.onDragLeave(e)}
                            on:dragend={(e) => manager.onDragEnd(e)}
                            on:contextmenu={(e) => manager.onContextMenu(e, goal)}
                        >
                            <div 
                                class="goals__goal-handle"
                                on:pointerdown={() => manager.setDragState("goal")}
                                on:pointerup={() => manager.setDragState(null)}    
                            >
                            </div>
                            <GoalCard 
                                {goal} 
                                highlighted={editGoal?.id === goal.id}
                                options={{ 
                                    img: true, 
                                    due: showDue,
                                    tag: grouping === "status",
                                    completed: sec === "Accomplished", 
                                    progress: showProgress,
                                    dueType
                                }}
                            />
                        </div>
                    {/each}
                    <div 
                        class="goals__goal goals__goal--ghost dg-over-el"
                        class:dg-over-el--over={dragTarget === section}
                        on:dragover={(e) => manager.onDragOver(e, section)}
                        on:dragleave={(e) => manager.onDragLeave(e)}
                        on:dragend={(e) => manager.onDragEnd(e)}
                    >
                    </div>
                </div>
            </div>
        {/each}
    {/if}
</div>

<style lang="scss">
    .goals {
        display: flex;
        
        &--light &__col-count {
            @include text-style(0.35);
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
            min-width: 200px;
            max-width: 200px;
            margin-right: 15px;
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
            @include text-style(_, var(--fw-400-500), 1.3rem);
            display: flex;
            padding: 4px 15px 6px 10px !important;
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
            @include text-style(0.35, 500, 1.25rem, "Geist Mono");
        }
        &__list {
            position: relative;
            width: 200px;
        }
        &__goal {
            position: relative;
            
            &--ghost {
                height: 60px;
                width: 100%;
            }
        }
        .fraction {
            margin: -3px 0px 0px 0px;
            opacity: 0.4;
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