<script lang="ts">
	import { onMount } from "svelte"
    
    import { closeModal } from "$lib/utils-home"
    import { APIErrorCode, Icon, LogoIcon, ModalType } from "$lib/enums"
	import { themeState, ytPlayerStore, ytUserDataStore } from "$lib/store"
    import { formatPlural, getMaskedGradientStyle, preventScroll } from "../../lib/utils-general"
	import { exitYoutubePlayer, handleChoosePlaylist, youtubeLogOut, youtubeLogin } from "$lib/utils-youtube"

    import Modal from "../../components/Modal.svelte"
    import Logo from "../../components/Logo.svelte"
	import BounceFade from "../../components/BounceFade.svelte"
	import DropdownList from "../../components/DropdownList.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
    
    export let ytPlaylists
    
    let YT_PLAYLIST_GROUPS: YoutubePlaylistGroup[] = ytPlaylists
    let isUserProfileDropdownOpen = false
    let selectedPlsGroup = YT_PLAYLIST_GROUPS[0]

    let isScrollableLeft = false
    let isScrollableRight = true
    let groupTabList: HTMLElement

    let isPlsLoading = false
    let scrollTop = 0
    let scrollHeight = 0
    let scrollWindow = 0
    let playlistTimeout: NodeJS.Timeout | null = null
    let settingsOpen = false

    let tabListGradientStyle = ""
    let ytError: any = null
    let userPlaylists: YoutubePlaylist[] = []

    const SCROLL_STEP = 200
    const PLAYLIST_SKELETON_LENGTH = 25
    const FETCH_PLAYLIST_DELAY = 500
    const DEFAULT_PROFILE_PIC = "https://media.tenor.com/-OpJG9GeK3EAAAAC/kanye-west-stare.gif"

    $: isDarkTheme     = $themeState.isDarkTheme
    $: hasSignedIn     = $ytUserDataStore?.isSignedIn ?? false
    $: playlist        = $ytPlayerStore?.playlist ?? null    
    $: userData             = $ytUserDataStore
    $: hasTokenExpired      = userData?.hasTokenExpired ?? false
    $: hasFetchedAllUserPls = userData?.hasFetchedAllUserPls ?? false

    $: if (ytError?.code === APIErrorCode.EXPIRED_TOKEN && !hasTokenExpired) {
        ytError = null
    }
    $: if (hasSignedIn) {
        userPlaylists = $ytUserDataStore?.userPlaylists ?? []
    }
    // updating playlists (refresh, more items)
    $: if (selectedPlsGroup.title === "My Playlists") {
        selectedPlsGroup.playlists = userPlaylists
    }
    // if loggin out but user playlists is selected
    $: if (!userData && selectedPlsGroup.title === "My Playlists") {
        selectedPlsGroup = YT_PLAYLIST_GROUPS[0]
    }

    /* Account */
    function profileBtnClickedHandler() { 
        if ($ytUserDataStore) {
            isUserProfileDropdownOpen = !isUserProfileDropdownOpen
        }
        else {
            youtubeLogin()
        }
    }
    function onProfileDropdownFirstBtnClicked() {
        if (hasTokenExpired) {
            $ytUserDataStore!.refreshAccessToken()
        }
        else {
            refreshUserPlaylsts()
        }
        isUserProfileDropdownOpen = false 
    }
    
    /* UI Handlers */
    function hasReachedEndOfList() {
        return Math.ceil(scrollTop) >= scrollHeight - scrollWindow
    }
    async function userPlsInfiniteScrollHandler(event: Event) {
        if (selectedPlsGroup.title != "My Playlists" || isPlsLoading) return

        const list = event.target as HTMLElement
        scrollTop = list.scrollTop
        scrollHeight = list!.scrollHeight
        scrollWindow = list!.clientHeight 
        
        if (!hasReachedEndOfList() || isPlsLoading) return
        getMorePlaylists()
    }
    async function refreshUserPlaylsts() {
        let _userPlaylists = userPlaylists
        
        try {
            userPlaylists = []
            isPlsLoading = true
            await userData!.refreshUserPlaylists()
            ytError = null
        }
        catch(e) {
            userPlaylists = _userPlaylists
            ytError = e
        }
        finally {
            isPlsLoading = false
        }
    }
    function getMorePlaylists() {
        const haltFetchMore = isPlsLoading || hasFetchedAllUserPls || ytError || hasTokenExpired || playlistTimeout
        if (haltFetchMore) return
        
        playlistTimeout = setTimeout(async () => { 
            try {
                isPlsLoading = true
                await $ytUserDataStore!.loadMorePlaylistItems()
                userPlaylists = $ytUserDataStore!.userPlaylists

                ytError = null
            }
            catch(error: any) {
                ytError = error
            }
            finally {
                isPlsLoading = false
                clearInterval(playlistTimeout!)
                playlistTimeout = null
            }
        }, FETCH_PLAYLIST_DELAY)
    }
    function onPlaylistItemTabEnter(e: KeyboardEvent, playlist: YoutubePlaylist) {
        const target = e.target as HTMLElement
        if (target.tagName === "A") return

        if (e.key === 'Enter' || e.code == "Space") {
            e.preventDefault()
            handleChoosePlaylist(playlist)
        }
    }

    /* Recommended Section */
    function handleShiftTabCategoryRight() { 
        groupTabList!.scrollLeft += SCROLL_STEP
    }
    function handleShiftTabCategoryLeft () { 
        groupTabList!.scrollLeft -= SCROLL_STEP
    }
    function handleRecTabBtnClicked(index: number){
        if (index >= 0) {
            selectedPlsGroup = YT_PLAYLIST_GROUPS[index]
        }
        else {
            selectedPlsGroup = { title: "My Playlists", playlists: $ytUserDataStore!.userPlaylists }
        }
    }
    function updateTabListStyle() {
        const res = getMaskedGradientStyle(groupTabList, {
            isVertical: false,
            head: { end: "20%" },
            tail: { start: "80%" }
        }) as HozScrollMaskedGradient

        isScrollableLeft  = !res.scrollStatus.hasReachedStart
        isScrollableRight = !res.scrollStatus.hasReachedEnd
        tabListGradientStyle = res.styling
    }
    function onKeyPress(e: KeyboardEvent) {
        const { key } = e

        if (key == "Escape") {
            closeModal(ModalType.Youtube)
        }
    }
    onMount(() => updateTabListStyle())
