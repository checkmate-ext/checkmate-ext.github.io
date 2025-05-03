document.addEventListener('DOMContentLoaded', () => {
    const dataString = localStorage.getItem('analysisResults');
    if (!dataString) {
        setPlaceholderContent();
        return;
    }

    const data = JSON.parse(dataString);
    
    // Set the main reliability score
    setReliabilityScore(data);
    
    // Set objectivity score
    setObjectivityScore(data);
    
    // Set bias information
    setBiasInformation(data);
    
    // Set source information
    setSourceInformation(data);
    
    // Display similar articles
    displaySimilarArticles(data);
    
    // Set up event listeners for buttons
    setupEventListeners();
});

// Set placeholder content when no data is available
function setPlaceholderContent() {
    document.getElementById('resultPageReliabilityScore').textContent = 'N/A';
    document.getElementById('resultPageReliabilityScore').classList.add('red');
    document.getElementById('reliabilityDescription').textContent = 'No analysis data available.';
    document.getElementById('objectivityScore').textContent = 'N/A';
    document.getElementById('objectivityScore').classList.add('red');
    document.getElementById('biasScore').textContent = 'N/A';
    document.getElementById('biasScore').classList.add('red');
    document.getElementById('sourceReliability').textContent = 'Source information unavailable.';
    document.getElementById('objectivityAnalysis').textContent = 'Objectivity Analysis: No data available.';
    document.getElementById('biasAnalysis').textContent = 'Bias Analysis: No data available.';
    document.getElementById('similarArticlesList').innerHTML = '<p>No similar articles found.</p>';
}

// Set the reliability score and description
function setReliabilityScore(data) {
    const scoreBox = document.getElementById('resultPageReliabilityScore');
    const reliabilityDescription = document.getElementById('reliabilityDescription');
    
    if (data.reliability_score !== undefined && data.reliability_score !== null) {
        const raw = data.reliability_score;
        const pct = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
        scoreBox.textContent = pct;

        // Set color class
        if (pct > 75) {
            scoreBox.classList.add('green');
            reliabilityDescription.textContent = 'This article has a high reliability score, indicating trustworthy content with well-verified information.';
        } else if (pct >= 50) {
            scoreBox.classList.add('neutral');
            reliabilityDescription.textContent = 'This article has a moderate reliability score, indicating generally reliable content with some potential concerns.';
        } else {
            scoreBox.classList.add('red');
            reliabilityDescription.textContent = 'This article has a low reliability score, indicating potential issues with accuracy or bias in the information presented.';
        }
    } else {
        scoreBox.textContent = 'N/A';
        scoreBox.classList.add('red');
        reliabilityDescription.textContent = 'Unable to determine the reliability of this article.';
    }
}

// Set the objectivity score and analysis
function setObjectivityScore(data) {
    const objectivityScore = document.getElementById('objectivityScore');
    const objectivityAnalysis = document.getElementById('objectivityAnalysis');
    
    if (data.objectivity_score !== undefined && data.objectivity_score >= 0) {
        // Handle objectivity score that might be in 0-1 range or 0-100 range
        const score = data.objectivity_score <= 1 
            ? Math.round(data.objectivity_score * 100) 
            : Math.round(data.objectivity_score);
            
        objectivityScore.textContent = score;
        
        // Add color class based on score
        if (score > 75) {
            objectivityScore.classList.add('green');
            objectivityAnalysis.textContent = `Objectivity Analysis: The article has a high objectivity score (${score}), suggesting it is primarily fact-based with minimal opinions or subjective statements.`;
        } else if (score >= 50) {
            objectivityScore.classList.add('neutral');
            objectivityAnalysis.textContent = `Objectivity Analysis: The article has a moderate objectivity score (${score}), containing a mix of factual information and opinion-based content.`;
        } else {
            objectivityScore.classList.add('red');
            objectivityAnalysis.textContent = `Objectivity Analysis: The article has a low objectivity score (${score}), indicating it is heavily opinion-based with limited factual content.`;
        }
    } else {
        objectivityScore.textContent = 'N/A';
        objectivityScore.classList.add('red');
        objectivityAnalysis.textContent = 'Objectivity Analysis: Unable to determine the objectivity of this article.';
    }
}

