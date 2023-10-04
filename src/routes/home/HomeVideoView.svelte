<script lang="ts">
    import { onMount } from 'svelte'
	import { clickOutside } from "$lib/utils-general"
	import type { YoutubeUserData } from "$lib/youtube-data"
	import { logOutUser, loginUser } from "$lib/utils-youtube"
    import { ytPlayerStore, ytUserDataStore, themeState, homeViewLayout } from "$lib/store"
	import { ytPlayerErrorHandler } from '$lib/utils-youtube-player'

    let isPlaylistPrivate = false
    let doMinimizeYtPanel = false
    let isDropDownOpen = false
    let doHideMyPlaylists = true

    let options = ["Log In", "Show My Playlists"]

    /* Handle Options List */
    ytUserDataStore.subscribe((data: YoutubeUserData | null) => {
        if (!data?.email ) {
            options = ["Log In"]
        }
        else {
            options = ["Log In", `${doHideMyPlaylists ? "Show My Playlists" : "Hide My Playlists"}`]
        }
        options[0] = data ? "Log Out" : "Log In"
    })

    /* Handle Private Content Clicked Case */
    ytPlayerStore.subscribe(() => isPlaylistPrivate = ytPlayerErrorHandler(isPlaylistPrivate))

    /* UI Handlers */
    const handleDropdownOptionClicked = (index: number) => {
        isDropDownOpen = false
        if (index === 0 && $ytUserDataStore) {
            $ytUserDataStore ? loginUser() : logOutUser()
        } 
        else if (index === 1) {
            doHideMyPlaylists = !doHideMyPlaylists
            options[1] = options[1] === "Hide My Playlists" ? "Show My Playlists" : "Hide My Playlists"
        }
    }
    const handleChoosePlaylist = (playlist: YoutubePlaylist) => $ytPlayerStore?.playPlaylist(playlist)

    onMount(() => options[0] = localStorage.getItem('yt-pl') ? "Log Out" : "Log In")
</script>

