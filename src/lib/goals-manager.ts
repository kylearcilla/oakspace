import { get } from "svelte/store"
import type { GoalStatus } from "./enums"
import { goalsManager } from "./store"
import { getElemById, getScrollStatus } from "./utils-general"
import { accomplishments2023, accomplishments2021, accomplishments2022 } from "./utils-goals"
import { YR_CONTAINER_ID, YR_DIGIT_ANIMATION, YR_DIGIT_CLASS, goals } from "./utils-journal"

/**
 * This class provides an abstract interface for interacing with the Journal modal.
 * Manages the state and behavior Journal component.
 * Is itself a reactive class where store is initialized on instantiation.
 */
export class GoalsManager {
    userGoals: (Goal | null)[][]
    userAccomplishments: YrAccomplishmentsOverview[]
    
    yrIdx = -1
    currYr: number
    userStartYr = 2018

    scrollCheckPoints: number[] = []
    backCheckPointIdx = -1
    frontCheckPointIdx = -1

    constructor() {
        this.currYr = new Date().getFullYear()
        this.userGoals = [[],[],[]]
        this.userAccomplishments = []

        goalsManager.set(this)
    }

    quit() {
        goalsManager.set(null)
    }

    /**
     * Update the current state. 
     * Save the data to local storage.
     * Object destructuring is avoided as it fails to include inherited types from abstract class.
     * 
     * @param newGoalsState   New state
     */
    updateMusicPlayerState(newGoalsState: Partial<GoalsManager>) {
        goalsManager.update((player: GoalsManager | null) => {
            return this.getNewStateObj(newGoalsState, player! as GoalsManager)
        })
        this.saveState()
    }

    getGoal(status: GoalStatus, goalIdx: number): Goal {
        return this.userGoals[status][goalIdx]!
    }

   /**
    * Update a goal item's status
    * @param goalId   Id of goal item whose status needs to be updated.   
    * @param nbrId    Nearest new bottom nbr.
    */
   updateGoalStatus(goalId: string, nbrId: string) {
        let oldItemIdx = parseInt(goalId.substring(8, goalId.length), 10)
        let oldStatus = parseInt(goalId[6]) as GoalStatus

        let newItemIdx = parseInt(nbrId.substring(8, nbrId.length), 10)
        let newStatus = parseInt(nbrId[6]) as GoalStatus

        // if newItem < 0, then that means it was placed in the last place in the column
        newItemIdx = newItemIdx < 0 ? this.userGoals[newStatus].length : newItemIdx
        const newItem = { ...this.userGoals[oldStatus][oldItemIdx]!, idx: newItemIdx }

        this.removeFromOldStatusArray(oldStatus, oldItemIdx)
        this.addToNewStatusArray(newItem, newStatus, newItemIdx)

        this.updateMusicPlayerState({ userGoals: this.userGoals })
    }

   /**
    * Put the updated goal in the new column.
    * @param newGoal     New goal
    * @param newStatus   Status of new goal
    * @param newGoalIdx  Idx of where the new goal will be placed.
    * @returns 
    */
   addToNewStatusArray(newGoal: Goal, newStatus: GoalStatus, newGoalIdx: number) {
        const newStatusArray = this.userGoals[newStatus]
        if (newGoalIdx === newStatusArray.length) {
            newStatusArray.push(newGoal)
            return
        }
        newStatusArray.push(null)

        // moves every right nbr to the right
        for (let i = newStatusArray.length - 2; i >= newGoalIdx; i--) {
            const goal = newStatusArray[i]!

            goal.idx = i + 1
            goal.status = newStatus
            newStatusArray[i + 1] = goal
            newStatusArray[i] = null
        }
        newStatusArray[newGoalIdx] = newGoal
    }

   /**
    * Remove the updated goal from its old column.
    * @param oldStatus    Goal's old status.
    * @param oldItemIdx   Goal's old place idx.
    */
   removeFromOldStatusArray(oldStatus: GoalStatus, oldItemIdx: number) {
        let oldStatusArray = this.userGoals[oldStatus]
        let emptyCutOff = oldStatusArray.length - 1

        // moves every right nbr to the left
        for (let i = oldItemIdx; i < oldStatusArray.length - 1; i++) {
            oldStatusArray[i] = null
            const nextGoal = oldStatusArray[i + 1]

            if (!nextGoal) {
                emptyCutOff = i + 1
                break
            }

            nextGoal.idx = i
            oldStatusArray[i] = nextGoal
        }

        // truncate null subarray
        this.userGoals[oldStatus] = oldStatusArray.slice(0, emptyCutOff)
    }

    /**
     * Puts goals into a 3 x n, 2D userGoals array in order of their idx properties.
     * 0th = on-hold, 1th = in-progress, 2nd = accomplished
     */
    initGoals() {
        const goalsContainer: Goal[][] = [[],[],[]]

        for (const goal of goals) {
            const rowIdx = goal.status
            goalsContainer[rowIdx].push(goal)
        }
        for (let i = 0; i < 3; i++) {
            this.userGoals[i] = new Array(goalsContainer[i].length).fill(null)
        }
        for (let rowIdx = 0; rowIdx < goalsContainer.length; rowIdx++) {
            const row: Goal[] = goalsContainer[rowIdx]

            for (const goal of row) {
                this.userGoals[rowIdx][goal.idx] = goal
            }
        }

        this.updateMusicPlayerState({ userGoals: this.userGoals })
    }

