<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import HomeHeader from "./HomeHeader.svelte"
  import NavMenu from "./HomeSideBarLeft.svelte"
  import VideoView from "./HomeVideoView.svelte"
  import TaskView from "./HomeSideBarRight.svelte"
  import MusicPlayer from "./HomeMusicPlayer.svelte"

	import Stats from "./Stats.svelte"
	import Settings from "./Settings.svelte"
	import Toast from "../../components/Toast.svelte"
	import HomeEmptyView from "./HomeEmptyView.svelte"
	import MusicSettings from "./SettingsMusic.svelte"
	import YoutubeSettings from "./SettingsYoutube.svelte"
	import SessionActiveHome from "./SessionActiveHome.svelte"
	import ApperanceSettings from "./SettingsAppearance.svelte"
  
	import { SettingsModal } from "$lib/enums"
	import { globalSessionObj, homeViewLayout, toastMessages } from "$lib/store"
	import { appShortCutsHandler, homeVideoViewClassHandler, initAppState, onMouseMoveHandler, onWindowResizedHandler } from "$lib/utils-home";

  let hasUserToggledWithKeyLast = true
  let homeViewViewClasses = ""

  homeViewLayout.subscribe((layout: HomeLayout) => {
    homeViewViewClasses = homeVideoViewClassHandler(layout.isNavMenuOpen, layout.isTaskMenuOpen)
  })

  const handleResize = () => onWindowResizedHandler()
  const handleKeyDown = (event: KeyboardEvent) => {
    hasUserToggledWithKeyLast = appShortCutsHandler(event)
  }
  const _onMouseMoveHandler = (event: MouseEvent) => {
    hasUserToggledWithKeyLast = onMouseMoveHandler(event, hasUserToggledWithKeyLast)
  }

  onMount(() => {
    window.addEventListener("resize", handleResize)
    initAppState()
  })
  onDestroy(() =>  window.removeEventListener("resize", handleResize))

</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="home" on:mousemove={_onMouseMoveHandler}>
  <div class={`home__nav-menu-container ${!$homeViewLayout.isNavMenuOpen ? "home__nav-menu-container--hide" : ""}`}>
      <NavMenu/>
  </div>
  <div class={`home__video ${homeViewViewClasses}`}>
      <HomeHeader/>
      <VideoView />
      {#if !$homeViewLayout.isVideoViewOpen && !$globalSessionObj} 
         <HomeEmptyView />    
      {/if}
      {#if !$homeViewLayout.isVideoViewOpen && $globalSessionObj}  
        <SessionActiveHome />  
      {/if}
  </div>
  <div class={`home__task-view-container ${$homeViewLayout.isTaskMenuOpen ? "" : "home__task-view-container--closed"}`}>
      <TaskView />
  </div>

  <!-- Floating Elements -->
  <MusicPlayer />
  {#if $toastMessages.length > 0}
    {#each $toastMessages as toast, idx}
        <Toast toast={toast} idx={idx} />
    {/each}
  {/if}
  {#if $homeViewLayout.modal === SettingsModal.Settings} <Settings/> {/if}
  {#if $homeViewLayout.modal === SettingsModal.Youtube} <YoutubeSettings/> {/if}
  {#if $homeViewLayout.modal === SettingsModal.Music} <MusicSettings /> {/if}
  {#if $homeViewLayout.modal === SettingsModal.Appearance} <ApperanceSettings /> {/if}
</div>

{#if $homeViewLayout.modal === SettingsModal.Stats} <Stats/> {/if}

<style lang="scss">
    #signInDiv {
      position: absolute;
      right: 400px;
      top: 150px;
    }

    .home {
      background-color: var(--primaryBgColor);
      height: 100%;
      min-height: 100vh;
      display: flex;
      justify-content: space-between;
      font-family: 'Apercu Medium' system-ui;

      // background-image: url('https://upload.wikimedia.org/wikipedia/commons/7/77/Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg');
      // background-size: cover;
      // background-position: center;
      // background-repeat: no-repeat;

      @include sm(max-width) {
        width: 100%;
      }

      &__nav-menu-container {
        background-color: var(--navMenuBgColor);
        border: var(--sidePanelBorder);
        box-shadow: var(--sidePanelShadow);
        width: 60px;
        transition: ease-in-out 0.15s;
        height: 100vh;
        margin-left: 0px;
        position: fixed;
        z-index: 1000;

        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-right: 1px solid rgba(138, 138, 138, 0.3);

        &--hide {
          margin-left: -60px !important;
        }
        @include sm(max-width) {
          position: fixed; 
        }
      }

      &__video {
        padding: 0px 2.5% 30px 2.5%;
        transition: ease-in-out 0.15s;
        width: 100%;
        margin: 0px auto;

        // nev menu and right menu both shown
        margin-left: 60px;
        
        &--nav-menu-hidden {
          margin-left: 0px;
        }
        &--just-nav-menu-shown {
          @include sm(max-width) {
            margin-left: 0px;
          }
        }
        &--task-view-hidden {
            padding-right: 2.5%;
        }
        &--just-task-view-shown {
          padding-right: 250px;
          margin-right: 2.5%;
          
          @include mq-custom(max-width, 940px) {
            padding-right: 265px;
          }
          @include mq-custom(max-width, 730px) {
            padding-right: 2.5%;
            margin-right: 0px;
          }
        }
        &--task-view-also-shown {
          padding-right: 250px;
          margin-right: 2.5%;

          @include mq-custom(max-width, 995px) {
            padding-right: 245px;
          }
          @include mq-custom(max-width, 840px) {
            padding-right: 2.5%;
            margin-right: 0px;
          }
        }
      }
      &__task-view-container {
        width: 245px;
        height: 100vh;
        position: fixed;
        top: 0px;
        right: 0px;
        transition: ease-in-out 0.18s;
        overflow: hidden;
        background-color: var(--secondaryBgColor);
        border: var(--sidePanelBorder);
        box-shadow: var(--prodMenuViewShadow);

        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-left: 1px solid rgba(138, 138, 138, 0.3);

        &--closed {
          margin-right: -300px; 
        }
      }
    }
</style>