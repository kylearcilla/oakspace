<script lang="ts">
    import { onMount } from "svelte"
    import { themeState, musicDataStore, musicPlayerStore, musicSettingsManager, ytUserDataStore } from "$lib/store"

    import { closeModal } from "$lib/utils-home"
	import { capitalize, formatPlural } from "$lib/utils-general"
    import { musicCategories } from "$lib/data-music-collections"
    import { ModalType, Icon, LibError, LogoIcon } from "$lib/enums"
	import { LIBRARY_COLLECTION_LIMIT, musicLogin, exitMusicPlayer, musicLogOut } from "$lib/utils-music"
	import { getMediaContext, getMediaItemInfo, getMediaLength, getMediaDescription, getMediaImgSrc, getArtworkCredit } from "$lib/utils-music-settings"
    
	import Logo from "../../components/Logo.svelte"
	import Modal from "../../components/Modal.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import DropdownList from "../../components/DropdownList.svelte"

    $: isLight = !$themeState.isDarkTheme

    $: isSignedIn      = $musicDataStore?.isSignedIn
    $: mediaCollection = $musicPlayerStore?.mediaCollection 

    $: manager     = $musicSettingsManager
    $: chosenMood  = manager?.chosenMood
    $: chosenMusicCollection = $musicSettingsManager?.chosenMusicCollection! ?? []

    $: userLibrary           = $musicSettingsManager?.userLibrary
    $: currLibraryCollection = $musicSettingsManager?.currLibraryCollection!
    $: isUserLibraryLoading  = $musicSettingsManager?.isUserLibraryLoading
    $: libError              = $musicSettingsManager?.libError
    
    $: isScrollableLeft      = $musicSettingsManager?.isScrollableLeft
    $: isScrollableRight     = $musicSettingsManager?.isScrollableRight
    
    $: categoriesListGradient = $musicSettingsManager?.categoriesListGradient

    let hasCollectionItemsLoaded = true
    let isLogInDropdownOpen = false
    let isSettingsOpen = false

    /* Library Dropdown */
    function onLogInDropdownItemClicked(e: Event) {
        const target = e.target as HTMLElement
        const optnText = target.innerText.trim()

        isLogInDropdownOpen = false

        if (optnText === "Log out") {
            musicLogOut()
        }
        else if (optnText === "As different user") {
            musicLogin()
        }
        else if (optnText === "Refresh Token") {
            $musicDataStore!.refreshAccessToken()
        }
        else {
            manager!.initFromVideoData()

        }
    }
    function onLogInClicked() {
        if (!isSignedIn && $ytUserDataStore) {
            isLogInDropdownOpen = !isLogInDropdownOpen
        }
        else if (!isSignedIn) {
            musicLogin()
        }
        else {
            isLogInDropdownOpen = !isLogInDropdownOpen
        }
    }

    /* Event Listeners */
    function collectionTabBtnClicked(mood: MusicCollectionGroup) {
        manager!.discoverTabBtnClicked(mood)
    }
    onMount(() => {            
        requestAnimationFrame(() => {
            manager?.fetchHTMLElements()
            manager?.handleCategoriesScroll()
        })
    })
</script>

<svelte:window on:resize={() => manager?.handleCategoriesScroll()} />

<Modal
    onClickOutSide={() => closeModal(ModalType.Music)}
    options={{ borderRadius: "22px" }}
