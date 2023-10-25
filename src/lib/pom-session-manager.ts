import { get } from "svelte/store"
import { sessionManager, sessionStore } from "./store"
import { ModalType } from "./enums"
import { openModal } from "./utils-home"
import { MAX_TODO_COUNT, MAX_TODO_NAME_LENGTH, createSessionToastMsg } from "$lib/utils-session"

/**
 * This class provides an abstract interface for interacting with an active session store.
 * Manages the state and behavior of an Active Session UI Component.
 * The UI includes session to do list, dropdown for pom controls, modal controls, and inputs.
 * Is itself a reactive class where store is initialized on instantiation.
 */
export class PomSessionManger {
    newTitle = ""
    newTag: Tag = { name: "", color: "" }

    focusedTodoIndex = -1
    prevFocusedTodoIdx = -1
    todoToEditIndex = -1
    todoToEditNewTitle = ""
    newTodoTitle = ""
    isMakingNewTask = false

    hasSessionConcluded = false
    isDropDownOpen = false
    isEditSessionModalOpen = false
    isSessionFinishedModalOpen = false
    doShowBottomGradient = false
    doShowTopGradient = false
    
    todoListElement: HTMLElement
    
    NEW_TASK_INPUT_ID = "new-todo-input"
    TODO_LIST_MAX_HEIGHT = 400

    constructor(todoListElement: HTMLElement, maxTodoListElementHeight: number) {
      this.todoListElement = todoListElement
      this.TODO_LIST_MAX_HEIGHT = maxTodoListElementHeight
      sessionManager.set(this)
    }

    /**
     * Updates the store object of this instance.
     * @param newData 
     */
     updateSessionManger(newData: Partial<PomSessionManger>) {
      sessionManager.update((data: PomSessionManger | null) => {
          return this.geNewStateObj(newData, data!)        
      })
    }

    /**
     * @param doShow  Do show edit current session modal modal.
     */
    toggleEditSessionModal(doShow: boolean) {
      this.isEditSessionModalOpen = doShow
      this.updateSessionManger({ isEditSessionModalOpen: this.isEditSessionModalOpen })

      if (doShow) openModal(ModalType.EditSession)
    }

    /**
     * Occurs when the session has finished. 
     */
    finishSession() {
      get(sessionStore)!.finishSession()
    }

    /**
     * After a session has finished, show the session stats to the user.
     */
    concludeSessionBtnClicked() {
      this.hasSessionConcluded = true
      this.isSessionFinishedModalOpen = true

      this.updateSessionManger({ 
        hasSessionConcluded: this.hasSessionConcluded, 
        isSessionFinishedModalOpen: this.isSessionFinishedModalOpen 
      })

      openModal(ModalType.SesssionFinished)
    }

    /**
     * Clear a just-finished or just-canceled session.
     * Occurs after the user has been shown the session stats.
     */
    clearSession() {
      this.isSessionFinishedModalOpen = false
      this.updateSessionManger({ isSessionFinishedModalOpen: this.isSessionFinishedModalOpen })

      get(sessionStore)!.clearSession()
      sessionStore.set(null)
    }

    /**
     * Toggle drop down controls list.
     */
    togglePomControlsDropDown() {
      this.isDropDownOpen = !this.isDropDownOpen
      this.updateSessionManger({ isDropDownOpen: this.isDropDownOpen })
    }

    /**
     * Handles the click event when a dropdown option is selected in the Pomodoro session dropdown controls list.
     * @param optionIdx  Index of the selected dropdown option
     */
    pomControlsDropdownBtnHandler(optionIdx: number) {
      const sess = get(sessionStore)!

      if (optionIdx === 0) {
          this.toggleEditSessionModal(true)

          this.newTag = sess!.tag
          this.newTitle = sess!.name

          this.updateSessionManger({ newTag: this.newTag, newTitle: this.newTitle })
      }
      else if (optionIdx === 1) {
          sess!.isPlaying? sess!.pauseSession() : sess!.playSession()
      }
      else if (optionIdx === 2) {
          sess!.restartPeriod()
      }
      else if (optionIdx === 3) {
          sess!.skipToNextPeriod()
      }
      else if (optionIdx === 4) {
          sess!.cancelSession()
      }
      else {
          sess!.finishSession()
      }
    }

