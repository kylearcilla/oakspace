<script lang="ts">
	import { appleMusicPlayerState, colorThemeState, curentPlaylist, currentTrack, homeViewLaout, musicDataStore, musicPlayerData } from '$lib/store'
    import { onDestroy, onMount } from 'svelte'
	import { AppleMusicPlayer } from '$lib/music-apple-player'
	import { MusicData } from "$lib/music-data-apple"
	import type { MusicPlayer } from '$lib/music-player'
	import { text } from 'svelte/internal';

    let musicPlayer: MusicPlayer
    let musicData: MusicData

    let playbackProgress = 0.1;

    let trackPlaybackBar: HTMLInputElement;
    let musicPlaybackBar: HTMLInputElement;

    let trackTitleElement: HTMLElement;
    let trackArtistNameElement: HTMLElement;
    let trackTitleElAnimationObj: Animation | null
    let trackArtistElAnimationObj: Animation | null

    const ANIMTION_SPEED = 12.55    // 12.55 px / sec
    const ANIMATION_PAUSE = 2       // When text hits left / right edge

    let currentTrackPlaying: any = {}
    let isPlayerAvailable = false
    let isPlaying = false
    let errorMessage = ""
    let isPlayerDisabled = true // empty state
    let isRepeating: boolean
    let isShuffled: boolean
    let inputRangeBgColor = "rgba(0, 0, 0, 0.51)"

    let isPausePlayBtnActive = false
    let isPrevBtnActive = false
    let isNextBtnActive = false

    enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }
    curentPlaylist.subscribe((collection: MusicCollection | null) => {
        if (!collection && musicPlayer) {
            musicPlayer.hideMusicPlayer()
        }
    })
    currentTrack.subscribe((track: Track | null) => {
        if (!track || track.id === currentTrackPlaying.id) return

        currentTrackPlaying = track

        trackTitleElAnimationObj?.cancel()
        trackArtistElAnimationObj?.cancel()
        
        requestAnimationFrame(() => { 
            trackTitleElAnimationObj = attachSlideAnimation(trackTitleElement)
            trackArtistElAnimationObj =  attachSlideAnimation(trackArtistNameElement)
        })
    })
    musicPlayerData.subscribe((player: MusicPlayerState | null) => {
        if (!player) return

        errorMessage = player.message
        isPlaying = player.isCurrentlyPlaying
        isPlayerAvailable = player.doShowPlayer
        isPlayerDisabled = player.isDisabled
        isRepeating = player.isRepeating
        isShuffled = player.isShuffled

        if (!navigator.mediaSession.metadata) {
            initMedisSessionEventHandlers()
        }
    })
    appleMusicPlayerState.subscribe((player: MusicPlayer) => musicPlayer = player)
    musicDataStore.subscribe((data: MusicData) => musicData = data)

    const trackProgressHandler = () => {
        const value = trackPlaybackBar.value;
        trackPlaybackBar.style.background = `linear-gradient(to right, white 0%, white ${value}%, ${inputRangeBgColor} ${value}%, ${inputRangeBgColor} 100%)`
    }
    const volumeHandler = () => {
        const value = musicPlaybackBar.value;
        musicPlaybackBar.style.background = `linear-gradient(to right, white 0%, white ${value}%, ${inputRangeBgColor} ${value}%, ${inputRangeBgColor} 100%)`
    }

    const togglePlayback = () => musicPlayer.togglePlayback()
    const toggleRepeat = () => musicPlayer.toggleRepeat()
    const toggleShuffle = () => musicPlayer.toggleShuffle()
    const skipToNextSong = () => musicPlayer.skipToNextTrack()
    const skipToPreviousSong = () => musicPlayer.skipToPrevTrack()


    const getAnimationDurationMs = (offsetWidth: number) => {
        const totalXOffsetDistance = offsetWidth * 2
        
        return (((totalXOffsetDistance / ANIMTION_SPEED) + (ANIMATION_PAUSE * 2)) * 1000) | 0
    }
    const getAnimationKeyFrames = (durationMs: number, offSet: number) => {
        const keyFrames = [
            { transform: 'translateX(0)', offset: 0 },
            { transform: `translateX(-${offSet}px)`, offset: 0 },  // move to the right
            { transform: `translateX(-${offSet}px)`, offset: 0 },  // pause at the right
            { transform: 'translateX(0)', offset: 0 },             // move to the left
            { transform: 'translateX(0)', offset: 0 },             // pause at the left
        ]

        const pauseIntervalPercentage = ((ANIMATION_PAUSE * 1000) / durationMs) * 100 
        const activeIntervalPercentage = (100 - (pauseIntervalPercentage * 2)) / 2

        let count = 0
        keyFrames.map((kf: any, idx: number) => {
            kf.offset = (count / 100)
            count += idx % 2 === 0 ? activeIntervalPercentage : pauseIntervalPercentage
        })

        keyFrames[4].offset = 1
        return keyFrames
    }
        
    const attachSlideAnimation = (textElement: HTMLElement): Animation | null => {
        const textContainerWidth = (textElement!.parentNode as HTMLElement).clientWidth

        let offSet = textElement.clientWidth - textContainerWidth
        offSet = offSet <= 0 ? 0 : offSet + 10

        if (offSet === 0) return null

        const durationMs = getAnimationDurationMs(offSet)
        const keyFrames = getAnimationKeyFrames(durationMs, offSet)

        const options = {
            delay: 3000,
            duration: durationMs,
            iterations: Infinity,
            easing: "linear"
        }
        return textElement.animate(keyFrames, options)
    }

    const initMedisSessionEventHandlers = () => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => { 
                isPausePlayBtnActive = true
                togglePlayback()

                setTimeout(() => isPausePlayBtnActive = false, 100)
            })
            navigator.mediaSession.setActionHandler('pause', () => { 
                isPausePlayBtnActive = true
                togglePlayback()
                
                setTimeout(() => isPausePlayBtnActive = false, 100)
            })
            navigator.mediaSession.setActionHandler('previoustrack', () => { 
                isPrevBtnActive = true
                skipToPreviousSong()

                setTimeout(() => isPrevBtnActive = false, 150)
            })
            navigator.mediaSession.setActionHandler('nexttrack', () => { 
                isNextBtnActive = true
                skipToNextSong()

                setTimeout(() => isNextBtnActive = false, 150)
            })
        }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
        if (event.code === "Space") {
            togglePlayback()
            isPausePlayBtnActive = false
        }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === "Space") {
            isPausePlayBtnActive = true
        }
    }
    const handleResize = () => {
        trackTitleElAnimationObj?.cancel()
        trackArtistElAnimationObj?.cancel()

        trackTitleElAnimationObj = attachSlideAnimation(trackTitleElement)
        trackArtistElAnimationObj =  attachSlideAnimation(trackArtistNameElement)
    }

    onMount(async () => {
        trackProgressHandler();
        volumeHandler();
        window.addEventListener("resize", handleResize)
        
        setTimeout(handleResize, 1000)

        // init player and data, which will also init settings
        const platformCode = localStorage.getItem("music-platform");
        if (!platformCode) return;
        
        if (platformCode === "0") {
            musicData = new MusicData(MusicPlatform.AppleMusic)
            await musicData.initMusicData()

            appleMusicPlayerState.set(new AppleMusicPlayer(musicData))
            musicDataStore.set(musicData)

            musicData.setUserPlaylists()
        }
    })
    onDestroy(() => window.removeEventListener("resize", handleResize))
