<script lang="ts">
    import { Calendar } from "$lib/calendar.ts";
	import { isSameDay } from "$lib/utils-date";
	import { TEST_TAGS } from "$lib/mock-data";
	import { minsToHHMM } from "../lib/utils-date";
	import { formatPlural, getColorTrio } from "../lib/utils-general";
	import ProgressRing from "./ProgressRing.svelte";

    let gridWidth = 0
    let gridHeight = 0

    type ACalOptions = {
        time: boolean
        goals: "summary" | "list"
    }

    type ActivityData = {
        date: Date
        focusMins: number
        habits?: number
        goals?: {
            type: "big",
            name: string,
            img?: string
            tag?: any
        }[]
    }

    const options: any = {}

    const timeView  = options?.time ?? true
    const goalsView = options?.goals ?? "list"

    const activityData = [
        {
            date: new Date(2024, 9, 2),
            focusMins: 12 * 60 + 10,
            habits: 0.7,
            goals: [
                {
                    type: "big",
                    name: "6 mile run",
                    img: "https://i.pinimg.com/736x/66/5a/84/665a840d7793a07937fc9a618277b91f.jpg",                
                    tag: TEST_TAGS[0]
                },
            ]
        },
        {

            habits: 1,
            date: new Date(2024, 9, 3),
            focusMins: 5 * 60 + 11
        },
        {
            date: new Date(2024, 9, 18),
            focusMins: 5 * 60 + 11
        },
        {
            date: new Date(2024, 9, 13),
            focusMins: 1 * 60 + 41
        },
        {
            habits: 1,
            date: new Date(2024, 9, 28),
            focusMins: 2 * 60 + 34
        },
        {
            habits: 1,
            date: new Date(2024, 9, 5),
            focusMins: 134
        },
        {
            habits: 0.4,
            date: new Date(2024, 9, 6),
            focusMins: 563
        },
        {
            habits: 1,
            date: new Date(2024, 9, 9),
            focusMins: 662
        },
        {
            date: new Date(2024, 9, 10),
            focusMins: 52
        },
        {
            habits: 0.4,
            date: new Date(2024, 9, 3),
            focusMins: 34
        },
        {
            habits: 0.9,
            date: new Date(2024, 9, 16),
            focusMins: 271
        },
        {
            date: new Date(2024, 9, 24),
            focusMins: 398
        },
        {
            habits: 0.4,
            date: new Date(2024, 9, 26),
            focusMins: 281
        },
        {
            date: new Date(2024, 9, 27),
            focusMins: 84
        },
        {
            habits: 0.6,
            date: new Date(2024, 9, 31),
            focusMins: 441
        },
        {
            date: new Date(2024, 9, 20),
            habits: 0.2,
            goals: [
                {
                    type: "big",
                    name: "learn how to make pizza",
                    img: "https://i.pinimg.com/564x/a2/b7/55/a2b755afd352d01427d40a7a855eab0b.jpg",
                    tag: TEST_TAGS[3]
                },
            ]
        },
        {
            date: new Date(2024, 9, 15),
            habits: 0.7,
            goals: [
                {
                    type: "big",
                    name: "js fundamentals",
                    // img: "https://i.pinimg.com/736x/ea/87/5f/ea875f548c6d1cdabd6335406c55fe28.jpg",
                    tag: TEST_TAGS[1]
                },
            ]
        },
        {
            date: new Date(2024, 9, 14),
            focusMins: 192,
            habits: 0.2,
            goals: [
                {
                    type: "big",
                    name: "50 pushups",
                    tag: TEST_TAGS[1]
                },
                {
                    type: "big",
                    name: "20 pullups",
                    tag: TEST_TAGS[7]
                },
            ]
        },
        {
            date: new Date(2024, 9, 25),
            habits: 0.7,
            goals: [
                {
                    type: "big",
                    name: "master sketching the head",
                    tag: TEST_TAGS[8]
                },
                {
                    type: "big",
                    name: "french pronouns",
                    tag: TEST_TAGS[2]
                },
                {
                    type: "big",
                    name: "finish designing portfolio",
                    tag: TEST_TAGS[1]
                },
            ]
        },
        {
            date: new Date(2024, 9, 29),
            habits: 0.7,
            goals: [
                {
                    type: "big",
                    name: "master sketching the head",
                    img: "https://i.pinimg.com/564x/20/b4/47/20b4475ed2723cf6a11e7f60dee2323b.jpg",
                    tag: TEST_TAGS[8]
                },
            ]
        }
    ]

    const cal = new Calendar()
    const month = cal.currMonth

    function getGoalsDisplayData(goals: { type: string, name?: string, img?: string, tag: any }[]) {
        const highlightGoal = goals.reduce((curr, goal) => {
            if (goal.img && goal.type === "big") {
                return goal
            }
            else {
                return curr
            }
        }, goals[0])

        return {
            firstGoal: goals[0] ?? undefined,
            img: highlightGoal?.img,
            count: goals.length
        }
    }
    function findDayActivity(day: Date, sameMonth: boolean) {
        if (!sameMonth) return undefined

        return activityData.find((d) => isSameDay(d.date, day)) ?? undefined
    }
