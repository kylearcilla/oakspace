<script lang="ts">
    const sessionPeriods = 3
    const sessionTime = 25
    const breakTime = 5
    const totalMinutes = (sessionPeriods * sessionTime) + ((sessionPeriods - 1) * breakTime)
    const totalPeriods = (sessionPeriods * 2) - 1
    const sessionTimePercent = sessionTime / totalMinutes
    const breakTimePercent = breakTime / totalMinutes
    const getStepIcons = () => {
        let result = ""
        let percentSoFar = 0

        for (let i = 0; i < totalPeriods - 1; i++) {
            if (i % 2 == 0) {
                percentSoFar += sessionTimePercent;
                result += (`
                    <div class="pom-bar__step-icon" style="left: ${percentSoFar * 100}%;">
                        <i class="fa-solid fa-book-open"></i>
                        <p class="pom-bar__step-icon-time">${sessionTime} m</p>
                    </div>
                `)
            } else {
                percentSoFar += breakTimePercent;
                result += (`
                    <div class="pom-bar__step-icon" style="left: ${percentSoFar * 100}%;">
                        <i class="fa-solid fa-leaf"></i>
                        <p class="pom-bar__step-icon-time">${breakTime} m</p>
                    </div>
                `)
            }
        }
        return result
    }

</script>

<div class="pom-view">
    <p class="pom-view__pom-timer pom-view__pom-timer--elapsed">18:45</p>
    <div class="pom-bar">
        <!-- <div class="pom-bar__step-icon pom-bar__step-icon--finished" style="left: 20%;">
            <i class="fa-solid fa-check"></i>
        </div>
        <div class="pom-bar__step-icon" style="left: 34.24657534246575%;">
            <i class="fa-solid fa-book-open"></i>
            <p class="step-icon-time">25</p>
        </div> -->
        {@html getStepIcons()}
        <div class="pom-bar__progress-bar" style="width: 20%;"></div>
    </div>
    <p class="pom-view__pom-timer pom-view__pom-timer--total">{totalMinutes}:00</p>
</div>

<style global lang="scss">
    .pom-view {
        @include flex-container(center, _);
        width: 100%;
        transition: ease-in-out 0.2s;
        font-family: "Manrope";

        @include sm(max-width) {
            width: 75%;
        }

        &__pom-timer {
            font-size: 0.8rem;
            font-weight: 500;
            color: rgba(var(--textColor2), 0.7);

            @include sm(max-width) {
                display: none;
            }
            &--total {
                margin-right: 4px;
            }
        }
    }

    .pom-bar {
        position: relative;
        margin: 0px min(4%, 9px);
        width: 100%;
        height: 4px;
        background-color: var(--pomProgressBgColor);
        border-radius: 5px;
        
        &__progress-bar {
            height: 4px;
            background: var(--pomProgressBarFgColor);
            box-shadow: -1px 0px 10px 6px rgba(187, 173, 237, 0.05);
            border-radius: 28px 0px 0px 28px;
        }
        &__step-icon {
            position: absolute;
            top: -20px;
            width: 16px;
            height: 16px;
            border-radius: 18px;
            @include center;

            i {
                font-size: 0.6rem;
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
        }
        &__step-icon-time {
            position: absolute;
            white-space: nowrap;
            top: 30px;
            font-size: 0.68rem;
            font-weight: 400;
            color: var(--pomIconColor);

            @include sm(max-width) {
                display: none;
            }
        }
    }

</style>