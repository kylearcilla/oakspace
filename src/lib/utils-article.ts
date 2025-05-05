export function initArticleObserver(callback: (section: string) => void) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback(entry.target.id)
            }
        })
    }, { 
        threshold: 0.2,
        rootMargin: '-80px 0px 0px 0px' 
    })
    
    document.querySelectorAll('h2[id], h3[id]').forEach(heading => {
        observer.observe(heading)
    })
    
    return observer
}