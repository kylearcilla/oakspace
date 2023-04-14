<script lang="ts">
    import { get } from 'svelte/store'
	import { deleteYtCredentials, deleteYtUserData, getUserPlaylists, initOAuth2Client, saveYtCredentials, saveYtUserData } from "$lib/yt-api";
	import { ytCredentials, ytUserData } from "$lib/store";
    import { clickOutside } from "../../lib/helper";
	import { onMount } from 'svelte';

    export let onNavButtonClicked: any;

    let isModalOpen = true;
    let clickedPlaylistId = -1;
    let isSignedIn = false;

    let ytUserAccountData: any = {}

    ytUserData.subscribe((data) => {
        ytUserAccountData = {
            ...ytUserAccountData,
            ...data
        }
    })

    const closeModal = () => onNavButtonClicked("")
    const handleClickedPlaylist = (playlistIndex: number) => {
        if (playlistIndex === ytUserAccountData.selectedPlaylistId) {
            clickedPlaylistId = playlistIndex;
            return;
        }
        if (playlistIndex != clickedPlaylistId) {
            clickedPlaylistId = playlistIndex;
            return;
        }
        clickedPlaylistId = -1;
    }
    const handleChoosePlaylist = () => {
        ytUserData.set({
            ...ytUserAccountData,
            selectedPlaylistId: clickedPlaylistId
        })
        saveYtUserData({
            ...ytUserAccountData,
            selectedPlaylistId: clickedPlaylistId
        });

    }
    const handleRemoveChoosenPlaylist = () => {
        ytUserData.set({
            ...ytUserAccountData,
            selectedPlaylistId: -1
        })
        localStorage.setItem('yt-user-data', JSON.stringify({
            ...ytUserAccountData,
            selectedPlaylistId: -1
        }));
    }
    const getUserYtPlaylists = async (accessToken: string) => {
        const playlistData: any = {};
        const playlists: any = []
        const results = await getUserPlaylists(accessToken)
        const playlistResults: [] = results.items
        playlistData.playlists = playlists;

        playlistResults.map((playlist: any) => {
            playlists.push({
                id: playlist.id,
                title: playlist.snippet.title,
                channelTitle: playlist.snippet.channelTitle,
                thumbnailURL: playlist.snippet.thumbnails.medium.url,
                vidCount: playlist.contentDetails.itemCount
            });
        })
        return playlistData
    }
    const initYtCreds = (ytCreds: any) => {
        ytCredentials.set({ ...ytCreds });
        saveYtCredentials(ytCreds);
    }
    const intUserYtData = async (ytData: any, accessToken: string) => {
        const playlistData = await getUserYtPlaylists(accessToken)
        ytUserData.set({ ...ytData, ...playlistData });

        saveYtUserData({ ...ytData, ...playlistData });
    }
    const handleYtSignUp = () => {
        initOAuth2Client((res: any) => {
            const ytCreds: any = {}
            const ytData: any = {}

            ytCreds.accessToken = res.credential.accessToken;
            ytData.email = res.popUpResponse.additionalUserInfo.profile.email
            ytData.username = res.popUpResponse.additionalUserInfo.profile.name;
            ytData.channelImgSrc = res.popUpResponse.additionalUserInfo.profile.picture;

            intUserYtData(ytData, ytCreds.accessToken);
            initYtCreds(ytCreds)

            isSignedIn = true;
        });
    }
    const handleUnlinkCurrentYtAccount = () => {
        isSignedIn = false;
        ytUserData.update(() => ({
            username: '',
            channelImgSrc: '',
            email: '',
            selectedPlaylistId: -1,
            playlists: []
        }));
        ytCredentials.update(() => ({
            accessToken: '',
            refreshToken: ''
        }));
        deleteYtCredentials()
        deleteYtUserData()

        const iframeElement = document.querySelector('#my-iframe');
        if (iframeElement) {
            iframeElement.remove();
        }
    }
    onMount(() => {
        const savedYtCreds = localStorage.getItem('yt-credentials');
        const savedUserData = localStorage.getItem('yt-user-data');

        console.log("🍩 " + (savedYtCreds != null ? "savedUserData present!" : "savedUserData empty!"))
        console.log("🍩 " + (savedUserData != null ? "savedUserData present!" : "savedUserData empty!"))

        if (savedYtCreds) {
            const ytCreds = JSON.parse(localStorage.getItem('yt-credentials')!);
            ytCredentials.set({ ...ytCreds });
        }
        if (savedUserData) {
            const ytData = JSON.parse(localStorage.getItem('yt-user-data')!);
            isSignedIn = true;
            ytUserData.set({ ...ytData });
        }
    })
</script>

