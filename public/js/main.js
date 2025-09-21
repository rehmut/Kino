
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/next-event')
        .then(response => response.json())
        .then(data => {
            const movieContainer = document.getElementById('movie-container');
            if (data.movieTitle) {
                const movieHTML = `
                    <h2>${data.movieTitle}</h2>
                    <a href="${data.letterboxdUrl}" target="_blank">
                        <img src="${data.posterUrl}" alt="${data.movieTitle} poster">
                    </a>
                    <p>Next event on: ${new Date(data.eventDate).toLocaleDateString()}</p>
                `;
                movieContainer.innerHTML = movieHTML;
            } else {
                movieContainer.innerHTML = '<p>No movie has been scheduled for the next event yet.</p>';
            }
        });
});
