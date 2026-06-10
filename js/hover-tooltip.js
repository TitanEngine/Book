let activeTooltip = null;
let activePressedHighlight = null;

function showTooltip(event) {
    const target = event.currentTarget;
    const text = target.getAttribute('data-tooltip');
    if (!text) return;

    const isTooltipOnly = target.classList.contains('tooltip-only');
    const ctaText = 'Click for more details';

    // Parse tooltip text to check for Physics / Game Physics sections
    let formattedText = text;
    const parts = text.split(/(?:<br\s*\/?>\s*<br\s*\/?>|&lt;br&gt;\s*&lt;br&gt;)/i);
    if (parts.length === 2) {
        const part1 = parts[0].trim();
        const part2 = parts[1].trim();
        
        // Match Physics: or Física: (case-insensitive)
        const p1Match = part1.match(/^(Physics|Física):\s*(.*)/i);
        // Match Game Physics: or Física de juegos: (case-insensitive)
        const p2Match = part2.match(/^(Game Physics|Física de juegos):\s*(.*)/i);
        
        if (p1Match && p2Match) {
            const label1 = p1Match[1];
            const desc1 = p1Match[2];
            const label2 = p2Match[1];
            const desc2 = p2Match[2];
            
            formattedText = `
                <div class="tooltip-section physics-section">
                    <span class="tooltip-label physics-label">${label1}</span>
                    <span class="tooltip-desc">${desc1}</span>
                </div>
                <div class="tooltip-divider"></div>
                <div class="tooltip-section game-physics-section">
                    <span class="tooltip-label game-physics-label">${label2}</span>
                    <span class="tooltip-desc">${desc2}</span>
                </div>
            `;
        } else {
            formattedText = `
                <div class="tooltip-section">${part1}</div>
                <div class="tooltip-divider"></div>
                <div class="tooltip-section">${part2}</div>
            `;
        }
    }

    // Create the tooltip element with explicit tex2jax_process class to force typesetting
    const tooltip = document.createElement('div');
    tooltip.className = 'keyword-tooltip-box global-tooltip tex2jax_process';
    tooltip.id = 'tgs-hover-tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-body-content">${formattedText}</div>
        ${isTooltipOnly ? '' : `<div class="tooltip-click-cta">${ctaText}</div>`}
    `;
    
    // Add to body to measure size
    document.body.appendChild(tooltip);
    
    const positionTooltip = () => {
        if (!document.getElementById('tgs-hover-tooltip')) return;

        const rect = target.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        
        let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        let top = rect.top + window.scrollY - tooltipHeight - 12;
        
        // Mobile Safety Boundaries: Ensure tooltip never bleeds off the viewport edges
        const paddingSafety = 16;
        if (left < paddingSafety) {
            left = paddingSafety;
        } else if (left + tooltipWidth > window.innerWidth - paddingSafety) {
            left = window.innerWidth - tooltipWidth - paddingSafety;
        }
        
        if (rect.top - tooltipHeight - 12 < paddingSafety) {
            top = rect.bottom + window.scrollY + 12;
            tooltip.classList.add('tooltip-bottom');
        } else {
            tooltip.classList.remove('tooltip-bottom');
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
        void tooltip.offsetHeight;
        tooltip.classList.add('tooltip-show');
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
            if (typeof ensureMathJaxConfigured === 'function') {
                ensureMathJaxConfigured();
            }
            // Queue the typesetting first, and then the positioning callback using the element node
            window.MathJax.Hub.Queue(
                ["Typeset", window.MathJax.Hub, tooltip],
                positionTooltip
            );
        } else {
            positionTooltip();
        }
    } else {
        positionTooltip();
    }
    
    activeTooltip = tooltip;
    tooltip.targetNode = target;
}

function hideTooltip() {
    const existing = document.getElementById('tgs-hover-tooltip');
    if (existing) {
        existing.removeAttribute('id');
        existing.classList.remove('tooltip-show');
        const currentTooltip = existing;
        setTimeout(() => {
            if (currentTooltip.parentNode) {
                currentTooltip.remove();
            }
        }, 250);
    }
    if (activeTooltip) {
        activeTooltip = null;
    }
}

function initTooltips() {
    const isMobileTouch = () => window.matchMedia('(pointer: coarse)').matches;
    let hoverTimeout = null;

    // We listen to hover events on document body to handle dynamically added elements correctly
    document.addEventListener('mouseover', (e) => {
        if (isMobileTouch()) return; // Disable hover triggers on touch devices
        
        const highlight = e.target.closest('.keyword-highlight');
        
        // If mouse moves off the current keyword, cancel any pending show timeout
        if (!highlight || highlight !== activeTooltip?.targetNode) {
            clearTimeout(hoverTimeout);
        }
        
        // Do not show tooltip if we are actively pressing/dragging a keyword
        if (activePressedHighlight !== null) {
            return;
        }
        
        // If drawer is open, only show tooltip if hovered keyword is inside an open drawer
        if (document.body.classList.contains('drawer-open')) {
            if (!highlight || !highlight.closest('.drawer-container.open')) {
                return;
            }
        }
        
        if (highlight && highlight !== activeTooltip?.targetNode) {
            // Cancel any pending show timeout first
            clearTimeout(hoverTimeout);
            
            // Wait 300ms before showing the tooltip to prevent accidental flashes
            hoverTimeout = setTimeout(() => {
                hideTooltip();
                highlight.targetNode = highlight; // cache target reference
                showTooltip({ currentTarget: highlight });
            }, 300);
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (isMobileTouch()) return; // Disable hover triggers on touch devices
        
        const highlight = e.target.closest('.keyword-highlight');
        if (highlight && (!e.relatedTarget || !e.relatedTarget.closest('.keyword-highlight'))) {
            clearTimeout(hoverTimeout); // Cancel pending show immediately
            hideTooltip();
        }
    });

    // Mousedown to track click intent and hide tooltip immediately
    document.addEventListener('mousedown', (e) => {
        if (isMobileTouch()) return; // Ignore mousedown/mouseup logic on touch devices
        
        const highlight = e.target.closest('.keyword-highlight');
        if (highlight) {
            if (highlight.classList.contains('tooltip-only')) {
                return; // Ignore click tracking logic for tooltip-only annotations
            }
            // If drawer is open, only track click if the highlight is inside an open drawer
            if (document.body.classList.contains('drawer-open') && !highlight.closest('.drawer-container.open')) {
                return;
            }
            clearTimeout(hoverTimeout); // Cancel pending show immediately on click intent
            activePressedHighlight = highlight;
            hideTooltip(); // Hide tooltip immediately to prevent visual collision
        }
    });

    // Mouseup on document to detect drag-away and cancel click intent
    document.addEventListener('mouseup', (e) => {
        if (isMobileTouch()) return; // Ignore mousedown/mouseup logic on touch devices
        
        if (!activePressedHighlight) return;
        const highlight = e.target.closest('.keyword-highlight');
        if (highlight !== activePressedHighlight) {
            // Dragged away: reset click intent
            activePressedHighlight = null;
        }
    });

    // Click handler to open the dynamic keyword deep dive drawer or show/hide tooltip
    document.addEventListener('click', (e) => {
        const highlight = e.target.closest('.keyword-highlight');
        const inTooltip = e.target.closest('.keyword-tooltip-box');
        
        // 1. Hide tooltip when clicking outside both the keyword highlight and the tooltip box
        if (!highlight && !inTooltip) {
            hideTooltip();
            return;
        }

        // 2. Handle clicking the "CLICK FOR MORE DETAILS" CTA inside the tooltip
        const cta = e.target.closest('.tooltip-click-cta');
        if (cta && activeTooltip?.targetNode) {
            const targetNode = activeTooltip.targetNode;
            hideTooltip();
            if (typeof openDrawerForKeyword === 'function') {
                openDrawerForKeyword(targetNode);
            }
            return;
        }

        // 3. Handle clicking a keyword highlight
        if (highlight) {
            if (highlight.classList.contains('tooltip-only')) {
                if (isMobileTouch()) {
                    // Mobile: toggle tooltip on click, but never open deep dive drawer
                    if (!activeTooltip || activeTooltip.targetNode !== highlight) {
                        hideTooltip();
                        highlight.targetNode = highlight;
                        showTooltip({ currentTarget: highlight });
                    } else {
                        hideTooltip();
                    }
                }
                return;
            }

            if (isMobileTouch()) {
                // Mobile behavior: Tap once to show tooltip, tap again to open drawer
                if (!activeTooltip || activeTooltip.targetNode !== highlight) {
                    hideTooltip();
                    highlight.targetNode = highlight;
                    showTooltip({ currentTarget: highlight });
                    return; // Stop here, do not open drawer yet
                }
            } else {
                // Desktop behavior: Only open drawer if click was completed on the same keyword without dragging away
                if (activePressedHighlight !== highlight) {
                    return;
                }
                activePressedHighlight = null;
            }
            
            // Open drawer
            hideTooltip();
            if (typeof openDrawerForKeyword === 'function') {
                openDrawerForKeyword(highlight);
            }
        }
    });

    // Auto-hide tooltip on scroll for touch devices to prevent annotations from floating detached
    window.addEventListener('scroll', () => {
        if (isMobileTouch()) {
            hideTooltip();
        }
    }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
});
