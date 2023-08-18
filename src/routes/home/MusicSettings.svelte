<script lang="ts">
	import { onDestroy, onMount } from "svelte"
    
	import { _authAppleUser, _initMusicKit } from "./+page"
	import type { MusicPlayer } from "$lib/MusicPlayer"
    import { clickOutside } from "$lib/helper"
	import { MusicData } from "$lib/MusicData"
	import { AppleMusicPlayer } from "$lib/AppleMusicPlayer"

	import { 
        appleMusicPlayerState, colorThemeState, curentPlaylist, musicDataState, 
        musicPlayerData, userMusicPlaylists 
    } from "$lib/store"
    import { 
        musicCategories, sereneCollections, acousticCollections, 
        classicalCollections, lofiCollections, soundtrackCollections, 
        summerCollections, upbeatCollections, zenCollections  
    } from "$lib/data-music-collections"

    enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }

    export let onNavButtonClicked: any

    let musicPlayer: MusicPlayer | null = null
    let musicData: MusicData | null = null

    let isSignedIn = false
    let isPlatformListOpen = false
    let collectionTitle = "Serene"

    let playlists: any = []
    let currentMusicCollection: MusicCollection | null = null
    
    let collectionGroupIdx = 0
    let isScrollableLeft = false
    let isScrollableRight = true
    let collectionList: HTMLElement

    let debounceTimeout: NodeJS.Timeout | null = null

    const SCROLL_STEP = 400
    const PLAYLIST_BTN_COOLDOWN_MS = 1000

    let isLightTheme = false

    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    // init music data for music settings
    musicDataState.subscribe((data: MusicData) => {
        if (data) isSignedIn = true
        musicData = data
    })
    appleMusicPlayerState.subscribe((data: MusicPlayer) => musicPlayer = data)    
    userMusicPlaylists.subscribe((data: MusicCollection[] | null) => playlists = (!data || data.length == 0) ? [] : data)
    curentPlaylist.subscribe((data: MusicCollection | null) => currentMusicCollection = data)

    let chosenMusicCollection: MusicDiscoverCollection[] = []

    const closeModal = () => onNavButtonClicked("")

    // attempt to init player
    const initMusicData = async (platform: MusicPlatform) => {
        if (platform === MusicPlatform.AppleMusic) {
            musicData = new MusicData(MusicPlatform.AppleMusic)

            try {
                await musicData.authUser()
                musicData.loadMusicData()
                musicData.setUserPlaylists()
                musicPlayer = new AppleMusicPlayer(musicData)
    
                appleMusicPlayerState.set(musicPlayer)
                musicDataState.set(musicData)
    
                isSignedIn = true
                // @ts-ignore
                chosenMusicCollection = sereneCollections[getPlatformNameForDiscoverPlaylist()]
            } catch (error) {
                console.error("An error occurred:", error)
            }
        }
    }

    /**
     * For selecting corresponding category playlists for Discover section (varies for each platform)
    */
    function getPlatformNameForDiscoverPlaylist(): string {
        const platform = MusicPlatform[musicData!.musicPlatform!].toLowerCase()
        return platform === "applemusic" ? "appleMusic" : platform
    }
    const getPlatformName = (): string => {
        const platform = MusicPlatform[musicData!.musicPlatform!]
        return platform === "AppleMusic" ? "Apple Music" : platform
    }
    const logoutUser = (platformName: string) => {
        isSignedIn = false
     }

    /**
     * @param id        used to play playlist for app player using JS Music Kit API
     * @param globalId  used for getting user playlist details for personal playlists, otherwise id is used
     */
    const handlePersonalPlaylistClicked = async (id: string, globalId: string = id) => {
        if (debounceTimeout !== null) return

        musicPlayer!.musicPlayerData.isShuffled ? musicPlayer!.toggleShuffle() : null;
        musicPlayer!.musicPlayerData.isRepeating ? musicPlayer!.toggleShuffle() : null;
        
        musicPlayer!.updateMusicPlayerData({ 
            ...musicPlayer!.musicPlayerData, 
            isDisabled: true, 
            isShuffled: false,
            isRepeating: false,
        })
        
        musicData!.setNewPlaylist(globalId)
        musicPlayer!.queueAndPlayNextTrack(id, 0)

        debounceTimeout = setTimeout(() => debounceTimeout = null, PLAYLIST_BTN_COOLDOWN_MS)
    }

    /* Discover Section Functionality */
    const handleDiscoverCollectionClicked = (index: number) => {
        collectionGroupIdx = index
        collectionTitle = musicCategories[index].title
        const platformProp = getPlatformNameForDiscoverPlaylist()

        switch (collectionTitle) {
            case "Serene":
                //@ts-ignore
                chosenMusicCollection = sereneCollections[platformProp]
                break
            case "Lofi":
                //@ts-ignore
                chosenMusicCollection = lofiCollections[platformProp]
                break
            case "Upbeat":
                //@ts-ignore
                chosenMusicCollection = upbeatCollections[platformProp]
                break
            case "Soundtracks":
                //@ts-ignore
                chosenMusicCollection = soundtrackCollections[platformProp]
                break
            case "Acoustic":
                //@ts-ignore
                chosenMusicCollection = acousticCollections[platformProp]
                break
            case "Classical":
                //@ts-ignore
                chosenMusicCollection = classicalCollections[platformProp]
                break
            case "Zen":
                //@ts-ignore
                chosenMusicCollection = zenCollections[platformProp]
                break
            case "Summer":
                //@ts-ignore
                chosenMusicCollection = summerCollections[platformProp]
                break
        }
    }

    const getCollectionId = (collection: MusicDiscoverCollection) => {
        return (collection?.albumId ?? collection.playlistId) ?? ""
    }

    const handleRecommendedPlaylistClicked = async (collection: MusicDiscoverCollection, event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'A' || debounceTimeout !== null) return

        const id = collection?.albumId ?? (collection?.playlistId ?? (collection?.albumId ?? ""))
        if (id === currentMusicCollection?.id) {
            musicData!.removeCurrentMusicCollection()
            musicPlayer!.resetMusicPlayerDataToEmptyState()
            return
        }

        musicPlayer!.musicPlayerData.isShuffled ? musicPlayer!.toggleShuffle() : null;
        musicPlayer!.musicPlayerData.isRepeating ? musicPlayer!.toggleShuffle() : null;
        
        musicPlayer!.updateMusicPlayerData({ 
            ...musicPlayer!.musicPlayerData, 
            isDisabled: true, 
            isShuffled: false,
            isRepeating: false,
        })

        musicData!.updateCurrentPlaylist({
            id: id,
            name: collection.title,
            description: collection?.description,
            artworkImgSrc: collection.artworkSrc,
            currentIndex: 0,
            time: "",
            type: collection.playlistId === null ? "Album" : "Playlist",
            songCount: collection.length,
            url: collection.url,
            author: collection.author
        })

        musicPlayer!.queueAndPlayNextTrack(id, 0)
        debounceTimeout = setTimeout(() => debounceTimeout = null, PLAYLIST_BTN_COOLDOWN_MS)
    }

    /* Discover Collection Carousel Functionality */
    const handleShiftTabCategoryRight = () => collectionList!.scrollLeft += SCROLL_STEP
    const handleShiftTabCategoryLeft = () => collectionList!.scrollLeft -= SCROLL_STEP

    const handleScroll = (event: any) => {
        const scrollLeft = event.target.scrollLeft
        const scrollWidth = event.target.scrollWidth
        const clientWidth = event.target.clientWidth // container width

        isScrollableLeft = scrollLeft > 0
        isScrollableRight = scrollLeft + clientWidth < scrollWidth - 20
    }

    // right arrow disappears after a window resize if false even user can scroll right
    const handleResize = () => {
        const scrollLeft = collectionList.scrollLeft
        const scrollWidth = collectionList.scrollWidth
        const clientWidth = collectionList.clientWidth

        isScrollableRight = scrollLeft + clientWidth < scrollWidth
    }

    onMount(() => {
        window.addEventListener("resize", handleResize)
        if (musicData) {
            chosenMusicCollection = (sereneCollections as any)[getPlatformNameForDiscoverPlaylist()]
        }
    })
    onDestroy(() => window.removeEventListener("resize", handleResize))
