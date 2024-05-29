<script lang="ts">
	import { onMount } from "svelte"
  import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { getThemeStyling } from "$lib/utils-appearance"

  const DEFAULT_STYLING: IconOptions = {
      opacity: 1, width: 15, height: 18,
      strokeWidth: 1, scale: 1, id: "",
      color: `rgb(${getThemeStyling("textColor1")})`
  }
  
  export let icon: Icon
  export let options: IconOptions = {}
  
  let _options: any = {
      ...DEFAULT_STYLING,
      // id         : options?.id ?? DEFAULT_STYLING.id,
      // opacity    : options?.opacity ?? DEFAULT_STYLING.opacity,
      // strokeWidth: options?.strokeWidth ?? DEFAULT_STYLING.strokeWidth,
      // scale      : options?.scale ?? DEFAULT_STYLING.scale,
      // color      : options?.color ?? DEFAULT_STYLING.color,
      ...options
  }

  $: {
    if ($themeState && !options?.color) {
      _options.color = `rgb(${getThemeStyling("textColor1")})`
    }
  }
</script>

<div 
  class="svg-icon"
  style:opacity={_options.opacity}
  style:--stroke-width={_options.strokeWidth}
  style:--path-color={`rgba(${_options.color})`}
  style:--scale={_options.scale}
