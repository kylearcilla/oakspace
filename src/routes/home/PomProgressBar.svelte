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
                        <p class="step-icon-time">${sessionTime} m</p>
                    </div>
                `)
            } else {
                percentSoFar += breakTimePercent;
                result += (`
                    <div class="pom-bar__step-icon" style="left: ${percentSoFar * 100}%;">
                        <i class="fa-solid fa-leaf"></i>
                        <p class="step-icon-time">${breakTime} m</p>
                    </div>
                `)
            }
        }
        return result
    }

</script>

<div class="pom-view">
    <p class="pom-view__pom-timer">18:45</p>
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
    <p class="pom-view__pom-timer">{totalMinutes}:00</p>
</div>

<style global lang="scss">
    .pom-view {
        display: flex;
        align-items: center;
        width: 100%;
        transition: ease-in-out 0.2s;
        font-family: "Manrope";

        @include sm(max-width) {
            width: 75%;
        }

        &__pom-timer {
            color: #8F8F8F;
            font-size: 0.9rem;
            font-weight: 100;
            @include sm(max-width) {
                display: none;
            }
        }

        .pom-bar {
            position: relative;
            margin: 0px min(4%, 15px);
            width: 100%;
            height: 4px;
            background-color: rgb(14, 13, 16);
            border-radius: 5px;
            
            &__progress-bar {
                height: 4px;
                background: linear-gradient(270.59deg, #FF8B9C -10.17%, #E39ECE 12.41%, #A3B6FF 71.86%);
                box-shadow: -1px 0px 10px 6px rgba(187, 173, 237, 0.05);
                border-radius: 28px 0px 0px 28px;
            }
            &__step-icon {
                position: absolute;
                top: -22px;
                width: 16px;
                height: 16px;
                border-radius: 18px;
                color: #747474;
                @include center;

                &::after {
                    content: "";
                    @include circle(1.5px);
                    background-color: #747474;
                    position: absolute;
                    bottom: -2px;
                }
                i {
                    font-size: 0.75rem;
                }
                .step-icon-time {
                    position: absolute;
                    white-space: nowrap;
                    top: 33px;
                    font-size: 0.68rem;
                    font-weight: 400;
                    @include sm(max-width) {
                        display: none;
                    }
                }
                &--finished {
                    background: linear-gradient(90deg, #5366FF 0%, #7876FE 100%);
                    border: 1.5px solid #9997FE;
                    box-shadow: -1px 1px 5px 3px rgba(120, 118, 254, 0.06);
                    color: white;
    
                    i {
                        font-size: 0.6rem;
                    }
                }
            }
        }
    }

</style>