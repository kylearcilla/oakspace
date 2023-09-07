 <script lang="ts">
	import { clickOutside } from "$lib/helper";
	import { colorThemeState } from "$lib/store";
	import BarGraph from "../../components/BarGraph.svelte";

    enum Modal { Settings, Youtube, Music, Stats, Appearance }

    export let onNavButtonClicked: (modal: Modal | null) => void

    let tags = [
        {
            name: "school",
            color: "#9997FE",
            avg: "5h 45m",
            percent: "34%"
        },
        {
            name: "swe",
            color: "#FF8B9C",
            avg: "5h 45m",
            percent: "34%"
        },
        {
            name: "book",
            color: "#CFAB96",
            avg: "5h 45m",
            percent: "34%"
        },
        {
            name: "book",
            color: "#CFAB96",
            avg: "5h 45m",
            percent: "34%"
        }
    ]
    let isTimeFrameListOpen = false
    let newTag = tags[0]
    let isLightTheme = false

    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    const handleNewTagClicked = (idx: number) => {
        newTag = tags[idx]
        isTimeFrameListOpen = false
    }
    

</script>

 <div class="modal-bg">
    <div use:clickOutside on:click_outside={() => onNavButtonClicked(null)} class="modal-bg__content">
        <div class={`stats ${isLightTheme ? "" : "stats--dark"}`}>
            <div class="stats__left">
                <!-- Header -->
                <div class="stats__header">
                    <h1 class="modal-bg__content-title">Statistics</h1>
                    <p class="modal-bg__content-copy">
                        Get a bird's eye view of your session trends through different time frames.
                    </p>
                </div>
                <div class="prod-overview">
                    <!-- Prod Overview Header -->
                    <div class="prod-overview__header">
                        <h2>Productivity Overview</h2>
                        <div class="flx flx--algn-center">
                            <div class="prod-overview__time-frame-slider-wrapper">
                                <button on:click={() => {}}>
                                    <i class="fa-solid fa-chevron-left"></i>
                                </button>
                                <span>2 Sep – 8 Sep</span>
                                <button on:click={() => {}}>
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                            <div class="prod-overview__time-frame-dropdown-container dropdown-container">
                                <button class="prod-overview__time-frame-dropdown-btn dropdown-btn trans-btn" on:click={() => { isTimeFrameListOpen = true }}>
                                    <div class="dropdown-btn__title">
                                        {newTag.name}
                                    </div>
                                    <div class="dropdown-btn__arrows">
                                        <div class="dropdown-btn__arrows-triangle-up">
                                            <i class="fa-solid fa-chevron-up"></i>
                                        </div>
                                        <div class="dropdown-btn__arrows-triangle-down">
                                            <i class="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </div>
                                </button>
                                {#if isTimeFrameListOpen}
                                    <ul use:clickOutside on:click_outside={() => isTimeFrameListOpen = false} class="dropdown-menu">
                                        {#each tags as tag, idx} 
                                            <li class={`dropdown-menu__option ${tag.name === newTag.name ? "dropdown-menu__option--selected" : ""}`}>
                                                <button class="dropdown-element" on:click={() => handleNewTagClicked(idx)}>
                                                    <p>{tag.name}</p>
                                                    <i class="fa-solid fa-check"></i>
                                                </button>
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                        </div>
                    </div>
                    <div class="prod-overview__top-row">
                        <!-- Graph View -->
                        <div class="prod-graph-view prod-overview__bento-box">
                            <div class="prod-overview__bento-box-header">
                                <h4>This Week</h4>
                                <p>Pulling stats from <strong>9/2 - 9/8</strong></p>
                            </div>
                            <BarGraph/>
                        </div>
                        <!-- Stats View -->
                        <div class="prod-stats-view prod-overview__bento-box">
                            <div class="prod-stats-view__top-row">
                                <!-- Session Count Stat -->
                                <div class="prod-stats-view__stat prod-stats-view__bento-box">
                                    <div class="prod-stats-view__stat-header">
                                        <div class="prod-stats-view__stat-header-icon">
                                            <i class="fa-regular fa-hourglass-half"></i>
                                        </div>
                                        <div class="prod-stats-view__stat-header-percentage">
                                            <div class="flx flx--algn-center">
                                                <i class="fa-solid fa-arrow-up"></i>
                                                <span>3.5%</span>
                                            </div>
                                            <span class="prod-stats-view__stat-header-time">Since Last Week</span>
                                        </div>
                                    </div>
                                    <div class="prod-stats-view__stat-info">
                                        <h5>3.4</h5>
                                        <span>Daily Session Average</span>
                                    </div>
                                </div>
                                <!-- Session Focust Time Stat -->
                                <div class="prod-stats-view__stat prod-stats-view__bento-box">
                                    <div class="prod-stats-view__stat-header">
                                        <div class="prod-stats-view__stat-header-icon">
                                            <i class="fa-brands fa-readme"></i>
                                        </div>
                                        <div class="prod-stats-view__stat-header-percentage">
                                            <div class="flx">
                                                <i class="fa-solid fa-arrow-up"></i>
                                                <span>3.5%</span>
                                            </div>
                                            <span class="prod-stats-view__stat-header-time">Since Last Week</span>
                                        </div>
                                    </div>
                                    <div class="prod-stats-view__stat-info">
                                        <h5>1h 30 min</h5>
                                        <span>Break Session Average</span>
                                    </div>
                                </div>
                            </div>
                            <!-- Session Tag Distribution List -->
                            <div class="prod-stats-view__bottom-row">
                                <div class="prod-stats-view__tag-distribution prod-stats-view__bento-box">
                                    <div class="prod-overview__bento-box-header">
                                        <h4>Tag Distribution</h4>
                                    </div>
                                    <div class="prod-stats-view__tag-list-header">
                                        <div class="prod-stats-view__tag-list-header-item prod-stats-view__tag-list-header-item--tag-name">
                                            Tag Name
                                        </div>
                                        <div class="prod-stats-view__tag-list-header-item prod-stats-view__tag-list-header-item--avg">
                                            Daily Avg.
                                        </div>
                                        <div class="prod-stats-view__tag-list-header-item prod-stats-view__tag-list-header-item--percentage">
                                            %
                                        </div>
                                    </div>
                                    <ul>
                                        {#each tags as tag}
                                            <li class="prod-stats-view__tag-list-item">
                                                <div class="prod-stats-view__tag-list-item-col prod-stats-view__tag-list-item-col--tag-name">
                                                    <div class="prod-stats-view__tag-list-item-color" style={`background-color: ${tag.color};`}></div>
                                                    <div class="prod-stats-view__tag-list-item-name">{tag.name}</div>
                                                </div>
                                                <div class="prod-stats-view__tag-list-item-col prod-stats-view__tag-list-item-col--avg">
                                                    {tag.avg}
                                                </div>
                                                <div class="prod-stats-view__tag-list-item-col prod-stats-view__tag-list-item-col--percentage">
                                                    {tag.percent}
                                                </div>
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="prod-overview__bottom-row">
                        <!-- My Tags List -->
                        <div class="my-tags-list prod-overview__bento-box">
                            <div class="prod-overview__bento-box-header">
                                <h4>My Tags</h4>
                                <p>7 Tags</p>
                            </div>
                            <ul>
                                {#each tags as tag}
                                    <li class="my-tags-list__list-item">
                                        <div class="my-tags-list__list-item-color" style={`background-color: ${tag.color};`}>
                                        </div>
                                        <div class="my-tags-list__list-item-name">
                                            {tag.name}
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                        <!-- Weekly Avg. Line Graph -->
                        <div class="weekly-avg-graph prod-overview__bento-box">
                            <div class="prod-overview__bento-box-header">
                                <h4>Weekly Average</h4>
                                <p>Most focused on <strong>Tuesdays</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="stats__right">
                <div class="tag-panel bento-box">
                    <h4>Top Tags</h4>
                    <!-- My Top Tags -->
                    <div class="top-tags tag-panel__bento-box">
                        <div class="top-tags__distribution-vis">
                            <div class="top-tags__distribution-vis-data-point top-tags__distribution-vis-data-point--1"></div>
                            <div class="top-tags__distribution-vis-data-point top-tags__distribution-vis-data-point--2"></div>
                            <div class="top-tags__distribution-vis-data-point top-tags__distribution-vis-data-point--3"></div>
                            <div class="top-tags__distribution-vis-data-point top-tags__distribution-vis-data-point--4"></div>
                        </div>
                        <div class="top-tags__selected-tag-info-wrapper">
                            <div class="top-tags__selected-tag">
                                <div class="top-tags__selected-tag-color"></div>
                                <div class="top-tags__selected-tag-title">school.</div>
                            </div>
                            <div class="top-tags__selected-tag-info">
                                <div class="top-tags__selected-tag-info-avg">3h 31m</div>
                                <span>Avg. Daily Session</span>
                            </div>
                        </div>
                    </div>
                    <!-- Tag Overview -->
                    <div class="tag-overview">
                        <div class="tag-overview__header">
                            <h4>Tag Overview</h4>
                            <div class="tag-overview__dropdown-btn-container dropdown-container">
                                <button class="tag-overview__dropdown-btn dropdown-btn dropdown-btn--small trans-btn" on:click={() => { isTimeFrameListOpen = true }}>
                                    <div class="dropdown-btn__title">
                                        {newTag.name}
                                    </div>
                                    <div class="dropdown-btn__arrows">
                                        <div class="dropdown-btn__arrows-triangle-up">
                                            <i class="fa-solid fa-chevron-up"></i>
                                        </div>
                                        <div class="dropdown-btn__arrows-triangle-down">
                                            <i class="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </div>
                                </button>
                                {#if isTimeFrameListOpen}
                                    <ul use:clickOutside on:click_outside={() => isTimeFrameListOpen = false} class="dropdown-menu">
                                        {#each tags as tag, idx} 
                                            <li class={`dropdown-menu__option ${tag.name === newTag.name ? "dropdown-menu__option--selected" : ""}`}>
                                                <button class="dropdown-element" on:click={() => handleNewTagClicked(idx)}>
                                                    <p>{tag.name}</p>
                                                    <i class="fa-solid fa-check"></i>
                                                </button>
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                        </div>
                        <div class="tag-heat-map tag-panel__bento-box">
                            <h5>Heat Map</h5>
                        </div>
                        <div class="tag-bar-graph tag-panel__bento-box">
                            <div class="tag-bar-graph__header">
                                <h5>Monthly Trends</h5>
                                <div class="tag-bar-graph__dropdown-btn-container dropdown-container">
                                    <button class="tag-bar-graph__dropdown-btn dropdown-btn dropdown-btn--small trans-btn" on:click={() => { isTimeFrameListOpen = true }}>
                                        <div class="dropdown-btn__title">
                                            {newTag.name}
                                        </div>
                                        <div class="dropdown-btn__arrows">
                                            <div class="dropdown-btn__arrows-triangle-up">
                                                <i class="fa-solid fa-chevron-up"></i>
                                            </div>
                                            <div class="dropdown-btn__arrows-triangle-down">
                                                <i class="fa-solid fa-chevron-down"></i>
                                            </div>
                                        </div>
                                    </button>
                                    {#if isTimeFrameListOpen}
                                        <ul use:clickOutside on:click_outside={() => isTimeFrameListOpen = false} class="dropdown-menu">
                                            {#each tags as tag, idx} 
                                                <li class={`dropdown-menu__option ${tag.name === newTag.name ? "dropdown-menu__option--selected" : ""}`}>
                                                    <button class="dropdown-element" on:click={() => handleNewTagClicked(idx)}>
                                                        <p>{tag.name}</p>
                                                        <i class="fa-solid fa-check"></i>
                                                    </button>
                                                </li>
                                            {/each}
                                        </ul>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
 </div>

 <style lang="scss">
    $bento-box-padding: 7px;

    .modal-bg {
        overflow-y: scroll;
        overflow: hidden;
        &__content-title {
            margin-bottom: 10px;
        }
        &__content-copy {
            font-size: 1.2rem;
            font-weight: 300;
        }
        
    }
    .stats {
        width: 960px;
        height: 700px;
        display: flex;

        &__header {
            height: 12%;
        }
        &__left {
            width: 71%;
        }
        &__right {
            width: 29%;
        }

        .dropdown-container {
            position: relative;
        }
        .dropdown-btn {
            background-color: var(--modalBgAccentColor);
        }
        .dropdown-menu {
            top: 35px;
            width: 100%;
        }

        /* Dark Theme */
        &--dark .dropdown-btn {
            @include dropdown-btn-dark;
        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
    }
    /**** Left Side ****/
    .prod-overview {
        height: 86%;
        &__bento-box {
            width: 50%;
            height: 100%;
            background-color: var(--bentoBoxBgColor);
            padding: 15px 18px 0px 18px;
            border-radius: 15px;
            margin-right: $bento-box-padding;

            h4 {
                font-weight: 500;
                font-size: 1.34rem
            }
            p {
                font-size: 1.05rem;
                color: rgba(var(--textColor1), 0.45);
                font-weight: 400;
            }
            strong {
                color: rgba(var(--textColor1), 1);
                font-weight: 400;
                padding-left: 6px;
                font-size: 1.04rem;
            }
            span {

            }
        }
        &__bento-box-header {
            @include flex-container(baseline, space-between);
        }
        &__top-row {
            margin-bottom: $bento-box-padding;
        }
        &__top-row, &__bottom-row { 
            display: flex;
            height: 46.5%;
            width: 100%;
        }
        &__header {
            margin: 0px $bento-box-padding 18px 0px;
            @include flex-container(center, space-between);

            h2 {
                font-size: 1.45rem;
            }
        }
        /* Right Side Btns */
        &__time-frame-slider-wrapper {
            margin-right: 22px;
            span {
                font-size: 1.14rem;
                font-weight: 500;
                padding: 0px 11px;
            }   
            button {
                padding: 5px;
                color: rgba(var(--textColor1), 0.45);
                transition: 0.14s ease-in-out;
                font-size: 0.92rem;

                &:hover {
                    color: rgba(var(--textColor1), 1);
                }
                &:active {
                    scale: 0.9;
                }
            }
        }
        &__time-frame-dropdown-container {
            position: relative;
            transition: 0.15s ease-in-out;
        }
    }
    /* Graph View */
    .prod-graph-view {

    }
    /* Stats View */
    .prod-stats-view {
        background: none;
        padding: 0px;

        &__top-row {
            display: flex;
        }
        &__top-row, &__bottom-row {
            width: 100%;
            height: 41%;
        }
        &__bottom-row {
            height: 56%;
        }
        &__bento-box {
            background-color: var(--bentoBoxBgColor);
            border-radius: 10px;
            padding: 10px 18px 0px 15px;
            position: relative;

            h4 {
                font-size: 1.14rem;
            }
        }
        /* Session Average + Focus Time Average */
        &__stat {
            width: 50%;
            border-radius: 10px;
            
            &:first-child {
                margin-right: $bento-box-padding;
            }
        }
        &__stat-header {
            @include flex-container(center, space-between);
        }
        &__stat-header-icon {
            i {
                font-size: 1.6rem;
            }
        }
        &__stat-header-percentage {
            i {
                margin-right: 8px;
            }
            span {
                font-weight: 300;
            }
        }
        &__stat-header-time {
            color: rgba(var(--textColor1), 0.4);
            font-weight: 300;
        }
        &__stat-info {
            @include pos-abs-bottom-left-corner(12px, 15px);

            h5 {
                margin-bottom: 1px;
                font-size: 1.8rem;
                font-weight: 300;
            }
            span {
                color: rgba(var(--textColor1), 0.4);
                font-weight: 400;
            }
        }
        /* Tag Distribution List */
        &__tag-distribution {
            margin-top: $bento-box-padding;
            width: 100%;
            height: 100%;
        }
        &__tag-list-header {
            margin-top: 10px;
            display: flex;
            color: rgba(var(--textColor1), 0.45);
            font-weight: 300;
        }
        &__tag-list-header-item {
            font-size: 0.94rem;
            &--tag-name {
                width: 43%;
            }
            &--avg {
                text-align: center;
                width: 20%;
            }
            &--percentage {
                width: 37%;
                text-align: right;
            }
        }
        ul {
            margin-top: 14px;
            height: 64%;
            overflow-y: scroll;
        }
        &__tag-list-item {
            display: flex;
            margin-bottom: 8px;
        }
        &__tag-list-item-color {
            @include circle(5px);
        }
        &__tag-list-item-name {
            margin-left: 14px;
        }
        &__tag-list-item-col {
            font-weight: 300;
            &--tag-name {
                width: 43%;
                @include flex-container(center, _);
            }
            &--avg {
                text-align: center;
                width: 20%;
                color: rgba(var(--textColor1), 0.25);
            }
            &--percentage {
                width: 37%;
                text-align: right;
                color: rgba(var(--textColor1), 0.25);
            }
        }
    }
    /* My Tags */
    .my-tags-list {
        ul {
            margin-top: 20px;
            height: 85%;
            overflow-y: scroll;
        }
        &__list-item {
            @include flex-container(center, _);
            margin-bottom: 6px;
        }
        &__list-item-color {
            @include circle(7px);
            margin-right: 10px;
        }
        &__list-item-name {
            font-size: 1.2rem;
            color: rgba(var(--textColor1), 0.8);
        }
    }
    .weekly-avg-graph {
        
    }
    /**** Right Side ****/
    .tag-panel {
        height: 100%;
        padding: 16px 18px;
        border-radius: 15px;
        h4 {
            font-size: 1.32rem;
            font-weight: 500;
            margin-bottom: 11px;
        }

        &__bento-box {
            background-color: var(--hoverColor);
            border-radius: 14px;
            padding: 11px 14px;
            h5 {
                font-size: 1.15rem;
                font-weight: 500;
            }
        }
    }
    /* Top Tags */
    .top-tags {
        margin-bottom: 20px;

        &__distribution-vis {
            width: 100%;
            display: flex;
        }
        &__distribution-vis-data-point {
            border-radius: 10px;
            height: 4px;
            margin-bottom: 16px;

            &--1 {
                background-color: #A3C2FF;
                width: 20%;
            }
            &--2 {
                background-color: #949FFF;
                width: 50%;
            }
            &--3 {
                background-color: #BEA0FD;
                width: 15%;
            }
            &--4 {
                width: 15%;
                background-color: #E9A6D4;
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
            background-color: #A3C2FF;
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
    /* Tag Overview */
    .tag-overview {
        height: 72%;
        &__header {
            @include flex-container(center, space-between);
            margin-bottom: 12px;
        }
    }
    /* Heat Map */
    .tag-heat-map {
        margin-bottom: 10px;
        height: 60%;
    }
    /* Bar Graph */
    .tag-bar-graph {
        height: 40%;
        position: relative;

        &__header {
            @include flex-container(center, space-between);
        }
        .dropdown-btn {
            background-color: var(--hoverColor2);
        }
    }
 </style>

