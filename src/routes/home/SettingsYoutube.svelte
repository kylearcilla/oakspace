<script lang="ts">
	import { initOAuth2Client, initYtCreds, intUserYtData, resetYtUserData, saveYtCredentials, saveYtUserData } from "$lib/api-youtube";
	import { colorThemeState, ytCredentials, ytUserData } from "$lib/store";
    import { clickOutside } from "../../lib/utils-general";
	import { onDestroy, onMount } from 'svelte';
    import ytRecsPlaylists from '$lib/data-yt-playlists'

    enum Modal { Settings, Youtube, Music, Stats, Appearance }
    export let onNavButtonClicked: (modal: Modal | null) => void

    let isYtModalOpen = true;
    let isUserProfileDropdownOpen = false

    let ytUserAccountData: YoutubeUserData
    let selectedPlaylist: YoutubePlaylist
    let clickedPlaylistId = -1;
    let ytRecsPlaylistsIdx = 0
    let selectedGroupPlaylists = ytRecsPlaylists[ytRecsPlaylistsIdx].playlists

    let isScrollableLeft = false;
    let isScrollableRight = true;
    let groupTabList: HTMLElement;

    const SCROLL_STEP = 50
    const TAB_SECTION_RIGHT_OFFSET = 30

    let isLightTheme = false

    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)
    ytUserData.subscribe((data: YoutubeUserData) => {
        ytUserAccountData = {
            ...ytUserAccountData,
            ...data
        }
        if (data.selectedPlaylist) {
            selectedPlaylist = data.selectedPlaylist
        }
    })

    /* Log In / Log Out */
    const handleYtSignUp = () => initOAuth2Client()
    const handleUnlinkCurrentYtAccount = () => resetYtUserData()

    /* Personal Playlist */
    const handleChoosePlaylist = (index: number) => {
        const newPlaylist = ytUserAccountData!.playlists[index]
        ytUserAccountData!.selectedPlaylist = newPlaylist
        ytUserData.set(ytUserAccountData!)
        saveYtUserData(ytUserAccountData!)
    }
    const handleRemoveChoosenPlaylist = () => {
        const newYtData = { ...ytUserAccountData!, selectedPlaylist: null }
        ytUserData.set(newYtData)
        localStorage.setItem('yt-user-data', JSON.stringify(newYtData));
    }

    /* Recommended Playlist */
    const handleRecTabBtnClicked = (index: number) => {
        ytRecsPlaylistsIdx = index
        selectedGroupPlaylists = ytRecsPlaylists[index].playlists
    }
    const handleChooseRecPlaylist = (event: MouseEvent, index: number) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'A') return
        
        const newPlaylist = ytRecsPlaylists[ytRecsPlaylistsIdx].playlists[index]
        ytUserAccountData!.selectedPlaylist = {
            id: newPlaylist.playlistId,
            title: newPlaylist.title,
            description: newPlaylist.playlistDescription,
            vidCount: newPlaylist.vidCount,
            channelId: "",
            thumbnailURL: newPlaylist.playlistThumbnailImgSrc,
            isRecPlaylist: true
        }
        ytUserData.set(ytUserAccountData!)
        saveYtUserData(ytUserAccountData!)
    }

    /* Horizontal Reccomendation Category Tab List */

    const handleShiftTabCategoryRight = () => groupTabList!.scrollLeft += SCROLL_STEP
    const handleShiftTabCategoryLeft = () => groupTabList!.scrollLeft -= SCROLL_STEP

    const handleScroll = (event: any) => {
        const scrollXOffSet = event.target.scrollLeft
        const windowWidth = event.target.clientWidth // container width
        const totalScrollableWidth = event.target.scrollWidth

        isScrollableLeft = scrollXOffSet > 0
        isScrollableRight = scrollXOffSet + windowWidth < totalScrollableWidth - TAB_SECTION_RIGHT_OFFSET
    }

    // right arrow disappears after a window resize if false even user can scroll right
    const handleResize = () => {
        const scrollXOffSet = groupTabList.scrollLeft
        const windowWidth = groupTabList.clientWidth
        const totalScrollableWidth = groupTabList.scrollWidth

        isScrollableRight = scrollXOffSet + windowWidth < totalScrollableWidth
    }

    onMount(() => {
        const savedYtCreds = localStorage.getItem('yt-credentials')
        const savedUserData = localStorage.getItem('yt-user-data')

        handleResize()
        
        if (savedYtCreds) {
            const ytCreds = JSON.parse(localStorage.getItem('yt-credentials')!)
            ytCredentials.set({ ...ytCreds })
        }
        if (savedUserData) {
            const ytData = JSON.parse(localStorage.getItem('yt-user-data')!)
            ytUserData.set({ ...ytData })
        }
        window.addEventListener("resize", handleResize);
    })
    onDestroy(() => window.removeEventListener("resize", handleResize))