function setBiasInformation(data) {
    const biasScore = document.getElementById('biasScore');
    const biasAnalysis = document.getElementById('biasAnalysis');
    
    if (data.bias_prediction) {
        let biasText = data.bias_prediction;
        
        // Use full bias text instead of abbreviation
        biasScore.textContent = biasText;
        
        // Adjust font size based on text length
        if (biasText.length > 10) { // For very long bias text like "Center-Right"
            biasScore.style.fontSize = '11px';
        } else if (biasText.length > 6) { // For medium length bias like "Center"
            biasScore.style.fontSize = '13px';
        } else { // For short bias text like "Left"
            biasScore.style.fontSize = '15px';
        }
        
        // Add color class based on political bias
        if (biasText === "Center") {
            biasScore.classList.add('green');
            biasAnalysis.textContent = `Bias Analysis: The article presents a politically centered perspective with balanced viewpoints.`;
        } else if (biasText === "Left" || biasText === "Right") {
            biasScore.classList.add('neutral');
            biasAnalysis.textContent = `Bias Analysis: The article leans toward the ${biasText} of the political spectrum.`;
        } else if (biasText.includes("Left")) {
            biasScore.classList.add('red');
            biasAnalysis.textContent = `Bias Analysis: The article presents a significant left-leaning political perspective.`;
        } else if (biasText.includes("Right")) {
            biasScore.classList.add('red');
            biasAnalysis.textContent = `Bias Analysis: The article presents a significant right-leaning political perspective.`;
        } else {
            biasScore.classList.add('red');
            biasAnalysis.textContent = `Bias Analysis: The article's political perspective is ${biasText}.`;
        }
    } else {
        biasScore.textContent = 'N/A';
        biasScore.classList.add('red');
        biasAnalysis.textContent = 'Bias Analysis: Unable to determine the political bias of this article.';
    }
}



// Set the source information
function setSourceInformation(data) {
    const sourceReliability = document.getElementById('sourceReliability');
    
    if (data.website_credibility !== null && data.website_credibility !== undefined) {
        let label = "";

        if (data.website_credibility === 0) {
            label = "Credible";
            sourceReliability.innerHTML = `This article comes from a <strong style="color:#27ae60;">credible source</strong> with a history of accurate reporting.`;
        } else if (data.website_credibility === 1) {
            label = "Mixed";
            sourceReliability.innerHTML = `This article comes from a source with <strong style="color:#f39c12;">mixed credibility</strong>. Some fact-checking may be recommended.`;
        } else {
            label = "Uncredible";
            sourceReliability.innerHTML = `This article comes from a source with <strong style="color:#c0392b;">poor credibility</strong>. Caution is advised when considering the information presented.`;
        }
    } else {
        sourceReliability.textContent = 'Source credibility information not available in our database.';
    }
}

// Display similar articles
function displaySimilarArticles(data) {
    const similarArticlesList = document.getElementById('similarArticlesList');
    
    if (data.similar_articles && data.similar_articles.length > 0) {
        // Clear placeholder
        similarArticlesList.innerHTML = '';
        
        // Get the first two similar articles for a concise view
        const articlesToShow = data.similar_articles.slice(0, 2);
        
        articlesToShow.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.classList.add('similar-article');

            // Calculate similarity percentage
            const similarityScore = article.similarity_score !== undefined 
                ? Math.round(article.similarity_score * 100) 
                : Math.floor(Math.random() * 100);
            
            // Use the Google-provided title without fallback to 'Untitled Article'
            // since we're now sending it from the backend
            articleElement.innerHTML = `
                <h3>${article.title}</h3>
                <a href="${article.url}" target="_blank">${article.url}</a>
                <div class="similarity-badge">
                    Similarity: ${similarityScore}%
                </div>
            `;
            similarArticlesList.appendChild(articleElement);
        });
        
        // If there are more than 2 articles, add a note
        if (data.similar_articles.length > 2) {
            const moreArticlesNote = document.createElement('p');
            moreArticlesNote.style.fontSize = '12px';
            moreArticlesNote.style.fontStyle = 'italic';
            moreArticlesNote.textContent = `+ ${data.similar_articles.length - 2} more similar articles. See details for more.`;
            similarArticlesList.appendChild(moreArticlesNote);
        }
    } else {
        similarArticlesList.innerHTML = '<p>No similar articles found.</p>';
    }
}

// Set up event listeners for buttons
function setupEventListeners() {
    // More Details button
    document.getElementById('moreDetailsBtn').addEventListener('click', () => {
        navigateTo('MoreDetails.html');
    });
    
    // Report Mistake button
    document.getElementById('reportMistakeBtn').addEventListener('click', () => {
        // Store the report type in localStorage
        localStorage.setItem('reportType', 'reliability');
        
        // Navigate to report page
        navigateTo('report.html');
    });
}