>
  {#if icon === Icon.Settings}
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18" id={_options.id}>
        <g fill={_options.color} stroke={_options.color} stroke-linecap="round" transform="translate(0 8.5)">
            <circle cx="2" cy="0.8" r="0.8"></circle>
            <circle cx="7" cy="0.8" r="0.8"></circle>
            <circle cx="12" cy="0.8" r="0.8"></circle>
        </g>
      </svg>
  {:else if icon === Icon.Add}
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" style:transform={`scale(${_options.scale})`}>
        <path 
            stroke-linecap="round" 
            d="M6 2v8M10 6H2" 
            stroke-width={_options.strokeWidth} 
            stroke={_options.color}
        >
        </path>
      </svg>
  {:else if icon === Icon.Close}
      <svg 
            xmlns="http://www.w3.org/2000/svg" fill="none" 
            style={`transform: scale(${_options.scale});`}
            width={_options.width} height={_options.height}
            viewBox={`0 0 ${_options.width} ${_options.height}`}
      >
          <path 
              d="M8.4082 8.55078L0.871094 1.01367M0.871094 8.55078L8.4082 1.01367" 
              stroke={_options.color} 
              stroke-width={_options.strokeWidth}
              stroke-linecap="round"
            >
      </svg>
  {:else if icon === Icon.ChevronLeft}
      <svg xmlns="http://www.w3.org/2000/svg" width="7" height="11" viewBox="0 0 7 11" fill="none">
          <path 
              d="M1.12345 5.92581C0.854683 5.65704 0.854683 5.22057 1.12345 4.9518L5.25172 0.823523C5.52049 0.554755 5.95697 0.554755 6.22574 0.823523C6.49451 1.09229 6.49451 1.52877 6.22574 1.79754L2.5834 5.43988L6.22359 9.08222C6.49236 9.35099 6.49236 9.78747 6.22359 10.0562C5.95482 10.325 5.51834 10.325 5.24957 10.0562L1.1213 5.92796L1.12345 5.92581Z" 
              fill={_options.color}
              stroke-width={_options.strokeWidth}
          />
      </svg>
  {:else if icon === Icon.ChevronRight}
      <svg xmlns="http://www.w3.org/2000/svg" width="7" height="11" viewBox="0 0 7 11" fill="none">
          <path 
              d="M6.22616 4.95505C6.49493 5.22381 6.49493 5.66029 6.22616 5.92906L2.09788 10.0573C1.82912 10.3261 1.39264 10.3261 1.12387 10.0573C0.855102 9.78857 0.855102 9.35209 1.12387 9.08332L4.76621 5.44098L1.12602 1.79864C0.857252 1.52987 0.857252 1.09339 1.12602 0.824623C1.39479 0.555855 1.83127 0.555855 2.10004 0.824623L6.22831 4.9529L6.22616 4.95505Z" 
              fill={_options.color}
              stroke-width={_options.strokeWidth}
          />
      </svg>
  {:else if icon === Icon.DragDots}
      <svg width={_options.width ?? 20} height={_options.height ?? 20} style={`transform: scale(${_options.scale});`}>
        <path fill={_options.color} d="M14.5 15.5a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 14.5 15.5zm-5 0a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 9.5 15.5zm5-5a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 14.5 10.5zm-5 0a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 9.5 10.5zm5-5a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 14.5 5.5zm-5 0a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 9.5 5.5z"></path>
      </svg>
  {:else if icon === Icon.Tune}
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" viewBox="0 0 11 12" fill="none">
        <path d="M5.09549 11.3137V7.74757H6.22483V8.9363H10.7422V10.125H6.22483V11.3137H5.09549ZM0.578125 10.125V8.9363H3.96615V10.125H0.578125ZM2.83681 7.74757V6.55885H0.578125V5.37013H2.83681V4.1814H3.96615V7.74757H2.83681ZM5.09549 6.55885V5.37013H10.7422V6.55885H5.09549ZM7.35417 4.1814V0.615234H8.48351V1.80396H10.7422V2.99268H8.48351V4.1814H7.35417ZM0.578125 2.99268V1.80396H6.22483V2.99268H0.578125Z" fill={_options.color}/>
      </svg>
  {:else if icon === Icon.Archive}
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" viewBox="0 0 11 12" fill="none">
          <path d="M1.98941 11.3135C1.70991 11.3135 1.47064 11.2087 1.2716 10.9992C1.07255 10.7897 0.973034 10.5379 0.973034 10.2437V4.21252C0.820577 4.11445 0.697764 3.98741 0.604596 3.83139C0.511428 3.67538 0.464844 3.49484 0.464844 3.28979V1.68506C0.464844 1.39086 0.564364 1.139 0.763406 0.929495C0.962447 0.719988 1.20172 0.615234 1.48122 0.615234H9.61227C9.89178 0.615234 10.131 0.719988 10.3301 0.929495C10.5291 1.139 10.6287 1.39086 10.6287 1.68506V3.28979C10.6287 3.49484 10.5821 3.67538 10.4889 3.83139C10.3957 3.98741 10.2729 4.11445 10.1205 4.21252V10.2437C10.1205 10.5379 10.0209 10.7897 9.8219 10.9992C9.62286 11.2087 9.38359 11.3135 9.10408 11.3135H1.98941ZM1.98941 4.35962V10.2437H9.10408V4.35962H1.98941ZM1.48122 3.28979H9.61227V1.68506H1.48122V3.28979ZM4.02218 7.03418H7.07132V5.96436H4.02218V7.03418Z" fill={_options.color}/>
      </svg>
  {:else if icon === Icon.Sun}
      <svg 
          width={_options.width} height={_options.height}
          viewBox={`0 0 ${_options.width + 2} ${_options.height + 2}`}
          xmlns="http://www.w3.org/2000/svg"
      >
          <path 
              d="M9.23877 0.507812C9.7419 0.507812 10.1498 0.91568 10.1498 1.4188V2.81219C10.1498 3.31531 9.7419 3.72318 9.23877 3.72318C8.73565 3.72318 8.32778 3.31531 8.32778 2.81219V1.4188C8.32778 0.91568 8.73565 0.507812 9.23877 0.507812ZM13.0436 9.08209C13.0436 11.065 11.436 12.6725 9.45307 12.6725C7.47014 12.6725 5.86268 11.065 5.86268 9.08209C5.86268 7.09916 7.47014 5.49159 9.45307 5.49159C11.436 5.49159 13.0436 7.09916 13.0436 9.08209ZM0.878906 9.29638C0.878906 8.79326 1.28677 8.38539 1.7899 8.38539H3.18317C3.68629 8.38539 4.09416 8.79326 4.09416 9.29638C4.09416 9.79951 3.68629 10.2074 3.18317 10.2074H1.7899C1.28677 10.2074 0.878906 9.79951 0.878906 9.29638ZM17.1164 9.77867C17.6195 9.77867 18.0273 9.3708 18.0273 8.86768C18.0273 8.36455 17.6195 7.95669 17.1164 7.95669H15.723C15.2198 7.95669 14.812 8.36455 14.812 8.86768C14.812 9.3708 15.2198 9.77867 15.723 9.77867H17.1164ZM8.75649 16.7453C8.75649 17.2484 9.16436 17.6562 9.66748 17.6562C10.1706 17.6562 10.5785 17.2484 10.5785 16.7453V15.352C10.5785 14.8489 10.1706 14.441 9.66748 14.441C9.16436 14.441 8.75649 14.8489 8.75649 15.352V16.7453ZM3.23867 3.17067C3.59432 2.81491 4.17118 2.81491 4.52695 3.17067L5.51224 4.15597C5.868 4.51173 5.868 5.08859 5.51224 5.44435C5.15647 5.80012 4.57961 5.80012 4.22385 5.44435L3.23867 4.45906C2.88279 4.1033 2.88279 3.52644 3.23867 3.17067ZM14.3792 14.9935C14.735 15.3493 15.3118 15.3493 15.6676 14.9935C16.0233 14.6376 16.0233 14.0609 15.6676 13.7051L14.6824 12.7198C14.3266 12.3641 13.7498 12.3641 13.394 12.7198C13.0382 13.0756 13.0382 13.6524 13.394 14.0082L14.3792 14.9935ZM15.3645 2.86758C15.7203 3.22346 15.7203 3.8002 15.3645 4.15597L14.3792 5.14126C14.0234 5.49702 13.4466 5.49702 13.0908 5.14126C12.735 4.78549 12.735 4.20863 13.0908 3.85287L14.0761 2.86769C14.4319 2.51181 15.0087 2.51181 15.3645 2.86758ZM3.54177 14.0082C3.186 14.364 3.186 14.9408 3.54177 15.2966C3.89753 15.6523 4.47439 15.6523 4.83016 15.2966L5.81534 14.3113C6.1711 13.9555 6.1711 13.3787 5.81534 13.0229C5.45957 12.6672 4.88271 12.6672 4.52695 13.0229L3.54177 14.0082Z" 
              fill={_options.color}
          />
      </svg>
  {:else if icon === Icon.Moon}
      <svg 
          width={_options.width} height={_options.height}
          viewBox={`0 0 ${_options.width} ${_options.height}`}
          fill="none" xmlns="http://www.w3.org/2000/svg"
          style={`transform: scale(0.8)`}
      >
          <path 
              d="M8.08898 0.0458984C3.62355 0.0458984 0.0078125 3.61383 0.0078125 8.01416C0.0078125 12.4145 3.62355 15.9824 8.08898 15.9824C10.2801 15.9824 12.2652 15.1216 13.7223 13.7271C13.9031 13.5528 13.9501 13.2825 13.8344 13.0619C13.7187 12.8414 13.4692 12.7169 13.2197 12.7595C12.8654 12.82 12.5038 12.852 12.1314 12.852C8.62773 12.852 5.78576 10.0489 5.78576 6.59125C5.78576 4.25058 7.08742 2.21227 9.01461 1.13798C9.23517 1.01347 9.34726 0.764465 9.29302 0.522571C9.23879 0.280677 9.02907 0.0992574 8.77597 0.0779138C8.54818 0.0601275 8.32039 0.0494556 8.08898 0.0494556V0.0458984Z" 
              fill={_options.color}
          />
      </svg>
  {:else if icon === Icon.ColorSun}
      <svg 
          xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54" fill="none"
          style="fill: linear-gradient(180deg, #F8E7CE -13.16%, #E5AF7C 103.76%); filter: drop-shadow(0px 0px 22px rgba(245, 221, 192, 0.1);"
          class="day-icon"
      >
          <g filter="url(#filter0_d_6237_1135)">
            <path d="M26.4951 19.5957C26.9393 19.5957 27.2994 19.9558 27.2994 20.4V21.6302C27.2994 22.0744 26.9393 22.4345 26.4951 22.4345C26.0509 22.4345 25.6908 22.0744 25.6908 21.6302V20.4C25.6908 19.9558 26.0509 19.5957 26.4951 19.5957ZM29.8543 27.1658C29.8543 28.9165 28.435 30.3357 26.6843 30.3357C24.9336 30.3357 23.5144 28.9165 23.5144 27.1658C23.5144 25.4151 24.9336 23.9958 26.6843 23.9958C28.435 23.9958 29.8543 25.4151 29.8543 27.1658ZM19.1143 27.355C19.1143 26.9108 19.4744 26.5507 19.9186 26.5507H21.1487C21.5929 26.5507 21.953 26.9108 21.953 27.355C21.953 27.7992 21.5929 28.1593 21.1487 28.1593H19.9186C19.4744 28.1593 19.1143 27.7992 19.1143 27.355ZM33.4501 27.7808C33.8943 27.7808 34.2544 27.4207 34.2544 26.9765C34.2544 26.5323 33.8943 26.1722 33.4501 26.1722H32.2199C31.7757 26.1722 31.4156 26.5323 31.4156 26.9765C31.4156 27.4207 31.7757 27.7808 32.2199 27.7808H33.4501ZM26.0693 33.9315C26.0693 34.3757 26.4294 34.7358 26.8736 34.7358C27.3178 34.7358 27.6779 34.3757 27.6779 33.9315V32.7014C27.6779 32.2572 27.3178 31.8971 26.8736 31.8971C26.4294 31.8971 26.0693 32.2572 26.0693 32.7014V33.9315ZM21.1977 21.9467C21.5117 21.6326 22.021 21.6326 22.3351 21.9467L23.205 22.8166C23.5191 23.1307 23.5191 23.64 23.205 23.9541C22.8909 24.2682 22.3816 24.2682 22.0675 23.9541L21.1977 23.0842C20.8835 22.7701 20.8835 22.2608 21.1977 21.9467ZM31.0335 32.3849C31.3476 32.699 31.8569 32.699 32.171 32.3849C32.4851 32.0707 32.4851 31.5615 32.171 31.2474L31.3012 30.3775C30.9871 30.0634 30.4778 30.0634 30.1637 30.3775C29.8496 30.6916 29.8496 31.2009 30.1637 31.515L31.0335 32.3849ZM31.9034 21.6791C32.2175 21.9933 32.2175 22.5025 31.9034 22.8166L31.0335 23.6865C30.7194 24.0006 30.2101 24.0006 29.896 23.6865C29.5819 23.3724 29.5819 22.8631 29.896 22.549L30.7659 21.6792C31.08 21.365 31.5893 21.365 31.9034 21.6791ZM21.4653 31.515C21.1512 31.8291 21.1512 32.3384 21.4653 32.6525C21.7794 32.9665 22.2887 32.9665 22.6028 32.6525L23.4726 31.7826C23.7867 31.4685 23.7867 30.9592 23.4726 30.6451C23.1585 30.331 22.6492 30.331 22.3351 30.6451L21.4653 31.515Z" fill="url(#paint0_linear_6237_1135)"/>
          </g>
          <defs>
            <filter id="filter0_d_6237_1135" x="0.0142574" y="0.495703" width="53.3401" height="53.3401" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset/>
              <feGaussianBlur stdDeviation="9.55"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.960784 0 0 0 0 0.866667 0 0 0 0 0.752941 0 0 0 0.53 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6237_1135"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6237_1135" result="shape"/>
            </filter>
            <linearGradient id="paint0_linear_6237_1135" x1="25.0256" y1="17.603" x2="25.0256" y2="35.3051" gradientUnits="userSpaceOnUse">
              <stop stop-color="#F8E7CE"/>
              <stop offset="1" stop-color="#E5AF7C"/>
            </linearGradient>
          </defs>
      </svg>
  {:else if icon === Icon.ColorMoon}
      <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg" class="day-icon">
            <g filter="url(#filter0_d_2572_18359)"> 
            <path 
                fill="url(#paint0_linear_2572_18359)"
                d="M18.2197 12.3918C14.7036 12.7697 12.1435 15.7469 12.4976 19.0413C12.8516 22.3358 15.9858 24.701 19.502 24.3231C21.2273 24.1377 22.7211 23.3252 23.7563 22.1579C23.8847 22.0121 23.8999 21.8057 23.7911 21.6504C23.6822 21.4951 23.4758 21.423 23.2827 21.476C23.0086 21.5513 22.7264 21.6059 22.4332 21.6374C19.6743 21.9339 17.211 20.0757 16.9328 17.4871C16.7444 15.7347 17.6054 14.0985 19.0365 13.1311C19.2001 13.0192 19.2684 12.8233 19.2062 12.6468C19.144 12.4703 18.9643 12.3522 18.7633 12.3577C18.5825 12.3636 18.4022 12.3749 18.22 12.3945L18.2197 12.3918Z"
            />
            </g>
            <defs>
              <filter id="filter0_d_2572_18359" x="0.464844" y="0.357422" width="35.3984" height="36.0054" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset/>
              <feGaussianBlur stdDeviation="6"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.945098 0 0 0 0 0.8 0 0 0 0 0.643137 0 0 0 0.31 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2572_18359"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2572_18359" result="shape"/>
              </filter>
              <linearGradient id="paint0_linear_2572_18359" x1="17.023" y1="9.67795" x2="18.2169" y2="20.7874" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FAEEE3"/>
              <stop offset="1" stop-color="#F2C59C"/>
              </linearGradient>
            </defs>
      </svg>
  {:else if icon === Icon.Pin}
      <svg width="9" height="13" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
            d="M0.0154065 8.1555L0.161464 7.57324C0.402507 6.60748 0.988746 5.59027 1.76861 5.06179L2.02209 1.76697H1.30256C1.19874 1.76697 1.10169 1.73891 1.01821 1.6898C0.852651 1.59229 0.741342 1.412 0.741342 1.20575C0.741342 0.89591 0.992721 0.644531 1.30256 0.644531H7.66303C7.97404 0.644531 8.22425 0.89591 8.22425 1.20575C8.22425 1.412 8.11201 1.59229 7.94832 1.6898C7.86414 1.73891 7.76592 1.76697 7.66303 1.76697H6.9428L7.19769 5.06179C7.97638 5.59027 8.56332 6.60748 8.80418 7.57324L8.94916 8.1555C8.97025 8.24018 8.97184 8.37915 8.97184 8.46845C8.97184 9.13242 7.2584 9.2828 5.04402 9.36294V12.056C5.04402 12.367 4.79381 12.6172 4.46175 12.6172C4.17179 12.6172 3.90053 12.367 3.90053 12.056L3.91714 9.3628C1.70458 9.28217 -0.00694874 9.13205 -0.00694874 8.46845C-0.0105265 8.38338 -0.00297344 8.30682 0.0154065 8.1555ZM2.84591 5.68848L2.39927 5.99247C1.84063 6.36896 1.39804 7.11669 1.22462 7.94577C2.84591 8.33287 6.09864 8.27231 7.70412 7.97928C7.53342 7.28945 7.10415 6.36896 6.56632 5.99247L6.09864 5.68848L5.81803 1.76697H3.14757L2.84591 5.68848Z" 
            fill={_options.color}  
        />
      </svg>    
  {:else if icon === Icon.Sublink}
        <svg 
            width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={`transform: scale(${_options.scale});`}
        >
            <path d="M3.00586 5.26855V5.26855C3.00586 7.82838 5.081 9.90352 7.64082 9.90352H8.39875" stroke={_options.color} stroke-width={_options.strokeWidth}/>
            <path d="M12.8556 9.90335C12.8556 11.092 11.898 12.0508 10.7227 12.0508C9.54737 12.0508 8.58984 11.092 8.58984 9.90335C8.58984 8.71471 9.54737 7.75586 10.7227 7.75586C11.898 7.75586 12.8556 8.71471 12.8556 9.90335Z" stroke={_options.color} stroke-width={_options.strokeWidth}/>
            <path d="M5.13876 2.85941C5.13876 4.04805 4.18124 5.0069 3.0059 5.0069C1.83057 5.0069 0.873047 4.04805 0.873047 2.85941C0.873047 1.67076 1.83057 0.711914 3.0059 0.711914C4.18124 0.711914 5.13876 1.67076 5.13876 2.85941Z" stroke={_options.color} stroke-width={_options.strokeWidth}/>
        </svg>
  {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width={_options.width} height={_options.height} fill="none">
        <path 
            stroke-linecap="round" stroke-linejoin="round" stroke={_options.color}
            stroke-width={_options.strokeWidth} 
            d="M9 4.6 6.341 7.08a.5.5 0 0 1-.682 0L3 4.6"
        >
        </path>
      </svg>
  {/if}
</div>


<style lang="scss">
  .svg-icon {
    @include center;
    transform: scale(var(--scale));

    path {
      // stroke-width: var(--stroke-width);
    }
  }
  .day-icon {
    @include abs-center;
  }
</style>