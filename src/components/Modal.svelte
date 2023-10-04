<script lang="ts">
	import { homeViewLayout, themeState } from "$lib/store";
	import { clickOutside } from "$lib/utils-general";

    export let isModalSmall: boolean

    const handleClickOutside = () => homeViewLayout.update((data: HomeLayout) => ({ ...data, modal: null }))
</script>

<div class={`modal-bg ${$themeState?.isDarkTheme ? "" : "modal-bg--light"}`}>
    <div 
        use:clickOutside on:click_outside={() => handleClickOutside()} 
        class={`modal-bg__content modal-bg__content--overflow-y-scroll ${isModalSmall ? "modal-bg__content--small" : ""}`}
    >
        <slot></slot>
    </div>
</div>

<style lang="scss">
    
</style>