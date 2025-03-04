document.addEventListener('DOMContentLoaded', function() {
    // Theme settings
    const themes = {
        light: {
            bgColor: '#f4f4f4',
            containerBg: '#ffffff',
            textColor: '#333333',
            secondaryTextColor: '#666666',
            dateColor: '#999999',
            primaryColor: '#3cb371',
            secondaryColor: '#2e8b57',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            cardBoxShadow: '0 5px 15px rgba(0,0,0,0.05)',
            borderColor: 'rgba(0,0,0,0.1)',
            cardBg: '#ffffff',
            cardBorderColor: '#eee',
            emptyTextColor: '#666666',
            scrollbarThumb: '#ccc',
            scrollbarTrack: '#f9f9f9',
            headerIconOpacity: '0.7'
        },
        dark: {
            bgColor: '#1a1a1a',
            containerBg: '#1E1E1E',
            textColor: '#e0e0e0',
            secondaryTextColor: '#b0b0b0',
            dateColor: '#999999',
            primaryColor: '#4eca89',
            secondaryColor: '#3da06b',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            cardBoxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            borderColor: 'rgba(255,255,255,0.1)',
            cardBg: '#333333',
            cardBorderColor: '#444444',
            emptyTextColor: '#b0b0b0',
            scrollbarThumb: '#666',
            scrollbarTrack: '#222',
            headerIconOpacity: '0.85'
        }
    };

    // Check for saved theme preference or use system preference
    let currentTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    // Apply theme immediately
    applyTheme(currentTheme);
    
    // Observer to watch for dynamically added history items
    setupMutationObserver();
    
    // Also listen for changes from other pages
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') {
            const newTheme = e.newValue;
            if (newTheme === 'dark' || newTheme === 'light') {
                applyTheme(newTheme);
            }
        }
    });
    
    // Apply theme function
    function applyTheme(theme) {
        const themeValues = themes[theme];
        
        // Apply CSS variables
        document.documentElement.style.setProperty('--bg-light', themeValues.bgColor);
        document.documentElement.style.setProperty('--text-dark', themeValues.textColor);
        document.documentElement.style.setProperty('--primary-color', themeValues.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', themeValues.secondaryColor);
        
        // Apply specific styles
        document.body.style.backgroundColor = themeValues.bgColor;
        document.body.style.color = themeValues.textColor;
        
        // Container styling
        const container = document.querySelector('.container');
        if (container) {
            container.style.backgroundColor = themeValues.containerBg;
            container.style.boxShadow = themeValues.boxShadow;
        }
        
        // Logo container
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.style.background = themeValues.containerBg;
        }
        
        // Style history items (including any that are dynamically added)
        styleHistoryItems(themeValues);
        
        // Bottom icons bar
        const bottomIcons = document.querySelector('.bottom-icons');
        if (bottomIcons) {
            bottomIcons.style.background = themeValues.containerBg;
            bottomIcons.style.borderTopColor = themeValues.borderColor;
        }
        
        // Header styling
        const header = document.querySelector('.header');
        if (header) {
            header.style.background = themeValues.containerBg;
        }
        
        // Icon colors adjustment
        document.querySelectorAll('.bottom-icons img, .header-icons img').forEach(img => {
            img.style.opacity = themeValues.headerIconOpacity;
            img.style.filter = theme === 'dark' ? 'brightness(1.2)' : 'none';
        });
        
        // Update scrollbar styles
        updateScrollbarStyles(theme, themeValues);
    }
    
    // Function to style all history items
    function styleHistoryItems(themeValues) {
        // Style existing history items
        document.querySelectorAll('.history-item').forEach(item => {
            styleHistoryItem(item, themeValues);
        });
        
        // Check for empty message
        const emptyMessage = document.querySelector('.history-list p');
        if (emptyMessage) {
            emptyMessage.style.color = themeValues.emptyTextColor;
        }
    }
    
    // Function to style a single history item
    function styleHistoryItem(item, themeValues) {
        item.style.background = themeValues.cardBg;
        item.style.borderColor = themeValues.cardBorderColor;
        item.style.boxShadow = 'none';
        
        // Style the title
        const titleEl = item.querySelector('.history-title');
        if (titleEl) {
            titleEl.style.color = themeValues.textColor;
        }
        
        // Style the URL
        const urlEl = item.querySelector('.history-url');
        if (urlEl) {
            urlEl.style.color = themeValues.secondaryTextColor;
        }
        
        // Style the date
        const dateEl = item.querySelector('.history-date');
        if (dateEl) {
            dateEl.style.color = themeValues.dateColor;
        }
        
        // Score doesn't need styling as it has its own colors
    }
    
    // Set up a mutation observer to watch for dynamically added history items
    function setupMutationObserver() {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;
        
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Process added nodes
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.classList.contains('history-item')) {
                                styleHistoryItem(node, themes[currentTheme]);
                            }
                            // Also check for message node if added
                            if (node.tagName === 'P') {
                                node.style.color = themes[currentTheme].emptyTextColor;
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(historyList, { childList: true, subtree: true });
    }
    
    // Update scrollbar styles
    function updateScrollbarStyles(theme, themeValues) {
        let styleElement = document.getElementById('theme-scrollbar-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'theme-scrollbar-styles';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            .scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            
            .scrollbar::-webkit-scrollbar-thumb {
                background: ${themeValues.scrollbarThumb};
                border-radius: 3px;
            }
            
            .scrollbar::-webkit-scrollbar-thumb:hover {
                background: ${theme === 'dark' ? '#888' : '#bbb'};
            }
            
            .scrollbar::-webkit-scrollbar-track {
                background: ${themeValues.scrollbarTrack};
            }
            
            .history-item:hover {
                transform: translateY(-2px);
                background-color: ${theme === 'dark' ? '#3a3a3a' : 'white'} !important;
                box-shadow: ${theme === 'dark' ? '0 8px 20px rgba(0,0,0,0.3)' : '0 5px 15px rgba(0,0,0,0.05)'} !important;
            }
        `;
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('theme') === null) {
            const newTheme = e.matches ? 'dark' : 'light';
            currentTheme = newTheme;
            applyTheme(newTheme);
        }
    });
});