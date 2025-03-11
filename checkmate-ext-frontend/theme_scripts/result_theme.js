document.addEventListener('DOMContentLoaded', function() {
    // Theme settings remain the same
    const themes = {
        light: {
            bgColor: '#f4f4f4',
            containerBg: '#ffffff',
            textColor: '#333333',
            secondaryTextColor: '#666666',
            primaryColor: '#3cb371',
            secondaryColor: '#2e8b57',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            detailsBoxBg: '#ffffff',
            detailsBoxBorder: '#ddd',
            detailsTextColor: '#333333',
            listItemBg: '#ffffff',
            listItemBorder: '#eee',
            linkColor: '#1a73e8',
            borderColor: 'rgba(0,0,0,0.1)',
            reportBtnBg: '#f1c40f',  // Original warning color
            reportBtnColor: '#333333',
            headerIconOpacity: '0.7',
            scrollbarThumb: '#ccc',
            scrollbarTrack: '#f9f9f9'
        },
        dark: {
            bgColor: '#1a1a1a',
            containerBg: '#2d2d2d',
            textColor: '#e0e0e0',
            secondaryTextColor: '#b0b0b0',
            primaryColor: '#4eca89',
            secondaryColor: '#3da06b',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            detailsBoxBg: '#333333',
            detailsBoxBorder: '#444444',
            detailsTextColor: '#e0e0e0',
            listItemBg: '#3a3a3a',
            listItemBorder: '#555555',
            linkColor: '#4dabf7',
            borderColor: 'rgba(255,255,255,0.1)',
            reportBtnBg: '#f1c40f',  // Keep the original warning color
            reportBtnColor: '#333333',
            headerIconOpacity: '0.85',
            scrollbarThumb: '#666',
            scrollbarTrack: '#222'
        }
    };

    // Check for saved theme preference or system preference
    let currentTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    // Apply theme immediately
    applyTheme(currentTheme);
    
    // Listen for changes from other pages
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') {
            const newTheme = e.newValue;
            if (newTheme === 'dark' || newTheme === 'light') {
                currentTheme = newTheme;
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
        document.documentElement.style.setProperty('--neutral-bg', themeValues.containerBg);
        
        // Apply basic styles
        document.body.style.backgroundColor = themeValues.bgColor;
        document.body.style.color = themeValues.textColor;
        
        // Container styling
        const container = document.querySelector('.container');
        if (container) {
            container.style.backgroundColor = themeValues.containerBg;
            container.style.boxShadow = themeValues.boxShadow;
        }
        
        // Header styling
        const header = document.querySelector('.header');
        if (header) {
            header.style.background = themeValues.containerBg;
        }
        
        // Header icons
        document.querySelectorAll('.header-icons img').forEach(img => {
            img.style.opacity = themeValues.headerIconOpacity;
            img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        });
        
        // Logo container (if present)
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.style.background = themeValues.containerBg;
        }
        
        // Content area
        const content = document.querySelector('.content');
        if (content) {
            content.style.color = themeValues.textColor;
        }
        
        // Score section
        const scoreSection = document.querySelector('.score-section');
        if (scoreSection) {
            scoreSection.style.color = themeValues.textColor;
        }
        
        // Score label
        const scoreLabel = document.querySelector('.score-label');
        if (scoreLabel) {
            scoreLabel.style.color = themeValues.secondaryTextColor;
        }
        
        // Details section
        const detailsSection = document.querySelector('.details-section');
        if (detailsSection) {
            detailsSection.style.color = themeValues.textColor;
        }
        
        // Details box (most important fix)
        const detailsBox = document.querySelector('.details-box');
        if (detailsBox) {
            detailsBox.style.backgroundColor = themeValues.detailsBoxBg;
            detailsBox.style.borderColor = themeValues.detailsBoxBorder;
            detailsBox.style.color = themeValues.detailsTextColor;
        }
        
        // Details list items
        const detailsList = document.getElementById('detailsList');
        if (detailsList) {
            detailsList.style.color = themeValues.detailsTextColor;
            
            // Style all headings in the details list
            detailsList.querySelectorAll('h2, h4').forEach(heading => {
                heading.style.color = themeValues.detailsTextColor;
            });
            
            // Style all list items
            detailsList.querySelectorAll('li').forEach(item => {
                item.style.backgroundColor = themeValues.listItemBg;
                item.style.borderColor = themeValues.listItemBorder;
                item.style.color = themeValues.detailsTextColor;
                // Remove hover transitions if they exist
                item.style.transition = 'none';
            });
            
            // Style all links
            detailsList.querySelectorAll('a').forEach(link => {
                link.style.color = themeValues.linkColor;
                // Remove underline on hover effect
                link.style.textDecoration = 'underline';
                link.style.transition = 'none';
            });
        }
        
        // Fix heading colors
        document.querySelectorAll('.details-box h2').forEach(heading => {
            heading.style.color = themeValues.detailsTextColor;
        });
        
        // More details button
        const moreDetailsBtn = document.getElementById('moreDetailsBtn');
        if (moreDetailsBtn) {
            moreDetailsBtn.style.background = themeValues.primaryColor;
            moreDetailsBtn.style.color = 'white'; // Always white for contrast
            // Simplify button style - remove transitions
            moreDetailsBtn.style.transition = 'none';
        }
        
        // Report mistake button - revert to original warning color
        const reportMistakeBtn = document.getElementById('reportMistakeBtn');
        if (reportMistakeBtn) {
            reportMistakeBtn.style.backgroundColor = themeValues.reportBtnBg;
            reportMistakeBtn.style.color = themeValues.reportBtnColor;
            // Simplify button style - remove transitions
            reportMistakeBtn.style.transition = 'none';
        }
        
        // Bottom icons
        const bottomLeftIcon = document.querySelector('.bottom-left-icon');
        const bottomRightIcon = document.querySelector('.bottom-right-icon');
        
        if (bottomLeftIcon) {
            const img = bottomLeftIcon.querySelector('img');
            if (img) {
                img.style.opacity = themeValues.headerIconOpacity;
                img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
            }
        }
        
        if (bottomRightIcon) {
            const img = bottomRightIcon.querySelector('img');
            if (img) {
                img.style.opacity = themeValues.headerIconOpacity;
                img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
            }
        }
        
        // Add dynamic styles for scrollbar
        updateDynamicStyles(theme, themeValues);
    }
    
    // Update dynamic styles - simplified to remove hover effects
    function updateDynamicStyles(theme, themeValues) {
        let styleElement = document.getElementById('theme-dynamic-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'theme-dynamic-styles';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            /* Scrollbar styles */
            ::-webkit-scrollbar {
                width: 6px;
            }
            
            ::-webkit-scrollbar-thumb {
                background: ${themeValues.scrollbarThumb};
                border-radius: 3px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background: ${theme === 'dark' ? '#888' : '#bbb'};
            }
            
            ::-webkit-scrollbar-track {
                background: ${themeValues.scrollbarTrack};
            }
            
            /* Remove hover effects */
            #detailsList li {
                border-left: 0;
                transition: none;
            }
            
            /* Override any existing hover styles */
            #detailsList li:hover {
                transform: none !important;
                box-shadow: none !important;
                border-left: 0 !important;
                padding-left: 0 !important;
                background-color: ${themeValues.listItemBg} !important;
            }
            
            /* Button simplified style */
            .more-details-button:hover,
            .report-mistake-button:hover {
                transform: none !important;
                box-shadow: none !important;
            }
            
            /* Simple link styling without hover effects */
            #detailsList a {
                color: ${themeValues.linkColor};
                text-decoration: underline;
                transition: none;
            }
            
            #detailsList a:hover {
                opacity: 1;
            }
            
            /* Ensure no element has distracting hover effects */
            * {
                transition-property: color, background-color, border-color;
                transition-duration: 0.1s;
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