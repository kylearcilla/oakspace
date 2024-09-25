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
	import { globalContext, musicDataStore, musicPlayerStore, reviewSession, sessionManager } from "$lib/store"
	import { 
    initAppState, keyboardShortCutHandlerKeyDown, keyboardShortCutHandlerKeyUp, 
    onMouseMoveHandler, LEFT_BAR_WIDTH, updateRoute, onQuitApp,
	  middleViewExpandHandler,
	  AMBIENT,

	  toggleYoutubePlayerFloat

  } from "$lib/utils-home"

	import { afterNavigate, beforeNavigate, goto } from "$app/navigation"
	import SessionSummaryModal from "./SessionSummaryModal.svelte"
	import Modal from "../../components/Modal.svelte";
	import SpaceSelection from "../SpaceSelection.svelte";
	import Base from "./Base.svelte";

  
  export let data

  let toggledLeftBarWithKey = false
  let totalWidth = 0

  let homeRef: HTMLElement
  let routeId: string

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

  $: context = $globalContext
  $: ambience = $globalContext.ambience
  $: route = $globalContext.route
  $: inAmbience   = $globalContext?.ambience
  $: isFloating   = $globalContext.mediaPlayer?.youtube

  $: if (inAmbience && !isFloating) {
      toggleYoutubePlayerFloat(true)
  }
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
    const ambient = !!ambience
    const leftOffset = ambient ? 0 : LEFT_BAR_WIDTH - 25

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
      middleViewWidth      = `calc(100% - ${leftOffset}px)`
      middleViewMarginLeft = `${leftOffset}px`
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
      middleViewWidth      = `calc(100% - ${leftOffset + rightSideBarWidth}px)`
      middleViewMarginLeft = `${leftOffset}px`
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
  function closeModal() {
    goto("/home")
  }

  afterNavigate(({ to }) => {
    if (!to?.route?.id) return

    const { id } = to.route
    routeId = id
    updateRoute(id)
  })

  beforeNavigate(({ to }) => {
    if (!to?.route?.id) return
    routeId = to.route.id
  })
  
  onMount(initAppState)
  onDestroy(onQuitApp)
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp}/>

<div
  bind:this={homeRef}
  bind:clientWidth={totalWidth}
  on:mousemove={_onMouseMoveHandler}
  id="home"
  class={`home ${homeViewClasses}`}
  class:home--stretched={stretchMiddleView}
  class:home--ambient={ambience}
  class:home--ambient-vid={ambience?.space.type === "video"}
  class:home--ambient-img={ambience && ambience?.space.type != "wallpaper"}
  style:--left-bar-width={`${LEFT_BAR_WIDTH}px`}
  style:--ambient-opacity={ambience?.opacity}
  style:--ambient-blur={AMBIENT.BG_BLUR}
  style:--ambient-bg-color={AMBIENT.BG_COLOR}
  style:--ambient-dark-bg-color={AMBIENT.DARK_BG_COLOR}
  style:--ambient-border={AMBIENT.BORDER}
>
  <div class="home__main">
    <!-- left -->
    <nav 
      class="home__left-bar smooth-bounce" 
      class:ambient-dark-blur={ambience?.styling === "blur"}
      class:ambient-solid={ambience?.styling === "solid"}
      class:ambient-dark-clear={ambience?.styling === "clear"}
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
            {#if !ambience || routeId === "/home/session"}
                <div class="home__middle-view-slot-container">
                  <slot />
                </div>
            {:else}
                <Modal 
                    options={{ borderRadius: "14px" }} 
                    onClickOutSide={() => closeModal()}
                >
                    <div class="home__modal-content"> 
                      <slot />
                    </div>
                </Modal>
            {/if}
        {/if}
        <Base />
    </div>
    <!-- right -->
    <nav 
      class="home__right-bar smooth-bounce" 
      class:ambient-dark-blur={ambience?.styling === "blur"}
      class:ambient-solid={ambience?.styling === "solid"}
      class:ambient-dark-clear={ambience?.styling === "clear"}
      style:width={`${rightSideBarWidth}px`}
      style:margin-right={`${rightSideBarWidth === 0 ? `-${RIGHT_BAR_WIDTH}px` : ""}`}
    >
      <SideBarRight /> 
  </nav>
</div>

  <FloatMediaPlayer 
      type="youtube" 
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

  {#if $globalContext.modalsOpen.includes(ModalType.Spaces)} 
      <SpaceSelection /> 
  {/if}

  <!-- Session Modals -->
  {#if $globalContext.modalsOpen.includes(ModalType.NewSession)} 
    <SessionNewModal /> 
  {/if}
  {#if $reviewSession && !($sessionManager?.state === "done")} 
    <SessionSummaryModal
        isReview={true}
        session={$reviewSession}
        onClickOutside={() => {
          reviewSession.set(null)
        }}
    />
{/if}
  {#if $sessionManager?.state === "done"} 
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

  <div class="yt-music-player" id={YoutubeMusicPlayer.IFRAME_ID}></div>
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
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;

      /* ambient stuff */
      &--ambient &__middle-view {
        margin-left: 0px !important;
      }
      &--ambient &__middle-view-slot-container {
        background: none;
      }
      &--ambient--vid {
        background-image: linear-gradient(rgba(0, 0, 0, var(--ambient-opacity)), rgba(0, 0, 0, var(--ambient-opacity)));
      }
      &--ambient &__right-bar {
        // height: calc(100% - (11px * 2));
        // top: 11px;
        // right: 10px;
        // border-radius: 20px;
        border-width: 0px !important;
      }
      &--ambient &__left-bar {
        // height: calc(100% - (200px * 2));
        height: auto;
        top: 200px;
        left: 14px;
        border-radius: 30px;
      }
      &--stretched &__middle-view {
        width: 100% !important;
        margin: 0px !important;
      }

      &__left-bar.ambient-solid {
        background-color: var(--navMenuBgColor);
        box-shadow: var(--navMenuBoxShadow);
        border-right: 1.5px solid rgba((var(--textColor1)), 0.022);
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
      &__left-bar {
        transition: ease-in-out 0.1s;
        height: 100%;
        margin-left: 0px;
        background-color: var(--navMenuBgColor);
        border-right: 1.5px solid rgba((var(--textColor1)), 0.022);
        width: var(--left-bar-width);
        z-index: 1000;
        position: fixed;
      }

      &__middle-view {
        padding: 6px 0px 20px 0px;
        width: 100%;
        height: 100%;
        position: relative;

        &-slot-container {
          padding: inherit;
          @include abs-top-left(38px);
          width: 100%;
          height: 100%;
          z-index: 300;
        }
      }
      &__right-bar {
        height: 100%;
        position: fixed;
        top: 0px;
        right: 0px;
        background-color: var(--rightBarBgColor);
        box-shadow: var(--rightBarBgBoxShadow);
        z-index: 20000;

        &::before {
          content: " ";
          width: 2px;
          height: 100%;
          z-index: 10000;
          background: rgba((var(--textColor1)), 0.022);
          @include abs-top-left(0px, 0px);
        }
        
        // border-left: 1.5px solid rgba((var(--textColor1)), 0.022);
        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-left: 1px solid rgba(138, 138, 138, 0.3);

        &--closed {
          margin-right: -300px; 
        }
      }

      &__modal-content {
        width: 90vw;
        height: 90vh;
        padding: 12px 30px 0px 30px;
      }
    }

</style>