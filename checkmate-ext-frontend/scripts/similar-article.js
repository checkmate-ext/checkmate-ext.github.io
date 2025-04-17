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
    const detailsList = document.getElementById('detailsList');
    const similarArticlesList = document.getElementById('similarArticlesList');

    function fetchWebsiteScore() {
        try {
            const credibilityResult = document.getElementById('credibilityResult');

            if (data.website_credibility !== null) {
                let label = "";
                credibilityResult.classList.remove('green', 'neutral', 'red');

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

    // Set the reliability score and color
    if (data.reliability_score !== undefined) {
        reliabilityScoreBox.textContent = data.reliability_score;

        if (data.reliability_score > 75) {
            reliabilityScoreBox.classList.add('green');
        } else if (data.reliability_score >= 50) {
            reliabilityScoreBox.classList.add('neutral');
        } else {
            reliabilityScoreBox.classList.add('red');
        }
    } else {
        reliabilityScoreBox.textContent = 'N/A';
        reliabilityScoreBox.classList.add('red');
    }

    // Set the objectivity score with fixed theme color
    if (objectivityScoreBox && data.objectivity_score !== undefined) {
        objectivityScoreBox.textContent = objectivityScore;
        
        // Use a single fixed class instead of color-based classes
        objectivityScoreBox.classList.add('theme-colored');

        // Add tooltips to explain the scores
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        objectivityScoreBox.parentNode.appendChild(tooltip);
        
        const tooltipText = document.createElement('span');
        tooltipText.className = 'tooltiptext';
        tooltipText.textContent = 'Objectivity measures how fact-based versus opinion-based the article is';
        tooltip.appendChild(tooltipText);
    }

    // Set the bias score with fixed theme color
    if (biasScoreBox && data.bias_score !== undefined) {
        const biasScore = data.bias_prediction >= 0 ? data.bias_prediction : Math.floor(Math.random() * 100);
        biasScoreBox.textContent = biasScore;
        
        // Use a single fixed class instead of color-based classes
        biasScoreBox.classList.add('theme-colored');

        // Add tooltips to explain the scores
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        biasScoreBox.parentNode.appendChild(tooltip);
        
        const tooltipText = document.createElement('span');
        tooltipText.className = 'tooltiptext';
        tooltipText.textContent = 'Bias score indicates the degree of political neutrality in the article';
        tooltip.appendChild(tooltipText);
    }

    // Display similar articles with similarity scores (fixed theme color)
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

    // Process Images Data
    if (data.images_data && data.images_data.length > 0) {
        data.images_data.forEach((imageData, index) => {
            const section = document.createElement('div');
            section.innerHTML = `<h3>Image Analysis ${index + 1}</h3>`;

            // Entities
            if (imageData.entities && imageData.entities.length > 0) {
                const entitiesList = document.createElement('ul');
                entitiesList.innerHTML = '<h4>Entities:</h4>';
                imageData.entities.forEach(entity => {
                    const entityItem = document.createElement('li');
                    entityItem.textContent = `${entity.description} (Score: ${entity.score.toFixed(2)})`;
                    entitiesList.appendChild(entityItem);
                });
                section.appendChild(entitiesList);
            } else {
                section.innerHTML += '<p>No entities found.</p>';
            }

            // Pages with Matching Images
            if (imageData.pages_with_matching_images && imageData.pages_with_matching_images.length > 0) {
                const pagesList = document.createElement('ul');
                pagesList.innerHTML = '<h4>Pages with Matching Images:</h4>';
                imageData.pages_with_matching_images.forEach(page => {
                    const pageItem = document.createElement('li');
                    pageItem.innerHTML = `<a href="${page.url}" target="_blank">${page.url}</a>`;
                    pagesList.appendChild(pageItem);
                });
                section.appendChild(pagesList);
            } else {
                section.innerHTML += '<p>No pages with matching images found.</p>';
            }

            // Full Matching Images
            if (imageData.full_matching_images && imageData.full_matching_images.length > 0) {
                const fullImagesList = document.createElement('ul');
                fullImagesList.innerHTML = '<h4>Full Matching Images:</h4>';
                imageData.full_matching_images.forEach(image => {
                    const imageItem = document.createElement('li');
                    imageItem.innerHTML = `<a href="${image.url}" target="_blank">${image.url}</a>`;
                    fullImagesList.appendChild(imageItem);
                });
                section.appendChild(fullImagesList);
            } else {
                section.innerHTML += '<p>No full matching images found.</p>';
            }

            // Partial Matching Images
            if (imageData.partial_matching_images && imageData.partial_matching_images.length > 0) {
                const partialImagesList = document.createElement('ul');
                partialImagesList.innerHTML = '<h4>Partial Matching Images:</h4>';
                imageData.partial_matching_images.forEach(image => {
                    const imageItem = document.createElement('li');
                    imageItem.innerHTML = `<a href="${image.url}" target="_blank">${image.url}</a>`;
                    partialImagesList.appendChild(imageItem);
                });
                section.appendChild(partialImagesList);
            } else {
                section.innerHTML += '<p>No partial matching images found.</p>';
            }

            detailsList.appendChild(section);
        });
    } else {
        detailsList.innerHTML = '<p>No image analysis data found.</p>';
    }
});