    /**
     * Change to an "adding-to-do" state when add button is clicked.
     */
    addTodoBtnClicked() {
      this.isMakingNewTask = true
      this.updateSessionManger({ isMakingNewTask: this.isMakingNewTask })

      requestAnimationFrame(() => {
        const newTaskInput = document.getElementById(this.NEW_TASK_INPUT_ID)! as HTMLInputElement
        newTaskInput.focus()
      })
    }

    /**
     * Make new todo based on the user input values.
     * Show the fade the bottom of the list when list max height has been reached.
     */
    finishAddingTodo() {
      if (this.newTodoTitle === "" || this.newTodoTitle.length > MAX_TODO_NAME_LENGTH) return

      if (get(sessionStore)!.todos.length === MAX_TODO_COUNT) {
        createSessionToastMsg("Max todo count reached.")
        this.cancelAddingTodo()
        return
      }
      
      get(sessionStore)!.addTodo(this.newTodoTitle)
      this.cancelAddingTodo()
      
      requestAnimationFrame(() => {
        this.doShowBottomGradient = this.todoListElement.clientHeight === this.TODO_LIST_MAX_HEIGHT ? true : this.doShowBottomGradient
        this.updateSessionManger({  doShowBottomGradient: this.doShowBottomGradient })
      })
      
    }

    /**
     * Reset default values for new todo input values. No longer in "adding-to-do" state.
     */
    cancelAddingTodo() {
      this.newTodoTitle = ""
      this.isMakingNewTask = false

      this.updateSessionManger({ 
        newTodoTitle: this.newTodoTitle, isMakingNewTask: this.isMakingNewTask
      })
    }

    /**
     * Event handler for new to-do text input element.
     * @param event
     */
    newTodoTextInputHandler(event: Event) {
      this.newTodoTitle = (event.target as HTMLInputElement).value

      this.updateSessionManger({ newTodoTitle: this.newTodoTitle })
    }

    /**
     * Update the todo being edited.
     */
    finishEditingTodo() {
      get(sessionStore)!.editTodo(this.todoToEditIndex, this.todoToEditNewTitle)

      this.todoToEditIndex = -1
      this.todoToEditNewTitle = ""

      this.updateSessionManger({ 
        todoToEditIndex: this.todoToEditIndex, todoToEditNewTitle: this.todoToEditNewTitle
      })
    }

    /**
     * Delete a todo element.
     * Remove bottom gradient of todo list its height has dropped below max height.
     * @param index  Index of todo to be deleted.
     */
    deleteTodo(index: number) {
      get(sessionStore)!.deleteTodo(index)
      this.todoToEditIndex = -1
      this.todoToEditNewTitle = ""

      this.updateSessionManger({  todoToEditIndex: this.todoToEditIndex, todoToEditNewTitle: this.todoToEditNewTitle })
      
      requestAnimationFrame(() => {
        this.doShowBottomGradient = this.todoListElement.clientHeight < this.TODO_LIST_MAX_HEIGHT ? false : this.doShowBottomGradient
        this.updateSessionManger({  doShowBottomGradient: this.doShowBottomGradient })
      })
    }

    /**
     * Button handler for when an edit icon has been clicked. 
     * To-do element will update to a "editing" state.
     * @param index  Index of to do be edited.
     */
    editTodoBtnClicked(index: number) {
      this.todoToEditIndex = index
      this.todoToEditNewTitle = get(sessionStore)!.todos[index].title

      this.updateSessionManger({ 
        todoToEditIndex: this.todoToEditIndex, todoToEditNewTitle: this.todoToEditNewTitle
      })
      this.resetCurrentFocusedTodoIdx()
      
      requestAnimationFrame(() => {
        const todoToEditInput = document.getElementById(`todo-${index}`)!
        todoToEditInput.focus()
      })
    }

    /**
     * Event handler for edit todo title input. 
     * @param event 
     */
    editTodoInputHandler(event: Event) {
      this.todoToEditNewTitle = (event.target as HTMLInputElement).value
      this.updateSessionManger({ todoToEditNewTitle: this.todoToEditNewTitle })
    }

