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
            scrollbarTrack: '#f9f9f9',
            credibilityBannerBg: {
                green: 'rgba(46, 204, 113, 0.1)',
                neutral: 'rgba(241, 196, 15, 0.1)',
                red: 'rgba(231, 76, 60, 0.1)'
            }
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
            scrollbarTrack: '#222',
            credibilityBannerBg: {
                green: 'rgba(46, 204, 113, 0.15)',
                neutral: 'rgba(241, 196, 15, 0.15)',
                red: 'rgba(231, 76, 60, 0.15)'
            }
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

        // Apply theme colors to the theme-colored elements
        const themeColoredElements = document.querySelectorAll('.theme-colored');
        themeColoredElements.forEach(element => {
            element.style.backgroundColor = themeValues.primaryColor;
            element.style.color = '#FFFFFF'; // Always keep text white for contrast
            element.style.boxShadow = themeValues.scoreBoxShadow;
        });
        
        // Handle scores container
        const scoresContainer = document.querySelector('.scores-container');
        if (scoresContainer) {
            scoresContainer.style.backgroundColor = themeValues.containerBg;
            scoresContainer.style.boxShadow = themeValues.scoreBoxShadow;
        }
        
        // Handle credibility banner - preserve color class but update background
        const credibilityBanner = document.getElementById('credibilityResult');
        if (credibilityBanner) {
            if (credibilityBanner.classList.contains('green')) {
                credibilityBanner.style.backgroundColor = themeValues.credibilityBannerBg.green;
            } else if (credibilityBanner.classList.contains('neutral')) {
                credibilityBanner.style.backgroundColor = themeValues.credibilityBannerBg.neutral;
            } else if (credibilityBanner.classList.contains('red')) {
                credibilityBanner.style.backgroundColor = themeValues.credibilityBannerBg.red;
            }
        }
        
        // Main reliability container
        const reliabilityContainer = document.querySelector('.main-reliability-container');
        if (reliabilityContainer) {
            reliabilityContainer.style.color = themeValues.textColor;
        }
        
        // Reliability description
        const reliabilityDesc = document.querySelector('.reliability-desc');
        if (reliabilityDesc) {
            reliabilityDesc.style.color = themeValues.secondaryTextColor;
        }
        
        // Secondary scores row
        const secondaryScoresRow = document.querySelector('.secondary-scores-row');
        if (secondaryScoresRow) {
            secondaryScoresRow.style.color = themeValues.textColor;
        }
        
        // Handle all secondary score boxes
        const secondaryScores = document.querySelectorAll('.secondary-score');
        secondaryScores.forEach(score => {
            score.style.color = themeValues.textColor;
        });
        
        // Score boxes - handle each one we expect to be present
        const reliabilityScore = document.getElementById('reliabilityScore');
        if (reliabilityScore) {
            reliabilityScore.style.boxShadow = themeValues.scoreBoxShadow;
            reliabilityScore.style.color = '#FFFFFF'; // Ensure white text
        }
        
        const objectivityScore = document.getElementById('objectivityScore');
        if (objectivityScore) {
            objectivityScore.style.boxShadow = themeValues.scoreBoxShadow;
            objectivityScore.style.color = '#FFFFFF'; // Ensure white text
        }
        
        const biasScore = document.getElementById('biasScore');
        if (biasScore) {
            biasScore.style.boxShadow = themeValues.scoreBoxShadow;
            biasScore.style.color = '#FFFFFF'; // Ensure white text
        }
        
        const titleObjectivityScore = document.getElementById('titleObjectivityScore');
        if (titleObjectivityScore) {
            titleObjectivityScore.style.boxShadow = themeValues.scoreBoxShadow;
            titleObjectivityScore.style.color = '#FFFFFF'; // Ensure white text
        }
        
        const grammarScoreBox = document.getElementById('grammarScoreBox');
        if (grammarScoreBox) {
            grammarScoreBox.style.boxShadow = themeValues.scoreBoxShadow;
            grammarScoreBox.style.color = '#FFFFFF'; // Ensure white text
        }
        
        // All score labels should use secondary text color
        const allScoreLabels = document.querySelectorAll('.score-label');
        allScoreLabels.forEach(label => {
            label.style.color = themeValues.secondaryTextColor;
        });
        
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
            header.style.borderBottomColor = themeValues.borderColor;
        }
        
        // Header icons
        document.querySelectorAll('.header img, .header-icon').forEach(img => {
            img.style.opacity = themeValues.headerIconOpacity;
            img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        });
        
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
        
        // Style similarity badges
        const similarityBadges = document.querySelectorAll('.similarity-badge');
        similarityBadges.forEach(badge => {
            badge.style.backgroundColor = themeValues.primaryColor;
            badge.style.color = '#FFFFFF';
        });
        
        // Style tooltips - make sure text is white
        const tooltipTexts = document.querySelectorAll('.tooltiptext');
        tooltipTexts.forEach(tooltip => {
            tooltip.style.backgroundColor = theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.7)';
            tooltip.style.color = '#FFFFFF'; // Force white text for tooltips
        });
        
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

        
        // Handle grammar modal if it exists
        const grammarModal = document.getElementById('grammarDetailsModal');
        if (grammarModal) {
            const modalContent = grammarModal.querySelector('div');
            if (modalContent) {
                modalContent.style.backgroundColor = theme === 'dark' ? themeValues.detailsBoxBg : 'white';
                modalContent.style.color = themeValues.textColor;
                modalContent.style.boxShadow = theme === 'dark' ? 
                    '0 4px 15px rgba(0,0,0,0.4)' : 
                    '0 4px 12px rgba(0,0,0,0.2)';
                    
                // Handle text colors
                const headings = modalContent.querySelectorAll('h3, strong');
                headings.forEach(heading => {
                    heading.style.color = themeValues.textColor;
                });
                
                // Handle description text
                const description = modalContent.querySelector('div:last-of-type');
                if (description) {
                    description.style.color = themeValues.secondaryTextColor;
                }
                
                // Handle close button
                const closeBtn = document.getElementById('closeGrammarModal');
                if (closeBtn) {
                    closeBtn.style.background = themeValues.primaryColor;
                }
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
            
            /* Theme-colored elements - single color that changes with theme */
            .small-score-box.theme-colored,
            .similarity-badge.theme-colored {
                background-color: ${themeValues.primaryColor} !important;
                color: #FFFFFF !important;
                text-shadow: ${theme === 'dark' ? '1px 1px 3px rgba(0,0,0,0.5)' : 'none'};
            }
            
            /* Standard score box - keeps its red/yellow/green color but with white text */
            .score-box {
                color: #FFFFFF !important;
                text-shadow: ${theme === 'dark' ? '1px 1px 3px rgba(0,0,0,0.5)' : 'none'};
            }
            
            /* Hover effects for reliability score box */
            .reliability-score-box:hover::before, 
            .score-box:hover::before {
                opacity: 1;
                transform: translate(25%, 25%) rotate(45deg);
            }
            
            /* Ensure white text on tooltips */
            .tooltiptext {
                color: #FFFFFF !important;
            }
            
            /* Proper coloring for score labels */
            .score-label {
                color: ${themeValues.secondaryTextColor} !important;
            }
            
            /* Grammar score specific styles */
            #grammarScoreBox {
                text-shadow: ${theme === 'dark' ? '1px 1px 3px rgba(0,0,0,0.5)' : 'none'};
                width: 75px !important;  /* Change from whatever it was to 75px */
                font-size: 14px !important;
            }
            
            /* Ensure proper spacing in secondary scores row */
            .secondary-scores-row {
                background-color: transparent !important;
                gap: 8px;
            }
            
            /* Ensure proper sizing of score boxes in the row */
            .secondary-score .score-box {
                width: 50px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
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