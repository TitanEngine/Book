function updateSidebarToC() {
    try {
        const tocLinks = document.querySelectorAll('.on-this-page a');
        tocLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const targetId = href.substring(1);
                const decodedId = decodeURIComponent(targetId);
                const target = document.getElementById(decodedId) || document.getElementById(targetId);
                if (target) {
                    const langWrapper = target.closest('.lang-content');
                    const li = link.closest('li');
                    if (li) {
                        if (langWrapper && (langWrapper.style.display === 'none' || !langWrapper.classList.contains('active'))) {
                            li.style.display = 'none';
                        } else {
                            li.style.display = 'block';
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error("ToC update failed:", e);
    }
}

function toggleLangDropdown(event) {
    if (event) {
        event.stopPropagation();
    }
    const trigger = event.currentTarget;
    const dropdown = trigger.closest('.lang-dropdown');
    if (!dropdown) return;
    
    const isOpen = dropdown.classList.contains('open');
    
    // Close all other dropdowns
    document.querySelectorAll('.lang-dropdown').forEach(d => {
        d.classList.remove('open');
        const t = d.querySelector('.lang-dropdown-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
    });
    
    if (!isOpen) {
        dropdown.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
    }
}

function selectLanguage(lang, event) {
    if (event) {
        event.stopPropagation();
    }
    switchLanguage(lang);
    
    // Close all dropdowns
    document.querySelectorAll('.lang-dropdown').forEach(d => {
        d.classList.remove('open');
        const t = d.querySelector('.lang-dropdown-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
    });
}

function switchLanguage(lang) {
    const contents = document.querySelectorAll('.lang-content');
    
    // Find currently visible content
    let activeContent = null;
    contents.forEach(el => {
        if (el.style.display === 'block' || el.classList.contains('active')) {
            activeContent = el;
        }
    });

    const targetContents = document.querySelectorAll('.lang-content.lang-' + lang);

    const performSwitch = () => {
        contents.forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active');
            el.style.opacity = '0';
        });

        targetContents.forEach(el => {
            el.style.display = 'block';
            el.style.transition = 'opacity 0.25s ease-in-out';
            el.style.opacity = '0';
            // Trigger reflow to ensure display: block is registered before setting opacity
            el.offsetHeight; 
            el.classList.add('active');
            el.style.opacity = '1';
        });

        // Sync sidebar Table of Contents with visible headers
        updateSidebarToC();
    };

    if (activeContent && activeContent !== targetContents[0]) {
        // Fade out active content first
        contents.forEach(el => {
            if (el.style.display === 'block' || el.classList.contains('active')) {
                el.style.transition = 'opacity 0.2s ease-in-out';
                el.style.opacity = '0';
            }
        });
        // Wait for fade out to finish, then switch and fade in
        setTimeout(performSwitch, 200);
    } else {
        // Instant switch if no active content (first load)
        performSwitch();
    }
    
    // Sync legacy buttons (if any exist in DOM)
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(lang)) {
            btn.classList.add('active');
        }
    });

    // Sync new dropdown elements active state and update trigger text
    const langNames = {
        hinglish: 'Hinglish',
        english: 'English',
        spanish: 'Español'
    };

    const dropdowns = document.querySelectorAll('.lang-dropdown');
    dropdowns.forEach(d => {
        const textEl = d.querySelector('.current-lang-text');
        if (textEl) {
            textEl.textContent = langNames[lang] || lang;
        }
        
        const items = d.querySelectorAll('.lang-dropdown-item');
        items.forEach(item => {
            item.classList.remove('active');
            const itemLang = item.getAttribute('data-lang');
            const itemOnclick = item.getAttribute('onclick');
            if (itemLang === lang || (itemOnclick && itemOnclick.includes(lang))) {
                item.classList.add('active');
            }
        });
    });

    localStorage.setItem('preferred-language', lang);
}

function initLanguageToggle() {
    if (typeof initDynamicTriggers === 'function') {
        initDynamicTriggers();
    }
    if (typeof initDynamicDrawers === 'function') {
        initDynamicDrawers();
    }

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

    // Filter sidebar ToC once built dynamically
    setTimeout(updateSidebarToC, 100);

    // Reveal page content only after MathJax typesetting is complete to prevent raw text flash and layout shifts
    if (window.MathJax && window.MathJax.Hub) {
        window.MathJax.Hub.Queue(function() {
            document.documentElement.classList.add('lang-ready');
        });
    } else {
        document.documentElement.classList.add('lang-ready');
    }
    
    // Safety fallback timeout
    setTimeout(() => {
        document.documentElement.classList.add('lang-ready');
    }, 800);
}

document.addEventListener('click', (e) => {
    // Close language dropdowns if clicked outside
    if (!e.target.closest('.lang-dropdown')) {
        document.querySelectorAll('.lang-dropdown').forEach(d => {
            d.classList.remove('open');
            const t = d.querySelector('.lang-dropdown-trigger');
            if (t) t.setAttribute('aria-expanded', 'false');
        });
    }

    // Close sidebar on mobile/split-screen if clicked outside the sidebar and not on the sidebar toggle icon
    const isSidebarOverlay = window.innerWidth <= 1024;
    if (isSidebarOverlay && document.documentElement.classList.contains('sidebar-visible')) {
        const sidebar = document.getElementById('mdbook-sidebar');
        const toggleBtn = document.getElementById('mdbook-sidebar-toggle');
        if (sidebar && !sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
            e.preventDefault();
            e.stopPropagation();
            
            const anchor = document.getElementById('mdbook-sidebar-toggle-anchor');
            if (anchor) {
                anchor.checked = false;
                document.documentElement.classList.remove('sidebar-visible');
                localStorage.setItem('mdbook-sidebar', 'hidden');
            }
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initLanguageToggle();
    
    // Set up MutationObserver to sync Table of Contents as soon as it is rendered
    try {
        const observer = new MutationObserver((mutations) => {
            const toc = document.querySelector('.on-this-page');
            if (toc) {
                updateSidebarToC();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
        console.error("ToC MutationObserver failed:", e);
    }
});
