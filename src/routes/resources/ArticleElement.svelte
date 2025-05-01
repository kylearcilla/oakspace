<script lang="ts">
    export let section: {
        type: 'heading' | 'body' | 'numbered-list' | 'image' | 'table'
        content: any
        href?: string
    }
</script>

{#if section.type === 'heading'}
    <h2 id={section.href?.slice(1)}>{section.content}</h2>

{:else if section.type === 'body'}
    <p>{@html section.content}</p>

{:else if section.type === 'numbered-list'}
    <ol>
        {#each section.content as item, index}
            <li>
                {@html item}
            </li>
        {/each}
    </ol>
{:else if section.type === 'image'}
    {@const { src, alt, artist, source, height, description } = section.content}
    <figure>
        <img 
            src={src} 
            alt={alt}
            style:height={`${height}px`}
            style:object-fit="cover"
        />
        {#if source}
            <figcaption>
                <div class="fig-caption">
                    {#if artist}
                        <span>
                            Photo by 
                            <a href={artist.href} target="_blank">{artist.name}</a>
                            on 
                            <a href={source.href} target="_blank">{source.text}</a>
                        </span>
                    {:else}
                        <span>
                            Photo from
                            <a href={source.href} target="_blank">{source.text}</a>
                        </span>
                    {/if}
                </div>
            </figcaption>
        {/if}
    </figure>
{:else if section.type === 'table'}
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    {#each section.content.headers as header}
                        <th>{header}</th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each section.content.rows as row}
                    <tr>
                        {#each row as cell}
                            <td>{@html cell}</td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}

<style lang="scss">
    @import '../../scss/landing-page.scss';
    h2 {
        @include l-text-style(0.85, 500, 1.2rem);
        margin: 30px 0px 10px 0px;

        &:first-of-type {
            margin-top: 0;
        }
    }
    p, li {
        @include l-text-style(0.85, 400, 0.85rem);
        margin: 2px 0px 0px 0px;
        line-height: 1.45rem;
    }
    ol {
        margin: 5px 0px 20px 0px;
    }
    ol li {
        margin: 0px 0px 2px 30px;
        list-style-type: decimal;
        line-height: 1.25rem;
    }

    figure {
        margin: 2rem 0;
        
        img {
            width: 100%;
        }
    }
    figcaption {
        margin-top: 0.25rem;
        @include l-text-style(0.4, 400, 0.65rem, "system");
        text-align: center;
    }

    .table-container {
        margin: 1.5rem 0;
        overflow-x: auto;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
    }
    
    th, td {
        text-align: left;
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }
    th {
        @include l-text-style(1, 500, 0.7rem, "system");
        padding-bottom: 0.45rem;
    }
    td {
        @include l-text-style(_, 400, 0.7rem, "system");
        color: #282828;
        vertical-align: top;
        padding: 0.45rem 0;
    }
    th:first-child, td:first-child {
        min-width: 95px;
    }
    tr:last-child td {
        border-bottom: none;
    }
</style>
