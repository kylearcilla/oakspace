<script lang="ts">
	import { addCommasToNum, clickOutside, formatDate, shorterNum } from "../../lib/helper";
    import { currentYtVidId, ytUserData, ytCurrentVid, ytCredentials } from "$lib/store";
	import { onDestroy, onMount } from 'svelte';
	import { getChannelDetails, getPlayListDetails, getVidDetails, saveYtUserData } from "$lib/yt-api";

    // console.log("YT View Rendering...")

    let isDropDownOpen = false;
    // @ts-ignore
    let player: YT.Player;
    let currentVidIdx = 0;
    let hasError = false

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
        // // console.log("📌 YT User Data Updated!")

        const hasUserLoggedOff = data.username === ""

        if (hasUserLoggedOff) {
            // // console.log("📌 User has logged out!")
        } else {
            // // console.log("📌 User is signed in!")
        }

        const selectedPlaylistIdx = data.selectedPlaylistId
        // @ts-ignore
        const selectedPlaylistId = data.playlists[selectedPlaylistIdx]?.id ?? "No current selected playlist!"

        // console.log("📌 " + selectedPlaylistIdx)
        // console.log("📌 " + selectedPlaylistId)

        const hasUserToggledSettings = data.selectedPlaylistId === ytUserAccountData.selectedPlaylistId
        const hasUserDeselectedPlaylist = data.selectedPlaylistId < 0 && ytUserAccountData.selectedPlaylistId >= 0
        const hasUserSelectedNewPlaylist = (data.selectedPlaylistId != ytUserAccountData.selectedPlaylistId) && !hasUserDeselectedPlaylist

        ytUserAccountData = {
            ...ytUserAccountData,
            ...data
        }

        if (hasUserDeselectedPlaylist) {
            // console.log("📌 User has just deselected a playlist")
            hidePlaylist()
        }
        if (hasUserSelectedNewPlaylist) {
            const res = await getPlayListDetails(selectedPlaylistId)
            const userHasSelectedPrivatePlaylist = res.error != null

            if (userHasSelectedPrivatePlaylist) {
                // console.log("📌 User has just selected a broken playlist!")
                hasError = true;
                hidePlaylist();
                return;
            } else {
                hasError = false
                const vidId = res.items[0].snippet.resourceId.videoId;
                await updateVidDetails(vidId)
            }
        }
        if (selectedPlaylistId != "No current selected playlist!" && !hasUserToggledSettings) {
            // console.log("📌 Now Playing Playlist")

            if (player.stopVideo) player.stopVideo()
            showPlaylist()
            player.loadPlaylist({
                list: selectedPlaylistId,
                listType: "playlist",
                index: 0
            });
        }

    })

    function showPlaylist() {
        const playerDiv = document.getElementById("player")!;
        playerDiv.style.display = "flex";
    }
    function hidePlaylist() {
        if (player && player.stopVideo) player.stopVideo()
        const playerDiv = document.getElementById("player")!;
        playerDiv.style.display = "none";
    }
    
    // triggers when page reloads
    async function onReady() {
        console.log("📌 Player is Ready!")
        if (ytUserAccountData.playlists[ytUserAccountData.selectedPlaylistId].id < 0) return 

        // see if there was a saved vid index that user was watching before start off with that vid
        // otherwise default to first vid
        const startVidIdx = JSON.parse(localStorage.getItem("currentVidIdIndex") ?? "0");
        player.cuePlaylist({
            list: ytUserAccountData.playlists[ytUserAccountData.selectedPlaylistId].id,
            listType: "playlist",
            index: startVidIdx,
        });
        currentYtVidId.update(() => startVidIdx)
        
        // update vid details, show the saved vid, otherwise use the first vid as default
        const vidIdxWasSaved = localStorage.getItem("currentVidIdIndex");
        if (vidIdxWasSaved) {
            updateVidDetails(localStorage.getItem("currentVidId")!)
        } else {
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
    // triggers only when player plays a vid whose embed option has been disabled or is private
    function onError() {
    }
    // only triggers when user has clicked a new vid, if so save htis new vid
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

    function initPlayer() {
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
                volume: 50
            },
            events: {
                onReady: onReady,
                onStateChange: onStateChange,
                onError: onError,
            },
        });
    };
    }

    onDestroy(() => {
        // console.log("DESTROYING")
        const playerDiv = document.getElementById("player")!;
        if (playerDiv) playerDiv.remove();
    })
    onMount(() => {
        // console.log("MOUNTING")
        if (localStorage.getItem('yt-user-data')) {
            const ytData = JSON.parse(localStorage.getItem('yt-user-data')!)
            ytUserData.set({ ...ytData });
        }
        // console.log("📌 User is signed in!")
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';

        const ytScriptTag = document.getElementsByTagName('script')[0];
        ytScriptTag.id = "ytScriptTag"
        ytScriptTag!.parentNode!.insertBefore(tag, ytScriptTag);
        initPlayer();
    })
