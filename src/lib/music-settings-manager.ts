import { get } from "svelte/store"
import { MusicMoodCategory, LibError, MusicPlatform, UserLibraryMedia } from "./enums"
import { musicDataStore, musicSettingsManager } from "./store"
import { getElemById, getHozScrollStatus, getVertScrollStatus } from "./utils-general"
import { getLibMediaCollection, getPlatfromPropName, handlePlaylistItemClicked, musicAPIErrorHandler, musicLogin, musicLogout, refreshMusicSession } from "./utils-music"
import { getDiscoverCollectionList } from "./utils-music-settings"

export class MusicSettingsManager {
    // discover
    chosenMood = MusicMoodCategory.Serene
    chosenMusicCollection: (Playlist | Album | RadioStation)[] = []

    isScrollableLeft = false
    isScrollableRight = true
    collectionList: HTMLElement | null = null
    hasCollectionItemsLoaded = true
    
    // user library
    userLibrary: UserLibraryCollection | null = null
    isUserLibraryLoading = false
    libraryList: HTMLElement | null = null
    isLibraryDropdownOpen = false
    isLibraryOptionsDropdownOpen = false
    currLibraryCollection = UserLibraryMedia.Playlists
    
    debounceTimeout: NodeJS.Timeout | null = null
    libOptions: UserLibraryMedia[] = [
        UserLibraryMedia.Playlists, UserLibraryMedia.Albums, UserLibraryMedia.LikedTracks
    ]

    NEW_COLLECTION_COOLDOWN_MS = 2000
    FETCH_MORE_LIB_ITEMS_COOLDOWN_MS = 500
    SCROLL_STEP = 400
    
    libListGradient = ""
    categoriesListGradient = ""
    libError: LibError | null = null
    platform: MusicPlatform

    constructor(platform: MusicPlatform) {
        if (platform === MusicPlatform.Spotify) {
            this.libOptions.push(UserLibraryMedia.Audiobooks)
            this.libOptions.push(UserLibraryMedia.PodcastEps)
        }
        else if (platform === MusicPlatform.YoutubeMusic) {
            this.libOptions = [UserLibraryMedia.Playlists]
        }

        this.platform = platform
        musicSettingsManager.set(this)

        this.handleDiscoverCollectionCardClicked(MusicMoodCategory.Serene)
    }

