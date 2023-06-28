<script lang="ts">
    import { onMount } from 'svelte';
	import { getCurrentDate, getCurrentTime } from "$lib/helper";
	import { colorThemeState } from '$lib/store';

    export let isTaskMenuExpanded: Boolean;

    const hasActiveSession = false;
    const sessionIDClicked = 1;
    let flag = false;
    const isEmpty = false;
    let doUse12HourFormat = true;

    let currentTime = getCurrentTime(doUse12HourFormat);
    let currentDate = getCurrentDate();

    let isLightTheme = false

    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    const prevSessionClickedHandler = () => {
        flag = !flag;
    }
    const newTaskButtonHandler = () => {
        console.log("SDG");
    }
    const handleNewTaskSubmit = (event: Event) => {
        event.preventDefault();
        console.log("SwefweweDG");
    }
    const changeTimeFormat = () => {
        doUse12HourFormat = !doUse12HourFormat;
        currentTime = getCurrentTime(doUse12HourFormat);
    }
    onMount(() => {
        const intervalId = setInterval(() => {
            currentDate = getCurrentDate();
            currentTime = getCurrentTime(doUse12HourFormat);
        }, 1000);
    
        return () => clearInterval(intervalId);
    });
</script>

<div class={`task-view ${!isTaskMenuExpanded ? "task-view--minimize" : ""}`}>
    <div class="task-view__header task-view__header--default"> 
        <img class="task-view__header-img" src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/287d3559037917.5a130f45904d5.gif" alt="">
        <div class="flx flx--space-between">
            <h2>Hey, Kyle!</h2>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="task-view__header-today-time" on:click={() => changeTimeFormat()} >
                <i class="fa-solid fa-moon"></i>
                <p class={`paragraph-4 ${isLightTheme ? "paragraph-4--light-theme" : ""}`}>{currentTime}</p>
            </div>
        </div>
        <p class="task-view__header-today-date subheading-1">{currentDate}</p>
    </div>
</div>

<style lang="scss">
    .task-view {
        width: 100%;
        overflow: hidden;
        color: rgb(var(--textColor1));
        
        &--minimize {
            padding: 0px 25% 0px 17%;
        }
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
        &__header-today-date {
            padding: 0px 7%;
            opacity: 0.6;
        }
        &__new-task-btn {
            &--minimize {
                border-radius: 100%;
                width: 100%;
                padding: 0px;
                aspect-ratio: 1 / 1;
            }
            &--minimize > p {
            }
            &--minimize > p:first-child {
                display: none;
            }
        }
    }

</style>