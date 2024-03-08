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
        initHighlighter(target)

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
    function initHighlighter(tab: HTMLButtonElement) {
        const width = tab.clientWidth
        const offSetLeft = tab.offsetLeft

        tabHighlighterClass = `left: ${offSetLeft}px; width: ${width}px;`
    }

    onMount(() => { 
        initHighlighter(getFirstHighlighterBtn(ROUTINES_TABS))

        goto("/home/routines/current")

    })
</script>


<div class="routines-page" class:routines-page--light={!$themeState.isDarkTheme}>
    <h1 class="routines-page__title">Routines</h1>
    <!-- Highlighter Tabs -->
    <div class="highlighter-tabs">
        <div class="highlighter-tabs__container" id={ROUTINES_TABS}>
            <button 
                on:click={(e) => onTabClicked(e, RoutinesTab.Current)}
                class="highlighter-tabs__tab-btn" class:highlighter-tabs__tab-btn--selected={selectedTab === RoutinesTab.Current}
            >
                Current
            </button>
            <button 
                on:click={(e) => onTabClicked(e, RoutinesTab.Daily)}
                class="highlighter-tabs__tab-btn" class:highlighter-tabs__tab-btn--selected={selectedTab === RoutinesTab.Daily}
            >
                Daily Routines
            </button>
            <button 
                on:click={(e) => onTabClicked(e, RoutinesTab.Weekly)}
                class="highlighter-tabs__tab-btn" class:highlighter-tabs__tab-btn--selected={selectedTab === RoutinesTab.Weekly}
            >
                Weekly Sets
            </button>
        </div>
        <div class="highlighter-tabs__divider"></div>
    </div>
    <slot />
</div>

<style global lang="scss">
    @import "../../../scss/highlighter-tabs.scss";

    .routines-page {
        height: 100%;
        padding-top: 10px;

        &--light .highlighter-tabs {
            @include highlighter-tabs-light-mode;

            &__tab-btn {
                margin-right: 17px;
            }
        }

        .highlighter-tabs {
            margin-bottom: 19px;
            &__tab-btn {
                font-size: 1.4rem;
                transition: 0.07s ease-in-out;
            }
            &__tab-btn:active {
                transition: 0.14s ease-in-out;
            }
            &__divider {
                margin-top: 13px;
                width: 100%;
                opacity: 0.8;
            }
        }
        &__title {
            margin-bottom: 12px;
            @include text-style(_, 400, 2rem);
        }
    }
</style>