<script lang="ts">
	import { onMount } from "svelte";
	import { themeState } from "../../../lib/store"

    import { Icon } from "../../../lib/enums";
	import { getColorTrio } from '$lib/utils-colors'
    import { getDueDateDistStr } from "$lib/utils-goals"
	import { kebabToNormal } from "../../../lib/utils-general"

	import SvgIcon from "../../../components/SVGIcon.svelte";
	import ProgressBar from "../../../components/ProgressBar.svelte"
    export let manager: GoalsManager
    export let options: GoalsView
    export let pinnedGoal: Goal

    let store: GoalsViewState | null = null
    let dragState: "goal" | "milestone" | null = null
    let width = 0
    let containerRef: HTMLElement
    
    $: isLight = !$themeState.isDarkTheme
    $: grouping = options.grouping
    $: showProgress = options.showProgress
    $: showDue = options.due
    $: dueType = options.dueType

    $: manager.initSections(grouping)
    
    $: if (manager.state) {
        manager.state.subscribe((data) => {
            store = data
            dragState = store.dragState
        })
    }

    function _getDueString(goal: Goal, type: "date" | "distance") {
        return getDueDateDistStr(goal, dueType)
    }

    onMount(() => manager.initContainerRef(containerRef))
</script>

<svelte:window on:keydown={(ke) => manager.handleKeydown(ke)} />


<div
    bind:this={containerRef}
    bind:clientWidth={width}
    id={`base-goals`}
    class={`goals goals--${grouping}`}
    class:goals--sm={width < 600}
    class:goals--light={isLight}
