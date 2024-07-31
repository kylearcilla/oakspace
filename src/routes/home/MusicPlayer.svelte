<script lang="ts">
    import { onDestroy, onMount } from 'svelte'
	import { musicPlayerStore, musicDataStore, musicPlayerManager } from '$lib/store'

	import Logo from '../../components/Logo.svelte'
	import { msToHHMMSS } from '$lib/utils-date'
	import { MusicPlayerManager } from '$lib/music-player-manager'

    import { MusicPlatform, PlaybackGesture } from "$lib/enums"
	import type { MusicPlayer } from '$lib/music-player'
	import { INPUT_RANGE_BG_COLOR } from '$lib/utils-music-player'

    const LOGO_WIDTH = 19
    const BORDER_RADIUS = 100

    let manager: MusicPlayerManager | null = null
    let musicPlayerRef: HTMLElement
    
    let timeTipWidth  = 0
    let timeTipLeft   = 0
    let progressMs    = 0
    let durationMs    = 0
    
    $: playerStore     = $musicPlayerStore
    $: mediaItem       = $musicPlayerStore?.mediaItem
    $: mediaCollection = $musicPlayerStore?.mediaCollection! as MediaCollection
    $: hasItemChanged  = $musicPlayerStore?.hasItemUpdated ?? false
    $: isSeeking       = $musicPlayerManager?.isSeeking
    $: isDisabled      = $musicPlayerStore?.isDisabled ?? false
    $: isOnCooldown    = $musicPlayerManager?.onCooldown ?? false
    $: musicPlatform   = $musicDataStore?.musicPlatform

    $: {
        onPlaybackUpdate($musicPlayerStore)
        onMediaItemUpdate($musicPlayerStore)
    }

    // reactive statements with progresMS does not work
    musicPlayerManager.subscribe((data: MusicPlayerManagerState | null) => {
        if (!data || musicPlatform === MusicPlatform.AppleMusic) return
        
        progressMs = data!.progressMs
        durationMs = data!.durationMs
    })

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


<svelte:window 
    on:keyup={manager?.handleKeyUp} 
    on:keydown={manager?.handleKeyDown} 
/>

<div 
    class="mp"
    class:mp--hidden={!playerStore?.doShowPlayer}
    class:mp--volume-hidden={musicPlatform === MusicPlatform.Spotify}
    style:--INPUT_RANGE_BG_COLOR={INPUT_RANGE_BG_COLOR}
    bind:this={musicPlayerRef}
