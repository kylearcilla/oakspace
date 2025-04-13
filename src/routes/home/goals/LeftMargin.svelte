<script lang="ts">
	import { onMount } from "svelte"

	import { goalTracker, themeState } from "$lib/store"
	import type { GoalsViewManager } from "$lib/goals-view-manager"
	import { clamp, getMaskedGradientStyle } from "$lib/utils-general"
	import { formatDatetoStr, getTimeDistanceStr } from "$lib/utils-date"
	import { getOverdueGoals, getPinnedGoals, getRecentGoals, getUpcomingGoals, saveHeights, setViewGoal } from "$lib/utils-goals"

	import EmptyList from "$components/EmptyList.svelte"

    const MAX_HEIGHT = 200
    const MIN_HEIGHT = 40

    export let manager: GoalsViewManager
    export let options: MarginLeftViewOptions

    let { pinnedHeight, upcomingHeight, overdueHeight } = options.heights
    let topHeight = 0

    let initHeight = 0
    let initOffsetY = 0
    let editGroup: "upcoming" | "overdue" | "pinned" = "upcoming"

    let recentGoals: Goal[] = []
    let upcomingGoals: Goal[] = []
    let overdueGoals: Goal[] = []
    let pinnedGoals: Goal[] = []

    let upcomingRef: HTMLElement | null = null
    let overdueRef: HTMLElement | null = null
    let recentRef: HTMLElement | null = null
    let pinnedRef: HTMLElement | null = null

    let upcomingGradient = ""
    let overdueGradient = ""
    let recentGradient = ""
    let pinnedGradient = ""

    $: light = !$themeState.isDarkTheme
    $: onUpdate($goalTracker)

    $: emptyOverdue = overdueGoals.length === 0
    $: emptyUpcoming = upcomingGoals.length === 0
    $: emptyPinned = pinnedGoals.length === 0

    $: if (options.showOverdue && emptyOverdue) {
        overdueHeight = 0
    }
    $: if (emptyUpcoming) {
        upcomingHeight = 40
    }
    $: if (emptyPinned) {
        pinnedHeight = 40
    }

    manager.state.subscribe(() => onUpdate())

    function getPinnedDate(date: Date) {
        const now = new Date()
        const year = now.getFullYear()

        const dateYear = date.getFullYear()

        if (dateYear === year) {
            return getTimeDistanceStr({ date: date, format: "short" })
        }
        else {
            return formatDatetoStr(date, { year: "numeric", month: "short" })
        }
    }
    function onUpdate(_?: GoalsStore) {
        pinnedGoals = getPinnedGoals()
        upcomingGoals = getUpcomingGoals()
        overdueGoals = getOverdueGoals()
        recentGoals = getRecentGoals()
    }
    function scrollHandler(target: HTMLElement | null) {
        if (!target) return

        const group = target.dataset.group
        const { styling } = getMaskedGradientStyle(target, {
            head: { 
                end: "25px",
            },
            tail: {
                start: "80%",
            }
        }) as HozScrollMaskedGradient

        if (group === "overdue") {
            overdueGradient = styling
        }
        else if (group === "next") {
            upcomingGradient = styling
        }
        else if (group === "completed") {
            recentGradient = styling
        }
        else if (group === "pinned") {
            pinnedGradient = styling
        }
    }

    /* resize */
    function onResizeDown(e: PointerEvent) {
        const target = e.target as HTMLElement
        const group = target.dataset.group

        e.preventDefault()

        editGroup = group! as "upcoming" | "overdue" | "pinned"

        if (group === "upcoming") {
            initHeight = upcomingHeight
        }
        else if (group === "overdue") {
            initHeight = overdueHeight
        }
        else {
            initHeight = pinnedHeight
        }

        initOffsetY = e.clientY
        target.addEventListener("pointermove", onResizeMove)
        target.addEventListener("pointerup", onResizeUp)
    }
    function onResizeMove(e: PointerEvent) {
        const target = e.target as HTMLElement
        const diff = e.clientY - initOffsetY
        const newHeight = clamp(MIN_HEIGHT, initHeight + diff, MAX_HEIGHT)

        target.setPointerCapture(e.pointerId)

        if (editGroup === "upcoming") {
            upcomingHeight = newHeight
            scrollHandler(upcomingRef)
        } 
        else if (editGroup === "overdue") {
            overdueHeight = newHeight
            scrollHandler(overdueRef)
        }
        else if (editGroup === "pinned") {
            pinnedHeight = newHeight
            scrollHandler(pinnedRef)
        }

        saveHeights({ pinnedHeight, upcomingHeight, overdueHeight })
    }
    function onResizeUp(e: PointerEvent) {
        const target = e.target as HTMLElement

        target.removeEventListener("pointermove", onResizeMove)
        target.removeEventListener("pointerup", onResizeUp)
    }

    onMount(() => {
        scrollHandler(recentRef)
        scrollHandler(overdueRef)
        scrollHandler(upcomingRef)
        scrollHandler(pinnedRef)
    })
