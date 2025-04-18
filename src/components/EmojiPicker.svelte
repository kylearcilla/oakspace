<script lang="ts">
  import { onMount as onMount } from "svelte"

	  import Emoji from "./Emoji.svelte"
	  import SvgIcon from "./SVGIcon.svelte"
	  import BounceFade from "./BounceFade.svelte"

	  import { Icon } from "$lib/enums"
	  import { themeState } from "$lib/store"
    import { emojiPicker } from "$lib/pop-ups"
    import SearchIndex from "$lib/emojis-search-idx"
    import FrequentlyUsed from "$lib/emojis-freq-used"
	  import { getElemById, getVertSpace } from "$lib/utils-general"
    import { Data, getEmojiData, EMOJI_BUTTON_SIZE, CATEGORY_ID_TO_NAME, CATEGORY_TO_ICONS, getFrequentEmojis, setCache, getCache } from "$lib/emojis"

    /* subset of : https://github.com/missive/emoji-mart */

    type GridRow = string[] & { categoryId: string, index: number }
    type Grid = GridRow[] & { setsize: number }

    type SearchResultRow = EmojiData[] & { __categoryId: string, __index: number }
    type SearchResults   = SearchResultRow[] & { setsize: number }

    type RowItem = {
      index: number, posinset: number
    }

    const ROWS_PER_RENDER = 10
    const PER_LINE = 8
    const SKINS = ["✋", "✋🏻", "✋🏼", "✋🏽", "✋🏾", "✋🏿"]

    const CATEGORY_CLASS = "emoji-picker__category"
    const CAT_ROW_CLASS = "emoji-picker__category-row"

    const { onSubmitEmoji, state: picker, close } = emojiPicker

    $: position = $picker.position
    $: isOpen   = $picker.isOpen
    $: isLight  = !$themeState.isDarkTheme
    $: dmenuId  = $picker.dmenuId

    let searchResults = [] as SearchResults
    let searchQuery = ""
    let skinsOpen = false
    let skinIdx = getSkinIdx()
    let focusPos: string | null = null
    let focusedEmojiId: string | null = null
    let gridInit = false
    let dismounting = false

    let categories = null
    let visibleRows = { 0: true }
    let observers = []
    let navKey = ""
    
    let categoriesRef: Map<string, { rows: RowItem[] }>
    let grid: Grid
    let inputFocused = false
    let mounted = false
    let enterPressed = false

    let navigationElem: HTMLElement
    let scrollElem: HTMLElement
    let searchInputElem: HTMLInputElement

    let tooltip: { name: string, left: number, top: number } | null = null

    $: if (mounted && isOpen) {
      onOpen()
    }
    $: if (dismounting) {
      tooltip = null
    }
    else {
      resetState()
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
      if (name === tooltip?.name || dismounting) return

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
    function onEmojiClick(emojiData: EmojiData) {
      const emoji = getEmojiData(emojiData, { skinIdx })

      onSubmitEmoji(emoji)
      updateFrequent(emoji)

      dismounting = true
    }
    function updateFrequent(emoji: EmojiData) {
      FrequentlyUsed.add(emoji)

      const freqs = getFrequentEmojis()
      const rows = [], grid = []
      let row: RowItem[] = []
      
      for (let emoji of freqs) {
        if (row.length === PER_LINE) {
          grid.push(row)
          row = []
        }
        row.push(emoji)
      }
      if (row.length) {
        grid.push(row)
      }
      grid.forEach((_, index) => {
        rows.push({ index, posinset: index * PER_LINE + 1 })
      })

      categoriesRef.set('frequent', { rows })
      categories[0].emojis = freqs
      categoriesRef = categoriesRef
    }
    function onIconClick(id: string) {
      navCategoryId = id
      resetState()

      requestAnimationFrame(() => scrollTo(id))
    }

    /* search */
    async function handleSearchInput() {      
      const input = searchInputElem
      const value = input.value
      const _searchResults = await SearchIndex.search(value)

      resetFocus()
      searchQuery = value

      if (!_searchResults) {
        searchResults = [] as SearchResults
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
      if (searchInputElem) {
        searchInputElem.value = ""
      }

      searchQuery = ""
      searchResults = [] as SearchResults
    }

    function getResultsCount() {
      if (searchQuery) {
        return searchResults.reduce((count, row: SearchResultRow) => {
            const rowCount = row.filter(item => item !== null && item !== undefined).length
            return count + rowCount
        }, 0)
      }
      return 0
    }

    /* observers */
    function observeRows() {
      const rows = document.getElementsByClassName(CAT_ROW_CLASS)
      const views = visibleRows

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const target = entry.target as HTMLElement
          const index = parseInt(target.dataset.index)
          const rowIdx = index - (index % ROWS_PER_RENDER)

          if (entry.isIntersecting) {
            views[rowIdx] = true
          } 
          else {  
            views[rowIdx] = false
          }
        })
        visibleRows = views
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
      const categories = document.getElementsByClassName(CATEGORY_CLASS)
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
      const hasQuery = searchQuery != ""
      const [row, col, _cIdx] = focusPos ? focusPos.split('-').map(Number) : [0, 0, 0]
      const cIdx = hasQuery ? 0 : _cIdx
      const resCount = getResultsCount()

      const emojiCount = hasQuery ? resCount : categories[cIdx].emojis.length
      const rows = Math.ceil(emojiCount / PER_LINE)
      const lastCol = PER_LINE - 1
      const catLastIdx = categories.length - 1

      let newRow = row
      let newCol = col
      let newCIdx = cIdx
      dir = !focusPos ? null : dir

      const catLength = (idx) => categories[idx].emojis.length

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
          else if (cIdx < catLastIdx) {
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
            newCIdx = hasQuery ? 0 : newCIdx - 1
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
            const targetIdx = newRow * PER_LINE + newCol
            if (hasQuery && targetIdx >= resCount) {
                newCol = (resCount - 1) % PER_LINE
                newRow = Math.floor((resCount - 1) / PER_LINE)
            }
          } 
          else if (cIdx < catLastIdx) {
            newCIdx = hasQuery ? 0 : newCIdx + 1
            newRow = 0

            const nextCategoryEmojis = hasQuery ? resCount : catLength(newCIdx)
            const maxColsInNextCategory = Math.min(PER_LINE, nextCategoryEmojis)
            newCol = Math.min(col, maxColsInNextCategory - 1)
          }
          
          const currentCategoryEmojis = hasQuery ? resCount : catLength(newCIdx)
          const emojiIdx = newRow * PER_LINE + newCol

          if (emojiIdx >= currentCategoryEmojis) {            
              newCol = (currentCategoryEmojis - 1) % PER_LINE
          }
      }

      newCIdx = hasQuery ? 0 : newCIdx
      focusEmoji([newRow, newCol, newCIdx])
    }
    function getEmojiIdResult(row: number, col: number): string | null {
      const emojiRow = searchResults[row]
      if (!emojiRow) {
        return null
      }
      return emojiRow[col]
    }
    function focusEmoji(pos: [number, number, number]) {
      const [row, col, cIdx] =  pos
      const emojiIdx = row * PER_LINE + col
      const hasQuery = searchQuery != ""
      const id = `${row}-${col}-${cIdx}`
      const elem = getElemById(`emoji--${id}`)

      if (elem) {
        elem.focus()
        focusedEmojiId = hasQuery ? getEmojiIdResult(row, col) : categories[cIdx].emojis[emojiIdx]
        focusPos = id
      }
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
        enterPressed = true
        onEmojiClick(SearchIndex.get(focusedEmojiId))
      }
      else if (key === 'Escape') {
        dismounting = true
        close()
      }
    }

    /* inits */
    function initGrid() {
      const { categories } = Data
      const key = Data.categories.map((category) => category.id).join(',')
      
      categoriesRef = new Map()
      if (navKey && navKey != key) {
        scrollElem && (scrollElem.scrollTop = 0)
      }

      navKey = key

      grid = [] as Grid
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
      requestAnimationFrame(() => observeRows())
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
      dismounting = false
    }
    function resetState() {
      resetFocus()
      clearSearch()
    }
    function resetFocus() {
      focusPos = null
      focusedEmojiId = null
    }
    function onEmojiBlur(e: FocusEvent) {
      const target = e.relatedTarget as HTMLElement | null
      
      if (target && target.id.includes("emoji--")) {
        return
      }
      resetFocus()
    }
    
    onMount(() => {
      mounted = true
      if (Data) initGrid()
    })
