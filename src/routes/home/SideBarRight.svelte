<script lang="ts">
	import { TasksViewManager } from "$lib/tasks-view-manager"
	import { formatDatetoStr, formatTimeToHHMM, getUserHourCycle, isNightTime } from "$lib/utils-date"
	import { hideRightBar, setShortcutsFocus, showRightBar } from "$lib/utils-home"
	import { clickOutside } from "$lib/utils-general"
	import { onDestroy, onMount } from "svelte"
    import { homeViewLayout, tasksViewStore, themeState } from "$lib/store"    
	import { RightSideTab, ShortcutSectionInFocus, Icon } from "$lib/enums"
    import { taskGroups } from "$lib/utils-right-bar"
	import Tasks from "./Tasks.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import Dashboard from "./Dashboard.svelte"

    let currentTimeStr = ""
    let isDayTime = true
    let doUse12HourFormat = false
    let interval: NodeJS.Timer | null = null
    let selectedTab: RightSideTab = RightSideTab.OVERVIEW

    let isRightBarOpen = true
    let initDragXPos = -1

    $: {
        isRightBarOpen = $homeViewLayout.isTaskMenuOpen
    }

    /* General UI Handlers */
    function handleTabClicked(newTab: RightSideTab) {
        if (newTab === RightSideTab.TASKS) {
            $tasksViewStore!.hasTabBarClicked()
        }
        selectedTab = newTab
    }
    function onResizerClicked(event: Event) {
        const pe = event as PointerEvent

        window.addEventListener("mousemove", onResizerDrag)
        window.addEventListener("mouseup", onResizerEndDrag)

        initDragXPos = pe.clientX
    }
    function onResizerDrag(event: Event) {
        const pe = event as MouseEvent
        const newDragXOffSet = pe.clientX
        const xOffset = (initDragXPos - newDragXOffSet) * -1

        pe.preventDefault()

        if (xOffset > 0 && isRightBarOpen) {
            hideRightBar()
            removeDragEventListener()
        }
        else if (xOffset < 0 && !isRightBarOpen) {
            showRightBar()
            removeDragEventListener()
        }
    }
    function onResizerEndDrag() {
        removeDragEventListener()
    }
    function removeDragEventListener() {
        initDragXPos = -1

        window.removeEventListener("mousemove", onResizerDrag)
        window.removeEventListener("mouseup", onResizerEndDrag)
    }

    /* Time Stuff*/
    function updateTimeStr() {
        currentTimeStr = formatTimeToHHMM(new Date(), doUse12HourFormat)
        isDayTime = !isNightTime()
    }
    function toggleTimeFormatting() {
        doUse12HourFormat = !doUse12HourFormat 
        updateTimeStr()
    }
    function initDateTimer() {
        interval = setInterval(updateTimeStr, 1000)
    }

    onMount(() => {
        const hourCycle = getUserHourCycle()
        doUse12HourFormat = hourCycle === "h12" || hourCycle === "h11"
        updateTimeStr()
        initDateTimer()

        new TasksViewManager(taskGroups)
    })
    onDestroy(() => {
        clearInterval(interval!)
    })
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class={`task-view ${$themeState.isDarkTheme ? "task-view--dark-theme" : "task-view--light-theme"}`}
    on:click={() => setShortcutsFocus(ShortcutSectionInFocus.TASK_BAR)}
    use:clickOutside on:click_outside={() => setShortcutsFocus(ShortcutSectionInFocus.MAIN)}