</script>

<svelte:window on:keydown={onKeyPress} />

<Modal 
    options={{ closeOnEsc: true, borderRadius: "18px" }}
    onClickOutSide={() => closeModal(ModalType.Youtube)}
>
    <div 
        class="yt-settings"
        class:yt-settings--light={!$themeState.isDarkTheme}
        class:yt-settings--dark={$themeState.isDarkTheme}
        class:yt-settings--min={!$ytPlayerStore?.playlist}
    >
        <!-- Header -->
        <div class="yt-settings__header">
            <div class="yt-settings__header-title-container">
                <h1 class="yt-settings__header-title modal-bg__content-title">
                    Youtube
                </h1>
                <div class="yt-settings__header-yt-logo">
                    <Logo 
                        logo={LogoIcon.Youtube}
                        options={{ 
                            hasBgColor: true, containerWidth: "16px", iconWidth: "72%"
                        }}
                    />
                </div>
            </div>
            <!-- Account -->
            <div class="yt-settings__user-profile-container">
                <button 
                    id="yt-settings--dropdown-btn"
                    class="yt-settings__user-capsule" 
                    on:click={profileBtnClickedHandler}
                >
                    {#if hasSignedIn && userData}
                        <img src={userData.profileImgSrc ?? DEFAULT_PROFILE_PIC} alt="yt-profile" />
                    {:else}
                        <div class="yt-settings__user-capsule-google-logo">
                            <Logo 
                                logo={LogoIcon.Google} 
                                options={{ hasBgColor: false, containerWidth: "11.5px", iconWidth: "100%" }} 
                            />
                        </div>
                    {/if}
                    <span>
                        {hasSignedIn ? userData?.username : "Log In"}
                    </span>
                </button>
                <!-- Dropdown -->
                <BounceFade
                    id="yt-settings--dropdown-menu"
                    isHidden={!isUserProfileDropdownOpen || !hasSignedIn || !userData}
                    onClickOutside={() => {
                        isUserProfileDropdownOpen = false
                    }}
                >
                    <div class="yt-settings__user-profile dropdown-menu" >
                        <div class="yt-settings__user-profile-img-container">
                            <img src={userData?.profileImgSrc} alt="yt-profile" />
                        </div>
                        <div class="yt-settings__user-profile-details">
                            <div class="yt-settings__user-profile-details-header">
                                Gmail Account
                            </div>
                            <span>
                                {userData?.email}
                            </span>
                            <div class="yt-settings__user-profile-details-header">
                                Username
                            </div>
                            <span>
                                {userData?.username}
                            </span>
                        </div>
                        <div class="yt-settings__user-profile-btns-container">
                            <button 
                                class="text-only" 
                                on:click={onProfileDropdownFirstBtnClicked}
                            >
                                {`${hasTokenExpired ? "Refresh Token" : "Refresh Playlists"}`}
                            </button>                                
                            <button 
                                class="text-only" 
                                on:click={() => { youtubeLogOut(); isUserProfileDropdownOpen = false }}
                            >
                                Log Out
                            </button>                                
                        </div>
                    </div>
                </BounceFade>
            </div>
        </div>
        <div class="yt-settings__content-container">
            {#if playlist}
                <div class="yt-settings__left">
                    <!-- Chosen Playlist -->
                    <div class="chosen-playlist bento-box">
                        <img class="img-bg" src={playlist.thumbnailURL} alt="chosen-playlist">
                        <div class="img-bg-gradient gradient-container gradient-container--bottom"></div>
                        <div 
                            class="blur-bg"
                            class:blur-bg--solid-color={!playlist}
                            class:blur-bg--blurred-bg={playlist}
                        >
                        </div>
                        <div class="content-bg">
                            <div class="chosen-playlist__playlist">
                                <img class="chosen-playlist__playlist-img" src={playlist.thumbnailURL} alt="chosen-playlist">
                                <div class="chosen-playlist__playlist-details">
                                    <h3>Now Playing</h3>
                                    <h4 class="chosen-playlist__playlist-title">
                                        {playlist.title}
                                    </h4>
                                    <div class="chosen-playlist__playlist-metadata">
                                        <span>
                                            {playlist.channelTitle}
                                        </span>
                                        <span>
                                            {formatPlural("video", playlist.vidCount)}
                                        </span>
                                    </div>
                                    <p class="chosen-playlist__playlist-description" title={playlist.description}>
                                        {playlist.description === "" ? "No Description" : playlist.description}
                                    </p>

                                    <!-- Settings -->
                                    <button
                                        id="chosen-playlist--dropdown-btn"
                                        class="chosen-playlist__settings-btn"
                                        class:hidden={$ytPlayerStore?.isoVideo}
                                        on:click={() => settingsOpen = !settingsOpen}
                                    >
                                        <SvgIcon icon={Icon.Settings} />                                            
                                    </button>

                                    <DropdownList 
                                        id={"chosen-playlist"}
                                        isHidden={!settingsOpen} 
                                        options={{
                                            listItems: [{ 
                                                name: "Exit Player",
                                            }],
                                            position: { top: "20px", right: "0px"},
                                            styling:  { 
                                                width: "160px",
                                                zIndex: 500
                                            },
                                            onListItemClicked: () => {
                                                settingsOpen = false
                                                exitYoutubePlayer()
                                            },
                                            onClickOutside: () => {
                                                settingsOpen = false
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
            <!-- Playlist Recommendations Section -->
            <div 
                class="recs bento-box bento-box--no-padding"
                class:recs--expanded={!playlist}
                on:scroll={preventScroll}
            >
                <div class="recs__header bento-box__header">
                    <h3 class="bento-box__title">Recommendations</h3>
                </div>
                <p class="recs__copy bento-box__copy">
                    Discover new playlists with our staff recommended playlist picks!
                </p>
                <!-- Horizontal Tabs Carousel -->
                <div class="recs__groups-list-container">
                    {#if isScrollableLeft}
                        <button 
                            class="recs__tab-arrow recs__tab-arrow--left" 
                            on:click={handleShiftTabCategoryLeft}
                        >
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                    {/if}
                    <div 
                        class="recs__groups-list-wrapper"
                        style={`${tabListGradientStyle}`}
                    >
                        <ul 
                            class="recs__groups-list" 
                            bind:this={groupTabList} 
                            on:scroll={updateTabListStyle}
                        >
                            <li><div class="recs__tab-group-padding recs__tab-group-padding--left"></div></li>
                            <!-- Tab Item -->
                            {#if hasSignedIn}
                                <li class="recs__groups-list-user-pl-tab">
                                    <button 
                                        on:click={() => handleRecTabBtnClicked(-1)}
                                        class="tab-btn"
                                        class:tab-btn--light-mode={!isDarkTheme}
                                        class:tab-btn--selected={"My Playlists" === selectedPlsGroup.title}
                                    >
                                        My Playlists
                                    </button>
                                    <div class="divider divider--vertical"></div>
                                </li>
                            {/if}
                            {#each YT_PLAYLIST_GROUPS as group, idx}
                                <li class="recs__groups-list-rec-tab">
                                    <button 
                                        on:click={() => handleRecTabBtnClicked(idx)}
                                        class="tab-btn"
                                        class:tab-btn--light-mode={!isDarkTheme}
                                        class:tab-btn--selected={group.title === selectedPlsGroup.title}
                                    >
                                        {group.title}
                                    </button>
                                </li>
                            {/each}
                            <li><div class="recs__tab-group-padding recs__tab-group-padding--right"></div></li>
                        </ul>
                    </div>
                    {#if isScrollableRight}
                        <button 
                            class="recs__tab-arrow recs__tab-arrow--right" 
                            on:click={handleShiftTabCategoryRight}
                        >
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    {/if}
                </div>
                <!-- Recommended Playlist Item List -->
                <ul class="recs__playlists-list" on:scroll={userPlsInfiniteScrollHandler}>
                    <!-- Recommended laylist Item -->
                    {#each selectedPlsGroup.playlists as playlist}
                        <li 
                            on:dblclick={() => handleChoosePlaylist(playlist)}
                            role="button"
                            tabindex="0"
                            class="recs__playlist-item"
                            class:recs__playlist-item--selected={playlist.id === playlist.id}
                            class:recs__playlist-item--user-pl={selectedPlsGroup.title === "My Playlists"}
                            on:keydown={(e) => onPlaylistItemTabEnter(e, playlist)}
                        >
                            <div class="recs__playlist-item-img-container">
                                <img class="recs__playlist-item-img" src={playlist.thumbnailURL} alt="playlist-item-thumbnail"/>
                            </div>
                            <div class="recs__playlist-item-details">
                                <h5 class="recs__playlist-item-title">
                                    {playlist.title}
                                </h5>
                                <p class="recs__playlist-item-description" title={playlist.description}>
                                    {`${playlist.description.length === 0 ? "No description" : playlist.description} `}
                                </p>
                                {#if selectedPlsGroup.title === "My Playlists"}
                                    <div class="recs__playlist-item-vid-count">
                                        <span>
                                            {formatPlural("Video", playlist.vidCount)}
                                        </span>
                                    </div>
                                {:else}
                                    <div class="recs__playlist-item-channel-details">
                                        {#if playlist.channelURL}
                                            <a href={playlist.channelURL} target="_blank" rel="noreferrer">
                                                {playlist.channelTitle}
                                            </a>
                                        {:else}
                                            <span>
                                                {playlist.channelTitle}
                                            </span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                            <div class="divider divider--thin"></div>
                        </li>
                    {/each}
                    {#if isPlsLoading}
                        {#each new Array(PLAYLIST_SKELETON_LENGTH) as _}
                            <li 
                                class="recs__playlist-item recs__playlist-item--skeleton"
                                class:recs__playlist-item--user-pl={selectedPlsGroup.title === "My Playlists"}
                            >
                                <div class="recs__playlist-item-img-container recs__playlist-item-img-container--skeleton skeleton-bg"></div>
                                <div class="recs__playlist-item-details">
                                    <h5 class="recs__playlist-item-title recs__playlist-item-title--skeleton skeleton-bg">
                                    </h5>
                                    <p class="recs__playlist-item-description recs__playlist-item-description--skeleton skeleton-bg"></p>
                                    <p class="recs__playlist-item-description recs__playlist-item-description-second-line recs__playlist-item-description--skeleton skeleton-bg"></p>
                                    <div class="recs__playlist-item-vid-count recs__playlist-item-vid-count--skeleton skeleton-bg">
                                    </div>
                                </div>
                                <div class="divider divider--thin divider--bottom"></div>
                            </li>
                        {/each} 
                    {/if}
                    {#if !isPlsLoading && selectedPlsGroup.playlists.length === 0}
                        <div class="recs__playlists-empty-txt">
                            <p>This collection is empty!</p>
                        </div>
                    {/if}
                </ul>
            </div>
            <div class="yt-settings__padding"></div>
        </div>
    </div>
</Modal>

<style lang="scss">
    @import "../../scss/blurred-bg.scss";
    @import "../../scss/skeleton.scss";
    @import "../../scss/dropdown.scss";

    $section-spacing: 8px;
    $recs-section-padding-left: 25px;
    $video-img-ratio: calc(16 / 9);
    $header-height: 38px;
    $min-layout-cut-off: 35em; // 560px

    .yt-settings {
        width: 86vw;
        max-width: 900px;
        height: 720px;
        padding: 15px 25px 25px 25px;

        .skeleton-bg {
            @include skeleton-bg(dark);   
        }

        &--min {
            max-width: 700px;
        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
                
        /* Light Theme Styling */
        &--light .bento-box {
            @include bento-box-light;
        }
        &--light button.tab-btn {
            @include tab-btn-light();
        }
        &--light .skeleton-bg {
            @include skeleton-bg(light);
        }
        &--light .recs .divider {
            background-color: rgba(var(--textColor1), 0.2);
        }
        &--light .recs__playlist-item {
            &-title {
                font-weight: 600;
            }
            &-description {
                @include text-style(0.8, 500);
            }
            &-channel-details, &-vid-count {
                span, a {
                    @include text-style(0.5, 600);
                }
            }
        }
        &--light .chosen-playlist .img-bg-gradient {
            height: 70%;
            background: linear-gradient(0deg, var(--modalBgColor) 10%, transparent) !important;
        }
        &--light .chosen-playlist .blur-bg {
            background: rgba(96, 96, 96, 0.35);
        }
        &--light .chosen-playlist__playlist {
            &-title {
                font-weight: 500;
            }
            &-description {
                font-weight: 400;
                color: rgb(white, 0.7);
            }
            &-metadata span:first-child {
                color: rgba(white, 0.6);
                font-weight: 500;
            }
            &-metadata span {
                color: rgba(white, 0.3);
                font-weight: 500;
            }
        }
        &--light &__user-capsule {
            background-color: var(--bentoBoxBgColor);
            span {
                font-weight: 600;
            }
        }
        &--light &__user-profile {
            box-shadow: var(--bentoBoxShadow);
            span {
                @include text-style(0.6, 500)
            }
            &-details-header {
                @include text-style(1, 600)
            }
            &-btns-container button {
                font-weight: 600;
            }
        }
        &--light .recs__playlist-item img {
            border-radius: 5px;
        }

        &__header {
            @include flex(flex-start, space-between);
            height: $header-height;

            &-title-container {
                @include center;
            }
            &-yt-logo {
                margin-left: 9px;
            }
        }
        /* User Profile Tab */
        &__user-profile-container {
            position: relative;
        }
        &__user-capsule {
            @include flex(center, _);
            background-color: var(--bg-2);
            padding: 5px 13px 5px 7px;
            border-radius: 15px;
            transition: 0.12s ease-in-out;

            &-google-logo {
                margin-right: 10px;
            }
            img {
                @include circle(14px);
                margin-right: 8px;
            }
            span {
                @include text-style(1, 600, 1.15rem);
            }
            &:hover {
                background-color: var(--hoverColor2);
            }
        }
        &__user-profile {
            @include abs-top-right(5px, -2px);
            border-radius: 13px;
            padding: 15px 14px 15px 14px;
            min-width: 170px;
            z-index: 100;
        }
        &__user-profile-img-container {
            @include flex(center, center);
            margin-bottom: 20px;
            
            img {
                @include circle(55px);
            }
        }
        &__user-profile-details {
            text-align: center;
            margin-bottom: 20px;

            span {
                display: block;
                margin: 5px 0px 20px 0px;
                @include text-style(0.4, 200, 1.14rem);
            }
        }
        &__user-profile-details-header {
            color: rgb(var(--textColor1), 1);
            font-size: 1.28rem;
        }
        &__user-profile-btns-container {
            @include flex(center, space-evenly);
            padding-top: 10px;
            width: 100%;
        }
        &__user-profile-btns-container button {
            padding: 0px;
            white-space: nowrap;
            @include text-style(0.5, 400, 1.2rem);

            &:first-child {
                margin-right: 11px;
            }
        }

        /* Content */
        &__content-container {
            display: flex;
            height: calc(100% - $header-height);
        }
        &__left {
            margin-right: $section-spacing;
            width: calc(28% - ($section-spacing / 2));
            min-width: 200px;
            max-width: 260px;
            height: 100%;
        }
        .recs {
            width: calc(72% - ($section-spacing / 2));
            flex: 1;
        }

        .divider {
            background-color: rgba(var(--textColor1), 0.05);
        }
    }

    /* Sections */
    .chosen-playlist {
        width: 100%;
        position: relative;
        color: rgb(white, 1);
        height: 100%;
        padding: 10px;
        border-radius: 16.5px;
        overflow: hidden;
        
        &--no-pl h3 {
            color: rgb(var(--textColor1), 1);
        }
        &--no-pl &__no-playlist-msg {
            color: rgb(var(--textColor1), 0.6);
        }
        &--no-pl .img-bg, &--no-pl .blur-bg {
            display: none;
        }
        .img-bg, .blur-bg, .imag-bg-gradient {
            border-radius: 16.5px;
        }
        .img-bg {
            width: 96%;
            height: 96%;
            z-index: 0;
        }
        .img-bg-gradient {
            @include abs-bottom-left;
            width: 100%;
            height: 100%;
            z-index: 1;
            background: linear-gradient(0deg, #080808 20%, transparent);
        }
        .blur-bg {
            width: 100%;
            z-index: 2;
            background: rgba(17, 17, 17, 0.5);
        }
        .content-bg {
            position: relative;
            z-index: 3;
        }

        &__settings-btn {
            opacity: 0.2;
            @include abs-top-right(-2px, 4px);
            @include circle(19px);
            @include center;
            
            &:hover {
                opacity: 0.52;
                background: rgba(white, 0.14);
            }
        }
        &__playlist-img {
            margin: 0px 15px 0px 0px;
            border-radius: 12px;
            object-fit: cover;
            width: 100%;
            aspect-ratio: calc(16 / 9);
        }
        &__playlist-details {
            margin-top: 10px;
            padding-left: 4px;
            position: relative;

            h3 {
                margin-bottom: 6px;
                font-weight: 400;
                font-size: 1.2rem;
                color: rgba(white, 0.4);
                display: none;
            }
        }
        &__playlist-title {
            margin-top: 15px;
            max-height: 40px;
            max-width: 90%;
            overflow: hidden;
            font-size: 1.4rem;
            font-weight: 400;

        }
        &__playlist-description {
            margin-top: 19px;
            width: 95%;
            overflow: hidden;
            position: relative;
            font-size: 1.28rem;
            color: rgb(white, 0.54);
        }
        &__playlist-metadata {
            margin-top: 6px;
            width: 100%;
            @include flex(center, flex-start);
        }
        &__playlist-metadata span {
            font-size: 1.2rem;
                color: rgb(white, 0.2);
                max-width: 64%;
                @include elipses-overflow;
                
                &:first-child {
                    color: rgb(white, 0.4);
                    margin-right: 12px;
                }
        }
        &__no-playlist-msg {
            font-weight: 600;
            font-size: 1.3rem;
            color: rgba(white, 0.5);
            @include abs-center;
            top: 45%;
        }
    }
    .recs {
        overflow: hidden;

        &--expanded {
            width: 100%;
        }

        &__header {
            padding: 17px 0px 0px $recs-section-padding-left;
            h3 {
                font-size: 1.4rem;
            } 
        }
        &__copy {
            margin: 2px 0px 7px 0px;
            padding: 0px 0px 0px $recs-section-padding-left;
        }
        &__tab-arrow {
            z-index: 10000;
            background: none;
            margin-top: -5px;
            opacity: 0.7;
            @include circle(15px);
            @include center;
            @include not-visible;
            padding: 5px;

            &--left {
                @include abs-top-left(18px, 5px);
            }
            &--right {
                @include abs-top-right(18px, 5px);
            }
            

            &:hover {
                opacity: 1;
            }
            &:active {
                transform: scale(0.9);
            }
        }
        &__groups-list-user-pl-tab {
            padding-right: 5px;
            margin-right: 8px;
            position: relative;
        }
        &__groups-list-user-pl-tab .divider {
            @include abs-top-right(50%);
            height: 12px;
            width: 1px;
            background-color: rgba(var(--textColor1), 0.1);

        }
        /* Horizontal Carousel Tab Container */
        &__groups-list-container {
            padding-bottom: 10px;
            position: relative;
            z-index: 0;
            width: 100%;

            &:hover .recs__tab-arrow {
                @include visible;
            }
        }
        &__groups-wrapper {
            width: 100%;
        }
        &__groups-list {
            overflow-x: scroll;
            scroll-behavior: smooth;
            height: 50px;
            @include flex(center, _);

            &::-webkit-scrollbar {
                display: none;
            }
        }
        &__tab-group-padding {
            width: $recs-section-padding-left;;
            height: 5px;

            &--right {
                width: 50px;
            }
        }
        &__group-tab {
            margin-right: 4px;
        }
        /* Playlist List */
        &__playlists-list {
            margin-top: -15px;
            height: 90%;
            overflow-y: scroll;
            position: relative;
        }
        &__playlists-empty-txt {
            @include abs-center;
            top: 45%;
            @include text-style(0.6, 600, 1.2rem);
        }
        /* Playlist Item */
        &__playlist-item {
            transition: opacity 0.1s ease-in-out;
            display: flex;
            overflow: hidden;
            padding: 14px 0px;
            position: relative;
            max-width: 100%;
            
            &--user-pl {
                padding: 15px 0px;
            }
            &--user-pl &-description {
                max-height: 15px;
                width: 85%;
                @include multi-line-elipses-overflow(1);

                &--skeleton {
                    width: 70%;
                }
                &-second-line {
                    display: none;
                }
            }
            &--user-pl &-img-container {
                min-width: 110px;
                width: 80px;
            }
            &:hover, &--chosen {
                background-color: var(--hoverColor);
            }
            &:first-child {
                margin-top: 3px;
            }
            &:last-child {
                margin-bottom: 70px;
            }
            .divider {
                @include abs-bottom-left(0px, 0px);
            }
        }
        &__playlist-item-img-container {
            min-width: 130px;
            width: 130px;
            aspect-ratio: calc(16 / 9);
            margin: 0px 3% 0px 25px;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            &--skeleton {
                border-radius: 8px;
            }
        }
        &__playlist-item-title {
            margin-bottom: 4px;
            max-width: 90%;
            @include elipses-overflow;
            @include text-style(1, 500, 1.25rem);

            &--skeleton {
                height: 14px;
                width: 30%;
                border-radius: 4px;
                margin-bottom: 10px;
            }
        }
        &__playlist-item-details {
            width: 80%;
            position: relative;
        }
        &__playlist-item-description {
            width: 90%;
            max-height: 33px;
            overflow: hidden;
            @include text-style(0.45, 400, 1.2rem);
            @include multi-line-elipses-overflow(1);

            // for skeleton only
            &-second-line { 
                margin: 5px 0px 20px 0px;
                width: 40% !important;
            }

            &--skeleton {
                height: 10px;
                width: 80%;
                border-radius: 4px;
                
            }
        }
        &__playlist-item-vid-count, 
        &__playlist-item-channel-details {
            margin-top: 12px;
            @include abs-bottom-left(0px, 0px);
            @include text-style(0.3, 500, 1.1rem);
            
            a, span {
                @include text-style(0.25, 500);
            }

            &--skeleton {
                height: 10px;
                width: 50px !important;
                border-radius: 4px;
            }
        }
    }

    @include mq-custom(max-width, $min-layout-cut-off) {
        .yt-settings {
            height: auto;
            &__content-container {
                flex-direction: column;
            }
            &__left {
                max-width: none;
                width: 100%;
                height: 400px;
                margin-bottom: $section-spacing;
            }
        }
        .recs {
            width: 100% !important;
            height: 1000px;
        }
    }
</style>