    /**
     * Reset current editing todo index.
     */
    resetCurrentEditingTodoIdx() {
      this.todoToEditIndex = -1
      this.updateSessionManger({ todoToEditIndex: this.todoToEditIndex })
    }

    /**
     * Checks / unchecks given todo.
     * @param idx  Index of todo element.
     */
    toggleTodoCheckBox(idx: number) {
      get(sessionStore)!.toggleCheckTodo(idx)
    }

    /**
     * Scroll event handler for todo list.
     * Will show top / bottom gradients if there's space to scroll up / down.
     */
    todoListElementScrollHandler() {
      const scrollTop = this.todoListElement.scrollTop
      const windowHeight = this.todoListElement.clientHeight
      const scrollHeight = this.todoListElement.scrollHeight

      this.toggleShowTopGradient(scrollTop > 0)
      this.toggleShowBottomGradient(Math.ceil(scrollTop) < scrollHeight - windowHeight)
    }

    /**
     * @param doShow Do show top gradient.
     */
    toggleShowTopGradient(doShow: boolean) {
      this.doShowTopGradient = doShow
      this.updateSessionManger({ doShowTopGradient: this.doShowTopGradient })
    }

    /**
     * 
     * @param doShow Do show bottom gradient.
     */
    toggleShowBottomGradient(doShow: boolean) {
      this.doShowBottomGradient = doShow
      this.updateSessionManger({ doShowBottomGradient: this.doShowBottomGradient })
    }

    /**
     * Keyboard event handler for session manager shortcuts.
     * @param event 
     */
    keyboardShortcutHandler(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.tagName === "INPUT") return

      if (event.ctrlKey && event.key === "=") {
        this.addTodoBtnClicked()
        return
      }
      else if (event.key === "Escape" && this.isMakingNewTask) {
        this.cancelAddingTodo()
        return
      }
      else if (event.key === "Escape" && this.todoToEditIndex >= 0) {
        this.resetCurrentEditingTodoIdx()
        return
      }
      else if (event.key === "e" && event.ctrlKey && this.focusedTodoIndex >= 0) {
        this.editTodoBtnClicked(this.focusedTodoIndex)
        return
      }
      else if (event.key === "Backspace" && this.focusedTodoIndex >= 0) {
        this.deleteTodo(this.focusedTodoIndex)
        return
      }
      else if (event.key === "Enter" && this.focusedTodoIndex >= 0) {
        this.toggleTodoCheckBox(this.focusedTodoIndex)
        return
      }
      else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        const todosLength = get(sessionStore)!.todos.length
        if (todosLength === 0 || this.todoToEditIndex >= 0) return

        let focusTodoIdx = 0

        if (event.key === "ArrowUp") {
          focusTodoIdx = this.focusedTodoIndex === -1 ? 0 : Math.max(this.focusedTodoIndex, 1) - 1
        }
        else if (event.key === "ArrowDown") {
          focusTodoIdx = this.focusedTodoIndex === -1 ? 0 : Math.min(this.focusedTodoIndex + 1, todosLength - 1)
        }

