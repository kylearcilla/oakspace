<script lang="ts">
    import { Icon, ModalType } from "$lib/enums"
	import { openModal } from "$lib/utils-home"
	import { themeState, musicDataStore, ytPlayerStore, sessionStore, musicPlayerStore, weekRoutine } from "$lib/store"

	import SessionHeaderView from "./SessionHeaderView.svelte"
	import { onDestroy, onMount } from "svelte"
	import SvgIcon from "../../components/SVGIcon.svelte";
	import { getColorTrio } from "$lib/utils-general";

    let dropdownMenu: HTMLElement
    let doMinHeaderUI = false
    let headerWidth = 0
    let isColorThemeDefault = true
    let nowBlock: RoutineBlock | null = null
    let nowBlockTitle = ""

    const NO_SESS_MD_MAX_WIDTH = 270
    const MD_MAX_WIDTH = 800
    const SM_MAX_WIDTH = 550

    $: activeSession = $sessionStore != null
    $: dayRoutine = $weekRoutine?.blocks.Friday
    $: isDarkTheme = $themeState!.isDarkTheme

    $: {
        doMinHeaderUI = $ytPlayerStore?.doShowPlayer ?? false
        isColorThemeDefault = ["Dark Mode", "Light Mode"].includes($themeState.title)
    }

    // new block
    $: if (dayRoutine && "id" in dayRoutine) {
        nowBlock = dayRoutine.blocks[0]
    }
    else if (dayRoutine) {
        nowBlock = dayRoutine[0]
    }

    // new block title
    $: if (!dayRoutine) {
        nowBlockTitle = "You current don't have a routine set."
    }
    else if (!nowBlock) {
        nowBlockTitle = "Free time. No active routine block at this moment."
    }
    else {
        nowBlockTitle = `"${nowBlock.title}". Your current routine at this moment from your "${$weekRoutine?.name}" weekly routine.`
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
    })
    onDestroy(() => {
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
    <!-- Left Side -->
    {#if nowBlock}
        {@const colorTrio = getColorTrio(nowBlock.color, !isDarkTheme)}
        <button 
            class="header__now-block"
            class:header__now-block--default={!dayRoutine || !nowBlock}
            class:header__now-block--md={headerWidth < NO_SESS_MD_MAX_WIDTH}
            class:header__now-block--sm={activeSession && headerWidth < SM_MAX_WIDTH}
            style:--block-color-1={colorTrio[0]}
            style:--block-color-2={colorTrio[1]}
            style:--block-color-3={colorTrio[2]}
            title={nowBlockTitle}
        >
            <div class="header__now-block-circle"></div>
            <div class="header__now-block-title">
                {#if !dayRoutine}
                    Empty
                {:else if !nowBlock}
                    Free
                {:else}
                    Deep Work
                {/if}
            </div>
            {#if nowBlock}
                <div class="header__now-block-time">
                    42m
                </div>
            {/if}
        </button>
    {/if}

    <!-- Active Session Component -->
    {#if $sessionStore != null && $ytPlayerStore?.doShowPlayer}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class={`header-session-container ${$themeState.isDarkTheme ? "" : "header-session-container--light-mode"}`}>
            <SessionHeaderView />
        </div>
    {/if}

    <!-- Right Side -->
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
            
            &--default {
                @include txt-color(0.055, "bg");
            }
            &--default &-circle {
                @include txt-color(0.14, "bg");
            }
            &--default &-title {
                @include txt-color(0.6);
            }
            &--default &-time {
                @include txt-color(0.2);
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
                font-size: 1.14rem;
                font-weight: 500;
                margin: 0px 0px 0px 8px;
                max-width: 80px;
                @include elipses-overflow;
            }
            &-time {
                font-weight: 500;
                font-size: 1.08rem;
                margin-left: 9px;
                color: rgba(var(--block-color-3));
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