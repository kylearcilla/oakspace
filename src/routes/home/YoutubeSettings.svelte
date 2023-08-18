<script lang="ts">
	import { initOAuth2Client, initYtCreds, intUserYtData, resetYtUserData, saveYtCredentials, saveYtUserData } from "$lib/yt-api";
	import { colorThemeState, ytCredentials, ytUserData } from "$lib/store";
    import { clickOutside } from "../../lib/helper";
	import { onDestroy, onMount } from 'svelte';
    import ytRecsPlaylists from '$lib/data-yt-playlists'

    export let onNavButtonClicked: any;

    let isYtModalOpen = true;

    let ytUserAccountData: YoutubeUserData
    let selectedPlaylist: YoutubePlaylist
    let clickedPlaylistId = -1;
    let ytRecsPlaylistsIdx = 0
    let selectedGroupPlaylists = ytRecsPlaylists[ytRecsPlaylistsIdx].playlists

    let isScrollableLeft = false;
    let isScrollableRight = true;
    let groupTabList: HTMLElement;

    const SCROLL_STEP = 50
    const HORIZONTAL_TAB_COROUSEL_RIGHT_OFFSET = 30

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

    const closeModal = () => onNavButtonClicked("")

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
        saveYtUserData(ytUserAccountData!);
    }

    /* Horizontal Reccomendation Category Tab List */

    const handleShiftTabCategoryRight = () => groupTabList!.scrollLeft += SCROLL_STEP
    const handleShiftTabCategoryLeft = () => groupTabList!.scrollLeft -= SCROLL_STEP

    const handleScroll = (event: any) => {
        const scrollLeft = event.target.scrollLeft;
        const scrollWidth = event.target.scrollWidth;
        const clientWidth = event.target.clientWidth; // container width

        isScrollableLeft = scrollLeft > 0;
        isScrollableRight = scrollLeft + clientWidth < scrollWidth - HORIZONTAL_TAB_COROUSEL_RIGHT_OFFSET;


    }

    // right arrow disappears after a window resize if false even user can scroll right
    const handleResize = () => {
        const scrollLeft = groupTabList.scrollLeft;
        const scrollWidth = groupTabList.scrollWidth;
        const clientWidth = groupTabList.clientWidth;

        isScrollableRight = scrollLeft + clientWidth < scrollWidth;
    }

    onMount(() => {
        const savedYtCreds = localStorage.getItem('yt-credentials');
        const savedUserData = localStorage.getItem('yt-user-data');

        handleResize()
        
        if (savedYtCreds) {
            const ytCreds = JSON.parse(localStorage.getItem('yt-credentials')!);
            ytCredentials.set({ ...ytCreds });
        }
        if (savedUserData) {
            const ytData = JSON.parse(localStorage.getItem('yt-user-data')!);
            ytUserData.set({ ...ytData });
        }
        window.addEventListener("resize", handleResize);
    })
    onDestroy(() => window.removeEventListener("resize", handleResize))
</script>

