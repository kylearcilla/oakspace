import { MusicPlaylistShuffler } from '$lib/MusicPlaylistShuffler';
import {beforeEach, describe, expect, it} from 'vitest';


describe('MusicPlaylistShuffler', () => {
  let playlist: MusicPlaylistShuffler | null

  test('Shuffled indices array initialized properly', () => {
    playlist = new MusicPlaylistShuffler(0, 1)
    expect(playlist.shuffledIndexes[0]).toBe(0)
    
    playlist = new MusicPlaylistShuffler(0, 2)
    expect(playlist.shuffledIndexes[0]).toBe(0)
    
    playlist = new MusicPlaylistShuffler(14, 100)
    expect(playlist.shuffledIndexes[0]).toBe(14)
    expect(playlist.shuffledIndexes.length).toBe(100)
    
    playlist = new MusicPlaylistShuffler(9, 101)
    expect(playlist.shuffledIndexes[0]).toBe(9)
    expect(playlist.shuffledIndexes.length).toBe(100)
    
    playlist = new MusicPlaylistShuffler(8, 150)
    expect(playlist.shuffledIndexes[0]).toBe(8)
    expect(playlist.shuffledIndexes.length).toBe(100)
    
  })

  test('User toggles repeat off while shuffled, then item plays next.', () => {
    const startIndex = 0
    const length = 6

    playlist = new MusicPlaylistShuffler(startIndex, length) 

    expect(playlist.indexPointer).toBe(0);
    expect(playlist.shuffledIndexes.length).toBe(6)

    /* User currently playing an index, just toggled off repeat */

    playlist = new MusicPlaylistShuffler(playlist.startTrackIndex, length) 
    playlist.indexPointer = -1

    expect(playlist.startTrackIndex).toBe(startIndex);
    expect(playlist.indexPointer).toBe(-1);

    /* After toggled off, next song plays */
    expect(playlist.getNextIndex()).greaterThanOrEqual(0)
    expect(playlist.indexPointer).toBe(0);

    console.log(localStorage.getItem("music-shuffle-data")) // props should match above
  })

  test('Move through 3 chunks while moving backwards to prev chunks', () => {
    const startIndex = 0
    const length = 6

    playlist = new MusicPlaylistShuffler(startIndex, length, null, 2) 
    console.log(playlist.shuffledIndexes)

    expect(playlist.shuffledIndexes.length).toBe(2)
    expect(playlist.indexPointer).toBe(0);
    
    /* Move Up Once */
    expect(playlist.getNextIndex()).greaterThanOrEqual(0)
    expect(playlist.indexPointer).toBe(1);
    
    /* New Chunk */
    expect(playlist.getNextIndex()).toBe(-1);
    expect(playlist.getState()).toBe(playlist.HAS_ENDED_AND_MORE_CHUNKS);
    playlist.initNextChunk()
    expect(playlist.shuffledIndexes.length).toBe(4)
    
    /* Move Up Two */
    expect(playlist.getNextIndex()).greaterThanOrEqual(0)
    expect(playlist.indexPointer).toBe(2);
    expect(playlist.getNextIndex()).greaterThanOrEqual(0)
    expect(playlist.indexPointer).toBe(3);
    
    /* New Chunk */
    expect(playlist.getNextIndex()).toBe(-1);
    expect(playlist.getState()).toBe(playlist.HAS_ENDED_AND_MORE_CHUNKS);
    playlist.initNextChunk()
    expect(playlist.shuffledIndexes.length).toBe(6)
    
    /* Move Up One */
    expect(playlist.getNextIndex()).greaterThanOrEqual(0)
    expect(playlist.indexPointer).toBe(4);

    /* Move Down Two */
    expect(playlist.getPrevIndex()).greaterThanOrEqual(0)
    expect(playlist.indexPointer).toBe(3);
    expect(playlist.getPrevIndex()).greaterThanOrEqual(0)
    expect(playlist.indexPointer).toBe(2);
    
    /* Move Up Two */
    expect(playlist.getNextIndex()).greaterThanOrEqual(0)
    expect(playlist.indexPointer).toBe(3);
    expect(playlist.getNextIndex()).greaterThanOrEqual(0)
    expect(playlist.indexPointer).toBe(4);
    
    /* Move Up One */
    expect(playlist.getNextIndex()).greaterThanOrEqual(0)
    expect(playlist.indexPointer).toBe(5);
    
    expect(playlist.getNextIndex()).toBe(-1);
    
    /* No More Chunks */
    expect(playlist.getState()).not.toBe(playlist.HAS_ENDED_AND_MORE_CHUNKS);
    expect(playlist.getState()).toBe(playlist.HAS_ENDED_NO_CHUNKS);
    
    /* Play Again */
    playlist.resetPlaylistShufflerForRepeat()
    expect(playlist.getNextIndex()).toBe(1)

    console.log(localStorage.getItem("music-shuffle-data")) // props should match above
  })

  test('Move back & forth through playlist and finish then prev, play, skip', () => {
    const testArr = [0, 2, 4, 6, 3, 5, 7, 8, 9, 1]
    const startIndex = 0
    const length = 10

    playlist = new MusicPlaylistShuffler(startIndex, length)  // playlist length < chunk size + start from 0
    playlist.shuffledIndexes = testArr

    expect(playlist.getState()).toBe(playlist.CAN_CONTINUE_CHUNK);
    expect(playlist.totalPlayed).toBe(1); 
    expect(playlist.indexPointer).toBe(0); 
    expect(playlist.currentTrackIndex).toBe(0); 

    /* User Goes Back */
    expect(playlist.getPrevIndex()).toBe(-1);
    expect(playlist.totalPlayed).toBe(1); // nothing changes
    expect(playlist.indexPointer).toBe(0); 

    expect(playlist.getNextIndex()).toBe(2); // go up 2
    expect(playlist.getNextIndex()).toBe(4);

    expect(playlist.totalPlayed).toBe(3);
    
    expect(playlist.getPrevIndex()).toBe(2); // go back 2
    expect(playlist.getPrevIndex()).toBe(0);

    expect(playlist.indexPointer).toBe(0);
    expect(playlist.totalPlayed).toBe(1);
    
    expect(playlist.getNextIndex()).toBe(2); // go up 2
    expect(playlist.getNextIndex()).toBe(4);

    expect(playlist.totalPlayed).toBe(3);
    expect(playlist.indexPointer).toBe(2);

    expect(playlist.getNextIndex()).toBe(6); // continue, here skipped starting index
    expect(playlist.getNextIndex()).toBe(3);
    expect(playlist.getState()).toBe(playlist.CAN_CONTINUE_CHUNK);
    expect(playlist.getNextIndex()).toBe(5);
    expect(playlist.getNextIndex()).toBe(7);

    expect(playlist.indexPointer).toBe(6);
    expect(playlist.totalPlayed).toBe(7);

    expect(playlist.getNextIndex()).toBe(8);
    expect(playlist.getNextIndex()).toBe(9);
    expect(playlist.getState()).toBe(playlist.CAN_CONTINUE_CHUNK);
    expect(playlist.getNextIndex()).toBe(1);

    expect(playlist.getNextIndex()).toBe(-1);

    /* User Has Finished */
    expect(playlist.getState()).not.toBe(playlist.HAS_ENDED_AND_MORE_CHUNKS);
    expect(playlist.getState()).toBe(playlist.HAS_ENDED_NO_CHUNKS);

    expect(playlist.indexPointer).toBe(9);
    expect(playlist.totalPlayed).toBe(10);
    expect(playlist.hasCompleted).toBe(true);
    expect(playlist.startTrackIndex).toBe(0);
    expect(playlist.currentTrackIndex).toBe(1);

    /* User Goes Back: Should Not Happen */
    expect(playlist.getPrevIndex()).toBe(-1);
    expect(playlist.totalPlayed).toBe(10);

    /* No testing user behavior after user is aiming to play again. Test A OR B  */
    playlist.resetPlaylistShufflerForRepeat()
    
    /* A: User Plays Again from the Top */
    // expect(playlist.getNextIndex()).toBe(2)
    // expect(playlist.indexPointer).toBe(1)
    // expect(playlist.totalPlayed).toBe(2)
    // expect(playlist.hasCompleted).toBe(false)
    
    /* B: User Skips to Next from the Top */
    expect(playlist.getNextIndex()).toBe(2)
    expect(playlist.getNextIndex()).toBe(4)

    expect(playlist.indexPointer).toBe(2)
    expect(playlist.totalPlayed).toBe(3)
    expect(playlist.hasCompleted).toBe(false)

    console.log(localStorage.getItem("music-shuffle-data")) // props should match above
  });
});