<div class={`modal-bg ${isModalOpen ? "" : "modal-bg--hidden"}`}>
    <div use:clickOutside on:click_outside={closeModal} class="modal-bg__content">
        <button on:click={closeModal} class="close-btn">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div class={`yt-settings ${!isSignedIn ? "yt-settings--min" : ""}`}>
            <div class="yt-settings-header">
                <h1>Youtube Settings</h1>
                <div class={`yt-settings-header__yt-icon ${isSignedIn ? "yt-settings-header__yt-icon--active" : ""}`}>
                    <div class="yt-icon-fill"></div>
                    <i class="fa-brands fa-youtube header-icon"></i>
                </div>
            </div>
            <div class="yt-settings-account-details section-bg">
                <h2>Account Details</h2>
                <div class="flx flx--aln-center">
                    {#if isSignedIn}
                        <img src={ytUserAccountData.channelImgSrc} alt="yt-profile" />
                    {:else}
                        <div class="yt-settings-account-details__blank-img"></div>
                    {/if}
                    <div class="yt-settings-account-details__section"> 
                        <h3>Gmail Account</h3>
                        {#if isSignedIn}
                            <p>{ytUserAccountData.email}</p>
                        {:else}
                            <p>-</p>
                        {/if}
                    </div>
                    <div class="yt-settings-account-details__section"> 
                        <h3>Channel Name</h3>
                        {#if isSignedIn}
                            <p>{ytUserAccountData.username}</p>
                        {:else}
                            <p>-</p>
                        {/if}
                    </div>
                </div>
                <div class="abs-bottom-right abs-bottom-right--padded-lg">
                    {#if isSignedIn}
                        <button class="yt-settings-account-details__replace-btn btn-text-only" on:click={handleYtSignUp}>Use a different account</button>
                        <button class="yt-settings-account-details__unlink-btn btn-text-only" on:click={handleUnlinkCurrentYtAccount}>Unlink Account</button>
                    {:else}
                        <button class="yt-settings-account-details__unlink-btn btn-line" on:click={handleYtSignUp}>Connect a Youtube account</button>
                    {/if}
                </div>
            </div>
            <div class={`yt-settings-playlists section-bg ${!isSignedIn ? "yt-settings-playlists--min" : ""} `}>
                <div class="yt-settings-playlists__header flx flx--aln-center flx--space-between">
                    <h2>Playlists</h2>
                    {#if isSignedIn}
                        <p>{`${ytUserAccountData.playlists.length} video${ytUserAccountData.playlists.length > 1 ? "s" : ""}`}</p>
                    {/if}
                </div>
                <ul class="yt-settings-playlists__list">
                    {#if isSignedIn}
                        <div class="yt-settings-playlists__list-header flx">
                            <div class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--title-group flx">
                                <h4 class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--num">#</h4>
                                <h4 class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--title">Title</h4>
                            </div>
                            <h4 class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--author">Author</h4>
                            <h4 class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--length">Length</h4>
                            <h4 class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--time">Time</h4>
                        </div>
                        {#each ytUserAccountData.playlists as playlist, idx}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <li on:click={() => handleClickedPlaylist(idx)} 
                                class={`yt-settings-playlists__list-item ${clickedPlaylistId === idx ? "yt-settings-playlists__list-item--clicked" : ""}  ${ytUserAccountData.selectedPlaylistId === idx ? "yt-settings-playlists__list-item--chosen" : ""} flx flx--algn-center`}>
                                <div class="divider divider--thin divider--top"></div>
                                <div class="yt-settings-playlists__list-item title-group flx flx--algn-center">
                                    <p class="yt-settings-playlists__list-item num">{idx + 1}</p>
                                    <img src={`${playlist.thumbnailURL}`} alt="yt-profile-pic" />
                                    <p class="yt-settings-playlists__list-item title">{playlist.title}</p>
                                </div>
                                <p class="yt-settings-playlists__list-item author">{playlist.channelTitle}</p>
                                <p class="yt-settings-playlists__list-item length">{`${playlist.vidCount} video${playlist.vidCount > 1 ? "s" : ""}`}</p>
                                <p class="yt-settings-playlists__list-item time">2 hours 34 mins</p>
                                <div class="divider divider--thin divider--bottom"></div>
                            </li>
                        {/each}
                    {:else}
                        <p class="yt-settings-playlists__list-inactive-msg">Sign in to a Youtube account to see your playlists!</p>
                    {/if}
                </ul>
            </div>
            {#if isSignedIn}
                <button class={`yt-settings-playlist-btn btn-line ${clickedPlaylistId < 0 || (ytUserAccountData.selectedPlaylistId >= 0 &&  clickedPlaylistId) === ytUserAccountData.selectedPlaylistId ? "hide" : ""}`} on:click={handleChoosePlaylist}>Pick Playlist</button>
                <button class={`yt-settings-playlist-btn btn-line ${ytUserAccountData.selectedPlaylistId >= 0 && clickedPlaylistId === ytUserAccountData.selectedPlaylistId ? "" : "hide"}`} on:click={handleRemoveChoosenPlaylist}>Unpick Playlist</button>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    .modal {
        &--content {
            overflow: hidden;
        } 
    }
    .yt-settings {
        width: 75vw;
        height: 75vh;
        max-height: 600px;
        max-width: 600px;
        min-width: 400px;
        
        &--min {
            width: 50vh;
            height: 35vh;
        }
    }
    .yt-settings-header {
        @include flex-container(center, _);
        margin-bottom: 25px;
        h1 {
            font-size: 1.7rem;
        }
        &__yt-icon {
            position: relative;
            margin: 3px 0px 20px 22px;
            i, .yt-icon-fill {
                position: absolute;
                transform: translate(-50%, 0);
            }
            i {
                border-radius: 100%;
                font-size: 1.8rem;
                color: #313131;
            }
            .yt-icon-fill {
                width: 7px;
                height: 7px;
                top: 5px;
            }

            &--active {
                .yt-icon-fill {
                    box-shadow: 0px 0px 12px 5px rgba(223, 107, 107, 0.28);
                    background-color: white;
                }
                i {
                    color: #e44141;
                }
            }
        }
    }
    .yt-settings-account-details {
        height: 130px;
        padding: 10px 15px 15px 20px;
        margin-bottom: 15px;
        background-color: #161617;
        font-family: "Manrope";
        position: relative;
        h2 {
            font-size: 1.15rem;
            margin-bottom: 20px;
        }
        img {
            @include circle(40px);
            margin-right: 15px;
        }
        &__blank-img {
            @include circle(40px);
            margin-right: 15px;
            background-color: #100F11;
        }
        &__section {
            margin-right: 15px;
            h3 {
                font-weight: 700;
                margin-bottom: 4px;
                font-size: 1rem;
            }
            p {
                font-weight: 300;
                color: #7e7e7e;
            }
        }
        &__replace-btn {
            margin-right: 10px;
        }
        &__unlink-btn {

        }
    }
    .yt-settings-playlists {
        overflow-y: scroll;
        height: 60%;
        margin-bottom: 20px;

        &--min {
            height: 30%;
        }

        &__header {
            margin-bottom: 20px;
            h2 {
                font-size: 1.15rem;
            }
            p {
                font-size: 0.85rem;
                color: rgb(155, 155, 155);
                margin-right: 10px;
            }
        }
        &__list-header {
            margin: 10px 0px 25px 0px;
        }
        &__list-col-name {
            color: rgb(129, 129, 129);
            font-weight: 600;
            font-size: 0.75rem;
            @include elipses-overflow;

            &--title-group {
                width: 35%;
                min-width: 150px;
            }
            &--num {
                margin: 0px 10px 0px 5px;
            }
            &--author {
                width: 35%;
                text-align: center;
            }
            &--length {
                width: 20%;
                margin-right: 15px;
                text-align: center;
            }
            &--time {
                width: 15%;
                margin-right: 15px;
                text-align: center;
            }
        }
        &__list {
            margin-bottom: 15px;
        }
        &__list-inactive-msg {
            color: rgb(129, 129, 129);
            text-align: center;
        }
        &__list-item {
            position: relative;
            padding: 6px 0px;
            color: rgb(129, 129, 129);
            font-weight: 600;
            font-size: 0.75rem;
            cursor: pointer;
            transition: 0.01s ease-in-out;
            border-radius: 5px;

            @include elipses-overflow;

            &:hover {
                background-color: #1c1c1d;
            }
            &--clicked {
                background-color: #1c1c1d;
            }
            &--chosen {
                background-color: rgb(18, 18, 19);
            }

            p {
                @include elipses-overflow;
            }
            img {
                width: 75px;
                border-radius: 5px;
                object-fit: cover;
                aspect-ratio: 16 / 9;
                margin-right: 10px;
            }
            .title-group {
                width: 35%;
                min-width: 150px;
            }
            .num {
                margin: 0px 10px 0px 5px;
            }
            .author {
                width: 35%;
                text-align: center;
            }
            .length {
                width: 20%;
                margin-right: 15px;
                text-align: center;
            }
            .time {
                width: 15%;
                margin-right: 15px;
                text-align: center;
            }

            .divider {
                margin: 0px;
                background-color: rgb(33, 33, 33);
            }
        }
    }
    .yt-settings-playlist-btn {
        position: absolute;
        bottom: 30px;
        right: 30px;
    }
</style>