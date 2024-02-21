<script lang="ts">
	import { ToastContext, LogoIcon, Icon } from "$lib/enums"
	import { themeState, toaster, toasterHeights } from "$lib/store"
	import { addSpacesToCamelCaseStr, getAdditionalHeights, getElemById, getElemHeight } from "$lib/utils-general"
	import { onDestroy, onMount } from "svelte";
	import Logo from "./Logo.svelte"
	import SvgIcon from "./SVGIcon.svelte"
	import { DISMISS_AFTER_MS, EXPANDED_TOAST_GAP, LOGO_WIDTH, TOAST_GAP } from "$lib/utils-toast";
    
    export let idx: number
    export let toast: DOMToastItem
    export let length: number
    export let hasExpanded: boolean
    export let onMouseEnter: (idx: number) => void
    export let onMouseLeave: (e: MouseEvent) => void
    export let onToastClose: (idx: number) => void
    export let onToastActionBtnClicked: (idx: number) => void

    let iconOptions: any
    let isLeaving = false
    let dismissTimeout: NodeJS.Timeout | null = null
    let isMouseOver = false
    let heightStyle = ""

    let toastElem: HTMLElement | null = null
    let styling = ""
    let toastHeight = 0
    let stackedHeight = 0
    let frontToastHeight = 0

    const TOAST_ICON_OPTIONS = {
        AppleMusic:   { iconWidth: "50%" },
        Spotify:      { iconWidth: "90%", hasBgColor: false },
        YoutubeMusic: { iconWidth: "60%" },
        Soundcloud:   { iconWidth: "60%" },
        Youtube:      { iconWidth: "60%" },
        Google:       { iconWidth: "60%" },
        Luciole:      { iconWidth: "60%" }
    }
    
    $: {
        const iconStrIdx = LogoIcon[toast.context] as keyof typeof TOAST_ICON_OPTIONS
        iconOptions = TOAST_ICON_OPTIONS[iconStrIdx]
    }

    function _onMouseEnter(idx: number) {
        isMouseOver = true
        // closeTimeout()
        onMouseEnter(idx)
    }
    function _onMouseLeave(e: Event) {
        isMouseOver = false
        onMouseLeave(e as MouseEvent)
    }
    async function actionBtnClickedHandler() {
        if (!toast.action) return

        onToastActionBtnClicked(idx)
        await toast.action.func!()
        dismissToast()
    }
    function dismissToast() {
        isLeaving = true
        onToastClose(idx)
    }
    function closeTimeout() {
        clearTimeout(dismissTimeout!)
        dismissTimeout = null
    }
    function onClose() {
        if (dismissTimeout) {
            closeTimeout()
        }
        dismissToast()
    }
    onMount(() => {
        // if (!hasExpanded && !isMouseOver) {
        //     dismissTimeout = setTimeout(() => dismissToast(), DISMISS_AFTER_MS * (idx + 1))
        // }

        requestAnimationFrame(() => {
            const height = getElemById(`toast--${0}`)!.clientHeight
            // heightStyle = `height: ${height}px`
        })

        setTimeout(() => styling = idx === 0 ? "toast--first" : "toast--not-first", 0)
    })
    onDestroy(() => {
        if (dismissTimeout) {
            closeTimeout()
        }
    })
</script> 

<li 
    bind:this={toastElem}
    id={`toast--${idx}`}
    class={`toast 
                ${styling}
                ${idx === 0 ? "toast--just-mounted" : "toast--already-mounted"}
                ${$themeState?.isDarkTheme ? "" : "toast--light"} 
                ${isLeaving ? "toast--is-leaving" : ""}
    `}
    style={heightStyle}
    style:--index={idx}
    style:--toasts-before={idx}
    style:--expandedGap={`${EXPANDED_TOAST_GAP}px`}
    style:--gap={`${TOAST_GAP}px`}
    style:--startOffset={`${toast.offsets.start}`}
    style:--endingOffset={`${toast.offsets.end}`}
    style:--startScale={`${toast.scales.start}`}
    style:--endScale={`${toast.scales.end}`}
    style:--startOpacity={`${toast.opacity.start}`}
    style:--endOpacity={`${toast.opacity.end}`}

    on:mouseenter={() => _onMouseEnter(idx)}
    on:mouseleave={(e) => _onMouseLeave(e)}
