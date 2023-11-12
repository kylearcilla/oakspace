<script lang="ts">
	import { onMount } from "svelte"
	import HomeHeader from "./HomeHeader.svelte"
  import NavMenu from "./HomeSideBarLeft.svelte"
  import VideoView from "./HomeVideoView.svelte"
  import TaskView from "./SideBarRight.svelte"
  import MusicPlayer from "./HomeMusicPlayer.svelte"

	import Stats from "./Stats.svelte"
	import Settings from "./Settings.svelte"
	import ModalQuote from "./ModalQuote.svelte"
	import Toast from "../../components/Toast.svelte"
	import HomeEmptyView from "./HomeEmptyView.svelte"
	import MusicSettings from "./SettingsMusic.svelte"
	import ShortcutsModal from "./ShortcutsModal.svelte"
	import YoutubeSettings from "./SettingsYoutube.svelte"
	import SessionNewModal from "./SessionNewModal.svelte"
	import SessionActiveHome from "./SessionActiveHome.svelte"
	import ApperanceSettings from "./SettingsAppearance.svelte"
	import SessionActiveModal from "./SessionActiveModal.svelte"
	import SessionFinishedModal from "./SessionFinishedModal.svelte"
	import SessionCanceledModal from "./SessionCanceledModal.svelte"
  
	import { ModalType } from "$lib/enums"
	import { sessionStore, homeViewLayout, toastMessages, ytPlayerStore, musicPlayerStore } from "$lib/store"
	import { homeVideoViewClassHandler, initAppState, keyboardShortCutHandlerKeyDown, keyboardShortCutHandlerKeyUp, onMouseMoveHandler, updateUI } from "$lib/utils-home"
	import SessionEditModal from "./SessionEditModal.svelte";

  let hasUserToggledWithKeyLast = true
  let homeViewViewClasses = ""

  homeViewLayout.subscribe((layout: HomeLayout) => {
    homeViewViewClasses = homeVideoViewClassHandler(layout.isNavMenuOpen, layout.isTaskMenuOpen)
  })

  const handleKeyDown       = (event: KeyboardEvent) => hasUserToggledWithKeyLast = keyboardShortCutHandlerKeyDown(event, hasUserToggledWithKeyLast)
  const handleKeyUp         = (event: KeyboardEvent) => keyboardShortCutHandlerKeyUp(event)
  const _onMouseMoveHandler = (event: MouseEvent)    => hasUserToggledWithKeyLast = onMouseMoveHandler(event, hasUserToggledWithKeyLast)

  onMount(() => initAppState())
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class={`home ${homeViewViewClasses}`} on:mousemove={_onMouseMoveHandler}>
  <div class={`home__nav-menu-container ${!$homeViewLayout.isNavMenuOpen ? "home__nav-menu-container--hide" : ""}`}>
      <NavMenu/>
  </div>
  <div class="home__video">
      <HomeHeader/>
      <VideoView />
      {#if !$ytPlayerStore?.doShowPlayer && !$sessionStore} 
        <HomeEmptyView />
      {/if}
      {#if !$ytPlayerStore?.doShowPlayer && $sessionStore}  
        <SessionActiveHome />  
      {/if}
  </div>
  <div class={`home__task-view-container ${$homeViewLayout.isTaskMenuOpen ? "" : "home__task-view-container--closed"}`}>
      <TaskView />
  </div>

  <!-- Floating Elements -->
  {#if $musicPlayerStore}
    <MusicPlayer />
  {/if}
  {#if $toastMessages.length > 0}
    {#each $toastMessages as toast, idx}
        <Toast toast={toast} idx={idx} />
    {/each}
  {/if}

  <!-- Settings Modals -->
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Stats)} <Stats/> {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Settings)} <Settings/> {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Youtube)} <YoutubeSettings/> {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Appearance)} <ApperanceSettings /> {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Music)} <MusicSettings /> {/if}

  <!-- Session Modals -->
  {#if $homeViewLayout.modalsOpen.includes(ModalType.NewSession)} 
    <SessionNewModal /> 
  {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.EditSession)} 
    <SessionEditModal /> 
  {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.SesssionFinished)} 
    <SessionFinishedModal /> 
  {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.SessionCanceled)}  
    <SessionCanceledModal /> 
  {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.ActiveSession)} 
    <SessionActiveModal/>
  {/if}

  <!-- Other Modals Modals -->
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Quote)} <ModalQuote /> {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Shortcuts)} <ShortcutsModal /> {/if}
</div>


<style lang="scss">
    #signInDiv {
      position: absolute;
      right: 400px;
      top: 150px;
    }

    $task-menu-width: 240px;
    $nav-menu-width: 60px;

    .home {
      background-color: var(--primaryBgColor);
      height: 100%;
      min-height: 100vh;
      display: flex;
      font-family: 'Apercu Medium' system-ui;

      // background-image: url('https://upload.wikimedia.org/wikipedia/commons/7/77/Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg');
      // background-size: cover;
      // background-position: center;
      // background-repeat: no-repeat;

      /* Responsivness Classes */
      &--just-nav-menu-shown &__video {
        margin-left: $nav-menu-width;
        width: calc(100% - $nav-menu-width);
        
        @include mq-custom(max-width, 600px) {
          margin-left: 0px;
          width: 100%;
        }
      }
      &--just-task-view-shown &__video {
        width: calc(100% - $task-menu-width);
        
        @include mq-custom(max-width, 730px) {
          width: 100%;
        }
      }
      &--both-shown &__video {
        margin-left: $nav-menu-width;
        width: calc(100% - ($nav-menu-width + $task-menu-width));

        @include mq-custom(max-width, 785px) {
          margin: 0px;
          width: 100%;
        }
      }

      &__nav-menu-container {
        background-color: var(--navMenuBgColor);
        border: var(--sidePanelBorder);
        box-shadow: var(--sidePanelShadow);
        width: $nav-menu-width;
        transition: ease-in-out 0.15s;
        height: 100vh;
        margin-left: 0px;
        z-index: 1000;
        position: fixed;

        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-right: 1px solid rgba(138, 138, 138, 0.3);

        &--hide {
          margin-left: -$nav-menu-width !important;
        }
      }

      &__video {
        padding: 0px 2.5% 30px 2.5%;
        transition: ease-in-out 0.15s;
        width: 100%;
      }
      &__task-view-container {
        width: $task-menu-width;
        height: 100vh;
        position: fixed;
        top: 0px;
        right: 0px;
        transition: ease-in-out 0.18s;
        overflow: hidden;
        background-color: var(--secondaryBgColor);
        border: var(--sidePanelBorder);
        box-shadow: var(--dropdownMenuBgColor2);
        z-index: 200000;

        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-left: 1px solid rgba(138, 138, 138, 0.3);

        &--closed {
          margin-right: -300px; 
        }
      }
    }
</style>