<script lang="ts">
    import { TextEditorManager } from "../../../lib/inputs"
    import { getFontFamilyFromStyle } from "../../../lib/utils-general"
    import { DAYS_OF_WEEK, formatDatetoStr } from "../../../lib/utils-date"

    import DayEntry from "./DayEntry.svelte"
	import ImgStampModal from "./HighlightImgModal.svelte"
    import TasksList from "../../../components/TasksList.svelte"

    export let options
    export let activity
    
    $: showHighlight = options?.showHighlight ?? true
    $: headingFontStyle = options?.fontStyle ?? "basic"
    $: todos = activity.tasks ?? []

    const DESCRIPTION_ID = "day-view-text"
    const SMALL_MAX_WIDTH = 540

    let renderFlag = false
    let width = 0
    let marginTextHeight = 0
    let entryModal = false
    let imgModal = false
    let currDate = activity.date

    let todoListContainer: HTMLElement
    let text = activity.text

    let editor = new TextEditorManager({ 
        placeholder: "Write something here...",
        maxLength: 200,
        id: DESCRIPTION_ID,
        handlers: {
            onInputHandler: (_, val) => {
                activity.text = val
            }
        }
    })

    $: if (currDate !== activity.date) {
        renderFlag = !renderFlag
        editor.updateText(activity.text)

        currDate = activity.date
    }

    function onDayEntryUpdate(updatedData: DayEntryUpdatePayload) {
        activity.img = updatedData.img 
        activity.thoughtEntry = updatedData.thoughtEntry

        activity = {
            ...activity,
            ...updatedData
        }

        entryModal = false
    }

</script>

<div 
    class="day-view"
    class:day-view--small={width < SMALL_MAX_WIDTH}
    style:--heading-font={getFontFamilyFromStyle(headingFontStyle)}
    bind:clientWidth={width}
