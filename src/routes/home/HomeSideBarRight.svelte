<script lang="ts">
</script>

<div class="task-view">
    <div class="task-view__header task-view__header--default"> 
        <img class="task-view__header-img" src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/287d3559037917.5a130f45904d5.gif" alt="">
            <h2>Hey, Kyle!</h2>
        <p class="task-view__header-text">Let's get shit done today!</p>
    </div>
    <!-- Horizontal Tabs Carousel -->
    <!-- <div class="task-view__tab-container">
        {#if isScrollableLeft}
            <div class="gradient-container gradient-container--left">
                <button class="recs__tab-arrow recs__tab-arrow--left icon-btn"
                        on:click={handleShiftTabCategoryLeft}
                >
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
            </div>
        {/if}
        <ul class="task-view__tabs" bind:this={groupTabList} on:scroll={handleScroll}>
            <li><div class="recs__tab-group-padding recs__tab-group-padding--left"></div></li>
            <li>
                <button 
                    on:click={() => {selectedTabTitle = "Active Session"}}
                    class={`tab-btn ${isLightTheme ? "tab-btn--light-mode" : ""} ${selectedTabTitle === "Active Session" ? "tab-btn--selected" : ""}`}
                >
                    Active Session
                </button>
            </li>
            <li>
                <button 
                    on:click={() => {selectedTabTitle = "Dashboard"}}
                    class={`tab-btn ${isLightTheme ? "tab-btn--light-mode" : ""} ${selectedTabTitle === "Dashboard" ? "tab-btn--selected" : ""}`}
                >
                    Dasboard
                </button>
            </li>
            <li><div class="recs__tab-group-padding recs__tab-group-padding--right"></div></li>
        </ul>
        {#if isScrollableRight}
            <div class="gradient-container gradient-container--right">
                <button class="recs__tab-arrow recs__tab-arrow--right icon-btn"
                        on:click={handleShiftTabCategoryRight}
                >
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        {/if}
    </div> -->
</div>

<style lang="scss">
    .task-view {
        width: 100%;
        overflow: hidden;
        color: rgb(var(--textColor1));
        
        &__header {
            width: 100%;
            margin: 0px 0px 15px 0px;
            h2 {
                font-family: "Apercu";
                padding-left: 7%;
                @include elipses-overflow;
                margin: 0px 10px 2px 0px;
                font-weight: 500;
            }
            &--secondary {
                display: block;
                text-align: center;
            }
            &--secondary > p {
                margin: 5px 0px 6px 0px;
            }
        }
        &__header-img {
            width: 100%;
            margin-bottom: 10px;
            height: 60px;
            object-fit: cover;
        }
        &__header-today-time {
            padding-right: 10%;
            cursor: pointer;
            @include flex-container(center, center);
            opacity: 0.84;
            i {
                color: #e4bb93;
                margin-right: 7px;
            }
            span {
                @include elipses-overflow;
            }
        }
        &__header-text {
            margin-top: 6px;
            padding: 0px 7%;
            opacity: 0.6;
        }
        &__tab-container {
            padding-left: 7%;
        }
        &__tabs {
            display: flex;
        }
    }

</style>