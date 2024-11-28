<script lang="ts">
    import { Calendar } from "$lib/calendar.ts"
	import { formatDatetoStr } from "../lib/utils-date";
	import ProgressRing from "./ProgressRing.svelte";

    const n = [
        0.4, 0.6, 0.2, 0.4, 0.4, 0.9, 0.4,
        0.2, 0.6, 0.2, 0.6, 0.7, 0.3, 0.7,
        0.6, 0.8, 0.5, 0.9, 0.4, 0.7, 0.5,
        0.4, 0.6, 0.4, 0.5, 0.2, 0.4, 0.6,
        0.3, 0.6, 0.2, 0.7, 0.2, 0.5, 0.4
    ]

    const cal = new Calendar()
    const month = cal.currMonth

</script>

<div class="rcal">
    <div class="rcal__days">
        <div class="rcal__dow">S</div>
        <div class="rcal__dow">M</div>
        <div class="rcal__dow">T</div>
        <div class="rcal__dow">W</div>
        <div class="rcal__dow">T</div>
        <div class="rcal__dow">F</div>
        <div class="rcal__dow">S</div>
    </div>
    <div class="rcal__grid">
        {#each month.days as day, idx}
            {@const d   = day.date.getDate()}
            {@const sameMonth = day.isInCurrMonth}

            <div
                title={formatDatetoStr(day.date)}
                class="rcal__day"
                class:rcal__day--not-curr-month={!sameMonth}
            >
                {#if sameMonth}
                    <ProgressRing 
                        progress={n[idx]} 
                        options={{
                            size: 14, strokeWidth: 3.2, style: "light"
                        }}
                    />
                {:else}
                    <div class="rcal__day-num">
                        {d}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    .rcal {
        &__days {
            @include flex(center, space-between);
            @include text-style(0.65, 400, 1.3rem, "DM Mono");
            margin: 0px 4px 10px 0px;
        }
        &__dow {
            height: 25px;
            margin-left: 2px;
            @include center;
        }
        &__grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-template-rows: repeat(6, 1fr);
        }
        &__day {
            height: 28px;
            margin: 0px 17px 6px 0px;
        }
        &__day--not-curr-month {
            opacity: 0.095 !important;
        }
        &__day-num {
            @include text-style(1, 300, 1.25rem, "DM Mono");
            margin-left: 3px;
        }
    }
</style>