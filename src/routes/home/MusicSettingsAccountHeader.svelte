<script lang="ts">
	import { themeState, musicDataStore } from "$lib/store"
	import { clickOutside, getLogoIconFromEnum } from "$lib/utils-general"
	import { addSpacesToCamelCaseStr } from "$lib/utils-general"
    import { Icon, LogoIcon, MusicPlatform } from "$lib/enums"
	import Logo from "../../components/Logo.svelte"
	import { onMount } from "svelte"
	import SvgIcon from "../../components/SVGIcon.svelte";
	import BounceFade from "../../components/BounceFade.svelte";

    export let onBtnClick: (platform: MusicPlatform) => void
    
    let icon: LogoIcon
    let iconOptions: LogoContainerOptions
    let isPlatformListOpen = false

    let isLight = !$themeState.isDarkTheme

    const LOGO_WIDTH = 15
    const BORDER_RADIUS = 6.5
    const HEADER_ICON_OPTIONS = {
        AppleMusic: { iconWidth: "50%" },
        Spotify: { iconWidth: "90%", hasBgColor: false },
        YoutubeMusic: { iconWidth: "60%" },
        Soundcloud: { iconWidth: "60%" },
        Youtube: { iconWidth: "60%" },
        Google: { iconWidth: "60%" },
        Luciole: { iconWidth: "60%" }
    }
    
    $: musicStore  = $musicDataStore
    $: platform    = $musicDataStore?.musicPlatform
    $: hasTokenExpired  = $musicDataStore?.hasTokenExpired
    $: userDetails = $musicDataStore?.userDetails

    onMount(() => {
        // get the icon enum & options to be used in Icon component
        icon = getLogoIconFromEnum(platform, MusicPlatform)

        const iconStrIdx = LogoIcon[icon] as keyof typeof HEADER_ICON_OPTIONS
        iconOptions = HEADER_ICON_OPTIONS[iconStrIdx]
    })
</script>

<div 
    class="active-account-header"
    class:active-account-header--dark={!isLight}
    class:active-account-header--light={isLight}
