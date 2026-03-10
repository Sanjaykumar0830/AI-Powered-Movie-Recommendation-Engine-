# CineMind 🎬

An AI-powered movie recommendation system that helps you discover your next favorite movie based on your preferences and ratings.

## Features

- 🎯 **AI-Powered Recommendations**: Uses cosine similarity and collaborative filtering to provide personalized movie suggestions
- 🎨 **Real Movie Posters**: Integrates with TMDB API to display authentic movie posters
- ⭐ **Interactive Rating System**: Rate movies you've watched to improve recommendations
- 📋 **Watchlist Management**: Save movies you want to watch later
- 🎭 **Genre Filtering**: Filter movies by genre (Action, Comedy, Drama, Sci-Fi, Thriller)
- 📊 **Match Score**: See how well each recommendation matches your preferences

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Machine Learning**: scikit-learn, pandas, numpy
- **Data Source**: MovieLens 20M Dataset
- **API Integration**: The Movie Database (TMDB) API

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)
- TMDB API Key (get one at [themoviedb.org](https://www.themoviedb.org/settings/api))

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cinemind
   ```

2. **Create a virtual environment** (recommended)
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install flask flask-cors pandas numpy scikit-learn requests
   ```

5. **Set up TMDB API Key**
   - Open `app.py`
   - Replace `TMDB_API_KEY` with your own API key (line 14)
   - Or create a `.env` file and load it using python-dotenv

6. **Download MovieLens Dataset** ⚠️ **REQUIRED**
   - The project uses the MovieLens 20M dataset (not included in repository due to size)
   - Download the dataset from: [MovieLens 20M Dataset](https://grouplens.org/datasets/movielens/20m/)
   - Extract the downloaded file and ensure the `ml-20m` folder is in the project root
   - Required CSV files:
     - `movie.csv`
     - `rating.csv` (~639 MB)
     - `link.csv`
     - `genome_scores.csv` (~193 MB) - optional but recommended
     - `genome_tags.csv` - optional
     - `tag.csv` - optional
   - **Note**: The dataset files are excluded from git via `.gitignore` due to their large size

## Usage

1. **Start the Flask server**
   ```bash
   python app.py
   ```

2. **Open your browser**
   - Navigate to `http://localhost:5000`
   - The server will start loading movie data and fetching posters (this may take 20-30 seconds on first run)

3. **Use the application**
   - **Rate Movies**: Go to the "Rate Movies" section and rate movies you've watched
   - **Get Recommendations**: Click "Get Recommendations" to see personalized suggestions
   - **View Watchlist**: Add movies to your watchlist from recommendations
   - **Filter by Genre**: Use genre filters to find movies in specific categories

## API Endpoints

- `GET /api/movies` - Get list of popular movies with posters
- `POST /api/recommend` - Get personalized movie recommendations
  - Body: `{"ratings": [{"movieId": 1, "rating": 5}, ...]}`
- `GET /api/health` - Health check endpoint

## Project Structure

```
cinemind/
├── app.py              # Flask backend application
├── index.html          # Frontend HTML
├── script.js           # Frontend JavaScript
├── style.css           # Frontend styles
├── data/               # Additional data files
│   └── movies.json
├── ml-20m/             # MovieLens dataset
│   ├── movie.csv
│   ├── rating.csv
│   ├── link.csv
│   └── ...
└── assets/             # Static assets
```

## How It Works

1. **Data Loading**: The application loads movie data from MovieLens dataset and filters for popular movies
2. **Poster Fetching**: For each movie, it fetches real posters from TMDB API
3. **Recommendation Engine**: 
   - Creates a user-item matrix from ratings
   - Calculates cosine similarity between movies
   - Generates personalized recommendations based on user ratings
4. **Frontend**: Displays movies with posters, allows rating, and shows recommendations

## Notes

- The application loads 500,000 ratings by default to optimize memory usage
- Only movies with valid TMDB posters are displayed
- Recommendations are limited to movies with posters for better user experience
- First run may take 20-30 seconds to fetch all movie posters

## Security Note

⚠️ **Important**: The TMDB API key is currently hardcoded in `app.py`. For production use, consider:
- Using environment variables
- Storing API keys in a `.env` file (and adding it to `.gitignore`)
- Using a secrets management service

## License

This project is for educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [MovieLens](https://grouplens.org/datasets/movielens/) for the dataset
- [The Movie Database (TMDB)](https://www.themoviedb.org/) for movie posters and metadata

