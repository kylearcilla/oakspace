<script lang="ts">
    const youtubePlaylistId = "PLzbwD_XvqPteo_SM7DgKX12T0jq8n5pKf"

    const youtubeVid = {
        vidTitle: "",
        vidDate: "",
        vidLikeCount: "",
        vidCount: 23112, 
        channelImgSrc: "https://cdn.dribbble.com/userupload/3490175/file/original-59a4b6ec06a349e77a877c2156fa508f.png?compress=1&resize=2400x1800",
        channelTitle: "",
        channelSubCount: ""
    }

</script>

<div class="vid-view">
    <div class="vid-view-header">
        <h1>Video Player</h1>
        <div class="vid-view-header__yt-icon">
            <div class="yt-icon-fill"></div>
            <i class="fa-brands fa-youtube header-icon"></i>
        </div>
        <div class="vid-view-header__music-view-dots">•••</div>
    </div>
    <iframe id="video" src={`https://www.youtube.com/embed/videoseries?list=${youtubePlaylistId}`} title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
    <h1 class="vid-title">8 Hours soothing rain sound for sleeping on the green forest park</h1>
    <div class="vid-details">
        <h4 class="vid-details__date">Aug 20, 2020</h4>
        <h5 class="vid-details__view-count">2,163,436 views</h5>
        <div class="vid-details__play-list-dropdown">Rain Collection #1</div>
    </div>
    <div class="vid-channel-details-container">
        <img alt="channel-profile-img" src={youtubeVid.channelImgSrc}/>
        <div class="vid-channel-details">
            <div class="vid-channel-details__channel-name">Rambler Korea</div>
            <div class="vid-channel-details__sub-count">87.1K Subscribers</div>
        </div>
        <div class="vid-like-count">27.5 K</div>
    </div>
</div>

<style lang="scss">
    .vid-view {
        margin-top: 30px;
        font-family: "Manrope";
        color: white;
        .vid-view-header {
            position: relative;
            display: flex;
            align-items: center;
            margin-bottom: 15px;

            &__yt-icon {
                position: relative;
                margin: 3px 0px 15px 18px;
                i, .yt-icon-fill {
                    position: absolute;
                    left: 50%;
                    transform: translate(-50%, 0);
                }
                i {
                    border-radius: 100%;
                    font-size: 15px;
                    color: #DF6B6B;
                }
                .yt-icon-fill {
                    box-shadow: 0px 0px 12px 5px rgba(223, 107, 107, 0.28);
                    top: 5px;
                    background-color: white;
                    width: 5px;
                    height: 5px;
                }
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
        iframe {
            width: 100%;
            aspect-ratio: 16 / 9;
            border-radius: 10px;
        }
        .vid-title {
            font-size: 15px;
            margin-top: 10px;
            font-weight: 700;
        }
        .vid-details {
            margin-top: 8px;
            display: flex;
            position: relative;
            width: 100%;

            &__date {
                font-size: 10px;
                margin-right: 12px;
                color: rgb(154, 154, 154);
                font-weight: 400;
            }
            &__view-count {
                font-size: 10px;
                font-weight: 200;
                color: rgb(154, 154, 154);
            }
            &__play-list-dropdown {
                font-family: "Apercu";
                position: absolute;
                top: 0px;
                right: 0px;
                color: rgb(158, 158, 158);
            }
        }
        .vid-channel-details-container {
            margin-top: 20px;
            display: flex;
            position: relative;
            width: 100%;
            align-items: center;
            img {
                border-radius: 100%;
                width: 35px;
                aspect-ratio: 1 / 1;
                margin-right: 10px;
            }
            .vid-channel-details {
                font-weight: 700;
                &__channel-name {
                    font-size: 11px;
                }
                &__sub-count {
                    color: rgb(151, 151, 151);
                    font-weight: 400;   
                    font-size: 9px;
                    margin-top: 2px;
                }
            }
            .vid-like-count {
                position: absolute;
                top: 0px;
                right: 0px;
            }

        }
    }
</style>