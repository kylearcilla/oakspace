<script lang="ts">
    import { MusicPlatform } from "$lib/enums"
	import { homeViewLayout, themeState } from "$lib/store"
	import Modal from "../../components/Modal.svelte"

    export let _loginUser: (platform: MusicPlatform) => Promise<void>

    const onClickOutSide = () => homeViewLayout.update((data: HomeLayout) => ({ ...data, settingsModal: null }))
</script>

<Modal onClickOutSide={onClickOutSide}> 
    <div class={`music music--small ${!$themeState.isDarkTheme ? "music--light" : ""}`}>
        <h1 class="modal-bg__content-title">
            Music
        </h1>
        <p class="music__description">
            Sync your favorite music streaming service to listen to your playlists or from our recommended playlists.
        </p>
        <h2>
            Link an Account
        </h2>
        <ul class="platform-list platform-list--logged-out section-bg">
            <li class="platform-list__platform-item platform-list__platform-item--logged-out">
                {#if !$themeState.isDarkTheme}
                    <i class="fa-brands fa-youtube fa-youtube--no-bg"></i>
                {:else}
                    <div class="platform-list__platform-item__logo platform-logo platform-logo--youtube">
                        <i class="fa-brands fa-youtube"></i>
                    </div>
                {/if}
                <div class="platform-list__platform-item-text platform-list__platform-item-text--logged-out">
                    <h3>Youtube</h3>
                    <p>Playlist</p>
                </div>
                <button 
                    class="platform-list__platform-item-btn platform-list__platform-item-btn--logged-out text-only"
                    on:click={() => _loginUser(MusicPlatform.YoutubeMusic)}
                >
                    Connect
                </button>
            </li>
            <li class="platform-list__platform-item platform-list__platform-item--logged-out">
                <div class="platform-list__platform-item__logo platform-logo platform-logo--soundcloud">
                    <i class="fa-brands fa-soundcloud"></i>
                </div>
                <div class="platform-list__platform-item-text platform-list__platform-item-text--logged-out">
                    <h3>Soundcloud</h3>
                    <p>Playlist</p>
                </div>
                <button 
                    class="platform-list__platform-item-btn platform-list__platform-item-btn--logged-out text-only"
                    on:click={() => _loginUser(MusicPlatform.Soundcloud)}
                >
                    Connect
                </button>
            </li>
            <li class="platform-list__platform-item platform-list__platform-item--logged-out">
                <div class="platform-list__platform-item__logo platform-logo platform-logo--apple">
                    <i class="fa-brands fa-itunes-note"></i>
                </div>
                <div class="platform-list__platform-item-text platform-list__platform-item-text--logged-out">
                    <h3>Apple Music</h3>
                    <p>Playlists</p>
                </div>
                <button 
                    class="platform-list__platform-item-btn platform-list__platform-item-btn--logged-out text-only"
                    on:click={() => _loginUser(MusicPlatform.AppleMusic)}
                >
                    Connect
                </button>
            </li>
            <li class="platform-list__platform-item platform-list__platform-item--logged-out">
                <div class="platform-list__platform-item__logo platform-logo platform-logo--spotify">
                    <i class="fa-brands fa-spotify"></i>
                </div>
                <div class="platform-list__platform-item-text platform-list__platform-item-text--logged-out">
                    <h3>Spotify</h3>
                    <p>Playlists, Podcasts</p>
                </div>
                <button 
                    class="platform-list__platform-item-btn platform-list__platform-item-btn--logged-out text-only"
                    on:click={() => _loginUser(MusicPlatform.AppleMusic)}
                >
                    Connect
                </button>
            </li>
        </ul>
    </div>
</Modal>

<style lang="scss">
    @import "../../scss/brands.scss";
    
    .music {
        width: 340px;
        height: 350px;
        min-width: fit-content;

        h2 {
            font-size: 1.3em;
            font-weight: 400;
        }
        &__description {
            margin-bottom: 23px;
            font-size: 1.15rem;
            font-weight: 300;
            color: rgba(var(--textColor1), 0.55);
        }
        &--light {
            h2 {
                font-weight: 600;
            }
        }
        &--light .platform-list {
            background: var(--bentoBoxBgColor);

            &__platform-item-text h3 {
                font-weight: 600;
                color: rgba(var(--textColor1), 0.88);
            }
            &__platform-item-text p {
                font-weight: 500;
            }
            button {
                font-weight: 600 !important;
            }
        }
    }

    .platform-list {
        background: var(--hoverColor);
        box-shadow: var(--bentoBoxShadow);
        padding: 12px 5px 15px 13px;
        @include pos-abs-top-right-corner(0px, 0px);
        position: relative;
        width: 100%;
        padding: 17px 5px 25px 18px; 
        margin-top: 11px;
        border-radius: 15px;


        &__platform-item {
            @include flex-container(center, _);
            margin-bottom: 18px;

            &:last-child {
                margin-bottom: 0px;
            }
        }
        &__platform-item-btn {
            position: absolute;
            right: 10px;
            padding: 7px 0px 7px 10px;
            color: rgba(var(--textColor1), 0.6);
            transition: 0.1s ease-in-out;
            width: 60px;
            margin-right: 15px;
            font-size: 1.1rem !important;
            font-weight: 500 !important;
            @include center;
        }

        &__platform-item-text {
            margin: -2px 0px 0px 16px;
            h3 {
                font-size: 1.28rem;
                font-weight: 500;
            }
            p {
                color: rgba(var(--textColor1), 0.4);
                font-weight: 300;
                font-size: 1.15rem;
            }
        }
    }
</style>