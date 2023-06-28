<script lange="ts">
	import { colorThemeState } from "$lib/store";

    let isLightTheme = false
    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)
</script>

<div class="header">
    <div class={`header-user-details header__section ${isLightTheme ? "header-user-details--light-mode" : ""}`}>
        <img src="https://i.pinimg.com/564x/43/86/bb/4386bb3d57ddcb0c6ee1ba7a7f171689.jpg" alt="">
        <p>Hello, <span>Kyle Arcilla!</span></p>
    </div>
    <div class={`header-right-section ${isLightTheme ? "header-settings--light-mode" : ""}`}>
        <button class="header-settings__quote-btn" title="Quote of the Week">
            <img class="img-bg" src="https://i.pinimg.com/564x/54/d2/44/54d2444a8f9797cedd2db13e076a258e.jpg" alt="quote-img">
            <div class="blur-bg blur-bg--blurred-bg"></div>
            <div class="content-bg">
                <i class="fa-solid fa-quote-left"></i>
                <!-- Weekly Quote -->
            </div>
        </button>
        <div class="header-settings header__section">
            <div class="header-settings__user-stats">
                <div class="header-settings__user-stats-metric">
                    <i class="fa-solid fa-hourglass-end"></i>
                    <span>3</span>
                </div>
                <div class="header-settings__user-stats-metric">
                    <i class="fa-regular fa-clock"></i>
                    <span>4h 40 m</span>
                </div>
                <div class="header-settings__user-stats-metric">
                    <i class="fa-solid fa-mug-hot"></i>
                    <span>1h 30 m</span>
                </div>
            </div>
            <div class="divider"></div>
            <div class="header-settings__time">
                <i class="fa-solid fa-moon"></i>
                <span class="header-settings__time-current-time">11:23</span>
                <span class="header-settings__time-part-day">Mon, Jun 5</span>
            </div>
            <button class="header-settings__settings-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" transform="translate(1 10)">
                        <circle cx="2" cy="0.8" r="1.2" stroke-width="0.7"></circle>
                        <circle cx="8" cy="0.8" r="1.2" stroke-width="0.7"></circle>
                        <circle cx="14" cy="0.8" r="1.2" stroke-width="0.7"></circle>
                    </g>
                </svg>
            </button>
        </div>
    </div>
</div>

<style lang="scss">
    .header {
        margin-top: 15px;
        width: 100%;
        @include flex-container(center, space-between);

        &__section {
            border-radius: 50px;
            height: 35px;
            background-color: var(--headerElementBgColor);
            border: var(--headerElementBorderVal);
            @include flex-container(center, _);
            padding: 11px 15px 11px 12px;
            box-shadow: var(--shadowVal2);
            white-space: nowrap;
        }
    }

    .header-user-details {
        max-width: 200px;
        overflow: hidden;
        img {
            @include circle(20px);
        }
        p {
            color: rgba(var(--textColor1), 0.6);
            font-size: 1.2rem;;
            font-weight: 100;
            margin-left: 10px;
            @include elipses-overflow;
        }
        span {
            font-weight: 500;
            margin-left: 4px;
            font-size: 1.2rem;
        }

        &--light-mode p {
            font-weight: 300;
        }
        &--light-mode span {
            font-weight: 500;
        }

        @include mq-custom(max-width, 650px) {
            p, span {
                display: none;
            }
            padding: 10px 8px 10px 8px;
        }
    }

    .header-right-section {
        display: flex;
        align-items: center;
    }
    .header-settings {
        padding: 11px 11px 11px 19px;
        &__right-section {
        }
        /* Quote Button */
        &__quote-btn {
            position: relative;
            height: 31px;
            width: 31px;
            border-radius: 12px;
            margin-right: 5px;
            overflow: hidden;
            box-shadow: var(--shadowVal2);
            @include center;

            &:hover {
                transform: translateY(-1px);
            }
            &:active {
                transform: translateY(1px);
            }

            i {
                font-size: 1.1rem;
                color: rgba(var(--textColor1), 0.7);
            }
            .img-bg {
                border-radius: 12px;
                width: 95%;
                height: 95%;
            }
            .blur-bg {
                background: rgba(48, 48, 48, 0.4);
                border-radius: 12px;
                backdrop-filter: blur(11px);
                -webkit-backdrop-filter: blur(11px);
            }
            .content-bg {
                border-radius: 12px;
                @include center;
            }
        }
        /* User Stats */
        &__user-stats {
            display: flex;
            margin-right: -15px;
            color: rgba(var(--textColor1), 0.6);
            i {
                margin-right: 4px;
            }
            span {
                margin-right: 15px;
                font-weight: 200;
            }
        }
        .divider {
            width: 0.8px;
            height: 100%;
            margin: 0px 14px;
            background-color: rgba(var(--textColor1), 0.4);
        }
        /* Time / Day Section */
        .fa-moon {
            margin-right: 3px;
            color: #F2C59C;
            filter: drop-shadow(0px 0px 10px rgba(241, 204, 164, 0.81));
        }
        &__time-current-time {
            margin-right: 6px;
            font-weight: 200;
        }
        &__time {
            color: rgba(var(--textColor1), 0.5);
            font-size: 1.1rem;
        }
        /* Settings Button */
        &__settings-btn {
            margin-left: 10px;
            svg {
                color: rgba(var(--textColor1), 0.25);
            }
            &:active {
                transform: scale(0.95);
            }
        }


        /* Light Theme Styling */
        &--light-mode &__quote-btn {
            border: var(--headerElementBorderVal);
            i {
                color: rgba(var(--textColor1), 0.55);
            }
            .img-bg, .blur-bg {
                display: none;
            }
            .content-bg {
                background-color: var(--headerElementBgColor);
            }
        }
        &--light-mode &__time-current-time {
            font-weight: 300;
        }
        &--light-mode &__user-stats {
            span {
                font-weight: 500;
            }
        }
        &--light-mode &__time-part-day {
            font-weight: 700;
        }
    }
</style>