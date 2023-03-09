<script lang="ts">
	import PomProgressBar from "./PomProgressBar.svelte";
</script>

<div class="pom-view">
    <div class="pom-view__pom-task-tag-icon">
        S
    </div>
    <h2 class="pom-view__pom-task-title">
        Math Homework
    </h2>
    <PomProgressBar/>
    <button class="pom-view__pom-settings-btn">
        <i class="fa-solid fa-ellipsis"></i>
    </button>
</div>

<style lang="scss">
.pom-view {
    height: 50px;
    width: 100%;
    display: flex;
    color: white;
    background-color: #18151a;
    border-radius: 0px 0px 12px 12px;
    padding: 25px 15px 30px 15px;
    
    &__pom-task-tag-icon {
        width: 15px;
        height: 15px;
        background-color: #7E7BF8;
        aspect-ratio: 1 / 1; 
        box-shadow: -1px 1px 10px 8px rgba(120, 118, 254, 0.1);
        border-radius: 50%;
        font-family: "Apercu Medium";
        color: white;
        margin-right: 10px;
        @include center;
    }
    &__pom-task-title {
        font-family: "Manrope";
        color: white;
        max-width: 80px;
        white-space: nowrap;
        text-align: start;
        overflow: hidden;
        text-overflow: ellipsis !important;
        font-weight: 700;
        font-size: 0.9rem;
        margin-right: 1.8%;

        @include sm(max-width) {
            margin: 0px;
        }
    }
    &__pom-progress-bar-container {
    }
    &__pom-settings-btn {
        transition: 0.2s;
        color: #9E9E9E;
        margin: 0px;
        margin-left: 15px;

        &:hover {
            color: white; 
        }
        @include sm(max-width) {
            margin-left: 5px;
        }
    }
}
</style>