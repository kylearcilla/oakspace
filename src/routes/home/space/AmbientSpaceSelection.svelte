<script lang="ts">
	import { onMount } from "svelte"
	import { ytUserStore } from "$lib/store"

    import { APIErrorCode, Icon } from "$lib/enums"
	import { LogoIcon } from "$lib/enums"
	import { updateAmbience } from "$lib/utils-home"
	import { globalContext, ytPlayerStore } from "$lib/store"
	import { SPACES, POPULAR_SPACES } from "$lib/data-spaces"
	import { getMaskedGradientStyle } from "$lib/utils-general"
	import { capitalize, formatPlural } from "$lib/utils-general"
	import { handleChooseItem, logoutYoutubeUser } from "$lib/utils-youtube"

	import Logo from "$components/Logo.svelte"
	import Modal from "$components/Modal.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import { authYoutubeClient } from "$lib/api-youtube"
	import EmptyList from "$components/EmptyList.svelte"
	import DropdownList from "$components/DropdownList.svelte"
    
    const SCROLL_STEP = 350
    const CATEGORIES = [
        "Lofi",
        "Nature",
        "Worlds",
        "Weather",
        "City",
        "Architecture",
        "Sci-Fi"
    ]
    const PLAYLIST_SKELETON_LENGTH = 25
    const TEST_FETCH_PLAYLIST_DELAY = 500

    $: ambience = $globalContext.ambience
    $: space = ambience?.space
    $: wallpapers = chosenGroup.wallpapers
    $: playlists = chosenGroup.playlists
    $: videos = chosenGroup.videos
    $: chosenItem = space ?? null
    
    $: player = $ytPlayerStore
    $: userData = $ytUserStore
    $: hasSignedIn = userData?.signedIn ?? false
    $: tokenExpired = userData?.tokenExpired ?? false
    $: fetchedAllItems = userData?.fetchedAllItems ?? false
    $: loading = userData?.loading ?? false
    $: error = userData?.error ?? null

    let chosenGroup = POPULAR_SPACES
    let chosenGroupStr: AmbientSpaceGroupKey = "popular"
    let clickedItem: AmbientSpace | null = null
    let videoType: any = "videos"
    
    let userInfoOpen = false
    let userPlaylists: AmbientSpace[] = []
    let refreshLoad = false

    let scrollTop = 0
    let scrollHeight = 0
    let scrollWindow = 0
    let playlistTimeout: NodeJS.Timeout | null = null
    let width = 0
    let myPlaylistsWidth = 0
    let tabsCarouselRef: HTMLElement
    let wallpaperCarouselRef: HTMLElement
    let playlistsRef: HTMLElement
    let tabsCarousel = {
        left: true, right: true, gradient: ""
    }
    let wallpaperCarousel = {
        left: false, right: false, gradient: ""
    }

    $: if (videoType != undefined) {
        clickedItem = null
    }
    $: if (hasSignedIn && userData) {
        initUserPlaylists()
    }
    $: if (width && tabsCarouselRef) {
        handleCarouselScroll(tabsCarouselRef)
    }
    $: {
        if (playlists.length === 0 && chosenGroupStr != "user") {
            videoType = "videos"
        }
        else if (videos.length === 0) {
            videoType = "playlists"
        }
    }
    
    /* spaces */
    function onItemClicked(space: AmbientSpace) {
        clickedItem = space
    }
    function onItemDblClicked(space: AmbientSpace) {
        clickedItem = space
        onItemChoose()
    }
    async function onItemChoose() {
        const { type, sourceId } = clickedItem!
        const { space: { type: currType } } = ambience!
        const fromVidToWallpaper = (currType === "video" || currType === "playlist") && type === "wallpaper"
        const fromWallpaperToVideo = type === "video" && (currType === "wallpaper" || currType === "playlist")

        if (type === "wallpaper") {
            updateAmbience({ space: clickedItem! })
        }
        else if (await handleChooseItem(sourceId, type)) {
            updateAmbience({ space: clickedItem! })
            player!.toggleShow(true)
        }
        if (fromVidToWallpaper)  {
            player!.toggleShow(false)
        }
        else if (fromWallpaperToVideo) {
            player!.toggleShow(true)
        }

        clickedItem = null
    }
    function getGroup(group: AmbientSpaceGroupKey) {
        if (group === "popular") {
            return POPULAR_SPACES
        }
        else {
            return SPACES[group as AmbientSpaceGenres]
        }
    }

    /* ui */
    function onTabClicked(key: string) {
        const groupKey = key as AmbientSpaceGroupKey
        if (groupKey === "user") {
            chosenGroup  = {
                wallpapers: [],
                videos: [],
                playlists: userPlaylists
            }
            videoType = "playlists"
        }
        else {
            videoType = "videos"
            chosenGroup = getGroup(groupKey)!
        }

        chosenGroupStr = groupKey
        clickedItem = null

        requestAnimationFrame(() => handleCarouselScroll(wallpaperCarouselRef))
    }
    function handleCarouselScroll(carousel: HTMLElement) {
        const isTabs = carousel === tabsCarouselRef
        const elem    = isTabs ? tabsCarouselRef : wallpaperCarouselRef
        let carouselObj = isTabs ? tabsCarousel : wallpaperCarousel

        if (!elem) return

        const { styling, scrollStatus } = getMaskedGradientStyle(elem, {
           isVertical: false,
           ...(isTabs && hasSignedIn ? { head: { start: "5px", end: "50%" } } : {}),
           tail: {
            start: "80%"
           }
        }) as HozScrollMaskedGradient

        carouselObj.gradient = styling
        carouselObj.right = !scrollStatus.hasReachedEnd
        carouselObj.left = !scrollStatus.hasReachedStart

        if (isTabs) {
            tabsCarousel = carouselObj
        }
        else {
            wallpaperCarousel = carouselObj
        }
    }

    /* youtube */
    async function userBtnClicked() { 
        if (hasSignedIn) {
            userInfoOpen = !userInfoOpen
        }
        else {
            authYoutubeClient()
        }
    }
    function refreshBtnClicked() {
        const error = userData!.error
        if (error?.code === APIErrorCode.REFRESH_TOKEN) {
            authYoutubeClient()
        }
        else if (error?.code === APIErrorCode.EXPIRED_TOKEN) {
            userData!.refreshAccessToken()
        }
        else {
            refreshUserPlaylists()
        }
        userInfoOpen = false 
    }
    async function refreshUserPlaylists() {
        refreshLoad = true

        if (playlistsRef) {
            playlistsRef.scrollTop = 0
        }

        await userData!.refreshUserPlaylists()
        refreshLoad = false
    }
    function hasReachedEndOfList() {
        return Math.ceil(scrollTop) >= scrollHeight - scrollWindow - 100
    }
    async function userPlsInfiniteScrollHandler(event: Event) {
        if (chosenGroupStr != "user" || loading) {
            return
        }

        const list = event.target as HTMLElement
        scrollTop = list.scrollTop
        scrollHeight = list!.scrollHeight
        scrollWindow = list!.clientHeight 
        
        if (!hasReachedEndOfList() || loading) return
        getMorePlaylists()
    }
    function getMorePlaylists() {
        const noFetch = !!(loading || fetchedAllItems || tokenExpired || !!playlistTimeout || error)
        if (noFetch || !userData) {
            return
        }
        playlistTimeout = setTimeout(() => {
            userData.getMorePlaylists()
            playlistTimeout = null

        }, TEST_FETCH_PLAYLIST_DELAY)
    }
    function initUserPlaylists() {
        userPlaylists = userData!.playlists.map(pl => ({
            title: pl.title,
            description: pl.description,
            subtitle: pl.vidCount + "",
            thumbnail: pl.thumbnailURL,
            sourceId: pl.id,
            type: "playlist",
            group: "user"
        }))

        if (chosenGroupStr === "user") {
            chosenGroup.playlists = userPlaylists
            chosenGroup = chosenGroup
        }
    }

    onMount(() => {
        handleCarouselScroll(wallpaperCarouselRef)
        handleCarouselScroll(tabsCarouselRef)
    })
