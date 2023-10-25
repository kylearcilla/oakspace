<script lang="ts">
	import { onMount } from "svelte"
    import { ModalType, MusicPlatform, MusicMoodCategory } from "$lib/enums"
    import { musicCategories } from "$lib/data-music-collections"
	import { themeState, musicDataStore, musicPlayerStore } from "$lib/store"
    import { addSpacesToCamelCaseStr } from "$lib/utils-general"
	import { 
             USER_PLAYLISTS_REQUEST_LIMIT, discoverPlsPaginationScrollHandler, getDiscoverCollectionList, 
             getPlatformNameForDiscoverObj, handlePlaylistItemClicked, 
             musicLogout, musicLogin, refreshMusicSession 
    } from "$lib/utils-music"

	import Modal from "../../components/Modal.svelte"
	import SettingsMusicSignedOut from "./SettingsMusicSignedOut.svelte"
	import SettingsMusicAccountHeader from "./SettingsMusicAccountHeader.svelte"
	import { closeModal } from "$lib/utils-home"
	import { createMusicAPIErrorToastMsg } from "$lib/utils-music"

    let chosenDiscoverCardTitle = "Serene"
    let chosenMusicCollection: MusicCollection[] = []
    let isPlatformListOpen = false
    let isScrollableLeft = false
    let isScrollableRight = true
    let collectionList: HTMLElement | null
    let debounceTimeout: NodeJS.Timeout | null = null

    let hasCollectionItemsLoaded = true
    
    let isUserPlaylistsLoading = false
    let scrollTop = 0
    let scrollHeight = 0
    let scrollWindow = 0

    const SCROLL_STEP = 400
    const PLAYLIST_BTN_COOLDOWN_MS = 1000
    const FETCH_PLAYLIST_DELAY = 1000
    
    /* Log In Functionality  */
    async function _musicLogin (platform: MusicPlatform) {
        const res = await musicLogin(platform)
        if (!res.sucess) return
        
        handleDiscoverCollectionCardClicked(MusicMoodCategory.Serene)
    }
    async function activePlatformBtnClicked() {
        isPlatformListOpen = false
         $musicDataStore!.hasTokenExpired ? await refreshMusicSession() : await musicLogout()
    }

    /* Collection Item Clicked Event Handlers */
    async function _handlePlaylistItemClicked(collectionClicked: MusicCollection) {
        if (debounceTimeout !== null) return
        
        await handlePlaylistItemClicked(collectionClicked)
        debounceTimeout = setTimeout(() => debounceTimeout = null, PLAYLIST_BTN_COOLDOWN_MS)
    }

    /* Infinite Scroll */
    function hasReachedEndOfList() { 
        return Math.ceil(scrollTop) >= scrollHeight - scrollWindow 
    }

    async function userPlaylistInfiniteScrollHandler(event: Event) { 
        const list = event.target as HTMLElement
        scrollTop = list.scrollTop
        scrollHeight = list!.scrollHeight
        scrollWindow = list!.clientHeight 

        if (!hasReachedEndOfList()) return
        getMorePlaylists()
    }
    
    function getMorePlaylists() {
        if (isUserPlaylistsLoading || $musicDataStore!.hasFetchedAllUserPls || $musicDataStore!.hasTokenExpired) return
        
        isUserPlaylistsLoading = true
        setTimeout(async () => { 
            try {
                await $musicDataStore!.fetchMoreUserPlaylists()
                isUserPlaylistsLoading = false

                if (hasReachedEndOfList()) getMorePlaylists()
            }
            catch(error: any) {
                console.error(error)
                isUserPlaylistsLoading = false
                createMusicAPIErrorToastMsg(error)
            }
        }, FETCH_PLAYLIST_DELAY)
    }


    function _discoverPlsPaginationScrollHandler(e: Event) { 
        discoverPlsPaginationScrollHandler(e)
    }
    
    /* Discover Section */
    function handleShiftTabCategoryRight() {
         collectionList!.scrollLeft += SCROLL_STEP
    }
    function handleShiftTabCategoryLeft() { 
        collectionList!.scrollLeft -= SCROLL_STEP
    }

    function handleScroll() {
        const scrollLeft = collectionList!.scrollLeft
        const scrollWidth = collectionList!.scrollWidth
        const clientWidth = collectionList!.clientWidth 

        isScrollableLeft = scrollLeft > 0
        isScrollableRight = scrollLeft < scrollWidth - clientWidth
    }

    function handleDiscoverCollectionCardClicked(moodCategoryIdx: number) {
        const platform = $musicDataStore!.musicPlatform
        const platformProp = getPlatformNameForDiscoverObj(platform!)

        chosenDiscoverCardTitle = MusicMoodCategory[moodCategoryIdx]
        chosenMusicCollection = getDiscoverCollectionList(moodCategoryIdx, platformProp)
    }

    function onClickOutSide() { 
        closeModal(ModalType.Music) 
    }

    onMount(() => {
        if (!$musicDataStore?.isSignedIn) return
        handleDiscoverCollectionCardClicked(MusicMoodCategory.Serene)
    })
