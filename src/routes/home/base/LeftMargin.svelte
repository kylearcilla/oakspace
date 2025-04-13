<script lang="ts">
    import { onDestroy } from "svelte"
	import { habitTracker, themeState, timer } from "$lib/store"

    import { BULLETIN_CONTENT } from "$lib/mock-data"
    import { getQuarter, months } from "$lib/utils-date"
	import { capitalize, clamp } from "$lib/utils-general"
    
	import Bulletin from "./Bulletin.svelte"
	import DailyHabits from "$components/DailyHabits.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import HabitCalendar from "$components/HabitCalendar.svelte"
	import { loadBaseLeftMarginView, saveBaseLeftMarginView } from "$lib/utils-home"

    export let fullWidth = false

    let options: BaseLeftMarginView = {
        habitsView: "month",
        bulletin: BULLETIN_CONTENT
    }
    
    $: metrics = $habitTracker.monthMetrics
    $: activeStreak = $habitTracker.activeStreak
    $: habits = $habitTracker.habits
    $: isLight = !$themeState.isDarkTheme
    $: saveBaseLeftMarginView(options)

    let timeOptions = false
    let marginView = "month"

    let initDragY = -1
    let ogDragVal = 0
    let now = new Date()

    // initOptions()

    const unsubscribe = timer.subscribe(({ date }) => now = date) 

    function initOptions() {
        const data = loadBaseLeftMarginView()

        if (data) {
            options = data
        }
    }
    function dragDown(pe: PointerEvent) {
        if (pe.button != 0 || fullWidth) return
        const target = pe.target as HTMLElement
        initDragY = pe.clientY

        target.setPointerCapture(pe.pointerId)
        ogDragVal = options.bulletin.height
    }
    function onDrag(pe: PointerEvent) {
        if (initDragY < 0) return

        const offset = initDragY - pe.clientY
        options.bulletin.height = clamp(200, ogDragVal + -offset, 400)
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
        style:height={`${fullWidth ? "250" : options.bulletin.height}px`}
    >
        <Bulletin 
            {fullWidth}
            options={options.bulletin} 
            onUpdateOptions={(updated) => {
                options.bulletin = updated
                saveBaseLeftMarginView(options)
            }}
        />
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
            <div class="margin__header-title">
                Habits
            </div>
            <button 
                disabled={habits.length === 0}
                class="margin__optn-btn"
                on:click={() => timeOptions = !timeOptions}
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

        {#if marginView === "today" && habits.length > 0}
            <DailyHabits />
        {:else if (marginView === "month" || habits.length === 0) && metrics}
            {@const empty = habits.length === 0}
            {@const { habitsDone, habitsDue } = metrics}
            {@const streak = activeStreak?.count}
            <div class="habits">
                <div class="habits__details">
                    <div class="habits__stat">
                        <span>Consistency</span>
                        <span>
                            {empty ? "--" : `${Math.floor(habitsDone / habitsDue * 100)}%`}
                        </span>
                    </div>
                    <div class="habits__stat" style:margin-bottom="4px">
                        <span>Streak</span>
                        <span>
                            {empty ? "--" : `${streak}d`}
                        </span>
                    </div>
                </div>
                <HabitCalendar />
            </div>
        {/if}
        <DropdownList
            id="margin-view"
            isHidden={!timeOptions} 
            options={{
                pickedItem: capitalize(marginView),
                listItems: [{ name: "Today" }, { name: "Month" }],
                position: { 
                    top: "45px", right: "0px" 
                },
                styling: { 
                    minWidth: "100px",
                },
                onClickOutside: () => { 
                    timeOptions = false 
                },
                onListItemClicked: ({ name }) => {
                    marginView = name.toLowerCase()
                    timeOptions = false 
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
        &__header-title {
            @include text-style(1, var(--fw-400-500), 1.55rem);
            padding: 5px 12px 6px 11px;
            margin-left: -13px;
            border-radius: 12px;

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
            @include text-style(0.35, var(--fw-400-500), 1.4rem);
        }
        span:last-child {
            @include text-style(0.65);
        }
    }
</style>
