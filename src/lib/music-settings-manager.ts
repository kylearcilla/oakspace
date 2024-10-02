import { get } from "svelte/store"
import { musicDataStore, musicSettingsManager } from "./store"

import { APIError } from "./errors"
import { YoutubeMusicUserData } from "./youtube-music-user-data"
import { getDiscoverCollectionList } from "./utils-music-settings"
import { getElemById, getMaskedGradientStyle } from "./utils-general"
import { LibError, MusicPlatform, UserLibraryMedia, APIErrorCode } from "./enums"
import { getPlatfromPropName, handlePlaylistItemClicked, musicAPIErrorHandler } from "./utils-music"


export class MusicSettingsManager {
    // discover
    chosenMood: MusicCollectionGroup = "serene"
    chosenMusicCollection: (MediaCollection)[] = [] 

    isScrollableLeft  = false
    isScrollableRight = false
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

        this.discoverTabBtnClicked("serene")
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
        this.update({ userLibrary: null })
    }

    setLibraryLoading(doEmptyLibrary: boolean = false) {
        this.isUserLibraryLoading = true
        this.userLibrary = doEmptyLibrary ? null : this.userLibrary

        this.update({ 
            userLibrary: this.userLibrary, isUserLibraryLoading: this.isUserLibraryLoading
        })
    }

    setLibraryLoaded(context?: { error: any }) {
        if (context?.error != undefined) {
            this.libError = context.error
            this.update({ libError: this.libError })
        }

        this.isUserLibraryLoading = false
        this.update({ 
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

        this.update({ 
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
    discoverTabBtnClicked(moodType: MusicCollectionGroup) {
        this.chosenMood = moodType

        if (moodType === "library") {
            this.update({ chosenMood: this.chosenMood })
        }
        else {
            const platformProp = getPlatfromPropName(this.platform)
            this.chosenMusicCollection = getDiscoverCollectionList(moodType, platformProp) as (MediaCollection)[]

            this.update({ 
                chosenMood: this.chosenMood, 
                chosenMusicCollection: this.chosenMusicCollection 
            })
        }
    }

    /* List Scroll Handlers + Styling */

    /**
     * Scroll handler for the libray list section.
     */
    handleLibListScroll() {
        const data = getMaskedGradientStyle(this.collectionList!) as VertScrollMaskedGradient
        const { hasReachedBottom } = data.scrollStatus

        let gradient = data.styling
        this.libListGradient = gradient

        if (hasReachedBottom) {
            this.getMoreLibItems()
        }
    }

    /**
     * Scroll handler for horizontal mood categories in the discover section.
     */
    handleCategoriesScroll() {
        const data = getMaskedGradientStyle(this.collectionList!, { 
            isVertical: false,
            head: {
                end: "30%"
            },
            tail: {
                start: "70%"
            }
        }) as HozScrollMaskedGradient
        const { hasReachedEnd, hasReachedStart } = data.scrollStatus

        this.isScrollableRight = !hasReachedEnd
        this.isScrollableLeft = !hasReachedStart
        this.categoriesListGradient = data.styling

        this.update({
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

    update(newState: Partial<MusicSettingsManager>, doSave: boolean = true) {
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