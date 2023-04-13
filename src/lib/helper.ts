export function clickOutside(node: any) {
    // if user clicks on any element has one of these classes, do not dispatch event to close, let the btn close
    // if dispatched, local bool var will false, will be toggled to true when btn is clicked
    const blackList = ["dropdown-container", "dropdown-btn"] 

    const handleClick = (event: any)  => {
        const srcClass = event.srcElement.parentElement.classList.value.split(" ")[0];

        if (!blackList.includes(srcClass) && node && !node.contains(event.target) && !event.defaultPrevented) {
            node.dispatchEvent(
                new CustomEvent('click_outside', node)
            )
        }
    }
    document.addEventListener('click', handleClick, true);

    return {
      destroy() {
        document.removeEventListener('click', handleClick, true);
      }
    }
}

/**
 * @return the current time as a string in the format "hh:mm AM/PM" for the user's local time
 */
export function getCurrentTime(doUserHour12: boolean): string {
  const now = new Date();

    return now.toLocaleTimeString(undefined, { hour12: doUserHour12, hour: 'numeric', minute: 'numeric' });
}

/**
 * @return the current time as a string in the format "Ddd, Mmm, D" for the user's local time
 */
export function getCurrentDate(): string {
  const now = new Date();
  
  return now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 *  Formats date to Mmm DD, YYYY 
 *  i.e. 2017-11-10T11:46:23Z to Nov 11, 2016
 *  
 *  @return the formatted date
 * 
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: any = { year: 'numeric', month: 'short', day: 'numeric' };
  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

  return formattedDate
}

/**
 *  Adds commas to numbers
 *  
 *  @return Fromatted number w/ commas
 * 
 */
export function addCommasToNum(num: string): string {
  const formattedNumber = Number(num).toLocaleString();
  return formattedNumber
}
/**
 *  Adds commas to numbers
 *  
 *  @return Fromatted number w/ commas
 * 
 */
export function shorterNum(num: string): string {
  const val = Number(num)
  if (val < 1000) {
    return val.toString();
  } else if (val < 1000000) {
    return (val / 1000).toFixed(2) + " K";
  } else if (val < 1000000000) {
    return (val / 1000000).toFixed(2) + " M";
  } else {
    return (val / 1000000000).toFixed(2) + " B";
  }
}