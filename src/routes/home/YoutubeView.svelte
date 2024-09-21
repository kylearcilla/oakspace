<script lang="ts">
    import { ytPlayerStore, themeState, globalContext } from "$lib/store"
	import { APIErrorCode, Icon } from '$lib/enums'
	import { toggleYoutubePlayerFloat } from "$lib/utils-home"
	import SvgIcon from "../../components/SVGIcon.svelte"

    export let type: "float" | "base" = "base"

    let doShowInvalidUI = false
    let doMinimizeYtPanel = false

    $: video        = $ytPlayerStore?.vid
    $: playlist     = $ytPlayerStore?.playlist
    $: isDarkTheme  = $themeState.isDarkTheme
    $: doShowPlayer = $ytPlayerStore?.doShowPlayer ?? true
    $: isFloating   = $globalContext.mediaPlayer?.youtube
    $: rightBarOpen = $globalContext.rightBarOpen
    $: hideDetails      = type === "float"
    $: showFloatScreen  = type === "base" && isFloating

    $: {
        const error: any  = $ytPlayerStore?.error
        const isInValidVid = error?.message === "Video couldn't be played due to privacy or embed playback restrictions."

        // only disable if playlist is unplayable
        if (error?.code === APIErrorCode.PLAYER_MEDIA_INVALID && !isInValidVid) {
            doShowInvalidUI = true
        }
        else {
            doShowInvalidUI = false
        }
    }
</script>

<div 
    class="vid-view" 
    class:vid-view--hidden={!doShowPlayer}
    class:vid-view--iframe-only={hideDetails}
    class:vid-view--right-bar-open={rightBarOpen}
>
    <div class="vid-view__content">
        <!-- Video Player -->
        <div class="vid-view__container">
            <div 
                class="vid-view__iframe-container"
                id="yt-iframe-container"
            >
            </div>
            {#if !doShowInvalidUI && playlist === null}
                <div class="vid-view__empty-vid-view">
                    <p class="vid-view__empty-msg">
                        No Playlist Selected
                    </p>
                </div>
            {:else if doShowInvalidUI}
                <div 
                    class="vid-view__empty-vid-view"
                    id="youtub"
                >
                    <div class="text-aln-center">
                        <h4 class="vid-view__empty-msg">
                            Playlist / video can't be played
                        </h4>
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
            {:else if showFloatScreen}
                <div class="vid-view__empty-vid-view">
                    <div class="text-aln-center">
                        <h4 class="vid-view__empty-msg">
                            Playing picture in picture
                        </h4>
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
         {#if playlist}
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
                                title="Toggle miniplayer"
                            >
                                <img src={playlist?.thumbnailURL} alt="pl-thumbnial"/>
                                <button 
                                    class="playlist-panel__miniplayer-btn"
                                    on:click={() => toggleYoutubePlayerFloat()}
                                >   
                                    <SvgIcon
                                        icon={Icon.MiniPlayer}
                                        options={{ 
                                            height: 15, width: 15, scale: 1, opacity: 1, color: "#FFFFFF"
                                        }}
                                    />
                                </button>
                            </div>
                            <div class="playlist-panel__pl-details-right-wrapper">
                                <!-- Header -->
                                <div class="playlist-panel__pl-details-header">
                                    <h1 class="playlist-panel__pl-details-title">
                                        {playlist?.title ?? "No Playlist Chosen"}
                                    </h1>
                                </div>
                                <!-- Description -->
                                <p class="playlist-panel__pl-details-description">
                                    {#if playlist != null}
                                        {playlist?.description ?? "No Description"}
                                    {:else}
                                        Pick a playlist to start watching
                                    {/if}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
         {/if}
    </div>
</div> 

<style lang="scss">
    @import "../../scss/dropdown.scss";
    
    .vid-view {
        @include abs-top-left(20px);
        position: relative;
        width: 100%;
        height: 100%;
        padding: 0px 0px 20px 0px;
        z-index: 1;

        &--hidden {
            display: none;
        }
        &--iframe-only {
            padding: 0px;
            @include abs-top-left;
        }
        &--iframe-only &__content {
            max-width: none;
            margin: auto;
            height: 100%;
            width: 100%;
        }
        &--iframe-only &__container {
            max-height: none;
            height: 100%;
            width: 100%;
            aspect-ratio: auto;
        }
        &--iframe-only .vid-details {
            display: none;
        }
        &--iframe-only .playlist-panel {
            display: none;
        }
        &__content {
            max-width: 1300px;
            width: 100%;
            margin: 0 auto;
        }
        &__playlist-title {
            color: rgba(255, 255, 255, 0.9);
            float: right;
            @include abs-top-right(5px);
        }
        &__iframe-container {
            width: 100%;
            height: 100%;
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
            @include multi-line-elipses-overflow(1);
            @include text-style(1, 500, 1.28rem);
        }
        &__channel {
            margin: 9px 0px 0px 0px;
            position: relative;
            width: 100%;
            color: rgba(var(--textColor1), 0.7);
            @include flex(center);
            
            img {
                border-radius: 100%;
                width: 30px;
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
            @include text-style(0.85, 500, 1.1rem);
        }
        &__channel-details-subcount {
            @include text-style(0.5, 400, 1rem);
            margin-top: 2px;
        }
    }
    .playlist-panel {
        position: relative;
        margin: 25px 0px 0px 0px;
        border-radius: 15px;
        overflow: hidden;
        background-color: var(--midPanelBaseColor);
        overflow: visible;
        width: 100%;
        border: 1px solid rgba(var(--textColor1), 0.03);
        
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
            padding: 7px 6.5px 7px 8px;
            width: 100%;
        }
        /* Img */
        &__pl-details-img-container {
            margin-right: 15px;
            min-width: 85px;
            height: 50px;
            position: relative;
            overflow: hidden;
            cursor: pointer;

            &:hover:after {
                opacity: 0;
                content: " ";
                border-radius: 10px;
                width: calc(100%);
                height: calc(100%);
                @include abs-top-left;
                background-color: rgba(black, 0.5);
            }
            &:hover:after {
                opacity: 1;
            }

            &--empty {
                background: rgba(50, 50, 50, 0.05);
                border-radius: 10px;
            }
            &--empty img {
                display: none;
            }
            img {
                width: 100%;
                height: 100%;
                border-radius: 9.5px;
                object-fit: cover;
                border: 2px solid white;
            }
        }
        &__pl-details-img-container:hover &__miniplayer-btn,
        &__miniplayer-btn:focus-visible {
            opacity: 1;
        }
        &__miniplayer-btn {
            opacity: 0;
            z-index: 1;
            width: 100%;
            height: 100%;
            @include abs-top-left;

            &:active {
                transform: scale(1) !important;
            }
        }
        &__pl-details-right-wrapper {
            width: 100%;
            min-width: 0px;
        }
        /* Header */
        &__pl-details-header {
            margin: 4px 0px 4px 0px;
            position: relative;
            width: 98%;
            @include flex(center);
        }
        &__pl-details-title {
            max-width: 60%;
            @include text-style(1, 500, 1.28rem);
            @include elipses-overflow;
        }
        /* Current Playlist Description */
        &__pl-details-description {
            width: 100%;
            max-height: 40px;
            min-width: 0px;
            max-width: 92%;
            @include text-style(0.58, 400, 1.2rem);
            @include elipses-overflow;
        }
    }

    @media (max-width: 540px) {
        .vid-view--right-bar-open .vid-details__channel {
            // display: none;
        }
        .vid-view--right-bar-open .playlist-panel {
            display: none;
            margin-top: 12px;
        }
    }
</style>