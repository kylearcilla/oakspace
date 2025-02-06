<script lang="ts">
    import { TEST_HABITS } from "$lib/mock-data"
	import { DAYS_OF_WEEK, getAllMonthDays, getLastDayOfMonth } from "../../../lib/utils-date";
	import { randInt } from "../../../lib/utils-general";

    const n = getAllMonthDays(new Date())

</script>

<div class="m-habits">
    <div class="m-habits__header">
        <div class="m-habits__dummy"></div>
        {#each TEST_HABITS.sort((a, b) => a.order.default - b.order.default) as habit}
            <div class="m-habits__habit cell">
                {habit.symbol}
            </div>
        {/each}
    </div>
    {#each n as day, idx}
        {@const isSunday = day.getDay() === 6}
        <div class="m-habits__row">
            <div class="m-habits__day">
                <div class="m-habits__day-num">
                    {idx + 1}
                </div>
                <div class="m-habits__dow">
                    {DAYS_OF_WEEK[day.getDay()][0]}
                </div>
            </div>
            <div class="m-habits__box-cols">
                {#each TEST_HABITS as _}
                    {@const checked = randInt(0, 1) === 1}
                    <div class="m-habits__box-col">
                        <div class="m-habits__box-container cell">
                            <button 
                                class="m-habits__box"
                                class:m-habits__box--checked={checked}
                            >
                                {#if checked}
                                    <i class="fa-solid fa-check"></i>
                                {/if}
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
        {#if isSunday}
            <div class="divider"></div>
        {/if}
    {/each}
</div>


<style lang="scss">
    .m-habits {
        &__header {
            @include flex(center);
            margin: 0px 0px 10px 0px;
        }
        &__habit {
            font-size: 1.6rem;
        }
        &__dummy {
            width: 40px;
            margin-right: 14px;
        }
        &__row {
            display: flex;
            margin-bottom: 6px;
        }
        &__day {
            display: flex;
            height: 23px;
        }
        &__day-num {
            @include text-style(0.6, 500, 1.3rem, "DM Sans");
            // @include center;
            width: 23px;
        }
        &__dow {
            @include text-style(0.3, 500, 1.3rem, "DM Sans");
            @include center;
            align-items: flex-start;
            width: 25px;
            margin: 0px 13px 0px 5px;
        }
        &__box-cols {
            display: flex;
        }
        &__box-col {
            @include flex(center);
            flex-direction: column;
        }
        &__box {
            width: 16.5px;
            height: 16.5px;
            border-radius: 0px;
            background-color: var(--lightColor2);
            color: var(--elemTextColor);
            @include center;
            font-size: 1.1rem;
            opacity: 0.7;

            &:hover {
                opacity: 1;
            }
            &--checked {
                opacity: 1;
                background-color: var(--elemColor1) !important;
            }
            &--checked:hover {
                opacity: 1;
            }
        }
    }
    .cell {
        width: 23px;
        height: 23px;
        margin-right: 5px;
        @include center;
    }
    .divider {
        background-color: rgba(var(--textColor1), 0.035);
        width: 100%;
        height: 1px;
        margin: 10px 0px 10px 0px;
    }
</style>