<script lang="ts">
  import NavMenu from "./NavMenu.svelte";
  import PomView from "./PomView.svelte";
  import VideoView from "./VideoView.svelte";
  import MusicView from "./MusicView.svelte";
  import TaskView from "./TaskView.svelte";
  import MusicPlayer from "./MusicPlayer.svelte";
	import { onDestroy, onMount } from "svelte";
	import YoutubeSettings from "./YoutubeSettings.svelte";
	import MusicSettings from "./MusicSettings.svelte";
	import UserSettings from "./UserSettings.svelte";

	import { _initGoogleClient, _initMusicKit } from "./+page";
	import Icon from "../../components/Icon.svelte";

  let isTaskMenuExpanded = true;
  let doHideMenu = false;
  let hasUserToggledWithKeyLast = true;
  let navSettingClicked = "";

  const handleNavButtonClicked = (buttonName: string) => {
    navSettingClicked = buttonName;
  }
  const handleTaskMenuToggleClick = () => isTaskMenuExpanded = !isTaskMenuExpanded
  const handleMouseMove = (event: MouseEvent) => {
    const mouseX = event.clientX;
    const cutoff = 5

    // show when user is close to left edge
    if (doHideMenu && mouseX < cutoff) {
      doHideMenu = false;
      hasUserToggledWithKeyLast = false;
    }
    // only hide when user is right outside of nav and prevent hiding when nav was shown through shortcut
    // ...as the nav menu should only close in this case when the user was in the nav menu
    else if ((mouseX > 80 && mouseX < 100) && !hasUserToggledWithKeyLast) { 
      doHideMenu = true;
    }
  }
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey && event.key.toLowerCase() === "x") {
      handleTaskMenuToggleClick();
    }
    if (event.metaKey && event.key.toLowerCase() === "z") {
      doHideMenu = !doHideMenu;
      hasUserToggledWithKeyLast = true;
    }
  }
  const handleResize = () => {
    if (document.body.clientWidth <= 600) doHideMenu = true;
  }

  onMount(() => {
    window.addEventListener("resize", handleResize);
    console.log(window)
    _initGoogleClient();
  });
  onDestroy(() => {
    window.removeEventListener("resize", handleResize);
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
  <div class={`home__video ${doHideMenu ? "home__video--hide" : ""}`}>
    <PomView />
    <!-- @ts-ignore -->
    <VideoView />
    <MusicView/>
  </div>
  <!-- right music menu -->
  <div class={`home__task-view-container ${isTaskMenuExpanded ? "" : "home__task-view-container--closed"}`}>
    <button on:click={handleTaskMenuToggleClick} class="home__toggle home__toggle--music">
      <i class={`fa-solid fa-angles-${isTaskMenuExpanded ? "right" : "left" }`}></i>
    </button>
    <TaskView isTaskMenuExpanded={isTaskMenuExpanded}/>
  </div>
  {#if navSettingClicked === "settings"} <UserSettings/> {/if}
  {#if navSettingClicked === "youtube"} <YoutubeSettings onNavButtonClicked={handleNavButtonClicked}/> {/if}
  {#if navSettingClicked === "music"} <MusicSettings onNavButtonClicked={handleNavButtonClicked} /> {/if}
  <MusicPlayer />
</div>

<style lang="scss">
    $bg-color-1: #141418;
    $bg-color-2: #141418;

    #signInDiv {
      position: absolute;
      right: 400px;
      top: 150px;
    }
    .home {
      height: 100%;
      display: flex;
      justify-content: space-between;
      font-family: 'Apercu Medium' system-ui;

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
        background-color: $bg-color-2;
        position: relative;
        width: 60px;
        transition: ease-in-out 0.15s;
        height: 100vh;
        margin-left: 0px;
        position: fixed;
        z-index: 1000;

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
        margin-left: 60px;

        &--hide {
          margin-left: 0px !important;
          padding-right: 4% !important;
        }
      }
      // right
      &__task-view-container {
        position: relative;
        width: min(25%, 280px);
        height: 100vh;
        background-color: $bg-color-2;
        transition: ease-in-out 0.25s;
        min-width: 80px;

        &--closed {
          height: 350px;
          width: 65px;
          border-radius: 0px 0px 0px 13px;
          min-width: 0px;

          .home__toggle--music {
            left: -30px;
          }
        }
        @include sm(max-width) {
          margin-right: -55px; 
          display: none
        }
      }
    }
</style>