<script lang="ts">
  import NavMenu from "./NavMenu.svelte";
  import PomView from "./PomView.svelte";
  import VideoView from "./VideoView.svelte";
  import MusicView from "./MusicView.svelte";
  import TaskView from "./TaskView.svelte";

  let isTaskMenuExpanded = true;
  let doShowNavMenu = false;

  const handleTaskMenuToggleClick = () => isTaskMenuExpanded = !isTaskMenuExpanded
  const handleMouseMove = (event: MouseEvent) => {
    const mouseX = event.clientX;
    const cutoff = doShowNavMenu ? 80 : 10

    if (mouseX < cutoff) doShowNavMenu = true;
    else doShowNavMenu = false;
  }

</script>

<div class="home" on:mousemove={handleMouseMove}>
  <!-- left nav menu -->
  <div class={`home__nav-menu-container ${doShowNavMenu ? "home__nav-menu-container--shown" : ""}`}>
    <NavMenu/>
  </div>
  <!-- middle video component -->
  <div class={`home__video ${doShowNavMenu ? "home__video--nav-menu-shown" : ""}`}>
    <PomView />
    <VideoView/>
    <MusicView/>
  </div>
  <!-- right music menu -->
  <div class={`home__task-view-container ${isTaskMenuExpanded ? "" : "home__task-view-container--closed"}`}>
    <button on:click={handleTaskMenuToggleClick} class="home__toggle home__toggle--music">
      <i class={`fa-solid fa-angles-${isTaskMenuExpanded ? "right" : "left" }`}></i>
    </button>
    <TaskView/>
  </div>
</div>

<style lang="scss">
    .home {
      height: 100%;
      display: flex;
      justify-content: space-between;
      font-family: 'Apercu Medium' system-ui;

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
          @include md(max-width) {
            display: none;
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
        
        @include sm(max-width) {
          margin-left: -60px;

          &--shown {
            margin-left: 0px;
          }
        } 

        // when the screen is enlarged to 900px, the nav bar stretch transition should be quick
        @include md(min-width) {
          transition: ease-in-out 0.2s;
        }
      }

      // middle
      &__video {
        padding: 0px 2.5% 50px 2.5%;
        transition: ease-in-out 0.15s;
        width: 100%;
        margin-left: 60px;
        
        @include sm(max-width) {
          margin-left: 0px;
          padding-right: 4%;

          &--nav-menu-shown {
            margin-left: 60px;
            display: block;
          }
        }
      }

      // right
      @mixin task-view-container-closed {
          height: 50vh;
          width: 55px;
          border-radius: 0px 0px 0px 13px;
          .home__toggle--music {
            left: -30px;
          }
      }
      &__task-view-container {
        position: relative;
        width: clamp(250px, 25%, 280px);
        background-color: #161418;
        transition: ease-in-out 0.25s;
  
        &--closed {
          @include task-view-container-closed;
        }
        @include sm(max-width) {
          margin-right: -55px; 
          display: none
        }
        @include md(max-width) {
          @include task-view-container-closed;
        }
      }
    }
</style>