<script lang="ts">
    import { onDestroy } from "svelte"
	import { habitTracker, themeState, timer } from "$lib/store"

    import { getQuarter, months } from "$lib/utils-date"
	import { capitalize, clamp } from "$lib/utils-general"
    import { BULLETIN_CONTENT, TEST_GOALS } from "$lib/mock-data"
    
	import Bulletin from "./Bulletin.svelte"
	import DailyHabits from "./DailyHabits.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import HabitCalendar from "$components/HabitCalendar.svelte"

    export let fullWidth = false

    $: metrics = $habitTracker.metrics
    $: isLight = !$themeState.isDarkTheme

    let marginDropdown = false
    let marginViewDropdown = false
    let marginOptn = "goals"
    let marginView = "month"
    let width = 0

    let initDragY = -1
    let ogDragVal = 0
    let bulletinHt = 380
    let now = new Date()

    const unsubscribe = timer.subscribe(({ date }) => now = date) 

    function dragDown(pe: PointerEvent) {
        if (pe.button != 0 || fullWidth) return
        const target = pe.target as HTMLElement
        initDragY = pe.clientY

        target.setPointerCapture(pe.pointerId)
        ogDragVal = bulletinHt
    }
    function onDrag(pe: PointerEvent) {
        if (initDragY < 0) {
            return
        }
        const offset = initDragY - pe.clientY
        bulletinHt = clamp(200, ogDragVal + -offset, 400)
    }
    function onDragEnd() {
        ogDragVal = 0
        initDragY = -1
    }

    onDestroy(() => unsubscribe())
</script>

<div 
    class="margin"
    class:margin--light={isLight}
    style:cursor={initDragY >= 0 ? "ns-resize" : "default"}
    on:pointermove={onDrag}
    on:pointerup={onDragEnd}
