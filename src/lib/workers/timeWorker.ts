let intervalId: ReturnType<typeof setInterval> | null = null
const channel = new BroadcastChannel('timer-channel')

channel.postMessage('check')

channel.onmessage = (event) => {
    if (event.data === 'check') {
        channel.postMessage('active')
    } 
    else if (event.data === 'active') {
        if (intervalId) {
            clearInterval(intervalId)
        }
        self.close()
    }
}

self.onmessage = function(event) {
    const { interval } = event.data
    
    if (intervalId) {
        clearInterval(intervalId)
    }
    
    intervalId = setInterval(() => {
        self.postMessage('tick')
    }, interval)
}