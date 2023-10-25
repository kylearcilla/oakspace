<script lang="ts">
	import { ToastContext, Icon } from "$lib/enums"
	import { themeState, toastMessages } from "$lib/store"
	import { addSpacesToCamelCaseStr, findEnumIdxFromDiffEnum } from "$lib/utils-general"
	import { onMount } from "svelte"
	import Logo from "./Logo.svelte"

    export let toast: ToastMsg
    export let idx: number

    let icon: Icon
    let iconOptions: any

    const LOGO_WIDTH = 15
    const TOAST_ICON_OPTIONS = {
        AppleMusic: { iconWidth: "50%" },
        Spotify: { iconWidth: "90%", hasBgColor: false },
        YoutubeMusic: { iconWidth: "60%" },
        Soundcloud: { iconWidth: "60%" },
        Youtube: { iconWidth: "60%" },
        Google: { iconWidth: "60%" },
        Luciole: { iconWidth: "60%" }
    }

    const actionBtnClickedHandler = async () => {
        if (!toast.action) return
        await toast.action.func?.()
        dismissToast()
    }
	const dismissToast = () => {
        toastMessages.update((toasts: ToastMsg[]) => {
            toasts.splice(idx, 1)
            return toasts
        })
    }

    onMount(() => {
        // get the icon enum & options to be used in Icon component
        let idx = findEnumIdxFromDiffEnum(toast.context, Icon, ToastContext)
        icon = idx === null ? Icon.Luciole : idx as Icon

        const iconStrIdx = Icon[icon] as keyof typeof TOAST_ICON_OPTIONS
        iconOptions = TOAST_ICON_OPTIONS[iconStrIdx]
    })

</script>

<div class={`toast ${$themeState?.isDarkTheme ? "" : "toast--light"}`}>
    <div class="toast__header-icon">
        {#if iconOptions}
            <Logo logo={icon} options={{ containerWidth: `${LOGO_WIDTH}px`, ...iconOptions}} />
        {/if}
    </div>
    <div class="toast__header">
        <h3 class="toast__header-title">
            {addSpacesToCamelCaseStr(ToastContext[toast.context])}
        </h3>
        <button class="toast__header-close-btn text-only" on:click={dismissToast}>
            ×
        </button>
    </div>
    <p class="toast__text">
        {toast.message}
    </p>
    {#if toast.action}
        <div class="toast__action-btn">
            <button class="text-only text-only--light" on:click={actionBtnClickedHandler}>
                {toast.action.msg}
            </button>
        </div>
    {/if}
</div>


<style lang="scss">
    @import "../scss/brands.scss";

    .toast {
        position: fixed;
        min-width: 196px;
        right: 15px;
        border-radius: 12px;
        visibility: hidden;
        opacity: 0;
        padding: 9px 14px 8px 35px;
        background-color: var(--navMenuBgColor);
        animation: 0.7s cubic-bezier(.13, 1, .5, .94) 0.8s slide-up forwards;
        z-index: 694206;
        
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

        &__header {
            @include flex-container(center, _);
            position: relative;
            margin-bottom: 4px;
        }
        &__header-icon {
            @include pos-abs-top-left-corner(10px, 10px);
        }
        &__header-title {
            font-weight: 500;
            font-size: 1.25rem;
        }
        &__header-close-btn {
            @include pos-abs-top-right-corner(-5px, 0px);
            font-size: 1.8rem !important;
            font-weight: 100 !important;
        }
        &__text {
            margin-bottom: 8px;
            color: rgba(var(--textColor1), 0.5);
            font-weight: 300;
            font-size: 1.1rem;
            max-width: 250px;
        }
        &__action-btn {
            @include flex-container(center, flex-end);
            margin-bottom: 6px;
            
            button {
                color: rgba(var(--textColor1), 0.9);
                padding: 0px 4px;
                font-size: 1.07rem;
                font-weight: 400;
                transition: 0.12s ease-in-out;
            }
        }

        @keyframes slide-up {
            0% {

                bottom: -30px;
            }
            100% {
                visibility: visible;
                opacity: 1;
                bottom: 13px;
            }
        }
        @keyframes slide-away {
            0% {
                bottom: 13px;   
            }
            100% {
                visibility: visible;
                opacity: 1;
                bottom:50px;
            }
        }
    }
</style>