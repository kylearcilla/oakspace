<script lang="ts">
	import { getFirstHighlighterBtn } from '$lib/utils-general';
	import { onMount } from 'svelte';
    import type { PageData } from './$types';
	import { themeState } from '$lib/store';
	import { goto } from '$app/navigation';
    
    // export let data: PageData;

    enum RoutinesTab {
        Current, Weekly, Daily
    }

    let selectedTab = RoutinesTab.Current
    let tabHighlighterClass = ""

    const ROUTINES_TABS = "routines-tabs"

    /* Highlighter Tabs */
    function onTabClicked(e: Event, tab: RoutinesTab) {
        if (tab === selectedTab) return
        
        const target = e.target as HTMLButtonElement
        selectedTab = tab

        if (tab === RoutinesTab.Current) {
            goto("/home/routines/current")
        }
        else if (tab === RoutinesTab.Daily) {
            goto("/home/routines/daily-routines")
        }
        else {
            goto("/home/routines/weekly-sets")
        }
    }
    onMount(() => { 
        goto("/home/routines/current")
    })
</script>


<div class="routines-page" class:routines-page--light={!$themeState.isDarkTheme}>
    <h1 class="routines-page__title">Routines</h1>
    <!-- Highlighter Tabs -->
    <div class="routines-page__tabs">
        <button 
            on:click={(e) => onTabClicked(e, RoutinesTab.Current)}
            class="routines-page__tab-btn" class:routines-page__tab-btn--selected={selectedTab === RoutinesTab.Current}
        >
            Current
        </button>
        <button 
            on:click={(e) => onTabClicked(e, RoutinesTab.Daily)}
            class="routines-page__tab-btn" class:routines-page__tab-btn--selected={selectedTab === RoutinesTab.Daily}
        >
            Daily Routines
        </button>
        <button 
            on:click={(e) => onTabClicked(e, RoutinesTab.Weekly)}
            class="routines-page__tab-btn" class:routines-page__tab-btn--selected={selectedTab === RoutinesTab.Weekly}
        >
            Weekly Sets
        </button>
    </div>
    <div class="routines-page__divider"></div>
    <slot />
</div>

<style global lang="scss">
    @import "../../../scss/highlighter-tabs.scss";

    .routines-page {
        height: 100%;
        padding-top: 6px;

        &__tabs {
            @include flex(center);
            margin-left: -10px;

        }
        &__tab-btn {
            padding: 4.5px 14px;
            border-radius: 20px;
            opacity: 0.24;
            margin-right: 4px;
            @include text-style(1, 300, 1.45rem, "DM Sans");
            
            &:first-child {
                padding: 4.5px 12px 4.5px 12px;
            }
            &:active {
                transform: scale(0.985);
                transition: 0.14s ease-in-out;
            }
            &:hover {
                transition: 0.04s ease-in-out;
                background: rgba(var(--textColor1), 0.02);
                opacity: 0.85;
            }
            &--selected {
                opacity: 1 !important;
                background: rgba(var(--textColor1), 0.05) !important;
            }
        }
        &__title {
            margin-bottom: 14px;
            @include text-style(_, 400, 1.74rem);
        }
        &__divider {
            margin: 10px 0px 0px 0px;
            @include divider();
        }
    }
</style>