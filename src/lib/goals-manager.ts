import { get } from "svelte/store"
import { GoalViewOption, GoalsDropdown, type GoalStatus, GoalItemUI } from "./enums"
import { goalsManager } from "./store"
import { getElemById, getScrollStatus, moveElementInArr } from "./utils-general"
import { accomplishments2023, accomplishments2021, accomplishments2022 } from "./utils-goals"
import { YR_CONTAINER_ID, YR_DIGIT_ANIMATION, YR_DIGIT_CLASS, goals } from "./utils-journal"
import { goalSections } from "./utils-journal"

/**
 * This class provides an abstract interface for interacing with the Journal modal.
 * Manages the state and behavior Journal component.
 * Is itself a reactive class where store is initialized on instantiation.
 */
export class GoalsManager {
    userAccomplishments: YrAccomplishmentsOverview[]
    userGoals: (Goal | null)[][]
    goalSections: GoalSection[]
    goalSectionItems: (Goal)[][]

    isGoalView = true
    currentGoalView: GoalViewOption = GoalViewOption.Board
    currentDropDown: GoalsDropdown | null = null
    
    boardGoalItemView = GoalItemUI.BoardCard
    repoGoalItemView = GoalItemUI.RepoList

    sectionEditIdx: number | null = null

    // All Goals
    
    // History
    yrIdx = -1
    currYr: number
    userStartYr = 2018

    scrollCheckPoints: number[] = []
    backCheckPointIdx = -1
    frontCheckPointIdx = -1

