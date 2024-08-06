import { get } from "svelte/store"
import { MusicMoodCategory, LibError, MusicPlatform, UserLibraryMedia, APIErrorCode } from "./enums"
import { musicDataStore, musicSettingsManager } from "./store"
import { getElemById, getHozScrollStatus, getVertScrollStatus } from "./utils-general"
import { getPlatfromPropName, handlePlaylistItemClicked, musicAPIErrorHandler } from "./utils-music"
import { getDiscoverCollectionList } from "./utils-music-settings"
import { APIError } from "./errors"
import { YoutubeMusicUserData } from "./youtube-music-user-data"

export class MusicSettingsManager {
    // discover
    chosenMood = MusicMoodCategory.Serene
    chosenMusicCollection: (MediaCollection)[] = []

    isScrollableLeft  = false
    isScrollableRight = true
    hasCollectionItemsLoaded = true
    
    // user library
    userLibrary: UserLibraryCollection | null = null
    isUserLibraryLoading = false
    isLibraryDropdownOpen = false
    isLibraryOptionsDropdownOpen = false
    currLibraryCollection = UserLibraryMedia.Playlists
    
    debounceTimeout:      NodeJS.Timeout | null = null
    fetchLibItemsTimeout: NodeJS.Timeout | null = null
    libOptions: UserLibraryMedia[] = [
        UserLibraryMedia.Playlists, UserLibraryMedia.Albums, UserLibraryMedia.LikedTracks
    ]
    
    NEW_COLLECTION_COOLDOWN_MS = 2000
    FETCH_MORE_LIB_ITEMS_COOLDOWN_MS = 500
    SCROLL_STEP = 400
    
    libListGradient = ""
    categoriesListGradient = ""

    collectionList: HTMLElement | null = null
    libraryList: HTMLElement | null = null
    
    libError: LibError | null = null
    platform: MusicPlatform

    constructor() {
        this.platform = MusicPlatform.YoutubeMusic
        musicSettingsManager.set(this)

        this.handleDiscoverCollectionCardClicked(MusicMoodCategory.Serene)
    }

    /* Signing In & Out */
    initFromVideoData() {
        this.libError = null
        if (this.libError) {
            this.setLibraryLoaded({ error: null })
        }

        new YoutubeMusicUserData()
        let musicStore = get(musicDataStore)!

        musicStore.initFromVideoData()
        this.updateLibrary()

        requestAnimationFrame(() => {
            this.fetchHTMLElements()
        })
    }

    hasTokenExpired() {
        const musicStore = get(musicDataStore)!
        return musicStore.hasTokenExpired
    }

    /* Media Stuff */

