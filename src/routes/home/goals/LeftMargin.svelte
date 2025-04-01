<script lang="ts">
	import { onMount } from "svelte"

	import { goalTracker } from "$lib/store"
	import { getTimeDistanceStr } from "$lib/utils-date"
	import { clamp, getMaskedGradientStyle } from "$lib/utils-general"
	import { getOverdueGoals, getRecentGoals, getUpcomingGoals, setViewGoal } from "$lib/utils-goals"

	import EmptyList from "$components/EmptyList.svelte"

    const MAX_HEIGHT = 232
    const MIN_HEIGHT = 100
    
    let upcomingHeight = 150
    let overdueHeight = 180

    let initHeight = 0
    let initOffsetY = 0
    let editGroup = ""

    let recentGoals: Goal[] = []
    let upcomingGoals: Goal[] = []
    let overdueGoals: Goal[] = []

    let upcomingRef: HTMLElement | null = null
    let overdueRef: HTMLElement | null = null
    let recentRef: HTMLElement | null = null

    let upcomingGradient = ""
    let overdueGradient = ""
    let recentGradient = ""

    $: onUpdate($goalTracker)
    $: emptyOverdue = overdueGoals.length === 0
    $: emptyUpcoming = upcomingGoals.length === 0

    $: if (emptyOverdue) {
        overdueHeight = 0
    }
    $: if (emptyUpcoming) {
        upcomingHeight = 40
    }

    function onUpdate(_: GoalsStore) {
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
    }

    /* resize */
    function onResizeDown(e: PointerEvent) {
        const target = e.target as HTMLElement
        const group = target.dataset.group

        e.preventDefault()

        editGroup = group!
        initHeight = group === "upcoming" ? upcomingHeight : overdueHeight
        initOffsetY = e.clientY

        target.addEventListener("pointermove", onResizeMove)
        target.addEventListener("pointerup", onResizeUp)
    }
    function onResizeMove(e: PointerEvent) {
        const maxHeight = emptyOverdue ? MAX_HEIGHT + 100 : MAX_HEIGHT
        const target = e.target as HTMLElement
        const diff = e.clientY - initOffsetY
        const newHeight = clamp(MIN_HEIGHT, initHeight + diff, maxHeight)

        target.setPointerCapture(e.pointerId)

        if (editGroup === "upcoming") {
            upcomingHeight = newHeight
            scrollHandler(upcomingRef)
        } 
        else if (editGroup === "overdue") {
            overdueHeight = newHeight
            scrollHandler(overdueRef)
        }
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
    })
</script>

<div 
    class="left-margin"
    style:--top-height={`${upcomingHeight + overdueHeight + 40}px`}
>
    <div class="left-margin__snippet-header">
        Next Up
    </div>
    <div 
        bind:this={upcomingRef}
        data-group="next"
        data-upcoming-height={upcomingHeight}
        class="left-margin__snippet-group" 
        style={`height: ${upcomingHeight}px; ${upcomingGradient}`}
        on:scroll={() => scrollHandler(upcomingRef)}
    >
        <ul>
            {#each upcomingGoals as goal}
                {@const { due, name } = goal}
                <button 
                    class="left-margin__snippet"
                    on:click={() => setViewGoal(goal)}
                >
                    <div class="left-margin__snippet-title">
                        {name}
                    </div>
                    <div class="flx">
                        {#if due}
                            <span>
                                {getTimeDistanceStr({ date: due, format: "short" })}
                            </span>
                        {/if}
                    </div>
                </button>
            {/each}
            {#if upcomingGoals.length === 0}
                <div class="empty-list">
                    <EmptyList emptyText="None upcoming"/>
                </div>
            {/if}
        </ul>
    </div>

    {#if overdueGoals.length > 0}
        <div 
            class="left-margin__snippet-div"
            class:no-pointer-events={emptyUpcoming}
            data-group="upcoming"
            on:pointerdown={onResizeDown}
        >
        </div>
        <div class="left-margin__snippet-header">
            Overdue
        </div>
        <div 
            bind:this={overdueRef}
            data-group="overdue"
            class="left-margin__snippet-group" 
            style={`height: ${overdueHeight}px; ${overdueGradient}`}
            on:scroll={() => scrollHandler(overdueRef)}
        >
            {#each overdueGoals as goal}
                {@const { due, name } = goal}
                <button 
                    class="left-margin__snippet"
                    on:click={() => setViewGoal(goal)}
                >
                    <div class="left-margin__snippet-title">
                        {name}
                    </div>
                    <div class="flx">
                        {#if due}
                            <span>
                                {getTimeDistanceStr({ date: due, format: "short", sign: true })}
                            </span>
                        {/if}
                    </div>
                </button>
            {/each}
        </div>
    {/if}

    <div 
        data-group="overdue"
        class="left-margin__snippet-div"
        class:no-pointer-events={emptyOverdue && emptyUpcoming}
        on:pointerdown={onResizeDown}
    >
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
        {/each}
    </div>
</div>


<style lang="scss">
    .left-margin {
        height: 100%;
        &__snippet {
            margin: 0px 0px 7px 0px;
            opacity: 0.55;
            @include text-style(1, var(--fw-400-500), 1.3rem);

            --hov-opacity: 0.7;

            &:hover {
                opacity: 0.7;
            }
            span {
                @include text-style(0.4, _, 1.1rem);
                margin-right: 10px;
            }
        }
        &__snippet-div {
            height: 2px;
            border-top: 1.5px dashed rgba(var(--textColor1), 0.09);
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
            overflow: scroll;
            @include flex-col(flex-start);
            position: relative;
        }
        &__snippet-group[data-group="overdue"] {
            .left-margin__snippet {
                color: #fba4a4 ;
            }
            span {
                color: #fba4a4 ;
                opacity: 0.5;
            }
        }
        &__snippet-group[data-group="completed"] {
            height: calc(100% - var(--top-height));
            padding-top: 5px;


            // -webkit-mask-image: linear-gradient(
            //         180deg, 
            //         rgba(0, 0, 0, 1) 40%, 
            //         transparent 90%
            // );
            // -mask-image: linear-gradient(
            //         180deg, 
            //         rgba(0, 0, 0, 1) 40%, 
            //         transparent 90%
            // );

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
            margin: 0px 0px 9px 0px;
            @include text-style(0.2, _, 1.3rem);
        }
    }
    .empty-list {
        @include abs-center;
        top: 40%;
        width: 100%;
    }
</style>