// Main Application
class CineMind {
    constructor() {
        this.movies = [];
        this.userRatings = new Map();
        this.watchlist = new Set();
        this.recommendations = [];
        this.currentSection = 'home';
        
        this.init();
    }
    
    async init() {
        await this.loadMovies();
        this.setupEventListeners();
        this.renderMoviesToRate();
        this.loadWatchlistFromStorage();
    }
    
    // Load movie data
async loadMovies() {
    try {
        console.log("🔄 Loading movies...");
        
        // Simple call to the main endpoint
        const response = await fetch('/api/movies');
        const data = await response.json();
        
        if (data.status === 'success') {
            this.movies = data.movies;
            console.log(`✅ Loaded ${this.movies.length} movies WITH IMAGES`);
            
            // Render immediately - all movies have images!
            this.renderMoviesToRate();
            
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('❌ Loading failed:', error);
        console.log('🔄 Using sample movies...');
        
        // Fallback to sample data
        this.movies = await this.generateSampleMovies();
        this.renderMoviesToRate();
    }
}

// REMOVE the loadPostersInBackground() function - not needed anymore

    // Generate sample movie data (replace with actual data loading)
    generateSampleMovies() {
        return new Promise((resolve) => {
            const sampleMovies = [
                {
                    id: 1,
                    title: "The Matrix",
                    year: 1999,
                    genres: ["Action", "Sci-Fi"],
                    rating: 8.7,
                    poster: "https://via.placeholder.com/300x450/333/fff?text=The+Matrix",
                    description: "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers."
                },
                {
                    id: 2,
                    title: "Inception",
                    year: 2010,
                    genres: ["Action", "Sci-Fi", "Thriller"],
                    rating: 8.8,
                    poster: "https://via.placeholder.com/300x450/333/fff?text=Inception",
                    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O."
                },
                {
                    id: 3,
                    
                    title: "The Shawshank Redemption",
                    year: 1994,
                    genres: ["Drama"],
                    rating: 9.3,
                    poster: "https://via.placeholder.com/300x450/333/fff?text=Shawshank",
                    description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency."
                },
                {
                    id: 4,
                    title: "Pulp Fiction",
                    year: 1994,
                    genres: ["Crime", "Drama"],
                    rating: 8.9,
                    poster: "https://via.placeholder.com/300x450/333/fff?text=Pulp+Fiction",
                    description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption."
                },
                {
                    id: 5,
                    title: "The Dark Knight",
                    year: 2008,
                    genres: ["Action", "Crime", "Drama"],
                    rating: 9.0,
                    poster: "https://via.placeholder.com/300x450/333/fff?text=Dark+Knight",
                    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice."
                },
                {
                    id: 6,
                    title: "Forrest Gump",
                    year: 1994,
                    genres: ["Drama", "Romance"],
                    rating: 8.8,
                    poster: "https://via.placeholder.com/300x450/333/fff?text=Forrest+Gump",
                    description: "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75."
                },
                {
                    id: 7,
                    title: "The Godfather",
                    year: 1972,
                    genres: ["Crime", "Drama"],
                    rating: 9.2,
                    poster: "https://via.placeholder.com/300x450/333/fff?text=Godfather",
                    description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son."
                },
                {
                    id: 8,
                    title: "Fight Club",
                    year: 1999,
                    genres: ["Drama"],
                    rating: 8.8,
                    poster: "https://via.placeholder.com/300x450/333/fff?text=Fight+Club",
                    description: "An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more."
                }
            ];
            
            // Add more sample movies to reach ~50 for better recommendations
            for (let i = 9; i <= 50; i++) {
                const genres = [["Action", "Sci-Fi"], ["Comedy"], ["Drama", "Romance"], ["Thriller", "Mystery"], ["Horror"]];
                const randomGenres = genres[Math.floor(Math.random() * genres.length)];
                
                sampleMovies.push({
                    id: i,
                    title: `Sample Movie ${i}`,
                    year: 2000 + Math.floor(Math.random() * 23),
                    genres: randomGenres,
                    rating: (Math.random() * 3 + 7).toFixed(1),
                    poster: `https://via.placeholder.com/300x450/333/fff?text=Movie+${i}`,
                    description: `This is a sample description for Movie ${i}. In a real application, this would be loaded from a movie database.`
                });
            }
            
            resolve(sampleMovies);
        });
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });
        
