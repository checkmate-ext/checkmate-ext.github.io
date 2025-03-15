document.addEventListener('DOMContentLoaded', function() {
    // Theme settings
    const themes = {
        light: {
            bgColor: '#f4f4f4',
            containerBg: '#ffffff',
            textColor: '#333333',
            primaryColor: '#3cb371',
            secondaryColor: '#2e8b57',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            borderColor: 'rgba(0,0,0,0.1)',
            profileSectionBg: 'linear-gradient(135deg, rgba(60,179,113,0.1), rgba(46,139,87,0.1))',
            pastSearchesBg: '#ffffff',
            upgradeBtnBg: '#ffcc00',
            upgradeBtnColor: '#333333',
            headerIconOpacity: '0.7',
            sliderBg: '#cccccc'
        },
        dark: {
            bgColor: '#1a1a1a',
            containerBg: '#2d2d2d',
            textColor: '#e0e0e0',
            primaryColor: '#4eca89',
            secondaryColor: '#3da06b',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            borderColor: 'rgba(255,255,255,0.1)',
            profileSectionBg: 'linear-gradient(135deg, rgba(60,179,113,0.2), rgba(46,139,87,0.2))',
            pastSearchesBg: '#383838',
            upgradeBtnBg: '#ffd633',
            upgradeBtnColor: '#222222',
            headerIconOpacity: '0.85',
            sliderBg: '#555555'
        }
    };

    // Check for saved theme preference or use system preference
    let currentTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    // Remove any existing theme toggle box from content area
    const existingToggleBox = document.querySelector('.theme-toggle-box');
    if (existingToggleBox) {
        existingToggleBox.remove();
    }

    // Add theme toggle UI to the header (top left)
    const header = document.querySelector('.header');
    if (header) {
        // Create theme toggle switch
        const themeToggleContainer = document.createElement('div');
        themeToggleContainer.className = 'theme-toggle-container';
        themeToggleContainer.style.display = 'flex';
        themeToggleContainer.style.alignItems = 'center';
        
        // Create the toggle switch
        themeToggleContainer.innerHTML = `
            <label class="switch" style="margin-right: 8px;">
                <input type="checkbox" id="themeToggle" ${currentTheme === 'dark' ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
            <img src="../images/moon-icon.png" alt="Dark Mode" style="width: 18px; height: 18px; opacity: 0.7;">
        `;
        
        // Insert as the first child of the header
        header.insertBefore(themeToggleContainer, header.firstChild);

        // Add styles for the new position
        const style = document.createElement('style');
        style.textContent = `
            .theme-toggle-container {
                margin-right: auto;
                padding: 3px;
                border-radius: 20px;
                transition: all 0.3s ease;
            }
            
            .theme-toggle-container:hover {
                transform: scale(1.05);
            }
            
            .theme-toggle-container .switch {
                margin-bottom: 0;
                transform: scale(0.85);
            }
        `;
        document.head.appendChild(style);

        // Add event listener for theme toggle
        document.getElementById('themeToggle').addEventListener('change', function(e) {
            currentTheme = e.target.checked ? 'dark' : 'light';
            applyTheme(currentTheme);
            localStorage.setItem('theme', currentTheme);
        });
    }

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
        container.style.backgroundColor = themeValues.containerBg;
        container.style.boxShadow = themeValues.boxShadow;
        
        // Profile section
        const profileSection = document.querySelector('.profile-section');
        profileSection.style.background = themeValues.profileSectionBg;
        profileSection.style.color = themeValues.textColor;
        
        // Email display
        const profileEmail = document.querySelector('.profile-email');
        profileEmail.style.color = theme === 'dark' ? '#b0b0b0' : '#666';
        
        // All buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.classList.contains('btn-edit')) {
                btn.style.backgroundColor = themeValues.primaryColor;
                btn.style.color = '#ffffff';
            }
            if (btn.classList.contains('btn-upgrade')) {
                btn.style.backgroundColor = themeValues.upgradeBtnBg;
                btn.style.color = themeValues.upgradeBtnColor;
            }
        });
        
        // Plan box
        const planBox = document.querySelector('.plan-box');
        planBox.style.backgroundColor = themeValues.containerBg;
        planBox.style.boxShadow = theme === 'dark' ? '0 5px 15px rgba(0,0,0,0.15)' : '0 5px 15px rgba(0,0,0,0.05)';
        planBox.style.color = themeValues.textColor;
        
        // Past searches
        const pastSearches = document.querySelectorAll('.past-searches');
        pastSearches.forEach(item => {
            item.style.backgroundColor = themeValues.pastSearchesBg;
            item.style.color = themeValues.textColor;
            item.style.boxShadow = theme === 'dark' ? '0 5px 15px rgba(0,0,0,0.15)' : '0 5px 15px rgba(0,0,0,0.05)';
        });
        
        // Theme toggle container
        const themeToggleContainer = document.querySelector('.theme-toggle-container');
        if (themeToggleContainer) {
            themeToggleContainer.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
            
            // Change the icon based on theme
            const themeIcon = themeToggleContainer.querySelector('img');
            if (themeIcon) {
                themeIcon.src = theme === 'dark' ? '../images/moon-icon.png' : '../images/sun-icon.png';
                themeIcon.style.filter = theme === 'dark' ? 'invert(0.8)' : 'none';
            }
        }
        
        // Bottom icons
        const bottomIcons = document.querySelector('.bottom-icons');
        bottomIcons.style.backgroundColor = themeValues.containerBg;
        bottomIcons.style.borderTop = `1px solid ${themeValues.borderColor}`;
        
        // Header icons
        const headerIcons = document.querySelectorAll('.header-icon');
        headerIcons.forEach(icon => {
            icon.style.opacity = themeValues.headerIconOpacity;
            // Optionally invert icons in dark mode for better visibility
            icon.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        });
        
        // Bottom icons
        const allIcons = document.querySelectorAll('.bottom-icons img');
        allIcons.forEach(icon => {
            icon.style.opacity = themeValues.headerIconOpacity;
            // Optionally invert icons in dark mode for better visibility
            icon.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        });
        
        // Past searches icons
        const searchIcons = document.querySelectorAll('.past-searches img');
        searchIcons.forEach(icon => {
            icon.style.opacity = themeValues.headerIconOpacity;
            icon.style.filter = theme === 'dark' ? 'invert(1)' : 'none';
        });

        // Slider background
        const sliders = document.querySelectorAll('.slider:not(.round)');
        sliders.forEach(slider => {
            if (!slider.classList.contains('checked')) {
                slider.style.backgroundColor = themeValues.sliderBg;
            }
        });

        // Update any existing theme-related styles
        let styleElement = document.getElementById('theme-scrollbar-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'theme-scrollbar-styles';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            .content-wrapper::-webkit-scrollbar-thumb {
                background: ${theme === 'dark' ? '#555' : '#ccc'};
            }
            .content-wrapper::-webkit-scrollbar-thumb:hover {
                background: ${theme === 'dark' ? '#777' : '#bbb'};
            }
        `;
    }
    
    // Initial theme application
    applyTheme(currentTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('theme') === null) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            
            // Update toggle if it exists
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.checked = e.matches;
            }
        }
    });
});