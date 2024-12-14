// navigate.js

function navigateTo(page) {
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = page;
    }, 500); // Match the duration of the CSS transition
}

document.addEventListener('DOMContentLoaded', () => {
    const signInButton = document.getElementById('signInButton');
    const signUpButton = document.getElementById('signUpButton');
    const googleSignUpButton = document.getElementById('googleSignUpButton');
    const facebookSignUpButton = document.getElementById('facebookSignUpButton');
    const backToHomeButton = document.getElementById('backToHomeButton');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const confirmButton = document.getElementById('confirmButton');
    const signInToMain = document.getElementById('signInToMain');


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
            navigateTo('emailverfication.html');
        });
    }
    if (confirmButton) {
        confirmButton.addEventListener('click', () => navigateTo('UpdatePasswordPage.html'));
    }

    if (signInToMain) {
        signInToMain.addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo('MainMenuPage.html');
        });
    }

});