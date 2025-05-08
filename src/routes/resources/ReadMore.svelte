<script lang="ts">
    export let articles: { 
        name: string,
        href: string,
        img: string,
        summary: string,
        category?: string,
        author?: string
    }[]
</script>

<section class="read-more" style:gap="2.5rem">
    <h2>Read More</h2>
    
    <div class="articles-grid">
        {#each articles as article}
            <div class="article-card">
                <a href={article.href}>
                    <img src={article.img.src} alt={article.name} />
                    {#if article.category}
                        <div class="category">{article.category}</div>
                    {/if}
                    <h5>{article.name}</h5>
                    <p class="summary">{article.summary}</p>
                    {#if article.author}
                        <p class="author">By {article.author}</p>
                    {/if}
                </a>
            </div>
        {/each}
    </div>
</section>

<style lang="scss">
    @use "../../scss/landing-page.scss" as *;
    @use "../../scss/article.scss" as *;
    
    .read-more {
        margin: 8rem auto 0rem auto;
        border-top: 0.5px solid #ccc;
        padding: 20px 0px 0px 0px;
        
        h2 {
            text-align: center;
            font-weight: normal;
            letter-spacing: -0.035rem;
            @include l-text-style(0.8, 400, 2.2rem, "Lora");
        }
        
        .articles-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.85rem;
        }
        .article-card {
            a {
                text-decoration: none;
                color: inherit;
                display: block;
            }
            img {
                width: 100%;
                object-fit: cover;
                margin-bottom: 0.85rem;
                height: 160px;
            }
            h5 {
                @include l-text-style(1, 400, 1.15rem, "Lora");
                margin-bottom: 0.65rem;
                line-height: 1.2;

                &:hover {
                    text-decoration: underline;
                }
            }
            p {
                @include l-text-style(0.8, 400, 0.825rem, "Lora");
            }
            .summary {
                margin-bottom: 1rem;
                line-height: 1.5;
                color: #333;
            }
            
            .author {
                font-weight: 600;
                font-size: 0.9rem;
            }
        }
    }
</style>
