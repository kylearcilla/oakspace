<script lang="ts">
	import { appleMusicPlayerState, currentTrack, musicDataState, musicPlayerData } from '$lib/store';
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
    let isRepeating: any
    let isShuffled: false

    currentTrack.subscribe((data: any) => {
        if (!data.name) return

        isPlayerDisabled = false
        currentTrackPlaying = data
    })
    musicPlayerData.subscribe((error: any) => {
        errorMessage = error.message
        isPlaying = error.isCurrentlyPlaying
        isPlayerAvailable = error.doShowPlayer
        isPlayerDisabled = error.isDisabled

        isRepeating = error.isRepeating
        isShuffled = error.isShuffled
    })
    appleMusicPlayerState.subscribe((data: any) => {
        musicPlayer = data
    })
    musicDataState.subscribe((data: any) => {
        musicData = data
    })

    const trackProgressHandler = () => {
        const value = trackPlaybackBar.value;
        trackPlaybackBar.style.background = `linear-gradient(to right, white 0%, white ${value}%, #0C0C0C ${value}%, #0C0C0C 100%)`
    }
    const volumeHandler = () => {
        const value = musicPlaybackBar.value;
        musicPlaybackBar.style.background = `linear-gradient(to right, white 0%, white ${value}%, #0C0C0C ${value}%, #0C0C0C 100%)`
    }

    const togglePlayback = () => musicPlayer.togglePlayback()
    const toggleRepeat = () => musicPlayer.toggleRepeat()
    const toggleShuffle = () => musicPlayer.toggleShuffle()
    const skipToNextSong = () => musicPlayer.skipToNextTrack()
    const skipToPreviousSong = () => musicPlayer.skipToPrevTrack()

    onMount(async () => {
        const storedData = localStorage.getItem("music-context");
        if (!storedData) return;

        const res = JSON.parse(storedData);
        
        if (res.platform === "apple music") {
            musicData = new MusicData()
            await musicData.authUser()
            musicData.loadMusicData()
            musicData.setUserPlaylists()

            appleMusicPlayerState.set(new AppleMusicPlayer(musicData))
            musicDataState.set(musicData)
        }

        trackProgressHandler();
        volumeHandler();
    })
    onDestroy(() => console.log("HAAAAA"))
</script>

