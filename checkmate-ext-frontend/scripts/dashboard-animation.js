// Animate progress bar
setTimeout(() => {
    document.getElementById('usageBar').style.width = '70%';
}, 500);

// Initialize weekly chart
const ctx = document.getElementById('weeklyChart').getContext('2d');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Articles Analyzed',
            data: [45, 62, 28, 50, 75, 35, 40],
            backgroundColor: '#3cb371',
            borderRadius: 4,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    font: {
                        size: 10
                    }
                }
            },
            x: {
                ticks: {
                    font: {
                        size: 10
                    }
                }
            }
        },
        animation: {
            duration: 1500
        }
    }
});