// Absolute Link Resolver to convert relative links/images to absolute based on base URL
function absoluteifyLinks(container, baseUrl) {
    if (!container) return;
    const links = container.querySelectorAll('a');
    links.forEach(link => {
        const rawHref = link.getAttribute('href');
        if (rawHref && !rawHref.startsWith('http://') && !rawHref.startsWith('https://') && !rawHref.startsWith('javascript:') && !rawHref.startsWith('#')) {
            try {
                const absoluteUrl = new URL(rawHref, baseUrl).href;
                link.setAttribute('href', absoluteUrl);
            } catch (e) {
                console.warn("Could not absoluteify href:", rawHref, e);
            }
        }
    });
    const images = container.querySelectorAll('img');
    images.forEach(img => {
        const rawSrc = img.getAttribute('src');
        if (rawSrc && !rawSrc.startsWith('http://') && !rawSrc.startsWith('https://') && !rawSrc.startsWith('data:')) {
            try {
                const absoluteUrl = new URL(rawSrc, baseUrl).href;
                img.setAttribute('src', absoluteUrl);
            } catch (e) {
                console.warn("Could not absoluteify src:", rawSrc, e);
            }
        }
    });
}

// Helper to prepare parsed HTML preview panel structure (language wrapping and buttons)
function preparePreviewPanel(panel, savedLang) {
    // 1. Initialize dynamic components (triggers, drawers) inside the preview panel
    const triggers = panel.querySelectorAll('.drawer-trigger');
    triggers.forEach(trigger => {
        const target = trigger.getAttribute('data-target');
        const textHinglish = trigger.getAttribute('data-text-hinglish') || 'Explore';
        const textEnglish = trigger.getAttribute('data-text-english') || 'Explore';
        const textSpanish = trigger.getAttribute('data-text-spanish') || 'Explore';
        
        const button = document.createElement('button');
        button.className = 'drawer-trigger-btn';
        button.setAttribute('onclick', `openDrawer('${target}')`);
        button.innerHTML = `
            <span class="lang-content lang-hinglish">${textHinglish}</span>
            <span class="lang-content lang-english">${textEnglish}</span>
            <span class="lang-content lang-spanish">${textSpanish}</span>
        `;
        trigger.replaceWith(button);
    });

    const drawers = panel.querySelectorAll('.custom-drawer');
    drawers.forEach(drawer => {
        const id = drawer.id;
        const titleHinglish = drawer.getAttribute('data-title-hinglish') || drawer.getAttribute('data-title') || 'Deep Dive';
        const titleEnglish = drawer.getAttribute('data-title-english') || drawer.getAttribute('data-title') || 'Deep Dive';
        const titleSpanish = drawer.getAttribute('data-title-spanish') || drawer.getAttribute('data-title') || 'Deep Dive';
        
        const originalContent = drawer.innerHTML;
        
        drawer.className = 'drawer-container';
        drawer.innerHTML = `
            <div class="drawer-backdrop" onclick="closeDrawer('${id}')"></div>
            <div class="drawer-content">
                <div class="drawer-header">
                    <h3 class="lang-content lang-hinglish">${titleHinglish}</h3>
                    <h3 class="lang-content lang-english">${titleEnglish}</h3>
                    <h3 class="lang-content lang-spanish">${titleSpanish}</h3>
                    <button class="drawer-close-btn" onclick="closeDrawer('${id}')">&times;</button>
                </div>
                <div class="drawer-body">
                    ${originalContent}
                </div>
            </div>
        `;
    });

    // 2. Initialize Language Toggle wrapping on panel content
    const main = panel.querySelector('main');
    if (main) {
        const children = Array.from(main.children);
        let currentLangDiv = null;

        children.forEach(child => {
            if (child.classList.contains('lang-switch-container')) {
                child.remove();
                return;
            }

            if (child.classList.contains('lang-marker')) {
                const markerLang = child.getAttribute('data-lang');
                if (markerLang === 'shared') {
                    currentLangDiv = null;
                    child.remove();
                    return;
                }

                currentLangDiv = document.createElement('div');
                currentLangDiv.className = 'lang-content lang-' + markerLang;
                currentLangDiv.style.display = 'none';
                
                main.insertBefore(currentLangDiv, child);
                child.remove();
                return;
            }

            if (currentLangDiv) {
                currentLangDiv.appendChild(child);
            }
        });

        // Filter language
        const contents = panel.querySelectorAll('.lang-content');
        contents.forEach(el => {
            if (el.classList.contains('lang-' + savedLang)) {
                el.style.display = 'block';
                el.classList.add('active');
                el.style.opacity = '1';
            } else {
                el.style.display = 'none';
                el.classList.remove('active');
                el.style.opacity = '0';
            }
        });
    }
}

