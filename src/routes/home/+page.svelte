<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import HomeHeader from "./HomeHeader.svelte";
  import MusicPlayer from "./HomeMusicPlayer.svelte"
  import NavMenu from "./HomeSideBarLeft.svelte"
  import TaskView from "./HomeSideBarRight.svelte"
  import VideoView from "./HomeVideoView.svelte"

	import ApperanceSettings from "./SettingsAppearance.svelte"
	import MusicSettings from "./SettingsMusic.svelte"
	import Settings from "./Settings.svelte"
	import YoutubeSettings from "./SettingsYoutube.svelte"
	import Stats from "./Stats.svelte"
  
	import { _initGoogleClient, _initMusicKit } from "./+page"
	import { loadHomePanelData, loadTheme, loadYtUserData, updateUI } from "$lib/utils-general"
	import { globalSessionObj, homeViewLaout } from "$lib/store";
	import { get } from "svelte/store";
	import HomeEmptyView from "./HomeEmptyView.svelte";
	import SessionActiveHome from "./SessionActiveHome.svelte";

  enum Modal { Settings, Youtube, Music, Stats, Appearance }

  let isVideoViewOpen = true
  let isTaskMenuExpanded = false
  let isNavMenuExpanded = false

  let hasUserToggledWithKeyLast = true
  let navSettingClicked: Modal | null = null

  let isSessionActive = false
  const LEFT_BAR_LEFT_BOUND = 5
  const LEFT_BAR_RIGHT_BOUND = 80
  const MIN_UI_MAX_WIDTH = 600

  globalSessionObj.subscribe((data: any) => {
    if (data) isSessionActive = true
    else isSessionActive = false
  })
  homeViewLaout.subscribe((data) => {
    isNavMenuExpanded = data.isNavMenuOpen
    isTaskMenuExpanded = data.isTaskMenuOpen
    isVideoViewOpen = data.isVideoViewOpen
  })

  const handleNavButtonClicked = (modal: Modal | null) => navSettingClicked = modal
  const handleTaskMenuToggleOpen = () => {
    const homePaneDataObj = get(homeViewLaout)
    updateUI({ ...homePaneDataObj, isTaskMenuOpen: !homePaneDataObj.isTaskMenuOpen })

  }
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.shiftKey && event.key === "}") {
      handleTaskMenuToggleOpen()
    }
    else if (event.shiftKey && event.key === "{") {
      const homePaneDataObj = get(homeViewLaout)
      updateUI({ ...homePaneDataObj, isNavMenuOpen: !homePaneDataObj.isNavMenuOpen })
  
      hasUserToggledWithKeyLast = true
    }
    else if (event.key=== "Escape") {
      navSettingClicked = null
    }
  }
  const handleMouseMove = (event: MouseEvent) => {
    const mouseX = event.clientX

    if (!isNavMenuExpanded && mouseX < LEFT_BAR_LEFT_BOUND) {
      // show when cursor is close to left edge

      updateUI({ ...get(homeViewLaout), isNavMenuOpen: true  })
      hasUserToggledWithKeyLast = false
    }
    else if (isNavMenuExpanded && mouseX > LEFT_BAR_RIGHT_BOUND && !hasUserToggledWithKeyLast) { 
      // Prevent hiding when nav was toggled through shortcut
      // ...as the nav menu should only close in this case when cursor goes from over left side bar to outside of right boundary

      homeViewLaout.update((data: any) => ({ ...data, isNavMenuOpen: false }))
    }
  }
  const handleResize = () => {
    if (document.body.clientWidth > MIN_UI_MAX_WIDTH) return
    updateUI({ ...get(homeViewLaout), isTaskMenuOpen: false, isNavMenuOpen: false  })
  }

  onMount(() => {
    window.addEventListener("resize", handleResize)
    handleResize()
    loadTheme()
    loadHomePanelData()
    loadYtUserData()
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
    {#if isVideoViewOpen} <VideoView /> {/if}
    {#if !isVideoViewOpen && !isSessionActive} <HomeEmptyView /> {/if}
    {#if !isVideoViewOpen && isSessionActive} <SessionActiveHome /> {/if}
  </div>
  <div class={`home__task-view-container ${isTaskMenuExpanded ? "" : "home__task-view-container--closed"}`}>
    <TaskView isTaskMenuExpanded={isTaskMenuExpanded}/>
  </div>
  {#if navSettingClicked === Modal.Settings} <Settings onNavButtonClicked={handleNavButtonClicked}/> {/if}
  {#if navSettingClicked === Modal.Youtube} <YoutubeSettings onNavButtonClicked={handleNavButtonClicked}/> {/if}
  {#if navSettingClicked === Modal.Music} <MusicSettings onNavButtonClicked={handleNavButtonClicked} /> {/if}
  {#if navSettingClicked === Modal.Appearance} <ApperanceSettings onNavButtonClicked={handleNavButtonClicked} /> {/if}
  {#if navSettingClicked === Modal.Stats} <Stats onNavButtonClicked={handleNavButtonClicked} /> {/if}
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