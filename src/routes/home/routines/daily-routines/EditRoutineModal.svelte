<script lang="ts">
	import { onMount } from "svelte";
	import Modal from "../../../../components/Modal.svelte";
	import { InputManager, TextAreaManager, TextEditorManager } from "$lib/inputs";
	import { COLOR_SWATCHES, TEST_TAGS, clickOutside, getColorTrio } from "$lib/utils-general";
	import SvgIcon from "../../../../components/SVGIcon.svelte";
	import { Icon } from "$lib/enums";
	import { themeState } from "$lib/store";
	import DropdownList from "../../../../components/DropdownList.svelte";
	import DropdownBtn from "../../../../components/DropdownBtn.svelte";
	import TasksList from "../../../../components/TasksList.svelte";
	import { TEST_MILESTONES } from "$lib/utils-goals";
	import TimePicker from "../../../../components/TimePicker.svelte";

    let settingsOpen = false
    let coresOpen = false
    let colorsOpen = false
    let tagsOpen = false
    let startTimeOpen = false
    let endTimeOpen = false
    let routineListRef: HTMLElement

    let startTime = 420
    let endTime = 480

    $: isDarkTheme = $themeState.isDarkTheme

    const cores = [
        "Sleeping", "Working", "Mind", "Awake", "Body", "Self Care"
    ]

    const routine: RoutineBlock = {
        title: "Morning Routine",
        color: COLOR_SWATCHES.d[0],
        startTime: 0,
        endTime: 30,
        tag: TEST_TAGS[2],
        activity: null
    }
    const titleInput = (new InputManager({ 
        initValue: routine.title,
        placeholder: "Routine Title",
        maxLength: 100,
        id: "routine-title-input"
    })).state

    const description = (new TextEditorManager({ 
        initValue: "",
        placeholder: "Type description here...",
        maxLength: 500,
        id: "routine-description"
    })).state

    $: console.log($description.value)

    const routineColor = getColorTrio(routine.tag!.symbol.color, isDarkTheme)

    function onSettingsOptionsClicked(idx: number) {
        settingsOpen = false
    }
    function onCoresOptionListClicked(idx: number) {
        coresOpen = false
    }

    onMount(() => {
        console.log("Zz")
    })
</script>

