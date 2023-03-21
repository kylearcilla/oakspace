<script lang="ts">
  import NavMenu from "./NavMenu.svelte";
  import PomView from "./PomView.svelte";
  import VideoView from "./VideoView.svelte";
  import MusicView from "./MusicView.svelte";
  import TaskView from "./TaskView.svelte";
  import MusicPlayer from "./MusicPlayer.svelte";
	import { onDestroy, onMount } from "svelte";

  let isTaskMenuExpanded = true;
  let doHideMenu = false;
  let hasUserToggledWithKeyLast = true;

  const handleTaskMenuToggleClick = () => isTaskMenuExpanded = !isTaskMenuExpanded
  const handleMouseMove = (event: MouseEvent) => {
    const mouseX = event.clientX;
    const cutoff = doHideMenu ? 20 : 10

    if (doHideMenu && mouseX < cutoff) {
      doHideMenu = false;
      hasUserToggledWithKeyLast = false;
    }
    // only hide when user is right outside of nav and prevent hiding when nav shown through shortcut
    else if ((mouseX > 80 && mouseX < 100) && !hasUserToggledWithKeyLast) { 
      doHideMenu = true;
    }
  }
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.shiftKey && event.key.toLowerCase() === "x") handleTaskMenuToggleClick();
    if (event.shiftKey && event.key.toLowerCase() === "z") {
      doHideMenu = !doHideMenu;
      hasUserToggledWithKeyLast = true;
    }
  }
  const handleResize = () => {
    if (document.body.clientWidth <= 600) doHideMenu = true;
  }
  onMount(() => {
    window.addEventListener("resize", handleResize);
  });
  onDestroy(() => {
    window.removeEventListener("resize", handleResize);
  });

</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="home" on:mousemove={handleMouseMove}>
  <!-- left nav menu -->
  <div class={`home__nav-menu-container ${doHideMenu ? "home__nav-menu-container--hide" : ""}`}>
    <NavMenu/>
  </div>
  <!-- middle video component -->
  <div class={`home__video ${doHideMenu ? "home__video--hide" : ""}`}>
    <PomView />
    <VideoView/>
    <MusicView/>
  </div>
  <!-- right music menu -->
  <div class={`home__task-view-container ${isTaskMenuExpanded ? "" : "home__task-view-container--closed"}`}>
    <button on:click={handleTaskMenuToggleClick} class="home__toggle home__toggle--music">
      <i class={`fa-solid fa-angles-${isTaskMenuExpanded ? "right" : "left" }`}></i>
    </button>
    <TaskView isTaskMenuExpanded={isTaskMenuExpanded}/>
  </div>
  <MusicPlayer/>
</div>

<style lang="scss">
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
        background-color: #18151a;
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
        padding: 0px 2.5% 100px 2.5%;
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
        background-color: #141418;
        transition: ease-in-out 0.25s;
        min-width: 80px;
        min-height: 100%;

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