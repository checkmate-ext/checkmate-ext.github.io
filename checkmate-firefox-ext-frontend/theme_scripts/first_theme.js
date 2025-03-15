document.addEventListener('DOMContentLoaded', function() {
    console.log("First page theme script loaded");
    
    // Theme settings
    const themes = {
        light: {
            bgColor: '#f4f4f4',
            containerBg: '#ffffff',
            textColor: '#333333',
            secondaryTextColor: '#666666',
            placeholderColor: '#909090',
            primaryColor: '#3cb371',
            secondaryColor: '#2e8b57',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            buttonBg: '#3cb371',
            buttonHoverBg: '#2e8b57',
            buttonText: '#ffffff',
            dividerColor: '#e0e0e0',
            dividerTextColor: '#718096',
            socialButtonBg: '#ffffff',
            socialButtonBorder: '#e0e0e0',
            socialButtonText: '#333333',
            inputBg: '#ffffff',
            inputBorder: '#e0e0e0',
            scrollbarThumb: '#ccc',
            scrollbarTrack: '#f9f9f9'
        },
        dark: {
            bgColor: '#1a1a1a',
            containerBg: '#1E1E1E',
            textColor: '#e0e0e0',
            secondaryTextColor: '#b0b0b0',
            placeholderColor: '#999999',
            primaryColor: '#4eca89',
            secondaryColor: '#3da06b',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            buttonBg: '#4eca89',
            buttonHoverBg: '#3da06b',
            buttonText: '#ffffff',
            dividerColor: '#444444',
            dividerTextColor: '#b0b0b0',
            socialButtonBg: '#2d2d2d',
            socialButtonBorder: '#444444',
            socialButtonText: '#e0e0e0',
            inputBg: '#333333',
            inputBorder: '#444444',
            scrollbarThumb: '#666',
            scrollbarTrack: '#222'
        }
    };

    // Check for system preference
    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Initialize theme tracking variables
    let currentTheme = getSystemTheme();
    let usingSystemTheme = true; // Track if we're using system preference or manual override
    console.log("Current theme detected:", currentTheme);

    // Apply theme immediately
    applyTheme(currentTheme);
    
    // Create and add theme toggle button
    addThemeToggle();

    // Function to create and add theme toggle button
    function addThemeToggle() {
        // Make sure we have Font Awesome
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://use.fontawesome.com/releases/v5.15.4/css/all.css';
            document.head.appendChild(fontAwesome);
        }
        
        // Create theme toggle button
        const themeToggle = document.createElement('button');
        themeToggle.id = 'theme-toggle';
        themeToggle.innerHTML = currentTheme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
        themeToggle.title = currentTheme === 'dark' 
            ? 'Switch to light mode' 
            : 'Switch to dark mode';
        
        // Style the button
        themeToggle.style.position = 'absolute';
        themeToggle.style.top = '10px';
        themeToggle.style.right = '10px';
        themeToggle.style.background = 'transparent';
        themeToggle.style.border = 'none';
        themeToggle.style.color = currentTheme === 'dark' ? '#e0e0e0' : '#333333';
        themeToggle.style.fontSize = '20px';
        themeToggle.style.cursor = 'pointer';
        themeToggle.style.zIndex = '1000';
        themeToggle.style.padding = '8px';
        themeToggle.style.borderRadius = '50%';
        themeToggle.style.display = 'flex';
        themeToggle.style.justifyContent = 'center';
        themeToggle.style.alignItems = 'center';
        themeToggle.style.width = '40px';
        themeToggle.style.height = '40px';
        themeToggle.style.transition = 'background-color 0.3s ease';
        
        // Add hover effect
        themeToggle.addEventListener('mouseover', () => {
            themeToggle.style.backgroundColor = currentTheme === 'dark' 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.1)';
        });
        
        themeToggle.addEventListener('mouseout', () => {
            themeToggle.style.backgroundColor = 'transparent';
        });
        
        // Add click handler to toggle theme
        themeToggle.addEventListener('click', () => {
            usingSystemTheme = false; // User manually selected a theme
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            currentTheme = newTheme;
            
            // Update button appearance
            themeToggle.innerHTML = newTheme === 'dark' 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
            themeToggle.title = newTheme === 'dark' 
                ? 'Switch to light mode' 
                : 'Switch to dark mode';
            themeToggle.style.color = newTheme === 'dark' ? '#e0e0e0' : '#333333';
            
            // Apply the new theme
            applyTheme(newTheme);
        });
        
        // Add to document
        document.body.appendChild(themeToggle);
    }

    // Apply theme function
    function applyTheme(theme) {
        console.log("Applying theme:", theme);
        const themeValues = themes[theme];
        
        // Apply CSS variables
        document.documentElement.style.setProperty('--bg-light', themeValues.bgColor);
        document.documentElement.style.setProperty('--text-dark', themeValues.textColor);
        document.documentElement.style.setProperty('--primary-color', themeValues.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', themeValues.secondaryColor);
        
        // Apply basic styles
        document.body.style.backgroundColor = themeValues.bgColor;
        document.body.style.color = themeValues.textColor;
        
        // Main container - try different selectors that might exist
        document.querySelectorAll('.container, .main-container, main, .content').forEach(container => {
            container.style.backgroundColor = themeValues.containerBg;
            container.style.boxShadow = themeValues.boxShadow;
            container.style.color = themeValues.textColor;
        });
        
        // Card or inner container
        document.querySelectorAll('.card, .inner-container, .box, .content-container').forEach(card => {
            card.style.backgroundColor = themeValues.containerBg;
            card.style.color = themeValues.textColor;
        });
        
        // All heading elements
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .subtitle, .heading').forEach(heading => {
            heading.style.color = themeValues.textColor;
        });
        
        // Standard buttons (non-social)
        document.querySelectorAll('button:not(.social-button):not(#theme-toggle), .button:not(.social-button), .btn:not(.social-button)').forEach(button => {
            if (!button.className || !button.className.includes('social')) {
                button.style.backgroundColor = themeValues.buttonBg;
                button.style.color = themeValues.buttonText;
                button.style.borderColor = themeValues.buttonBg;
            }
        });
        
        // Dividers
        document.querySelectorAll('.divider, hr, .separator, .or-divider').forEach(divider => {
            if (divider.tagName === 'HR') {
                divider.style.borderColor = themeValues.dividerColor;
            }
            
            // For dividers with text
            const spans = divider.querySelectorAll('span');
            spans.forEach(span => {
                span.style.color = themeValues.dividerTextColor;
                span.style.backgroundColor = themeValues.containerBg;
            });
        });
        
        // Social buttons
        document.querySelectorAll('.social-button, button[class*="social"], .button[class*="social"], [class*="google"], [class*="facebook"], [class*="social"]').forEach(button => {
            button.style.backgroundColor = themeValues.socialButtonBg;
            button.style.borderColor = themeValues.socialButtonBorder;
            button.style.color = themeValues.socialButtonText;
        });
        
        // Inputs
        document.querySelectorAll('input, .input, textarea').forEach(input => {
            input.style.backgroundColor = themeValues.inputBg;
            input.style.borderColor = themeValues.inputBorder;
            input.style.color = themeValues.textColor;
            
            // Set placeholder color directly on elements
            input.dataset.placeholderColor = themeValues.placeholderColor;
            
            // Try to set placeholder color directly (may not work in all browsers)
            if ('placeholder' in input) {
                try {
                    input.style.setProperty('--placeholder-color', themeValues.placeholderColor);
                } catch(e) {
                    console.log("Could not set placeholder color directly");
                }
            }
        });
        
        // Paragraphs and text
        document.querySelectorAll('p, span, .text, .description, .info').forEach(text => {
            if (!text.closest('.divider')) { // Avoid changing divider text that was already styled
                text.style.color = themeValues.textColor;
            }
        });
        
        // Footer, secondary text
        document.querySelectorAll('footer, .footer, .footer-section, .secondary-text, .disclaimer, .terms').forEach(element => {
            element.style.color = themeValues.secondaryTextColor;
        });
        
        // Update theme toggle button if it exists
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
            themeToggle.title = theme === 'dark' 
                ? 'Switch to light mode' 
                : 'Switch to dark mode';
            themeToggle.style.color = theme === 'dark' ? '#e0e0e0' : '#333333';
        }
        
        // Add dynamic styles
        updateDynamicStyles(theme, themeValues);
        
        console.log("Theme applied successfully");
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
            button:not(.social-button):not(#theme-toggle):hover,
            .button:not(.social-button):hover,
            .btn:not(.social-button):hover {
                background-color: ${themeValues.buttonHoverBg} !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 5px 15px ${theme === 'dark' 
                    ? 'rgba(78, 202, 137, 0.3)' 
                    : 'rgba(60, 179, 113, 0.3)'} !important;
            }
            
            /* Social button hover effects */
            .social-button:hover,
            button[class*="social"]:hover,
            .button[class*="social"]:hover,
            [class*="google"]:hover,
            [class*="facebook"]:hover,
            [class*="social"]:hover {
                border-color: ${themeValues.primaryColor} !important;
                box-shadow: 0 5px 15px ${theme === 'dark' 
                    ? 'rgba(0, 0, 0, 0.3)' 
                    : 'rgba(0, 0, 0, 0.1)'} !important;
            }
            
            /* Theme toggle hover effect */
            #theme-toggle:hover {
                background-color: ${theme === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.1)'} !important;
            }
            
            /* Divider lines */
            .divider:before, .divider:after, 
            .separator:before, .separator:after,
            .or-divider:before, .or-divider:after {
                background-color: ${themeValues.dividerColor} !important;
            }
            
            /* Input focus states */
            input:focus, .input:focus, textarea:focus {
                border-color: ${themeValues.primaryColor} !important;
                box-shadow: 0 0 0 2px ${theme === 'dark' 
                    ? 'rgba(78, 202, 137, 0.2)' 
                    : 'rgba(60, 179, 113, 0.2)'} !important;
                outline: none;
            }
            
            /* Placeholder styling for various browsers */
            ::placeholder,
            ::-webkit-input-placeholder,
            ::-moz-placeholder,
            :-ms-input-placeholder,
            :-moz-placeholder {
                color: ${themeValues.placeholderColor} !important;
                opacity: 1 !important;
            }
            
            /* Dark mode body text */
            body, p, div {
                color: ${themeValues.textColor};
            }
        `;
    }
    
    // Create a more reliable system theme listener
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Use the recommended approach for modern browsers
    try {
        // Chrome & Firefox
        darkModeMediaQuery.addEventListener('change', (e) => {
            // Only update if we're following system preference
            if (usingSystemTheme) {
                const newTheme = e.matches ? 'dark' : 'light';
                console.log("System theme changed to:", newTheme);
                currentTheme = newTheme;
                applyTheme(newTheme);
            }
        });
    } catch (e) {
        try {
            // Safari & older browsers
            darkModeMediaQuery.addListener((e) => {
                // Only update if we're following system preference
                if (usingSystemTheme) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    console.log("System theme changed to (fallback):", newTheme);
                    currentTheme = newTheme;
                    applyTheme(newTheme);
                }
            });
        } catch (e2) {
            console.error("Could not add theme change listener", e2);
        }
    }
    
    // Check the theme every 2 seconds as a failsafe
    setInterval(() => {
        // Only update if we're following system preference
        if (usingSystemTheme) {
            const systemTheme = getSystemTheme();
            if (systemTheme !== currentTheme) {
                console.log("Theme change detected by interval check:", systemTheme);
                currentTheme = systemTheme;
                applyTheme(currentTheme);
            }
        }
    }, 2000);
});