</script>

<svelte:window on:keyup={handleKeyUp} on:keydown={handleKeyDown} />

<div class={`music-player ${$homeViewLaout.isNavMenuOpen ? "music-player--left-bar-open" : ""} ${isPlayerAvailable ? "" : "music-player--hidden"} ${!$colorThemeState.isDarkTheme ? "music-player--solid-bg" : ""}`}>
    <div class="music-player__wrapper">
    <img class="img-bg" src={currentTrackPlaying?.artworkImgSrc} alt="track-artwork"/>
    <div class="blur-bg"></div>
    <div class="content-bg">
        <!-- svelte-ignore a11y-missing-attribute -->
        <div class="music-player-track" title={`${currentTrackPlaying?.name} – ${currentTrackPlaying?.artist}`}>
            <img class="music-player-track__art" src={currentTrackPlaying?.artworkImgSrc} alt="">
            <div class="music-player-track__details">
                <h5 class="music-player-track__title" bind:this={trackTitleElement}>
                    {currentTrackPlaying?.name ?? ""}
                </h5>
                <span class={`music-player-track__artist caption-2 ${!$colorThemeState.isDarkTheme ? "caption-2--light-theme" : ""}`} bind:this={trackArtistNameElement}>
                    {currentTrackPlaying?.artist ?? ""}
                </span>
            </div>
        </div>
        <div class="music-player-controls">
            <button 
                on:click={toggleShuffle} 
                class={`music-player-controls__shuffle-btn ${isShuffled ? "music-player-controls__shuffle-btn--isShuffled" : ""}`} 
                disabled={isPlayerDisabled}
            >
                    <i class="fa-solid fa-shuffle"></i>
            </button>
            <button 
                on:click={skipToPreviousSong} 
                class={`music-player-controls__prev-btn ${isPrevBtnActive ? "music-player-controls__prev-btn--active" : ""}`} 
                disabled={isPlayerDisabled}
            >
                    <i class="fa-solid fa-backward"></i>
            </button>
            <button 
                on:click={togglePlayback} 
                class={`music-player-controls__playback-btn ${isPausePlayBtnActive ? "music-player-controls__playback-btn--active" : ""}`}
                disabled={isPlayerDisabled}
                >
                    <i class={`${isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}`}></i>
            </button>
            <button 
                on:click={skipToNextSong} 
                class={`music-player-controls__next-btn ${isNextBtnActive ? "music-player-controls__next-btn--active" : ""}`} 
                disabled={isPlayerDisabled}
                >
                    <i class="fa-solid fa-forward"></i>
            </button>
            <button 
                on:click={toggleRepeat} 
                class={`music-player-controls__repeat-btn ${isRepeating ? "music-player-controls__repeat-btn--isRepeating" : ""}`} 
                disabled={isPlayerDisabled}
                >
                    <i class="fa-solid fa-repeat"></i>
            </button>
        </div>
        <div class="music-player-progress-bar-wrapper">
            <div class="music-player-progress-bar-wrapper__playback-bar">
                {#if musicData?.musicPlatform === MusicPlatform.AppleMusic}
                    <apple-music-progress style="width: 100%; font-size: 20px; margin-top: 12px;" theme="dark"></apple-music-progress>
                {:else }
                    <div class="music-player-progress-bar-wrapper__time music-playback__time--elapsed">2:45</div>
                    <input
                        class="input-range"
                        bind:this={trackPlaybackBar}
                        on:input={trackProgressHandler}
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
                {#if musicData?.musicPlatform === MusicPlatform.AppleMusic}
                    <apple-music-volume style="width: 100%;" theme="dark"></apple-music-volume>
                {:else }
                    <button class="icon"><i class="fa-solid fa-volume-high"></i></button>
                    <input
                        class="input-range input-range--show-thumb"
                        bind:this={musicPlaybackBar}
                        on:input={volumeHandler}
                        value="90"
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                    />
                {/if}
            </div>
            <div class="music-player-context-container">
                <!-- <div class="divider divider--vertical"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" transform="translate(1 10)">
                        <circle cx="2" cy="0.8" r="1.2"></circle>
                        <circle cx="8" cy="0.8" r="1.2"></circle>
                        <circle cx="14" cy="0.8" r="1.2"></circle>
                    </g>
                </svg> -->
                {#if MusicPlatform[musicData?.musicPlatform ?? 0] === "Soundcloud"}
                    <div class="music-player-platform-logo platform-logo platform-logo--soundcloud platform-logo--med">
                        <i class="fa-brands fa-soundcloud fa-soundcloud--med"></i>
                    </div>
                {:else if MusicPlatform[musicData?.musicPlatform ?? 0] === "Youtube"}
                    <div class="music-player-platform-logo platform-logo platform-logo--youtube platform-logo--med">
                        <i class="fa-brands fa-youtube fa-youtube--med"></i>
                    </div>
                {:else if MusicPlatform[musicData?.musicPlatform ?? 0] === "AppleMusic"}
                    <div class="music-player-platform-logo platform-logo platform-logo--apple platform-logo--med">
                        <i class="fa-brands fa-itunes-note fa-itunes-note--med"></i>
                    </div>
                {:else if MusicPlatform[musicData?.musicPlatform ?? 0] === "Spotify"}
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
            @include pos-abs-top-left-corner(2.2px, 0px);
            white-space: nowrap;
            width: auto;
        }
        &__artist {
            @include pos-abs-bottom-left-corner(1px, 0px);
            white-space: nowrap;
            width: auto;
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