>
    <div class="toast__header">
        <div class="toast__header-icon">
            <Logo 
                logo={Number(toast.context)} 
                options={{ containerWidth: `${LOGO_WIDTH}px`, ...iconOptions}} 
            />
        </div>
        <h3 class="toast__header-title">
            {addSpacesToCamelCaseStr(ToastContext[toast.context])}
        </h3>
    </div>
    <p class="toast__text">
        {toast.message}
    </p>
    {#if toast.action}
        <div class="toast__action-btn">
            <button class="text-only" on:click={actionBtnClickedHandler}>
                {toast.action.text}
            </button>
        </div>
    {/if}
    {#if idx === 0 || hasExpanded}
        <button class="toast__close-btn" on:click={onClose}>
            <div class="toast__close-btn-icon">
                <SvgIcon icon={Icon.Close} options={{ scale: 0.88, strokeWidth: 1.2 }} />
            </div>
        </button>
    {/if}
</li>


<style lang="scss">
    @import "../scss/brands.scss";

    $leave-animation: 280ms;
    $padding-top: 10px;
    $padding-right: 25px;
    $padding-bottom: 6px;
    $padding-left: 13px;

    .toast {
        border-radius: 12px;
        // visibility: hidden;
        // opacity: 0;
        padding: $padding-top $padding-right $padding-bottom $padding-left;
        background-color: var(--dropdownMenuBgColor1);
        border: 0.5px solid rgba(white, 0.05);
        min-width: 250px;
        position: absolute;
        right: 0px;
        bottom: 0px;
        z-index: calc(-1 * var(--index));
        position: absolute;
        opacity: 0;
        filter: blur(0);
        box-sizing: border-box;
        outline: none;
        overflow-wrap: anywhere;
        transform: var(--y);
        transition: transform 0.4s var(--ease), opacity 0.5s ease-in-out; /* Easing function added */
        
        --ease: cubic-bezier(.2, .45, 0, 1);

        // START
        &--just-mounted {
            --y: translateY(var(--startOffset)) scale(var(--startScale));
            opacity: var(--startOpacity);  
        }
        &--already-mounted {
            --y: translateY(var(--startOffset)) scale(var(--startScale));
            opacity: var(--startOpacity);  
        }

        // END
        &--first {
            --y: translateY(var(--endingOffset)) scale(var(--endScale));
            opacity: 1;
        }
        &--not-first {
            --y: translateY(var(--endingOffset)) scale(var(--endScale));
            opacity: var(--endOpacity);
        }

        // LEAVING
        &--is-leaving {
            transform: translateY(100px);
            opacity: 0;
            transition: transform  0.25s ease-in-out, opacity 0.4s ease-in-out;
        }
        
        &--light {
            background-color: var(--midPanelBaseColor);
        }
        &--light &__header {
            color: rgba(var(--textColor1), 0.9);
        }
        &--light &__header-title {
            font-weight: 600;
        }
        &--light &__header-close-btn {
            font-size: 1.8rem !important;
            font-weight: 300 !important;
        }
        &--light &__text {
            color: rgba(var(--textColor1), 0.45);
            font-weight: 600;
        }
        &--light &__action-btn button {
            color: rgba(var(--textColor1), 0.8);
            font-weight: 600;

            &:hover, &:active {
                opacity: 0.5;
            }
        }
        &__close-btn {
            @include pos-abs-top-right-corner(-6px, -6px);
            @include text-style(0.5, 100, 1.8rem);
            @include circle(19px);
            @include center;
            transition: 0.08s ease-in-out;
            background-color: #1e1d1e;

            &:hover {
                background-color: #262526;
            }
            &:hover &-icon {
                opacity: 1;
            }
            &:active {
                transition: 0.1s ease-in-out;
                transform: scale(0.9) !important;
            }
        }
        &__close-btn-icon {
            opacity: 0.5;
            @include circle(9px);
            @include center;
        }
        &__header {
            @include flex(center, _);
            position: relative;
            margin-bottom: 8px;

            &::after {
                content: "";
                position: absolute;
                left: calc(-1 * $padding-left);
                height: var(--expandedGap);
                top: calc(-1 * ($padding-top + var(--expandedGap)));
                width: calc(100% + $padding-right + $padding-left);
            }
        }
        &__header-icon {
            margin-right: 4px;
        }
        &__header-title {
            @include text-style(_, 500, 1.3rem);
            margin-left: 5px;
        }
        &__text {
            margin: 0px 0px 8px 24px;
            max-width: 250px;
            @include text-style(0.5, 300, 1.27rem);
        }
        &__action-btn {
            @include flex(center, flex-end);
            margin-bottom: 6px;
            
            button {
                color: rgba(var(--textColor1), 0.9);
                padding: 0px 4px;
                font-size: 1.07rem;
                font-weight: 400;
                // transition: 0.12s ease-in-out;
            }
        }

        @keyframes slide-up {
            0% { transform: translateY(100px); }
            100% {
                visibility: visible;
                opacity: 1;
                transform: translateY(0px);
            }
        }
        @keyframes slide-away {
            0% {
                visibility: visible;
                opacity: 1;
                bottom: 0px;
            }
            100% { bottom: -80px; opacity: 0.2; }
        }
    }
</style>