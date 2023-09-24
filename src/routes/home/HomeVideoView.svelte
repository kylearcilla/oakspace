<script lang="ts">
	import { addCommasToNum, clickOutside, shorterNum } from "../../lib/utils-general";
	import { formatDateToMDY } from "../../lib/utils-date";
    import { currentYtVidId, ytUserData, ytCurrentVid, ytCredentials, colorThemeState, homeViewLaout } from "$lib/store";
	import { onDestroy, onMount } from 'svelte';
	import { getChannelDetails, getPlayListDetails, getVidDetails, initOAuth2Client, resetYtUserData, saveYtUserData } from "$lib/api-youtube";
	import { get } from "svelte/store";

    // @ts-ignore
    let player: YT.Player;
    let currentVidIdx = 0;
    let hasError = false
    
    let ytData: YoutubeUserData = {
        username: '',
        channelImgSrc: '',
        email: '',
        selectedPlaylist: null,
        playlists: []
    }
    let ytVidDetails: YoutubeVideo = {
        id: "",
        title: "",
        likeCount: 0,
        viewCount: 0,
        publishedAt: "",
        channelName: "",
        channelImgSrc: "",
        channelSubs: 0
    }

    let isLightTheme = false
    let isVidPlayerShown = false
    let isTaskMenuExpanded = true
    let isNavMenuExpanded = true
    let doMinimizeYtPanel = false
    let isDropDownOpen = false
    let doHideMyPlaylists = true

    const options = ["Log In", "Show My Playlists"]

    let plPanelElement: HTMLDivElement

    homeViewLaout.subscribe((data) => {
        isNavMenuExpanded = data.isNavMenuOpen
        isTaskMenuExpanded = data.isTaskMenuOpen
        handleResize()
    })
    colorThemeState.subscribe((theme) => {
        isLightTheme = !theme.isDarkTheme
    })
    currentYtVidId.subscribe((idx) => {
        currentVidIdx = idx
    })
    ytCurrentVid.subscribe((data: any) => {
        ytVidDetails = data
    })
    ytUserData.subscribe(async (data) => {
        if (data.username === "") {
            options[0] = "Log In"
        } else {
            options[0] = "Log Out"
        }
        if (!data.selectedPlaylist) {
            ytData = { ...ytData, ...data }
            player.stopVideo()
            hidePlaylist()
            return
        }

        const selectedPlaylistId = data.selectedPlaylist?.id ?? "No current selected playlist!"
        const hasUserToggledSettings = data.selectedPlaylist?.id === ytData.selectedPlaylist?.id
        const hasUserDeselectedPlaylist = !data.selectedPlaylist && ytData.selectedPlaylist
        const hasUserSelectedNewPlaylist = (data.selectedPlaylist?.id != ytData.selectedPlaylist?.id) && !hasUserDeselectedPlaylist
        
        ytData = { ...ytData, ...data }
        
        if (hasUserDeselectedPlaylist) {
            hidePlaylist()
        }
        if (hasUserSelectedNewPlaylist) {
            const res = await getPlayListDetails(selectedPlaylistId)
            const userHasSelectedPrivatePlaylist = res.error != null
            
            if (userHasSelectedPrivatePlaylist) {
                hasError = true;
                hidePlaylist();
                return;
            } else {
                currentVidIdx = -1
                hasError = false
                const vidId = res.items[0].snippet.resourceId.videoId;
                await updateVidDetails(vidId)
            }
        }
        if (selectedPlaylistId != "No current selected playlist!" && !hasUserToggledSettings) {
            if (player.stopVideo) player.stopVideo()
            showPlaylist()
            player.loadPlaylist({
                list: selectedPlaylistId,
                listType: "playlist",
                index: 0
            });
            isVidPlayerShown = true
        }
    })
    function showPlaylist() {
        const playerDiv = document.getElementById("player")!;
        playerDiv.style.display = "flex";
    }
    function hidePlaylist() {
        if (player && player.stopVideo) player.stopVideo()
        const playerDiv = document.getElementById("player")!;
        playerDiv.style.display = "none";

        isVidPlayerShown = false
    }
    
    // triggers when page reloads
    async function onReady() {
        if (!ytData.selectedPlaylist?.id) return 
        isVidPlayerShown = true

        // see if there was a saved vid index that user was watching before start off with that vid
        // otherwise default to first vid
        const startVidIdx = JSON.parse(localStorage.getItem("currentVidIdIndex") ?? "0");
        player.cuePlaylist({
            list: ytData.selectedPlaylist!.id,
            listType: "playlist",
            index: startVidIdx,
        });
        currentYtVidId.update(() => startVidIdx)
        
        // update vid details, show the saved vid, otherwise use the first vid as default
        const vidIdxWasSaved = localStorage.getItem("currentVidIdIndex");
        if (vidIdxWasSaved) {
            updateVidDetails(localStorage.getItem("currentVidId")!)
        } else {
            const res = await getPlayListDetails(ytData.selectedPlaylist!.id)
            const vidId = res.items[0].snippet.resourceId.videoId;
            updateVidDetails(vidId)
            localStorage.setItem("currentVidId", vidId)
        }
    }
    // triggers only when player plays a vid whose embed option has been disabled or is private
    function onError() {
    }
    // only triggers when user has clicked a new vid or new playlist
    async function onStateChange() {
        if (player.getPlaylistIndex() === currentVidIdx) return;
        currentYtVidId.update(() => player.getPlaylistIndex())
        
        localStorage.setItem("currentVidIdIndex", player.getPlaylistIndex())
        const vidId = player.getPlaylist()[player.getPlaylistIndex()]
        localStorage.setItem("currentVidId", vidId)
        updateVidDetails(vidId)
    }
    async function updateVidDetails(vidId: string) {
        const vidDetailsRes = await getVidDetails(vidId);
        const channelDetailsRes = await getChannelDetails(vidDetailsRes.items[0].snippet.channelId);

        const currentVidObject: any = {
            id: vidDetailsRes.items[0].id,
            title: vidDetailsRes.items[0].snippet.title,
            likeCount: shorterNum(vidDetailsRes.items[0].statistics.likeCount),
            viewCount: addCommasToNum(vidDetailsRes.items[0].statistics.viewCount),
            publishedAt: formatDateToMDY(vidDetailsRes.items[0].snippet.publishedAt),
            channelName: vidDetailsRes.items[0].snippet.channelTitle,
            channelImgSrc: channelDetailsRes.items[0].snippet.thumbnails.default.url,
            channelSubs: shorterNum(channelDetailsRes.items[0].statistics.subscriberCount)
        };

        ytCurrentVid.update(() => currentVidObject)
    }
    function initPlayer() {
        // @ts-ignore
        window.onYouTubeIframeAPIReady = () => {
            // @ts-ignore
            player = new YT.Player('player', {
                height: '100%',
                width: '100%',
                playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    rel: 0,
                    volume: 50
                },
                events: {
                    onReady: onReady,
                    onStateChange: onStateChange,
                    onError: onError,
                },
            });
        };
    }

    const togglePlPanelMenuDropDown = () => isDropDownOpen = !isDropDownOpen
    const handleDropdownOptionClicked = (index: number) => {
        isDropDownOpen = false

        if (index === 0 && ytData.email === "") {
            initOAuth2Client()
        } 
        else if (index === 0 && ytData.email != "") {
            resetYtUserData()
        }
        else if (index === 1) {
            doHideMyPlaylists = !doHideMyPlaylists
            options[1] = options[1] === "Hide My Playlists" ? "Show My Playlists" : "Hide My Playlists"
        }
    }
    const handleChoosePlaylist = (index: number) => {
        const newPlaylist = ytData.playlists[index]
        ytUserData.set({ ...ytData, selectedPlaylist: newPlaylist })
        saveYtUserData({ ...ytData, selectedPlaylist: newPlaylist })
    }
    function handleResize() {
        let isBothExpanded = isTaskMenuExpanded && isNavMenuExpanded
        let isBothMin = !isTaskMenuExpanded && !isNavMenuExpanded
        let isJustTaskViewExpanded =  !isNavMenuExpanded && isTaskMenuExpanded

        /* Both Closed */
        if (document.body.clientWidth < 600) {
            doMinimizeYtPanel = true
        }
        if (document.body.clientWidth >= 600 && isBothMin) {
            doMinimizeYtPanel = false
        }
        /* Both Open */
        if (document.body.clientWidth < 1100 && isBothExpanded) {
            doMinimizeYtPanel = true
        }
        if (document.body.clientWidth >= 1100 && isBothExpanded) {
            doMinimizeYtPanel = false
        }
        /* Just Task View Open */
        if (document.body.clientWidth < 850 && isJustTaskViewExpanded) {
            doMinimizeYtPanel = true
        }
        if (document.body.clientWidth >= 850 && isJustTaskViewExpanded) {
            doMinimizeYtPanel = false
        }
    }
    onDestroy(() => {
        window.removeEventListener("resize", handleResize)
        
        const playerDiv = document.getElementById("player")!
        if (playerDiv) playerDiv.remove()
    })
    onMount(() => {
        window.addEventListener("resize", handleResize)
        handleResize()

        if (localStorage.getItem('yt-user-data')) {
            const ytData = JSON.parse(localStorage.getItem('yt-user-data')!)
            ytUserData.set({ ...ytData })
            options[0] = "Log Out"
        }
        else {
            options[0] = "Log In"
        }
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'

        const ytScriptTag = document.getElementsByTagName('script')[0]
        ytScriptTag.id = "ytScriptTag"
        ytScriptTag!.parentNode!.insertBefore(tag, ytScriptTag)
        initPlayer()
    })
