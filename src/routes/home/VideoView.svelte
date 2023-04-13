<script lang="ts">
	import { addCommasToNum, clickOutside, formatDate, shorterNum } from "../../lib/helper";
    import { currentYtVidId, ytUserData, ytCurrentVid } from "$lib/store";
	import { onDestroy, onMount } from 'svelte';
	import { getChannelDetails, getPlayListDetails, getVidDetails, saveYtUserData } from "$lib/yt-api";

    console.log("RENDER")

    let isDropDownOpen = false;
    let isSignedIn = false;
    // @ts-ignore
    let player: YT.Player;
    let currentVidIdx = 0;
    let hasError = false
    let hasJustInitialized = false

    let ytUserAccountData: any = {
        username: '',
        channelImgSrc: '',
        email: '',
        selectedPlaylistId: 0,
        playlists: []
    }
    let ytVidDetails: any = {
        id: "",
        title: "",
        likeCount: 0,
        viewCount: 0,
        publishedAt: "",
        channelName: "",
        channelImgSrc: "",
        channelSubs: 0
    }

    currentYtVidId.subscribe((idx) => {
        currentVidIdx = idx
    })
    ytCurrentVid.subscribe((data: any) => {
        ytVidDetails = data
    })
    ytUserData.subscribe(async (data) => {
        let oldId = ytUserAccountData.selectedPlaylistId 
        isSignedIn = true;
        hasJustInitialized = false

        ytUserAccountData = {
            ...ytUserAccountData,
            ...data
        }


        if (data.selectedPlaylistId == -1) {
            isSignedIn = false;
            const playerDiv = document.getElementById("player")!;
            if (playerDiv) playerDiv.remove();
        }

        if (player?.loadPlaylist && oldId != data.selectedPlaylistId) {
            if (!data || data.selectedPlaylistId < 0) {
                const playerDiv = document.getElementById("player")!;
                playerDiv.style.display = "none";
                return
            }

            // @ts-ignore
            // @ts-ignore
            const id = ytUserAccountData.playlists[ytUserAccountData.selectedPlaylistId].id;
            const res = await getPlayListDetails(ytUserAccountData.playlists[ytUserAccountData.selectedPlaylistId].id)

            if (res.error) {
                hasError = true;
                if (player.stopVideo) player.stopVideo()
                const playerDiv = document.getElementById("player")!;
                playerDiv.style.display = "none";
                return;
            } else {
                hasError = false;
                const playerDiv = document.getElementById("player")!;
                playerDiv.style.display = "flex"
            }

            const vidId = res.items[0].snippet.resourceId.videoId;

            console.log("C")
            player.setVolume(240)
            updateVidDetails(vidId)
            if (player.stopVideo) player.stopVideo()
            player.loadPlaylist({
                list: id,
                listType: "playlist",
                index: 0
            });
        }
    })
    async function onReady() {
        console.log("ON READY")

        hasJustInitialized = false
        const startVidIdx = JSON.parse(localStorage.getItem("currentVidIdIndex") ?? "0");
        player.loadPlaylist({
            list: ytUserAccountData.playlists[ytUserAccountData.selectedPlaylistId].id,
            listType: "playlist",
            index: startVidIdx
        });
        currentYtVidId.update(() => startVidIdx)
        const vidIdxWasSaved = localStorage.getItem("currentVidIdIndex");

        if (vidIdxWasSaved) {
            updateVidDetails(localStorage.getItem("currentVidId")!)
        } 
        else {
            const res = await getPlayListDetails(ytUserAccountData.playlists[ytUserAccountData.selectedPlaylistId].id)
            const vidId = res.items[0].snippet.resourceId.videoId;
            updateVidDetails(vidId)
            localStorage.setItem("currentVidId", vidId)
        }
    }
    const updatePlaylist = (clickedPlaylistId: number) => {
        isDropDownOpen = false
        ytUserData.set({
            ...ytUserAccountData,
            selectedPlaylistId: clickedPlaylistId
        })
        saveYtUserData({
            ...ytUserAccountData,
            selectedPlaylistId: clickedPlaylistId
        });
    }
    const toggleDropDown = () => {
        isDropDownOpen = !isDropDownOpen
    }
    function onError() {
        hasError = true;
        if (player.stopVideo) player.stopVideo()
        const playerDiv = document.getElementById("player")!;
        playerDiv.style.display = "none";
    }
    async function onStateChange() {
        if (player.getPlaylistIndex() === currentVidIdx) return;
        currentYtVidId.update(() => player.getPlaylistIndex())
        
        localStorage.setItem("currentVidIdIndex", player.getPlaylistIndex())
        const vidId = player.getPlaylist()[player.getPlaylistIndex()]
        localStorage.setItem("currentVidId", vidId)
        updateVidDetails(vidId)
    }
    async function updateVidDetails(vidId: string) {
        const vidDetailsRes = await getVidDetails(vidId);
        const channelDetailsRes = await getChannelDetails(vidDetailsRes.items[0].snippet.channelId);

        const currentVidObject: any = {
            id: vidDetailsRes.items[0].id,
            title: vidDetailsRes.items[0].snippet.title,
            likeCount: shorterNum(vidDetailsRes.items[0].statistics.likeCount),
            viewCount: addCommasToNum(vidDetailsRes.items[0].statistics.viewCount),
            publishedAt: formatDate(vidDetailsRes.items[0].snippet.publishedAt),
            channelName: vidDetailsRes.items[0].snippet.channelTitle,
            channelImgSrc: channelDetailsRes.items[0].snippet.thumbnails.default.url,
            channelSubs: shorterNum(channelDetailsRes.items[0].statistics.subscriberCount)
        };

        ytCurrentVid.update(() => currentVidObject)
    }

    onDestroy(() => {
        isSignedIn = false;
        const playerDiv = document.getElementById("player")!;
        if (playerDiv) playerDiv.remove();
    })
    onMount(() => {
        hasJustInitialized = true
        if (localStorage.getItem('yt-user-data')) {
            const ytData = JSON.parse(localStorage.getItem('yt-user-data')!)
            isSignedIn = true
            ytUserData.set({ ...ytData });
        }
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';

        const ytScriptTag = document.getElementsByTagName('script')[0];
        ytScriptTag.id = "ytScriptTag"
        ytScriptTag!.parentNode!.insertBefore(tag, ytScriptTag);

        // @ts-ignore
        window.onYouTubeIframeAPIReady = () => {
            // @ts-ignore
            player = new YT.Player('player', {
                height: '100%',
                width: '100%',
                playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    rel: 0,

                },
                events: {
                    onReady: onReady,
                    onStateChange: onStateChange,
                    onError: onError,
                },
            });
        };
    })
