<script lang="ts">
    import { clickOutside } from "../../lib/helper";
    export let onNavButtonClicked: any;

    let isModalOpen = true;
    let pickedPlaylistId = -1;
    let clickedPlaylistId = -1;
    let isSignedIn = true;

    const closeModal = () => onNavButtonClicked("")
    const handleClickedPlaylist = (playlistIndex: number) => {
        if (playlistIndex === pickedPlaylistId) {
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
        pickedPlaylistId = clickedPlaylistId
    }
    const handleRemoveChoosenPlaylist = () => {
        pickedPlaylistId = -1;
        clickedPlaylistId = -1;
    }

</script>

<div class={`modal-bg ${isModalOpen ? "" : "modal-bg--hidden"}`}>
    <div use:clickOutside on:click_outside={closeModal} class="modal-bg__content">
        <button on:click={closeModal} class="close-btn">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="yt-settings">
            <div class="yt-settings-header">
                <h1>Spotify Settings</h1>
                <i class={`fa-brands fa-spotify yt-settings-header__spotify-icon ${isSignedIn ? "yt-settings-header__spotify-icon--active" : ""}`}></i>
            </div>
            <div class="yt-settings-account-details section-bg">
                <h2>Account Details</h2>
                <div class="flx flx--aln-center">
                    <img src="https://i.pinimg.com/564x/87/7a/f8/877af84ee302075f969be04f809a0e5f.jpg" alt="yt-profile-pic" />
                    <div class="yt-settings-account-details__section"> 
                        <h3>Account</h3>
                        <p>kylearcilla09@gmail.com</p>
                    </div>
                    <div class="yt-settings-account-details__section"> 
                        <h3>Name</h3>
                        <p>Rambler Korea</p>
                    </div>
                </div>
                <div class="abs-bottom-right abs-bottom-right--padded-lg">
                    <button class="yt-settings-account-details__replace-btn btn-text-only" on:click={() => console.log("sdf")}>Use a different account</button>
                    <button class="yt-settings-account-details__unlink-btn btn-text-only" on:click={() => console.log("y")}>Unlink Account</button>
                </div>
            </div>
            <div class="yt-settings-playlists section-bg">
                <div class="yt-settings-playlists__header flx flx--aln-center flx--space-between">
                    <h2>Playlists</h2>
                    <p>23 playlists</p>
                </div>
                <div class="yt-settings-playlists__list-header flx">
                    <div class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--title-group flx">
                        <h4 class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--num">#</h4>
                        <h4 class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--title">Title</h4>
                    </div>
                    <h4 class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--author">Author</h4>
                    <h4 class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--length">Length</h4>
                    <h4 class="yt-settings-playlists__list-col-name yt-settings-playlists__list-col-name--time">Time</h4>
                </div>
                <ul class="yt-settings-playlists__list">
                    {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as i}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li on:click={() => handleClickedPlaylist(i)} 
                            class={`yt-settings-playlists__list-item ${clickedPlaylistId === i ? "yt-settings-playlists__list-item--clicked" : ""}  ${pickedPlaylistId === i ? "yt-settings-playlists__list-item--chosen" : ""} flx flx--algn-center`}>
                             <div class="divider divider--thin divider--top"></div>
                            <div class="yt-settings-playlists__list-item title-group flx flx--algn-center">
                                <p class="yt-settings-playlists__list-item num">{i}</p>
                                <img src="https://i.pinimg.com/564x/87/7a/f8/877af84ee302075f969be04f809a0e5f.jpg" alt="yt-profile-pic" />
                                <p class="yt-settings-playlists__list-item title">Lifestyle</p>
                            </div>
                            <p class="yt-settings-playlists__list-item author">dark09aura</p>
                            <p class="yt-settings-playlists__list-item length">24 Items</p>
                            <p class="yt-settings-playlists__list-item time">2 hours 34 mins</p>
                            <div class="divider divider--thin divider--bottom"></div>
                        </li>
                    {/each}
                </ul>
            </div>
            <button class={`yt-settings-playlist-btn btn-line ${clickedPlaylistId < 0 || (pickedPlaylistId >= 0 &&  clickedPlaylistId) === pickedPlaylistId ? "hide" : ""}`} on:click={handleChoosePlaylist}>Pick Playlist</button>
            <button class={`yt-settings-playlist-btn btn-line ${pickedPlaylistId >= 0 && clickedPlaylistId === pickedPlaylistId ? "" : "hide"}`} on:click={handleRemoveChoosenPlaylist}>Unpick Playlist</button>
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
        width: 70vw;
        height: 65vh;
        max-width: 700px;
        min-width: 400px;
    }
    .yt-settings-header {
        @include flex-container(center, _);
        margin-bottom: 25px;
        h1 {
            font-size: 1.7rem;
        }
        &__spotify-icon {
            color: #313131;
            font-size: 1.8rem;
            margin-left: 10px;
            &--active {
                color: #94F292;
                box-shadow: 0px 2px 9px rgba(148, 242, 146, 0.16);
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
                width: 25%;
                min-width: 150px;
            }
            &--num {
                margin: 0px 10px 0px 5px;
            }
            &--author {
                width: 25%;
                text-align: center;
            }
            &--length {
                width: 25%;
                margin-right: 15px;
                text-align: center;
            }
            &--time {
                width: 25%;
                margin-right: 15px;
                text-align: center;
            }
        }
        &__list {
            margin-bottom: 15px;
        }
        &__list-item {
            position: relative;
            padding: 6px 0px;
            color: rgb(129, 129, 129);
            font-weight: 600;
            font-size: 0.75rem;
            cursor: pointer;
            transition: 0.1s ease-in-out;
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
                width: 45px;
                border-radius: 1px;
                object-fit: cover;
                aspect-ratio: 1 /1;
                margin-right: 10px;
            }
            .title-group {
                width: 25%;
                min-width: 150px;
            }
            .num {
                margin: 0px 10px 0px 5px;
            }
            .author {
                width: 25%;
                text-align: center;
            }
            .length {
                width: 25%;
                margin-right: 15px;
                text-align: center;
            }
            .time {
                width: 25%;
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
        right: 30px;
    }
</style>