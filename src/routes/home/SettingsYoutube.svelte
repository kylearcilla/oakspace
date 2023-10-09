<script lang="ts">
    import { ErrorCode } from "$lib/enums"
    import Modal from "../../components/Modal.svelte"
    import ytRecsPlaylists from '$lib/data-yt-playlists'
    import { clickOutside } from "../../lib/utils-general"
	import { homeViewLayout, themeState, ytPlayerStore, ytUserDataStore } from "$lib/store"
	import { createYtErrorToastMsg, handleChoosePlaylist, logOutUser, loginUser } from "$lib/utils-youtube"
    
    let isUserProfileDropdownOpen = false
    let selectedRecCategory = ytRecsPlaylists[0]

    let isScrollableLeft = false
    let isScrollableRight = true
    let groupTabList: HTMLElement

    let isUserPlaylistsLoading = false
    let scrollTop = 0
    let scrollHeight = 0
    let scrollWindow = 0

    const SCROLL_STEP = 50
    const PLAYLIST_SKELETON_LENGTH = 25
    const FETCH_PLAYLIST_DELAY = 500

    /* Account */
    const handleYtSignUp = async () => loginUser()
    const handleYtSignOut = () => logOutUser()

    const capsuleBtnClickedHandler =() => $ytUserDataStore?.email ? isUserProfileDropdownOpen = true : loginUser()
    
    /* UI Handlers */
    const _handleChoosePlaylist = (playlist: YoutubePlaylist) => handleChoosePlaylist(playlist)

    const hasReachedEndOfList = () => Math.ceil(scrollTop) >= scrollHeight - scrollWindow
    const userPlsPaginationScrollHandler = async (event: Event) => {
        const list = event.target as HTMLElement
        scrollTop = list.scrollTop
        scrollHeight = list!.scrollHeight
        scrollWindow = list!.clientHeight 
        
        if (!hasReachedEndOfList()) return
        getMorePlaylists()
    }
    const getMorePlaylists = () => {
        const hasTokenExpired = $ytUserDataStore!.error?.code === ErrorCode.YT_EXPIRED_TOKEN
        if (isUserPlaylistsLoading || $ytUserDataStore!.hasFetchedAllUserPls || hasTokenExpired) return
        
        isUserPlaylistsLoading = true
        setTimeout(async () => { 
            try {
                await $ytUserDataStore!.fetchMoreUserPlaylists()
                if (hasReachedEndOfList()) getMorePlaylists()
            }
            catch(error: any) {
                createYtErrorToastMsg(error)
            }
            isUserPlaylistsLoading = false
        }, FETCH_PLAYLIST_DELAY)
    }

    /* Recommended Section */
    const handleRecTabBtnClicked = (index: number) => selectedRecCategory = ytRecsPlaylists[index]
    const handleShiftTabCategoryRight = () => groupTabList!.scrollLeft += SCROLL_STEP
    const handleShiftTabCategoryLeft = () => groupTabList!.scrollLeft -= SCROLL_STEP

    const handleTabListScroll = (event: Event) => {
        const tabList = event.target as HTMLElement
        const scrollLeft = tabList.scrollLeft
        const windowWidth = tabList.clientWidth
        const scrollWidth = tabList.scrollWidth

        isScrollableLeft = scrollLeft > 0
        isScrollableRight = scrollLeft < scrollWidth - windowWidth
    }

    const onClickOutSide = () => homeViewLayout.update((data: HomeLayout) => ({ ...data, settingsModal: null }))
</script>

