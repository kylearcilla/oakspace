<script lang="ts">
	import { toaster } from "$lib/store"
	import { DELETE_ITEM_DELAY, EXPANDED_TOAST_GAP, LIFT_AMOUNT } from "$lib/utils-toast";
    import Toast from "./Toast.svelte"
    
    let toasts: DOMToastItem[] = []
    let hasMouseEntered = false
    let idxDeleted = -1

    enum ToastAction {
        ADDED, DELETED, DELETE_EXPANDED, ADDED_EXPANDED
    }

    /* Mouse Events */
    function onToastMouseEnter(idx: number) {
        if (idx === 0) return
        hasMouseEntered = true
    }
    function onToastMouseLeave(event: MouseEvent) {
        if (hasMouseEntered === null) return
        const toElement = (event as any).toElement as HTMLElement

        if (!toElement.classList[0].includes("toast")) {
            hasMouseEntered = false
        }
    }

    /* Reactive Styling Changes */
    function getAction(prevLength: number, newLength: number) {
        if (prevLength < newLength && hasMouseEntered) {
            return ToastAction.ADDED_EXPANDED
        }
        if (prevLength < newLength) {
            return ToastAction.ADDED
        }
        else if (prevLength > newLength && hasMouseEntered) {
            return ToastAction.DELETE_EXPANDED
        } 
        else {
            return ToastAction.DELETED
        }
    }
    function getStylingAfterMutate(action: ToastAction | null, idx: number) {
        const toastsBefore = idx
        const states = {
            offsets: { start: "", end: " "},
            scales:  { start: "", end: " "},
            opacity: { start:  0, end: toastsBefore < 3 ? 1 : 0 }
        }

        if (action === ToastAction.ADDED) {
            states.offsets.start = idx === 0 ? "100%" : `${LIFT_AMOUNT * (toastsBefore - 1)}px`
            states.offsets.end   = `${LIFT_AMOUNT * (toastsBefore)}px`

            states.scales.start = idx === 0 ? "1" : `${(toastsBefore - 1) * -0.05 + 1}`
            states.scales.end = idx === 0 ? "1" : `${(toastsBefore) * -0.05 + 1}`

            states.opacity.start = toastsBefore - 1 < 3 ? 1 : 0

            return states
        }
        else if (action === ToastAction.ADDED_EXPANDED) {
            const startOffset = -1 * (toastsBefore - 1) * (68.5 + EXPANDED_TOAST_GAP)
            const finalOffset = -1 * toastsBefore * (68.5 + EXPANDED_TOAST_GAP)

            states.offsets.start = `${startOffset}px`
            states.offsets.end   = `${finalOffset}px`

            states.scales.start = "1"
            states.scales.end   = "1"

            states.opacity.start = toastsBefore - 1 < 3 ? 1 : 0

            return states
        }
        else if (action === ToastAction.DELETED) {
            states.offsets.start = `${LIFT_AMOUNT * (toastsBefore + 1)}px`
            states.offsets.end   = `${LIFT_AMOUNT * (toastsBefore)}px`

            states.scales.start = `${(toastsBefore + 1) * -0.05 + 1}`
            states.scales.end = `${(toastsBefore) * -0.05 + 1}`

            states.opacity.start = toastsBefore + 1 < 3 ? 1 : 0

            return states
        }
        else {
            const movingStartOffset = -1 * (toastsBefore + 1) * (68.5 + EXPANDED_TOAST_GAP)
            const finalOffset = -1 * toastsBefore * (68.5 + EXPANDED_TOAST_GAP)

            states.offsets.start = idx < idxDeleted ? `${finalOffset}px` : `${movingStartOffset}px`
            states.offsets.end   = idx < idxDeleted ? `${finalOffset}px` : `${finalOffset}px`

            states.scales.start = "1"
            states.scales.end   = "1"

            states.opacity.start = toastsBefore + 1 < 3 ? 1 : 0

            return states
        }
    }
    function getStylingAfterMouseAction(onOver: boolean | null, idx: number) {
        const toastsBefore = idx
        const states = {
            offsets: { start: "", end: " "},
            scales:  { start: "", end: " "},
            opacity: { start: 0, end: 0 }
        }

        if (onOver) {
            const offset = -1 * toastsBefore * (68.5 + EXPANDED_TOAST_GAP)

            states.offsets.start = `${LIFT_AMOUNT * (toastsBefore)}px`
            states.offsets.end   = `${offset}px`

            states.scales.start = idx === 0 ? "1" : `${(toastsBefore) * -0.05 + 1}`
            states.scales.end = "1"

            states.opacity.start = toastsBefore < 3 ? 1 : 0
            states.opacity.end = states.opacity.start

            return states
        }
        else {
            const offset = -1 * toastsBefore * (68.5 + EXPANDED_TOAST_GAP)

            states.offsets.start = `${offset}px`
            states.offsets.end   = `${LIFT_AMOUNT * (toastsBefore)}px`

            states.scales.start = "1"
            states.scales.end = idx === 0 ? "1" : `${(toastsBefore) * -0.05 + 1}`

            states.opacity.start = toastsBefore < 3 ? 1 : 0
            states.opacity.end = states.opacity.start
            return states
        }
    }

    /* Update functions */
    function updateOnMouseAction(toastItems: ToastItem[], enter: boolean) {
        toasts = toastItems.map((toast: ToastItem, idx: number) => {
            return {
                ...toast,
                ...getStylingAfterMouseAction(enter, idx)
            }
        })
    }
    function updateOnMutate(toastItems: ToastItem[]) {
        const action = getAction(toasts.length, toastItems.length)
        
        toasts = toastItems.map((toast: ToastItem, idx: number) => {
            return {
                ...toast,
                ...getStylingAfterMutate(action, idx)
            }
        })

        //  if closed the very, stack the deck
        if (idxDeleted === toastItems.length) {
            console.log("CLOSE")
            hasMouseEntered = false
            updateOnMouseAction(toastItems, false)
        }

        idxDeleted = -1
    }


    $: if ($toaster!.toasts.length === toasts.length) {
        const toastItems = $toaster?.toasts ?? []

        updateOnMouseAction(toastItems, hasMouseEntered)
    }

    $: if ($toaster!.toasts.length != toasts.length) {
        const toastItems = $toaster?.toasts ?? []

        updateOnMutate(toastItems)
    }
    

    function onToastClose(idx: number) {
        idxDeleted = idx

        setTimeout(() =>{
            toaster.update((data: Toaster | null) => { 
                data!.toasts.splice(idx, 1)
                return data
            })

        }, DELETE_ITEM_DELAY)
    }
    function onToastActionBtnClicked(idx: number) {
        
    }
</script>

<div class="toaster">
    <ol class="toaster__toasts">
        {#if toasts}
            {#each toasts as toast, idx}
                {#key toast}
                    <Toast 
                        idx={idx}
                        toast={toast}
                        length={toasts.length}
                        hasExpanded={hasMouseEntered}
                        onMouseEnter={onToastMouseEnter}
                        onMouseLeave={onToastMouseLeave}
                        onToastClose={onToastClose} 
                        onToastActionBtnClicked={onToastActionBtnClicked}
                    />
                {/key}
            {/each}
        {/if}
    </ol>
</div>

<style lang="scss">
    .toaster {
        position: fixed;
        right: 15px;
        bottom: 15px;
        z-index: 9900000;

        &__toasts {
        }
        &__toast {

        }
    }
</style>