>
    <div class="active-account-header__btn-container">
        <button 
            id="music-platforms--dropdown-btn"
            class="active-account-header__btn dropdown-btn" 
            class:active-account-header__btn--active={isPlatformListOpen} 
            on:click={() => isPlatformListOpen = !isPlatformListOpen}
        >
            {#if iconOptions}
                <Logo 
                    logo={icon} 
                    options={{ 
                        containerWidth: `${LOGO_WIDTH}px`, borderRadius: `${BORDER_RADIUS}px`, ...iconOptions
                    }} 
                />
            {/if}
            {#if musicStore?.isSignedIn && platform != null}
                <span>
                    {addSpacesToCamelCaseStr(MusicPlatform[platform])}
                </span>
            {/if}
            <div class="active-account-header__btn-arrow">
                <SvgIcon 
                    icon={Icon.Dropdown} 
                    options={{ 
                        opacity: 1, scale: 1.14, strokeWidth: 1.2, 
                        height: 12, width: 12
                    }}>
                </SvgIcon>
            </div>
        </button>
        {#if platform != MusicPlatform.AppleMusic}
            <div 
                style:opacity={isPlatformListOpen ? 0 : 1}
                class="active-account-header__btn-divider"
            >
            </div>
        {/if}
    </div>
    <!-- No way to get account details from Music Kit -->
    {#if userDetails}
        <div class="active-account-header__user">
            <a class="active-account-header__user-name" href={userDetails.url} target="_blank" rel="noreferrer">
                {userDetails.username}
            </a>
            <div class="active-account-header__user-profile-pic">
                <img src={userDetails.profileImgSmall} alt="">
            </div>
        </div>
    {/if}
    <!-- Music Platform Dropdown List -->

    <BounceFade
        zIndex={100}
        isHidden={!isPlatformListOpen}
    >
        <ul 
            id="music-platforms--dropdown-menu"
            class={`platform-list dropdown-menu
                        ${$themeState.isDarkTheme ? "" : "platform-list--light"}
                        ${musicStore && isPlatformListOpen ? "" : "dropdown-menu--hidden"}
                `} 
            use:clickOutside on:click_outside={() => isPlatformListOpen = false}
            
        >
            <li class="platform-list__item">
                <div class="flx">
                    <div class="platform-list__item-logo">
                        <Logo 
                            logo={LogoIcon.Soundcloud} 
                            options={{ containerWidth: "20px", borderRadius: "9px", iconWidth: "65%" }} 
                        />
                    </div>
                    <div class="platform-list__item-text">
                        <div class="platform-list__item-name">Soundcloud</div>
                        <div class="platform-list__item-content">Playlists</div>
                    </div>
                </div>
                <button 
                    class={`platform-list__item-btn ${platform === MusicPlatform.Soundcloud ? "platform-list__item-btn--selected" : ""}`}
                    on:click={() => onBtnClick(MusicPlatform.Soundcloud)}
                >
                    {platform === MusicPlatform.Soundcloud ? "Disconnect" : "Connect"}
                </button>
            </li>
            <li class="platform-list__item">
                <div class="flx">
                    <div class="platform-list__item-logo">
                        <Logo 
                            logo={LogoIcon.YoutubeMusic} 
                            options={{ containerWidth: "20px", borderRadius: "7px", iconWidth: "66%" }} 
                        />
                    </div>
                    <div class="platform-list__item-text">
                        <div class="platform-list__item-name">Youtube Music</div>
                        <div class="platform-list__item-content">Playlists, Live Videos</div>
                    </div>
                </div>
                <button 
                    class={`platform-list__item-btn ${platform === MusicPlatform.YoutubeMusic ? "platform-list__item-btn--selected" : ""}`}
                    on:click={() => onBtnClick(MusicPlatform.YoutubeMusic)}
                >
                    {platform === MusicPlatform.YoutubeMusic ? "Disconnect" : "Connect"}
                </button>
            </li>
            <li class="platform-list__item">
                <div class="flx">
                    <div class="platform-list__item-logo">
                        <Logo 
                            logo={LogoIcon.AppleMusic} 
                            options={{ containerWidth: "20px", borderRadius: "10px", iconWidth: "50%" }} 
                        />
                    </div>
                    <div class="platform-list__item-text">
                        <div class="platform-list__item-name">Apple Music</div>
                        <div class="platform-list__item-content">Playlists, Live Radio</div>
                    </div>
                </div>
                <button 
                    class={`platform-list__item-btn ${platform === MusicPlatform.AppleMusic ? "platform-list__item-btn--selected" : ""}`}
                    on:click={() => onBtnClick(MusicPlatform.AppleMusic)}
                >
                    {#if platform === MusicPlatform.AppleMusic && hasTokenExpired}
                        Reconnect
                    {:else}
                        {platform === MusicPlatform.AppleMusic ? "Disconnect" : "Connect"}
                    {/if}
                </button>
            </li>
            <li class="platform-list__item">
                <div class="flx">
                    <div class="platform-list__item-logo">
                        <Logo 
                            logo={LogoIcon.Spotify} 
                            options={{ containerWidth: "19px", borderRadius: "7px", iconWidth: "90%" }} 
                        />
                    </div>
                    <div class="platform-list__item-text">
                        <div class="platform-list__item-name">Spotify</div>
                        <div class="platform-list__item-content">Playlists, Podcasts</div>
                    </div>
                </div>
                <button 
                    class={`platform-list__item-btn ${platform === MusicPlatform.Spotify ? "platform-list__item-btn--selected" : ""}`}
                    on:click={() => onBtnClick(MusicPlatform.Spotify)}
                >
                    {#if platform === MusicPlatform.Spotify && hasTokenExpired}
                        Reconnect
                    {:else}
                        {platform === MusicPlatform.Spotify ? "Disconnect" : "Connect"}
                    {/if}
                </button>
            </li>
        </ul>
    </BounceFade>
</div>

<style lang="scss">
    @import "../../scss/brands.scss";
    @import "../../scss/dropdown.scss";

    .active-account-header {
        border-radius: 10px;
        @include flex(center);

        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &--light {
            background-color: var(--hoverColor);
        }
        &--light &__btn {
            background-color: var(--bentoBoxBgColor);
            border: var(--bentoBoxBorder);
            box-shadow: var(--bentoBoxShadow);
            font-weight: 600;
        }
        
        &__btn-container {
            @include flex(center);
            &:hover .active-account-header__btn-divider {
                @include not-visible;
            }
        }
        &__btn {
            @include flex(center, _);
            padding: 5px 8px 5px 8px;
            border-radius: 10px;
            transition: 0.09s ease-in-out;

            &--active &-arrow {
                transform: rotate(-180deg);
            }
            
            &:active {
                transform: scale(0.98);
            }
            &:hover {
                @include txt-color(0.03, "bg");
            }
            span {
                margin: 0px 5.5px 0px 8px;
                @include text-style(0.7, 400, 1.1rem);
            }
        }
        &__btn-arrow {
            transition: 0.15s cubic-bezier(.4,0,.2,1);
            transform-origin: center;
            transform: rotate(0deg);
            @include center;
            opacity: 0.2;
        }
        &__btn-divider {
            width: 0.5px;
            height: 10px;
            background-color: rgba(var(--textColor1), 0.14);
            margin: 0px 9px 0px 0px;
            transition: 0.1s ease-in-out;
            @include visible;
        }
        &__user {
            @include flex(center);
        }
        &__user-name {
            margin: -1px 9px 0px 0px;
            @include text-style(0.85, 300, 1.14rem)
        }
        &__user-profile-pic img {
            @include circle(16px);
            background-color: #4E4E4F;
        }
        .fa-chevron-down {
            font-size: 0.9rem;
            color: rgb(var(--textColor1));
        }
    }
    
    .platform-list {
        z-index: 10000;
        width: 250px;
        @include abs-top-right(20px, 25px);
        padding: 11px 15px 15px 8px;
        border-radius: 18px;

        &--light &__item-btn {
            font-weight: 600 !important;
            font-size: 1rem !important;
        }
        &--light &__item-text {
            h5 {
                font-weight: 600;
                font-size: 1.05rem;
            }
            span {
                color: rgba(var(--textColor1), 0.5);
                font-weight: 500;
            }
            button {
                font-weight: 600 !important;
            }
        }

        &__item {
            @include flex(center, space-between);
            margin-bottom: 14px;

            &:last-child {
                margin-bottom: 0px;
            }
            &--logged-out {
                margin-bottom: 18px;
            }
        }
        &__item-logo {
            @include flex(center, center);
            width: 30px;
            height: 30px;
        }
        &__item-text {
            margin: -2px 0px 0px 7px;
        }
        &__item-name {
            @include text-style(1, 400, 1.2rem);
            margin-bottom: 2.5px;
        }
        &__item-content {
            @include text-style(0.4, 300, 1.1rem, "DM Sans");
        }
        &__item-btn {
            padding: 7px 0px 7px 10px;
            transition: 0.1s ease-in-out;
            float: right;
            width: 60px;
            @include text-style(0.6, 400, 1.1rem, "DM Sans");
            @include center;

            &:hover {
                opacity: 0.4;
            }
            &:active {
                transform: scale(0.95);
            }
        }
    }
</style>