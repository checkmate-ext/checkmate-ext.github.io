document.addEventListener('DOMContentLoaded', () => {
    const dataString = localStorage.getItem('analysisResults');
    if (!dataString) {
        // No data found, show placeholders
        document.getElementById('reliabilityScore').textContent = 'N/A';
        return;
    }
    const data = JSON.parse(dataString);
    const scoreBox = document.getElementById('reliabilityScore');

    // Set the reliability score and color
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

    const similarArticlesList = document.getElementById('similarArticlesList');

    if (data.similar_articles && data.similar_articles.length > 0) {
        data.similar_articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.classList.add('similar-article');

            articleElement.innerHTML = `
                <h4>${article.title || 'Untitled Article'}</h4>
                <a href="${article.url}" target="_blank">${article.url}</a>
            `;
            similarArticlesList.appendChild(articleElement);
        });
    } else {
        similarArticlesList.innerHTML = '<p>No similar articles found.</p>';
    }

    document.getElementById('reportMistakeBtn').addEventListener('click', () => {
        alert('Report mistake functionality goes here.');
    });
});