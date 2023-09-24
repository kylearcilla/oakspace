<script lang="ts">
	import { colorThemeState } from "$lib/store";

    let hasNPressed = false
    let hasQPressed = false
    let hasShiftBClicked = false
    let isCommandKeyAPressed = false
    let isCommandKeyBPressed = false
    let hasSlashAPressed = false
    let hasSlashBPressed = false

    let hasLeftBracketClicked = false
    let hasRightBracketClicked = false

    let isLightTheme = false

    colorThemeState.subscribe((data) => {
        isLightTheme = !data.isDarkTheme
    })

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key.toLocaleLowerCase() === "n") {
            hasNPressed = true
        }
        else if (event.key.toLocaleLowerCase() === "q") {
            hasQPressed = true
        }
        else if (event.key === "Shift") {
            hasShiftBClicked = true
        }
        else if (event.key === "}") {
            hasRightBracketClicked = true
        }
        else if (event.key === "{") {
            hasLeftBracketClicked = true
        }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
        if (event.key.toLocaleLowerCase() === "n") {
            hasNPressed = false
        }
        else if (event.key.toLocaleLowerCase() === "q") {
            hasQPressed = false
        }
        else if (event.key === "Shift") {
            hasShiftBClicked = false
        }
        else if (event.key === "}") {
            hasRightBracketClicked = false
        }
        else if (event.key === "{") {
            hasLeftBracketClicked = false
        }
    }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class={`shortcuts ${isLightTheme ? "shortcuts--light-theme" : ""}`}>
    <div>
        <div class="shortcuts__command">
            <div class="shortcuts__command-title">Start New Session</div>
            <div class="shortcuts__command-keys">
                <div class="shortcuts__command-key-container">
                    <div class="shortcuts__command-key shortcuts__command-key--bg shortcuts__command-key--circle">C</div>
                    <div class={`shortcuts__command-key shortcuts__command-key--circle ${hasNPressed ? "shortcuts__command-key--active" : ""}`}>N</div>
                </div>
            </div>
        </div>
        <div class="shortcuts__command">
            <div class="shortcuts__command-title">Quote of the Week</div>
            <div class="shortcuts__command-keys">
                <div class="shortcuts__command-key-container">
                    <div class="shortcuts__command-key shortcuts__command-key--bg shortcuts__command-key--circle">Q</div>
                    <div class={`shortcuts__command-key shortcuts__command-key--circle ${hasQPressed ? "shortcuts__command-key--active" : ""}`}>Q</div>
                </div>
            </div>
        </div>
        <div class="shortcuts__command">
            <div class="shortcuts__command-title">Toggle Left Bar</div>
            <div class="shortcuts__command-keys shortcuts__command-key--word">
                <div class="shortcuts__command-key-container">
                    <div class="shortcuts__command-key shortcuts__command-key--bg shortcuts__command-key--word">Shift</div>
                    <div class={`shortcuts__command-key shortcuts__command-key--word ${hasShiftBClicked ? "shortcuts__command-key--active" : ""}`}>Shift</div>
                </div>
                <div class="shortcuts__command-key-container">
                    <div class="shortcuts__command-key shortcuts__command-key--bg shortcuts__command-key--circle">{"["}</div>
                    <div class={`shortcuts__command-key shortcuts__command-key--circle ${hasLeftBracketClicked ? "shortcuts__command-key--active" : ""}`}>{"["}</div>
                </div>
            </div>
        </div>
        <div class="shortcuts__command">
            <div class="shortcuts__command-title">Toggle Right Bar</div>
            <div class="shortcuts__command-keys">
                <div class="shortcuts__command-key-container">
                    <div class="shortcuts__command-key shortcuts__command-key--bg shortcuts__command-key--word">Shift</div>
                    <div class={`shortcuts__command-key shortcuts__command-key--word ${hasShiftBClicked ? "shortcuts__command-key--active" : ""}`}>Shift</div>
                </div>
                <div class="shortcuts__command-key-container">
                    <div class="shortcuts__command-key shortcuts__command-key--bg shortcuts__command-key--circle">{"]"}</div>
                    <div class={`shortcuts__command-key shortcuts__command-key--circle ${hasRightBracketClicked ? "shortcuts__command-key--active" : ""}`}>{"]"}</div>
                </div>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .shortcuts {
        width: 100%;
        height: 75%;
        @include flex-container(center, center);

        &--light-theme &__command-title {
            color: rgba(var(--textColor1), 0.22);
            font-weight: 400;
        }
        &--light-theme &__command-key {
            color: rgba(var(--textColor1), 0.4);
            font-weight: 500 !important;
        }

        &__command {
            display: flex;
            margin-bottom: 16px;
            height: 25px;
        }
        &__command-title {
            text-align: right;
            padding-top: 3px;
            width: 140px;
            margin-right: 28px;
            font-size: 1.45rem;
            font-weight: 200;
            color: rgba(var(--textColor1), 0.15);
        }
        &__command-keys {
            @include flex-container(center, _);
        }
        &__command-key-container {
            position: relative;
        }
        &__command-key {
            @include center;
            font-size: 1.1rem;
            transition: 0.1s ease-in-out;
            padding: 5.5px 15px;
            margin-right: 7px;
            border-radius: 20px;
            background-color: var(--midPanelAccentColor1);
            color: rgba(var(--textColor1), 0.3);
            font-weight: 300;
            transform: translateY(0px);
            
            &--bg {
                transform: translateY(5px);
                @include pos-abs-top-left-corner(0px, 0px);
                background-color: var(--midPanelAccentColor2);
            }
            &--word {
                font-size: 1.3rem;
            }
            &--circle {
                font-size: 1.18rem;
                width: 30px;
                height: 30px;
                aspect-ratio: 1 / 1;
                padding: 7px;
            }
            &--active {
                transform: translateY(5px);
                // background-color: #221d1f;
            }
            &--active {
                transform: translateY(5px);
            }
        }
    }
</style>