<script lang="ts">
	import { COLOR_SWATCHES, TEST_TAGS, getColorTrio } from '$lib/utils-general'
	import { onMount } from 'svelte'
	import { RoutinesManager } from '$lib/routines-manager'
	import { themeState } from '$lib/store'
	import { getTimeFromIdx, minsToHHMM } from '$lib/utils-date'
	import EditRoutineModal from './EditRoutineModal.svelte'
	import { InputManager, TextEditorManager } from '$lib/inputs';
	import type { Writable } from 'svelte/store';
	import SvgIcon from '../../../../components/SVGIcon.svelte';
	import DropdownList from '../../../../components/DropdownList.svelte';
	import { Icon } from '$lib/enums';
	import { ROUTINES } from '$lib/utils-routines';

    // export let data: PageData;
    let manager = new RoutinesManager(ROUTINES)
    let timeBoxElem: HTMLElement
    let hozLinesContainerWidth
    let isEditModalOpen = false
    let settingsOpen = false

    let _userRoutines  = manager.userRoutines!
    let _focusedRoutineElems = manager.focusedRoutineElems
    let _focusedRoutine = manager.focusedRoutine
    let _currCores = manager.currCores
    let _newBlock = manager.newBlock
    let _tagBreakdown = manager.currTagBreakdown
    let _editingBlock = manager.editingBlock
    let _editContext = manager.editContext

    const BLOCKS_LEFT_OFFSET = 8
    const BLOCKS_CONTAINER_LEFT_OFFSET = 45

    $: selectedTimeFrame = isViewingCore ? "Cores" : "Tags"

    $: userRoutines   = $_userRoutines as DailyRoutine[]
    $: focusedRoutineElems  = $_focusedRoutineElems ?? []
    $: focusedRoutine = $_focusedRoutine
    $: currCores      = $_currCores
    $: editingBlock   = $_editingBlock
    $: tagBreakdown   = $_tagBreakdown ?? []
    $: editContext    = $_editContext
    $: newBlock       = $_newBlock
    $: isDarkTheme    = $themeState.isDarkTheme
    $: focusedId      = $_focusedRoutine?.id ?? "0"

    $: initTextEditors(focusedRoutine)

    let chosenId      = "0"
    let isViewingCore = true
    let timeBoxElemWidth = 0

    let titleInput: Writable<InputManager>
    let description: Writable<InputManager>

    function initTextEditors(focusedRoutine: DailyRoutine | null) {
        return

        titleInput = (new InputManager({ 
            initValue: focusedRoutine.name,
            placeholder: "Routine Title",
            maxLength: 100,
            id: "routine-title-input",
            doAllowEmpty: false,
            handlers: {
                onInputHandler: manager.updateTitle
            }
        })).state
    
        description = (new TextEditorManager({ 
            initValue: focusedRoutine.description,
            placeholder: "Type description here...",
            maxLength: 500,
            id: "routine-description",
            handlers: {
                onInputHandler:  manager.updateDescription
            }
        })).state
    }

    function onMadeChanges(routineBlock: RoutineBlockElem) {
        closeEditModal(routineBlock)
    }
    function closeEditModal(routineBlock: RoutineBlockElem | null) {
        manager.onEditModalClose(routineBlock)
        isEditModalOpen = false
    }
    function getBlockStyling(height: number) {
        const classes: string[] = []

        if (height < 12) {
            classes.push("routine-time-blocks__block--xsm")
        }
        if (height < 20) {
            classes.push("routine-time-blocks__block--sm")
        }
        if (height < 34) {
            classes.push("routine-time-blocks__block--md")
        }
        return classes.join(" ")
    }
    
    onMount(() =>{
        requestAnimationFrame(() => {
            manager.initContainer(timeBoxElem)
            manager.initDailyRoutines(ROUTINES[0].id)
        })
    })
</script>

<div 
    class="routines"
    class:routines--light={!isDarkTheme}
    class:routines--dark={isDarkTheme}
