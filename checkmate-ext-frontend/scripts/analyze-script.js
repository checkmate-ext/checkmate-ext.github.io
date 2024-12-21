document.addEventListener('DOMContentLoaded', () => {
    const currentPageUrlElement = document.getElementById('currentPageUrl');
    const analyzeButton = document.getElementById('analyzeButton');
    const urlAnalyzeButton = document.getElementById('analyze-button');
    const analyzeInput = document.getElementById('analyze-input');

    // Get the active tab in the current window when the page loads
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url) {
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
            handleAnalysis(urlToAnalyze);
        } else {
            alert('No URL to analyze.');
        }
    });

    // When the URL Analyze button is clicked
    urlAnalyzeButton.addEventListener('click', () => {
        const urlToAnalyze = analyzeInput.value.trim();

        // Check if URL is valid and not "Loading..."
        if (!urlToAnalyze || urlToAnalyze === 'Loading...') {
            alert('Please enter a valid URL or wait for the current page URL to load.');
            return;
        }

        handleAnalysis(urlToAnalyze);
    });

    // Shared analysis handling function
    function handleAnalysis(url) {
        fetch('http://localhost:5000/scrap_and_search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        })
            .then(response => response.json())
            .then(data => {
                if (data.similar_articles && data.similar_articles.length > 0) {
                    // Clear previous results
                    const similarArticlesList = document.getElementById('similarArticlesList');
                    similarArticlesList.innerHTML = '';

                    // Populate similar articles
                    data.similar_articles.forEach(article => {
                        const articleElement = document.createElement('div');
                        articleElement.classList.add('similar-article');

                        articleElement.innerHTML = `
                        <h3>${article.title || 'Untitled Article'}</h3>
                        <a href="${article.link}" target="_blank">${article.link}</a>
                    `;

                        similarArticlesList.appendChild(articleElement);
                    });

                    // Show modal
                    const similarArticlesModal = document.getElementById('similarArticlesModal');
                    similarArticlesModal.style.display = 'flex';
                } else {
                    alert('No similar articles found.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while analyzing the page.');
            });
    }
});