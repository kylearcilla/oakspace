<script lang="ts">
	import { onMount } from "svelte"

  // home components
	import Header from "./Header.svelte"
  import NavMenu from "./SideBarLeft.svelte"
  import TaskView from "./SideBarRight.svelte"
  import MusicPlayer from "./MusicPlayer.svelte"
  import VideoView from "./HomeVideoView.svelte"

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
	import SessionActiveModal from "./SessionActiveModal.svelte"
	import SessionFinishedModal from "./SessionFinishedModal.svelte"
	import SessionCanceledModal from "./SessionCanceledModal.svelte"

  // misc. elems
	import Toaster from "../../components/Toaster.svelte"
  
	import { ModalType, TextTab } from "$lib/enums"
	import { globalContext, musicPlayerStore, mediaEmbedStore, ytPlayerStore } from "$lib/store"
	import { 
	      hideRightBar,
        initAppState, keyboardShortCutHandlerKeyDown, 
        keyboardShortCutHandlerKeyUp, onMouseMoveHandler, updteGlobalContext

  } from "$lib/utils-home"
	import MediaEmbed from "./MediaEmbed.svelte"
	import type { Position } from "$lib/types-toast"
	import { getElemById } from "$lib/utils-general";

  let expand = false
	let position: Position = 'bottom-right'
	let richColors = false
	let closeButton = true

  let toggledLeftBarWithKey = false
  let totalWidth = 0
  let isLeftNarrowBarOpen = true
  let isLeftWideBarOpen = true
  let isRightBarOpen = true

  let leftSideBarWidth = 0
  let rightSideBarWidth = 0
  let homeViewClasses = ""
  let currentRoute = TextTab.Workspace
  let middleViewMarginLeft = ""
  let middleViewWidth = ""
  let isFloating = false

  const NAV_MENU_NARROW_BAR_WIDTH = 58
  const NAV_MENU_WIDE_BAR_WIDTH = 220
  const NAV_MENU_FULL_WIDTH = NAV_MENU_WIDE_BAR_WIDTH + NAV_MENU_NARROW_BAR_WIDTH
  const RIGHT_SIDE_BAR_WIDTH = 240


  $: if (totalWidth > 0) {
    updateMiddleView()
  }
  $: if (isFloating != $globalContext.isLeftBarFloating) { 

    isFloating = $globalContext.isLeftBarFloating
    toggledLeftBarWithKey = false
    updateMiddleView()
  }

  $: isLeftWideMenuOpen = $globalContext.isLeftWideMenuOpen
  $: showYoutubePlayer = $ytPlayerStore?.doShowPlayer ?? true

  globalContext.subscribe((state: GlobalContext) => {
    isLeftNarrowBarOpen = state.isLeftNarrowBarOpen
    isLeftWideBarOpen = state.isLeftWideMenuOpen
    isRightBarOpen = state.isRightBarOpen

    if (isLeftNarrowBarOpen) {
      leftSideBarWidth = isLeftWideBarOpen ? NAV_MENU_NARROW_BAR_WIDTH + NAV_MENU_WIDE_BAR_WIDTH : NAV_MENU_NARROW_BAR_WIDTH
    }
    else {
      leftSideBarWidth = 0
    }
    rightSideBarWidth = isRightBarOpen ? RIGHT_SIDE_BAR_WIDTH : 0

    updateMiddleView()
  })

  function onRouteChange(e: CustomEvent) {
    currentRoute = e.detail as TextTab
  }

  function updateMiddleView() {
    isLeftNarrowBarOpen = $globalContext.isLeftNarrowBarOpen
    isLeftWideBarOpen = $globalContext.isLeftWideMenuOpen
    isRightBarOpen = $globalContext.isRightBarOpen

    let width = `calc(100% - (${leftSideBarWidth}px + ${rightSideBarWidth}px))`
    let marginLeft = `${leftSideBarWidth}px`

    const leftBarFull =  isLeftNarrowBarOpen && isLeftWideBarOpen
    const isAllBarsFullOpen = leftBarFull && isRightBarOpen

    if (isAllBarsFullOpen && totalWidth < 920) {
      width = "100%"
      marginLeft = "0px"
    }
    else if (isFloating && isRightBarOpen) {
      width = `calc(100% - ${rightSideBarWidth}px)`
    }
    else if (isFloating) {
      width = "100%"
    }
    else if (leftBarFull && !isRightBarOpen && totalWidth < 670) {
      width = "100%"
      marginLeft = "0px"
    }
    else if (isLeftNarrowBarOpen && isRightBarOpen && totalWidth < 610) {
      width = "100%"
    }

    if (!isFloating && isAllBarsFullOpen && totalWidth < 800) {
      hideRightBar()
      return
    }
    
    middleViewMarginLeft = isFloating ? "0px" : marginLeft
    middleViewWidth = width
  }


  function onFloatSideBarMouseLeave(e: MouseEvent) {
    const isModalOpen = $globalContext.modalsOpen.length > 0
    const isSettingsOpen = getElemById("left-bar--dropdown-menu")

    if (isModalOpen || isSettingsOpen || toggledLeftBarWithKey) return

    updteGlobalContext({ ...$globalContext, isLeftNarrowBarOpen: false })
  }
  function handleKeyDown(event: KeyboardEvent) {
    toggledLeftBarWithKey = keyboardShortCutHandlerKeyDown(event, toggledLeftBarWithKey, totalWidth)!
  }
  function handleKeyUp(event: KeyboardEvent) {
    keyboardShortCutHandlerKeyUp(event)
  }
  function _onMouseMoveHandler(event: MouseEvent) {
    toggledLeftBarWithKey = onMouseMoveHandler(event, toggledLeftBarWithKey)
  }
  
  onMount(initAppState)
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div 
  class={`home ${homeViewClasses}`} 
  on:mousemove={_onMouseMoveHandler} bind:clientWidth={totalWidth}