// Helper to sync language inside adjacent preview panels
function syncPanelLanguage(panel, lang) {
    const contents = panel.querySelectorAll('.lang-content');
    contents.forEach(el => {
        if (el.classList.contains('lang-' + lang)) {
            el.style.display = 'block';
            el.classList.add('active');
            el.style.opacity = '1';
        } else {
            el.style.display = 'none';
            el.classList.remove('active');
            el.style.opacity = '0';
        }
    });
}

// Fetch adjacent pages asynchronously and render side panels
function initSwipePreviews() {
    if (window.innerWidth > 1024) return; // Swipe previews only on mobile
    
    const prevLinkElement = document.querySelector('.nav-chapters.previous');
    const prevHref = prevLinkElement ? prevLinkElement.href : null;
    
    const nextLinkElement = document.querySelector('.nav-chapters.next');
    const nextHref = nextLinkElement ? nextLinkElement.href : null;
    
    const pageEl = document.querySelector('.page');
    if (!pageEl) return;
    
    const savedLang = localStorage.getItem('preferred-language') || 'hinglish';

    if (prevHref) {
        fetch(prevHref)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const content = doc.querySelector('.page');
                if (content) {
                    const prevPanel = document.createElement('div');
                    prevPanel.className = 'swipe-preview-panel swipe-prev-panel';
                    prevPanel.innerHTML = content.innerHTML;
                    preparePreviewPanel(prevPanel, savedLang);
                    absoluteifyLinks(prevPanel, prevHref);
                    pageEl.appendChild(prevPanel);
                    if (typeof typesetElement === 'function') {
                        typesetElement(prevPanel);
                    }
                }
            })
            .catch(err => console.warn("Failed to fetch prev page preview:", err));
    }

    if (nextHref) {
        fetch(nextHref)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const content = doc.querySelector('.page');
                if (content) {
                    const nextPanel = document.createElement('div');
                    nextPanel.className = 'swipe-preview-panel swipe-next-panel';
                    nextPanel.innerHTML = content.innerHTML;
                    preparePreviewPanel(nextPanel, savedLang);
                    absoluteifyLinks(nextPanel, nextHref);
                    pageEl.appendChild(nextPanel);
                    if (typeof typesetElement === 'function') {
                        typesetElement(nextPanel);
                    }
                }
            })
            .catch(err => console.warn("Failed to fetch next page preview:", err));
    }
}

// Wiggle/nudge hint on page load
function triggerSwipeWiggleHint() {
    if (window.innerWidth > 1024) return; // Only on mobile
    
    const wiggleShown = sessionStorage.getItem('swipe-wiggle-shown');
    sessionStorage.setItem('swipe-wiggle-shown', 'true');
    
    const currentPath = window.location.pathname;
    const lastPath = sessionStorage.getItem('swipe-last-path');
    sessionStorage.setItem('swipe-last-path', currentPath);
    
    const hasPrev = !!document.querySelector('.nav-chapters.previous') || !!document.querySelector('.mobile-nav-chapters.previous');
    if (hasPrev) return; // Not the landing page, exit!
    
    const isReload = (lastPath === currentPath);
    
    if (wiggleShown && !isReload) {
        return; // Already shown in this session and not a refresh, exit!
    }
    
    const pageEl = document.querySelector('.page');
    if (!pageEl) return;
    
    const hasNext = !!document.querySelector('.nav-chapters.next');
    let nudgeAmount = 0;
    if (hasNext) {
        nudgeAmount = -30;
    }
    
    if (nudgeAmount === 0) return;
    
    setTimeout(() => {
        if (document.body.classList.contains('drawer-open') || document.body.classList.contains('sidebar-visible')) {
            return;
        }

        pageEl.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        pageEl.style.transform = `translateX(${nudgeAmount}px)`;
        
        setTimeout(() => {
            pageEl.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            pageEl.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                pageEl.style.transform = '';
                pageEl.style.transition = '';
            }, 600);
        }, 350);
    }, 800);
}

