<script lang="ts">
	import { LogoIcon } from "$lib/enums"
	import { inlineStyling } from "$lib/utils-general"

	import Logo from "./Logo.svelte"
	import Hotkeys from "./Hotkeys.svelte"
	import SvgIcon from "./SVGIcon.svelte";
	import { Icon } from "../lib/enums";

    export let left: boolean = true
    export let icon: DropdownOptnIcon

    const type = icon ? icon.type ?? ("fa") : null

    function getDefaultIcon() {
        return icon.icon as string
    }
    function getHotkeys() {
        return icon.icon as HotKeyCombo
    }
    function getLogo() {
        return icon.icon as LogoIcon
    }
    function getSvgIcon() {
        return icon.icon as Icon
    }
</script>

<div class:dmenu__option-right-icon-container={!left}>
    <div 
        class={`dmenu__option-icon dmenu__option-icon--${type}`}
        class:dmenu__option-icon--left={left}
        style={`${inlineStyling(icon?.styling)}`}
        style:transform={icon.transform}
    >
        {#if type === "fa"}
            <i class={getDefaultIcon()}></i>
        {:else if type === "logo"}
            <Logo 
                logo={getLogo()}
                options={{
                    containerWidth: "45px",
                    iconWidth: "100%",
                    colored: icon.logoColored
                }}
            />
        {:else if type === "svg" && icon.icon === Icon.Pin}
            <div style:opacity={0.25}>
                <SvgIcon 
                    icon={getSvgIcon()} 
                    options={{ scale: 1.1, strokeWidth: 0.4 }} 
                />
            </div>
        {:else if type === "svg"}
            <div style:opacity={0.25}>
                <SvgIcon 
                    icon={getSvgIcon()} 
                />
            </div>
        {:else if type === "hotkey"}
            <Hotkeys hotkeys={getHotkeys()} />
        {:else if type === "check"}
            <i class="fa-solid fa-check"></i> 
        {/if}
    </div>
</div>