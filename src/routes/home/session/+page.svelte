<script lang="ts">
	import { goto } from "$app/navigation"
	import { toast } from "$lib/utils-toast"
    import { Icon, ModalType } from "$lib/enums"
	import { secsToHhMmSs } from "$lib/utils-date"
	import { SessionManager } from "$lib/session-manager"
	import { closeModal, openModal } from "$lib/utils-home"
	import { globalContext, sessionManager } from "$lib/store"
	import { capitalize, formatPlural } from "$lib/utils-general"

	import TextModal from "../TextModal.svelte"
	import SvgIcon from "../../../components/SVGIcon.svelte"
	import SessionProgress from "./SessionProgress.svelte"
	import TasksList from "../../../components/TasksList.svelte"
	import HoldButton from "../../../components/HoldButton.svelte"
	import DropdownList from "../../../components/DropdownList.svelte"
	import ConfirmationModal from "../../../components/ConfirmationModal.svelte"

    $: manager = $sessionManager
    $: session = manager?.session
    $: isPlaying = manager?.isPlaying
    $: minimal = manager?.minimal
    $: elapsedSecs = manager?.elapsedSecs
    $: state = manager?.state
    $: mode = session?.mode
    $: ambience = $globalContext.ambience

    $: totalFocusTime = manager?.totalFocusTime ?? 0
    $: totalBreakTime = manager?.totalBreakTime ?? 0
    $: pauseCount = manager?.pauseCount ?? 0

    $: todosLength = session?.todos.length ?? 0
    $: todosChecked = manager?.todosChecked
    $: transition = state?.startsWith("to-")
    $: pom = session?.mode === "pom"
    $: playBtnDisabled = transition || state === "break"

    let tasksContainer: HTMLElement
    let dropdown = false
    let confirmModalOpen = false
    let width = 0

    function getPrevPage(prevPage: string) {
        const name = prevPage === "/home" ? "Home" : prevPage.split("/")[2]

        return capitalize(name)
    }
    function backToPrevPage() {
        goto(manager!.prevPage)
    }
    async function onTaskUpdate(context: TaskUpdateContext | TaskAddContext | TaskDeleteContext)  {
        manager!.updateTasks(context.payload.tasks)
    }
    function cancelSession() {
        backToPrevPage()
        manager!.quit()
        toast("info", {
            message: "Session canceled."
        })
    }
    function finishSession(doCount = true) {
        backToPrevPage()
        if (doCount) {
            manager!.finish()
        }
        else {
            manager!.quit()
            toast("info", {
                message: "Finished uncounted session."
            })
        }
    }
    function toNextPhase() {
        if (state === "focus") {
            manager!.break()
        }
        else if (state === "break") {
            manager!.focus()
        }
    }
    function onFinishSessionOptn() {
        const tooShort = elapsedSecs! / 60 < SessionManager.MIN_SESSION_TIME_MINS

        if (tooShort) {
            confirmModalOpen = true
        }
        else {
            backToPrevPage()
            manager!.finish()
        }
    }
    function onHoldCompleted() {
        if (mode === "pom") {
            onFinishSessionOptn()
        }
        else {
            toNextPhase()
        }
    }
    function onTaskOptnClicked(optn: string) {
        dropdown = false

        if (optn === "Rename session") {
            openModal(ModalType.Text)
        }
        else if (optn === "Finish session") {
            onFinishSessionOptn()
        }
        else if (optn === "Cancel session"){
            cancelSession()
        }
        else {
            $sessionManager!.toggleMinimal()
        }
    }
</script>

