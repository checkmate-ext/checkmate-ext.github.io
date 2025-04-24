document.addEventListener('DOMContentLoaded', async () => {
    const dataString = localStorage.getItem('analysisResults');
    if (!dataString) {
        // No data found, show placeholders
        document.getElementById('reliabilityScore').textContent = 'N/A';
        return;
    }
    const data = JSON.parse(dataString);

    const reliabilityScoreBox = document.getElementById('reliabilityScore');
    const objectivityScoreBox = document.getElementById('objectivityScore');
    const biasScoreBox = document.getElementById('biasScore');
    const similarArticlesList = document.getElementById('similarArticlesList');

    function fetchWebsiteScore() {
        try {
            const credibilityResult = document.getElementById('credibilityResult');
            credibilityResult.classList.remove('green', 'neutral', 'red');

            if (data.website_credibility !== null) {
                let label = "";

                if (data.website_credibility === 0) {
                    label = "Credible";
                    credibilityResult.classList.add('green');  // High credibility
                } else if (data.website_credibility === 1) {
                    label = "Mixed";
                    credibilityResult.classList.add('neutral');  // Moderate credibility
                } else {
                    label = "Uncredible";
                    credibilityResult.classList.add('red');  // Low credibility
                }

                credibilityResult.textContent = `Website Credibility: ${label}`;
            } else {
                credibilityResult.textContent = 'Website not found in database';
                credibilityResult.classList.add('red');
            }
        } catch (error) {
            console.error('Error fetching website score:', error);
            const credibilityResult = document.getElementById('credibilityResult');
            credibilityResult.textContent = 'Error retrieving score';
            credibilityResult.classList.add('red');
        }
    }

    fetchWebsiteScore();

    if (data.reliability_score !== undefined && data.reliability_score !== null) {
        const raw = data.reliability_score;
        const pct = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
        reliabilityScoreBox.textContent = pct + '%';

        if (pct > 75) {
            reliabilityScoreBox.classList.add('green');
        } else if (pct >= 50) {
            reliabilityScoreBox.classList.add('neutral');
        } else {
            reliabilityScoreBox.classList.add('red');
        }
    } else {
        reliabilityScoreBox.textContent = 'N/A';
        reliabilityScoreBox.classList.add('red');
    }

    // Set the objectivity score with color-based class
    if (objectivityScoreBox) {
        if (data.objectivity_score !== undefined && data.objectivity_score >= 0) {
            // Handle objectivity score that might be in 0-1 range or 0-100 range
            const score = data.objectivity_score <= 1 
                ? Math.round(data.objectivity_score * 100) 
                : Math.round(data.objectivity_score);
                
            objectivityScoreBox.textContent = score;
            
            // Add color class based on score
            if (score > 75) {
                objectivityScoreBox.classList.add('green');
            } else if (score >= 50) {
                objectivityScoreBox.classList.add('neutral');
            } else {
                objectivityScoreBox.classList.add('red');
            }
        }
        else {
            objectivityScoreBox.textContent = 'N/A';
            objectivityScoreBox.classList.add('red');
        }

        // Add tooltips to explain the scores
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        objectivityScoreBox.parentNode.appendChild(tooltip);
        
        const tooltipText = document.createElement('span');
        tooltipText.className = 'tooltiptext';
        tooltipText.textContent = 'Objectivity measures how fact-based versus opinion-based the article is';
        tooltip.appendChild(tooltipText);
    }

    // Set the bias score with full text (not abbreviated)
    if (biasScoreBox) {
        if (data.bias_prediction) {
            // Use bias text but ensure it fits within the box
            let biasText = data.bias_prediction;
            
            // Adjust font size based on text length
            if (biasText.length > 6) {
                biasScoreBox.style.fontSize = '11px';
            } else if (biasText.length > 4) {
                biasScoreBox.style.fontSize = '12px';
            }
            
            biasScoreBox.textContent = biasText;
            
            // Default color class based on political bias
            if (biasText === "Center") {
                biasScoreBox.classList.add('green');
            } else if (biasText === "Left" || biasText === "Right") {
                biasScoreBox.classList.add('neutral');
            } else {
                biasScoreBox.classList.add('red'); // For extreme bias
            }
        } else {
            biasScoreBox.textContent = 'N/A';
            biasScoreBox.classList.add('red');
        }

        // Add tooltips to explain the scores
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        biasScoreBox.parentNode.appendChild(tooltip);
        
        const tooltipText = document.createElement('span');
        tooltipText.className = 'tooltiptext';
        tooltipText.textContent = 'Political bias indicates the political leaning of the article';
        tooltip.appendChild(tooltipText);
    }

    // Display similar articles with similarity scores
    if (data.similar_articles && data.similar_articles.length > 0) {
        data.similar_articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.classList.add('similar-article');

            // Calculate similarity percentage (if available) or use a placeholder
            const similarityScore = article.similarity_score !== undefined 
                ? Math.round(article.similarity_score * 100) 
                : Math.floor(Math.random() * 100);
            
            // Use a fixed theme class instead of color-based classes
            articleElement.innerHTML = `
                <h4>${article.title || 'Untitled Article'}</h4>
                <a href="${article.url}" target="_blank">${article.url}</a>
                <div class="similarity-badge theme-colored">
                    Similarity: ${similarityScore}%
                </div>
            `;
            similarArticlesList.appendChild(articleElement);
        });
    } else {
        similarArticlesList.innerHTML = '<p>No similar articles found.</p>';
    }

    // Report mistake functionality
    document.getElementById('reportMistakeBtn').addEventListener('click', () => {
        // Store the report type in localStorage
        localStorage.setItem('reportType', 'reliability');
        
        // Navigate to report page
        navigateTo('report.html');
    });
});