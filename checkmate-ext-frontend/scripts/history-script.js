// Language: JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const historyList = document.querySelector('.history-list');

    if (!token) {
      alert('User not authenticated');
      return;
    }

    try {
        console.debug('Fetching search history...');
      const response = await fetch('http://localhost:5000/user/searches', {
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

      // Clear any mock history items
      historyList.innerHTML = '';

      if (result.data && result.data.length > 0) {
        result.data.slice().reverse().forEach(search => {
          // Format date
          const dateObj = new Date(search.created_at);
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
                  minute: '2-digit',
                  second: '2-digit'
                });
          }

          // Create history item container
          const item = document.createElement('div');
          item.classList.add('history-item');
          item.addEventListener('click', async () => {
            const articleId = search.id;
            if (!articleId) {
              alert('Article ID not found.');
              return;
            }
          
            try {
              const response = await fetch(`http://localhost:5000/article/${articleId}/`, {
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
          scoreDiv.textContent = search.reliability_score ? Math.round(search.reliability_score) : 'N/A';

          // Set background-color based on score thresholds
          const score = search.reliability_score || 0;
          if (score >= 75) {
            scoreDiv.style.backgroundColor = 'var(--score-green)';
          } else if (score >= 50) {
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
});