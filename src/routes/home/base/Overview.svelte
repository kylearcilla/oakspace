<script lang="ts">
    import { themeState } from "$lib/store"

	import { minsToHHMM } from "$lib/utils-date"
    import { getSwatchColors } from "$lib/utils-colors"
	import { MONTH_THOUGHT_ENTRY } from "$lib/mock-data"
	import { randomArrayElem } from "$lib/utils-general"
	import { ACTIVITY_DATA } from "$lib/mock-data-activity"
	import type { GoalsViewManager } from "$lib/goals-view-manager"
    import { genMonthCalendar, getMonthWeeks, isSameDay } from "$lib/utils-date"
    
	import TextEntry from "./TextEntry.svelte"
	import type { Unsubscriber } from "svelte/store"
	import AccomplishedIcon from "$components/AccomplishedIcon.svelte"
	import { setViewGoal, setViewGoalNew } from "$lib/utils-goals";
	import ImgModal from "./ImgModal.svelte";
	import SvgIcon from "$components/SVGIcon.svelte";
	import { Icon } from "$lib/enums";

    export let timeFrame: GoalViewTimeFrame
    export let goalsManager: GoalsViewManager
    export let onDayClicked: (dayIdx: number) => void
    export let options

    $: goalsState = goalsManager.state
    $: isLight = !$themeState.isDarkTheme

    type CalendarDay = {
        date: Date
        isInCurrMonth: boolean
    }

    const entries = ACTIVITY_DATA
    const GOALS_LIST_MAX = 3
    const PHOTO_OFFSETS = [
        { x: -8, y: 0, tilt: 4  },
        { x: -5, y: -14, tilt: 4  },
        { x: -10, y: -9, tilt: -5  },
        { x: -6, y: -12, tilt: 3  },
        { x: -7, y: -7, tilt: -2  },
        { x: -9, y: -11, tilt: 5  },
        { x: -5, y: -9, tilt: -3  },
        { x: -12, y: -6, tilt: -6  }
    ]

    let gridWidth = 0
    let gridHeight = 0
    let weeks: CalendarDay[][] = []
    let contextMenu = false
    let editDay: DayEntry | null = null
    let imgOpenSrc: string | null = null
    
    let goalClicked: Goal | null = null
    let goalsSub: Unsubscriber | null = null
    
    let dragOverDate: Date | null = null

    $: animPhotos = options?.animPhotos ?? true

    $: if (goalsState && !goalsSub) {
        goalsSub = goalsState.subscribe((data: GoalsViewState) => {

        })
    }

    function initData() {
        const month = genMonthCalendar(new Date())
        weeks = getMonthWeeks(month.days)
    }
    function findDayEntry(day: Date) {
        const idx = entries.findIndex((d) => isSameDay(d.date, day))
        const entry = idx >= 0 ? entries[idx] : undefined

        return { entry, idx }
    }

    /* goals */
    function getGoalsDisplayData({ day, entry }: { day: CalendarDay, entry: DayEntry | undefined }) {
        if (!entry || !entry.goals || !day.isInCurrMonth) return {
            goals: [],
            count: 0
        }

        const goals = entry.goals.sort((a, b) => a.name.localeCompare(b.name))
        const goalsWithImages = goals.filter(g => g.img?.src)
        const sortedGoals = goalsWithImages.sort((a, b) => a.name.localeCompare(b.name))
        const imgSrc = sortedGoals[0]?.img?.src

        return {
            goals, imgSrc, count: entry.goals.length
        }
    }
    function toggleGoalComplete(goal: Goal) {
        goalsManager.toggleGoalStatus(goal)
    }
    function addGoal(date: Date) {
        setViewGoalNew({ timeFrame, day: date })
    }
    function pointerDown(e: PointerEvent, goal: Goal) {
        const target = e.target as HTMLElement
        if (e.button !== 0) {
            return
        }
        if (target.closest(".acal__goal-checkbox") || target.closest(".acal__goal-done-icon")) {
            e.preventDefault()
            return
        }
        goalClicked = goal
    }
    function pointerUp() {
        if (goalClicked) {
            setViewGoal(goalClicked)
            goalClicked = null
        }
    }

    /* drag and drop */
    function onDragStart({ e, goal, date }: { e: DragEvent, goal: Goal, date: Date }) {
        const target = e.target as HTMLElement

        e.dataTransfer?.setData("text", "")
        e.dataTransfer!.effectAllowed = "move"

        dragOverDate = date
        target.addEventListener("dragend", () => onDragEnd(e))
    }
    function onDragEnd(e: DragEvent) {
        const target = e.target as HTMLElement

        dragOverDate = null
        goalClicked = null

        target.removeEventListener("dragend", onDragEnd)
    }
    function onCellDragOver(e: DragEvent, date: Date) {
        dragOverDate = date
    }

    /* utils */

    function onContextMenu(e: Event, date: Date) {

    }
    function closeContextMenu() {

    }
    function onPhotoClicked(date: Date) {

    }
    function onSettingsOptnClicked(name: string) {


    }
    initData()

