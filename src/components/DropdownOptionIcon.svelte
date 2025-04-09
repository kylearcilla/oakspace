<script lang="ts">
    import { LogoIcon, Icon } from "$lib/enums"
	import { inlineStyling } from "$lib/utils-general"

	import Logo from "./Logo.svelte"
	import Hotkeys from "./Hotkeys.svelte"
	import SvgIcon from "./SVGIcon.svelte"

    export let dir: "l" | "r" = "l"
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

<div class:dmenu__right-icon-container={dir === "r"}>
    <div 
        class={`dmenu__option-icon dmenu__option-icon--${type}`}
        class:dmenu__option-icon--left={dir === "l"}
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
        {:else if type === "svg" && icon.icon === Icon.ChevronRight}
            <div style:opacity={0.25}>
                <SvgIcon 
                    icon={getSvgIcon()} 
                    options={{ scale: 1.45, strokeWidth: 0.4 }} 
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
        {#if type === "unit"}
            {icon.icon}
        {/if}
    </div>
</div>