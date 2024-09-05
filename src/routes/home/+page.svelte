<script lang="ts">
    import HomeEmptyView from "./HomeEmptyView.svelte"
    import { ytPlayerStore } from "$lib/store"
	import { onMount } from "svelte";

    $: doShowPlayer  = $ytPlayerStore?.doShowPlayer ?? false
</script>

<div>
    {#if !doShowPlayer} 
        <HomeEmptyView />
    {/if}
</div>