</script>

<div class="vid-view">
    <div class="vid-view-header">
        <h1>Video Player</h1>
        <div class="vid-view-header__yt-icon">
            <div class="yt-icon-fill"></div>
            <i class="fa-brands fa-youtube header-icon"></i>
        </div>
        {#if ytUserAccountData.username != ""}
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
    <div class="vid-view-container">
        <div id="player">
        </div>
        {#if ytUserAccountData.username === ""}
            <div class="vid-view-empty-vid-view">
                <p class="vid-view-empty-msg">No Youtube account linked.</p>
            </div>
        {:else if !ytUserAccountData.playlists[ytUserAccountData.selectedPlaylistId]}
            <div class="vid-view-empty-vid-view">
                <p class="vid-view-empty-msg">No Playlist Selected</p>
            </div>
        {:else if hasError}
            <div class="vid-view-empty-vid-view">
                <div class="text-aln-center">
                    <p class="vid-view-empty-msg">Playlist / Video can't be played</p>
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
        {/if}
    </div>
    {#if ytUserAccountData.playlists[ytUserAccountData.selectedPlaylistId] && !hasError}
        <div class="vid-details-container">
            <h1 class="vid-title">{ytVidDetails.title}</h1>
            <div class="vid-channel-details-container">
                <img alt="channel-profile-img" src={ytVidDetails.channelImgSrc} />
                <div class="vid-channel-details">
                    <div class="vid-channel-details__channel-name">{ytVidDetails.channelName}</div>
                    <div class="vid-channel-details__sub-count">{ytVidDetails.channelSubs} subscribers</div>
                </div>
                <div class="vid-like-count">27.5 K</div>
            </div>
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
            color: rgb(var(--textColor1));

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
                    // box-shadow: 0px 0px 12px 5px rgba(223, 107, 107, 0.28);
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
                color: rgb(var(--textColor1));
                .dropdown-menu {
                    position: absolute;
                    top: 25px;
                    right: 0px;
                    width: 120px;
                }
            }
        }
        .vid-view-container {
            width: 100%;
            aspect-ratio: 16 / 9;
            background-color: var(--primaryBgColor);
            position: relative;
        }
        #player, .vid-view-empty-vid-view {
            width: 100%;
            aspect-ratio: 16 / 9;
            // border-radius: 7px;
            background-color: var(--secondaryBgColor);
            display: flex;
            @include center;
        }
        .vid-view-empty-vid-view {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        .vid-view-empty-msg {
            font-weight: 700;
            font-size: 1.4rem;
            color: #999999;
            margin-bottom: 15px;
            z-index: 1000;
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
            color: rgb(var(--textColor1));
            @include elipses-overflow;
        }
        .vid-channel-details-container {
            margin: 7px 0px 40px 0px;
            position: relative;
            width: 100%;
            @include flex-container(center, _);
            color: rgb(var(--textColor1));
            
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
                    font-weight: 400;   
                    font-size: 0.9rem;
                    margin-top: 2px;
                    opacity: 0.8;
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