{#if manager && session}
    {@const prevPage = getPrevPage(manager.prevPage)}
<div 
    bind:clientWidth={width}
    class="session"
    class:session--min={minimal}
>
    <!-- Back Btn -->
    <button 
        class="session__back-btn"
        on:click={() => backToPrevPage()}
    >
        <SvgIcon 
            icon={Icon.ChevronLeft}
            options={{
                scale: 0.97, strokeWidth: 2
            }}
        />
        <span>
            Back to {prevPage === "Base" ? "Home" : prevPage}
        </span>
    </button>

    <div class="session__content">
        <!-- Time -->
        <div class="session__focus-time" title="Total focus time.">
            {secsToHhMmSs(totalFocusTime)}
        </div>
        <!-- Details -->
        <div class="session__details">
            <div class="session__detail" title="Total inactive time.">
                {secsToHhMmSs(totalBreakTime)}
            </div>
            <div class="divider"></div>
            <div class="session__detail">
                {state === "focus" ? "Focus" : "Break"}
            </div>
            <div class="divider"></div>
            <div class="session__detail">
                {#if pauseCount > 100}
                    100+ Pauses
                {:else}
                    {formatPlural("Pause", pauseCount)}
                {/if}
            </div>
        </div>
        <!-- Progress Visuzlier -->
        <div class="session__progress-visualizer">
            <SessionProgress {width}/>
        </div>
        <!-- Controls -->
        <div class="session__controls">
            <button
                class="session__control-btn" 
                class:ambient-blur={ambience?.styling === "blur"}
                class:ambient-clear={ambience?.styling === "clear"}
                disabled={playBtnDisabled}
                on:click={() => manager.togglePlay()}
            >
                {isPlaying ? "Pause" : "Play"}
            </button>
            <HoldButton
                text={pom ? "Finish" : state === "focus" ? "Break" : "Focus"}
                onOk={onHoldCompleted}
                styling={{
                    borderRadius: "20px",
                    padding: "5px 20px 7px 20px",
                    color: "rgba(var(--textColor1), 0.45)",
                    fontSize: "1.45rem"
                }}
            />
            <div class="session__dropdown-container">
                <button
                    class="session__dbtn"
                    class:ambient-blur={ambience?.styling === "blur"}
                    class:ambient-clear={ambience?.styling === "clear"}
                    on:click={() => dropdown = !dropdown}
                    id="session--dbtn"
                >
                    <SvgIcon 
                        icon={Icon.Settings} 
                        options={{ opacity: 0.5, scale: 1.28 }} 
                    />
                </button>
                <DropdownList 
                    id={"session"}
                    isHidden={!dropdown} 
                    options={{
                        listItems:
                            [
                                { name: minimal ? "Show Tasks" : "Hide Tasks" }, 
                                { name: "Rename session" }, 
                                ...(mode === "flow" ? [{ name: "Finish session" }] : []),
                                { name: "Cancel session" }
                            ],
                        position: { 
                            top: "26px", right: "-100px"
                        },
                        styling: {
                            width: "130px",
                            fontSize: "1.2rem",
                            zIndex: 500
                        },
                        onListItemClicked: (context) => {
                            onTaskOptnClicked(context.name)
                        },
                        onClickOutside: () => {
                            dropdown = false
                        }
                    }}
                />
            </div>
        </div>
        <!-- Tasks -->
        <div class="session__tasks">
            <span class="session__tasks-progress">
                {todosChecked ? `${todosChecked} / ${todosLength}` : "0"}
            </span>
            <div 
                class="session__tasks-container"
                bind:this={tasksContainer}
            >
                <TasksList
                    options={{
                        id: "session",
                        tasks: session.todos,
                        containerRef: tasksContainer,
                        isCreatingNewTask: false,
                        handlers: {
                            onAddTask: onTaskUpdate,
                            onDeleteTask: onTaskUpdate,
                            onTaskUpdate: onTaskUpdate
                        },
                        settings: {
                            progress: "perc",
                            numbered: false
                        },
                        styling: {
                            task: { 
                                fontSize: "1.4rem",
                                fontWeight: "500",
                                opacity: 0.74,
                                padding: "7px 2px 12px 0px",
                                borderRadius: "10px"
                            },
                            subtask: { 
                                fontSize: "1.3rem",
                                fontWeight: "500",
                                padding: "6px 0px 9px 0px",
                                opacity: 0.65
                            },
                            description: { 
                                margin: "6px 0px 7px 0px", 
                                fontSize: "1.3rem",
                                fontWeight: "500",
                                opacity: 0.54
                            },
                            checkbox: {
                                width: "12px",
                                height: "12px",
                                borderRadius: "4px",    
                                margin: "3px 12px 0px 10px"
                            }
                        },
                        addBtn: {
                            text: "Add Task",
                            iconScale: 1, 
                            style: { 
                                fontSize: "1.4rem",
                                margin: "0px 0px 10px 7px",
                                fontFamily: "Manrope"
                            },
                            pos: "top"
                        },
                        contextMenuOptions: { 
                            width: "170px" 
                        },
                        ui: { 
                            sidePadding: "8px",
                            showDragHandle: false,
                            hasTaskDivider: true,   
                            listHeight: "100%"
                        }
                    }}
                />
            </div>
        </div>
    </div>
</div>
{/if}

{#if confirmModalOpen} 
    <ConfirmationModal 
        text={`Sessions must be at least ${SessionManager.MIN_SESSION_TIME_MINS} minutes long to count. <br>Are you sure you want to finish?`}
        onCancel={() => confirmModalOpen = false}
        onOk={() => finishSession(false)}
        options={{ 
            ok: "Yes!", caption: "Heads Up!" 
        }}
    /> 
{/if}

{#if $globalContext.modalsOpen.includes(ModalType.Text)} 
    <TextModal
        options={{
            placeholder: "New Title",
            title: "Rename Session",
            initText: session?.name
        }}
        onCancel={() => closeModal(ModalType.Text)}
        onOk={(newName) => manager?.updateTitle(newName)}
    /> 
{/if}

<style lang="scss">
    .session {
        padding: 10px 0px 0px 0px;
        height: 100%;
        width: 100%;
        position: relative;


        &--min &__content {
            margin-top: 19vh;
        }
        &--min &__focus-time {
            font-size: 10rem;
        }
        &--min &__details {
            font-size: 1.65rem;
        }
        &--min &__tasks {
            height: 0px;
            width: 0px;
            @include not-visible;
        }

        &__back-btn {
            @include text-style(1, 700, 1.2rem, "DM Mono");
            @include flex(center);
            @include abs-top-left(25px, 16px);
            opacity: 0.12;

            &:hover {
                opacity: 0.45;
            }
            span {
                margin-left: 10px;
            }
        }
        &__back-btn {
            margin-right: 8px;
        }

        &__content {
            margin-top: 80px;
            @include center;
            justify-content: flex-start;
            flex-direction: column;
        }

        /* timer */
        &__focus-time {
            @include text-style(1, 500, 8.5rem, "DM Mono");
        }

        /* details */
        &__details {
            @include flex(center, space-between);
            @include text-style(0.2, 400, 1.45rem, "DM Mono");
            margin: 6px 0px 0px 0px;
            white-space: nowrap;
        }

        &__details .divider {
            @include divider(0.08, 12px, 1.5px);
            margin: 0px 18px;
        }

        &__progress-visualizer {
            margin: 38px 0px 35px 0px;
            width: 100%;
            @include center;
        }

        /* controls */
        &__controls {
            @include flex(center);

            button {
                background: rgba(var(--textColor1), 0.02);
                @include center;
            }
            button:disabled {
                opacity: 0.55;
                background: rgba(var(--textColor1), 0.02) !important;
                cursor: not-allowed !important;
            }
            button:first-child {
                width: 50px;
            }
            button:hover {
                transform: 0s;
                background: rgba(var(--textColor1), 0.055);
            }
        }
        &__control-btn {
            @include text-style(0.45, 400, 1.45rem, "DM Sans");
            padding: 5px 20px 7px 20px;
            border-radius: 20px;
            margin-right: 7px;
        }
        &__dropdown-container {
            height: 32px;
            width: 32px;
            position: relative;
            margin-left: 7px;
        }
        &__dbtn {
            width: 32px !important;
            @include circle(32px);
        }

        /* tasks */
        &__tasks {
            width: clamp(370px, 60%, 600px);
            margin-top: 30px;
            position: relative;
        }
        &__tasks-progress {
            @include abs-top-right;
            @include text-style(0.2, 400, 1.28rem, "DM Mono");
        }
        &__tasks-container {
            height: 340px;
        }
    }
</style>