</script>

<div class="vid-view">
    <!-- Video Player -->
    <div class={`vid-view-container ${!isVidPlayerShown ? "vid-view-container--player-hidden" : ""}`}>
        <div id="player">
        </div>
        {#if !ytData.selectedPlaylist}
            <div class="vid-view-empty-vid-view">
                <p class="vid-view-empty-msg">No Playlist Selected</p>
            </div>
        {:else if hasError}
            <div class="vid-view-empty-vid-view">
                <div class="text-aln-center">
                    <p class="vid-view-empty-msg">Playlist / Video can't be played</p>
                        <a
                        class="vid-view-support-link"
                        target="_blank"
                        href="https://support.google.com/youtube/answer/97363?hl=en"
                        rel="noreferrer"
                        >
                        More info on unplayable embeded youtube content.
                    </a>
                </div>
            </div>
        {/if}
    </div>
    <!-- Video Details -->
    {#if ytData.selectedPlaylist?.id && !hasError}
        <div class={`vid-details-container ${isLightTheme ? "vid-details-container--light-mode" : ""}`}>
            <h3 class="vid-title">{ytVidDetails.title}</h3>
            <div class="vid-channel-details-container">
                <img alt="channel-profile-img" src={ytVidDetails.channelImgSrc} />
                <div class="vid-channel-details">
                    <span class="vid-channel-details__channel-name">{ytVidDetails.channelName}</span>
                    <span class="vid-channel-details__sub-count">
                        {ytVidDetails.channelSubs} Subscribers
                    </span>
                </div>
            </div>
        </div>
    {/if}
    <!-- Playlist Panel -->
    <div class={`playlist-panel 
                    ${(ytData?.username === "" || doHideMyPlaylists) ? "playlist-panel--my-pls-hidden" : ""}  
                    ${doMinimizeYtPanel ? "playlist-panel--small" : ""}
                    ${isLightTheme ? "playlist-panel--light" : "playlist-panel--dark"}
               `} 
        bind:this={plPanelElement}
    >
        <div class="playlist-panel__content-container">
            <!-- User Top -->
            <div class="playlist-panel__top">
                <!-- Left Side: Current Playlist -->
                <div class="playlist-panel__pl-details-wrapper">
                    <!-- Current Playlist Details -->
                    <div class="playlist-panel__pl-details">
                        <!-- Img -->
                        <div class={`playlist-panel__pl-details-img-container ${ytData.selectedPlaylist === null ? "playlist-panel__pl-details-img-container--empty" : ""}`}>
                            <img src={ytData?.selectedPlaylist?.thumbnailURL} alt="pl-thumbnial"/>
                        </div>
                        <!-- Details -->
                        <div class="playlist-panel__pl-details-right-wrapper">
                            <!-- Header -->
                            <div class="playlist-panel__pl-details-header">
                                <div class="playlist-panel__pl-details-header-yt-logo">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="9" viewBox="0 0 14 9" fill="none">
                                        <path d="M4.56592 2.23535H12.2325V7.66267H4.56592V2.23535Z" fill="white"/>
                                        <path d="M13.3099 1.51744C13.16 0.99611 12.7184 0.585525 12.1577 0.446187C11.1413 0.192993 7.06567 0.192993 7.06567 0.192993C7.06567 0.192993 2.9901 0.192993 1.97369 0.446187C1.41294 0.585547 0.971306 0.99611 0.821414 1.51744C0.549072 2.46239 0.549072 4.43393 0.549072 4.43393C0.549072 4.43393 0.549072 6.40547 0.821414 7.35042C0.971306 7.87175 1.41294 8.26523 1.97369 8.40457C2.9901 8.65777 7.06567 8.65777 7.06567 8.65777C7.06567 8.65777 11.1412 8.65777 12.1577 8.40457C12.7184 8.26523 13.16 7.87175 13.3099 7.35042C13.5823 6.40547 13.5823 4.43393 13.5823 4.43393C13.5823 4.43393 13.5823 2.46239 13.3099 1.51744ZM5.73272 6.22395V2.64392L9.13911 4.43398L5.73272 6.22395Z" fill="#DF6B6B"/>
                                        </svg>                                          
                                </div>
                                {#if ytData?.selectedPlaylist != null}
                                    <span class="playlist-panel__pl-details-header-vid-count">
                                        {`${ytData.selectedPlaylist.vidCount} ${ytData.selectedPlaylist.vidCount === 1 ? "Item" : "Items"}`}
                                    </span>
                                {/if}
                            </div>
                            <!-- Title -->
                            <div class="playlist-panel__pl-details-title">
                                <h1>{ytData?.selectedPlaylist?.title ?? "No Playlist Chosen"}</h1>
                            </div>
                            <!-- Description -->
                            <div class="playlist-panel__pl-details-description">
                                <p>
                                    {#if ytData?.selectedPlaylist != null}
                                        {ytData?.selectedPlaylist?.description ?? "No Description"}
                                    {:else}
                                        {"Pick a playlist to start watching"}
                                    {/if}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- User Playlists -->
            {#if ytData?.username != ""}
                <div class="playlist-panel__user-pls">
                    <div class="playlist-panel__user-pls-header">
                        <h1>My Playlists</h1>
                        <span>
                            {`${ytData.playlists.length} ${ytData.playlists.length === 1 ? "playlist" : "playlists"}`}
                        </span>
                    </div>
                    <ul class="playlist-panel__user-pls-list">
                        {#each ytData?.playlists as playlist, idx}
                            <li on:dblclick={() => handleChoosePlaylist(idx)}>
                                <div class="divider"></div>
                                <div class="playlist-panel__user-pls-item">
                                    <div class="playlist-panel__user-pls-item-thumbnail-container">
                                        <img src={playlist.thumbnailURL} alt="playlist-thumbnail">
                                    </div>
                                    <div class="playlist-panel__user-pls-item-details">
                                        <h2>{playlist.title}</h2>
                                        <span>
                                            {`${playlist.vidCount} ${playlist.vidCount === 1 ? "Item" : "Items"}`}
                                        </span>
                                        <p>{playlist.description === "" ? "No Description" : playlist.description}</p>
                                    </div>
                                </div>
                                {#if idx + 1 === ytData.playlists.length}
                                    <div class="divider"></div>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </div>
        <!-- Settings Btn -->
        <div class="playlist-panel__settings-btn-container">
            <button on:click={() => isDropDownOpen = !isDropDownOpen} class="playlist-panel__pl-details-header-settings-btn settings-btn dropdown">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <g fill="none" stroke={`${!isLightTheme ? "rgba(255, 255, 255, 0.55)" : "rgba(0, 0, 0, 0.35)"}`} stroke-linecap="round" transform="translate(1 10)">
                        <circle cx="2.5" cy="0.8" r="1.2"></circle>
                        <circle cx="8.5" cy="0.8" r="1.2"></circle>
                        <circle cx="14.5" cy="0.8" r="1.2"></circle>
                    </g>
                </svg>
            </button>
            <!-- Dropdown Menu -->
            {#if isDropDownOpen}
                <ul use:clickOutside on:click_outside={() => isDropDownOpen = false} class="dropdown-menu">
                    {#each options as option, idx} 
                        <li class="dropdown-menu__option">
                            <button class="dropdown-element" on:click={() => handleDropdownOptionClicked(idx)}>
                                <p>{option}</p>
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</div> 
<style lang="scss">
    .vid-view {
        margin-top: 30px;
        position: relative;

        &__playlist-title {
            color: rgba(255, 255, 255, 0.9);
            float: right;
            @include pos-abs-top-right-corner(5px, 0px);
        }
        .vid-view-container {
            background-color: none;
            position: relative;
            aspect-ratio: 16 / 9;
            max-height: 500px;
            width: 100%;
            @include center;
        }
        #player {
            // width: 100%;
            // max-height: 500px;
            background-color: var(--primaryBgColor);
            // display: flex;
        }
        .vid-view-empty-vid-view {
            position: absolute;
            width: 100%;
            height: 100%;
            @include center;
            background-color: var(--midPanelBaseColor);
        }
        .vid-view-empty-msg {
            font-weight: 600;
            font-size: 1.4rem;
            color: rgb(var(--textColor1), 0.5);
            margin-bottom: 15px;
            z-index: 1000;
        }
        .vid-view-support-link {
            padding-top: 20px;
            font-weight: 400;
            font-size: 1.2rem;
            color: #76B1FE;
        }
        .vid-view-refresh-button {
            font-weight: 700;
            font-size: 1rem;
            color: #999999;

            border-color: #999999;
            border-radius: 100px;

            &:hover {
                background-color: #999999;
                color: #181719;
            }

        }
        .vid-details-container {
            width: 100%;

            &--light-mode .vid-title {
                font-weight: 700;
            }
            &--light-mode .vid-channel-details__channel-name {
                font-weight: 600 !important;
            }
            &--light-mode .vid-channel-details__sub-count {
                font-weight: 400 !important;
            }

        }
        .vid-title {
            margin-top: 12px;
            color: rgba(var(--textColor1), 1);
            font-weight: 500;
        }
        .vid-channel-details-container {
            margin: 10px 0px 0px 0px;
            position: relative;
            width: 100%;
            @include flex-container(center, _);
            color: rgba(var(--textColor1), 0.7);
            
            img {
                border-radius: 100%;
                width: 25px;
                aspect-ratio: 1 / 1;
                margin-right: 10px;
            }
            .vid-channel-details {
                span {
                    display: block;
                }
                &__channel-name {
                    color: rgba(var(--textColor1), 0.9);
                    font-weight: 500;
                }
                &__sub-count {
                    color: rgba(var(--textColor1), 0.75);
                    margin-top: 2px;
                    opacity: 0.8;
                    font-weight: 300;
                }
            }
            .vid-like-count {
                position: absolute;
                top: 0px;
                right: 0px;
            }

        }
    }
    .playlist-panel {
        position: relative;
        margin: 25px 0px 160px 0px;
        border-radius: 15px;
        color: white;
        overflow: hidden;
        background-color: var(--midPanelBaseColor);
        overflow: visible;
        width: 100%;
        
        /* When Pls is Hidden */
        &--my-pls-hidden &__user-pls {
            display: none;
        }
        &--my-pls-hidden &__header-settings-btn {
            right: 0px;
        }
        /* Dark Theme */
        &--dark  {
            .divider {
                background-color: rgba(var(--textColor1), 0.05) !important;
            }
        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &--dark &__user-pls  {
            h1, h2 {
                font-weight: 400;
            }
            span {
                font-weight: 300;
            }
        }
        /* Light Theme */
        &--light {
            color: rgba(var(--textColor1), 0.9);
            border: var(--midPanelBorder);
        }
        &--light &__pl-details-right-wrapper {
            h1 {
                font-weight: 600;
            }
            p {
                font-weight: 500;
            }
            span {
                font-weight: 600;
            }
        }
        &--light &__user-pls {
            li:hover {
                background-color: rgba(150, 150, 150, 0.05);
            }
            &-header {
                h1 { 
                    color: rgba(var(--textColor1), 0.65);
                }
            }
            &-item-details {
                h2 {
                    font-weight: 100;
                }
                p {
                    font-weight: 500;
                }
                span {
                    color: rgba(var(--textColor1), 0.4);
                    font-weight: 500;
                }
            }
        }

        /* Containers */
        &__content-container {
            width: 100%;
            display: block;
            border-radius: 15px;
            overflow: hidden;
        }
        &__top {
            display: flex;
            width: 100%;
        }
        /* Playlist Details */
        &__pl-details-wrapper {
            width: 100%;
        }
        &__pl-details {
            display: flex;
            position: relative;
            padding: 10px 0px 10px 10px;
            width: 100%;
        }
        /* Img */
        &__pl-details-img-container {
            margin-right: 15px;
            min-width: 130px;
            max-width: 130px;
            aspect-ratio: 16 / 9;

            &--empty {
                background: rgba(50, 50, 50, 0.05);
                border-radius: 10px;
            }
            &--empty img {
                display: none;
            }
            img {
                width: 100%;
                border-radius: 10px;
                object-fit: cover;
            }
        }
        &__pl-details-right-wrapper {
            width: 100%;
        }
        /* Header */
        &__pl-details-header {
            position: relative;
            width: 98%;
            margin-top: 5px;
            @include flex-container(center, _);
            span {
                margin: 0px 0px 3px 7px;
                opacity: 0.7;
                font-weight: 300;
                white-space: nowrap;
            }
        }
        &__pl-details-title {
            position: relative;
            width: 100%;
            overflow: hidden;
            margin-top: 4px;
            h1 {
                width: 100%;
                font-weight: 400;
                font-size: 1.25rem;
                margin-bottom: 4px;
                @include elipses-overflow;
            }
        }
        /* Current Playlist Description */
        &__pl-details-description {
            width: 100%;
            p {
                width: 90%;
                max-height: 30px;
                margin-top: 1px;
                opacity: 0.5;
                font-weight: 300;
                font-size: 1.15rem;
                @include elipses-overflow;
            }
        }
        &__settings-btn-container {
            @include pos-abs-top-right-corner(5px, 5px);
            
            .dropdown-menu {
                @include pos-abs-top-right-corner(32px, 0px);
                width: 140px;

                &__option {
                    padding-right: 0px;
                }
            }
        }
        /* User Playlists */
        &__user-pls {
            width: 100%;
            background-color: var(--midPanelBaseColor);
            color: rgba(var(--textColor1), 0.9);
            
            ul {
                max-height: 400px;
                overflow-y: scroll;
                height: 40%;
                padding-bottom: 20px;
            }
            li {
                .divider {
                    margin: 0px;
                    height: 0.5px;
                    background-color: rgba(var(--textColor1), 0.08);
                }
                &:hover {
                    background-color: rgba(50, 50, 50, 0.1);
                }
                &:last-child {
                    margin-bottom: 30px;
                }
            }
        }
        &__user-pls-header {
            @include flex-container(center, space-between);
            padding: 15px 15px 12px 20px;
            h1 {
                font-size: 1.3rem;
                white-space: nowrap;
                margin-right: 10px;
            }
            span {
                white-space: nowrap;
                font-weight: 600;
                opacity: 0.7;
                display: block;
                font-size: 1.1rem;
            }
        }
        &__user-pls-item {
            display: flex;
            padding: 12px 10px 12px 20px;
        }
        &__user-pls-item-thumbnail-container {
            width: 140px;
            margin-right: 14px;
            max-width: 120px;
            img {
                width: 100%;
                margin-right: 10px;
                border-radius: 7px;
                aspect-ratio: 16 / 9;
            }
        }
        &__user-pls-item-details {
            position: relative;
            overflow: hidden;
            width: 100%;
            h2 {
                font-size: 1.25rem;
                margin: 5px 0px 5px 0px;
                font-weight: 600;
                @include elipses-overflow;
            }
            p {
                font-size: 0.95rem;
                max-width: 80%;
                @include elipses-overflow;
                color: rgba(var(--textColor1), 0.4);
                font-size: 1.1rem;
                font-weight: 300;
            }
            span {
                color: rgba(var(--textColor1), 0.3);
                font-size: 1.1rem;
                font-weight: 300;
                @include pos-abs-top-right-corner(7px, 0px);
            }
        }
    }
</style>