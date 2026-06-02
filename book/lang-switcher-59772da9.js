function switchLanguage(lang) {
    const contents = document.querySelectorAll('.lang-content');
    contents.forEach(el => {
        el.style.display = 'none';
    });
    
    const selectedContents = document.querySelectorAll('.lang-content.lang-' + lang);
    selectedContents.forEach(el => {
        el.style.display = 'block';
    });
    
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(lang)) {
            btn.classList.add('active');
        }
    });

    localStorage.setItem('preferred-language', lang);
}

function initLanguageToggle() {
    const main = document.querySelector('main');
    if (!main) return;

    const children = Array.from(main.children);
    let currentLangDiv = null;

    children.forEach(child => {
        // Skip the switch container itself
        if (child.classList.contains('lang-switch-container')) {
            return;
        }

        // Check if this is a language marker
        if (child.classList.contains('lang-marker')) {
            const lang = child.getAttribute('data-lang');
            
            if (lang === 'shared') {
                currentLangDiv = null;
                child.remove();
                return;
            }

            // Create a new language wrapper div
            currentLangDiv = document.createElement('div');
            currentLangDiv.className = 'lang-content lang-' + lang;
            currentLangDiv.style.display = 'none'; // hidden by default
            
            // Insert the wrapper right before the marker
            main.insertBefore(currentLangDiv, child);
            // Remove the marker
            child.remove();
            return;
        }

        // If we have a current wrapper, move the child into it
        if (currentLangDiv) {
            currentLangDiv.appendChild(child);
        }
    });

    // Restore selected language
    const savedLang = localStorage.getItem('preferred-language') || 'hinglish';
    switchLanguage(savedLang);
}

let activeTooltip = null;

function showTooltip(event) {
    const target = event.currentTarget;
    const text = target.getAttribute('data-tooltip');
    if (!text) return;

    // Create the tooltip element with explicit tex2jax_process class to force typesetting
    const tooltip = document.createElement('div');
    tooltip.className = 'keyword-tooltip-box global-tooltip tex2jax_process';
    tooltip.id = 'tgs-hover-tooltip';
    tooltip.style.visibility = 'hidden';
    tooltip.style.opacity = '0';
    tooltip.innerHTML = text;
    
    // Add to body to measure size
    document.body.appendChild(tooltip);
    
    // Position callback to run AFTER MathJax typesetting completes
    const positionTooltip = () => {
        // Ensure the tooltip is still active and has not been removed in the meantime
        if (!document.getElementById('tgs-hover-tooltip')) return;

        const rect = target.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        
        // Center it above the target
        let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        let top = rect.top + window.scrollY - tooltipHeight - 12;
        
        // Boundary check: prevent overflowing off left/right
        if (left < 10) {
            left = 10;
        } else if (left + tooltipWidth > window.innerWidth - 10) {
            left = window.innerWidth - tooltipWidth - 10;
        }
        
        // Boundary check: if it goes off top of viewport, flip to bottom
        if (rect.top - tooltipHeight - 12 < 10) {
            top = rect.bottom + window.scrollY + 12;
            tooltip.classList.add('tooltip-bottom');
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
    };

    // Trigger MathJax typeset if available (handles both v2 and v3)
    if (window.MathJax) {
        if (window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([tooltip]).then(() => {
                positionTooltip();
            }).catch((err) => {
                console.error("MathJax v3 Typeset Promise failed:", err);
                positionTooltip();
            });
        } else if (window.MathJax.typeset) {
            window.MathJax.typeset([tooltip]);
            positionTooltip();
        } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
            // Force configuration to support inline delimiters and backslash processing in dynamically typeset nodes
            window.MathJax.Hub.Config({
                tex2jax: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    processEscapes: true
                }
            });
            // Queue the typesetting first, and then the positioning callback
            window.MathJax.Hub.Queue(
                ["Typeset", window.MathJax.Hub, "tgs-hover-tooltip"],
                positionTooltip
            );
        } else {
            positionTooltip();
        }
    } else {
        positionTooltip();
    }
    
    activeTooltip = tooltip;
}

function hideTooltip() {
    const existing = document.getElementById('tgs-hover-tooltip');
    if (existing) {
        existing.remove();
    }
    if (activeTooltip) {
        activeTooltip = null;
    }
}

function initTooltips() {
    // We listen to hover events on document body to handle dynamically added elements correctly
    document.addEventListener('mouseover', (e) => {
        const highlight = e.target.closest('.keyword-highlight');
        if (highlight && highlight !== activeTooltip?.targetNode) {
            hideTooltip();
            highlight.targetNode = highlight; // cache target reference
            showTooltip({ currentTarget: highlight });
        }
    });

    document.addEventListener('mouseout', (e) => {
        const highlight = e.target.closest('.keyword-highlight');
        if (highlight && (!e.relatedTarget || !e.relatedTarget.closest('.keyword-highlight'))) {
            hideTooltip();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initLanguageToggle();
    initTooltips();
});
