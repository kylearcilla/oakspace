<script lang="ts">
    import Header from "../../Header.svelte"
    import Footer from "../../Footer.svelte"
</script>

<div class="article-container">
    <Header context="article"/>
    <slot />
</div>

<Footer context="article" />

<style lang="scss">
    @use "../../../scss/landing-page.scss" as *;
    @use "../../../scss/article.scss" as *;

    .read-next {
        max-width: 800px;
        margin: 4rem auto;
        padding: 0 1rem;

        h2 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }

        a {
            display: block;
            padding: 1rem;
            border-radius: 8px;
            background: var(--surface-2);
            text-decoration: none;
            color: inherit;
            transition: background 0.2s;

            &:hover {
                background: var(--surface-3);
            }

            h3 {
                font-size: 1.2rem;
                margin-bottom: 0.5rem;
            }

            p {
                color: var(--text-2);
                font-size: 0.9rem;
            }
        }
    }
</style>
