<script lang="ts">
	import PomProgressBar from "./PomProgressBar.svelte";

    let hasColorTheme = false

</script>

<div class="pom-view">
    <div class={`pom-view__pom-task-tag-icon ${hasColorTheme ? "pom-view__pom-task-tag-icon--no-shadow" : ""}`}>S</div>
    <div class="pom-view__title">
        <h2>Math Homework</h2>
    </div>
    <PomProgressBar/>
    <div class="pom-view__pom-dots-btn-container">
        <button class="dots-btn">•••</button>
    </div>
</div>

<style lang="scss">
    .pom-view {
        height: 40px;
        width: 100%;
        display: flex;
        background-color: var(--pomBgColor);
        padding: 24px 15px 24px 15px;
        margin-top: 8px;
        position: relative;
        color: rgba(var(--textColor2), 1);
        border-radius: 16px;
        border: var(--borderVal);
        
        
        @include sm(max-width) {
            padding-bottom: 22px;
        }
        
        &__pom-task-tag-icon {
            background-color: #7E7BF8;
            @include circle(15px);
            box-shadow: -1px 1px 10px 8px rgba(120, 118, 254, 0.1);
            border-radius: 50%;
            font-family: "Apercu Medium";
            margin-right: 10px;
            @include center;

            &--no-shadow {
                box-shadow: none;
            }
        }
        &__title {
            font-family: "Manrope";
            max-width: 90px;
            text-align: start;
            overflow: hidden;
            width: 20%;

            h2 {
                max-width: 90%;
                font-weight: 700;
                font-size: 0.9rem;
                @include elipses-overflow;
            }

            @include sm(max-width) {
                margin: 0px;
            }
        }

        &__pom-dots-btn-container {
            width: 4%;
            button {
                position: absolute;
                color: rgb(var(--textColor2));
                right: 1.5%;
                top: 15px;
                border-radius: 4px;
                
                &:hover {
                    background-color: var(--pomBgColor);
                    filter: brightness(1.05);
                }

                @include sm(max-width) {
                    margin-left: 5px;
                    right: 2.5%;
                }
            }
        }
}
</style>