<script lang="ts">
    import { onDestroy, onMount } from 'svelte'
    import { MusicPlatform } from "$lib/enums"
	import type { MusicPlayer } from '$lib/music-player'
	import type { MusicData } from '$lib/music-data-apple'
	import { getSlidingTextAnimation, trackProgressHandler, volumeHandler } from '$lib/utils-music-player'
	import { musicPlayerStore, themeState, homeViewLayout, musicDataStore } from '$lib/store'
    
    let hasMediaEventHandlersSet = false
    let isPausePlayBtnActive = false
    let isPrevBtnActive = false
    let isNextBtnActive = false
    let playbackProgress = 0.1
    
    let trackPlaybackBar: HTMLInputElement
    let musicPlaybackBar: HTMLInputElement

    let trackTitleElement: HTMLElement
    let trackArtistNameElement: HTMLElement
    let trackTitleElAnimationObj: Animation | null
    let trackArtistElAnimationObj: Animation | null
    
    let ACTIVE_TO_INACTIVE_BTN_DEAY = 150

    /* Watch for music data & player state changes */
    musicDataStore.subscribe((data: MusicData | null) => {
        if (!data?.track) return

        trackTitleElAnimationObj?.cancel()
        trackArtistElAnimationObj?.cancel()
        
        requestAnimationFrame(() => { 
            trackTitleElAnimationObj = getSlidingTextAnimation(trackTitleElement)
            trackArtistElAnimationObj =  getSlidingTextAnimation(trackArtistNameElement)
        })
    })
    musicPlayerStore.subscribe((player: MusicPlayer | null) => {
        if (!player) return    
        if (player.state?.error) {
            console.error(player.state.error)
        }

        // when media is playing for this site
        if (navigator.mediaSession.metadata && !hasMediaEventHandlersSet) {
            initMediaSessionEventHandlers()
        }
    })

    /* Controls */
    const togglePlayback = () => $musicPlayerStore!.togglePlayback()
    const toggleRepeat = () => $musicPlayerStore!.toggleRepeat()
    const toggleShuffle = () => $musicPlayerStore!.toggleShuffle()
    const skipToNextSong = () => $musicPlayerStore!.skipToNextTrack()
    const skipToPreviousSong = () => $musicPlayerStore!.skipToPrevTrack()

    /* Player Event Listeners */
    const _trackProgressHandler = () => trackProgressHandler(trackPlaybackBar)
    const _volumeHandler = () => volumeHandler(musicPlaybackBar)

    const handleKeyUp = (event: KeyboardEvent) => {
        if (event.code !== "Space") return
        togglePlayback()
        isPausePlayBtnActive = false
    }
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code !== "Space") return
        isPausePlayBtnActive = true
    }
    const handleResize = () => {
        trackTitleElAnimationObj?.cancel()
        trackArtistElAnimationObj?.cancel()

        trackTitleElAnimationObj = getSlidingTextAnimation(trackTitleElement)
        trackArtistElAnimationObj =  getSlidingTextAnimation(trackArtistNameElement)
    }

    /* Media Session */
    const initMediaSessionEventHandlers = () => {
        hasMediaEventHandlersSet = true
        navigator.mediaSession.setActionHandler('play', () => { 
            isPausePlayBtnActive = true
            togglePlayback()

            setTimeout(() => isPausePlayBtnActive = false, ACTIVE_TO_INACTIVE_BTN_DEAY)
        })
        navigator.mediaSession.setActionHandler('pause', () => { 
            isPausePlayBtnActive = true
            togglePlayback()
            
            setTimeout(() => isPausePlayBtnActive = false, ACTIVE_TO_INACTIVE_BTN_DEAY)
        })
        navigator.mediaSession.setActionHandler('previoustrack', () => { 
            isPrevBtnActive = true
            skipToPreviousSong()

            setTimeout(() => isPrevBtnActive = false, ACTIVE_TO_INACTIVE_BTN_DEAY)
        })
        navigator.mediaSession.setActionHandler('nexttrack', () => { 
            isNextBtnActive = true
            skipToNextSong()

            setTimeout(() => isNextBtnActive = false, ACTIVE_TO_INACTIVE_BTN_DEAY)
        })
    }

    onMount(async () => {
        _trackProgressHandler()
        _volumeHandler()
        window.addEventListener("resize", handleResize)
    })
    onDestroy(() => window.removeEventListener("resize", handleResize))
