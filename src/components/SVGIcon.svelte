<script lang="ts">
  import { Icon } from "$lib/enums";
	import { getThemeStyling } from "$lib/utils-appearance";
	import { onMount } from "svelte";

  type CircleSVG = { cx: number, cy: number, r: number } 
  type IconOptions = {
        width?: number,         
        height?: number,        
        strokeWidth?: number,
        scale?: number
        iconColor?: string,        
        dots?: { cx?: number, cy?: number, r?: number }
  }
  
  export let icon: Icon
  export let options: IconOptions = {}
  
  let iconColor: string

  // default styling
  const addDims = {
    strokeWidth: 1.2
  }

  function initIconStyling() {
    iconColor = options.iconColor != undefined ? options.iconColor : `rgba(${getThemeStyling("textColor1")})`
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
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="12" viewBox="0 0 13 12" fill="none" style={`transform: scale(${options.scale ?? 1});`}>
      <path d="M6.46506 0.173828V11.8553M0.625 6.01495L12.3047 6.01495" stroke={iconColor} stroke-width={options.strokeWidth ?? addDims.strokeWidth}/>
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
      <svg width="20" height="20" style={`transform: scale(${options.scale ?? 1});`}>
        <path fill={iconColor} d="M14.5 15.5a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 14.5 15.5zm-5 0a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 9.5 15.5zm5-5a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 14.5 10.5zm-5 0a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 9.5 10.5zm5-5a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 14.5 5.5zm-5 0a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 9.5 5.5z"></path>
      </svg>
{:else if icon === Icon.Tune}
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" viewBox="0 0 11 12" fill="none">
        <path d="M5.09549 11.3137V7.74757H6.22483V8.9363H10.7422V10.125H6.22483V11.3137H5.09549ZM0.578125 10.125V8.9363H3.96615V10.125H0.578125ZM2.83681 7.74757V6.55885H0.578125V5.37013H2.83681V4.1814H3.96615V7.74757H2.83681ZM5.09549 6.55885V5.37013H10.7422V6.55885H5.09549ZM7.35417 4.1814V0.615234H8.48351V1.80396H10.7422V2.99268H8.48351V4.1814H7.35417ZM0.578125 2.99268V1.80396H6.22483V2.99268H0.578125Z" fill={iconColor}/>
      </svg>
{:else if icon === Icon.Archive}
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" viewBox="0 0 11 12" fill="none">
          <path d="M1.98941 11.3135C1.70991 11.3135 1.47064 11.2087 1.2716 10.9992C1.07255 10.7897 0.973034 10.5379 0.973034 10.2437V4.21252C0.820577 4.11445 0.697764 3.98741 0.604596 3.83139C0.511428 3.67538 0.464844 3.49484 0.464844 3.28979V1.68506C0.464844 1.39086 0.564364 1.139 0.763406 0.929495C0.962447 0.719988 1.20172 0.615234 1.48122 0.615234H9.61227C9.89178 0.615234 10.131 0.719988 10.3301 0.929495C10.5291 1.139 10.6287 1.39086 10.6287 1.68506V3.28979C10.6287 3.49484 10.5821 3.67538 10.4889 3.83139C10.3957 3.98741 10.2729 4.11445 10.1205 4.21252V10.2437C10.1205 10.5379 10.0209 10.7897 9.8219 10.9992C9.62286 11.2087 9.38359 11.3135 9.10408 11.3135H1.98941ZM1.98941 4.35962V10.2437H9.10408V4.35962H1.98941ZM1.48122 3.28979H9.61227V1.68506H1.48122V3.28979ZM4.02218 7.03418H7.07132V5.96436H4.02218V7.03418Z" fill={iconColor}/>
      </svg>
{:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="6" height="5" viewBox="0 0 6 5" fill="none">
        <path d="M2.76221 4.45654L0.343848 0.267823L5.18057 0.267822L2.76221 4.45654Z" fill={iconColor}/>
      </svg>
{/if}