    /**
     * Exectures after user clicks on any playable media.
     * Prevents spamming by using debouncing.
     * 
     * @param mediaClicked   Media user has clicked, reccomended data only contains a subset of Media type
     * @param idx            Index location of the item clicked.
     */
    async handleMediaClicked(mediaCollection: MediaCollection, idx: number) {
        if (this.debounceTimeout != null) return
        
        let doPlayMediaItem = true

        if (mediaCollection.length === 0) {
            musicAPIErrorHandler(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Cannot play empty collections."))
            doPlayMediaItem = false
        }
        if (doPlayMediaItem) {
            await handlePlaylistItemClicked(mediaCollection, idx)
        }

        this.debounceTimeout = setTimeout(() => { 
            this.debounceTimeout = null
            clearTimeout(this.debounceTimeout!)

        }, this.NEW_COLLECTION_COOLDOWN_MS)
    }

    /* Library Stuff */

    emptyCurrentLibrary() {
        this.userLibrary = null
        this.updateState({ userLibrary: null })
    }

    setLibraryLoading(doEmptyLibrary: boolean = false) {
        this.isUserLibraryLoading = true
        this.userLibrary = doEmptyLibrary ? null : this.userLibrary

        this.updateState({ 
            userLibrary: this.userLibrary, isUserLibraryLoading: this.isUserLibraryLoading
        })
    }

    setLibraryLoaded(context?: { error: any }) {
        if (context?.error != undefined) {
            this.libError = context.error
            this.updateState({ libError: this.libError })
        }

        this.isUserLibraryLoading = false
        this.updateState({ 
            isUserLibraryLoading: this.isUserLibraryLoading, 
        })
    }

    /**
     * Update the current library colelction after an update to the current collection.
     */
    updateLibrary() {
        const musicStore = get(musicDataStore)
        if (!musicStore) return

        this.userLibrary = musicStore.getLibrary()

        this.updateState({ 
            userLibrary: this.userLibrary, 
            currLibraryCollection: this.currLibraryCollection 
        })
    }

    /**
     * For infinit scroll. Gets more items of current library collection when user scrolls down far enough.
     */
    getMoreLibItems() {
        if (!this.shouldGetMoreLibItems()) return
        
        this.fetchLibItemsTimeout = setTimeout(async () => {
            const musicStore = get(musicDataStore)
            try {
                this.setLibraryLoading()
                await musicStore!.getMoreLibraryItems()
                this.updateLibrary()
            }
            catch(error: any) {
                this.setLibraryLoaded({ error: LibError.MORE_ITEMS })
            }
            finally {
                this.setLibraryLoaded()
                clearTimeout(this.fetchLibItemsTimeout!)
                this.fetchLibItemsTimeout = null
            }
        }, this.FETCH_MORE_LIB_ITEMS_COOLDOWN_MS)
    }

    /**
     * Gets a fresh batch of items for the current library collection.
     */
    async refreshLibrary() {
        let _userLibrary = this.userLibrary
        
        try {
            const musicStore = get(musicDataStore)

            this.setLibraryLoading(true)
            await musicStore!.refreshLibrary()
            this.updateLibrary()
            this.setLibraryLoaded()
        }
        catch {
            this.userLibrary = _userLibrary
            this.setLibraryLoaded({ error: LibError.REFRESH })
        }
    }

    /**
     * Determines whether more library items should be fetched.
     * @returns    Whether more library items should be fetched.
     */
    shouldGetMoreLibItems() {
        return !this.isUserLibraryLoading &&            
               !this.userLibrary?.hasFetchedAll &&     
               !this.hasTokenExpired() &&
               !this.fetchLibItemsTimeout &&
               !this.libError
    }

    /* Categories */
    handleDiscoverCollectionCardClicked(moodType: MusicMoodCategory) {
        const platformProp = getPlatfromPropName(this.platform)

        this.chosenMood = moodType
        this.chosenMusicCollection = getDiscoverCollectionList(moodType, platformProp) as (MediaCollection)[]

        this.updateState({ chosenMood: this.chosenMood, chosenMusicCollection: this.chosenMusicCollection })
    }

    /* List Scroll Handlers + Styling */

    /**
     * Scroll handler for the libray list section.
     */
    handleLibListScroll() {
        const scrollStatus = getVertScrollStatus(this.libraryList!)
        this.handleLibListStyling(scrollStatus)

        if (this.hasReachedEndOfList()) {
            this.getMoreLibItems()
        }
    }

    hasReachedEndOfList() {
        return getVertScrollStatus(this.libraryList!).hasReachedBottom
    }

    handleLibListStyling(status: VertScrollStatus) {
        const { hasReachedBottom, hasReachedTop } = status
        let gradient = ""

        if (!hasReachedBottom && !hasReachedTop) {
            gradient = "linear-gradient(180deg, transparent 0.2%, black 10%, black 80%, transparent 99%)"
        }
        else if (!hasReachedTop) {
            gradient = "linear-gradient(180deg, transparent 0.2%, black 10%)"
        }
        else if (!hasReachedBottom) {
            gradient = "linear-gradient(180deg, black 80%, transparent 99%)"
        }

        this.libListGradient = "mask-image: " + gradient + "; "
        this.libListGradient += "-webkit-mask-image: " + gradient + "; "

        if (hasReachedBottom) {
            this.getMoreLibItems()
        }
    }

    /**
     * Scroll handler for horizontal mood categories in the discover section.
     */
    handleCategoriesScroll() {
        const scrollStatus = getHozScrollStatus(this.collectionList!)
        this.handleCategoriesListStyling(scrollStatus)
    }

    handleCategoriesListStyling(status: HozScrollStatus) {
        const { hasReachedEnd, hasReachedStart } = status
        let gradientStyle = ""

        if (!hasReachedEnd && !hasReachedStart) {
            gradientStyle = "linear-gradient(90deg, rgba(0, 0, 0, 0.00) 0%, #000 9.84%, #000 85%, rgba(0, 0, 0, 0.00) 100%)"
            this.isScrollableRight = true
            this.isScrollableLeft = true
        }
        else if (!hasReachedStart) {
            gradientStyle = "linear-gradient(90deg, rgba(0, 0, 0, 0.00) 0%, #000 10.55%)"
            this.isScrollableLeft = true
            this.isScrollableRight = false
        }
        else if (!hasReachedEnd) {
            gradientStyle = "linear-gradient(90deg, #000 85%, rgba(0, 0, 0, 0.00) 100%)"
            this.isScrollableRight = true
            this.isScrollableLeft = false
        }

        this.categoriesListGradient = "mask-image: " + gradientStyle + "; "
        this.categoriesListGradient += "-webkit-mask-image: " + gradientStyle + "; "

        this.updateState({
            isScrollableLeft: this.isScrollableLeft, isScrollableRight: this.isScrollableRight
        })
    }

    handleShiftTabCategoryRight() {
        this.collectionList!.scrollLeft += this.SCROLL_STEP
    }
    handleShiftTabCategoryLeft() { 
        this.collectionList!.scrollLeft -= this.SCROLL_STEP
    }

    fetchHTMLElements() {
        this.collectionList = getElemById("collection-list")
        this.libraryList = getElemById("library-list")
    }

    /** State  */

    updateState(newState: Partial<MusicSettingsManager>, doSave: boolean = true) {
        musicSettingsManager.update((data: MusicSettingsManager | null) => this.getNewStateObj(newState, data! as MusicSettingsManager))
    }

    /**
     * @param newState  New state changes to be incorporated
     * @param oldState  Current state
     * @returns         New state with the latest incorporated changes.
     */
    getNewStateObj(newState: Partial<MusicSettingsManager>, oldState: MusicSettingsManager): MusicSettingsManager {
        const newStateObj = oldState
        
        // cateogires
        if (newState.chosenMood != undefined)            newStateObj.chosenMood = newState.chosenMood
        if (newState.chosenMusicCollection != undefined) newStateObj.chosenMusicCollection = newState.chosenMusicCollection
        
        // lists
        if (newState.categoriesListGradient != undefined) newStateObj.categoriesListGradient = newState.categoriesListGradient
        if (newState.isScrollableLeft != undefined)       newStateObj.isScrollableLeft = newState.isScrollableLeft
        if (newState.isScrollableRight != undefined)      newStateObj.isScrollableRight = newState.isScrollableRight
        
        // lib
        if (newState.isUserLibraryLoading != undefined)  newStateObj.isUserLibraryLoading = newState.isUserLibraryLoading
        if (newState.userLibrary != undefined)           newStateObj.userLibrary = newState.userLibrary
        if (newState.libError != undefined)              newStateObj.libError = newState.libError
        
        return newStateObj
    }
}