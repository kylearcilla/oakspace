<script lang="ts">
    import Modal from "../../components/Modal.svelte"
    import Logo from "../../components/Logo.svelte"
    
	import { closeModal } from "$lib/utils-home"
    import { Icon, ModalType } from "$lib/enums"
    import ytRecsPlaylists from '$lib/data-yt-playlists'
    import { clickOutside } from "../../lib/utils-general"
	import { themeState, ytPlayerStore, ytUserDataStore } from "$lib/store"
	import { createYtErrorToastMsg, handleChoosePlaylist, logOutUser, loginUser } from "$lib/utils-youtube"
	import { ExpiredTokenError } from "$lib/errors";
    
    let isUserProfileDropdownOpen = false
    let selectedPlsGroup = ytRecsPlaylists[0]

    let isScrollableLeft = false
    let isScrollableRight = true
    let groupTabList: HTMLElement

    let isPlsLoading = false
    let scrollTop = 0
    let scrollHeight = 0
    let scrollWindow = 0

    const SCROLL_STEP = 200
    const PLAYLIST_SKELETON_LENGTH = 25
    const FETCH_PLAYLIST_DELAY = 500

    /* Account */
    const handleYtSignUp  = async () => loginUser()
    const handleYtSignOut = ()       => logOutUser()

    const capsuleBtnClickedHandler = () => { 
        if ($ytUserDataStore) {
            isUserProfileDropdownOpen = true 
        }
        else {
            loginUser()
        }
    }
    
    /* UI Handlers */
    const _handleChoosePlaylist = (playlist: YoutubePlaylist) => handleChoosePlaylist(playlist)
    
    const hasReachedEndOfList   = () => Math.ceil(scrollTop) >= scrollHeight - scrollWindow

    const userPlsInfiniteScrollHandler = async (event: Event) => {
        if (selectedPlsGroup.title != "My Playlists") return

        const list = event.target as HTMLElement
        scrollTop = list.scrollTop
        scrollHeight = list!.scrollHeight
        scrollWindow = list!.clientHeight 
        
        if (!hasReachedEndOfList()) return
        getMorePlaylists()
    }
    
    const getMorePlaylists = () => {
        const hasTokenExpired = $ytUserDataStore!.error instanceof ExpiredTokenError
        if (isPlsLoading || $ytUserDataStore!.hasFetchedAllUserPls || hasTokenExpired) return
        
        isPlsLoading = true
        setTimeout(async () => { 
            try {
                await $ytUserDataStore!.fetchMoreUserPlaylists()
                selectedPlsGroup.playlists = $ytUserDataStore!.userPlaylists

                isPlsLoading = false

                if (hasReachedEndOfList()) getMorePlaylists()      // if user reaches the end of skeleton list during loading state
            }
            catch(error: any) {
                isPlsLoading = false
                createYtErrorToastMsg(error)
            }
        }, FETCH_PLAYLIST_DELAY)
    }

    /* Recommended Section */
    const handleShiftTabCategoryRight = () => groupTabList!.scrollLeft += SCROLL_STEP
    const handleShiftTabCategoryLeft  = () => groupTabList!.scrollLeft -= SCROLL_STEP
    const handleRecTabBtnClicked = (index: number) => {
        if (index < 0) {
            selectedPlsGroup = { title: "My Playlists", playlists: $ytUserDataStore!.userPlaylists }
            return
        }
        selectedPlsGroup = ytRecsPlaylists[index]
    }
    
    const handleTabListScroll = (event: Event) => {
        const tabList = event.target as HTMLElement
        const scrollLeft = tabList.scrollLeft
        const windowWidth = tabList.clientWidth
        const scrollWidth = tabList.scrollWidth

        isScrollableLeft = scrollLeft > 0
        isScrollableRight = scrollLeft < scrollWidth - windowWidth
    }

    const onClickOutSide = () => closeModal(ModalType.Youtube)
</script>

