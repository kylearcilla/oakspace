<script lang="ts">
    import { onDestroy, onMount } from 'svelte'
	import { musicPlayerStore, themeState, globalContext, musicDataStore, musicPlayerManager } from '$lib/store'

	import Logo from '../../components/Logo.svelte'
	import { msToHHMMSS } from '$lib/utils-date'
	import { MusicPlayerManager } from '$lib/music-player-manager'

    import { MusicPlatform, PlaybackGesture } from "$lib/enums"
	import type { MusicPlayer } from '$lib/music-player';

    let manager: MusicPlayerManager | null = null

    const LOGO_WIDTH = 19
    const BORDER_RADIUS = 100
    
    $: playerStore     = $musicPlayerStore
    $: mediaItem       = $musicPlayerStore?.mediaItem
    $: mediaCollection = $musicPlayerStore?.mediaCollection! as MediaCollection
    $: hasItemChanged  = $musicPlayerStore?.hasItemUpdated ?? false
    $: isDisabled      = $musicPlayerStore?.isDisabled ?? false
    $: isOnCooldown    = $musicPlayerManager?.onCooldown ?? false
    
    $: musicPlatform   = $musicDataStore?.musicPlatform

    let progressMs = 0
    let durationMs = -1

    // reactive statements with progresMS does not work
    musicPlayerManager.subscribe((data: MusicPlayerManagerState | null) => {
        if (!data || musicPlatform === MusicPlatform.AppleMusic) return
        
        progressMs = data!.progressMs
        durationMs = data!.durationMs
    })

    $: {
        onPlaybackUpdate($musicPlayerStore)
        onMediaItemUpdate($musicPlayerStore)
    }

    function onPlaybackUpdate (store: MusicPlayer | null) {
        if (!manager || !store) return
        manager!.onPlaybackUpdate(store)
    }
    function onMediaItemUpdate (store: MusicPlayer | null) {
        if (!manager || !store) return
        manager!.onMediaItemUpdate(store)
    }

    onMount(() => {
        manager = new MusicPlayerManager(musicPlatform!)

        if (manager) {
            window.addEventListener("resize", () => manager!.handleResize())
        }
    })
    onDestroy(() => {
        window.removeEventListener("resize", () => manager!.handleResize())
        manager!.quit()
    })
</script>


<svelte:window on:keyup={manager?.handleKeyUp} on:keydown={manager?.handleKeyDown} />

