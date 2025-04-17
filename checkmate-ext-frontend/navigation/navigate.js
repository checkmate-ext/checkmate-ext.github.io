// navigate.js

function navigateTo(page) {
    const protectedPages = [
        'MainMenuPage.html',
        'DashboardPage.html',
        'ProfilePage.html',
        'ResultsPage.html',
        'MoreDetails.html',
        'HistoryPage.html',
        'pricing.html',
        'report.html',
    ];

    // If navigating to a protected page, check for token first
    if (protectedPages.includes(page)) {
        const token = localStorage.getItem('token');
        if (!token || !isTokenValid()) {
            // If no valid token, go to sign-in
            window.location.href = 'FirstPage.html';
            return;
        }
    }

    document.body.classList.add('fade-out');
    setTimeout(() => {
        localStorage.setItem('lastPage', page);
        window.location.href = page;
    }, 500); // Match the duration of the CSS transition
}

document.addEventListener('DOMContentLoaded', () => {

    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'FirstPage.html') {
        if (isTokenValid()) {
            navigateTo('MainMenuPage.html');
        }
        else {
            if (localStorage.getItem('token')) {localStorage.removeItem('token');}
        }
    }

    const editButton = document.getElementById('editBtn');
    const signInButton = document.getElementById('signInButton');
    const signUpButton = document.getElementById('signUpButton');
    const googleSignUpButton = document.getElementById('googleSignUpButton');
    const facebookSignUpButton = document.getElementById('facebookSignUpButton');
    const backToHomeButton = document.getElementById('backToHomeButton');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const confirmButton = document.getElementById('confirmButton');
    const signInToMain = document.getElementById('signInToMain');
    const moreDetails = document.getElementById('moreDetailsBtn');
    const menuButton = document.getElementById('menuBtn');
    const profileButton = document.getElementById('profileBtn');
    const pastSearches = document.getElementById('pastSearches');
    const dashboardPreview = document.getElementById('dashboardPreview');
    const historyButton = document.getElementById('historyBtn');
    const priceButton = document.getElementById('upgradeBtn');
    const reportButton = document.getElementById('reportBtn');
    const signupBackButton = document.getElementById('signup-back-button');

    if (signInButton) {
        signInButton.addEventListener('click', () => navigateTo('SignInPage.html'));
    }
    if (signUpButton) {
        signUpButton.addEventListener('click', () => navigateTo('SignUpPage.html'));
    }
    if (googleSignUpButton) {
        googleSignUpButton.addEventListener('click', () => navigateTo('GoogleSignUpPage.html'));
    }
    if (facebookSignUpButton) {
        facebookSignUpButton.addEventListener('click', () => navigateTo('FacebookSignUpPage.html'));
    }
    if (backToHomeButton) {
        backToHomeButton.addEventListener('click', () => navigateTo('FirstPage.html'));
    }
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (event) => {
            event.preventDefault();
            chrome.tabs.create({
                url: chrome.runtime.getURL('../extension-ui/pages/EmailVerification.html')
            });});
    }

    if (confirmButton) {
        confirmButton.addEventListener('click', () => navigateTo('UpdatePasswordPage.html'));
    }

    if (moreDetails) {
        moreDetails.addEventListener('click', () => navigateTo('MoreDetails.html'));
    }

    if (menuButton) {
        menuButton.addEventListener('click', () => navigateTo('MainMenuPage.html'));
    }

    if (profileButton) {
        profileButton.addEventListener('click', () => navigateTo('ProfilePage.html'));
    }

    if (pastSearches) {
        pastSearches.addEventListener('click', () => navigateTo('DashboardPage.html'));
    }

    if (dashboardPreview) {
        dashboardPreview.addEventListener('click', () => navigateTo('DashboardPage.html'));
    }

    if (historyButton) {
        historyButton.addEventListener('click', () => navigateTo('HistoryPage.html'));
    }

    if (priceButton) {
        priceButton.addEventListener('click', () => navigateTo('pricing.html'));
    }

    if (editButton) {
        editButton.addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo('UpdatePasswordPage.html');
        });
    }

    if (reportButton) {
        reportButton.addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo('report.html');
        });
    }

    if (signupBackButton) {
        signupBackButton.addEventListener('click', () => navigateTo('FirstPage.html'));
    }
});


function isTokenValid() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        // Decode token payload (assumes JWT format: header.payload.signature)
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds; convert to milliseconds
        if (payload.exp * 1000 < Date.now()) {
            return false;  // token expired
        }
        return true; // token is valid
    } catch (error) {
        return false;
    }
}