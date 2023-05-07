<script lang="ts">
	import PomProgressBar from "./PomProgressBar.svelte";
</script>

<div class="pom-view">
    <div class="pom-view__pom-task-tag-icon">
        S
    </div>
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
    height: 50px;
    width: 100%;
    display: flex;
    color: white;
    background-color: $bg-color-2;
    border-radius: 0px 0px 12px 12px;
    padding: 30px 15px 28px 15px;
    position: relative;

    @include sm(max-width) {
        padding-bottom: 22px;
    }
    
    &__pom-task-tag-icon {
        background-color: #7E7BF8;
        @include circle(15px);
        box-shadow: -1px 1px 10px 8px rgba(120, 118, 254, 0.1);
        border-radius: 50%;
        font-family: "Apercu Medium";
        color: white;
        margin-right: 10px;
        @include center;
    }
    &__title {
        font-family: "Manrope";
        color: white;
        max-width: 90px;
        text-align: start;
        overflow: hidden;
        width: 15%;

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
            right: 1.5%;
            top: 20px;
            @include sm(max-width) {
                margin-left: 5px;
                right: 2.5%;
            }
        }
    }

}
</style>