>
    <!-- Routines List -->
    <div class="routines__collection">
        <ul>
            {#each userRoutines as routine}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li 
                    class="routines__routine-item" 
                    class:routines__routine-item--chosen={routine.id === chosenId}
                    class:routines__routine-item--clicked={routine.id === focusedId}
                    on:click={() => manager.initCurrentDailyRoutine(routine.id)}
                >
                    <span>
                        {routine.name}
                    </span>
                    <div class="routines__routine-item-check">
                        <i class="fa-solid fa-check"></i>
                    </div>
                </li>
            {/each}
        </ul>
    </div>
    <div class="routines__divider routines__divider--first"></div>
    <!-- Picked Routine Details -->
    <div 
        class="routine"
        class:routine--dark={isDarkTheme}
    >
        <div class="routine__details">
            {#if $titleInput}
                <div class="routine__details-header">
                    <input 
                        type="text"
                        name="routine-title-input" 
                        id="routine-title-input"
                        class="routine__title"
                        aria-label="Title"
                        spellcheck="false"
                        value={$titleInput.value}
                        placeholder={$titleInput.placeholder}
                        maxlength={$titleInput.maxLength}
                        on:blur={(e) => $titleInput.onBlurHandler(e)}
                        on:input={(e) => $titleInput.onInputHandler(e)}
                    >
                    <button 
                        class="routine__settings-btn dropdown-btn dropdown-btn--settings"
                        id={"routine-settings--dropdown-btn"}
                        on:click={() => settingsOpen = !settingsOpen}
                    >
                        <SvgIcon icon={Icon.Settings} options={{ opacity: 0.4}}/>
                    </button>
                    <!-- Settings Dropdown -->
                    <DropdownList 
                        id={"edit-routine-settings"}
                        isHidden={!settingsOpen} 
                        options={{
                            listItems: [{ name: "Duplicate Routine" }, { name: "Delete Routine" }],
                            onListItemClicked: (e, idx) => manager.onSettingsOptionClicked(idx),
                            position: { top: "30px", right: "0px" },
                            styling: { width: "140px" },
                            onClickOutside: () => settingsOpen = false
                        }}
                    />
                </div>
                <div 
                    class="routine__description text-editor"
                    aria-label="Description"
                    data-placeholder={$description.placeholder}
                    contenteditable
                    bind:innerHTML={$description.value}
                    on:paste={(e) => $description.onPaste(e)}
                    on:input={(e) => $description.onInputHandler(e)}
                    on:focus={(e) => $description.onFocusHandler(e)}
                    on:blur={(e)  => $description.onBlurHandler(e)}
                >
                </div>
            {/if}
        </div>
        <!-- Breakdown -->
        <div class="routine__breakdown">
            <!-- Cores -->
            <div class="routine__core-breakdown">
                <h3>Routine Cores</h3>
                {#if currCores}
                    <div class="routine__cores">
                        <div class="routine__cores-col">
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Sleeping</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.sleeping.totalTime)}
                                </div>
                            </div>
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Awake</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.awake.totalTime)}
                                </div>
                            </div>
                        </div>
                        <div class="routine__cores-col-divider"></div>
                        <div class="routine__cores-col">
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Working</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.working.totalTime)}
                                </div>
                            </div>
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Self-Care</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.selfCare.totalTime)}
                                </div>
                            </div>
                        </div>
                        <div class="routine__cores-col-divider"></div>
                        <div class="routine__cores-col">
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Mind</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.mind.totalTime)}
                                </div>
                            </div>
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Body</div>
                                <div class="routine__cores-value">
                                    {minsToHHMM(currCores.body.totalTime)}
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
            <!-- Tag Breakdown -->
            <div class="routine__tag-breakdown">
                <h3>Tag Breakdown</h3>
                {#each tagBreakdown as tagData}
                    {@const colorTrio = getColorTrio(tagData.tag.symbol.color, !isDarkTheme)}
                    <div class="routine__tag-row">
                        <div 
                            class="tag"
                            style:--tag-color-primary={tagData.tag.symbol.color.primary}
                            style:--tag-color-1={colorTrio[0]}
                            style:--tag-color-2={colorTrio[1]}
                            style:--tag-color-3={colorTrio[2]}
                        >
                            <span class="tag__symbol">
                                {tagData.tag.symbol.emoji}
                            </span>
                            <div class="tag__title">
                                {tagData.tag.name}
                            </div>
                        </div>
                        <div class="routine__tag-stat">
                            {minsToHHMM(tagData.data.totalTime)}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
    <div class="routines__divider routines__divider--last"></div>
    <!-- Picked Routine Time Blocks -->
    <div 
        class="routines__time-box-container" 
        class:routines__time-box-container--editing={editContext}
        bind:this={timeBoxElem}
        bind:clientWidth={timeBoxElemWidth}
        on:mousemove={manager.timeBoxMouseMove}
    >
        <div class="routines__time-box">
            <div 
                id={manager.ROUTINE_BLOCKS_CONTAINER_ID}
                class="routine-time-blocks"
                class:routine-time-blocks--editing={editContext}
                class:routine-time-blocks--light={false}
                style:--left-offset={`${BLOCKS_CONTAINER_LEFT_OFFSET}px`}
                on:pointerdown={(e) => manager.onTimeBoxPointerDown(e)}
            >
                {#each focusedRoutineElems as block (block.id)}
                    {@const colorTrio = getColorTrio(block.color, false)}
                    {@const isEditingBlock = editingBlock?.id === block.id && editContext === "lift"}

                    <!-- Routine Block -->
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        id={`daily-routine-block--${block.id}`}
                        class={`routine-time-blocks__block ${getBlockStyling(block.height)}`}
                        class:routine-time-blocks__block--lift-edit={isEditingBlock}
                        style:top={`calc(${block.yOffset}px`}
                        style:--left-x-offset={`${block.xOffset}px`}
                        style:--block-height={`${block.height}px`}
                        style:--block-color-1={colorTrio[0]}
                        style:--block-color-2={colorTrio[1]}
                        style:--block-color-3={colorTrio[2]}
                        title={`${block.title} \n${block.startTimeStr} - ${block.endTimeStr}`}
                        on:mousedown={(e) => manager.onBlockPointerDown(e, block.id)}
                    >
                        <div class="routine-time-blocks__block-content">
                            <div class="flx flx--algn-center">
                                <span class="routine-time-blocks__block-title">
                                    {block.title}
                                </span>
                            </div>
                            <div class="routine-time-blocks__block-time-period">
                                <span>{block.startTimeStr}</span>
                                <span>-</span>
                                <span>{block.endTimeStr}</span>
                            </div>
                        </div>
                        <div class="routine-time-blocks__block-spine"></div>
                    </div>
                {/each}

                <!-- New Block  -->
                {#if newBlock}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    {@const colorTrio = getColorTrio(newBlock.color, !isDarkTheme)}
                    <div 
                        class={`routine-time-blocks__block ${getBlockStyling(newBlock.height)}`}
                        id="dummy-block"
                        style:top={`${newBlock.yOffset}px`}
                        style:--block-height={`${newBlock.height}px`}
                        style:--block-color-1={colorTrio[0]}
                        style:--block-color-2={colorTrio[1]}
                        style:--block-color-3={colorTrio[2]}
                        title="Untitled Block"
                    >
                        <div class="routine-time-blocks__block-content">
                            <div class="flx flx--algn-center">
                                <span class="routine-time-blocks__block-title">
                                    {newBlock.title}
                                </span>
                            </div>
                            <div class="routine-time-blocks__block-time-period">
                                <span>{newBlock.startTimeStr}</span>
                                <span>-</span>
                                <span>{newBlock.endTimeStr}</span>
                            </div>
                        </div>
                        <div class="routine-time-blocks__block-spine"></div>
                    </div>
                {/if}

                <!-- Drop Area Block -->
                {#if editingBlock && editContext === "lift"}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    {@const colorTrio = getColorTrio(editingBlock.color, !isDarkTheme)}
                        <div 
                            class={`routine-time-blocks__block ${getBlockStyling(editingBlock.height)}`}
                            class:routine-time-blocks__block--drop-area={true}
                            id="drop-area-block"
                            style:top={`${editingBlock.yOffset}px`}
                            style:--block-height={`${editingBlock.height}px`}
                            style:--block-color-1={colorTrio[0]}
                            style:--block-color-2={colorTrio[1]}
                            style:--block-color-3={colorTrio[2]}
                            title="Untitled Block"
                        >
                            <div class="routine-time-blocks__block-content">
                                <div class="flx flx--algn-center">
                                    <span class="routine-time-blocks__block-title">
                                        {editingBlock.title}
                                    </span>
                                </div>
                                <div class="routine-time-blocks__block-time-period">
                                    <span>{editingBlock.startTimeStr}</span>
                                    <span>-</span>
                                    <span>{editingBlock.endTimeStr}</span>
                                </div>
                            </div>
                            <div class="routine-time-blocks__block-spine"></div>
                        </div>
                {/if}
            </div>
           <!-- Hour Blocks -->
            <div class="hour-blocks-container scroll-bar-hidden" >
                <div class="hour-blocks">
                    {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                        {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                        {@const height = (60 / 1440) * 100}
                        <div 
                            class="hour-blocks__block"
                            style:top={`calc(${headOffsetPerc}% + 3px)`}
                            style:height={`${height}%`}
                        >
                            <span>{getTimeFromIdx(timeIdx)}</span>
                            <div class="hour-blocks__block-vert-divider">
                                <svg xmlns="http://www.w3.org/2000/svg" width="2" height="27" viewBox="0 0 0 0" fill="none">
                                    <path d="M1.25684 0.614746V 28" stroke-width="1" stroke-dasharray="2 2"/>
                                </svg>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
            <!-- Hoz Lines -->
            <div class="hoz-lines-container" bind:clientWidth={hozLinesContainerWidth}>
                <div class="hoz-lines">
                    {#if timeBoxElem}
                        {@const width = hozLinesContainerWidth}
                        {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                            {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                            {@const height = (60 / 1440) * 100}
                            <div 
                                class="hoz-lines__line"
                                style:top={`calc(${headOffsetPerc}% + 3px)`}
                                style:height={`${height}%`}
                            >
                                <div class="hoz-lines__line-content">
                                    <svg xmlns="http://www.w3.org/2000/svg" width={width} height="2" viewBox={`0 0 ${width} 2`} fill="none">
                                        <path d={`M0 1H ${width}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                    </svg>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

{#if editContext === "details" && editingBlock}
    <EditRoutineModal 
        block={editingBlock}
        onCancel={() => closeEditModal(null)}
        {onMadeChanges}
    />
{/if}

<style lang="scss">
    @import "../../../../scss/day-box.scss";
    @import "../../../../scss/dropdown.scss";
    @import "../../../../scss/inputs.scss";
    @import "../../../../scss/components/routines.scss";

    $hour-blocks-top-offset: 55px;
    $hour-block-height: 50px;

    $xlg-blocks-left-offset: 30px;
    $lg-blocks-left-offset: 20px;
    $md-blocks-left-offset: 30px;
    $sm-blocks-left-offset: 8px;

    .routines {
        display: flex;
        width: 100%;
        height: calc(100% - 72px);

        &--light {

        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &--dark .dropdown-btn {
            @include dropdown-btn-dark;
        }

        &__collection {
            width: clamp(170px, 20%, 195px);
            h3 {
                @include text-style(1, 400, 1.7rem);
                margin-bottom: 12px;
            }
            ul {
                width: 100%;
            }
        }
        &__routine-item {
            margin: 0px 0px 1px -12px;
            padding: 5.5px 12px;
            border-radius: 8px;
            transition: 0.03s ease-in-out;
            cursor: pointer;
            opacity: 0.8;
            @include flex(center, space-between);
            @include elipses-overflow;

            &--chosen &-check {
                @include visible;
            }
            &--clicked {
                opacity: 1;
                @include txt-color(0.03, "bg");
            }
            &--clicked span {
                opacity: 0.9 !important;
            }
            
            &:active {
                transform: scale(0.995);
            }
            &:hover {
                opacity: 1;
                @include txt-color(0.03, "bg");
            }
            &:hover span {
                opacity: 0.9;
            }

            span {
                @include text-style(_, 300, 1.28rem, "DM Mono");
                opacity: 0.4;
            }
        }
        &__routine-item-check {
            @include text-style(0.6, 300, 1.3rem);
            @include not-visible;
        }
        &__divider {
            @include divider(0.04, calc(100% - 20px), 0.5px);
            margin: 0px min(4%, 32px);

            &--first {
                margin-left: min(4%, 20px);
            }
        }
        &__time-box-container {
            flex: 1;
            position: relative;
            height: calc(100% - 10px);
            overflow-y: scroll;
            overflow-x: hidden;
            padding-bottom: 20px;

            &--editing * {
                user-select: none !important;
            }
        }
        &__time-box {
            width: 100%;
            display: flex;
            height: calc(($hour-block-height * 24));
            padding-right: 20px;
        }
        .routine {
            width: clamp(270px, 30%, 320px);
            position: relative;
        }
    }

    /* Customizization from Resuable Stylings */
    .routine {
        &__breakdown h3 {
            @include text-style(0.8, 400, 1.32rem);
            margin-bottom: 11px;
        }
        &__tag-breakdown h3 {
            margin-bottom: 14px;
        }
    }

    .routine-time-blocks {
        @include pos-abs-top-left-corner(-2px, var(--left-offset));
        width: calc(100% - var(--left-offset));
        height: calc(($hour-block-height * 24));
        
        &--grabbing {
            cursor: grabbing;
        }
        &__block {
            width: 80%;
            max-width: 240px;
            $lg-blocks-left-offset: 20px;
        }
        &__block--lift-edit {
            left: var(--left-x-offset) !important;
        }
    }
    .routine-time-blocks {
    }
    .hour-blocks {
        height: calc(($hour-block-height * 24));
        width: 50px;
        
        &-container {
            width: 50px;
            overflow: hidden;
        }
        &__blocks {
            height: calc(($hour-block-height * 24));
            width: 50px;
        }
        &__block {
            width: 40px;
            left: -5px;
        }
        &__block-vert-divider {
            height: 28px;
            opacity: 0.5;
        }
        &__block span {
            width: 40px;
        }
    }
    .hoz-lines {
        height: 100%;
        position: relative;
        overflow: hidden;
        
        &-container {
        }
        &__line {
            height: 50px;
            width: 100%;
        }
    }

    /* Media Queries */
    @media (min-width: 1000px) {
        .routine-time-blocks__block {
            left: $xlg-blocks-left-offset;
        }
    }
    @media (max-width: 860px) {
        .routine {
            display: none;
        }
        .routines__divider--last {
            display: none;
        }
        .routine-time-blocks__block {
            left: $md-blocks-left-offset;
        }
    }
    @media (max-width: 600px) {
        .routine-time-blocks__block {
            left: $sm-blocks-left-offset;
        }
    }
</style>