<script lang="ts">
	import { goto } from '$app/navigation'
	import { themeState } from '$lib/store'

    enum RoutinesTab { Weekly, Daily }

    let currTab = RoutinesTab.Weekly

    $: if (window.location.href.includes("/home/routines/daily") ) {   
        currTab = RoutinesTab.Daily
    }
    else {
        currTab = RoutinesTab.Weekly
    }

    function onTabClicked(tab: RoutinesTab) {
        if (tab === currTab) return
        currTab = tab

        if (tab === RoutinesTab.Weekly) {
            goto("/home/routines/weekly")
        }
        else {
            goto("/home/routines/daily")
        }
    }
</script>


<div 
    class="routines-page" 
    class:routines-page--light={!$themeState.isDarkTheme}
>
    <h1 class="routines-page__title">
        Routines
    </h1>
    <div class="routines-page__tabs">
        <button 
            on:click={() => onTabClicked(RoutinesTab.Weekly)}
            class="routines-page__tab-btn" 
            class:routines-page__tab-btn--selected={currTab === RoutinesTab.Weekly}
        >
            Weekly
        </button>
        <button 
            on:click={() => onTabClicked(RoutinesTab.Daily)}
            class="routines-page__tab-btn" 
            class:routines-page__tab-btn--selected={currTab === RoutinesTab.Daily}
        >
            Daily
        </button>
    </div>
    <div class="routines-page__divider"></div>
    <slot />
</div>

<style global lang="scss">

    .routines-page {
        height: 100%;
        padding: 18px 0px 0px 25px;

        &--light &__title {
            @include text-style(1, 600);
        }
        &--light &__tab-btn {
            opacity: 0.34;
            @include text-style(1, 500);
        }
        &--light &__divider {
            @include divider(0.064, 1px);
        }
        
        &__tabs {
            @include flex(center);
            margin-left: -10px;
            font-family: "DM Mono";
        }
        &__tab-btn {
            border-radius: 20px;
            margin-right: 4px;
            padding: 4.5px 14px;
            opacity: 0.24;
            transition-duration: 0.04s;
            @include text-style(1, 300, 1.45rem);
            
            &:first-child {
                padding: 4.5px 14px;
            }
            &:active {
                transform: scale(0.985);
                transition: 0.14s ease-in-out;
            }
            &:hover, &:focus {
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
            @include text-style(1, 400, 1.74rem, "DM Mono");
        }
        &__divider {
            margin: 10px 0px 0px 0px;
            @include divider();
        }
    }
</style>