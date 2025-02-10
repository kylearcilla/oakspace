<script lang="ts">
	  import Emoji from "./Emoji.svelte"
	  import SvgIcon from "./SVGIcon.svelte"
    import { onMount as onMount } from "svelte"
	  import BounceFade from "./BounceFade.svelte"

	  import { Icon } from "../lib/enums"
    import { emojiPicker } from "../lib/pop-ups"
    import SearchIndex from "../lib/emojis-search-idx"
    import FrequentlyUsed from "../lib/emojis-freq-used"
	  import { getElemById, getVertSpace } from "../lib/utils-general"
    import { Data, getEmojiData, EMOJI_BUTTON_SIZE, CATEGORY_ID_TO_NAME, CATEGORY_TO_ICONS, setCache, getCache } from "../lib/emojis"
	  import { themeState } from "$lib/store";

    /* subset of : https://github.com/missive/emoji-mart */

    const ROWS_PER_RENDER = 10
    const PER_LINE = 8
    const SKINS = ["✋", "✋🏻", "✋🏼", "✋🏽", "✋🏾", "✋🏿"]

    const { onEmojiSelect, state: picker } = emojiPicker

    $: position = $picker.position
    $: isOpen   = $picker.isOpen
    $: isLight  = !$themeState.isDarkTheme

    let searchResults: any = []
    let searchQuery = ""
    let skinsOpen = false
    let skinIdx = getSkinIdx()
    let focusPos: string | null = null
    let focusedEmojiId: any = null
    let gridInit = false

    let categories = null
    let visibleRows = { 0: true }
    let observers = []
    let navKey = ""
    let mounted = false

    let categoriesRef: any 
    let grid: any
    let inputFocused = false

    let navigationElem: HTMLElement
    let scrollElem: HTMLElement
    let searchInputElem: HTMLInputElement

    let tooltip: { name: string, left: number, top: number } | null = null

    $: if (mounted && isOpen) {
      onOpen()
    }

    let navCategoryId = ""
    let navIcons = Object.entries(CATEGORY_TO_ICONS).map(([id, _]: [string, string]) => ({
        id,
        icon: CATEGORY_TO_ICONS[id]
    }))
    
    /* ui */
    function setSkin(_skinIdx: number) {
      skinIdx = _skinIdx
      skinsOpen = false

      setCache('skin', skinIdx + "")
    }
    function getSkinIdx() {
      try {
        return +(getCache("skin") || 0)
      }
      catch {
        return 0
      }
    }
    function scrollTo(cId: string) {
      const categoryElem = getElemById(`ej--${cId}`)!
      scrollElem.scrollTop = Math.max(categoryElem.offsetTop - 80, 0)
    }
    function onEmojiHover(pe: PointerEvent, name: string) {
      if (name === tooltip?.name) return

      const target  = pe.target as HTMLElement
      const top = getVertSpace({
        top: { elem: scrollElem, edge: "top" },
        bottom: { elem: target, edge: "top" }
      })

      tooltip = {
        name,
        left: target.offsetLeft + 11,
        top: top + 74
      }
    }
    function onEmojiClick(emoji: any) {
      const emojiData = getEmojiData(emoji, { skinIndex: skinIdx })
      FrequentlyUsed.add(emojiData)
      onEmojiSelect(emojiData)
    }
    function onIconClick(id: string) {
      navCategoryId = id
      scrollTo(id)
    }

    /* search */
    async function handleSearchInput() {      
      const input = searchInputElem
      const value = input.value
      const _searchResults = await SearchIndex.search(value)
      searchQuery = value
      focusPos = null
      focusedEmojiId = null

      if (!_searchResults) {
        searchResults = []
        scrollElem.scrollTop = 0
        return
      }

      const grid: any = []
      grid.setsize = _searchResults.length
      let row = null

      for (let emoji of _searchResults) {
        if (!grid.length || row.length == PER_LINE) {
          row = []
          row.__categoryId = 'search'
          row.__index = grid.length
          grid.push(row)
        }

        row.push(emoji)
      }

      searchResults = grid
      scrollElem.scrollTop = 0
    }
    function clearSearch() {
      searchInputElem.value = ""
      searchQuery = ""
      searchResults = []
    }

    /* observers */
    function observeRows() {
      const rows = document.getElementsByClassName("emoji-picker__category-row")
      const _visibleRows = visibleRows

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const target = entry.target as HTMLElement
          const index = parseInt(target.dataset.index)
          const targetIdx = index - (index % ROWS_PER_RENDER)

          if (entry.isIntersecting) {
            _visibleRows[targetIdx] = true
          } 
          else {  
            _visibleRows[targetIdx] = false
          }
        })
        visibleRows = _visibleRows
      },
        {
          root: scrollElem,
          rootMargin: `${EMOJI_BUTTON_SIZE * (ROWS_PER_RENDER)}px 0px ${EMOJI_BUTTON_SIZE * ROWS_PER_RENDER}px 0px`,
        }
      )

      Array.from(rows).forEach(row => observer.observe(row))
      observers.push(observer)
  }
    function observeCategories() {
      if (!navigationElem) return
      const categories = document.getElementsByClassName("emoji-picker__category")
      const visibleCategories = new Map()

      const setFocusedCategory = (categoryId) => {
        if (categoryId != navCategoryId) {
          navCategoryId = categoryId
        }
      }
      
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement
          const id = target.dataset.id
          visibleCategories.set(id, entry.intersectionRatio)
        }

        const ratios = [...visibleCategories]
        for (const [id, ratio] of ratios) {
          if (ratio) {
            setFocusedCategory(id)
            break
          }
        }
      }, {
        root: scrollElem,
        threshold: [0.0, 1.0],
      })

      for (const category of categories) {
        observer.observe(category)
      }

      observers.push(observer)
    }

    /* navigation */
    function navigate(dir: "left" | "up" | "down" | "right") {
      const [row, col, cIdx] = focusPos ? focusPos.split('-').map(Number) : [0, 0, 0];
      const emojiCount = categories[cIdx].emojis.length
      const rows = Math.ceil(emojiCount / PER_LINE)
      const lastCol = PER_LINE - 1

      let newRow = row
      let newCol = col
      let newCIdx = cIdx
      dir = !focusPos ? null : dir

      if (dir === "left") {
          if (col > 0) {
            newCol--
          } 
          else if (row > 0) {
            newRow--
            newCol = lastCol
          } 
          else if (cIdx > 0) {
            newCIdx--
            const prevCategory = categories[newCIdx]
            const prevEmojiCount = prevCategory.emojis.length
            const prevRows = Math.ceil(prevEmojiCount / PER_LINE)
            newRow = prevRows - 1
            newCol = (prevEmojiCount % PER_LINE || PER_LINE) - 1
          }
      } 
      else if (dir === "right") {
          if (col < lastCol && row * PER_LINE + col + 1 < emojiCount) {
            newCol++
          } 
          else if (row < rows - 1) {
            newRow++
            newCol = 0
          } 
          else if (cIdx < categories.length - 1) {
            newCIdx++
            newRow = 0
            newCol = 0
          }
      } 
      else if (dir === "up") {
          if (row > 0) {
            newRow--
          } 
          else if (cIdx > 0) {
            newCIdx--
            const prevCategory = categories[newCIdx]
            const prevEmojiCount = prevCategory.emojis.length
            const prevRows = Math.ceil(prevEmojiCount / PER_LINE)
            newRow = prevRows - 1
            newCol = Math.min(col, (prevEmojiCount % PER_LINE || PER_LINE) - 1)
          }
      } 
      else if (dir === "down") {
          if (row < rows - 1) {
            newRow++
          } 
          else if (cIdx < categories.length - 1) {
            newCIdx++
            newRow = 0
 
            const nextCategoryEmojis = categories[newCIdx].emojis.length
            const maxColsInNextCategory = Math.min(PER_LINE, nextCategoryEmojis)
            newCol = Math.min(col, maxColsInNextCategory - 1)
          }
          const currentCategoryEmojis = categories[newCIdx].emojis.length
          const emojiIdx = newRow * PER_LINE + newCol

          if (emojiIdx >= currentCategoryEmojis) {            
            newCol = (currentCategoryEmojis - 1) % PER_LINE
          }
      }
      focusEmoji([newRow, newCol, newCIdx])
    }
    function focusEmoji(pos: [number, number, number]) {
      const [row, col, cIdx] =  pos
      const emojiIdx = row * PER_LINE + col
      focusedEmojiId = categories[cIdx].emojis[emojiIdx]
      focusPos = `${row}-${col}-${cIdx}`

      getElemById(`emoji--${focusPos}`).focus()
    }
    function handleKeyDown(ke: KeyboardEvent) {
      if (!isOpen) return
      const { key} = ke

      if (key.startsWith("Arrow")) {
        ke.preventDefault()
      }
      if (key === 'ArrowLeft') {
        navigate('left')
      } 
      else if (key === 'ArrowRight') {
        navigate('right')
      } 
      else if (key === 'ArrowUp') {
        navigate('up')
      } 
      else if (key === 'ArrowDown') {
        navigate('down')
      }
      else if (key === 'Enter' && focusedEmojiId) {
        onEmojiClick(SearchIndex.get(focusedEmojiId))
      }
      else if (key === 'Escape') {
        searchQuery = ""
        onEmojiSelect(null)
      }
    }

    /* inits */
    function initGrid() {
      const { categories } = Data
      categoriesRef = new Map()

      const _navKey = Data.categories.map((category) => category.id).join(',')
      if (navKey && navKey != _navKey) {
        scrollElem && (scrollElem.scrollTop = 0)
      }

      navKey = _navKey

      grid = []
      grid.setsize = 0

      const addRow = (rows, category) => {
        const row: any = []
        row.__categoryId = category.id
        row.__index = rows.length
        grid.push(row)

        const rowIndex = grid.length - 1
        const rowRef: any = rowIndex % ROWS_PER_RENDER ? {} : {}
        rowRef.index = rowIndex
        rowRef.posinset = grid.setsize + 1
        rows.push(rowRef)
        return row
      }

      for (let category of categories) {
        const rows = []
        let row = addRow(rows, category)

        for (let emoji of category.emojis) {
          if (row.length == PER_LINE) {
            row = addRow(rows, category)
          }
          grid.setsize += 1
          row.push(emoji)
        }
        categoriesRef.set(category.id, { rows })
      }

      gridInit = true
    }
    function observe() {
      observeCategories()
      requestAnimationFrame(() => {
        observeRows()
      })
    }
    function onOpen() {
      if (Data && !categories) {
        categories = Data.categories
      }
      if (Data && !gridInit) {
        initGrid()
      }
      requestAnimationFrame(() => observe())
    }
    function onDismount() {
      observers.forEach(observer => observer.disconnect())
      observers = []
      
      focusedEmojiId = null
      focusPos = null
    }
    
    onMount(() => {
      mounted = true

      if (Data) initGrid()
    })
