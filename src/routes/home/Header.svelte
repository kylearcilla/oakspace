<script lang="ts">
	import { onDestroy, onMount } from "svelte"

    import { Icon, ModalType } from "$lib/enums"
	import { getColorTrio } from "$lib/utils-general"
	import { getDayIdxMinutes } from "$lib/utils-date"
	import { openModal, toggleActiveRoutine } from "$lib/utils-home"
	import { themeState, ytPlayerStore, sessionStore, weekRoutine } from "$lib/store"
	import { initTodayRoutine, initCurrentBlock, getMextTimeCheckPointInfo, getUpcomingBlock } from "$lib/utils-routines"
    
	import ActiveRoutine from "./ActiveRoutine.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import SessionHeaderView from "./SessionHeaderView.svelte"

    const NO_SESS_MD_MAX_WIDTH = 270
    const MD_MAX_WIDTH = 800
    const SM_MAX_WIDTH = 550

    let headerWidth = 0
    let minuteInterval: NodeJS.Timeout | null = null
    let currTime = getDayIdxMinutes()

    $: dayRoutine = $weekRoutine?.blocks.Friday
    $: isDarkTheme = $themeState!.isDarkTheme

    // active routine
    let todayRoutine: RoutineBlock[] | DailyRoutine | null = null 
    let nowBlock: RoutineBlock | null = null
    let upcomingBlock: RoutineBlock | null = null
    let nowBlockTitle = ""
    let colorTrio = ["", "", ""]

    $: doMinHeaderUI       = $ytPlayerStore?.doShowPlayer ?? false
    $: isColorThemeDefault = ["Dark Mode", "Light Mode"].includes($themeState.title)

    // session
    $: activeSession = $sessionStore != null

    // routines
    $: routine      = $weekRoutine
    $: todayRoutine = initTodayRoutine(routine, currTime)
    $: initNowBlock(todayRoutine)

    $: if (!dayRoutine) {
        nowBlockTitle = "You current don't have a routine set."
    }
    else if (!nowBlock) {
        nowBlockTitle = "Free time."
    }
    else if ($weekRoutine) {
        nowBlockTitle = "No weekly routine set"
    }
    else if ($weekRoutine!.name) {
        nowBlockTitle = `"${nowBlock.title}". From "${$weekRoutine!.name}".`
    }

    /* Week Routins */
    function initNowBlock(todayRoutine: RoutineBlock[] | DailyRoutine | null) {
        if (!todayRoutine) return

        const currBlock = initCurrentBlock(todayRoutine, currTime.minutes)
        upcomingBlock   = getUpcomingBlock(currTime.minutes, todayRoutine)?.block ?? null

        if (currBlock) {
            nowBlock = currBlock.block
            colorTrio = nowBlock ? getColorTrio((nowBlock as RoutineBlock).color, !isDarkTheme) : ["", "", ""]
        }
        else {
            nowBlock = null
        }
    }

    /* Event Handlers */
    function handleResize() {
        if (!$ytPlayerStore?.doShowPlayer) return

        doMinHeaderUI = headerWidth < 840  
    }


    onMount(() => {
        window.addEventListener("resize", handleResize)
        minuteInterval = setInterval(() => currTime = getDayIdxMinutes(), 1000)
    })
    onDestroy(() => {
        clearInterval(minuteInterval!)
        window.removeEventListener("resize", handleResize)
    })
</script>

<header 
    bind:clientWidth={headerWidth}
    class="header"
    class:header--dark={isDarkTheme}
    class:header--light={!isDarkTheme}
    class:header--non-default={isColorThemeDefault}
    class:header--min={$sessionStore && doMinHeaderUI}
    class:header--md={activeSession && headerWidth < MD_MAX_WIDTH}
    class:header--sm={activeSession && headerWidth < SM_MAX_WIDTH}
