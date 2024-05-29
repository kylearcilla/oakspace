<script lang="ts">
    import { Icon, ModalType } from "$lib/enums"
	import { openModal, toggleActiveRoutine } from "$lib/utils-home"
	import { themeState, ytPlayerStore, sessionStore, weekRoutine } from "$lib/store"

	import SessionHeaderView from "./SessionHeaderView.svelte"
	import { onDestroy, onMount } from "svelte"
	import SvgIcon from "../../components/SVGIcon.svelte";
	import { getColorTrio } from "$lib/utils-general";
	import { initTodayRoutine, initCurrentBlock, getMextTimeCheckPointInfo, getUpcomingBlock } from "$lib/utils-routines";
	import { getDayIdxMinutes } from "$lib/utils-date";

    const NO_SESS_MD_MAX_WIDTH = 270
    const MD_MAX_WIDTH = 800
    const SM_MAX_WIDTH = 550

    let dropdownMenu: HTMLElement
    let headerWidth = 0
    let minuteInterval: NodeJS.Timeout | null = null
    let currTime = getDayIdxMinutes()

    $: dayRoutine = $weekRoutine?.blocks.Friday
    $: isDarkTheme = $themeState!.isDarkTheme

    // active routine
    let todayRoutine: RoutineBlock[] | DailyRoutine | null = null 
    let nowBlock: RoutineBlock | null = null
    let upcomingBlock: RoutineBlock | null = null
    let nowBlockIdx = 0
    let currBlockViewIdx = -1
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
        nowBlockTitle = "Free time. No active routine block at this moment."
    }
    else {
        nowBlockTitle = `"${nowBlock.title}". From "${$weekRoutine?.name}".`
    }

    /* Week Routins */
    function initNowBlock(todayRoutine: RoutineBlock[] | DailyRoutine | null) {
        if (!todayRoutine) return

        const currBlock = initCurrentBlock(todayRoutine, currTime.minutes)
        upcomingBlock   = getUpcomingBlock(currTime.minutes, todayRoutine)?.block ?? null

        if (currBlock) {
            nowBlockIdx = currBlock.idx
            nowBlock = currBlock.block

            colorTrio = nowBlock ? getColorTrio((nowBlock as RoutineBlock).color, !isDarkTheme) : ["", "", ""]
        }
        else {
            nowBlock = null
        }
    }

    /* Event Handlers */
    function handleDropdownOption(idx: number) {
        if (idx === 0) {
            openModal(ModalType.Quote)
        }
        else if (idx === 1) {
            openModal(ModalType.Shortcuts)
        }
        else {
            console.log("LOGGING OUT USER")
        }
        dropdownMenu.style.display = "none"
    }
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
        class:header__now-block--empty={!nowBlock}
        class:header__now-block--md={headerWidth < NO_SESS_MD_MAX_WIDTH}
        class:header__now-block--sm={activeSession && headerWidth < SM_MAX_WIDTH}
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
                Empty
            {:else if !nowBlock && upcomingBlock}
                {upcomingBlock.title}
            {:else if nowBlock}
                {nowBlock.title}
            {:else}
                Free
            {/if}
        </div>
        <div class="header__now-block-time">
            {getMextTimeCheckPointInfo(todayRoutine)}
        </div>
    </button>

    <!-- Active Session Component -->
    {#if $sessionStore != null && $ytPlayerStore?.doShowPlayer}
        <div class={`header-session-container ${$themeState.isDarkTheme ? "" : "header-session-container--light-mode"}`}>
            <SessionHeaderView />
        </div>
    {/if}

    <!-- New Session Button -->
    <div class="header__right-section header__section">
        <!-- New Session -->
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
            <i class="fa-regular fa-clock"></i>
            <span>1h 46m</span>
        </div>
    </div>

</header>

<style global lang="scss">
    @import "../../scss/dropdown.scss";

    .header {
        width: 100%;
        height: 32px;
        padding: 5px 0px 0px 0px;
        position: relative;
        @include flex(center, space-between);
        
        &--light &__ctrl-btns {
            margin-right: 11px;
            i {
                color: rgba(var(--fgColor1), 1) !important;
            }
        }
        &--light &__ctrl-btn {
            margin-right: 13px;

            i {
                font-size: 1.3rem;
            }
        }
        &--light &__session-time {
            i {
                opacity: 1;
            }
            span {
                font-weight: 400;
                @include text-style(_, 400, 1.18rem);
                opacity: 1;
            }
        }
        &--non-default &__ctrl-btn i {
            color: var(--headerIconColor) !important;
        }
        &--non-default &__ctrl-btn--inactive i {
            opacity: 0.5;

            &:hover {
                opacity: 1;
            }
        }
        &--md .header-session-container {
            width: 74%;
        }
        &--sm &__right-section {
            display: none;
        }
        &--sm .header-session-container {
            width: 80%;
            margin-left: 14px;
        }

        &__section {
            @include flex(center);
        }

        /* Now Block */
        &__now-block {
            @include flex(center);
            height: 10px;
            background-color: rgba(var(--block-color-1), 0.08);
            padding: 8.5px 10px 9px 13px;
            border-radius: 12px;
            
            &--empty {
                background-color: rgba(var(--textColor1), 0.055);
            }
            &--empty &-circle {
                background-color: rgba(var(--textColor1), 0.2);
            }
            &--empty &-title {
                color: rgba(var(--textColor1), 0.8);
            }
            &--empty &-time {
                color: rgba(var(--textColor1), 0.3);
            }
            &--md  {
                padding: 8.5px 10px 9px 11px;
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
                @include text-style(_, 500, 1.14rem);
                @include elipses-overflow;
                margin: 0px 0px 0px 8px;
                max-width: 80px;
            }
            &-time {
                @include text-style(_, 400, 1.08rem, "DM Sans");
                color: rgba(var(--block-color-3));
                margin-left: 9px;
            }
        }

        /* New Session Button */
        &__new-session-btn {
            @include center;
            @include circle(16px);
            @include txt-color(0.13, "bg");
            opacity: 0.6;

            &:hover {
                transition: 0.1s ease-in-out;
                opacity: 0.9;
            }
        }
        &__new-session-btn-divider {
            @include divider(0.2, 9px, 1px);
            margin: 0px 11px;
        }

        /* Session Time */
        &__session-time {
            @include flex(center);
            white-space: nowrap;
            i {
                opacity: 0.38;
                font-size: 1.02rem;
            }
            span {
                @include text-style(0.4, 400, 1.15rem, "DM Sans");
                font-family: "DM Sans";
                margin-left: 7px;
            }
        }
    }

    /* Active Session Component  */
    .header-session-container {
        align-items: center;
        z-index: 999;
        width: 70%;
    }
</style>