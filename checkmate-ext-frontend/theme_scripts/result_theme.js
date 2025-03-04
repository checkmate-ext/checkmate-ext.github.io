document.addEventListener('DOMContentLoaded', function() {
    // Theme settings
    const themes = {
        light: {
            bgColor: '#f4f4f4',
            containerBg: '#ffffff',
            textColor: '#333333',
            secondaryTextColor: '#666666',
            primaryColor: '#3cb371',
            secondaryColor: '#2e8b57',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            cardBg: '#f8f9fa',
            linkColor: '#1a73e8',
            borderColor: 'rgba(0,0,0,0.1)',
            buttonBg: '#3cb371',
            buttonText: 'white',
            reliabilityBarBg: '#e9ecef',
            scoreBoxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            listItemBg: '#ffffff',
            listItemBorder: '#eee',
            highlightBg: '#f2f9fd',
            headerIconOpacity: '0.7',
            scrollbarThumb: '#ccc',
            scrollbarTrack: '#f9f9f9'
        },
        dark: {
            bgColor: '#121212',
            containerBg: '#1E1E1E',
            textColor: '#e0e0e0',
            secondaryTextColor: '#b0b0b0',
            primaryColor: '#4eca89',
            secondaryColor: '#3da06b',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            cardBg: '#333333',
            linkColor: '#4dabf7',
            borderColor: 'rgba(255,255,255,0.1)',
            buttonBg: '#4eca89',
            buttonText: 'white',
            reliabilityBarBg: '#444444',
            scoreBoxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            listItemBg: '#333333',
            listItemBorder: '#444444',
            highlightBg: '#374151',
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
        
        // Header icons
        document.querySelectorAll('.header img, .header-icon').forEach(img => {
            img.style.opacity = themeValues.headerIconOpacity;
            img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        });
        
        // Result section
        const resultSection = document.querySelector('.result-section');
        if (resultSection) {
            resultSection.style.background = themeValues.containerBg;
            resultSection.style.color = themeValues.textColor;
        }
        
        // Article title
        const articleTitle = document.querySelector('.article-title');
        if (articleTitle) {
            articleTitle.style.color = themeValues.textColor;
        }
        
        // Article source
        const articleSource = document.querySelector('.article-source');
        if (articleSource) {
            articleSource.style.color = themeValues.secondaryTextColor;
        }
        
        // Reliability score section
        const reliabilityScore = document.getElementById('resultPageReliabilityScore');
        if (reliabilityScore) {
            reliabilityScore.style.boxShadow = themeValues.scoreBoxShadow;
        }
        
        // Score percentage
        const scorePercentage = document.querySelector('.score-percentage');
        if (scorePercentage) {
            // Keep the original color based on the score value
        }
        
        // Score label
        const scoreLabel = document.querySelector('.score-label');
        if (scoreLabel) {
            scoreLabel.style.color = themeValues.secondaryTextColor;
        }
        
        // Analysis details
        const analysisDetails = document.querySelector('.analysis-details');
        if (analysisDetails) {
            analysisDetails.style.background = themeValues.cardBg;
            analysisDetails.style.color = themeValues.textColor;
        }
        
        // Details list items
        document.querySelectorAll('#detailsList li').forEach(item => {
            item.style.backgroundColor = themeValues.listItemBg;
            item.style.borderColor = themeValues.listItemBorder;
        });
        
        // Action buttons
        document.querySelectorAll('.action-button').forEach(btn => {
            btn.style.backgroundColor = themeValues.buttonBg;
            btn.style.color = themeValues.buttonText;
        });
        
        // Report mistake button
        const reportMistakeBtn = document.getElementById('reportMistakeBtn');
        if (reportMistakeBtn) {
            reportMistakeBtn.style.backgroundColor = theme === 'dark' ? '#444' : '#e9e9e9';
            reportMistakeBtn.style.color = theme === 'dark' ? '#ccc' : '#666';
        }
        
        // Bottom icons bar
        const bottomIcons = document.querySelector('.bottom-icons');
        if (bottomIcons) {
            bottomIcons.style.background = themeValues.containerBg;
            bottomIcons.style.borderTopColor = themeValues.borderColor;
            
            // Icon colors
            bottomIcons.querySelectorAll('img').forEach(img => {
                img.style.opacity = themeValues.headerIconOpacity;
                img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
            });
            
            // Icon buttons
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
            .action-button:hover {
                background: ${themeValues.secondaryColor};
                transform: translateY(-1px);
            }
            
            #reportMistakeBtn:hover {
                background: ${theme === 'dark' ? '#555' : '#ddd'};
            }
            
            /* List item hover */
            #detailsList li:hover {
                background-color: ${theme === 'dark' ? '#3a3a3a' : '#f9f9f9'};
                border-left-color: ${themeValues.primaryColor};
            }
            
            /* Ensure links are visible in dark mode */
            a {
                color: ${themeValues.linkColor};
            }
            
            a:hover {
                text-decoration: underline;
                opacity: 0.9;
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