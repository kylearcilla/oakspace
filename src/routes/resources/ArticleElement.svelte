<script lang="ts">
    export let section: {
        type: 'h1' | 'h2' | 'body' | 'numbered-list' | 'image' | 'table'
        content: any
        href?: string
    }
</script>

{#if section.type === 'h1'}
    <h2 id={section.href?.slice(1)}>{section.content}</h2>
{:else if section.type === 'h2'}
    <h3 id={section.href?.slice(1)}>{section.content}</h3>
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
    {@const { src, alt, artist, source, height, description, centerPos, name } = section.content}
    <figure>
        <img 
            src={src} 
            alt={alt}
            style:height={`${height}px`}
            style:object-fit="cover"
            style:object-position={`center ${centerPos}%`}
        />
        {#if source || artist}
            <figcaption>
                <div 
                    class="fig-caption"
                    class:flx-sb={description}
                    class:txt-center={!description}
                >
                    {#if description}
                        <span style:text-align="left">{@html description}</span>
                    {/if}
                    <!-- paintings: artist + name -->
                    {#if artist && name}
                        <span style:text-align={description ? "right" : "center"}>
                            <i>{name}</i> by {artist.name}
                        </span>
                    <!-- photos: artist + source -->
                    {:else if artist && source}
                        <span>
                            Photo by 
                            <a href={artist.href} target="_blank">{artist.name}</a>
                            on 
                            <a href={source.href} target="_blank">{source.text}</a>
                        </span>
                    {:else if source}
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
    {@const { headers, rows, widths = [] } = section.content}
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    {#each headers as header, idx}
                        <th style:width={widths[idx] ?? 'auto'}>
                            {header}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each rows as row}
                    <tr>
                        {#each row as cell, idx}
                            <td style:width={widths[idx] ?? 'auto'}>
                                {@html cell}
                            </td>
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
    h3 {
        @include l-text-style(0.85, 500, 0.9rem);
        margin: 25px 0px 6px 0px;
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
        margin: 2rem 0 2rem 0;
        
        img {
            width: 100%;
        }
    }
    figcaption {
        margin-top: 0.25rem;
        @include l-text-style(0.4, 400, 0.65rem, "system");
    }

    .table-container {
        margin: 1.5rem 0;
        overflow-x: auto;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }
    
    th, td {
        text-align: left;
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        padding: 0.45rem 0.75rem 0.45rem;
    }
    th:first-child, td:first-child {
        padding-left: 0;
    }
    th {
        @include l-text-style(1, 500, 0.7rem, "system");
        padding-bottom: 0.45rem;
    }
    td {
        @include l-text-style(_, 400, 0.7rem, "system");
        color: #282828;
        vertical-align: top;
        padding-top: 0.45rem;
        padding-bottom: 0.45rem;
        line-height: 1.025rem;
    }
    th:nth-child(2), td:nth-child(2) {
        min-width: 95px;
    }
    tr:last-child td {
        border-bottom: none;
    }
</style>
