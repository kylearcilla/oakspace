<script lang="ts">
	import { onMount } from "svelte"

  // home components
	import Header from "./Header.svelte"
  import NavMenu from "./SideBarLeft.svelte"
  import TaskView from "./SideBarRight.svelte"
  import MusicPlayer from "./MusicPlayer.svelte"
  import VideoView from "./HomeVideoView.svelte"
	import HomeEmptyView from "./HomeEmptyView.svelte"

  // main modals
	import Stats from "./Stats.svelte"
	import Journal from "./Journal.svelte"
	import Settings from "./Settings.svelte"
	import Appearance from "./Appearance.svelte"
	import MusicSettings from "./MusicSettings.svelte"
	import YoutubeSettings from "./YoutubeSettings.svelte"

  // modals
	import ModalQuote from "./ModalQuote.svelte"
	import ShortcutsModal from "./ShortcutsModal.svelte"
	import SessionNewModal from "./SessionNewModal.svelte"
  import SessionEditModal from "./SessionEditModal.svelte"
	import SessionActiveHome from "./SessionActiveHome.svelte"
	import SessionActiveModal from "./SessionActiveModal.svelte"
	import SessionFinishedModal from "./SessionFinishedModal.svelte"
	import SessionCanceledModal from "./SessionCanceledModal.svelte"

  // misc. elems
	import Toast from "../../components/Toast.svelte"
  
	import { ModalType } from "$lib/enums"
	import { sessionStore, homeViewLayout, toastMessages, ytPlayerStore, musicPlayerStore, mediaEmbedStore } from "$lib/store"
	import { 
        initAppState, keyboardShortCutHandlerKeyDown, 
        keyboardShortCutHandlerKeyUp, onMouseMoveHandler
  } from "$lib/utils-home"
	import MediaEmbed from "./MediaEmbed.svelte";

  let hasUserToggledWithKeyLast = true
  let totalWidth = 0
  let isLeftSideBarOpen = true
  let isLeftWideBarOpen = true
  let isRightBarOpen = true

  let leftSideBarWidth = 0
  let rightSideBarWidth = 0
  let middleViewStyling = ""
  let homeViewClasses = ""

  const NAV_MENU_NARROW_BAR_WIDTH = 58
  const NAV_MENU_WIDE_BAR_WIDTH = 220
  const NAV_MENU_FULL_WIDTH = NAV_MENU_WIDE_BAR_WIDTH + NAV_MENU_NARROW_BAR_WIDTH
  const RIGHT_SIDE_BAR_WIDTH = 240

  homeViewLayout.subscribe((state: HomeLayout) => {
    isLeftSideBarOpen = state.isNavMenuOpen
    isLeftWideBarOpen = state.isLeftWideMenuOpen
    isRightBarOpen = state.isTaskMenuOpen

    if (isLeftSideBarOpen) {
      leftSideBarWidth = isLeftWideBarOpen ? NAV_MENU_NARROW_BAR_WIDTH + NAV_MENU_WIDE_BAR_WIDTH : NAV_MENU_NARROW_BAR_WIDTH
    }
    else {
      leftSideBarWidth = 0
    }
    rightSideBarWidth = isRightBarOpen ? RIGHT_SIDE_BAR_WIDTH : 0

    updateMiddleView()
  })

  $: {
    if (totalWidth > 0) {
      updateMiddleView()
    }
  }

  function updateMiddleView() {
    isLeftSideBarOpen = $homeViewLayout.isNavMenuOpen
    isLeftWideBarOpen = $homeViewLayout.isLeftWideMenuOpen
    isRightBarOpen = $homeViewLayout.isTaskMenuOpen

    let width = `width: calc(100% - (${leftSideBarWidth}px + ${rightSideBarWidth}px))`
    let marginLeft = `margin-left: ${leftSideBarWidth}px`

    const isAllBarsFullOpen = isLeftSideBarOpen && isLeftWideBarOpen && isRightBarOpen

    if (isAllBarsFullOpen && totalWidth < 920) {
      width = "width: 100%"
      marginLeft = "0px"
    }
    else if (isLeftSideBarOpen && isLeftWideBarOpen && totalWidth < 670) {
      width = "width: 100%"
      marginLeft = "0px"
    }
    else if (isRightBarOpen && isLeftSideBarOpen && totalWidth < 610) {
      width = "width: 100%"
    }

    middleViewStyling = `${width}; ${marginLeft};`
  }

  function handleKeyDown(event: KeyboardEvent) {
    hasUserToggledWithKeyLast = keyboardShortCutHandlerKeyDown(event, hasUserToggledWithKeyLast)
  }
  function handleKeyUp(event: KeyboardEvent) {
    keyboardShortCutHandlerKeyUp(event)
  }
  function _onMouseMoveHandler(event: MouseEvent) {
    hasUserToggledWithKeyLast = onMouseMoveHandler(event, hasUserToggledWithKeyLast)
  }
  
  onMount(initAppState)
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class={`home ${homeViewClasses}`} on:mousemove={_onMouseMoveHandler} bind:clientWidth={totalWidth}>
  <div class="home__header-container">
    <Header/>
  </div>
  <div class="home__main">
      <nav 
        class="home__nav-menu-container" 
        style={`width: ${leftSideBarWidth}px; margin-left: ${leftSideBarWidth === 0 ? `-${$homeViewLayout.isLeftWideMenuOpen ? NAV_MENU_FULL_WIDTH : NAV_MENU_NARROW_BAR_WIDTH}px` : ""}`}
      >
          <NavMenu/>
      </nav>
      <div class="home__middle-view" style={middleViewStyling}>
        <slot />
      </div>
      <nav 
        class="home__task-view-container" 
        style={`width: ${rightSideBarWidth}px; margin-right: ${rightSideBarWidth === 0 ? `-${RIGHT_SIDE_BAR_WIDTH}px` : ""}`}
      >
          <TaskView />
      </nav>
    </div>
    
  {#if $mediaEmbedStore}
     <MediaEmbed />
  {/if}

  <!-- Music Player -->
  {#if $musicPlayerStore}
    <MusicPlayer />
  {/if}

  <!-- Main Modals -->
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Stats)} <Stats/> {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Settings)} <Settings/> {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Youtube)} <YoutubeSettings/> {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Appearance)} <Appearance /> {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Music)} <MusicSettings /> {/if}
  {#if $homeViewLayout.modalsOpen.includes(ModalType.Journal)} <Journal /> {/if}

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

  <!-- Toasts -->
  {#if $toastMessages.length > 0}
    {#each $toastMessages as toast, idx}
        <Toast toast={toast} idx={idx} />
    {/each}
  {/if}
</div>


<style lang="scss">
    #signInDiv {
      position: absolute;
      right: 400px;
      top: 150px;
    }

    $header-height: 32px;

    .home {
      background-color: var(--primaryBgColor);
      height: 100%;
      min-height: 100vh;
      font-family: 'Apercu Medium' system-ui;

      // background-image: url('https://upload.wikimedia.org/wikipedia/commons/7/77/Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg');
      // background-size: cover;
      // background-position: center;
      // background-repeat: no-repeat;

      /* Responsivness Modifiders */
      &__main {
        height: calc(100vh - $header-height);
        display: flex;
        padding-top: $header-height;
      }

      &__header-container {
        position: fixed;
        top: 0px;
        z-index: 110003;
        width: 100%;
      }
      &__nav-menu-container {
        background-color: var(--navMenuBgColor);
        transition: ease-in-out 0.15s;
        height: calc(100vh - $header-height);
        margin-left: 0px;
        z-index: 1000;
        position: fixed;

        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-right: 1px solid rgba(138, 138, 138, 0.3);
      }

      &__middle-view {
        padding: 0px 2.5% 30px 2.5%;
        transition: ease-in-out 0.15s;
        width: 100%;
        height: calc(100vh - $header-height);
        // border-top: var(--headerBorder);
      }
      &__task-view-container {
        height: calc(100vh - $header-height);
        position: fixed;
        top: $header-height;
        right: 0px;
        transition: ease-in-out 0.18s;
        overflow: hidden;
        background-color: var(--rightBarBgColor);
        border: var(--sidePanelBorder);
        box-shadow: var(--rightBarBgBoxShadow);
        z-index: 20000;

        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-left: 1px solid rgba(138, 138, 138, 0.3);

        &--closed {
          margin-right: -300px; 
        }
      }
    }
</style>