<Modal options={{ borderRadius: "20px", overflowY: "hidden" }} onClickOutSide={() => {}}>
    <div 
        class="edit-routine"
        class:edit-routine--dark={isDarkTheme}
        class:edit-routine--light={!isDarkTheme}
    >
        <!-- Header -->
        <div class="edit-routine__header">
            <div class="edit-routine__header-left">
                <div class="edit-routine__color-dropdown-btn dropdown-btn">
                    <div class="edit-routine__color">
                    </div>
                </div>
                <div class="edit-routine__title-container">
                    <input 
                        type="text"
                        name="routine-title-input" 
                        id="routine-title-input"
                        aria-label="Title"
                        spellcheck="false"
                        value={$titleInput.value}
                        placeholder={$titleInput.placeholder}
                        maxlength={$titleInput.maxLength}
                        on:blur={(e) => $titleInput.onBlurHandler(e)}
                        on:input={(e) => $titleInput.onInputHandler(e)}
                    >
                </div>
            </div>
            <button 
                class="edit-routine__settings-dropdown-btn settings-btn settings-btn--bg"
                on:click={() => settingsOpen = !settingsOpen}
            >
                <SvgIcon icon={Icon.Settings} options={{ opacity: 0.4}}/>
            </button>
            <!-- Settings Dropdown -->
            <DropdownList 
                isHidden={!settingsOpen} 
                options={{
                    listItems: [{ name: "Duplicate Rouine" }, { name: "Delete Routine" }],
                    onListItemClicked: onSettingsOptionsClicked,
                    position: { top: "45px", right: "0px" },
                    onClickOutside: () => settingsOpen = false
                }}
            />
        </div>
        <!-- Routine Info -->
        <div class="edit-routine__info">
            <div class="edit-routine__info-row">
                <div class="edit-routine__info-title">
                    Tag
                </div>
                <div class="edit-routine__info-value">
                    <div class="edit-routine__tag tag">
                        <div class="tag">
                            <div 
                                class="tag__content"
                                style:--tag-color-primary={routine.tag?.symbol.color.primary}
                                style:--tag-color-1={routineColor[0]}
                                style:--tag-color-2={routineColor[1]}
                                style:--tag-color-3={routineColor[2]}
                            >
                                <span class="tag__symbol">
                                    {routine.tag?.symbol.emoji}
                                </span>
                                <div class="tag__title">
                                    {routine.tag?.name}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Core -->
            <div class="edit-routine__info-row">
                <div class="edit-routine__info-title">
                    Core
                </div>
                <div class="edit-routine__info-value">
                    <div class="edit-routine__core">
                        <DropdownBtn 
                            isActive={coresOpen}
                            options={{
                                onClick: () => coresOpen = !coresOpen,
                                // arrowOnHover: true,
                                title: cores[1],
                                styles: { fontSize: "1.18rem", padding: "4px 12px 4px 11px" }
                            }} 
                        />
                        <DropdownList 
                            isHidden={!coresOpen} 
                            options={{
                                listItems: cores.map((core) => ({ name: core })),
                                pickedItemIdx: 1,
                                onListItemClicked: onCoresOptionListClicked,
                                position: { top: "32px", left: "0px" },
                                onClickOutside: () => coresOpen = false
                            }}
                        />
                    </div>
                </div>
            </div>
            <!-- Time Frame -->
            <div class="edit-routine__info-row">
                <div class="edit-routine__info-title">
                    Time Frame
                </div>
                <div class="edit-routine__info-value">
                    <div class="edit-routine__time">
                        <div class="edit-routine__time-input-container">
                            <TimePicker 
                                options={{ start: startTime, max: endTime }}
                                onSet={(time) => { 
                                    startTime = time 
                                }}
                            />
                        </div>
                        <span>to</span>
                        <div class="edit-routine__time-input-container">
                            <TimePicker 
                                options={{ start: endTime, min: startTime }}
                                onSet={(time) => endTime = time}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Description -->
        <div class="edit-routine__description">
            <div class="edit-routine__description-header">
                <div class="edit-routine__info-icon">
                    <i class="fa-solid fa-align-left"></i>
                </div>
                <div class="edit-routine__info-title">Description</div>
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div 
                class="edit-routine__description-text-editor text-editor"
                data-placeholder={$description.placeholder}
                contenteditable
                bind:innerHTML={$description.value}
                on:paste={(e) => $description.onPaste(e)}
                on:input={(e) => $description.onInputHandler(e)}
                on:focus={(e) => $description.onFocusHandler(e)}
                on:blur={(e)  => $description.onBlurHandler(e)}
            >
            </div>
        </div>
        <!-- List -->
        <div class="edit-routine__list">
            <div class="edit-routine__list-header">
                <div class="edit-routine__info-icon">
                    <i class="fa-solid fa-list-ol"></i>
                </div>
                <div class="edit-routine__info-title">Action Items</div>
            </div>
            <div class="edit-routine__list-container" bind:this={routineListRef}>
                {#if routineListRef}
                    <TasksList 
                        options={{
                            id:   "edit-goal",
                            type: "subtasks",
                            containerRef: routineListRef,
                            tasks: TEST_MILESTONES.map((t) => ({ ...t, subtasks: [] })),
                            styling: {
                                task:             { fontSize: "1.23rem", height: "38px", padding: "9px 0px 2px 0px" },
                                subtask:          { fontSize: "1.23rem", padding: "8px 0px 8px 0px" },
                                description:      { margin: "4px 0px 2px 0px"},
                                descriptionInput: { fontSize: "1.23rem" }
                            },
                            contextMenuOptions: { width: "170px" },
                            ui:{ 
                                sidePadding: "25px", isMin: false, hasTaskDivider: false,
                                listHeight: "100%"
                            }
                        }}
                    />
                {/if}
            </div>
        </div>
    </div>
</Modal>

<style lang="scss">
    @import "../../../../scss/inputs.scss";
    @import "../../../../scss/dropdown.scss";

    .edit-routine {
        height: 75vh;
        width: clamp(420px, 70vw, 600px);
        padding: 0px;

        &--light {

        }

        /* Header */
        &__header {
            @include flex(center, space-between);
            margin: 0px 0px 14px -7px;
            position: relative;
            width: 100%;
            padding: 18px 20px 0px 25px;
            height: 40px;

            &-left {
                @include flex(center);
                width: 100%;
            }
        }
        /* Color */
        &__color {
            background-color: #A3C2FF;
            @include circle(5px);
        }
        &__color-dropdown-btn {
            @include center;
            padding: 8px;
            margin-right: 4.5px;
            
            &:hover {
                @include txt-color(0.08, "bg");
                transition: 0.01s ease-in-out;
            }
            &:active {
                transform: scale(0.97);
            }
        }
        /* Title */
        &__title-container {
            font-family: "DM Sans";
            width: 100%;
        }
        &__title-container input {
            @include text-style(1, 300, 1.64rem);
            width: fit-content;
            max-width: 100%;
            
            &::placeholder {
                @include text-style(0.2);
            }
            &:active {
                transition: 0.4s ease-in-out;
                transform: scale(0.99);
            }
        }
        /* Dropdowns */
        &__settings-dropdown {
            @include pos-abs-top-right-corner(28px);
        }
        &__color-dropdown {
            @include pos-abs-top-left-corner(28px);
        }

        /* Info */
        &__info {
            height: 105px;
            padding: 0px 20px 10px 25px;
        }
        &__info-row {
            margin-bottom: 9px;
            @include flex(center);
        }
        &__info-title {
            @include text-style(0.35, 400, 1.24rem);
            width: 110px;

            &:last-child {
                width: auto;
            }
        }
        &__info-icon {
            @include text-style(0.3, 400, 1.24rem);
            margin-right: 13px;;
        }
        &__info-value {
            position: relative;
        }
        &__tag .tag__content {
            padding: 3.5px 9px 3.5px 9px;
        }
        &__tag .tag__title {
            font-size: 1.18rem;
        }
        &__core {
            @include text-style(0.65, 400, 1.33rem);
            position: relative;
        }
        &__time {
            @include flex(center);
            span {
                margin: 0px 10px;
                opacity: 0.4;
            }
        }
        &__time-input-container {
        }
        &__time-from {
        }
        &__time-to {

        }
        &__description {
            padding: 5px 20px 12px 25px;
            height: 80px;
        }
        &__description-header {
            @include flex(center);
            margin-bottom: 8px;
        }
        &__description-text-editor {
            max-width: 100%;
            @include text-style(0.8, 400, 1.24rem);
        }
        &__list-header {
            padding: 30px 20px 8px 25px;
            @include flex(center);
        }
        &__list {
            height: calc(100% - (90px + 40px + 105px + 105px));
            width: 100%;
        }
        &__list-container {
            position: relative;
            height: 100%;
            max-width: 100%;
        }
    }
</style>