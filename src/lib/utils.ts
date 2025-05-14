export function isQuoteExpired(quoteDate: Date) {
    const now = new Date()
    
    // Get the start of the current week (Monday)
    const currentWeekStart = new Date(now)
    const daysSinceMonday = (currentWeekStart.getDay() + 6) % 7 // Monday is 0
    currentWeekStart.setDate(currentWeekStart.getDate() - daysSinceMonday)
    currentWeekStart.setHours(0, 0, 0, 0)
    
    // Check if quote date is before the start of current week
    return quoteDate.getTime() < currentWeekStart.getTime()
}