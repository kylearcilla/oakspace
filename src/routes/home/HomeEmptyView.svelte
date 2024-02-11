<script lang="ts">
	import { themeState } from "$lib/store";

    let hasNPressed = false
    let hasQPressed = false
    let hasShiftBClicked = false
    let hasLeftBracketClicked = false
    let hasRightBracketClicked = false

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key.toLocaleLowerCase() === "n") {
            hasNPressed = true
        }
        else if (event.key.toLocaleLowerCase() === "q") {
            hasQPressed = true
        }
        else if (event.key === "Control") {
            hasShiftBClicked = true
        }
        else if (event.key === "]") {
            hasRightBracketClicked = true
        }
        else if (event.key === "[") {
            hasLeftBracketClicked = true
        }
    }
    function handleKeyUp(event: KeyboardEvent) {
        if (event.key.toLocaleLowerCase() === "n") {
            hasNPressed = false
        }
        else if (event.key.toLocaleLowerCase() === "q") {
            hasQPressed = false
        }
        else if (event.key === "Control") {
            hasShiftBClicked = false
        }
        else if (event.key === "]") {
            hasRightBracketClicked = false
        }
        else if (event.key === "[") {
            hasLeftBracketClicked = false
        }
    }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class={`shortcuts ${$themeState.isDarkTheme ? "" : "shortcuts--light-theme"}`}>
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
                    <div class="shortcuts__command-key shortcuts__command-key--bg shortcuts__command-key--word">Ctrl</div>
                    <div class={`shortcuts__command-key shortcuts__command-key--word ${hasShiftBClicked ? "shortcuts__command-key--active" : ""}`}>Ctrl</div>
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
                    <div class="shortcuts__command-key shortcuts__command-key--bg shortcuts__command-key--word">Ctrl</div>
                    <div class={`shortcuts__command-key shortcuts__command-key--word ${hasShiftBClicked ? "shortcuts__command-key--active" : ""}`}>Ctrl</div>
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
        height: 100%;
        @include flex(center, center);

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
            color: rgba(var(--textColor1), 0.15);
            @include text-style(0.15, 300, 1.45rem, "DM Sans");
        }
        &__command-keys {
            @include flex(center, _);
        }
        &__command-key-container {
            position: relative;
        }
        &__command-key {
            @include center;
            transition: 0.1s ease-in-out;
            padding: 5.5px 15px;
            margin-right: 7px;
            border-radius: 20px;
            background-color: var(--midPanelAccentColor1);
            transform: translateY(0px);
            @include text-style(0.3, 300, 1.1rem, "DM Mono");
            
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
            }
            &--active {
                transform: translateY(5px);
            }
        }
    }
</style>