>
    <div 
        class="music"
        class:music--empty={!mediaCollection}
        class:music--signed-in={isSignedIn}
        class:music--light={isLight}
        class:music--dark={!isLight}
    >
        <!-- Top Header -->
        {#if isSignedIn}
            {@const ytUser  = $ytUserDataStore?.username}
            {@const isExpired = $musicDataStore?.hasTokenExpired}
            {@const listItems = ytUser && !isSignedIn ? [
                { name: `As ${ytUser}` },
                { name: "As different user" }
            ] : [
                ...(isExpired ? [{ name: "Refresh Token"}] : []),
                { name: "Log out" }
            ]}
            <button 
                id="music-user--dbtn"
                class="music__user-tab"
                on:click={onLogInClicked}
            >
                {#if isSignedIn && $musicDataStore}
                    <div class="music__user-tab-img">
                        <img src={$musicDataStore.profileImgSrc} alt="profile">
                    </div>
                    <span class="music__user-tab-text">
                        {$musicDataStore.username}
                    </span>
                {/if}
            </button>
            <DropdownList 
                id="music-user"
                isHidden={!isLogInDropdownOpen}
                options={{
                    listItems,
                    onListItemClicked: (context) => onLogInDropdownItemClicked(context.event),
                    onClickOutside: () => {
                        isLogInDropdownOpen = false
                    },
                    position: {
                        top: "52px",
                        left: "24px"
                    },
                    styling: {
                        width: "130px",
                        zIndex: 200
                    }
                }}
            />
        {/if}

        <!-- Music Settings Content -->
        <div class="music__content">
            {#if mediaCollection}
                {@const fullColumn = !isSignedIn && mediaCollection}
                {@const artwork    = mediaCollection.artworkImgSrc}
                {@const artist     = getArtworkCredit(artwork)}
                 <div class="music__left-section">
                    <!-- Now Playing Section -->
                    <div 
                        class="now-playing bento-box"
                        class:now-playing--empty={!mediaCollection}
                        class:now-playing--full-col={fullColumn}
                    >
                        <div class="img-bg-container">
                            <img 
                                class="img-bg" 
                                alt="collection"
                                src={getMediaImgSrc(mediaCollection.artworkImgSrc)}
                            >
                        </div>
                        <div class="img-bg-gradient"></div>
                        <div class={`blur-bg blur-bg--blurred-bg ${mediaCollection ? "blur-bg--solid-color" : ""}`}>
                        </div>
                        <div class="content-bg">
                            {#if mediaCollection}
                                {@const description = getMediaDescription(mediaCollection)}
                                    <!-- Artwork -->
                                    <div 
                                        class="now-playing__artwork"
                                        class:now-playing__artwork--empty={!artwork}
                                    >
                                        <img 
                                            src={getMediaImgSrc(artwork)}
                                            alt="current-collection"
                                        >
                                        <i class="fa-solid fa-music abs-center"></i>
                                    </div>
                                    <div class="now-playing__details">
                                        <div class="now-playing__details-header">
                                            {#if mediaCollection.url}
                                                <a class="now-playing__title" href={mediaCollection.url} target="_blank" rel="noreferrer">
                                                    {mediaCollection.name}
                                                </a>
                                            {:else}
                                                <div class="now-playing__title">
                                                    {mediaCollection.name}
                                                </div>
                                            {/if}
                                            <button
                                                id="now-playing--dbtn"
                                                class="now-playing__settings-btn"
                                                on:click={() => isSettingsOpen = !isSettingsOpen}
                                            >
                                                <SvgIcon icon={Icon.Settings} />                                            
                                            </button>
                                            {#if mediaCollection.author != "Somara" && (description || fullColumn)}
                                                <div class="now-playing__author">
                                                    {mediaCollection.author}
                                                </div>
                                            {/if}
                                        </div>
                                        
                                        <p 
                                            class="now-playing__text"
                                            class:now-playing__text--author={!description}
                                            title={description ? description : ""}
                                        >
                                            {@html description ? description : fullColumn ? "" : mediaCollection.author}
                                        </p>
                                        {#if artist}
                                            <span class="now-playing__artist-credit">
                                                Art by {artist}
                                            </span>
                                        {/if}
                                    <DropdownList 
                                        id={"now-playing"}
                                        isHidden={!isSettingsOpen} 
                                        options={{
                                            listItems: [{ 
                                                name: "Exit Player",
                                            }],
                                            position: { top: "20px", right: "-10px"},
                                            styling:  { 
                                                width: "160px",
                                                zIndex: 500
                                            },
                                            onListItemClicked: () => {
                                                isSettingsOpen = false
                                                exitMusicPlayer()
                                            },
                                            onClickOutside: () => {
                                                isSettingsOpen = false
                                            }
                                        }}
                                    />
                                </div>             
                            {:else}
                                <h4 class="now-playing__no-pl-selected">
                                    No Playlist / Album Selected
                                </h4>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
            <div class="music__right-section">
                <!-- Discover Section -->
                <div class="discover bento-box bento-box--no-padding">
                    <h3 class="bento-box__title">
                        Discover Music
                    </h3>
                    <p class="discover__copy bento-box__copy">
                        Get in the zone and discover music that matches your vibe.
                    </p>
                    <div class="discover__collection-list-container">
                        {#if isScrollableLeft}
                            <button 
                                class="discover__collection-arrow-btn discover__collection-arrow-btn--left"
                                on:click={() => manager?.handleShiftTabCategoryLeft()}
                            >
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                        {/if}
                        {#if manager}
                            <div 
                                class="discover__collection-list-container-gradient-wrapper" 
                                style={categoriesListGradient}
                            >
                                <!-- Discover Categories Carousel -->
                                <ul  
                                    class="discover__collection-list no-scroll-bar" 
                                    id="collection-list" 
                                    on:scroll={() => manager?.handleCategoriesScroll()}
                                >

                                    <!-- User Data -->
                                    {#if isSignedIn}
                                        <li class="discover__collection-tab-btn">
                                            <button 
                                                class="tab-btn"
                                                class:tab-btn--selected={chosenMood === "library"}
                                                on:click={() => collectionTabBtnClicked("library")}
                                            >
                                                My Library
                                            </button>
                                        </li>
                                        <div class="discover__collection-tab-divider"></div>
                                    {:else}
                                        <li class="discover__collection-tab-btn discover__collection-tab-btn--login">
                                            <button 
                                                class="tab-btn"
                                                class:tab-btn--selected={chosenMood === "library"}
                                                on:click={onLogInClicked}
                                            >
                                                <div class="music__user-tab-img">
                                                    <Logo 
                                                        logo={LogoIcon.Youtube}
                                                        options={{ 
                                                            hasBgColor: true, containerWidth: "15px", iconWidth: "72%"
                                                        }}
                                                    />
                                                </div>
                                                <span class="music__user-tab-text">Log In</span>
                                            </button>
                                        </li>
                                        <div class="discover__collection-tab-divider"></div>
                                    {/if}

                                    <!-- Categories -->
                                    {#each musicCategories as group}
                                        <li class="discover__collection-tab-btn">
                                            <button 
                                                on:click={() => collectionTabBtnClicked(group)}
                                                class="tab-btn"
                                                class:tab-btn--selected={chosenMood === group}
                                            >
                                                {capitalize(group)}
                                            </button>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/if}
                        {#if isScrollableRight}
                            <button 
                                class="discover__collection-arrow-btn discover__collection-arrow-btn--right"
                                on:click={() => manager?.handleShiftTabCategoryRight()}
                            >
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        {/if}
                    </div>
                    <!-- Collections List -->
                    <div 
                        class="discover__collection-container"
                        on:scroll={() => {
                            if (chosenMood === "library") {
                                manager?.handleLibListScroll()
                            }
                        }}
                    >
                        {#if chosenMood != "library"}
                            <ul class="discover__selected-collection-list">
                                <!-- Collection Item -->
                                {#each chosenMusicCollection as collection, idx}
                                    {@const length = getMediaLength(collection)}

                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <li
                                        on:dblclick={() => manager?.handleMediaClicked(collection, idx)}
                                        title={`${collection.name} – ${collection.author}`}
                                        class="discover__collection-item"
                                        class:discover__collection-item--chosen={mediaCollection && collection.id === mediaCollection?.id}
                                    >
                                        <div class="discover__collection-item-details">
                                            <div class="discover__collection-item-img">
                                                <img 
                                                    src={getMediaImgSrc(collection.artworkImgSrc)} 
                                                    alt="collection-artwork"
                                                >
                                            </div>
                                            <div class="discover__collection-item-details-right">
                                                {#if collection?.url}
                                                    <a href={collection.url} target="_blank" rel="noreferrer" class="discover__collection-item-title">
                                                        {collection.name}
                                                    </a>
                                                {:else}
                                                    <div class="discover__collection-item-title">{collection.name}</div>
                                                {/if}
                                                {#if collection?.authorUrl}
                                                    <a href={collection.authorUrl} target="_blank" rel="noreferrer" class="discover__collection-item-author">
                                                        {collection.author}
                                                    </a>
                                                {:else}
                                                    <div class="discover__collection-item-author">{collection.author}</div>
                                                {/if}
                                            </div>
                                        </div>
                                        <div class="discover__collection-item-genre">
                                            {collection.genre}
                                        </div>
                                        <div class="discover__collection-item-length">
                                            {length}
                                        </div>
                                        <div class="divider divider--thin"></div>
                                    </li>
                                {/each}
                                {#if !hasCollectionItemsLoaded}
                                    <!-- Loading Skeleton -->
                                    {#each [1, 2, 3, 4, 5, 6, 7] as _}
                                        <li class={`discover__collection-item discover__collection-item--skeleton`}>
                                            <div class="discover__collection-item-details">
                                                <div class="discover__collection-item-img skeleton-bg"></div>
                                                <div>
                                                    <div class="discover__collection-item-title skeleton-bg"> </div>
                                                    <p class="discover__collection-item-author skeleton-bg"></p>
                                                </div>
                                            </div>
                                            <div class="discover__collection-item-type">
                                                <div class="discover__collection-item-col-skeleton skeleton-bg"></div>
                                            </div>
                                            <div class="discover__collection-item-genre">
                                                <div class="discover__collection-item-col-skeleton skeleton-bg"></div>
                                            </div>
                                            <div class="discover__collection-item-length">
                                                <div class="discover__collection-item-col-skeleton skeleton-bg"></div>
                                            </div>
                                            <div class="divider divider--thin"></div>
                                        </li>
                                    {/each}
                                {/if}
                            </ul>
                        {/if}
                        <!-- My Playlists -->
                        {#if chosenMood === "library"}
                            <ul class="lib" id="library-list">
                                {#if userLibrary && userLibrary?.items}
                                    <!-- Media Item -->
                                    {#each userLibrary?.items as item, idx}
                                        {@const itemInfo = getMediaItemInfo(item, currLibraryCollection)}
                                        {@const itemContext = getMediaContext(item, currLibraryCollection)}
                                        <li
                                            on:dblclick={() => manager?.handleMediaClicked(item, idx)}
                                            title={itemContext}
                                            class="lib__playlist"
                                            class:lib__playlist--chosen={mediaCollection && item.id === mediaCollection.id}
                                        >
                                            <div class="lib__playlist-img">
                                                {#if item.artworkImgSrc != ""}
                                                    <img src={item.artworkImgSrc} alt="playlist-artwork"/>
                                                {:else}
                                                    <i class="fa-solid fa-music abs-center"></i>
                                                {/if}
                                            </div> 
                                            <!-- Media Item Details -->
                                            <div class="lib__playlist-text">
                                                <a href={item.url} target="_blank" rel="noreferrer" class="lib__playlist-text-title">
                                                    {item.name}
                                                </a>
                                                <div class="lib__playlist-media-details">
                                                    <div class="lib__playlist-media-count">
                                                        {formatPlural("Item", itemInfo?.length)}
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    {/each}
                                {/if}
                            </ul>
                            <!-- Loading Skeleton -->   
                            {#if isUserLibraryLoading}
                                {#each Array.from({ length: LIBRARY_COLLECTION_LIMIT }, (_, i) => i) as _}
                                    <li
                                        class={`lib__playlist lib__playlist--skeleton`}
                                    >
                                        <div class="lib__playlist-img skeleton-bg"></div> 
                                        <div class="lib__playlist-text">
                                            <div class="lib__playlist-text-title skeleton-bg"></div>
                                            <div class="lib__playlist-text-description skeleton-bg"></div>
                                        </div>
                                        <div class="divider divider--thin"></div>
                                    </li>
                                {/each}
                            {/if} 
                            {#if !isUserLibraryLoading && userLibrary?.items.length === 0}
                                <div class="discover__empty-msg">
                                    This Collection is Empty
                                </div>
                            {/if}
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</Modal>

<style lang="scss">
    @import "../../scss/blurred-bg.scss";
    @import "../../scss/brands.scss";
    @import "../../scss/skeleton.scss";
    @import "../../scss/dropdown.scss";

    $section-spacing: 8px;
    $top-row-height: 170px;
    $bottom-row-height: 470px;
    $lib-section-padding-left: 25px;
    $lib-dmenu-width: 155px;

    .music {
        width: 90vw;
        height: 84vh;
        min-width: 390px;
        max-width: 800px;
        max-height: 720px;
        padding: 12px 25px 12px 25px;

        .skeleton-bg {
            @include skeleton-bg(dark);   
        }
        .tab-btn {
            padding: 3px 12px 4px 12px;
        }

        /* states */
        &--signed-in {
            padding-top: 18px;
        }
        &--signed-in &__content {
            height: calc(100% - (14px + 28px));
        }
        &--empty {
            max-width: 600px;
            max-height: 650px;
        }
        /* light / dark adjustments */
        &--light .modal-bg {
            @include modal-bg-light;
        }
        &--light {
            .skeleton-bg {
                @include skeleton-bg(light);   
            }
            h2 {
                font-weight: 600;
            }
        }
        &--light .bento-box {
            @include bento-box-light;
        }
        &--light .img-bg-gradient {
            height: 70%;
            background: linear-gradient(0deg, var(--modalBgColor) 10%, transparent) !important;
        }
        &--light .blur-bg {
            background: rgba(96, 96, 96, 0.35) !important;
        }
        &--light .now-playing__collection-details {
            color: rgba(219, 219, 219, 0.7);
        }
        &--light .discover {
            &__collection-header {
                font-weight: 600;
            }
            &__collection-item-details-title {
                font-weight: 600;
            }
            &__collection-item-details-author {
                font-weight: 500;
            }
            &__collection-item {
                color: rgba(var(--textColor1), 0.65);
                font-weight: 500;
            }
        }
        &--dark .dmenu {
            @include dmenu--light;

        }
        &--dark .img-bg {
            top: -80px;  // includes a dark gradient at the bottom
            left: 0px;
            transform: none;
        }
        &__user-tab {
            @include flex(center);
            background-color: var(--bg-2);
            padding: 6px 12px 6px 6px;
            border-radius: 20px;

            span {
                @include text-style(0.88, 400, 1.14rem, "DM Sans");
            }
            &:hover {
                filter: brightness(1.1);
            }
        }
        &__user-tab-img {
            @include center;
            margin-right: 10px;
        }
        &__user-tab-img img {
            @include circle(16px);
        }
        &__description {
            margin: 8px 0px 25px 0px;
            color: rgba(var(--textColor1), 0.85);
            font-weight: 400;
        }
        &__content {
            margin-top: 13px;
            display: flex;
            height: calc(100% - 14px);
            padding-bottom: 10px;
            min-height: 400px;
        }
        &__left-section {
            height: 100%;
            margin-right: $section-spacing;
            width: 220px;
            position: relative;
        }
        &__right-section {
            height: 100%;
            width: calc(100% - ($section-spacing + 220px));
            flex: 1;
        }
    }
    
    .now-playing {
        margin: 0px $section-spacing $section-spacing 0px;
        height: 100%;
        width: 100%;
        position: relative;
        color: white;
        border-radius: 10px !important;
        overflow: hidden;

        &--empty {
            .img-bg, .blur-bg {
                display: none;
            }
        }
        &--empty h3 {
            color: rgb(var(--textColor1));
        }
        &--empty &__no-pl-selected {
            color: rgba(var(--textColor1), 0.4) !important;
        }
        a {
            display: block;
            @include elipses-overflow;
        }
        &__settings-btn {
            opacity: 0.2;
            @include abs-top-right(-2px, -4px);
            @include circle(19px);
            @include center;
            
            &:hover {
                opacity: 0.52;
                background: rgba(white, 0.14);
            }
        }
        &__details {
            position: relative;
            width: 100%;
            @include flex(_, space-between);
            flex-direction: column;
            padding-bottom: 3px;
        }
        &__details-header {
            margin-bottom: 3px;
        }
        &__artwork {
            z-index: 1;
            margin-right: 15px;
            position: relative;
            background-color: var(--lightColor2);
            @include flex(center, center);
            width: 120px;
            height: 120px;
            object-fit: cover;
            aspect-ratio: 1 / 1;
            border-radius: 0px;
            overflow: hidden;
            margin: 25px auto 20px auto;
            
            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            &--empty img {
                display: none;
            }
            &--empty i {
                display: block;
            }
            i {
                @include abs-center;
                color: rgba(var(--textColor1), 0.2);
                font-size: 2.3rem;
                display: none;
            }
        }
        &__artist-credit {
            margin-top: 13px;
            transition: opacity 0.2s ease-in-out;
            color: rgba(white, 0.2);
            @include text-style(_, 500, 1.1rem);
        }
        &__author {
            color: rgba(white, 0.55);
            text-transform: capitalize;
            transition: opacity 0.2s ease-in-out;
            margin-bottom: 10px;
            @include text-style(_, 500, 1.2rem);
            @include elipses-overflow;
        }
        &__author.not-visible {
            transition-delay: 0.2s;
            width: 0px;
        }
        &__author.visible {
            transition-delay: 0.2s;
        }
        &__title {
            color: rgba(249, 249, 249, 1);
            margin-bottom: 5px;
            max-width: 90%;
            width: min-content;
            @include text-style(_, 500, 1.3rem);
            @include elipses-overflow;
        }
        &__text {
            color: rgba(229, 229, 229, 0.5);
            overflow-y: scroll;
            font-size: 1.25rem;
        }
        &__text--author {
            margin-top: -1px;
        }
        &__collection-details {
            font-size: 1.2rem;
            font-weight: 500;
            display: flex;
            transition: opacity 0.2s ease-in-out;
            
            span {
                display: block;
                white-space: nowrap;
            }
        }
        .img-bg {
            width: 96%;
            height: 96%;
            z-index: 0;
        }
        .img-bg-gradient {
            width: 100%;
            height: 100%;
            z-index: 1;
            background: linear-gradient(0deg, #000000 20%, transparent) !important;
            @include abs-bottom-left;
        }
        .blur-bg {
            background: rgba(17, 17, 17, 0.5);
            backdrop-filter: blur(80px);
            z-index: 2;
            transform: none;
            @include abs-top-left;
        }
        .content-bg {
            top: 0px;
            padding: 10px 15px 12px 14px;
            z-index: 3;
        }
        .content-bg, .img-bg, .blur-bg {
            border-radius: 10px !important;
        }
    }

    .discover {
        margin: 0px 0px 0px 0px;
        width: 100%;
        height: 100%;        
        position: relative;
        padding-right: 0px;
        overflow: hidden;

        .bento-box__title {
            padding: 17px 0px 0px $lib-section-padding-left;
        }
        .bento-box__copy {
            padding-left: $lib-section-padding-left;
            margin: 5px 0px 8px 0px;
        }
        &__header {
            padding: 17px 0px 0px $lib-section-padding-left;
        }
        &__copy {
            padding-left: $lib-section-padding-left;
        }
        &__description {
            width: 100%;
            margin-top: -5px;
            color: #787878;
        }

        /* Discover Collections Carousel */
        &__collection-list-container {
            position: relative;

            &:hover .discover__collection-arrow-btn {
                @include visible;
                opacity: 0.9;
            }
            &-gradient-wrapper {
                width: 100%;
            }
        }
        &__collection-tab-btn--login .tab-btn {
            padding: 3px 13px 4px 5px;
        }
        &__collection-arrow-btn {
            @include not-visible;
            @include circle(20px);
            @include center;
            z-index: 100;
            
            i {
                color: rgba(var(--textColor1), 1);
            }
            &:hover {
                opacity: 1 !important;
            }
            &--left {
                @include abs-top-left(15px, 5px);
            }
            &--right {
                @include abs-top-right(15px, 5px);
            }
        }
        &__collection-tab-divider {
            @include divider(0.12, 12px);
            min-width: 1px;
            width: 1px;
            margin: 0px 7px 0px 4px;
        }
        &__collection-list {
            @include flex(center);
            overflow-x: scroll;
            scroll-behavior: smooth;
            height: 50px;
            position: relative;

            li:first-child {
                margin-left: 25px;
            }
            li:last-child {
                padding-right: 10px;
            }
        }

        /* Playlist Item */
        &__collection-container {
            height: calc(100% - 120px);
            overflow-y: scroll;
            position: relative;
        }
        &__collection-item {
            @include flex(center, _);
            position: relative;
            height: 75px;
            width: 100%;

            &--chosen {
                background-color: var(--lightColor2) !important;
            }
            &--skeleton &-details {
                width: 60%;
                &-img {
                    border-radius: 4px;
                }
                &-title {
                    height: 16px;
                    margin-bottom: 5px;
                    border-radius: 3px;
                }
                &-author {
                    height: 11px;
                    border-radius: 3px;
                    width: 50%;
                }
            }
            &--skeleton &-col-skeleton {
                height: 13px;
                margin: 0 auto;
                border-radius: 3px;
                width: 50%;
            }

            &:focus {
                background-color: var(--lightColor);
            }
            &:hover {
                background-color: var(--lightColor);
            }
            .divider {
                @include abs-bottom-left(0px, 25px);
                width: 90%;
            }
        }
        &__collection-item-details {
            width: calc(40% + 27px);
            display: flex;
            overflow: hidden;
        }
        &__collection-item-img {
            min-width: 45px;
            min-height: 45px;
            width: 45px;
            height: 45px;
            margin: 0px 16px 0px 27px;

            img {
                object-fit: cover;
                width: 100%;
                height: 100%;
                border-radius: 2px;
            }
        }
        &__collection-item-details-right {
            width: 100%;
            overflow: hidden;  

            a {
                display: block;
                width: min-content;
            }
        }
        &__collection-item-title {
            margin-bottom: 4px;
            @include text-style(1, 500, 1.2rem);
            @include elipses-overflow;
            max-width: 95%;
        }
        &__collection-item-author {
            @include text-style(0.4, 400, 1.185rem);
            @include elipses-overflow;
            max-width: 95%;
        }
        &__collection-item-length {
            font-family: "DM Sans";
        }
        &__collection-item-genre,
        &__collection-item-length {
            width: 30%;
            text-align: center;
            @include text-style(0.4, 400, 1.2rem);
        }

        &__empty-msg {
            @include text-style(0.125, 500, 1.45rem);
            @include abs-center;
            top: calc(50% - 50px);
        }
    }

    .lib { 
        /* Playlist Item */
        &__playlist {
            @include flex(center, _);
            padding: 11px 0px 11px 25px;
            position: relative;
            width: 100%;

            &:last-child {
                margin-bottom: 20px;
            }

            &:focus {
                background-color: var(--lightColor);
            }
            &:hover {
                background-color: var(--lightColor);
            }

            &--chosen {
                background-color: var(--lightColor);
            }
            &--skeleton &-idx {
                opacity: 0.03;
                font-weight: 500;
            }
            &--skeleton &-img {
                border-radius: 4px;
            }
            &--skeleton &-text-title {
                height: 15px;
                width: 50%;
                border-radius: 4px;
            }
            &--skeleton &-text-description {
                height: 12px;
                width: 80%;
                border-radius: 2px;
            }

            a {
                color: rgb(var(--textColor1));
            }
        }
        &__playlist-img {
            width: 40px;
            height: 40px;
            margin: 0px 15px 0px 2px;
            background-color: var(--lightColor2);
            box-shadow: var(--shadowVal);
            position: relative;
            
            img {
                border-radius: 5px;
                width: 40px;
                height: 40px;
                object-fit: cover;
            }
            i {
                color: rgba(var(--textColor1), 0.4);
                font-size: 1.3rem;
            }
        }
        &__playlist-text {
            overflow: hidden;
            width: calc(100% - 70px);
            
            &-title {
                width: min-content;
                margin-bottom: 4px;
                max-width: 95%;
                opacity: 0.9;
                @include text-style(_, 500, 1.13rem);
                @include elipses-overflow;
                display: inline-block;
            }
        }
        &__playlist-media-details {
            @include flex(center);
        }
        &__playlist-media-count {
            @include text-style(0.5, 300, 1.11rem, "DM Sans");
            margin-right: 7px;
            white-space: nowrap;
        }
        &__empty-msg {
            @include text-style(0.2, 400, 1.45rem, "DM Sans");
            @include abs-center;
            text-align: center;
        }
        &__library-dropdown-container {
            @include abs-top-right(42px, 10px);
        }
        &__library-dropdown {
            width: $lib-dmenu-width;
            @include abs-top-right(0px, -5px);

            &:last-child {
                width: $lib-dmenu-width - 10px;
                @include abs-top-right(0px, -18px);
            }
        }
        &__library-options-dropdown-container {
            @include abs-top-right(0px, calc(($lib-dmenu-width - 20px) * -1));
            position: relative;
            width: calc($lib-dmenu-width - 10px);
            height: 170px;
            z-index: 10000;
            // background-color: red;
        }
    }
    
    @include mq-custom(max-width, 42em) {
        .music {
            &__content {
                flex-direction: column;
                overflow: hidden;
            }
            &__left-section {
                width: 100%;
                max-width: none;
                height: auto;
            }
            &__right-section {
                width: 100%;
                margin-top: $section-spacing;
                height: calc(100% - 540px);
            }
        }
        .now-playing {
            margin: 0px;
            height: 200px;
            width: 100%;

            &__details-header {
                margin-bottom: 11px;
            }
            &__title {
                margin-bottom: 2px;
            }
            &__artwork {
                width: 83px;
                height: 83px;
                margin: 15px auto 15px auto;
            }
            &__text {
                @include multi-line-elipses-overflow(1);
            }
        }
        .discover {
            width: 100%;
        }
    }

</style>