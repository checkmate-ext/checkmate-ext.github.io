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
            cardBg: '#ffffff',
            cardBorder: '#eee',
            cardBoxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            metricItemBg: '#f9f9f9',
            sourceInfoBg: 'rgba(241, 196, 15, 0.1)',
            sourceInfoBorder: '#f1c40f',
            similarArticleBg: '#f9f9f9',
            similarArticleBorder: '#3cb371',
            similarArticleHoverBg: '#f2f2f2',
            linkColor: '#2e8b57',
            reportBtnBg: '#f1c40f',
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
            cardBg: '#333333',
            cardBorder: '#444444',
            cardBoxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            metricItemBg: '#3a3a3a',
            sourceInfoBg: 'rgba(241, 196, 15, 0.15)',
            sourceInfoBorder: '#d4ac0d',
            similarArticleBg: '#3a3a3a',
            similarArticleBorder: '#4eca89',
            similarArticleHoverBg: '#444444',
            linkColor: '#6cb2ff',
            reportBtnBg: '#f1c40f', // Keep the warning color even in dark mode
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
            header.style.backgroundColor = themeValues.containerBg;
        }
        
        // Header icons
        document.querySelectorAll('.header-icons img').forEach(img => {
            img.style.opacity = themeValues.headerIconOpacity;
            img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        });
        
        // Logo container (if present)
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.style.backgroundColor = themeValues.containerBg;
        }
        
        // Content area
        const content = document.querySelector('.content');
        if (content) {
            content.style.color = themeValues.textColor;
        }
        
        // Score section
        const scoreSection = document.querySelector('.score-section');
        if (scoreSection) {
            scoreSection.style.backgroundColor = themeValues.cardBg;
            scoreSection.style.boxShadow = themeValues.cardBoxShadow;
            scoreSection.style.color = themeValues.textColor;
        }
        
        // Score label
        const scoreLabel = document.querySelector('.score-label');
        if (scoreLabel) {
            scoreLabel.style.color = themeValues.secondaryTextColor;
        }

        // Score description
        const scoreDesc = document.querySelector('.score-desc');
        if (scoreDesc) {
            scoreDesc.style.color = themeValues.textColor;
        }
        
        // Analysis section
        const analysisSection = document.querySelector('.analysis-section');
        if (analysisSection) {
            analysisSection.style.backgroundColor = themeValues.cardBg;
            analysisSection.style.boxShadow = themeValues.cardBoxShadow;
            analysisSection.style.color = themeValues.textColor;
        }

        // Section headings
        document.querySelectorAll('.analysis-section h2').forEach(heading => {
            heading.style.color = themeValues.textColor;
        });

        // Metric items
        document.querySelectorAll('.metric-item').forEach(item => {
            item.style.backgroundColor = themeValues.metricItemBg;
        });

        // Analysis paragraphs
        document.querySelectorAll('#analysisDetails p').forEach(p => {
            p.style.color = themeValues.textColor;
        });

        // Source info
        const sourceInfo = document.querySelector('.source-info');
        if (sourceInfo) {
            sourceInfo.style.backgroundColor = themeValues.sourceInfoBg;
            sourceInfo.style.borderLeftColor = themeValues.sourceInfoBorder;
        }

        const sourceInfoTitle = document.querySelector('.source-info h3');
        if (sourceInfoTitle) {
            sourceInfoTitle.style.color = themeValues.textColor;
        }

        // Similar articles
        document.querySelectorAll('.similar-article').forEach(article => {
            article.style.backgroundColor = themeValues.similarArticleBg;
            article.style.borderLeftColor = themeValues.primaryColor;
        });

        document.querySelectorAll('.similar-article h3').forEach(title => {
            title.style.color = themeValues.textColor;
        });

        document.querySelectorAll('.similar-article a').forEach(link => {
            link.style.color = themeValues.linkColor;
        });

        // Similarity badges
        document.querySelectorAll('.similarity-badge').forEach(badge => {
            badge.style.backgroundColor = themeValues.primaryColor;
        });
        
        // Action buttons
        const moreDetailsBtn = document.getElementById('moreDetailsBtn');
        if (moreDetailsBtn) {
            moreDetailsBtn.style.backgroundColor = themeValues.primaryColor;
            moreDetailsBtn.style.color = '#FFFFFF'; // White text for contrast
        }
        
        const reportMistakeBtn = document.getElementById('reportMistakeBtn');
        if (reportMistakeBtn) {
            reportMistakeBtn.style.backgroundColor = themeValues.reportBtnBg;
            reportMistakeBtn.style.color = themeValues.reportBtnColor;
        }
        
        // Add dynamic styles for scrollbar and hover effects
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
            
            /* Similar article hover */
            .similar-article:hover {
                background-color: ${themeValues.similarArticleHoverBg} !important;
                transform: translateX(3px);
                box-shadow: ${theme === 'dark' 
                    ? '0 3px 10px rgba(0,0,0,0.3)' 
                    : '0 3px 10px rgba(0,0,0,0.1)'};
            }
            
            /* Button hover effects */
            .primary-button:hover {
                background-color: ${themeValues.secondaryColor} !important;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px ${theme === 'dark' 
                    ? 'rgba(78, 202, 137, 0.3)' 
                    : 'rgba(60, 179, 113, 0.3)'};
            }
            
            .warning-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(241, 196, 15, 0.3);
            }
            
            /* Link hover */
            a:hover {
                color: ${theme === 'dark' ? '#90ceff' : '#1a5e3b'};
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