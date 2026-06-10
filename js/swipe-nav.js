// BookPage Class representing a page object to manage its UI, JS, and CSS
class BookPage {
    constructor(role) {
        this.role = role; // 'prev' | 'current' | 'next'
        this.el = null;   // DOM element container
        this.url = null;  // page url
        this.title = '';  // document title
        this.wideNavHTML = ''; // desktop navigation html
        this.isReady = false;  // Whether typesetting/rendering is complete
        this.readyPromise = null; // Promise resolving when page is fully ready
    }

    setElement(el, url, title = '') {
        this.el = el;
        this.url = url;
        this.title = title || (el ? el.pageTitle || '' : '');
        this.isReady = false;
        this.readyPromise = null;
    }

    translate(x) {
        if (this.el) {
            this.el.style.transform = typeof x === 'number' ? `translateX(${x}px)` : `translateX(${x})`;
        }
    }

    setTransition(transitionStr) {
        if (this.el) {
            this.el.style.transition = transitionStr;
        }
    }

    makeCurrent() {
        if (!this.el) return;
        this.role = 'current';
        this.el.id = 'mdbook-content';
        this.el.className = 'content';
        this.el.classList.remove('swiping');
        this.el.style.transform = '';
        this.el.style.transition = '';
        this.el.style.left = '';
        this.el.style.width = '';
        this.el.style.height = '';
        this.el.style.position = '';
        this.el.style.pointerEvents = '';
        this.el.removeAttribute('aria-hidden');
        
        // Remove nested preview panels if any
        this.el.querySelectorAll('.swipe-preview-panel').forEach(p => p.remove());
    }

    clearStyles() {
        if (this.el) {
            this.el.style.transform = '';
            this.el.style.transition = '';
        }
    }

    destroy() {
        if (this.el) {
            this.el.remove();
            this.el = null;
        }
        this.url = null;
        this.title = '';
        this.wideNavHTML = '';
        this.isReady = false;
        this.readyPromise = null;
    }
}

