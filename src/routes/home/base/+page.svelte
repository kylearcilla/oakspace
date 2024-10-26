<script lang="ts">
    import { getMaskedGradientStyle } from "$lib/utils-general"
	import { TEST_GOALS } from "$lib/mock-data"
    
	import MonthView from "./MonthView.svelte";
	import HeatMap from "../../../components/HeatMap.svelte"
	import GoalCard from "../../../components/GoalCard.svelte"

    const SMALLER_WIDTH = 630
    const SMALL_WIDTH = 860

    let heatMapContainer: HTMLElement
    let heatMapGradient = ""
    let noteIdx = 0
    let heatMapLeftArrow = false
    let heatMapRightArrow = false
    let width = 0

    let monthBulletinHt = 0
    let leftHt = 0

    const notes = [
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
    const bannerImg = {
        src: "https://preview.redd.it/ancient-tree-from-mononoke-3840-x-2160-v0-qrghesb0z65c1.png?width=1080&crop=smart&auto=webp&s=c42a4dfc07a2734d3489faaccd1febb56b6859b3",
        opacity: 0.2
    }

    function heatMapScroll(scrollRef: HTMLElement) {
        const { styling, scrollStatus } = getMaskedGradientStyle(scrollRef, {
           isVertical: false,
           head: {
                end: "30%",
           },
           tail: {
                start: "60%",
           }
        }) as HozScrollMaskedGradient

        heatMapGradient   = styling
        heatMapRightArrow = !scrollStatus.hasReachedEnd
        heatMapLeftArrow  = !scrollStatus.hasReachedStart
    }
</script>

<div 
    bind:clientWidth={width}
    class="base"
    class:base--small={width <= SMALL_WIDTH}
    class:base--right-bar-flex={SMALLER_WIDTH < width && width <= SMALL_WIDTH}
    class:base--smaller={width <= SMALLER_WIDTH}
    style:--month-img-ht={`${monthBulletinHt}px`}
    style:--left-ht={`${leftHt}px`}
>   
    <div 
        class="base__header-img bg-img"
        style:background-image={`linear-gradient(rgba(0, 0, 0, ${bannerImg.opacity}), rgba(0, 0, 0, ${bannerImg.opacity})), url(${bannerImg.src})`}
    >
    </div>
    <div class="base__content">
        <div 
            class="base__left"
            bind:clientHeight={leftHt}
        >
            <!-- Header -->
            <div class="base__header">
                <div 
                    class="base__header-icon bg-img"
                    style:background-image={`linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25)), url(https://i.pinimg.com/originals/18/da/89/18da899eaf800ffb446c6e1595d23554.gif)`}
                >
                </div>
                <div class="base__header-details">
                    <div>
                        <h1>Home</h1>
                        <!-- <div class="base__insight-sentence">
                            <strong>10</strong> habits left for today with  <strong>2</strong> goals due.
                        </div> -->
                    </div>
                    <div 
                        class="base__header-callout"
                        class:base__header-callout--icon={true}
                    >
                        <div class="base__header-callout-icon">
                            🌙
                        </div>
                        <p>"How we spend our days is, of course, how we spend our lives." – Annie Dillard</p>
                    </div>
                </div>
            </div>
    
            <!-- Overview -->
                <div class="base__overview">
                <div class="base__overview-details">
                    <div>
                        <!-- <div class="base__heading">
                            Overview
                        </div> -->
                        <div class="base__text">
                            Your year at a glance.
                        </div>
                    </div>
                    <!-- <div class="base__subheading">
                        Insights
                    </div> -->
                    <div class="base__insights">
                        <div class="base__insight-row">
                            Habit Consistency <span>11%</span>
                        </div>
                        <div class="base__insight-row">
                            Goals Accomplished <span>2/48</span>
                        </div>
                    </div>
                </div>
                <div 
                    bind:this={heatMapContainer}
                    on:scroll={() => heatMapScroll(heatMapContainer)}
                    class="base__heat-map no-scroll-bar"
                    style={heatMapGradient}
                >
                    <HeatMap />
                </div>
                </div>
    
                <div class="divider divider--1"></div>
    
            <!-- month insights -->
             <div class="base__month-insight">
                 <MonthView/>
             </div>
        </div>
        <div class="base__right">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div 
                style:background-image={`linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url(https://i.pinimg.com/originals/8f/5d/24/8f5d24447dc5bb0630323f8db9aaf5e2.gif)`}
                class="base__month-img bg-img"
                bind:clientHeight={monthBulletinHt}
                on:click|self={() => noteIdx = (noteIdx + 1) % notes.length}
            >
                <div class="base__month-img-content">
                    <p>
                        {@html notes[noteIdx]}
                    </p>
                </div>
            </div>
            <div class="base__goals">
                <div class="divider"></div>
                <div class="base__goals-header">
                    <span>Upcoming</span>
                    <span class="base__goals-count">
                        {TEST_GOALS.length} items
                    </span>
                </div>
                <div class="base__goals-list">
                    {#each TEST_GOALS as goal}
                        <GoalCard {goal} onClick={(goal) => console.log(goal)}/>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .base {
        margin-top: 0px;
        width: 100%;
        overflow: scroll;
        height: calc(100% - 20px);

        &--small &__month-insight {
            min-height: 0px;
        }
        &--small &__content {
            display: block;
        }
        &--small &__left {
            width: 100%;
            padding-right: 0px;
        }
        &--right-bar-flex &__right {
            width: 100%;
            display: flex;
        }
        &--right-bar-flex &__month-img {
            width: 300px;
            min-width: 300px;
            height: 300px;
            padding-right: 10px;
        }
        &--right-bar-flex &__goals {
            height: 600px;
            padding-left: 30px;
            width: calc(100% - 300px);

            .divider {
                display: none;
            }
        }
        &--smaller &__right {
            width: 100%;
        }
        &--smaller &__month-img {
            height: 200px;
            p {
                font-size: 1.1rem;
            }
        }
        &--smaller &__goals {
            width: 100%;
        }

        .divider {
            background-color: rgba(var(--textColor1), 0.035);
            width: 100%;
            height: 1px;
            margin: 6px 0px 15px 0px;
        }

        &__content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0px 30px 20px 30px;
            display: flex;
        }
        &__left {
            width: calc(100% - 200px);
            padding-right: 40px;
        }
        &__right {
            padding-top: 22px;
            width: 200px;
        }

        /* text */
        &__heading {
            @include text-style(0.95, 400, 1.7rem, "DM Mono");
            margin-bottom: 8px;
        }
        &__subheading {
            @include text-style(1, 400, 1.525rem);
            margin: 18px 0px 10px 0px;
        }
        &__text {
            @include text-style(0.45, 400, 1.475rem);
        }

        /* header */
        &__header-img {
            height: 185px;
            width: 100%;
        }
        &__header {
            padding: 65px 0px 0px 0px;
            width: 100%;
            position: relative;

            .divider {
                height: 100%;
                width: 1px;
                margin: 0px 25px 0px 20px;
            }
        }
        &__header-icon {
            height: 80px;
            width: 80px;
            margin-right: 25px;
            @include abs-top-left(-30px, 0px);

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 0px;
            }
        }
        &__header-details {
            flex: 1;
            position: relative;
            @include flex-col;

            h1 {
                @include text-style(1, 500, 2.125rem);
                margin: -3px 0px 8px 0px;
            }
            h4 {
                @include text-style(0.25, 400, 1.45rem);
                margin: 0px 0px 10px 0px;
            }
        }
        &__header-callout {
            position: relative;
            margin: 3px 0px 12px -2px;
            padding: 8px 17px 9px 12px;
            background-color: rgba(var(--textColor1), 0.03);
            border-radius: 10px;
            // border: 1px solid rgba(var(--textColor1), 0.045);
            @include multi-line-elipses-overflow(2);
            display: flex;
            width: fit-content;
            
            &:before {
                display: none;
                content: " ";
                @include abs-top-left(10px, 13px);
                height: calc(100% - 21px);
                width: 2px;
                background: rgba(var(--textColor1), 0.1);
                border-radius: 2px;
            }
            p {
                @include text-style(0.5, 500, 1.385rem);
            }
        }
        &__header-callout-icon {
            margin: 1px 10px 0px 0px;
            font-size: 1.385rem;
        }

        /* overview */
        &__overview {
            padding: 0px 30px 0px 0px;
            margin-bottom: 10px;
            @include flex(flex-end);
            display: none;

            .base__text {
                margin-bottom: 20px;
            }
        }
        &__overview-details {
            width: clamp(250px, 35%, 350px);
            margin: 0px 30px 0px 0px;
            height: 100%;
        }
        &__heat-map {
            flex: 1;
            padding: 2px 80px 0px 40px;
            overflow-x: scroll;
        }

        /* month insights */
        &__month-insight {
            margin-top: 20px;
            min-height: 700px;
        }

        /* img */
        &__month-img {
            position: relative;
            width: 100%;
            aspect-ratio: calc(1 / 1);
            cursor: pointer;
            // border-radius: 2px;
            // display: none;
            overflow: scroll;
            user-select: none;

            span {
                @include text-style(0.5, 400, 1.125rem, "DM Mono");
                display: inline-block;
                margin: 0px 0px 12px 0px;
            }
            p {
                cursor: text;
                @include text-style(0.75, 400, 1rem, "DM Mono");
            }
        }
        &__month-img-content {
            width: 80%;
            text-align: center;
            position: absolute;
            top: calc(50% - 0px);
            left: 50%;
            transform: translate(-50%, -50%);
        }

        /* goals */
        &__goals {
            height: calc(var(--left-ht) - var(--month-img-ht) - 40px);

            .divider {
                margin: 13px 0px 10px 0px
            }
        }
        &__goals-header {
            @include text-style(0.3, 400, 1.2rem, "DM Mono");
            @include flex(center, space-between);
            margin: 0px 0px 8px 2px;
        }
        &__goals-count {
            opacity: 0.5;
        }
        &__goals-list {
            padding-top: 5px;
            max-height: calc(100% - 35px);
            overflow-y: scroll;
            width: calc(100% + 12px);
            padding-right: 11px;
        }
    }


</style>