<Modal onClickOutSide={onClickOutSide}>
    <div class={`yt-settings ${!$themeState.isDarkTheme ? "yt-settings--light" : ""} ${!$ytUserDataStore?.hasUserSignedIn ? "yt-settings--min" : ""}`}>
        <!-- Header -->
        <div class="yt-settings__header">
            <div class="yt-settings__header-left-title flx flx--algn-center flx--justify-center">
                <h1 class="yt-settings__header-title modal-bg__content-title">
                    Youtube
                </h1>
                <div class="yt-settings__header-yt-logo">
                    <Logo 
                        logo={Icon.Youtube}
                        options={{ hasBgColor: false, containerWidth: "20px", iconWidth: "100%" }}
                    />
                </div>
            </div>
            <div class="yt-settings__user-profile-container">
                <button class="yt-settings__user-capsule" on:click={capsuleBtnClickedHandler}>
                    {#if $ytUserDataStore?.hasUserSignedIn}
                        <img src={$ytUserDataStore?.profileImgSrc ?? "https://media.tenor.com/-OpJG9GeK3EAAAAC/kanye-west-stare.gif"} alt="yt-profile" />
                    {:else}
                        <div class="yt-settings__user-capsule-google-logo">
                            <Logo logo={Icon.Google} options={{ hasBgColor: false, containerWidth: "11.5px", iconWidth: "100%" }} />
                        </div>
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
                <div class="chosen-playlist bento-box">
                    {#if $ytPlayerStore?.playlist}
                        <img class="img-bg" src={$ytPlayerStore?.playlist?.thumbnailURL} alt="chosen-playlist">
                        <div class="img-bg-gradient gradient-container gradient-container--bottom"></div>
                        <div class={`blur-bg ${!$ytPlayerStore?.playlist ? "blur-bg--solid-color" : "blur-bg--blurred-bg"}`}></div>
                        <div class="content-bg">
                            <div class="chosen-playlist__playlist">
                                <img class="chosen-playlist__playlist-img" src={$ytPlayerStore.playlist.thumbnailURL} alt="chosen-playlist">
                                <div class="chosen-playlist__playlist-details">
                                    <h3>Now Playing</h3>
                                    <h4 class="chosen-playlist__playlist-title">
                                        {$ytPlayerStore.playlist.title}
                                    </h4>
                                    <div class="chosen-playlist__playlist-metadata">
                                        <span>
                                            {$ytPlayerStore.playlist.channelTitle}
                                        </span>
                                        <span>
                                            
                                            {`${$ytPlayerStore.playlist.vidCount} video${$ytPlayerStore.playlist.title.length === 1 ? "" : "s"}`}
                                        </span>
                                    </div>
                                    <p class="chosen-playlist__playlist-description" title={$ytPlayerStore.playlist.description}>
                                        {$ytPlayerStore.playlist.description === "" ? "No Description" : $ytPlayerStore.playlist.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    {:else}
                        <div class="chosen-playlist__no-playlist-msg">
                            No Playlist Chosen
                        </div>
                    {/if}
                </div>
            </div>
            <!-- Playlist Recommendations Section -->
            <div class={`recs ${$ytUserDataStore?.username === "" ? "recs--min" : ""} bento-box bento-box--no-padding`}>
                <div class="recs__header bento-box__header">
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
                        {#if $ytUserDataStore?.hasUserSignedIn}
                            <li class="recs__groups-list-user-pl-tab">
                                <button 
                                    on:click={() => handleRecTabBtnClicked(-1)}
                                    class={`tab-btn ${$themeState?.isDarkTheme ? "tab-btn--light-mode" : ""} ${"My Playlists" === selectedPlsGroup.title ? "tab-btn--selected" : ""}`}
                                >
                                    My Playlists
                                </button>
                                <div class="divider divider--vertical"></div>
                            </li>
                        {/if}
                        {#each ytRecsPlaylists as group, idx}
                            <li class="recs__groups-list-rec-tab">
                                <button 
                                    on:click={() => handleRecTabBtnClicked(idx)}
                                    class={`tab-btn ${$themeState?.isDarkTheme ? "tab-btn--light-mode" : ""} ${group.title === selectedPlsGroup.title ? "tab-btn--selected" : ""}`}
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
                <ul class="recs__playlists-list" on:scroll={userPlsInfiniteScrollHandler}>
                    <!-- Recommended laylist Item -->
                    {#each selectedPlsGroup.playlists as playlist}
                        <li 
                            on:dblclick={() => _handleChoosePlaylist(playlist)}
                            class={`recs__playlist-item  
                                        ${playlist.id === $ytPlayerStore?.playlist?.id ? "recs__playlist-item--selected" : ""}
                                        ${selectedPlsGroup.title === "My Playlists" ? "recs__playlist-item--user-pl " : ""}
                                   `} 
                        >
                            <div class="recs__playlist-item-img-container">
                                <img class="recs__playlist-item-img" src={playlist.thumbnailURL} alt="playlist-item-thumbnail"/>
                            </div>
                            <div class="recs__playlist-item-details">
                                <h5 class="recs__playlist-item-title">
                                    {playlist.title}
                                </h5>
                                <p class="recs__playlist-item-description" title={playlist.description}>
                                    {`${playlist.description.length === 0 ? "No description" : playlist.description} `}
                                </p>
                                {#if selectedPlsGroup.title === "My Playlists"}
                                    <div class="recs__playlist-item-vid-count">
                                        <span>{`${playlist.vidCount} Video${playlist.vidCount === 1 ? "" : "s"}`}</span>
                                    </div>
                                {:else}
                                    <div class="recs__playlist-item-channel-details">
                                        {#if playlist.channelURL}
                                            <a href={playlist.channelURL} target="_blank" rel="noreferrer">
                                                {playlist.channelTitle}
                                            </a>
                                        {:else}
                                            <span>
                                                {playlist.channelTitle}
                                            </span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                            <div class="divider divider--thin"></div>
                        </li>
                    {/each}
                    {#if isPlsLoading}
                        {#each new Array(PLAYLIST_SKELETON_LENGTH) as _}
                            <li class={`recs__playlist-item recs__playlist-item--skeleton 
                                            ${selectedPlsGroup.title === "My Playlists" ? "recs__playlist-item--user-pl " : ""}
                                      `}>
                                <div class="recs__playlist-item-img-container recs__playlist-item-img-container--skeleton skeleton-bg"></div>
                                <div class="recs__playlist-item-details">
                                    <h5 class="recs__playlist-item-title recs__playlist-item-title--skeleton skeleton-bg">
                                    </h5>
                                    <p class="recs__playlist-item-description recs__playlist-item-description--skeleton skeleton-bg"></p>
                                    <p class="recs__playlist-item-description recs__playlist-item-description-second-line recs__playlist-item-description--skeleton skeleton-bg"></p>
                                    <div class="recs__playlist-item-vid-count recs__playlist-item-vid-count--skeleton skeleton-bg">
                                    </div>
                                </div>
                                <div class="divider divider--thin divider--bottom"></div>
                            </li>
                        {/each} 
                    {/if}
                    {#if selectedPlsGroup.playlists.length === 0}
                        <div class="recs__playlists-empty-txt">
                            <p>This collection is empty!</p>
                        </div>
                    {/if}
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
    $header-height: 38px;
    $min-layout-cut-off: 35em; // 560px

    .yt-settings {
        width: 86vw;
        height: 86vh;
        max-width: 1200px;
        padding: $settings-modal-padding;

        .skeleton-bg {
            @include skeleton-bg(dark);   
        }
                
        /* Light Theme Styling */
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
        &--light .recs {
            &__playlist-item-title {
                font-weight: 600;
            }
            &__playlist-item-description {
                font-weight: 400;
            }
            &__playlist-item-channel-details, &__playlist-item-vid-count {
                span, a {
                    font-weight: 500;
                }
            }
        }
        &--light .chosen-playlist {
            .img-bg-gradient {
                height: 70%;
                background: linear-gradient(0deg, var(--modalBgColor) 10%, transparent) !important;
            }
            .blur-bg {
                background: rgba(96, 96, 96, 0.35);
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
            @include flex-container(flex-start, space-between);
            height: $header-height;

            &-title {
                margin-bottom: 5px;
            }
            &-yt-logo {
                margin-left: 8px;
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

            &-google-logo {
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
            background-color: var(--dropdownMenuBgColor1);
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
            height: calc(100% - $header-height);
        }
        &__left {
            margin-right: $section-spacing;
            width: calc(28% - ($section-spacing / 2));
            min-width: 200px;
            max-width: 260px;
            height: 100%;
        }
        .recs {
            width: calc(72% - ($section-spacing / 2));
            flex: 1;
        }

        .divider {
            background-color: rgba(var(--textColor1), 0.05);
        }
    }

    /* Sections */
    .chosen-playlist {
        width: 100%;
        position: relative;
        color: rgb(255, 255, 255, 1);
        height: 100%;
        padding: 10px;
        border-radius: 16.5px;
        overflow: hidden;
        
        &--no-pl h3 {
            color: rgb(var(--textColor1), 1);
        }
        &--no-pl &__no-playlist-msg {
            color: rgb(var(--textColor1), 0.6);
        }
        &--no-pl .img-bg, &--no-pl .blur-bg {
            display: none;
        }
        .img-bg, .blur-bg, .imag-bg-gradient {
            border-radius: 16.5px;
        }
        .img-bg {
            width: 96%;
            height: 96%;
            z-index: 0;
        }
        .img-bg-gradient {
            width: 100%;
            height: 100%;
            z-index: 1;
            background: linear-gradient(0deg, #080808 20%, transparent) !important;
        }
        .blur-bg {
            width: 100%;
            z-index: 2;
            background: rgba(17, 17, 17, 0.5);
        }
        .content-bg {
            position: relative;
            z-index: 3;
        }
        &__playlist-img {
            margin: 0px 15px 0px 0px;
            border-radius: 12px;
            object-fit: cover;
            width: 100%;
            aspect-ratio: 16 / 9;
        }
        &__playlist-details {
            margin-top: 10px;
            position: relative;
            padding-left: 4px;

            h3 {
                margin-bottom: 6px;
                font-weight: 400;
                font-size: 1.2rem;
                color: rgba(255, 255, 255, 0.4);
                display: none;
            }
        }
        &__playlist-title {
            margin-top: 15px;
            max-height: 40px;
            overflow: hidden;
            font-size: 1.4rem;
            font-weight: 400;
        }
        &__playlist-description {
            margin-top: 19px;
            width: 95%;
            overflow: hidden;
            position: relative;
            font-size: 1.06rem;
            color: rgb(255, 255, 255, 0.54);
        }
        &__playlist-metadata {
            margin-top: 6px;
            width: 100%;
            @include flex-container(center, flex-start);

            span {
                font-size: 1.05rem;
                color: rgb(255, 255, 255, 0.4);
                @include elipses-overflow;
                max-width: 64%;

                &:first-child {
                    margin-right: 7px;
                }
            }
        }
        &__no-playlist-msg {
            font-weight: 600;
            font-size: 1.3rem;
            color: rgba(255, 255, 255, 0.5);
            @include abs-center;
            top: 45%;
        }
    }
    .recs {
        overflow: hidden;

        &__header {
            padding: 17px 0px 0px $recs-section-padding-left;
            h3 {
                font-size: 1.4rem;
            } 
        }
        &__copy {
            margin: 3px 0px 7px 0px;
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
        &__groups-list-user-pl-tab {
            padding-right: 5px;
            margin-right: 8px;
            position: relative;

            .divider {
                @include pos-abs-top-right-corner(-5px, 0px);
                height: 12px;
                width: 1px;
                background-color: rgba(var(--textColor1), 0.1);

            }
        }
        /* Horizontal Carousel Tab Container */
        &__groups-list-container {
            position: relative;
            z-index: 0;
            width: 100%;
            overflow-x: scroll;
            
            .gradient-container {
                width: 45px;
                height: 40px;
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
            overflow-x: scroll;
            overflow-y: visible;
            scroll-behavior: smooth;
            height: 50px;
            padding-bottom: 10px;
            @include flex-container(center, _);
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
        /* Playlist List */
        &__playlists-list {
            margin-top: -15px;
            height: 90%;
            overflow-y: scroll;
            position: relative;
        }
        &__playlists-empty-txt {
            @include abs-center;
            top: 45%;
            font-size: 1.2rem;
            color: rgb(var(--textColor1), 0.6);
        }
        /* Playlist Item */
        &__playlist-item {
            transition: 0.1s ease-in-out;
            display: flex;
            overflow: hidden;
            padding: 20px 0px;
            position: relative;
            max-width: 100%;
            
            &--user-pl {
                padding: 15px 0px;
            }
            &--user-pl &-description {
                max-height: 15px;
                width: 85%;
                @include multi-line-elipses-overflow(1);

                &--skeleton {
                    width: 70%;
                }
                &-second-line {
                    display: none;
                }
            }
            &--user-pl &-img-container {
                min-width: 110px;
                width: 80px;
            }
            &:hover, &--chosen {
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
        }
        &__playlist-item-img-container {
            min-width: 150px;
            width: 150px;
            aspect-ratio: 16 / 9;
            margin: 0px 3% 0px 25px;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            &--skeleton {
                border-radius: 8px;
            }
        }
        &__playlist-item-title {
            margin-bottom: 4px;
            @include elipses-overflow;
            max-width: 90%;
            font-weight: 500;
            font-size: 1.25rem;

            &--skeleton {
                height: 14px;
                width: 30%;
                border-radius: 4px;
                margin-bottom: 10px;
            }
        }
        &__playlist-item-details {
            width: 80%;
            position: relative;
        }
        &__playlist-item-description {
            width: 90%;
            max-height: 33px;
            overflow: hidden;
            font-weight: 300;
            font-size: 1.1rem;
            @include multi-line-elipses-overflow(2);
            color: rgb(var(--textColor1), 0.6);

            &-second-line { // for skeleton only
                margin: 5px 0px 20px 0px;
                width: 40% !important;
            }

            &--skeleton {
                height: 10px;
                width: 80%;
                border-radius: 4px;
                
            }
        }
        &__playlist-item-vid-count, &__playlist-item-channel-details {
            @include pos-abs-bottom-left-corner(0px, 0px);
            margin-top: 12px;
            font-weight: 300;
            color: rgba(var(--textColor1), 0.4);
            font-size: 1.1rem;
            
            a, span {
                font-weight: 300;
                color: rgba(var(--textColor1), 0.4);
            }

            &--skeleton {
                height: 10px;
                width: 50px !important;
                border-radius: 4px;
            }
        }
    }

    @include mq-custom(max-width, $min-layout-cut-off) {
        .yt-settings {
            height: auto;
            &__content-container {
                flex-direction: column;
            }
            &__left {
                max-width: none;
                width: 100%;
                height: 400px;
                margin-bottom: $section-spacing;
            }
        }
        .recs {
            width: 100% !important;
            height: 1000px;
        }
    }
</style>