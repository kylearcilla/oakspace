<script lang="ts">
  import { Icon } from "$lib/enums";
	import { getThemeStyling } from "$lib/utils-appearance";
	import { onMount } from "svelte";

  type CircleSVG = { cx: number, cy: number, r: number } 
  type IconOptions = {
        width?: number,         
        height?: number,        
        strokeWidth?: number,   
        iconColor?: string,        
        dots?: { cx?: number, cy?: number, r?: number }
  }
  
  export let icon: Icon
  export let options: IconOptions = {}

  let width: number | null
  let height: number | null
  let strokeWidth: number | null
  let iconColor: string
  let dots: { cx?: number, cy?: number, r?: number } | null

  function initIconStyling() {
    width = options.width != undefined ? options.width : null
    height = options.height != undefined ? options.height : null
    strokeWidth = options.strokeWidth != undefined ? options.strokeWidth : null
    iconColor = options.iconColor != undefined ? options.iconColor : `rgba(${getThemeStyling("textColor1")})`
    dots = options.dots != undefined ? options.dots : null
  }

  onMount(() => {
    initIconStyling()
  })
</script>

{#if icon === Icon.Settings}
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <g fill="currentcolor" stroke={iconColor} stroke-linecap="round" transform="translate(0 7.5)">
        <circle cx="2" cy="0.8" r="0.8"></circle>
        <circle cx="8" cy="0.8" r="0.8"></circle>
        <circle cx="14" cy="0.8" r="0.8"></circle>
    </g>
  </svg>
{:else if icon === Icon.Add}
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 11 10" fill="none">
      <path d="M5.72529 9.89258V0.21875M10.5625 5.05536L0.888672 5.05537" stroke={iconColor} stroke-width="1.2"/>
  </svg>
{:else if icon === Icon.Close}
  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none">
    <path d="M8.4082 8.55078L0.871094 1.01367M0.871094 8.55078L8.4082 1.01367" stroke={iconColor} stroke-width="1.1"/>
  </svg>
{:else if icon === Icon.ChevronLeft}
  <svg xmlns="http://www.w3.org/2000/svg" width="7" height="11" viewBox="0 0 7 11" fill="none">
    <path d="M1.12345 5.92581C0.854683 5.65704 0.854683 5.22057 1.12345 4.9518L5.25172 0.823523C5.52049 0.554755 5.95697 0.554755 6.22574 0.823523C6.49451 1.09229 6.49451 1.52877 6.22574 1.79754L2.5834 5.43988L6.22359 9.08222C6.49236 9.35099 6.49236 9.78747 6.22359 10.0562C5.95482 10.325 5.51834 10.325 5.24957 10.0562L1.1213 5.92796L1.12345 5.92581Z" fill={iconColor}/>
  </svg>
{:else if icon === Icon.ChevronRight}
    <svg xmlns="http://www.w3.org/2000/svg" width="7" height="11" viewBox="0 0 7 11" fill="none">
      <path d="M6.22616 4.95505C6.49493 5.22381 6.49493 5.66029 6.22616 5.92906L2.09788 10.0573C1.82912 10.3261 1.39264 10.3261 1.12387 10.0573C0.855102 9.78857 0.855102 9.35209 1.12387 9.08332L4.76621 5.44098L1.12602 1.79864C0.857252 1.52987 0.857252 1.09339 1.12602 0.824623C1.39479 0.555855 1.83127 0.555855 2.10004 0.824623L6.22831 4.9529L6.22616 4.95505Z" fill={iconColor}/>
    </svg>
{:else if icon === Icon.DragDots}
    <svg width="20" height="20">
      <path 
        fill={iconColor} 
        d="M14.5 15.5a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 14.5 15.5zm-5 0a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 9.5 15.5zm5-5a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 14.5 10.5zm-5 0a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 9.5 10.5zm5-5a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 14.5 5.5zm-5 0a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 9.5 5.5z"></path>
    </svg>
{:else}
  <svg xmlns="http://www.w3.org/2000/svg" width="6" height="5" viewBox="0 0 6 5" fill="none">
    <path d="M2.76221 4.45654L0.343848 0.267823L5.18057 0.267822L2.76221 4.45654Z" fill={iconColor}/>
  </svg>
{/if}
