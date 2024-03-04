<script lang="ts">
	import { COLOR_SWATCHES, TEST_TAGS, clickOutside, getColorPair, randomArrayElem } from '$lib/utils-general';
	import { onMount } from 'svelte';
    import type { PageData } from './$types';
	import { RoutinesManager } from '$lib/routines-manager';
	import { themeState } from '$lib/store';
	import { getTimeFromIdx, minsToHHMM } from '$lib/utils-date';

    // export let data: PageData;

    const ROUTINES: DailyRoutine[] = [
        { 
            id: "0",
            name: "Workday 1.0",
            description: "Regular work day",
            blocks: [
                {
                    title: "🌤️ Morning Routine",
                    color: COLOR_SWATCHES.d[0],
                    startTime: 370,
                    endTime: 420,
                    activity: null,
                    tag: null,
                },
                {
                    title: "👨‍💻 SWE Deep Work",
                    color: COLOR_SWATCHES.d[1],
                    startTime: 525,
                    endTime: 720,
                    activity: "working",
                    tag: TEST_TAGS[1],
                },
                {
                    title: "🍖 Lunch Break",
                    color: COLOR_SWATCHES.d[2],
                    startTime: 730,
                    endTime: 800,
                    activity: null,
                    tag: null,
                },
                {
                    title: "👨‍💻 SWE Deep Work",
                    color: COLOR_SWATCHES.d[1],
                    startTime: 885,
                    endTime: 1080,
                    activity: "working",
                    tag: TEST_TAGS[1],
                },
                {
                    title: "💪 Gym (Pull)",
                    color: COLOR_SWATCHES.d[3],
                    startTime: 1080,
                    endTime: 1140,
                    activity: "body",
                    tag: TEST_TAGS[0],
                },
                {
                    title: "🍖 Dinner",
                    color: COLOR_SWATCHES.d[4],
                    startTime: 1140,
                    endTime: 1170,
                    activity: null,
                    tag: TEST_TAGS[3],
                },
                {
                    title: "🌙 Evening Routine",
                    color: COLOR_SWATCHES.d[1],
                    startTime: 1380,
                    endTime: 1410,
                    activity: "selfCare",
                    tag: null
                },
            ]
        },
        { 
            id: "zz",
            name: "Weekend",
            description: "Ideal Weekend",
            blocks: [
                {
                    title: "🌤️ Morning Routine",
                    color: COLOR_SWATCHES.d[0],
                    startTime: 480,
                    endTime: 520,
                    activity: null,
                    tag: null
                },
                {
                    title: "🏃‍♂️ Running",
                    color: COLOR_SWATCHES.d[1],
                    startTime: 600,
                    endTime: 690,
                    activity: "working",
                    tag: TEST_TAGS[6]
                },
                {
                    title: "🍖 Lunch Break",
                    color: COLOR_SWATCHES.d[2],
                    startTime: 730,
                    endTime: 800,
                    activity: null,
                    tag: null
                },
                {
                    title: "🌁 Art",
                    color: COLOR_SWATCHES.d[1],
                    startTime: 885,
                    endTime: 920,
                    activity: "selfCare",
                    tag: TEST_TAGS[8]
                },
                {
                    title: "💪 Gym (Push)",
                    color: COLOR_SWATCHES.d[3],
                    startTime: 1000,
                    endTime: 1100,
                    activity: "body",
                    tag: TEST_TAGS[0]
                },
                {
                    title: "🍖 Dinner",
                    color: COLOR_SWATCHES.d[4],
                    startTime: 1130,
                    endTime: 1200,
                    activity: null,
                    tag: TEST_TAGS[3]
                },
                {
                    title: "🌙 Evening Routine",
                    color: COLOR_SWATCHES.d[1],
                    startTime: 1380,
                    endTime: 1410,
                    activity: "selfCare",
                    tag: null
                },
            ]
        }
    ]

    let manager = new RoutinesManager(ROUTINES)
    let timeBoxElem: HTMLElement
    let hozLinesContainerWidth

    let _userRoutines  = manager.userRoutines!
    let _focusedRoutineElems = manager.focusedRoutineElems
    let _focusedRoutine = manager.focusedRoutine
    let _currCores = manager.currCores
    let _newBlock = manager.newBlock
    let _tagBreakdown = manager.currTagBreakdown

    $: selectedTimeFrame = isViewingCore ? "Cores" : "Tags"
    $: userRoutines   = $_userRoutines!
    $: focusedRoutineElems  = $_focusedRoutineElems ?? []
    $: focusedRoutine = $_focusedRoutine
    $: currCores      = $_currCores
    $: tagBreakdown   = $_tagBreakdown ?? []
    $: newBlock       = $_newBlock
    $: isLightTheme   = !$themeState.isDarkTheme
    $: focusedId      = $_focusedRoutine?.id ?? "0"

    let chosenId      = "0"
    let isViewingCore = true

    $: console.log(focusedId)

    function getBlockStyling(height: number) {
        const classes: string[] = []

        if (height < 12) {
            classes.push("routine-time-blocks__block--xsm")
        }
        if (height < 20) {
            classes.push("routine-time-blocks__block--sm")
        }
        if (height < 34) {
            classes.push("routine-time-blocks__block--md")
        }
        return classes.join(" ")
    }
    
    onMount(() =>{
        requestAnimationFrame(() => {
            manager.initDayRoutines(ROUTINES[0].id, timeBoxElem)
        })
    })
