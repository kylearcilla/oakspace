<script lang="ts">
	import { appleMusicPlayerState, curentPlaylist, musicDataState, musicPlayerData, userMusicPlaylists } from "$lib/store";
	import { onMount } from "svelte";
    import { clickOutside } from "../../lib/helper";
	import { _authAppleUser, _initMusicKit } from "./+page";
	import { MusicData } from "$lib/MusicData";
	import { AppleMusicPlayer } from "$lib/AppleMusicPlayer";
	import type { MusicPlayer } from "$lib/MusicPlayer";
    export let onNavButtonClicked: any;

    let musicPlayer: MusicPlayer
    let musicData: MusicData

    let isModalOpen = true;
    let pickedPlaylistId = -1;
    let clickedPlaylistId = -1;
    let isSignedIn = true;
    let isPlatformListOpen = false

    let isSoundCloudLinked = true
    let isAppleMusicLinked = true
    let isYoutubeLinked = true
    let isCollectionOpen = false

    let playlists: any = []
    let currentPlaylist: any = {}


    userMusicPlaylists.subscribe((data: any) => {
        playlists = (!data || data.length == 0) ? [] : data
    })
    curentPlaylist.subscribe((data: any) => {
        currentPlaylist = data
    })
    musicDataState.subscribe((data: any) => {
        musicData = data
    })
    appleMusicPlayerState.subscribe((data: any) => {
        musicPlayer = data
    })

    // attempt to init player
    const handlePlatformClicked = async (platformName: string) => {
        if (platformName === "apple") {
            musicData = new MusicData()
            await musicData.authUser()
            musicData.loadMusicData()
            musicData.setUserPlaylists()

            musicPlayer = new AppleMusicPlayer(musicData)

            appleMusicPlayerState.set(musicPlayer)
            musicDataState.set(musicData)
        }
    }

    // init new playlist
    const handlePlaylistClicked = async (id: string, globalId: string) => {
        musicData.setNewPlaylist(globalId)
        musicPlayerData.update((data: any) => { return { ...data, message: "Setting Up!", isDisabled: true, isShuffled: false } })

        musicPlayer.resetMusicPlayerData()
        musicPlayer.queueAndPlayNextTrack(id, 0)
    }

    const handleLogUserOut = (platformName: string) => { }
    const closeModal = () => onNavButtonClicked("")

    onMount(() => {
    })
</script>

