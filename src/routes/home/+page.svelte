<script lang="ts">
    import HomeEmptyView from "./HomeEmptyView.svelte"
    import SessionActiveHome from "./SessionActiveHome.svelte"
    import { ytPlayerStore, sessionStore } from "$lib/store"
	import { onMount } from "svelte";

    $: doShowPlayer  = $ytPlayerStore?.doShowPlayer ?? false
</script>

<div>
    {#if !doShowPlayer && !$sessionStore} 
        <HomeEmptyView />
    {/if}
    {#if !$ytPlayerStore && $sessionStore}  
        <SessionActiveHome />  
    {/if}
</div>