>
    <div class="day-view__content">
        <div 
            class="day-view__left"
            style:width={`calc(100% - ${showHighlight && activity.thoughtEntry ? 200 - 30 : 0}px)`}
        >
            <div class="day-view__header">
                <div 
                    style:position="relative"
                    style:flex="1"
                >
                    <div class="day-view__dow">
                        {DAYS_OF_WEEK[activity.date.getDay()]}
                    </div>  
                    <div class="day-view__date">
                        {formatDatetoStr(activity.date, { day: "numeric", month: "long" })}
                    </div>  
                    <div 
                        id={DESCRIPTION_ID}
                        class="day-view__text text-editor"
                        contenteditable
                        spellcheck="false"
                        placeholder="write something here"
                    >
                        {text}
                    </div>
                    <div 
                        title="Focus Time"
                        class="day-view__focus"
                    >
                        <span>3h 22m</span>
                    </div>
                </div>
                {#if showHighlight && activity.highlightImg && !activity.thoughtEntry}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        class="day-view__img day-view__img--float"
                        on:click={() => imgModal = true}
                    >
                        <img src={activity.highlightImg.src} alt="">
                    </div>
                {/if}
            </div>
            <div 
                bind:this={todoListContainer}
                class="day-view__todos"
            >
                {#key renderFlag}
                    <TasksList
                        tasks={todos}
                        onTaskChange={(_todos) => todos = _todos}
                        options={{
                            id: "day-todos",
                            type: "day-view", 
                            settings: {
                                maxHeight: "500px",
                                maxDepth: 2,
                                addBtn: {
                                    doShow: true,
                                    text: "Add Task"
                                }
                            },
                            ui: { 
                                hasTaskDivider: true
                            },
                            containerRef: todoListContainer
                        }}
                    />
                {/key}
            </div>
        </div>
        {#if showHighlight && activity.thoughtEntry}
            {@const { title, text, fontStyle } = activity.thoughtEntry}
            <div 
                class="day-view__right"
                style:margin-top={"5px"}
            >
                <div class="day-view__highlight">
                    {#if activity.highlightImg}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div 
                            class="day-view__img"
                            style:margin-bottom={"6px"}
                            on:click={() => imgModal = true}
                        >
                            <img src={activity.highlightImg.src} alt="">
                        </div>
                    {/if}
                    <div class="day-view__highlight-text">
                        <span>Daily Entry</span>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div 
                            class="day-view__journal-title"
                            style:font-family={getFontFamilyFromStyle(fontStyle)}
                            on:click={() => entryModal = true}
                        >
                            {title}
                        </div>
                        <div 
                            class="day-view__text-snippet"
                            class:day-view__text-snippet--fade={marginTextHeight > 60}
                            bind:clientHeight={marginTextHeight}
                        >
                            {@html text}
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>  
</div>

{#if imgModal} 
    <ImgStampModal 
        img={activity.highlightImg}
        onClickOutside={() => {
            imgModal = false
        }}
    />
{/if}
{#if entryModal} 
    <DayEntry 
        data={{
            img: activity.highlightImg,
            date: activity.date,
            thoughtEntry: activity.thoughtEntry
        }}
        onUpdate={onDayEntryUpdate}
    />
{/if}

<style lang="scss">
    @import "../../../scss/inputs.scss";

    .day-view {
        &--small &__content {
            display: block;
        }
        &--small &__left {
            width: 100% !important;
        }
        &--small &__right {
            margin: 34px 0px 0px 0px !important;
            width: 100%;
        }
        &--small &__highlight img {
            @include square(150px, 10px);
            margin-right: 30px;
        }
        &--small &__highlight {
            display: flex;
        }
        &--small &__header {
            flex-direction: column-reverse;
        }
        &--small &__header > div {
            width: 100%;
        }
        &--small &__header &__img {
            @include square(120px, 10px);
            margin: 10px 0px 15px 0px;
        }

        &__content {
            display: flex;
        }
        &__left {
            position: relative;
        }
        &__right {
            margin-left: 30px;
            width: 200px;
        }
        &__header {
            @include flex(flex-start, space-between)
        }
        &__dow {
            @include text-style(0.3, _, 2rem, var(--heading-font));
        }   
        &__date {
            @include text-style(1, _, 3.5rem, var(--heading-font));
            margin: -2px 0px 4px 0px;
        }
        &__text {
            @include text-style(0.4, 400, 1.6rem);
            max-width: 650px !important;
            word-break: break-word;
            margin-bottom: 3px;
            max-height: 300px;
            overflow-y: scroll;
        }

        div[contenteditable]:empty:before {
            opacity: 0.35 !important;
        }
        &__empty-tasks {
            @include text-style(0.145, 400, 1.55rem, "DM Mono");
        }
        &__todos {
            margin: -5px 0px 0px -15px;
        }
        &__focus {
            @include text-style(0.2, 400, 1.4rem, "DM Mono");
            @include abs-top-right(2px, 12px);
        }
        &__highlight {
            span {
                display: block;
                @include text-style(0.2, 500, 1.4rem, "Manrope");
                margin: 0px 0px 15px 0px;
            }
        }
        &__img {
            cursor: pointer;
            
            img {
                transition: 0.18s transform cubic-bezier(.4, 0, .2, 1);
                @include square(100%, 2px);
                aspect-ratio: 1/1;
                object-fit: cover;
                border-radius: 10px;
                border: 3.5px solid white;
            }
            img:hover {
                transform: scale(1.01) rotate(2deg);
            }
            img:active {
                transform: scale(0.99) rotate(2deg) !important;
            }
        }
        &__img--float {
            width: 100px;
            height: 100px;
            margin-left: 10px;
            border-width: 2px;
            min-width: 100px;
        }
        &__journal-title {
            @include text-style(1, 500, 2.5rem);
            margin: -8.5px 0px 8px 0px;
            @include truncate-lines(3);
            cursor: pointer;

            &:hover {
                text-decoration: underline;
            }
        }   
        &__text-snippet {
            @include text-style(0.4, 400, 1.6rem);
            word-break: break-word;

            &--fade {
                height: 100px;
                mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
                -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
            }
        }
    }
</style>