// Global active page objects
const currentPage = new BookPage('current');
const previousPage = new BookPage('prev');
const nextPage = new BookPage('next');

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
    
    // Clean up old objects first
    previousPage.destroy();
    nextPage.destroy();
    
    const contentEl = document.querySelector('#mdbook-content');
    if (!contentEl) return;
    currentPage.setElement(contentEl, window.location.href, document.title);
    currentPage.isReady = true;
    currentPage.readyPromise = Promise.resolve();
    
    const prevLinkElement = document.querySelector('.nav-chapters.previous') || document.querySelector('.mobile-nav-chapters.previous');
    const prevHref = prevLinkElement ? prevLinkElement.href : null;
    
    const nextLinkElement = document.querySelector('.nav-chapters.next') || document.querySelector('.mobile-nav-chapters.next');
    const nextHref = nextLinkElement ? nextLinkElement.href : null;
    
    const savedLang = localStorage.getItem('preferred-language') || 'hinglish';

    if (prevHref) {
        fetch(prevHref)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const content = doc.querySelector('#mdbook-content');
                const wideNav = doc.querySelector('.nav-wide-wrapper');
                if (content) {
                    const prevPanel = document.createElement('div');
                    prevPanel.className = 'content swipe-preview-panel swipe-prev-panel';
                    prevPanel.setAttribute('aria-hidden', 'true');
                    prevPanel.innerHTML = content.innerHTML;
                    prevPanel.pageTitle = doc.title; // Save fetched document title
                    if (wideNav) {
                        prevPanel.wideNavHTML = wideNav.outerHTML;
                    }
                    preparePreviewPanel(prevPanel, savedLang);
                    absoluteifyLinks(prevPanel, prevHref);
                    contentEl.appendChild(prevPanel);
                    
                    previousPage.setElement(prevPanel, prevHref, doc.title);
                    previousPage.wideNavHTML = wideNav ? wideNav.outerHTML : '';
                    
                    previousPage.isReady = false;
                    if (typeof typesetElement === 'function') {
                        previousPage.readyPromise = typesetElement(prevPanel).then(() => {
                            previousPage.isReady = true;
                        });
                    } else {
                        previousPage.isReady = true;
                        previousPage.readyPromise = Promise.resolve();
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
                const content = doc.querySelector('#mdbook-content');
                const wideNav = doc.querySelector('.nav-wide-wrapper');
                if (content) {
                    const nextPanel = document.createElement('div');
                    nextPanel.className = 'content swipe-preview-panel swipe-next-panel';
                    nextPanel.setAttribute('aria-hidden', 'true');
                    nextPanel.innerHTML = content.innerHTML;
                    nextPanel.pageTitle = doc.title; // Save fetched document title
                    if (wideNav) {
                        nextPanel.wideNavHTML = wideNav.outerHTML;
                    }
                    preparePreviewPanel(nextPanel, savedLang);
                    absoluteifyLinks(nextPanel, nextHref);
                    contentEl.appendChild(nextPanel);
                    
                    nextPage.setElement(nextPanel, nextHref, doc.title);
                    nextPage.wideNavHTML = wideNav ? wideNav.outerHTML : '';
                    
                    nextPage.isReady = false;
                    if (typeof typesetElement === 'function') {
                        nextPage.readyPromise = typesetElement(nextPanel).then(() => {
                            nextPage.isReady = true;
                        });
                    } else {
                        nextPage.isReady = true;
                        nextPage.readyPromise = Promise.resolve();
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
    
    const contentEl = document.querySelector('#mdbook-content');
    if (!contentEl) return;
    
    const hasNext = !!document.querySelector('.nav-chapters.next') || !!document.querySelector('.mobile-nav-chapters.next');
    let nudgeAmount = 0;
    if (hasNext) {
        nudgeAmount = -30;
    }
    
    if (nudgeAmount === 0) return;
    
    setTimeout(() => {
        if (document.body.classList.contains('drawer-open') || document.body.classList.contains('sidebar-visible')) {
            return;
        }

        contentEl.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        contentEl.style.transform = `translateX(${nudgeAmount}px)`;
        
        setTimeout(() => {
            contentEl.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            contentEl.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                contentEl.style.transform = '';
                contentEl.style.transition = '';
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

document.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 1024) return; // Swipe is only enabled on mobile/tablet viewports
    
    // Exclude swipe trigger when drawers, tooltips, sidebar, search overlay or interactive elements are targeted
    if (document.body.classList.contains('drawer-open') || 
        document.body.classList.contains('sidebar-visible') || 
        e.target.closest('pre, code, table, .MathJax_Display, .MathJax, mjx-container, .sidebar, .drawer-container, .keyword-tooltip-box, .lang-switch-container, button, a, input, textarea, [contenteditable="true"]')) {
        return;
    }

    // Exclude swipe if text is currently highlighted/selected
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        return;
    }

    const startX = e.touches[0].clientX;
    const startY = e.touches[0].clientY;
    
    // iOS/Android Native back/forward swipe compatibility: Ignore swipes starting within 35px of screen edges
    if (startX < 35 || startX > window.innerWidth - 35) {
        return;
    }

    touchStartX = startX;
    touchStartY = startY;
    touchStartTime = Date.now();
    currentDeltaX = 0;
    isHorizontalSwipe = false;
    
    // Bind currentPage element dynamically on touch start
    const contentEl = document.querySelector('#mdbook-content');
    if (contentEl) {
        currentPage.setElement(contentEl, window.location.href, document.title);
        currentPage.setTransition('none');
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!currentPage.el) return;

    // Abort swipe if user starts selecting/highlighting text
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        currentPage.clearStyles();
        isHorizontalSwipe = false;
        currentPage.el = null;
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

        // Add swiping class to parent element to make previews visible
        if (currentPage.el && !currentPage.el.classList.contains('swiping')) {
            currentPage.el.classList.add('swiping');
        }

        // Check if pages exist in respective directions in our objects
        const hasPrev = previousPage.url !== null && previousPage.el !== null;
        const hasNext = nextPage.url !== null && nextPage.el !== null;

        let dragX = deltaX * 0.85; // 0.85 mass resistance factor
        // Apply rubber-banding friction factor if pulling where no adjacent page exists
        if ((deltaX > 0 && !hasPrev) || (deltaX < 0 && !hasNext)) {
            dragX = deltaX * 0.22; // stronger rubber banding for weight feel
        }

        currentDeltaX = dragX;
        currentPage.translate(dragX);
    }
}, { passive: false });

function handleTouchEndOrCancel(e) {
    if (!currentPage.el || !isHorizontalSwipe) return;

    const timeDiff = Date.now() - touchStartTime;
    const dragX = currentDeltaX;
    const velocity = Math.abs(dragX) / timeDiff; // Pixels per millisecond
    const threshold = window.innerWidth * 0.25; // 25% of screen width

    // Snappy flick: velocity > 0.5px/ms and minimum 30px drag distance
    const isFlick = velocity > 0.5 && Math.abs(dragX) > 30;
    const isLongSwipe = Math.abs(dragX) > threshold;

    const hasPrev = previousPage.url !== null && previousPage.el !== null;
    const hasNext = nextPage.url !== null && nextPage.el !== null;

    currentPage.setTransition('transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)');

    let targetDirection = null;

    const onTransitionEnd = (event) => {
        if (event.propertyName !== 'transform') return;
        currentPage.el.removeEventListener('transitionend', onTransitionEnd);

        if (targetDirection === 'prev') {
            const swapFn = () => {
                const swapped = navigateToPage(previousPage.url, 'prev');
                if (!swapped) {
                    window.location.href = previousPage.url;
                }
            };
            if (previousPage.isReady) {
                swapFn();
            } else {
                let resolved = false;
                const fallbackId = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        swapFn();
                    }
                }, 200);
                if (previousPage.readyPromise) {
                    previousPage.readyPromise.then(() => {
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(fallbackId);
                            swapFn();
                        }
                    });
                } else {
                    swapFn();
                }
            }
        } else if (targetDirection === 'next') {
            const swapFn = () => {
                const swapped = navigateToPage(nextPage.url, 'next');
                if (!swapped) {
                    window.location.href = nextPage.url;
                }
            };
            if (nextPage.isReady) {
                swapFn();
            } else {
                let resolved = false;
                const fallbackId = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        swapFn();
                    }
                }, 200);
                if (nextPage.readyPromise) {
                    nextPage.readyPromise.then(() => {
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(fallbackId);
                            swapFn();
                        }
                    });
                } else {
                    swapFn();
                }
            }
        } else {
            currentPage.el.classList.remove('swiping');
            currentPage.clearStyles();
        }
    };

    currentPage.el.addEventListener('transitionend', onTransitionEnd);

    if ((isFlick || isLongSwipe) && dragX > 0 && hasPrev) {
        // Swipe Right -> Previous Page
        targetDirection = 'prev';
        currentPage.translate('100%');
    } else if ((isFlick || isLongSwipe) && dragX < 0 && hasNext) {
        // Swipe Left -> Next Page
        targetDirection = 'next';
        currentPage.translate('-100%');
    } else {
        // Snap back to starting position
        targetDirection = 'reset';
        currentPage.translate(0);
    }

    isHorizontalSwipe = false;
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

