<script lang="ts">
	import { onMount } from "svelte"
	import { themeState } from "$lib/store"

    import { Icon } from "$lib/enums"
	import { getColorTrio } from '$lib/utils-colors'
	import { kebabToNormal } from "$lib/utils-general"
	import type { GoalsViewManager } from "$lib/goals-view-manager"
    import { getDueDateDistStr, getPeriodType, setViewGoal, setViewGoalNew } from "$lib/utils-goals"

	import SvgIcon from "$components/SVGIcon.svelte";
	import ProgressBar from "$components/ProgressBar.svelte"

    export let timeFrame: { year: number, period: string }
    export let manager: GoalsViewManager
    export let options: GoalsListOptions
    export let pinnedGoal: Goal | null

    let state: GoalsViewState | null = null
    let uiState: GoalsViewUIState | null = null
    
    let width = 0
    let containerRef: HTMLElement
    let srcGoal: Goal | null = null
    
    $: isLight = !$themeState.isDarkTheme
    $: grouping = options.grouping
    $: showProgress = options.showProgress
    $: showDue = options.due
    $: dueType = options.dueType

    $: manager.initSections(grouping)
    
    $: if (manager.state) {
        manager.state.subscribe((data: GoalsViewState) => {
            state = data
        })
        manager.uiState.subscribe((data: GoalsViewUIState) => {
            srcGoal = manager.dragSrc
            uiState = data
        })
    }
    function getDueString(goal: Goal, type: "distance" | "date") {
        const { due, dueType } = goal
        return getDueDateDistStr({ due, dueType, type })
    }
    function getOrder(goal: Goal) {
        const time = getPeriodType(timeFrame.period)
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
    onMount(() => manager.initContainerRef(containerRef))
</script>

<svelte:window on:keydown={(ke) => manager.handleKeydown(ke)} />

<div
    bind:this={containerRef}
    bind:clientWidth={width}
    class={`goals goals--${grouping}`}
    class:goals--sm={width < 600}
    class:goals--light={isLight}
>
    {#if state && uiState}
        {@const { sortedGoals, sections } = state }
        {@const { closedSections, openGoalId, dragTarget } = uiState }
        {@const dtargetId = dragTarget?.type === "goal" ? getDragTargetId() : null}

        {#each sections as section, secIdx (secIdx)}
            {@const closed   = closedSections[secIdx]}
            {@const goals    = sortedGoals[secIdx]}
            {@const { done: secDone, total: secTotal } = manager.getSectionProgress(secIdx)}
            {@const sectionName = kebabToNormal(section)}
            {@const tagSectionEmpty = grouping === "tag" && goals.length === 0}
            {@const sectionContext = manager.getSectionContext(section)}
            
            {#if !tagSectionEmpty}
                <div 
                    class="goals__section"
                    class:goals__section--first={secIdx === 0}
                >
                    <div class="goals__section-divider divider"></div>
                    <!-- header -->
                    <div 
                        role="button"
                        tabindex="0"
                        class="goals__section-header"
                        id={`section--${secIdx}`}
                        data-type="section"
                        data-idx={secIdx}
                    >
                        <div 
                            class="goals__section-header-inner"
                            class:goals__section-header-inner--empty={sectionName === "Empty"}
                        >
                            <div 
                                class="goals__section-name" 
                                title={sectionName}
                            >
                                {sectionName}
                            </div>
                            <div class="goals__section-count">
                                {goals.length}
                            </div>
                            <button 
                                class="toggle-arrow toggle-arrow--section"
                                class:toggle-arrow--closed={closed}
                                class:hidden={goals.length === 0}
                                style:margin-left={"18px"}
                                on:click={() => manager.toggleSectionOpen(secIdx)}
                            >
                                <SvgIcon 
                                    icon={Icon.Dropdown}
                                    options={{
                                        scale: 1.2, height: 12, width: 12, strokeWidth: 1.4
                                    }}
                                />
                            </button>
                            <button 
                                class="goals__plus-btn"
                                on:click={() => setViewGoalNew({ 
                                    timeFrame, 
                                    section: sectionContext
                                })}
                            >
                                <SvgIcon 
                                    icon={Icon.Add} 
                                    options={{ scale: 1, strokeWidth: 1.4, opacity: 0.4 }}
                                />
                            </button>
                        </div>
                        {#if goals.length > 1 && grouping === "tag"}
                            <div class="goals__section-progress">
                                <ProgressBar progress={secDone / secTotal}/>
                            </div>
                        {/if}
                    </div>
                    <!-- section goals -->
                    {#if !closed}
                        <div 
                            style:margin-bottom="0px"
                            style:position="relative"
                        >
                            {#each goals as goal, goalIdx (goal.id)}
                                {@const { name, tag, description, status } = goal}
                                {@const { checkCount, total } = manager.getGoalProgress(goal)}
                                {@const tagColor = tag ? getColorTrio(tag.symbol.color, isLight) : ["", "", ""]}
                                {@const open = openGoalId === goal.id}
                                {@const pinned = pinnedGoal?.id === goal.id}
                                {@const checked = status === "accomplished"}

                                <div
                                    role="button"
                                    tabindex="0"
                                    id={`goal--${secIdx}-${goalIdx}`}
                                    data-idx={`${getOrder(goal)}`}
                                    data-drag-context={"goal"}
                                    draggable="true"
                                    class="goals__goal drop-top-border"
                                    class:goals__goal--checked={checked}
                                    class:goals__goal--open={open}
                                    class:drop-top-border--over={srcGoal && goal.id === dtargetId}
                                    on:dragstart={(e) => manager.onDrag(e, goal)}
                                    on:dragend={() => manager.onDragEnd()}
                                    on:dragover={(e) => e.preventDefault()}
                                    on:dragenter={(e) => manager.onDragEnter(e, goal)}
                                    on:contextmenu={(e) => { 
                                        manager.onContextMenu(e, goal)
                                    }}
                                >
                                    <div class="goals__goal-top">
                                        <div class="flx flx--algn-start">
                                            <button 
                                                class="goals__goal-checkbox"
                                                class:goals__goal-checkbox--checked={checked}
                                                on:click={() => {
                                                    manager.toggleGoalStatus(goal)
                                                }}
                                            >
                                                <i class="fa-solid fa-check"></i>
                                            </button>
                                            <button 
                                                class="goals__goal-name"
                                                class:strike={checked}
                                                on:click={() => {
                                                    setViewGoal(goal)
                                                }}
                                            >
                                                {name}
                                            </button>
                                            {#if pinned}
                                                <div style:margin={"2px 0px 0px 10px"}>
                                                    <SvgIcon 
                                                        icon={Icon.Pin} 
                                                        options={{ scale: 1, opacity: 0.2, strokeWidth: 0.4 }} 
                                                    />
                                                </div>
                                            {/if}
                                            {#if total > 0 && showProgress}
                                                <div class="goals__goal-progress">
                                                    <ProgressBar progress={checkCount / total} />
                                                </div>
                                            {/if}
                                        </div>
                                        <div class="flx">
                                            {#if goal.due && showDue}
                                                {@const { dueStr, isLate } = getDueString(goal, dueType)}
                                                <div 
                                                    class="goals__goal-due"
                                                    class:goals__goal-due--late={isLate}
                                                    class:white={dueStr === "🤞"}
                                                >
                                                    {dueStr}
                                                </div>
                                            {/if}
                                            {#if tag}
                                                <div class="goals__goal-tag">
                                                    <div 
                                                        class="tag"
                                                        class:tag--empty={sectionName === "Empty"}
                                                        class:tag--light={isLight}
                                                        style:--tag-color-primary={tag.symbol.color.primary}
                                                        style:--tag-color-1={tagColor[0]}
                                                        style:--tag-color-2={tagColor[1]}
                                                        style:--tag-color-3={tagColor[2]}
                                                    >
                                                        <div class="tag__symbol" style:font-size="1.1rem">
                                                            {tag.symbol.emoji}
                                                        </div>
                                                        <div class="tag__title">
                                                            {tag.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            {/if}
                                        </div>
                
                                        {#if goalIdx != goals.length - 1}
                                            <div class="goals__goal-divider divider"></div>
                                        {/if}
                
                                        <div 
                                            class="grip"
                                            on:pointerdown={() => manager.setDragState("goal")}
                                            on:pointerup={() => manager.setDragState(null)}
                                        >
                                            <div class="grip__icon">
                                                <SvgIcon icon={Icon.DragDots} options={{ scale: 1.15 }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div class="goals__goal-bottom">
                                        <div class="goals__goal-description">
                                            {description}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div 
                                class="goals__ghost-item drop-top-border"
                                class:drop-top-border--over={dtargetId === section}
                                class:hidden={!srcGoal}
                                data-drag-context={"goal"}
                                on:dragenter={(e) => manager.onDragEnter(e, section)}
                                on:dragleave={(e) => manager.resetGoalsDragTarget()}
                                on:dragover={(e) => e.preventDefault()}
                                on:dragend={() => manager.onDragEnd()}
                            >
                            </div>
                        </div>

                        {#if grouping === "default"}
                            {@const timeFrame = manager.timeFrame}
                            <button 
                                class="goals__add-btn" 
                                on:click={() => setViewGoalNew({ timeFrame })}
                            >
                                <span>New Goal</span>
                                <div>
                                    <SvgIcon 
                                        icon={Icon.Add} 
                                        options={{ scale: 1, strokeWidth: 1.4, opacity: 0.4 }}
                                    />
                                </div>
                            </button>
                        {/if}
                    {/if}
                </div>
            {/if}
        {/each}
    {/if}
</div>

<style lang="scss">
    .goals {
        margin: 0px 0px 0px -12px;
        min-height: 350px;
        padding-bottom: 30px;
        position: relative;
        z-index: 0;

        --hover-opacity: 0.0125;

        &--light {
            --hover-opacity: 0.04;
        }
        &--light &__section {
            @include text-style(0.55);
        }
        &--light &__section-count {
            @include text-style(0.35);
        }
        &--light &__goal-name {
            @include text-style(1);
        }
        &--light &__goal-description {
            @include text-style(0.7);
        }
        &--light &__goal-due {
            @include text-style(0.55);
        }
        &--default &__section-header,
        &--default &__section-divider {
            display: none !important;
        }

        &__flx {
            @include flex(flex-start, space-between);
            width: calc(100%);
            gap: 20px;
        }
        
        &__section {
            margin: -2px 0px 12px 1px;
            position: relative;
            width: 100%;
            @include text-style(0.4, 500, 1.25rem);

            &--first &-header {
                padding-top: 3px;
            }
            &--first &-divider {
                display: none;
            }
        }
        &__section-header-inner {
            display: flex;
            position: relative;

            &:hover .toggle-arrow--section {
                opacity: 0.2;
            }
            &:hover .goals__plus-btn {
                opacity: 0.2;
            }
        }
        &__section-header-inner--empty &__section-name {
            opacity: 0.5;
        }
        &__section-header-inner--empty &__section-count {
            opacity: 0.5;
        }
        &__section-header {
            @include flex(center, space-between);
            box-shadow: none !important;
            padding: 5px 0px 0px 0px;
            border-radius: 4px;

            &:focus {
                background: rgba(var(--textColor1), var(--hover-opacity));
            }
            &:focus .toggle-arrow--section {
                opacity: 0.2;
            }
        }
        &__section-name {
            margin: 0px 0px 0px 12px;
            @include text-style(0.5, var(--fw-400-500), 1.2rem);
            @include elipses-overflow;
            max-width: 300px;
        }
        &__section-count {
            @include text-style(0.15, var(--fw-400-500), 1.2rem);
            margin: 0px 0px 0px 10px;
        }
        &__section-divider {
            margin: 0px 0px 4px 12px;
            width: calc(100% - 15px) !important;
        }
        &__section-progress {
            margin: -6px 7px 0px 0px;
            @include flex(Center);
        }
        &__plus-btn {
            margin: 0px 0px 5px 8px;
            opacity: 0;

            &:hover {
                opacity: 0.8 !important;
            }
        }
        &__add-btn {
            @include flex(center);
            margin: 5px 0px 0px 12px;
            opacity: 0.5;
            
            &:hover {
                opacity: 1;
            }
            span {
                @include text-style(0.4, var(--fw-400-500), 1.25rem);
                margin-right: 10px;
            }
        }
        &__goal {
            width: calc(100%);
            padding: 8px 9px 8.5px 13px;
            border-radius: 4px;
            margin: 0px 0px 1px 1px;
            position: relative;

            &:hover, &:focus {
                background-color: rgba(var(--textColor1), var(--hover-opacity));
                box-shadow: none !important;
            }
            &:hover .toggle-arrow,
            &:focus .toggle-arrow {
                opacity: 0.2;
            }
            &:hover .divider,
            &:focus .divider {
                display: none;
            }
        }
        &__goal:focus &__goal-checkbox {
            background: rgba(var(--textColor1), 0.125);
        }
        &__goal-top {
            @include flex(flex-start, space-between);
        }
        &__goal-bottom {
            padding: 0px 0px 0px 32px;
        }
        &__goal--open &__goal-description {
            @include truncate-lines(8);
        }
        &__goal--checked &__goal-checkbox {
            background-color: var(--elemColor1) !important;

            i {
                display: block;
            }
        }
        &__goal-checkbox {
            background-color: rgba(var(--textColor1), 0.065);
            @include square(15px);
            color: var(--elemTextColor);
            border-radius: 0px;
            transition: 0.1s ease-in-out;
            margin: 2px 15px 0px 0px;
            @include center;

            &--checked {
                background-color: var(--elemColor1) !important;
            }
            i {
                display: none;
                font-size: 1.1rem;
            }
            &:hover {
                background: rgba(var(--textColor1), 0.125);
            }
        }
        &__goal-name {
            @include text-style(1, var(--fw-400-500), 1.25rem);
            @include truncate-lines(2);
            user-select: text;
            cursor: pointer;
            
            &:hover {
                text-decoration: underline;
            }
        }
        &__goal-description {
            @include text-style(0.35, 400, 1.25rem);
            @include truncate-lines;
            width: 80%;
            cursor: text;
            user-select: text;
        }
        &__goal-progress {
            @include flex(center, flex-end);
            display: flex;
            margin: 8px 0px 0px 12px;
        }
        &__goal-divider {
            @include abs-bottom-left(0px, 45px);
        }
        &__goal .tag {
            border-radius: 20px;
            padding: 3px 12px 5px 10px;
            margin-left: 10px
        }
        &__goal-due {
            @include text-style(0.6, var(--fw-400-500), 1.2rem, "Geist Mono");
            background-color: rgba(var(--textColor1), 0.035);
            margin: 2px -2px 0px 11px;
            padding: 3.5px 7px 0px 7px;
            border-radius: 6px;
            white-space: nowrap;
        }
        &__ghost-item {
            height: 30px;
            width: 100%;
            @include abs-bottom-left(-35px, 0px);
            z-index: 100;

            &--ms {
                height: 15px;
                bottom: 0px;
                position: relative;
            }
        }
    }
    .grip {
        @include abs-top-left(0px, -10px);
    }

    .toggle-arrow {
        @include abs-top-left(-1px, -30px);
    }
    .strike {
        text-decoration: line-through;
        opacity: 0.2;

        &::after {
            display: none;
        }
    }
    .divider {
        width: calc(100% - 47px);
        border-top: var(--divider-border);
    }
</style>