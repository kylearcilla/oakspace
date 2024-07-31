<script lang="ts">
    import { onMount } from "svelte"
    import { themeState, musicDataStore, musicPlayerStore, musicSettingsManager } from "$lib/store"

    import { closeModal } from "$lib/utils-home"
    import { musicCategories } from "$lib/data-music-collections"
    import { addSpacesToCamelCaseStr, clickOutside } from "$lib/utils-general"
	import { musicLogin, LIBRARY_COLLECTION_LIMIT } from "$lib/utils-music"

	import { getMediaContext, getMediaItemInfo, getMediaLength, getMediaDescription, getMediaTypeStr } from "$lib/utils-music-settings"
    
	import Modal from "../../components/Modal.svelte"
	import SVGIcon from "../../components/SVGIcon.svelte"
	import MusicSettingsSignedOut from "./MusicSettingsSignedOut.svelte"
	import MusicSettingsAccountHeader from "./MusicSettingsAccountHeader.svelte"
    
    import { ModalType, MusicPlatform, MusicMoodCategory, UserLibraryMedia, Icon, MusicMediaType, LibError } from "$lib/enums"
	import { MusicSettingsManager } from "$lib/music-settings-manager";
	import DropdownList from "../../components/DropdownList.svelte";

    $: isLight = !$themeState.isDarkTheme

    $: isSignedIn      = $musicDataStore?.isSignedIn
    $: platform        = $musicDataStore?.musicPlatform
    $: mediaCollection = $musicPlayerStore?.mediaCollection 

    $: manager  = $musicSettingsManager

    $: chosenMood            = $musicSettingsManager?.chosenMood
    $: chosenMusicCollection = $musicSettingsManager?.chosenMusicCollection! ?? []

    $: userLibrary           = $musicSettingsManager?.userLibrary
    $: currLibraryCollection = $musicSettingsManager?.currLibraryCollection!
    $: isUserLibraryLoading  = $musicSettingsManager?.isUserLibraryLoading
    $: libError              = $musicSettingsManager?.libError
    
    $: isScrollableLeft      = $musicSettingsManager?.isScrollableLeft
    $: isScrollableRight     = $musicSettingsManager?.isScrollableRight
    
    $: categoriesListGradient = $musicSettingsManager?.categoriesListGradient

    $: if (isSignedIn) {
        onMusicInit(platform)
    }

    let hasCollectionItemsLoaded = true
    let isLibraryDropdownOpen = false
    let isLibraryOptionsDropdownOpen = false

    /* Init Music */
    function onMusicInit(platform?: MusicPlatform) {
        console.log($musicSettingsManager)
        if ($musicSettingsManager || platform === undefined) return

        manager = new MusicSettingsManager(platform)
        requestAnimationFrame(() => initMusicManager())
    }
    function initMusicManager() {
        if (!manager) return

        manager.updateLibrary()
        manager.handleDiscoverCollectionCardClicked(MusicMoodCategory.Serene)
        
        requestAnimationFrame(() => {
            manager!.fetchHTMLElements()
            manager!.handleCategoriesScroll()
        })
    }

    /* Library Dropdown */
    function onDailyRoutinesListOptClicked(e: Event) {
        const target = e.target as HTMLElement
        const optnText = target.innerText.trim()

        if (optnText === "Refresh Playlists") {
            manager?.refreshCurrentLibraryMedia() 
            isLibraryDropdownOpen = false
        }
    }

    /* Event Listeners */
    function onLibOptionClicked(idx: number) {
        if (!manager) return

        closeLibDropdowns()
        manager!.updateLibraryMedia(manager.libOptions[idx])
    }
    function openLibMediaOptions(e: Event) {
        const target = e.target as HTMLElement
        const optnText = target.innerText.trim()

        if (optnText.startsWith("Refresh")) {
            manager!.refreshCurrentLibraryMedia()
        }

        closeLibDropdowns()
    }
    function closeLibDropdowns() {
        isLibraryDropdownOpen = false
        isLibraryOptionsDropdownOpen = false
    }
    function onLibDropdownPointerLeave() {
        isLibraryOptionsDropdownOpen = false
    }

    onMount(initMusicManager)
</script>

