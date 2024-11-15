<script lang="ts">
	import { themeState } from "../../../lib/store";

    export let options: {
        contentsOnHover?: boolean
    } | undefined = undefined

    // const contentsOnHover = options?.contentsOnHover ?? true
    $: isLight = !$themeState.isDarkTheme
    $: contentsOnHover = isLight

    let noteIdx = 0
    let isPointerOver = false
    let fontSize = 1.1

    const notes = [
        "real growth starts when you're tired of your own shit",
        "Inner peace over everything else.",
        "Can't approach new energy and new life with the same attitude u was using to maintain ya old shit!",
        "How would the most relaxed version of you approach it? The most confident version? Your best version?",
        "Life begins at the end of your comfort.",
        "Everything in life starts with your mindset first and your actions second. <br><br>Your actions follow your thoughts, your beliefs and ideas.",
        "Be yourself so the people looking for you can find you.",
        "You gotta learn how to move from things that don't serve you well.",
        "Decide what kind of life you actually want. And then say no to everything that isn't that.",
        "Self love is the highest frequency that attracts everything you desire.",
        "Do not rely on transient feelings, rely on who you desire to be on this day, in this lifetime. <br><br>What would they do. Don't ask yourself if you want to do it. <br><br>Ask your future self if they want you to do it. <br><br>You do it for that person.",
        "If you only listen to yourself, all you will do is recreate the same reality that you've always been living in. <br><br>If you keep reframing your everyday from within your future, idealized best-self, you will inch closer and closer to be that person",
        "What a disgrace it is for a man to grow old without ever seeing the beauty and strength of which his body is capable.",
        "I'm in love with my future.",
        "It's the small habits. How you spend your mornings. <br><br> How you talk to yourself. Your first instinct when boredom arises. <br><br>What you choose to spend enery on. Who you share your energy with. That will change your life.",
        "The past is just a story we tell ourselves.",
        "You need 3 daily wins: <br><br>A physical win. <br>A mental win. <br>A spiritual win.",
        "I love ppl with good energy. It makes me so happy.",
        "If the mind wanders 100 times, simply invite it back 100 times.<br><br> Each time you bring your mind back without judgement, it is like a bicep curl for your brain.",
        "Spoiler: it absolutely does workout for you, and even better than you anticipated.",
        "Develop a strong opinion of yourself so you don't end up internalizing the beliefs others have of you.",
        "Wheresoever you go, go with all your heart.",
        "Someone could be more successful than you and still envy you because your character carries more weight than their status.",
        "You have to get so confident in who you are that no one's opinion, rejection, or behavior can fucking rock you.",
        "new friendships are coming. <br>new lovers are coming. <br>new job opportunities are coming. <br>new living spaces are coming. <br>new vacations are coming. <br>new routines are coming. <br>new habits are coming. <br>new mindsets are coming. <br>a new you is coming.",
    ]
</script>


<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class="bulletin"
    class:bulletin--light={isLight}
    class:bulletin--show-on-hover={contentsOnHover}
    class:bulletin--is-over={isPointerOver}
    style:font-size={`${fontSize}rem`}
    on:click={() => noteIdx = (noteIdx + 1) % notes.length}
    on:pointerover={() => isPointerOver = true}
    on:pointerleave={() => isPointerOver = false}
>
    <img src="https://i.pinimg.com/564x/81/2d/7b/812d7be9f97ac8a753e6a73997c71fea.jpg" alt="">
    <div class="bulletin__content">
        <p>
            {@html notes[noteIdx]}
        </p>
    </div>
</div>

<style lang="scss">
    .bulletin {
        width: 100%;
        overflow: scroll;
        position: relative;
        user-select: none;
        cursor: pointer;
        overflow: hidden;

        &--light p {
            font-weight: 500;
            color: white !important;
        }
        &--show-on-hover &__content {
            @include not-visible;
        }
        &--is-over &__content {
            @include visible;
        }

        img {
            width: 100%;
        }
        span {
            @include text-style(0.5, 400, 1.125rem, "DM Mono");
            display: inline-block;
            margin: 0px 0px 12px 0px;
        }
        p {
            cursor: text;
            width: 80%;
            @include text-style(0.8, 400, _, "DM Mono");
            font-size: var(--font-size);
        }
        &__content {
            width: 100%;
            height: calc(100% - 3px);
            text-align: center;
            z-index: 2;
            background-color: rgba(black, 0.5);
            transition: 0.2s ease-in-out 0.1s;
            @include abs-top-left;
            @include center;
        }   
    }
</style>