</script>

<div class={`modal-bg ${isYtModalOpen ? "" : "modal-bg--hidden"}`}>
    <div use:clickOutside on:click_outside={() => onNavButtonClicked(null)} class="modal-bg__content modal-bg__content--overflow-y-scroll">
        <div class={`yt-settings ${isLightTheme ? "yt-settings--light" : ""} ${ytUserAccountData.email == "" ? "yt-settings--min" : ""}`}>
            <!-- Header -->
            <div class="yt-settings__header">
                <h1 class="modal-bg__content-title">Youtube Settings</h1>
                <div class="yt-settings__user-profile-container">
                    <button class="yt-settings__user-capsule" on:click={() => isUserProfileDropdownOpen = true}>
                        <img src={ytUserAccountData.channelImgSrc} alt="yt-profile" />
                        <span>{ytUserAccountData.username}</span>
                    </button>
                    {#if isUserProfileDropdownOpen}
                        <div class="yt-settings__user-profile" use:clickOutside on:click_outside={() => isUserProfileDropdownOpen = false} >
                            <div class="yt-settings__user-profile-img-container">
                                <img src={ytUserAccountData.channelImgSrc} alt="yt-profile" />
                            </div>
                            <div class="yt-settings__user-profile-details">
                                <div class="yt-settings__user-profile-details-header">
                                    Gmail Account
                                </div>
                                <span>
                                    {ytUserAccountData.email}
                                </span>
                                <div class="yt-settings__user-profile-details-header">
                                    Youtube Channel
                                </div>
                                <span>
                                    {ytUserAccountData.username}
                                </span>
                            </div>
                            <div class="yt-settings__user-profile-btns-container">
                                <button class="text-only"  on:click={handleYtSignUp}>
                                    Switch Account
                                </button>                                
                                <button class="text-only"  on:click={handleUnlinkCurrentYtAccount}>
                                    Log Out
                                </button>                                
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
            <!-- <div class="yt-settings__top-row"> -->
                <!-- <div class="account-details bento-box">
                    <div class="bento-box__header">
                        <h3>Account Details</h3>
                    </div>
                    <div class="flx flx--aln-center">
                        {#if ytUserAccountData.email != ""}
                            <img src={ytUserAccountData.channelImgSrc} alt="yt-profile" />
                        {:else}
                            <div class="account-details__blank-img"></div>
                        {/if}
                        <div class="account-details__section"> 
                            <h5>Gmail Account</h5>
                            <p>{ytUserAccountData.email === "" ? "- -" : ytUserAccountData.email}</p>
                        </div>
                        <div class="account-details__section"> 
                            <h5>Channel Name</h5>
                            <p>{ytUserAccountData.email === "" ? "- -" : ytUserAccountData.username}</p>
                        </div>
                    </div>
                    <div class="account-details__btn-container">
                        {#if ytUserAccountData.email != ""}
                            <button class="account-details__replace-btn text-only" 
                                on:click={handleYtSignUp}
                            >
                                Use a different account
                            </button>
                            <button class="account-details__unlink-btn text-only" 
                                on:click={handleUnlinkCurrentYtAccount}
                            >
                                Unlink Account
                            </button>
                        {:else}
                            <button class="account-details__link-btn text-only" 
                                on:click={handleYtSignUp}
                            >
                                Connect a Youtube account
                            </button>
                        {/if}
                    </div>
                </div> -->
            <!-- </div> -->
            <div class="yt-settings__content-container">
                <div class="yt-settings__left">
                    <!-- Chosen Playlist -->
                    <div class={`chosen-playlist bento-box ${!selectedPlaylist ? "chosen-playlist--no-pl" : ""}`}>
                        <img class="img-bg" src={selectedPlaylist?.thumbnailURL} alt="chosen-playlist">
                        <div class={`blur-bg ${!selectedPlaylist ? "blur-bg--solid-color" : "blur-bg--blurred-bg"}`}></div>
                        <div class="content-bg">
                            <div class="bento-box__header">
                                <h3>Chosen Playlist</h3>
                            </div>
                            {#if selectedPlaylist}
                                <div class="flx">
                                    <img class="chosen-playlist__playlist-img" src={selectedPlaylist?.thumbnailURL} alt="chosen-playlist">
                                    <div class="chosen-playlist__playlist-details">
                                        <h4>{selectedPlaylist?.title}</h4>
                                        <p class="chosen-playlist__playlist-description ">
                                            {selectedPlaylist?.description === "" ? "No Description" : selectedPlaylist?.description}
                                        </p>
                                        <p class="chosen-playlist__playlist-vid-count ">
                                            {`${selectedPlaylist?.vidCount == 1 ? "1 video" : selectedPlaylist?.vidCount > 50 ? "50+ videos" : selectedPlaylist?.vidCount + " videos" }`}
                                        </p>
                                    </div>
                                </div>
                            {:else}
                                <div class="chosen-playlist__no-playlist-msg">
                                    No Playlist Chosen
                                </div>
                            {/if}
                        </div>
                    </div>
                    <!-- User Playlists Section -->
                    {#if ytUserAccountData?.email != ""}
                        <div class={`user-playlists ${!isLightTheme ? "user-playlists--dark" : ""} bento-box bento-box--no-padding`}>
                            <div class="user-playlists__header">
                                <div class="bento-box__header">
                                    <h3>Playlists</h3>
                                </div>
                                {#if ytUserAccountData}
                                    <span>
                                        {`${ytUserAccountData.playlists.length} ${ytUserAccountData.playlists.length === 1 ? "playlist" : "playlists"}`}
                                    </span>
                                {/if}
                            </div>
                            <ul class="user-playlists__list">
                                <div class="user-playlists__list-header flx">
                                    <h6 class="user-playlists__list-header-num">#</h6>
                                    <h6 class="user-playlists__list-header-thumbnail">Thumnail</h6>
                                    <div class="user-playlists__list-header-title">
                                        <h6>Title</h6>
                                    </div>
                                    <div class="user-playlists__list-header-length">
                                        <h6>Length</h6>
                                    </div>
                                </div>
                                {#each ytUserAccountData.playlists as playlist, idx}
                                    <li on:dblclick={() => handleChoosePlaylist(idx)} 
                                        class={`user-playlists__list-item ${clickedPlaylistId === idx ? "user-playlists__list-item--clicked" : ""}  ${ytUserAccountData?.selectedPlaylist?.id === playlist.id ? "user-playlists__list-item--chosen" : ""} flx flx--algn-center`}>
                                        <div class="divider divider--thin divider--top"></div>
                                        <p class={`user-playlists__list-item-num  ${isLightTheme ? "" : ""}`}>{idx + 1}</p>
                                        <img src={`${playlist.thumbnailURL}`} alt="yt-profile-pic" />
                                        <div class="user-playlists__list-item-title">
                                            <p>{playlist.title}</p>
                                        </div>
                                        <div class="user-playlists__list-item-length">
                                            <p>{`${playlist.vidCount} video${playlist.vidCount != 1 ? "s" : ""}`}</p>
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
                </div>
                <!-- Playlist Recommendations Section -->
                <div class={`recs ${ytUserAccountData.username === "" ? "recs--min" : ""} bento-box bento-box--no-padding`}>
                    <div class="bento-box__header">
                        <h3>Recommendations</h3>
                    </div>
                    <p class="recs__copy bento-box__copy paragraph-2">
                        Discover new playlists with our staff recommended playlist picks!
                    </p>
                    <!-- Horizontal Tabs Carousel -->
                    <div class="recs__groups-list-container">
                        {#if isScrollableLeft}
                            <div class="gradient-container gradient-container--left">
                                <button class="recs__tab-arrow recs__tab-arrow--left icon-btn"
                                        on:click={handleShiftTabCategoryLeft}
                                >
                                    <i class="fa-solid fa-chevron-left"></i>
                                </button>
                            </div>
                        {/if}
                        <ul class="recs__groups-list" bind:this={groupTabList} on:scroll={handleScroll}>
                            <li><div class="recs__tab-group-padding recs__tab-group-padding--left"></div></li>
                            <!-- Tab Item -->
                            {#each ytRecsPlaylists as group, idx}
                                <li>
                                    <button 
                                        on:click={() => handleRecTabBtnClicked(idx)}
                                        class={`tab-btn ${isLightTheme ? "tab-btn--light-mode" : ""} ${idx === ytRecsPlaylistsIdx ? "tab-btn--selected" : ""}`}
                                    >
                                        {group.title}
                                    </button>
                                </li>
                            {/each}
                            <li><div class="recs__tab-group-padding recs__tab-group-padding--right"></div></li>
                        </ul>
                        {#if isScrollableRight}
                            <div class="gradient-container gradient-container--right">
                                <button class="recs__tab-arrow recs__tab-arrow--right icon-btn"
                                        on:click={handleShiftTabCategoryRight}
                                >
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        {/if}
                    </div>
                    <!-- Playlist Item List -->
                    <ul class="recs__playlists-list">
                        {#each selectedGroupPlaylists as playlist, idx}
                            <!-- Playlist Item -->
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <li class={`recs__playlist-item 
                                            ${playlist.playlistId === ytUserAccountData?.selectedPlaylist?.id ? "recs__playlist-item--selected " : ""}
                                      `} 
                                    on:dblclick={event => handleChooseRecPlaylist(event, idx)}
                            >
                                <img class="recs__playlist-item-img" src={playlist.playlistThumbnailImgSrc} alt="playlist-item-thumbnail"/>
                                <div class="recs__playlist-item-details">
                                    <h4 class="recs__playlist-item-title">{playlist.title}</h4>
                                    <p class="recs__playlist-item-description">
                                        {playlist.playlistDescription}
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
    </div>
</div>

<style lang="scss">
    $section-spacing: 8px;
    $recs-section-padding-left: 25px;

    .modal {
        &--content {
            overflow: hidden;
        } 
    }
    .modal-bg {
        &__content-title {
            font-size: 1.8rem;
            margin-bottom: 20px;
        }
    }
    .yt-settings {
        width: 82vw;
        height: 690px;
        min-width: 390px;
        max-width: 1000px;
        
        &--min {
            width: 70vw;
        }
        &--light .divider {
            background-color: rgba(var(--textColor1), 0.06);
            height: 1px !important;
        }
        &--light .recs, &--light .user-playlists {
            h4 {
                font-weight: 600;
            }
            p, span {
                font-weight: 600;
            }
            a {
                font-weight: 500;
            }
        }
        &--light .user-playlists {
            &__header {
                font-weight: 600;
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
            
            img {
                @include circle(23px);
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

        &--no-pl h3 {
            color: rgb(var(--textColor1));
        }
        &--no-pl .img-bg, &--no-pl .blur-bg {
            display: none;
        }

        h2 {
            margin-bottom: 5px;
        }
        .content-bg {
            padding-left: 20px;
        }
        &__playlist-img {
            margin: 10px 15px 0px 0px;
            width: 130px;
            border-radius: 4px;
        }
        &__playlist-details {
            margin-top: 5px;
            position: relative;
            width: 90%;
        }
        &__playlist-description {
            margin-top: 8px;
            width: 80%;
            max-height: 40px;
            overflow: hidden;
            color: rgb(255, 255, 255, 0.7);
        }
        &__playlist-vid-count {
            @include pos-abs-bottom-right-corner(20px, -20px);
            font-size: 1.15rem;;
            color: rgba(255, 255, 255, 0.7);
        }
        &__no-playlist-msg {
            font-weight: 600;
            font-size: 1.3rem;
            color: rgba(255, 255, 255, 0.5);
            @include abs-center;
            top: 45%;
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
            padding: 13px 20px 15px 20px;
            @include flex-container(center, space-between);

            span {
                color: rgb(var(--textColor1), 0.7);
            }
        }
        /* List Header */
        &__list-header {
            padding: 6px 0px 20px 6px;
            h6 {
                color: rgba(var(--textColor1), 0.72);
                @include elipses-overflow;
            }
        }
        &__list-header-num {
            margin-left: 19px;
            width: 25px;
        }
        &__list-header-thumbnail {
            min-width: 105px;
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
            margin-bottom: 15px;
            overflow-y: scroll;
            height: 90%;
        }
        &__list-inactive-msg {
            color: rgb(129, 129, 129);
            text-align: center;
        }
        &__list-item {
            position: relative;
            padding: 12px 0px 12px 6px;
            transition: 0.1s ease-in-out;
            color: rgba(var(--textColor1), 0.6);
            transition: 0.01s ease-in-out;
            @include elipses-overflow;

            &:last-child {
                margin-bottom: 30px;
            }
            &:hover, &--chosen {
                background-color: var(--hoverColor);
            }
            p {
                @include elipses-overflow;
                font-size: 1.1rem;
                font-weight: 300;
            }
            .divider {
                margin: 0px 0px 0px -10px;
                width: 110%;
                height: 0.5px;          
            }
        }
        &__list-item-num {
            margin-left: 19px;
            min-width: 25px;
        }
        img {
            width: 90px;
            border-radius: 2px;
            object-fit: cover;
            aspect-ratio: 16 / 9;
            margin-right: 15px;
        }
        &__list-item-title, &__list-item-length {
            width: 30%;
            overflow: hidden;
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
            &:hover > button {
                opacity: 0.8 !important;
                visibility: visible !important;
            }
        }
        &__groups-list {
            padding: 13px 0px;
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
            h3 {
                margin-bottom: 5px;
            }
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
            &:last-child {
                margin-bottom: 70px;
            }
            h4 {
                margin-bottom: 2px;
                @include elipses-overflow;
                max-width: 90%;
                font-weight: 500;
            }
            p {
                font-weight: 300;
            }
            h3 {
                @include elipses-overflow;
                color: rgb(var(--textColor1), 1);
            }
            .divider {
                @include pos-abs-bottom-left-corner(0px, 0px);
            }
        }
        &__playlist-item-img {
            min-width: 140px;
            margin: 0px 3% 0px 25px;
            object-fit: cover;
        }
        &__playlist-item-details {
            width: 60%;
        }
        &__playlist-item-description {
            width: 95%;
            max-height: 27px;
            overflow: hidden;
            @include multi-line-elipses-overflow(2);
            color: rgb(var(--textColor1), 0.6);
        }
        &__playlist-item-channel-details {
            @include flex-container(center, _);
            margin-top: 12px;

            a {
                font-weight: 400;
                text-decoration: none;
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