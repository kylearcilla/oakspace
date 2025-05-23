<script lang="ts">
	import { onDestroy, onMount } from "svelte"
    import { Icon, ModalType } from "$lib/enums"

	import { capitalize } from "$lib/utils-general"
	import { getFocusTime } from "$lib/utils-session"
	import { openModal, updateAmbience } from "$lib/utils-home"
	import { getDayIdxMinutes, secsToHHMM } from "$lib/utils-date"
	import { getDayRoutineFromWeek, getCurrentBlock, getNextBlockInfo } from "$lib/utils-routines"
	import { themeState, ytPlayerStore, weekRoutine, sessionManager, globalContext, timer } from "$lib/store"
    
	import ActiveRoutine from "./ActiveRoutine.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import BounceFade from "$components/BounceFade.svelte"
	import ActiveSessionMini from "./ActiveSessionMini.svelte"
	import AmbientSettings from "./space/AmbientSettings.svelte"
    
    const NO_SESS_MD_MAX_WIDTH = 270

    let headerWidth = 0
    let currTime = getDayIdxMinutes()
    let ambientSettings = false
    let overAmbient = false

    $: context = $globalContext
    $: ambience = context.ambience
    $: hasAmbience = ambience?.active ?? false

    $: dayRoutine = $weekRoutine?.blocks.Friday
    $: isDarkTheme = $themeState!.isDarkTheme
    $: isColorThemeDefault = ["Dark Mode", "Light Mode"].includes($themeState.title)
    $: session = $sessionManager
    $: routine = $weekRoutine

    $: initNowBlock(todayRoutine)
    
    // active routine
    let todayRoutine: RoutineBlock[] | DailyRoutine | null = null 
    let nowBlock: RoutineBlock | null = null
    let nowBlockTitle = ""
    let isRoutineOpen = false
    let blockInfo: { title: string, info: string } 
    
    $: todayRoutine = getDayRoutineFromWeek(routine, currTime.dayIdx)
    
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

    const unsubscribe = timer.subscribe(() => currTime = getDayIdxMinutes())
    
    /* Week Routines */
    function initNowBlock(todayRoutine: RoutineBlock[] | DailyRoutine | null) {
        blockInfo = getNextBlockInfo(todayRoutine)

        if (!todayRoutine) return

        const currBlock = getCurrentBlock(todayRoutine, currTime.minutes)

        if (currBlock) {
            nowBlock = currBlock.block
            // colorTrio = nowBlock ? getColorTrio((nowBlock as RoutineBlock).color, !isDarkTheme) : ["", "", ""]
        }
        else {
            nowBlock = null
        }
    }

    /* Ambients */
    function pointerUp() {
        if (!overAmbient) return

        updateAmbience({ spacesOpen: true })
    }
    function pointerOver(pe: PointerEvent) {
        const target = pe.target as HTMLElement
        const classes = target.classList
        const tag = target.tagName

        overAmbient = classes.contains("header__ambient-controls") || 
                      classes.contains("header__ambient-main") || 
                      tag === "SPAN"
    }

    /* Event Handlers */
    function handleResize() {
        if (!$ytPlayerStore?.show) return
    }

    onMount(() => window.addEventListener("resize", handleResize))
    onDestroy(() => unsubscribe())
</script>

<header 
    bind:clientWidth={headerWidth}
    class="header"
    class:header--dark={isDarkTheme}
    class:header--light={!isDarkTheme}
    class:header--non-default={isColorThemeDefault}
    class:header--ambient={hasAmbience}
    class:header--ambient-styling={hasAmbience && ambience?.styling != "solid"}
    class:header--ambient-solid={hasAmbience && ambience?.styling === "solid"}