// Scans headers of the new page and dynamically updates the Table of Contents "On this page" outline in the sidebar
function rebuildSidebarHeaders() {
    const activeSection = document.querySelector('#mdbook-sidebar .active');
    if (!activeSection) return;

    // Remove existing "On this page" header submenus in the sidebar to prevent duplicate accumulations
    document.querySelectorAll('#mdbook-sidebar .on-this-page').forEach(el => el.remove());

    const main = document.getElementsByTagName('main')[0];
    if (!main) return;

    const headers = Array.from(main.querySelectorAll('h2, h3, h4, h5, h6'))
        .filter(h => h.id !== '' && h.children.length && h.children[0].tagName === 'A');

    if (headers.length === 0) return;

    const stack = [];
    const firstLevel = parseInt(headers[0].tagName.charAt(1));
    for (let i = 1; i < firstLevel; i++) {
        const ol = document.createElement('ol');
        ol.classList.add('section');
        if (stack.length > 0) {
            stack[stack.length - 1].ol.appendChild(ol);
        }
        stack.push({level: i + 1, ol: ol});
    }

    const foldLevel = 3;

    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const level = parseInt(header.tagName.charAt(1));

        const currentLevel = stack[stack.length - 1].level;
        if (level > currentLevel) {
            for (let nextLevel = currentLevel + 1; nextLevel <= level; nextLevel++) {
                const ol = document.createElement('ol');
                ol.classList.add('section');
                const last = stack[stack.length - 1];
                const lastChild = last.ol.lastChild;
                if (lastChild) {
                    lastChild.appendChild(ol);
                } else {
                    last.ol.appendChild(ol);
                }
                stack.push({level: nextLevel, ol: ol});
            }
        } else if (level < currentLevel) {
            while (stack.length > 1 && stack[stack.length - 1].level > level) {
                stack.pop();
            }
        }

        const li = document.createElement('li');
        li.className = 'header-item expanded';
        if (level < foldLevel) {
            li.classList.add('expanded');
        }
        const span = document.createElement('span');
        span.className = 'chapter-link-wrapper';
        const a = document.createElement('a');
        span.appendChild(a);
        a.href = '#' + header.id;
        a.className = 'header-in-summary';
        
        // Clone header text/elements
        const clone = header.children[0].cloneNode(true);
        clone.querySelectorAll('mark').forEach(mark => {
            mark.replaceWith(...mark.childNodes);
        });
        a.append(...clone.childNodes);

        a.addEventListener('click', (event) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const targetElement = document.getElementById(header.id);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        });

        const nextHeader = headers[i + 1];
        if (nextHeader !== undefined) {
            const nextLevel = parseInt(nextHeader.tagName.charAt(1));
            if (nextLevel > level && level >= foldLevel) {
                const toggle = document.createElement('a');
                toggle.className = 'chapter-fold-toggle header-toggle';
                toggle.addEventListener('click', () => {
                    li.classList.toggle('expanded');
                });
                const toggleDiv = document.createElement('div');
                toggleDiv.textContent = '❱';
                toggle.appendChild(toggleDiv);
                span.appendChild(toggle);
            }
        }
        li.appendChild(span);

        const currentParent = stack[stack.length - 1];
        currentParent.ol.appendChild(li);
    }

    const onThisPage = document.createElement('div');
    onThisPage.className = 'on-this-page';
    onThisPage.append(stack[0].ol);
    
    const activeItemSpan = activeSection.parentElement;
    if (activeItemSpan) {
        activeItemSpan.after(onThisPage);
    }
}

