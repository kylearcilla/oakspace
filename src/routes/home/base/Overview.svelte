<script lang="ts">
    import { themeState } from "$lib/store"
    import { isSameDay } from "$lib/utils-date"
    import { getColorTrio } from "$lib/utils-colors"
    import { ACTIVITY_DATA } from "$lib/mock-data"
	import { minsToHHMM } from "../../../lib/utils-date"
	import { OverviewManager } from "$lib/overview-manager"
	import { MONTH_THOUGHT_ENTRY } from "../../../lib/mock-data"
	import { formatDateLong, genMonthCalendar } from "$lib/utils-date"
	import { formatPlural, randomArrayElem } from "$lib/utils-general"
    
	import { onMount } from "svelte"
	import TextEntry from "./TextEntry.svelte"
	import ImgStampModal from "./HighlightImgModal.svelte"
	import DropdownList from "../../../components/DropdownList.svelte"

    export let onDayClicked: (dayIdx: number) => void
    export let options

    $: isLight = !$themeState.isDarkTheme

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
    const manager = new OverviewManager(ACTIVITY_DATA)

    let gridWidth = 0
    let gridHeight = 0
    let gridElem: HTMLElement
    let store: OverviewState | null = null

    $: animPhotos = options?.animPhotos ?? true
    $: if (manager.state) {
        manager.state.subscribe((data) => {
            store = data
        })
    }

    function getFontFamily(style: string) {
        if (style === "basic") {
            return { fam: "Manrope", size: "1.25rem" }
        }
        else if (style === "stylish") {
            return { fam: "Gambarino-Regular" , size: "1.35rem" }
        }
        else if (style === "fancy") {
            return { fam: "Melodrama-Bold", size: "1.25rem" }
        }
        else if (style === "cute") {
            return { fam: "Bagel Fat One", size: "1.4rem" }
        }
    }

    onMount(() => {
        manager.initContainerRef(gridElem)
    })
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
    {#if store}
        <div class="acal__days">
            <div class="acal__dow">Sun</div>
            <div class="acal__dow">Mon</div>
            <div class="acal__dow">Tue</div>
            <div class="acal__dow">Wed</div>
            <div class="acal__dow">Thu</div>
            <div class="acal__dow">Fri</div>
            <div class="acal__dow">Sat</div>
        </div>

        {@const { weeks, hasContextMenu, contextPos, editDay, imgModal } = store}

        <div 
            class="acal__month"
            bind:this={gridElem}
            bind:clientWidth={gridWidth}
            bind:clientHeight={gridHeight}
        >
            {#each weeks as week, weekIdx}
                <div class="acal__week">
                    {#each week as day}
                        {@const d   = day.date.getDate()}
                        {@const dow = day.date.getDay()}
                        {@const sameMonth = day.isInCurrMonth}
                        {@const { entry }  = manager.findDayEntry(day.date)}
                        {@const highlightImg  = entry?.highlightImg}
                        {@const { count } = manager.getGoalsDisplayData(entry?.goals ?? [])}
                        {@const showHabits = options.habitsMark && sameMonth}
                        {@const showFocus = options.focusTime && Math.random() > 0.7 && sameMonth}
            
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div 
                            class="acal__day"
                            class:acal__day--edit={isSameDay(day.date, editDay?.date)}
                            class:acal__day--first-col={dow === 0}
                            class:acal__day--last-col={dow === 6}
                            class:acal__day--bottom-row={weekIdx === 5}
                            class:acal__day--not-curr-month={!sameMonth}
                            class:acal__day--anim-photos={animPhotos}
                            class:acal__day--today={isSameDay(day.date, new Date())}
                            on:contextmenu|preventDefault={(e) => manager.onContextMenu(e, day.date)}
                        >
                            <div>
                                <div class="acal__day-header">
                                    <div class="flx-algn-center">
                                        <span class="acal__day-num">{d}</span>
                                        {#if showHabits}
                                            <span class="acal__star">
                                                {#if Math.random() > 0.7}
                                                    *
                                                {/if}
                                            </span>
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
                                {#if entry?.goals}
                                    {@const goals = entry.goals}
                                    {@const showAmount  = GOALS_LIST_MAX}
                                    {@const cutoff = goals.length - showAmount}
            
                                    <div>
                                        {#each goals.slice(0, showAmount) as goal}
                                            {@const symbol = goal.tag.symbol}
                                            {@const colors = getColorTrio(symbol.color, isLight)}
                                            <div 
                                                draggable={true}
                                                class="acal__goal"
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
                                    </div>
                                    {#if cutoff > 0}
                                        <div class="acal__goal-cutoff">
                                            {cutoff} more
                                        </div>
                                    {/if}
                                {/if}
                            </div>
            
                            <!-- icon -->
                            {#if highlightImg && entry?.goals?.length > 0}
                                {@const offset = randomArrayElem(PHOTO_OFFSETS)}

                                <div class="acal__img-container">
                                    <button 
                                        class="acal__img-icon"
                                        class:acal__img-icon--photo-anim={animPhotos}
                                        style:--photo-x={`${offset.x}px`}
                                        style:--photo-y={`${offset.y}px`}
                                        style:--photo-tilt={`${offset.tilt}deg`}
                                        on:click={() => manager.onPhotoClicked(day.date)}
                                    >
                                        <img src={highlightImg.src} alt="Day Icon">
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/each}
        </div>

        <DropdownList
            id={"activity-cal"}
            isHidden={!hasContextMenu}
            options={{
                listItems: [
                    {
                        sectionName: formatDateLong(editDay?.date),
                        font: "mono"
                    },
                    { 
                        name: "Add a Goal"
                    }
                ],
                onListItemClicked: ({ name }) => {
                    manager.onSettingsOptnClicked(name)
                },
                onClickOutside: () => {
                    manager.closeContextMenu()
                },
                styling: {
                    width: "140px",
                },
                position: { 
                    top: `${contextPos.top}px`, 
                    left: `${contextPos.left}px`
                }
            }}
        />

        {#if imgModal && editDay} 
            <ImgStampModal 
                img={editDay.data.highlightImg}
                onClickOutside={() => manager.closeEdit()}
            />
        {/if}
    {/if}
</div>


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
            --hover-opacity: 0.03;
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
                background-color: #FF5151;
                color: white;
                @include circle(20px);
            }
        }
        &__day--edit {
            background: rgba(var(--textColor1), 0.035) !important;
        }
        &__day:hover {
            background: rgba(var(--textColor1), var(--hover-opacity));
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
            @include text-style(1, var(--fw-400-500), 1.25rem);
            margin: 2px 5px 2px 2px;
        }
        &__star {
            margin: 0px 5px 0px 0px;
            @include text-style(0.25, var(--fw-300-400), 1.35rem, "DM Mono");
        }
        &__focus {
            margin: 2px 4px 0px 2px;
            @include text-style(0.145, var(--fw-400-500), 1.125rem, "Geist Mono");
        }
        /* goal activity */
        &__goal {
            overflow: hidden;
            position: relative;
            padding: 2.5px 10px 3.5px 4px;
            background-color: rgba(var(--tag-color-2), 1) !important;
            border-radius: 7px;
            white-space: nowrap;
            margin: 2px 0px 2px 2px;
            @include flex(center);
            @include smooth-bounce;
            cursor: pointer;

            i {
                font-style: normal;
                font-size: 1.1rem;
                margin: 0px 6px 0px 14px;
            }
            span {
                @include text-style(0.9, var(--fw-400-500), 1.225rem);
                @include elipses-overflow;
                color: rgba(var(--tag-color-1), 1);
            }
            &::before {
                content: " ";
                @include abs-top-left(50%, 8px);
                @include square(4px, 2px);
                background: rgba(var(--tag-color-1), 1);
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
                border: white 3px solid;
                transition: 0.1s cubic-bezier(.4, 0, .2, 1);
                @include square(50px, 6px);
                object-fit: cover
            }
        }
        &__img-icon:hover img {
            @include square(75px, 12px);
        }
        &__img-icon--photo-anim:hover {
            transform: rotate(calc(-1 * var(--photo-tilt)))
        }
        &__img-icon--photo-anim {
            @include abs-bottom-left(var(--photo-y), var(--photo-x));
            transform: rotate(var(--photo-tilt))
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