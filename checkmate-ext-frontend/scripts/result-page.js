// Button actions (placeholders)

function navigateTo(page) {
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = page;
    }, 500); // Match the duration of the CSS transition
}


document.getElementById('reportMistakeBtn').addEventListener('click', () => {
    alert('Report mistake functionality goes here.');
});