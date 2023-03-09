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
</script>

<div class="music-view">
    <div class="music-view-header">
        <h1>Music Player</h1>
        <i class="fa-brands fa-spotify header-icon"></i>
        <div class="music-view-header__music-view-dots">•••</div>
    </div>
    <div class="music-view__divider"></div>
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
            i {
                font-size: 15px;
                margin: 3px 0px 0px 10px;
                color: #94F292;
                border-radius: 100%;
                box-shadow: 0px 2px 9px rgba(148, 242, 146, 0.36);
            }

            h1 {
                font-size: 14px;
                font-weight: 700;
            }
            &__music-view-dots {
                position: absolute;
                top: 0px;
                right: 0px;
                color: #9E9E9E;
                font-size: 7px;
            }
        }
        &__divider {
            background-color: #292929;
            width: 100%;
            height: 1px;
            margin-top: 8px;
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
                    list-style: none;
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
                        padding: 10px 15px;
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
    }
</style>