<script lang="ts">
  import NavMenu from "./NavMenu.svelte";
  import PomView from "./PomView.svelte";
  import VideoView from "./VideoView.svelte";
  import MusicView from "./MusicView.svelte";

  let isNavMenuExpanded = true;
  let isMusicMenuExpanded = true;

  const handleNavToggleClick = () => isNavMenuExpanded = !isNavMenuExpanded 
  const handleMusicToggleClick = () => isMusicMenuExpanded = !isMusicMenuExpanded

</script>

<div class="home">
  <!-- left nav menu -->
  <div class={`home__nav-menu-container ${isNavMenuExpanded ? "" : "home__nav-menu-container--closed"}`}>
    <button on:click={handleNavToggleClick} class="home__toggle home__toggle--nav-menu">
      <i class={`fa-solid fa-angles-${isNavMenuExpanded ? "left" : "right" }`}></i>
    </button>
    <NavMenu isNavMenuExpanded={isNavMenuExpanded}/>
  </div>
  <!-- middle video component -->
  <div class="home__video">
    <PomView />
    <VideoView/>
    <MusicView/>
  </div>
  <!-- right music menu -->
  <div class={`home__music-menu-container ${isMusicMenuExpanded ? "" : "home__music-menu-container--closed"}`}>
    <button on:click={handleMusicToggleClick} class="home__toggle home__toggle--music">
      <i class={`fa-solid fa-angles-${isMusicMenuExpanded ? "right" : "left" }`}></i>
    </button>
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
      @mixin nav-menu-container-closed {
          width: 60px;
          .home__toggle--nav-menu {
            right: -30px;
          }
      }
      &__nav-menu-container {
        position: relative;
        width: clamp(180px, 20%, 220px);
        background-color: #161418;
        transition: ease-in-out 0.2s;

        &--closed {
          @include nav-menu-container-closed;
        }
        @include md(max-width) {
          @include nav-menu-container-closed;
        }
        // when the screen is enlarged to 900px, the nav bar stretch transition should be quick
        @include md(min-width) {
          transition: ease-in-out 0.016s;
          // does not apply to the shrinking of nav bar
          &--closed {
            transition: ease-in-out 0.2s;
          }
        }
      }

      // middle
      &__video {
        padding: 0px 2.5% 50px 2.5%;
        width: 100%;
      }

      // right
      @mixin music-menu-container-closed {
          height: 50vh;
          width: 55px;
          border-radius: 0px 0px 0px 13px;

          .home__toggle--music {
            left: -30px;
          }
      }
      &__music-menu-container {
        position: relative;
        width: 20%;
        padding: 20px;
        background-color: #161418;
        transition: ease-in-out 0.25s;
  
        &--closed {
          @include music-menu-container-closed;
        }
        @include md(max-width) {
          @include music-menu-container-closed;
        }
      }
    }
</style>