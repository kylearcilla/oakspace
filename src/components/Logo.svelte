<script lang="ts">
    import { onMount } from "svelte"
	import { LogoIcon } from "$lib/enums"
    import tempLogo from "$lib/images/temp-logo.png"

    let bgStyling = ""
    let iconStyling = ""

    export let logo: LogoIcon
    export let options: LogoContainerOptions | undefined = undefined

    const scale = options?.scale ?? 1

    function makeContainerStyling() {
        const arr: string[] = []

        if (options?.containerWidth) {
            arr.push(`width: ${options.containerWidth}`)
        }
        if (options?.borderRadius) {
            arr.push(`border-radius: ${options.borderRadius}`)
        }
        if (options?.hasBgColor != undefined && !options.hasBgColor) { 
            arr.push("background: transparent")
        }
        if (options?.colored != undefined && !options.colored) { 
            arr.push("filter: saturate(0)")
        }

        bgStyling = arr.join('; ')
    }
    function makeIconStyling() {
        if (options?.iconWidth) {
            iconStyling = `width: ${options.iconWidth}`
        }
    }

    onMount(() => {
        if (!options) return

        makeContainerStyling()
        makeIconStyling()
    })
</script>

<div 
    class="logo-wrapper"
    style:--scale={scale}
>
    {#if logo === LogoIcon.Youtube}
        <div 
            class="logo-container youtube-logo-bg" 
            style={bgStyling}
        >
            <div class="logo" style={iconStyling} data-icon="youtube">
                <svg width="100%" height="100%" viewBox="0 0 13.5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.28137 4.42678C3.28137 2.83328 4.57315 1.5415 6.16665 1.5415V1.5415C7.76014 1.5415 9.05192 2.83328 9.05192 4.42678V4.42678C9.05192 6.02027 7.76014 7.31205 6.16665 7.31205V7.31205C4.57315 7.31205 3.28137 6.02027 3.28137 4.42678V4.42678Z" fill="white"/>
                    <path d="M12.4063 1.68809C12.2696 1.20707 11.8667 0.82824 11.3551 0.699677C10.4279 0.466064 6.70971 0.466064 6.70971 0.466064C6.70971 0.466064 2.99158 0.466064 2.06432 0.699677C1.55275 0.82826 1.14985 1.20707 1.0131 1.68809C0.764648 2.55996 0.764648 4.37903 0.764648 4.37903C0.764648 4.37903 0.764648 6.1981 1.0131 7.06997C1.14985 7.55098 1.55275 7.91403 2.06432 8.0426C2.99158 8.27621 6.70971 8.27621 6.70971 8.27621C6.70971 8.27621 10.4278 8.27621 11.3551 8.0426C11.8667 7.91403 12.2696 7.55098 12.4063 7.06997C12.6548 6.1981 12.6548 4.37903 12.6548 4.37903C12.6548 4.37903 12.6548 2.55996 12.4063 1.68809ZM5.49367 6.03061V2.72745L8.6013 4.37907L5.49367 6.03061Z" fill="#FC4343"/>
                </svg>                
            </div>
        </div>
    {:else if logo === LogoIcon.Google}
        <div 
            class="logo-container google-logo-bg" 
            style={bgStyling}
        >
            <div class="logo" style={iconStyling} data-icon="google">
                <svg  width="100%" height="100%" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262" id="google" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                    <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                    <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path>
                    <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
                </svg>
            </div>
        </div>
    {:else if logo === LogoIcon.Somara}
        <div class="logo-container" style={bgStyling}>
            <div class="logo" style={iconStyling} data-icon="somara">
                <img src={tempLogo} alt="temp-logo">
            </div>
        </div>
    {:else if logo === LogoIcon.Todoist}
        <div class="logo-container" style={bgStyling}>
            <div class="logo" style={iconStyling} data-icon="todoist">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.4801 0.203125H1.80116C0.820048 0.205322 0.0249038 1.00052 0.0214844 1.98291V12.6616C0.0214844 13.6405 0.822227 14.4414 1.80116 14.4414H12.4801C13.459 14.4414 14.2598 13.6405 14.2598 12.6616V1.98291C14.2598 1.00403 13.459 0.203125 12.4801 0.203125Z" fill="#E44332"/>
                    <path d="M3.03226 6.92393C3.28049 6.77898 8.61318 3.68 8.73508 3.60818C8.85698 3.53726 8.86363 3.31916 8.72622 3.24026C8.58969 3.1618 8.33036 3.01286 8.23417 2.95567C8.09683 2.88011 7.92991 2.88213 7.79444 2.96099C7.72617 3.00089 3.16967 5.64728 3.01763 5.73416C2.83455 5.83878 2.60981 5.84055 2.42806 5.73416L0.0214844 4.32187V5.52228C0.606617 5.86715 2.06369 6.72357 2.41654 6.92526C2.6271 7.04495 2.82879 7.04229 3.0327 6.92393" fill="white"/>
                    <path d="M3.03226 9.19151C3.28049 9.04656 8.61318 5.94757 8.73508 5.87576C8.85698 5.80484 8.86363 5.58674 8.72622 5.50784C8.58969 5.42938 8.33036 5.28043 8.23417 5.22325C8.09683 5.14769 7.92991 5.14971 7.79444 5.22857C7.72617 5.26847 3.16967 7.91486 3.01763 8.00174C2.83455 8.10636 2.60981 8.10813 2.42806 8.00174L0.0214844 6.58945V7.78985C0.606617 8.13473 2.06369 8.99115 2.41654 9.19284C2.6271 9.31253 2.82879 9.30987 3.0327 9.19151" fill="white"/>
                    <path d="M3.03226 11.6017C3.28049 11.4567 8.61318 8.35773 8.73508 8.28592C8.85698 8.21499 8.86363 7.9969 8.72622 7.91799C8.58969 7.83953 8.33036 7.69059 8.23417 7.63341C8.09683 7.55785 7.92991 7.55986 7.79444 7.63873C7.72617 7.67862 3.16967 10.325 3.01763 10.4119C2.83455 10.5165 2.60981 10.5183 2.42806 10.4119L0.0214844 8.9996V10.2C0.606617 10.5449 2.06369 11.4013 2.41654 11.603C2.6271 11.7227 2.82879 11.72 3.0327 11.6017" fill="white"/>
                </svg>                                
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    @import "../scss/brands.scss";

    .logo-wrapper {
        transform: scale(var(--scale));
        @include center;
    }
    .logo-container {
        @include center;
        aspect-ratio: 1 / 1;
        width: 24px;
        border-radius: 40px;
    }
    .logo {
        @include center;
        width: 55%;

        img {
            width: 15px;
        }
    }
</style>