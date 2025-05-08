<script lang="ts">
    import { onMount } from 'svelte'
    import FAQSection from './FAQSection.svelte'
    import CoresSection from './CoresSection.svelte'
    import { LANDING_PAGE_IMGS } from '$lib/landing-page.data'
	import ExperienceSection from './ExperienceSection.svelte'
    
    function animateH1() {
        const words = document.querySelectorAll('h1 span')
        
        words.forEach((word, i) => {
            word.animate([
                { 
                    transform: 'translateY(75%) rotateX(-40deg)',
                    opacity: 0,
                    offset: 0
                },
                { 
                    transform: 'translateY(75%) rotateX(-40deg)',
                    opacity: 0,
                    offset: 0.8
                },
                { 
                    transform: 'translateY(0) rotateX(0deg)',
                    opacity: 1,
                    offset: 1
                }
            ], {
                duration: 700,
                easing: 'cubic-bezier(.24,.26,0,1.04)',
                fill: 'forwards',
                delay: i * 70
            })
        })
    }
    function animateH2() {
        const words = document.querySelectorAll('h2 span')
        
        words.forEach((word, i) => {
            const direction = i % 2 === 0 ? '-30%' : '30%'
            word.animate([
                { 
                    transform: `translateY(${direction}) rotateX(40deg)`,
                    opacity: 0,
                    offset: 0
                },
                { 
                    transform: `translateY(${direction}) rotateX(40deg)`,
                    opacity: 0,
                    offset: 0.8
                },
                { 
                    transform: 'translateY(0) rotateX(0deg)',
                    opacity: 1,
                    offset: 1
                }
            ], {
                duration: 620,
                easing: 'cubic-bezier(.24,.26,0,1.04)',
                fill: 'forwards',
                delay: i * 70
            })
        })
    }

onMount(() => {
    animateH1()
    setTimeout(() => animateH2(), 500)
})
</script>

<main>
    <section class="hero"> 
        <h1>
            <span>More</span> <span>Than</span> <span>a</span>
            <span>Productivity</span> <span>App</span>
        </h1>
        <h2>
            <span>Track.</span> <span>Reflect.</span> <span>Design.</span> <span>Focus.</span>
        </h2>
        <p 
            class="float-up" 
            style:--float-up-offset="5px"
            style:--float-up-delay="1s"
        >
            Everything you need from a productivity app, bullet journal, and workspace all in one place.
        </p>
        <div 
            class="hero__img float-up"
            style:--float-up-offset="5px"
            style:--float-up-delay="1s"
        >
            <img 
                class="img-box-shadow"
                id="home-page-1"
                src={LANDING_PAGE_IMGS.general[0].src} 
                alt="home-page"
            >
        </div>
    </section>
    <CoresSection />
    <ExperienceSection />
    <FAQSection />
</main>

<style lang="scss">
    @use "../scss/landing-page.scss" as *;

    main {
        overflow: hidden;
        h1 {
            @include text-style(0.8, 500, 4.5rem, 'Rubik');
            line-height: 1.05;
            width: 100%;
            max-width: 700px;
            overflow: hidden;
            perspective: 600px;
            margin: 0px auto;
        }
        h2 {
            margin: 30px auto 0px auto;
            max-width: 700px;
            overflow: hidden;
        }
        p {
            @include text-style(0.8, 400, 1rem, "system");
            max-width: 480px;
            margin: 20px auto 70px auto;
        }
        h2 span {
            @include text-style(0.8, 500, 1.8rem, 'Gambarino');
            opacity: 0;

            &:not(:last-child) {
                margin-right: 5px;
            }
        }
        h1 span {
            opacity: 0;
            transform: translateY(75%) rotateX(-40deg);
        }
        span {
            display: inline-block;
        }
    }
    .hero {
        position: relative;
        padding: 3.65rem 0px 200px 0px;
        text-align: center;

        &__img img {
            margin: 0px auto;
            width: clamp(300px, 80vw, 1000px);
        }
    }
    .float-up {
        opacity: 0;
        animation: float-up 0.6s cubic-bezier(.4,0,.2,1) var(--float-up-delay) forwards;
    }

    @mixin center {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    @mixin text-style($opacity: _, $weight: _, $size: _, $font: _) {
        @if $opacity != _ {
            color: rgb(var(--textColor1), $opacity);
        }
        @if $size != _ {
            font-size: $size;
        }
        @if $weight != _ {
            font-weight: $weight;
        }
        @if $font == "system" {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        @else if $font != _ {
            font-family: $font;
        }
    }
    @keyframes float-up {
        0% {
            transform: translateY(var(--float-up-offset));
            opacity: 0;
        }
        25% {
            opacity: 0;
        }
        100% {
            transform: translateY(0);
            opacity: 1;
        }
    }
</style>