</script>

<div class="vid-view">
    <div class="vid-view-header">
        <h1>Video Player</h1>
        <div class="vid-view-header__yt-icon">
            <div class="yt-icon-fill"></div>
            <i class="fa-brands fa-youtube header-icon"></i>
        </div>
        {#if isSignedIn}
            <div class="dropdown-container">
                <button on:click={toggleDropDown} class="dropdown-btn">
                    <p>{ytUserAccountData.playlists[ytUserAccountData.selectedPlaylistId]?.title ?? "No Playlist Selected"}</p>
                    <i class="fa-solid fa-caret-down"></i>
                </button>
                {#if isDropDownOpen}
                    <ul use:clickOutside on:click_outside={() => isDropDownOpen = false} class="dropdown-menu">
                        {#each ytUserAccountData.playlists as playlist, index}
                            <li><button on:click={() => updatePlaylist(index)} class="dropdown-menu__option">{playlist.title}</button></li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {/if}
    </div>
    {#if isSignedIn}
        {#if hasError}
            <div class="vid-view-empty-vid-view">
                <div class="text-aln-center">
                    {#if (ytUserAccountData.selectedPlaylistId < 0 && !hasJustInitialized)}
                        <p class="vid-view-empty-msg">No Playlist Selected</p>
                    {:else}
                        <p class="vid-view-empty-msg">Playlist / Video can't be played</p>
                            <a
                            class="vid-view-support-link"
                            target="_blank"
                            href="https://support.google.com/youtube/answer/97363?hl=en"
                            rel="noreferrer"
                            >
                            More info on unplayable embeded youtube content.
                        </a>
                    {/if}
                </div>
            </div>
        {/if}
        <div id="player">
            <div id="player__container">
                <p class="vid-view-empty-msg">Reload the page to initialize the player!</p>
                <button class="vid-view-refresh-button btn-line" on:click={() => location.reload()}>Refresh Page!</button>
            </div>
        </div>
        {#if ytVidDetails.id != "" && !hasError && ytUserAccountData.playlists[ytUserAccountData.selectedPlaylistId]}
            <h1 class="vid-title">{ytVidDetails.title}</h1>
            <div class="vid-details">
                <h4 class="vid-details__date">{ytVidDetails.publishedAt}</h4>
                <h5 class="vid-details__view-count">{ytVidDetails.viewCount} views</h5>
            </div>
            <div class="vid-channel-details-container">
                <img alt="channel-profile-img" src={ytVidDetails.channelImgSrc} />
                <div class="vid-channel-details">
                    <div class="vid-channel-details__channel-name">{ytVidDetails.channelName}</div>
                    <div class="vid-channel-details__sub-count">{ytVidDetails.channelSubs} subscribers</div>
                </div>
                <div class="vid-like-count">27.5 K</div>
            </div>
        {/if}
    {:else}
        <div class="vid-view-empty-vid-view">
            <p class="vid-view-empty-msg">No Youtube account linked.</p>
        </div>
    {/if}
</div>

<style lang="scss">
    .vid-view {
        margin-top: 30px;
        font-family: "Manrope";
        color: white;

        .vid-view-header {
            position: relative;
            @include flex-container(center, _);
            margin-bottom: 15px;

            &__yt-icon {
                position: relative;
                margin: 3px 0px 15px 18px;
                i, .yt-icon-fill {
                    position: absolute;
                    left: 50%;
                    transform: translate(-50%, 0);
                }
                i {
                    border-radius: 100%;
                    font-size: 1.5rem;
                    color: #DF6B6B;
                }
                .yt-icon-fill {
                    box-shadow: 0px 0px 12px 5px rgba(223, 107, 107, 0.28);
                    top: 5px;
                    background-color: white;
                    width: 5px;
                    height: 5px;
                }
            }
            h1 {
                font-size: 1.4rem;
                font-weight: 700;
            }
            .dropdown-container {
                font-family: "Apercu";
                position: absolute;
                top: 5px;
                right: 0px;
                .dropdown-menu {
                    position: absolute;
                    top: 25px;
                    right: 0px;
                    border-radius: 7px;
                    width: 120px;
                }
            }
        }
        #player {
            &__container {
                text-align: center;
            }
        }
        #player, .vid-view-empty-vid-view {
            width: 100%;
            aspect-ratio: 16 / 9;
            border-radius: 10px;
            background-color: #181719;
            display: flex;
            @include center;
        }
        .vid-view-empty-msg {
            font-weight: 700;
            font-size: 1.4rem;
            color: #999999;
            margin-bottom: 15px;
        }
        .vid-view-support-link {
            padding-top: 20px;
            font-weight: 400;
            font-size: 1.2rem;
            color: #76B1FE;
        }
        .vid-view-refresh-button {
            font-weight: 700;
            font-size: 1rem;
            color: #999999;

            border-color: #999999;
            border-radius: 100px;

            &:hover {
                background-color: #999999;
                color: #181719;
            }

        }
        .vid-title {
            font-size: 1.5rem;
            margin-top: 10px;
            font-weight: 700;
            @include elipses-overflow;
        }
        .vid-details {
            margin-top: 8px;
            display: flex;
            position: relative;
            width: 100%;

            &__date {
                font-size: 1rem;
                margin-right: 12px;
                color: rgb(154, 154, 154);
                font-weight: 400;
            }
            &__view-count {
                font-size: 1rem;
                font-weight: 200;
                color: rgb(154, 154, 154);
            }
            &__play-list-dropdown {
                font-family: "Apercu";
                position: absolute;
                top: 0px;
                right: 0px;
                color: rgb(158, 158, 158);
            }
        }
        .vid-channel-details-container {
            margin-top: 20px;
            position: relative;
            width: 100%;
            @include flex-container(center, _);
            img {
                border-radius: 100%;
                width: 35px;
                aspect-ratio: 1 / 1;
                margin-right: 10px;
            }
            .vid-channel-details {
                font-weight: 700;
                &__channel-name {
                    font-size: 1.1rem;
                }
                &__sub-count {
                    color: rgb(151, 151, 151);
                    font-weight: 400;   
                    font-size: 0.9rem;
                    margin-top: 2px;
                }
            }
            .vid-like-count {
                position: absolute;
                top: 0px;
                right: 0px;
            }

        }
    }
</style>