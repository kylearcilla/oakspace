<script lang="ts">
    import { FOOTER } from "../lib/landing-page.data";

    export let context: "default" | "article" = "default"
</script>

<footer class="footer" class:article={context === "article"}>
    <div class="footer__inner">
        <div class="footer__top">
            <h5>oakspace</h5>
            <span>A framework for intentional living.</span>
            <div class="footer__copyright">
                © {new Date().getFullYear()} Oakspace Inc.
            </div>
        </div>
        <div class="footer__bottom">
            <div class="footer__cols">
                {#each FOOTER.columns as col}
                    <div class="footer__col">
                        <div class="footer__col-title">{col.name}</div>
                        {#each col.links as link}
                            <a href={link.href}>
                                <span>
                                    {link.name}
                                </span>
                            </a>
                        {/each}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</footer>

<style lang="scss">
    @import '../scss/landing-page.scss';
    .footer {
        background-color: #F5EEE1;
        width: 100%;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        position: relative;

        --footer-gutter: 24px;

        &.article {
            background-color: rgb(249, 245, 236);
        }
        &__inner {
            padding: 35px var(--footer-gutter);
            position: relative;
            margin: 0 auto;
            display: flex;
            max-width: calc(1000px  + 2 * var(--footer-gutter));
        }
        &__top {
            display: flex;
            justify-content: stretch;
            align-items: flex-start;
            width: 40%;
            flex-direction: column;
            gap: 9px;
            position: relative;

            h5 {
                @include l-text-style(0.8, 500, 1.25rem, 'Nohemi-Medium');
            }
            span {
                @include l-text-style(0.65, 400, 0.85rem);
            }
        }
        &__cols {
            column-gap: 24px;
            display: flex;
            justify-content: space-evenly;
        }
        &__col {
            padding: 0;
            list-style: none;
            page-break-inside: avoid;
            break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            margin: 0 30px 36px 0;
            
            span {
                display: inline-block;
                @include l-text-style(0.65, 400, 0.8rem);
                margin-top: 0.3rem;
                line-height: 1.35rem;
                text-align: left;
                word-wrap: break-word;
            }
            span:hover {
                text-decoration: underline;
            }
            a {
                transition: all 0.2s cubic-bezier(.4,0,.2,1);
            }
            a:active {
                transform: scale(0.98);
            }
        }
        &__col-title {
            @include l-text-style(1, 500, 0.85rem);
            margin-bottom: 0.4rem;
        }
        &__copyright {
            font-size: 0.75rem;
            @include abs-bottom-left(-10px, 0px);
        }
    }
</style>