</script>

<svelte:window on:keydown={handleKeyDown}/>

<BounceFade 
    id={"emoji-picker--dmenu"}
    zIndex={300}
    isHidden={!isOpen}
    position={{
      top: `${position.top}px`,
      left: `${position.left}px`
    }}
    onClickOutside={() => onEmojiSelect(null)}
    {onDismount}
>
  {#if categories}
    <div 
      class="emoji-picker"
      class:emoji-picker--light={isLight}
    >
      <!-- nav position -->
      <div class="emoji-picker__nav" bind:this={navigationElem}>
        {#each navIcons as navIcon}
          {@const { id, icon } = navIcon}
          <button 
              on:click={() => onIconClick(id)}
              class="emoji-picker__nav-icon"
              class:emoji-picker__nav-icon--picked={id === navCategoryId}
          >
              <i class={icon}></i>
          </button>
        {/each}
      </div>

      <!-- search -->
      <div class="emoji-picker__search-container">
        <div 
          class="emoji-picker__search input-box input-box--border"
          class:input-box--border-focus={inputFocused}
          class:input-box--light={isLight}
        >
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            bind:this={searchInputElem}
            on:focus={() => inputFocused = true}
            on:blur={() => inputFocused = false}
            on:input={handleSearchInput}
            type="search" 
            placeholder="Search" 
            autocomplete="off"
          >
          <button on:click={clearSearch}>
            <SvgIcon 
              icon={Icon.Close} 
              options={{
                  scale: 1.1, height: 12, width: 12, strokeWidth: 1.6
              }}
            />
          </button>
        </div>
        <button 
          id="ej-skins--dbtn"
          on:click={() => skinsOpen = !skinsOpen}
          class="emoji-picker__skin-btn"
        >
          {SKINS[skinIdx]}
        </button>
      </div>
      
      <!-- categories + frequent + search results -->
      <div bind:this={scrollElem} class="emoji-picker__scroll">
        <div style:width="300px" style:height="100%">

        <!-- search results -->
        <div style:height="100%" class:hidden={searchQuery === ""}>
          <div class="emoji-picker__category">
            <div class="emoji-picker__sticky-heading">
              Search Results
            </div>
            {#each searchResults as row, i (`c--${i}`)}
              {@const rowWithPlaceholders = row.length ? [...row, ...Array(PER_LINE - row.length).fill(null)] : []}
              <div
                class="emoji-picker__category-row"
                data-index={i}
                style:top={`${i * EMOJI_BUTTON_SIZE}px`}
              >
                {#each rowWithPlaceholders as emojiId, ii}
                  {@const posId = `${i}-${ii}-0`}
                  {#if emojiId}
                    <Emoji
                      id={`emoji--${posId}`}
                      focused={posId === focusPos}
                      emoji={SearchIndex.get(emojiId)}
                      onClick={onEmojiClick}
                      onPointerOver={onEmojiHover}
                      onPointerLeave={() => tooltip = null}
                    />
                  {:else}
                    <div
                      style:width={`${EMOJI_BUTTON_SIZE}px`}
                      style:height={`${EMOJI_BUTTON_SIZE}px`}
                    >
                    </div>
                  {/if}
                {/each}
              </div>
            {/each}
          </div>
        </div>

        <!-- categories -->
        <div style:height="100%" class:hidden={searchQuery != ""}>
          {#each categories as category, cId}
              {@const cEmojis = category.emojis}
              
              <div
                id={`ej--${category.id}`}
                data-id={category.id}
                class="emoji-picker__category"
              >
                <div class="emoji-picker__sticky-heading">
                  {CATEGORY_ID_TO_NAME[category.id]}
                </div>
                <!-- rows -->
                {#if categoriesRef}
                  {@const rows = categoriesRef.get(category.id).rows}
                  {@const height = (rows.length * EMOJI_BUTTON_SIZE) + 10}

                  <div style:height={`${height}px`}>
                    {#each rows as rowRef, rIdx (rIdx)}
                        {@const rEmojis   = cEmojis.slice(rIdx * PER_LINE, (rIdx + 1) * PER_LINE)}
                        {@const targetRow = rowRef.index - (rowRef.index % ROWS_PER_RENDER)}
                        {@const vis       = visibleRows[targetRow]}
                        {@const visible   = vis === undefined ? false : vis}
                        {@const items = [...rEmojis, ...Array(PER_LINE - rEmojis.length).fill(null)]}
                        
                        <div
                            class="emoji-picker__category-row"
                            data-index={rowRef.index}
                            data-target-row={targetRow}
                        >
                          {#if visible}
                              {#each items as emojiId, colIdx}
                                {@const posId = `${rIdx}-${colIdx}-${cId}`}
                                {#if emojiId}
                                  <Emoji
                                    skin={skinIdx}
                                    id={`emoji--${posId}`}
                                    focused={posId === focusPos}
                                    emoji={SearchIndex.get(emojiId)}
                                    onClick={onEmojiClick}
                                    onPointerOver={onEmojiHover}
                                    onPointerLeave={() => tooltip = null}
                                  />
                                {:else}
                                  <div
                                    style:width={`${EMOJI_BUTTON_SIZE}px`}
                                    style:height={`${EMOJI_BUTTON_SIZE}px`}
                                  >
                                  </div>
                                {/if}
                            {/each}
                          {/if}
                        </div>
                    {/each}
                  </div>
                {/if}
              </div>
          {/each}
        </div>

        <!-- tooltip -->
        {#if tooltip}
            {@const { top, left, name } = tooltip}
            <div 
              class="emoji-picker__emoji-tooltip"
              style:top={`${top}px`}
              style:left={`${left}px`}
            >
              <div style:position="relative">
                <span>{name}</span>
              </div>
            </div>
        {/if}
        </div>
      </div>

      <!-- skins nenu -->
      <BounceFade 
        id={"ej-skins--dmenu"}
        zIndex={200}
        isHidden={!skinsOpen}
        position={{ 
          top: "80px", right: "-30px"
        }}
        onClickOutside={() => skinsOpen = false}
      >
        <div class="emoji-picker__skins">
            {#each SKINS as skin, idx}
              <button 
                class="emoji-picker__skin-btn emoji-picker__skin-btn--optn"
                on:click={() => setSkin(idx)}
              >
                {skin}
              </button>
          {/each}
        </div>
      </BounceFade>
    </div>
  {/if}
</BounceFade>

<style lang="scss">
    @import "../scss/inputs.scss";

    .emoji-picker {
        width: min-content;
        height: 370px;
        min-height: 230px;
        position: relative;
        background-color: var(--bg-2);
        border: 1px solid rgba(var(--textColor1), 0.05);
        padding: 7px 8px 0px 8px;
        border-radius: 13px;

        &--light {
          @include contrast-bg("bg-1");
        }
        &--light &__sticky-heading {
          background-color: var(--bg-1);
        }
        &--light &__nav-icon--picked {
          color: var(--elemColor1) !important;
        }
        &--light &__skins {
          @include contrast-bg;
        }
        &--light &__emoji-tooltip span {
          @include contrast-bg;
        }

        &__nav {
          @include flex(center, space-between);
          padding: 2px 2px 0px 2px;
          margin-left: -1px;
        }
        &__nav-icon {
          font-size: 1.5rem;
          color: rgba(var(--textColor1), 0.65);
          opacity: 0.2;
          transition: 0s ease-in-out;
          height: 26px;
          width: 26px;
          border-radius: 8px;
          @include center;
          
          &:hover {
            opacity: 0.35;
            background-color: rgba(var(--textColor1), 0.09);
            color: rgba(var(--textColor1), 1);
          }
        }
        &__nav-icon--picked {
          opacity: 1 !important;
          color: rgba(var(--textColor1), 1) !important;
          background-color: rgba(var(--textColor1), 0.06) !important;
        }
        &__search-container {
          @include flex(center)
        }
        &__search {
          width: calc(100% - 30px);
          @include flex(center);
          margin: 9px 0px 10px 3px;

          i {
            @include text-style(0.5, _, 1.4rem);
          }
          button {
            margin-top: 2px;
            opacity: 0.2;
          }
          button:hover {
            opacity: 0.6;
          }
        }
        &__search input {
          width: 100%;
          appearance: none;
          margin: 0px 10px 0px 8px;
          padding-top: 0.5px;

          &::-webkit-search-cancel-button {
            display: none;
          }
        }
        &__skin-btn {
          font-size: 2.2rem;
          margin-left: 8px;
          @include square(33px, 12px);
          @include center;
          
          &--optn {
            font-size: 2rem !important;
            margin: 0px 2px 0px 0px;
            @include square(29px, 8px);
          }
          &:hover {
            background-color: rgba(var(--textColor1), 0.085);
          }
        }
        &__skins {
          @include flex(center);
          padding: 3px 3px 3px 5px;
          border-radius: 9px;
          background-color: var(--bg-3);
        }
        &__scroll {
          overflow-x: hidden;
          overflow-y: scroll;
          width: calc(100% + 10px);
          height: calc(100% - 80px);
        }
        &__category {
            margin: 0px 0px 10px 0px;
            padding-right: 1px;
        }
        &__category-row {
          @include flex(center, space-between);
          height: 32px;
        }
        &__sticky-heading {
            z-index: 1;
            background-color: var(--bg-2);
            font-weight: 500;
            position: sticky;
            padding: 0px 0px 5.5px 5px;
            top: -1px;
            text-align: left;
            @include text-style(0.7, 500, 1.35rem);
        }
        &__emoji-tooltip {
            position: absolute;
            pointer-events: none;
            @include text-style(0.8, var(--fw-400-500), 1.1rem);
            z-index: 2000;
            height: 10px;
            width: 10px;
            
            span {
              @include abs-center;
              background-color: var(--bg-3);
              padding: 4px 8px;
              border-radius: 5px;
              width: max-content;
            }
        }
    }
</style>