</script>

<div 
    class="routines"
    class:routines--light={isLightTheme}
    class:routines--dark={!isLightTheme}
>
    <!-- Routines List -->
    <div class="routines__collection">
        <ul>
            {#each userRoutines as routine}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li 
                    class="routines__routine-item" 
                    class:routines__routine-item--chosen={routine.id === chosenId}
                    class:routines__routine-item--clicked={routine.id === focusedId}
                    on:click={() => manager.initCurrentRoutine(routine.id)}
                >
                    <span>
                        {routine.name}
                    </span>
                    <div class="routines__routine-item-check">
                        <i class="fa-solid fa-check"></i>
                    </div>
                </li>
            {/each}
        </ul>
    </div>
    <div class="routines__divider routines__divider--first"></div>
    <!-- Picked Routine Details -->
    <div class="routines__routine-details-container ">
        <div class="routine__details">
            <h2 class="routine__details-title">
                {ROUTINES[0].name}
            </h2>
            <p class="routine__details-description">
                {ROUTINES[0].description}
            </p>
        </div>
        <!-- Breakdown -->
        <div class="routine__breakdown">
            <!-- Cores -->
            <div class="routine__core-breakdown">
                <h3>Routine Cores</h3>
                {#if currCores}
                    <div class="routine__cores">
                        <div class="routine__cores-col">
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Sleeping</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.sleeping.totalTime)}
                                </div>
                            </div>
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Awake</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.awake.totalTime)}
                                </div>
                            </div>
                        </div>
                        <div class="routine__cores-col-divider"></div>
                        <div class="routine__cores-col">
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Working</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.working.totalTime)}
                                </div>
                            </div>
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Self-Care</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.selfCare.totalTime)}
                                </div>
                            </div>
                        </div>
                        <div class="routine__cores-col-divider"></div>
                        <div class="routine__cores-col">
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Mind</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.mind.totalTime)}
                                </div>
                            </div>
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Body</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.body.totalTime)}
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
            <!-- Tag Breakdown -->
            <div class="routine__tag-breakdown">
                <h3>Tag Breakdown</h3>
                {#each tagBreakdown as tagData}
                    {@const colorTrio = getColorPair(tagData.tag.symbol.color, isLightTheme)}
                    <div class="routine__tag">
                        <div 
                            class="routine__tag-content"
                            style:--tag-color-primary={tagData.tag.symbol.color.primary}
                            style:--tag-color-1={colorTrio[0]}
                            style:--tag-color-2={colorTrio[1]}
                            style:--tag-color-3={colorTrio[2]}
                        >
                            <span class="routine__tag-symbol">
                                {tagData.tag.symbol.emoji}
                            </span>
                            <div class="routine__tag-title">
                                {tagData.tag.name}
                            </div>
                        </div>
                        <div class="routine__tag-stat">
                            {minsToHHMM(tagData.data.totalTime)}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
    <div class="routines__divider"></div>
    <!-- Picked Routine Time Blocks -->
    <div 
        class="routines__time-box-container" 
        bind:this={timeBoxElem}
    >
        <div class="routines__time-box">
            <div 
                class="routine-time-blocks"
                class:routine-time-blocks--no-pointer-events={newBlock}
                on:pointerdown={(e) => manager.onTimeBoxPointerDown(e)}
                id={manager.TIME_BOX_ID}
            >
                {#each focusedRoutineElems as block (block.id)}
                    {@const colorTrio = getColorPair(block.color, isLightTheme)}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        class={`routine-time-blocks__block ${getBlockStyling(block.height)}`}
                        style:top={block.yOffset}
                        style:left={block.xOffset}
                        style:--block-height={`${block.height}px`}
                        style:--block-color-1={colorTrio[0]}
                        style:--block-color-2={colorTrio[1]}
                        style:--block-color-3={colorTrio[2]}
                        title={`${block.title} \n${block.startTimeStr} - ${block.endTimeStr}`}
                        on:click={
                            (e) => manager.onBlockPointerDown(e, block.id)
                        }
                    >
                        <div class="routine-time-blocks__block-content">
                            <div class="flx flx--algn-center">
                                <span class="routine-time-blocks__block-title">
                                    {block.title}
                                </span>
                            </div>
                            <div class="routine-time-blocks__block-time-period">
                                <span>{block.startTimeStr}</span>
                                <span>-</span>
                                <span>{block.endTimeStr}</span>
                            </div>
                        </div>
                        <div class="routine-time-blocks__block-spine"></div>
                    </div>
                {/each}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                {#if newBlock}
                    {@const colorTrio = getColorPair(newBlock.color, isLightTheme)}
                    <div 
                        class={`routine-time-blocks__block ${getBlockStyling(newBlock.height)}`}
                        id="dummy-block"
                        style:top={newBlock.yOffset}
                        style:left={newBlock.xOffset}
                        style:--block-height={`${newBlock.height}px`}
                        style:--block-color-1={colorTrio[0]}
                        style:--block-color-2={colorTrio[1]}
                        style:--block-color-3={colorTrio[2]}
                        title="Untitled Block"
                    >
                        <div class="routine-time-blocks__block-content">
                            <div class="flx flx--algn-center">
                                <span class="routine-time-blocks__block-title">
                                    {newBlock.title}
                                </span>
                            </div>
                            <div class="routine-time-blocks__block-time-period">
                                <span>{newBlock.startTimeStr}</span>
                                <span>-</span>
                                <span>{newBlock.endTimeStr}</span>
                            </div>
                        </div>
                        <div class="routine-time-blocks__block-spine"></div>
                    </div>
                {/if}
            </div>
           <!-- Hour Blocks -->
            <div class="hour-blocks-container scroll-bar-hidden" >
                <div class="hour-blocks">
                    {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                        {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                        {@const height = (60 / 1440) * 100}
                        <div 
                            class="hour-blocks__block"
                            style:top={`calc(${headOffsetPerc}% - 0px)`}
                            style:height={`${height}%`}
                        >
                            <span>{getTimeFromIdx(timeIdx)}</span>
                            <div class="hour-blocks__block-vert-divider">
                                <svg xmlns="http://www.w3.org/2000/svg" width="2" height=28 viewBox={`0 0 2 28`} fill="none">
                                    <path d="M1.25684 0.614746V 32.5" stroke-width="0.9" stroke-dasharray="2 2"/>
                                </svg>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
            <!-- Hoz Lines -->
            <div class="hoz-lines-container" bind:clientWidth={hozLinesContainerWidth}>
                <div class="hoz-lines">
                    {#if timeBoxElem}
                        {@const width = hozLinesContainerWidth}
                        {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                            {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                            {@const height = (60 / 1440) * 100}
                            <div 
                                class="hoz-lines__line"
                                style:top={`calc(${headOffsetPerc}% + 1px)`}
                                style:height={`${height}%`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width={width} height="2" viewBox={`0 0 ${width} 2`} fill="none">
                                    <path d={`M0 1H ${width}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                </svg>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../../../scss/day-box.scss";
    @import "../../../../scss/dropdown.scss";
    @import "../../../../scss/components/routines.scss";

    $hour-blocks-top-offset: 35px;
    $hour-block-height: 50px;

    .routines {
        display: flex;
        width: 100%;
        height: calc(100% - 72px);

        &--light {

        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }

        &__collection {
            width: clamp(170px, 20%, 195px);
            h3 {
                @include text-style(1, 400, 1.7rem);
                margin-bottom: 12px;
            }
            ul {
                width: 100%;
            }
        }
        &__routine-item {
            margin: 0px 0px 1px -12px;
            padding: 5.5px 12px;
            border-radius: 8px;
            transition: 0.03s ease-in-out;
            cursor: pointer;
            opacity: 0.8;
            @include flex(center, space-between);
            @include elipses-overflow;

            &--chosen &-check {
                @include visible;
            }
            &--clicked {
                opacity: 1;
                @include txt-color(0.03, "bg");
            }
            &--clicked span {
                opacity: 0.9 !important;
            }
            
            &:active {
                transform: scale(0.995);
            }
            &:hover {
                opacity: 1;
                @include txt-color(0.03, "bg");
            }
            &:hover span {
                opacity: 0.9;
            }

            span {
                @include text-style(_, 300, 1.28rem, "DM Mono");
                opacity: 0.4;
            }
        }
        &__routine-item-check {
            @include text-style(0.6, 300, 1.3rem);
            @include not-visible;
        }
        &__divider {
            @include divider(0.04, calc(100% - 20px), 0.5px);
            margin: 0px min(4%, 32px);

            &--first {
                margin-left: min(4%, 20px);
            }
        }
        &__time-box-container {
            flex: 1;
            position: relative;
            height: calc(100% - 10px);
            overflow-y: scroll;
            overflow-x: hidden;
        }
        &__time-box {
            width: 100%;
            display: flex;
            height: calc(($hour-block-height * 24));
            padding-right: 20px;
        }
        &__routine-details-container {
            width: clamp(270px, 30%, 320px);
            position: relative;
        }
    }

    .routine {
        &__breakdown h3 {
            @include text-style(0.8, 400, 1.32rem);
            margin-bottom: 11px;
        }
        &__tag {
            margin-left: -5px;
        }
        &__tag-breakdown h3 {
            margin-bottom: 14px;
        }
    }

    .routine-time-blocks {
        @include pos-abs-top-left-corner(-2px, 85px);
        width: calc(100% - 85px);
        height: calc(($hour-block-height * 24));

        &--no-pointer-events &__block {
            pointer-events: none;
        }
        &__block {
            width: 80%;
            border-radius: 9px;
        }
    }
    .routine-time-blocks {

    }
    .hour-blocks {
        height: calc(($hour-block-height * 24));
        width: 50px;
        
        &-container {
            width: 50px;
            overflow: hidden;
        }
        &__blocks {
            height: calc(($hour-block-height * 24));
            width: 50px;
        }
        &__block {
            width: 40px;
            left: -5px;
        }
        &__block span {
            width: 40px;
        }
    }
    .hoz-lines {
        height: 100%;
        position: relative;
        overflow: hidden;
        
        &-container {
        }
        &__line {
            height: 50px;
            width: 100%;
        }
    }
</style>