// Desktop Edge Hover Navigation Reveal Handler
document.addEventListener('mousemove', (e) => {
    if (window.innerWidth <= 1024) return; // Only run on desktop viewports
    
    const width = window.innerWidth;
    const margin = 60; // Margin width from screen edge
    const leftArrow = document.querySelector('.nav-chapters.previous');
    const rightArrow = document.querySelector('.nav-chapters.next');
    
    // Check if sidebar is open
    const sidebarToggle = document.getElementById('mdbook-sidebar-toggle-anchor');
    const isSidebarOpen = sidebarToggle ? sidebarToggle.checked : false;
    
    // Calculate left hover zone start/end depending on sidebar visibility
    const sidebarWidth = isSidebarOpen ? 300 : 0;
    const leftZoneStart = sidebarWidth;
    const leftZoneEnd = sidebarWidth + margin;
    
    // Calculate right hover zone
    const rightZoneStart = width - margin;
    
    // Reveal or hide previous arrow
    if (leftArrow) {
        if (e.clientX >= leftZoneStart && e.clientX <= leftZoneEnd) {
            leftArrow.classList.add('reveal');
        } else {
            leftArrow.classList.remove('reveal');
        }
    }
    
    // Reveal or hide next arrow
    if (rightArrow) {
        if (e.clientX >= rightZoneStart && e.clientX <= width) {
            rightArrow.classList.add('reveal');
        } else {
            rightArrow.classList.remove('reveal');
        }
    }
});

// Mobile Page Navigation Touch Swipe Gestures
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let currentDeltaX = 0;
let isHorizontalSwipe = false;
let pageEl = null;

document.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 1024) return; // Swipe is only enabled on mobile/tablet viewports
    
    // Exclude swipe trigger when drawers, tooltips, sidebar, search overlay or interactive elements are targeted
    if (document.body.classList.contains('drawer-open') || 
        document.body.classList.contains('sidebar-visible') || 
        e.target.closest('pre, code, table, .MathJax_Display, .MathJax, mjx-container, .sidebar, .drawer-container, .keyword-tooltip-box, .lang-switch-container, button, a, input, textarea, [contenteditable="true"]')) {
        return;
    }

    const startX = e.touches[0].clientX;
    const startY = e.touches[0].clientY;
    
    // iOS Native back/forward swipe compatibility: Ignore swipes starting within 20px of screen edges
    if (startX < 20 || startX > window.innerWidth - 20) {
        return;
    }

    touchStartX = startX;
    touchStartY = startY;
    touchStartTime = Date.now();
    currentDeltaX = 0;
    isHorizontalSwipe = false;
    pageEl = document.querySelector('.page');
    
    if (pageEl) {
        pageEl.style.transition = 'none';
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!pageEl) return;

    // Abort swipe if user is currently selecting/highlighting text
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        pageEl.style.transform = '';
        isHorizontalSwipe = false;
        pageEl = null;
        return;
    }

    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;

    if (!isHorizontalSwipe) {
        // Determine horizontal intent: minimum X displacement of 10px and at least 2x greater than vertical displacement
        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
            isHorizontalSwipe = true;
        }
    }

    if (isHorizontalSwipe) {
        // Prevent default vertical page scrolling when horizontal swipe is active
        if (e.cancelable) e.preventDefault();

        // Check if pages exist in respective directions
        const hasPrev = !!document.querySelector('.nav-chapters.previous');
        const hasNext = !!document.querySelector('.nav-chapters.next');

        let dragX = deltaX * 0.85; // 0.85 mass resistance factor
        // Apply rubber-banding friction factor if pulling where no adjacent page exists
        if ((deltaX > 0 && !hasPrev) || (deltaX < 0 && !hasNext)) {
            dragX = deltaX * 0.22; // stronger rubber banding for weight feel
        }

        currentDeltaX = dragX;
        pageEl.style.transform = `translateX(${dragX}px)`;
    }
}, { passive: false });

