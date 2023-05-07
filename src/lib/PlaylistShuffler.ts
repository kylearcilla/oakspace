
/**
 *  MusicPlaylistShuffler class represents a music playlist shuffler that can shuffle songs 
 *  ...based on a space-optimized Fisher-Yates algorithm.
 */
export class MusicPlaylistShuffler {
    startingIndex: number = 0;
    currentIndex: number = 0;
    indexPointer: number = -1
    shuffledIndexes: number[] = [];
    songCount: number = 0;
    totalPlayed: number = 0
    hasCompleted: boolean = false
    
    CHUNK_SIZE: number = 100;
  
    constructor(currentIndex: number, songCount: number) {
        this.startingIndex = currentIndex
        this.currentIndex = currentIndex
        this.songCount = songCount;
        this.initShuffleIndexes();
    }

    resetPlaylistShuffler() {
        this.currentIndex = 0
        this.indexPointer = 0

        this.shuffledIndexes = []
        this.initShuffleIndexes();
        this.hasCompleted = false
    }

    resetPlaylistShufflerForRepeat() {
        this.currentIndex = this.startingIndex
        this.indexPointer = 0
    }
  
    private initShuffleIndexes() {
      let size = Math.min(this.CHUNK_SIZE, this.songCount)
      this.shuffledIndexes = new Array(size);
  
      this.totalPlayed += size
  
      for (let i = 0; i <= size - 1; i++) {
        this.shuffledIndexes[i] = i;
      }
  
      this.shuffleArray(this.shuffledIndexes);
    }
  
    private shuffleArray(array: number[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
  
    private getNextChunk(): number[] {
        const currentSize = this.shuffledIndexes.length
        const size = Math.min(this.CHUNK_SIZE, this.songCount - this.shuffledIndexes.length)
  
        let currIndex = currentSize
        const nextChunkArray = new Array(size);
  
        for (let i = 0; i < size; i++) {
            nextChunkArray[i] = currIndex++;
        }
  
        this.totalPlayed += size
  
        this.shuffleArray(nextChunkArray)
        return nextChunkArray;
    }
  
    checkIfAtEnd() {
      return this.indexPointer >= this.shuffledIndexes.length
    }
  
    hasChunksLeft(): boolean {
      return this.totalPlayed < this.songCount
    }
  
    handlePlaylistHasEnded() {
        if (this.shuffledIndexes.length >= this.songCount) return -1
  
        this.indexPointer = -1
        this.shuffledIndexes = this.getNextChunk()
    }
  
    getNextIndex(): number {
        this.indexPointer++
        if (this.checkIfAtEnd()) return -1
        if (this.shuffledIndexes[this.indexPointer] === this.startingIndex) {
          return this.getNextIndex()
        }
  
        return this.currentIndex = this.shuffledIndexes[this.indexPointer]
    }
  }