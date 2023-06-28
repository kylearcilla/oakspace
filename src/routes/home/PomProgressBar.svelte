<script lang="ts">
	import { colorThemeState } from "$lib/store";

    const sessionPeriods = 3
    const sessionTime = 25
    const breakTime = 5
    const totalMinutes = (sessionPeriods * sessionTime) + ((sessionPeriods - 1) * breakTime)
    const totalPeriods = (sessionPeriods * 2) - 1
    const sessionTimePercent = sessionTime / totalMinutes
    const breakTimePercent = breakTime / totalMinutes

    let isLightTheme = false
    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    const getStepIcons = () => {
        let result = ""
        let percentSoFar = 0

        for (let i = 0; i < totalPeriods - 1; i++) {
            if (i % 2 == 0) {
                percentSoFar += sessionTimePercent;
                result += (`
                    <div class="pom-bar__step-icon" style="left: ${percentSoFar * 100}%;">
                        <i class="fa-solid fa-book-open"></i>
                        <span class="pom-bar__step-icon-time caption-5">${sessionTime} mins</span>
                    </div>
                `)
            } else {
                percentSoFar += breakTimePercent;
                result += (`
                    <div class="pom-bar__step-icon" style="left: ${percentSoFar * 100}%;">
                        <i class="fa-solid fa-leaf"></i>
                        <span class="pom-bar__step-icon-time caption-5">${breakTime} mins</span>
                    </div>
                `)
            }
        }
        return result
    }

</script>

<div class="pom-view">
    <span class={`pom-view__pom-timer pom-view__pom-timer--elapsed ${isLightTheme ? "pom-view__pom-timer--light-mode" : "pom-view__pom-timer--dark-mode"}`}>18:45</span>
    <div class="pom-bar">
        {@html getStepIcons()}
        <div class="pom-bar__progress-bar" style="width: 20%;">
            <button class="pom-bar__progress-bar-playback-btn">
                <i class="fa-solid fa-pause"></i>
            </button>
        </div>
    </div>
    <span class={`pom-view__pom-timer pom-view__pom-timer--total ${isLightTheme ? "pom-view__pom-timer--light-mode" : "pom-view__pom-timer--dark-mode"}`}>{totalMinutes}:00</span>
</div>

<style global lang="scss">
    .pom-view {
        width: 100%;
        transition: ease-in-out 0.1s;
        font-family: "Manrope";
        position: relative;
        
        &__pom-timer {
            color: rgba(var(--textColor1), 0.5);
            font-size: 0.9rem;
            &--elapsed {
                @include pos-abs-bottom-left-corner(-18px, 0px);
            }
            &--total {
                @include pos-abs-bottom-right-corner(0px, -17px);
            }
            &--light-mode {
                font-weight: 500;
            }
            &--dark-mode {
                font-weight: 300;
            }
        }
    }

    .pom-bar {
        width: 100%;
        height: 2.5px;
        background-color: var(--pomProgressBgColor);
        border-radius: 5px;

        &:hover &__progress-bar-playback-btn {
            font-size: 0.7rem;
            @include pos-abs-bottom-right-corner(-8px, -6px);
            @include circle(16px);
        }
        &__progress-bar {
            position: relative;
            height: 2.5px;
            background: var(--pomProgressBarFgColor);
            border-radius: 28px 0px 0px 28px;
        }
        &__progress-bar-playback-btn {
            @include center;
            background-color: var(--pomProgressPlaybackBtnColor);
            @include pos-abs-bottom-right-corner(-2px, -2px);
            @include circle(6px);
            font-size: 0rem;
            color: white;
            
            &:hover {
                font-size: 0.7rem;
                @include pos-abs-bottom-right-corner(-8px, -6px);
                @include circle(16px);
            }
            &:active {
                transform: scale(0.9);
            }
        }
        &__step-icon {
            position: absolute;
            top: -20px;
            width: 16px;
            height: 16px;
            border-radius: 18px;
            cursor: pointer;
            opacity: 0.7;
            @include center;

            i {
                font-size: 0.7rem;
                color: var(--pomIconColor);
            }
            
            &::after {
                content: "";
                @include circle(1.5px);
                background-color: var(--pomIconColor);
                position: absolute;
                bottom: 0px;
            }
            &--finished {
                background: linear-gradient(90deg, #5366FF 0%, #7876FE 100%);
                border: 1.5px solid #9997FE;
                box-shadow: -1px 1px 5px 3px rgba(120, 118, 254, 0.06);
            }

            &:hover > &-time {
                opacity: 1;
            }
        }
        &__step-icon-time {
            position: absolute;
            transition: 0.15s ease-out;
            white-space: nowrap;
            top: 30px;
            color: var(--pomIconColor);
            opacity: 0;
            font-family: "Apercu";

            &:hover {
                opacity: 1;
            }
            @include sm(max-width) {
                display: none;
            }
        }
    }

</style>