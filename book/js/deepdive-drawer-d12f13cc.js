function openDrawer(id) {
    const drawer = document.getElementById(id);
    if (!drawer) return;
    if (typeof hideTooltip === 'function') {
        hideTooltip(); // Hide active hover tooltip
    }
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden'; // Disable background scrolling
    document.body.classList.add('drawer-open');
}

function closeDrawer(id) {
    const drawer = document.getElementById(id);
    if (!drawer) return;
    drawer.classList.remove('open');
    
    // Only restore body styles if there are no other open drawers
    const openDrawers = document.querySelectorAll('.drawer-container.open');
    if (openDrawers.length === 0) {
        document.body.style.overflow = ''; // Restore background scrolling
        document.body.classList.remove('drawer-open');
    }
}

function openDrawerForKeyword(highlight) {
    // Resolve the active preferred language directly from local storage
    const lang = localStorage.getItem('preferred-language') || 'hinglish';
    
    // Resolve the keyword key
    const textContent = highlight.textContent || '';
    let key = null;
    if (typeof getKeywordKey === 'function') {
        key = getKeywordKey(textContent);
    }
    
    if (key && keywordDeepDives && keywordDeepDives[lang] && keywordDeepDives[lang][key]) {
        const data = keywordDeepDives[lang][key];
        
        // Populate the drawer title and content
        const titleEl = document.getElementById('keyword-drawer-title');
        titleEl.textContent = "Deep Dive: " + data.title;
        const bodyEl = document.getElementById('keyword-drawer-body');
        bodyEl.innerHTML = data.content;
        
        const openDrawerCallback = () => {
            openDrawer('keyword-deepdive-drawer');
        };

        // Trigger MathJax typeset on both title and body elements before opening the drawer
        if (window.MathJax) {
            if (window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([titleEl, bodyEl])
                    .then(openDrawerCallback)
                    .catch(err => {
                        console.error("MathJax typesetting failed:", err);
                        openDrawerCallback();
                    });
            } else if (window.MathJax.typeset) {
                window.MathJax.typeset([titleEl, bodyEl]);
                openDrawerCallback();
            } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
                if (typeof ensureMathJaxConfigured === 'function') {
                    ensureMathJaxConfigured();
                }
                window.MathJax.Hub.Queue(
                    ["Typeset", window.MathJax.Hub, [titleEl, bodyEl]],
                    openDrawerCallback
                );
            } else {
                openDrawerCallback();
            }
        } else {
            openDrawerCallback();
        }
    }
}

function initKeywordDrawer() {
    if (document.getElementById('keyword-deepdive-drawer')) return;
    const drawer = document.createElement('div');
    drawer.id = 'keyword-deepdive-drawer';
    drawer.className = 'drawer-container';
    drawer.innerHTML = `
        <div class="drawer-backdrop" onclick="closeDrawer('keyword-deepdive-drawer')"></div>
        <div class="drawer-content">
            <div class="drawer-header">
                <h3 id="keyword-drawer-title">Deep Dive</h3>
                <button class="drawer-close-btn" onclick="closeDrawer('keyword-deepdive-drawer')">&times;</button>
            </div>
            <div id="keyword-drawer-body" class="drawer-body">
                <!-- Dynamically populated content -->
            </div>
        </div>
    `;
    document.body.appendChild(drawer);
}

function initDynamicTriggers() {
    const triggers = document.querySelectorAll('.drawer-trigger');
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
}

function initDynamicDrawers() {
    const drawers = document.querySelectorAll('.custom-drawer');
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
}

// Global key down listener for closing drawers on Escape key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const openDrawers = document.querySelectorAll('.drawer-container.open');
        openDrawers.forEach(drawer => {
            closeDrawer(drawer.id);
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initKeywordDrawer();
});
