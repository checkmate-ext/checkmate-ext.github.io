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
            detailsBoxBg: '#ffffff',
            detailsBoxBorder: '#eee',
            cardBg: '#f8f9fa',
            similarArticleBg: '#f9f9f9',
            similarArticleBorder: '#eee',
            linkColor: '#1a73e8',
            borderColor: 'rgba(0,0,0,0.1)',
            reportBtnBg: '#f1c40f',
            reportBtnColor: '#333333',
            scoreBoxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
            detailsBoxBg: '#333333',
            detailsBoxBorder: '#444444',
            cardBg: '#333333',
            similarArticleBg: '#2d2d2d',
            similarArticleBorder: '#444444',
            linkColor: '#4dabf7',
            borderColor: 'rgba(255,255,255,0.1)',
            reportBtnBg: '#f1c40f', 
            reportBtnColor: '#333333',
            scoreBoxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            headerIconOpacity: '0.85',
            scrollbarThumb: '#666',
            scrollbarTrack: '#222'
        }
    };

    // Check for saved theme preference or use system preference
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
        document.querySelectorAll('.header img, .header-icon').forEach(img => {
            img.style.opacity = themeValues.headerIconOpacity;
            img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        });
        
        // Logo container
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.style.background = themeValues.containerBg;
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
        
        // Score box (don't change color as it's based on the score value)
        const scoreBox = document.getElementById('reliabilityScore');
        if (scoreBox) {
            scoreBox.style.boxShadow = themeValues.scoreBoxShadow;
        }
        
        // Articles section
        const articlesSection = document.querySelector('.articles-section');
        if (articlesSection) {
            articlesSection.style.background = themeValues.detailsBoxBg;
            articlesSection.style.borderColor = themeValues.detailsBoxBorder;
        }
        
        // Articles title
        const articlesTitle = document.querySelector('.articles-title');
        if (articlesTitle) {
            articlesTitle.style.color = themeValues.textColor;
        }
        
        // Style similar articles
        const similarArticles = document.querySelectorAll('.similar-article');
        similarArticles.forEach(article => {
            article.style.backgroundColor = themeValues.similarArticleBg;
            article.style.borderLeftColor = themeValues.primaryColor;
            
            // Style headings in articles
            const headings = article.querySelectorAll('h4');
            headings.forEach(heading => {
                heading.style.color = themeValues.textColor;
            });
            
            // Style links in articles
            const links = article.querySelectorAll('a');
            links.forEach(link => {
                link.style.color = themeValues.linkColor;
            });
        });
        
        // Details section
        const detailsSection = document.querySelector('.details-section');
        if (detailsSection) {
            detailsSection.style.background = themeValues.detailsBoxBg;
            detailsSection.style.borderColor = themeValues.detailsBoxBorder;
            detailsSection.style.color = themeValues.textColor;
        }
        
        // Details title
        const detailsTitle = document.querySelector('.details-title');
        if (detailsTitle) {
            detailsTitle.style.color = themeValues.textColor;
        }
        
        // Details list items
        const detailsList = document.getElementById('detailsList');
        if (detailsList) {
            // Style all headings
            detailsList.querySelectorAll('h2, h3, h4').forEach(heading => {
                heading.style.color = themeValues.primaryColor;
            });
            
            // Style all list items
            detailsList.querySelectorAll('li').forEach(item => {
                item.style.color = themeValues.textColor;
            });
            
            // Style all links
            detailsList.querySelectorAll('a').forEach(link => {
                link.style.color = themeValues.linkColor;
            });
            
            // Style all paragraphs
            detailsList.querySelectorAll('p').forEach(p => {
                p.style.color = themeValues.textColor;
            });
            
            // Style any unordered lists
            detailsList.querySelectorAll('ul').forEach(ul => {
                ul.style.color = themeValues.textColor;
            });
        }
        
        // Credibility result
        const credibilityResult = document.getElementById('credibilityResult');
        if (credibilityResult) {
            credibilityResult.style.color = themeValues.textColor;
        }
        
        // Report mistake button
        const reportMistakeBtn = document.querySelector('.report-mistake-button');
        if (reportMistakeBtn) {
            reportMistakeBtn.style.backgroundColor = themeValues.reportBtnBg;
            reportMistakeBtn.style.color = themeValues.reportBtnColor;
            
            // Style the icon inside the button
            const reportBtnImg = reportMistakeBtn.querySelector('img');
            if (reportBtnImg) {
                reportBtnImg.style.opacity = themeValues.headerIconOpacity;
                // Don't invert this icon as it needs to be visible on yellow background
            }
        }
        
        // Add dynamic styles for scrollbars and hover effects
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
                background-color: ${theme === 'dark' ? '#3a3a3a' : '#f2f2f2'} !important;
                border-left-color: ${themeValues.primaryColor} !important;
                transform: translateX(5px) scale(1.01);
                box-shadow: ${theme === 'dark' 
                    ? '0 5px 15px rgba(0,0,0,0.3)' 
                    : '0 5px 15px rgba(0,0,0,0.1)'};
            }
            
            /* Links hover */
            #detailsList a:hover,
            .similar-article a:hover {
                color: ${theme === 'dark' ? '#6cb2ff' : '#0056b3'};
                text-decoration: underline;
            }
            
            /* Report mistake button hover */
            .report-mistake-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(241, 196, 15, 0.3);
            }
            
            /* Ensure contrast for score box text */
            .score-box {
                color: #fff !important;
                text-shadow: ${theme === 'dark' ? '1px 1px 3px rgba(0,0,0,0.5)' : 'none'};
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