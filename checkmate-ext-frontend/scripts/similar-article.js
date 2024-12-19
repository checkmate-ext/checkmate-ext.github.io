document.addEventListener('DOMContentLoaded', () => {
    const dataString = localStorage.getItem('analysisResults');
    if (!dataString) {
        // No data found, show placeholders
        document.getElementById('reliabilityScore').textContent = 'N/A';
        return;
    }

    const data = JSON.parse(dataString);

    // Set the reliability score
    if (data.reliability_score !== undefined) {
        document.getElementById('reliabilityScore').textContent = data.reliability_score;
    } else {
        document.getElementById('reliabilityScore').textContent = 'N/A';
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