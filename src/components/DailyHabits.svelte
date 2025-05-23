<script lang="ts">
    import { habitTracker, themeState } from "$lib/store"
	import { toggleCompleteHabit, getDayHabitData } from "$lib/utils-habits"

    export let date = new Date()
    export let context: "overview" | "side-menu" = "side-menu"
    const store = habitTracker
    const currMonth = new Date()

    $: habits = $store.habits
    $: isLight = !$themeState.isDarkTheme

    habitTracker.subscribe(store => habits = store.habits)
</script>

<div 
    class="dh" 
    class:dh--overview={context === "overview"}
    class:dh--light={isLight}
>
    {#each habits as habit, habitIdx}
        {@const { due, done } = getDayHabitData(habit, date)}

        <div class="dh__habit">
            <div>
                <div
                    title={due ? "" : "Check in not required for this day."}
                    class="day-col day-col cell"
                    class:cell--first-row={habitIdx === 0}
                >
                    <button 
                        on:click={() => toggleCompleteHabit({ habit, date, currMonth })}
                        class="dh__habit-box"
                        class:dh__habit-box--not-required={!due}
                        class:dh__habit-box--checked={done}
                    >
                        {#if done}
                            <i class="fa-solid fa-check"></i>
                        {/if}
                    </button>
                </div>
            </div>
            <div class="flx">
                <span class="dh__habit-symbol">
                    {habit.symbol}
                </span>
                <button 
                    class="dh__habit-name"
                    class:strike={done}
                    class:strike--lt={done}
                    on:click={() => {
                        habitTracker.update((state) => ({ ...state, viewHabit: habit }))
                    }}
                >
                    {habit.name}
                </button>
            </div>
        </div>
    {/each}
</div>

<style lang="scss">
    .dh {
        margin-top: 6px;

        --box-opacity: 0.06;

        &--overview {
            --box-opacity: 0.04;
        }
        &--overview &__habit-box {
            @include square(13px);
        }
        &--overview &__habit-name {
            font-size: 1.2rem;
        }
        &--overview &__habit-symbol {
            font-size: 1.2rem;
            margin-right: 9px;
        }
        &--light {
            --box-opacity: 0.065;
        }
        &--light#{&}--overview {
            --box-opacity: 0.08;
        }

        &__habit {
            @include flex(center);
            padding: 0px 0px 0px 1px;
            white-space: nowrap;
            position: relative;
            margin-bottom: 12px;
        }
        &__habit-name {
            @include text-style(1, var(--fw-400-500), 1.3rem);
            @include elipses-overflow;
            @include flex(center, space-between);

            &:hover {
                text-decoration: underline;
            }
        }
        &__habit-symbol {
            margin-right: 9px;
            font-size: 1.4rem;
        }
        &__habit-box {
            @include square(15px);
            @include center;
            background-color: rgba(var(--textColor1), var(--box-opacity));
            border-radius: 0px;
            position: relative;
            margin: 0px 11px 0px 0px;
            font-size: 1rem;
            transition-property: transform;
            
            &:hover {
                background-color: rgba(var(--textColor1), calc(var(--box-opacity) + 0.055));
            }
        }
        &__habit-box--checked {
            background-color: var(--elemColor1) !important;
            color: var(--elemTextColor);

            &:hover {
                opacity: 1 !important;
            }
            &:before {
                display: none;
            }
        }
        &__habit-box--not-required {
            &:hover {
                background-color: rgb(var(--textColor1), 0.045);
            }
            &:before {
                content: " ";
                @include circle(3px);
                background-color: rgba(var(--textColor1), 0.5);
                @include abs-center;
            }
        }
    }
</style>