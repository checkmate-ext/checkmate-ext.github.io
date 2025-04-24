// Button actions (placeholders)


document.getElementById('reportMistakeBtn').addEventListener('click', () => {
    // Store the report type in localStorage
    localStorage.setItem('reportType', 'reliability');
    
    // Navigate to report page
    navigateTo('report.html');
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
    if (data.reliability_score !== undefined && data.reliability_score !== null) {
        const raw = data.reliability_score;
        const pct = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
        scoreBox.textContent = pct + '%';

        if (pct > 75) {
            scoreBox.classList.add('green');
        } else if (pct >= 50) {
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