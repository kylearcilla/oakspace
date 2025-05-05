<script lang="ts">
    import { LANDING_PAGE_IMGS } from '$lib/landing-page.data'

    let chosenCore = 'goals'
</script>

<section 
    class="exp"
    style:--container-padding="50px"    
>
    <h4 class="exp__subtitle">
        Fast.  Customizable.  Intuitive. 
    </h4>
    <h3 class="exp__title">
        Built with your experience in mind.
    </h3>
    <p class="exp__description">
        Personalize your space with the freedom of a bullet journal.
    </p>
    <p class="exp__description" style:max-width="600px">
        Pick from a selection of themes, write personal affirmations & intentions, or add wallpapers & icons of your choice.
    </p>
    <div class="exp__bento">
        <div class="header-box exp__bento-box" style:height="380px" style:grid-row="span 1">
            <img src={LANDING_PAGE_IMGS.design[0].src} alt="bento-box">
        </div>
        <div class="workspace-box exp__bento-box" style:height="550px" style:grid-row="span 2">
            <img src={LANDING_PAGE_IMGS.design[1].src} alt="bento-box">
        </div>
        <div class="themes-box exp__bento-box" style:height="550px" style:grid-row="span 2">
            <img src={LANDING_PAGE_IMGS.design[3].src} alt="bento-box">
        </div>
        <div class="month-box exp__bento-box" style:height="380px" style:grid-row="span 1">
            <img src={LANDING_PAGE_IMGS.design[2].src} alt="bento-box">
        </div>
    </div>
</section>

<style lang="scss">
    .exp {
        margin: 10px auto 50px auto;
        width: 100%;
        
        &__title {
            @include text-style(0.8, 500, 3.5rem, 'Rubik');
            line-height: 1.05;
            max-width: 700px;
            margin: 0px auto;
            text-align: center;
        }
        &__subtitle {
            @include text-style(0.8, 400, 1.85rem, 'Gambarino');
            max-width: 400px;
            margin: 30px auto 20px auto;
            text-align: center;
        }
        &__description {
            @include text-style(0.8, 400, 1rem, 'system');
            max-width: 600px;
            text-align: center;

            &:first-of-type {
                margin: 50px auto 0px auto;
            }
            &:last-of-type {
                margin: 10px auto 70px auto;
            }
        }
        &__bento {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
            margin: 0 auto;
            max-width: 850px;
        }
        &__bento-box {
            aspect-ratio: auto;
            background-color: #F5EEE1;
            border-radius: 10px;
            height: 100%;

            img {
                border-radius: 7px;
                object-fit: cover;
                width: 100%;
                height: 100%;
            }
        }
    }
    .header-box {
        padding: 15px;
    }
    .workspace-box {

    }
    .themes-box {
        padding: 15px;
        img {
            width: 100%;
            height: 350px;
        }
    }
    .month-box {
        padding: 15px;
        img {
            width: 100%;
            height: 350px;
        }
    }
    section {
        margin: 0 auto 100px auto;
        max-width: 1080px;
        padding: 0 var(--container-padding);
        width: 100%;
    }
</style>