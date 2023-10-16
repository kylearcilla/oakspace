import { get } from "svelte/store"
import { sessionManager, sessionStore } from "./store"

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
     updateSessionManger = (newData: PomSessionManger) => {
      sessionManager.update((data: PomSessionManger | null) => ({
        ...data!, ...newData
      }))
    }

    /**
     * @param doShow  Do show edit current session modal modal.
     */
    toggleEditSessionModal = (doShow: boolean) => {
      this.isEditSessionModalOpen = doShow
      this.updateSessionManger({ ...get(sessionManager)!, isEditSessionModalOpen: this.isEditSessionModalOpen })
    }

    /**
     * Occurs when the session has finished.
     */
    finishSession = () => {
      get(sessionStore)!.finishSession()
    }

    /**
     * Shows just-finished session stats to the user
     */
    concludeSessionBtnClicked = () => {
      this.hasSessionConcluded = true
      this.isSessionFinishedModalOpen = true

      this.updateSessionManger({ 
        ...get(sessionManager)!, hasSessionConcluded: this.hasSessionConcluded, 
        isSessionFinishedModalOpen: this.isSessionFinishedModalOpen 
      })
    }

    /**
     * Clear a just-finished or just-canceled session.
     * Occurs after the user has been shown the session stats.
     */
    clearSession = () => {
      this.isSessionFinishedModalOpen = false

      get(sessionStore)!.clearSession()
      this.updateSessionManger({ ...get(sessionManager)!, isSessionFinishedModalOpen: this.isSessionFinishedModalOpen })
      sessionStore.set(null)
    }

    /**
     * Toggle drop down controls list.
     */
    togglePomControlsDropDown = () => {
      this.isDropDownOpen = !this.isDropDownOpen
      this.updateSessionManger({ ...get(sessionManager)!, isDropDownOpen: this.isDropDownOpen })
    }

    /**
     * Handles the click event when a dropdown option is selected in the Pomodoro session dropdown controls list.
     * @param optionIdx  Index of the selected dropdown option
     */
    pomControlsDropdownBtnHandler = (optionIdx: number) => {
      const sess = get(sessionStore)!

      if (optionIdx === 0) {
          this.toggleEditSessionModal(true)

          this.newTag = sess!.tag
          this.newTitle = sess!.name

          this.updateSessionManger({ ...get(sessionManager)!, newTag: this.newTag, newTitle: this.newTitle })
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
    addTodoBtnClicked = () => {
      this.isMakingNewTask = true
      this.updateSessionManger({ ...get(sessionManager)!, isMakingNewTask: this.isMakingNewTask })

      requestAnimationFrame(() => {
        const newTaskInput = document.getElementById(this.NEW_TASK_INPUT_ID)! as HTMLInputElement
        newTaskInput.focus()
      })
    }

    /**
     * Make new todo based on the user input values.
     * Show the fade the bottom of the list when list max height has been reached.
     */
    finishAddingTodo = () => {
      get(sessionStore)!.addTodo(this.newTodoTitle)
      this.cancelAddingTodo()

      requestAnimationFrame(() => {
        this.doShowBottomGradient = this.todoListElement.clientHeight === this.TODO_LIST_MAX_HEIGHT ? true : this.doShowBottomGradient
        this.updateSessionManger({  ...get(sessionManager)!, doShowBottomGradient: this.doShowBottomGradient })
      })

      const todoToEditInput = document.getElementById(`todo-${this.todoToEditIndex}`)!
      todoToEditInput.blur()
    }

    /**
     * Reset default values for new todo input values. No longer in "adding-to-do" state.
     */
    cancelAddingTodo = () => {
      this.newTodoTitle = ""
      this.isMakingNewTask = false

      this.updateSessionManger({ 
        ...get(sessionManager)!, newTodoTitle: this.newTodoTitle, isMakingNewTask: this.isMakingNewTask
      })

      const todoToEditInput = document.getElementById(`todo-${this.todoToEditIndex}`)!
      todoToEditInput.blur()
    }

    /**
     * Event handler for new to-do text input element.
     * @param event
     */
    newTodoTextInputHandler = (event: Event) => {
      this.newTodoTitle = (event.target as HTMLInputElement).value

      this.updateSessionManger({ ...get(sessionManager)!, newTodoTitle: this.newTodoTitle })
    }

    /**
     * Update the todo being edited.
     */
    finishEditingTodo = () => {
      get(sessionStore)!.editTodo(this.todoToEditIndex, this.todoToEditNewTitle)

      this.todoToEditIndex = -1
      this.todoToEditNewTitle = ""

      this.updateSessionManger({ 
        ...get(sessionManager)!, todoToEditIndex: this.todoToEditIndex, todoToEditNewTitle: this.todoToEditNewTitle
      })
    }

    /**
     * Delete a todo element.
     * Remove bottom gradient of todo list its height has dropped below max height.
     * @param index  Index of todo to be deleted.
     */
    deleteTodo = (index: number) => {
      get(sessionStore)!.deleteTodo(index)
      this.todoToEditIndex = -1
      this.todoToEditNewTitle = ""

      this.updateSessionManger({  ...get(sessionManager)!, todoToEditIndex: this.todoToEditIndex, todoToEditNewTitle: this.todoToEditNewTitle })
      
      requestAnimationFrame(() => {
        this.doShowBottomGradient = this.todoListElement.clientHeight < this.TODO_LIST_MAX_HEIGHT ? false : this.doShowBottomGradient
        this.updateSessionManger({  ...get(sessionManager)!, doShowBottomGradient: this.doShowBottomGradient })
      })
    }

    /**
     * Button handler for when an edit icon has been clicked. 
     * To-do element will update to a "editing" state.
     * @param index  Index of to do be edited.
     */
    editTodoBtnClicked = (index: number) => {
      this.todoToEditIndex = index
      this.todoToEditNewTitle = get(sessionStore)!.todos[index].title

      this.updateSessionManger({ 
        ...get(sessionManager)!, todoToEditIndex: this.todoToEditIndex, todoToEditNewTitle: this.todoToEditNewTitle
      })
      this.removeCurrentFocusedTodo()
      
      requestAnimationFrame(() => {
        const todoToEditInput = document.getElementById(`todo-${index}`)!
        todoToEditInput.focus()
      })
    }

    /**
     * Event handler for edit todo title input. 
     * @param event 
     */
    editTodoInputHandler = (event: Event) => {
      this.todoToEditNewTitle = (event.target as HTMLInputElement).value
      this.updateSessionManger({ ...get(sessionManager)!, todoToEditNewTitle: this.todoToEditNewTitle })
    }

    /**
     * Checks / unchecks given todo.
     * @param idx  Index of todo element.
     */
    toggleTodoCheckBox = (idx: number) => {
      get(sessionStore)!.toggleCheckTodo(idx)
    }

    /**
     * Scroll event handler for todo list.
     * Will show top / bottom gradients if there's space to scroll up / down.
     */
    todoListElementScrollHandler = () => {
      const scrollTop = this.todoListElement.scrollTop
      const windowHeight = this.todoListElement.clientHeight
      const scrollHeight = this.todoListElement.scrollHeight

      this.toggleShowTopGradient(scrollTop > 0)
      this.toggleShowBottomGradient(Math.ceil(scrollTop) < scrollHeight - windowHeight)
    }

    /**
     * @param doShow Do show top gradient.
     */
    toggleShowTopGradient = (doShow: boolean) => {
      this.doShowTopGradient = doShow
      this.updateSessionManger({ ...get(sessionManager)!, doShowTopGradient: this.doShowTopGradient })
    }

    /**
     * 
     * @param doShow Do show bottom gradient.
     */
    toggleShowBottomGradient = (doShow: boolean) => {
      this.doShowBottomGradient = doShow
      this.updateSessionManger({ ...get(sessionManager)!, doShowBottomGradient: this.doShowBottomGradient })
    }

    /**
     * Keyboard event handler for session manager shortcuts.
     * @param event 
     */
    keyboardShortcutHandler = (event: KeyboardEvent) => {
      if (event.key === "+") {
        this.addTodoBtnClicked()
      }
      else if (event.key === "Escape" && this.isMakingNewTask) {
        this.cancelAddingTodo()
      }
      else if (event.key === "Escape" && this.todoToEditIndex >= 0) {
        this.removeCurrentEditingTodo()
      }
      else if (event.key === "e" && event.ctrlKey && this.focusedTodoIndex >= 0) {
        this.editTodoBtnClicked(this.focusedTodoIndex)
      }
      else if (event.key === "Backspace" && this.focusedTodoIndex >= 0) {
        this.deleteTodo(this.focusedTodoIndex)
      }
      else if (event.key === "Enter" && this.focusedTodoIndex >= 0) {
        this.toggleTodoCheckBox(this.focusedTodoIndex)
        return
      }

      const todosLength = get(sessionStore)!.todos.length
      if (todosLength === 0 || this.todoToEditIndex >= 0) return

      let focusTodoIdx = 0

      if (event.key === "ArrowUp") {
        focusTodoIdx = this.focusedTodoIndex === -1 ? 0 : Math.max(this.focusedTodoIndex, 1) - 1
      }
      else if (event.key === "ArrowDown") {
        focusTodoIdx = this.focusedTodoIndex === -1 ? 0 : Math.min(this.focusedTodoIndex + 1, todosLength - 1)
      }
      else if (event.key === "Tab") {
        return
      }

      this.focusSelectedTodo(focusTodoIdx)
  }

  onTodoFocusEventHandler = (event: FocusEvent, todoIdx: number) => {
    // @ts-ignore
    if (!event.sourceCapabilities) return

    if (this.todoToEditIndex >= 0) {
      const todoElment = event.target! as HTMLElement
      todoElment.blur()
      return
    }
    
    this.focusSelectedTodo(todoIdx)
  }

  findTodoElementFromIdx = (idx: number): HTMLElement | null => {
    const todosList = this.todoListElement.children

    for (let i = 0; i < todosList.length; i++) {
      if (i != idx) continue
      return todosList[i] as HTMLElement
    }

    return null
  }

  focusSelectedTodo = (idx: number) => {
    this.focusedTodoIndex = idx
    this.updateSessionManger({ ...get(sessionManager)!, focusedTodoIndex: this.focusedTodoIndex })

    const todoElement = this.findTodoElementFromIdx(idx)!
    
    todoElement.focus()
    todoElement.addEventListener('blur', this.focusedTodoOnBlurHandler)
  }

  focusedTodoOnBlurHandler = (event: FocusEvent) => {
    if (event.relatedTarget) return
    this.removeCurrentFocusedTodo()
  }

  removeCurrentEditingTodo = () => {
    this.todoToEditIndex = -1
    this.updateSessionManger({ ...get(sessionManager)!, todoToEditIndex: this.todoToEditIndex })
  }

  removeCurrentFocusedTodo = () => {
    this.focusedTodoIndex = -1
    this.updateSessionManger({ ...get(sessionManager)!, focusedTodoIndex: this.focusedTodoIndex })
  }
}