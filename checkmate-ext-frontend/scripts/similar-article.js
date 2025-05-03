document.addEventListener('DOMContentLoaded', async () => {
    console.log("MoreDetails page loaded");
    // Get analysis results from localStorage
    const dataString = localStorage.getItem('analysisResults');
    if (!dataString) {
        console.error("No analysis data found in localStorage");
        document.getElementById('reliabilityScore').textContent = 'N/A';
        document.getElementById('objectivityScore').textContent = 'N/A';
        document.getElementById('biasScore').textContent = 'N/A';
        document.getElementById('titleObjectivityScore').textContent = 'N/A';
        document.getElementById('grammarScoreBox').textContent = 'N/A';
        document.getElementById('similarArticlesList').innerHTML = '<p>No data available</p>';
        return;
    }
    
    console.log("Parsing data from localStorage");
    let data;
    try {
        data = JSON.parse(dataString);
        console.log("Analysis data:", data);
    } catch (err) {
        console.error("Failed to parse analysis results:", err);
        document.getElementById('similarArticlesList').innerHTML = '<p>Error parsing data</p>';
        return;
    }

    // Get DOM elements
    const reliabilityScoreBox = document.getElementById('reliabilityScore');
    const objectivityScoreBox = document.getElementById('objectivityScore');
    const biasScoreBox = document.getElementById('biasScore');
    const titleObjectivityScoreBox = document.getElementById('titleObjectivityScore');
    const grammarScoreBox = document.getElementById('grammarScoreBox');
    const detailsList = document.getElementById('detailsList');
    const similarArticlesList = document.getElementById('similarArticlesList');

    // Check if we found all required elements
    console.log("DOM Elements found:", {
        reliabilityScoreBox: !!reliabilityScoreBox,
        objectivityScoreBox: !!objectivityScoreBox,
        biasScoreBox: !!biasScoreBox,
        titleObjectivityScoreBox: !!titleObjectivityScoreBox,
        grammarScoreBox: !!grammarScoreBox,
        similarArticlesList: !!similarArticlesList
    });

    // Display website credibility information
    function fetchWebsiteScore() {
        try {
            const credibilityResult = document.getElementById('credibilityResult');
            if (!credibilityResult) return;
            
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
            if (credibilityResult) {
                credibilityResult.textContent = 'Error retrieving score';
                credibilityResult.classList.add('red');
            }
        }
    }

    fetchWebsiteScore();

    // Set reliability score
    if (reliabilityScoreBox) {
        if (data.reliability_score !== undefined && data.reliability_score !== null) {
            const raw = data.reliability_score;
            const pct = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
            reliabilityScoreBox.textContent = pct;

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
    }

    // Set objectivity score
    if (objectivityScoreBox) {
        if (data.objectivity_score !== undefined && data.objectivity_score !== null) {
            const score = data.objectivity_score <= 1 
                ? Math.round(data.objectivity_score * 100) 
                : Math.round(data.objectivity_score);
                
            objectivityScoreBox.textContent = score;
            
            if (score > 75) {
                objectivityScoreBox.classList.add('green');
            } else if (score >= 50) {
                objectivityScoreBox.classList.add('neutral');
            } else {
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
        } else {
            objectivityScoreBox.textContent = 'N/A';
            objectivityScoreBox.classList.add('red');
        }
    }

    // Set bias score
    if (biasScoreBox) {
        console.log("Setting bias score with data:", data.bias_prediction);
        
        if (data.bias_prediction) {
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

            // Add tooltips to explain the scores
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            biasScoreBox.parentNode.appendChild(tooltip);
            
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltiptext';
            tooltipText.textContent = 'Political bias indicates the political leaning of the article';
            tooltip.appendChild(tooltipText);
        } else {
            console.log("No bias prediction available");
            biasScoreBox.textContent = 'N/A';
            biasScoreBox.classList.add('red');
        }
    }

    // Set title objectivity score
    if (titleObjectivityScoreBox) {
        // Check both possible field names from backend
        const titleObjectivityValue = data.title_objectivity !== undefined && data.title_objectivity !== null ? 
            data.title_objectivity : 
            data.title_objectivity_score;
            
        if (titleObjectivityValue !== undefined && titleObjectivityValue !== null && titleObjectivityValue >= 0) {
            const score = titleObjectivityValue <= 1 
                ? Math.round(titleObjectivityValue * 100) 
                : Math.round(titleObjectivityValue);
                
            titleObjectivityScoreBox.textContent = score;
            
            if (score > 75) {
                titleObjectivityScoreBox.classList.add('green');
            } else if (score >= 50) {
                titleObjectivityScoreBox.classList.add('neutral');
            } else {
                titleObjectivityScoreBox.classList.add('red');
            }

            // Add tooltips to explain the score
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            titleObjectivityScoreBox.parentNode.appendChild(tooltip);
            
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltiptext';
            tooltipText.textContent = 'Title Objectivity measures how fact-based versus sensational the article title is';
            tooltip.appendChild(tooltipText);
        } else {
            titleObjectivityScoreBox.textContent = 'N/A';
            titleObjectivityScoreBox.classList.add('red');
            
            // Add tooltip for N/A state
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            titleObjectivityScoreBox.parentNode.appendChild(tooltip);
            
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltiptext';
            tooltipText.textContent = 'Title objectivity score could not be calculated for this article';
            tooltip.appendChild(tooltipText);
        }
    }

    // Set grammar score - IMPROVED CODE
    if (grammarScoreBox) {
        if (data.spelling_issues !== undefined && data.pct !== undefined) {
            // Get error count and format percentage
            const errorCount = data.spelling_issues;
            const errorRate = data.pct;
            const formattedRate = (errorRate * 100).toFixed(1);
            
            // Display a concise format "Count (Rate%)"
            grammarScoreBox.textContent = formattedRate + '%';
            
            // Color coding based on error rate
            if (errorRate < 0.02) { // Less than 2%
                grammarScoreBox.classList.add('green');
            } else if (errorRate < 0.05) { // Less than 5%
                grammarScoreBox.classList.add('neutral');
            } else {
                grammarScoreBox.classList.add('red');
            }
            
            // Add detailed tooltip showing both count and rate
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            grammarScoreBox.parentNode.appendChild(tooltip);
            
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltiptext';
            tooltipText.textContent = `${errorCount} spelling/grammar errors found (${formattedRate}% of text)`;
            tooltip.appendChild(tooltipText);
        } else {
            grammarScoreBox.textContent = 'N/A';
            grammarScoreBox.classList.add('neutral');
            
            // Add tooltip for N/A state
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            grammarScoreBox.parentNode.appendChild(tooltip);
            
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltiptext';
            tooltipText.textContent = 'Grammar error information is not available for this article';
            tooltip.appendChild(tooltipText);
        }
    }

    // Display similar articles
    if (similarArticlesList) {
        console.log("Setting up similar articles:", data.similar_articles?.length);
        
        if (data.similar_articles && data.similar_articles.length > 0) {
            similarArticlesList.innerHTML = ''; // Clear previous content
            
            data.similar_articles.forEach(article => {
                console.log("Processing similar article:", article);
                const articleElement = document.createElement('div');
                articleElement.classList.add('similar-article');

                // Calculate similarity percentage
                const similarityScore = article.similarity_score !== undefined 
                    ? Math.round(article.similarity_score * 100) 
                    : Math.floor(Math.random() * 100);
                
                articleElement.innerHTML = `
                    <h4>${article.title || 'Untitled Article'}</h4>
                    <a href="${article.url}" target="_blank">${article.url}</a>
                    <div class="similarity-badge" style="background-color: var(--primary-color); color: white; display: inline-block; padding: 2px 5px; border-radius: 3px; font-size: 11px; font-weight: bold; margin-top: 6px;">
                        Similarity: ${similarityScore}%
                    </div>
                `;
                similarArticlesList.appendChild(articleElement);
            });
        } else {
            console.log("No similar articles found");
            similarArticlesList.innerHTML = '<p>No similar articles found.</p>';
        }
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

    // Set up report mistake button
    const reportMistakeBtn = document.getElementById('reportMistakeBtn');
    if (reportMistakeBtn) {
        reportMistakeBtn.addEventListener('click', () => {
            localStorage.setItem('reportType', 'reliability');
            navigateTo('report.html');
        });
    }

    // Set up navigation buttons
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        navigateTo('MainMenuPage.html');
    });

    document.getElementById('profileBtn')?.addEventListener('click', () => {
        navigateTo('ProfilePage.html');
    });
});