</script>

<svelte:window on:keyup={handleKeyUp} on:keydown={handleKeyDown} />

<div class={`music-player ${$homeViewLayout.isNavMenuOpen ? "music-player--left-bar-open" : ""} ${$musicDataStore?.track ? "" : "music-player--hidden"} ${!$themeState.isDarkTheme ? "music-player--solid-bg" : ""}`}>
    <div class="music-player__wrapper">
    <img class="img-bg" src={$musicDataStore?.track?.artworkImgSrc} alt="track-artwork"/>
    <div class="blur-bg"></div>
    <div class="content-bg">
        <!-- svelte-ignore a11y-missing-attribute -->
        <div class="music-player-track" title={`${$musicDataStore?.track?.name} – ${$musicDataStore?.track?.artist}`}>
            <img class="music-player-track__art" src={$musicDataStore?.track?.artworkImgSrc} alt="">
            <div class="music-player-track__details">
                <h5 class="music-player-track__title" bind:this={trackTitleElement}>
                    {$musicDataStore?.track?.name ?? ""}
                </h5>
                <span class={`music-player-track__artist caption-2 ${!$themeState.isDarkTheme ? "caption-2--light-theme" : ""}`} bind:this={trackArtistNameElement}>
                    {$musicDataStore?.track?.artist ?? ""}
                </span>
            </div>
        </div>
        <div class="music-player-controls">
            <button 
                on:click={toggleShuffle} 
                class={`music-player-controls__shuffle-btn ${$musicPlayerStore?.state.isShuffled ? "music-player-controls__shuffle-btn--isShuffled" : ""}`} 
                disabled={$musicPlayerStore?.state.isDisabled}
            >
                    <i class="fa-solid fa-shuffle"></i>
            </button>
            <button 
                on:click={skipToPreviousSong} 
                class={`music-player-controls__prev-btn ${isPrevBtnActive ? "music-player-controls__prev-btn--active" : ""}`} 
                disabled={$musicPlayerStore?.state.isDisabled}
            >
                    <i class="fa-solid fa-backward"></i>
            </button>
            <button 
                on:click={togglePlayback} 
                class={`music-player-controls__playback-btn ${isPausePlayBtnActive ? "music-player-controls__playback-btn--active" : ""}`}
                disabled={$musicPlayerStore?.state.isDisabled}
                >
                    <i class={`${$musicPlayerStore?.state.isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}`}></i>
            </button>
            <button 
                on:click={skipToNextSong} 
                class={`music-player-controls__next-btn ${isNextBtnActive ? "music-player-controls__next-btn--active" : ""}`} 
                disabled={$musicPlayerStore?.state.isDisabled}
                >
                    <i class="fa-solid fa-forward"></i>
            </button>
            <button 
                on:click={toggleRepeat} 
                class={`music-player-controls__repeat-btn ${$musicPlayerStore?.state.isRepeating ? "music-player-controls__repeat-btn--isRepeating" : ""}`} 
                disabled={$musicPlayerStore?.state.isDisabled}
                >
                    <i class="fa-solid fa-repeat"></i>
            </button>
        </div>
        <div class="music-player-progress-bar-wrapper">
            <div class="music-player-progress-bar-wrapper__playback-bar">
                {#if $musicDataStore?.musicPlatform === MusicPlatform.AppleMusic}
                    <apple-music-progress style="width: 100%; font-size: 20px; margin-top: 12px;" theme="dark"></apple-music-progress>
                {:else }
                    <div class="music-player-progress-bar-wrapper__time music-playback__time--elapsed">2:45</div>
                    <input
                        class="input-range"
                        bind:this={trackPlaybackBar}
                        on:input={_trackProgressHandler}
                        value="90"
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                    />
                    <div class="music-player-progress-bar-wrapper__time music-playback__time--total">3:48</div>
                {/if}
            </div>
        </div>
        <div class="music-player-right-container">
            <div class="music-player-volume">
                {#if $musicDataStore?.musicPlatform === MusicPlatform.AppleMusic}
                    <apple-music-volume style="width: 100%;" theme="dark"></apple-music-volume>
                {:else }
                    <button class="icon"><i class="fa-solid fa-volume-high"></i></button>
                    <input
                        class="input-range input-range--show-thumb"
                        bind:this={musicPlaybackBar}
                        on:input={_volumeHandler}
                        value="90"
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                    />
                {/if}
            </div>
            <div class="music-player-context-container">
                {#if MusicPlatform[$musicDataStore?.musicPlatform ?? 0] === "Soundcloud"}
                    <div class="music-player-platform-logo platform-logo platform-logo--soundcloud platform-logo--med">
                        <i class="fa-brands fa-soundcloud fa-soundcloud--med"></i>
                    </div>
                {:else if MusicPlatform[$musicDataStore?.musicPlatform ?? 0] === "Youtube"}
                    <div class="music-player-platform-logo platform-logo platform-logo--youtube platform-logo--med">
                        <i class="fa-brands fa-youtube fa-youtube--med"></i>
                    </div>
                {:else if MusicPlatform[$musicDataStore?.musicPlatform ?? 0] === "AppleMusic"}
                    <div class="music-player-platform-logo platform-logo platform-logo--apple platform-logo--med">
                        <i class="fa-brands fa-itunes-note fa-itunes-note--med"></i>
                    </div>
                {:else if MusicPlatform[$musicDataStore?.musicPlatform ?? 0] === "Spotify"}
                    <div class="music-player-platform-logo platform-logo platform-logo--spotify platform-logo--med">
                        <i class="fa-brands fa-spotify fa-spotify--med"></i>
                    </div>
                {/if}
            </div>
        </div>
    </div>
    </div>
</div>

<style lang="scss">
    @import "../../scss/blurred-bg.scss";
    @import "../../scss/brands.scss";

    .music-player {
        bottom: 7px;
        min-width: 470px;
        height: 53px;
        position: fixed;
        width: 90%;
        max-width: 1100px;
        left: 50%;
        transition: 0.16s ease-in-out;
        transform: translate(-50%, 0%);
        align-items: center;
        display: flex;
        z-index: 2000;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid rgba(70, 70, 70, 0.3);
        
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
            padding: 10px 15px 12px 15px;
            border-radius: 15px;
        }
    }
    /* Left Section */
    .music-player-track {
        height: 100%;
        overflow: hidden;
        width: 22%;
        @include flex-container(center, _);

        &__details {
            width: 75%;
            overflow: hidden;
            color: white;
            margin-top: -5px;
            position: relative;
            height: 35px;
        }
        &__title {
            @include pos-abs-top-left-corner(5px, 0px);
            white-space: nowrap;
            width: auto;
            font-size: 1.1rem;
        }
        &__artist {
            @include pos-abs-bottom-left-corner(1px, 0px);
            white-space: nowrap;
            width: auto;
            font-size: 0.95rem;
        }
        &__art {
            width: 30px;
            aspect-ratio: 1 / 1;
            margin-right: 10px;
        }
    }
    /* Music Controls */
    .music-player-controls {
        min-width: 150px;
        margin: 0px 15px 0px 15px;

        @include flex-container(center, space-around);
        button {
            transition: 0.12s ease-in-out;
        }
        button:hover {
            filter: opacity(0.5);
        }
        button:enabled:active {
            transform: scale(0.9);
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
            @include flex-container(center, center);

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
    /* Playback Bar */
    .music-player-progress-bar-wrapper {
        @include flex-container(center, flex-end);
        width: 50%;
        padding-right: 2%;
        &__playback-bar {
            width: 95%;
            display: flex;
            align-items: center;
            min-width: 100px;
            height: 23px;

            input {
                margin: 0px 12px;
            }
        }
        &__time {
            width: 20px;
            font-size: 0.95rem;
            font-weight: 100;
        }

        @include sm(max-width) {
            width: 55%;
        }
    }
    /* Right Section */
    .music-player-right-container {
        width: 145px;
        @include flex-container(center, flex-end);

        @include sm(max-width) {
            width: 55px;
        }
    }
    .music-player-volume {
        @include flex-container(center, center);
        position: relative;
        margin-right: 5px;
        button {
            font-size: 0.8rem;
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
        @include flex-container(center, _);
        border-radius: 15px;
        padding: 7px 0px 7px 2px;
        transition: 0.15 ease-in-out;
    }
    .music-player-platform-logo {
        border-radius: 100%;
        margin-left: 11px;
    }
</style>