<div class={`modal-bg ${isYtModalOpen ? "" : "modal-bg--hidden"}`}>
    <div use:clickOutside on:click_outside={closeModal} class="modal-bg__content modal-bg__content--overflow-y-scroll">
        <div class={`yt-settings ${ytUserAccountData.email == "" ? "yt-settings--min" : ""}`}>
            <div class="yt-settings__header">
                <h1 class="modal-bg__content-title">Youtube Settings</h1>
                <!-- <div class={`yt-icon ${ytUserAccountData.email == "" ? "" : "yt-icon--active"}`}>
                    <div class="yt-icon-fill"></div>
                    <i class="fa-brands fa-youtube header-icon"></i>
                </div> -->
            </div>
            <!-- Account Details -->
            <div class="yt-settings__top-row">
                <div class="account-details grid-section">
                    <div class="grid-section__header">
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
                </div>
                <!-- Chosen Playlist -->
                <div class={`chosen-playlist grid-section ${!selectedPlaylist ? "chosen-playlist--no-pl" : ""} ${isLightTheme ? "chosen-playlist--light-theme" : ""}`}>
                    <img class="img-bg" src={selectedPlaylist?.thumbnailURL} alt="chosen-playlist">
                    <div class={`blur-bg ${!selectedPlaylist ? "blur-bg--solid-color" : "blur-bg--blurred-bg"}`}></div>
                    <div class="content-bg">
                        <div class="grid-section__header">
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
            </div>
            <div class="yt-settings__bottom-row">
                <!-- User Playlists Section -->
                {#if ytUserAccountData?.email != ""}
                    <div class="user-playlists grid-section grid-section--no-padding">
                        <div class="user-playlists__header">
                            <div class="grid-section__header">
                                <h3>Playlists</h3>
                            </div>
                            {#if ytUserAccountData}
                                <span class="caption-4">
                                    {`${ytUserAccountData.playlists.length} ${ytUserAccountData.playlists.length > 1 ? "playlists" : "playlist"}`}
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
                <!-- Playlist Recommendations Section -->
                <div class={`recs ${ytUserAccountData.username === "" ? "recs--min" : ""} grid-section grid-section--no-padding`}>
                    <div class="grid-section__header">
                        <h3>Recommendations</h3>
                    </div>
                    <p class="recs__copy grid-section__copy paragraph-2">
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
                                    <p class={`recs__playlist-item-description  ${isLightTheme ? "--light-theme" : ""}`}>
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
            </div>
            <div class="yt-settings__padding"></div>
        </div>
    </div>
</div>

<style lang="scss">
    $section-spacing: 8px;
    $top-row-height: 170px;
    $bottom-row-height: 470px;

    $recs-section-padding-left: 25px;

    .modal {
        &--content {
            overflow: hidden;
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
        &__top-row {
            display: flex;
        }
        &__bottom-row {
            display: flex;
        }
    }

    /* Sections */
    .account-details {
        width: 40%;
        margin: 0px $section-spacing $section-spacing 0px;
        position: relative;
        height: 170px;
        
        h3 {
            margin-bottom: 20px;
            @include elipses-overflow;
        }
        h5 {
            color: rgb(var(--textColor1));
            @include elipses-overflow;
            margin-bottom: 3px
        }
        img {
            @include circle(40px);
            margin-right: 15px;
        }
        &__blank-img {
            @include circle(40px);
            margin-right: 15px;
            background-color: rgb(var(--fgColor4));
            filter: brightness(0.96);
        }
        &__section {
            margin-right: 15px;
            max-width: 100px;
            h3 {
                margin-bottom: 4px;
                white-space: nowrap
            }
            p {
                @include elipses-overflow;
                font-weight: 300;
                color: rgba(var(--textColor1), 0.7);
            }
        }
        &__btn-container {
            display: flex;
            button {
                margin-left: 12px;
            }
            @include pos-abs-bottom-right-corner(15px, 15px);
        }
    }
    .chosen-playlist {
        margin-bottom: $section-spacing;
        width: 60%;
        position: relative;
        color: rgb(var(--textColor1));
        height: 170px;

        &--light-theme h3 {
            color: rgba(var(--textColor2));
        }
        &--light-theme h4 {
            color: rgba(var(--textColor2), 0.9);
        }
        &--light-theme p {
            color: rgba(var(--textColor2), 0.65);
        }
        &--no-pl h3 {
            color: rgb(var(--textColor1));
        }
        &--no-pl .img-bg, &--no-pl .blur-bg {
            display: none;
        }

        h2 {
            color: rgb(var(--textColor1));
            margin-bottom: 5px;
        }
        .content-bg {
            padding-left: 20px;
        }
        &__playlist-img {
            margin: 10px 25px 0px 0px;
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
            color: rgb(var(--textColor1), 0.7);
        }
        &__playlist-vid-count {
            @include pos-abs-bottom-right-corner(20px, -30px);
        }
        &__no-playlist-msg {
            font-weight: 600;
            font-size: 1.3rem;
            color: rgba(var(--textColor1), 0.5);
            @include abs-center;
            top: 45%;
        }
    }
    .user-playlists {
        margin: 0px $section-spacing $section-spacing 0px;
        height: 470px;
        width: 45%;
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
                font-weight: 500;
            }
            .divider {
                margin: 0px 0px 0px -10px;
                width: 110%;
                height: 0.5px;
                background-color: rgba(var(--textColor1), 0.11);                
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
        height: 470px;
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
                margin-bottom: 5px;
                @include elipses-overflow;
                max-width: 90%;
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
            width: 140px;
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
            margin-top: 10px;

            a {
                font-weight: 600;
                text-decoration: none;
                color: rgba(var(--textColor1), 0.7);

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
            &__top-row, &__bottom-row {
                display: block;
            }
            &__padding {
                display: block;
                width: 100%;
                height: 20px;
            }
        }
        .account-details, .chosen-playlist, 
        .user-playlists, .recs {
            width: 100%;
        }
    }
</style>