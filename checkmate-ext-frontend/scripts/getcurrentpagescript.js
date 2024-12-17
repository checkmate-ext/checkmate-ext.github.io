document.addEventListener('DOMContentLoaded', () => {
    const currentPageUrlElement = document.getElementById('currentPageUrl');
    const analyzeButton = document.getElementById('analyzeButton');
    const similarArticlesList = document.getElementById('similarArticlesList');
    const similarArticlesModal = document.getElementById('similarArticlesModal');

    // Get the active tab in the current window when the page loads
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url) {
            // Display the URL before the button is clicked
            currentPageUrlElement.textContent = activeTab.url;

            // Store the URL for sending when the button is clicked
            analyzeButton.dataset.url = activeTab.url;
        } else {
            currentPageUrlElement.textContent = 'No active tab';
        }
    });

    // When the Analyze Current Page button is clicked
    analyzeButton.addEventListener('click', () => {
        const urlToAnalyze = analyzeButton.dataset.url;
        if (urlToAnalyze) {
            // Send the URL to the Python server
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
                .catch(error => {
                    console.error('Error fetching data:', error);
                    alert('Error analyzing the page. Please try again later.');
                });
        } else {
            alert('No URL to analyze.');
        }
    });
});
