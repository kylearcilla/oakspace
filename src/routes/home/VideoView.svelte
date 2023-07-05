<script lang="ts">
	import { addCommasToNum, clickOutside, formatDate, shorterNum } from "../../lib/helper";
    import { currentYtVidId, ytUserData, ytCurrentVid, ytCredentials, colorThemeState } from "$lib/store";
	import { onDestroy, onMount } from 'svelte';
	import { getChannelDetails, getPlayListDetails, getVidDetails, saveYtUserData } from "$lib/yt-api";
	import { get } from "svelte/store";

    let isDropDownOpen = false;
    // @ts-ignore
    let player: YT.Player;
    let currentVidIdx = 0;
    let hasError = false

    let ytData: YoutubeUserData = {
        username: '',
        channelImgSrc: '',
        email: '',
        selectedPlaylist: null,
        playlists: []
    }
    let ytVidDetails: YoutubeVideo = {
        id: "",
        title: "",
        likeCount: 0,
        viewCount: 0,
        publishedAt: "",
        channelName: "",
        channelImgSrc: "",
        channelSubs: 0
    }

    let isLightTheme = false
    let isColorPaletteTheme = false
    let isMultiColorTheme = false
    let isVidPlayerShown = false
    
    colorThemeState.subscribe((theme) => {
        isLightTheme = !theme.isDarkTheme
        isColorPaletteTheme = ["light", "dark"].includes(theme.sectionTitle)
        isMultiColorTheme = theme.isMultiColor
    })
    
    currentYtVidId.subscribe((idx) => {
        currentVidIdx = idx
    })
    ytCurrentVid.subscribe((data: any) => {
        ytVidDetails = data
    })
    ytUserData.subscribe(async (data) => {
        if (!data.selectedPlaylist) {
            ytData = { ...ytData, ...data }
            player.stopVideo()
            hidePlaylist()
            return
        }
        const selectedPlaylistId = data.selectedPlaylist?.id ?? "No current selected playlist!"

        const hasUserToggledSettings = data.selectedPlaylist?.id === ytData.selectedPlaylist?.id
        const hasUserDeselectedPlaylist = !data.selectedPlaylist && ytData.selectedPlaylist
        const hasUserSelectedNewPlaylist = (data.selectedPlaylist?.id != ytData.selectedPlaylist?.id) && !hasUserDeselectedPlaylist

        ytData = { ...ytData, ...data }

        if (hasUserDeselectedPlaylist) {
            hidePlaylist()
        }
        if (hasUserSelectedNewPlaylist) {
            const res = await getPlayListDetails(selectedPlaylistId)
            const userHasSelectedPrivatePlaylist = res.error != null
            
            if (userHasSelectedPrivatePlaylist) {
                hasError = true;
                hidePlaylist();
                return;
            } else {
                currentVidIdx = -1
                hasError = false
                const vidId = res.items[0].snippet.resourceId.videoId;
                await updateVidDetails(vidId)
            }
        }
        if (selectedPlaylistId != "No current selected playlist!" && !hasUserToggledSettings) {
            if (player.stopVideo) player.stopVideo()
            showPlaylist()
            player.loadPlaylist({
                list: selectedPlaylistId,
                listType: "playlist",
                index: 0
            });

            isVidPlayerShown = true
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

        isVidPlayerShown = false
    }
    
    // triggers when page reloads
    async function onReady() {
        if (!ytData.selectedPlaylist?.id) return 
        isVidPlayerShown = true

        // see if there was a saved vid index that user was watching before start off with that vid
        // otherwise default to first vid
        const startVidIdx = JSON.parse(localStorage.getItem("currentVidIdIndex") ?? "0");
        player.cuePlaylist({
            list: ytData.selectedPlaylist!.id,
            listType: "playlist",
            index: startVidIdx,
        });
        currentYtVidId.update(() => startVidIdx)
        
        // update vid details, show the saved vid, otherwise use the first vid as default
        const vidIdxWasSaved = localStorage.getItem("currentVidIdIndex");
        if (vidIdxWasSaved) {
            updateVidDetails(localStorage.getItem("currentVidId")!)
        } else {
            const res = await getPlayListDetails(ytData.selectedPlaylist!.id)
            const vidId = res.items[0].snippet.resourceId.videoId;
            updateVidDetails(vidId)
            localStorage.setItem("currentVidId", vidId)
        }
    }
    const updatePlaylist = async (clickedPlaylistIdx: number) => {
        isDropDownOpen = false
        const newPlaylist = ytData.playlists[clickedPlaylistIdx]
        const newYtData = { ...ytData, selectedPlaylist: newPlaylist }

        ytUserData.set(newYtData)
        saveYtUserData(newYtData);
    }
    const toggleDropDown = () => {
        isDropDownOpen = !isDropDownOpen
    }
    // triggers only when player plays a vid whose embed option has been disabled or is private
    function onError() {
    }
    // only triggers when user has clicked a new vid or new playlist
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
        const playerDiv = document.getElementById("player")!;
        if (playerDiv) playerDiv.remove();
    })
    onMount(() => {
        if (localStorage.getItem('yt-user-data')) {
            const ytData = JSON.parse(localStorage.getItem('yt-user-data')!)
            ytUserData.set({ ...ytData });
        }
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
        <h1 class={`vid-view-header__title ${isLightTheme ? "vid-view-header__title--light-mode" : ""}`}>Dashboard</h1>
        {#if ytData.username != ""}
            <div class="dropdown-container">
                <button 
                    class={`dropdown-btn 
                                ${isLightTheme ? "dropdown-btn--light-mode" : ""} dropdown-btn--icon-text 
                                ${isColorPaletteTheme ? "dropdown-btn--color-theme" : ""}
                                ${isMultiColorTheme ? "dropdown-btn--multi-color-theme" : ""}
                            `} 
                    on:click={toggleDropDown}
                >
                    <div class="dropdown-btn__icon">
                        <div class="dropdown-btn__youtube-logo">
                            <i class="fa-brands fa-youtube"></i>
                        </div>
                    </div>
                    <p class="dropdown-btn__title paragraph-4">
                        {ytData.selectedPlaylist?.title ?? "No Playlist Selected"}
                    </p>
                    <div class="dropdown-btn__arrows">
                        <div class="dropdown-btn__arrows-triangle-up">
                            <i class="fa-solid fa-chevron-up"></i>
                        </div>
                        <div class="dropdown-btn__arrows-triangle-down">
                            <i class="fa-solid fa-chevron-down"></i>
                        </div>
                    </div>
                </button>
                {#if isDropDownOpen}
                    <ul use:clickOutside on:click_outside={() => isDropDownOpen = false} class="dropdown-menu">
                        {#each ytData.playlists as playlist, index}
                            <li class={`dropdown-menu__option ${playlist.title ===  ytData.selectedPlaylist?.title ? "dropdown-menu__option--selected" : ""}`}>
                                <button class="dropdown-element" on:click={() => updatePlaylist(index)}>
                                    <p>{playlist.title}</p>
                                    <i class="fa-solid fa-check"></i>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {:else if ytData.username === "" && ytData.selectedPlaylist}
            <h3 class="vid-view__playlist-title">
                {ytData.selectedPlaylist.title}
            </h3>
        {/if}
    </div>
    <div class={`vid-view-container ${!isVidPlayerShown ? "vid-view-container--player-hidden" : ""}`}>
        <div id="player">
        </div>
        {#if !ytData.selectedPlaylist}
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
    {#if ytData.selectedPlaylist?.id && !hasError}
        <div class={`vid-details-container ${isLightTheme ? "vid-details-container--light-mode" : ""}`}>
            <h3 class="vid-title">{ytVidDetails.title}</h3>
            <div class="vid-channel-details-container">
                <img alt="channel-profile-img" src={ytVidDetails.channelImgSrc} />
                <div class="vid-channel-details">
                    <span class="vid-channel-details__channel-name">{ytVidDetails.channelName}</span>
                    <span class="vid-channel-details__sub-count">
                        {ytVidDetails.channelSubs} Subscribers
                    </span>
                </div>
            </div>
        </div>
    {/if}
</div> 
<style lang="scss">
    .vid-view {
        margin-top: 30px;
        font-family: "Manrope";
        color: white;
        position: relative;

        &__playlist-title {
            color: rgba(var(--textColor1), 0.9);
            float: right;
            @include pos-abs-top-right-corner(5px, 0px);
        }

        .vid-view-header {
            position: relative;
            @include flex-container(center, _);
            margin-bottom: 15px;
            height: 30px;
            color: rgb(var(--textColor1));

            &__title {
                font-size: 1.8rem;

                &--light-mode {
                    font-weight: 600;
                }
            }
            .dropdown-container {
                position: absolute;
                right: 0px;
                color: rgb(var(--textColor1));
            }
            .dropdown-btn {
                &__icon {
                }
                &__youtube-logo {
                    background-color: white;
                    @include circle(8px);
                    @include center;

                    i {
                        color: #FE5454;
                        font-size: 1.2rem;;
                        z-index: 1;
                        margin-right: 4px;
                    }
                }

                /* Color Theme Styling */
                &--color-theme {
                    background-color: var(--secondaryBgColor);
                    color: var(--homeVidDropDownTextColor);
                    border: var(--borderVal2);
                }
                &--color-theme .dropdown-btn__youtube-logo {
                    background-color: var(--secondaryBgColor);
                }
                &--color-theme i {
                    color: var(--homeVidDropDownTextColor);
                }
                &--multi-color-theme .dropdown-btn__youtube-logo {
                    background-color: rgb(var(--fgColor3));
                }
                &--multi-color-theme {
                    background-color: rgb(var(--fgColor3));
                }
            }
            .dropdown-menu {
                position: absolute;
                top: 35px;
                right: -2px;
                width: 120px;
            }
        }
        .vid-view-container {
            background-color: black;
            position: relative;
            @include center;

            &--player-hidden {
                aspect-ratio: 16 / 9;
                width: 100%;
            }
        }
        #player {
            width: 100%;
            aspect-ratio: 16 / 9;
            max-height: 500px;
            background-color: var(--primaryBgColor);
            display: flex;
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
            color: rgb(var(--textColor2));
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
        .vid-details-container {
            width: 100%;

            &--light-mode .vid-title {
                font-weight: 700;
            }
            &--light-mode .vid-channel-details__channel-name {
                font-weight: 600 !important;
            }
            &--light-mode .vid-channel-details__sub-count {
                font-weight: 400 !important;
            }

        }
        .vid-title {
            margin-top: 12px;
            color: rgb(var(--textColor1), 0.95);
            font-weight: 500;
        }
        .vid-channel-details-container {
            margin: 10px 0px 40px 0px;
            position: relative;
            width: 100%;
            @include flex-container(center, _);
            color: rgb(var(--textColor1));
            
            img {
                border-radius: 100%;
                width: 25px;
                aspect-ratio: 1 / 1;
                margin-right: 10px;
            }
            .vid-channel-details {
                span {
                    display: block;
                }
                &__channel-name {
                    color: rgb(var(--textColor1), 0.85);
                    font-weight: 500;
                }
                &__sub-count {
                    color: rgb(var(--textColor1), 0.55);
                    margin-top: 2px;
                    opacity: 0.8;
                    font-weight: 300;
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