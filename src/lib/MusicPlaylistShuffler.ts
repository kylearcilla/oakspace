
/**
 *  MusicPlaylistShuffler class for shuffling songs based on a Fisher-Yates algorithm. 
 *  Is space optimized for huge lists, creating a shuffled playlist of only 100 items at a time.
 *  Will get an addition 100 more if all the items of the prev chunk has been played.
 */
export class MusicPlaylistShuffler {
    startTrackIndex: number = 0;
    currentTrackIndex: number = 0;
    indexPointer: number = 0
    totalPlayed: number = 1

    songCount: number = 0;
    hasCompleted: boolean = false
    shuffledIndexes: number[] = [];
    
    static CHUNK_SIZE: number = 100;
    CAN_CONTINUE_CHUNK = 1
    HAS_ENDED_AND_MORE_CHUNKS = 2
    HAS_ENDED_NO_CHUNKS = 3
    USER_IS_PLAYING_AFTER_ENDED = 100
  
    // playlist starts of at first element of shuffled array, always the current item when shuffle was toggled    
    constructor(currentTrackIndex: number, songCount: number, prevData: any = null, chunkSize: any = null) {
        if (prevData) {
            this.startTrackIndex = prevData.startTrackIndex
            this.currentTrackIndex = prevData.currentTrackIndex
            this.indexPointer = prevData.indexPointer
            this.shuffledIndexes = prevData.shuffledIndexes
            this.songCount = prevData.songCount;
            this.totalPlayed = prevData.totalPlayed;
        }
        else {
            if (currentTrackIndex >= songCount) throw new Error('Starting Index Out Of Boounds!');
            if (chunkSize) MusicPlaylistShuffler.CHUNK_SIZE = chunkSize
            
            this.startTrackIndex = currentTrackIndex
            this.currentTrackIndex = currentTrackIndex
            this.songCount = songCount
            this.initShuffleIndexes();
        }
        this.saveStateLocally()
    }
    
    resetPlaylistShufflerForRepeat() {
        this.currentTrackIndex = this.startTrackIndex
        this.indexPointer = 0
        this.totalPlayed = 1
        this.hasCompleted = false
        this.saveStateLocally()
    }
    
    getState() {
        const canContinueCurrChunk = !this.hasCompleted
        if (canContinueCurrChunk) return this.CAN_CONTINUE_CHUNK 
        
        const hasEndedAndMoreChunks = !canContinueCurrChunk && this.hasChunksLeft()
        if (hasEndedAndMoreChunks) return this.HAS_ENDED_AND_MORE_CHUNKS
        
        const noChunksLeft = !hasEndedAndMoreChunks
        if (noChunksLeft) return this.HAS_ENDED_NO_CHUNKS
    }
    
    
    private initShuffleIndexes() {
        // Assuming user never starts an index greater than the shuffled array size then toggling shuffle
        // Causes array out of bounds issue when looking for startIndex
        // May be caused in playlist item selector after scrolling down 100+ playlists
        // ...then selects a starting index > shuffled array size

        let size = Math.min(MusicPlaylistShuffler.CHUNK_SIZE, this.songCount)
        this.shuffledIndexes = new Array(size);
    
        for (let i = 0; i <= size - 1; i++) {
            this.shuffledIndexes[i] = i;
        }
        if (this.songCount === 1) return 
        
        const temp = this.shuffledIndexes[0];
        this.shuffledIndexes[0] = this.shuffledIndexes[this.startTrackIndex]; // idx == itemIdx
        this.shuffledIndexes[this.startTrackIndex] = temp;

        this.shuffleArray(this.shuffledIndexes);
    }
  
    private shuffleArray(array: number[]) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * i) + 1;
          [array[i], array[j]] = [array[j], array[i]];
        }
      }

    getNextIndex(isLooped = false): number {
        if (!isLooped && this.checkIfOutOfBounds(this.indexPointer + 1)) {
            this.hasCompleted = true
            this.saveStateLocally()
            return -1
        }
        
        if (!isLooped) this.totalPlayed += 1
        this.indexPointer = isLooped && this.indexPointer === this.shuffledIndexes.length - 1 ? 0 : this.indexPointer + 1
        this.currentTrackIndex = this.shuffledIndexes[this.indexPointer]

        this.saveStateLocally()
        return this.currentTrackIndex
    }

    getPrevIndex(isLooped = false): number {
        if (!isLooped && this.hasCompleted) return -1
        if (!isLooped && this.checkIfOutOfBounds(this.indexPointer - 1)) return -1
        
        this.indexPointer = isLooped && this.indexPointer === 0 ? this.shuffledIndexes.length - 1 : this.indexPointer - 1
        if (!isLooped) this.totalPlayed -= 1
        this.currentTrackIndex = this.shuffledIndexes[this.indexPointer]
        this.saveStateLocally()
        return this.currentTrackIndex
    }

    private getNextChunk(): number[] {
        const currentSize = this.shuffledIndexes.length
        const size = Math.min(MusicPlaylistShuffler.CHUNK_SIZE, this.songCount - this.shuffledIndexes.length)
  
        let currIndex = currentSize
        const nextChunkArray = new Array(size);
  
        for (let i = 0; i < size; i++) {
            nextChunkArray[i] = currIndex++;
        }

        this.shuffleArray(nextChunkArray)
        this.saveStateLocally()
        return nextChunkArray;
    }
  
    initNextChunk() {
        this.hasCompleted = false
        this.indexPointer = this.shuffledIndexes.length - 1
        this.shuffledIndexes = [...this.shuffledIndexes, ...this.getNextChunk()]
        this.saveStateLocally()
    }

    hasChunksLeft(): boolean {
        return this.totalPlayed < this.songCount
    }

    checkIfOutOfBounds(indexPointer: number = this.indexPointer) {
        return indexPointer >= this.shuffledIndexes.length || indexPointer < 0
    }

    saveStateLocally() {
        localStorage.setItem("music-shuffle-data", JSON.stringify({
            startTrackIndex: this.startTrackIndex, 
            currentTrackIndex: this.currentTrackIndex, 
            indexPointer: this.indexPointer, 
            shuffledIndexes: this.shuffledIndexes,
            songCount: this.songCount, 
            totalPlayed: this.totalPlayed,
            hasCompleted: this.hasCompleted
        }))
    }
  }