<script lang="ts">
	import type { Writable } from "svelte/store"
    
    import { Icon } from "$lib/enums"
	import { months } from "$lib/utils-date"
    import { imageUpload } from "$lib/pop-ups"
    import { getYearBounds } from "$lib/utils-home"
	import { goalTracker, themeState } from "$lib/store"
    import { GoalsViewManager } from "$lib/goals-view-manager"
	import { kebabToNormal, normalToKebab } from "$lib/utils-general"
	import { getGoalHeatMap, getPageOptions, getYearData, PERIODS, saveOptions } from "$lib/utils-goals"
    
	import LeftMargin from "./LeftMargin.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import HeatMap from "$components/HeatMap.svelte"
	import GoalsView from "$components/GoalsView.svelte"
	import TextEntry from "$components/TextEntry.svelte"
	import ProgressBar from "$components/ProgressBar.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte"
	import PinnedGoals from "$components/PinnedGoals.svelte"
	import BannerHeader from "$components/BannerHeader.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import ConfirmationModal from "$components/ConfirmationModal.svelte"
    
    const SIDE_PADDING = 20
    const LEFT_COL_WIDTH = 170
    const QUARTERS = ["q1", "q2", "q3", "q4"]

    let yearEntryData: GoalYearData | null = null

    let pageView: GoalsPageOptions = {
        showIcon: true,
        pinned: false,
        leftCol: true,
        showYearEntry: true,
        showMonthEntry: true,
        progressBars: true,
        heatmap: true,
        heatmapEmojis: true,
        carousel: false,
        marginLeftView: {
            showPinned: true,
            showNext: true,
            showOverdue: true,
            heights: {
                pinnedHeight: 125,
                upcomingHeight: 120,
                overdueHeight: 180
            }
        }
    }
    let goalsView: GoalsViewOptions = {
        view: "list",
        progress: 0.5,
        list: {
            grouping: "default",
            showProgress: true,
            due: false,
            dueType: "date"
        },
        board: {
            grouping: "status",
            showProgress: true,
            due: false,
            imgs: false,
            dueType: "date"
        }
    }

    let pinnedGoals: Goal[] = []
    let heatMapData: YearHeatMapData[] = []
    let init = false

    let marginOptions = false
    let marginOptionsXPos = 0
    let closing = false
    
    let periodEntry: TextEntryOptions | null = null
    let monthOptions = false
    let optionsOpen = false
    let renderFlag = false

    let now = new Date()
    let currYear = now.getFullYear()
    let periodIdx = now.getMonth()

    let viewPeriod: string = "mar"
    let hoverMonth: string | null = null

    let manager: GoalsViewManager | null = null
    let rightContainerRef: HTMLElement | null = null
    let dragTarget: GoalDragTarget | null = null

    let { minDate, maxDate } = getYearBounds()

    let viewState: Writable<GoalsViewState>
    let viewUIState: Writable<GoalsViewUIState>

    $: light = !$themeState.isDarkTheme
    $: store = goalTracker
    
    $: if ($store.init && !init) initData()
    $: if (init) saveOptions({ page: pageView, view: goalsView })
    
    $: hasImgIcon = yearEntryData?.smallImg && pageView.showIcon
    $: hasBannerImg = yearEntryData?.bannerImg

    $: viewProgress = $viewState?.viewProgress
    $: yrProgress = $viewState?.yrProgress
    $: pinnedGoals = $viewState?.pinnedGoals
    $: deleteConfirm = $viewUIState?.deleteConfirm

    let initDragY = -1
    let srcGoal: Goal | null = null
    
    function initData() {
        const { page, view } = getPageOptions()

        if (init) return
        if (page) pageView = page
        if (view) goalsView = view
        
        init = true
        manager = new GoalsViewManager({ 
            goals: [], 
            grouping: goalsView.list.grouping,
            timeFrame: { year: currYear, period: viewPeriod }
        })
        viewState = manager.state
        viewUIState = manager.uiState

        updateYear(currYear)
        setPeriodIdx(periodIdx)

        heatMapData = getGoalHeatMap(currYear)

        manager.state.subscribe(() => {
            heatMapData = getGoalHeatMap(currYear)
        })
        manager.uiState.subscribe((ui: GoalsViewUIState) => {
            srcGoal = manager!.dragSrc
            dragTarget = ui.dragTarget
            if (!dragTarget) {
                hoverMonth = null
            }
        })

        goalTracker.update((s) => ({ ...s, view: manager }))
    } 
    function setPeriodIdx(idx: number) {
        idx = idx < 0 ? 16 : idx > 16 ? 0 : idx

        const period = PERIODS[idx]
        viewPeriod = period
        periodIdx = idx
        
        const data = manager!.setViewPeriod({ year: currYear, period })
        periodEntry = data.entry
    }

    /* time periods */
    function updateYear(year: number) {
        currYear = year

        const data = manager!.setViewPeriod({ year, period: viewPeriod })
        yearEntryData = getYearData({ year })
        heatMapData = getGoalHeatMap(year)
        periodEntry = data.entry
    }

    /* options */
    function onOptionClicked(name: string) {
        if (name === "Remove Banner") {
            yearEntryData!.bannerImg = null
        }
        else {
            imageUpload.init({
                onSubmitImg: (src) => {
                    if (yearEntryData?.entry) {
                        yearEntryData.bannerImg = { src, center: 50 }
                    }
                }
            })
        }
        optionsOpen = false
    }
    function viewOption(optn: string, val?: string) {
        const type = goalsView.view

        if (optn === "View Type") {
            goalsView.view = val as "list" | "board"
            renderFlag = !renderFlag
        }
        else if (optn === "Grouping") {
            goalsView[type].grouping = val as "default" | "status" | "tag"
        }
        else if (optn === "Month Entry") {
            pageView.showMonthEntry = !pageView.showMonthEntry
        }
        else if (optn === "Show Progress") {
            goalsView[type].showProgress = !goalsView[type].showProgress
        }
        else if (optn === "Show Due Date") {
            goalsView[type].due = !goalsView[type].due
        }
        else if (optn === "Due Distance") {
            goalsView[type].dueType = goalsView[type].dueType === "distance" ? "date" : "distance"
        }
        else if (optn === "Show Images") {
            goalsView.board.imgs = !goalsView.board.imgs
        }
        else if (optn === "Pinned") {
            pageView.marginLeftView.showPinned = !pageView.marginLeftView.showPinned
        }
        else if (optn === "Upcoming") {
            pageView.marginLeftView.showNext = !pageView.marginLeftView.showNext
        }
        else if (optn === "Overdue") {
            pageView.marginLeftView.showOverdue = !pageView.marginLeftView.showOverdue
        }
    }
