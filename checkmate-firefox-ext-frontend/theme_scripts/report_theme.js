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
            formBg: '#ffffff',
            formBorder: 'rgba(0,0,0,0.05)',
            formBoxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            inputBg: '#f9f9f9',
            inputBorder: '#e0e0e0',
            labelColor: '#333333',
            radioBg: '#f9f9f9',
            radioBorderColor: '#eee',
            radioActiveBg: 'rgba(60, 179, 113, 0.1)',
            radioActiveBorder: '#3cb371',
            radioActiveBoxShadow: '0 2px 8px rgba(60, 179, 113, 0.2)',
            successBg: 'rgba(46, 204, 113, 0.1)',
            successBorder: 'rgba(46, 204, 113, 0.3)',
            successColor: '#27ae60',
            dangerBg: 'rgba(231, 76, 60, 0.1)',
            dangerBorder: 'rgba(231, 76, 60, 0.3)',
            dangerColor: '#c0392b',
            borderColor: 'rgba(0,0,0,0.1)',
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
            formBg: '#2d2d2d',
            formBorder: 'rgba(255,255,255,0.1)',
            formBoxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            inputBg: '#333333',
            inputBorder: '#444444',
            labelColor: '#e0e0e0',
            radioBg: '#333333',
            radioBorderColor: '#444444',
            radioActiveBg: 'rgba(78, 202, 137, 0.15)',
            radioActiveBorder: '#4eca89',
            radioActiveBoxShadow: '0 2px 8px rgba(78, 202, 137, 0.25)',
            successBg: 'rgba(46, 204, 113, 0.15)',
            successBorder: 'rgba(46, 204, 113, 0.3)',
            successColor: '#2ecc71',
            dangerBg: 'rgba(231, 76, 60, 0.15)',
            dangerBorder: 'rgba(231, 76, 60, 0.3)',
            dangerColor: '#e74c3c',
            borderColor: 'rgba(255,255,255,0.1)',
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
        document.documentElement.style.setProperty('--warning-color', '#f1c40f');
        document.documentElement.style.setProperty('--error-color', theme === 'dark' ? '#e74c3c' : '#c0392b');
        document.documentElement.style.setProperty('--success-color', theme === 'dark' ? '#2ecc71' : '#27ae60');
        
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
        
        
        // Page title
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.style.color = themeValues.textColor;
        }
        
        // Form container
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.style.scrollbarColor = `${themeValues.scrollbarThumb} ${themeValues.scrollbarTrack}`;
        }
        
        // Form styling
        const form = document.getElementById('reportForm');
        if (form) {
            form.style.backgroundColor = themeValues.formBg;
            form.style.borderColor = themeValues.formBorder;
            form.style.boxShadow = themeValues.formBoxShadow;
        }
        
        // Labels
        document.querySelectorAll('.label').forEach(label => {
            label.style.color = themeValues.labelColor;
        });
        
        // Radio containers
        document.querySelectorAll('.custom-radio').forEach(radio => {
            if (radio.classList.contains('active')) {
                radio.style.backgroundColor = themeValues.radioActiveBg;
                radio.style.borderColor = themeValues.radioActiveBorder;
                radio.style.boxShadow = themeValues.radioActiveBoxShadow;
            } else {
                radio.style.backgroundColor = themeValues.radioBg;
                radio.style.borderColor = themeValues.radioBorderColor;
                radio.style.boxShadow = 'none';
            }
            
            // Text inside radio buttons
            const span = radio.querySelector('span');
            if (span) {
                span.style.color = themeValues.textColor;
            }
        });
        
        // Textarea styling
        const textarea = document.querySelector('textarea.textarea');
        if (textarea) {
            textarea.style.backgroundColor = themeValues.inputBg;
            textarea.style.borderColor = themeValues.inputBorder;
            textarea.style.color = themeValues.textColor;
        }
        
        // Submit button
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.style.backgroundColor = themeValues.primaryColor;
            submitBtn.style.color = 'white';
        }
        
        // Notification styling
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
        });
        
        // Bottom icons
        const bottomIcons = document.querySelector('.bottom-icons');
        if (bottomIcons) {
            bottomIcons.style.background = themeValues.containerBg;
            bottomIcons.style.borderTopColor = themeValues.borderColor;
            
            // Apply invert filter to all bottom icons
            bottomIcons.querySelectorAll('img').forEach(img => {
                img.style.opacity = themeValues.headerIconOpacity;
                img.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
            });
            
            // Also handle any buttons with images
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
            .form-container::-webkit-scrollbar {
                width: 6px;
            }
            
            .form-container::-webkit-scrollbar-thumb {
                background: ${themeValues.scrollbarThumb};
                border-radius: 3px;
            }
            
            .form-container::-webkit-scrollbar-thumb:hover {
                background: ${theme === 'dark' ? '#888' : '#bbb'};
            }
            
            .form-container::-webkit-scrollbar-track {
                background: ${themeValues.scrollbarTrack};
            }
            
            /* Radio button hover */
            .custom-radio:hover {
                background-color: ${theme === 'dark' ? '#3a3a3a' : '#f2f2f2'};
                transform: translateY(-2px);
                box-shadow: ${theme === 'dark' 
                    ? '0 4px 12px rgba(0,0,0,0.2)' 
                    : '0 4px 8px rgba(0,0,0,0.1)'};
            }
            
            /* Active radio button */
            .custom-radio.active {
                background-color: ${themeValues.radioActiveBg} !important;
                border-color: ${themeValues.radioActiveBorder} !important;
                box-shadow: ${themeValues.radioActiveBoxShadow} !important;
            }
            
            /* Textarea focus state */
            .textarea:focus {
                border-color: ${themeValues.primaryColor};
                box-shadow: 0 0 0 2px ${theme === 'dark' 
                    ? 'rgba(78, 202, 137, 0.2)' 
                    : 'rgba(60, 179, 113, 0.2)'};
                outline: none;
            }
            
            /* Submit button hover */
            .submit-btn:hover {
                background-color: ${themeValues.secondaryColor};
                transform: translateY(-2px);
                box-shadow: 0 5px 15px ${theme === 'dark' 
                    ? 'rgba(78, 202, 137, 0.3)' 
                    : 'rgba(60, 179, 113, 0.3)'};
            }
            
            /* Loading spinner */
            .loading-spinner {
                border-color: ${theme === 'dark' 
                    ? 'rgba(255,255,255,0.2)' 
                    : 'rgba(255,255,255,0.3)'};
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
    
    // Add event listener for radio buttons to update their styling
    document.querySelectorAll('.custom-radio input').forEach(radio => {
        radio.addEventListener('change', function() {
            // Re-apply theme to update radio button styling
            applyTheme(currentTheme);
        });
    });
});