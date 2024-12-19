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

document.addEventListener('DOMContentLoaded', () => {
    const dataString = localStorage.getItem('analysisResults');
    if (!dataString) {
        return;
    }

    const data = JSON.parse(dataString);
    const detailsList = document.getElementById('detailsList');

    if (data.details && data.details.length > 1) {
        const secondElement = document.createElement('li');
        secondElement.textContent = data.details[1];
        detailsList.appendChild(secondElement);

        const thirdElement = document.createElement('li');
        thirdElement.textContent = data.details[2];
        detailsList.appendChild(thirdElement);
    }
});