<Modal onClickOutSide={onClickOutSide}>
    <div class={`yt-settings ${!$themeState.isDarkTheme ? "yt-settings--light" : ""} ${!$ytUserDataStore?.hasUserSignedIn ? "yt-settings--min" : ""}`}>
        <!-- Header -->
        <div class="yt-settings__header">
            <h1 class="yt-settings__header-title modal-bg__content-title">Youtube Settings</h1>
            <div class="yt-settings__user-profile-container">
                <button class="yt-settings__user-capsule" on:click={capsuleBtnClickedHandler}>
                    {#if $ytUserDataStore?.hasUserSignedIn}
                        <img src={$ytUserDataStore?.profileImgSrc ?? "https://media.tenor.com/-OpJG9GeK3EAAAAC/kanye-west-stare.gif"} alt="yt-profile" />
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262" id="google">
                            <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                            <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                            <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path>
                            <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
                        </svg>
                    {/if}
                    <span>{$ytUserDataStore?.username ?? "Log In"}</span>
                </button>
                {#if isUserProfileDropdownOpen}
                    <div class="yt-settings__user-profile" use:clickOutside on:click_outside={() => isUserProfileDropdownOpen = false} >
                        <div class="yt-settings__user-profile-img-container">
                            <img src={$ytUserDataStore?.profileImgSrc} alt="yt-profile" />
                        </div>
                        <div class="yt-settings__user-profile-details">
                            <div class="yt-settings__user-profile-details-header">
                                Gmail Account
                            </div>
                            <span>
                                {$ytUserDataStore?.email}
                            </span>
                            <div class="yt-settings__user-profile-details-header">
                                Youtube Channel
                            </div>
                            <span>
                                {$ytUserDataStore?.username}
                            </span>
                        </div>
                        <div class="yt-settings__user-profile-btns-container">
                            <button class="text-only" on:click={() => { handleYtSignUp(); isUserProfileDropdownOpen = false }}>
                                Switch Account
                            </button>                                
                            <button class="text-only" on:click={() => { handleYtSignOut(); isUserProfileDropdownOpen = false }}>
                                Log Out
                            </button>                                
                        </div>
                    </div>
                {/if}
            </div>
        </div>
        <div class="yt-settings__content-container">
            <div class="yt-settings__left">
                <!-- Chosen Playlist -->
                <div class={`chosen-playlist bento-box ${!$ytPlayerStore?.playlist ? "chosen-playlist--no-pl" : ""}`}>
                    <img class="img-bg" src={$ytPlayerStore?.playlist?.thumbnailURL} alt="chosen-playlist">
                    <div class={`blur-bg ${!$ytPlayerStore?.playlist ? "blur-bg--solid-color" : "blur-bg--blurred-bg"}`}></div>
                    <div class="content-bg">
                        <div class="bento-box__header">
                            <h3 class="bento-box__title">Chosen Playlist</h3>
                        </div>
                        {#if $ytPlayerStore?.playlist}
                            <div class="flx">
                                <img class="chosen-playlist__playlist-img" src={$ytPlayerStore?.playlist?.thumbnailURL} alt="chosen-playlist">
                                <div class="chosen-playlist__playlist-details">
                                    <h4>{$ytPlayerStore?.playlist?.title}</h4>
                                    <p class="chosen-playlist__playlist-description ">
                                        {$ytPlayerStore?.playlist?.description === "" ? "No Description" : $ytPlayerStore?.playlist?.description}
                                    </p>
                                </div>
                            </div>
                            <span class="chosen-playlist__playlist-vid-count">
                                {`${$ytPlayerStore?.playlist?.vidCount == 1 ? "1 video" : $ytPlayerStore?.playlist?.vidCount > 50 ? "50+ videos" : $ytPlayerStore?.playlist?.vidCount + " videos" }`}
                            </span>
                        {:else}
                            <div class="chosen-playlist__no-playlist-msg">
                                No Playlist Chosen
                            </div>
                        {/if}
                    </div>
                </div>
                <!-- User Playlists Section -->
                {#if $ytUserDataStore?.email != ""}
                    <div class={`user-playlists ${!$themeState?.isDarkTheme ? "user-playlists--dark" : ""} bento-box bento-box--no-padding`}>
                        <div class="user-playlists__header bento-box__header">
                            <h3 class="bento-box__title">Playlists</h3>
                            {#if $ytUserDataStore}
                                <span class="bento-box__subtitle">
                                    {`${$ytUserDataStore?.userPlaylistLength} ${$ytUserDataStore?.userPlaylistLength === 1 ? "playlist" : "playlists"}`}
                                </span>
                            {/if}
                        </div>
                        <!-- Header Columns -->
                        <div class="user-playlists__list-header flx">
                            <h4 class="user-playlists__list-header-num">#</h4>
                            <h4 class="user-playlists__list-header-thumbnail">Thumbnail</h4>
                            <div class="user-playlists__list-header-title">
                                <h4>Title</h4>
                            </div>
                            <div class="user-playlists__list-header-length">
                                <h4>Length</h4>
                            </div>
                        </div>
                        <!-- User Playlist List -->
                        <ul class="user-playlists__list" on:scroll={(e) => userPlsPaginationScrollHandler(e)}>
                            {#if $ytUserDataStore}
                                {#each $ytUserDataStore?.userPlaylists as playlist, idx}
                                    <li on:dblclick={() => _handleChoosePlaylist(playlist)} 
                                        class={`user-playlists__list-item ${$ytPlayerStore?.playlist?.id === playlist.id ? "user-playlists__list-item--chosen" : ""} flx flx--algn-center`}>
                                        <div class="divider divider--thin divider--top"></div>
                                        <p class={`user-playlists__list-item-num  ${$themeState?.isDarkTheme ? "" : ""}`}>{idx + 1}</p>
                                        <div class="user-playlists__list-item-img-container">
                                            <img src={`${playlist.thumbnailURL}`} alt="yt-profile-pic" />
                                        </div>
                                        <h5 class="user-playlists__list-item-title">
                                            {playlist.title}
                                        </h5>
                                        <h5 class="user-playlists__list-item-length">
                                            {`${playlist.vidCount} video${playlist.vidCount != 1 ? "s" : ""}`}
                                        </h5>
                                    </li>
                                {/each}
                                {#if isUserPlaylistsLoading}
                                    {#each new Array(PLAYLIST_SKELETON_LENGTH) as _}
                                        <li class="user-playlists__list-item user-playlists__list-item--skeleton flx flx--algn-center">
                                            <div class="divider divider--thin divider--top"></div>
                                            <p class="user-playlists__list-item-num skeleton-bg"></p>
                                            <div class="user-playlists__list-item-img-container skeleton-bg">
                                            </div>
                                            <div class="user-playlists__list-item-title">
                                                <div class="user-playlists__list-item-col-skeleton skeleton-bg"></div>
                                            </div>
                                            <div class="user-playlists__list-item-length">
                                                <div class="user-playlists__list-item-col-skeleton skeleton-bg"></div>
                                            </div>
                                        </li>
                                    {/each} 
                                {/if}
                            {/if}
                        </ul>
                    </div>
                {/if}
            </div>
            <!-- Playlist Recommendations Section -->
            <div class={`recs ${$ytUserDataStore?.username === "" ? "recs--min" : ""} bento-box bento-box--no-padding`}>
                <div class="bento-box__header">
                    <h3 class="bento-box__title">Recommendations</h3>
                </div>
                <p class="recs__copy bento-box__copy paragraph-2">
                    Discover new playlists with our staff recommended playlist picks!
                </p>
                <!-- Horizontal Tabs Carousel -->
                <div class="recs__groups-list-container">
                    {#if isScrollableLeft}
                        <div class="gradient-container gradient-container--left">
                            <button class="recs__tab-arrow recs__tab-arrow--left icon-btn gradient-container__tab-arrow" on:click={handleShiftTabCategoryLeft}>
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                        </div>
                    {/if}
                    <ul class="recs__groups-list" bind:this={groupTabList} on:scroll={handleTabListScroll}>
                        <li><div class="recs__tab-group-padding recs__tab-group-padding--left"></div></li>
                        <!-- Tab Item -->
                        {#each ytRecsPlaylists as group, idx}
                            <li>
                                <button 
                                    on:click={() => handleRecTabBtnClicked(idx)}
                                    class={`tab-btn ${$themeState?.isDarkTheme ? "tab-btn--light-mode" : ""} ${group.title === selectedRecCategory.title ? "tab-btn--selected" : ""}`}
                                >
                                    {group.title}
                                </button>
                            </li>
                        {/each}
                        <li><div class="recs__tab-group-padding recs__tab-group-padding--right"></div></li>
                    </ul>
                    {#if isScrollableRight}
                        <div class="gradient-container gradient-container--right">
                            <button class="recs__tab-arrow recs__tab-arrow--right icon-btn gradient-container__tab-arrow" on:click={handleShiftTabCategoryRight}>
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    {/if}
                </div>
                <!-- Recommended Playlist Item List -->
                <ul class="recs__playlists-list">
                    <!-- Recommended laylist Item -->
                    {#each selectedRecCategory.playlists as playlist, idx}
                        <li 
                            on:dblclick={() => _handleChoosePlaylist(playlist)}
                            class={`recs__playlist-item  ${playlist.id === $ytPlayerStore?.playlist?.id ? "recs__playlist-item--selected " : ""}`} 
                        >
                            <div class="recs__playlist-item-img-container">
                                <img class="recs__playlist-item-img" src={playlist.thumbnailURL} alt="playlist-item-thumbnail"/>
                            </div>
                            <div class="recs__playlist-item-details">
                                <h5 class="recs__playlist-item-title">{playlist.title}</h5>
                                <p class="recs__playlist-item-description">
                                    {playlist.description}
                                </p>
                                <div class="recs__playlist-item-channel-details">
                                    <a href={playlist.channelURL} target="_blank" rel="noreferrer">{playlist.channelTitle}</a>
                                </div>
                            </div>
                            <div class="divider divider--thin"></div>
                        </li>
                    {/each}
                </ul>
            </div>
            <div class="yt-settings__padding"></div>
        </div>
    </div>
</Modal>

<style lang="scss">
    @import "../../scss/blurred-bg.scss";
    @import "../../scss/skeleton.scss";

    $section-spacing: 8px;
    $recs-section-padding-left: 25px;
    $video-img-ratio: 16 / 9;

    .yt-settings {
        width: 82vw;
        height: 690px;
        max-width: 1000px;
        padding: $settings-modal-padding;

        .skeleton-bg {
            @include skeleton-bg(dark);   
        }
        
        /* Logged Out Styling */
        &--min {
            width: 75vw;
            min-width: 300px;
            height: 700px;
            max-width: 590px;
        }
        &--min &__content-container {
            display: block;
        }
        &--min .user-playlists {
            display: none;
        }
        &--min .chosen-playlist {
            height: 100%;
        }
        &--min &__left {
            height: 25%;
            margin-bottom: $section-spacing;
            width: 100%;
        }
        &--min .recs {
            width: 100%;
            height: 75%;
        }
        
        /* Light Theme Styling */
        &--light .modal-bg {
            @include modal-bg-light;
        }
        &--light .bento-box {
            @include bento-box-light;
        }
        &--light button.tab-btn {
            @include tab-btn-light;
        }
        &--light .skeleton-bg {
            @include skeleton-bg(light);
        }
        &--light .divider {
            background-color: rgba(var(--textColor1), 0.06);
            height: 1px !important;
        }
        &--light .user-playlists {
            &__list-header h4 {
                font-weight: 600;
            }
            &__list-item-title, &__list-item-length {
                font-weight: 500;
                color: rgba(var(--textColor1), 0.65);
            }
        }
        &--light .recs {
            &__playlist-item-title {
                font-weight: 600;
            }
            &__playlist-item-description {
                font-weight: 400;
            }
            &__playlist-item-channel-details a {
                font-weight: 500;
            }
        }
        &--light &__user-capsule {
            background-color: var(--bentoBoxBgColor);
            span {
                color: rgba(var(--textColor1), 0.65);
                font-weight: 600;
            }
        }
        &--light &__user-profile {
            box-shadow: var(--bentoBoxShadow);
            span {
                font-weight: 500;
            }
            &-details-header {
                font-weight: 600;
                color: rgba(var(--textColor1), 0.78);
            }
            &-btns-container button {
                font-weight: 600;
            }
        }
        &__header {
            @include flex-container(center, space-between);
            margin-bottom: 7px;

            &-title {
                margin-bottom: 5px;
            }
        }
        /* User Profile Tab */
        &__user-profile-container {
            position: relative;
        }
        &__user-capsule {
            @include flex-container(center, _);
            background-color: var(--hoverColor);
            padding: 5px 13px 5px 7px;
            border-radius: 15px;
            transition: 0.12s ease-in-out;
            
            svg {
                margin-right: 8px;
            }
            img {
                @include circle(14px);
                margin-right: 8px;
            }
            span {
                font-weight: 400;
                font-size: 1.2rem;
            }
            &:hover {
                background-color: var(--hoverColor2);
            }
        }
        &__user-profile {
            @include pos-abs-top-right-corner(40px, 0px);
            background-color: var(--dropdownMenuBgColor);
            border-radius: 13px;
            padding: 15px 18px 15px 18px;
            min-width: 160px;
            z-index: 100;
        }
        &__user-profile-img-container {
            @include flex-container(center, center);
            margin-bottom: 20px;
            
            img {
                @include circle(55px);
            }
        }
        &__user-profile-details {
            text-align: center;
            margin-bottom: 20px;
            span {
                display: block;
                color: rgb(var(--textColor1), 0.4);
                margin: 5px 0px 20px 0px;
                font-weight: 200;
                font-size: 1.14rem;
            }
        }
        &__user-profile-details-header {
            color: rgb(var(--textColor1), 1);
            font-size: 1.28rem;
        }
        &__user-profile-btns-container {
            padding-top: 10px;
            @include flex-container(center, space-evenly);
            color: rgb(var(--textColor1), 0.7);
            width: 100%;

            button {
                padding: 0px;
                font-weight: 400;
                font-size: 1.1rem;
                white-space: nowrap;

                &:first-child {
                    margin-right: 11px;
                }
            }
        }

        /* Content */
        &__content-container {
            display: flex;
            height: 92%;
        }
        &__left {
            margin-right: $section-spacing;
            width: 45%;
            height: 100%;
        }

        .divider {
            background-color: rgba(var(--textColor1), 0.05);
        }
    }

    /* Sections */
    .chosen-playlist {
        margin-bottom: $section-spacing;
        width: 100%;
        position: relative;
        color: rgb(255, 255, 255, 1);
        height: 25%;
        padding-bottom: 5px;

        &--no-pl h3 {
            color: rgb(var(--textColor1), 1);
        }
        &--no-pl &__no-playlist-msg {
            color: rgb(var(--textColor1), 0.6);
        }
        &--no-pl .img-bg, &--no-pl .blur-bg {
            display: none;
        }
        .img-bg, .blur-bg, .content-bg {
            border-radius: 12px;
        }
        .content-bg {
            position: relative;
        }

        h3 {
            margin-bottom: 10px;
        }
        &__playlist-img {
            margin: 0px 15px 0px 0px;
            height: 72px;
            border-radius: 4px;
            aspect-ratio: $video-img-ratio;
        }
        &__playlist-details {
            width: 90%;
            position: relative;
            
            h4 {
                max-width: 95%;
                @include elipses-overflow;
                font-size: 1.3rem;
                font-weight: 600;
            }
        }
        &__playlist-description {
            margin-top: 8px;
            width: 100%;
            max-height: 45px;
            overflow-y: scroll;
            position: relative;
            font-size: 1.1rem;
            color: rgb(255, 255, 255, 0.7);
        }
        &__playlist-vid-count {
            @include pos-abs-bottom-right-corner(0px, 8px);
            font-size: 1.1rem;;
            color: rgba(255, 255, 255, 0.7);
        }
        &__no-playlist-msg {
            font-weight: 600;
            font-size: 1.3rem;
            color: rgba(255, 255, 255, 0.5);
            @include abs-center;
            top: 45%;
        }

        .gradient-container {
            height: 20px;
            width: 80%;
        }
    }
    .user-playlists {
        margin: 0px $section-spacing $section-spacing 0px;
        height: 75%;
        width: 100%;
        overflow: hidden;

        &--min {
            height: 30%;
        }
        &__header {
            padding: 13px 20px 12px 20px;
        }
        /* List Header */
        &__list-header {
            padding: 0px 0px 8px 6px;
            color: rgba(var(--textColor1), 0.7);
            @include elipses-overflow;
            
            h4 {
                font-weight: 500;
                font-size: 1.05rem;
            }
        }
        &__list-header-num {
            margin-left: 19px;
            width: 25px;
        }
        &__list-header-thumbnail {
            width: 110px;
        }
        &__list-header-title, &__list-header-length {
            @include center;
            width: 30%;

            @include md(max-width) {
                width: 40%;
            }
        }
        /* User Playlist Items */
        &__list {
            overflow-y: scroll;
            height: 90%;
        }
        &__list-inactive-msg {
            color: rgb(129, 129, 129);
            text-align: center;
        }
        &__list-item {
            position: relative;
            padding-left: 6px;
            color: rgba(var(--textColor1), 0.6);
            transition: 0.01s ease-in-out;
            height: 78px;
            @include elipses-overflow;

            &:first-child {
                margin-top: 12px;
            }
            &:last-child {
                margin-bottom: 50px;
            }
            &:hover, &--chosen {
                background-color: var(--hoverColor);
            }
            .divider {
                margin: 0px 0px 0px -10px;
                width: 110%;
                height: 1px;          
            }
            &--skeleton &-img-container {
                border-radius: 8px;
            }
            &--skeleton &-col-skeleton {
                height: 13px;
                margin: 0 auto;
                border-radius: 3px;
                width: 50%;
            }
        }
        &__list-item-num {
            margin-left: 19px;
            min-width: 25px;
            color: rgba(var(--textColor1), 0.45);
        }
        &__list-item-img-container {
            width: 95px;
            aspect-ratio: $video-img-ratio;
            margin-right: 15px;
            img {
                border-radius: 5px;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        &__list-item-title, &__list-item-length {
            width: 30%;
            overflow: hidden;
            @include elipses-overflow;
            font-size: 1.05rem;
            font-weight: 400;
            color: rgba(var(--textColor1), 0.5);
            @include center;

            @include md(max-width) {
                width: 40%;
            }
        }
    }
    .recs {
        width: 55%;
        height: calc(100% + $section-spacing);
        overflow: hidden;
        
        &--min {
            width: 100%;
        }

        h3 {
            padding: 17px 0px 0px $recs-section-padding-left;
        }
        &__copy {
            margin: 8px 0px 12px 0px;
            padding: 0px 0px 0px $recs-section-padding-left;
        }
        &__tab-arrow {
            z-index: 10000;
            background: none;

            &--left {
                margin-right: 15px;
            }
            &--right {
                margin-left: 15px;
            }
        }
        /* Horizontal Carousel Tab Container */
        &__groups-list-container {
            position: relative;
            z-index: 0;
            width: 100%;
            overflow-x: scroll;
            overflow-y: hidden;
            
            .gradient-container {
                width: 45px;
                @include center;
                &--left {
                    background: linear-gradient(90deg, var(--bentoBoxBgColor) 60%, transparent);
                    @include pos-abs-bottom-left-corner(0px, 0px)
                }
                &--right {
                    @include pos-abs-bottom-right-corner(0px, 0px)
                }
            }
            &:hover > .gradient-container {
                opacity: 1 !important;
                visibility: visible !important;
            }
        }
        &__groups-list {
            padding: 6px 0px 10px 0px;
            overflow-x: scroll;
            display: flex;
            scroll-behavior: smooth;
        }
        &__tab-group-padding {
            width: $recs-section-padding-left;;
            height: 5px;

            &--right {
                width: 50px;
            }
        }
        &__group-tab {
            margin-right: 4px;
        }
        /* Playlit List */
        &__playlists-list {
            height: 90%;
            overflow-y: scroll;
        }
        /* Playlist Item */
        &__playlist-item {
            transition: 0.1s ease-in-out;
            display: flex;
            overflow: hidden;
            padding: 20px 0px;
            height: 120px;
            max-height: 120px;
            position: relative;
            width: 100%;

            &--selected, &:hover {
                background-color: var(--hoverColor);
            }
            &:first-child {
                margin-top: 3px;
            }
            &:last-child {
                margin-bottom: 70px;
            }
            .divider {
                @include pos-abs-bottom-left-corner(0px, 0px);
            }

            &--skeleton &-img-container {
                border-radius: 7px;
            }
            &--skeleton &-title {
                height: 14px;
                border-radius: 4px;
                margin-bottom: 11px;
                width: 50%;
            }
            &--skeleton &-description {
                height: 10px;
                margin-bottom: 5px;
                width: 90%;
                border-radius: 4px;
            }
            &--skeleton &-channel-details {
                height: 14px;
                width: 20%;
                border-radius: 4px;
            }
        }
        &__playlist-item-img-container {
            width: 140px;
            margin: 0px 3% 0px 25px;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        &__playlist-item-title {
            margin-bottom: 4px;
            @include elipses-overflow;
            max-width: 90%;
            font-weight: 500;
            font-size: 1.1rem;
        }
        &__playlist-item-details {
            width: 60%;
            position: relative;
        }
        &__playlist-item-description {
            width: 95%;
            max-height: 27px;
            overflow: hidden;
            font-weight: 300;
            font-size: 1.04rem;
            @include multi-line-elipses-overflow(2);
            color: rgb(var(--textColor1), 0.6);
        }
        &__playlist-item-channel-details {
            @include pos-abs-bottom-left-corner(0px, 0px);
            margin-top: 12px;

            a {
                font-weight: 400;
                color: rgba(var(--textColor1), 0.8);
                &:hover {
                    text-decoration: underline
                }
            }
        }
    }

    @include mq-custom(max-width, 50em) {
        .modal-bg {
            &__content {
                padding: 25px 20px 30px 20px;
            }
        }
        .yt-settings {
            &__content-container {
                display: block;
            }
            &__left {
                width: 100%;
                margin-bottom: $section-spacing + 20px;
                height: 600px;
            }
            &__padding {
                display: block;
                width: 100%;
                height: 70px;
            }
        }
        .recs {
            height: 600px;
        }
        .chosen-playlist {
            margin-bottom: $section-spacing + 6px;
        }
        .account-details, .chosen-playlist, 
        .user-playlists, .recs {
            width: 100%;
        }
    }
</style>