</script>


{#if options.textBlock}
    <div style:margin="-5px 0px 10px 0px">
        <TextEntry 
            id="month"
            zIndex={50}
            entry={MONTH_THOUGHT_ENTRY}
        />
    </div>
{/if}

<div 
    class="acal"
    class:acal--light={isLight}
    style:--GRID_WIDTH={`${gridWidth}px`}
    style:--GRID_HEIGHT={`${gridHeight}px`}
>
    {#if weeks}
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
            class="acal__month"
            bind:clientWidth={gridWidth}
            bind:clientHeight={gridHeight}
        >
            {#each weeks as week, weekIdx}
                <div class="acal__week">
                    {#each week as day}
                        {@const d   = day.date.getDate()}
                        {@const dow = day.date.getDay()}
                        {@const sameMonth = day.isInCurrMonth}
                        {@const { entry }  = findDayEntry(day.date)}
                        {@const { goals, imgSrc, count } = getGoalsDisplayData({ day, entry })}
                        {@const showHabits = options.habitsMark && sameMonth}
                        {@const showFocus = options.focusTime && Math.random() > 0.7 && sameMonth}
            
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div 
                            class="acal__day"
                            class:acal__day--drag-over={dragOverDate && isSameDay(day.date, dragOverDate)}
                            class:acal__day--first-col={dow === 0}
                            class:acal__day--last-col={dow === 6}
                            class:acal__day--bottom-row={weekIdx === 5}
                            class:acal__day--not-curr-month={!sameMonth}
                            class:acal__day--anim-photos={animPhotos}
                            class:acal__day--today={isSameDay(day.date, new Date())}
                            on:contextmenu|preventDefault={(e) => onContextMenu(e, day.date)}
                            on:dragover={(e) => {
                                if (sameMonth) {
                                    onCellDragOver(e, day.date)
                                }
                                else {
                                    dragOverDate = null
                                }
                            }}
                        >
                            <div>
                                <div class="acal__day-header">
                                    <div class="flx-center">
                                        <span class="acal__day-num">{d}</span>
                                        {#if showHabits && Math.random() > 0.7}
                                            <span 
                                                class="acal__star" 
                                                title="missed some habits"
                                            >
                                                *
                                            </span>
                                        {/if}
                                        {#if sameMonth}
                                            <button class="acal__day-add-btn" on:click={() => addGoal(day.date)}>
                                                <SvgIcon 
                                                    icon={Icon.Add} 
                                                    options={{ scale: 1.05, strokeWidth: 1.45, opacity: 0.8 }}
                                                />
                                            </button>
                                        {/if}
                                    </div>
                                    {#if showFocus}
                                        {@const str = minsToHHMM(Math.random() * 400)}
                                        <div class="acal__focus" title="Focus Time">
                                            {str}
                                        </div>
                                    {/if}
                                </div>

                                <!-- goals -->
                                {#if entry && goals}
                                    {@const showAmount  = GOALS_LIST_MAX}
                                    {@const cutoff = goals.length - showAmount}
                                    
                                    <div>
                                        {#each goals.slice(0, showAmount) as goal}
                                            {@const tag = goal.tag}
                                            {@const symbol = tag.symbol}
                                            {@const color = symbol.color}
                                            {@const colors = getSwatchColors({ color, light: isLight, contrast: false})}
                                            {@const completed = Math.random() > 0.5}
                                            <!-- svelte-ignore a11y-interactive-supports-focus -->
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <div 
                                                title={goal.name}
                                                tabindex={0}
                                                role="button"
                                                draggable={true}
                                                class="acal__goal"
                                                class:acal__goal--completed={completed}
                                                class:acal__goal--active={goalClicked === goal}
                                                style:--tag-color-primary={symbol.color.primary}
                                                style:--tag-color-1={colors[0]}
                                                style:--tag-color-2={colors[1]}
                                                style:--tag-color-3={colors[2]}
                                                on:pointerdown={(e) => pointerDown(e, goal)}
                                                on:pointerup={() => pointerUp()}
                                                on:drag={(e) => e.preventDefault()}
                                                on:dragstart={(e) => {
                                                    onDragStart({ e, goal, date: day.date })
                                                }}
                                            >
                                                <div class="flx-sb">
                                                    {#if completed}
                                                        <button 
                                                            class="acal__goal-done-icon"
                                                            on:click={() => toggleGoalComplete(goal)}
                                                        >
                                                            <AccomplishedIcon {tag} scale={0.65}/>
                                                        </button>
                                                    {:else}
                                                        <button 
                                                            class="acal__goal-checkbox" 
                                                            on:click={() => toggleGoalComplete(goal)}
                                                        >    
                                                        </button>
                                                    {/if}

                                                    <div class="flx-center">
                                                        <i>{symbol.emoji}</i>
                                                        <span>{goal.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                    {#if cutoff > 0}
                                        <div class="acal__goal-cutoff">
                                            {cutoff} more
                                        </div>
                                    {/if}
                                {/if}
                            </div>
            
                            <!-- icon -->
                            {#if imgSrc && entry && count > 0}
                                {@const offset = randomArrayElem(PHOTO_OFFSETS)}

                                <div class="acal__img-container">
                                    <button 
                                        class="acal__img-icon"
                                        class:acal__img-icon--photo-anim={animPhotos}
                                        style:--photo-x={`${offset.x}px`}
                                        style:--photo-y={`${offset.y}px`}
                                        style:--photo-tilt={`${offset.tilt}deg`}
                                        on:click={() => imgOpenSrc = imgSrc}
                                    >
                                        <img src={imgSrc} alt="Day Icon">
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
    {/if}
</div>

{#if imgOpenSrc}
    <ImgModal 
        img={{ src: imgOpenSrc }} 
        onClickOutside={() => imgOpenSrc = null}
    />
{/if}


<style lang="scss">
    .acal {
        margin-top: 0px;
        width: 100%;
        max-width: 1200px;
        position: relative;

        --dark-cell-opac: 0.0115;
        --obscure-cell-opac: 0.2;
        --hover-opacity: 0.02;
        --hover-opacity-dark: 0.035;
        
        &--light {
            --dark-cell-opac: 0.04;
            --obscure-cell-opac: 0.2;
            --hover-opacity: 0.04;
            --hover-opacity-dark: 0.06;
        }
        &--light &__focus {
            @include text-style(0.45);
        }
        &--light &__star {
            @include text-style(0.5);
        }
        &--light &__goal-cutoff {
            @include text-style(0.7);
        }
        &--light &__dow {
            @include text-style(0.65);
        }

        &__dow {
            text-align: center;
            @include text-style(0.35, var(--fw-400-500), 1.25rem);
        }
        &__days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            height: 25px;
            font-weight: bold;
        }
        &__month {
            height: calc(100% - 30px);
            width: 100%;
        }
        &__week {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        &__day {
            padding: 5px 5px 3px 5px;
            background: rgba(var(--textColor1), 0.0025);
            border-top: var(--divider-border);
            border-left: var(--divider-border);
            width: calc(var(--GRID_WIDTH) / 7);
            height: auto;
            min-height: 100px;
            @include flex-col;
            position: relative;
            cursor: pointer;

            &:hover &-add-btn {
                opacity: 0.2;
            }

            &--first-col {
                background-color: rgba(var(--textColor1), var(--dark-cell-opac));

                &:hover {
                    background-color: rgba(var(--textColor1), var(--hover-opacity-dark)) !important;
                }
            }
            &--last-col {
                border-right: var(--divider-border);
                background-color: rgba(var(--textColor1), var(--dark-cell-opac));

                &:hover {
                    background-color: rgba(var(--textColor1), var(--hover-opacity-dark)) !important;
                }
            }
            &--bottom-row {
                border-bottom: var(--divider-border);
            }
            &--not-curr-month &-num {
                opacity: var(--obscure-cell-opac);
            }
            &--today &-num {
                background-color: var(--calMarkColor);
                color: white;
                @include circle(20px);
            }
            &--drag-over {
                background-color: rgba(var(--textColor1), 0.035);
                @include border-focus;
            }
        }
        &__day--edit {
            background: rgba(var(--textColor1), 0.035) !important;
        }
        &__day:hover {
            background-color: rgba(var(--textColor1), var(--dark-cell-opac));
        }
        &__day-add-btn {
            opacity: 0;

            &:hover {
                opacity: 1 !important;
            }
        }
        &__day-ring {
            @include abs-top-right(8px, 7px);

            i {
                color: rgba(var(--textColor1), 0.1); 
                font-size: 0.9rem;
            }
        }
        &__day-header {
            @include flex(center, space-between);
            flex-wrap: wrap;
            margin-bottom: 6px;
        }
        &__day-num {
            @include center;
            @include text-style(1, var(--fw-400-500), 1.2rem, "Geist Mono");
            margin: 2px 6px 2px 2px;
        }
        &__star {
            margin: 0px 5px 0px -5px;
            @include text-style(0.25, var(--fw-300-400), 1.5rem, "Geist Mono");
        }
        &__focus {
            margin: 2px 4px 0px 2px;
            @include text-style(0.145, var(--fw-400-500), 1.25rem);
        }
        /* goal activity */
        &__goal {
            overflow: hidden;
            position: relative;
            padding: 4.5px 10px 5.5px 8px;
            background-color: rgba(var(--tag-color-2), 1) !important;
            border-radius: 7px;
            white-space: nowrap;
            margin: 2px 0px 2px 2px;
            @include flex(center);
            @include smooth-bounce;
            cursor: pointer;

            &--active {
                transform: scale(0.95);
            }
            i {
                font-style: normal;
                font-size: 0.85rem;
                margin: 0px 6px 0px 7px;
            }
            span {
                @include text-style(0.9, var(--fw-400-500), 1.225rem);
                @include elipses-overflow;
                color: rgba(var(--tag-color-1), 1);
            }
        }
        &__goal-done-icon {
            margin-left: -3px;
        }
        &__goal-checkbox {
            @include square(12px, 3px);
            background-color: rgba(var(--tag-color-1), 0.1);
            margin: 0px 2px 0px -2px;

            &:hover {
                background-color: rgba(var(--tag-color-1), 0.2);
            }
        }
        &__goal-cutoff {
            @include text-style(0.225, 400, 1.15rem, "Geist Mono");
            margin: 1px 3px 0px 4px;
            float: right;
        }

        /* img icon */
        &__img-container {
            @include square(34px);
            margin-top: 10px;
        }
        &__img-icon {
            @include abs-bottom-left(4px, 6px);
            @include smooth-bounce;
            z-index: 1;

            img {
                border: white 2.5px solid;
                transition: 0.15s cubic-bezier(.4, 0, .2, 1);
                @include square(35px, 6px);
                object-fit: cover
            }
        }
        &__img-icon--photo-anim:hover {
            transform: rotate(calc(-1 * var(--photo-tilt)));
            transform: scale(1.5);
        }
        &__img-icon--photo-anim:hover img {
            border: white 2.5px solid;
        }
        &__img-icon--photo-anim {
            @include abs-bottom-left(var(--photo-y), var(--photo-x));
            transform: rotate(var(--photo-tilt));
            @include square(55px, 6px);
        }
        &__img-icon--photo-anim img {
            @include square(55px, 6px);
            border: white 3px solid;
        }
        &__day-activity {
            margin-top: 7px;
        }
    }

    h1 {
        // @include text-style(1.25, 400, 2.25rem, "Geist Mono");
        @include text-style(1, 400, 4rem, "Gambarino Regular");
        margin: 0px 0px 10px 0px;
    }
</style>