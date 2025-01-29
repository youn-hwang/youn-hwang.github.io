//text typing javascript: number of steps based on strlen
document.addEventListener('DOMContentLoaded', function() {
    const spans = document.querySelectorAll('.dynamic-txt li span');
    
    spans.forEach(span => {
        const text = span.textContent;
        const charCount = text.length;
        
        // Create a pseudo-element with dynamic steps
        const style = document.createElement('style');
        style.textContent = `
            .dynamic-txt li span[data-text="${text}"]::after {
                --char-count: ${charCount};
                animation: typing var(--typing-duration) steps(${charCount}) infinite alternate,
                         cursor var(--cursor-duration) step-end infinite;
            }
        `;
        document.head.appendChild(style);
        
        // Add data attribute
        span.setAttribute('data-text', text);
    });
});