        // Genre filter
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterMoviesByGenre(e.target.dataset.genre);
            });
        });
        
        // Get recommendations button
        document.getElementById('get-recommendations').addEventListener('click', () => {
            this.generateRecommendations();
            this.showSection('recommendations');
        });
        
        // Sort options
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.sortRecommendations(e.target.value);
        });
        
        // Modal close
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeMovieModal();
        });
        
        // Close modal when clicking outside
        document.getElementById('movie-modal').addEventListener('click', (e) => {
            if (e.target.id === 'movie-modal') {
                this.closeMovieModal();
            }
        });
    }
    
    // Show/hide sections
    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(sectionId).classList.add('active');
        this.currentSection = sectionId;
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
        
        // Render specific content
        if (sectionId === 'watchlist') {
            this.renderWatchlist();
        }
    }
    
    // Render movies for rating
    renderMoviesToRate() {
        const container = document.getElementById('movies-to-rate');
        container.innerHTML = '';
        
        // Show first 20 movies for rating
        const moviesToShow = this.movies.slice(0, 20);
        
        moviesToShow.forEach(movie => {
            const movieElement = this.createMovieCard(movie, 'rate');
            container.appendChild(movieElement);
        });
    }
    
    // Filter movies by genre
    filterMoviesByGenre(genre) {
        const container = document.getElementById('movies-to-rate');
        const allMovies = container.querySelectorAll('.movie-card');
        
        allMovies.forEach(card => {
            const movieGenres = card.dataset.genres.split(',');
            
            if (genre === 'all' || movieGenres.includes(genre)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Create movie card element
    createMovieCard(movie, context) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.id = movie.id;
        card.dataset.genres = movie.genres.join(',');
        
        let matchScore = '';
        if (context === 'recommendations' && movie.matchScore) {
            matchScore = `<div class="match-score">${movie.matchScore}%</div>`;
        }
        
        let actions = '';
        if (context === 'rate') {
            const userRating = this.userRatings.get(movie.id) || 0;
            actions = `
                <div class="star-rating">
                    ${[1, 2, 3, 4, 5].map(star => `
                        <span class="star ${star <= userRating ? 'active' : ''}" 
                              data-rating="${star}" 
                              data-movie="${movie.id}">★</span>
                    `).join('')}
                </div>
            `;
        } else {
            const inWatchlist = this.watchlist.has(movie.id);
            actions = `
                <div class="movie-actions">
                    <button class="primary-btn ${inWatchlist ? 'remove-watchlist' : 'add-watchlist'}" 
                            data-movie="${movie.id}">
                        ${inWatchlist ? 'Remove' : 'Watchlist'}
                    </button>
                    <button class="secondary-btn view-details" data-movie="${movie.id}">Details</button>
                </div>
            `;
        }
        
        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" class="movie-poster">
            ${matchScore}
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-year">${movie.year}</div>
                <div class="movie-genres">
                    ${movie.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                </div>
                ${actions}
            </div>
        `;
        
        // Add event listeners
        if (context === 'rate') {
            card.querySelectorAll('.star').forEach(star => {
                star.addEventListener('click', (e) => {
                    const rating = parseInt(e.target.dataset.rating);
                    const movieId = parseInt(e.target.dataset.movie);
                    this.rateMovie(movieId, rating, e.target);
                });
            });
        } else {
            card.querySelector('.add-watchlist, .remove-watchlist').addEventListener('click', (e) => {
                const movieId = parseInt(e.target.dataset.movie);
                this.toggleWatchlist(movieId, e.target);
            });
            
            card.querySelector('.view-details').addEventListener('click', (e) => {
                const movieId = parseInt(e.target.dataset.movie);
                this.showMovieDetails(movieId);
            });
        }
        
        return card;
    }
    
    // Rate a movie
    rateMovie(movieId, rating, starElement) {
        this.userRatings.set(movieId, rating);
        
        // Update star display
        const stars = starElement.parentElement.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
        
        console.log(`Rated movie ${movieId} with ${rating} stars`);
    }
    
    // Generate recommendations using collaborative filtering simulation
async generateRecommendations() {
    if (this.userRatings.size === 0) {
        alert('Please rate at least one movie to get recommendations!');
        return;
    }
    
    // Show loading
    this.showLoading();
    
    try {
        // Prepare ratings for backend
        const ratingsArray = [];
        this.userRatings.forEach((rating, movieId) => {
            ratingsArray.push({
                movieId: movieId,
                rating: rating
            });
        });
        
        // Send to Flask backend
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ratings: ratingsArray })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            this.recommendations = data.recommendations;
            console.log(`✅ Got ${this.recommendations.length} recommendations from AI`);
            this.renderRecommendations();
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('❌ Backend recommendation failed:', error);
        alert('Using fallback recommendations...');
        
        // Fallback to local recommendations
        this.generateLocalRecommendations();
    }
}

// Add loading function
showLoading() {
    const container = document.getElementById('recommended-movies');
    container.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 3rem;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #e50914; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 1rem; color: #a3a3a3;">AI is finding your perfect movies...</p>
        </div>
    `;
}
    
    // Render recommendations
    renderRecommendations() {
        const container = document.getElementById('recommended-movies');
        container.innerHTML = '';
        
        if (this.recommendations.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No recommendations found</h3><p>Try rating more movies to get better recommendations</p></div>';
            return;
        }
        
        this.recommendations.forEach(movie => {
            const movieElement = this.createMovieCard(movie, 'recommendations');
            container.appendChild(movieElement);
        });
    }
    
    // Sort recommendations
    sortRecommendations(criteria) {
        switch (criteria) {
            case 'rating':
                this.recommendations.sort((a, b) => b.rating - a.rating);
                break;
            case 'year':
                this.recommendations.sort((a, b) => b.year - a.year);
                break;
            case 'match':
            default:
                this.recommendations.sort((a, b) => b.matchScore - a.matchScore);
                break;
        }
        
        this.renderRecommendations();
    }
    
    // Toggle watchlist
    toggleWatchlist(movieId, buttonElement) {
        if (this.watchlist.has(movieId)) {
            this.watchlist.delete(movieId);
            buttonElement.textContent = 'Watchlist';
            buttonElement.classList.remove('remove-watchlist');
            buttonElement.classList.add('add-watchlist');
        } else {
            this.watchlist.add(movieId);
            buttonElement.textContent = 'Remove';
            buttonElement.classList.remove('add-watchlist');
            buttonElement.classList.add('remove-watchlist');
        }
        
        this.saveWatchlistToStorage();
        
        // Update watchlist section if visible
        if (this.currentSection === 'watchlist') {
            this.renderWatchlist();
        }
    }
    
    // Render watchlist
    renderWatchlist() {
        const container = document.getElementById('watchlist-movies');
        const emptyState = document.getElementById('empty-watchlist');
        
        if (this.watchlist.size === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'grid';
        emptyState.style.display = 'none';
        container.innerHTML = '';
        
        this.watchlist.forEach(movieId => {
            const movie = this.movies.find(m => m.id === movieId);
            if (movie) {
                const movieElement = this.createMovieCard(movie, 'watchlist');
                container.appendChild(movieElement);
            }
        });
    }
    
    // Show movie details in modal
    showMovieDetails(movieId) {
        const movie = this.movies.find(m => m.id === movieId);
        if (!movie) return;
        
        const modal = document.getElementById('movie-modal');
        const detailsContainer = document.getElementById('movie-details');
        
        const inWatchlist = this.watchlist.has(movieId);
        
        detailsContainer.innerHTML = `
            <div class="movie-detail-header" style="display: flex; gap: 2rem; margin-bottom: 2rem;">
                <img src="${movie.poster}" alt="${movie.title}" style="width: 300px; height: 450px; object-fit: cover; border-radius: 10px;">
                <div style="flex: 1;">
                    <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">${movie.title} (${movie.year})</h2>
                    <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                        <div class="rating-badge" style="background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600;">
                            ⭐ ${movie.rating}/10
                        </div>
                        <button class="primary-btn ${inWatchlist ? 'remove-watchlist' : 'add-watchlist'}" 
                                data-movie="${movie.id}" 
                                style="padding: 0.5rem 1.5rem;">
                            ${inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        </button>
                    </div>
                    <div class="movie-genres" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                        ${movie.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                    </div>
                    <p style="line-height: 1.6; color: var(--text);">${movie.description}</p>
                </div>
            </div>
        `;
        
        // Add event listener to watchlist button in modal
        detailsContainer.querySelector('.add-watchlist, .remove-watchlist').addEventListener('click', (e) => {
            const movieId = parseInt(e.target.dataset.movie);
            this.toggleWatchlist(movieId, e.target);
        });
        
        modal.style.display = 'block';
    }
    
    // Close movie modal
    closeMovieModal() {
        document.getElementById('movie-modal').style.display = 'none';
    }
    
    // Save watchlist to localStorage
    saveWatchlistToStorage() {
        localStorage.setItem('cinemind-watchlist', JSON.stringify([...this.watchlist]));
    }
    
    // Load watchlist from localStorage
    loadWatchlistFromStorage() {
        const saved = localStorage.getItem('cinemind-watchlist');
        if (saved) {
            this.watchlist = new Set(JSON.parse(saved));
        }
    }
}

// Global function to show sections (for HTML onclick)
function showSection(sectionId) {
    if (window.cineMindApp) {
        window.cineMindApp.showSection(sectionId);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cineMindApp = new CineMind();
});