<div class={`music-player ${isPlayerAvailable ? "" : "music-player--hidden"}`}>
    <!-- svelte-ignore a11y-missing-attribute -->
    <div class="music-player-track">
        <img class="music-player-track__art" src={currentTrackPlaying.artworkImgSrc} alt="" title={currentTrackPlaying.name}>
        <div class="music-player-track__details">
            <h5 class="music-player-track__title elipses-overflow">{currentTrackPlaying.name}</h5>
            <p class="music-player-track__artist elipses-overflow">{currentTrackPlaying.artist}</p>
        </div>
    </div>
    <div class="music-player-playback">
        <div class="music-player-playback__container">
            <div class="music-player-playback__controls">
                <button on:click={toggleShuffle} class={`music-player-playback__shuffle-btn ${isShuffled ? "music-player-playback__shuffle-btn--isShuffled" : ""} icon-btn`} disabled={isPlayerDisabled}><i class="fa-solid fa-shuffle"></i></button>
                <button on:click={skipToPreviousSong} class="icon-btn" disabled={isPlayerDisabled}><i class="fa-solid fa-backward"></i></button>
                <button on:click={togglePlayback} class="music-player-playback__playback-btn icon-btn" disabled={isPlayerDisabled}><i class={`${isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}`}></i></button>
                <button on:click={skipToNextSong} class="icon-btn" disabled={isPlayerDisabled}><i class="fa-solid fa-forward"></i></button>
                <button on:click={toggleRepeat} class={`music-player-playback__repeat-btn ${isRepeating ? "music-player-playback__repeat-btn--isRepeating" : ""} icon-btn`} disabled={isPlayerDisabled}><i class="fa-solid fa-repeat"></i></button>
            </div>
            <div class="music-player-playback__bar-container">
                <div class="music-player-playback__playback-bar">
                    {#if musicData?.musicContext?.platform === "apple music"}
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
        </div>
    </div>
    <div class="music-player-right-container">
        <div class="music-player-volume">
            {#if musicData?.musicContext?.platform === "apple music"}
                <apple-music-volume style="width: 100%;" theme="dark"></apple-music-volume>
            {:else }
                <button class="icon-btn"><i class="fa-solid fa-volume-high"></i></button>
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
        <button class="music-player-context-container">
            <img src={currentTrackPlaying.playlistArtworkSrc} alt="playlist-artwork" title={currentTrackPlaying.playlistName}>
            <i class="fa-solid fa-list"></i>
        </button>
        <div class="music-player-platform-logo platform-logo platform-logo--soundcloud platform-logo--med">
            <i class="fa-brands fa-soundcloud"></i>
        </div>
    </div>
</div>

<style lang="scss">

    .music-player {
        width: 100%;
        height: 65px;
        position: fixed;
        bottom: 0px;
        padding: 10px 25px 12px 20px;
        display: flex;
        z-index: 2000;
        background: rgba(41, 41, 41, 0.6);
        box-shadow: 0px -7px 20px rgba(0, 0, 0, 0.24);
        backdrop-filter: blur(100px);
        -webkit-backdrop-filter: blur(100px);
        align-items: center;

        @include sm(max-width) {
            padding: 0px 10px;
        }

        &--hidden {
            display: none;
        }
    }
    .music-player-track {
        height: 100%;
        overflow: hidden;
        min-width: 150px;
        width: 35%;
        
        @include flex-container(center, _);
        @include sm(max-width) {
            min-width: 65px;
            width: 65px;
            img {
                width: 30px;
                height: 30px;
            }
        }

        &__details {
            width: 100%;
            overflow: hidden;
        }
        &__title {
            width: 100%;
            font-size: 1.1rem;
        }
        &__artist{
            margin-top: 4px;
            font-size: 0.9rem; 
            font-weight: 100;
            color: rgb(167, 166, 166);
        }
        &__art {
            width: 35px;
            height: 35px;
            aspect-ratio: 1 / 1;
            margin-right: 10px;
        }
    }
    .music-player-playback {
        display: flex;
        width: 100%;
        justify-content: center;
        margin-right: 15px;

        @include sm(max-width) {
            align-items: flex-start;
            justify-content: flex-start;
        }

        &__container {
            width: 100%;

            @include sm(max-width) {
                width: 200px;
            }
        }
        &__controls {
            width: 200px;
            margin: auto;
            transition: 0.15s ease-in-out;
            @include flex-container(center, center);
            button {
                margin: 0px 5%;
                @include sm(max-width) {
                    margin: 0px 5px;
                }
                &:hover {
                    filter: brightness(0.5);
                }
            }
            button:disabled {
                color: red;
            }
            button:active {
                transform: scale(0.8);
            }
        }
        &__playback-btn {
            color: #1C1C1C;
            background-color: white;
            border-radius: 100%;
            @include circle(15px);
            @include flex-container(center, center);
            .fa-play {
                margin-right: -2px;
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
            width: 80%;
            display: flex;
            align-items: center;
            min-width: 100px;
            height: 23px;

            @include sm(max-width) {
                width: 85%;
            }
            input {
                margin: 0px 12px;
            }
        }
        &__time {
            width: 20px;
            font-size: 0.95rem;
            font-weight: 100;
        }
    }
    .music-player-right-container {
        width: 30%;
        @include flex-container(center, flex-end);
    }
    .music-player-volume {
        @include flex-container(center, center);
        position: relative;
        margin-right: 15px;
        button {
            font-size: 0.8rem;
        }
        input {
            min-width: 70px;
        }
    }
    .music-player-context-container {
        transition: 0.12s ease-in-out;
        min-width: 60px;
        @include flex-container(center, center);
        background-color: #2b2b2b;
        border-radius: 12px;
        padding: 7px 0px 7px 2px;
        margin-left: 8px;

        &:hover {
            background-color: rgb(52, 52, 52);
        }
        img {
            @include circle(20px);
            border-radius: 8px;
            margin-right: 11px;
        }
        i {
            color: #8b8b8b;
        }
    }
    .music-player-platform-logo {
        margin-left: 12px;
        border-radius: 100%;
        i {
            font-size: 0.8rem !important;
        }
    }
</style>