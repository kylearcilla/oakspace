<script lang="ts">
	import { onDestroy, onMount } from "svelte"

  // home components
	import Header from "./Header.svelte"
  import SideBarLeft from "./SideBarLeft.svelte"
  import MusicPlayer from "./MusicPlayer.svelte"
  import SideBarRight from "./SideBarRight.svelte"

  // main modals
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
	import { ModalType } from "$lib/enums"
  import { YoutubeMusicPlayer } from "$lib/youtube-music-player"
	import { globalContext, musicPlayerStore, reviewSession, sessionManager } from "$lib/store"
	import { 
    initAppState, keyboardShortCutHandlerKeyDown, keyboardShortCutHandlerKeyUp, 
    onMouseMoveHandler, updateRoute, onQuitApp,
	  middleViewExpandHandler,
	  AMBIENT,
    toggleYoutubePlayerFloat,
	  getLeftBarWidth
  } from "$lib/utils-home"

	import { afterNavigate, beforeNavigate, goto } from "$app/navigation"
	import SessionSummaryModal from "./SessionSummaryModal.svelte"
	import Modal from "../../components/Modal.svelte";
	import SpaceSelection from "../SpaceSelection.svelte";

  
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
  $: inAmbience = $globalContext?.ambience
  $: isFloating = $globalContext.mediaPlayer?.youtube
  $: modalsOpen = $globalContext.modalsOpen
  $: leftBar = $globalContext.leftBar

  $: if (inAmbience && !isFloating) {
      toggleYoutubePlayerFloat(true)
  }
  $: if (totalWidth > 0 && route) {
      updateMiddleView()
  }

  globalContext.subscribe((state: GlobalContext) => {
    leftBarOpen = state.leftBarOpen
    rightBarOpen = state.rightBarOpen

    const leftBar = state.leftBar
    leftSideBarWidth = getLeftBarWidth(leftBar!)

    rightSideBarWidth = rightBarOpen ? RIGHT_BAR_WIDTH : 0

    updateMiddleView()
  })

  function updateMiddleView() {
    leftBarOpen = $globalContext.leftBarOpen
    rightBarOpen = $globalContext.rightBarOpen

    const leftBar = $globalContext.leftBar
    const full = rightBarOpen && leftBarOpen
    const ambient = !!ambience
    const leftOffset = ambient || leftBar === "wide-float" ? 0 : leftSideBarWidth

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
  class:home--left-float={leftBar === "wide-float"}
  class:home--stretched={stretchMiddleView}
  class:home--ambient={ambience}
  class:home--ambient-vid={ambience?.space.type === "video"}
  class:home--ambient-img={ambience && ambience?.space.type != "wallpaper"}
  style:--left-bar-width={`${leftSideBarWidth}px`}
  style:--ambient-opacity={ambience?.opacity}
  style:--ambient-blur={AMBIENT.BG_BLUR}
  style:--ambient-bg-color={AMBIENT.BG_COLOR}
  style:--ambient-dark-bg-color={AMBIENT.DARK_BG_COLOR}
  style:--ambient-border={AMBIENT.BORDER}
>
  <div class="home__main">
    <!-- left -->
    <nav 
      class="home__left-bar" 
      class:ambient-dark-blur={ambience?.styling === "blur"}
      class:ambient-solid={ambience?.styling === "solid"}
      class:ambient-dark-clear={ambience?.styling === "clear"}
      style:width={`${leftSideBarWidth}px`}
      style:left={`${!leftBarOpen ? `-${leftSideBarWidth}px` : ""}`}
    >
      <SideBarLeft />
    </nav>
    <!-- middle -->
    <div
      class="home__middle-view" 
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
    </div>
    <!-- right -->
    <nav 
      class="home__right-bar" 
      class:ambient-dark-blur={ambience?.styling === "blur"}
      class:ambient-solid={ambience?.styling === "solid"}
      class:ambient-dark-clear={ambience?.styling === "clear"}
      style:width={`${rightSideBarWidth}px`}
      style:margin-right={`${rightSideBarWidth === 0 ? `-${RIGHT_BAR_WIDTH}px` : ""}`}
    >
      <SideBarRight /> 
  </nav>
</div>

  <FloatMediaPlayer type="youtube" />

  <!-- Music Player -->
  {#if $musicPlayerStore}
      <MusicPlayer />
  {/if}

  <!-- util modals -->
  {#if modalsOpen.includes(ModalType.Settings)} 
      <Settings/> 
  {/if}
  {#if modalsOpen.includes(ModalType.Appearance)} 
      <Appearance />
  {/if}
  {#if modalsOpen.includes(ModalType.Youtube)} 
      <YoutubeSettings ytPlaylists={data.ytPlaylists} /> 
  {/if}
  {#if modalsOpen.includes(ModalType.Music)} 
      <MusicSettings /> 
  {/if}
  
  {#if modalsOpen.includes(ModalType.Spaces)} 
      <SpaceSelection /> 
  {/if}

  <!-- session modals -->
  {#if modalsOpen.includes(ModalType.NewSession)} 
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
  {#if modalsOpen.includes(ModalType.Quote)} <ModalQuote /> {/if}
  {#if modalsOpen.includes(ModalType.Shortcuts)} <ShortcutsModal /> {/if}

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

      /* left bar */
      &--left-float &__middle-view {
        margin-left: 0px !important;

      }
      &--left-float &__left-bar {
        height: 650px;
        top: 50px;
        left: 5px;
        border: 1.5px solid rgba((var(--textColor1)), 0.022);
        border-radius: 12px;
        transition: 0.185s cubic-bezier(.4, 0, .2, 1);
      }

      /* ambient */
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
        height: 100%;
        left: 0px;
        background-color: var(--navMenuBgColor);
        border-right: 1.5px solid rgba((var(--textColor1)), 0.022);
        width: var(--left-bar-width);
        z-index: 400;
        position: fixed;
        transition: 0.2s cubic-bezier(.4, 0, .2, 1);
      }

      &__middle-view {
        padding: 6px 0px 20px 0px;
        width: 100%;
        height: 100%;
        position: relative;
        transition: 0.2s cubic-bezier(.4, 0, .2, 1);

        &-slot-container {
          padding: inherit;
          @include abs-top-left(20px);
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
        z-index: 400;
        transition: 0.2s cubic-bezier(.4, 0, .2, 1);

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