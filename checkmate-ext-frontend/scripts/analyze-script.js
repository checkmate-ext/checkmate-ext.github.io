document.addEventListener('DOMContentLoaded', () => {
    const currentPageUrlElement = document.getElementById('currentPageUrl');
    const analyzeButton = document.getElementById('analyzeButton');

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
                    // Instead of showing the modal here, we store the results and navigate to ResultPage.html

                    // Example data structure:
                    // data.reliability_score = number
                    // data.details = array of strings or single string
                    // data.similar_articles = array of { title: string, url: string }

                    // Store data in localStorage so we can access it from ResultPage.html
                    localStorage.setItem('analysisResults', JSON.stringify(data));
                    console.log('Data stored:', data);

                    // Redirect to ResultPage.html
                    window.location.href = 'ResultPage.html';
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