function navigateToPage(url, direction) {
    const contentEl = document.querySelector('#mdbook-content');
    if (!contentEl) return false;
    
    const isNext = direction === 'next';
    const pageObj = isNext ? nextPage : previousPage;
    const panel = pageObj.el;
    
    if (!panel) return false;
    
    // 1. Update URL history
    window.history.pushState(null, '', url);
    
    // 2. Perform the swap
    pageObj.makeCurrent();
    
    // Update document title
    if (pageObj.title) {
        document.title = pageObj.title;
    }
    
    // Save reading progress to localStorage
    try {
        localStorage.setItem('last-visited-page', new URL(url, window.location.origin).href);
    } catch(e) {}
    
    // Swap wide navigation wrapper
    const currentWideNav = document.querySelector('.nav-wide-wrapper');
    if (currentWideNav && pageObj.wideNavHTML) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pageObj.wideNavHTML;
        const newWideNav = tempDiv.firstElementChild;
        if (newWideNav) {
            currentWideNav.replaceWith(newWideNav);
        }
    }
    
    // Swap contentEl in the DOM
    contentEl.replaceWith(panel);
    
    // Disconnect the reference from the old objects so they don't delete the live DOM element
    if (isNext) {
        nextPage.el = null;
    } else {
        previousPage.el = null;
    }
    previousPage.destroy();
    nextPage.destroy();

    // Reset currentPage reference to point to the new active element in the DOM
    currentPage.setElement(panel, url, pageObj.title);
    currentPage.isReady = true;
    currentPage.readyPromise = Promise.resolve();
    
    // Scroll page to top
    window.scrollTo(0, 0);
    
    // 4. Update sidebar link active state
    updateSidebarActiveLink(url);
    
    // 5. Resolve relative links to absolute under the new context
    absoluteifyLinks(document, url);

    // 6. Re-initialize page scripts
    if (typeof initLanguageToggle === 'function') initLanguageToggle(true); // forceInstant = true
    if (typeof initKeywordDrawer === 'function') initKeywordDrawer();
    if (typeof initTooltips === 'function') initTooltips();
    
    // Rebuild sidebar headers
    rebuildSidebarHeaders();
    
    initSwipePreviews();
    
    return true;
}

