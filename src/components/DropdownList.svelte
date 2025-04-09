<script lang="ts">
	import BounceFade from "./BounceFade.svelte"
	import DropdownContent from "./DropdownContent.svelte"

    export let id: string = ""
    export let isHidden: boolean
    export let options: DropdownListOptions
    export let renderFlag: boolean | undefined = undefined
    export let childId: string = ""
    export let relDir: "l" | "r" = "l"
    const { fixPos = false, context = "default", onDismount } = options
    const { zIndex = 1 } = options.styling ?? {}
</script>

<BounceFade 
    {isHidden} 
    {fixPos}
    dmenuId={id}
    offsetContext={context}
    onDismount={onDismount}
    position={fixPos ? undefined : options?.position}
    zIndex={zIndex}
>
    <DropdownContent 
        {options} 
        {id} 
        {renderFlag} 
        {isHidden} 
        {childId} 
        {relDir}
    />
</BounceFade>

<style lang="scss">
    @import "../scss/dropdown.scss";
</style>