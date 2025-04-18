<script lang="ts">
    import { kebabToNormal } from '$lib/utils-general'
    import { habitTracker, themeState } from "$lib/store"
	import { reorderInTimeOfDayView } from "$lib/utils-habits"

	import Details from './Details.svelte'

    const TIMES_OF_DAY_MAP: { [key: string]: number } = {
        "morning": 0,
        "afternoon": 1,
        "evening": 2,
        "all-day": 3
    }

    let habits: Habit[] = []
    let sortedHabits: Habit[][] = []
    let showHabitsLeft = true
    let bannerLinked = false
    
    let srcId: string = ""
    let targetId: string = ""
    let listRef: HTMLElement
    
    $: light = !$themeState.isDarkTheme
    $: habits = $habitTracker.habits
    $: groupByTimeOfDay(habits)

    function groupByTimeOfDay(habits: Habit[]) {
        sortedHabits = [[], [], [], []]

        habits.forEach(habit => {
            const timeOfDayIndex = TIMES_OF_DAY_MAP[habit.timeOfDay]
            sortedHabits[timeOfDayIndex].push(habit)
        })
        sortedHabits.forEach(habitGroup => {
            habitGroup.sort((a, b) => a.order.tod - b.order.tod);
        })
    }
    function viewHabit(habit: Habit) {
        habitTracker.update((state) => ({ ...state, viewHabit: habit }))
    }
    function onDragStart(e: DragEvent) {
        const target = e.target as HTMLElement
        srcId = target.dataset.id!
        
        listRef.addEventListener("dragover", onDragOver)
        listRef.addEventListener("dragend", onDragEnd)

        e.dataTransfer?.setData("text", "")
        e.dataTransfer!.effectAllowed = "move"
    }
    function onDragOver(e: DragEvent) {
        e.preventDefault()

        const target = e.target as HTMLElement
        const elem = target.closest(".habits__list-item") as HTMLElement

        if (elem) {
            targetId = elem.dataset.id || ""
        }
    }
    function onDragEnd() {
        if (srcId && targetId) {
            const srcHabit = habits.find(h => h.id === srcId)
            const targetHabit = habits.find(h => h.id === targetId)

            reorderInTimeOfDayView({ 
                srcHabit, 
                targetHabit, 
                habits
            })

            habitTracker.update((state) => ({ ...state, habits }))
        }

        listRef.removeEventListener("dragover", onDragOver)
        listRef.removeEventListener("dragend", onDragEnd)
        
        srcId = ""
        targetId = ""
    }   
</script>

<div 
    class="habits" 
    class:habits--light={light}
    class:habits--banner-linked={bannerLinked}
    style:--left-width={showHabitsLeft ? "140px" : "0px"}
>
    <div class="habits__content">
        {#if showHabitsLeft}
            <div class="habits__left">
                <div 
                    class="habits__list"
                    bind:this={listRef}
                >
                    {#each Object.keys(TIMES_OF_DAY_MAP) as timeOfDay}
                        {@const idx = TIMES_OF_DAY_MAP[timeOfDay]}
                        {@const habits = sortedHabits[idx]}
            
                        <div style:margin-bottom="10px">
                            <div class="habits__list-group-title">
                                {kebabToNormal(timeOfDay)}
                            </div>
                            <ul>
                                {#each habits as habit}
                                    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
                                    <li 
                                        data-id={habit.id}
                                        role="button"
                                        tabindex="0"
                                        class="habits__list-item drop-top-border"
                                        class:drop-top-border--over={targetId === habit.id}
                                        draggable="true"
                                        on:dragstart={onDragStart}
                                        on:click={() => {
                                            viewHabit(habit)
                                        }}
                                        on:keydown={(e) => {
                                            if (e.key === "Enter") {
                                                viewHabit(habit)
                                            }
                                        }}
                                    >
                                        <div class="habits__list-item-symbol">
                                            {habit.symbol}
                                        </div>
                                        <span class="habits__list-item-name">
                                            {habit.name}
                                        </span>
                                    </li>
                                {:else}
                                    <div class="habits__empty-list">--</div>
                                {/each}
                            </ul>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
        <div class="habits__right">
            <Details 
                {showHabitsLeft}
                setLeftWidth={(flag) => showHabitsLeft = flag} 
                setBannerLinked={(flag) => bannerLinked = flag}
            />
        </div>
    </div>
</div>

<style lang="scss">
    .habits {
        height: 100%;
        width: 100%;
        padding: 5px 0px 0px 20px;
        color: rgba(var(--textColor1), 0.9);
        @include text-style(1, var(--fw-400-500), 1.3rem);

        &--light h1 {
            @include text-style(1);
        }
        &--light &__list-item:hover {
            opacity: 0.7;
        }
        &--light &__list-item-name {
            opacity: 1;
        }
        &--light &__list-group-title {
            @include text-style(0.3);
        }
        &--banner-linked {
            padding-top: 0px;
        }
        &--banner-linked &__left {
            border-right: none;
        }
        &--banner-linked h1 {
            display: none;
        }        
        &__left {
            width: var(--left-width);
            height: 100%;
        }
        &__right {
            width: calc(100% - var(--left-width));
            height: 100%;
        }
        &__content {
            height: 100%;
            display: flex;
        }
        &__list-group-title {
            margin-bottom: 12px;
            @include text-style(0.24, _, 1.4rem);

            &:first-child {
                padding-top: 4px;
            }
        }
        &__list-item {
            position: relative;
            @include flex(center);
            @include text-style(1, _, 1.35rem);
            cursor: pointer;
            transition: 0.1s transform cubic-bezier(.4,0,.2,1);
            margin-bottom: 8px;

            &:active {
                transform: scale(0.98);
            }
        }
        &__list-item-symbol {
            width: 20px;
            font-size: 1.46rem;
        }
        &__list-item-name {
            margin-left: 0.5em;
            opacity: 0.65;
            width: fit-content;
            max-width: 80%;
            @include elipses-overflow;

            &:hover {
                opacity: 1;
                text-decoration: underline;
            }
        }
        &__empty-list {
            display: block;
            @include text-style(0.24, _, 1.4rem);
            margin-top: -8px;
        }
    }
    .drop-top-border::before {
        width: calc(100% - 20px);
        @include abs-top-left(-5px);
    }
</style>