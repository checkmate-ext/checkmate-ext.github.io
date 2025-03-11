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
            cardBoxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            premiumGradient: 'linear-gradient(145deg, #f9f1c5 0%, #ffcc00 15%)',
            premiumBoxShadow: '0 4px 12px rgba(255, 204, 0, 0.25)',
            premiumBorder: '1px solid rgba(255, 204, 0, 0.5)',
            premiumTextColor: '#7B6225',
            enterpriseGradient: 'linear-gradient(145deg, #e6f0ff 0%, #1a73e8 15%)',
            enterpriseBoxShadow: '0 4px 12px rgba(26, 115, 232, 0.25)',
            enterpriseBorder: '1px solid rgba(26, 115, 232, 0.5)',
            enterpriseTextColor: '#0d47a1',
            freePriceBg: 'rgba(60, 179, 113, 0.1)',
            freePriceColor: '#2e8b57',
            freePriceBorder: '1px dashed #3cb371',
            premiumPriceBg: 'rgba(255, 204, 0, 0.2)',
            premiumPriceColor: '#7B6225',
            premiumPriceBorder: '1px dashed #ffcc00',
            enterprisePriceBg: 'rgba(26, 115, 232, 0.2)',
            enterprisePriceColor: '#0d47a1',
            enterprisePriceBorder: '1px dashed #1a73e8',
            buttonShadow: '0 4px 6px rgba(0,0,0,0.2)',
            buttonHoverShadow: '0 6px 12px rgba(0,0,0,0.25)',
            cancelBtnBg: '#f2f2f2',
            cancelBtnColor: '#666',
            cancelBtnBorder: '1px solid #ddd',
            headerIconOpacity: '0.7',
            scrollbarThumb: '#ccc',
            scrollbarTrack: '#f9f9f9',
            planBadgeBg: '#3cb371',
            planBadgeShadow: '0 2px 4px rgba(0,0,0,0.2)',
            borderColor: 'rgba(0,0,0,0.1)'
        },
        dark: {
            bgColor: '#1a1a1a',
            containerBg: '#1E1E1E',
            textColor: '#e0e0e0',
            secondaryTextColor: '#b0b0b0',
            primaryColor: '#4eca89',
            secondaryColor: '#3da06b',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            cardBg: '#2d2d2d',
            cardBorder: '#444444',
            cardBoxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            premiumGradient: 'linear-gradient(145deg, rgba(249, 241, 197, 0.9) 0%, rgba(255, 204, 0, 0.85) 15%)',
            premiumBoxShadow: '0 4px 12px rgba(255, 204, 0, 0.3)',
            premiumBorder: '1px solid rgba(255, 204, 0, 0.6)',
            premiumTextColor: '#7B6225',
            enterpriseGradient: 'linear-gradient(145deg, rgba(230, 240, 255, 0.9) 0%, rgba(26, 115, 232, 0.85) 15%)',
            enterpriseBoxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)',
            enterpriseBorder: '1px solid rgba(26, 115, 232, 0.6)',
            enterpriseTextColor: '#e0e0e0',
            freePriceBg: 'rgba(78, 202, 137, 0.2)',
            freePriceColor: '#4eca89',
            freePriceBorder: '1px dashed #4eca89',
            premiumPriceBg: 'rgba(255, 204, 0, 0.25)',
            premiumPriceColor: '#e5be00',
            premiumPriceBorder: '1px dashed #e5be00',
            enterprisePriceBg: 'rgba(26, 115, 232, 0.25)',
            enterprisePriceColor: '#5a9cfa',
            enterprisePriceBorder: '1px dashed #5a9cfa',
            buttonShadow: '0 4px 6px rgba(0,0,0,0.4)',
            buttonHoverShadow: '0 6px 12px rgba(0,0,0,0.5)',
            cancelBtnBg: '#333333',
            cancelBtnColor: '#b0b0b0',
            cancelBtnBorder: '1px solid #444444',
            headerIconOpacity: '0.85',
            scrollbarThumb: '#666',
            scrollbarTrack: '#222',
            planBadgeBg: '#4eca89',
            planBadgeShadow: '0 2px 4px rgba(0,0,0,0.4)',
            borderColor: 'rgba(255,255,255,0.1)'
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
        document.documentElement.style.setProperty('--premium-color', theme === 'dark' ? '#e5be00' : '#ffcc00');
        document.documentElement.style.setProperty('--enterprise-color', theme === 'dark' ? '#5a9cfa' : '#1a73e8');
        
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
        document.querySelectorAll('.header-icon').forEach(img => {
            img.style.opacity = themeValues.headerIconOpacity;
            img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        });
        
        // Plan message
        const planMessage = document.getElementById('planMessage');
        if (planMessage) {
            planMessage.style.color = themeValues.textColor;
        }
        
        // Plans container
        const plansContainer = document.querySelector('.plans-container');
        if (plansContainer) {
            plansContainer.style.scrollbarColor = `${themeValues.scrollbarThumb} ${themeValues.scrollbarTrack}`;
        }
        
        // Plan cards
        document.querySelectorAll('.plan-card').forEach(card => {
            // Check if it's a special card (premium or enterprise) by looking at background
            const cardStyle = window.getComputedStyle(card);
            const background = cardStyle.background || cardStyle.backgroundColor;
            
            // If not already styled by the pricing.js script (preserve custom styling)
            if (!background.includes('linear-gradient')) {
                card.style.backgroundColor = themeValues.cardBg;
                card.style.borderColor = themeValues.cardBorder;
                card.style.boxShadow = themeValues.cardBoxShadow;
            }
            
            // Style plan name and price regardless - FIXED VERSION
            const planName = card.querySelector('.plan-name');
            if (planName) {
                // Force override the inline style with !important
                planName.style.setProperty('color', themeValues.textColor, 'important');
            }
        });
        
        // Features text - Override text colors for better visibility
        document.querySelectorAll('.plan-features li span').forEach(span => {
            if (theme === 'dark') {
                // Make all feature text visible in dark mode
                span.style.color = themeValues.textColor;
            }
        });
        
        // Price tags
        document.querySelectorAll('.plan-price').forEach(price => {
            if (price.classList.contains('free-price')) {
                price.style.backgroundColor = themeValues.freePriceBg;
                price.style.color = themeValues.freePriceColor;
                price.style.borderColor = themeValues.freePriceBorder;
            } else if (price.classList.contains('premium-price')) {
                price.style.backgroundColor = themeValues.premiumPriceBg;
                price.style.color = themeValues.premiumPriceColor;
                price.style.borderColor = themeValues.premiumPriceBorder;
            } else if (price.classList.contains('enterprise-price')) {
                price.style.backgroundColor = themeValues.enterprisePriceBg;
                price.style.color = themeValues.enterprisePriceColor;
                price.style.borderColor = themeValues.enterprisePriceBorder;
            }
        });
        
        // Plan badges
        document.querySelectorAll('.plan-badge').forEach(badge => {
            badge.style.backgroundColor = themeValues.planBadgeBg;
            badge.style.boxShadow = themeValues.planBadgeShadow;
        });
        
        // Buttons
        document.querySelectorAll('.card-btn').forEach(btn => {
            // Don't override specific button colors, just enhance their appearance
            if (btn.classList.contains('cancel-btn')) {
                btn.style.backgroundColor = themeValues.cancelBtnBg;
                btn.style.color = themeValues.cancelBtnColor;
                btn.style.borderColor = themeValues.cancelBtnBorder;
            }
            // Add appropriate shadow to all buttons
            btn.style.boxShadow = themeValues.buttonShadow;
        });
        
        // Bottom icons
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
            .plans-container::-webkit-scrollbar {
                width: 6px;
            }
            
            .plans-container::-webkit-scrollbar-thumb {
                background: ${themeValues.scrollbarThumb};
                border-radius: 3px;
            }
            
            .plans-container::-webkit-scrollbar-thumb:hover {
                background: ${theme === 'dark' ? '#888' : '#bbb'};
            }
            
            .plans-container::-webkit-scrollbar-track {
                background: ${themeValues.scrollbarTrack};
            }
            
            /* Plan card hover */
            .plan-card:hover {
                transform: translateY(-3px) !important;
                box-shadow: ${theme === 'dark' 
                    ? '0 8px 20px rgba(0,0,0,0.4) !important' 
                    : '0 8px 20px rgba(0,0,0,0.15) !important'};
            }
            
            /* Button hover effects */
            .card-btn:hover {
                transform: translateY(-3px) !important;
                box-shadow: ${themeValues.buttonHoverShadow} !important;
            }
            
            /* Loading spinner */
            .loading-spinner {
                border-color: ${theme === 'dark' 
                    ? 'rgba(255,255,255,0.2)' 
                    : 'rgba(255,255,255,0.3)'};
                border-top-color: white;
            }
            
            /* Override text shadow for better readability */
            .premium-card-text, .enterprise-card-text {
                text-shadow: ${theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'};
            }
            
            /* Notification styling */
            .plan-notification {
                background: ${themeValues.primaryColor} !important;
                color: white !important;
                box-shadow: ${theme === 'dark' 
                    ? '0 4px 12px rgba(0,0,0,0.4) !important' 
                    : '0 4px 12px rgba(0,0,0,0.2) !important'};
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

    // Observe DOM for dynamically added plan cards
    const plansContainer = document.getElementById('planCardsContainer');
    if (plansContainer) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Re-apply theme when new elements are added
                    applyTheme(currentTheme);
                }
            });
        });
        
        observer.observe(plansContainer, { childList: true, subtree: true });
    }
});