</script>

{#if $musicDataStore && $musicDataStore?.isSignedIn && $musicPlayerStore}
    <Modal onClickOutSide={onClickOutSide}> 
        <div class={`music ${!$themeState.isDarkTheme ? "music--light" : ""}`}>
            <!-- Top Header -->
            <h1 class="modal-bg__content-title">Music</h1>
            <SettingsMusicAccountHeader isPlatformListOpen={isPlatformListOpen} logOutUser={activePlatformBtnClicked} />
            <!-- Music Settings Content -->
            <div class="music__content">
                <div class="music__left-section">
                    <!-- Now Playing Section -->
                    <div class={`now-playing ${$musicPlayerStore.collection ? "" : "now-playing--empty"} bento-box`}>
                        <img class="img-bg" src={$musicPlayerStore.collection?.artworkImgSrc} alt="">
                        <div class={`blur-bg blur-bg--blurred-bg ${$musicPlayerStore.collection ?? "blur-bg--solid-color"}`}></div>
                        <div class="content-bg">
                            {#if $musicPlayerStore.collection}
                                <div class="now-playing__details-container">
                                    <div class="now-playing__details-header">
                                        <span class="now-playing__description-author">
                                            {$musicPlayerStore.collection.author}
                                        </span>
                                        <div class="now-playing__collection-details">
                                            <span class="now-playing__collection-type">
                                                {$musicPlayerStore.collection.type}
                                            </span>
                                            <span>/</span>
                                            <span class="now-playing__collection-song-count">
                                                {$musicPlayerStore.collection.songCount} Items
                                            </span>
                                        </div>
                                    </div>
                                    <div class={`now-playing__artwork ${$musicPlayerStore.collection.artworkImgSrc ? "" : "now-playing__artwork--empty"}`}>
                                        <img src={$musicPlayerStore.collection.artworkImgSrc} alt="current-collection">
                                        <i class="fa-solid fa-music abs-center"></i>
                                    </div>
                                    <div class="now-playing__description">
                                        {#if $musicPlayerStore.collection.url}
                                            <a href={$musicPlayerStore.collection.url} target="_blank" rel="noreferrer">
                                                <h4 class="now-playing__description-title">
                                                    {$musicPlayerStore.collection.name}
                                                </h4>
                                            </a>
                                        {:else}
                                            <h4 class="now-playing__description-title">
                                                {$musicPlayerStore.collection.name}
                                            </h4>
                                        {/if}
                                        <p class="now-playing__description-text">
                                            {$musicPlayerStore.collection.description}
                                        </p>
                                    </div>
                                </div>             
                            {:else}
                                <h4 class="now-playing__no-pl-selected">
                                    No Playlist / Album Selected
                                </h4>
                            {/if}
                        </div>
                    </div>
                    <!-- User Playlists Section -->
                    <div class="my-playlists bento-box bento-box--no-padding">
                        <div class="my-playlists__header bento-box__header">
                            <h3 class="bento-box__title">My Playlists</h3>
                            <span class="bento-box__subtitle">
                                {`${$musicDataStore?.userPlaylists.length} ${$musicDataStore?.userPlaylists.length == 1 ? "playlist" : "playlists"}`}
                            </span>
                        </div>
                        <ul class="my-playlists__collection-list" on:scroll={userPlaylistInfiniteScrollHandler}>
                            <!-- My Playlist items -->
                            {#if !isUserPlaylistsLoading && $musicDataStore?.userPlaylistsOffset > 0 && $musicDataStore?.userPlaylists.length === 0}
                                <img class="my-playlists__no-pl-meme-img abs-center" src="/no-pl.png" alt="no-playlists-img"/>
                            {/if}
                            {#each $musicDataStore?.userPlaylists as pl, idx}
                                <li
                                    on:dblclick={() => _handlePlaylistItemClicked(pl)}
                                    title={`${pl.name} – ${pl.description}`}
                                    class={`my-playlists__playlist ${$musicPlayerStore.collection && pl.id === $musicPlayerStore.collection.id ? "my-playlists__playlist--chosen" : ""}`}
                                >
                                    <p class="my-playlists__playlist-idx">{idx + 1}</p>
                                    <div class="my-playlists__playlist-img">
                                        {#if pl.artworkImgSrc != ""}
                                            <img src={pl.artworkImgSrc} alt="playlist-artwork"/>
                                        {:else}
                                            <i class="fa-solid fa-music abs-center"></i>
                                        {/if}
                                    </div> 
                                    <div class="my-playlists__playlist-text">
                                        <a href={pl.url} target="_blank" rel="noreferrer">
                                            <h5 class="my-playlists__playlist-text-title">{pl.name}</h5>
                                        </a>
                                        <p class="my-playlists__playlist-text-description">{pl.description}</p>
                                    </div>
                                    <div class="divider divider--thin"></div>
                                </li>
                            {/each}
                            <!-- Loading Skeleton -->
                            {#if isUserPlaylistsLoading}
                                {#each Array.from({ length: USER_PLAYLISTS_REQUEST_LIMIT }, (_, i) =>  ($musicDataStore?.userPlaylistsOffset ?? 0) + i) as idx}
                                    <li
                                        class={`my-playlists__playlist my-playlists__playlist--skeleton`}
                                    >
                                        <p class="my-playlists__playlist-idx seleton-bg">{idx + 1}</p>
                                        <div class="my-playlists__playlist-img skeleton-bg"></div> 
                                        <div class="my-playlists__playlist-text">
                                            <div class="my-playlists__playlist-text-title skeleton-bg"></div>
                                            <div class="my-playlists__playlist-text-description skeleton-bg"></div>
                                        </div>
                                        <div class="divider divider--thin"></div>
                                    </li>
                                {/each}
                            {/if} 
                        </ul>
                    </div>
                </div>
                <div class="music__right-section">
                    <!-- Discover Section -->
                    <div class="discover bento-box bento-box--no-padding">
                        {#if $musicDataStore.musicPlatform != null}
                            <h3 class="bento-box__title">{`Discover from ${addSpacesToCamelCaseStr(MusicPlatform[$musicDataStore.musicPlatform])}`}</h3>
                        {/if}
                        <p class="discover__copy bento-box__copy">Get in the zone with music that matches your vibe - select a category and discover new tunes to fuel your day.</p>
                        <div class="discover__collection-list-container">
                            {#if isScrollableLeft}
                                <div class="gradient-container gradient-container--left">
                                    <button 
                                        on:click={handleShiftTabCategoryLeft}
                                        class="gradient-container__tab-arrow gradient-container__tab-arrow--left"
                                    >
                                        <i class="fa-solid fa-chevron-left"></i>
                                    </button>
                                </div>
                            {/if}
                            <!-- Discover Categories Carousel -->
                            <ul  class="discover__collection-list" bind:this={collectionList} on:scroll={handleScroll}>
                                {#each musicCategories as group, idx}
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <li class={`discover__collection-card 
                                                 ${chosenDiscoverCardTitle === group.title ? "discover__collection-card--chosen" : ""}
                                              `}
                                        on:click={() => handleDiscoverCollectionCardClicked(idx)}
                                    >
                                        <img class="discover__collection-card-img" src={group.artworkSrc}  alt="">
                                        <div class="discover__collection-card-hover-details">
                                            <img src={group.artworkBlurredSrc} alt="">
                                            <h2>{group.title}</h2>
                                            <p 
                                                class="discover__collection-card-hover-details-description">
                                                {group.description}
                                            </p>
                                            <span> {group.artistCredit}</span>
                                        </div>
                                        <h3 class="discover__collection-card-title">{group.title}</h3>
                                    </li>
                                {/each}
                                <li class="discover__collection-list-padding discover__collection-list-padding-right"></li>
                            </ul>
                            {#if isScrollableRight}
                                <div class="gradient-container gradient-container--right">
                                    <button class="gradient-container__tab-arrow gradient-container__tab-arrow--right"
                                            on:click={handleShiftTabCategoryRight}
                                    >
                                        <i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>
                            {/if}
                        </div>
                        <!-- Collections List -->
                        <h3 class="discover__collection-title bento-box__subheading">{`${chosenDiscoverCardTitle} Collections`}</h3>
                        <div class="discover__collection-container">
                            <div class="discover__collection-header">
                                <h6 class="discover__collection-header-num">#</h6>
                                <h6 class="discover__collection-header-title">Title</h6>
                                <div class="discover__collection-header-type">
                                    <h6>Type</h6>
                                </div>
                                <div class="discover__collection-header-genre">
                                    <h6>Genre</h6>
                                </div>
                                <div class="discover__collection-header-length">
                                    <h6>Length</h6>
                                </div>
                            </div>
                            <ul class="discover__selected-collection-list" on:scroll={_discoverPlsPaginationScrollHandler}>
                                <!-- Collection Item -->
                                {#each chosenMusicCollection as collection, idx}
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <li
                                        on:dblclick={_ => _handlePlaylistItemClicked(collection)}
                                        title={`${collection.name} – ${collection.author}`}
                                        class={`discover__collection-item ${$musicPlayerStore.collection && collection.id === $musicPlayerStore.collection?.id ? "discover__collection-item--chosen" : ""}`}
                                    >
                                        <p class="discover__collection-item-num">{idx + 1}</p>
                                        <div class="discover__collection-item-details-container">
                                            <div class="discover__collection-item-details-img">
                                                <img src={collection.artworkImgSrc} alt="collection-artwork">
                                            </div>
                                            <div class="discover__collection-item-details">
                                                {#if collection?.url}
                                                    <a href={collection.url} target="_blank" rel="noreferrer">
                                                        <h5 class="discover__collection-item-details-title">{collection.name}</h5>
                                                    </a>
                                                {:else}
                                                    <h6 class="discover__collection-item-details-title">{collection.name}</h6>
                                                {/if}
                                                <span class="discover__collection-item-details-author">{collection.author}</span>
                                            </div>
                                        </div>
                                        <h6 class="discover__collection-item-type">{collection.type}</h6>
                                        <h6 class="discover__collection-item-genre">{collection.genre}</h6>
                                        <h6 class="discover__collection-item-length">
                                            {collection.songCount > 100 ? "100+" : collection.songCount}
                                        </h6>
                                        <div class="divider divider--thin"></div>
                                    </li>
                                {/each}
                                <!-- Loading Skeleton -->
                                {#if !hasCollectionItemsLoaded}
                                    {#each [1, 2, 3, 4, 5, 6, 7] as num}
                                        <li class={`discover__collection-item discover__collection-item--skeleton`}>
                                            <p class="discover__collection-item-num">{num}</p>
                                            <div class="discover__collection-item-details-container">
                                                <div class="discover__collection-item-details-img skeleton-bg"></div>
                                                <div class="discover__collection-item-details">
                                                    <h6 class="discover__collection-item-details-title skeleton-bg"> </h6>
                                                    <p class="discover__collection-item-details-author skeleton-bg"></p>
                                                </div>
                                            </div>
                                            <h6 class="discover__collection-item-type">
                                                <div class="discover__collection-item-col-skeleton skeleton-bg"></div>
                                            </h6>
                                            <h6 class="discover__collection-item-genre">
                                                <div class="discover__collection-item-col-skeleton skeleton-bg"></div>
                                            </h6>
                                            <h6 class="discover__collection-item-length">
                                                <div class="discover__collection-item-col-skeleton skeleton-bg"></div>
                                            </h6>
                                            <div class="divider divider--thin"></div>
                                        </li>
                                    {/each}
                                {/if}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
{/if}

<!-- Logged Off UI -->
{#if !$musicDataStore?.isSignedIn}
    <SettingsMusicSignedOut _loginUser={_musicLogin} />
{/if}

<style lang="scss">
    @import "../../scss/blurred-bg.scss";
    @import "../../scss/brands.scss";
    @import "../../scss/skeleton.scss";

    $section-spacing: 8px;
    $top-row-height: 170px;
    $bottom-row-height: 470px;
    $my-playlists-section-padding-left: 25px;
    $collection-card-border-radius: 12px;
    $collection-card-width: 160px;
    $collection-card-height: $collection-card-width - 20px;

    .music {
        width: 87vw;
        height: 780px;
        min-width: 390px;
        max-width: 1100px;
        padding: $settings-modal-padding;

        
        .skeleton-bg {
            @include skeleton-bg(dark);   
        }

        &__header {
            @include flex-container(center, _);
        }
        &__description {
            margin: 8px 0px 25px 0px;
            color: rgba(var(--textColor1), 0.85);
            font-weight: 400;
        }
        &__content {
            margin-top: 15px;
            display: flex;
            height: 95%;
            padding-bottom: 10px;
        }
        &__left-section {
            margin-right: $section-spacing;
            width: 32%;
            height: 100%;
        }
        &__right-section {
            width: calc(68% - $section-spacing);
        }

        /* Light Theme */
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
        &--light .my-playlists {
            &__header span {
                font-weight: 600;
            }
            &__playlist-text-title {
                font-weight: 600;
            }
            &__playlist-idx {
                font-weight: 500;
                opacity: 0.4;
            }
            &__playlist-text-description {
                font-weight: 500;
            }
        }
        &--light .discover {
            &__collection-header h6 {
                font-weight: 600;
            }
            &__collection-item-details-title {
                font-weight: 600;
            }
            &__collection-item-details-author {
                font-weight: 500;
            }
            &__collection-item-num {
                font-weight: 400;
            }
            &__collection-item h6 {
                color: rgba(var(--textColor1), 0.65);
                font-weight: 500;
            }
        }
    }
    
    /* Sections */
    .now-playing {
        margin: 0px $section-spacing $section-spacing 0px;
        height: 33%;
        width: 100%;
        position: relative;
        color: white;
        border-radius: 15px !important;
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
        span {
            display: block;
        }
        a {
            width: 90%;
            @include elipses-overflow;
        }
        &__details-container {
            position: relative;
            width: 100%;
            @include flex-container(_, space-between);
            flex-direction: column;
            height: 100%;
            padding-bottom: 5px;
        }
        &__details-header {
            @include flex-container(center, space-between);
        }
        &__artwork {
            z-index: 1;
            margin-right: 15px;
            position: relative;
            background-color: var(--hoverColor2);
            border-radius: 5px;
            @include flex-container(center, center);
            width: 90px;
            height: 90px;
            object-fit: cover;
            aspect-ratio: 1 / 1;
            margin: 0 auto 0 auto;
            
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
        &__description {
            overflow: hidden;
            max-height: 55px;
            &-author {
                color: rgba(255, 255, 255, 0.7);
                text-transform: capitalize;
                font-weight: 500;
                font-size: 1.2rem;
                @include elipses-overflow;
            }
            &-title {
                font-size: 1.3rem;
                color: rgba(249, 249, 249, 0.8);
                font-weight: 500;
                margin-bottom: 1px;
                width: 100%;
                @include elipses-overflow;
            }
            &-text {
                color: rgba(229, 229, 229, 0.5);
                overflow-y: scroll;
                font-size: 1.1rem;
                @include multi-line-elipses-overflow(2);
            }

            a {
                color: white;
                width: auto;
            }
        }
        &__collection-details {
            font-size: 1rem;
            font-weight: 500;
            display: flex;
            color: rgba(219, 219, 219, 0.5);

            span {
                margin-left: 4px;
                white-space: nowrap;

            }
        }
        &__no-pl-selected {
            font-weight: 600;
            font-size: 1.2rem;
            @include elipses-overflow();
            @include abs-center;
        }

        .img-bg {
            width: 99.5%;
        }
        .blur-bg {
            background: rgba(27, 27, 27, 0.4);
            backdrop-filter: blur(45px);
        }
        .content-bg, .img-bg, .blur-bg {
            border-radius: 15px !important;
        }
        
        .content-bg {
            top: 0px;
            padding: 12px 17px;
            border-radius: 15px !important;
        }
    }
    .my-playlists { 
        margin: 0px $section-spacing 0px 0px;
        width: 100%;
        height: calc(100% - (33% + $section-spacing));
        position: relative;
        margin-right: 6px;

        &__header {
            text-align: center;
            padding: 17px 17px 0px $my-playlists-section-padding-left;
            margin-bottom: 10px;
        }
        &__collection-list {
            height: 90%;
            overflow-y: scroll;
        }
        /* Playlist Item */
        &__playlist {
            @include flex-container(center, _);
            padding: 11px 0px 11px 20px;
            position: relative;

            &:last-child {
                margin-bottom: 20px;
            }

            &:focus {
                background-color: var(--hoverColor);
            }
            &:hover {
                background-color: var(--hoverColor);
            }

            &--chosen {
                background-color: var(--hoverColor);
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
            .divider {
                @include pos-abs-bottom-left-corner(0px, 22);
                width: 85%;
            }
        }
        &__playlist-idx {
            min-width: 22px;
            font-weight: 200;
        }
        &__playlist-img {
            min-width: 40px;
            max-width: 40px;
            height: 40px;
            margin-right: 14px;
            background-color: var(--hoverColor2);
            box-shadow: var(--shadowVal);
            position: relative;
            overflow: hidden;

            img {
                width: 40px;
            }
            i {
                color: rgba(var(--textColor1), 0.4);
                font-size: 1.3rem;
            }
        }
        &__playlist-text {
            margin-top: -8px;
            overflow: hidden;
            width: 75%;
            &-title {
                font-size: 1.1rem;
                font-weight: 500;
                margin-bottom: 5px;
            }
            &-description {
                @include elipses-overflow;
                width: 100%;
                font-size: 1.07rem;
                font-weight: 300;
                color: rgba(var(--textColor1), 0.53);
            }
        }
        &__no-pl-meme-img {
            width: 200px;
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
            padding: 17px 0px 0px $my-playlists-section-padding-left;
        }
        .bento-box__copy {
            padding-left: $my-playlists-section-padding-left;
        }
        &__header {
            padding: 17px 0px 0px $my-playlists-section-padding-left;
        }
        &__copy {
            padding-left: $my-playlists-section-padding-left;
            color: rgba(var(--textColor1), 0.4);
        }
        &__description {
            width: 100%;
            margin-top: -5px;
            color: #787878;
        }
        /* Discover Collections Carousel */
        &__collection-list-container {
            position: relative;
            margin-bottom: 20px;

            &:hover > .gradient-container {
                opacity: 1;
                visibility: visible;
            }
        }
        .gradient-container {
            height: 100%;

            &--left {
                width: 50px;
            }
            &--right {
                width: 50px;
            }
            &__tab-arrow {
                i {
                    color: white;
                }
                &--left {
                    margin-right: 13px;
                }
                &--right {
                    margin-left: 5px;
                }
            }
        }
        &__collection-list {
            margin-top: 25px;
            display: flex;
            overflow-x: scroll;
            scroll-behavior: smooth;
            li {
                &:first-child {
                    margin-left: 25px;
                }
            }
        }
        &__collection-list-padding {
            min-width: 80px;
            height: 1px;
        }
        /* Discover Collection Card */
        &__collection-card {
            margin-right: 6px;
            position: relative;
            border-radius:  $collection-card-border-radius;
            transition: 0.2s ease-in-out;
            overflow: hidden;
            cursor: pointer;
            color: white;
            min-width: $collection-card-width;
            height: $collection-card-height;
            border: 2px solid transparent;
            
            &--chosen {
                border: 2px solid white;
            }

            &:hover {
                min-width: $collection-card-width + 20;
            }
            &:hover > &-img {
                width: 200px;
            }
            &:active {
                transform: scale(0.99);
            }
            &:hover > &-hover-details {
                visibility: visible;
                opacity: 1;
                transition-delay: 0.2s;
            }
            &:hover > &-title {
                visibility: hidden;
                opacity: 0;
            }

            p {
                color: rgba(255, 255, 255, 0.7);
            }
        }
        &__collection-card-img {
            visibility: visible;
            -webkit-user-drag: none;
            opacity: 1;
            transition: 0.2s ease-in-out;
            object-fit: cover;
            width: $collection-card-width;
            height: $collection-card-height;
        }
        &__collection-card-title {
            transition: 0.3s ease-in-out;
            font-size: 1.3rem;
            font-weight: 600;
            @include pos-abs-bottom-left-corner(9px, 10px);
        }
        &__collection-card-hover-details {
            border-radius: 7px;
            transition: 0.1s ease-in-out;
            display: block;
            z-index: 100;
            width: 100%;
            height: 100%;
            padding: 60px 0px 0px 12px;
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
            @include pos-abs-top-left-corner(0px, 0px);
            
            h2 {
                font-weight: 600;
                margin-bottom: 5px
            }
            span {
                color: rgba(255, 255, 255, 0.64);
                @include pos-abs-top-right-corner(10px, 10px);
            }
            img {
                width: 101%;
                height: 101%;
                @include pos-abs-top-left-corner(0px, 0px);
                z-index: -1;
            }
        }
        &__collection-card-hover-details-description {
            color: rgba(var(--textColor2), 0.64);
            width: 95%;
        }

        /* Discover Category Collections List Section */
        &__collection-title {
            margin: 8px 0px 10px $my-playlists-section-padding-left;
            font-weight: 400;
            font-size: 1.4rem;
        }
        /* List Column Header Section */
        &__collection-header {
            width: 100%;
            opacity: 0.7;
            height: 18px;
            overflow: hidden;
            margin-top: 20px;
            display: flex;
            h6 { 
                font-size: 1.04rem;
                font-weight: 400; 
            }
        }
        &__collection-header-num {
            width: 25px;
            margin-left: $my-playlists-section-padding-left;
        }
        &__collection-header-title {
            width: 35%;
        }
        &__collection-header-type {
            width: 21%;
            text-align: center;
        }
        &__collection-header-genre {
            text-align: center;
            width: 21%;
        }
        &__collection-header-length {
            text-align: center;
            width: 21%;
        }
        /* Playlist List */
        &__selected-collection-list {
            overflow-y: scroll;
            height: 450px;
        }
        /* Playlist Item */
        &__collection-item {
            @include flex-container(center, _);
            position: relative;
            height: 68px;
            width: 100%;

            &:first-child {
                margin-top: 5px;
            }
            &:last-child {
                margin-bottom: 100px;
            }
            &--chosen {
                background-color: var(--hoverColor2) !important;
            }
            &--skeleton &-num {
                opacity: 0.1;
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
                background-color: var(--hoverColor);
            }
            &:hover {
                background-color: var(--hoverColor);
            }
            .divider {
                @include pos-abs-bottom-left-corner(0px, 25px);
                width: 90%;
            }
        }
        &__collection-item-num {
            margin-left: $my-playlists-section-padding-left;
            opacity: 0.7;
            width: 25px;
            color: rgba(var(--textColor1), 0.7);
        }
        &__collection-item-details-container {
            width: 35%;
            display: flex;
            overflow: hidden;
        }
        &__collection-item-details {
            max-width: 80%;
            overflow: hidden;
            &-img {
                background-color: var(--hoverColor);
                width: 35px;
                height: 35px;
                margin-right: 10px;
                aspect-ratio: 1/ 1;
            }
            &-img img {
                object-fit: cover;
                width: 100%;
                height: 100%;
            }
            a {
                width: fit-content;
                color: rgb(var(--textColor1));
                @include elipses-overflow;
                display: block;
            }
            &-title {
                width: fit-content;
                margin-bottom: 2.5px;
                font-size: 1.1rem;
                font-weight: 500; 
                @include elipses-overflow;
            }
            &-author {
                color: rgba(var(--textColor1), 0.4);
                font-weight: 400;
                font-size: 1.05rem;
                width: 100%;
                @include elipses-overflow;

            }        }
        &__collection-item-type,
        &__collection-item-genre,
        &__collection-item-length {
            width: 21%;
            text-align: center;
            color: rgba(var(--textColor1), 0.4);
            font-size: 1.05rem;
            font-weight: 400;
        }
    }
    
    @include mq-custom(max-width, 50em) {
        .modal-bg {
            &__content {
                padding: 25px 20px 30px 20px;
            }
        }
        .music {
            &__content {
                display: block;
            }
            &__left-section {
                width: 100%;
            }
            &__right-section {
                width: 100%;
                margin-top: $section-spacing;
                padding-bottom: 30px;
            }
        }
        .now-playing, .discover, .my-playlists {
            width: 100%;
        }
    }

</style>