        this.focusSelectedTodo(focusTodoIdx)
      }
  }

  /**
   * Separate todo focus handler for when a todo item has been focused using tabs or click event.
   * Avoid focusing if there currently a todo being edited.
   * 
   * @param event     Focus event to handle
   * @param todoIdx   Index of todo focused on.
   */
  onTodoFocusEventHandler (event: FocusEvent, todoIdx: number) {
    // @ts-ignore
    if (!event.sourceCapabilities) return

    if (this.todoToEditIndex >= 0) {
      const todoElement = event.target! as HTMLElement
      todoElement.blur()
      return
    }
    
    this.focusSelectedTodo(todoIdx)
  }

  /**
   * Get the todo element from the index being focused on.
   * @param idx  Todo index that's being focused.
   * @returns    Todo element focused on.
   */
  findTodoElementFromIdx (idx: number): HTMLElement | null {
    const todosList = this.todoListElement.children

    for (let i = 0; i < todosList.length; i++) {
      if (i != idx) continue
      return todosList[i] as HTMLElement
    }

    return null
  }

  /**
   * Given a todo index, focus that todo element and update the state.
   * Then attach an onblur handler.
   * @param idx 
   */
  focusSelectedTodo(idx: number) {
    this.focusedTodoIndex = idx
    this.updateSessionManger({ focusedTodoIndex: this.focusedTodoIndex })

    const todoElement = this.findTodoElementFromIdx(idx)!
    todoElement.focus()

    todoElement.addEventListener('blur', this.focusedTodoOnBlurHandler)
    todoElement.addEventListener('focus', this.refocusTodo)
  }

  /**
   * When user clicks on a different window, the focused todo index will be removed.
   * So set the prev focus todo index to the current when user goes back to the app window.
   * "this" isn't used to refer to manager as it will refer to the todo element.
   * 
   * @param event  Focus event to handle
   */
  refocusTodo = (event: FocusEvent) => {
    if (event.relatedTarget) return

    this.updateSessionManger({ focusedTodoIndex: this.prevFocusedTodoIdx })
  }

  /**
   * Blur handler for when a current focused todo loses focus.
   * Removes prev focused todo if the new focused element is not a todo element.
   * Removes also event listeners if necessary.
   * "this" isn't used to refer to manager as it will refer to the todo element.
   * 
   * @param event    Focus event to be handled.
   */
  focusedTodoOnBlurHandler = (event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement
    const todoElement = event.target as HTMLElement

    // do not remove listeners when user clicks outside of app, they will be needed on refocus
    if (relatedTarget != null) {
      todoElement.removeEventListener('blur', this.focusedTodoOnBlurHandler)
      todoElement.removeEventListener('focus', this.refocusTodo)
    }

    this.updateSessionManger({ prevFocusedTodoIdx: this.focusedTodoIndex })

    if (relatedTarget?.tagName === "LI") return

    this.resetCurrentFocusedTodoIdx()
  }

  /**
   * Reset current focused todo index.
   * Removed only when the new focus element is not a todo.
   */
  resetCurrentFocusedTodoIdx() {
    this.focusedTodoIndex = -1
    this.updateSessionManger({ focusedTodoIndex: this.focusedTodoIndex })
  }

  /**
   * 
   * Get the updated version of the old state. 
   * This is done to avoid destructuring as methods will not be preserved.
   * 
   * @param newState  New state changes to be incorporated
   * @param oldState  Current state
   * @returns         New state with the latest incorporated changes.
   */
  geNewStateObj(newState: Partial<PomSessionManger>, oldState: PomSessionManger): PomSessionManger {
    const newStateObj = oldState

    if (newState.newTitle != undefined)                   newStateObj!.newTitle = newState.newTitle
    if (newState.newTag != undefined)                     newStateObj!.newTag = newState.newTag
    if (newState.focusedTodoIndex != undefined)           newStateObj!.focusedTodoIndex = newState.focusedTodoIndex
    if (newState.prevFocusedTodoIdx != undefined)         newStateObj!.prevFocusedTodoIdx = newState.prevFocusedTodoIdx
    if (newState.todoToEditIndex != undefined)            newStateObj!.todoToEditIndex = newState.todoToEditIndex
    if (newState.todoToEditNewTitle != undefined)         newStateObj!.todoToEditNewTitle = newState.todoToEditNewTitle
    if (newState.newTodoTitle != undefined)               newStateObj!.newTodoTitle = newState.newTodoTitle
    if (newState.isMakingNewTask != undefined)            newStateObj!.isMakingNewTask = newState.isMakingNewTask
    if (newState.hasSessionConcluded != undefined)        newStateObj!.hasSessionConcluded = newState.hasSessionConcluded
    if (newState.isDropDownOpen != undefined)             newStateObj!.isDropDownOpen = newState.isDropDownOpen
    if (newState.isEditSessionModalOpen != undefined)     newStateObj!.isEditSessionModalOpen = newState.isEditSessionModalOpen
    if (newState.isSessionFinishedModalOpen != undefined) newStateObj!.isSessionFinishedModalOpen = newState.isSessionFinishedModalOpen
    if (newState.doShowBottomGradient != undefined)       newStateObj!.doShowBottomGradient = newState.doShowBottomGradient
    if (newState.doShowTopGradient != undefined)          newStateObj!.doShowTopGradient = newState.doShowTopGradient

    return newStateObj
  }
}