    /**
     * Get a given year's accomplishements (goals and milestones)
     * @param yr   Year in question.
     */
    getYearAccomplishment(yr: number) {
        if (yr === 2023) {
            this.userAccomplishments.push(accomplishments2023)
        }
        else if (yr === 2021) {
            this.userAccomplishments.push(accomplishments2021)
        }
        else if (yr === 2022) {
            this.userAccomplishments.push(accomplishments2022)
        }
        else {
            this.userAccomplishments.push({
                goalsAccomplished: 0,
                milestonesReached: 0,
                newGoals: 0,
                accomplishments: []
            })
        }

        this.updateMusicPlayerState({ yrIdx: this.yrIdx, userAccomplishments: this.userAccomplishments })
    }

    /**
     * Get more accomplishments from previous years.
     * Triggers when user scrolls down to the bottom of the current year.
     */
    getMoreAccomplishments() {
        this.yrIdx++
        this.getYearAccomplishment(this.currYr - this.yrIdx)
    }

    /**
     * Scroll event handler that tracks user's place in the list to 
     * know what year to update to when leaving / entering a year section.
     * @param event  Scroll event
     * @returns 
     */
    goalsHistoryTimeScrollHandler(event: Event) {
        const target = event.target as HTMLElement
        const [hasReachedEnd, _, { scrollTop }] = getScrollStatus(target!, { bottomOffSet: 5 })

        const preYr = this.currYr - Math.max(this.yrIdx, 0) - 1
        const doFetchMore = preYr >= this.userStartYr 
        const hasCheckPointAhead = this.backCheckPointIdx < this.scrollCheckPoints.length - 1

        if (hasReachedEnd && doFetchMore) {
            this.getMoreAccomplishments()
            this.scrollCheckPoints.push(scrollTop)
            this.backCheckPointIdx++
            this.updateYrTitle()
        }
        else if (scrollTop <= this.scrollCheckPoints[this.backCheckPointIdx]) {
            this.frontCheckPointIdx = this.backCheckPointIdx
            this.backCheckPointIdx--
            this.yrIdx--
            this.updateYrTitle()
        }
        else if (hasCheckPointAhead && scrollTop >= this.scrollCheckPoints[this.frontCheckPointIdx]) {
            // user has scrolled back to prev yr and there is a yr ahead
            this.backCheckPointIdx = this.frontCheckPointIdx
            this.frontCheckPointIdx++
            this.yrIdx++
            this.updateYrTitle()
        }

        this.updateMusicPlayerState({ 
            yrIdx: this.yrIdx, 
            frontCheckPointIdx: this.frontCheckPointIdx, 
            backCheckPointIdx: this.backCheckPointIdx, 
            scrollCheckPoints: this.scrollCheckPoints,
        })

        
        console.log(this.scrollCheckPoints)
    }

    /**
     * Update the current year element currently focused on in goals history timeline
     * @param yrIdx  Number of years from current yr.
     */
    updateYrTitle(yrIdx = this.yrIdx) {
        if (yrIdx < 0) return

        const titleContainer = getElemById(YR_CONTAINER_ID)
        if (!titleContainer) return

        // remove all digit elements
        while (titleContainer.firstChild) {
            titleContainer.removeChild(titleContainer.firstChild);
        }

        // get the the new year
        const numArr = (this.currYr - yrIdx).toString().split("")

        // create elemtns for each digit, attach animations, and put in container
        numArr.forEach((digit: string, idx: number) => {
            const newDigitElem = document.createElement("div")
            newDigitElem.className = YR_DIGIT_CLASS
            newDigitElem.textContent = digit
            titleContainer.appendChild(newDigitElem)

            newDigitElem.style.animation = YR_DIGIT_ANIMATION
            newDigitElem.style.animationDelay = `${idx * 40}ms`
        })
    }

    /**
     * Get the updated version of the old state. 
     * This is done to avoid destructuring as methods will not be incorporated.
     * 
     * @param newState  New state changes to be incorporated
     * @param oldState  Current state
     * @returns         New state with the latest incorporated changes.
     */
    getNewStateObj(newState: Partial<GoalsManager>, oldState: GoalsManager): GoalsManager {
        const newStateObj = oldState

        if (newState.yrIdx != undefined)                newStateObj!.yrIdx = newState.yrIdx
        if (newState.userGoals != undefined)            newStateObj!.userGoals = newState.userGoals
        if (newState.userAccomplishments != undefined)  newStateObj!.userAccomplishments = newState.userAccomplishments
        if (newState.scrollCheckPoints != undefined)    newStateObj!.scrollCheckPoints = newState.scrollCheckPoints
        if (newState.backCheckPointIdx != undefined)    newStateObj!.backCheckPointIdx = newState.backCheckPointIdx
        if (newState.frontCheckPointIdx != undefined)   newStateObj!.frontCheckPointIdx = newState.frontCheckPointIdx

        return newStateObj
    }

    saveState() {
        const musicPlayerState = get(goalsManager)!
        // saveMusicPlayerData({
        //     currentIdx: musicPlayerState.currentIdx,
        //     track: musicPlayerState.track,
        //     collection: musicPlayerState.collection,
        //     doShowPlayer: musicPlayerState.doShowPlayer,
        //     isPlaying: musicPlayerState.isPlaying,
        //     isDisabled: musicPlayerState.isDisabled,
        //     isRepeating: musicPlayerState.isRepeating,
        //     isShuffled: musicPlayerState.isShuffled,
        //     hasReachedEnd: musicPlayerState.hasReachedEnd
        // })
    }
}