function fetchPageAndSwap(url) {
    const contentEl = document.querySelector('#mdbook-content');
    if (!contentEl) {
        window.location.reload();
        return;
    }
    
    contentEl.style.transition = 'opacity 0.2s ease-in-out';
    contentEl.style.opacity = '0.5';
    
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('#mdbook-content');
            const newWideNav = doc.querySelector('.nav-wide-wrapper');
            
            if (newContent) {
                const currentContent = document.querySelector('#mdbook-content');
                if (currentContent) currentContent.replaceWith(newContent.cloneNode(true));
                
                const currentWideNav = document.querySelector('.nav-wide-wrapper');
                if (currentWideNav && newWideNav) currentWideNav.replaceWith(newWideNav.cloneNode(true));
                
                // Update document title
                if (doc.title) {
                    document.title = doc.title;
                }
                
                // Save reading progress to localStorage
                try {
                    localStorage.setItem('last-visited-page', new URL(url, window.location.origin).href);
                } catch(e) {}
                
                window.scrollTo(0, 0);
                
                const freshlySwappedContent = document.querySelector('#mdbook-content');
                freshlySwappedContent.querySelectorAll('.swipe-preview-panel').forEach(p => p.remove());
                
                freshlySwappedContent.style.transform = '';
                freshlySwappedContent.style.transition = '';
                freshlySwappedContent.style.opacity = '1';
                
                updateSidebarActiveLink(url);
                
                absoluteifyLinks(document, url);

                if (typeof initLanguageToggle === 'function') initLanguageToggle(true);
                if (typeof initKeywordDrawer === 'function') initKeywordDrawer();
                if (typeof initTooltips === 'function') initTooltips();
                
                // Rebuild sidebar headers
                rebuildSidebarHeaders();
                
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
        const pageObj = isNext ? nextPage : previousPage;
        
        if (currentPage.el && pageObj.el && pageObj.url) {
            currentPage.el.classList.add('swiping');
            currentPage.setTransition('transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)');
            
            const onTransitionEnd = (event) => {
                if (event.propertyName !== 'transform') return;
                currentPage.el.removeEventListener('transitionend', onTransitionEnd);
                
                const swapFn = () => {
                    const swapped = navigateToPage(pageObj.url, direction);
                    if (!swapped) {
                        window.location.href = pageObj.url;
                    }
                };
                if (pageObj.isReady) {
                    swapFn();
                } else {
                    let resolved = false;
                    const fallbackId = setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            swapFn();
                        }
                    }, 200);
                    if (pageObj.readyPromise) {
                        pageObj.readyPromise.then(() => {
                            if (!resolved) {
                                resolved = true;
                                clearTimeout(fallbackId);
                                swapFn();
                            }
                        });
                    } else {
                        swapFn();
                    }
                }
            };
            
            currentPage.el.addEventListener('transitionend', onTransitionEnd);
            currentPage.translate(isNext ? '-100%' : '100%');
            return;
        }
        
        window.location.href = href;
    }
});

window.addEventListener('popstate', () => {
    fetchPageAndSwap(window.location.href);
});

// Initialize swipe preview panels, relative-to-absolute links, progress restoration, and wiggle hint on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Session-based reading progress restoration on first visit
    try {
        if (!sessionStorage.getItem('reading-redirected')) {
            sessionStorage.setItem('reading-redirected', 'true');
            const lastPage = localStorage.getItem('last-visited-page');
            if (lastPage && lastPage !== window.location.href) {
                window.location.href = lastPage;
                return;
            }
        }
        localStorage.setItem('last-visited-page', window.location.href);
    } catch(e) {}

    absoluteifyLinks(document, window.location.href);
    initSwipePreviews();
    triggerSwipeWiggleHint();
});