>
    <div 
        class="task-view__header"
        style={`background-image: linear-gradient(0deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://i.pinimg.com/originals/9b/a2/8f/9ba28fe01fc1a24b757bf972a40a7339.gif)`}
    > 
        <div class="task-view__header-img">
            <img src="https://i.pinimg.com/564x/08/a0/7a/08a07aa5639369bc7e80ff11ee4722a3.jpg" alt="">
        </div>
        <!-- Header -->
        <div class="task-view__header-time-date">
            <div class="task-view__header-date">
                {`${formatDatetoStr(new Date(), { weekday: "short", day: "2-digit", month: "short" })}`}
            </div>
            <div class="task-view__header-time-container">
                <button class="task-view__header-time" title={currentTimeStr} on:click={toggleTimeFormatting}>
                    <h1>{currentTimeStr}</h1>
                </button>
                <div class="task-view__header-day-icon">
                    {#if isDayTime}
                        <SvgIcon icon={Icon.Sun} />
                    {:else}
                        <SvgIcon icon={Icon.Moon} />
                    {/if}
                </div>
            </div>
        </div>
        <div class="task-view__header-blur-layer">
            <div class="blur-bg blur-bg--blurred-bg"></div>
        </div>
    </div>
    <div class="task-view__tab-btns">
        <button 
            on:click={() => handleTabClicked(RightSideTab.OVERVIEW)}
            class={`tab-btn ${$themeState.isDarkTheme ? "tab-btn--txt-only" : ""} ${selectedTab === RightSideTab.OVERVIEW ? (!$themeState.isDarkTheme ? "tab-btn--selected" : "tab-btn--txt-only-selected") : ""}`}
        >
            Overview
        </button>
        <button 
            on:click={() => handleTabClicked(RightSideTab.TASKS)}
            class={`tab-btn ${$themeState.isDarkTheme ? "tab-btn--txt-only" : ""} ${selectedTab === RightSideTab.TASKS ? (!$themeState.isDarkTheme ? "tab-btn--selected" : "tab-btn--txt-only-selected") : ""}`}
        >
            Tasks            
        </button>
    </div>
    <div class="task-view__main-content">
        {#if selectedTab === RightSideTab.TASKS}
            <!-- Tasks Section -->
            <Tasks />
        {:else if selectedTab === RightSideTab.OVERVIEW}
            <Dashboard />
        {/if}
    </div>
    <div class="task-view__resize-handle" on:mousedown={onResizerClicked}></div>
</div>

<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import "../../scss/inputs.scss";
    @import "../../scss/blurred-bg.scss";

    $side-padding: 18px;
    $color-a: rgba(var(--textColor1), 0.15);
    $todo-minimized-height: 40px;

    .task-view {
        width: 100%;
        height: 100vh;
        position: relative;
        @include text-color;

        &--light-theme &__header {
            background-image: none !important;
            background-color: transparent ;
            margin-bottom: 14px;
            height: auto;

            &-img {
                display: block;
            }
            &-time-date {
                display: block;   
                position: relative;
            }
            &-time h1 {
                font-weight: 500;
                margin-bottom: 2px;
            }
            &-date {
                font-weight: 500;
                margin-bottom: 1.5px;
                @include text-color(0.4);
            }
            &-text {
                font-weight: 500;
                @include text-color(0.5);
            }
            &-blur-layer {
                display: none;
            }
        }
        &--light-theme .tab-btn {
            background-color: var(--sidePanelTabBgColor);
            font-size: 1.3rem;
            @include tab-btn-light;
            margin-bottom: 7px;

            &--selected {
                background-color: var(--sidePanelTabHighlightColor);
            }
        }
        &--light-theme &__tab-btns {
            position: relative;
            margin-bottom: 9px;
            top: 0px;
            left: 0px;
            margin-left: $side-padding / 2;
        }
        &--light-theme &__main-content {
            height: calc(100% - 130.5px);
        }
        &--light-theme &__context-menu {
            &-command {
                @include text-color(0.6);
            }
        }
        
        &__header {
            width: 100%;
            margin: 0px 0px 15px 0px;
            background-size: cover; 
            background-position: center; 
            background-repeat: no-repeat;
            background-color: rgba(black, 0.15);
            height: 74px;
            position: relative;

            &-img {
                width: 100%;
                margin-bottom: 0px;
                height: 50px;
                display: none;

                img {
                    height: 100%;
                    width: 100%;
                    object-fit: cover;
                }
            }
            &-time-date {
                @include pos-abs-top-left-corner(7.5px, 14px);
                z-index: 1;
            }
            &-time h1 {
                @include text-style(1, 400, 1.8rem, "DM Sans");
                margin-right: 11px;
                white-space: nowrap;
            }
            &-time-container {
                display: flex;
            }
            &-day-icon {
                overflow: visible;
                height: 20px;
                width: 20px;
                position: relative;
            }
            &-date {
                @include text-style(0.5, 300, 1.1rem, "DM Sans");
                margin-bottom: 3px;
            }
            &-text {
                margin-top: 3px;
                font-size: 1.2rem;
                font-weight: 200;
                @include text-color(0.32);
            }
        }
        &__header-blur-layer {
            @include pos-abs-top-left-corner(0px);
            z-index: 0;
            width: 100%;
            height: 130px;
        }
        &__header-blur-layer .blur-bg {
            position: relative;
            border-radius: 0px;
            @include blur-bg(20px, rgba(0, 0, 0, 0.1));
            -webkit-mask-image: linear-gradient(
                    180deg, 
                    transparent 0%, rgba(0, 0, 0, 0.45) 9px, 
                    rgba(0, 0, 0, 0.64) 25px, black 75px, 
                    black 85%, transparent 100%
            );
            mask-image: linear-gradient(
                    180deg, 
                    transparent 0%, rgba(0, 0, 0, 0.45) 9px, 
                    rgba(0, 0, 0, 0.64) 25px, black 75px, 
                    black 85%, transparent 100%
            );
        }
        &__resize-handle {
            @include pos-abs-top-left-corner();
            width: 5px;
            height: 100%;
            cursor: ew-resize;
        }
        &__tab-btns {
            @include flex(center, _);
            margin-bottom: 9px;
            @include pos-abs-top-left-corner(58.5px, $side-padding - 3px);
            z-index: 2;
        }
        &__main-content {
            height: calc(100% - 40px);
            width: 100%;
        }
        &__context-menu {
            position: absolute;

            &-command span {
                margin-right: 2px;
                width: 9px;
            }
            &-command {
                width: 25px;
                @include flex(center, center);
                font-weight: 200;
                @include text-color(0.3);
                font-size: 0.9rem;

                &--plus {
                    font-size: 1.3rem;
                }
            }
        }
    }
</style>