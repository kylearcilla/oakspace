<script lang="ts">
	import { hoursToHhMm } from "$lib/utils-date";

    const totalMins = 1095
    // will be at most 5, zeroes will be rendered
    const sortedTags = [
        {
            name: "school",
            color: "#9997FE",
            totalMins: 742,
            totalSessions: 591
        },
        {
            name: "swe",
            color: "#FF8B9C",
            totalMins: 321,
            totalSessions: 200
        },
        {
            name: "reading",
            color: "#CFAB96",
            totalMins: 32,
            totalSessions: 16
        }
    ]
    let selectedTag = sortedTags[0]
</script>

<div class="tag-ranking">
    <ul class="tag-ranking__ranking-bar">
        {#each sortedTags as tag}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li 
                class={`tag-ranking__ranking-bar-tag-section ${selectedTag.name === tag.name ? "tag-ranking__ranking-bar-tag-section--picked" : ""}`}
                style={`width: ${(tag.totalMins / totalMins) * 100}%; background-color: ${tag.color}`}
                on:click={() => selectedTag = tag}
            >
            </li>
        {/each}
    </ul>
    <div class="tag-ranking__selected-tag-info-wrapper">
        <div class="tag-ranking__selected-tag">
            <div class="tag-ranking__selected-tag-color" style={`background-color: ${selectedTag.color}`}></div>
            <div class="tag-ranking__selected-tag-title">{selectedTag.name}</div>
        </div>
        <div class="tag-ranking__selected-tag-info">
            <div class="tag-ranking__selected-tag-info-avg">{hoursToHhMm(selectedTag.totalMins / selectedTag.totalSessions)}</div>
            <span>Avg. Focus Session</span>
        </div>
    </div>
</div>

<style lang="scss">
/* Top Tags */
.tag-ranking {
    height: 62px;
    &__ranking-bar {
        width: 100%;
        display: flex;
    }
    &__ranking-bar-tag-section {
        border-radius: 10px;
        height: 4px;
        margin-bottom: 16px;
        opacity: 0.5;
        transition: 0.12s ease-in-out;
        cursor: pointer;

        &:hover {
            opacity: 1;
        }
        &--picked {
            opacity: 1;
        }
    }
    &__selected-tag-info-wrapper {
        @include flex-container(flex-end, space-between);
    }
    &__selected-tag {
        @include flex-container(center, _);
    }
    &__selected-tag-color {
        margin-top: 2px;
        @include circle(6px);
        margin-right: 9px;
    }
    &__selected-tag-title {
        font-size: 1.3rem;
        font-weight: 500;
    }
    &__selected-tag-info {
        span {
            opacity: 0.3;
        }
    }
    &__selected-tag-info-avg {
        font-size: 1.8rem;
        text-align: right;
        margin-bottom: 2px;
    }
}
</style>