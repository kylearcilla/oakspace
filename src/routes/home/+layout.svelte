<script lang="ts">
	import { onDestroy, onMount } from "svelte"

  // home components
	import Header from "./Header.svelte"
  import SideBarLeft from "./SideBarLeft.svelte"
  import MusicPlayer from "./MusicPlayer.svelte"
  import YoutubeView from "./YoutubeView.svelte"
  import SideBarRight from "./SideBarRight.svelte"

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
  
  // misc. elems
	import Toaster from "../../components/Toaster.svelte"
  import FloatMediaPlayer from "./FloatMediaPlayer.svelte"
  
  // utils
  import { SPOTIFY_IFRAME_ID } from "$lib/utils-music"
	import { ModalType, MusicPlatform } from "$lib/enums"
  import { YoutubeMusicPlayer } from "$lib/youtube-music-player"
	import { globalContext, musicDataStore, musicPlayerStore, sessionManager } from "$lib/store"
	import { 
    initAppState, keyboardShortCutHandlerKeyDown, keyboardShortCutHandlerKeyUp, 
    onMouseMoveHandler, LEFT_BAR_WIDTH, updateRoute, onQuitApp,
	  middleViewExpandHandler

  } from "$lib/utils-home"

	import { afterNavigate } from "$app/navigation"
	import SessionSummaryModal from "./SessionSummaryModal.svelte"

  
  export let data

  let toggledLeftBarWithKey = false
  let totalWidth = 0

  let stretchMiddleView = false
  let leftBarOpen = true
  let rightBarOpen = true
  let leftSideBarWidth = 0
  let rightSideBarWidth = 0
  let middleViewMarginLeft = ""
  let middleViewWidth = ""

  let isAciveRoutineOpen = false
  let homeViewClasses = ""

  const RIGHT_BAR_WIDTH = 240
  const SMALL_WIDTH = 740

  $: route = $globalContext.route

  $: if (totalWidth > 0 && route) {
    updateMiddleView()
  }

  globalContext.subscribe((state: GlobalContext) => {
    leftBarOpen = state.leftBarOpen
    rightBarOpen = state.rightBarOpen

    if (leftBarOpen) {
      leftSideBarWidth = 58
    }
    else {
      leftSideBarWidth = 0
    }
    rightSideBarWidth = rightBarOpen ? RIGHT_BAR_WIDTH : 0

    updateMiddleView()
  })

  function updateMiddleView() {
    leftBarOpen = $globalContext.leftBarOpen
    rightBarOpen = $globalContext.rightBarOpen

    const full = rightBarOpen && leftBarOpen

    stretchMiddleView = middleViewExpandHandler({ 
      width: totalWidth,
      rightBarOpen,
      route 
    })

    if (rightBarOpen && !leftBarOpen) {
      middleViewWidth = `calc(100% - ${rightSideBarWidth}px)`
      middleViewMarginLeft = "0px"
    }
    else if (leftBarOpen && !rightBarOpen) {
      middleViewWidth      = `calc(100% - ${LEFT_BAR_WIDTH}px)`
      middleViewMarginLeft = `${LEFT_BAR_WIDTH}px`
    }
    else if (!leftBarOpen && !rightBarOpen) {
      middleViewWidth      = `100%`
      middleViewMarginLeft = "0px"
    }
    else if (totalWidth <= SMALL_WIDTH && full) {
      middleViewWidth      = `calc(100% - ${rightSideBarWidth}px)`
      middleViewMarginLeft = "0px"
    }
    else {
      middleViewWidth      = `calc(100% - ${LEFT_BAR_WIDTH + rightSideBarWidth}px)`
      middleViewMarginLeft = `${LEFT_BAR_WIDTH}px`
    }
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

  afterNavigate(({ to }) => {
    if (!to?.route?.id) return

    const { id } = to.route
    updateRoute(to.route.id)
  })
  
  onMount(initAppState)
  onDestroy(onQuitApp)
</script>

<svelte:window
  on:keydown={handleKeyDown} 
  on:keyup={handleKeyUp}
/>

<div 
  class={`home ${homeViewClasses}`}
  class:home--stretched={stretchMiddleView}
  bind:clientWidth={totalWidth}
  on:mousemove={_onMouseMoveHandler}
>
  <div class="home__main">
    <!-- left -->
    <nav 
      class="home__nav-menu-container smooth-bounce" 
      style:width={`${leftSideBarWidth}px`}
      style:margin-left={`${leftSideBarWidth === 0 ? `-${LEFT_BAR_WIDTH}px` : ""}`}
    >
      <SideBarLeft />
    </nav>
    <!-- middle -->
    <div
      class="home__middle-view smooth-bounce" 
      style:width={middleViewWidth}
      style:margin-left={middleViewMarginLeft}
    >
      <div class="home__header-container">
        <Header/>
      </div>
        {#if route != "/home"}
            <div class="home__middle-view-slot-container">
              <slot />
            </div>
        {/if}
        <YoutubeView />
    </div>
    <!-- right -->
    <nav 
      class="home__task-view-container smooth-bounce" 
      style:width={`${rightSideBarWidth}px`}
      style:margin-right={`${rightSideBarWidth === 0 ? `-${RIGHT_BAR_WIDTH}px` : ""}`}
    >
      <SideBarRight /> 
  </nav>
</div>

  <FloatMediaPlayer 
      type="youtube" 
      isFloating={$globalContext.mediaPlayer?.youtube}
  />

  <!-- Music Player -->
  {#if $musicPlayerStore}
      <MusicPlayer />
  {/if}
  {#if $musicDataStore?.musicPlatform === MusicPlatform.Spotify}
      <div class="spotify-iframe-container">
          <div id={SPOTIFY_IFRAME_ID}></div>
      </div>
  {/if}

  <!-- Main Modals -->
  {#if $globalContext.modalsOpen.includes(ModalType.Stats)} 
      <Stats/> 
  {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Settings)} 
      <Settings/> 
  {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Youtube)} 
      <YoutubeSettings  
        ytPlaylists={data.ytPlaylists} 
      /> 
  {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Appearance)} 
      <Appearance /> 
  {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Music)} 
      <MusicSettings /> 
  {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Journal)} 
      <Journal /> 
  {/if}

  <!-- Session Modals -->
  {#if $globalContext.modalsOpen.includes(ModalType.NewSession)} 
    <SessionNewModal /> 
  {/if}
  {#if $sessionManager && $sessionManager?.state === "done"} 
    <SessionSummaryModal 
        isReview={false}
        session={$sessionManager.session}
    />
  {/if}

  <!-- Other Modals Modals -->
  {#if $globalContext.modalsOpen.includes(ModalType.Quote)} <ModalQuote /> {/if}
  {#if $globalContext.modalsOpen.includes(ModalType.Shortcuts)} <ShortcutsModal /> {/if}

  <!-- Toasts -->
  {#if $globalContext.hasToaster}
    <Toaster 
      expand={true} richColors={true} closeButton={true} position="bottom-right" 
    />
  {/if}

  <div class="yt-music-player" id={YoutubeMusicPlayer.IFRAME_ID}>
  </div>
</div>


<style lang="scss">
    @import "../../scss/toasts.scss";

    #signInDiv {
      position: absolute;
      right: 400px;
      top: 150px;
    }

    .yt-music-player {
      @include abs-bottom-left(-100px, -100px);
    }

    .home {
      background-color: var(--bg-1);
      height: 100%;
      min-height: 100vh;
      font-family: 'Apercu Medium' system-ui;
      overflow: hidden;
      position: relative;

      // background-image: url('https://upload.wikimedia.org/wikipedia/commons/7/77/Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg');
      // background-size: cover;
      // background-position: center;
      // background-repeat: no-repeat;

      &--stretched &__middle-view {
        width: 100% !important;
        margin: 0px !important;
      }

      /* Responsivness Modifiders */
      &__main {
        height: 100vh;
        display: flex;
      }

      &__header-container {
        width: calc(100%);
        // padding: 0px 25px;
      }
      &__nav-menu-container {
        background-color: var(--SideBarLeftBgColor);
        transition: ease-in-out 0.15s;
        height: 100%;
        margin-left: 0px;
        z-index: 1000;
        position: fixed;

        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-right: 1px solid rgba(138, 138, 138, 0.3);
      }

      &__middle-view {
        padding: 6px 25px 20px 25px;
        width: 100%;
        height: 100%;
        position: relative;

        &-slot-container {
          padding: inherit;
          @include abs-top-left(38px);
          background-color: var(--bg-1);
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

    .spotify-iframe-container {
      @include abs-bottom-left(-1000px, -1000px);
      z-index: -100;
      opacity: 0;
      visibility: hidden;
    }
</style>