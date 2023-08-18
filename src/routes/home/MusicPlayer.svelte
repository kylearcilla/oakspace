<script lang="ts">
	import { appleMusicPlayerState, colorThemeState, currentTrack, musicDataState, musicPlayerData } from '$lib/store';
    import { onDestroy, onMount } from 'svelte';
    import Icon from '../../components/Icon.svelte';
	import { AppleMusicPlayer } from '$lib/AppleMusicPlayer';
	import { MusicData } from "$lib/MusicData";
	import type { MusicPlayer } from '$lib/MusicPlayer';

    let musicPlayer: MusicPlayer
    let musicData: MusicData

    let playbackProgress = 0.1;
    let trackPlaybackBar: HTMLInputElement;
    let musicPlaybackBar: HTMLInputElement;

    let currentTrackPlaying: any = {}
    let isPlayerAvailable = false
    let isPlaying = false
    let errorMessage = ""
    let isPlayerDisabled = true // empty state
    let isRepeating: boolean
    let isShuffled: boolean

    let hasColorTheme = false
    let inputRangeBgColor = "rgba(0, 0, 0, 0.51)"

    enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }

    let isLightTheme = false

    colorThemeState.subscribe((theme) => {
        isLightTheme = !theme.isDarkTheme
    })

    currentTrack.subscribe((track: Track | null) => {
        if (!track) return

        isPlayerDisabled = false
        currentTrackPlaying = track
    })
    musicPlayerData.subscribe((player: MusicPlayerData | null) => {
        if (!player) return
        
        errorMessage = player.message
        isPlaying = player.isCurrentlyPlaying
        isPlayerAvailable = player.doShowPlayer
        isPlayerDisabled = player.isDisabled

        isRepeating = player.isRepeating
        isShuffled = player.isShuffled
    })
    appleMusicPlayerState.subscribe((player: MusicPlayer) => musicPlayer = player)
    musicDataState.subscribe((data: MusicData) => musicData = data)

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

    onMount(async () => {
        trackProgressHandler();
        volumeHandler();

        // init player and data, which will also init settings
        const platformCode = localStorage.getItem("music-platform");
        if (!platformCode) return;
        
        if (platformCode === "0") {
            musicData = new MusicData(MusicPlatform.AppleMusic)
            await musicData.authUser()
            musicData.loadMusicData()
            musicData.setUserPlaylists()

            appleMusicPlayerState.set(new AppleMusicPlayer(musicData))
            musicDataState.set(musicData)
        }
    })
</script>

