<script lang="ts">
    import VideoView from "./HomeVideoView.svelte"
    import HomeEmptyView from "./HomeEmptyView.svelte"
    import SessionActiveHome from "./SessionActiveHome.svelte"
    import { ytPlayerStore, sessionStore } from "$lib/store"
</script>

<div>
    <VideoView />
    {#if !$ytPlayerStore?.doShowPlayer && !$sessionStore} 
      <HomeEmptyView />
    {/if}
    {#if !$ytPlayerStore?.doShowPlayer && $sessionStore}  
      <SessionActiveHome />  
    {/if}
</div>