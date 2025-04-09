<script lang="ts">
    import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
    import { getColorTrio } from "$lib/utils-colors"
	import type { GoalsViewManager } from "$lib/goals-view-manager"
	import { getPeriodType, setViewGoalNew } from "$lib/utils-goals"
	import { getTagFromName, kebabToNormal } from "$lib/utils-general"

	import SvgIcon from "$components/SVGIcon.svelte";
	import GoalCard from "$components/GoalCard.svelte"

    export let manager: GoalsViewManager
    export let options: GoalsBoardOptions
    export let pinnedGoal: Goal | null

    let state: GoalsViewState | null = null
    let uiState: GoalsViewUIState | null = null
    let srcGoal: Goal | null = null

    $: isLight = !$themeState.isDarkTheme
    $: grouping = options.grouping
    $: showProgress = options.showProgress
    $: showDue = options.due
    $: dueType = options.dueType
    $: imgs = options.imgs
    $: manager.initSections(grouping)

    manager.state.subscribe((data: GoalsViewState) => {
        state = data
    })
    manager.uiState.subscribe((data: GoalsViewUIState) => {
        srcGoal = manager.dragSrc
        uiState = data
    })
    function getOrder(goal: Goal) {
        const period = manager.timeFrame!.period
        const time = getPeriodType(period)
        const key = `${time[0]}_order` as keyof Goal
        const orderObj = goal[key] as Record<string, number>

        return orderObj[grouping]
    }
    function getDragTargetId() {
        if (!uiState!.dragTarget) return null
        const data = uiState!.dragTarget!.data

        // either section name or goal id
        if (typeof data === "string") {
            return data
        }
        else {
            return (data as Goal).id
        }
    }
</script>

<div 
    class="goals"
    class:goals--light={isLight}
    class:goals--tag-view={grouping === "tag"}
>
    {#if state && uiState}
        {@const { sortedGoals, sections } = state }
        {@const { dragTarget, editGoal } = uiState }
        {@const dtargetId = dragTarget?.type === "goal" ? getDragTargetId() : null}

        {#each sections as section, secIdx (secIdx)}
            {@const sec = kebabToNormal(section)}
            {@const goals = sortedGoals[secIdx]}
            {@const isTag    = grouping === "tag"}
            {@const tag      = isTag ? getTagFromName(sec) : undefined}
            {@const tagColor = isTag && tag ? getColorTrio(tag.symbol.color, isLight) : ["", "", ""]}
            {@const { done, total } = manager.getSectionProgress(secIdx)}
            {@const sectionContext = manager.getSectionContext(section)}
            {@const timeFrame = manager.timeFrame}

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
                            class:hidden={isTag && tag?.id === "*"}
                        >
                            {#if isTag && tag}
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
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div 
                            data-idx={`${getOrder(goal)}`}
                            draggable="true"
                            data-drag-context={"goal"}
                            class="goals__goal drop-top-border"
                            class:drop-top-border--over={srcGoal && dtargetId === goal.id}
                            on:dragstart={(e) => manager.onDrag(e, goal)}
                            on:dragend={(e) => manager.onDragEnd()}
                            on:dragover={(e) => e.preventDefault()}
                            on:dragenter={(e) => manager.onDragEnter(e, goal)}
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
                                pinned={pinnedGoal?.id === goal.id}
                                highlighted={editGoal?.id === goal.id}
                                options={{ 
                                    img: imgs, 
                                    due: showDue,
                                    tag: grouping === "status",
                                    progress: showProgress,
                                    dueType
                                }}
                            />
                        </div>
                    {/each}
                    <div style:position="relative">
                        <button 
                            class="goals__new-btn"
                            on:click={() => setViewGoalNew({ timeFrame, section: sectionContext })}
                        >
                            <div>
                                <SvgIcon 
                                    icon={Icon.Add} 
                                    options={{ scale: 1.125, strokeWidth: 1.4, opacity: 0.4 }}
                                />
                            </div>
                            <span>New Goal</span>
                        </button>
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div 
                            data-drag-context={"goal"}
                            class="goals__goal goals__goal--ghost drop-top-border"
                            class:hidden={!srcGoal}
                            class:drop-top-border--over={dtargetId === section}
                            on:dragenter={(e) => manager.onDragEnter(e, section)}
                            on:dragleave={() => manager.resetGoalsDragTarget()}
                            on:dragover={(e) => e.preventDefault()}
                            on:dragend={() => manager.onDragEnd()}
                        >
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    {/if}
</div>

<style lang="scss">
    .goals {
        display: flex;
        overflow-x: scroll;
        padding-bottom: 100px;
        --bg-opacity: 0.006;

        &--light {
            --bg-opacity: 0.025;
        }
        &--light &__new-btn {
            background-color: rgba(var(--textColor1), 0.055);
            opacity: 0.6;
        }
        &--light &__new-btn:hover {
            opacity: 1;
        }
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
            min-width: 230px;
            max-width: 230px;
            margin-right: 15px;
            background-color: rgba(var(--textColor1), var(--bg-opacity));
            padding: 8px 10px 10px 9px;
            border-radius: 10px;
            height: min-content;
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
            padding: 4px 13px 6px 9px !important;
            border-radius: 4px;
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
            @include text-style(0.35, var(--fw-400-500), 1.3rem);
        }
        &__list {
            position: relative;
            width: calc(100% + 7px);
        }
        &__goal {
            position: relative;

            &--ghost {
                height: 60px;
                width: 100%;
                @include abs-top-left;
            }
        }
        &__goal-handle {
            width: 100%;
            height: 5px;
            @include abs-top-left();
            cursor: grab !important;
            z-index: 10;
            
            &:active {
                cursor: grabbing !important;
            }
        }
        &__new-btn {
            @include flex(center);
            @include text-style(0.35, var(--fw-400-500), 1.4rem);
            width: calc(100% - 36px);
            background-color: rgba(var(--textColor1), 0.02);
            opacity: 0.4;
            padding: 9px 14px 10px 14px;
            border-radius: 8px;
            border: 1px solid rgba(var(--textColor1), 0.015);

            &:hover {
                opacity: 0.8;
            }
            span {
                margin-left: 10px;
            }
        }
        .fraction {
            margin: -3px 0px 0px 0px;
            opacity: 0.4;
        }
        .tag {
            &__title {
                font-size: 1.25rem;
            }
        }
        .drop-top-border::before {
            cursor: default !important;
        }
    }
</style>