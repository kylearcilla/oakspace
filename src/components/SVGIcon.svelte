<script lang="ts">
  import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { getThemeStyling } from "$lib/utils-appearance"

  export let icon: Icon
  export let options: IconOptions = {}

  const arrow = [Icon.ChevronLeft, Icon.ChevronRight, Icon.Dropdown].includes(icon)

  let {
      opacity = 1, 
      width = 15, 
      height = 18,
      strokeWidth = icon === Icon.Add ? 1.5 : 1, 
      scale = 1, 
      fullOnHover = false,
      id = "",
      color
  } = options

  $: color = options.color || `rgba(${getThemeStyling("textColor1")})`

  $: if ($themeState && !options?.color) {
      color = `rgba(${getThemeStyling("textColor1")})`
  }
</script>

<div 
  class="svg-icon"
  class:svg-icon--full-on-hover={fullOnHover}
  style:opacity={opacity}
  style:--stroke-width={strokeWidth}
  style:--path-color={color}
  style:--scale={scale}
>
  {#if icon === Icon.Settings}
      <svg class="settings" xmlns="http://www.w3.org/2000/svg" width="15" height="18" id={id}>
        <g fill={color} stroke={color} stroke-linecap="round" transform="translate(0 8.5)">
            <circle cx="2" cy="0.8" r="0.8"></circle>
            <circle cx="7" cy="0.8" r="0.8"></circle>
            <circle cx="12" cy="0.8" r="0.8"></circle>
        </g>
      </svg>
  {:else if icon === Icon.Add}
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" style:transform={`scale(${scale})`}>
        <path 
            stroke-linecap="round" 
            d="M6 2v8M10 6H2" 
            stroke-width={strokeWidth} 
            stroke={color}
        >
        </path>
      </svg>
  {:else if icon === Icon.Close}
      <svg 
            xmlns="http://www.w3.org/2000/svg" fill="none" 
            style={`transform: scale(${scale});`}
            width={width} height={height}
            viewBox={`0 0 ${width} ${height}`}
      >
          <path 
              d="M8.4082 8.55078L0.871094 1.01367M0.871094 8.55078L8.4082 1.01367" 
              stroke={color} 
              stroke-width={strokeWidth}
              stroke-linecap="round"
            >
      </svg>
  {:else if icon === Icon.DragDots}
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
          d="M3 2C2.44772 2 2 1.55228 2 1C2 0.447715 2.44772 0 3 0C3.55228 0 4 0.447715 4 1C4 1.55228 3.55228 2 3 2ZM3 6C2.44772 6 2 5.55228 2 5C2 4.44772 2.44772 4 3 4C3.55228 4 4 4.44772 4 5C4 5.55228 3.55228 6 3 6ZM3 10C2.44772 10 2 9.55228 2 9C2 8.44772 2.44772 8 3 8C3.55228 8 4 8.44772 4 9C4 9.55228 3.55228 10 3 10ZM7 2C6.44772 2 6 1.55228 6 1C6 0.447715 6.44772 0 7 0C7.55228 0 8 0.447715 8 1C8 1.55228 7.55228 2 7 2ZM7 6C6.44772 6 6 5.55228 6 5C6 4.44772 6.44772 4 7 4C7.55228 4 8 4.44772 8 5C8 5.55228 7.55228 6 7 6ZM7 10C6.44772 10 6 9.55228 6 9C6 8.44772 6.44772 8 7 8C7.55228 8 8 8.44772 8 9C8 9.55228 7.55228 10 7 10Z" 
          fill={color}
      />
    </svg>    
  {:else if icon === Icon.Tune}
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" viewBox="0 0 11 12" fill="none">
        <path d="M5.09549 11.3137V7.74757H6.22483V8.9363H10.7422V10.125H6.22483V11.3137H5.09549ZM0.578125 10.125V8.9363H3.96615V10.125H0.578125ZM2.83681 7.74757V6.55885H0.578125V5.37013H2.83681V4.1814H3.96615V7.74757H2.83681ZM5.09549 6.55885V5.37013H10.7422V6.55885H5.09549ZM7.35417 4.1814V0.615234H8.48351V1.80396H10.7422V2.99268H8.48351V4.1814H7.35417ZM0.578125 2.99268V1.80396H6.22483V2.99268H0.578125Z" fill={color}/>
      </svg>
  {:else if icon === Icon.Archive}
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" viewBox="0 0 11 12" fill="none">
          <path d="M1.98941 11.3135C1.70991 11.3135 1.47064 11.2087 1.2716 10.9992C1.07255 10.7897 0.973034 10.5379 0.973034 10.2437V4.21252C0.820577 4.11445 0.697764 3.98741 0.604596 3.83139C0.511428 3.67538 0.464844 3.49484 0.464844 3.28979V1.68506C0.464844 1.39086 0.564364 1.139 0.763406 0.929495C0.962447 0.719988 1.20172 0.615234 1.48122 0.615234H9.61227C9.89178 0.615234 10.131 0.719988 10.3301 0.929495C10.5291 1.139 10.6287 1.39086 10.6287 1.68506V3.28979C10.6287 3.49484 10.5821 3.67538 10.4889 3.83139C10.3957 3.98741 10.2729 4.11445 10.1205 4.21252V10.2437C10.1205 10.5379 10.0209 10.7897 9.8219 10.9992C9.62286 11.2087 9.38359 11.3135 9.10408 11.3135H1.98941ZM1.98941 4.35962V10.2437H9.10408V4.35962H1.98941ZM1.48122 3.28979H9.61227V1.68506H1.48122V3.28979ZM4.02218 7.03418H7.07132V5.96436H4.02218V7.03418Z" fill={color}/>
      </svg>
  {:else if icon === Icon.Sun}
      <svg 
          width={width} height={height}
          viewBox={`0 0 ${width ?? 0 + 2} ${height ?? 0 + 2}`}
          xmlns="http://www.w3.org/2000/svg"
          data-icon="sun"
      >
          <path 
              d="M9.23877 0.507812C9.7419 0.507812 10.1498 0.91568 10.1498 1.4188V2.81219C10.1498 3.31531 9.7419 3.72318 9.23877 3.72318C8.73565 3.72318 8.32778 3.31531 8.32778 2.81219V1.4188C8.32778 0.91568 8.73565 0.507812 9.23877 0.507812ZM13.0436 9.08209C13.0436 11.065 11.436 12.6725 9.45307 12.6725C7.47014 12.6725 5.86268 11.065 5.86268 9.08209C5.86268 7.09916 7.47014 5.49159 9.45307 5.49159C11.436 5.49159 13.0436 7.09916 13.0436 9.08209ZM0.878906 9.29638C0.878906 8.79326 1.28677 8.38539 1.7899 8.38539H3.18317C3.68629 8.38539 4.09416 8.79326 4.09416 9.29638C4.09416 9.79951 3.68629 10.2074 3.18317 10.2074H1.7899C1.28677 10.2074 0.878906 9.79951 0.878906 9.29638ZM17.1164 9.77867C17.6195 9.77867 18.0273 9.3708 18.0273 8.86768C18.0273 8.36455 17.6195 7.95669 17.1164 7.95669H15.723C15.2198 7.95669 14.812 8.36455 14.812 8.86768C14.812 9.3708 15.2198 9.77867 15.723 9.77867H17.1164ZM8.75649 16.7453C8.75649 17.2484 9.16436 17.6562 9.66748 17.6562C10.1706 17.6562 10.5785 17.2484 10.5785 16.7453V15.352C10.5785 14.8489 10.1706 14.441 9.66748 14.441C9.16436 14.441 8.75649 14.8489 8.75649 15.352V16.7453ZM3.23867 3.17067C3.59432 2.81491 4.17118 2.81491 4.52695 3.17067L5.51224 4.15597C5.868 4.51173 5.868 5.08859 5.51224 5.44435C5.15647 5.80012 4.57961 5.80012 4.22385 5.44435L3.23867 4.45906C2.88279 4.1033 2.88279 3.52644 3.23867 3.17067ZM14.3792 14.9935C14.735 15.3493 15.3118 15.3493 15.6676 14.9935C16.0233 14.6376 16.0233 14.0609 15.6676 13.7051L14.6824 12.7198C14.3266 12.3641 13.7498 12.3641 13.394 12.7198C13.0382 13.0756 13.0382 13.6524 13.394 14.0082L14.3792 14.9935ZM15.3645 2.86758C15.7203 3.22346 15.7203 3.8002 15.3645 4.15597L14.3792 5.14126C14.0234 5.49702 13.4466 5.49702 13.0908 5.14126C12.735 4.78549 12.735 4.20863 13.0908 3.85287L14.0761 2.86769C14.4319 2.51181 15.0087 2.51181 15.3645 2.86758ZM3.54177 14.0082C3.186 14.364 3.186 14.9408 3.54177 15.2966C3.89753 15.6523 4.47439 15.6523 4.83016 15.2966L5.81534 14.3113C6.1711 13.9555 6.1711 13.3787 5.81534 13.0229C5.45957 12.6672 4.88271 12.6672 4.52695 13.0229L3.54177 14.0082Z" 
              fill={color}
          />
      </svg>
  {:else if icon === Icon.Moon}
      <svg 
          width={width} height={height}
          viewBox={`0 0 ${width} ${height}`}
          fill="none" xmlns="http://www.w3.org/2000/svg"
          style={`transform: scale(0.8)`}
          data-icon="moon"
      >
          <path 
              d="M8.08898 0.0458984C3.62355 0.0458984 0.0078125 3.61383 0.0078125 8.01416C0.0078125 12.4145 3.62355 15.9824 8.08898 15.9824C10.2801 15.9824 12.2652 15.1216 13.7223 13.7271C13.9031 13.5528 13.9501 13.2825 13.8344 13.0619C13.7187 12.8414 13.4692 12.7169 13.2197 12.7595C12.8654 12.82 12.5038 12.852 12.1314 12.852C8.62773 12.852 5.78576 10.0489 5.78576 6.59125C5.78576 4.25058 7.08742 2.21227 9.01461 1.13798C9.23517 1.01347 9.34726 0.764465 9.29302 0.522571C9.23879 0.280677 9.02907 0.0992574 8.77597 0.0779138C8.54818 0.0601275 8.32039 0.0494556 8.08898 0.0494556V0.0458984Z" 
              fill={color}
          />
      </svg>
  {:else if icon === Icon.ColorSun}
      <svg 
          xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54" fill="none"
          data-icon="color-sun"
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
      <svg 
          width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg" class="day-icon"
          data-icon="color-moon"
      >
            <g filter="url(#filter0_d_2572_18359)"> 
              <path 
                d="M18.2197 12.3918C14.7036 12.7697 12.1435 15.7469 12.4976 19.0413C12.8516 22.3358 15.9858 24.701 19.502 24.3231C21.2273 24.1377 22.7211 23.3252 23.7563 22.1579C23.8847 22.0121 23.8999 21.8057 23.7911 21.6504C23.6822 21.4951 23.4758 21.423 23.2827 21.476C23.0086 21.5513 22.7264 21.6059 22.4332 21.6374C19.6743 21.9339 17.211 20.0757 16.9328 17.4871C16.7444 15.7347 17.6054 14.0985 19.0365 13.1311C19.2001 13.0192 19.2684 12.8233 19.2062 12.6468C19.144 12.4703 18.9643 12.3522 18.7633 12.3577C18.5825 12.3636 18.4022 12.3749 18.22 12.3945L18.2197 12.3918Z"
                fill="url(#paint0_linear_2572_18359)"
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
      <svg width="11" height="14" viewBox="0 0 11 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
            d="M1.0223 8.80535L1.17486 8.20026C1.42663 7.19665 2.03897 6.13957 2.85355 5.59038L3.11832 2.16643H2.36676C2.25831 2.16643 2.15695 2.13727 2.06975 2.08624C1.89682 1.9849 1.78056 1.79754 1.78056 1.58321C1.78056 1.26123 2.04313 1 2.36676 1H9.01041C9.33527 1 9.59662 1.26123 9.59662 1.58321C9.59662 1.79754 9.47938 1.9849 9.3084 2.08624C9.22047 2.13727 9.11788 2.16643 9.01041 2.16643H8.25812L8.52435 5.59038C9.33771 6.13957 9.95078 7.19665 10.2024 8.20026L10.3538 8.80535C10.3758 8.89334 10.3775 9.03776 10.3775 9.13056C10.3775 9.82055 8.58776 9.97683 6.27479 10.0601V12.8587C6.27479 13.1819 6.01344 13.4419 5.6666 13.4419C5.36373 13.4419 5.0804 13.1819 5.0804 12.8587L5.09774 10.06C2.78668 9.97617 0.998949 9.82016 0.998949 9.13056C0.995212 9.04215 1.0031 8.96259 1.0223 8.80535ZM3.97882 6.24163L3.5123 6.55754C2.92878 6.94878 2.46649 7.72582 2.28535 8.58739C3.97882 8.98966 7.37637 8.92673 9.05333 8.62222C8.87502 7.90535 8.42665 6.94878 7.86487 6.55754L7.37637 6.24163L7.08327 2.16643H4.29391L3.97882 6.24163Z" 
            fill={color}
            stroke={color}
            stroke-width={strokeWidth}
        />
      </svg>
  {:else if arrow}
      <svg 
        class:chev-left={icon === Icon.ChevronLeft}
        class:chev-right={icon === Icon.ChevronRight}
        xmlns="http://www.w3.org/2000/svg" width={"12px"} height={"12px"} fill="none"
      >
        <path 
            stroke-linecap="round" stroke-linejoin="round" stroke={color}
            stroke-width={1.4} 
            d="M9 4.6 6.341 7.08a.5.5 0 0 1-.682 0L3 4.6"
        >
        </path>
      </svg>
    {:else if icon === Icon.Check}
      <svg 
        width="12" height="9" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"
        style:transform={`scale(${scale})`}
      >
        <path 
          d="M2 6L6 10L14 2"
          stroke={color}
          stroke-width={strokeWidth}
          stroke-linecap="round"
          stroke-linejoin="round"
      />
    </svg>
  {/if}
</div>


<style lang="scss">
  .svg-icon {
    @include center;
    transform: scale(var(--scale));

    &--full-on-hover:hover {
      opacity: 1 !important;
    }
  }
  .day-icon {
    @include abs-center;
  }
  .chev-left {
    transform: rotate(90deg);
  }
  .chev-right {
    transform: rotate(-90deg);
  }
  .settings {
    margin: -0.5px -0.5px 0px 0px;
  }
</style>