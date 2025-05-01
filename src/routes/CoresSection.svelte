<script lang="ts">
    import { LANDING_PAGE_IMGS } from '$lib/landing-page.data'

    let chosenCore = 'goals'
    
    // Add animation control function
    function handleCoreChange(core: string) {
        chosenCore = core
    }
</script>

<div 
    class="cores"
    style:--container-padding="50px"    
>
    <h3 class="cores__title">
        A Framework for Intentional Living
    </h3>
    <p class="cores__subtitle">
        An intimate and personal space rich with features for productivity, reflection, and defining your ideal living.
    </p>
    <div class="cores__btns">
        <button 
            on:click={() => handleCoreChange("goals")}
            class:chosen-btn={chosenCore === 'goals'}
        >
            Goals
        </button>
        <button 
            on:click={() => handleCoreChange("habits")}
            class:chosen-btn={chosenCore === 'habits'}
        >
            Habits
        </button>
        <button 
            on:click={() => handleCoreChange("routines")}
            class:chosen-btn={chosenCore === 'routines'}
        >
            Routines
        </button>
    </div>
    {#if chosenCore === 'goals'}
        <section class="goals">
            <div class="cores__info"> 
                <div class="cores__info-text">
                    <span>Define your north star</span>
                    <h2>Goals</h2>
                    <p>
                        Define the intentions and goals that outline your own vision of ideal living.
                    </p>
                    <ul>
                        <li>
                            Rich goal customization
                        </li>
                        <li>
                            Bird's eye-focused interface
                        </li>
                        <li>
                            Diverse interface view options
                        </li>
                </ul>
            </div>
            <div class="cores__info-right">
                <div class="cores__info-img">
                    <img 
                        class="cores__collage-img"
                        src={LANDING_PAGE_IMGS.goals[2].src} 
                        alt="goals-notes-app-2"
                        style:--pos-x="10px"
                        style:--pos-y="50px"
                        style:--angle="-4deg"
                        style:--delay="0s"
                    >
                    <img 
                        class="cores__collage-img"
                        src={LANDING_PAGE_IMGS.goals[1].src} 
                        alt="goals-notes-app-1"
                        style:--pos-x="240px"
                        style:--pos-y="0px"
                        style:--angle="4deg"
                        style:--delay="0.065s"
                    >
                    <img 
                        class="cores__main-img"
                        src={LANDING_PAGE_IMGS.goals[0].src} 
                        alt="goals"
                    >
                </div>
            </div>
        </div>
    </section>
    {:else if chosenCore === 'habits'}
        <section class="habits">
            <div class="cores__info"> 
                <div class="cores__info-text">
                    <span>
                        Track your consistency
                    </span>
                    <h2>Habits</h2>
                    <p>
                        Rich habit tracking for staying true to your intentions & capturing the ebbs & flows of your efforts over time.
                    </p>
                    <ul>
                        <li>
                            Rich data analytics
                        </li>
                        <li>
                            Flexible habit typing
                        </li>
                        <li>
                            Diverse interface views
                        </li>
                    </ul>
                </div>
            <div class="cores__info-right">
                <div class="cores__info-img">
                    <img 
                        class="cores__collage-img"
                        src={LANDING_PAGE_IMGS.habits[1].src} 
                        alt="habits-0"
                        style:--pos-x="10px"
                        style:--pos-y="15px"
                        style:--angle="-4deg"
                        style:--delay="0s"
                    >
                    <img 
                        class="cores__collage-img"
                        src={LANDING_PAGE_IMGS.habits[2].src} 
                        alt="habits-1"
                        style:--pos-x="260px"
                        style:--pos-y="-20px"
                        style:--angle="4deg"
                        style:--delay="0.065s"
                    >
                    <img 
                        class="cores__collage-img"
                        src={LANDING_PAGE_IMGS.habits[3].src} 
                        alt="habits-2"
                        style:--pos-x="80px"
                        style:--pos-y="260px"
                        style:--angle="3deg"
                        style:--delay="0.085s"
                        style:width="350px"
                    >
                    <img 
                        class="cores__main-img"
                        src={LANDING_PAGE_IMGS.habits[0].src} 
                        alt="habits"
                    >
                </div>
            </div>
        </div>
    </section>
    {:else if chosenCore === 'routines'}
        <section class="routines">
            <div class="cores__info"> 
                <div class="cores__info-text">
                    <span>
                        Add structure to your days
                    </span>
                    <h2>Routines</h2>
                    <p>
                        Build routines by blocking hours and outlining daily priorities that honor your deepest intentions.
                    </p>
                    <ul>
                        <li>
                            Activity type tracking
                        </li>
                        <li>
                            Routine block customization
                        </li>
                        <li>
                            Multiple weekly and daily routines
                        </li>
                    </ul>
            </div>
            <div class="cores__info-right">
                <div class="cores__info-img">
                    <img 
                        class="cores__collage-img"
                        src={LANDING_PAGE_IMGS.routines[1].src} 
                        alt="routines"
                        style:--pos-x="40px"
                        style:--pos-y="60px"
                        style:--angle="-7deg"
                        style:--delay="0s"
                        style:height="350px"
                    >
                    <img 
                        class="cores__collage-img"
                        src={LANDING_PAGE_IMGS.routines[2].src} 
                        alt="routines"
                        style:--pos-x="260px"
                        style:--pos-y="40px"
                        style:--angle="4deg"
                        style:--delay="0.05s"
                    >
                    <img
                        class="cores__main-img"
                        src={LANDING_PAGE_IMGS.routines[0].src} 
                        alt="routines"
                    >
                </div>
            </div>
        </div>
    </section>
    {/if}
    <h3 class="cores__title" style:margin-top="360px">
        Spaces that Melt Away Inaction
    </h3>
    <p class="cores__subtitle" style:margin-bottom="70px">
        Systems that sustain you through long working hours by comfortably keeping you in a working mood.
    </p>
    <section class="workspace">
        <div 
            class="cores__info" 
            style:flex-direction="row"    
        > 
            <div class="cores__info-text">
                <span>Make your working hours enjoyable</span>
                <h2>Workspace</h2>
                <p>
                    Curate your workspace with soothing visuals and soundscapes that invite deep focus—or simply let them play in the background for chill vibes.
                </p>
                <ul>
                    <li>
                        Different genres of spaces
                    </li>
                    <li>
                        Diverse styling options
                    </li>
                    <li>
                        Play your own Youtube Account
                    </li>
                </ul>
            </div>
            <div class="cores__info-right">
                <div class="cores__info-img">
                    <img 
                        class="cores__core-img"
                        src={LANDING_PAGE_IMGS.workspace[0].src} 
                        alt="workspace"
                    >
                </div>
            </div>
        </div>
    </section>
    <section class="sessions">
        <div class="cores__info"> 
            <div class="cores__info-text">
                <span>Track your productivity</span>
                <h2>Sessions</h2>
                <p>
                    Guided work sessions that keep you from distractions and track your focus time.
                </p>
                <ul>
                    <li>
                        Pomororo and Flow session modes
                    </li>
                    <li>
                        Intuitive & customizable session tracking interface
                    </li>
                    <li>
                        Session tracking history
                    </li>
                </ul>
            </div>
            <div 
                class="cores__info-right" 
                style:justify-content="flex-start"
            >
                <div class="cores__info-img" style:max-width="400px">
                    <img 
                        class="cores__core-img"
                        src={LANDING_PAGE_IMGS.sessions[0].src} 
                        alt="sessions"
                    >
                </div>
            </div>
        </div>
    </section>
</div>

<style lang="scss">
    .cores {
        &__title {
            @include text-style(0.8, 500, 3.5rem, 'Rubik');
            line-height: 1.05;
            max-width: 600px;
            margin: 0px auto;
            text-align: center;
        }
        &__subtitle {
            @include text-style(0.8, 400, 1rem, 'system');
            max-width: 400px;
            margin: 30px auto 30px auto;
            text-align: center;
            line-height: 1.5;
        }
        &__btns {
            display: flex;
            gap: 6px;
            margin: 20px auto 50px auto;
            width: 100%;
            justify-content: center;
            
            button {
                @include text-style(1, 400, 0.85rem, 'Geist Mono');
                background: #ece6da;
                padding: 5px 14px 6px 14px;
                border-radius: 20px;
            }
            button:hover {
                background: #e4ded2;
            }
            .chosen-btn {
                background-color: #9FC4DF !important;
                color: white;
            }
        }
        &__info {
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            height: 100%;
        }
        &__info span {
            @include text-style(_, 500, 0.85rem, "system");
            color: #8a8a8a;
            margin-bottom: -3px;
            display: block;
        }
        &__info h2 {
            @include text-style(0.8, 500, 3rem, 'Gambarino');
        }
        &__info p {
            @include text-style(0.8, 400, 1rem, 'system');
            margin: 6px 0px 0px 0px;
            max-width: 400px;
            line-height: 1.35;
        }
        &__info-text {
            padding-right: 3.75rem;
            width: 40%;
        }
        ul {
            display: grid;
            gap: 5px;
            margin-top: 30px;
        }
        ul li {
            @include text-style(0.8, 400, 0.95rem, 'system');
            display: flex;
        }
        ul li::before {
            @include text-style(0.8, 400, 1.2rem, "Gambarino");
            content: '*';
            margin: -1px 14px 0px 0px;
            display: flex;
        }
        &__info-right {
            width: calc(100% - 40%);
            justify-content: flex-start;
            display: flex;
        }
        &__info-img {
            position: relative;
            max-width: 700px;
            width: 70vw;
            height: 500px;
            flex-shrink: 0;
            position: relative;

        }
        &__main-img {
            height: auto;
            width: 100%;
            box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.05);
            border-radius: 10px;
            opacity: 0;
            animation: img-in 0.25s cubic-bezier(.4,0,.2,1) forwards 1.3s;
        }
        &__core-img {
            height: auto;
            width: 100%;
            box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.05);
            border-radius: 10px;
        }
        &__collage-img {
            width: 250px;
            border-radius: 15px;
            border: 4px solid white;
            position: absolute;
            object-fit: cover;
            top: var(--pos-y);
            left: var(--pos-x);
            transform: rotate(var(--angle));

            transform: scale(0.8) rotate(calc(-0.5 * var(--angle)));
            opacity: 0;
            animation: img-pop-up 0.5s cubic-bezier(.4,0,.2,1) forwards var(--delay),
                       img-pop-out 0.5s cubic-bezier(.4,0,.2,1) forwards calc(var(--delay) + 0.65s);
        }
    }
    .sessions .cores {
        &__info {
            flex-direction: row-reverse;
        }
        &__info-text {
            width: 50%;
        }
        &__info-right {
            width: calc(100% - 50%);
        }
    }
    section {
        margin: 0 auto 100px auto;
        max-width: 1080px;
        padding: 0 var(--container-padding);
        width: 100%;
    }
    @keyframes img-pop-up {
        0% {
            transform: scale(0.9) rotate(calc(-0.5 * var(--angle)));
            opacity: 0;
        }
        50% {
            transform: scale(1) rotate(var(--angle));
            opacity: 1;
        }
        100% {
            transform: scale(1) rotate(var(--angle));
            opacity: 1;
        }
    }
    @keyframes img-pop-out {
        0% {
            transform: scale(1) rotate(var(--angle));
            opacity: 1;
        }
        50% {
            transform: scale(1.025) rotate(var(--angle));
            opacity: 0.5;
        }
        100% {
            transform: scale(0.9) rotate(var(--angle));
            opacity: 0;
        }
    }
    @keyframes fade-out {
        from {
            opacity: 1;
            transform: scale(1) rotate(var(--angle));
        }
        to {
            opacity: 0;
            transform: scale(0.98) rotate(var(--angle));
            display: none;
        }
    }
    @keyframes img-in {
        from {
            transform: scale(0.98);
            opacity: 0;
        }
        to {
            opacity: 1;
            transform: scale(1);
            display: block;
        }
    }
</style>