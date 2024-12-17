document.addEventListener('DOMContentLoaded', function() {
    const analyzeButton = document.querySelector('.analyze-button');
    const analyzeInput = document.getElementById('analyze-input');
    const currentPageUrl = document.getElementById('currentPageUrl');
    const similarArticlesModal = document.getElementById('similarArticlesModal');
    const similarArticlesList = document.getElementById('similarArticlesList');

    // Close modal when clicking outside
    similarArticlesModal.addEventListener('click', function(event) {
        if (event.target === similarArticlesModal) {
            similarArticlesModal.style.display = 'none';
        }
    });

    analyzeButton.addEventListener('click', function() {
        // Prioritize manual input over current page URL
        const urlToAnalyze = analyzeInput.value.trim() || currentPageUrl.textContent;

        // Check if URL is valid and not "Loading..."
        if (!urlToAnalyze || urlToAnalyze === 'Loading...') {
            alert('Please enter a valid URL or wait for the current page URL to load.');
            return;
        }

        // Send POST request to the Flask backend
        fetch('http://localhost:5000/scrap_and_search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: urlToAnalyze })
        })
            .then(response => response.json())
            .then(data => {
                if (data.similar_articles && data.similar_articles.length > 0) {
                    // Clear previous results
                    similarArticlesList.innerHTML = '';

                    // Populate similar articles
                    data.similar_articles.forEach(article => {
                        const articleElement = document.createElement('div');
                        articleElement.classList.add('similar-article');

                        articleElement.innerHTML = `
                        <h3>${article.title || 'Untitled Article'}</h3>
                        <a href="${article.url}" target="_blank">${article.url}</a>
                    `;

                        similarArticlesList.appendChild(articleElement);
                    });

                    // Show modal
                    similarArticlesModal.style.display = 'flex';
                } else {
                    alert('No similar articles found.');
                }
            })
    });
});