<script lang="ts">
	import DropdownBtn from "./DropdownBtn.svelte"
	import DropdownList from "./DropdownList.svelte"

    export let id: string = ""
    export let item: DropdownMenuOption

    let isActive = false
    let pickedItem = item.pickedItem
</script>

<div style:position="relative" style:margin="1px 0px 0px 0px">
    <div class="btn">
        <DropdownBtn 
            {isActive}
            {id}
            options={{
                title: pickedItem || "",
                onClick: () => {
                    isActive = !isActive
                },
                styles: {
                    fontSize: "1.25rem",
                }
            }}
        />
    </div>
    <DropdownList
        {id}
        isHidden={!isActive}
        options={{
            pickedItem: item.pickedItem,
            listItems: item.items,
            onListItemClicked: (context) => {
                pickedItem = context.name
                item.onListItemClicked?.(context)
                isActive = false
            },
            onClickOutside: () => {
                isActive = false
            },
            styling:  { 
                zIndex: 300,
            },
            position: {
                right: "0px",
                top: "25px"
            },
        }}
    />
</div>

<style lang="scss">
    .btn {
        opacity: 0.8;

        &:hover {
            opacity: 1;
        }
    }
</style>