document.addEventListener('DOMContentLoaded', function() {
    console.log("Signup page theme script loaded");
    
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
            inputBg: '#ffffff',
            inputBorder: '#e0e0e0',
            inputFocus: '#3cb371',
            inputShadow: 'rgba(60, 179, 113, 0.2)',
            buttonBg: '#3cb371',
            buttonHover: '#2e8b57',
            buttonText: '#ffffff',
            dividerColor: '#e0e0e0',
            dividerTextColor: '#718096',
            socialButtonBg: '#ffffff',
            socialButtonBorder: '#e0e0e0',
            socialButtonText: '#333333',
            scrollbarThumb: '#ccc',
            scrollbarTrack: '#f9f9f9',
            errorColor: '#cc0000'
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
            inputBg: '#333333',
            inputBorder: '#444444',
            inputFocus: '#4eca89',
            inputShadow: 'rgba(78, 202, 137, 0.2)',
            buttonBg: '#4eca89',
            buttonHover: '#3da06b',
            buttonText: '#ffffff',
            dividerColor: '#444444',
            dividerTextColor: '#b0b0b0',
            socialButtonBg: '#2d2d2d',
            socialButtonBorder: '#444444',
            socialButtonText: '#e0e0e0',
            scrollbarThumb: '#666',
            scrollbarTrack: '#222',
            errorColor: '#ff6b6b'
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
        
        // Container styling
        const container = document.querySelector('.container');
        if (container) {
            container.style.backgroundColor = themeValues.containerBg;
            container.style.boxShadow = themeValues.boxShadow;
        }
        
        // Card styling
        const card = document.querySelector('.card');
        if (card) {
            card.style.backgroundColor = themeValues.containerBg;
            card.style.boxShadow = themeValues.boxShadow;
        }
        
        // Title styling
        const title = document.querySelector('.title');
        if (title) {
            title.style.color = themeValues.textColor;
        }
        
        // Label styling
        document.querySelectorAll('.label').forEach(label => {
            label.style.color = themeValues.textColor;
        });
        
        // Input fields
        document.querySelectorAll('.input').forEach(input => {
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
        
        // Password toggle icons
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.style.color = themeValues.secondaryTextColor;
        });
        
        // Sign Up button
        const signUpBtn = document.querySelector('button.button[type="submit"]');
        if (signUpBtn) {
            signUpBtn.style.backgroundColor = themeValues.buttonBg;
            signUpBtn.style.color = themeValues.buttonText;
        }
        
        // Divider
        const divider = document.querySelector('.divider');
        if (divider) {
            divider.style.setProperty('--divider-color', themeValues.dividerColor);
            
            const dividerSpan = divider.querySelector('span');
            if (dividerSpan) {
                dividerSpan.style.color = themeValues.dividerTextColor;
                dividerSpan.style.backgroundColor = themeValues.containerBg;
            }
        }
        
        // Social buttons
        document.querySelectorAll('.social-button').forEach(button => {
            button.style.backgroundColor = themeValues.socialButtonBg;
            button.style.borderColor = themeValues.socialButtonBorder;
            button.style.color = themeValues.socialButtonText;
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
            
            /* Input focus states */
            .input:focus {
                border-color: ${themeValues.inputFocus} !important;
                box-shadow: 0 0 0 2px ${themeValues.inputShadow} !important;
            }
            
            /* Button hover states */
            button.button[type="submit"]:not(#theme-toggle):hover {
                background-color: ${themeValues.buttonHover} !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 5px 15px ${theme === 'dark' 
                    ? 'rgba(78, 202, 137, 0.3)' 
                    : 'rgba(60, 179, 113, 0.3)'} !important;
            }
            
            /* Social button hover */
            .social-button:hover {
                border-color: ${themeValues.primaryColor} !important;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px ${theme === 'dark' 
                    ? 'rgba(0,0,0,0.3)' 
                    : 'rgba(0,0,0,0.1)'};
            }
            
            /* Theme toggle hover effect */
            #theme-toggle:hover {
                background-color: ${theme === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.1)'} !important;
            }
            
            /* Password field with toggle */
            .password-field .input {
                background-color: ${themeValues.inputBg};
                color: ${themeValues.textColor};
                border-color: ${themeValues.inputBorder};
            }
            
            /* Error styling */
            .help.is-danger {
                color: ${themeValues.errorColor} !important;
            }
            
            .input.is-danger {
                border-color: ${themeValues.errorColor} !important;
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