</script>

{#if init}
    <div 
        class="goals" 
        class:goals--light={light}
        class:goals--icon={pageView.showIcon}

        style:cursor={initDragY >= 0 ? "ns-resize" : "default"}
        style:--left-col-width={pageView.leftCol ? `${LEFT_COL_WIDTH}px` : "0px"}
        style:--side-padding={`${SIDE_PADDING}px`}
        style:--icon-offset={hasImgIcon ? (hasBannerImg ? "35px" : "120px") : "0px"}
    >
        <div class="flx-center" style:height="100%">
            {#if manager && pageView.leftCol}       
                <div class="goals__left">
                    <LeftMargin {manager} options={pageView.marginLeftView} />
                </div>
            {/if}
            <div class="goals__right">
                <div style:margin-bottom="16px">
                    <BannerHeader 
                        year={currYear}
                        showIcon={pageView.showIcon}
                    />
                </div>
                <div>
                    <div class="goals__header" bind:this={rightContainerRef}>
                        <!-- <h1>{currYear}</h1> -->
                        <h1>Goals</h1>
                        {#key yearEntryData}
                            {#if pageView.showYearEntry && yearEntryData?.entry}
                                <div style:margin-top="-8px">
                                    <TextEntry 
                                        id="yr"
                                        zIndex={50}
                                        entry={yearEntryData.entry}
                                    />
                                </div>
                            {/if}
                        {/key}
                        <div class="goals__header-settings">
                            <div class="flx-center" style:margin="0px 0px -4px 0px">
                                <div style:margin="10px 0px 10px 14px" class:hidden={!pageView.progressBars}>
                                    <ProgressBar progress={yrProgress} />
                                </div>
                                <div class="goals__year">
                                    {currYear}
                                </div>
                                <button 
                                    on:click={() => updateYear(currYear - 1)}
                                    class="goals__arrow"
                                    disabled={currYear === minDate.getFullYear()}
                                    style:margin-left="10px"
                                >
                                    <div style:margin-left={"-2px"}>
                                        <SvgIcon 
                                            icon={Icon.ChevronLeft} options={{ scale: 1.4 }}
                                        />
                                    </div>
                                </button>
                                <button 
                                    on:click={() => updateYear(currYear + 1)}
                                    class="goals__arrow"
                                    disabled={currYear === maxDate.getFullYear()}
                                    style:margin-left="5px"
                                >
                                    <div style:margin-right={"-2px"}>
                                        <SvgIcon icon={Icon.ChevronRight} options={{ scale: 1.4 }}/>
                                    </div>
                                </button>
                            </div>
                            <div class="goals__settings-btn">
                                <SettingsBtn 
                                    id={"goals-page"}
                                    onClick={() => optionsOpen = !optionsOpen}
                                />
                            </div>
                        </div>
                        <DropdownList 
                            id={"goals-page"}
                            isHidden={!optionsOpen}
                            relDir="r"
                            options={{
                                listItems: [
                                    {
                                        sectionName: "Banner",
                                    },
                                    {
                                        name: hasBannerImg ? "Change Banner" : "Add Banner",
                                        divider: !hasBannerImg
                                    },
                                    {
                                        name: hasBannerImg ? "Remove Banner" : "",
                                        divider: !!hasBannerImg,
                                    },
                                    {
                                        sectionName: "Header",
                                    },
                                    { 
                                        name: "Icon Image",
                                        active: pageView.showIcon,
                                        onToggle: () => pageView.showIcon = !pageView.showIcon
                                    },
                                    { 
                                        name: "Year Entry",
                                        active: pageView.showYearEntry,
                                        divider: true,
                                        onToggle: () => pageView.showYearEntry = !pageView.showYearEntry
                                    },
                                    {
                                        sectionName: "Details",
                                    },
                                    { 
                                        name: "Pinned Goals",
                                        active: pageView.carousel, 
                                        onToggle: () => pageView.carousel = !pageView.carousel
                                    },
                                    { 
                                        name: "Progress Bars",
                                        divider: true,
                                        active: pageView.progressBars,
                                        onToggle: () => pageView.progressBars = !pageView.progressBars
                                    },
                                    {
                                        sectionName: "Heatmap",
                                    },
                                    { 
                                        name: "Show",
                                        active: pageView.heatmap,
                                        divider: !pageView.heatmap,
                                        onToggle: () => pageView.heatmap = !pageView.heatmap
                                    },
                                    { 
                                        name: pageView.heatmap ? "Use Emojis" : "",
                                        active: pageView.heatmapEmojis,
                                        divider: true,
                                        onToggle: () => {
                                            pageView.heatmapEmojis = !pageView.heatmapEmojis
                                        }
                                    },
                                    {
                                        sectionName: "Left Margin",
                                        divider: true,
                                    },
                                    { 
                                        name: "Show",
                                        active: pageView.leftCol,
                                        onToggle: () => pageView.leftCol = !pageView.leftCol
                                    },
                                    { 
                                        name: "View Options",
                                        childId: "left-margin",
                                        leftOffset: -2,
                                        onPointerOver: ({ childXPos }) => {
                                            if (!closing) {
                                                marginOptions = true
                                            }
                                            marginOptionsXPos = childXPos
                                        },
                                        onPointerLeave: () => {
                                            marginOptions = false
                                        }
                                    }
                                ],
                                onClickOutside: () => {
                                    optionsOpen = false
                                },
                                onListItemClicked: ({ name }) => {
                                    onOptionClicked(name)
                                },
                                rootRef: rightContainerRef,
                                styling: { 
                                    zIndex: 1000,
                                    minWidth: "155px"
                                },
                                position: { 
                                    top: "0px",
                                    right: "0px",
                                }
                            }}
                        />
                        <DropdownList 
                            id={"goals-page"}
                            childId={"left-margin"}
                            isHidden={!marginOptions || !optionsOpen}
                            options={{
                                listItems: [
                                    {
                                        sectionName: "Left Margin"
                                    },
                                    { 
                                        name: "Pinned",
                                        active: pageView.marginLeftView.showPinned,
                                        onToggle: () => viewOption("Pinned")
                                    },
                                    { 
                                        name: "Upcoming",
                                        active: pageView.marginLeftView.showNext,
                                        onToggle: () => viewOption("Upcoming")
                                    },
                                    { 
                                        name: "Overdue",
                                        active: pageView.marginLeftView.showOverdue,
                                        onToggle: () => viewOption("Overdue")
                                    },
                                ],
                                styling:  { 
                                    width: "140px",
                                    zIndex: 1000,
                                },
                                position: { 
                                    top: "350px", 
                                    right: `${marginOptionsXPos}px`,
                                },
                                parentId: "goals-page",
                                onDismount: () => {
                                    closing = false
                                },
                                onPointerLeave: () => {
                                    marginOptions = false
                                }
                            }}
                    />

                    </div>
            
                    <div class="goals__content">
                        <div class="goals__heatmap" class:hidden={!pageView.heatmap}>
                            <HeatMap 
                                type="goals" 
                                year={currYear} 
                                data={heatMapData} 
                                options={{ emojis: pageView.heatmapEmojis }}
                            />
                        </div>

                        {#if pageView.carousel && manager}
                            <div class="goals__pinned">
                                <PinnedGoals 
                                    goals={pinnedGoals} 
                                    dragTarget={dragTarget}
                                    onReorder={(src, target) => {
                                        manager?.reorderPinnedGoals(src, target)
                                    }}
                                    onDragLeave={() => {
                                        manager?.resetGoalsDragTarget()
                                    }}
                                    onDragEnter={(e, goal) => {
                                        manager?.onDragEnter(e, goal)
                                    }}
                                />
                            </div>
                        {/if}
                
                        <div class="goals__month">
                            <div class="goals__month-header">
                                <div class="goals__months no-scroll-bar">
                                    {#each months as month, midx}
                                        {@const mo = month.slice(0, 3).toLowerCase()}
                                        {@const quarter = QUARTERS[Math.floor(midx / 3)]}
                                        {@const current = now.getMonth() === midx && currYear === now.getFullYear()}
                                        <button 
                                            data-drag-context={"month"}
                                            class="goals__month-item"
                                            class:goals__month-item--active={midx === periodIdx}
                                            class:goals__month-item--min-active={quarter === viewPeriod}
                                            class:goals__month-item--now={current}
                                            class:goals__month-item--drag-over={hoverMonth === mo}
                                            on:click={() => {
                                                setPeriodIdx(midx)
                                            }}
                                            on:dragover={(e) => {
                                                if (!srcGoal) return

                                                e.preventDefault()
                                                manager?.onDragEnter(e, midx)
                                                hoverMonth = mo
                                            }}
                                            on:dragleave={() => {
                                                hoverMonth = null
                                                manager?.resetGoalsDragTarget()
                                            }}
                                        >
                                            {month.slice(0, 3)}
                                        </button>
                                    {/each}
                                    <div class="flx-center" style:opacity="0.65">
                                        <div class="goals__quarters">
                                            {#each ["Q1", "Q2", "Q3", "Q4"] as quarter, qidx}
                                                {@const q = quarter.toLowerCase()}
                                                {@const moInQ = periodIdx <= 11 && QUARTERS[Math.floor(periodIdx / 3)] === q}
                                                <button 
                                                    class="goals__month-item"
                                                    class:goals__month-item--active={periodIdx === qidx + 12}
                                                    class:goals__month-item--min-active={moInQ}
                                                    on:click={() => setPeriodIdx(qidx + 12)}
                                                >
                                                    {quarter}
                                                </button>
                                            {/each}
                                        </div>
                                        <button 
                                            class="goals__month-item"
                                            class:goals__month-item--active={periodIdx === 16}
                                            on:click={() => setPeriodIdx(16)}
                                        >
                                            All
                                        </button>
                                    </div>
                                </div>
                                <div class="goals__month-settings">
                                    <div class="flx-center" style:margin="0px 0px -4px 0px">
                                        <div 
                                            style:margin="10px 0px 10px 14px" 
                                            class:hidden={!pageView.progressBars}
                                        >
                                            <ProgressBar progress={viewProgress} />
                                        </div>
                                        <button 
                                            on:click={() => setPeriodIdx(periodIdx - 1)}
                                            class="goals__arrow"
                                            style:margin-left="10px"
                                        >
                                            <div style:margin-left={"-2px"}>
                                                <SvgIcon 
                                                    icon={Icon.ChevronLeft} options={{ scale: 1.4 }}
                                                />
                                            </div>
                                        </button>
                                        <button 
                                            on:click={() => setPeriodIdx(periodIdx + 1)}
                                            class="goals__arrow"
                                            style:margin-left="5px"
                                        >
                                            <div style:margin-right={"-2px"}>
                                                <SvgIcon icon={Icon.ChevronRight} options={{ scale: 1.4 }}/>
                                            </div>
                                        </button>
                                    </div>
                                    <div class="goals__settings-btn">
                                        <SettingsBtn 
                                            id={"goals"}
                                            onClick={() => monthOptions = !monthOptions}
                                        />
                                        
                                        <DropdownList 
                                            id={"goals"}
                                            isHidden={!monthOptions}
                                            renderFlag={renderFlag}
                                            options={{
                                                listItems: [
                                                    { 
                                                        pickedItem: kebabToNormal(goalsView.view),
                                                        twinItems: [
                                                            { name: "List", faIcon: "fa-solid fa-list-check" }, 
                                                            { name: "Board", faIcon: "fa-solid fa-square-poll-vertical", size: "1.65rem" }
                                                        ],
                                                        onListItemClicked: ({ name }) => {
                                                            viewOption("View Type", normalToKebab(name))
                                                        }
                                                    },
                                                    { 
                                                        name: "Grouping",
                                                        pickedItem: kebabToNormal(goalsView[goalsView.view].grouping),
                                                        items: [
                                                            { name: goalsView.view === "list" ? "Default" : "" },
                                                            { name: "Status" },
                                                            { name: "Tag" }
                                                        ],
                                                        onListItemClicked: ({ name }) => {
                                                            viewOption("Grouping", normalToKebab(name))
                                                        }
                                                    },
                                                    { 
                                                        name: "Month Entry",
                                                        active: pageView.showMonthEntry,
                                                        divider: goalsView.view === "list",
                                                        onToggle: () => viewOption("Month Entry")
                                                    },
                                                    { 
                                                        name: goalsView.view === "board" ? "Show Images" : "",
                                                        active: goalsView.board.imgs,
                                                        divider: true,
                                                        onToggle: () => viewOption("Show Images")
                                                    },
                                                    {
                                                        sectionName: "Details",
                                                    },
                                                    { 
                                                        name: "Show Progress",
                                                        active: goalsView[goalsView.view].showProgress,
                                                        onToggle: () => viewOption("Show Progress")
                                                    },
                                                    { 
                                                        name: "Show Due Date",
                                                        active: goalsView[goalsView.view].due,
                                                        onToggle: () => viewOption("Show Due Date")
                                                    },
                                                    { 
                                                        name: goalsView[goalsView.view].due ? "Distance" : "",
                                                        active: goalsView[goalsView.view].dueType === "distance",
                                                        onToggle: () => viewOption("Due Distance")
                                                    },
                                                ],
                                                onClickOutside: () => {
                                                    monthOptions = false
                                                },
                                                styling: { 
                                                    zIndex: 100,
                                                    minWidth: "170px",
                                                },
                                                position: { 
                                                    top: "25px",
                                                    right: "0px",
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
            
                            <div style:margin="0px 0px 0px 0px" class:hidden={!pageView.showMonthEntry}>
                                {#key periodEntry}
                                    {#if periodEntry && periodIdx != 16}
                                        <div style:margin-top="-8px">
                                            <TextEntry 
                                                id="mo" zIndex={1} entry={periodEntry}
                                            />
                                        </div>
                                    {/if}
                                {/key}
                            </div>
                            {#if manager}
                                <div class="goals__list">
                                    <GoalsView 
                                        {manager} options={goalsView} 
                                        timeFrame={{ year: 2025, period: viewPeriod }}
                                    />
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

{#if deleteConfirm}
    <ConfirmationModal 
        text="Are you sure you want to delete this goal?"
        onOk={() => manager?.confirmDelete(true)}
        onCancel={() => manager?.confirmDelete(false)}
    />
{/if}

<style lang="scss">
    .goals {
        height: 100%;
        width: 100%;
        padding: 5px 0px 40px 6px;
        position: relative;

        --month-item-opacity: 0.12;
        --min-active-opacity: 0.25;

        &--light {
            --month-item-opacity: 0.225;
            --min-active-opacity: 0.45;
        }
        &--icon &__header {
            margin-top: var(--icon-offset);
        }
        &--icon &__header-settings {
            top: calc(-1 * var(--icon-offset) + 15px);
        }

        h1 {
            @include text-style(1, var(--fw-400-500), 1.8rem);
            margin: 0px 0px 0px 15px;
        }

        &__left {
            width: var(--left-col-width);
            height: calc(100vh - 50px);
            padding: 5px 0px 0px 14px;
        }
        &__right {
            width: calc(100% - var(--left-col-width));
            height: 100%;
            padding: 2px 15px 0px 9px;
            position: relative;
            overflow-y: scroll;
            overflow-x: hidden;
        }
        &__banner {
            width: 100%;
            height: 210px;
            position: relative;
            overflow: hidden;
            margin-bottom: 10px;
            z-index: 0;
            
            img {
                border-radius: 3.5px;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }   
        &__icon {
            @include square(110px, 4px);
            overflow: hidden;
            margin: 0px 0px 11px 0px;
            @include abs-top-left(0, var(--side-padding));

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        &__header {
            width: 100%;
            margin: 0px 0px 0px 0px;
            position: relative;
            padding: 0px var(--side-padding);
            z-index: 1;
            
            h1 {
                @include text-style(1, var(--fw-400-500), 2.2rem, "Geist Mono");
                margin: 0px 0px 8px 0px;
            }
        }
        &__header-settings {
            @include abs-top-right(0px, 0px);
            @include flex(center);
        }
        &__year {
            @include text-style(0.35, var(--fw-400-500), 1.5rem);
            margin-left: 14px;
        }
        &__heatmap {
            padding: 0px var(--side-padding);
            margin-bottom: 14px;
        }
        &__pinned {
            @include flex(center);
            overflow: auto;
            height: 100%;
            padding: 10px 0px 0px 0px;
            margin: 0px 0px 0px var(--side-padding);
            border-top: var(--divider-border);  
        }
        &__month {
            border-top: var(--divider-border);
            margin: 3px 0px 0px var(--side-padding);
            position: relative;
            z-index: 0;

            h1 {
                @include text-style(1, var(--fw-400-500), 3.5rem, "Gambarino-Regular");
                display: none;
            }
        }
        &__month-header {
            @include flex(center, space-between);
            margin: 2px 0px 8px 0px;
            position: relative;
            height: 35px;
        }
        &__months {
            @include flex(center);
            min-width: 0px;
            overflow: scroll;
            height: 100%;
            padding-top: 2px;
        }
        &__month-settings {
            @include flex(center);
            float: right;
        }
        &__quarters {
            @include flex(center);
            border-left: var(--divider-border);
            border-right: var(--divider-border);
            border-width: 1.5px;
            border-color: rgba(var(--textColor1), 0.1);
            height: 12px;
            padding: 0px 6px 0px 12px;
            margin: 0px 4px 0px 6px;
        }
        &__month-item {
            @include text-style(1, var(--fw-400-500), 1.4rem);
            opacity: var(--month-item-opacity);
            padding: 0px 8px;
            position: relative;
            
            &:first-child {
                padding-left: 0px;
            }
            &:hover {
                opacity: 0.4;
            }
            &--active {
                opacity: 1 !important;
            }
            &--min-active {
                opacity: var(--min-active-opacity);
            }
            &--drag-over {
                opacity: 1;
                @include border-focus;
            }
            &--now::after {
                content: "";
                @include circle(3px);
                @include abs-center;
                top: 21px;
                background-color: rgba(var(--textColor1), 0.6);
            }
        }
        &__list {
            min-height: 500px;
        }
        &__arrow {
            opacity: 0.45;
            @include center;
            @include circle(25px);
            
            &--opaque {
                opacity: 0.15;
            }
            &:hover {
                opacity: 1;
                background-color: rgba(var(--textColor1), 0.06);
            }
            &:disabled {
                opacity: 0.1;
            }
        }
        &__settings-btn {
            margin: 0px 0px 0px 9px;
        }
    }
</style>