>
    <!-- Active Routine Block -->
    <button 
        class="header__now-block"
        class:header__now-block--no-routine={!$weekRoutine}
        class:header__now-block--empty={!nowBlock}
        class:header__now-block--md={headerWidth < NO_SESS_MD_MAX_WIDTH}
        class:header__now-block--sm={activeSession && headerWidth < SM_MAX_WIDTH}
        disabled={!$weekRoutine}
        style:--block-color-1={colorTrio[0]}
        style:--block-color-2={colorTrio[1]}
        style:--block-color-3={colorTrio[2]}
        title={nowBlockTitle}
        id="active-routine--dropdown-btn"
        on:click={toggleActiveRoutine}
    >
        <div class="header__now-block-circle"></div>
        <div class="header__now-block-title">
            {#if !dayRoutine}
                No Routine
            {:else if !nowBlock && upcomingBlock}
                {upcomingBlock.title}
            {:else if nowBlock}
                {nowBlock.title}
            {:else}
                Free
            {/if}
        </div>
        <div class="header__now-block-time">
            {getMextTimeCheckPointInfo(todayRoutine) ?? ""}
        </div>
    </button>

    <!-- Active Session Component -->
    {#if $sessionStore != null && $ytPlayerStore?.doShowPlayer}
        <div class={`header-session-container ${$themeState.isDarkTheme ? "" : "header-session-container--light-mode"}`}>
            <SessionHeaderView />
        </div>
    {/if}

    <!-- New Session Button -->
    <div class="header__session header__section">
        <button 
            title="Create new session"
            class="header__new-session-btn"
            class:hidden={activeSession}
            on:click={() => openModal(ModalType.NewSession)}
        >
            <SvgIcon 
                icon={Icon.Add}
                options={{ scale: 0.9, strokeWidth: 1.75 }}
            />
        </button>
        <div 
            class="header__new-session-btn-divider"
            class:hidden={activeSession}
        >
        </div>
        <!-- Total Session Time -->
        <div class="header__session-time" title="Total session time for today.">
            <span>1h 46m</span>
        </div>
    </div>

    <!-- Active Routine Pop Up -->
    <ActiveRoutine />
</header>

<style global lang="scss">
    @import "../../scss/dropdown.scss";

    .header {
        width: 100%;
        height: 32px;
        padding: 5px 0px 0px 0px;
        position: relative;
        @include flex(center, space-between);
        
        &--light &__session-time span {
            @include text-style(_, 400, 1.18rem);
            font-weight: 400;
            opacity: 1;
        }
        &--sm &__session {
            display: none;
        }

        &__section {
            @include flex(center);
        }

        /* Now Block */
        &__now-block {
            @include flex(center);
            height: 27.5px;
            border-radius: 12px;
            margin: -3px 0px 0px -5px;
            background-color: rgba(var(--block-color-1), 0.08);
            padding: 0px 10px 0px 13px;
            
            &:disabled {
                opacity: 0.5;
            }
            &--no-routine {
                padding: 0px 0px 0px 13px;
                margin-top: -5px;
                background: none !important;
            }
            &--no-routine &-title {
                opacity: 0.7;
                margin-left: 10px;
            }
            &--empty {
                background-color: rgba(var(--textColor1), 0.055);
            }
            &--empty &-circle, &--no-routine &-circle  {
                background-color: rgba(var(--textColor1), 0.2);
            }
            &--empty &-title, &--no-routine &-title {
                color: rgba(var(--textColor1), 0.8);
            }
            &--empty &-time {
                color: rgba(var(--textColor1), 0.3);
            }
            &--md  {
                border-radius: 14px;
            }
            &--md &-title, &--sm &-title {
                display: none;
            }
            &--md &-time {
                margin-left: 8px;
            }
            &--sm {
                @include circle(22px);
                padding: 0px;
                @include center;
            }
            &--sm &-circle {
                @include circle(4px);
            }
            &--sm &-time {
                display: none;
            }
            
            &:active {
                transform: scale(0.99);
            }
            &-circle {
                // @include circle(3.5px);
                background-color: rgba(var(--block-color-1));
                height: 9px;
                width: 2px;
                border-radius: 4px;
            }
            &-title {
                color: rgba(var(--block-color-1));
                @include text-style(_, 600, 1.14rem);
                @include elipses-overflow;
                margin: 0px 0px 0px 8px;
                max-width: 80px;
            }
            &-time {
                @include text-style(_, 500, 1.08rem, "DM Sans");
                color: rgba(var(--block-color-3), 0.8);
                margin-left: 6px;
            }
        }

        /* New Session Button */
        &__session {
            @include flex(center);
            border-radius: 12px;
            margin-top: -3px;
            height: 27.5px;
            padding: 0px 12px 0px 10px;
            @include txt-color(0.055, "bg");
        }
        &__new-session-btn {
            @include center;
            @include circle(16px);
            @include txt-color(0.13, "bg");
            opacity: 0.6;

            &:hover {
                transition: 0.1s ease-in-out;
                opacity: 0.9;
            }
            &:active {
                transform: scale(0.9);
            }
        }
        &__new-session-btn-divider {
            @include divider(0.14, 9px, 1px);
            margin: 0px 9px 0px 10px;
        }
        /* Session Time */
        &__session-time {
            @include flex(center);
            @include text-style(0.7, 400, 1.15rem, "DM Mono");
            white-space: nowrap;
        }
    }
</style>