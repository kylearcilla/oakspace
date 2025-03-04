<script lang="ts">
    import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { themeState } from '$lib/store'

    let currTab: "weekly" | "daily" = "weekly"
    let highlighter = { width: 0, left: 0 }

    $: currTab = $page.url.pathname.includes('/home/routines/daily') ? 'daily' : 'weekly'
    $: requestAnimationFrame(() => onBtnClicked(currTab))

    function onBtnClicked(view: "weekly" | "daily") {
        currTab = view
        const btnElem = document.getElementById(`routines-page--${view}`)
        if (!btnElem) return

        const width = btnElem.clientWidth

        highlighter.width = width
        highlighter.left =  btnElem.offsetLeft

        if (view === "daily") {
            goto("/home/routines/daily")
        } 
        else {
            goto("/home/routines/weekly")
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
            id="routines-page--weekly"
            on:click={() => onBtnClicked("weekly")}
            class="routines-page__tab-btn" 
            class:routines-page__tab-btn--selected={currTab === "weekly"}
        >
            Weekly
        </button>
        <button 
            id="routines-page--daily"
            on:click={() => onBtnClicked("daily")}
            class="routines-page__tab-btn" 
            class:routines-page__tab-btn--selected={currTab === "daily"}
        >
            Daily
        </button>
        <div 
            style:left={`${highlighter.left}px`}
            style:width={`${highlighter.width}px`}
            class="routines-page__highlight"
        ></div>
    </div>
    <div class="routines-page__divider"></div>
    <slot />
</div>

<style global lang="scss">

    .routines-page {
        height: 100%;
        padding: 18px 0px 0px 25px;

        &--light &__title {
            @include text-style(1);
        }
        &--light &__tab-btn {
            opacity: 0.34;
            @include text-style(1);
        }
        
        &__title {
            margin-bottom: 13px;
            @include text-style(1, var(--fw-400-500), 1.8rem);
        }
        &__tabs {
            @include flex(center);
            position: relative;
        }
        &__tab-btn {
            margin-right: 17px;
            opacity: 0.24;
            transition-duration: 0.04s;
            @include text-style(1, var(--fw-400-500), 1.6rem);
            
            &:active {
                transform: scale(0.985);
                transition: 0.14s ease-in-out;
            }
            &:hover, &:focus {
                opacity: 0.5;
            }
            &--selected {
                opacity: 1 !important;
            }
        }
        &__highlight {
            position: absolute;
            bottom: -11px;
            height: 1.5px;
            background-color: rgba(var(--textColor1), 0.9);
            transition: 0.18s cubic-bezier(.4, 0, .2, 1);
        }
        &__divider {
            margin: 10px 0px 0px 0px;
            border-top: var(--divider-border);
        }
    }
</style>