</script>

<div 
    class="acal"
    style:--GRID_WIDTH={`${gridWidth}px`}
    style:--GRID_HEIGHT={`${gridHeight}px`}
>
    <div class="acal__days">
        <div class="acal__dow">Sun</div>
        <div class="acal__dow">Mon</div>
        <div class="acal__dow">Tue</div>
        <div class="acal__dow">Wed</div>
        <div class="acal__dow">Thu</div>
        <div class="acal__dow">Fri</div>
        <div class="acal__dow">Sat</div>
    </div>
    <div 
        class="acal__grid"
        bind:clientWidth={gridWidth}
        bind:clientHeight={gridHeight}
    >
        {#each month.days as day, idx}
            {@const d   = day.date.getDate()}
            {@const dow = day.date.getDay()}
            {@const sameMonth = day.isInCurrMonth}
            {@const activity       = findDayActivity(day.date, day.isInCurrMonth)}
            {@const focused        = activity?.focusMins}
            {@const habitProg      = activity?.habits ?? 0}
            {@const { img, count } = getGoalsDisplayData(activity?.goals ?? [])}

            <div 
                class="acal__day"
                class:acal__day--has-img={img}
                class:bg-img={img}
                class:acal__day--first-col={dow === 0}
                class:acal__day--last-col={dow === 6}
                class:acal__day--bottom-row={idx >= 35}
                class:acal__day--not-curr-month={!sameMonth}
                class:acal__day--today={isSameDay(day.date, new Date())}
                style={`${img ? `background-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0)), url(${""})` : ""}`}
            >
                <div>
                    <div class="acal__day-num">
                        {d}
                    </div>
                    <div class="acal__day-ring" title="All habits complete">
                        {#if sameMonth}
                            <ProgressRing 
                                progress={habitProg} 
                                options={{
                                    size: 10, strokeWidth: 2, style: "simple"
                                }}
                            />
                        {/if}
                    </div>
                    {#if activity?.goals}
                        {@const goals = activity.goals}
                        {@const show  = (focused ? 1 : 2) + (timeView ? 0 : 1)}
                        {@const cutoff = goals.length - show}

                        <div class="acal__day-activities">
                            {#if goals && goalsView === "summary"}
                                <div 
                                    class="acal__activity"
                                    title={`Achived ${formatPlural("task", count)}`}
                                >
                                    <i>📌</i>
                                    <span>{count}</span>
                                </div>
                            {/if}
                            {#if goals && goalsView === "list"}
                                {#each goals.slice(0, show) as goal}
                                    {@const symbol = goal.tag.symbol}
                                    {@const colors = getColorTrio(symbol.color, true)}
                                    <div 
                                        class="acal__activity acal__goal"
                                        style:--tag-color-primary={symbol.color.primary}
                                        style:--tag-color-1={colors[0]}
                                        style:--tag-color-2={colors[1]}
                                        style:--tag-color-3={colors[2]}
                                        title={`Achived ${formatPlural("task", count)}`}
                                    >
                                        <i>{symbol.emoji}</i>
                                        <span>{goal.name}</span>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                        {#if cutoff > 0}
                            <div class="acal__goal-cutoff">
                                {cutoff} more
                            </div>
                        {/if}
                    {/if}
                </div>
                {#if focused}
                    <div 
                        class="acal__day-focus-time acal__activity"
                        title="focus time"
                    >
                        <i class="fa-solid fa-stopwatch" style:opacity={0.15} ></i>
                        <!-- <i>📌</i> -->
                        <span>
                            {minsToHHMM(activity.focusMins)}
                        </span>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    .acal {
        margin-top: 14px;
        width: 100%;
        height: 600px;

        --border-color: rgba(var(--textColor1), 0.035);

        &__days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            font-weight: bold;
            height: 30px;
            @include text-style(0.65, 500, 1.15rem);
        }
        &__grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-template-rows: repeat(6, 1fr);
            height: calc(100% - 30px);
            width: 100%;
        }
        &__day {
            padding: 4px 5px 2.5px 4px;
            background-color: rgba(white, 0.005);
            border-top: 0.5px solid var(--border-color);
            border-left: 0.5px solid var(--border-color);
            height: calc(var(--GRID_HEIGHT) / 6);
            width: calc(var(--GRID_WIDTH) / 7);
            @include flex-col;
            position: relative;
            overflow: hidden;

            &::before, &::after {
                content: " ";
                background: rgba(var(--textColor1), 0.04);
                @include abs-top-left;
                display: none;
            }
            &::before {
                width: 100%;
                height: 1px;
            }
            &::after {
                height: 100%;
                width: 1px;
            }
            &--has-img {
                // border: none !important;
            }
            &--first-col {
                background-color: rgba(white, 0.012);
            }
            &--last-col {
                border-right: 0.5px solid var(--border-color);
                background-color: rgba(white, 0.012);
            }
            &--bottom-row {
                border-bottom: 0.5px solid var(--border-color);
            }
            &--not-curr-month &-num {
                opacity: 0.1;
            }
            &--today &-num {
                background-color: #FF5151;
                color: white;
                @include circle(20px);
            }
        }
        // &__day--has-img::before,
        // &__day--has-img::after {
        //     display: block;
        // }
        // &__day--has-img &__day-ring i {
        //     color: rgba(var(--textColor1), 0.4); 
        // }
        // &__day--has-img &__activity {
        //     background: rgba(40, 40, 40, 0.55);
        //     backdrop-filter: blur(4px);
        //     -webkit-backdrop-filter: blur(4px);
        //     transition: 0.01s ease-in-out;

        //     &:hover {
        //         background: rgba(40, 40, 40, 0.85) !important;
        //     }
        // }
        &__day-num {
            @include text-style(1, 300, 1.1rem, "DM Sans");
            @include circle(16px);
            @include center;
            margin: 0px 0px 6px 0px;
        }
        &__day-ring {
            @include abs-top-right(7px, 7px);

            i {
                color: rgba(var(--textColor1), 0.1); 
                font-size: 0.9rem;
            }
        }
        &__activity {
            width: calc(100% - 3px);
            padding: 3.5px 2px 4px 5px;
            border-radius: 5px;
            background-color: rgba(var(--textColor1), 0.07);
            white-space: nowrap;
            margin: 0px 0px 2px 2px;
            margin-top: 2px;
            @include flex(center);
            cursor: pointer;

            &:hover {
                background-color: rgba(var(--textColor1), 0.05);
            }
            i {
                font-style: normal;
                font-size: 0.8rem;
                margin-right: 6px;
            }
            span {
                @include text-style(1, 400, 1rem, "DM Mono");
                @include elipses-overflow;
                opacity: 0.95;
            }
        }
        &__goal {
            background-color: rgba(var(--tag-color-2), 0.125) !important;
            overflow: hidden;
            position: relative;
            padding: 1.5px 6px 2px 12px;

            &:before {
                content: " ";
                height: 10px;
                width: 2.5px;
                border-radius: 10px;
                background-color: rgba(var(--tag-color-primary), 1);
                @include abs-top-left(4px, 4px);
            }
            span {
                @include text-style(_, 400, 1.1rem, "DM Sans");
                color: rgba(var(--tag-color-primary), 1);
            }
        }
        &__goal-cutoff {
            @include text-style(0.2, 500, 1.1rem, "Manrope");
            margin: 5px 0px 0px 4px;
        }
        &__day-focus-time {
            @include text-style(1, 400, 1rem, "DM Mono");
            width: min-content;
            padding-right: 10px;
            background-color: none !important;
        }
        &__day-activity {
            margin-top: 7px;
        }
    }
</style>