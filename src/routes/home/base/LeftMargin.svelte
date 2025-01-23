<script lang="ts">
	import { habitTracker } from "../../../lib/store"
    import { TEST_GOALS } from "../../../lib/mock-data"
	import { getQuarter, months } from "../../../lib/utils-date"
	import { capitalize, clamp, formatPlural } from "../../../lib/utils-general"

	import Bulletin from "./Bulletin.svelte"
	import DailyHabits from "./DailyHabits.svelte"
	import DropdownList from "../../../components/DropdownList.svelte"
	import RingCalendar from "../../../components/RingCalendar.svelte"

    export let fullWidth = false

    $: metrics = $habitTracker.metrics

    let marginDropdown = false
    let marginViewDropdown = false
    let marginOptn: "habits" | "goals" = "habits"
    let marginView: "today" | "month" | "year" | "quarter" = "month"

    let initDragY = -1
    let ogDragVal = 0
    let bulletinHt = 380
    let today = new Date()

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
</script>

<div 
    class="margin"
    style:cursor={initDragY >= 0 ? "ns-resize" : "default"}
    on:pointermove={onDrag}
    on:pointerup={onDragEnd}
>
    <div 
        class="margin__bulletin" 
        style:height={`${fullWidth ? "250" : bulletinHt}px`}
    >
        <Bulletin />
    </div>
    <div class="margin__context">
        <div 
            on:pointerdown={dragDown}
            class="divider divider--handle" 
        >
        </div>
        <div class="margin__context-header">
            <button 
                on:click={() => marginDropdown = !marginDropdown}
                class="margin__context-btn"
                id="margin-optn--dbtn"
            >
                {capitalize(marginOptn)}
            </button>
            <button 
                on:click={() => marginViewDropdown = !marginViewDropdown}
                class="margin__context-btn margin__context-btn--view"
                id="margin-view--dbtn"
            >
                {#if marginView === "today"}
                    Today
                {:else if marginView === "month"}
                    {months[today.getMonth()].substring(0, 3)}
                {:else if marginView === "quarter"}
                    Q{getQuarter(today)}
                {:else if marginView === "year"}
                    {today.getFullYear()}
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
                        <span>Completion</span>
                        <span>
                            {Math.floor(habitsDone / habitsDue * 100)}%
                        </span>
                    </div>
                    <div class="habits__stat">
                        <span>Streak</span>
                        <span>
                            {streak}d
                        </span>
                    </div>
                </div>
                <RingCalendar />
            </div>
        <!-- goals view -->
        {:else}
            <div style:margin="1px 0px 0px 2px">
                {#each TEST_GOALS as goal}
                    {@const done = goal.status === "accomplished"}
                    <div class="goal-m">
                        <div class="goal-m__left">
                            {#if done}
                                <div class="goal-m__check">
                                    <i class="fa-solid fa-check"></i>
                                </div>
                            {:else}
                                <div class="goal-m__bullet"></div>
                            {/if}
                        </div>
                        <div 
                            class="goal-m__title"
                            class:strike={done}
                            title={goal.name}
                        >
                            {goal.name}
                        </div>
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
                    top: "40px", left: "-8px" 
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
                    top: "40px", right: "0px" 
                },
                styling: { 
                    width: "100px" 
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
        &__context {
            margin: 6px 0px 0px 0px;
            position: relative;
            background-color: transparent;
            padding: 3px 0px 4px 0px;
        }
        .divider {
            border-top: 1px solid rgba(var(--textColor1), 0.06);
            background: transparent !important;
            width: 100%;
            padding: 3px 0px 5px 0px;
            margin: 5px 0px 5px 4px;
        }
        &__context-btn {
            @include text-style(1, 400, 1.55rem, "Geist Mono");
            padding: 5px 12px 6px 11px;
            margin-left: -11px;
            border-radius: 12px;
            
            &--view {
                @include text-style(1, 400, 1.5rem);
                margin-right: -10px;
                padding: 6px 10px 7px 9px;
                opacity: 0.2;
            }
            &--view:hover {
                opacity: 0.8;
            }
            &:hover {
                opacity: 0.5;
            }
        }
        &__context-header {
            @include flex(center, space-between);
            margin: -8px 0px 4px 2px;
        }
        &__context-count {
            opacity: 0.2;
            font-family: "Geist Mono";
            font-weight: 400;
        }
        &__context-list {
            padding: 5px 15px 0px 6px;
            max-height: 500px;
            overflow-y: scroll;
            width: calc(100% + 15px);
            margin: 0px 0px 20px -6px;
        }
    }
    .dmenu {
        overflow: visible;
        padding-bottom: 5px;
        &__section-name {
            margin-bottom: 1px;
        }
        &__option {
            overflow: visible;

            button {
                border-radius: 7px;
            }
        }
        &__section-divider:last-child {
            display: none;
        }
    }
    .habits {
        margin-top: -4px;
        &__details {
            margin: 6px 0px 10px 0px;
            padding: 0px 0px 10px 0px;
            border-bottom: 0.5px solid rgba(var(--textColor1), 0.06);
        }
        &__stat {
            @include flex(center, space-between);
            margin-bottom: 8px;

            &:last-child {
                margin-bottom: 4px;
            }
        }
        span {
            @include text-style(0.3, 400, 1.4rem, "Geist Mono");
            
            &:last-child {
                @include text-style(0.5);
            }
        }
    }
</style>