>
    <div 
        class="margin__bulletin" 
        style:height={`${fullWidth ? "250" : bulletinHt}px`}
    >
        <Bulletin content={BULLETIN_CONTENT} {fullWidth}/>
    </div>
    <div class="margin__content">
        <div 
            on:pointerdown={dragDown}
            class:obscured={fullWidth}
            style:margin={fullWidth ? "0px" : "5px 0px 6px 0px"}
            class="divider divider--handle" 
        >
        </div>
        <div class="margin__header">
            <button 
                on:click={() => marginDropdown = !marginDropdown}
                class="margin__header-btn"
                id="margin-optn--dbtn"
            >
                {capitalize(marginOptn)}
            </button>
            <div class="margin__header">
                
            </div>
            <button 
                class="margin__optn-btn"
                on:click={() => marginViewDropdown = !marginViewDropdown}
            >
                {#if marginView === "today"}
                    Today
                {:else if marginView === "month"}
                    {months[now.getMonth()].substring(0, 3)}
                {:else if marginView === "quarter"}
                    Q{getQuarter(now)}
                {:else if marginView === "year"}
                    {now.getFullYear()}
                {/if}
            </button>
        </div>

        <!-- today's habits -->
        {#if marginView === "today"}
            <DailyHabits />
        <!-- month habit trends -->
        {:else if marginOptn === "habits" && marginView === "month" && metrics}
            {@const { habitsDone, habitsDue, activeStreak: { streak } } = metrics}
            <div class="habits">
                <div class="habits__details">
                    <div class="habits__stat">
                        <span>Consistency</span>
                        <span>
                            {Math.floor(habitsDone / habitsDue * 100)}%
                        </span>
                    </div>
                    <div class="habits__stat" style:margin-bottom="4px">
                        <span>Streak</span>
                        <span>
                            {streak}d
                        </span>
                    </div>
                </div>
                <HabitCalendar />
            </div>
        <!-- goals view -->
        {:else}
            <div style:margin="4px 0px 0px 2px" bind:clientWidth={width}>
                {#each TEST_GOALS as goal, idx}
                    {@const done = goal.status === "accomplished"}
                    <div 
                        class="goal-m" 
                        class:goal-m--light={isLight}
                        class:goal-m--full={fullWidth}
                    >
                        <div class="goal-m__left">
                            {#if done}
                                <div class="goal-m__check">
                                    <i class="fa-solid fa-check"></i>
                                </div>
                            {:else}
                                <div class="goal-m__bullet"></div>
                            {/if}
                        </div>
                        <div class="goal-m__title"class:strike={done} title={goal.name}>
                            {goal.name}
                        </div>
                        {#if !fullWidth && idx < TEST_GOALS.length - 1}
                            <svg width={width} height="4" viewBox={`0 0 ${width} 4`} fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d={`M0 2.5 H${width}`} stroke-dasharray="3 4.5"/>
                            </svg>     
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
        <DropdownList 
            id="margin-optn"
            isHidden={!marginDropdown} 
            options={{
                pickedItem: capitalize(marginOptn),
                listItems: [
                    { name: "Habits" }, { name: "Goals" }
                ],
                position: { 
                    top: "45px", left: "-8px" 
                },
                styling: { 
                    width: "100px"
                },
                onClickOutside: () => { 
                    marginDropdown = false 
                },
                onListItemClicked: ({ name }) => {
                    const newOptn = name.toLowerCase() 
                    if (newOptn != marginOptn) {
                        marginOptn = newOptn
                        marginView = newOptn === "habits" ? "today" : "month"
                    }
                    marginDropdown = false 
                }
            }}
        />
        <DropdownList
            id="margin-view"
            isHidden={!marginViewDropdown} 
            options={{
                pickedItem: capitalize(marginView),
                listItems: marginOptn === "habits" ?
                    [{ name: "Today" }, { name: "Month" }] : 
                    [{ name: "Month" }, { name: "Quarter" }, { name: "Year" }, ]
                ,
                position: { 
                    top: "45px", right: "0px" 
                },
                styling: { 
                    width: "100px",
                },
                onClickOutside: () => { 
                    marginViewDropdown = false 
                },
                onListItemClicked: ({ name }) => {
                    marginView = name.toLowerCase()
                    marginViewDropdown = false 
                }
            }}
        />
    </div>
</div>

<style lang="scss">
    @import "../../../scss/goals.scss";

    .margin {
        width: 100%;

        &--light .habits span {
            @include text-style(0.685);
        }
        &--light .habits span:last-child {
            @include text-style(0.35);
        }

        .divider {
            border-top: var(--divider-border);
            padding: 3px 0px 5px 0px;
            cursor: ns-resize;
        }
        &__content {
            margin: 6px 0px 0px 0px;
            position: relative;
            background-color: transparent;
            padding: 3px 0px 4px 0px;
        }
        &__header-btn {
            @include text-style(1, var(--fw-400-500), 1.55rem);
            padding: 5px 12px 6px 11px;
            margin-left: -13px;
            border-radius: 12px;
        
            &:hover {
                opacity: 0.5;
            }
        }
        &__optn-btn {
            @include text-style(1, var(--fw-400-500), 1.45em);
            margin-right: -10px;
            padding: 6px 10px 7px 9px;
            opacity: 0.35;
        }
        &__optn-btn:hover {
            opacity: 0.9;
        }
        &__header {
            @include flex(center, space-between);
            margin: -8px 0px 4px 2px;
        }
    }
    .habits {
        margin-top: -4px;

        &__details {
            margin: 6px 0px 10px 0px;
            padding: 0px 0px 12px 0px;
            border-bottom: var(--divider-border);
        }
        &__stat {
            @include flex(center, space-between);
            margin-bottom: 8px;
        }
        span {
            @include text-style(0.35, var(--fw-400-500), 1.4rem, "Geist Mono");
        }
        span:last-child {
            @include text-style(0.65);
        }
    }
</style>