>
    {#if store}
        {@const { sortedGoals, sections, closedSections, openGoalId, dragTarget } = store }

        {#each sections as section, secIdx (secIdx)}
            {@const closed   = closedSections[secIdx]}
            {@const goals    = sortedGoals[secIdx]}
            {@const { done: secDone, total: secTotal } = manager.getSectionProgress(secIdx)}

            <div class="goals__section">
                <div 
                    role="button"
                    tabindex="0"
                    class="goals__section-header"
                    id={`section--${secIdx}`}
                    data-type="section"
                    data-idx={secIdx}
                >
                    <div class="flx">
                        <div class="goals__section-name">
                            {kebabToNormal(section)}
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
                    </div>
                    {#if goals.length > 0 && grouping === "tag"}
                        <div class="goals__section-progress">
                            <ProgressBar progress={secDone / secTotal}/>
                        </div>
                    {/if}
                </div>
                <div class="goals__section-divider divider"></div>
                {#if !closed}
                    {#each goals as goal, goalIdx (goal.id)}
                        {@const { name, tag, description, status, milestones } = goal}
                        {@const { checkCount, total } = manager.getGoalProgress(goal)}
                        {@const tagColor = tag ? getColorTrio(tag.symbol.color, isLight) : ["", "", ""]}
                        {@const open = openGoalId === goal.id}
                        {@const pinned = pinnedGoal?.id === goal.id}
                        {@const checked = status === "accomplished"}
            
                        <div
                            role="button"
                            tabindex="0"
                            id={`goal--${secIdx}-${goalIdx}`}
                            data-id={goal.bOrder.status}
                            draggable="true"
                            class="goals__goal dg-over-el"
                            class:goals__goal--checked={checked}
                            class:goals__goal--open={open}
                            class:dg-over-el--over={goal.name === dragTarget?.name}
                            class:no-pointer-events={dragState === "milestone"}
                            on:contextmenu={(e) => { 
                                manager.onContextMenu(e, goal)
                            }}
                            on:dragstart={(e) => manager.onDrag(e, goal)}
                            on:dragover={(e) => manager.onDragOver(e, goal)}
                            on:dragleave={(e) => manager.onDragLeave(e)}
                            on:dragend={(e) => manager.onDragEnd(e)}
                        >
                            <div class="goals__goal-top">
                                <div class="flx flx--algn-start">
                                    <button 
                                        class="goals__goal-checkbox"
                                        class:goals__goal-checkbox--checked={checked}
                                        on:click={() => {
                                            manager.setGoalStatus(goal, checked ? "in-progress" : "accomplished")
                                        }}
                                    >
                                        <i class="fa-solid fa-check"></i>
                                    </button>
                                    <div 
                                        class="goals__goal-name"
                                        class:strike={checked}
                                    >
                                        {name}
                                    </div>
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
                                        {@const { dueStr, isLate } = _getDueString(goal, dueType)}
                                        <div 
                                            class="goals__goal-due"
                                            class:goals__goal-due--late={isLate}
                                            class:white={dueStr === "🤞"}
                                        >
                                            {dueStr}
                                        </div>
                                    {/if}
                                    {#if goal.tag}
                                        <div class="goals__goal-tag">
                                            <div 
                                                class="tag"
                                                class:tag--light={isLight}
                                                style:--tag-color-primary={tag.symbol.color.primary}
                                                style:--tag-color-1={tagColor[0]}
                                                style:--tag-color-2={tagColor[1]}
                                                style:--tag-color-3={tagColor[2]}
                                            >
                                                <div class="tag__symbol" style:font-size={"1.1rem"}>
                                                    {tag.symbol.emoji}
                                                </div>
                                                <div class="tag__title">
                                                    {tag.name}
                                                </div>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
        
                                {#if goalIdx != goals.length - 1 || milestones?.length >= 0 && open}
                                    <div class="goals__goal-divider divider"></div>
                                {/if}
        
                                <!-- interactive elements -->
                                <button 
                                    on:click={() => manager.toggleGoalOpen(goal.id)}
                                    class="toggle-arrow"
                                    class:toggle-arrow--closed={!open}
                                    class:hidden={!goal.milestones || goal.milestones?.length === 0}
                                    style:margin-left={"18px"}
                                >
                                    <SvgIcon 
                                        icon={Icon.Dropdown}
                                        options={{
                                            scale: 1.2, height: 12, width: 12, strokeWidth: 1.4
                                        }}
                                    />
                                </button>
        
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

                        {#if milestones?.length > 0 && open}
                            <div class="goals__milestones">
                                {#each milestones.sort((a, b) => a.idx - b.idx) as ms, mIdx (ms.id)}
                                    <div 
                                        id={`milestone--${goalIdx}-${ms.idx}`}
                                        draggable="true"
                                        role="button"
                                        tabindex="0"
                                        class="goals__milestone dg-over-el" 
                                        class:goals__milestone--checked={ms.done}
                                        class:dg-over-el--over={ms.name === dragTarget?.name}
                                        class:no-pointer-events={dragState === "goal"}
                                        on:dragstart={(e) => manager.onDrag(e, goal, ms)}
                                        on:dragover={(e) => manager.onDragOver(e, ms)}
                                        on:dragleave={(e) => manager.onDragLeave(e)}
                                        on:dragend={(e) => manager.onDragEnd(e)}
                                    >
                                        <button 
                                            class="goals__goal-checkbox" 
                                            class:goals__goal-checkbox--checked={ms.done}
                                            on:click={() => manager.toggleMilestoneComplete(secIdx, goalIdx, mIdx)}
                                        >
                                            {#if ms.done}
                                                <i class="fa-solid fa-check"></i>
                                            {/if}
                                        </button>
                                        <div 
                                            class="goals__goal-name goals__milestone-name"
                                            class:strike={ms.done}
                                        >
                                            {ms.name}
                                        </div>
                                        <div class="divider" class:hidden={goal.milestones.length === mIdx + 1}></div>
                                        <div 
                                            class="grip"
                                            on:pointerdown={() => manager.setDragState("milestone")}
                                            on:pointerup={() => manager.setDragState(null)}
                                        >
                                            <div class="grip__icon">
                                                <SvgIcon icon={Icon.DragDots} options={{ scale: 1.15 }} />
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                                <div 
                                    class="goals__ghost-item goals__ghost-item--ms dg-over-el"
                                    class:dg-over-el--over={"end" === dragTarget}
                                    on:dragover={(e) => manager.onDragOver(e, "end")}
                                    on:dragleave={(e) => manager.onDragLeave(e)}
                                    on:dragend={(e) => manager.onDragEnd(e)}
                                >
                                </div>
                            </div>
                        {/if}
                    {/each}
                    <div 
                        class="goals__ghost-item dg-over-el"
                        class:dg-over-el--over={dragTarget === section}
                        on:dragover={(e) => manager.onDragOver(e, section)}
                        on:dragleave={(e) => manager.onDragLeave(e)}
                        on:dragend={(e) => manager.onDragEnd(e)}
                    >
                    </div>
                {/if}
            </div>
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
            @include text-style(0.45);
        }
        &--light &__goal-due {
            @include text-style(0.55);
        }
        &--light &__milestone-name {
            @include text-style(0.9);
        }
        &--default &__section-header,
        &--default &__section-divider {
            display: none !important;
        }

        &__flx {
            @include flex(flex-start, space-between);
            // flex-direction: row-reverse;
            width: calc(100%);
            gap: 20px;
        }
        
        &__section {
            margin: -2px 0px 12px 1px;
            position: relative;
            width: 100%;
            @include text-style(0.4, 500, 1.25rem);
            
            &:hover .toggle-arrow--section {
                opacity: 0.2;
            }
        }
        &__section-header {
            @include flex(center, space-between);
            box-shadow: none !important;
            padding: 5px 0px 2px 0px;
            border-radius: 4px;

            &:focus {
                background: rgba(var(--textColor1), var(--hover-opacity));
            }
            &:focus .toggle-arrow--section {
                opacity: 0.2;
            }
        }
        &__section-name {
            margin: 0px 0px 6px 12px;
            @include text-style(0.5, var(--fw-400-500), 1.3rem);
        }
        &__section-count {
            @include text-style(0.15, var(--fw-400-500), _);
            margin: 0px 0px 6px 12px;
        }
        &__section-divider {
            @include text-style(0.4, 500, 1.3rem);
            margin: 0px 0px 4px 12px;
            width: calc(100% - 13px) !important;
        }
        &__section-progress {
            margin: -6px 7px 0px 0px;
            @include flex(Center);
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
        &__goal .toggle-arrow {
            @include abs-top-left(8px, -22px);
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
            @include square(17.5px);
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
            }
            &:hover {
                background: rgba(var(--textColor1), 0.125);
            }
        }
        &__goal-name {
            @include text-style(1, var(--fw-400-500), 1.45rem);
            @include truncate-lines(2);
            user-select: text;
            cursor: text;
        }
        &__goal-description {
            @include text-style(0.35, 400, 1.4rem);
            @include truncate-lines;
            width: 80%;
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
            @include text-style(0.6, var(--fw-400-500), 1.15rem, "Geist Mono");
            background-color: rgba(var(--textColor1), 0.035);
            margin: 2px -2px 0px 11px;
            padding: 3.5px 7px 0px 7px;
            border-radius: 6px;
            white-space: nowrap;
        }
        &__milestones {
            padding: 0px 0px 0px 48px;
            position: relative;
            max-height: 300px;
            overflow-y: scroll;
        }
        &__milestone {
            display: flex;
            margin: 0px 0px 0px -15px;
            position: relative;
            padding: 11px 0px 8px 15px;
            border-radius: 4px;

            &--checked i {
                display: block;
            }
            .divider {
                margin-left: 0px;
                @include abs-bottom-left(0px, 48px);
            }
            .grip {
                @include abs-top-left(2px, -10px);
            }
        }
        &__milestone:focus {
            box-shadow: none !important;
            background-color: rgba(var(--textColor1), var(--hover-opacity));
        }
        &__milestone:focus button {
            background: rgba(var(--textColor1), 0.1);
        }
        &__milestone::before {
            left: 0px;
            width: 100%;
        }
        &__milestones &__ghost-item::before {
            left: 0px;
            width: 100%;
        }
        &__milestone-name {
            @include text-style(0.75, 500, 1.4rem);
        }
        &__ghost-item {
            height: 40px;
            width: 100%;
            @include abs-bottom-left(-45px, 0px);
            z-index: 100;

            &--ms {
                height: 15px;
                bottom: 0px;
                position: relative;
            }
        }
    }

    .toggle-arrow {
        @include abs-top-left(5px, -30px);
    }
    .strike {
        text-decoration: line-through;
        opacity: 0.2;

        &::after {
            display: none;
        }
    }
    .divider {
        width: calc(100% - 50px);
        border-top: var(--divider-border);
    }
</style>