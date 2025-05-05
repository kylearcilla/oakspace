<script>
    import { onMount } from 'svelte'
	import { initArticleObserver } from '$lib/utils-article'
    import { GOALS_ARTICLES, READ_NEXT } from "$lib/data-blogs"

	import ReadMore from '../../ReadMore.svelte'
    import ArticleElement from "../../ArticleElement.svelte"

    const { header, sections } = GOALS_ARTICLES["goal-classification"]
    const { title, summary, image } = header
    const nextArticles = READ_NEXT["goal-classification"]
    
    let activeSection = ''
    
    onMount(() => {
        const observer = initArticleObserver((section) => activeSection = section)
        return () => observer.disconnect()
    })
</script>

<svelte:head>
    <title>Oakspace | {header.title}</title>
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <meta name="description" content={header.summary} />
    <meta name="keywords" content="productivity, journal, bullet journal, planner, goals, habits, routines, workspace, todo, tasks" />
    <meta name="author" content="Oakspace" />
    <meta name="og:title" content="Oakspace" />
    <meta name="og:description" content={header.summary} />
    <meta property="og:site_name" content="Oakspace" />
    <meta property="og:url" content="https://oakspace.app" />
    <link rel="icon" href="/favicon.png" title="A Framework for Intentional Living" />
    <link rel="apple-touch-icon" href="/favicon.png" />
    <link rel="shortcut icon" href="/favicon.png" type="image/png" />
    <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@oakspace" />
    <meta name="twitter:description" content={header.summary} />
    <meta name="twitter:title" content="Oakspace" />
</svelte:head>

<article>
    <header>
        <div class="img-wrapper">
            <figure>
                <div class="pic-wrapper">
                    <picture>
                        <img src={image.src} alt={image.alt} />
                    </picture>
                </div>
                <figcaption>
                    <div class="fig-caption">
                        <span>
                            Photo by 
                            <a href={image.artist.href} target="_blank">{image.artist.name}</a>
                            on 
                            <a href={image.source.href} target="_blank">{image.source.text}</a>
                        </span>
                    </div>
                </figcaption>
            </figure>
        </div>
        <div class="header">
            <h1>{title}</h1>
        </div>
        <p>{summary}</p>
    </header>
    <section>
        <div class="sidebar">
            <h3>Table of Contents</h3>
            <ul>
                {#each sections as section}
                    {#if section.type === 'h1'}     
                        <li class={activeSection === section.href?.slice(1) ? 'active' : ''}>
                            <a href={`#${section.href?.slice(1)}`}>{section.content}</a>
                        </li>
                    {/if}
                {/each}
            </ul>
        </div>
        <div class="body-container">
            {#each sections as section}
                <ArticleElement {section} />
            {/each}
        </div>
    </section>
    <ReadMore articles={nextArticles} />
</article>

<style lang="scss">
    @import '../../../../scss/landing-page.scss';
    @import '../../../../scss/article.scss';
</style>