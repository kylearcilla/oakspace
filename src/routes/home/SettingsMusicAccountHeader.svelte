<script lang="ts">
	import { themeState, musicDataStore } from "$lib/store";
	import { clickOutside } from "$lib/utils-general";
	import { getCurrMusicPlatformName } from "$lib/utils-music";
    import { MusicPlatform } from "$lib/enums";

    export let isPlatformListOpen: boolean
    export let logOutUser: () => Promise<void>

</script>

<div class={`active-account-header ${$themeState.isDarkTheme ? "" : "active-account-header--light"}`}>
    <button class="active-account-header__btn dropdown-btn" on:click={() => isPlatformListOpen = !isPlatformListOpen}>
        {#if $musicDataStore?.musicPlatform === MusicPlatform.Soundcloud}
            <div class="platform-logo platform-logo--small platform-logo--soundcloud dropdown-element">
                <i class="fa-brands fa-soundcloud fa-soundcloud--small"></i>
            </div>
        {:else if $musicDataStore?.musicPlatform === MusicPlatform.YoutubeMusic}
            <div class="platform-logo platform-logo--small platform-logo--youtube dropdown-element">
                <i class="fa-brands fa-youtube fa-youtube--small"></i>
            </div>
        {:else if $musicDataStore?.musicPlatform === MusicPlatform.AppleMusic}
            <div class="platform-logo platform-logo--small platform-logo--apple dropdown-element">
                <i class="fa-brands fa-itunes-note fa-itunes-note--small"></i>
            </div>
        {:else if $musicDataStore?.musicPlatform === MusicPlatform.Spotify}
            <div class="platform-logo platform-logo--small platform-logo--spotify dropdown-element">
                <i class="fa-brands fa-spotify fa-spotify--small"></i>
            </div>
        {/if}
        {#if $musicDataStore?.isSignedIn && $musicDataStore.musicPlatform != null}
            <span>
                {getCurrMusicPlatformName($musicDataStore.musicPlatform)}
            </span>
        {/if}
        <i class="fa-solid fa-chevron-down"></i>
    </button>
    <!-- No way to get account details from Music Kit -->
    {#if $musicDataStore != null && $musicDataStore.musicPlatform !== MusicPlatform.AppleMusic}
        <span class="active-account-header__username">Kyle Arcilla</span>
        <div class="active-account-header__user-profile-pic">
            <img src="" alt="">
        </div>
    {/if}
    <!-- Music Platform Dropdown List -->
    {#if $musicDataStore != null && isPlatformListOpen}
        <ul class={`platform-list  ${$themeState.isDarkTheme ? "" : "platform-list--light"}`} use:clickOutside on:click_outside={() => isPlatformListOpen = false}>
            <li class="platform-list__platform-item">
                <div class="platform-logo platform-logo--small platform-logo--soundcloud">
                    <i class="fa-brands fa-soundcloud fa-soundcloud--small"></i>
                </div>
                <div class="platform-list__platform-item-text">
                    <h5>Soundcloud</h5>
                    <span >Playlist</span>
                </div>
                <button 
                    class={`platform-list__platform-item-btn ${$musicDataStore.musicPlatform === MusicPlatform.Soundcloud ? "platform-list__platform-item-btn--selected" : ""} text-only`}
                    on:click={logOutUser}
                >
                    {$musicDataStore.musicPlatform === MusicPlatform.Soundcloud ? "Disconnect" : "Connect"}
                </button>
            </li>
            <li class="platform-list__platform-item">
                <div class="platform-logo platform-logo--youtube platform-logo--small-youtube">
                    <i class="fa-brands fa-youtube fa-youtube--small"></i>
                </div>
                <div class="platform-list__platform-item-text">
                    <h5>Youtube</h5>
                    <span >Playlist, Live Videos</span>
                </div>
                <button 
                    class={`platform-list__platform-item-btn ${$musicDataStore.musicPlatform === MusicPlatform.YoutubeMusic ? "platform-list__platform-item-btn--selected" : ""} text-only`}
                    on:click={logOutUser}
                >
                    {$musicDataStore.musicPlatform === MusicPlatform.YoutubeMusic ? "Disconnect" : "Connect"}
                </button>
            </li>
            <li class="platform-list__platform-item">
                <div class="platform-logo platform-logo--small platform-logo--apple">
                    <i class="fa-brands fa-itunes-note fa-itunes-note--small"></i>
                </div>
                <div class="platform-list__platform-item-text">
                    <h5>Apple Music</h5>
                    <span >Playlists</span>
                </div>
                <button 
                    class={`platform-list__platform-item-btn ${$musicDataStore.musicPlatform === MusicPlatform.AppleMusic ? "platform-list__platform-item-btn--selected" : ""} text-only`}
                    on:click={logOutUser}
                >
                    {#if $musicDataStore.musicPlatform === MusicPlatform.AppleMusic && $musicDataStore.hasTokenExpired}
                        Reconnect
                    {:else}
                        {$musicDataStore.musicPlatform === MusicPlatform.AppleMusic ? "Disconnect" : "Connect"}
                    {/if}
                </button>
            </li>
            <li class="platform-list__platform-item">
                <div class="platform-logo platform-logo--small platform-logo--spotify">
                    <i class="fa-brands fa-spotify fa-spotify--small"></i>
                </div>
                <div class="platform-list__platform-item-text">
                    <h5>Spotify</h5>
                    <span >Playlists, Podcasts</span>
                </div>
                <button 
                    class={`platform-list__platform-item-btn ${$musicDataStore.musicPlatform === MusicPlatform.Spotify ? "platform-list__platform-item-btn--selected" : ""} text-only`}
                    on:click={logOutUser}
                >
                    {$musicDataStore.musicPlatform === MusicPlatform.Spotify ? "Disconnect" : "Connect"}
                </button>
            </li>
        </ul>
    {/if}
</div>

<style lang="scss">
    @import "../../scss/brands.scss";

    .active-account-header {
        @include flex-container(center, _);
        @include pos-abs-top-right-corner(25px, 35px);
        border-radius: 10px;

        &--light {
            background-color: var(--hoverColor);
        }
        &--light &__btn {
            background-color: var(--bentoBoxBgColor);
            border: var(--bentoBoxBorder);
            box-shadow: var(--bentoBoxShadow);
            font-weight: 600;
        }
        
        &__btn {
            @include flex-container(center, _);
            padding: 5px 8px;
            border-radius: 10px;
            background-color: var(--hoverColor);
            transition: 0.09s ease-in-out;
            font-weight: 400;
            font-size: 1rem;
            
            &:active {
                transform: translateY(0.45px);
            }
            &:hover {
                background-color: var(--hoverColor);
            }
            span {
                color: rgba(var(--textColor1), 0.7);
                margin: 0px 6px 0px 8px;
            }
        }
        &__username {
            margin: 0px 7px 0px 11px;
            color: rgba(var(--textColor1), 0.85);
        }
        &__user-profile-pic {
            @include circle(20px);
            background-color: #4E4E4F;
        }
        .platform-logo {
            margin-right: 7px;
            border-radius: 7px;
        }
        .fa-chevron-down {
            font-size: 0.9rem;
            color: rgb(var(--textColor1));
        }
    }
    
    .platform-list {
        margin-top: 15px;
        z-index: 10000;
        width: 220px;
        @include pos-abs-top-right-corner(20px, 30%);
        background: var(--hoverColor);
        box-shadow: var(--bentoBoxShadow);
        padding: 12px 5px 15px 13px;
        border-radius: 10px;

        &--light {
            background: var(--bentoBoxBgColor);
        }

        &--light &__platform-item-btn {
            font-weight: 600 !important;
            font-size: 1rem !important;
        }
        &--light &__platform-item-text {
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

        &__platform-item {
            @include flex-container(center, _);
            margin-bottom: 14px;

            &:last-child {
                margin-bottom: 0px;
            }
            &--logged-out {
                margin-bottom: 18px;
            }
        }
        &__platform-item-btn {
            position: absolute;
            right: 10px;
            padding: 7px 0px 7px 10px;
            color: rgba(var(--textColor1), 0.6);
            transition: 0.1s ease-in-out;
            width: 60px;
            font-weight: 400 !important;
            font-size: 1rem !important;
            @include center;
        }

        &__platform-item-text {
            margin: -2px 0px 0px 7px;
            h5 {
                font-size: 1rem;
                font-weight: 400;
            }
            span {
                font-size: 1.02rem;
                color: rgba(var(--textColor1), 0.45);
                font-weight: 300;
            }
        }
    }
</style>