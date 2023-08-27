<script lang="ts">
	import { onDestroy, onMount } from "svelte";

  import ActiveSessionView from "./ActiveSessionView.svelte"
	import HomeHeader from "./HomeHeader.svelte";
  import MusicPlayer from "./MusicPlayer.svelte"
  import NavMenu from "./NavMenu.svelte"
  import TaskView from "./TaskView.svelte"
  import VideoView from "./VideoView.svelte"

	import ApperanceSettings from "./ApperanceSettings.svelte"
	import MusicSettings from "./MusicSettings.svelte"
	import Settings from "./Settings.svelte"
	import YoutubeSettings from "./YoutubeSettings.svelte"
  
	import { _initGoogleClient, _initMusicKit } from "./+page"
	import { loadTheme } from "$lib/helper"
	import { homePanelData } from "$lib/store";
	import { dataset_dev } from "svelte/internal";

  let isTaskMenuExpanded = true
  let isNavMenuExpanded = true
  let hasUserToggledWithKeyLast = true
  let navSettingClicked = ""

  homePanelData.subscribe((data) => {
    isNavMenuExpanded = data.isNavMenuOpen
    isTaskMenuExpanded = data.isTaskMenuOpen
  })

  const handleNavButtonClicked = (buttonName: string) => navSettingClicked = buttonName
  const handleTaskMenuToggleOpen = () => {
    homePanelData.update((data: any) => ({ ...data, isTaskMenuOpen: !data.isTaskMenuOpen }))
  }
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey && event.key.toLowerCase() === "x") {
      handleTaskMenuToggleOpen()
    }
    if (event.metaKey && event.key.toLowerCase() === "z") {
      homePanelData.update((data: any) => ({ ...data, isNavMenuOpen: !data.isNavMenuOpen }))
      hasUserToggledWithKeyLast = true
    }
  }
  const handleMouseMove = (event: MouseEvent) => {
    const mouseX = event.clientX
    const CUTT_OFF = 5

    // show when cursor is close to left edge
    if (!isNavMenuExpanded && mouseX < CUTT_OFF) {
      homePanelData.update((data: any) => ({ ...data, isNavMenuOpen: true }))
      hasUserToggledWithKeyLast = false
    }
    // only hide when user is right outside of nav and prevent hiding when nav was shown through shortcut
    // ...as the nav menu should only close in this case when cursor goes from left of cutt off to outside
    else if ((mouseX > 80 && mouseX < 100) && !hasUserToggledWithKeyLast) { 
      homePanelData.update((data: any) => ({ ...data, isNavMenuOpen: false }))
    }
  }
  const handleResize = () => {
    if (document.body.clientWidth > 600) return
    homePanelData.update((data: any) => ({ isTaskMenuOpen: false, isNavMenuOpen: false }))
  }

  onMount(() => {
    window.addEventListener("resize", handleResize)
    handleResize()
    loadTheme()
    _initGoogleClient()
  })
  onDestroy(() =>  window.removeEventListener("resize", handleResize))

</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="home" on:mousemove={handleMouseMove}>
  <!-- <div id="signInDiv"></div> -->
  <div class={`home__nav-menu-container ${!isNavMenuExpanded ? "home__nav-menu-container--hide" : ""}`}>
    <NavMenu onNavButtonClicked={handleNavButtonClicked} />
  </div>
  <div class={`home__video 
                  ${!isNavMenuExpanded ? "home__video--nav-menu-hidden" : ""} 
                  ${!isTaskMenuExpanded ? "home__video--task-view-hidden" : ""}
                  ${!isTaskMenuExpanded && isNavMenuExpanded ? "home__video--just-nav-menu-shown" : ""}
                  ${isTaskMenuExpanded && !isNavMenuExpanded ? "home__video--just-task-view-shown" : ""}
                  ${isTaskMenuExpanded && isNavMenuExpanded ? "home__video--task-view-also-shown" : ""}
              `}>
    <HomeHeader/>
    <VideoView />
  </div>
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

      &__nav-menu-container {
        background-color: var(--navMenuBgColor);
        border: var(--sidePanelBorder);
        box-shadow: var(--sidePanelShadow);
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
        @include sm(max-width) {
          position: fixed; 
        }
      }

      &__video {
        padding: 0px 2.5% 30px 2.5%;
        transition: ease-in-out 0.15s;
        width: 100%;

        // nev menu and right menu both shown
        margin-left: 60px;
        
        &--nav-menu-hidden {
          margin-left: 0px;
        }
        &--just-nav-menu-shown {
          @include sm(max-width) {
            margin-left: 0px;
          }
        }
        &--task-view-hidden {
            padding-right: 2.5%;
        }
        &--just-task-view-shown {
          padding-right: 250px;
          margin-right: 2.5%;
          
          @include mq-custom(max-width, 940px) {
            padding-right: 265px;
          }
          @include mq-custom(max-width, 730px) {
            padding-right: 2.5%;
            margin-right: 0px;
          }
        }
        &--task-view-also-shown {
          padding-right: 250px;
          margin-right: 2.5%;

          @include mq-custom(max-width, 995px) {
            padding-right: 245px;
          }
          @include mq-custom(max-width, 840px) {
            padding-right: 2.5%;
            margin-right: 0px;
          }
        }
      }
      &__task-view-container {
        width: 245px;
        height: 100vh;
        position: fixed;
        top: 0px;
        right: 0px;
        transition: ease-in-out 0.18s;
        overflow: hidden;
        background-color: var(--secondaryBgColor);
        border: var(--sidePanelBorder);
        box-shadow: var(--prodMenuViewShadow);

        // background: rgba(32, 31, 31, 0.1);
        // backdrop-filter: blur(10px);
        // border-left: 1px solid rgba(138, 138, 138, 0.3);

        &--closed {
          margin-right: -300px; 
        }
      }
    }
</style>