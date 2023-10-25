import { MusicShufflerState } from "./enums";
import { removeMusicShuffleData, saveMusicShuffleData } from "./utils-music";

/**
 *  MusicPlaylistShuffler class for shuffling songs based on Fisher-Yates algorithm. 
 *  Space optimized for huge lists, creating a shuffled playlist of only CHUNK_SIZE items at a time.
 * 
 *  Will get an addition CHUNK_SIZE more if all the items of the prev chunk has been played, will repeat.
 *  If user starts off beyond CHUNK_SIZE, will start from 0 to CHUNK_SIZE.
 * 
 *  Used by AppleMusicPlayer, as Music Kit does not provide an API for toggling shuffle outside of using native ui controls.
 * 
 */
export class MusicPlaylistShuffler {
    startTrackIndex: number = 0
    trackIndex: number = 0;
    indexPointer: number = 0
    totalPlayed: number = 1

    songCount: number = 0;
    hasCompleted: boolean = false
    shuffledIndexes: number[] = []
    state: MusicShufflerState
    
    static CHUNK_SIZE: number = 100
  
    /**
     * 
     * @param trackIndex  The current index in the collection when user toggled shuffle on.
     * @param songCount   Total number of items in the collection.
     * @param prevData    Data loaded from local storage, from prev state.
     * @param chunkSize   Number of indices shuffled at a time. Will get next chunk of indices if current has been completely played.
     */
    constructor(trackIndex: number, songCount: number, prevData: MusicShufflerData | null = null, chunkSize: any = null) {
        if (prevData) {
            this.startTrackIndex = prevData.startTrackIndex
            this.trackIndex = trackIndex
            this.indexPointer = prevData.indexPointer
            this.shuffledIndexes = prevData.shuffledIndexes
            this.songCount = songCount
            this.totalPlayed = prevData.totalPlayed
            this.state = prevData.state
        }
        else {
            if (chunkSize) MusicPlaylistShuffler.CHUNK_SIZE = chunkSize
            this.startTrackIndex = trackIndex
            this.trackIndex = trackIndex
            this.songCount = songCount
            this.initShuffleIndexes()
            this.saveMusicPlayerData()
            this.state = songCount >= 1 ? MusicShufflerState.CAN_CONTINUE_CHUNK : MusicShufflerState.HAS_ENDED_NO_CHUNKS
        }
    }

    quit() {
        removeMusicShuffleData()
    }

    /**
     * Inititalize shuffled collection indices array. 
     * 
     */
    private initShuffleIndexes(): void {
        let size = Math.min(MusicPlaylistShuffler.CHUNK_SIZE, this.songCount)
        this.shuffledIndexes = new Array(size)
    
        for (let i = 0; i <= size - 1; i++) {
            this.shuffledIndexes[i] = i
        }
        if (this.songCount === 1) return 
        
        // make the current player index always first
        const temp = this.shuffledIndexes[0]
        this.shuffledIndexes[0] = this.shuffledIndexes[this.startTrackIndex]
        this.shuffledIndexes[this.startTrackIndex] = temp

        this.shuffleArray(this.shuffledIndexes)
    }