    /* Signing In & Out */
    onPlatformOptionClicked(platform: MusicPlatform) {
        if (platform != this.platform) {
            musicLogout()
            musicLogin(platform)
        }
        else if (this.hasTokenExpired()) {
            refreshMusicSession()
        }
        else {
            musicLogout()
            musicSettingsManager.set(null)
        }
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
     * @param mediaClicked   Media user has clicked.
     * @param idx            Index location of the item clicked.
     */
    async handleLibraryMediaClicked(mediaClicked: Partial<Media>, idx: number) {
        if (this.debounceTimeout != null) return

        try {
            let _mediaClicked: Media

            // reccomended data contains a subset of Media
            if (!("fromLib" in mediaClicked)) {
                _mediaClicked = {
                    ...mediaClicked, description: "", fromLib: false
                } as Media
            }
            else {
                _mediaClicked = mediaClicked as Media
            }

            const isFromLib = mediaClicked.fromLib
            const mediaCollection = !isFromLib ? mediaClicked : await getLibMediaCollection(_mediaClicked, idx) 
            await handlePlaylistItemClicked(mediaCollection as MediaCollection, _mediaClicked, idx)
    
            this.debounceTimeout = setTimeout(() => { 
                this.debounceTimeout = null
                clearTimeout(this.debounceTimeout!)
            }, this.NEW_COLLECTION_COOLDOWN_MS)
        }
        catch(e: any) {
            musicAPIErrorHandler(e)
        }
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

    setLibraryLoaded(error: any = null) {
        this.isUserLibraryLoading = false
        this.libError = error

        this.updateState({ 
            isUserLibraryLoading: this.isUserLibraryLoading, libError: error
        })
    }

    /**
     * Update the current library colelction after an update to the current collection.
     */
    updateLibrary() {
        const data = get(musicDataStore)
        if (!data) return

        this.currLibraryCollection  = data.currentUserMedia
        this.userLibrary            = data.getCurrentLibraryDetails()

        this.updateState({ userLibrary: this.userLibrary, currLibraryCollection: this.currLibraryCollection })
    }

    /**
     * Called when user clicks on a new Library collectino to view.
     * If view has not been initialized yet, request for it.
     * @param toMedia   New library view option.
     * @returns 
     */
    async updateLibraryMedia(toMedia: UserLibraryMedia) {
        try {
            if (toMedia === this.currLibraryCollection) return

            const musicStore = get(musicDataStore)
            const _toMedia = musicStore!.getLibraryDetails(toMedia)
            const isFetchingForFirstTime = !_toMedia.hasFetchedAll && _toMedia.items.length === 0
    
            if (isFetchingForFirstTime) {
                this.setLibraryLoading(true)
            }

            await musicStore!.updateLibraryMedia(toMedia, isFetchingForFirstTime)
            this.updateLibrary()
            this.setLibraryLoaded()

            // TODO: get rid of this
            setTimeout(() => this.isUserLibraryLoading = false, 1000)
        }
        catch {
            this.setLibraryLoaded(LibError.NEW_COLLECTION)
        }
    }

    /**
     * For pagination. Gets more items of current library collection when user scrolls down far enough.
     */
    getMoreLibItems() {
        if (!this.shouldGetMoreLibItems()) return
        this.setLibraryLoading()
        
        setTimeout(async () => { 
            const musicStore = get(musicDataStore)
            try {
                await musicStore!.getMoreLibraryItems()
                this.setLibraryLoaded()
                this.updateLibrary()
                
                if (this.hasReachedEndOfList()) this.getMoreLibItems()
            }
            catch(error: any) {
                this.setLibraryLoaded(LibError.MORE_ITEMS)
            }
        }, this.FETCH_MORE_LIB_ITEMS_COOLDOWN_MS)
    }

    /**
     * Gets a fresh batch of items for the current library collection.
     */
    async refreshCurrentLibraryMedia() {
        let _userLibrary = this.userLibrary
        
        try {
            const musicStore = get(musicDataStore)

            this.setLibraryLoading(true)
            await musicStore!.refreshCurrentLibraryMedia()
            this.updateLibrary()
            this.setLibraryLoaded()
        }
        catch {
            this.userLibrary = _userLibrary
            this.setLibraryLoaded(LibError.REFRESH)
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
               !this.libError
    }

    /* Categories */
    handleDiscoverCollectionCardClicked(moodType: MusicMoodCategory) {
        const platformProp = getPlatfromPropName(this.platform)

        this.chosenMood = moodType
        this.chosenMusicCollection = getDiscoverCollectionList(moodType, platformProp) as (Playlist | Album | RadioStation)[]

        this.updateState({ chosenMood: this.chosenMood, chosenMusicCollection: this.chosenMusicCollection })
    }

    /* List Scroll Handlers + Styling */

    /**
     * Scroll handler for the libray list section.
     */
    handleLibListScroll() {
        const scrollStatus = getVertScrollStatus(this.libraryList!)
        this.handleLibListStyling(scrollStatus)
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
            isScrollableLeft: this.isScrollableLeft,isScrollableRight: this.isScrollableRight
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
        if (newState.libListGradient != undefined)        newStateObj.libListGradient = newState.libListGradient
        if (newState.isScrollableLeft != undefined)       newStateObj.isScrollableLeft = newState.isScrollableLeft
        if (newState.isScrollableRight != undefined)      newStateObj.isScrollableRight = newState.isScrollableRight
        
        // lib
        if (newState.currLibraryCollection != undefined) newStateObj.currLibraryCollection = newState.currLibraryCollection
        if (newState.isUserLibraryLoading != undefined)  newStateObj.isUserLibraryLoading = newState.isUserLibraryLoading
        if (newState.userLibrary != undefined)           newStateObj.userLibrary = newState.userLibrary
        if (newState.libError != undefined)              newStateObj.libError = newState.libError
        if (newState.libOptions != undefined)            newStateObj.libOptions = newState.libOptions
        
        return newStateObj
    }
}