{#if isSignedIn && manager}
    <Modal 
        onClickOutSide={() => closeModal(ModalType.Music)}
        options={{ borderRadius: "20px" }}
    >
        <div 
            class="music"
            class:music--light={isLight}
            class:music--dark={!isLight}
        >
            <!-- Top Header -->
            <div class="music__header">
                <h1 class="modal-bg__content-title">Music</h1>
                <div class="music__context-container">
                    <MusicSettingsAccountHeader onBtnClick={(platform) => manager?.onPlatformOptionClicked(platform)} />
                </div>
            </div>
            <!-- Music Settings Content -->
            <div class="music__content">
                <div class="music__left-section">
                    <!-- Now Playing Section -->
                    <div 
                        class="now-playing bento-box"
                        class:now-playing--empty={!mediaCollection}
                    >
                        <div class="img-bg-container">
                            <img class="img-bg" src={mediaCollection?.artworkImgSrc} alt="">
                        </div>
                        {#if mediaCollection}
                            <div class="img-bg-gradient"></div>
                        {/if}
                        <div class={`blur-bg blur-bg--blurred-bg ${mediaCollection ?? "blur-bg--solid-color"}`}>
                        </div>
                        <div class="content-bg">
                            {#if mediaCollection}
                                {@const description = getMediaDescription(mediaCollection)}
                                {@const type = getMediaTypeStr(mediaCollection.type)}

                                <div class="now-playing__details-container">
                                    <!-- Header -->
                                    <div class="now-playing__details-header">
                                        {#if description}
                                            <span class="now-playing__description-author">
                                                {mediaCollection.author}
                                            </span>
                                        {/if}
                                        <div class="now-playing__collection-details">
                                            <span class="now-playing__collection-type">
                                                {type}
                                            </span>
                                        </div>
                                    </div>
                                    <!-- Artwork -->
                                    <div 
                                        class="now-playing__artwork"
                                        class:now-playing__artwork--empty={!mediaCollection.artworkImgSrc}
                                    >
                                        <img src={mediaCollection.artworkImgSrc} alt="current-collection">
                                        <i class="fa-solid fa-music abs-center"></i>
                                    </div>
                                    <!-- Description -->
                                    <div class="now-playing__description">
                                        {#if mediaCollection.url}
                                            <a href={mediaCollection.url} target="_blank" rel="noreferrer">
                                                <h4 class="now-playing__description-title">
                                                    {mediaCollection.name}
                                                </h4>
                                            </a>
                                        {:else}
                                            <h4 class="now-playing__description-title">
                                                {mediaCollection.name}
                                            </h4>
                                        {/if}
                                        <p 
                                            class="now-playing__description-text"
                                            class:now-playing__description-text--author={!description}
                                        >
                                            {@html description ? description : mediaCollection.author}
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
                    <!-- User Library Section -->
                    <div class="my-playlists bento-box bento-box--no-padding">
                        <div class="my-playlists__header bento-box__header">
                            <div class="flx flx--algn-center">
                                <h3 class="bento-box__title">
                                    Library
                                </h3>
                                {#if userLibrary}
                                    <span class="my-playlists__count bento-box__subtitle">
                                        {userLibrary.totalItems}
                                    </span>
                                {/if}
                            </div>
                            {#if !libError}
                                <button 
                                    id="lib--dropdown-btn"
                                    class="my-playlists__dropdown-btn settings-btn" 
                                    on:click={() => isLibraryDropdownOpen = !isLibraryDropdownOpen}
                                >
                                    <SVGIcon icon={Icon.Settings} options={{ opacity: 0.3 }}/>
                                </button>
                            {/if}
                        </div>
                        <!-- Library Items -->   
                        <ul 
                            class="my-playlists__collection-list" 
                            id="library-list"
                            on:scroll={() => manager?.handleLibListScroll()}
                        >
                            {#if userLibrary && (userLibrary?.items || (userLibrary?.items && libError != LibError.NEW_COLLECTION))}
                                {@const isTrack      = currLibraryCollection === UserLibraryMedia.LikedTracks}
                                {@const isAlbum      = currLibraryCollection === UserLibraryMedia.Albums}
                                {@const isPodcastEp  = currLibraryCollection === UserLibraryMedia.PodcastEps}
                                {@const isAudiobook  = currLibraryCollection === UserLibraryMedia.Audiobooks}
                                {@const isPlaylist   = currLibraryCollection === UserLibraryMedia.Playlists}
                                {@const isArtist     = currLibraryCollection === UserLibraryMedia.Artists}
                                {@const isAppleMusic = platform === MusicPlatform.AppleMusic}

                                <!-- Media Item -->
                                {#each userLibrary?.items as item, idx}
                                    {@const itemInfo = getMediaItemInfo(item, currLibraryCollection)}
                                    {@const itemContext = getMediaContext(item, currLibraryCollection)}

                                    <li
                                        on:dblclick={() => manager?.handleMediaClicked(item, idx)}
                                        title={itemContext}
                                        class={`my-playlists__playlist ${mediaCollection && item.id === mediaCollection.id ? "my-playlists__playlist--chosen" : ""}`}
                                    >
                                        <div class="my-playlists__playlist-img">
                                            {#if item.artworkImgSrc != ""}
                                                <img src={item.artworkImgSrc} alt="playlist-artwork"/>
                                            {:else}
                                                <i class="fa-solid fa-music abs-center"></i>
                                            {/if}
                                        </div> 
                                        <!-- Media Item Details -->
                                        <div class="my-playlists__playlist-text">
                                            <a href={item.url} target="_blank" rel="noreferrer" class="my-playlists__playlist-text-title">
                                               {item.name}
                                            </a>
                                            <div class="my-playlists__playlist-media-details">
                                                {#if isAppleMusic && (isPlaylist || isArtist)}
                                                    <div class="my-playlists__playlist-media-subtitle-1"></div>
                                                <!-- Album -->
                                                {:else if isAlbum}
                                                    <div class="my-playlists__playlist-media-subtitle-1">
                                                        {itemInfo?.artist}
                                                    </div>
                                                <!-- Episode -->
                                                {:else if isPodcastEp}
                                                    <div class="my-playlists__playlist-media-subtitle-1">
                                                        {itemInfo?.show}
                                                    </div>
                                                <!-- Audiobook -->
                                                {:else if isAudiobook}
                                                    <div class="my-playlists__playlist-media-subtitle-1">
                                                        {itemInfo?.author}
                                                    </div>
                                                <!-- Track -->
                                                {:else if isTrack}
                                                    <div class="my-playlists__playlist-media-subtitle-1">
                                                        {itemInfo?.artist}
                                                    </div>
                                                    <div class="my-playlists__playlist-media-subtitle-2">
                                                        {itemInfo?.album}
                                                    </div>
                                                <!-- Playlist -->
                                                {:else}
                                                    <div class="my-playlists__playlist-media-subtitle-1">
                                                        {`${itemInfo?.length} ${itemInfo?.length === 1 ? "item" : "items"}`}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                        <div class="divider divider--thin"></div>
                                    </li>
                                {/each}
                            {/if}
                            <!-- Loading Skeleton -->   
                            {#if isUserLibraryLoading}
                                {#each Array.from({ length: LIBRARY_COLLECTION_LIMIT }, (_, i) => i) as _}
                                    <li
                                        class={`my-playlists__playlist my-playlists__playlist--skeleton`}
                                    >
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
                        <!-- Error UI -->
                        {#if libError === LibError.NEW_COLLECTION}
                            <div class="my-playlists__empty-msg">
                                Error loading items. Please try again.
                            </div>
                        {:else if userLibrary?.hasFetchedAll && userLibrary?.totalItems === 0}
                            <!-- Empty UI -->
                            <div class="my-playlists__empty-msg">
                                {`Your ${currLibraryCollection.toLocaleLowerCase()} collection is empty.`}
                            </div>
                        {/if}
                        <!-- Library Dropdown -->
                        <DropdownList 
                            id={"lib"}
                            isHidden={!isLibraryDropdownOpen} 
                            options={{
                                listItems: [
                                    { 
                                        name: "Pick Library",
                                        rightIcon: { type: "fa", icon: "fa-solid fa-chevron-right" },
                                        onPointerOver: () => isLibraryOptionsDropdownOpen = true,
                                        onPointerLeave: onLibDropdownPointerLeave
                                    },
                                    { 
                                        name: `Refresh ${currLibraryCollection}`,
                                        rightIcon: { type: "fa", icon: "fa-solid fa-rotate-right" },
                                        onPointerLeave: () => isLibraryOptionsDropdownOpen = false
                                    } 
                                ],
                                position: { top: "35px", right: "10px"},
                                styling:  { width: "160px" },
                                childId: "lib-media",
                                onListItemClicked: (context) => {
                                    openLibMediaOptions(context.event)
                                },
                                onClickOutside: () => {
                                    isLibraryDropdownOpen = false
                                    isLibraryOptionsDropdownOpen = false
                                }
                            }}
                        />
                        <!-- Library Media Dropdown -->
                        <DropdownList 
                            id={"lib-media"}
                            isHidden={!isLibraryOptionsDropdownOpen || !isLibraryDropdownOpen}
                            options={{
                                pickedItem: currLibraryCollection,
                                listItems:  manager.libOptions.map((media) => ({ name: media })),
                                styling:  { width: "125px", maxHeight: "300px" },
                                onListItemClicked: (context) => onLibOptionClicked(context.idx),
                                position: { top: "35px", right: "-120px" },
                                parent: {
                                    id: "lib",
                                    optnIdx: 0,
                                    optnName: "Pick Library"
                                },
                                onPointerLeave: () => isLibraryOptionsDropdownOpen = false
                            }}
                        />
                    </div>
                </div>
                <div class="music__right-section">
                    <!-- Discover Section -->
                    <div class="discover bento-box bento-box--no-padding">
                        {#if platform != null}
                            <h3 class="bento-box__title">
                                {`Discover from ${addSpacesToCamelCaseStr(MusicPlatform[platform])}`}
                            </h3>
                        {/if}
                        <p class="discover__copy bento-box__copy">
                            Get in the zone and discover music that matches your vibe.
                        </p>
                        <div class="discover__collection-list-container">
                            {#if isScrollableLeft}
                                <button 
                                    on:click={() => manager?.handleShiftTabCategoryLeft()}
                                    class="discover__collection-list-container-btn discover__collection-list-container-btn--left"
                                >
                                    <i class="fa-solid fa-chevron-left"></i>
                                </button>
                            {/if}
                            <div class="discover__collection-list-container-gradient-wrapper" style={`${categoriesListGradient}`}>
                                <!-- Discover Categories Carousel -->
                                <ul  class="discover__collection-list" id="collection-list" on:scroll={() => manager?.handleCategoriesScroll()}>
                                    {#each musicCategories as group, idx}
                                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                                        <li class={`discover__collection-card ${manager.chosenMood === group.moodType ? "discover__collection-card--chosen" : ""}`}
                                            on:click={() => manager?.handleDiscoverCollectionCardClicked(group.moodType)}
                                        >
                                            <img class="discover__collection-card-img" src={group.artworkSrc}  alt="">
                                            <div class="discover__collection-card-hover-details">
                                                <img src={group.artworkBlurredSrc} alt="">
                                                <div class="discover__collection-card-hover-details-text-container">
                                                    <span>{group.artistCredit}</span>
                                                    <div>
                                                        <h2>{group.moodType}</h2>
                                                        <p  class="discover__collection-card-hover-details-description">
                                                            {group.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 class="discover__collection-card-title">{group.moodType}</h3>
                                        </li>
                                    {/each}
                                    <li class="discover__collection-list-padding discover__collection-list-padding-right"></li>
                                </ul>
                            </div>
                            {#if isScrollableRight}
                                <button class="discover__collection-list-container-btn discover__collection-list-container-btn--right"
                                        on:click={() => manager?.handleShiftTabCategoryRight()}
                                >
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                            {/if}
                        </div>
                        <!-- Collections List -->
                        <h3 class="discover__collection-title bento-box__subheading">{`${chosenMood} Collections`}</h3>
                        <div class="discover__collection-container">
                            <div class="discover__collection-header">
                                <div class="discover__collection-header-num">#</div>
                                <div class="discover__collection-header-title">Title</div>
                                <div class="discover__collection-header-type">
                                    <div>Type</div>
                                </div>
                                <div class="discover__collection-header-genre">
                                    <div>Genre</div>
                                </div>
                                <div class="discover__collection-header-length">
                                    <div>Length</div>
                                </div>
                            </div>
                            <ul class="discover__selected-collection-list">
                                <!-- Collection Item -->
                                {#each chosenMusicCollection as collection, idx}
                                    {@const type = MusicMediaType[collection.type]}
                                    {@const length = getMediaLength(collection)}

                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <li
                                        on:dblclick={() => manager?.handleMediaClicked(collection, idx)}
                                        title={`${collection.name} – ${collection.author}`}
                                        class={`discover__collection-item ${mediaCollection && collection.id === mediaCollection?.id ? "discover__collection-item--chosen" : ""}`}
                                    >
                                        <p class="discover__collection-item-num">{idx + 1}</p>
                                        <div class="discover__collection-item-details-container">
                                            <div class="discover__collection-item-details-img">
                                                <img src={collection.artworkImgSrc} alt="collection-artwork">
                                            </div>
                                            <div class="discover__collection-item-details">
                                                {#if collection?.url}
                                                    <a href={collection.url} target="_blank" rel="noreferrer" class="discover__collection-item-details-title">
                                                        {collection.name}
                                                    </a>
                                                {:else}
                                                    <div class="discover__collection-item-details-title">{collection.name}</div>
                                                {/if}
                                                {#if collection?.authorUrl}
                                                    <a href={collection.authorUrl} target="_blank" rel="noreferrer" class="discover__collection-item-details-author">
                                                        {collection.author}
                                                    </a>
                                                {:else}
                                                    <span class="discover__collection-item-details-author">{collection.author}</span>
                                                {/if}
                                            </div>
                                        </div>
                                        <div class="discover__collection-item-type">
                                            {type === "RadioStation" ? "Radio" : type}
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
                                <!-- Loading Skeleton -->
                                {#if !hasCollectionItemsLoaded}
                                    {#each [1, 2, 3, 4, 5, 6, 7] as num}
                                        <li class={`discover__collection-item discover__collection-item--skeleton`}>
                                            <p class="discover__collection-item-num">{num}</p>
                                            <div class="discover__collection-item-details-container">
                                                <div class="discover__collection-item-details-img skeleton-bg"></div>
                                                <div class="discover__collection-item-details">
                                                    <div class="discover__collection-item-details-title skeleton-bg"> </div>
                                                    <p class="discover__collection-item-details-author skeleton-bg"></p>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
{/if}

<!-- Logged Off UI -->
{#if !isSignedIn}
    <MusicSettingsSignedOut _loginUser={musicLogin} />
{/if}

<style lang="scss">
    @import "../../scss/blurred-bg.scss";
    @import "../../scss/brands.scss";
    @import "../../scss/skeleton.scss";
    @import "../../scss/dropdown.scss";

    $section-spacing: 8px;
    $top-row-height: 170px;
    $bottom-row-height: 470px;
    $my-playlists-section-padding-left: 25px;
    $lib-dropdown-menu-width: 155px;
    
    $collection-card-border-radius: 10px;
    $collection-card-width: 165px;
    $collection-card-height: $collection-card-width - 16px;
    $collection-card-width-expanded: $collection-card-width + 30;

    .music {
        width: 87vw;
        height: 87vh;
        min-width: 390px;
        max-width: 1050px;
        padding: 14px 25px 17px 25px;

        .skeleton-bg {
            @include skeleton-bg(dark);   
        }

        &__header {
            @include flex(center, space-between);
        }
        &__description {
            margin: 8px 0px 25px 0px;
            color: rgba(var(--textColor1), 0.85);
            font-weight: 400;
        }
        &__content {
            margin-top: 15px;
            display: flex;
            height: calc(100% - (25px + 14px ));
            padding-bottom: 10px;
            min-height: 650px;
        }
        &__left-section {
            margin-right: $section-spacing;
            width: calc(30% - ($section-spacing / 2));
            min-width: 240px;
            max-width: 270px;
        }
        &__right-section {
            width: calc(70% - ($section-spacing / 2));
            flex: 1;
        }

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
            &__collection-header {
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
            &__collection-item {
                color: rgba(var(--textColor1), 0.65);
                font-weight: 500;
            }
        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;

        }
        &--dark .img-bg {
            top: -80px;  // includes a dark gradient at the bottom
            left: 0px;
            transform: none;
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
        min-height: 200px;

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
            @include flex(_, space-between);
            flex-direction: column;
            height: 100%;
            padding-bottom: 3px;
        }
        &__details-header {
            @include flex(center, space-between);
        }
        &__artwork {
            z-index: 1;
            margin-right: 15px;
            position: relative;
            background-color: var(--hoverColor2);
            border-radius: 5px;
            @include flex(center, center);
            width: 80px;
            height: 80px;
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
                margin-bottom: 3px;
                width: 100%;
                @include elipses-overflow;
            }
            &-text {
                color: rgba(229, 229, 229, 0.5);
                overflow-y: scroll;
                font-size: 1.2rem;
                @include multi-line-elipses-overflow(2);
            }
            &-text--author {
                margin-top: -1px;
            }

            a {
                width: auto;
                color: rgba(229, 229, 229, 0.5);
                font-size: 1.2rem;
                display: inline;
            }
        }
        &__collection-details {
            font-size: 1.2rem;
            font-weight: 500;
            display: flex;
            color: rgba(219, 219, 219, 0.5);

            span {
                margin-left: 0px;
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
            z-index: 0;
            border-radius: 10px;
        }
        .img-bg-gradient {
            border-radius: 10px;
            width: 100%;
            height: 2%;
            z-index: 1;
            background: linear-gradient(0deg, #000000 5%, transparent) !important;
        }
        .blur-bg {
            background: rgba(14, 14, 14, 0.25);
            backdrop-filter: blur(45px);
            z-index: 2;
            @include abs-top-left;
            transform: none;
        }
        .content-bg {
            top: 0px;
            padding: 10px 15px 12px 14px;
            z-index: 3;
        }
        .content-bg, .img-bg, .blur-bg {
            border-radius: 15px !important;
        }
    }
    .my-playlists { 
        margin: 0px $section-spacing 0px 0px;
        width: 100%;
        height: calc(100% - (33% + $section-spacing));
        position: relative;
        margin-right: 6px;
        position: relative;

        &__header {
            text-align: center;
            padding: 17px 17px 0px $my-playlists-section-padding-left;
            margin-bottom: 10px;
        }
        &__count {
            @include text-style(0.3, 400, 1.2rem, "DM Sans");
            margin: 0px 0px 3px 10px;
        }
        &__dropdown-btn {
            @include txt-color(0.02, "bg");
            margin: -4px -4px 0px 0px;
            background-color: rgb(var(--textColor1), 0) !important;
            
            &:hover {
                background-color: rgb(var(--textColor1), 0.05) !important;
            }
        }
        &__collection-list {
            height: calc(100% - 51px);
            overflow-y: scroll;

            &::-webkit-scrollbar {
                display: none;
            }
        }
        /* Playlist Item */
        &__playlist {
            @include flex(center, _);
            padding: 11px 0px 11px 20px;
            position: relative;
            width: 100%;

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
                @include abs-bottom-left(0px, 22);
                width: 85%;
            }
        }
        &__playlist-img {
            width: 45px;
            height: 45px;
            margin: 0px 15px 0px 2px;
            background-color: var(--hoverColor2);
            box-shadow: var(--shadowVal);
            position: relative;
            border-radius: 5px;
            
            img {
                border-radius: 0px !important;
                width: 45px;
                height: 45px;
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
                display: inline-block;
                @include text-style(1, 500, 1.13rem);
                @include elipses-overflow;
            }
        }
        &__playlist-media-details {
            @include flex(center);
        }
        &__playlist-media-subtitle-1 {
            @include text-style(0.5, 300, 1.11rem, "DM Sans");
            margin-right: 7px;
            white-space: nowrap;
        }
        &__playlist-media-subtitle-2 {
            @include text-style(0.3, 400, 1.12rem, "DM Sans");
            @include elipses-overflow;
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
            width: $lib-dropdown-menu-width;
            @include abs-top-right(0px, -5px);

            &:last-child {
                width: $lib-dropdown-menu-width - 10px;
                @include abs-top-right(0px, -18px);
            }
        }
        &__library-options-dropdown-container {
            @include abs-top-right(0px, calc(($lib-dropdown-menu-width - 20px) * -1));
            position: relative;
            width: calc($lib-dropdown-menu-width - 10px);
            height: 170px;
            z-index: 10000;
            // background-color: red;
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
            margin: 5px 0px 15px 0px;
        }
        &__header {
            padding: 17px 0px 0px $my-playlists-section-padding-left;
        }
        &__copy {
            padding-left: $my-playlists-section-padding-left;
        }
        &__description {
            width: 100%;
            margin-top: -5px;
            color: #787878;
        }
        /* Discover Collections Carousel */
        &__collection-list-container {
            position: relative;
            margin-bottom: 14px;

            &:hover &-btn {
                opacity: 1;
                visibility: visible;
            }
            &:not(:hover) &-gradient-wrapper {
                mask-image: none !important;
                -webkit-mask-image: none !important;
                transition: 0.6s webkit-mask-image ease-in-out;
            }
            &-gradient-wrapper {
                width: 100%;
            }
            &-btn {
                opacity: 0;
                visibility: hidden;
                @include circle(20px);
                @include center;
                background-color: rgba(100, 100, 100, 0.4);
                transition: 0.12s ease-in-out;
                z-index: 100;

                i {
                    color: white;
                }
                &:active {
                    transform: scale(0.8);
                }

                &--left {
                    @include abs-top-left(60px, 5px);
                }
                &--right {
                    @include abs-top-right(60px, 5px);
                }
            }
        }
        &__collection-list {
            display: flex;
            overflow-x: scroll;
            scroll-behavior: smooth;

            &::-webkit-scrollbar {
                display: none;
            }

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
            overflow: hidden;
            cursor: pointer;
            color: white;
            min-width: $collection-card-width;
            height: $collection-card-height;
            border: 2px solid transparent;
            transition: min-width 0.45s cubic-bezier(.2,.45,0,1);
            
            &--chosen {
                border: 2px solid white;
            }
            
            &:active {
                transition: 0.12s ease-in-out;
                transition-delay: 0s !important;
            }
            &:hover {
                transition-delay: 0.6s;
                min-width: $collection-card-width-expanded;
            }

            &:hover &-hover-details {
                visibility: visible;
                opacity: 1;
                transition: 0.2s ease-in-out;
                transition-delay: 0.8s;
            }
            &:hover &-title {
                visibility: hidden;
                opacity: 0;
                transition-delay: 0.6s;
            }
            &:active {
                transform: scale(0.99);
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
            width: 100%;
            height: 100%;
        }
        &__collection-card-title {
            transition: 0.3s ease-in-out;
            font-size: 1.3rem;
            font-weight: 600;
            @include abs-bottom-left(9px, 10px);
        }
        &__collection-card-hover-details {
            border-radius: 7px;
            display: block;
            z-index: 100;
            width: 100%;
            height: 100%;
            visibility: hidden;
            opacity: 0;
            @include abs-top-left(0px, 0px);
            
            h2 {
                font-weight: 600;
                margin-bottom: 5px;
                font-size: 1.8rem;
            }
            span {
                color: rgba(255, 255, 255, 0.64);
                display: block;
                font-weight: 500;
            }
            img {
                width: 101%;
                height: 101%;
                @include abs-top-left(0px, 0px);
                z-index: -1;
            }

            &-text-container {
                height: 100%;
                @include flex(_, space-between);
                flex-direction: column;
                padding: 12px;
            }
            &-description {
                color: rgba(white, 0.64);
                font-weight: 400;
            }
        }

        /* Discover Category Collections List Section */
        &__collection-title {
            margin: 0px 0px 0px $my-playlists-section-padding-left;
            @include text-style(1, 500, 1.3rem);
        }
        /* List Column Header Section */
        &__collection-header {
            width: 100%;
            height: 18px;
            overflow: hidden;
            margin-top: 12px;
            display: flex;
            @include text-style(0.7, 500, 1.04rem);
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
            @include flex(center, _);
            position: relative;
            height: 70px;
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
                @include abs-bottom-left(0px, 25px);
                width: 90%;
            }
        }
        &__collection-item-num {
            margin-left: $my-playlists-section-padding-left;
            opacity: 0.3;
            width: 25px;
            font-family: "DM Sans";
        }
        &__collection-item-details-container {
            width: 35%;
            display: flex;
            overflow: hidden;
        }
        &__collection-item-details {
            width: 100%;
            overflow: hidden;
            &-img {
                background-color: var(--hoverColor);
                max-width: 40px;
                max-width: 40px;
                min-width: 40px;
                min-height: 40px;
                margin-right: 16px;
            }
            &-img img {
                object-fit: cover;
                width: 100%;
                height: 100%;
            }
            &-title {
                margin-bottom: 2.5px;
                max-width: 95%;
                @include text-style(1, 500, 1.1rem);
                @include elipses-overflow;
            }
            &-author {
                @include text-style(0.4, 500, 1.08rem);
                width: fit-content;
                max-width: 95%;
                display: block;
                @include elipses-overflow;

            }        
        }
        &__collection-item-length {
            font-family: "DM Sans";
        }
        &__collection-item-type,
        &__collection-item-genre,
        &__collection-item-length {
            width: 21%;
            text-align: center;
            @include text-style(0.4, 400, 1.14rem);
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
                flex-direction: column;
            }
            &__left-section {
                width: 100%;
                max-width: none;
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
        .now-playing {
            &__artwork {
                width: 120px;
                height: 120px;
            }
        }
    }

</style>