    /**
     * Uses Fisher-Yates algorithm to shuffle an array of playlist / album indices. 
     * Shuffles only the last n - 1 elements to ensure first index is current index.
     * 
     * @param array   Array of music collection indices to be shuffled.
     */
    private shuffleArray(array: number[]) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * i) + 1;
          [array[i], array[j]] = [array[j], array[i]];
        }
      }

    /**
     * Called when user presses skip to next item when shuffle is toggled on.
     * Gets the next index that should be played, updates the current idxPointer and track idx being played.
     * 
     * @param isLooped      Check to see if repeat is toggled on. If so then return the first index.
     * @returns             The prev pointer. If -1, the end has been reached.
     */
    getNextIndex(isLooped = false): number {
        this.indexPointer++

        if (!isLooped && this.state === MusicShufflerState.HAS_ENDED_NO_CHUNKS && this.indexPointer === this.shuffledIndexes.length) {
            this.indexPointer = 0           // prep the player to play the first idx if skip next is pressed
            this.saveMusicPlayerData()
            console.log("A")
            return -1
        }
        else if (isLooped && this.indexPointer === this.shuffledIndexes.length) {
            console.log("B")
            this.indexPointer = 0
        }
        else if (this.state === MusicShufflerState.HAS_ENDED_AND_MORE_CHUNKS) {
            console.log("C")
            this.initNextChunk()
        }

        console.log(this.indexPointer)

        this.trackIndex = this.shuffledIndexes[this.indexPointer]
        this.saveMusicPlayerData()
        return this.trackIndex
    }

    /**
     * Called when user presses skip to prev item when shuffle is toggled on.
     * 
     * @param isLooped  Check to see if repeat is toggled on. If so then return the last index.
     * @returns         The prev pointer. If -1, then a bound has been reached.
     */
    getPrevIndex(isLooped = false): number {
        if (!isLooped && this.state === MusicShufflerState.HAS_ENDED_NO_CHUNKS) {
            this.indexPointer = this.shuffledIndexes.length - 1
        }
        else if (isLooped && this.indexPointer === 0) {
            console.log("E")
            this.indexPointer = this.shuffledIndexes.length - 1
        }
        else if (!isLooped && this.indexPointer === 0) {
            this.indexPointer = 0
        }
        else {
            this.indexPointer = this.indexPointer - 1
        }

        this.trackIndex = this.shuffledIndexes[this.indexPointer]

        this.saveMusicPlayerData()
        return this.trackIndex
    }

    /**
     * Get the next CHUNK_SIZE items or if there are less, get the rest.
     * 
     * @returns         The next shuffled CHUNK_SIZED items.
     */
    private getNextChunk(): number[] {
        const currentSize = this.shuffledIndexes.length
        const size = Math.min(MusicPlaylistShuffler.CHUNK_SIZE, this.songCount - currentSize)
  
        let currIndex = currentSize
        const nextChunkArray = new Array(size)
  
        for (let i = 0; i < size; i++) {
            nextChunkArray[i] = currIndex++
        }

        this.shuffleArray(nextChunkArray)
        this.saveMusicPlayerData()
        return nextChunkArray
    }
  
    /**
     * Get the next CHUNK SIZE items, shuffle and put it in running shuffled indices.
     */
    initNextChunk() {
        this.indexPointer = this.shuffledIndexes.length - 1
        this.shuffledIndexes = [...this.shuffledIndexes, ...this.getNextChunk()]
        this.saveMusicPlayerData()
    }

    /**
     * Check to see if there are songs lefts in the playlist.
     * 
     * @returns 
     */
    hasChunksLeft(): boolean {
        return this.shuffledIndexes.length < this.songCount
    }

    /**
     * Keep the shuffler's state updated to keep it in-sync with the music player.
     * Called before updating indices.
     */
    newItemIsPlayingHandler(isNext: boolean, isLooped: boolean): void {
        const change = isNext ? 1 : -1
        const canContinueChunk = isLooped || this.indexPointer + change < this.shuffledIndexes.length
        let newState

        if (canContinueChunk) {
            newState = MusicShufflerState.CAN_CONTINUE_CHUNK
            console.log("CAN CONTINUE")
        }
        
        const hasEndedAndMoreChunks = !canContinueChunk && this.hasChunksLeft()
        if (hasEndedAndMoreChunks) {
            newState =  MusicShufflerState.HAS_ENDED_AND_MORE_CHUNKS
            console.log("HAS ENDED: MORE CHUNKS")
        }
        
        const hasEndedAndNoMoreChunks = !canContinueChunk && !this.hasChunksLeft()
        if (hasEndedAndNoMoreChunks) {
            newState = MusicShufflerState.HAS_ENDED_NO_CHUNKS
            console.log("HAS ENDED: NO CHUNKS")
        }

        this.state = newState!
        this.saveMusicPlayerData()
    }

    /**
     * Check to see if running pointer is out of bounds of running shuffled indices.
     * 
     * @param indexPointer   Running pointer. Increments / decrements when user skipts to next / prev when shuffled.
     * @returns 
     */
    checkIfOutOfBounds(indexPointer: number = this.indexPointer) {
        return indexPointer >= this.shuffledIndexes.length || indexPointer < 0
    }

    saveMusicPlayerData() {
        saveMusicShuffleData({
            startTrackIndex: this.startTrackIndex, 
            trackIndex: this.trackIndex, 
            indexPointer: this.indexPointer, 
            shuffledIndexes: this.shuffledIndexes,
            songCount: this.songCount, 
            totalPlayed: this.totalPlayed,
            hasCompleted: this.hasCompleted,
            state: this.state,
        })
    }
  }