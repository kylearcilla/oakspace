<script lang="ts">
    import { onMount } from 'svelte'
    import { ytPlayerStore, themeState } from "$lib/store"
	import { APIErrorCode, LogoIcon } from '$lib/enums';
	import Logo from '../../components/Logo.svelte';

    let doShowInvalidUI = false
    let doMinimizeYtPanel = false

    $: video        = $ytPlayerStore?.vid
    $: playlist     = $ytPlayerStore?.playlist
    $: isDarkTheme  = $themeState.isDarkTheme
    $: doShowPlayer = $ytPlayerStore?.doShowPlayer ?? true

    $: {
        const error: any  = $ytPlayerStore?.error
        const isInValidVid = error?.message === "Video couldn't be played due to privacy or embed playback restrictions."

        // only disable if no playlist at all is unplayable
        if (error?.code === APIErrorCode.PLAYER_MEDIA_INVALID && !isInValidVid) {
            doShowInvalidUI = true
        }
        else {
            doShowInvalidUI = false
        }
    }
</script>

<div class="vid-view" class:vid-view--hidden={!doShowPlayer}>
    <div class="vid-view__content">
        <!-- Video Player -->
        <div class="vid-view__container">
            <div 
                class="vid-view__iframe-player-container"
                class:vid-view__iframe-player-container--container={doShowInvalidUI}
            >
                <div class="vid-view__iframe-player iframe-vid-player" id="home-yt-player"></div>
            </div>
            {#if !doShowInvalidUI && playlist === null}
                <div class="vid-view__empty-vid-view">
                    <p class="vid-view__empty-msg">No Playlist Selected</p>
                </div>
            {:else if doShowInvalidUI}
                <div class="vid-view__empty-vid-view">
                    <div class="text-aln-center">
                        <h4 class="vid-view__empty-msg">Playlist / video can't be played</h4>
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
        {#if video && !doShowInvalidUI}
            <div 
                class="vid-details"
                class:vid-details--light-mode={!isDarkTheme}
            >
                <h3 class="vid-details__title">
                    {video.title}
                </h3>
                <div class="vid-details__channel">
                    <img alt="channel-profile-img" src={video.channelImgSrc} />
                    <div class="vid-details__channel-details-container">
                        <a href={`https://www.youtube.com/channel/${video?.channelId}`} target="_blank" rel="noreferrer">
                            <span class="vid-details__channel-details-name">
                                {video.channelName}
                            </span>
                        </a>
                        <span class="vid-details__channel-details-subcount">
                            {video.channelSubs} Subscribers
                        </span>
                    </div>
                </div>
            </div>
        {/if}
        <!-- Playlist Panel -->
        <div 
            class="playlist-panel"
            class:playlist-panel--small={doMinimizeYtPanel}
            class:playlist-panel--light={!isDarkTheme}
            class:playlist-panel--dark={isDarkTheme}
        >
            <!-- Content -->
            <div class="playlist-panel__content-container">
                <div class="playlist-panel__pl-details-wrapper">
                    <!-- Current Playlist Details -->
                    <div class="playlist-panel__pl-details">
                        <!-- Img -->
                        <div 
                            class="playlist-panel__pl-details-img-container"
                            class:playlist-panel__pl-details-img-container--empty={playlist === null}
                        >
                            <img src={playlist?.thumbnailURL} alt="pl-thumbnial"/>
                        </div>
                        <div class="playlist-panel__pl-details-right-wrapper">
                            <!-- Header -->
                            <div class="playlist-panel__pl-details-header">
                                <div class="playlist-panel__pl-details-header-yt-logo">
                                    <Logo 
                                        logo={LogoIcon.Youtube} 
                                        options={{
                                            containerWidth: "15px",
                                            iconWidth: "80%"
                                        }}
                                    />
                                </div>
                                <!-- Title -->
                                <h1 class="playlist-panel__pl-details-title">
                                    {playlist?.title ?? "No Playlist Chosen"}
                                </h1>
                            </div>
                            <!-- Description -->
                            <p class="playlist-panel__pl-details-description">
                                {#if playlist != null}
                                    {playlist?.description ?? "No Description"}
                                {:else}
                                    {"Pick a playlist to start watching"}
                                {/if}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div> 

<style lang="scss">
    @import "../../scss/dropdown.scss";

    .vid-view {
        position: relative;
        @include abs-top-left(56px);
        width: 100%;
        height: 100%;
        padding: 0px 25px 20px 30px;
        z-index: 1;

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
            @include abs-top-right(5px, 0px);
        }
        &__container {
            background-color: none;
            position: relative;
            aspect-ratio: calc(16 / 9);
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
                background-color: var(--bg-1);
                border-radius: 7.5px;
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
            @include flex(center, _);
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
            padding: 6.5px;
            width: 100%;
        }
        &__pl-details-header-yt-logo {
            margin-right: 8px;
        }
        /* Img */
        &__pl-details-img-container {
            margin-right: 15px;
            max-width: 90px;
            min-width: 90px;

            &--empty {
                background: rgba(50, 50, 50, 0.05);
                border-radius: 10px;
            }
            &--empty img {
                display: none;
            }
            img {
                width: 100%;
                border-radius: 7px;
                object-fit: cover;
            }
        }
        &__pl-details-right-wrapper {
            width: 100%;
            min-width: 0px;
        }
        /* Header */
        &__pl-details-header {
            margin: 5px 0px 7px 0px;
            position: relative;
            width: 98%;
            @include flex(center, center);

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
            @include elipses-overflow;
        }
        /* Current Playlist Description */
        &__pl-details-description {
            width: 100%;
            max-height: 40px;
            min-width: 0px;
            font-weight: 300;
            font-size: 1.15rem;
            color: rgba(var(--textColor1), 0.6);
            @include elipses-overflow;
        }
    }
</style>