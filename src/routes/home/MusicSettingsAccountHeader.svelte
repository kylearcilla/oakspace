<script lang="ts">
	import { themeState, musicDataStore } from "$lib/store"
	import { clickOutside, getLogoIconFromEnum } from "$lib/utils-general"
	import { addSpacesToCamelCaseStr } from "$lib/utils-general"
    import { Icon, LogoIcon, MusicPlatform } from "$lib/enums"
	import Logo from "../../components/Logo.svelte"
	import { onMount } from "svelte"
	import SvgIcon from "../../components/SVGIcon.svelte";
	import BounceFade from "../../components/BounceFade.svelte";
	import DropdownList from "../../components/DropdownList.svelte";

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
            id="music-logout--dropdown-btn"
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
    <!-- Logout -->
    <DropdownList 
        id="music-logout"
        isHidden={!isPlatformListOpen} 
        options={{
            listItems: [{ name: "Log out" }],
            position: { 
                top: "45px",
                right: platform === MusicPlatform.AppleMusic ? "25px" : "90px"
            },
            styling:  { 
                width: "140px",
                zIndex: 100
            },
            onListItemClicked: () => {
                if (platform || platform === 0) {
                    onBtnClick(platform)
                }
            },
            onClickOutside: () => {
                isPlatformListOpen = false
            }
        }}
    />
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
                @include text-style(0.7, 500, 1.1rem);
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
            width: 1px;
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
            @include text-style(0.85, 500, 1.14rem)
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
</style>