<div class={`modal-bg ${isModalOpen ? "" : "modal-bg--hidden"}`}>
    <div use:clickOutside on:click_outside={closeModal} class="modal-bg__content modal-bg__content--overflow-y-scroll">
        <!-- <button on:click={closeModal} class="close-btn">
            <i class="fa-solid fa-xmark"></i>
        </button> -->
        <div class={`music ${isSignedIn ? "" : "music--min"}`}>
            <div class="music__header">
                <h1>Music</h1>
                <i class="fa-solid fa-music"></i>
            </div>
            {#if isSignedIn}
                <div class="dropdown-element profile-tab">
                    <button class="dropdown-element profile-tab__btn" on:click={() => isPlatformListOpen = !isPlatformListOpen}>
                        <div class="dropdown-element platform-logo platform-logo--soundcloud">
                            <i class="fa-brands fa-soundcloud"></i>
                        </div>
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div class="divider divider--vertical"></div>
                    <p>Kyle Arcilla</p>
                    <div class="profile-tab__img">
                        <img src="" alt="">
                    </div>
                    {#if isPlatformListOpen}
                        <div use:clickOutside on:click_outside={() => isPlatformListOpen = false} class="platform-list platform-list--dropdown dropwdown-element">
                            <li class="platform-item platform-item--small">
                                <div class="platform-item__logo platform-logo platform-logo--small platform-logo--soundcloud">
                                    <i class="fa-brands fa-soundcloud fa-soundcloud--small"></i>
                                </div>
                                <div class="platform-item__text">
                                    <h3>Soundcloud</h3>
                                    <p>Playlist</p>
                                </div>
                                <button class="btn-text-only" on:click={() => handlePlatformClicked("soundcloud")}>Connect</button>
                            </li>
                            <li class="platform-item platform-item--small">
                                <div class="platform-item__logo platform-logo platform-logo--small platform-logo--youtube">
                                    <i class="fa-brands fa-youtube fa-youtube--small"></i>
                                </div>
                                <div class="platform-item__text">
                                    <h3>Youtube</h3>
                                    <p>Playlist, Live Videos</p>
                                </div>
                                <button class="btn-text-only" on:click={() => handlePlatformClicked("youtube")}>Connect</button>
                            </li>
                            <li class="platform-item platform-item--small">
                                <div class="platform-item__logo platform-logo platform-logo--small platform-logo--apple">
                                    <i class="fa-brands fa-itunes-note fa-itunes-note--small"></i>
                                </div>
                                <div class="platform-item__text">
                                    <h3>Apple Music</h3>
                                    <p>Playlists, Live Radio</p>
                                </div>
                                <button class="btn-text-only" on:click={() => handlePlatformClicked("apple")}>Connect</button>
                            </li>
                            <li class="platform-item platform-item--small">
                                <div class="platform-item__logo platform-logo platform-logo--small platform-logo--spotify">
                                    <i class="fa-brands fa-spotify fa-spotify--small"></i>
                                </div>
                                <div class="platform-item__text">
                                    <h3>Spotify</h3>
                                    <p>Playlists, Podcasts</p>
                                </div>
                                <button class="btn-text-only" on:click={() => handlePlatformClicked("spotify")}>Connect</button>
                            </li>
                        </div>
                    {/if}
                </div>
                <div class="music__row music__row--top">
                    <div class="now-playing grid-section">
                        <img class="img-bg" src={currentPlaylist?.artworkImgSrc} alt="">
                        <div class="blur-bg"></div>
                        <div class="content-bg">
                            <div class="grid-section__header">
                                <h2>Now Playing</h2>
                            </div>
                            <div class="flx">
                                <div class="now-playing__img">
                                    <img src={currentPlaylist?.artworkImgSrc} alt="">
                                </div>
                                <div class="now-playing__description">
                                    <span>{currentPlaylist?.type}</span>                                
                                    <h3>{currentPlaylist?.name}</h3>
                                    <p>{currentPlaylist?.description}</p>
                                </div>
                            </div>                        
                            <div class="now-playing__collection-details">
                                <p>{currentPlaylist?.songCount} songs</p>
                                <span>•</span>
                                <p>{currentPlaylist?.time}</p>
                            </div>
                        </div>
                    </div>
                    <div class="discover grid-section">
                        <div class="grid-section__header">
                            <h2>Discover</h2>
                        </div>     
                        <div class="flx">
                            <div class="discover__description">
                                <p>Get in the zone with music that matches your vibe - select a category and discover new tunes to fuel your day.</p>
                                <a class="btn-text-only">Discover more on Apple Music</a>
                            </div>
                            <div class="discover__collection-container">
                                <div class="gradient-container"></div>
                                <button class="icon-btn">
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                                <div class="discover__collection">
                                        <div class="discover__collection-padding"></div>
                                        {#each [0, 1, 2, 4] as i}
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <div class="blur-card" on:click={() => isCollectionOpen = !isCollectionOpen}>
                                                <img src="https://i.pinimg.com/564x/75/f3/3c/75f33c50db8c58dd6874751a6cd29837.jpg" alt="">
                                                <div class="blur-card__blur-bg">
                                                    <h3>Zen</h3>
                                                    <div class="blur-card__description">
                                                        <div class="flx">
                                                            <p>Acoustic</p><div class="divider divider--vertical"></div><p>Lofi</p><div class="divider divider--vertical"></div><p>Folk</p>
                                                        </div>
                                                        <div class="flx">
                                                            <p>Piano</p><div class="divider divider--vertical"></div><p>Classical</p>
                                                        </div>
                                                        <div class="flx">
                                                            <p>Soul</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="blur-card__bottom-header">
                                                    <h3>Zen</h3>
                                                </div>
                                            </div>
                                        {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="music__row music__row--bottom">
                    <div class="my-playlists grid-section grid-section--no-padding">
                        <div class="grid-section__header grid-section__header--padded">
                            <h2>My Playlists</h2>
                            <p>{`${playlists?.length} ${playlists?.length == 1 ? "playlist" : "playlists"}`}</p>
                        </div>     
                        <ul class="my-playlists__playlists vert-scroll">
                            {#if playlists?.length == 0}
                                <img class="my-playlists__no-pl-meme abs-center" src="/no-pl.png"/>
                            {:else}
                                {#each playlists as p, idx}
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <li class="my-playlists__playlist" on:click={() => handlePlaylistClicked(p.id, p.globalId)}>
                                        <p>{idx + 1}</p>
                                        <div class="my-playlists__playlist-img">
                                            {#if p.artworkSrc != ""}
                                                <img src={p.artworkSrc} />
                                            {:else}
                                                <i class="fa-solid fa-music abs-center"></i>
                                            {/if}
                                        </div> 
                                        <div class="my-playlists__playlist-text">
                                            <h4>{p.name}</h4>
                                            <p>{p.description}</p>
                                        </div>
                                    </li>
                                {/each}
                            {/if}
                            <div class="my-playlists__padding"></div>
                        </ul>
                    </div>
                    <div class="recs grid-section">
                        <div class="grid-section__header">
                            <h2>Recommendations</h2>
                        </div>     
                        <p class="recs__copy">Unlock your productivity potential with our staff-recommended playlist picks – trust us, your to-do list will thank you!</p>
                        <div class="recs__top">
                            <h3>Playlist</h3>
                            <div class="recs__collection-container">
                                <div class="gradient-container"></div>
                                <button class="icon-btn">
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                                <ul class="recs__collection hoz-scroll">
                                    {#each [0, 1, 2, 4, 5, 6, 7, 8] as i}
                                        <li class="media-card">
                                            <img class="media-img" src="/nf.png" alt=" ">
                                            <h5>Chill Station</h5>
                                            <p>Apple Music Chill</p>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        </div>
                        <div class="recs__bottom">
                            <h3>Videos</h3>
                            <div class="recs__collection-container">
                                <div class="gradient-container"></div>
                                <button class="icon-btn">
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                                <ul class="recs__collection hoz-scroll">
                                    {#each [0, 1, 2, 4, 5, 6, 7, 8] as i}
                                    <li class="media-card media-card--wide">
                                        <img class="media-img" src="/nf.png" alt="">
                                        <h5>Chill Station</h5>
                                        <p>Apple Music Chill</p>
                                    </li>
                                    {/each}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                {#if isCollectionOpen}
                    <div class="modal-bg">
                        <div use:clickOutside on:click_outside={() => isCollectionOpen = !isCollectionOpen} class="modal-bg__content">
                            <div class="collection">
                                <img class="img-bg" src="https://i.pinimg.com/564x/01/12/53/01125394b5d4a92206d33f0430d5f85b.jpg" alt="">
                                <div class="blur-bg"></div>
                                <div class="content-bg">
                                    <div class="collection__header flx">
                                        <img src="https://i.pinimg.com/564x/01/12/53/01125394b5d4a92206d33f0430d5f85b.jpg" alt="">
                                        <div class="collection__description">
                                            <span>Apple Music</span>
                                            <h1>Serene</h1>
                                            <p class="collection__text">Whether you're studying, meditating, or just need a moment of calm, this playlist will transport you to a place of ultimate relaxation and focus with acoustic sounds, soft vocals, and instrumental pieces.</p>
                                            <ul class="collection__genres-list">
                                                <li>Acoustic</li>
                                                <li>Lofi</li>
                                                <li>Classical</li>
                                                <li>Piano</li>
                                                <li>Soul</li>
                                                <li>Folk</li>
                                                <li>Ambient</li>
                                            </ul>
                                            <p class="collection__art-artist">
                                                Art by John Smith
                                            </p>
                                        </div>
                                    </div>
                                    <div class="collection__playlists-container">
                                        <div class="playlist-header">
                                            <h2 class="playlist-header__num">#</h2>
                                            <h2 class="playlist-header__title">Title</h2>
                                            <h2 class="playlist-header__type">Type</h2>
                                            <h2 class="playlist-header__genre">Genre</h2>
                                            <h2 class="playlist-header__length">Length</h2>
                                            <h2 class="playlist-header__time">Time</h2>
                                        </div>
                                        <div class="divider"></div>
                                        <ul class="collection__playlists">
                                            <div class="collection__top-padding"></div>
                                            {#each [0, 1, 2, 4, 5, 6, 7, 8] as i}
                                                <li class="playlist-track">
                                                    <p class="playlist-track__num">{i + 1}</p>
                                                    <div class="playlist-track-details-container">
                                                        <div class="playlist-track-details-container__img">
                                                            <img alt="" src="https://f4.bcbits.com/img/a3390257927_16.jpg"/>
                                                        </div>
                                                        <div class="playlist-track-details-container__details">
                                                            <h4>Wus Ya Name sdf sdf </h4>
                                                            <p>Tyler the Creator</p>
                                                        </div>
                                                    </div>
                                                    <p class="playlist-track__type">Album</p>
                                                    <p class="playlist-track__genre">Ambient</p>
                                                    <p class="playlist-track__length">24 songs</p>
                                                    <p class="playlist-track__time">3:03</p>
                                                </li>
                                            {/each}
                                            <div class="collection__bottom-padding"></div>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>  
                    </div>
                {/if}
            {/if}
            {#if !isSignedIn}
                <p class="music__description">
                    Sync your favorite music streaming service to listen to personal playlists and discover new music all in one app. No more switching between tabs and windows!
                </p>
                <h2>Sync an Account</h2>
                <ul class="platform-list section-bg">
                    <li class="platform-item">
                        <div class="platform-item__logo platform-logo platform-logo--soundcloud">
                            <i class="fa-brands fa-soundcloud"></i>
                        </div>
                        <div class="platform-item__text">
                            <h3>Soundcloud</h3>
                            <p>Playlist</p>
                        </div>
                        <button class="btn-text-only">Connect</button>
                    </li>
                    <li class="platform-item">
                        <div class="platform-item__logo platform-logo platform-logo--youtube">
                            <i class="fa-brands fa-youtube"></i>
                        </div>
                        <div class="platform-item__text">
                            <h3>Youtube</h3>
                            <p>Playlist, Live Videos</p>
                        </div>
                        <button class="btn-text-only">Connect</button>
                    </li>
                    <li class="platform-item">
                        <div class="platform-item__logo platform-logo platform-logo--apple">
                            <i class="fa-brands fa-itunes-note"></i>
                        </div>
                        <div class="platform-item__text">
                            <h3>Apple Music</h3>
                            <p>Playlists, Live Radio</p>
                        </div>
                        <button class="btn-text-only">Connect</button>
                    </li>
                    <li class="platform-item">
                        <div class="platform-item__logo platform-logo platform-logo--spotify">
                            <i class="fa-brands fa-spotify"></i>
                        </div>
                        <div class="platform-item__text">
                            <h3>Spotify</h3>
                            <p>Playlists, Podcasts</p>
                        </div>
                        <button class="btn-text-only">Connect</button>
                    </li>
                </ul>
            {/if}
            <div class="music__padding"></div>
        </div>
    </div>
</div>

<style lang="scss">
    $section-spacing: 8px;
    $top-row-height: 170px;
    $bottom-row-height: 470px;

    .music {
        width: 82vw;
        height: 700px;
        min-width: 390px;
        max-width: 1000px;
        
        &--min {
            width: 42vw;
            height: 390px;
            min-width: 350px;
            max-width: 500px;
        }
        &__header {
            @include flex-container(center, _);
            h1 {
                font-size: 2.3rem;
                font-family: "Apercu";
                margin-right: 10px;
            }
            i {
                font-size: 15px;
                color: #8582FF;
                box-shadow: 0px 0px 7px rgba(133, 130, 255, 0.03);
            }
        }
        &__description {
            font-size: 1.1rem;
            margin-top: 12px;
            max-width: 90%;
            font-weight: 400;
            color: #666565;
        }
        &__container {
            margin-top: 40px;
        }
        &__row {
            width: 100%;
            display: flex;
            &--top {
                margin: 30px 0px 0px 0px;
            }
        }
    }
    
    /* Sections */
    .now-playing {
        margin: 0px $section-spacing $section-spacing 0px;
        height: $top-row-height;
        width: 40%;
        position: relative;
        
        .content-bg {
            top: 0px;
        }
        &__img {
            z-index: 1;
            margin-right: 15px;
            @include flex-container(center, _);
            
            img {
                border-radius: 5px;
                width: 90px;
            }
        }
        &__description {
            overflow: hidden;
            span {
                @include trans-text(#DFDFDF, 0.73);
                text-transform: capitalize;
            }
            h3 {
                z-index: 2000;
                margin: 3px 0px 10px 0px;
                @include two-line-elipses-overflow;
            }
            p {
                @include trans-text(#DFDFDF, 0.73);
                @include two-line-elipses-overflow;
            }
        }
        &__collection-details {
            font-size: 0.9rem;
            display: flex;
            @include trans-text(#DFDFDF, 0.73);
            position: absolute;
            right: 20px;
            bottom: 20px;
            span {
                margin: 0px 5px;
            }
        }
        .content-bg {
            padding: 12px 17px;
        }
        .flx {
            @include flex-container(flex-start, _);
            margin-top: 13px;
            position: relative;
            width: 90%;
        }
    }
    .discover {
        height: $top-row-height;
        margin: 0px 0px $section-spacing 0px;
        width: 60%;
        position: relative;
        padding-right: 0px;
        .flx {
            height: 120px;
        }
        &__description {
            width: 40%;
            margin-top: 10px;
            color: #787878;
        }
        &__collection-padding {
            height: 100px;
            margin-left: 15px;
        }
        &__collection-container {
            position: relative;
            height: 170px;
            margin-top: -17px;
            width: 60%;
            .icon-btn {
                top: 40%; 
                right: 10px;
            }
            &:hover > .gradient-container, &:hover > .icon-btn {
                opacity: 1 !important;
                visibility: visible !important;
            }
        }
        &__collection {
            overflow-x: scroll;
            display: flex;
            align-items: center;
        }
        a {
            position: absolute;
            bottom: 20px;
            left: 20px;
            cursor: pointer;
        }
    }
    .my-playlists { 
        height: $bottom-row-height;
        margin: 0px $section-spacing $section-spacing 0px;
        width: 50%;
        margin-right: 6px;
        overflow: hidden;
        position: relative;
        
        .music__section-header {
            padding: 13px 20px 13px 20px;
        }
        
        &__playlists {
            height: 90%;
            margin-top: 2px;
        }
        &__playlist {
            @include flex-container(center, _);
            cursor: pointer;
            padding: 8px 20px;
            margin-bottom: 10px;
            
            &:hover {
                background-color: rgb(29, 29, 30);
            }
            p {
                color: rgb(148, 148, 148);
                margin-right: 15px;
            }
        }
        &__playlist-img {
            width: 40px;
            height: 40px;
            margin-right: 17px;
            background-color: #202023;
            position: relative;
            border-radius: 4px;
            overflow: hidden;

            img {
                border: 0px;
                width: 40px;
            }
            i {
                color: #8582FF;
                font-size: 1.3rem;
            }
        }
        &__playlist-text {
            margin-top: -8px;
            overflow: hidden;
            width: 80%;
            h4 {
                font-size: 1.1rem;
                margin-bottom: 5px;
            }
            p {
                @include elipses-overflow;
                font-weight: 100;
                width: 80%;
            }
        }
        &__no-pl-meme {
            width: 200px;
        }
        &__padding {
            width: 100px;
            height: 50px;
        }
    }
    .recs {
        height: $bottom-row-height;
        width: 50%;
        &__copy {
            margin-top: 12px;
            color: #6f6f6f;
        }
        &__top {
            margin-top: 25px;
        }
        .icon-btn {
            top: 40%; 
            right: 12px;
        }
        &__collection-container {
            position: relative;

            &:hover > .gradient-container, &:hover > .icon-btn {
                opacity: 1 !important;
                visibility: visible !important;
            }
        }
        &__collection {
            margin-top: 20px;
            z-index: 10;
        }
        &__gradient {
            transition: 0.15s ease-in-out;
            opacity: 0;
            visibility: hidden;
            position: absolute;
            z-index: 1000;
            right: 0px;
            height: 100%;
            width: 70px;
            background: linear-gradient(270deg, #18181A 0%, transparent);
        }
        &__bottom {
            margin-top: 25px;
        }
    }

    .collection {
        height: 640px;
        width: 65vw;
        overflow: hidden;
        max-width: 700px;

        .img-bg {
            object-fit: cover;
            height: 40%;
            border-radius: 0px;
        }
        .blur-bg {
            background: rgba(101, 100, 100, 0.2);
            height: 40%;
        }
        .content-bg {
            height: 100%;
            padding: 0px;
            top: 0px;
        }
        &__header {
            height: 40%;
            padding: 35px 30px 45px 40px;
            img {
                border-radius: 22px;
                width: 200px;
                height: 200px;
                aspect-ratio: 1 / 1;
            }
        }
        &__description {
            position: relative;
            margin-left: 35px;
            span {
                @include trans-text(#DFDFDF, 0.7);
                font-weight: 600;
            }
            h1 {
                font-family: "Apercu";
                font-size: 40px;
                margin-bottom: 20px;
            }
        }
        &__text {
            @include trans-text(#f0efef, 0.73);
            width: 90%;
            max-height: 80px;
            overflow: hidden;
        }
        &__genres-list {
            position: absolute;
            display: flex;
            bottom: 0px;
            li {
                font-weight: 600;
                @include trans-text(#f0efef, 0.76);
                margin-right: 15px;
            }
        }
        &__art-artist {
            position: absolute;
            top: 0px;
            right: 0px;
            font-weight: 600;
            @include trans-text(#f0efef, 0.76);
        }
        &__playlists-container {
            height: 60%;

        }
        &__playlists {
            overflow-y: scroll;
            height: 100%;
            -webkit-mask-image: linear-gradient(180deg, #000 60%, transparent);
        }
        &__top-padding {
            height: 10px;
            width: 100%;
        }
        &__bottom-padding {
            height: 100px;
            width: 100%;
        }
        .divider {
            margin: 20px 0px 0px 28px;
            width: 92%;
            height: 0.6px;
        }
    }
    .playlist-header {
        color: #8B8B8B;
        display: flex;
        width: 100%;
        padding: 25px 30px 0px 30px;
        text-align: center;
        margin-bottom: -5px;
        white-space: nowrap;

        h2 {
            font-size: 0.9rem;
        }
        &__num {
            text-align: left;
            width: 25px;
        }
        &__title {
            text-align: left;
            width: 40%;
            min-width: 135px;
        }
        &__type {
            width: 15%;
            @include elipses-overflow;
            max-width: 160px;
        }
        &__genre {
            width: 15%;
            padding-left: 25px;
        }
        &__length {
            width: 15%;
            padding-left: 25px;
        }
        &__time {
            text-align: right;
            width: 10%;
        }
        @include sm(max-width) {
            &__num {
                width: 35px; // must be 35 to, the 2 right cols will pushed to far to the right
            }
            &__title {
                width: 50%;
            }
            &__type {
                width: 25%;
            }
            &__genre{
                width: 38%;  // cannot be 25, same reason
            }
            &__length {
                display: none;
            }
            &__time {
                display: none;
            }
        }
    }   
    .playlist-track {
        @include flex-container(center, _);
        text-align: center;
        white-space: nowrap;
        margin-bottom: 3px;
        cursor: pointer;
        padding: 8px 30px 8px 30px;

        &:hover {
            background-color: rgb(24, 24, 25);
        }

        &__num {
            width: max(2%, 20px);
            text-align: left;
        }
        .playlist-track-details-container {
            width: 40%;
            display: flex;
            &__img {
                width: 15%;
                min-width: 40px;
                text-align: left;
                object-fit: cover;
                img {
                    width: 80%;
                    aspect-ratio: 1 / 1;
                }
            }
            &__details {
                width: 70%;
                text-align: left;
                h4, p {
                    @include elipses-overflow;
                }
                h4 {
                    color: white;
                    font-size: 1.2rem;
                }
                p {
                    font-family: "Manrope";
                    font-weight: 400;
                    font-size: 0.8rem;
                    color: rgb(154, 154, 154);
                    margin-top: 2px;
                }
            }
        }
        p {
            color: rgb(142, 142, 142);
        }
        &__num {
            text-align: left;
            width: 25px;
        }
        &__title {
            text-align: left;
            width: 40%;
            min-width: 135px;
        }
        &__type {
            width: 15%;
            @include elipses-overflow;
            max-width: 160px;
        }
        &__genre {
            width: 15%;
            padding-left: 25px;
        }
        &__length {
            width: 15%;
            padding-left: 25px;
        }
        &__time {
            text-align: right;
            width: 10%;
        }
        @include sm(max-width) {
            &__title {
                width: 50%;
            }
            &__type {
                width: 25%;
            }
            &__genre{
                width: 25%;
            }
            &__length {
                display: none;
            }
            &__time {
                display: none;
            }
        }
    }

    /* Elements */
    .icon-btn {
        opacity: 0;
        z-index: 9999;
        visibility: hidden;
        position: absolute;
        color: white;
        transform: translateY(-50%); 
        color: rgb(189, 189, 189);
        &:hover {
            i {
                color: white;
                transform: scale(1.2);
            }
        }
        &:active {
            i {
                transform: scale(0.95);
            }
        }
    }
    .platform-list {
        margin-top: 15px;
        &--dropdown {
            z-index: 10000;
            width: 200px;
            position: absolute;
            background-color: #1e1e1e;
            padding: 15px 5px 15px 15px;
            border-radius: 10px;
            bottom: -170px;
            right: 90px;
        }
    }
    .platform-item {
        @include flex-container(center, _);
        margin-bottom: 20px;

        &__text {
            margin: -5px 0px 0px 18px;
            p {
                color: #797979
            }
        }
        button {
            position: absolute;
            right: 30px;
        }
        &:last-child {
            margin-bottom: 0px;
        }

        &--small {
            margin-bottom: 13px;
            .platform-item__text {
                margin: -2px 0px 0px 10px;
                h3 {
                    font-size: 0.9rem;
                }
                p {
                    font-weight: 100;
                    font-size: 0.8rem;
                }
            }
            button {
                right: 20px;
                font-size: 8px;
            }
        }
    }
    .profile-tab {
        @include flex-container(center, _);
        position: absolute;
        top: 35px;
        right: 30px;
        height: 12px;

        .divider {
            transition: 0.2s ease-in-out;
        }

        &__btn {
            @include flex-container(center, _);
            padding: 5px 8px;
            border-radius: 10px;
            &:hover {
                transition: 0.15s ease-in-out;
                background-color: #1d1d1f;
            }
            &:hover + .divider {
                background-color: transparent;
            }

        }
        .platform-logo {
            width: 18px;
            height: 18px;
            margin-right: 5px;
            border-radius: 7px;
            i {
                font-size: 8px;
            }
        }
        .fa-chevron-down {
            font-size: 9px;
            color: #4E4E4F;
        }
        p {
            color: #8A8A8A;
            font-weight: 700;
            margin-right: 8px
        }
        .divider {
            margin: 0px 10px 0px 1px;
            background-color: #414141;

        }
        &__img {
            @include circle(20px);
            background-color: #4E4E4F;
        }

    }
    
    .media-card {
        margin-right: 7px;
        cursor: pointer;
        &--wide {
            width: 120px;
        }
        &--wide > .media-img {
            width: 100px;
            height: 70px;
            object-fit: cover;
        }
        img {
            width: 85px;
            border-radius: 10px;
        }
        h5 {
            margin-top: 5px;
        }
        p {
            margin-top: 3px;
            font-weight: 100;
            color: #6a6a6a;
            @include elipses-overflow;
        }
    }
    .blur-card {
        margin-right: 8px;
        position: relative;
        cursor: pointer;
        img {
            border-radius: 13px;
            width: 130px;
            height: 130px;
            
        }
        &:hover > .blur-card__blur-bg {
            height: 100%;
            border-radius: 13px;
            visibility: visible;
            opacity: 1;
        }
        &:hover > .blur-card__bottom-header {
            transition: 0.5s ease-in-out;
            visibility: hidden;
            opacity: 0;
        }
        &__blur-bg {
            transition: 0.2s ease-in-out;
            position: absolute;
            top: 0px;
            bottom: 0px;
            width: 100%;
            height: 100%;
            background: rgba(110, 110, 110, 0.1);
            backdrop-filter: blur(30px);
            border-radius: 13px;
            visibility: hidden;
            opacity: 0;
            z-index: 1000;
            h3 {
                font-family: "Apercu";
                font-size: 18px;
                margin: 45px 0px 0px 15px;
            }
        }
        &__description {
            margin: 5px 0px 0px 15px;
            display: block;
            .flx {
                height: 11.5px;
                align-items: center;
                @include trans-text(#efefef, 0.6);
                p {
                    font-size: 9px;
                    font-weight: 400;
                }
                .divider {
                    background-color: #ececec;
                    opacity: 0.73;
                    width: 0.2px !important;
                    height: 60%;
                    margin: 0px 7px;
                }
            }
        }
        &__bottom-header {
            position: absolute;
            bottom: 0px;
            height: 40px;
            width: 100%;
            background: rgba(110, 110, 110, 0.1);
            backdrop-filter: blur(100px);
            border-radius: 0px 0px 10px 10px;
            z-index: 0;
            visibility: visible;
            opacity: 1;
            h3 {
                margin: 9px 0px 0px 12px;
            }
        }
    }
    @include mq-custom(max-width, 50em) {
        .modal-bg {
            &__content {
                padding: 25px 20px 30px 20px;
            }
        }
        .music {
            &__row {
                display: block;
            }
            &__padding {
                display: block;
                width: 100%;
                height: 20px;
            }
        }
        .now-playing, .discover, .my-playlists, .recs {
            width: 100%;
        }
    }

</style>