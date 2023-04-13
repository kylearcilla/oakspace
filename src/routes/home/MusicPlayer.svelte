<script lang="ts">
    import { onMount } from 'svelte';
    let playbackProgress = 0.1;
    let trackPlaybackBar: HTMLInputElement;
    let musicPlaybackBar: HTMLInputElement;

    const trackProgressHandler = () => {
        const value = trackPlaybackBar.value;
        trackPlaybackBar.style.background = `linear-gradient(to right, white 0%, white ${value}%, #0C0C0C ${value}%, #0C0C0C 100%)`
    }
    const volumeHandler = () => {
        const value = musicPlaybackBar.value;
        musicPlaybackBar.style.background = `linear-gradient(to right, white 0%, white ${value}%, #0C0C0C ${value}%, #0C0C0C 100%)`
    }

    onMount(() => {
        trackProgressHandler();
        volumeHandler();
    });
</script>

<div class="music-player">
    <!-- svelte-ignore a11y-missing-attribute -->
    <!-- <div class="music-player-track">
        <img class="music-player-track__art" src="https://upload.wikimedia.org/wikipedia/en/d/d3/Call_Me_If_You_Get_Lost_album_cover.jpg" alt="">
        <div class="music-player-track__details">
            <h5 class="music-player-track__title elipses-overflow">Wus Ya Name sdofijsofisdjf</h5>
            <p class="music-player-track__artist elipses-overflow">Call Me If You Get Los sdofijsdfoi soidfjsdt</p>
        </div>
    </div>
    <div class="music-player-playback">
        <div class="music-player-playback__controls">
            <button class="icon-btn"><i class="fa-solid fa-shuffle"></i></button>
            <button class="icon-btn"><i class="fa-solid fa-backward"></i></button>
            <button class="icon-btn"><i class="fa-solid fa-play"></i></button>
            <button class="icon-btn"><i class="fa-solid fa-forward"></i></button>
            <button class="icon-btn"><i class="fa-solid fa-repeat"></i></button>
        </div>
        <div class="music-player-playback__bar-container">
            <div class="music-player-playback__time music-playback__time--elapsed">2:45</div>
            <div class="music-player-playback__playback-bar">
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
            </div>
            <div class="music-player-playback__time music-playback__time--total">3:48</div>
        </div>
    </div>
    <div class="music-player-volume">
        <div class="music-player-volume__container">
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
        </div>
    </div> -->
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
    }
    .music-player-track {
        width: min(35%, 300px);
        height: 100%;
        overflow: hidden;
        
        @include flex-container(center, _);

        &__details {
            width: 100%;
            overflow: hidden;
        }
        &__title {
            width: 80%;
            font-size: 1rem;
        }
        &__artist{
            width: 80%;
            margin-top: 1px;
            font-size: 0.8rem; 
            font-weight: 100;
            color: rgb(167, 166, 166);
        }
        &__art {
            @include circle(30px);
            margin-right: 10px;
        }
    }
    .music-player-playback {
        width: 100%;
        position: relative;

        @include sm(max-width) {
            width: 60%;
            margin-right: 10px;
        }

        &__controls {
            display: flex;
            margin-bottom: 4px;
            @include center;
            button {
                margin: 0px 10px;
            }
        }
        &__bar-container {
            @include flex-container(center, _);
            width: 100%;
        }
        &__time {
            width: 10px;
            font-size: 0.8rem;
            font-weight: 100;
        }
        &__playback-bar {
            width: 95%;
            margin-bottom: 5px;
            padding: 0px 15px;
        }
    }
    .music-player-volume {
        width: 20%;
        max-width: 180px;
        position: relative;
        justify-content: flex-end;
        @include flex-container(center, _);
        &__container {
            @include flex-container(center, _);
            width: 80%;
        }
        button {
            margin-right: 10px;
            i {
                font-size: 0.8rem;
            }
        }
    }
</style>