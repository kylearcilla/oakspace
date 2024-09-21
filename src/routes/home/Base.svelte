<script lang="ts">
	import { Icon } from "$lib/enums";
	import LineProgress from "../../components/LineProgress.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte";

    const bannerImg = {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg/2560px-Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg",
        opacity: 0.6
    }

</script>

<div class="base">
    <!-- Header -->
    <div 
        class="base__header-img"
        style:background-image={`linear-gradient(rgba(0, 0, 0, ${bannerImg.opacity}), rgba(0, 0, 0, ${bannerImg.opacity})), url(${bannerImg.src})`}
    >
    </div>
    <div class="base__header">
        <div class="base__header-icon">
            <img src="https://i.pinimg.com/originals/22/a2/8e/22a28ec79941e28b8a1a05f5e20e888f.gif" alt="">
        </div>
        <div class="base__header-details">
            <div>
                <h1>
                    Home
                </h1>
                <h4>
                    Good afternoon, Kyle!
                </h4>
            </div>
            <div class="base__header-quote">
                <p>"How we spend our days is, of course, how we spend our lives."</p>
            </div>
        </div>
        <div class="base__progress">
            <div class="base__progress-row">
                <div class="base__progress-item">
                    <span>Week</span>
                    <LineProgress 
                        options={{ progress: 0.2 }}
                    />
                </div>
                <div class="base__progress-item">
                    <span>Quarter</span>
                    <LineProgress 
                        options={{ progress: 0.3 }}
                    />
                </div>
            </div>
            <div class="base__progress-row">
                <div class="base__progress-item">
                    <span>Month</span>
                    <LineProgress 
                        options={{ progress: 0.65 }}
                    />
                </div>
                <div class="base__progress-item">
                    <span>Year</span>
                    <LineProgress 
                        options={{ progress: 0.6 }}
                    />
                </div>
            </div>
        </div>
    </div>
    <div class="divider divider--fw"></div>
</div>

<style lang="scss">
    .base {
        margin-top: 15px;
        width: 100%;
        height: calc(100% - 15px);
        overflow-x: scroll;

        .divider {
            background-color: rgba(var(--textColor1), 0.025);

            &--fw {
                height: 1px;
                width: calc(100% - 50px);
                margin: 0px 0px 0px 25px;
            }
        }

        /* Header */
        &__header-img {
            height: 180px;
            width: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
        &__header {
            @include flex(flex-end);
            padding: 16px 30px 15px 30px;
            width: 100%;
            // height: 140px;

            .divider {
                height: 100%;
                width: 1px;
                margin: 0px 25px 0px 20px;
            }
        }
        &__header-icon {
            height: 110px;
            aspect-ratio: calc(1 / 1);
            margin-right: 25px;
            display: none;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 0px;
            }
        }
        &__header-details {
            width: 100px;
            flex: 1;
            flex-direction: column;
            position: relative;
            @include flex(_, space-between);

            h1 {
                @include text-style(1, 400, 2.125rem);
                margin: 0px 0px 3px 0px;
            }
            h4 {
                @include text-style(0.45, 400, 1.65rem);
                margin-bottom: 12px;
            }
            h4 span {
                opacity: 0.55;
                margin-left: 2px;
            }
        }
        &__header-quote {
            @include text-style(0.2, 400, 1.625rem);
            position: relative;
            margin: 0px 0px 0px 0px;
            padding: 0px 0px 0px 15px;
            // padding: 8px 5px 10px 14px;
            // border-radius: 9px;
            // background: rgba(var(--textColor1), 0.0145);
            @include multi-line-elipses-overflow(2);

            &:before {
                content: " ";
                // display: none;
                @include abs-top-left(5px);
                height: calc(100% - 8px);
                width: 2px;
                background: rgba(var(--textColor1), 0.35);
                border-radius: 2px;
            }
        }
        &__progress {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 4px 0px;
            display: none;
        }
        &__progress-row {
            display: flex;
        }
        &__progress-item {
            &:first-child {
                margin-right: 18px;
            }
            span {
                display: block;
                margin-bottom: 12px;
                @include text-style(0.62, 500, 1.52rem, "DM Mono");
            }
        }
    }
</style>