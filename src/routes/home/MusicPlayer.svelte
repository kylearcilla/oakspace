<script lang="ts">
    import { onMount } from 'svelte';
    let playbackProgress = 0.1;
    let trackPlaybackBar: any;
    let musicPlaybackBar: any;

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
    <div class="music-player-track">
        <div class="music-player-track__img">
            <img src="https://upload.wikimedia.org/wikipedia/en/d/d3/Call_Me_If_You_Get_Lost_album_cover.jpg" alt="">
        </div>
        <div class="music-player-track__details">
            <h5 class="music-player-track-title">Wus Ya Name sdofijsofisdjf</h5>
            <p class="music-player-track-artist">Call Me If You Get Los sdofijsdfoi soidfjsdt</p>
        </div>
    </div>
    <div class="music-player-playback">
        <div class="music-player-playback-controls">
            <button class="icon-btn"><i class="fa-solid fa-shuffle"></i></button>
            <button class="icon-btn"><i class="fa-solid fa-backward"></i></button>
            <button class="icon-btn"><i class="fa-solid fa-play"></i></button>
            <button class="icon-btn"><i class="fa-solid fa-forward"></i></button>
            <button class="icon-btn"><i class="fa-solid fa-repeat"></i></button>
        </div>
        <div class="music-playback-bar-container">
            <div class="music-player-time music-player-time--elapsed">2:45</div>
            <div class="music-player-playback-bar">
                <input
                    bind:this={trackPlaybackBar}
                    on:input={trackProgressHandler}
                    value="90"
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                />
            </div>
            <div class="music-player-time music-player-time--total">3:48</div>
        </div>
    </div>
    <div class="music-player-volume">
        <div class="music-player-volume-container">
            <button class="icon-btn"><i class="fa-solid fa-volume-high"></i></button>
            <input
                bind:this={musicPlaybackBar}
                on:input={volumeHandler}
                value="90"
                type="range"
                min="0"
                max="100"
                step="0.1"
            />
        </div>
    </div>
</div>

<style lang="scss">
    .music-player {
        position: fixed;
        width: 100%;
        height: 65px;
        bottom: 0px;
        box-shadow: 0px -7px 20px rgba(0, 0, 0, 0.24);
        background: rgba(41, 41, 41, 0.6);
        backdrop-filter: blur(100px);
        z-index: 2000;
        display: flex;
        padding: 10px 25px 12px 20px;
    }
    .music-player-track {
        width: min(35%, 300px);
        height: 100%;
        display: flex;
        align-items: center;
        overflow: hidden;

        &__details {
            width: 100%;
            overflow: hidden;
            h5, p {
                width: 80%;
                @include elipses-overflow;
            }
            h5 {
                font-size: 10px;
            }
            p {
                font-size: 8px;
                font-weight: 100;
                margin-top: 1px;
                color: rgb(167, 166, 166);
            }
        }
        img {
            @include circle(30px);
            margin-right: 10px;
        }
    }
    .music-player-playback {
        position: relative;
        height: 100%;
        width: 100%;
        @include sm(max-width) {
            width: 60%;
            margin-right: 10px;
        }
        .music-player-playback-controls {
            display: flex;
            margin-bottom: 4px;
            justify-content: center;
            button {
                margin: 0px 10px;
            }
        }
        .music-playback-bar-container {
            display: flex;
            align-items: center;
            width: 100%;
            .music-player-time {
                width: 10px;
                font-size: 8px;
                font-weight: 100;
            }
            .music-player-playback-bar {
                width: 95%;
                padding: 0px 15px;
                margin-bottom: 5px;
            }
        }
    }
    .music-player-volume {
        height: 100%;
        width: 20%;
        max-width: 180px;
        position: relative;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        button {
            margin-right: 10px;
            i {
                font-size: 8px;
            }
        }
        .music-player-volume-container {
            display: flex;
            align-items: center;
            width: 80%;
        }
    }
</style>