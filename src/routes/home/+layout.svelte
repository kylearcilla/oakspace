<script lang="ts">
	import { onDestroy, onMount } from "svelte"

  // home components
	import Header from "./Header.svelte"
  import SideBarLeft from "./SideBarLeft.svelte"
  import SideBarRight from "./SideBarRight.svelte"

  // main modals
	import Settings from "./Settings.svelte"
	import Appearance from "./Appearance.svelte"

  // modals
	import ModalQuote from "./ModalQuote.svelte"
	import ShortcutsModal from "./ShortcutsModal.svelte"
  import SessionNewModal from "./SessionNewModal.svelte"
  
  // misc. elems
	import Toaster from "../../components/Toaster.svelte"
  
  // utils
	import { ModalType } from "$lib/enums"
	import { globalContext, reviewSession, sessionManager } from "$lib/store"
	import { 
    initAppState, keyboardShortCutHandlerKeyDown, keyboardShortCutHandlerKeyUp, 
    onMouseMoveHandler, updateRoute, onQuitApp,
	  middleViewExpandHandler,
	  AMBIENT,
	  getLeftBarWidth,
    updateCursor
  } from "$lib/utils-home"

	import { afterNavigate, beforeNavigate, goto } from "$app/navigation"
	import SessionSummaryModal from "./SessionSummaryModal.svelte"
	import Modal from "../../components/Modal.svelte";
	import SpaceSelection from "../SpaceSelection.svelte";
	import { themeState, ytPlayerStore } from "../../lib/store";
	import EmojiPicker from "../../components/EmojiPicker.svelte";
	import ImgUpload from "../../components/ImgUpload.svelte";
	import IconPicker from "../../components/IconPicker.svelte";
	import ActiveRoutine from "./ActiveRoutine.svelte";
	import { updateAmbience, updateGlobalContext, hasAmbienceSpace } from "../../lib/utils-home";
	import { YoutubePlayer } from "../../lib/youtube-player";
	import ColorPicker from "../../components/ColorPicker.svelte";

  
  export let data

  let toggledLeftBarWithKey = false
  let totalWidth = 0
  let routeId: string

  let leftBarOpen = true
  let leftSideBarWidth = 0
  
  let stretchMiddleView = false
  let middleViewMarginLeft = ""
  let middleViewWidth = ""
  let homeViewClasses = ""

  let rightBarFixed = false
  let rightBarOpen = true
  let rightSideBarWidth = 0

  const RIGHT_BAR_WIDTH = 240
  const SMALL_WIDTH = 740

  $: context = $globalContext
  $: ambience = context.ambience
  $: hasAmbience = ambience?.active ?? false
  $: route = context.route
  $: modalsOpen = context.modalsOpen
  $: leftBar = context.leftBar
  $: isLight = !$themeState.isDarkTheme

  $: if (totalWidth > 0 && route && context) {
      updateMiddleView()
  }

  globalContext.subscribe((state: GlobalContext) => {
    leftBarOpen = state.leftBarOpen
    rightBarOpen = state.rightBarOpen
    rightBarFixed = state.rightBarFixed

    const leftBar = state.leftBar
    leftSideBarWidth = getLeftBarWidth(leftBar!)
    rightSideBarWidth = RIGHT_BAR_WIDTH

    updateMiddleView()
  })

  function updateMiddleView() {
    if (!context) return
    leftBarOpen = context.leftBarOpen
    rightBarOpen = context.rightBarOpen
    rightBarOpen = context.rightBarOpen

    const leftBar = context.leftBar
    const full = rightBarOpen && leftBarOpen
    const leftOffset = hasAmbience || leftBar === "wide-float" ? 0 : leftSideBarWidth
    const rightOffset = rightBarFixed ? 0 : rightSideBarWidth

    stretchMiddleView = middleViewExpandHandler({ 
      width: totalWidth,
      rightBarOpen,
      route 
    })

    if (rightBarOpen && !leftBarOpen) {
      middleViewWidth = `calc(100% - ${rightOffset}px)`
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
      middleViewWidth      = `calc(100% - ${rightOffset}px)`
      middleViewMarginLeft = "0px"
    }
    else {
      middleViewWidth      = `calc(100% - ${leftOffset + rightOffset}px)`
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
  function _updateCursor(pe: PointerEvent) {
    updateCursor({ 
      left: pe.clientX, top: pe.clientY
    })
  }

  afterNavigate(({ to }) => {
    if (!to?.route?.id) return

    const { id } = to.route
    const ambience = hasAmbienceSpace()
    routeId = id

    updateRoute(id)

    if (ambience && routeId === "/home/space") {
      updateAmbience({ active: true })
    }
    else if (ambience) {
      updateAmbience({ active: false })
    }
  })

  beforeNavigate(({ to }) => {
    if (!to?.route?.id) return

    routeId = to.route.id
  })
  
  onMount(initAppState)
  onDestroy(onQuitApp)
</script>

<svelte:window 
  on:keydown={handleKeyDown} 
  on:keyup={handleKeyUp}
  on:pointermove={_updateCursor}
/>

<div
  bind:clientWidth={totalWidth}
  on:mousemove={_onMouseMoveHandler}
  id="home"
  class={`home ${homeViewClasses} ${hasAmbience ? `home--ambient-${ambience.styling}` : ""}`}
  class:home--light={isLight}
  class:home--right-fixed={rightBarFixed}
  class:home--left-float={leftBar === "wide-float"}
  class:home--stretched={stretchMiddleView}
  class:home--ambient={hasAmbience}
  class:home--ambient-vid={hasAmbience && ambience?.space.type === "video"}
  class:home--ambient-img={hasAmbience && ambience?.space.type != "wallpaper"}
  class:home--no-ambience={!hasAmbience}
  style:--ambient-opacity={hasAmbience ? ambience?.opacity : 0}
  style:--left-bar-width={`${leftSideBarWidth}px`}
  style:--ambient-blur={AMBIENT.BG_BLUR}
  style:--ambient-bg-color={AMBIENT.BG_COLOR}
  style:--ambient-dark-bg-color={AMBIENT.DARK_BG_COLOR}
  style:--ambient-border={AMBIENT.BORDER}
>
  <div class="home__main">
    <!-- left -->
    <nav 
      class="home__left-bar" 
      class:ambient-dark-blur={hasAmbience && ambience?.styling === "blur"}
      class:ambient-solid={hasAmbience && ambience?.styling === "solid"}
      class:ambient-dark-clear={hasAmbience && ambience?.styling === "clear"}
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
              <div class="home__middle-view-slot-container">
                <slot />
              </div>
        {/if}
    </div>
    <!-- right -->
    <nav 
      class="home__right-bar" 
      class:home__right-bar--fixed={rightBarFixed}
      class:ambient-dark-blur={hasAmbience && ambience?.styling === "blur"}
      class:ambient-solid={hasAmbience && ambience?.styling === "solid"}
      class:ambient-dark-clear={hasAmbience && ambience?.styling === "clear"}
      style:width={`${rightSideBarWidth}px`}
      style:margin-right={`${rightSideBarWidth === 0 ? `-${RIGHT_BAR_WIDTH}px` : ""}`}
      style:right={`${!rightBarOpen && rightBarFixed ? `-${rightSideBarWidth}px` : ""}`}
    >
      <SideBarRight /> 
  </nav>
</div>


  <!-- util modals -->
  {#if modalsOpen.includes(ModalType.Settings)} 
      <Settings/> 
  {/if}
  {#if modalsOpen.includes(ModalType.Themes)} 
      <Appearance />
  {/if}
  
  {#if modalsOpen.includes(ModalType.Spaces)} 
      <SpaceSelection /> 
  {/if}

  <!-- modals -->
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

  <!-- modals -->
  {#if modalsOpen.includes(ModalType.Quote)} 
      <ModalQuote /> 
  {/if}

  {#if modalsOpen.includes(ModalType.Shortcuts)} 
      <ShortcutsModal /> 
  {/if}

  {#if $globalContext.routineView}
      {@const { dayIdx, block } = $globalContext.routineView}
      <Modal 
          options={{ 
              borderRadius: "8px",
              scaleUp: true
          }} 
          onClickOutSide={() => {
              updateGlobalContext({ routineView: null })
          }}
      >
        <ActiveRoutine
            type="side-menu"
            isOpen={true} 
            currDayIdx={dayIdx}
            currBlock={block}
        />
      </Modal>
  {/if}

  <!-- toasts -->
  {#if $globalContext.hasToaster}
      <Toaster 
        expand={true} richColors={true} closeButton={true} position="bottom-right" 
      />
  {/if}

  <!-- yt player -->

  <div 
      class="ambient-player" 
      class:ambient-player--hidden={!hasAmbience || !$ytPlayerStore?.show}
   >
    <div class="ambient-player__iframe" id={YoutubePlayer.IFRAME_ID}></div>
  </div>
</div>

<!-- pop-ups -->
<EmojiPicker/>
<ImgUpload/>
<IconPicker/>
<ColorPicker/>

<style lang="scss">
    @import "../../scss/toasts.scss";

    #signInDiv {
      position: absolute;
      right: 400px;
      top: 150px;
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

      /* light */
      &--light &__right-bar::before {
        width: 1.5px;
        background: rgba((var(--textColor1)), 0.04);
      }
      /* bars */
      &--left-float &__middle-view {
        margin-left: 0px !important;
      }
      &--left-float &__left-bar {
        height: 650px;
        top: 45px;
        left: 5px;
        border: var(--navMenuBorder);
        border-radius: 12px;
        transition: 0.185s cubic-bezier(.4, 0, .2, 1);
      }
      &--stretched &__middle-view {
        width: 100% !important;
        margin: 0px !important;
      }

      /* ambient */
      &--ambient &__middle-view {
        margin-left: 0px !important;
        overflow: hidden;
      }
      &--ambient &__middle-view-slot-container {
        background: none;
      }
      &--ambient &__right-bar {
        height: calc(100% - (11px * 2));
        top: 5px;
        right: 10px;
        border-radius: 20px;
        border: 1.5px solid rgba(255, 255, 255, 0.05);
      }
      &--ambient-solid &__right-bar {
        border-width: 0px !important;
      }
      &--ambient &__right-bar::before {
        display: none;
      }
      &--ambient &__left-bar {
        // height: calc(100% - (200px * 2));
        height: 560px;
        top: 90px;
        left: 8px;
        border-radius: 20px;
      }
      &--no-ambience {
        background-image: none !important;
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
        border: var(--navMenuBorder);
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
          @include abs-top-left(35px);
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
        z-index: 400;
        transition: 0.2s cubic-bezier(.4, 0, .2, 1);
        overflow: hidden;
        
        &::before {
          content: " ";
          width: 2px;
          background: rgba((var(--textColor1)), 0.022);
          height: 100%;
          z-index: 10000;
          @include abs-top-left;
        }
        
        // border-left: 1.5px solid rgba((var(--textColor1)), 0.022);
        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-left: 1px solid rgba(138, 138, 138, 0.3);
        
        &--fixed {
          transition: 0.245s cubic-bezier(.4, 0, .2, 1);
          top: 12px;
          right: 5px;
          height: calc(100% - 40px);
          border-radius: 14px;
        }
        &--closed {
          // margin-right: -300px; 
        }
      }

      &__modal-content {
        width: 90vw;
        height: 90vh;
        padding: 12px 30px 0px 30px;
      }
    }

    .music-player {
      @include abs-bottom-left(-100px, -100px);
    }

    .ambient-player {
        z-index: 500;
        user-select: none;
        position: absolute;
        z-index: 2;
        pointer-events: none;
        overflow: hidden;
        aspect-ratio: calc(16 / 9);
        @include abs-top-left;
        height: 100%;
        width: 100%;

        &--hidden {
          @include not-visible;
        }
        &__iframe {
          @include abs-center;

          @media (max-aspect-ratio: 16 / 9) {
              width: 177.78vh !important;
              height: 120% !important;
          }
          @media (min-aspect-ratio: 16 / 9) {
              height: 86.25vw !important;
              width: 100% !important;
          }
        }
        &::before {
            content: " ";
            width: 100%;
            height: 100%;
            z-index: 4;
            @include abs-top-left;
            background-image: linear-gradient(rgba(0, 0, 0, var(--ambient-opacity)), rgba(0, 0, 0, var(--ambient-opacity)));
        }
    }
</style>
