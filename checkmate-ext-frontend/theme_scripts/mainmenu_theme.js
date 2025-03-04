document.addEventListener('DOMContentLoaded', function() {
    // Theme settings - keep your existing theme settings
    const themes = {
        light: {
            bgColor: '#f4f4f4',
            containerBg: '#ffffff',
            textColor: '#333333',
            secondaryTextColor: '#666666',
            primaryColor: '#3cb371',
            secondaryColor: '#2e8b57',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            buttonGradient: 'linear-gradient(135deg, #3cb371, #2e8b57)',
            cardBg: '#f8f9fa',
            inputBg: '#f9f9f9',
            inputBorder: '#e0e0e0',
            borderColor: 'rgba(0,0,0,0.1)',
            statCardBg: '#f8f9fa',
            statValueColor: '#3cb371',
            statTitleColor: '#333333',
            statSubtitleColor: '#666666',
            headerIconOpacity: '0.7',
            scrollbarThumb: '#ccc',
            scrollbarTrack: '#f9f9f9'
        },
        dark: {
            bgColor: '#1a1a1a',
            containerBg: '#1E1E1E',
            textColor: '#e0e0e0',
            secondaryTextColor: '#b0b0b0',
            primaryColor: '#4eca89',
            secondaryColor: '#3da06b',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            buttonGradient: 'linear-gradient(135deg, #4eca89, #3da06b)',
            cardBg: '#333333',
            inputBg: '#2c2c2c',
            inputBorder: '#444444',
            borderColor: 'rgba(255,255,255,0.1)',
            statCardBg: '#333333',
            statValueColor: '#4eca89',
            statTitleColor: '#e0e0e0',
            statSubtitleColor: '#b0b0b0',
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
        
        // Header icons - Updated to use invert like in profile page
        document.querySelectorAll('.header-icon').forEach(img => {
            img.style.opacity = themeValues.headerIconOpacity;
            img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        });
        
        // Big analyze button
        const btnLarge = document.querySelector('.btn-large');
        if (btnLarge) {
            btnLarge.style.background = themeValues.buttonGradient;
            btnLarge.style.color = 'white';
            btnLarge.style.boxShadow = theme === 'dark' 
                ? '0 8px 20px rgba(60,179,113,0.2)' 
                : '0 8px 20px rgba(60,179,113,0.3)';
        }
        
        // URL Input Box
        const textArea = document.querySelector('.input-box textarea');
        if (textArea) {
            textArea.style.backgroundColor = themeValues.inputBg;
            textArea.style.color = themeValues.textColor;
            textArea.style.borderColor = themeValues.inputBorder;
        }
        
        // Analyze button
        const analyzeButton = document.querySelector('.analyze-button');
        if (analyzeButton) {
            analyzeButton.style.background = themeValues.primaryColor;
            analyzeButton.style.color = 'white';
        }
        
        // Dashboard preview section
        const dashboardPreview = document.querySelector('.dashboard-preview');
        if (dashboardPreview) {
            dashboardPreview.style.background = themeValues.cardBg;
            dashboardPreview.style.boxShadow = theme === 'dark' 
                ? '0 4px 8px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.08)';
        }
        
        // Preview header
        const previewHeader = document.querySelector('.preview-header');
        if (previewHeader) {
            const previewTitle = previewHeader.querySelector('.preview-title');
            if (previewTitle) {
                previewTitle.style.color = themeValues.textColor;
            }
            
            const previewArrow = previewHeader.querySelector('.preview-arrow');
            if (previewArrow) {
                previewArrow.style.color = themeValues.primaryColor;
            }
        }
        
        // Mini stat cards
        document.querySelectorAll('.mini-stat-card').forEach(card => {
            card.style.background = themeValues.statCardBg;
            
            const statValue = card.querySelector('.mini-stat-value');
            if (statValue) {
                statValue.style.color = themeValues.statValueColor;
            }
            
            const statTitle = card.querySelector('.mini-stat-title');
            if (statTitle) {
                statTitle.style.color = themeValues.statSubtitleColor;
            }
        });
        
        // Bottom icons bar
        const bottomIcons = document.querySelector('.bottom-icons');
        if (bottomIcons) {
            bottomIcons.style.background = themeValues.containerBg;
            bottomIcons.style.borderTopColor = themeValues.borderColor;
            
            // Bottom icons - Updated to use invert like in profile page
            bottomIcons.querySelectorAll('img').forEach(img => {
                img.style.opacity = themeValues.headerIconOpacity;
                img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
            });
            
            // Also handle icon buttons with images inside them
            bottomIcons.querySelectorAll('button img').forEach(img => {
                img.style.opacity = themeValues.headerIconOpacity;
                img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
            });
        }
        
        // Add dynamic styles for scrollbar and other effects
        updateDynamicStyles(theme, themeValues);
    }
    
    // Update dynamic styles
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
            
            /* Button hover effects */
            .btn-large:hover {
                transform: perspective(1000px) rotateX(2deg);
                box-shadow: ${theme === 'dark' 
                    ? '0 10px 25px rgba(78, 202, 137, 0.3)' 
                    : '0 10px 25px rgba(60, 179, 113, 0.4)'};
            }
            
            .analyze-button:hover {
                background: ${themeValues.secondaryColor};
                box-shadow: ${theme === 'dark' 
                    ? '0 5px 15px rgba(78, 202, 137, 0.25)' 
                    : '0 5px 15px rgba(60, 179, 113, 0.3)'};
            }
            
            .dashboard-preview:hover {
                transform: translateY(-2px);
                box-shadow: ${theme === 'dark' 
                    ? '0 8px 20px rgba(0,0,0,0.35)' 
                    : '0 8px 20px rgba(0,0,0,0.1)'};
            }
            
            /* Loading spinner color */
            .loading-spinner {
                border-color: ${theme === 'dark' 
                    ? 'rgba(78, 202, 137, 0.2)' 
                    : 'rgba(60, 179, 113, 0.2)'};
                border-top-color: ${themeValues.primaryColor};
            }
            
            /* Focus states for input */
            .input-box textarea:focus {
                border-color: ${themeValues.primaryColor};
                box-shadow: 0 0 0 2px ${theme === 'dark' 
                    ? 'rgba(78, 202, 137, 0.2)' 
                    : 'rgba(60, 179, 113, 0.2)'};
                outline: none;
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