<script lang="ts">
	import { LogoIcon } from "$lib/enums"
	import { inlineStyling } from "$lib/utils-general"

	import Logo from "./Logo.svelte"
	import Hotkeys from "./Hotkeys.svelte"

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
</script>

<div class:dropdown-menu__option-right-icon-container={!left}>
    <div 
        class={`dropdown-menu__option-icon dropdown-menu__option-icon--${type}`}
        class:dropdown-menu__option-icon--left={left}
        style={`${inlineStyling(icon?.styling)}`}
    >
        <!-- Check -->
        {#if type === "fa"}
            <i class={getDefaultIcon()}>
            </i>
        {:else if type === "logo"}
            <Logo 
                logo={getLogo()}
                options={{
                    containerWidth: "45px",
                    iconWidth: "100%",
                    colored: icon.logoColored
                }}
            />
        {:else if type === "hotkey"}
            <Hotkeys hotkeys={getHotkeys()} />
        {:else if type === "check"}
            <i class="fa-solid fa-check"></i> 
        {/if}
    </div>
</div>