>
  <div class="home__main">
    <!-- Left -->
      <nav 
        class="home__nav-menu-container smooth-bounce" 
        class:home__nav-menu-container--floating={isFloating} 
        class:home__nav-menu-container--float-hidden={isFloating && !isLeftNarrowBarOpen} 
        style:width={`${leftSideBarWidth}px`}
        style:margin-left={`${leftSideBarWidth === 0 ? `-${isLeftWideMenuOpen ? NAV_MENU_FULL_WIDTH : NAV_MENU_NARROW_BAR_WIDTH}px` : ""}`}
        on:mouseleave={onFloatSideBarMouseLeave}
      >
        <NavMenu on:routeChange={onRouteChange}/>
      </nav>
  <!-- Middle -->
      <div 
        class="home__middle-view smooth-bounce" 
        style:width={middleViewWidth}
        style:margin-left={middleViewMarginLeft}
      >
          <div class="home__header-container">
            <Header/>
          </div>
            <!-- Do not show /workspace if a player is active as it will it lay on top -->
            {#if !showYoutubePlayer || showYoutubePlayer && currentRoute != TextTab.Workspace}
              <div class="home__middle-view-slot-container">
                <slot />
              </div>
            {/if}
            <VideoView />
        </div>
    <!-- Right -->
      <nav 
        class="home__task-view-container smooth-bounce" 
        style:width={`${rightSideBarWidth}px`}
        style:margin-right={`${rightSideBarWidth === 0 ? `-${RIGHT_SIDE_BAR_WIDTH}px` : ""}`}
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
  {#if $globalContext.modalsOpen.includes(ModalType.Stats)} <Stats/> {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Settings)} <Settings/> {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Youtube)} <YoutubeSettings/> {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Appearance)} <Appearance /> {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Music)} <MusicSettings /> {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Journal)} <Journal /> {/if}

  <!-- Session Modals -->
  {#if $globalContext.modalsOpen.includes(ModalType.NewSession)} 
    <SessionNewModal /> 
  {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.EditSession)} 
    <SessionEditModal /> 
  {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.SesssionFinished)} 
    <SessionFinishedModal /> 
  {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.SessionCanceled)}  
    <SessionCanceledModal /> 
  {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.ActiveSession)} 
    <SessionActiveModal/>
  {/if}

  <!-- Other Modals Modals -->
  {#if $globalContext.modalsOpen.includes(ModalType.Quote)} <ModalQuote /> {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Shortcuts)} <ShortcutsModal /> {/if}

  <!-- Toasts -->
  {#if $globalContext.hasToaster}
    <Toaster {expand} {position} {richColors} {closeButton} />
  {/if}
</div>


<style lang="scss">
    @import "../../scss/toasts.scss";

    #signInDiv {
      position: absolute;
      right: 400px;
      top: 150px;
    }

    .home {
      background-color: var(--primaryBgColor);
      height: 100%;
      min-height: 100vh;
      font-family: 'Apercu Medium' system-ui;
      overflow: hidden;
      position: relative;

      // background-image: url('https://upload.wikimedia.org/wikipedia/commons/7/77/Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg');
      // background-size: cover;
      // background-position: center;
      // background-repeat: no-repeat;

      /* Responsivness Modifiders */
      &__main {
        height: 100vh;
        display: flex;
      }

      &__header-container {
        width: calc(100% + 15px);
        padding: 0px 25px 15px 0px;
        margin-left: -15px;
      }
      &__nav-menu-container {
        background-color: var(--navMenuBgColor);
        transition: ease-in-out 0.15s;
        height: 100%;
        margin-left: 0px;
        z-index: 1000;
        position: fixed;
        border-right: 1.5px solid rgba(var(--textColor1), 0.022);

        &--floating {
          height: auto;
          width: auto !important;
          transition: 0.18s cubic-bezier(.4,0,.2,1);
          background-color: var(--navMenuBgColor);
          top: 48px;
          left: 9px;
          z-index: 999;
          border: 1px solid rgba(var(--textColor1), 0.04);
          border-radius: 12px;
          margin-left: 0px !important;
        }
        &--float-hidden {
          left: -250px;
        }
        &--floating::before {
          content: " ";
          width: 14px;
          height: 100%;
          @include abs-top-left(0px, -14px);
        }


        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-right: 1px solid rgba(138, 138, 138, 0.3);
      }
      &__floating-nav-menu-container {
        width: 185px;
        background-color: var(--navMenuBgColor);
        position: fixed;
        top: 48px;
        left: 9px;
        z-index: 999;
        border: 1px solid rgba(var(--textColor1), 0.04);
        border-radius: 12px;
        
        &--hidden {
          left: -185px;
        }
        &::before {
          content: " ";
          width: 14px;
          height: 100%;
          @include abs-top-left(0px, -14px);
        }
      }

      &__middle-view {
        padding: 6px 0px 20px 30px;
        width: 100%;
        height: 100%;
        position: relative;

        &-slot-container {
          padding: inherit;
          @include abs-top-left(38px);
          background-color: var(--primaryBgColor);
          width: 100%;
          height: 100%;
          z-index: 300;
        }
      }
      &__task-view-container {
        height: 100%;
        position: fixed;
        top: 0px;
        right: 0px;
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