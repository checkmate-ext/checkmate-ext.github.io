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

// Existing code in result-page.js

document.addEventListener('DOMContentLoaded', () => {
    const dataString = localStorage.getItem('analysisResults');
    if (!dataString) {
        return;
    }

    const data = JSON.parse(dataString);
    const detailsList = document.getElementById('detailsList');

    // Display the second and third items from data.details array
    if (data.details && data.details.length > 2) {
        const secondElement = document.createElement('li');
        secondElement.textContent = data.details[1];
        detailsList.appendChild(secondElement);

        const thirdElement = document.createElement('li');
        thirdElement.textContent = data.details[2];
        detailsList.appendChild(thirdElement);
    }

    const scoreBox = document.getElementById('resultPageReliabilityScore');
    if (data.reliability_score !== undefined) {
        scoreBox.textContent = data.reliability_score;

        if (data.reliability_score > 75) {
            scoreBox.classList.add('green');
        } else if (data.reliability_score >= 50) {
            scoreBox.classList.add('neutral');
        } else {
            scoreBox.classList.add('red');
        }
    } else {
        scoreBox.textContent = 'N/A';
        scoreBox.classList.add('red');
    }

    // Display the second and third similar articles in detailsList
    if (data.similar_articles && data.similar_articles.length > 2) {
        const articlesToShow = data.similar_articles.slice(1, 3); // Get articles at indexes 1 and 2

        articlesToShow.forEach(article => {
            const listItem = document.createElement('li');

            listItem.innerHTML = `
                <h4>${article.title || 'Untitled Article'}</h4>
                <a href="${article.url}" target="_blank">${article.url}</a>
            `;
            detailsList.appendChild(listItem);
        });
    }
});