<script lang="ts">
    import { habitTracker } from "../../../lib/store"
	import { isBoxRequired, isDayComplete, toggleCompleteHabit } from "../../../lib/utils-habits"

    const store = habitTracker
    const dayIdx = new Date().getDay()
    
    $: habits = $store.habits
</script>

<div class="dh">
    {#each habits as habit, habitIdx}
        {@const required = isBoxRequired(habit, dayIdx)}
        {@const complete = isDayComplete({ habit, dayIdx, weeksAgoIdx: 0 })}
        <div class="dh__habit">
            <div >
                <div
                    title={required ? "" : "Check in not required for this day."}
                    class="day-col day-col cell"
                    class:cell--first-row={habitIdx === 0}
                >
                    <button 
                        on:click={() => toggleCompleteHabit({ habit, dayIdx, weeksAgoIdx: 0 })}
                        class="dh__habit-box"
                        class:dh__habit-box--not-required={!required}
                        class:dh__habit-box--checked={complete}
                    >
                        {#if complete}
                            <i class="fa-solid fa-check"></i>
                        {/if}
                    </button>
                </div>
            </div>
            <div class="flx">
                <span class="dh__habit-symbol">
                    {habit.symbol}
                </span>
                <span 
                    class="dh__habit-name"
                    class:strike={complete}
                    class:strike--lt={complete}
                >
                    {habit.name}
                </span>
            </div>
        </div>
    {/each}
</div>

<style lang="scss">
    .dh {
        margin-top: 6px;

        &__habit {
            @include flex(center);
            padding: 0px 0px 0px 1px;
            white-space: nowrap;
            position: relative;
            margin-bottom: 13px;
        }
        &__habit-name {
            @include text-style(1, var(--fw-400-500), 1.5rem);
            @include elipses-overflow;
            @include flex(center, space-between);
        }
        &__habit-symbol {
            margin-right: 10px;
            font-size: 1.5rem;
        }
        &__habit-box {
            background-color: var(--lightColor3);
            @include square(18.5px);
            border-radius: 0px;
            position: relative;
            margin: 0px 13px 0px 1px;
            @include center;
            
            &:hover {
                opacity: 0.55;
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