<div class={`music-player ${$globalContext.isLeftNarrowBarOpen ? "music-player--left-bar-open" : ""} ${playerStore?.doShowPlayer ? "" : "music-player--hidden"} ${!$themeState.isDarkTheme ? "music-player--solid-bg" : ""}`}>
    <div class="music-player__wrapper">
    <img class="img-bg" src={mediaItem?.artworkImgSrc} alt="track-artwork"/>
    <div class="blur-bg"></div>
    <div class="content-bg">
        <!-- svelte-ignore a11y-missing-attribute -->
        {#if mediaItem}
            <div class="music-player-track" title={`${mediaItem.name} – ${mediaItem.author}`}>
                <img class="music-player-track__art" src={mediaItem.artworkImgSrc} alt="">
                <div class="music-player-track__details">
                    <div class={`music-player-track__title-container ${$musicPlayerManager?.trackTitleElAnimationObj ? "music-player-track__title-container--masked" : ""}`}>
                        <h5 class="music-player-track__title"  id="track-title">
                            {mediaItem.name ?? ""}
                        </h5>
                    </div>
                    <div class={`music-player-track__artist-container ${$musicPlayerManager?.trackArtistElAnimationObj ? "music-player-track__artist-container--masked" : ""}`}>
                        <span 
                            class={`music-player-track__artist ${!$themeState.isDarkTheme ? "caption-2--light-theme" : ""}`} id="track-artist"
                        >
                            {mediaItem.author ?? mediaCollection?.description ?? ""}
                        </span>
                    </div>
                </div>
            </div>
        {/if}
        <div class="music-player-controls">
            <button 
                on:click={() => manager?.onPlaybackGesture(PlaybackGesture.SHUFFLE)} 
                class={`music-player-controls__shuffle-btn ${playerStore?.isShuffled ? "music-player-controls__shuffle-btn--isShuffled" : ""}`} 
                disabled={isDisabled || isOnCooldown}
            >
                    <i class="fa-solid fa-shuffle"></i>
            </button>
            <button 
                on:click={() => manager?.onPlaybackGesture(PlaybackGesture.SKIP_PREV)} 
                class={`music-player-controls__prev-btn ${$musicPlayerManager?.isPrevBtnActive ? "music-player-controls__prev-btn--active" : ""}`} 
                disabled={isDisabled || isOnCooldown}
            >
                    <i class="fa-solid fa-backward"></i>
            </button>
            <button 
                on:click={() => manager?.onPlaybackGesture(PlaybackGesture.PLAY_PAUSE)} 
                class={`music-player-controls__playback-btn ${$musicPlayerManager?.isPausePlayBtnActive ? "music-player-controls__playback-btn--active" : ""}`}
                disabled={isDisabled || isOnCooldown}
                >
                    <i class={`${playerStore?.isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}`}></i>
            </button>
            <button 
                on:click={() => manager?.onPlaybackGesture(PlaybackGesture.SKIP_NEXT)} 
                class={`music-player-controls__next-btn ${$musicPlayerManager?.isNextBtnActive ? "music-player-controls__next-btn--active" : ""}`} 
                disabled={isDisabled || isOnCooldown}
                >
                    <i class="fa-solid fa-forward"></i>
            </button>
            <button 
                on:click={() => manager?.onPlaybackGesture(PlaybackGesture.LOOP)} 
                class={`music-player-controls__repeat-btn ${playerStore?.isRepeating ? "music-player-controls__repeat-btn--isRepeating" : ""}`} 
                disabled={isDisabled || isOnCooldown}
                >
                    <i class="fa-solid fa-repeat"></i>
            </button>
        </div>
        <div class="music-player-progress-bar-wrapper">
            <div class="music-player-progress-bar-wrapper__playback-bar">
                {#if musicPlatform === MusicPlatform.AppleMusic}
                    <apple-music-progress 
                        style="width: 100%; font-size: 20px; margin-top: 12px; padding: 0px 18px 0px 10px;" 
                        theme="dark"
                    >
                    </apple-music-progress>
                {:else }
                    <div class="music-player-progress-bar-wrapper__time music-playback__time--elapsed">
                        {#if progressMs >= 0}
                            {msToHHMMSS(progressMs)}
                        {:else}
                            --:--
                        {/if}
                    </div>
                    <input
                        class="input-range"
                        id="playback-input"
                        on:input={() => manager?.trackProgressOnInput()}
                        on:change={() => manager?.trackProgressOnChange()}
                        on:mousedown={() => manager?.onInputMouseDown()}
                        on:mouseup={(e) => manager?.onInputMouseUp(e)}
                        value="0" type="range"
                        min="0" max="100" step="0.1"
                        disabled={hasItemChanged}
                    />
                    <div class="music-player-progress-bar-wrapper__time music-playback__time--total">
                        {#if durationMs >= 0}
                            {msToHHMMSS(durationMs)}
                        {:else}
                            --:--
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
        <div class="music-player-right-container">
            <div 
                class={`music-player-volume ${musicPlatform === MusicPlatform.Spotify ? "music-player-volume--disabled" : ""}`}
                title={`${musicPlatform === MusicPlatform.Spotify ? "Volume is unavailable for Spotify iFrame API." : ""}`}
            >
                {#if musicPlatform === MusicPlatform.AppleMusic}
                    <apple-music-volume style="width: 100%;" theme="dark"></apple-music-volume>
                {:else}
                    <button class="icon"><i class="fa-solid fa-volume-high"></i></button>
                    <input
                        class="input-range input-range--show-thumb"
                        id="volume-input"
                        value="90" type="range"
                        min="0" max="100"
                        step="0.1"
                        disabled={isDisabled}
                    />
                {/if}
            </div>
            <div class="music-player-context-container">
                {#if manager && manager.icon != null}
                    <Logo  
                        logo={manager.icon} 
                        options={{ 
                            containerWidth: `${LOGO_WIDTH}px`, borderRadius: `${BORDER_RADIUS}px`, ...manager.iconOptions 
                        }}
                    />
                {/if}
            </div>
        </div>
    </div>
    </div>
</div>

<style lang="scss">
    @import "../../scss/blurred-bg.scss";
    @import "../../scss/brands.scss";

    $media-container-width: 22%;
    $conrols-width: 22%;
    $volume-width: 10%;
    $icon-width: 10%;

    .music-player {
        min-width: 470px;
        height: 53px;
        width: 90%;
        max-width: 1100px;
        transition: 0.16s ease-in-out;
        align-items: center;
        display: flex;
        z-index: 200001;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid rgba(70, 70, 70, 0.3);
        position: fixed;
        left: 50%;
        bottom: 7px;
        transform: translate(-50%, 0%);
        
        &--left-bar-open {
            @include md(max-width) {
                width: 80%;
            }
        }
        &--hidden {
            display: none;
        }
        &--solid-bg {
            background: var(--muiscPlayerBgColor) !important;
            opacity: 1 !important;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            border: none;

            .img-bg {
                display: none;
            }
            .blur-bg {
                display: none;
            }
        }
        &__wrapper {
            width: 100%;
            height: 100%;
            position: relative;
            border-radius: 15px;
            overflow: hidden;
        }

        .img-bg {
            width: 99.8%; // avoid background img from peeking over the blurred bg
            height: 90%;
            border-radius: 20px;
        }
        .blur-bg {
            width: 100%;
            height: 100%;
            background: rgba(30, 30, 30, 0.4);
            backdrop-filter: blur(100px);
            -webkit-backdrop-filter: blur(100px);
            border-radius: 15px;
        }
        .content-bg {
            display: flex;
            padding: 10px 10px 12px 15px;
            border-radius: 15px;
        }
    }
    /* Left Section */
    .music-player-track {
        height: 100%;
        overflow: hidden;
        width: $media-container-width;
        @include flex(center, _);

        &__details {
            width: 75%;
            overflow: hidden;
            color: white;
            margin-top: -5px;
            position: relative;
            height: 35px;
        }
        &__title {
            &-container {
                height: 20px;
            }
            @include abs-top-left(5px, 0px);
            white-space: nowrap;
            width: auto;
            font-size: 1.1rem;
            padding: 0px 10px;
        }
        &__artist {
            &-container {
                height: 15px;
            }
            padding: 0px 10px;
            @include abs-bottom-left(1px, 0px);
            white-space: nowrap;
            width: auto;
            font-size: 0.95rem;
        }
        &__title-container, &__artist-container {
            &--masked {
                -webkit-mask-image: linear-gradient(90deg, transparent 5px, black 10px, black 80%, transparent 100%);
                mask-image: linear-gradient(90deg, transparent 2%, black 9%, black 80%, transparent 100%);
            }
        }
        &__art {
            width: 30px;
            aspect-ratio: 1 / 1;
        }
    }
    /* Music Controls */
    .music-player-controls {
        width: $conrols-width;
        min-width: 150px;
        max-width: 180px;
        margin: 0px 15px 0px 15px;

        @include flex(center, space-around);
        button {
            transition: 0s ease-in-out;
        }
        button:hover {
            filter: opacity(0.5);
        }
        button:enabled:active {
            transform: scale(0.9);
            transition: 0.12s ease-in-out;
        }
        &__prev-btn--active {
            transform: scale(0.82);
        }
        &__next-btn--active {
            transform: scale(0.82);
        }
        &__playback-btn {
            color: var(--muiscPlayerBgColor);
            background-color: white;
            border-radius: 100%;
            padding: 5px;
            @include circle(15px);
            @include flex(center, center);

            .fa-play {
                margin: 0px -2px 1px 0px;
            }

            &--active {
                transform: scale(0.9);
            }
        }
        &__shuffle-btn { 
            position: relative;
            &--isShuffled {
                &::after {
                    content: "";
                    position: absolute;
                    bottom: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    @include circle(2px);
                    background-color: white;
                }
            }
        }
        &__repeat-btn {
            position: relative;
            &--isRepeating {
                &::after {
                    content: "";
                    position: absolute;
                    bottom: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    @include circle(2px);
                    background-color: white;
                }
            }
        }
        @include sm(max-width) {
            justify-content: space-evenly;
            min-width: 130px;
            margin: 0px 0px;

            &__playback-btn {
                padding: 5px;
                @include circle(10px);
            }
        }
    }

    $time-width: 40px;
    $progress-bar-padding: 12px;

    /* Playback Bar */
    .music-player-progress-bar-wrapper {
        @include flex(center, center);
        flex: 1;

        &__playback-bar {
            width: 100%;
            display: flex;
            align-items: center;
            min-width: 100px;
            height: 23px;
            position: relative;

            input {
                width: calc(100% - ($time-width * 2) - ($progress-bar-padding * 2));
                margin: 0px $progress-bar-padding;
            }
        }
        &__time {
            width: $time-width;
            white-space: nowrap;
            @include center;
            @include text-style(0.88, 500, 1.1rem, "DM Sans");

            &:first-child {
                justify-content: flex-end;
            }
            &:last-child {
                justify-content: flex-start;
            }
        }

        @include sm(max-width) {
            width: 55%;
        }
    }
    /* Right Section */
    .music-player-right-container {
        @include flex(center, flex-end);

        @include sm(max-width) {
            width: 30px;
        }
    }
    .music-player-volume {
        @include flex(center, center);
        position: relative;
        margin-right: 5px;

        &--disabled {
            margin: 0px 0px 0px 5px;
            width: 26px;
        }
        &--disabled button {
            cursor: not-allowed;
            opacity: 0.15;
            margin-right: 0px !important;

            &:active {
                transform: scale(1);
            }
            i {
                font-size: 1.15rem;
            }

        }
        &--disabled .input-range {
            display: none;
        }
        
        button {
            font-size: 1rem;
            margin-right: 4px;
        }
        .input-range {
            min-width: 30px;

            &::-moz-range-thumb {
                @include circle(7px);
            }
            &::-webkit-slider-thumb {
                @include circle(7px);
            }
        }

        @include sm(max-width) {
            display: none;
        }
    }
    .music-player-context-container {
        height: 40px;
        @include flex(center, center);
        border-radius: 15px;
        padding: 7px 0px;
        transition: 0.15 ease-in-out;
        width: 35px;
    }
    .music-player-platform-logo {
        border-radius: 100%;
        margin-left: 11px;
    }
</style>