</script>

<div class="modal-bg">
    <div 
        use:clickOutside on:click_outside={closeModal} 
        class={`modal-bg__content modal-bg__content--overflow-y-scroll ${isSignedIn ? "" : "modal-bg__content--med"}`}
    >
        <!-- <button on:click={closeModal} class="close-btn">
            <i class="fa-solid fa-xmark"></i>
        </button> -->
        <div class={`music ${isSignedIn ? "" : "music--small"}`}>
            <h1 class="modal-bg__content-title">Music</h1>
            {#if isSignedIn}
            <!-- Logged In Profile Header -->
            <div class="active-account-header">
                <button class="active-account-header__btn dropdown-element" on:click={() => isPlatformListOpen = !isPlatformListOpen}>
                    {#if musicData?.musicPlatform === MusicPlatform.Soundcloud}
                        <div class="platform-logo platform-logo--small platform-logo--soundcloud dropdown-element">
                            <i class="fa-brands fa-soundcloud fa-soundcloud--small"></i>
                        </div>
                    {:else if musicData?.musicPlatform === MusicPlatform.Youtube}
                        <div class="platform-logo platform-logo--small platform-logo--youtube dropdown-element">
                            <i class="fa-brands fa-youtube fa-youtube--small"></i>
                        </div>
                    {:else if musicData?.musicPlatform === MusicPlatform.AppleMusic}
                        <div class="platform-logo platform-logo--small platform-logo--apple dropdown-element">
                            <i class="fa-brands fa-itunes-note fa-itunes-note--small"></i>
                        </div>
                    {:else if musicData?.musicPlatform === MusicPlatform.Spotify}
                        <div class="platform-logo platform-logo--small platform-logo--spotify dropdown-element">
                            <i class="fa-brands fa-spotify fa-spotify--small"></i>
                        </div>
                    {/if}
                    <span class="caption-3">{getPlatformName()}</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
                <span class="active-account-header__username caption-3">Kyle Arcilla</span>
                <div class="active-account-header__user-profile-pic">
                    <img src="" alt="">
                </div>
                <!-- Music Platform Dropdown List -->
                {#if isPlatformListOpen}
                    <ul class="platform-list" use:clickOutside on:click_outside={() => isPlatformListOpen = false}>
                        <li class="platform-list__platform-item">
                            <div class="platform-logo platform-logo--small platform-logo--soundcloud">
                                <i class="fa-brands fa-soundcloud fa-soundcloud--small"></i>
                            </div>
                            <div class="platform-list__platform-item-text">
                                <h5>Soundcloud</h5>
                                <span class="caption-5">Playlist</span>
                            </div>
                            <button 
                                class={`platform-list__platform-item-btn ${musicData?.musicPlatform === MusicPlatform.Soundcloud ? "platform-list__platform-item-btn--selected" : ""} text-only`}
                                on:click={() => initMusicData(MusicPlatform.Soundcloud)}
                            >
                                <span class="caption-3">{musicData?.musicPlatform === MusicPlatform.Soundcloud ? "Disconnect" : "Connect"}</span>
                            </button>
                        </li>
                        <li class="platform-list__platform-item">
                            <div class="platform-logo platform-logo--youtube platform-logo--small-youtube">
                                <i class="fa-brands fa-youtube fa-youtube--small"></i>
                            </div>
                            <div class="platform-list__platform-item-text">
                                <h5>Youtube</h5>
                                <span class="caption-5">Playlist, Live Videos</span>
                            </div>
                            <button 
                                class={`platform-list__platform-item-btn ${musicData?.musicPlatform === MusicPlatform.Youtube ? "platform-list__platform-item-btn--selected" : ""} text-only`}
                                on:click={() => initMusicData(MusicPlatform.Youtube)}
                            >
                                <span class="caption-3">{musicData?.musicPlatform === MusicPlatform.Youtube ? "Disconnect" : "Connect"}</span>
                            </button>
                        </li>
                        <li class="platform-list__platform-item">
                            <div class="platform-logo platform-logo--small platform-logo--apple">
                                <i class="fa-brands fa-itunes-note fa-itunes-note--small"></i>
                            </div>
                            <div class="platform-list__platform-item-text">
                                <h5>Apple Music</h5>
                                <span class="caption-5">Playlists</span>
                            </div>
                            <button 
                                class={`platform-list__platform-item-btn ${musicData?.musicPlatform === MusicPlatform.AppleMusic ? "platform-list__platform-item-btn--selected" : ""} text-only`}
                                on:click={() => initMusicData(MusicPlatform.AppleMusic)}
                            >
                                <span class="caption-3">{musicData?.musicPlatform === MusicPlatform.AppleMusic ? "Disconnect" : "Connect"}</span>
                            </button>
                        </li>
                        <li class="platform-list__platform-item">
                            <div class="platform-logo platform-logo--small platform-logo--spotify">
                                <i class="fa-brands fa-spotify fa-spotify--small"></i>
                            </div>
                            <div class="platform-list__platform-item-text">
                                <h5>Spotify</h5>
                                <span class="caption-5">Playlists, Podcasts</span>
                            </div>
                            <button 
                                class={`platform-list__platform-item-btn ${musicData?.musicPlatform === MusicPlatform.Spotify ? "platform-list__platform-item-btn--selected" : ""} text-only`}
                                on:click={() => initMusicData(MusicPlatform.Spotify)}
                            >
                                {musicData?.musicPlatform === MusicPlatform.Spotify ? "Disconnect" : "Connect"}
                            </button>
                        </li>
                    </ul>
                {/if}
            </div>
            <!-- Music Settings Content -->
            <div class="music__content">
                <div class="music__left-section">
                    <!-- Now Playing Section -->
                    <div class="now-playing grid-section">
                        <img class="img-bg" src={currentMusicCollection?.artworkImgSrc} alt="">
                        <div class={`blur-bg blur-bg--blurred-bg ${currentMusicCollection ?? "blur-bg--solid-color"}`}></div>
                        <div class="content-bg">
                            <h3 class="grid-section__title">Now Playing</h3>
                            {#if currentMusicCollection}
                                <div class="now-playing__details-container">
                                    <div class="now-playing__artwork">
                                        <img src={currentMusicCollection?.artworkImgSrc} alt="">
                                    </div>
                                    <div class="now-playing__description">
                                        <span class="caption-3">{currentMusicCollection?.author}</span>
                                        {#if currentMusicCollection?.url}
                                            <a href={currentMusicCollection?.url} target="_blank" rel="noreferrer">
                                                <h4>{currentMusicCollection?.name}</h4>
                                            </a>
                                        {:else}
                                            <h3>{currentMusicCollection?.name}</h3>
                                        {/if}
                                        <p>{currentMusicCollection?.description}</p>
                                    </div>
                                </div>             
                                <div class="now-playing__collection-details">
                                    <p class="now-playing__collection-type">{currentMusicCollection?.type}</p>
                                    <span>/</span>
                                    <p>{currentMusicCollection?.songCount} songs</p>
                                </div>
                            {:else}
                                <div class="now-playing__no-pl-selected">
                                    No Playlist / Album Selected
                                </div>
                            {/if}
                        </div>
                    </div>
                    <!-- My Playlists Section -->
                    <div class="my-playlists grid-section grid-section--no-padding">
                        <div class="my-playlists__header">
                            <h3 class="grid-section__title">My Playlists</h3>
                            <span class="caption-4">{`${playlists.length} ${playlists.length == 1 ? "playlist" : "playlists"}`}</span>
                        </div>
                        <ul class="my-playlists__collection-list vert-scroll">
                            {#if playlists?.length === 0}
                                <img class="my-playlists__no-pl-meme-img abs-center" src="/no-pl.png" alt="no-playlists-img"/>
                            {:else}
                                {#each playlists as personalPlaylist, idx}
                                <!-- My Playlist Item -->
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <li
                                    on:dblclick={() => handlePersonalPlaylistClicked(personalPlaylist.id, personalPlaylist.globalId)}
                                    class={`my-playlists__playlist 
                                                ${personalPlaylist.globalId === currentMusicCollection?.id ? "my-playlists__playlist--chosen" : ""}
                                           `}
                                >
                                    <p class="my-playlists__playlist-idx">{idx + 1}</p>
                                    <div class="my-playlists__playlist-img">
                                        {#if personalPlaylist.artworkSrc != ""}
                                            <img src={personalPlaylist.artworkSrc} alt="playlist-artwork"/>
                                        {:else}
                                            <i class="fa-solid fa-music abs-center"></i>
                                        {/if}
                                    </div> 
                                    <div class="my-playlists__playlist-text">
                                        <h5>{personalPlaylist.name}</h5>
                                        <p>{personalPlaylist.description}</p>
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
                    <div class="discover grid-section grid-section--no-padding">
                        <h3 class="grid-section__title">{`Discover from ${getPlatformName()}`}</h3>
                        <p class="grid-section__copy">Get in the zone with music that matches your vibe - select a category and discover new tunes to fuel your day.</p>
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
                                    <li class="discover__collection-card" on:click={() => handleDiscoverCollectionClicked(idx)}>
                                        <img class="discover__collection-card-img" src={group.artworkSrc}  alt="">
                                        <div class="discover__collection-card-hover-details">
                                            <img src={group.artworkBlurredSrc} alt="">
                                            <h2>{group.title}</h2>
                                            <p 
                                                class="discover__collection-card-hover-details-description">
                                                {group.description}
                                            </p>
                                            <span class="caption-3"> {group.artistCredit}</span>
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
                        <h3 class="discover__collection-title">{`${collectionTitle} Collections`}</h3>
                        <div class="discover__collection-container">
                            <div class="discover__collection-header flx">
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
                            <ul class="discover__selected-collection-list">
                                {#each chosenMusicCollection as collection, idx}
                                    <!-- Collection Item -->
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <li
                                        on:dblclick={event => handleRecommendedPlaylistClicked(collection, event)} 
                                        class={`discover__collection-item 
                                                    ${getCollectionId(collection) === currentMusicCollection?.id ? "discover__collection-item--chosen" : ""}
                                              `}
                                    >
                                        <p class="discover__collection-item-num">{idx + 1}</p>
                                        <div class="discover__collection-item-main-details-container">
                                            <img src={collection.artworkSrc} alt="collection-artwork">
                                            <div class="discover__collection-item-main-details">
                                                {#if collection?.url}
                                                    <a href={collection.url} target="_blank" rel="noreferrer">
                                                        <h6>{collection.title}</h6>
                                                    </a>
                                                {:else}
                                                    <h5>{collection.title}</h5>
                                                {/if}
                                                <p>{collection.author}</p>
                                            </div>
                                        </div>
                                        <p class="discover__collection-item-type">{collection.playlistId === null ? "Album" : "Playlist"}</p>
                                        <p class="discover__collection-item-genre">{collection.genre}</p>
                                        <p class="discover__collection-item-length">{collection.length > 100 ? "100+" : collection.length}</p>
                                        <div class="divider divider--thin"></div>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {/if}
            <!-- Logged Off UI -->
            {#if !isSignedIn}
                <p class="music__description">
                    Escape tab chaos and window hopping! Connect your favorite music streaming platform to listen to playlists and discover staff-curated tunes.
                </p>
                <h2>Sync an Account</h2>
                <ul class="platform-list platform-list--logged-out section-bg">
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
                            on:click={() => initMusicData(MusicPlatform.Soundcloud)}
                        >
                            Connect
                        </button>
                    </li>
                    <li class="platform-list__platform-item platform-list__platform-item--logged-out">
                        <div class="platform-list__platform-item__logo platform-logo platform-logo--youtube">
                            <i class="fa-brands fa-youtube"></i>
                        </div>
                        <div class="platform-list__platform-item-text platform-list__platform-item-text--logged-out">
                            <h3>Youtube</h3>
                            <p>Playlist, Live Videos</p>
                        </div>
                        <button 
                            class="platform-list__platform-item-btn platform-list__platform-item-btn--logged-out text-only"
                            on:click={() => initMusicData(MusicPlatform.Youtube)}
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
                            on:click={() => initMusicData(MusicPlatform.AppleMusic)}
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
                            on:click={() => initMusicData(MusicPlatform.Spotify)}
                        >
                            Connect
                        </button>
                    </li>
                </ul>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    $section-spacing: 8px;
    $top-row-height: 170px;
    $bottom-row-height: 470px;

    $my-playlists-section-padding-left: 25px;

    .music {
        width: 82vw;
        height: 750px;
        min-width: 390px;
        max-width: 1000px;
        
        &--small {
            width: 310px;
            height: 340px;
        }
        &__header {
            @include flex-container(center, _);
            i {
                font-size: 17px;
                color: rgb(var(--fgColor3));
                margin-top: -4px;
            }
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
            width: 40%;
            height: 100%;
        }
        &__right-section {
            margin-right: $section-spacing;
            width: 60%;
        }
    }

    /* Top Right Account Header */
    .active-account-header {
        @include flex-container(center, _);
        @include pos-abs-top-right-corner(25px, 42px);
        
        &__btn {
            @include flex-container(center, _);
            padding: 5px 8px;
            border-radius: 10px;
            margin-right: 7px;
            background-color: var(--bentoBoxBgColor);
            border: var(--bentoBoxBorder);
            box-shadow: var(--bentoBoxShadow);
            transition: 0.09s ease-in-out;
            
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
            margin: 0px 7px 0px 4px;
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
        background: var(--bentoBoxBgColor);
        box-shadow: var(--bentoBoxShadow);
        padding: 12px 5px 15px 13px;
        border-radius: 10px;

        &--logged-out {
            @include pos-abs-top-right-corner(0px, 0px);
            position: relative;
            width: 100%;
            padding: 20px 5px 20px 20px; 
            margin-top: 13px
        }
        &__platform-item {
            @include flex-container(center, _);
            margin-bottom: 13px;

            &:last-child {
                margin-bottom: 0px;
            }
            &--logged-out {
                margin-bottom: 16px;
            }
        }
        &__platform-item-btn {
            position: absolute;
            right: 10px;
            padding: 7px 0px 7px 10px;
            color: rgba(var(--textColor1), 0.6);
            transition: 0.1s ease-in-out;
            width: 60px;
            @include center;

            &--selected {
                color: rgba(238, 89, 66, 0.7);
            }
            &--logged-out {
                margin-right: 15px;
            }
        }

        &__platform-item-text {
            margin: -2px 0px 0px 7px;
            span {
                color: rgba(var(--textColor1), 0.6);
            }
            &--logged-out {
                margin-left: 19px;
                h3 {
                    margin: -3px 0px 1px 0px;
                }
            }
        }
    }
    
    /* Sections */
    .now-playing {
        margin: 0px $section-spacing $section-spacing 0px;
        height: 25%;
        width: 100%;
        position: relative;

        h2, h3 {
            color: white;
        }
        a {
            color: white;
            margin-bottom: 6px;
            @include elipses-overflow;
        }
        &__details-container {
            display: flex;
            margin-top: 10px;
            position: relative;
            width: 100%;
        }
        &__artwork {
            z-index: 1;
            margin-right: 15px;
            @include flex-container(center, _);
            img {
                border-radius: 5px;
                width: 75px;
            }
        }
        &__description {
            overflow: hidden;
            height: 74px;
            width: 90%;
            span {
                color: rgba(var(--textColor2), 0.6);
                text-transform: capitalize;
                font-weight: 600;
            }
            h3 {
                z-index: 2000;
                @include elipses-overflow;
            }
            p {
                color: rgba(var(--textColor2), 0.5);
                @include multi-line-elipses-overflow(3);
            }
        }
        &__collection-details {
            font-size: 0.94rem;
            font-weight: 600;
            @include pos-abs-bottom-right-corner(20px, 13px);
            display: flex;
            color: rgba(var(--textColor2), 0.7);

            span {
                font-weight: 100;
                margin: 0px 4px;
            }
        }
        &__no-pl-selected {
            font-weight: 600;
            @include elipses-overflow();
            color: rgb(var(--textColor2), 0.8);
            @include abs-center;
        }
        .content-bg {
            top: 0px;
            padding: 12px 17px;
        }
    }
    .my-playlists { 
        margin: 0px $section-spacing 0px 0px;
        width: 100%;
        height: 74%;
        margin-right: 6px;
        overflow: hidden;
        position: relative;

        &__header {
            @include flex-container(center, space-between);
            text-align: center;
            padding: 17px 17px 0px $my-playlists-section-padding-left;
            margin-bottom: 10px;
            
            h3 {
                margin-bottom: 0px;
            }
            span {
                color: rgb(var(--textColor1), 0.7);
            }
        }
        &__collection-list {
            height: 90%;
            margin-top: 2px;
        }
        /* Playlist Item */
        &__playlist {
            @include flex-container(center, _);
            padding: 15px 0px 15px 20px;
            position: relative;

            &:hover {
                background-color: var(--hoverColor);
            }

            &--chosen {
                background-color: var(--hoverColor);
            }

            p {
                color: rgba(var(--textColor1), 0.53);
            }
            .divider {
                @include pos-abs-bottom-left-corner(0px, 22);
                width: 85%;
            }
        }
        &__playlist-idx {
            min-width: 15px;
        }
        &__playlist-img {
            min-width: 40px;
            height: 40px;
            margin-right: 14px;
            background-color: var(--primaryBgColor);
            box-shadow: var(--shadowVal);
            position: relative;
            border-radius: 4px;
            overflow: hidden;

            img {
                width: 40px;
            }
            i {
                color: rgba(var(--fgColor3));
                font-size: 1.3rem;
            }
        }
        &__playlist-text {
            margin-top: -8px;
            overflow: hidden;
            width: 100%;
            h5 {
                margin-bottom: 5px;
            }
            p {
                @include elipses-overflow;
                width: 95%;
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

        .grid-section__title {
            padding: 17px 0px 0px $my-playlists-section-padding-left;
        }
        .grid-section__copy {
            padding-left: $my-playlists-section-padding-left;
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
            height: 140px;

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
            overflow-y: hidden;
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
            margin-right: 8px;
            position: relative;
            min-width: 180px;
            height: 125px;
            border-radius: 7px;
            transition: 0.2s ease-in-out;
            overflow: hidden;
            cursor: pointer;
            color: white;

            &:hover {
                min-width: 200px;
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
        }
        &__collection-card-img {
            visibility: visible;
            opacity: 1;
            transition: 0.2s ease-in-out;
            border-radius: 7px;
            width: 180px;
            height: 125px;
            object-fit: cover;
        }
        &__collection-card-title {
            transition: 0.3s ease-in-out;
            @include pos-abs-bottom-left-corner(9px, 10px);
        }
        &__collection-card-hover-details {
            border-radius: 6px;
            transition: 0.1s ease-in-out;
            display: block;
            z-index: 100;
            width: 100%;
            height: 100%;
            padding: 60px 0px 0px 12px;
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
            transition-delay: 0s; 
            @include pos-abs-top-left-corner(0px, 0px);
            
            h2 {
                margin-bottom: 5px
            }
            span {
                color: rgba(255, 255, 255, 0.64);
                @include pos-abs-top-right-corner(10px, 10px);
            }
            img {
                border-radius: 6px;
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
        }
        /* List Column Header Section */
        &__collection-header {
            width: 100%;
            opacity: 0.7;
            height: 18px;
            overflow: hidden;
            margin-top: 20px;
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
            padding: 14px 0px;
            position: relative;

            &:first-child {
                margin-top: 5px;
            }
            &:last-child {
                margin-bottom: 100px;
            }
            p {
                color: rgba(var(--textColor1), 0.6);
            }
            &--chosen {
                background-color: var(--hoverColor2) !important;
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
            opacity: 0.7;
            margin-left: $my-playlists-section-padding-left;
            width: 25px;
            color: rgba(var(--textColor1), 0.7);
        }
        &__collection-item-main-details-container {
            width: 35%;
            display: flex;
            overflow: hidden;
            img {
                width: 35px;
                height: 35px;
                aspect-ratio: 1/ 1;
                border-radius: 3px;
                margin-right: 10px;
            }
        }
        &__collection-item-main-details {
            max-width: 80%;
            overflow: hidden;
            a {
                color: rgb(var(--textColor1));
                @include elipses-overflow;
                margin-bottom: 2.5px;
            }
            h6 {
                width: 100%;
                @include elipses-overflow;
            }
            p {
                color: rgba(var(--textColor1), 0.6);
                font-weight: 400;
                @include elipses-overflow;
            }
        }
        &__collection-item-type {
            width: 21%;
            text-align: center;
        }
        &__collection-item-genre {
            width: 21%;
            text-align: center;
        }
        &__collection-item-length {
            width: 21%;
            text-align: center;
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