<div class={`vid-view ${$homeViewLayout.isVideoViewOpen ? "" : "vid-view--hidden"}`}>
    <div class="vid-view__content">
        <!-- Video Player -->
        <div class={"vid-view__container"}>
            <div class={`vid-view__iframe-player-container ${isPlaylistPrivate ? "vid-view__iframe-player-container--private" : ""}`}>
                <div class="vid-view__iframe-player" id="home-yt-player"></div>
            </div>
            {#if !isPlaylistPrivate && $ytPlayerStore?.playlist === null}
                <div class="vid-view__empty-vid-view">
                    <p class="vid-view__empty-msg">No Playlist Selected</p>
                </div>
            {:else if isPlaylistPrivate}
                <div class="vid-view__empty-vid-view">
                    <div class="text-aln-center">
                        <h4 class="vid-view__empty-msg">Playlist / Video can't be played</h4>
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
        {#if $ytPlayerStore?.vid && !$ytPlayerStore?.error && !isPlaylistPrivate}
            <div class={`vid-details ${$themeState?.isDarkTheme ? "" : "vid-details--light-mode"}`}>
                <h3 class="vid-details__title">{$ytPlayerStore?.vid.title}</h3>
                <div class="vid-details__channel">
                    <img alt="channel-profile-img" src={$ytPlayerStore?.vid.channelImgSrc} />
                    <div class="vid-details__channel-details-container">
                        <a href={`https://www.youtube.com/channel/${$ytPlayerStore?.vid?.channelId}`} target="_blank" rel="noreferrer">
                            <span class="vid-details__channel-details-name">
                                {$ytPlayerStore?.vid.channelName}
                            </span>
                        </a>
                        <span class="vid-details__channel-details-subcount">
                            {$ytPlayerStore?.vid.channelSubs} Subscribers
                        </span>
                    </div>
                </div>
            </div>
        {/if}
        <!-- Playlist Panel -->
        <div class={`playlist-panel ${doMinimizeYtPanel ? "playlist-panel--small" : ""} ${$themeState?.isDarkTheme ? "playlist-panel--dark" : "playlist-panel--light"}`}>
            <!-- Content -->
            <div class="playlist-panel__content-container">
                <div class="playlist-panel__pl-details-wrapper">
                    <!-- Current Playlist Details -->
                    <div class="playlist-panel__pl-details">
                        <!-- Img -->
                        <div class={`playlist-panel__pl-details-img-container ${$ytPlayerStore?.playlist === null ? "playlist-panel__pl-details-img-container--empty" : ""}`}>
                            <img src={$ytPlayerStore?.playlist?.thumbnailURL} alt="pl-thumbnial"/>
                        </div>
                        <div class="playlist-panel__pl-details-right-wrapper">
                            <!-- Header -->
                            <div class="playlist-panel__pl-details-header">
                                <div class="playlist-panel__pl-details-header-yt-logo">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10" fill="none">
                                        <path d="M4.55664 2.15482H12.3763V7.83857H4.55664V2.15482Z" fill="white"/>
                                        <path 
                                            d="M13.7144 1.43472C13.5587 0.876183 13.1 0.436294 12.5176 0.287011C11.462 0.0157471 7.22909 0.0157471 7.22909 0.0157471C7.22909 0.0157471 2.99619 0.0157471 1.94054 0.287011C1.35815 0.436318 0.899471 0.876183 0.743792 1.43472C0.460938 2.44711 0.460938 4.55936 0.460938 4.55936C0.460938 4.55936 0.460938 6.67162 0.743792 7.68401C0.899471 8.24255 1.35815 8.66411 1.94054 8.81339C2.99619 9.08466 7.22909 9.08466 7.22909 9.08466C7.22909 9.08466 11.462 9.08466 12.5176 8.81339C13.1 8.66411 13.5587 8.24255 13.7144 7.68401C13.9972 6.67162 13.9972 4.55936 13.9972 4.55936C13.9972 4.55936 13.9972 2.44711 13.7144 1.43472ZM5.84469 6.47713V2.6416L9.38257 4.55941L5.84469 6.47713Z" 
                                            fill="#E75A5A"
                                        />
                                    </svg>
                                </div>
                                <!-- Title -->
                                <h1 class="playlist-panel__pl-details-title">
                                    {$ytPlayerStore?.playlist?.title ?? "No Playlist Chosen"}
                                </h1>
                            </div>
                            <!-- Description -->
                            <p class="playlist-panel__pl-details-description">
                                {#if $ytPlayerStore?.playlist != null}
                                    {$ytPlayerStore?.playlist?.description ?? "No Description"}
                                {:else}
                                    {"Pick a playlist to start watching"}
                                {/if}
                            </p>
                        </div>
                    </div>
                </div>
                <!-- User Playlists -->
                {#if $ytUserDataStore?.email && !doHideMyPlaylists}
                    <div class="playlist-panel__user-pls">
                        <div class="playlist-panel__user-pls-header">
                            <h1>My Playlists</h1>
                            <span>
                                {`${$ytUserDataStore?.userPlaylistLength} ${$ytUserDataStore?.userPlaylistLength === 1 ? "playlist" : "playlists"}`}
                            </span>
                        </div>
                        <ul class="playlist-panel__user-pls-list">
                            {#each $ytUserDataStore.userPlaylists as pl, idx}
                                <li on:dblclick={() => handleChoosePlaylist(pl)}>
                                    <div class="divider"></div>
                                    <div class="playlist-panel__user-pls-item">
                                        <div class="playlist-panel__user-pls-item-thumbnail-container">
                                            <img src={pl.thumbnailURL} alt="playlist-thumbnail">
                                        </div>
                                        <div class="playlist-panel__user-pls-item-details">
                                            <h5 class="playlist-panel__user-pls-item-details-title">{pl.title}</h5>
                                            <span class="playlist-panel__user-pls-item-details-count">
                                                {`${pl.vidCount} ${pl.vidCount === 1 ? "Item" : "Items"}`}
                                            </span>
                                            <p class="playlist-panel__user-pls-item-details-description">
                                                {pl.description === "" ? "No Description" : pl.description}
                                            </p>
                                        </div>
                                    </div>
                                    {#if idx + 1 === $ytUserDataStore.userPlaylists.length}
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">;
                        <g fill="none" stroke={`${$themeState.isDarkTheme ? "rgba(255, 255, 255, 0.55)" : "rgba(0, 0, 0, 0.35)"}`} stroke-linecap="round" transform="translate(1 10)">
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
</div> 

<style lang="scss">
    @import "../../scss/dropdown.scss";

    .vid-view {
        margin-top: 30px;
        position: relative;
        @include flex-container(center, center);

        &--hidden {
            display: none;
        }
        &__content {
            max-width: 1400px;
            width: 100%;
        }
        &__playlist-title {
            color: rgba(255, 255, 255, 0.9);
            float: right;
            @include pos-abs-top-right-corner(5px, 0px);
        }
        &__container {
            background-color: none;
            position: relative;
            aspect-ratio: 16 / 9;
            max-height: 500px;
            width: 100%;
            @include center;

            &--hidden {
                display: none;
            }
        }
        &__iframe-player-container {
            width: 100%;
            height: 100%;
            &--private {
                display: none;
            }
            #home-yt-player {
                background-color: var(--primaryBgColor);
            }
        }
        &__empty-msg {
            font-weight: 600;
            font-size: 1.4rem;
            color: rgb(var(--textColor1), 0.5);
            margin-bottom: 15px;
            z-index: 1000;
        }
        &__empty-vid-view {
            position: absolute;
            width: 100%;
            height: 100%;
            @include center;
            background-color: var(--midPanelBaseColor);
            a {
                padding-top: 20px;
                font-weight: 400;
                font-size: 1.2rem;
                color: #76B1FE;
            }
        }
    }
    .vid-details {
        width: 100%;

        &--light-mode &__title {
            font-weight: 700;
        }
        &--light-mode &__channel-details-subcount {
            font-weight: 500;
        }
        &__title {
            margin-top: 12px;
            color: rgba(var(--textColor1), 1);
            font-weight: 500;
        }
        &__channel {
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
        }
        &__channel-details-container {
            a {
                color: rgba(var(--textColor1), 0.7);
            }
            span {
                display: block;
            }
        }
        &__channel-details-name {
            color: rgba(var(--textColor1), 0.9);
            font-weight: 600;
            font-size: 1.1rem;
        }
        &__channel-details-subcount {
            color: rgba(var(--textColor1), 0.5);
            margin-top: 2px;
            font-weight: 400;
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
        
        /* Dark Theme */
        &--dark .divider {
            background-color: rgba(var(--textColor1), 0.05) !important;
        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        /* Light Theme */
        &--light {
            color: rgba(var(--textColor1), 0.9);
            border: var(--midPanelBorder);
        }
        &--light &__pl-details {
            &-title {
                font-weight: 600;
            }
            &-description {
                font-weight: 500;
            }
        }
        &--light &__user-pls {
            li:hover {
                background-color: rgba(150, 150, 150, 0.05);
            }
            &-header h1 {
                color: rgba(var(--textColor1), 0.9);
                font-weight: 600;
            }
            &-header span {
                color: rgba(var(--textColor1), 0.9);
                font-weight: 600;
            }
            &-item-details {
                &-title {
                    font-weight: 600;
                }
                &-count {
                    font-weight: 600;
                }
                &-description {
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
        &__pl-details-header-yt-logo {
            margin: 7px 8px 0px 0px;
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
            width: 100%;
            font-weight: 400;
            font-size: 1.3rem;
            margin: 5px 0px 4px 0px;
            @include elipses-overflow;
        }
        /* Current Playlist Description */
        &__pl-details-description {
            width: 90%;
            max-height: 40px;
            margin-top: 4px;
            font-weight: 300;
            font-size: 1.15rem;
            color: rgba(var(--textColor1), 0.6);
            @include elipses-overflow;
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
                font-weight: 500;
            }
            span {
                white-space: nowrap;
                font-weight: 400;
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
            &-title {
                font-size: 1.25rem;
                margin: 5px 0px 5px 0px;
                font-weight: 500;
                @include elipses-overflow;
            }
            &-count {
                color: rgba(var(--textColor1), 0.5);
                font-size: 1.1rem;
                font-weight: 300;
                @include pos-abs-top-right-corner(7px, 0px);
            }
            &-description {
                font-size: 0.95rem;
                max-width: 80%;
                @include elipses-overflow;
                color: rgba(var(--textColor1), 0.5);
                font-size: 1.1rem;
                font-weight: 300;
            }
        }
    }
</style>