</script>

<Modal 
    options={{ 
        borderRadius: "15px", height: "85vh", overflow: "hidden"
    }} 
    onClickOutSide={() => updateAmbience({ spacesOpen: false })}
>
    {@const { gradient, left, right } = tabsCarousel}
    <div class="spaces" class:spaces--signed-in={hasSignedIn}>
        <div class="spaces__header">
            <h1>Spaces</h1>
             <button 
                class="spaces__account-btn"
                data-dmenu-id="spaces"
                on:click={userBtnClicked}
             >
                    {#if hasSignedIn && userData}
                        <img src={userData.profileImgSrc} alt="" />
                        <span>{userData.username}</span>
                    {:else}
                        <Logo 
                            logo={LogoIcon.Youtube} 
                            options={{ 
                                hasBgColor: false, 
                                containerWidth: "19px", 
                                iconWidth: "100%" 
                            }} 
                        />
                        <span>Connect</span>
                    {/if}
             </button>
             <DropdownList 
                id="spaces"
                isHidden={!userInfoOpen}
                options={{
                    listItems: [
                        {  name: "Refresh", divider: true },
                        {  name: "Log out" }
                    ],
                    onListItemClicked: ({ name }) => {
                        if (name === "Refresh") {
                            refreshBtnClicked()
                        }
                        else if (name === "Log out" && userData) {
                            logoutYoutubeUser()
                            onTabClicked("popular")
                        }
                        userInfoOpen = false
                    },
                    onClickOutside: () => { 
                        userInfoOpen = false
                    },
                    position: {
                        top: "27px",
                        right: "0px"
                    },
                    styling: {
                        minWidth: "100px",
                        zIndex: 4
                    }
                }}
            />
        </div>

        <!-- main content -->
        <div class="spaces__content">
            {#if space && ambience}
                {@const { thumbnail, title, subtitle, description } = space}
                {@const group = ambience.space.group}
                {@const sub = group === "user" ? formatPlural("video", Number(subtitle ?? 0)) : subtitle}

                <div class="spaces__left">
                    <div class="spaces__now-playing bento-box">
                        <img 
                            class="img-bg" 
                            src={thumbnail} 
                            alt="chosen-chosenItem"
                        />
                        <div class="img-bg-gradient gradient-container gradient-container--bottom"></div>
                        <div class="blur-bg">
                        </div>
                        <div class="content-bg">
                            <div class="spaces__chosen-item">
                                <div class="spaces__chosen-item-img">
                                    <img src={thumbnail} alt="spaces__chosen-item"/>
                                </div>
                                <div class="spaces__chosen-item-details">
                                    <span>
                                        {capitalize(group)}
                                    </span>
                                    <h4 class="spaces__chosen-item-title">
                                        {space.title}
                                    </h4>
                                    <div class="spaces__chosen-item-subtitle">
                                        {sub}
                                    </div>
                                    <p 
                                        title={description}
                                        class="spaces__chosen-item-description" 
                                        class:hidden={!description}
                                    >
                                        {description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
            <div class="spaces__right bento-box">
                <!-- tabs -->
                <div class="spaces__tabs" bind:clientWidth={width}>
                    {#if hasSignedIn}
                        <button 
                            class="tab-btn"
                            class:tab-btn--selected={chosenGroupStr === "user"}
                            bind:clientWidth={myPlaylistsWidth}
                            on:click={() => onTabClicked("user")}
                        >
                            My Playlists
                        </button>
                        <div class="divider"></div>
                    {/if}
                    {#if left}
                        <button 
                            class="spaces__arrow"
                            style:left={`${hasSignedIn ? myPlaylistsWidth + 15 : 0}px`}
                            on:click={() => {
                                tabsCarouselRef.scrollLeft -= SCROLL_STEP
                            }}
                        >
                            <SvgIcon 
                                icon={Icon.ChevronLeft} options={{ scale: 1.5 }}
                            />
                        </button>
                    {/if}
                    <div 
                        bind:this={tabsCarouselRef}
                        on:scroll={() => handleCarouselScroll(tabsCarouselRef)}
                        class="spaces__tabs-carousel scroll-bar-hidden"
                        style={gradient}
                    >
                        <button 
                            on:click={() => onTabClicked("popular")}
                            class="tab-btn"
                            class:tab-btn--selected={chosenGroupStr === "popular"}
                        >
                            <i class="fa-solid fa-fire"></i>
                            Popular
                        </button>
                        {#each CATEGORIES as category}
                            {@const key = category.toLowerCase()}
                            <button 
                                on:click={() => onTabClicked(key)}
                                class="tab-btn"
                                class:tab-btn--selected={key === chosenGroupStr}
                            >
                                {category}
                            </button>
                        {/each}                
                    </div>
                    {#if right}
                        <button 
                            class="spaces__arrow spaces__arrow--right"
                            on:click={() => {
                                tabsCarouselRef.scrollLeft += SCROLL_STEP
                            }}
                        >
                            <SvgIcon 
                                icon={Icon.ChevronRight} options={{ scale: 1.5 }}
                            />
                        </button>
                    {/if}
                </div>
                <!-- wallpapers -->
                {#if wallpapers.length > 0}
                    {@const { gradient, left, right } = wallpaperCarousel}
                    <div class="spaces__type-btn" style:opacity={1}>
                        Wallpapers
                    </div>
                    <div class="spaces__content-carousel-container">
                        {#if left}
                            <button 
                                class="spaces__arrow"
                                on:click={() => {
                                    wallpaperCarouselRef.scrollLeft -= SCROLL_STEP
                                }}
                            >
                                <SvgIcon 
                                    icon={Icon.ChevronLeft} options={{ scale: 1.5 }}
                                />
                            </button>
                        {/if}
                        <div 
                            bind:this={wallpaperCarouselRef}
                            on:scroll={() => handleCarouselScroll(wallpaperCarouselRef)}
                            class="spaces__content-carousel scroll-bar-hidden"
                            style={gradient}
                        >
                            {#each wallpapers as item, idx (idx)}
                                {@const { sourceId, title, subtitle, thumbnail } = item}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <div 
                                    on:click={() => onItemClicked(item)}
                                    on:dblclick={() => onItemDblClicked(item)}
                                    role='button'
                                    tabindex="0"
                                    title={`${title} - ${subtitle}`}
                                    class="spaces__content-item smooth-bounce"
                                    class:spaces__content-item--selected={(!clickedItem && chosenItem?.sourceId === sourceId) || clickedItem?.sourceId === sourceId}
                                >
                                    <div class="spaces__content-item-img">
                                        <img src={thumbnail} alt="space">
                                    </div>
                                    <div class="spaces__content-item-details">
                                        <div class="spaces__content-item-title">
                                            {title}
                                        </div>
                                        <div class="spaces__content-item-subtitle">
                                            {subtitle}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                        {#if right}
                            <button 
                                class="spaces__arrow spaces__arrow--right"
                                on:click={() => {
                                    wallpaperCarouselRef.scrollLeft += SCROLL_STEP
                                }}
                            >
                                <SvgIcon 
                                    icon={Icon.ChevronRight} options={{ scale: 1.5 }}
                                />
                            </button>
                        {/if}
                    </div>
                {/if}
        
                <div class="flx" style:margin-bottom={"12px"}>
                    <button 
                        on:click={() => videoType = "videos"}
                        class="spaces__type-btn"
                        class:spaces__type-btn--selected={videoType === "videos"}
                        class:hidden={videos.length === 0}
                    >
                        Videos
                    </button>
                    <button 
                        on:click={() => videoType = "playlists"}
                        class="spaces__type-btn"
                        class:spaces__type-btn--selected={videoType === "playlists"}
                        class:hidden={chosenGroup.playlists.length === 0}
                    >
                        Playlists
                    </button>
                </div>
        
                <!-- videos -->
                {#if videos.length > 0 && videoType === "videos"}
                    <div 
                        class="spaces__content-grid"
                        class:spaces__content-grid--no-wallpapers={wallpapers.length === 0}
                    >
                        {#each videos as item, idx (idx)}
                            {@const { sourceId, title, subtitle, thumbnail } = item}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <div 
                                on:click={() => onItemClicked(item)}
                                on:dblclick={() => onItemDblClicked(item)}
                                role='button'
                                tabindex="0"
                                title={`${title} - ${subtitle}`}
                                class="spaces__content-item spaces__content-item--vid smooth-bounce"
                                class:spaces__content-item--selected={(!clickedItem && chosenItem?.sourceId === sourceId) || clickedItem?.sourceId === sourceId}
                            >
                                <div class="spaces__content-item-img">
                                    <img src={thumbnail} alt="space">
                                </div>
                                <div class="spaces__content-item-details">
                                    <div class="spaces__content-item-title">
                                        {title}
                                    </div>
                                    <div class="spaces__content-item-subtitle">
                                        {subtitle}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
        
                <!-- playlists -->
                {#if videoType === "playlists"}
                    {@const user = chosenGroupStr === "user"}
                    {@const playlists = chosenGroup.playlists}
                    <div 
                        bind:this={playlistsRef}
                        class="spaces__content-grid" 
                        class:spaces__content-grid--no-wallpapers={wallpapers.length === 0}
                        style:row-gap="0px"
                        style:margin="-10px 0px 0px -25px"
                        on:scroll={(e) => userPlsInfiniteScrollHandler(e)}
                    >
                        {#if !refreshLoad}
                            {#each playlists as item, idx (idx)}
                                {@const { sourceId, title, subtitle, thumbnail, description } = item}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <div 
                                    role='button'
                                    tabindex="0"
                                    title={`${title} - ${subtitle}`}
                                    class="spaces__content-item smooth-bounce spaces__content-item--playlist"
                                    class:spaces__content-item--user-pl={chosenGroupStr === "user"}
                                    class:spaces__content-item--selected={(!clickedItem && chosenItem?.sourceId === sourceId) || clickedItem?.sourceId === sourceId}
                                    on:click={() => onItemClicked(item)}
                                    on:dblclick={() => onItemDblClicked(item)}
                                >
                                    <div class="spaces__content-item-img" style:border-radius="4px">
                                        <img src={thumbnail} alt="space">
                                    </div>
                                    <div 
                                        class="spaces__content-item-details c-flx-sb" 
                                        style:margin={"0px 0px 0px 20px"}
                                        style:height={"100%"}
                                    >
                                        <div>
                                            <div class="spaces__content-item-title" style:margin-bottom="4px">
                                                {title}
                                            </div>
                                            <div 
                                                class="spaces__content-item-description"
                                                title={description}
                                                style:opacity={description ? 0.8 : 0.5}
                                            >
                                                {description ?? "No Description"}
                                            </div>
                                        </div>
                                        <div class="spaces__content-item-subtitle">
                                            {user ? formatPlural("video", Number(subtitle ?? 0)) : subtitle ?? ""}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {/if}

                        {#if user && loading}
                            {#each Array(PLAYLIST_SKELETON_LENGTH) as _}
                                <div 
                                    class="spaces__content-item spaces__content-item--playlist spaces__content-item--skeleton"
                                    class:spaces__content-item--user-pl={chosenGroupStr === "user"}
                                >
                                    <div class="spaces__content-item-img" style:border-radius="4px"></div>
                                    <div 
                                        class="spaces__content-item-details c-flx-sb" 
                                        style:margin="0px 0px 0px 20px"
                                        style:height="100%"
                                    >
                                        <div>
                                            <div class="spaces__content-item-title" style:margin-bottom="4px">
                                            </div>
                                            <div class="spaces__content-item-description">
                                            </div>
                                        </div>
                                        <div class="spaces__content-item-subtitle">
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>

                    {#if user && playlists.length === 0 && !loading}
                        <div class="spaces__empty-list">
                            <EmptyList emptyText="This account has 0 playlists."/>
                        </div>
                    {/if}
                {/if}

            </div>
        </div>

        {#if clickedItem && clickedItem.sourceId != chosenItem?.sourceId}
            <button class="spaces__choose-btn" on:click={onItemChoose}>
                Choose
            </button>
        {/if}
    </div>
</Modal>

<style lang="scss">
    @import "../../../scss/blurred-bg.scss";
    @import "../../../scss/skeleton.scss";

    .spaces {
        height: 85vh;
        padding: 18px 25px 14px 25px;
        position: relative;
        width: min(82vw, 990px);

        &--signed-in &__account-btn {
            padding-left: 7px;
        }

        h1 {
            @include text-style(1, 500, 1.7rem);
            margin-top: -10px
        }
        &__header {
            @include flex(center, space-between);
            margin-bottom: 8px;
            position: relative;
        }
        /* sections */
        &__content {
            display: flex;
            height: calc(100% - 25px - 18px);
        }
        &__left {
            width: 240px;
            margin-right: 8px;
            height: 100%;
        }
        &__right {
            width: calc(100% - 240px - 8px);
            padding-right: 0px;
            height: 100%;
            position: relative;
        }
        /* user profile */
        &__account-btn {
            display: flex;
            border-radius: 15px;
            margin-top: -5px;
            transition: 0.12s ease-in-out;
            padding: 0px 13px 0px 11px;
            height: 30px;
            background-color: rgba(var(--textColor1), 0.05);
            @include text-style(1, 400, 1.3rem);
            align-items: center;

            img {
                @include circle(19px);
            }
            span {
                margin: 0px 0px 1px 8px;
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.08);
            }
        }
        &__empty-list {
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translateX(-50%) translateY(-40%);
        }

        /* groups */
        &__arrow {
            @include abs-top-left(35px, -20px);
            @include circle(25px);
            @include center;
            z-index: 2;
            opacity: 0.25;
            
            &:hover {
                opacity: 0.85;
            }
            &:active {
                transform: scale(0.95);
            }
            &--right {
                left: unset;
                @include abs-top-right(35px, 0px);
            }
        }
        &__tabs {
            @include flex(center);
            position: relative;
            margin: 0px 0px 16px -4px;
            position: relative;

            .divider {
                margin: 7px 9px;
                @include divider(0.1, 15px, 1px);
            }
            button {
                font-size: 1.35rem;
            }
            i {
                font-size: 1.1rem;
                opacity: 0.5;
                margin-right: 7px
            }
        }
        &__tabs &__arrow {
            @include abs-top-left(0px, 100px);

            &--right {
                @include abs-top-right;
                left: unset;
            }
        }
        &__tabs-carousel {
            @include flex(center);
            overflow: scroll;
            scroll-behavior: smooth;
            position: relative;
            padding-right: 15px;
        }

        /* now playing */
        &__now-playing {
            width: 100%;
            position: relative;
            color: rgb(white, 1);
            height: 100%;
            padding: 9.5px 10px 10px 10px;
            border-radius: 16.5px;
            overflow: hidden;
            
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
                height: 100%;
                width: 100%;
                z-index: 2;
                background: rgba(17, 17, 17, 0.5);
            }
            .content-bg {
                position: relative;
                z-index: 3;
            }
        }
        &__chosen-item {
            &-img {
                margin: 0px 15px 0px 0px;
                object-fit: cover;
                width: 100%;
                aspect-ratio: calc(16 / 9);
                @include center;

                img {
                    height: 100%;
                    width: 100%;
                    object-fit: cover;
                    border-radius: 12px;
                }   
            }
            &-details {
                margin-top: 10px;
                padding-left: 4px;
                position: relative;
            }
            span {
                color: rgba(white, 0.4);
                @include text-style(_, 400, 1.4rem);
                display: block;
            }
            &-title {
                margin: 10px 30px 2px 0px;
                max-width: 90%;
                font-size: 1.45rem;
                font-weight: 400;
                @include truncate-lines(3);
            }
            &-subtitle {
                margin-top: 8px;
                font-size: 1.35rem;
                font-weight: 300;
                color: rgb(white, 0.3);
                @include truncate-lines(2);
            }
            &-description {
                margin-top: 14px;
                width: 95%;
                overflow: hidden;
                position: relative;
                font-size: 1.4rem;
                font-weight: 300;
                color: rgb(white, 0.54);
            }
        }
        &__content-header {
            margin: 16px 0px 17px 0px;
            padding-right: 25px;
            @include flex(center, space-between);

            h4 {
                @include text-style(0.4, 400, 1.32rem);
            }
        }
        &__type-btn {
            @include text-style(1, 400, 1.4rem);
            margin: 0px 12px 0px 0px;
            opacity: 0.2;

            &:hover {
                opacity: 0.65;
            }
            &--selected {
                opacity: 1;
            }
        }
        &__content-carousel-container {
            position: relative;
        }
        &__content-carousel {
            padding-top: 13px;
            @include flex(center);
            overflow-x: scroll;
            position: relative;
            scroll-behavior: smooth;
            margin: 0px 0px 24px -2px;
            padding-left: 2px;
        }
        &__content-grid {
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            row-gap: 18px;
            overflow-y: scroll;
            max-height: calc(100% - 215px);
            padding: 3px 0px 20px 2px;
            
            &--no-wallpapers {
                max-height: calc(100% - 45px);
            }
        }
        &__content-item {
            min-width: 110px;
            width: 110px;
            cursor: pointer;
            margin-right: 14px;

            &:active {
                transform: scale(0.998);
            }
            &--selected &-img {
                box-shadow: rgba(white, 1) 0px 0px 0px 2px;   
            }
            &--selected#{&}--playlist {
                background-color: rgba(var(--textColor1), 0.02);
            }
            &--vid {
                width: 150px;
                margin-right: 16px;
            }
            &--playlist {
                width: 100%;
                margin: 0px 0px 0px 0px;
                display: flex;
                height: 110px;
                padding: 12px 10px 12px 22px;
            }
            &--playlist:hover {
                background-color: rgba(var(--textColor1), 0.02);
            }
            &--playlist &-title {
                @include text-style(1, 400, 1.4rem);
            }
            &--playlist &-subtitle {
                font-size: 1.3em;
                opacity: 0.6;
            }
            &--playlist &-img {
                width: 150px;
                min-width: 150px;
            }
            &--playlist &-details {
                width: calc(100% - 150px - 20px);
            }
            &--user-pl {
                height: 90px;
            }
            &--user-pl &-img {
                width: 110px;
                min-width: 110px;
            }
        }
        /* skeleton ui */
        &__content-item--skeleton {
            background-color: transparent !important;
            pointer-events: none;

            .spaces__content-item-img,
            .spaces__content-item-title,
            .spaces__content-item-subtitle,
            .spaces__content-item-description {
                @include skeleton-bg(dark);
                min-height: 15px;
            }
            .spaces__content-item-title {
                width: 70%;
            }
            .spaces__content-item-subtitle {
                width: 90px;
            }
            .spaces__content-item-description {
                width: 40%;
            }
        }
        &__content-item-img {
            aspect-ratio: calc(16 / 9);
            border-radius: 6px;
            overflow: hidden;
        }
        &__content-item img {
            height: 100%;
            width: 100%;
            object-fit: cover;
        }
        &__content-item-details {
            margin-top: 8px;
        }
        &__content-item-title {
            @include elipses-overflow;
            @include text-style(0.85, 400, 1.2rem);
            margin-bottom: 2px;
        }
        &__content-item-subtitle {
            @include elipses-overflow;
            @include text-style(0.4, 400, 1.2rem);
        }
        &__content-item-description {
            @include truncate-lines(2);
            @include text-style(0.5, 400, 1.3rem);
        }
        &__choose-btn {
            @include abs-bottom-right(18px, 18px);
            @include text-style(1, 400, 1.3rem);
            background: var(--lightColor2);
            padding: 6px 20px 7px 20px;
            border-radius: 15px;
        }
    }

    @media (max-width: 600px) {
        .spaces {
            display: block;

            &__content {
                display: block;
            }
            &__chosen-item {
                @include flex-col;
                height: 100%;
                padding: 10px 4px 10px 4px;
            }
            &__chosen-item-img {
                height: 100px;
            }
            &__chosen-item-img img {
                width: 170px;
                border-radius: 6px;
            }
            &__chosen-item-description {
                @include truncate-lines(2);
            }
            &__left {
                width: 100%;
                margin: 0px 0px 10px 0px;
                height: 260px;
            }
            &__right {
                width: 100%;
                padding-right: 0px;
                height: calc(100% - 260px - 10px);
            }
        }
    }
</style>