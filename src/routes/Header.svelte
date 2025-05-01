<script lang="ts">
    import { onMount } from 'svelte'

    
    export let context: 'article' | 'default' = 'default'

    let headerOffset = context === 'article' ? 30 : 70

    let fixHeader = false
    
    function scrollHandler() {
        fixHeader = window.scrollY > headerOffset
    }
    
    onMount(() => {
        const header = document.querySelector('.header');
        window.addEventListener('scroll', scrollHandler)

        scrollHandler()
    });
</script>

<header 
    class="header" 
    class:scrolled={fixHeader}
    class:article={context === 'article'}
>
    <div class="header__content">
        <div class="header__inner">
            <div class="flx">
                <a href="/">
                <div class="app-logo">oakspace</div>
            </a>
            <ul class="flx">
                <li>
                    <a href="">
                        <span>Blog</span>
                    </a>
                </li>
                <li>
                    <a href="">
                        <span>Resources</span>
                    </a>
                </li>
                <li>
                    <a href="">
                        <span>Pricing</span>
                    </a>
                </li>
                <li>
                    <a href="">
                        <span>Download</span>
                    </a>
                </li>
            </ul>
        </div>
        <div class="flx">
            <ul class="flx">
                <li>
                    <a href="/home/base">
                        <span>Log In</span>
                    </a>
                </li>
                <button id="sign-up-btn">
                    <span>Sign Up</span>
                </button>
            </ul>
        </div>
    </div>
</header>

<style lang="scss">
    a {
        text-decoration: unset;

        &:hover {
            text-decoration: unset;
        }
    }
    .header {
        z-index: 1000;
        top: 0px;
        left: 0px;
        right: 0px;
        position: sticky;
        border-bottom: 1px solid rgba(black, 0);
        @include flex(center, space-between);
        transition: 0.1s cubic-bezier(.4,0,.2,1);
        opacity: 0;
        animation: fadeIn 1.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        transition: 0.2s cubic-bezier(.4,0,.2,1);
        transition-property: border-bottom;

        // transition-property: background-color, backdrop-filter, border-bottom;
        
        &.article.scrolled {
            background-color: #FFFAF0;
        }
        &.scrolled {
            // backdrop-filter: blur(100px);
            // -webkit-backdrop-filter: blur(100px);
            // background-color: rgba(white, 0.1);

            border-bottom: 1px solid rgba(black, 0.05);
            background-color: #F9F3E7;
        }
        ul {
            gap: 4px;
        }
        li a {
            padding: 4px 12px 5px 12px;
            border-radius: 9px;
            transition: 0.1s cubic-bezier(.4,0,.2,1);

            &:hover {
                background: rgba(#E6E2D6, 0.65);
            }
            &:active {
                transform: scale(0.98);
            }
        }
        li span, button span {
            @include text-style(0.8, 400, 0.85rem, 'Geist Mono');
            @include center;
        }
        #sign-up-btn {
            background: #9FC4DF;
            color: white;
            padding: 4px 14px 5px 14px;
            border-radius: 20px;
            margin-left: 4px;

            &:hover {
                filter: brightness(1.1);
            }
        }

        &__content {
            width: 100%;
            max-width: 67rem;
            margin: 0px auto;
            padding: 10px max(40px, 1.1rem);
        }
        &__inner {
            padding: 10px 0px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            -webkit-box-align: center;
            -webkit-box-pack: justify;
            width: 100%;
            gap: 2.25rem;
        }
    }
    .app-logo {
        // @include text-style(0.8, 500, 0.95rem, 'Nohemi-Regular');
        // letter-spacing: 0.05em;

        @include text-style(0.8, 500, 1.15rem, 'Nohemi-Semibold');
        // letter-spacing: 0.05em;

        // @include text-style(0.8, _, 1.1rem, 'Outfit-Medium');

        // @include text-style(0.8, 600, 1.55rem, 'Tanker');
        margin-right: 28px;
    }
    .flx {
        display: flex;
        align-items: center;
    }
    .flx-sb {
        display: flex;
        justify-content: space-between;
    }
    @mixin center {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    @mixin text-style($opacity: _, $weight: _, $size: _, $font: _) {
        @if $opacity != _ {
            color: rgb(0, 0, 0, $opacity);
        }
        @if $size != _ {
            font-size: $size;
        }
        @if $weight != _ {
            font-weight: $weight;
        }
        @else if $font != _ {
            font-family: $font;
        }
    }

    @keyframes fadeIn {
        to {
            opacity: 1;
        }
    }
</style>