</script>

<div 
    class="left-margin"
    class:left-margin--light={light}
    style:--top-height={`${topHeight}px`}
>
    <div bind:clientHeight={topHeight}>
        {#if options.showPinned}
            <div class="left-margin__snippet-header">
                Pinned
                <span>{pinnedGoals.length}</span>
            </div>
            <div 
                bind:this={pinnedRef}
                data-group="pinned"
                class="left-margin__snippet-group" 
                style={`height: ${pinnedHeight}px; ${pinnedGradient}`}
                on:scroll={() => scrollHandler(pinnedRef)}
            >
                <ul>
                    {#each pinnedGoals as goal}
                        {@const { due, name } = goal}
                        <li>
                            <button 
                                class="left-margin__snippet"
                                on:click={() => setViewGoal(goal)}
                            >
                                <div class="left-margin__snippet-title">
                                    {name}
                                </div>
                                <div class="flx">
                                    <span>
                                        {getPinnedDate(due)}
                                    </span>
                                </div>
                            </button>
                        </li>
                    {/each}
                    {#if pinnedGoals.length === 0}
                        <div class="empty-list">
                            <EmptyList emptyText="None pinned"/>
                        </div>
                    {/if}
                </ul>
            </div>
            <div 
                class="left-margin__snippet-div"
                class:no-pointer-events={emptyPinned}
                data-group="pinned"
                on:pointerdown={onResizeDown}
            >
            </div>
        {/if}
        {#if options.showNext}
            <div class="left-margin__snippet-header">
                Next Up
                <span>{upcomingGoals.length}</span>
            </div>
            <div 
                bind:this={upcomingRef}
                data-group="next"
                class="left-margin__snippet-group" 
                style={`height: ${upcomingHeight}px; ${upcomingGradient}`}
                on:scroll={() => scrollHandler(upcomingRef)}
            >
                <ul>
                    {#each upcomingGoals as goal}
                        {@const { due, name } = goal}
                        <li>
                            <button 
                                class="left-margin__snippet"
                                on:click={() => setViewGoal(goal)}
                            >
                                <div class="left-margin__snippet-title">
                                    {name}
                                </div>
                                <div class="flx">
                                    <span>
                                        {getTimeDistanceStr({ date: due, format: "short" })}
                                    </span>
                                </div>
                            </button>
                        </li>
                    {/each}
                    {#if upcomingGoals.length === 0}
                        <div class="empty-list">
                            <EmptyList emptyText="None upcoming"/>
                        </div>
                    {/if}
                    </ul>
            </div>
            <div 
                class="left-margin__snippet-div"
                class:no-pointer-events={emptyUpcoming}
                data-group="upcoming"
                on:pointerdown={onResizeDown}
            >
            </div>
        {/if}
    
        {#if options.showOverdue && overdueGoals.length > 0}
            <div class="left-margin__snippet-header">
                Overdue
                <span>{overdueGoals.length}</span>
            </div>
            <div 
                bind:this={overdueRef}
                data-group="overdue"
                class="left-margin__snippet-group" 
                style={`height: ${overdueHeight}px; ${overdueGradient}`}
                on:scroll={() => scrollHandler(overdueRef)}
            >
                <ul>
                    {#each overdueGoals as goal}
                        {@const { due, name } = goal}
                        <li>
                            <button 
                                class="left-margin__snippet"
                                on:click={() => setViewGoal(goal)}
                            >
                                <div class="left-margin__snippet-title">
                                    {name}
                                </div>
                                <div class="flx">
                                    <span>
                                        {getTimeDistanceStr({ date: due, format: "short", sign: true })}
                                    </span>
                                </div>
                            </button>
                        </li>
                    {/each}
                </ul>
            </div>
            <div 
                data-group="overdue"
                class="left-margin__snippet-div"
                class:no-pointer-events={emptyOverdue && emptyUpcoming}
                on:pointerdown={onResizeDown}
            >
            </div>
        {/if}
    </div>

    <div 
        bind:this={recentRef}
        class="left-margin__snippet-group" 
        data-group="completed"
        style={recentGradient}
        on:scroll={() => scrollHandler(recentRef)}
    >
        <!-- <div class="left-margin__snippet-header">
            Recent
        </div> -->
        {#each recentGoals as goal}
            {@const { completedDate, name } = goal}
            <li>
                <button 
                    class="left-margin__snippet"
                    on:click={() => setViewGoal(goal)}
                >
                    <div class="left-margin__snippet-title">
                        {name}
                    </div>
                    <div class="flx">
                        {#if completedDate}
                            <span>
                                {getTimeDistanceStr({ date: completedDate, format: "short" })}
                            </span>
                        {/if}
                    </div>
                </button>
            </li>
        {/each}
        {#if recentGoals.length === 0}
            <div 
                class="empty-list"
                style:top="30px"
                style:width="70%"
            >
                <EmptyList emptyText="0 recents"/>
            </div>
        {/if}
    </div>
</div>


<style lang="scss">
    .left-margin {
        height: 100%;
        position: relative;

        --border-opacity: 0.09;

        &--light {
            --border-opacity: 0.2;
        }
        &--light &__snippet {
            opacity: 1;
        }
        &--light &__snippet-header {
            @include text-style(0.6);
        }

        &__snippet {
            margin: 0px 0px 7px 0px;
            opacity: 0.7;
            @include text-style(1, var(--fw-400-500), 1.3rem);

            --hov-opacity: 0.7;

            &:hover {
                opacity: 1;
            }
            span {
                @include text-style(0.4, _, 1.1rem);
                margin-right: 10px;
            }
        }
        &__snippet-div {
            height: 2px;
            border-top: 1.5px dashed rgba(var(--textColor1), var(--border-opacity));
            width: 90%;
            padding: 3px 0px 8px 0px;
            cursor: ns-resize;
        }
        &__snippet-title {
            margin: 0px 0px 6px 0px;
            max-width: 130px;
            @include elipses-overflow;
            position: sticky;
        }
        &__snippet-group {
            margin: 0px 0px 7px 0px;
            overflow: auto;
            @include flex-col(flex-start);
            position: relative;
        }
        &__snippet-group[data-group="overdue"] {
            .left-margin__snippet {
                color: var(--error-color);
            }
            span {
                color: var(--error-color);
                opacity: 0.65;
            }
        }
        &__snippet-group[data-group="completed"] {
            height: calc(100% - var(--top-height));
            padding-top: 5px;

            .left-margin__snippet:hover {
                opacity: 0.3;
            }
            .left-margin__snippet {
                opacity: 0.2;
            }
            .left-margin__snippet-title {
                text-decoration: line-through;
            }
        }
        &__snippet-header {
            margin: 0px 15px 9px 0px;
            @include flex(center, space-between);
            @include text-style(0.2, var(--fw-400-500), 1.3rem);

            span {
                font-size: 1.25rem;
            }
        }
    }
    .empty-list {
        @include abs-center;
        top: 40%;
        left: calc(50% - 5px);
        width: 100%;
    }
</style>