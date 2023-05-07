<script>
    export let pathToIcon = ""
    export let size = "1em";
  </script>
  
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <use xlink:href={pathToIcon}></use>
  </svg>