    constructor() {
        this.currYr = new Date().getFullYear()
        this.userGoals = [[],[],[]]
        this.goalSections = []
        this.goalSectionItems = []
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
    updateGoalsManagerState(newGoalsState: Partial<GoalsManager>) {
        goalsManager.update((player: GoalsManager | null) => {
            return this.getNewStateObj(newGoalsState, player! as GoalsManager)
        })
        this.saveState()
    }

    /**
     * Set the current goal view one that user clicked.
     * @param view  View option clicked.
     */
    setCurrGoalView(view: GoalViewOption) {
        if (view === GoalViewOption.History) {
            requestAnimationFrame(() =>  this.updateYrTitle(0))
        }

        this.currentGoalView = view

        this.setCurrentDropdown(null)
        this.updateGoalsManagerState({ currentGoalView: view })
    }

    /**
     * Set current dropdown menu
     * @param dropdownOption   Dropdown user want to set.
     */
    setCurrentDropdown(dropdownOption: GoalsDropdown | null) {
        this.currentDropDown = this.currentDropDown != null ? null : dropdownOption
        
        this.updateGoalsManagerState({ currentDropDown: this.currentDropDown })
    }

    /**
     * Update current goal item display (as card or a list item).
     * Used for both Goals Repo and Goals Kanban Board Views.
     * @param isCard    Should goal item be a card.
     */
    setCurrentGoalItemView(isCard: boolean) {
        if (this.currentGoalView === GoalViewOption.Board) {
            this.setCurrBoardItemView(isCard ? GoalItemUI.BoardCard : GoalItemUI.BoardList)
        }
        else if (this.currentGoalView === GoalViewOption.AllGoals) {
            this.setCurrRepoItemView(isCard ? GoalItemUI.RepoCard : GoalItemUI.RepoList)
        }
    }

    /**
     * Chanes how goal items should be displayed, either as list items or Kanban board items.
     * @param goalItemView
     */
    setCurrBoardItemView(goalItemView: GoalItemUI) {
        this.boardGoalItemView = goalItemView
        this.updateGoalsManagerState({ boardGoalItemView: goalItemView })

        this.setCurrentDropdown(null)
    }

    /**
     * Chanes how goal items should be displayed, either as list items or Kanban board items.
     * @param goalItemView 
     */
    setCurrRepoItemView(goalItemView: GoalItemUI) {
        this.repoGoalItemView = goalItemView
        this.updateGoalsManagerState({ repoGoalItemView: goalItemView })

        this.setCurrentDropdown(null)
    }

    /**
     * Get a goal item given its stats and index.
     * @param status    Status of the desired goal.
     * @param goalIdx   Idx of the goal
     * @returns         Desired goal
     */
    getGoalFromStatus(status: GoalStatus, goalIdx: number): Goal {
        return this.userGoals[status][goalIdx]!
    }

    /**
     * Get a goal item given its section and index.
     * @param sectionIdx    Idx wheret section's iteams is located
     * @param goalIdx       Idx of the goal
     * @returns            Desired goal
     */
    getGoalFromSection(sectionIdx: number, goalIdx: number): Goal {
        return this.goalSectionItems[sectionIdx][goalIdx]!
    }

    /**
     * Section item drag to drop handler. 
     * Abstraction over moving section items when using drag and drop.
     * @param sourceId   Source id of the drag section goal item source.
     * @param targetId   Targeet id of the drop section goal item source.
     */
    onSectionItemDropHandler(sourceId: string, targetId: string) {
        const [srcItemId, targetItemId] = this.getSourceAndTargetSectionItemIdxs(sourceId, targetId)
        this.moveSectionItem(srcItemId, targetItemId)
    }

    /**
     * Extract the source and target ids for the source and target goal items.
     * @param sourceId   Source id of the drag section goal item source.
     * @param targetId   Targeet id of the drag sectin goal item source.
     * @returns          2-Goal-Item array that represents the ids of the source and target locations.
     */
    getSourceAndTargetSectionItemIdxs(sourceId: string, targetId: string): [GoalSectionItemId, GoalSectionItemId] {
        let oldItemSecId = parseInt(sourceId[6]) 
        let oldItemSecIdx = parseInt(sourceId.substring(8, sourceId.length), 10)

        let newItemSecId = parseInt(targetId[6])
        let newItemSecIdx = parseInt(targetId.substring(8, targetId.length), 10)
        
        if (newItemSecId === oldItemSecId && oldItemSecIdx < newItemSecIdx) {
            newItemSecIdx = Math.max(0, newItemSecIdx - 1)
        }

        let lastIdx = this.goalSectionItems[newItemSecId].length - (oldItemSecId === newItemSecId ? 1 : 0)
        newItemSecIdx = newItemSecIdx < 0 ? lastIdx : newItemSecIdx

        return [
            {
                sectionId: oldItemSecId,
                sectionItemIdx: oldItemSecIdx
            },
            {
                sectionId: newItemSecId,
                sectionItemIdx: newItemSecIdx
            }
        ]
    }

    /**
     * Move the dragging / drop goal items. 
     * @param fromSectionItemIdx   Section location id of the source goal item.
     * @param toSectionItemIdx     Section location id of the target goal item.
     */
    moveSectionItem(fromSectionItemIdx: GoalSectionItemId, toSectionItemIdx: GoalSectionItemId): void {
        const oldItemSecId = fromSectionItemIdx.sectionId
        const oldItemSecIdx = fromSectionItemIdx.sectionItemIdx

        const newItemSecId = toSectionItemIdx.sectionId
        const newItemSecIdx = toSectionItemIdx.sectionItemIdx

        const newSectionItem: Goal = { ...this.goalSectionItems[oldItemSecId][oldItemSecIdx]!, sectionId: newItemSecId, sectionIdx: newItemSecIdx }

        // update the arrays
        this.goalSectionItems[oldItemSecId] = this.removeFromGoalsArr(this.goalSectionItems[oldItemSecId], oldItemSecIdx) as Goal[]
        this.resetSectionIndiciesItem(this.goalSectionItems[oldItemSecId])

        this.goalSectionItems[newItemSecId] = this.addNewItemToGoalsArr(this.goalSectionItems[newItemSecId], newItemSecIdx, newSectionItem) as Goal[]
        this.resetSectionIndiciesItem(this.goalSectionItems[newItemSecId])

        // update array count
        if (newItemSecId != oldItemSecId) {
            this.goalSections[oldItemSecId] = { ...this.goalSections[oldItemSecId], length: this.goalSections[oldItemSecId].length - 1 }
            this.goalSections[newItemSecId] = { ...this.goalSections[newItemSecId], length: this.goalSections[newItemSecId].length + 1 }
        }

        this.updateGoalsManagerState({ goalSections: this.goalSections, goalSectionItems: this.goalSectionItems })
    }
    
    /**
     * Move the source section to the target location.
     * @param sourceId   Element id of the source section.
     * @param targetId   Element id of the target section.
     */
    moveSection(sourceId: string, targetId: string) {
        let oldItemIdx = parseInt(sourceId.split("--")[1])
        let newItemIdx = parseInt(targetId.split("--")[1])

        if (oldItemIdx < newItemIdx) {
            newItemIdx = Math.max(0, newItemIdx - 1)
        }

        newItemIdx = newItemIdx < 0 ? this.goalSections.length - 1 : newItemIdx

        this.goalSections[oldItemIdx].orderIdx = newItemIdx
        this.goalSections = moveElementInArr(this.goalSections, oldItemIdx, newItemIdx)
        this.resetSectionIndicies()

        this.updateGoalsManagerState({ goalSections: this.goalSections })
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

        if (oldStatus === newStatus && oldItemIdx < newItemIdx) {
            newItemIdx = Math.max(0, newItemIdx - 1)
        }

        let lastIdx = this.userGoals[newStatus].length - (oldStatus === newStatus ? 1 : 0)
        newItemIdx = newItemIdx < 0 ? lastIdx : newItemIdx

        const newItem = { ...this.userGoals[oldStatus][oldItemIdx]!, idx: newItemIdx }

        // update the arrays
        this.userGoals[oldStatus] = this.removeFromGoalsArr(this.userGoals[oldStatus], oldItemIdx)
        this.resetBoardIndices(this.userGoals[oldStatus] as Goal[])

        this.userGoals[newStatus] = this.addNewItemToGoalsArr(this.userGoals[newStatus], newItemIdx, newItem)
        this.resetBoardIndices(this.userGoals[newStatus] as Goal[])

        this.updateGoalsManagerState({ userGoals: this.userGoals })
    }

   /**
    * Put the updated goal in the new column.
    * @param newGoal     New goal
    * @param newStatus   Status of new goal
    * @param newGoalIdx  Idx of where the new goal will be placed.
    * @returns 
    */
   addNewItemToGoalsArr(arr: (Goal | null)[], newGoalIdx: number, newGoal: Goal) {
        arr.splice(newGoalIdx, 0, newGoal)
        return arr
    }

   /**
    * Remove the updated goal from its old column.
    * @param oldStatus    Goal's old status.
    * @param oldItemIdx   Goal's old place idx.
    */
   removeFromGoalsArr(arr: (Goal | null)[], oldItemIdx: number) {
        arr = arr.filter((goal: Goal | null, idx: number) => {
            if (idx != oldItemIdx) return goal
        })
        return arr
    }

    /**
     * Keep the goal ordering after an item has been moved
     * @param goalArr  Status array where a change has happened
     * @returns        Array with updated ordering
     */
    resetBoardIndices(goalArr: Goal[]): Goal[] {
        goalArr.map((goal: Goal | null, idx: number) => goal!.idx = idx)
        return goalArr
    }

    /**
     * Add a new section in Goal Repository component
     */
    addNewSection(name: string, insertIdx: number = this.goalSections.length) {
        this.goalSections.splice(insertIdx, 0, {
            name, orderIdx: insertIdx, 
            length: 0, isExpanded: true, tagRef: ""
        })
        this.goalSectionItems.splice(insertIdx, 0, [])

        this.resetSectionIndicies()
        this.setSectionEdit(null)
        this.updateGoalsManagerState({ goalSections: this.goalSections, goalSectionItems: this.goalSectionItems })
    }

    /** 
     * Keep the goal ordering after an item has been moved
     * @param goalArr  Status array where a change has happened
     * @returns        Array with updated ordering
     */
    resetSectionIndiciesItem(goalArr: Goal[]): Goal[] {
        goalArr.map((goal: Goal, idx: number) => goal!.sectionIdx = idx)
        return goalArr
    }

    /** 
     * Keep the section ordering after a section has been moved
     * @param sectionArr  Section array where a change has happened
     * @returns           Array with updated ordering
     */
    resetSectionIndicies() {
        this.goalSections.map((section: GoalSection, idx: number) => section.orderIdx = idx)
        this.updateGoalsManagerState({ goalSections: this.goalSections })
    }

    /**
     * Toggle expand goal section view.
     * @param seciontIdx  Idx of the section whose view should be expanded or minimized
     */
    toggleExpandGoalSection(sectionIdx: number) {
        this.goalSections![sectionIdx].isExpanded = !this.goalSections![sectionIdx].isExpanded
        this.updateGoalsManagerState({ goalSections: this.goalSections })
    }

    /**
     * Set the section being edited. 
     * Used to see which section's title is being changed.
     * @param sectionIdx  Idx of section that is being edited.
     */
    setSectionEdit(sectionIdx: number | null) {
        this.sectionEditIdx = sectionIdx
        this.updateGoalsManagerState({ sectionEditIdx: sectionIdx })
    }

    /**
     * Updates the section title with new one.
     * @param sectionIdx   Idx of sectino that should be changed.
     * @param newTitle     New title of the section.
     */
    changeSectionTitle(newTitle: string) {
        if (newTitle === "" || newTitle.length > 25) {
            this.setSectionEdit(null)
            return
        }
        
        this.goalSections[this.sectionEditIdx!].name  = newTitle
        this.updateGoalsManagerState({ goalSections: goalSections })
        this.setSectionEdit(null)
    }

    /**
     * Delete a goals section, will also delete all the goals under it.
     * @param sectionIdx Idx of section that should be deleted.
     */
    deleteSection(sectionIdx: number) {

    }

    // TODO: Have a single goals repository, status and section arrays all draw from it

    /**
     * Puts goals into a 3 x n, 2D userGoals array in order of their idx properties.
     * 0th = on-hold, 1th = in-progress, 2nd = accomplished
     */
    initGoals() {
        const goalsContainer: Goal[][] = [[],[],[]]
    
        // sections
        this.goalSections = goalSections
        this.goalSectionItems = new Array(this.goalSections.length)

        for (let i = 0; i < this.goalSections.length; i++) {
            const goalSection = this.goalSections[i]
            this.goalSectionItems[i] = new Array(goalSection.length)
        }

        // goals
        for (const goal of goals) {
            const rowIdx = goal.status
            goalsContainer[rowIdx].push(goal)

            const sectionOrderIdx = goal.sectionId
            this.goalSectionItems[sectionOrderIdx][goal.sectionIdx] = { ...goal }
        }

        // status
        for (let i = 0; i < 3; i++) {
            this.userGoals[i] = new Array(goalsContainer[i].length).fill(null)
        }
        for (let rowIdx = 0; rowIdx < goalsContainer.length; rowIdx++) {
            const row: Goal[] = goalsContainer[rowIdx]

            for (const goal of row) {
                this.userGoals[rowIdx][goal.idx] = goal
            }
        }

        this.updateGoalsManagerState({ 
            userGoals: this.userGoals, goalSections: this.goalSections, goalSectionItems: this.goalSectionItems
        })
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

        this.updateGoalsManagerState({ yrIdx: this.yrIdx, userAccomplishments: this.userAccomplishments })
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

        this.updateGoalsManagerState({ 
            yrIdx: this.yrIdx, 
            frontCheckPointIdx: this.frontCheckPointIdx, 
            backCheckPointIdx: this.backCheckPointIdx, 
            scrollCheckPoints: this.scrollCheckPoints,
        })
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
        if (newState.currentGoalView != undefined)      newStateObj!.currentGoalView = newState.currentGoalView
        if (newState.goalSections != undefined)         newStateObj!.goalSections = newState.goalSections
        if (newState.goalSectionItems != undefined)     newStateObj!.goalSectionItems = newState.goalSectionItems
        if (newState.boardGoalItemView != undefined)    newStateObj!.boardGoalItemView = newState.boardGoalItemView
        if (newState.repoGoalItemView != undefined)     newStateObj!.repoGoalItemView = newState.repoGoalItemView
        if (newState.sectionEditIdx != undefined)       newStateObj!.sectionEditIdx = newState.sectionEditIdx

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