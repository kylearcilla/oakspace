<script lang="ts">
    const spotifyPlaylist = {
        vidTitle: "",
        vidDate: "",
        vidLikeCount: "",
        vidCount: 23112, 
        playlistCoverImgSrc: "https://i.pinimg.com/564x/87/7a/f8/877af84ee302075f969be04f809a0e5f.jpg",
        channelTitle: "",
        channelSubCount: ""
    }
    let tabHeaderPicked = "sessions"
    let flag = false;

    const handleSessionClicked = () => { flag = !flag }

    const handleTabHeaderClick = () => {
        if (tabHeaderPicked == "spotify") tabHeaderPicked = "sessions"
        else tabHeaderPicked = "spotify"
    }
</script>

<div class="music-view">
    <div class="music-view-header">
        <button on:click={handleTabHeaderClick} class={`music-view-header-tab music-view-header-tab--spotify ${tabHeaderPicked == "spotify" ? "music-view-header-tab--clicked" : ""}`}>
            <h1>Music Player</h1>
            <i class="fa-brands fa-spotify header-icon spotify-icon"></i>
        </button>
        <button on:click={handleTabHeaderClick} class={`music-view-header-tab music-view-header-tab--sessions  ${tabHeaderPicked == "sessions" ? "music-view-header-tab--clicked" : ""}`}>
            <h1>Sessions</h1>
        </button>
        <button class="music-view-header__music-view-dots dots-btn">•••</button>
    </div>
    <div class="divider">
        <div class={`tab-highlight ${tabHeaderPicked == "sessions" ? "tab-highlight--right" : ""}`}></div>
    </div>
    {#if tabHeaderPicked === "spotify"}
        <div class="playlist-details-container">
            <img alt="" src={spotifyPlaylist.playlistCoverImgSrc}/>
            <div class="playlist-details">
                <div class="playlist-details__name-and-dropdown">Vibes Vol.  1</div>
                <div class="playlist-details__author">Kyle Arcilla</div>
            </div>
            <div class="play-list-sub-details">
                7 Songs • 4 hr 21 min
            </div>
        </div>
        <div class="playlist">
            <div class="playlist-header">
                <h5 class="playlist-header__num">#</h5>
                <h5 class="playlist-header__title">Title / Artist</h5>
                <h5 class="playlist-header__name">Album / Podcast</h5>
                <h5 class="playlist-header__released">Released</h5>
                <h5 class="playlist-header__length">Length</h5>
            </div>
            <ul class="playlist-tracklist">
                {#each [1, 2, 3, 5, 6] as item}
                    <li class="playlist-track">
                        <p class="playlist-track__num">{item}</p>
                        <div class="playlist-track-details-container">
                            <div class="playlist-track-details-container__img">
                                <img alt="" src={spotifyPlaylist.playlistCoverImgSrc}/>
                            </div>
                            <div class="playlist-track-details-container__details">
                                <h4>Wus Ya Name sdf sdf </h4>
                                <p>Tyler the Creator</p>
                            </div>
                        </div>
                        <div class="playlist-track__name">Call Me If You Get Lost sodifj sodifjsod isdjf</div>
                        <h5 class="playlist-track__released">2021</h5>
                        <h5 class="playlist-track__length">3:03</h5>
                    </li>
                {/each}
            </ul>
        </div>
    {:else}
        <div class="today-stats">
            <div class="today-stats-time">
                <div class="today-stat">
                    <i class="fa-solid fa-book-open"></i>
                    <p>3.4 hrs</p>
                </div>
                <div class="today-stat today-stat--last">
                    <i class="fa-solid fa-pencil"></i>
                    <p>3 Sess.</p>
                </div>
            </div>
            <div class="divider divider--vertical"></div>
            <div class="today-stats-medals">
                <div class="today-stat">
                    🥉
                    <p>3</p>
                </div>
                <div class="today-stat today-stat--middle">
                    🥈
                    <p>2</p>
                </div>
                <div class="today-stat">
                    🥇
                    <p>3</p>
                </div>
            </div>
            <button class="text-icon-btn-1 music-view__new-task-btn">
                <p>New Session</p>
                <p>+</p>
            </button>
        </div>
        <div class="current-session">
            <h1>Current Session</h1>
            <div class="current-session-container">
                <div class="current-session-header">
                    <div class="current-session-left">
                        <h3>Math HW</h3>
                        <p class="session-wide__pom-period">45 min × 3</p>
                    </div>
                    <div class="current-session-right">
                        <div class="tag-wide">
                            school
                        </div>
                    </div>
                </div>
                <ul class="current-session-todo-list">
                    <li class="session-todo">
                        <button class="session-todo__icon session-todo__icon--active" role="checkbox" aria-checked="false">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <p class="session-todo__text">Problems 3 - 6</p>
                    </li>
                    <li class="session-todo">
                        <button class="session-todo__icon session-todo__icon--active" role="checkbox" aria-checked="false">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <p class="session-todo__text">Problems 3 - 6</p>
                    </li>
                    <li class="session-todo session-todo--new-session-btn">
                        <form>
                            <button class="session-todo__icon session-todo__icon--add session-todo__icon--active" type="submit">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                            <!-- <p class="session-todo__text">Add New Task</p> -->
                            <input class="session-todo__text session-todo__text--input" placeholder="Type Here!"><br>
                        </form>
                    </li>
                </ul>
            </div>
        </div>
        <h1 class="day-section day-section--morning">This Morning</h1>
        <div class="divider divider--thin"></div>
        <ul>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li class={`sesssion-wide-container ${flag ? "sesssion-wide-container--clicked" : ""}`} on:click={handleSessionClicked}>
                <div class="session-wide">
                    <div class="session-wide__title">
                        <h2>Math HW</h2>
                    </div>
                    <p class="session-wide__tasks-done">2/7</p>
                    <div class="session-wide__tag-wide-container">
                        <div class="tag-wide">
                            school
                        </div>
                    </div>
                    <p class="session-wide__pom-period">45 min × 3</p>
                    <p class="session-wide__time-period">2:21 PM - 12:30 AM</p>
                    <p class="session-wide__medal">🥇</p>
                </div>
                <ul class="session-wide-todo-list">
                    <li class="session-todo">
                        <button class="session-todo__icon session-todo__icon--finished" role="checkbox" aria-checked="false">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <p class="session-todo__text">Problems 3 - 6</p>
                    </li>
                    <li class="session-todo">
                        <button class="session-todo__icon session-todo__icon--finished" role="checkbox" aria-checked="false">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <p class="session-todo__text">Problems 3 - 6</p>
                    </li>
                </ul>
                <div class="divider divider--thin"></div>
            </li>
        </ul>
    {/if}
</div>

<style lang="scss">
    .music-view {
        color: white;
        font-family: "Manrope";
        margin-top: 40px;
        width: 100%;

        .music-view-header {
            position: relative;
            display: flex;
            align-items: center;
            .music-view-header-tab {
                display: flex;
                margin-right: 25px;
                color: rgb(79, 79, 79);
                align-items: center;
                i {
                    font-size: 11px;
                    border-radius: 100%;
                    margin: 3px 0px 0px 8px;
                }
                h1 {
                    font-size: 14px;
                    font-weight: 700;
                }
                &:hover {
                    transition: ease-in-out 0.15s;
                    color: rgb(132, 132, 132);
                }
                &:active {
                    color: white;
                }
                &--clicked {
                    color: white;
                    i {
                        color: #94F292;
                        box-shadow: 0px 2px 9px rgba(148, 242, 146, 0.16);
                    }
                    &:hover {
                        color: white !important;
                    }
                }
            }
            &__music-view-dots {
                position: absolute;
                top: 0px;
                right: 0px;
            }
        }
        .divider {
            background-color: #292929;
            width: 100%;
            margin-top: 10px;
            display: flex;
            align-items: center;
            position: relative;
            
            .tab-highlight {
                background-color: white;
                transition: ease-in-out 0.2s;
                position: absolute;
                height: 3px;
                width: 110px;
                left: 0px;
                &--right {
                    width: 70px;
                    left: 125px;
                }
            }
        }
        .playlist-details-container {
            margin-top: 20px;
            display: flex;
            align-items: center;
            width: 100%;
            position: relative;
            img {
                width: 65px;
                aspect-ratio: 1 / 1;
                border-radius: 100%;
                object-fit: cover;
            }
            .playlist-details {
                font-family: "Apercu Medium";
                margin-left: 17px;
                position: relative;
                &__name-and-dropdown {
                    font-size: 12px;
                    color: #E3E3E3;
                }
                &__author {
                    color: #8B8B8B;
                    font-size: 10px;
                    margin-top: 2px;
                }
            }
            .play-list-sub-details {
                position: absolute;
                top: 0px;
                right: 0px;
                color: #8B8B8B;
                font-family: "Manrope";
                font-weight: 600;
            }
        }
        .playlist {
            width: 100%;
            margin: 20px 0px 0px -7px;

            .playlist-header {
                font-family: "Apercu Bold";
                color: #8B8B8B;
                display: flex;
                width: 100%;
                padding: 8px 15px 0px 15px;
                text-align: center;
                margin-bottom: -5px;
                white-space: nowrap;

                &__num {
                    text-align: left;
                    width: max(2%, 20px);
                }
                &__title {
                    text-align: left;
                    width: 40%;
                    min-width: 135px;
                }
                &__name {
                    width: 25%;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    max-width: 160px;
                }
                &__released {
                    width: 30%;
                    padding-left: 25px;
                }
                &__length {
                    text-align: right;
                    width: 10%;
                }

                @include sm(max-width) {
                    &__title {
                        width: 50%;
                    }
                    &__name {
                        width: 25%;
                    }
                    &__released {
                        display: none;
                    }
                    &__length {
                        width: 20%;
                    }
                }
            }        
            .playlist-tracklist {
                width: 100%;
                font-family: "Manrope";
                color: #A6A6A6;
                margin-top: 20px;
                overflow: hidden;
                
                .playlist-track {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    white-space: nowrap;
                    margin-bottom: 3px;
                    transition: ease-in-out 0.2s;
                    cursor: pointer;
                    padding: 8px 15px;
                    border-radius: 10px;

                    &:hover {
                        padding: 9px 15px;
                        background-color: rgb(24, 23, 24);
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
                            max-width: 60px;
                            min-width: 40px;
                            text-align: left;
                            object-fit: cover;
                            img {
                                width: 80%;
                                aspect-ratio: 1 / 1;
                            }
                        }
                        &__details {
                            width: 60%;
                            text-align: left;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            h4, p {
                                overflow: hidden;
                                white-space: nowrap;
                                text-overflow: ellipsis;
                            }
                            h4 {
                                color: white;
                                font-size: 12px;
                            }
                            p {
                                font-family: "Manrope";
                                font-weight: 400;
                                font-size: 8px;
                                color: rgb(154, 154, 154);
                                margin-top: 2px;
                            }
                        }
                    }
                    &__name {
                        font-size: 10px;
                        width: 25%;
                        font-weight: 700;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 160px;
                    }
                    &__released {
                        font-size: 10px;
                        font-weight: 400;
                        width: 30%;
                        padding-left: 25px;
                    }
                    &__length {
                        text-align: right;
                        font-size: 10px;
                        font-weight: 100;
                        width: 10%;
                    }

                    @include sm(max-width) {
                        .playlist-track-details-container {
                            width: 50%;
                        }
                        &__name {
                            width: 25%;
                        }
                        &__released {
                            display: none;
                        }
                        &__length {
                            width: 20%;
                        }
                    }
                }
            }
        }
        .today-stats {
            position: relative;
            margin: 25px 0px 40px 0px;
            display: flex;
            align-items: center;
            .today-stats-time {
                display: flex;
                .today-stat {
                    &--last {
                        margin-left: 15px;
                    }
                }
            }
            .divider {
                height: 20px;
                margin: 0px 15px;
            }
            .today-stats-medals  {
                display: flex;
                .today-stat {
                    &--middle {
                        margin: 0px 6px;
                    }
                }
                p {
                    font-weight: 400;
                    font-size: 9px;
                }
            }
        }
        .current-session {
            margin-bottom: 40px;
            h1 {
                font-size: 13px;
                margin-bottom: 10px;
            }
            .current-session-container {
                padding: 15px 15px 10px 15px;
                background-color: #141415;
                border-radius: 10px;
                .current-session-header {
                    margin-bottom: 15px;
                    justify-content: space-between;
                    display: flex;
                    p {
                        margin-left: 5px;
                        color: #808080;
                    }
                    .current-session-left {
                        display: flex;
                        h3 {
                            margin-right: 5px;
                        }
                    }
                    .current-session-right {
                        align-items: center;
                        display: flex;
                        .tag-wide {
                            margin-right: 10px;
                        }
                    }
                }
                .session-todo {
                    &:hover {
                        background-color: transparent;
                    }
                    p {
                        font-size: 11px;
                    }
                    &--new-session-btn {
                        i {
                            font-size: 11px;
                        }
                        input {
                            font-size: 11px;
                            max-width: 95%;
                        }
                    }
                }
            }
        }
        &__new-task-btn {
            width: 150px;
            position: absolute;
            right: 0px;
            top: 0px;
            margin: 0px;
        }
        .day-section {
            margin: 20px 0px 15px 0px;
            font-size: 12px;
            &--morning {
                color: #9997FE;
            }
            &--afternoon {

            }
            &--evening {

            }
        }
        li {
            cursor: pointer;
            transition: ease-in-out 0.15s;
            .session-wide {
                display: flex;
                align-items: center;
                padding: 12px 10px 7px 10px;
                width: 100%;
                p {
                    white-space: nowrap;
                }
                &__title {
                    width: 20%;
                }
                h2 {
                    font-size: 12px;
                    text-overflow: ellipsis;
                    max-width: 90%;
                    white-space: nowrap;
                    overflow: hidden;
                }
                p {
                    color: #808080;
                    font-size: 11px;
                }
                &__tasks-done {
                    width: 10%;
                    margin-left: 7px;
                }
                &__tag-wide-container {
                    width: 20%;
                    @include center;
                }
                &__pom-period {
                    text-align: center;
                    width: 20%;
                }
                &__time-period {
                    width: 20%;
                    text-align: center;
                }
                &__medal {
                    width: 10%;
                    text-align: right;
                }
            }
            &:hover {
                background-color: #141416;
            }
        }
        .sesssion-wide-container {
            &--clicked > .session-wide-todo-list {
                display: block;
            }
        }
        .session-wide-todo-list {
            display: none;
            padding: 0px 0px 12px 15px;
            .session-todo {
                i {
                    font-size: 10px;
                }
                &__text {
                    font-size: 11px;
                    margin-left: 8px;
                }
                &:last-child {
                    margin-bottom: 0px;
                }
            }
        }
    }
</style>