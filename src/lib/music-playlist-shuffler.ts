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
    
    static CHUNK_SIZE: number = 100;

    CAN_CONTINUE_CHUNK = 1

    HAS_ENDED_AND_MORE_CHUNKS = 2
    HAS_ENDED_NO_CHUNKS = 3
    USER_IS_PLAYING_AFTER_ENDED = 100
  
    /**
     * 
     * @param trackIndex  The current index in the collection when user toggled shuffle on.
     * @param songCount   Total number of items in the collection.
     * @param prevData    Data loaded from local storage, from prev state.
     * @param chunkSize   Number of indices shuffled at a time. Will get next chunk of indices if current has been completely played.
     */
    constructor(trackIndex: number, songCount: number, prevData: MusicShufflerState | null = null, chunkSize: any = null) {
        if (prevData) {
            this.startTrackIndex = prevData.startTrackIndex
            this.trackIndex = trackIndex
            this.indexPointer = prevData.indexPointer
            this.shuffledIndexes = prevData.shuffledIndexes
            this.songCount = songCount
            this.totalPlayed = prevData.totalPlayed
        }
        else {
            if (chunkSize) MusicPlaylistShuffler.CHUNK_SIZE = chunkSize
            
            this.startTrackIndex = trackIndex
            this.trackIndex = trackIndex
            this.songCount = songCount
            this.initShuffleIndexes()
            this.saveStateLocally()
        }
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
        
        // make the index when user toggled shuffle is always first
        const temp = this.shuffledIndexes[0]
        this.shuffledIndexes[0] = this.shuffledIndexes[this.startTrackIndex]
        this.shuffledIndexes[this.startTrackIndex] = temp

        this.shuffleArray(this.shuffledIndexes)
    }
    
    /**
     * Readies the shuffler for repeat when player has played the entire collection.
     * When pressed play after, it will play from the first index.
     */
    resetPlaylistShufflerForRepeat(): void {
        this.trackIndex = this.startTrackIndex
        this.indexPointer = 0
        this.totalPlayed = 1
        this.hasCompleted = false
        this.saveStateLocally()
    }
    
    /**
     * Get current state of shuffler. 
     * State depends on if there's still items left to play in chunk and if there's chunks left.
     * 
     * @returns   One of 3 states
     */
    getState() {
        if (!this.hasCompleted) return this.CAN_CONTINUE_CHUNK 
        
        const hasEndedAndMoreChunks = this.hasCompleted && this.hasChunksLeft()
        if (hasEndedAndMoreChunks) return this.HAS_ENDED_AND_MORE_CHUNKS
        
        const noChunksLeft = !hasEndedAndMoreChunks
        if (noChunksLeft) return this.HAS_ENDED_NO_CHUNKS
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
     * 
     * @param isLooped      Check to see if repeat is toggled on. If so then return the first index.
     * @param hasJustEnded  If collection has just ended and next is pressed, make sure the first item is played.
     * @returns             The prev pointer. If -1, then a bound has been reached.
     */
    getNextIndex(isLooped = false, hasJustEnded = false): number {
        if (!isLooped && this.checkIfOutOfBounds(this.indexPointer + 1)) {
            this.hasCompleted = true
            this.saveStateLocally()
            return -1
        }
        
        if (!isLooped) this.totalPlayed += hasJustEnded ? 0 : 1

        if (isLooped && this.indexPointer === this.shuffledIndexes.length - 1) {
            this.indexPointer = 0
        }
        else {
            this.indexPointer = hasJustEnded ? 0 : this.indexPointer + 1
        }

        this.trackIndex = this.shuffledIndexes[this.indexPointer]

        this.saveStateLocally()
        return this.trackIndex
    }

    /**
     * Called when user presses skip to prev item when shuffle is toggled on.
     * 
     * @param isLooped  Check to see if repeat is toggled on. If so then return the last index.
     * @returns         The prev pointer. If -1, then a bound has been reached.
     */
    getPrevIndex(isLooped = false): number {
        if (!isLooped && this.hasCompleted) return -1
        if (!isLooped && this.checkIfOutOfBounds(this.indexPointer - 1)) return -1
        
        this.indexPointer = isLooped && this.indexPointer === 0 ? this.shuffledIndexes.length - 1 : this.indexPointer - 1

        if (!isLooped) this.totalPlayed -= 1
        this.trackIndex = this.shuffledIndexes[this.indexPointer]
        this.saveStateLocally()
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
        this.saveStateLocally()
        return nextChunkArray
    }
  
    /**
     * Get the next CHUNK SIZE items, shuffle and put it in running shuffled indices.
     */
    initNextChunk() {
        this.hasCompleted = false
        this.indexPointer = this.shuffledIndexes.length - 1
        this.shuffledIndexes = [...this.shuffledIndexes, ...this.getNextChunk()]
        this.saveStateLocally()
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
     * Check to see if running pointer is out of bounds of running shuffled indices.
     * 
     * @param indexPointer   Running pointer. Icrements / decrements when user skipts to next / prev when shuffled.
     * @returns 
     */
    checkIfOutOfBounds(indexPointer: number = this.indexPointer) {
        return indexPointer >= this.shuffledIndexes.length || indexPointer < 0
    }

    saveStateLocally() {
        localStorage.setItem("music-shuffle-data", JSON.stringify({
            startTrackIndex: this.startTrackIndex, 
            trackIndex: this.trackIndex, 
            indexPointer: this.indexPointer, 
            shuffledIndexes: this.shuffledIndexes,
            songCount: this.songCount, 
            totalPlayed: this.totalPlayed,
            hasCompleted: this.hasCompleted
        }))
    }
  }