</script>

<svelte:window on:keydown={handleKeyDown}/>

<BounceFade 
    zIndex={20000}
    isHidden={!isOpen}
    position={{
      top: `${position.top}px`,
      left: `${position.left}px`
    }}
    onClickOutside={() => {
      dismounting = true
      close()
    }}
    {dmenuId}
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
            data-dmenu-id="ej-skins"
            class="emoji-picker__skin-btn"
            on:click={() => skinsOpen = !skinsOpen}
        >
            {SKINS[skinIdx]}
        </button>
      </div>
      
      <!-- content -->
      <div bind:this={scrollElem} class="emoji-picker__scroll">
        <div style:width="300px" style:height="100%">

        <!-- search results -->
        <div style:height="100%" class:hidden={searchQuery === ""}>
          <div class={CATEGORY_CLASS}>
            <div class="emoji-picker__sticky-heading">
              Search Results
            </div>
            {#each searchResults as row, i (`c--${i}`)}
              {@const rowWithPlaceholders = row.length ? [...row, ...Array(PER_LINE - row.length).fill(null)] : []}
              <div
                class={CAT_ROW_CLASS}
                data-index={i}
                style:top={`${i * EMOJI_BUTTON_SIZE}px`}
              >
                {#each rowWithPlaceholders as emojiId, ii}
                  {@const posId = `${i}-${ii}-0`}
                  {#if emojiId}
                    <Emoji
                      skin={skinIdx}
                      id={`emoji--${posId}`}
                      focused={posId === focusPos}
                      emoji={SearchIndex.get(emojiId)}
                      onPointerOver={onEmojiHover}
                      onPointerLeave={() => tooltip = null}
                      onBlur={onEmojiBlur}
                      onClick={(emoji) => {
                          if (!enterPressed) {
                            onEmojiClick(emoji)
                          }
                          enterPressed = false
                      }}
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
                class={CATEGORY_CLASS}
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
                            class={CAT_ROW_CLASS}
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
                                    onPointerOver={onEmojiHover}
                                    onPointerLeave={() => tooltip = null}
                                    onBlur={onEmojiBlur}
                                    onClick={(emoji) => {
                                      if (!enterPressed) {
                                        onEmojiClick(emoji)
                                      }
                                      enterPressed = false
                                    }}
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
        dmenuId="ej-skins"
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
          @include contrast-bg("bg-2");
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
          padding: 6px 10px 7px 10px;

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
          padding: 0px;

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