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
    onMouseMoveHandler, onQuitApp,
	  middleViewExpandHandler,
	  AMBIENT,
	  getLeftBarWidth,
    updateCursor
  } from "$lib/utils-home"
  
	import { afterNavigate } from "$app/navigation"
	import SessionSummaryModal from "./SessionSummaryModal.svelte"
	import Modal from "../../components/Modal.svelte";
	import { themeState, ytPlayerStore } from "../../lib/store";
  import { updateAmbience, updateGlobalContext, hasAmbienceSpace } from "../../lib/utils-home";
  import { findThemeFromName, getActiveTheme, getPrevTheme, setNewTheme, setPrevTheme } from "../../lib/utils-appearance";
	import EmojiPicker from "../../components/EmojiPicker.svelte";
	import ImgUpload from "../../components/ImgUpload.svelte";
	import IconPicker from "../../components/IconPicker.svelte";
	import ActiveRoutine from "./ActiveRoutine.svelte";
	import { YoutubePlayer } from "../../lib/youtube-player";
	import ColorPicker from "../../components/ColorPicker.svelte";
	import { themes } from "../../lib/data-themes"

  export let data

  let toggledLeftBarWithKey = false
  let totalWidth = 0
  let routeId: string

  let leftBarOpen = true
  let leftSideBarWidth = 0
  let showHeaderImg = ""
  
  let stretchMiddleView = false
  let middleViewMarginLeft = ""
  let middleViewWidth = ""
  let homeViewClasses = ""

  let rightBarFixed = false
  let rightBarOpen = true
  let rightSideBarWidth = 0
  let prevSetTheme = ""

  const RIGHT_BAR_WIDTH = 230
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
    const leftOffset = hasAmbience || leftBar === "float" ? 0 : leftSideBarWidth
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
  function _updateCursor(pe: PointerEvent) {
    updateCursor({ 
      left: pe.clientX, top: pe.clientY
    })
  }

  afterNavigate(({ to, from, type }) => {
    if (!to?.route?.id || type === "enter") return

    const { id: fromId } = from.route
    const { id: toId } = to.route

    routeId = toId

    if (!hasAmbienceSpace()) {
      return
    }
    if (toId != "/home/space") {
      updateAmbience({ active: false })

      if (getPrevTheme()) {
        setNewTheme(findThemeFromName(getPrevTheme()))
      }
    }

    if (fromId != "/home/space" && toId === "/home/space") {
      setPrevTheme(getActiveTheme())
      setNewTheme(themes[0], true)
      updateAmbience({ active: true })
    }
  })
  
  onMount(() => {
    initAppState()
  })
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
  class:home--left-float={leftBar ==="float"}
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
          <div class="home__slot">
            <slot />
          </div>
        {/if}
    </div>
    <!-- right -->
    <nav 
      id="home--right-bar"
      class="home__right-bar" 
      class:home__right-bar--fixed={rightBarFixed}
      class:home__right-bar--short-fixed={rightBarFixed && hasAmbience}
      class:home__right-bar--full-border={!showHeaderImg}
      class:ambient-dark-blur={hasAmbience && ambience?.styling === "blur"}
      class:ambient-solid={hasAmbience && ambience?.styling === "solid"}
      class:ambient-dark-clear={hasAmbience && ambience?.styling === "clear"}
      style:width={`${rightSideBarWidth}px`}
      style:margin-right={`${rightSideBarWidth === 0 ? `-${RIGHT_BAR_WIDTH}px` : ""}`}
      style:right={`${!rightBarOpen && rightBarFixed ? `-${rightSideBarWidth}px` : ""}`}
    >
      <SideBarRight 
        fixed={rightBarFixed}
        onHeaderImageChange={(showing) => showHeaderImg = showing}
      /> 

      {#if showHeaderImg && !hasAmbience && !isLight}
          {#if rightBarFixed}
            <div class="border border--top">
                <svg width="231" height="35" viewBox="0 0 231 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                  d="M1.37305 34.8145V15.9111C1.37305 8.17915 7.64106 1.91113 15.373 1.91113H215.373C223.105 1.91113 229.373 8.17915 229.373 15.9111V28.7632" 
                  stroke="white" 
                  stroke-opacity="0.022"
                  stroke-width="2"
                />
              </svg>          
            </div>
            <div class="border border--bottom">
              <svg width="231" height="35" viewBox="0 0 231 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M229.373 0.911133L229.373 19.8145C229.373 27.5464 223.105 33.8145 215.373 33.8145L15.2715 33.8145C7.53949 33.8145 1.27148 27.5465 1.27148 19.8145L1.27148 6.96237" 
                  stroke="white" 
                  stroke-opacity="0.022"
                  stroke-width="2"
                />
              </svg>
            </div>
            <div class="border border--right"></div>
          {/if}
          <div 
            class="border border--left"
            class:border--left-full={!rightBarFixed}
          >
          </div>
      {/if}
  </nav>
</div>

  <!-- util modals -->
  {#if modalsOpen.includes(ModalType.Settings)} 
      <Settings/> 
  {/if}
  {#if modalsOpen.includes(ModalType.Themes)} 
      <Appearance />
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
      <Toaster  />
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

      --light-border: 1.5px solid rgba(var(--textColor1), 0.05);
      --side-border: 2px solid rgba(var(--textColor1), 0.022);

      /* light */
      &--light {
        --side-border: 1.5px solid rgba(var(--textColor1), 0.05);
      }
      &--light &__right-bar::before {
        display: none;
      }
      &--light &__right-bar {
        border-left: var(--light-border);
      }
      &--light &__right-bar--fixed {
        border: var(--light-border);
      }
      &--left-float &__middle-view {
        margin-left: 0px !important;
      }
      &--left-float &__left-bar {
        height: 650px;
        top: 45px;
        left: 5px;
        border-radius: 12px;
        transition: 0.185s cubic-bezier(.4, 0, .2, 1);
      }
      &--left-float &__left-bar {
        border: var(--side-border);
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
        right: 13px;
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
        height: 28px;
      }
      &__left-bar {
        height: 100%;
        left: 0px;
        background-color: var(--navMenuBgColor);
        width: var(--left-bar-width);
        border-right: var(--side-border);
        z-index: 200;
        position: fixed;
        transition: 0.2s cubic-bezier(.4, 0, .2, 1);
      }

      &__middle-view {
        padding: 6px 0px 0px 0px;
        height: 100%;
        transition: 0.2s cubic-bezier(.4, 0, .2, 1);
      }
      &__slot {
        padding: inherit;
        width: 100%;
        height: 100%;
        z-index: 200;
        transition: 0.2s cubic-bezier(.4, 0, .2, 1);
      }
      &__right-bar {
        height: 100%;
        position: fixed;
        top: 0px;
        right: 0px;
        background-color: var(--rightBarBgColor);
        z-index: 200;
        transition: 0.2s cubic-bezier(.4, 0, .2, 1);
        overflow: hidden;
        
        &.ambient-dark-blur {
          overflow: visible;
        }
        &--full-border {
          border: var(--side-border);
        }
        &--fixed {
          transition: 0.245s cubic-bezier(.4, 0, .2, 1);
          top: 12px;
          right: 7px;
          height: calc(100% - 40px) !important;
          border-radius: 14px;
        }
        &--short-fixed {
          top: 42px !important;
          height: calc(100% - 60px) !important;
        }
      }

      &__modal-content {
        width: 90vw;
        height: 90vh;
        padding: 12px 30px 0px 30px;
      }
    }

    .border {
      &--top {
        width: 100%;
        @include abs-top-left(-1px);
      }
      &--bottom {
        width: 100%;  
        @include abs-bottom-left(-3px, 0px);
      }
      &--right {
        width: 2px;
        height: calc(100% - 55px);
        background: rgba((var(--textColor1)), 0.022);
        @include abs-top-right(28px);
      }
      &--left {
        width: 2px;
        height: calc(100% - 55px);
        background: rgba((var(--textColor1)), 0.022);
        @include abs-top-left(28px);
      }
      &--left-full {
        width: 2px;
        height: 100%;
        background: rgba((var(--textColor1)), 0.022);
        @include abs-top-left(0px);
      }
    }

    .ambient-player {
        z-index: 500;
        user-select: none;
        position: fixed;
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
