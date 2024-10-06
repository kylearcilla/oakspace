self.onmessage = function(event) {
    const { interval } = event.data

    setInterval(() => {
        self.postMessage('tick')
    }, interval)
}

export {}