function handleTouchEndOrCancel(e) {
    if (!pageEl || !isHorizontalSwipe) return;

    const timeDiff = Date.now() - touchStartTime;
    const velocity = Math.abs(currentDeltaX) / timeDiff; // Pixels per millisecond
    const threshold = window.innerWidth * 0.25; // 25% of screen width

    // Snappy flick: velocity > 0.5px/ms and minimum 30px drag distance
    const isFlick = velocity > 0.5 && Math.abs(currentDeltaX) > 30;
    const isLongSwipe = Math.abs(currentDeltaX) > threshold;

    const hasPrev = !!document.querySelector('.nav-chapters.previous') || !!document.querySelector('.mobile-nav-chapters.previous');
    const hasNext = !!document.querySelector('.nav-chapters.next') || !!document.querySelector('.mobile-nav-chapters.next');

    pageEl.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

    if ((isFlick || isLongSwipe) && currentDeltaX > 0 && hasPrev) {
        // Swipe Right -> Previous Page
        pageEl.style.transform = 'translateX(100vw)';
        const prevLinkElement = document.querySelector('.nav-chapters.previous') || document.querySelector('.mobile-nav-chapters.previous');
        const prevLink = prevLinkElement ? prevLinkElement.href : null;
        if (prevLink) {
            setTimeout(() => {
                const swapped = navigateToPage(prevLink, 'prev');
                if (!swapped) {
                    window.location.href = prevLink;
                }
            }, 300); // Wait for transition to complete
        }
    } else if ((isFlick || isLongSwipe) && currentDeltaX < 0 && hasNext) {
        // Swipe Left -> Next Page
        pageEl.style.transform = 'translateX(-100vw)';
        const nextLinkElement = document.querySelector('.nav-chapters.next') || document.querySelector('.mobile-nav-chapters.next');
        const nextLink = nextLinkElement ? nextLinkElement.href : null;
        if (nextLink) {
            setTimeout(() => {
                const swapped = navigateToPage(nextLink, 'next');
                if (!swapped) {
                    window.location.href = nextLink;
                }
            }, 300); // Wait for transition to complete
        }
    } else {
        // Snap back to starting position
        pageEl.style.transform = 'translateX(0)';
        
        // Clean up inline styles after transitions finish
        setTimeout(() => {
            if (pageEl && !isHorizontalSwipe) {
                pageEl.style.transform = '';
                pageEl.style.transition = '';
            }
        }, 350);
    }

    isHorizontalSwipe = false;
    pageEl = null;
}

document.addEventListener('touchend', handleTouchEndOrCancel, { passive: true });
document.addEventListener('touchcancel', handleTouchEndOrCancel, { passive: true });

function updateSidebarActiveLink(url) {
    const sidebar = document.querySelector('.sidebar-scrollbox');
    if (!sidebar) return;
    
    sidebar.querySelectorAll('a').forEach(link => {
        link.classList.remove('active');
    });
    
    let pathname = new URL(url, window.location.origin).pathname;
    if (pathname.endsWith('/')) {
        pathname += 'index.html';
    }
    
    sidebar.querySelectorAll('a').forEach(link => {
        const linkPath = new URL(link.href, window.location.origin).pathname;
        if (linkPath === pathname || (pathname.endsWith('index.html') && linkPath.endsWith('index.html'))) {
            link.classList.add('active');
            link.scrollIntoView({ block: 'nearest' });
        }
    });
}

