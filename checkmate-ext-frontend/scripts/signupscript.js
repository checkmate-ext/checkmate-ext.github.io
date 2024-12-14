// signup.js

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('googleSignUpButton').addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('GoogleSignUpPage.html');
    });
    document.getElementById('facebookSignUpButton').addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('FacebookSignUpPage.html');
    });
});