<div class={`music-player ${isPlayerAvailable ? "" : "music-player--hidden"} ${hasColorTheme ? "music-player--solid-bg" : ""}`}>
    <!-- svelte-ignore a11y-missing-attribute -->
    <div class="music-player-track">
        <img class="music-player-track__art" src={currentTrackPlaying?.artworkImgSrc} alt="" title={currentTrackPlaying?.name}>
        <div class="music-player-track__details">
            <h5 class="music-player-track__title">{currentTrackPlaying?.name ?? ""}</h5>
            <span class={`music-player-track__artist caption-2 ${isLightTheme ? "caption-2--light-theme" : ""}`}>
                {currentTrackPlaying?.artist ?? ""}sdfsdsd
            </span>
        </div>
    </div>
    <div class="music-player-playback__controls">
        <button 
            on:click={toggleShuffle} 
            class={`music-player-playback__shuffle-btn ${isShuffled ? "music-player-playback__shuffle-btn--isShuffled" : ""}`} 
            disabled={isPlayerDisabled}
        >
                <i class="fa-solid fa-shuffle"></i>
        </button>
        <button 
            on:click={skipToPreviousSong} 
            class="music-player-playback__prev-btn" 
            disabled={isPlayerDisabled}
        >
                <i class="fa-solid fa-backward"></i>
        </button>
        <button 
            on:click={togglePlayback} 
            class="music-player-playback__playback-btn" 
            disabled={isPlayerDisabled}
            >
                <i class={`${isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}`}></i>
        </button>
        <button 
            on:click={skipToNextSong} 
            class="music-player-playback__next-btn" 
            disabled={isPlayerDisabled}
            >
                <i class="fa-solid fa-forward"></i>
        </button>
        <button 
            on:click={toggleRepeat} 
            class={`music-player-playback__repeat-btn ${isRepeating ? "music-player-playback__repeat-btn--isRepeating" : ""}`} 
            disabled={isPlayerDisabled}
            >
                <i class="fa-solid fa-repeat"></i>
        </button>
    </div>
    <div class="music-player-playback__bar-container">
        <div class="music-player-playback__playback-bar">
            {#if musicData?.musicPlatform === MusicPlatform.AppleMusic}
                <apple-music-progress style="width: 100%; font-size: 20px; margin-top: 12px;" theme="dark"></apple-music-progress>
            {:else }
                <div class="music-player-playback__time music-playback__time--elapsed">2:45</div>
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
                <div class="music-player-playback__time music-playback__time--total">3:48</div>
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
            <div class="divider divider--vertical"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <g fill="none" stroke="currentColor" stroke-linecap="round" transform="translate(1 10)">
                    <circle cx="2" cy="0.8" r="1.2"></circle>
                    <circle cx="8" cy="0.8" r="1.2"></circle>
                    <circle cx="14" cy="0.8" r="1.2"></circle>
                </g>
            </svg>
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

<style lang="scss">
    .music-player {
        width: 100%;
        min-width: 470px;
        height: 60px;
        position: fixed;
        bottom: 0px;
        left: 50%;
        border-radius: 0px;
        transform: translate(-50%, 0%);
        align-items: center;
        padding: 10px 15px 12px 20px;
        display: flex;
        z-index: 2000;
        backdrop-filter: blur(100px);
        -webkit-backdrop-filter: blur(100px);
        background: var(--muiscPlayerBgColor);

        @include sm(max-width) {
            padding: 0px 10px;
        }
        &--hidden {
            display: none;
        }
        &--solid-bg {
            opacity: 1 !important;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }
    }
    /* Left Section */
    .music-player-track {
        height: 100%;
        overflow: hidden;
        width: 35%;
        margin-right: 5%;
        
        @include flex-container(center, _);

        &__details {
            width: 80%;
            overflow: hidden;
            color: rgb(var(--textColor2));
            margin-top: -5px;
        }
        &__title {
            width: 80%;
            margin: 5px 0px 0px 0px;
            @include elipses-overflow;            
        }
        &__artist {
            font-size: 0.9rem; 
            opacity: 0.7;
            @include elipses-overflow;            
        }
        &__art {
            width: 30px;
            height: 30px;
            aspect-ratio: 1 / 1;
            margin-right: 10px;
        }

        @include mq-custom(max-width, 870px) {
            width: 60%;
        }
    }
    /* Middle Section */
    .music-player-playback {
        display: flex;
        width: 100%;
        justify-content: center;
        margin-right: 15px;
        
        &__controls {
            width: 40%;
            @include flex-container(center, center);
            button {
                transition: 0.12s ease-in-out;
                margin-right: 12%;
                &:hover {
                    filter: opacity(0.5);
                }
            }
            button:enabled:active {
                transform: scale(0.9);
            }

            @include lg(min-width) {
                button {
                    margin-right: 30px;
                }
            }
            @include mq-custom(max-width, 870px) {
                width: 70%;
            }
        }
        &__prev-btn {
        }
        &__next-btn {
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
            @include sm(max-width) {
                @include circle(10px);
                i {
                    font-size: 0.8rem;
                }
            }
        }
        &__shuffle-btn { 
            position: relative;
            &--isShuffled {
                &::after {
                    content: "";
                    position: absolute;
                    bottom: 1px;
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
                    bottom: 1px;
                    left: 50%;
                    transform: translateX(-50%);
                    @include circle(2px);
                    background-color: white;
                }
            }
        }
        &__bar-container {
            @include flex-container(center, center);
            width: 100%;
        }
        &__playback-bar {
            width: 70%;
            display: flex;
            align-items: center;
            min-width: 100px;
            height: 23px;

            input {
                margin: 0px 12px;
            }
            
            @include sm(max-width) {
                width: 65%;
            }
            @include mq-custom(max-width, 870px) {
                width: 80%;
            }
        }
        &__time {
            width: 20px;
            font-size: 0.95rem;
            font-weight: 100;
        }
    }
    /* Right Section */
    .music-player-right-container {
        width: 30%;
        @include flex-container(center, flex-end);
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

        @include mq-custom(max-width, 870px) {
            button {
                margin-right: -3px;
            }
            .input-range {
                display: none;
            }
        }
    }
    .music-player-context-container {
        height: 40px;
        @include flex-container(center, _);
        border-radius: 15px;
        padding: 7px 0px 7px 2px;
        transition: 0.15 ease-in-out;

        .divider {
            margin-top: 4px;
            height: 50%;
            width: 0.5px;
            margin: 2px 17px 0px 15px;
            background-color: white;
        }

        @include mq-custom(max-width, 870px) {
            .divider {
                display: none;
            }
        }
    }
    .music-player-platform-logo {
        border-radius: 100%;
        margin-left: 11px;
    }
</style>