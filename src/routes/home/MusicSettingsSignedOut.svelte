<script lang="ts">
    import { LogoIcon, ModalType, MusicPlatform } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { closeModal } from "$lib/utils-home";
	import Logo from "../../components/Logo.svelte";
	import Modal from "../../components/Modal.svelte"

    export let _loginUser: (platform: MusicPlatform) => Promise<void>

    const onClickOutSide = () => closeModal(ModalType.Music)
</script>

<Modal options={{ borderRadius: "24px" }} onClickOutSide={onClickOutSide}> 
    <div class={`music music--small ${!$themeState.isDarkTheme ? "music--light" : ""}`}>
        <h1 class="modal-bg__content-title">
            Music
        </h1>
        <p class="music__description">
            Sync your favorite music platforms to enjoy your personal library or discover our curated picks.
        </p>
        <h2>
            Link an Account
        </h2>
        <ul class="platform-list platform-list--logged-out section-bg">
            <li class="platform-list__platform-item platform-list__platform-item--logged-out">
                {#if !$themeState.isDarkTheme}
                    <i class="fa-brands fa-youtube fa-youtube--no-bg"></i>
                {:else}
                    <div class="platform-list__platform-item-logo">
                        <Logo 
                            logo={LogoIcon.YoutubeMusic} 
                            options={{ containerWidth: "24px", borderRadius: "100%", iconWidth: "63%" }} 
                        />
                    </div>
                {/if}
                <div class="platform-list__platform-item-text platform-list__platform-item-text--logged-out">
                    <h3>Youtube</h3>
                    <p>Playlist, Live Videos</p>
                </div>
                <button 
                    class="platform-list__platform-item-btn platform-list__platform-item-btn--logged-out"
                    on:click={() => _loginUser(MusicPlatform.YoutubeMusic)}
                >
                    Connect
                </button>
            </li>
            <li class="platform-list__platform-item platform-list__platform-item--logged-out">
                <div class="platform-list__platform-item-logo">
                    <Logo 
                        logo={LogoIcon.Soundcloud} 
                        options={{ containerWidth: "24px", borderRadius: "100%", iconWidth: "60%" }} 
                    />
                </div>
                <div class="platform-list__platform-item-text platform-list__platform-item-text--logged-out">
                    <h3>Soundcloud</h3>
                    <p>Playlists</p>
                </div>
                <button 
                    class="platform-list__platform-item-btn platform-list__platform-item-btn--logged-out"
                    on:click={() => _loginUser(MusicPlatform.Soundcloud)}
                >
                    Connect
                </button>
            </li>
            <li class="platform-list__platform-item platform-list__platform-item--logged-out">
                <div class="platform-list__platform-item-logo">
                    <Logo 
                        logo={LogoIcon.AppleMusic} 
                        options={{ containerWidth: "24px", borderRadius: "100%", iconWidth: "44%" }} 
                    />
                </div>
                <div class="platform-list__platform-item-text platform-list__platform-item-text--logged-out">
                    <h3>Apple Music</h3>
                    <p>Playlists, Radio Stations</p>
                </div>
                <button 
                    class="platform-list__platform-item-btn platform-list__platform-item-btn--logged-out"
                    on:click={() => _loginUser(MusicPlatform.AppleMusic)}
                >
                    Connect
                </button>
            </li>
            <li class="platform-list__platform-item platform-list__platform-item--logged-out">
                <div class="platform-list__platform-item-logo">
                    <Logo 
                        logo={LogoIcon.Spotify} 
                        options={{ containerWidth: "24px", iconWidth: "85%", hasBgColor: false }} 
                    />
                </div>
                <div class="platform-list__platform-item-text platform-list__platform-item-text--logged-out">
                    <h3>Spotify</h3>
                    <p>Playlists, Podcasts</p>
                </div>
                <button 
                    class="platform-list__platform-item-btn platform-list__platform-item-btn--logged-out"
                    on:click={() => _loginUser(MusicPlatform.Spotify)}
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
        width: 380px;
        padding: 18px 27px 32px 27px;

        h2 {
            font-size: 1.3em;
            font-weight: 400;
            margin-bottom: 21px;
        }
        &__description {
            margin: 8px 0px 28px 0px;
            @include text-style(0.5, 300, 1.3rem)
        }
        &--light {
            h2 {
                font-weight: 600;
            }
        }
        &--light .platform-list {
            &__platform-item-text {
                @include text-style(0.88, 600)
            }
            &__platform-item-text {
                font-weight: 500;
            }
            button {
                font-weight: 600 !important;
            }
        }
    }

    .platform-list {
        box-shadow: var(--bentoBoxShadow);
        @include pos-abs-top-right-corner(0px, 0px);
        position: relative;
        width: 100%;
        border-radius: 15px;


        &__platform-item {
            @include flex(center, _);
            margin-bottom: 16px;

            &:last-child {
                margin-bottom: 0px;
            }
        }
        &__platform-item-logo {
            @include flex(center, center);
        }
        &__platform-item-btn {
            position: absolute;
            right: 10px;
            padding: 8px 19px;
            border-radius: 20px;
            transition: 0s;
            @include center;
            @include text-style(0.6, 500, 1.14rem);
            @include text-color(0.03, "background");
            
            &:hover {
                @include text-color(0.07, "background");
            }
            &:active {
                transition: 0.1s ease-in-out;
            }
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