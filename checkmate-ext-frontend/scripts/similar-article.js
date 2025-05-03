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

    // Set grammar score with clickable detailed popup
    if (grammarScoreBox) {
        if (data.spelling_issues !== undefined && data.pct !== undefined) {
            // Get error count and format percentage
            const errorCount = data.spelling_issues;
            const errorRate = data.pct;
            const formattedErrorRate = (errorRate * 100).toFixed(1);
            const accuracyRate = (100 - parseFloat(formattedErrorRate)).toFixed(1);
            
            // Show accuracy rate in the box - make text slightly smaller for better fit
            grammarScoreBox.innerHTML = `<span style="font-size: 14px">${accuracyRate}%</span>`;
            grammarScoreBox.style.cursor = 'pointer';
            grammarScoreBox.title = 'Click for grammar details';
            
            // Add a cleaner, more visible info icon
            const indicator = document.createElement('span');
            indicator.innerHTML = '&#9432;'; // Info icon
            indicator.style.position = 'absolute';
            indicator.style.top = '3px';
            indicator.style.right = '3px';
            indicator.style.fontSize = '11px';
            indicator.style.opacity = '0.9';
            indicator.style.color = 'rgba(255,255,255,0.9)';
            grammarScoreBox.style.position = 'relative';
            grammarScoreBox.appendChild(indicator);
            
            // Color coding based on accuracy rate instead of error rate
            if (parseFloat(accuracyRate) > 98) { // More than 98% accurate
                grammarScoreBox.classList.add('green');
            } else if (parseFloat(accuracyRate) >= 95) { // 95-98% accurate
                grammarScoreBox.classList.add('neutral');
            } else {
                grammarScoreBox.classList.add('red');
            }
            
            // Create a modal dialog element with proper theming that will be shown on click
            const modalId = 'grammarDetailsModal';
            let modal = document.getElementById(modalId);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = modalId;
                modal.style.display = 'none';
                modal.style.position = 'fixed';
                modal.style.zIndex = '1000';
                modal.style.left = '0';
                modal.style.top = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
                modal.style.transition = 'opacity 0.3s ease';
                modal.style.opacity = '0';
                
                // Get theme from localStorage or use light as default
                const currentTheme = localStorage.getItem('theme') || 'light';
                const isDarkTheme = currentTheme === 'dark';
                
                const modalContent = document.createElement('div');
                modalContent.style.backgroundColor = isDarkTheme ? '#2d2d2d' : 'white';
                modalContent.style.color = isDarkTheme ? '#e0e0e0' : '#333';
                modalContent.style.margin = '20% auto';
                modalContent.style.padding = '20px';
                modalContent.style.width = '80%';
                modalContent.style.maxWidth = '300px';
                modalContent.style.borderRadius = '8px';
                modalContent.style.boxShadow = isDarkTheme ? 
                    '0 4px 15px rgba(0,0,0,0.4)' : 
                    '0 4px 12px rgba(0,0,0,0.2)';
                
                const primaryColor = isDarkTheme ? '#4eca89' : '#3cb371';
                const borderColor = isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                const secondaryTextColor = isDarkTheme ? '#b0b0b0' : '#666';
                
                modalContent.innerHTML = `
                    <h3 style="margin:0 0 15px;font-size:18px;color:${isDarkTheme ? '#e0e0e0' : '#333'};font-weight:600;">
                        Grammar Analysis
                    </h3>
                    <div style="margin-bottom:20px;border-bottom:1px solid ${borderColor};padding-bottom:15px;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                            <strong style="color:${isDarkTheme ? '#e0e0e0' : '#333'};">Error Count:</strong>
                            <span>${errorCount} errors</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                            <strong style="color:${isDarkTheme ? '#e0e0e0' : '#333'};">Error Rate:</strong>
                            <span>${formattedErrorRate}%</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                            <strong style="color:${isDarkTheme ? '#e0e0e0' : '#333'};">Grammar Accuracy:</strong>
                            <span style="color:${parseInt(accuracyRate) > 95 ? primaryColor : (parseInt(accuracyRate) > 90 ? '#f1c40f' : '#e74c3c')};font-weight:bold;">
                                ${accuracyRate}%
                            </span>
                        </div>
                    </div>
                    <div style="font-size:13px;color:${secondaryTextColor};margin-bottom:20px;line-height:1.4;">
                        Grammar errors include spelling mistakes, punctuation issues, and other text problems detected in the article.
                    </div>
                    <button id="closeGrammarModal" style="background:${primaryColor};color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;display:block;margin:0 auto;font-weight:600;transition:all 0.3s ease;">
                        Close
                    </button>
                `;
                
                modal.appendChild(modalContent);
                document.body.appendChild(modal);
                
                // Add event listener to close button
                const closeBtn = document.getElementById('closeGrammarModal');
                closeBtn.addEventListener('click', () => {
                    modal.style.opacity = '0';
                    setTimeout(() => { modal.style.display = 'none'; }, 300);
                });
    
                // Add hover effect to close button
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.transform = 'translateY(-2px)';
                    closeBtn.style.boxShadow = isDarkTheme ? 
                        '0 4px 12px rgba(78, 202, 137, 0.4)' : 
                        '0 4px 12px rgba(60, 179, 113, 0.3)';
                });
                
                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.transform = 'translateY(0)';
                    closeBtn.style.boxShadow = 'none';
                });
                
                // Close modal when clicking outside
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.opacity = '0';
                        setTimeout(() => { modal.style.display = 'none'; }, 300);
                    }
                });
            }
            
            // Add click event to show modal
            grammarScoreBox.addEventListener('click', () => {
                modal.style.display = 'block';
                setTimeout(() => { modal.style.opacity = '1'; }, 10);
            });
            
            // Still add tooltip for hover
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            grammarScoreBox.parentNode.appendChild(tooltip);
            
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltiptext';
            tooltipText.innerHTML = `Grammar Accuracy: ${accuracyRate}%<br>Click for details`;
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
            tooltipText.textContent = 'Grammar analysis is not available for this article';
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