function navigateToPage(url, direction) {
    const pageEl = document.querySelector('.page');
    if (!pageEl) return false;
    
    const isNext = direction === 'next';
    const panelClass = isNext ? '.swipe-next-panel' : '.swipe-prev-panel';
    const panel = pageEl.querySelector(panelClass);
    
    if (!panel) return false;
    
    // 1. Update URL history
    window.history.pushState(null, '', url);
    
    // 2. Perform the swap
    const newMenuBar = panel.querySelector('#mdbook-menu-bar');
    const newContent = panel.querySelector('#mdbook-content');
    
    if (!newMenuBar || !newContent) return false;
    
    const currentMenuBar = pageEl.querySelector('#mdbook-menu-bar');
    const currentContent = pageEl.querySelector('#mdbook-content');
    
    if (currentMenuBar) currentMenuBar.replaceWith(newMenuBar.cloneNode(true));
    if (currentContent) currentContent.replaceWith(newContent.cloneNode(true));
    
    // Scroll page to top
    window.scrollTo(0, 0);
    
    // 3. Remove preview panels
    pageEl.querySelectorAll('.swipe-preview-panel').forEach(p => p.remove());
    
    // Reset page transformations
    pageEl.style.transform = '';
    pageEl.style.transition = '';
    
    // 4. Update sidebar link active state
    updateSidebarActiveLink(url);
    
    // 5. Resolve relative links to absolute under the new context
    absoluteifyLinks(document, url);

    // 6. Re-initialize page scripts
    if (typeof initLanguageToggle === 'function') initLanguageToggle();
    if (typeof initKeywordDrawer === 'function') initKeywordDrawer();
    if (typeof initTooltips === 'function') initTooltips();
    initSwipePreviews();
    
    return true;
}

function fetchPageAndSwap(url) {
    const pageEl = document.querySelector('.page');
    if (!pageEl) {
        window.location.reload();
        return;
    }
    
    pageEl.style.transition = 'opacity 0.2s ease-in-out';
    pageEl.style.opacity = '0.5';
    
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newPage = doc.querySelector('.page');
            
            if (newPage) {
                const newMenuBar = newPage.querySelector('#mdbook-menu-bar');
                const newContent = newPage.querySelector('#mdbook-content');
                
                const currentMenuBar = pageEl.querySelector('#mdbook-menu-bar');
                const currentContent = pageEl.querySelector('#mdbook-content');
                
                if (newMenuBar && currentMenuBar) currentMenuBar.replaceWith(newMenuBar.cloneNode(true));
                if (newContent && currentContent) currentContent.replaceWith(newContent.cloneNode(true));
                
                window.scrollTo(0, 0);
                
                pageEl.querySelectorAll('.swipe-preview-panel').forEach(p => p.remove());
                
                pageEl.style.transform = '';
                pageEl.style.transition = '';
                pageEl.style.opacity = '1';
                
                updateSidebarActiveLink(url);
                
                absoluteifyLinks(document, url);

                if (typeof initLanguageToggle === 'function') initLanguageToggle();
                if (typeof initKeywordDrawer === 'function') initKeywordDrawer();
                if (typeof initTooltips === 'function') initTooltips();
                initSwipePreviews();
            } else {
                window.location.reload();
            }
        })
        .catch(() => {
            window.location.reload();
        });
}

// Intercept arrow clicks for SPA navigation
document.addEventListener('click', (e) => {
    const arrow = e.target.closest('.nav-chapters, .mobile-nav-chapters');
    if (arrow) {
        const href = arrow.getAttribute('href');
        if (!href) return;
        
        e.preventDefault();
        
        const isNext = arrow.classList.contains('next');
        const direction = isNext ? 'next' : 'prev';
        const pageEl = document.querySelector('.page');
        
        if (pageEl) {
            const panelClass = isNext ? '.swipe-next-panel' : '.swipe-prev-panel';
            const panel = pageEl.querySelector(panelClass);
            
            if (panel) {
                pageEl.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                pageEl.style.transform = isNext ? 'translateX(-100vw)' : 'translateX(100vw)';
                
                setTimeout(() => {
                    const swapped = navigateToPage(arrow.href, direction);
                    if (!swapped) {
                        window.location.href = arrow.href;
                    }
                }, 300);
                return;
            }
        }
        
        window.location.href = arrow.href;
    }
});

window.addEventListener('popstate', () => {
    fetchPageAndSwap(window.location.href);
});

// Initialize swipe preview panels, relative-to-absolute links, and wiggle hint on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    absoluteifyLinks(document, window.location.href);
    initSwipePreviews();
    triggerSwipeWiggleHint();
});
