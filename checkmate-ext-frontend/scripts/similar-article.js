document.addEventListener('DOMContentLoaded', () => {
    const dataString = localStorage.getItem('analysisResults');
    if (!dataString) {
        // No data found, show placeholders
        document.getElementById('reliabilityScore').textContent = 'N/A';
        return;
    }
    const data = JSON.parse(dataString);

    const scoreBox = document.getElementById('reliabilityScore');
    const detailsList = document.getElementById('detailsList');
    const similarArticlesList = document.getElementById('similarArticlesList');

    // Set the reliability score and color
    if (data.reliability_score !== undefined) {
        scoreBox.textContent = data.reliability_score;

        if (data.reliability_score > 75) {
            scoreBox.classList.add('green');
        } else if (data.reliability_score >= 50) {
            scoreBox.classList.add('neutral');
        } else {
            scoreBox.classList.add('red');
        }
    } else {
        scoreBox.textContent = 'N/A';
        scoreBox.classList.add('red');
    }

    // Display similar articles
    if (data.similar_articles && data.similar_articles.length > 0) {
        data.similar_articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.classList.add('similar-article');

            articleElement.innerHTML = `
                <h4>${article.title || 'Untitled Article'}</h4>
                <a href="${article.link}" target="_blank">${article.link}</a>
            `;
            similarArticlesList.appendChild(articleElement);
        });
    } else {
        similarArticlesList.innerHTML = '<p>No similar articles found.</p>';
    }

    // Report mistake functionality
    document.getElementById('reportMistakeBtn').addEventListener('click', () => {
        alert('Report mistake functionality goes here.');
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
                const noEntities = document.createElement('p');
                noEntities.textContent = 'No entities found.';
                section.appendChild(noEntities);
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
                const noPages = document.createElement('p');
                noPages.textContent = 'No pages with matching images found.';
                section.appendChild(noPages);
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
                const noFullImages = document.createElement('p');
                noFullImages.textContent = 'No full matching images found.';
                section.appendChild(noFullImages);
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
                const noPartialImages = document.createElement('p');
                noPartialImages.textContent = 'No partial matching images found.';
                section.appendChild(noPartialImages);
            }

            detailsList.appendChild(section);
        });
    } else {
        detailsList.innerHTML = '<p>No image analysis data found.</p>';
    }
});