>
    <div class="mp__wrapper">
        <img class="img-bg" src={mediaItem?.artworkImgSrc} alt="track-artwork"/>
        <div class="blur-bg"></div>
        <div class="content-bg">
            {#if mediaItem}
                <div class="mp-track" title={`${mediaItem.name} – ${mediaItem.author}`}>
                    <div class="mp-track__img-container">
                        <img 
                            class="mp-track__art" 
                            src={mediaItem.artworkImgSrc} 
                            alt="media"
                        >
                    </div>
                    <div class="mp-track__details">
                        <div 
                            class="mp-track__title-container"
                            class:mp-track__title-container--masked={$musicPlayerManager?.trackTitleElAnimationObj}
                        >
                            <div class="mp-track__title"  id="track-title">
                                {mediaItem.name ?? ""}
                            </div>
                        </div>
                        <div 
                            class="mp-track__artist-container"
                            class:mp-track__artist-container--masked={$musicPlayerManager?.trackArtistElAnimationObj}
                        >
                            <div class="mp-track__artist" id="track-artist">
                                {mediaItem.author ?? mediaCollection?.description ?? ""}
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
            <div class="mp-controls">
                <button 
                    class="mp-controls__shuffle-btn"
                    class:mp-controls__shuffle-btn--isShuffled={playerStore?.isShuffled}
                    disabled={isDisabled || isOnCooldown}
                    on:click={() => manager?.onPlaybackGesture(PlaybackGesture.SHUFFLE)} 
                >
                        <i class="fa-solid fa-shuffle"></i>
                </button>
                <button 
                    class="mp-controls__prev-btn"
                    class:mp-controls__prev-btn--active={$musicPlayerManager?.isPrevBtnActive}
                    disabled={isDisabled || isOnCooldown}
                    on:click={() => manager?.onPlaybackGesture(PlaybackGesture.SKIP_PREV)} 
                >
                        <i class="fa-solid fa-backward"></i>
                </button>
                <button 
                    class="mp-controls__playback-btn"
                    class:mp-controls__playback-btn--active={$musicPlayerManager?.isPausePlayBtnActive}
                    disabled={isDisabled || isOnCooldown}
                    on:click={() => manager?.onPlaybackGesture(PlaybackGesture.PLAY_PAUSE)} 
                >
                        <i class={`${playerStore?.isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}`}></i>
                </button>
                <button 
                    class="mp-controls__next-btn"
                    class:mp-controls__next-btn--active={$musicPlayerManager?.isNextBtnActive}
                    disabled={isDisabled || isOnCooldown}
                    on:click={() => manager?.onPlaybackGesture(PlaybackGesture.SKIP_NEXT)} 
                >
                        <i class="fa-solid fa-forward"></i>
                </button>
                <button 
                    class="mp-controls__repeat-btn"
                    class:mp-controls__repeat-btn--isRepeating={playerStore?.isRepeating}
                    disabled={isDisabled || isOnCooldown}
                    on:click={() => manager?.onPlaybackGesture(PlaybackGesture.LOOP)} 
                >
                        <i class="fa-solid fa-repeat"></i>
                </button>
            </div>
            <div 
                class="mp-volume-container"
                class:mp-volume-container--disabled={musicPlatform === MusicPlatform.Spotify}
            >
                <div 
                    class={`mp-volume ${musicPlatform === MusicPlatform.Spotify ? "mp-volume--disabled" : ""}`}
                    title={`${musicPlatform === MusicPlatform.Spotify ? "Volume is unavailable for Spotify iFrame API." : ""}`}
                >
                    <button class="icon"><i class="fa-solid fa-volume-high"></i></button>
                    <input
                        class="input-range input-range--show-thumb"
                        id="volume-input"
                        value="90" type="range"
                        min="0" max="100"
                        step="0.1"
                        disabled={isDisabled}
                    />
                </div>
            </div>
        </div>
    </div>
    <div class="mp-progress">
        <div class="mp-progress__playback-bar">
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
            {#if durationMs > 0 && progressMs >= 0}            
                <div 
                    class="mp-progress__time-tip"
                    style:left={`calc(${(progressMs / durationMs) * 100}% - ${timeTipWidth / 2}px + -2px)`}
                    class:visible={isSeeking}
                    bind:clientWidth={timeTipWidth}
                >
                    <div class="mp-progress__time">
                        {msToHHMMSS(progressMs)}
                    </div>
                    <div class="divider"></div>
                    <div class="mp-progress__time" style:opacity={0.5}>
                        {msToHHMMSS(durationMs)}
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../scss/blurred-bg.scss";
    @import "../../scss/brands.scss";

    .mp {
        width: 540px;
        height: 50px;
        transition: 0.16s ease-in-out;
        align-items: center;
        display: flex;
        z-index: 200001;
        overflow: visible;
        position: fixed;
        left: 50%;
        bottom: 10px;
        overflow: visible;
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
        &--volume-hidden &-track {
            width: 160px;
        }
        &__wrapper {
            border: 1.5px solid rgba(white, 0.06);
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            border-radius: 12px 13px 14px 12px;

        }
        .img-bg {
            width: 99.8%; // avoid background img from peeking over the blurred bg
            height: 90%;
            border-radius: 9px;
        }
        .blur-bg {
            width: 100%;
            height: 100%;
            background: rgba(30, 30, 30, 0.4);
            backdrop-filter: blur(100px);
            -webkit-backdrop-filter: blur(100px);
            border-radius: 5px;
        }
        .content-bg {
            display: flex;
            border-radius: 4px;
        }
    }
    /* Left Section */
    .mp-track {
        height: 100%;
        overflow: hidden;
        width: 140px;
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
            @include abs-top-left(5px);
            @include text-style(_, 500, 1.1rem);
            white-space: nowrap;
            width: auto;
            padding: 0px 10px;
        }
        &__artist {
            &-container {
                height: 15px;
            }
            @include abs-bottom-left(-1px);
            @include text-style(_, 500, 0.95rem);
            padding: 0px 10px;
            white-space: nowrap;
            width: auto;
            opacity: 0.3;
        }
        &__title-container, &__artist-container {
            &--masked {
                -webkit-mask-image: linear-gradient(90deg, transparent 5px, black 10px, black 80%, transparent 100%);
                mask-image: linear-gradient(90deg, transparent 2%, black 9%, black 80%, transparent 100%);
            }
        }
        &__img-container {
            aspect-ratio: calc(1 / 1);
            height: 37px;
            margin-left: 5px;
        }
        &__art {
            border-radius: 7px;
            width: 100%;
            height: 100%;
        }
    }
    /* Music Controls */
    .mp-controls {
        flex: 1;
        padding: 0px 35px 0px 35px;
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
            &--isRepeating::after {
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

    $time-width: 40px;
    $progress-bar-padding: 12px;

    /* Playback Bar */
    .mp-progress {
        @include abs-top-left(-0.5px, 9px);
        width: calc(100% - 20px);
        flex: 1;

        &__playback-bar {
            width: 100%;
            display: flex;
            align-items: center;
            min-width: 100px;
            position: relative;
        }
        &__playback-bar input {    
            transition: ease-in-out 0.15s;
            height: 2px;
            background-color: var(--INPUT_RANGE_BG_COLOR);
            opacity: 0.1;
            
            &:hover {
                opacity: 1;
                height: 3px;
                top: -3px;
            }
            &:hover::-moz-range-thumb {
                @include circle(7px);
            }
            &:hover::-webkit-slider-thumb {
                @include circle(7px);
            }
        }
        &__time {
            white-space: nowrap;
            @include center;
            @include text-style(0.9, 400, 1.1rem, "DM Sans");
            border-radius: 10px;

            &:first-child {
                justify-content: flex-end;
            }
            &:last-child {
                justify-content: flex-start;
            }
        }
        &__time-tip {
            @include flex(center);
            @include abs-top-left(-30px, 0px);
            @include not-visible;
            background: var(--bg-3);
            transition: opacity 0.1s ease-in-out,
                        visibility 0.1s ease-in-out;
            border-radius: 20px;
            border: 1px solid rgba(white, 0.02);
            height: 23px;
            padding: 4px 8.5px;
        }
        &__time-tip .divider {
            @include divider(_, 70%, 1px);
            background-color: rgba(white, 0.09);
            margin: 0px 7px;
        }
    }
    /* Right Section */
    .mp-volume-container {
        @include flex(center);
        padding: 0px 25px 0px 8px;
        width: 120px;

        &--disabled {
            width: 90px;
            justify-content: flex-end;
            padding-right: 15px;
        }
    }
    .mp-volume {
        @include flex(center, center);
        position: relative;

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
    }
    .mp-context-container {
        display: none !important;
        height: 40px;
        @include flex(center, center);
        border-radius: 15px;
        padding: 7px 0px;
        transition: 0.15 ease-in-out;
        width: 35px;
    }

    @media (max-width: 660px) {
        .mp {
            width: 400px;
        }
        .mp-track {
            width: 120px;
        }
        .mp-controls {
            padding: 0px 12px 0px 12px;
        }
        .mp-right-container {
            width: 100px;
            padding: 0px 15px 0px 8px;
        }
    }
</style>