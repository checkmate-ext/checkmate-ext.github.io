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
            progressContainerBg: '#e9ecef',
            progressLabelColor: '#666',
            statTitleColor: '#333',
            statSubtitleColor: '#666',
            chartTitleColor: '#333',
            gridColor: '#e0e0e0',
            ticksColor: '#666',
            headerIconOpacity: '0.7'
        },
        dark: {
            bgColor: '#1a1a1a',
            containerBg: '#1E1E1E',
            textColor: '#e0e0e0',
            secondaryTextColor: '#b0b0b0',
            primaryColor: '#4eca89',
            secondaryColor: '#3da06b',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            cardBg: '#333333',
            progressContainerBg: '#444444',
            progressLabelColor: '#b0b0b0',
            statTitleColor: '#e0e0e0',
            statSubtitleColor: '#b0b0b0',
            chartTitleColor: '#e0e0e0',
            gridColor: '#444444',
            ticksColor: '#b0b0b0',
            headerIconOpacity: '0.85'
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
        
        // Apply specific styles
        document.body.style.backgroundColor = themeValues.bgColor;
        document.body.style.color = themeValues.textColor;
        
        // Container styling
        const container = document.querySelector('.container');
        if (container) {
            container.style.backgroundColor = themeValues.containerBg;
            container.style.boxShadow = themeValues.boxShadow;
        }
        
        // Header and welcome text
        const welcomeText = document.querySelector('.welcome-text');
        if (welcomeText) {
            welcomeText.style.color = themeValues.secondaryTextColor;
        }
        
        // Usage card
        const usageCard = document.querySelector('.usage-card');
        if (usageCard) {
            usageCard.style.background = themeValues.cardBg;
        }
        
        const cardTitle = document.querySelector('.card-title');
        if (cardTitle) {
            cardTitle.style.color = themeValues.textColor;
        }
        
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.style.background = themeValues.progressContainerBg;
        }
        
        const progressLabel = document.querySelector('.progress-label');
        if (progressLabel) {
            progressLabel.style.color = themeValues.progressLabelColor;
        }
        
        // Stat cards
        document.querySelectorAll('.stat-card').forEach(card => {
            card.style.background = themeValues.cardBg;
            card.style.boxShadow = theme === 'dark' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none';
            
            const statTitle = card.querySelector('.stat-title');
            if (statTitle) {
                statTitle.style.color = themeValues.statTitleColor;
            }
            
            const statSubtitle = card.querySelector('.stat-subtitle');
            if (statSubtitle) {
                statSubtitle.style.color = themeValues.statSubtitleColor;
            }
        });
        
        // Chart card
        const chartCard = document.querySelector('.chart-card');
        if (chartCard) {
            chartCard.style.background = themeValues.cardBg;
            
            const chartTitle = chartCard.querySelector('.card-title');
            if (chartTitle) {
                chartTitle.style.color = themeValues.chartTitleColor;
            }
        }
        
        // Update chart colors if Chart.js is available
        if (window.Chart) {
            const charts = Chart.instances;
            if (charts && charts.length > 0) {
                charts.forEach(chart => {
                    // Update grid lines
                    if (chart.options.scales && chart.options.scales.x) {
                        chart.options.scales.x.grid.color = themeValues.gridColor;
                        chart.options.scales.x.ticks.color = themeValues.ticksColor;
                    }
                    
                    if (chart.options.scales && chart.options.scales.y) {
                        chart.options.scales.y.grid.color = themeValues.gridColor;
                        chart.options.scales.y.ticks.color = themeValues.ticksColor;
                    }
                    
                    chart.update();
                });
            }
        }
        
        // Nav button
        const navButton = document.querySelector('.nav-button');
        if (navButton) {
            navButton.style.background = themeValues.primaryColor;
            navButton.style.color = 'white'; // Always white text on button for better contrast
            
            // Handle icon inside nav button (history icon)
            const navButtonIcon = navButton.querySelector('.icon');
            if (navButtonIcon) {
                navButtonIcon.style.opacity = themeValues.headerIconOpacity;
                navButtonIcon.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
            }
        }
        
        // Bottom icons
        const bottomIcons = document.querySelector('.bottom-icons');
        if (bottomIcons) {
            bottomIcons.style.background = themeValues.containerBg;
            bottomIcons.style.borderTopColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            
            // Apply inverted filter to all bottom icons
            bottomIcons.querySelectorAll('img').forEach(img => {
                img.style.opacity = themeValues.headerIconOpacity;
                img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
            });
        }
        
        // Header icons - using invert like in profile page
        document.querySelectorAll('img').forEach(img => {
            if (img.alt === 'Menu' || img.alt === 'Profile' || img.alt === 'History') {
                img.style.opacity = themeValues.headerIconOpacity;
                img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
            }
        });
        
        // Chart card icon
        const chartCardIcon = document.querySelector('.chart-card .icon');
        if (chartCardIcon) {
            chartCardIcon.style.opacity = themeValues.headerIconOpacity;
            chartCardIcon.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        }
        
        // Add any custom dynamic styles
        updateDynamicStyles(theme, themeValues);
    }
    
    function updateDynamicStyles(theme, themeValues) {
        let styleElement = document.getElementById('dashboard-dynamic-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'dashboard-dynamic-styles';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            /* Hover effects for cards in current theme */
            .stat-card:hover {
                box-shadow: ${theme === 'dark' ? 
                    '0 8px 20px rgba(0,0,0,0.3) !important' : 
                    '0 8px 20px rgba(0,0,0,0.1) !important'
                };
                transform: translateY(-2px);
            }
            
            /* Scrollbar styling */
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