>
    <!-- Ambient Island -->
    {#if hasAmbience}
        {@const groupName = capitalize(ambience?.space.group ?? "")}
        <div 
            class="header__ambient-controls header__section"
            class:header__ambient-controls--over={overAmbient}
            class:ambient-blur={hasAmbience && ambience?.styling === "blur"}
            class:ambient-solid={hasAmbience && ambience?.styling === "solid"}
            class:ambient-clear={hasAmbience && ambience?.styling === "clear"}
            on:pointerover={pointerOver}
            on:pointerup={pointerUp}
        >
            <div class="header__ambient-main">
                Space: <span>{groupName === "User" ? "Library" : groupName}</span>
                <button 
                    data-dmenu-id="ambient-header"
                    class="header__ambient-settings-btn smooth-bounce"
                    on:click={() => ambientSettings = !ambientSettings}
                >
                    <SvgIcon 
                        icon={Icon.Settings} options={{ opacity: 0.4, scale: 0.9 }} 
                    />
                </button>
            </div>
        </div>
    {/if}

    <div class="header__main">
        <!-- Active Routine Block -->
        <button 
            class="header__now-block header__section"
            class:header__now-block--empty={!nowBlock || !$weekRoutine}
            class:header__now-block--md={headerWidth < NO_SESS_MD_MAX_WIDTH}
            class:ambient-blur={hasAmbience && ambience?.styling === "blur"}
            class:ambient-solid={hasAmbience && ambience?.styling === "solid"}
            class:ambient-clear={hasAmbience && ambience?.styling === "clear"}
            title={nowBlockTitle}
            data-dmenu-id="active-routine"
            on:click={() => {
                if ($weekRoutine) {
                    isRoutineOpen = !isRoutineOpen
                }
            }}
        >
            <div class="header__now-block-circle"></div>
            {#if $weekRoutine && (nowBlock?.title || blockInfo.title)}
                <div class="header__now-block-title">
                    {nowBlock?.title ?? blockInfo.title}
                </div>
            {/if}
            <div class="header__now-block-time">
                {blockInfo.info}
            </div>
        </button>
        <div class="header__session-container">
             {#if !session || $sessionManager?.state === "done"}
                 <div 
                     class="header__session header__section"
                     class:header__session--ambience={hasAmbience}
                     class:ambient-blur={hasAmbience && ambience?.styling === "blur"}
                     class:ambient-solid={hasAmbience && ambience?.styling === "solid"}
                     class:ambient-clear={hasAmbience && ambience?.styling === "clear"}
                 >
                    {#if hasAmbience}
                        <button 
                            title="Create new session"
                            class="header__new-session-btn"
                            on:click={() => openModal(ModalType.NewSession)}
                        >
                            <SvgIcon 
                                icon={Icon.Add}
                                options={{ scale: 0.95, strokeWidth: 1.75 }}
                            />
                        </button>
                     {:else}
                        <button 
                            title="Create new session"
                            class="header__new-session"
                            on:click={() => openModal(ModalType.NewSession)}
                        >
                            New Session
                        </button>
                     {/if}
                     <div 
                        class="header__new-session-btn-divider"
                        class:header__new-session-btn-divider--default={!hasAmbience}
                    >
                        {#if !hasAmbience}
                            /
                        {/if}
                     </div>
                     <div class="header__session-time" title="Today's total focus time.">
                         {#key session}
                            <span>
                                {secsToHHMM(getFocusTime())}
                            </span>
                         {/key}
                     </div>
                 </div>
             {:else}
                 <ActiveSessionMini />
             {/if}
         </div>
    </div>

    <BounceFade 
        id={"active-routine--dmenu"}
        zIndex={99999}
        position={{ 
            top:  "35px", 
            left:  hasAmbience ? "unset" : "10px",
            right: hasAmbience ? "15px" : "unset",
        }}
        isHidden={!isRoutineOpen}
        onClickOutside={() => {
            isRoutineOpen = false
        }}
    >
        <ActiveRoutine isOpen={isRoutineOpen} />
    </BounceFade>

    <AmbientSettings
        onClickOutside={() => ambientSettings = false}
        open={ambientSettings} 
    />

</header>

<style global lang="scss">
    @use "../../scss/dropdown.scss" as *;

    .header {
        width: 100%;
        height: 21px;
        padding: 5px 15px 0px 15px;
        position: relative;
        @include flex(center, space-between);

        --font-size: 1.2rem;
        
        /* light */
        &--light &__session-time span {
            font-weight: 500;
            opacity: 1;
        }
        &--light &__now-block-title,
        &--light &__now-block-time {
            font-weight: 500;
        }
        &--sm &__session {
            display: none;
        }
        &--ambient &__now-block {
            margin-left: 4px;
            padding: 0px 15px 0px 13px;
        }
        &--ambient &__now-block-time {
            @include text-style(_, 400, var(--font-size), "Geist Mono");
        }
        &--ambient &__now-block-title {
            font-weight: 400 !important;
            margin-right: 15px;
        }
        &--ambient-styling &__now-block-circle {
            opacity: 0.7;
        }
        &--ambient-styling &__now-block-title {
            color: rgba(var(--textColor1), 1);
            @include text-style(_, 500, 1.175rem);
        }
        &--ambient-styling &__now-block-time {
            color: rgba(white, 0.4);
        }
        &--ambient &__session-time {
            @include text-style(0.685);
        }
        &--ambient &__main {
            flex-direction: row-reverse;
            width: fit-content;
        }
        &--ambient &__section {
            height: 32px;
            max-height: 32px;
            min-height: 32px;
        }
        &--ambient-solid &__session,
        &--ambient-solid &__now-block,
        &--ambient-solid &__ambient-controls {
            background: var(--navMenuBgColor);
        }

        &__section {
            @include flex(center);
            height: 24px;
            z-index: 100;
            border-radius: 30px;
        }
        &__main {
            @include flex(center, space-between);
            overflow: hidden;
            width: 100%;
        }

        /* Now Block */
        &__now-block {
            margin: 0px 0px 0px -5px;
            background-color: rgba(var(--textColor1), 0.085);
            border: 1px solid transparent;
            padding: 0px 15px 0px 6px;
            white-space: nowrap;
            background-color: transparent !important;
            z-index: 100;
            
            &:disabled {
                opacity: 0.5;
            }
            &--empty {
                background-color: rgba(var(--textColor1), 0.055);
            }
            &--empty &-circle {
                background-color: rgba(var(--textColor1), 0.2);
            }
            &--empty &-title {
                color: rgba(var(--textColor1), 1);
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
                background-color: rgba(var(--textColor1), 1);
                height: 10px;
                width: 2px;
                border-radius: 1px;
                margin-right: 10px;
                display: none;
            }
            &-title {
                @include text-style(_, 400, 1.2rem);
                color: rgba(var(--textColor1), 1);
                @include elipses-overflow;
                margin: 0px 11px 0px 0px;
                max-width: 150px;
            }
            &-time {
                @include text-style(_, 400, 1.2rem);
                color: rgba(var(--textColor1), 0.5);
            }
        }
        &__now-block.ambient-solid {
            background-color: var(--navMenuBgColor) !important;
        }

        /* sessions */
        &__session-container {
            display: flex;
            overflow: hidden;
        }
        &__session {
            @include flex(center);
            padding: 0px 6px 0px 7px;
            height: 26px;

            &--ambience {
                padding: 0px 13px 1px 9px;
            }
        }
        &__new-session {
            @include text-style(0.65, 400, 1.2rem);
            opacity: 0.35;
            margin-right: 4px;

            &:hover {
                opacity: 0.65;
            }
        }
        &__new-session-btn {
            @include center;
            @include circle(18px);
            @include txt-color(0.14, "bg");
            opacity: 0.7;
            margin-right: 3px;

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
            @include text-style(0.3, 500, 0.95rem, "system");
            margin: 0px 12px 0px 8px;
            
            &--default {
                margin: -3px 10px 0px 5px;
                background: none;
            }
        }
        &__habit-progress {
            margin: 0px 4px 0px 0px;
            padding: 4px 7px 3px 12px;
            border-radius: 20px;
            @include txt-color(0.06, "bg");
            @include flex(center);
            
            &:hover {
                @include txt-color(0.1, "bg");
            }
            span {
                @include text-style(0.65, 600, 1.185rem);
                margin-right: 10px;
                margin-bottom: 2px;
            }
            i {
                margin-right: 10px;
                @include text-style(0.3, _, 1.15rem);
                margin-bottom: 2px;
            }
        }
        &__session-time {
            @include flex(center);
            @include text-style(0.7, 400, 1.2rem);
            white-space: nowrap;
        }
        &__ambient-controls {
            @include flex(center);
            @include text-style(1, 400, var(--font-size), "Geist Mono");
            margin: 0px 10px 0px -10px;
            transition: 0.1s ease-in-out;
            padding: 0px 4px 0px 13px;

            &--over {
                cursor: pointer;
            }
            &--over:active {
                transform: scale(0.9945);
            }
        }
        &__ambient-main {
            margin-right: 4px;
            @include flex(center);

            span {
                margin-left: 8px;
                opacity: 0.35;
            }
        }
        &__ambient-settings-btn {
            @include circle(17px);
            @include center;
            background-color: rgba(var(--textColor1), 0.045);
            margin-left: 11px;
            
            &:hover {
                background-color: rgba(var(--textColor1), 0.1);
            }
        }
        &__ambient-main .divider {
            @include divider(0.15, 8.5px, 1px);
            margin: 0px 10px 0px 8px;
            // display: none;
        }
        &__ambient-range {
            @include flex(center);
            // display: none;
        }
        &__ambient-range-icon {
            opacity: 0.8;
            transform: scale(0.925);
            svg {
                margin: 3px 7px 0px 0px;
            }
        }
        &__ambient-range-input {
            margin: 0px 0px 0px 0px;
            width: 40px;
        }
    }
</style>