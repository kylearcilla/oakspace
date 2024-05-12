import { WeeklyRoutinesManager } from '$lib/routines-manager'
import { get } from 'svelte/store'
import { describe, expect, vi } from 'vitest'
import { WEEKLY_ROUTINES } from './routines.data'

const TOTAL_DAY_MINS = 1440
const DAYS_WEEK = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ]

const scrollContainer = document.createElement('div')  // scrollable window
const blocksContainer = document.createElement('div')  // scroll contnet (board of routine blocks)

// render how they would appear (ful-height window)
scrollContainer.style.height = "428px"
scrollContainer.style.width = "750px"
scrollContainer.style.display = "block"

blocksContainer.style.height = "1210px"
blocksContainer.style.width = "750px"
blocksContainer.style.display = "block"


describe('Weekly Routines', () => {
    test('weekly routines are rendered properly', () => {
        const userWeeklyRoutine = WEEKLY_ROUTINES[0]

        // init the data & DOM refs & blocks
        const manager = new WeeklyRoutinesManager(userWeeklyRoutine)
        manager.initContainer(scrollContainer, blocksContainer)
        manager.processWeeklyRoutine()

        // const weekblockElems = get(manager.currWeekRoutineElems)!
        // const movedHeads = new Map<number, number>()
    })
})