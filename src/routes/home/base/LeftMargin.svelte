<script lang="ts">
    import { BULLETIN_CONTENT, TEST_GOALS } from "../../../lib/mock-data"
	import { getQuarter, months } from "../../../lib/utils-date"
	import { habitTracker, themeState } from "../../../lib/store"
	import { capitalize, clamp, formatPlural } from "../../../lib/utils-general"

	import Bulletin from "./Bulletin.svelte"
	import DailyHabits from "./DailyHabits.svelte"
	import DropdownList from "../../../components/DropdownList.svelte"
	import RingCalendar from "../../../components/RingCalendar.svelte"

    export let fullWidth = false


    $: metrics = $habitTracker.metrics
    $: isLight = !$themeState.isDarkTheme

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
    <div class="margin__context">
        <div 
            on:pointerdown={dragDown}
            class:obscured={fullWidth}
            style:margin={fullWidth ? "0px" : "5px 0px 6px 0px"}
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
                        <span>Consistency</span>
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
                    <div 
                        class="goal-m" 
                        class:goal-m--light={isLight}
                        style:margin-bottom="11px"
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

        &--light &__context-btn--view {
            opacity: 0.8;
        }
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
        &__context {
            margin: 6px 0px 0px 0px;
            position: relative;
            background-color: transparent;
            padding: 3px 0px 4px 0px;
        }
        &__context-btn {
            @include text-style(1, var(--fw-400-500), 1.55rem);
            padding: 5px 12px 6px 11px;
            margin-left: -13px;
            border-radius: 12px;
            
            &--view {
                @include text-style(1, var(--fw-400-500), 1.4em);
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
        &__context-list {
            padding: 5px 15px 0px 6px;
            max-height: 500px;
            overflow-y: scroll;
            width: calc(100% + 15px);
            margin: 0px 0px 20px -6px;
        }
    }
    .goal-m {
        margin-bottom: 6px !important;
        
        &__title {
            font-size: 1.35rem;
            @include truncate-lines(1);
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
            padding: 0px 0px 12px 0px;
            border-bottom: var(--divider-border);
        }
        &__stat {
            @include flex(center, space-between);
            margin-bottom: 8px;

            &:last-child {
                margin-bottom: 4px;
            }
        }
        span {
            @include text-style(0.3, var(--fw-400-500), 1.4rem, "Geist Mono");
            
            &:last-child {
                @include text-style(0.5);
            }
        }
    }
</style>