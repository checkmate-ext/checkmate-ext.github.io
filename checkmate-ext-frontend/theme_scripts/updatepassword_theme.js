document.addEventListener('DOMContentLoaded', function() {
    console.log("Update password theme script loaded");
    
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
            headerBg: '#ffffff',
            headerTitleColor: '#333333',
            iconColor: '#555555',
            inputBg: '#f9f9f9',
            inputBorder: '#e0e0e0',
            inputFocusBorder: '#3cb371',
            inputFocusShadow: 'rgba(60, 179, 113, 0.2)',
            buttonBg: '#3cb371',
            buttonHoverBg: '#2e8b57',
            buttonDisabledBg: '#cccccc',
            buttonText: '#ffffff',
            successBg: 'rgba(46, 204, 113, 0.1)',
            successBorder: 'rgba(46, 204, 113, 0.3)',
            successColor: '#27ae60',
            dangerBg: 'rgba(231, 76, 60, 0.1)',
            dangerBorder: 'rgba(231, 76, 60, 0.3)',
            dangerColor: '#c0392b',
            borderColor: 'rgba(0,0,0,0.1)',
            bottomBarBg: '#ffffff',
            scrollbarThumb: '#cccccc',
            scrollbarTrack: '#f9f9f9',
            headerIconOpacity: '0.7',
            labelColor: '#333333'
        },
        dark: {
            bgColor: '#1a1a1a',
            containerBg: '#1E1E1E',
            textColor: '#e0e0e0',
            secondaryTextColor: '#b0b0b0',
            primaryColor: '#4eca89',
            secondaryColor: '#3da06b',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            headerBg: '#1E1E1E',
            headerTitleColor: '#e0e0e0',
            iconColor: '#b0b0b0',
            inputBg: '#2d2d2d',
            inputBorder: '#444444',
            inputFocusBorder: '#4eca89',
            inputFocusShadow: 'rgba(78, 202, 137, 0.2)',
            buttonBg: '#4eca89',
            buttonHoverBg: '#3da06b',
            buttonDisabledBg: '#444444',
            buttonText: '#ffffff',
            successBg: 'rgba(46, 204, 113, 0.15)',
            successBorder: 'rgba(46, 204, 113, 0.3)',
            successColor: '#2ecc71',
            dangerBg: 'rgba(231, 76, 60, 0.15)',
            dangerBorder: 'rgba(231, 76, 60, 0.3)',
            dangerColor: '#e74c3c',
            borderColor: 'rgba(255,255,255,0.1)',
            bottomBarBg: '#1E1E1E',
            scrollbarThumb: '#555555',
            scrollbarTrack: '#2d2d2d',
            headerIconOpacity: '0.85',
            labelColor: '#e0e0e0'
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
            header.style.backgroundColor = themeValues.headerBg;
            header.style.borderBottomColor = themeValues.borderColor;
            
            // Back button
            const backBtn = header.querySelector('#backBtn');
            if (backBtn) {
                backBtn.style.color = themeValues.iconColor;
            }
            
            // Header title
            const headerTitle = header.querySelector('.header-title');
            if (headerTitle) {
                headerTitle.style.color = themeValues.headerTitleColor;
            }
        }
        
        // Logo container
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer && theme === 'dark') {
            logoContainer.style.filter = 'brightness(0.9)';
        } else if (logoContainer) {
            logoContainer.style.filter = 'none';
        }
        
        // Form labels
        document.querySelectorAll('.form-label').forEach(label => {
            label.style.color = themeValues.labelColor;
        });
        
        // Form styling
        document.querySelectorAll('.input-field').forEach(input => {
            input.style.backgroundColor = themeValues.inputBg;
            input.style.borderColor = themeValues.inputBorder;
            input.style.color = themeValues.textColor;
        });
        
        // Toggle password buttons
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.style.color = themeValues.iconColor;
        });
        
        // Update button
        const updateBtn = document.getElementById('updateBtn');
        if (updateBtn) {
            if (!updateBtn.disabled) {
                updateBtn.style.backgroundColor = themeValues.buttonBg;
                updateBtn.style.color = themeValues.buttonText;
            } else {
                updateBtn.style.backgroundColor = themeValues.buttonDisabledBg;
                updateBtn.style.color = theme === 'dark' ? '#aaaaaa' : '#ffffff';
            }
        }
        
        // Notifications
        document.querySelectorAll('.notification').forEach(notification => {
            if (notification.classList.contains('is-success')) {
                notification.style.backgroundColor = themeValues.successBg;
                notification.style.borderColor = themeValues.successBorder;
                notification.style.color = themeValues.successColor;
            } else if (notification.classList.contains('is-danger')) {
                notification.style.backgroundColor = themeValues.dangerBg;
                notification.style.borderColor = themeValues.dangerBorder;
                notification.style.color = themeValues.dangerColor;
            }
            
            // Delete button
            const deleteBtn = notification.querySelector('.delete');
            if (deleteBtn) {
                deleteBtn.style.color = notification.style.color;
            }
        });
        
        // Bottom bar
        const bottomBar = document.querySelector('.bottom-bar');
        if (bottomBar) {
            bottomBar.style.backgroundColor = themeValues.bottomBarBg;
            bottomBar.style.borderTopColor = themeValues.borderColor;
            
            // Apply invert filter to all icons in dark mode
            bottomBar.querySelectorAll('img').forEach(img => {
                img.style.opacity = themeValues.headerIconOpacity;
                img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
            });
        }
        
        // Add dynamic styles
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
            
            /* Input focus state */
            .input-field:focus {
                border-color: ${themeValues.inputFocusBorder} !important;
                box-shadow: 0 0 0 2px ${themeValues.inputFocusShadow} !important;
                outline: none !important;
            }
            
            /* Toggle password hover */
            .toggle-password:hover {
                color: ${themeValues.primaryColor} !important;
            }
            
            /* Button hover state */
            #updateBtn:not(:disabled):hover {
                background-color: ${themeValues.buttonHoverBg} !important;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px ${theme === 'dark' ? 'rgba(78, 202, 137, 0.3)' : 'rgba(60, 179, 113, 0.3)'};
            }
            
            /* Bottom bar icon hover */
            .bottom-bar img:hover {
                opacity: 1;
            }
            
            /* Placeholder styling */
            ::placeholder { 
                color: ${theme === 'dark' ? '#999999' : '#aaaaaa'};
                opacity: 1;
            }
            
            :-ms-input-placeholder {
                color: ${theme === 'dark' ? '#999999' : '#aaaaaa'};
            }
            
            ::-ms-input-placeholder {
                color: ${theme === 'dark' ? '#999999' : '#aaaaaa'};
            }
            
            /* Loading spinner */
            .loading-spinner {
                border-color: ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)'};
                border-top-color: white;
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
    
    // Observe DOM for dynamically added notifications
    const notificationContainer = document.getElementById('notificationContainer');
    if (notificationContainer) {
        const observer = new MutationObserver(() => {
            applyTheme(currentTheme);
        });
        
        observer.observe(notificationContainer, { childList: true });
    }
    
    // Update button state observer
    const updateBtn = document.getElementById('updateBtn');
    if (updateBtn) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === "attributes" && mutation.attributeName === "disabled") {
                    applyTheme(currentTheme);
                }
            });
        });
        
        observer.observe(updateBtn, { attributes: true });
    }
});