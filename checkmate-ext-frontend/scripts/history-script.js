// Language: JavaScript
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const historyList = document.querySelector('.history-list');

  if (!token) {
    alert('User not authenticated');
    return;
  }

  // Add click event listeners for navigation
  document.getElementById('menuBtn')?.addEventListener('click', () => navigateTo('MainMenuPage.html'));
  document.getElementById('profileBtn')?.addEventListener('click', () => navigateTo('ProfilePage.html'));
  document.getElementById('reportBtn')?.addEventListener('click', () => navigateTo('report.html'));

  try {
    console.debug('Fetching search history...');
    const response = await fetch(`${API_BASE_URL}/user/searches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();
    console.debug('Search history:', result);

    // Clear any existing history items
    historyList.innerHTML = '';

    // Create a variable to track if any item is currently loading
    let isAnyItemLoading = false;

    if (result.data && result.data.length > 0) {
      // Sort the data by created_at date in descending order (newest first)
      const sortedData = result.data.sort((a, b) => {
        // Convert dates to timestamps
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        
        // Handle invalid dates
        if (isNaN(dateA)) return 1;  // Push invalid dates to the bottom
        if (isNaN(dateB)) return -1;
        
        // Return the comparison (newest first)
        return dateB - dateA;
      });

      // Iterate through sorted data
      sortedData.forEach(search => {
        // Format date
        let formattedDate = 'Unknown Date';
        if (search.created_at) {
          const d = new Date(search.created_at);
          formattedDate = isNaN(d.getTime())
            ? 'Unknown Date'
            : d.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              });
        }

        // Create history item container
        const item = document.createElement('div');
        item.classList.add('history-item');
        item.dataset.id = search.id;
        
        item.addEventListener('click', async () => {
          // Prevent any action if any item is already loading
          if (isAnyItemLoading) return;
          
          const articleId = search.id;
          if (!articleId) {
            alert('Article ID not found.');
            return;
          }
        
          try {
            // Set global loading state
            isAnyItemLoading = true;
            
            // Add loading indicator to the clicked item
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-spinner';
            item.appendChild(loadingIndicator);
            
            // Add loading class to the clicked item
            item.classList.add('loading');
            
            // Make all history items non-clickable by adding loading-disabled class
            document.querySelectorAll('.history-item').forEach(historyItem => {
              if (historyItem !== item) {
                historyItem.classList.add('loading-disabled');
              }
            });
            
            const response = await fetch(`${API_BASE_URL}/article/${articleId}/`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error ${response.status}`);
            }
            
            const resultData = await response.json();
            localStorage.setItem('analysisResults', JSON.stringify(resultData));
            navigateTo('ResultPage.html');
            
          } catch (error) {
            console.error('Error fetching article data:', error);
            
            // Reset loading states
            isAnyItemLoading = false;
            
            // Remove loading indicator from clicked item
            const loadingIndicator = item.querySelector('.loading-spinner');
            if (loadingIndicator) {
              loadingIndicator.remove();
            }
            
            // Make all items clickable again
            document.querySelectorAll('.history-item').forEach(historyItem => {
              historyItem.classList.remove('loading', 'loading-disabled');
            });
            
            alert('Failed to load article details.');
          }
        });

        // Create title
        const titleDiv = document.createElement('div');
        titleDiv.classList.add('history-title');
        titleDiv.textContent = search.title || 'Untitled Article';

        // Create URL
        const urlDiv = document.createElement('div');
        urlDiv.classList.add('history-url');
        urlDiv.textContent = search.url || '';

        // Create footer for date and score
        const footerDiv = document.createElement('div');
        footerDiv.classList.add('history-footer');

        const dateSpan = document.createElement('span');
        dateSpan.classList.add('history-date');
        dateSpan.textContent = formattedDate;

        const scoreDiv = document.createElement('div');
        scoreDiv.classList.add('history-score');
        
        // Ensure the score is properly formatted and displayed
        const rawScore = search.reliability_score || 0;
        // Convert to percentage if it's a decimal between 0-1
        const displayScore = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);
        scoreDiv.textContent = search.reliability_score ? displayScore : 'N/A';

        // Set background-color based on score thresholds
        if (displayScore >= 75) {
          scoreDiv.style.backgroundColor = 'var(--score-green)';
        } else if (displayScore >= 50) {
          scoreDiv.style.backgroundColor = 'var(--score-neutral)';
        } else {
          scoreDiv.style.backgroundColor = 'var(--score-red)';
        }

        footerDiv.appendChild(dateSpan);
        footerDiv.appendChild(scoreDiv);

        // Build the history item content
        item.appendChild(titleDiv);
        item.appendChild(urlDiv);
        item.appendChild(footerDiv);

        // Append the item to the history list
        historyList.appendChild(item);
      });
    } else {
      historyList.innerHTML = '<p>No search history found.</p>';
    }
  } catch (error) {
    console.error('Error fetching search history:', error);
    historyList.innerHTML = '<p>Error loading history.</p>';
  }
  
  // Function to scroll to last viewed article if exists
  const lastViewedId = localStorage.getItem('lastViewedArticleId');
  if (lastViewedId) {
    setTimeout(() => {
      const item = document.querySelector(`.history-item[data-id="${lastViewedId}"]`);
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        item.classList.add('highlight');
        setTimeout(() => item.classList.remove('highlight'), 2000);
      }
    }, 300);
  }
});