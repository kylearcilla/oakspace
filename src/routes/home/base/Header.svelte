<script lang="ts">
    import { TextEditorManager } from "$lib/inputs"
	import { emojiPicker } from "../../../lib/emojis";
	import { iconPicker } from "../../../lib/utils-home"
	import { randomArrayElem } from "../../../lib/utils-general";

    export let options: BaseHeader
    export let showBanner: boolean

    const TITLE_INPUT_ID = "base-header-input"
    const ICON_ID = "base-header-icon"

    $: icon = options.icon
    $: title = options.title
    $: text = options.text
    $: _showBanner = showBanner

    let complete = false

    const CELBRATE_EMOJIS = ["👏", "🎉", "💪", "🙌", "💪", "🤧"]
    const BUSY_EMOJIS = ["📖", "👨‍💻", "✏️", "📝"]

    new TextEditorManager({
        initValue: text,
        placeholder: "title",
        defaultText: "Home",
        maxLength: 25,
        id: TITLE_INPUT_ID,
        handlers: {
            onInputHandler: (_, val) => {
                text = val
            },
            onBlurHandler: (_, val) => {
                text = val || "Home"
            }
        }
    })
    function formatPlural(name: string, number: number) {
        const noun = number === 1 ? name : `${name}s`

        return `<strong>${number}</strong> ${noun}`
    }
    function getReviewText({ habits, goals, tasks, vibe = "casual" }) {
        const h = formatPlural("habit", habits)
        const g = formatPlural("goal", goals)
        const t = formatPlural("task", tasks)

        if (habits === 0 && goals === 0 && tasks === 0) {
            complete = true
            const congratsMessages = [
                `Congrats! All done for the day!`,
                `Well done! Everything's checked off.`,
                `You're done! Time to relax.`,
                `Woohoo! Nothing left to do today!`,
                `All clear! Enjoy your day!`,
            ]
            const randomIndex = Math.floor(Math.random() * congratsMessages.length)
            return congratsMessages[randomIndex]
        }

        const messages = {
            formal: [
                `You have ${h}, ${g}, and ${t} remaining for the day.`
            ],
            casual: [
                `Still to do for today: ${h}, ${g}, and ${t}.`,
                `You got this! ${h}, ${g}, and ${t} remain.`,
                `Almost there! ${h}, ${g}, and ${t} remain.`,
                `Keep going! ${h}, ${g}, and ${t} remain.`,
                `${h}, ${g}, and ${t} remain. Keep at it!`,
            ]
        }

        const selectedMessages = messages[vibe] || messages.casual
        const randomIndex = Math.floor(Math.random() * selectedMessages.length)

        return selectedMessages[randomIndex]
    }
</script>

<div 
    class="base-header"
    class:base-header--unset-offset={!_showBanner}
    class:base-header--complete={complete}
    class:base-header--has-icon={icon.show}
    class:base-header--emoji-icon={icon.show && icon?.type === "emoji"}
>
    {#if icon.show}
        <button
            id={`${ICON_ID}--dbtn`}
            class="base-header__icon"
            on:click={() => {
                iconPicker.init({
                    id: ICON_ID,
                    onSubmitIcon: (_icon) => {
                        if (_icon) {
                            icon = _icon
                        }
                    }
                })
            }}
        >
            {#if icon.type === "emoji"}
                <span>{icon.src}</span>
            {:else}
                <img src={icon.src} alt="Home Icon">
            {/if}
        </button>
    {/if}
    <div class="base-header__details">
        <h1
            id={TITLE_INPUT_ID}
            contenteditable
            spellcheck="false"
        >
            {title}
        </h1>
        {#if text.show}
            <div class="base-header__callout insight-sentence">
                <button 
                    class="base-header__callout-icon"
                    on:click={() => {
                        emojiPicker.init({
                            onEmojiSelect: (emoji) => {
                                if (emoji) {
                                    text.icon = emoji.native
                                }
                            }
                        })
                    }}
                >
                    {text.icon ? text.icon : randomArrayElem(complete ? CELBRATE_EMOJIS : BUSY_EMOJIS)}
                </button>
                <div>
                    <p>
                        {@html getReviewText({ habits: 4, goals: 2, tasks: 8 })}
                    </p>
                </div>
            </div>
        {/if}
    </div>
</div>


<style global lang="scss">
    .base-header {
        padding: 15px 0px 0px 0px;
        width: 100%;
        position: relative;
        margin-top: 0px;

        &--has-icon {
            margin-top: -70px;
        }
        &--emoji-icon &__icon {
            margin-bottom: -5px;
        }
        &--complete .insight-sentence {
            @include text-style(0.6);
        }
        &--unset-offset {
            margin-top: 0px !important;
        }

        .divider {
            height: 100%;
            width: 1px;
            margin: 0px 25px 0px 20px;
        }
        &__icon {
            margin-bottom: 14px;
            font-size: 6rem;
            height: 95px;
            width: 95px;
            
            img {
                @include box;
                border-radius: 4px;
                object-fit: cover;
            }
        }
        &__details {
            flex: 1;
            position: relative;
            @include flex-col;

            h1 {
                @include text-style(1, 400, 2.75rem, "DM Mono");
                margin: -3px 0px 0px 0px;
                cursor: text;
                width: fit-content;
            }
            h4 {
                @include text-style(0.25, 400, 1.45rem);
                margin: 0px 0px 10px 0px;
            }
        }
        &__callout {
            position: relative;
            border-radius: 10px;
            @include flex(center);
            width: fit-content;
        }
        &__callout-icon {
            margin: 0px 9px 0px 0px;
            font-size: 1.85rem;
            color: white !important;
            @include square(25px, 5px);
            @include center;

            &:hover {
                background-color: rgba(var(--textColor1), 0.05);
            }
        }
    }

    h1[contenteditable]:empty:before {
        content: attr(data-placeholder);
        opacity: 0.2;
    }

    .insight-sentence {
        @include text-style(0.35, 400, 1.6rem);
        background-color: rgba(var(--textColor1), 0.02);
        margin: 8px 0px 2px 0px;
        padding: 8px 22px 10px 10px;
        
        strong {
            @include text-style(0.75, 400, 1.55rem, "DM Sans");
            margin: 0px 2px 2px 2px;
        }
    }
</style>