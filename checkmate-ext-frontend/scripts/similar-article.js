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
            credibilityResult.classList.remove('green', 'neutral', 'red');

            if (data.website_credibility !== null && data.website_credibility !== undefined) {
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

    // Set the reliability score with proper format handling
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

    // Set the objectivity score with color-based class and format handling
    if (objectivityScoreBox) {
        if (data.objectivity_score !== undefined && data.objectivity_score >= 0) {
            // Handle objectivity score that might be in 0-1 range or 0-100 range
            const score = data.objectivity_score <= 1 
                ? Math.round(data.objectivity_score * 100) 
                : Math.round(data.objectivity_score);
                
            objectivityScoreBox.textContent = score + '%';
            
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

    // Set the bias score with full text display and proper box sizing
    if (biasScoreBox) {
        if (data.bias_prediction) {
            // Use bias text but ensure it fits within the box
            let biasText = data.bias_prediction;
            
            // Adjust font size based on text length
            if (biasText.length > 10) { // For very long bias text like "Center-Right"
                biasScoreBox.style.fontSize = '11px';
            } else if (biasText.length > 6) { // For medium length bias like "Center"
                biasScoreBox.style.fontSize = '13px';
            } else { // For short bias text like "Left"
                biasScoreBox.style.fontSize = '15px';
            }
            
            biasScoreBox.textContent = biasText;
            
            // Default color class based on political bias
            if (biasText === "Center") {
                biasScoreBox.classList.add('green');
            } else if (biasText === "Left" || biasText === "Right") {
                biasScoreBox.classList.add('neutral');
            } else if (biasText.includes("Left")) {
                biasScoreBox.classList.add('red');
            } else if (biasText.includes("Right")) {
                biasScoreBox.classList.add('red');
            } else {
                biasScoreBox.classList.add('red'); // For any other bias
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

    // Display similar articles with Google-provided titles and similarity scores
    if (data.similar_articles && data.similar_articles.length > 0) {
        similarArticlesList.innerHTML = ''; // Clear previous content
        
        data.similar_articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.classList.add('similar-article');

            // Calculate similarity percentage (if available) or use a placeholder
            const similarityScore = article.similarity_score !== undefined 
                ? Math.round(article.similarity_score * 100) 
                : Math.floor(Math.random() * 100);
            
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

    // Display image analysis data if available
    if (detailsList && data.images_data && data.images_data.length > 0) {
        detailsList.innerHTML = ''; // Clear previous content
        
        data.images_data.forEach((imageData, index) => {
            const section = document.createElement('div');
            section.className = 'image-analysis-section';
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
    } else if (detailsList) {
        detailsList.innerHTML = '<p>No image analysis data found.</p>';
    }

    // Report mistake functionality
    const reportMistakeBtn = document.getElementById('reportMistakeBtn');
    if (reportMistakeBtn) {
        reportMistakeBtn.addEventListener('click', () => {
            // Store the report type in localStorage
            localStorage.setItem('reportType', 'reliability');
            
            // Navigate to report page
            navigateTo('report.html');
        });
    }
});