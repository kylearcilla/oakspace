<script lang="ts">
    import { LogoIcon, ModalType, MusicPlatform } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { closeModal } from "$lib/utils-home";
	import Logo from "../../components/Logo.svelte";
	import Modal from "../../components/Modal.svelte"

    const mediaImages = [
        "https://is1-ssl.mzstatic.com/image/thumb/Features221/v4/9d/ca/68/9dca68b4-c422-09ff-903c-9d56de1b37d6/b8b16bad-624b-4004-baaa-eb5dd20227cb.png/220x220SC.DN01.webp?l=en-US",
        "https://is1-ssl.mzstatic.com/image/thumb/Features126/v4/3e/2a/09/3e2a0903-d0b5-d43a-9d00-c94ea1767579/61088f1a-08a9-4717-9909-3838749b2d01.png/220x220SC.DN01.webp?l=en-US",
        "https://is1-ssl.mzstatic.com/image/thumb/Features211/v4/f0/8a/1a/f08a1a7c-1b1b-5aaa-26e1-60f274f1adfd/f68e7ca9-849d-4cdb-a594-959480590c46.png/220x220sr.webp",
        "https://i.scdn.co/image/ab67706f0000000238bda6b4b4b59a21f6dcacb0",
        "https://i.scdn.co/image/ab67706f000000025853d332fd9441419b8a2f94",
        "https://i.scdn.co/image/ab6765630000ba8aaa4830256e4b613f07287208"
    ]

    export let _loginUser: (platform: MusicPlatform) => void

    const onClickOutSide = () => closeModal(ModalType.Music)
</script>

<Modal options={{ borderRadius: "43px" }} onClickOutSide={onClickOutSide}> 
    <div 
        class="music"
        class:music--light={!$themeState.isDarkTheme}
    >
        <h1 class="modal-bg__content-title">
            Music
        </h1>
        <div class="music__platform music__platform--apple-music bento-box">
            <div class="music__platform-logo">
                <Logo 
                    logo={LogoIcon.AppleMusic} 
                    options={{ containerWidth: "42px", borderRadius: "100%", iconWidth: "50%" }} 
                />
            </div>
            <div>
                <div class="music__platform-title">
                    Apple Music
                </div>
                <div class="music__platform-features">
                    <div class="music__platform-feature">Playlists</div>
                    <div class="music__platform-feature">Albums</div>
                    <div class="music__platform-feature">Live Radio</div>
                    <div class="music__platform-feature">User Library</div>
                </div>
            </div>
            <button 
                class="music__platform-connect-btn"
                data-platform="apple-music"
                on:click={() => _loginUser(MusicPlatform.AppleMusic)}
            >
                Connect
            </button>
            <div class="music__platform-imgs">
                {#each [0, 1, 2] as imgIdx}
                    <img
                        class={`music__platform-img media-img-${imgIdx + 1}`}
                        src={mediaImages[imgIdx]} 
                        alt="platform-collection"
                    >
                {/each}
            </div>
        </div>
        <div class="music__platform bento-box">
            <div class="music__platform-logo">
                <Logo 
                    logo={LogoIcon.Spotify} 
                    options={{ containerWidth: "45px", iconWidth: "85%", hasBgColor: false }} 
                />
            </div>
            <div>
                <div class="music__platform-title">
                    Spotify
                </div>
                <div class="music__platform-features">
                    <div class="music__platform-feature">Playlists</div>
                    <div class="music__platform-feature">Albums</div>
                    <div class="music__platform-feature">Podcasts</div>
                    <div class="music__platform-feature">User Library</div>
                </div>
            </div>
            <button 
                class="music__platform-connect-btn"
                data-platform="spotify"
                on:click={() => _loginUser(MusicPlatform.Spotify)}
            >
                Connect
            </button>
            <div class="music__platform-imgs">
                {#each [3, 4, 5] as imgIdx}
                    <img
                        class={`music__platform-img media-img-${imgIdx - 2}`}
                        src={mediaImages[imgIdx]} 
                        alt="platform-collection"
                    >
                {/each}
            </div>
        </div>
    </div>
</Modal>

<style lang="scss">
    @import "../../scss/brands.scss";
    
    .music {
        width: 500px;
        padding: 18.5px;

        &--light .bento-box {
            @include bento-box-light;
        }
        &--light &__platform {
            border: 1.5px solid rgba(var(--textColor1), 0.02);
        }
        &--light &__platform:hover &__platform-imgs {
            opacity: 1;
        }
        &--light &__platform-title {
            @include text-style(1, 600);
        }
        &--light &__platform-features {
            @include text-style(0.55, 600, 1.34rem);
        }
        &--light &__platform-imgs {
            opacity: 0.6;
        }
        &--light &__platform-connect-btn {
            @include text-style(_, 500, 1.24rem);
            opacity: 1;

            &:hover {
                opacity: 0.5;
            }
        }

        h1 {
            font-size: 1.3em;
            font-weight: 400;
            margin-bottom: 21px;
            display: none;
        }
        &__platform {
            padding: 32px 10px 45px 10px;
            position: relative;
            border: 1.5px solid rgba(var(--textColor1), 0.02);
            border-radius: 28px;
            background-color: var(--bentoBoxBgColor);
            overflow: hidden;
            @include flex(center);

            
            &--apple-music {
                margin-bottom: 10px;
            }

            &:hover &-imgs {
                opacity: 0.8;
            }
            &:hover .media-img-1 {
                transform: rotate(-6deg) scale(1.1);
            }
            &:hover .media-img-2 {
                transform: rotate(8deg) scale(1.1);
            }
            &:hover .media-img-3 {
                transform: rotate(-8deg) scale(1.1);
            }
        }
        &__platform-logo {
            padding: 0px 35px 0px 28px;
        }
        &__platform-title {
            @include text-style(1, 500, 1.78rem);
            margin-bottom: 16px;
        }
        &__platform-features {
            @include text-style(0.28, 500, 1.34rem);
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            column-gap: 25px;
            row-gap: 8px;
        }
        &__platform-connect-btn {
            @include text-style(_, 300, 1.24rem, "DM Mono");
            @include abs-bottom-right(25px, 40px);
            opacity: 0.4;

            &:hover {
                opacity: 1;
            }
        }
        &__platform-imgs {
            transition: 0.4s ease-in-out;
            opacity: 0.05;
        }
        &__platform-img {
            position: absolute;
            height: 60px;
            aspect-ratio: calc(1 / 1);
            border-radius: 10px;
            border: 2px solid white;
            transition: 0.3s cubic-bezier(.4,0,.2,1);
        }
    }

    .media-img-1 {
        top: -24px;
        right: 60px;
        transform: rotate(-1.5deg);

        &:hover {
            transform: rotate(-6deg) scale(1.14) !important;
        }
    }
    .media-img-2 {
        top: 10px;
        right: 25px;
        transform: rotate(5deg);

        &:hover {
            transform: rotate(8deg) scale(1.14) !important;
        }
    }
    .media-img-3 {
        top: 25px;
        right: -25px;
        transform: rotate(-10deg);

        &:hover {
            transform: rotate(-8deg) scale(1.14) !important;
        }
    }

    @media (max-width: 550px) {
        .music {
            width: 450px;
        }
        .music__platform-connect-btn {
            @include abs-bottom-right(25px, 25px);
        }
    }

</style>