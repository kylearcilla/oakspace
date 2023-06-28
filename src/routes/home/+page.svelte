<script lang="ts">
	import { onDestroy, onMount } from "svelte";
  import NavMenu from "./NavMenu.svelte"
  import PomView from "./PomView.svelte"
  import VideoView from "./VideoView.svelte"
  import ActiveSessionView from "./ActiveSessionView.svelte"
  import TaskView from "./TaskView.svelte"
  import MusicPlayer from "./MusicPlayer.svelte"

	import YoutubeSettings from "./YoutubeSettings.svelte"
	import MusicSettings from "./MusicSettings.svelte"
	import Settings from "./Settings.svelte"
  
	import { _initGoogleClient, _initMusicKit } from "./+page"
	import ApperanceSettings from "./ApperanceSettings.svelte"
	import { loadTheme } from "$lib/helper"
	import HomeHeader from "./HomeHeader.svelte";

  let isTaskMenuExpanded = true
  let doHideMenu = false
  let hasUserToggledWithKeyLast = true
  let navSettingClicked = ""

  const handleNavButtonClicked = (buttonName: string) => {
    navSettingClicked = buttonName
  }
  const handleTaskMenuToggleClick = () => {
    if (document.body.clientWidth < 600) return
    isTaskMenuExpanded = !isTaskMenuExpanded
  }
  const handleMouseMove = (event: MouseEvent) => {
    const mouseX = event.clientX
    const cutoff = 5

    // show when user is close to left edge
    if (doHideMenu && mouseX < cutoff) {
      doHideMenu = false
      hasUserToggledWithKeyLast = false
    }
    // only hide when user is right outside of nav and prevent hiding when nav was shown through shortcut
    // ...as the nav menu should only close in this case when the user was in the nav menu
    else if ((mouseX > 80 && mouseX < 100) && !hasUserToggledWithKeyLast) { 
      doHideMenu = true
    }
  }
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey && event.key.toLowerCase() === "x") {
      handleTaskMenuToggleClick()
    }
    if (event.metaKey && event.key.toLowerCase() === "z") {
      doHideMenu = !doHideMenu
      hasUserToggledWithKeyLast = true
    }
  }
  const handleResize = () => {
    if (document.body.clientWidth > 600) return
    doHideMenu = true
    isTaskMenuExpanded = false
  }

  onMount(() => {
    window.addEventListener("resize", handleResize)
    handleResize()
    
    _initGoogleClient()
    loadTheme()

    console.log(window)
  })
  onDestroy(() => {
    window.removeEventListener("resize", handleResize)
  });
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="home" on:mousemove={handleMouseMove}>
  <!-- <div id="signInDiv"></div> -->
  <!-- left nav menu -->
  <div class={`home__nav-menu-container ${doHideMenu ? "home__nav-menu-container--hide" : ""}`}>
    <NavMenu onNavButtonClicked={handleNavButtonClicked} />
  </div>
  <!-- middle video component -->
  <div class={`home__video ${doHideMenu ? "home__video--nav-menu-hidden" : ""} ${!isTaskMenuExpanded ? "home__video--task-view-hidden" : ""}`}>
    <HomeHeader/>
    <!-- @ts-ignore -->
    <VideoView />
    <ActiveSessionView />
  </div>
  <!-- right music menu -->
  <div class={`home__task-view-container ${isTaskMenuExpanded ? "" : "home__task-view-container--closed"}`}>
    <TaskView isTaskMenuExpanded={isTaskMenuExpanded}/>
  </div>
  {#if navSettingClicked === "settings"} <Settings onNavButtonClicked={handleNavButtonClicked}/> {/if}
  {#if navSettingClicked === "youtube"} <YoutubeSettings onNavButtonClicked={handleNavButtonClicked}/> {/if}
  {#if navSettingClicked === "music"} <MusicSettings onNavButtonClicked={handleNavButtonClicked} /> {/if}
  {#if navSettingClicked === "appearance"} <ApperanceSettings onNavButtonClicked={handleNavButtonClicked} /> {/if}
  <MusicPlayer />
</div>

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

      // toggle buttons
      &__toggle {
          position: absolute;
          top: 12px;
          color: #232327;
          opacity: 0.5;
          font-size: 1.5rem;
          cursor: pointer;

          &--nav-menu {
            right: 15px;
          }
          &--music {
            left: 15px;
          }
          &:hover {
            color: white;
            transition: ease-in 0.2s;
          }
      }

      // left
      &__nav-menu-container {
        background-color: var(--navMenuBgColor);
        border: var(--menuBorderVal);
        box-shadow: var(--shadowVal);
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
        // when the screen is enlarged to 900px, the nav bar stretch transition should be quick
        @include md(min-width) {
          transition: ease-in-out 0.2s;
        }
      }

      // middle
      &__video {
        padding: 0px 2.5% 30px 2.5%;
        transition: ease-in-out 0.15s;
        width: 100%;

        // nev menu and right menu both shown
        margin-left: 60px;
        margin-right: min(30vw, 300px);

        &--nav-menu-hidden {
          margin-left: 0px;
        }
        &--task-view-hidden {
          margin-right: 0px;
        }
      }

      // right
      &__task-view-container {
        width: min(30vw, 300px);
        min-width: 200px;
        height: 100vh;
        position: fixed;
        right: 0px;
        background-color: var(--taskViewBgColor);
        transition: ease-in-out 0.18s;
        border: var(--menuBorderVal);
        box-shadow: var(--shadowVal);

        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-left: 1px solid rgba(138, 138, 138, 0.3);

        &--closed {
          margin-right: -300px; 
        }

        @include sm(max-width) {
          margin-right: -300px; 
        }
      }
    }
</style>