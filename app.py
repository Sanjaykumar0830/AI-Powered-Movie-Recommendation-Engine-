from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import os
import requests
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# TMDB Configuration
TMDB_API_KEY = "dccf3b5209cf3a4e3d5f6696b5f8eb42"
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w300"

print("🚀 Starting CineMind Backend - REAL POSTERS ONLY...")

# Load movie data
print("🔄 Loading movie data...")
movies_df = pd.read_csv('ml-20m/movie.csv')
links_df = pd.read_csv('ml-20m/link.csv')

# Load only 500,000 ratings to save memory
ratings_df = pd.read_csv('ml-20m/rating.csv', nrows=500000)

print(f"📊 Loaded {len(movies_df)} movies and {len(ratings_df)} ratings")

# Get popular movies for our catalog
movie_ratings = ratings_df.groupby('movieId')['rating'].agg(['mean', 'count'])
popular_movies = movie_ratings[movie_ratings['count'] > 100].nlargest(200, 'mean')

# Create movie catalog with TMDB IDs
catalog_movies = popular_movies.merge(movies_df, left_index=True, right_on='movieId')
catalog_movies = catalog_movies.merge(links_df, on='movieId', how='left')

print("🔄 Pre-fetching movie posters (this may take 20-30 seconds)...")

def clean_movie_title(title):
    """Clean movie title"""
    year = 2000
    
    # Extract year
    if '(' in title and title[-6:-1].isdigit():
        year = int(title[-6:-1])
        title = title[:-7].strip()
    
    # Clean title
    if '(' in title and ')' in title:
        main_title = title.split('(')[0].strip()
        if len(main_title) > 5:
            title = main_title
    
    return title, year

def get_movie_poster(tmdb_id, movie_title):
    """Get REAL movie poster from TMDB - returns None if no poster"""
    if not tmdb_id or pd.isna(tmdb_id):
        return None
    
    try:
        url = f"{TMDB_BASE_URL}/movie/{int(tmdb_id)}"
        params = {'api_key': TMDB_API_KEY}
        
        response = requests.get(url, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            poster_path = data.get('poster_path')
            
            if poster_path:
                return f"{TMDB_IMAGE_BASE_URL}{poster_path}"
        
        return None
        
    except Exception as e:
        print(f"⚠️ Failed to fetch poster for {movie_title}: {e}")
        return None

# Pre-fetch posters for all movies and filter only those with real posters
movies_with_posters = []
poster_cache = {}

for _, movie in catalog_movies.iterrows():
    tmdb_id = movie.get('tmdbId')
    if pd.notna(tmdb_id):
        poster_url = get_movie_poster(tmdb_id, movie['title'])
        if poster_url:
            title, year = clean_movie_title(movie['title'])
            movies_with_posters.append({
                'movie_data': movie,
                'title': title,
                'year': year,
                'poster': poster_url
            })
            poster_cache[int(movie['movieId'])] = poster_url

print(f"✅ Found {len(movies_with_posters)} movies with REAL posters")
print("🎬 Sample movies with posters:")
for movie in movies_with_posters[:5]:
    print(f"   - {movie['title']} ({movie['year']})")

# Build recommendation engine with movies that have posters
print("🔄 Building recommendation engine...")
try:
    # Filter ratings for movies with posters
    poster_movie_ids = {int(movie['movie_data']['movieId']) for movie in movies_with_posters}
    filtered_ratings = ratings_df[ratings_df['movieId'].isin(poster_movie_ids)]
    
    if len(filtered_ratings) > 0:
        # Create user-item matrix
        user_item_matrix = filtered_ratings.pivot_table(
            index='userId', 
            columns='movieId', 
            values='rating',
            fill_value=0
        )
        
        # Calculate similarities
        item_similarity = cosine_similarity(user_item_matrix.T)
        item_similarity_df = pd.DataFrame(
            item_similarity,
            index=user_item_matrix.columns,
            columns=user_item_matrix.columns
        )
        
        print("✅ AI Recommendation engine ready!")
        AI_ENGINE_READY = True
    else:
        print("⚠️ Not enough data for AI engine")
        AI_ENGINE_READY = False
    
except Exception as e:
    print(f"⚠️ AI engine failed: {e}")
    AI_ENGINE_READY = False

# Create a lookup for movie data by ID
movie_lookup = {int(movie['movie_data']['movieId']): movie for movie in movies_with_posters}

# Serve frontend
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# API Routes - REAL POSTERS ONLY
@app.route('/api/movies')
def get_movies():
    """Get ONLY movies that have REAL posters"""
    movies_list = []
    
    for movie_info in movies_with_posters[:50]:  # Limit to 50 for performance
        movie = movie_info['movie_data']
        genres = movie['genres'].split('|')
        
        movies_list.append({
            'id': int(movie['movieId']),
            'title': movie_info['title'],
            'year': movie_info['year'],
            'genres': genres,
            'rating': round(float(movie['mean']), 1),
            'poster': movie_info['poster'],  # REAL poster guaranteed
            'description': f"A highly rated {genres[0].lower()} movie from {movie_info['year']}.",
            'has_poster': True  # Flag to indicate real poster
        })
    
    print(f"🎯 Sending {len(movies_list)} movies with REAL posters to frontend")
    return jsonify({
        "status": "success",
        "count": len(movies_list),
        "movies": movies_list
    })

@app.route('/api/recommend', methods=['POST'])
def get_recommendations():
    """Get movie recommendations with REAL posters only"""
    user_ratings = request.json.get('ratings', [])
    
    if not user_ratings:
        return jsonify({"status": "error", "message": "No ratings provided"}), 400
    
    print(f"🎯 Generating recommendations for {len(user_ratings)} rated movies...")
    
    recommendations = []
    rated_ids = {r['movieId'] for r in user_ratings}
    
    if AI_ENGINE_READY and len(user_ratings) > 0:
        # AI-Powered Recommendations
        try:
            user_vector = np.zeros(len(item_similarity_df.columns))
            
            for rating in user_ratings:
                movie_id = rating['movieId']
                rating_value = rating['rating']
                
                if movie_id in item_similarity_df.columns:
                    idx = list(item_similarity_df.columns).index(movie_id)
                    user_vector[idx] = rating_value
            
            # Calculate scores
            similarity_scores = item_similarity_df.dot(user_vector)
            
            for movie_id, score in similarity_scores.items():
                if (movie_id not in rated_ids and 
                    score > 0 and 
                    movie_id in movie_lookup):
                    
                    movie_info = movie_lookup[movie_id]
                    movie = movie_info['movie_data']
                    genres = movie['genres'].split('|')
                    
                    match_score = min(95, max(60, int(score * 15 + 60)))
                    
                    recommendations.append({
                        'id': int(movie_id),
                        'title': movie_info['title'],
                        'year': movie_info['year'],
                        'genres': genres,
                        'poster': movie_info['poster'],  # REAL poster
                        'matchScore': match_score,
                        'description': f"AI recommendation. {match_score}% match.",
                        'has_poster': True
                    })
            
        except Exception as e:
            print(f"❌ AI engine error: {e}")
    
    # If we need more recommendations, add popular movies with posters
    if len(recommendations) < 10:
        user_genres = {}
        for rating in user_ratings:
            movie_id = rating['movieId']
            rating_val = rating['rating']
            if movie_id in movie_lookup:
                movie_info = movie_lookup[movie_id]
                movie = movie_info['movie_data']
                for genre in movie['genres'].split('|'):
                    user_genres[genre] = user_genres.get(genre, 0) + rating_val
        
        # Add popular movies that match user's genre preferences
        for movie_info in movies_with_posters:
            if (movie_info['movie_data']['movieId'] not in rated_ids and 
                len(recommendations) < 15 and
                not any(rec['id'] == movie_info['movie_data']['movieId'] for rec in recommendations)):
                
                movie = movie_info['movie_data']
                genres = movie['genres'].split('|')
                score = sum(user_genres.get(genre, 0) for genre in genres)
                
                if score > 0 or len(recommendations) < 5:
                    match_score = min(95, 70 + int(score)) if score > 0 else 75
                    
                    recommendations.append({
                        'id': int(movie['movieId']),
                        'title': movie_info['title'],
                        'year': movie_info['year'],
                        'genres': genres,
                        'poster': movie_info['poster'],  # REAL poster
                        'matchScore': match_score,
                        'description': f"Popular movie you might like. {match_score}% match.",
                        'has_poster': True
                    })
    
    recommendations.sort(key=lambda x: x['matchScore'], reverse=True)
    recommendations = recommendations[:15]
    
    print(f"✅ Generated {len(recommendations)} recommendations with REAL posters")
    return jsonify({
        "status": "success", 
        "engine": "AI" if AI_ENGINE_READY else "Popular",
        "recommendations": recommendations
    })

@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy", 
        "service": "CineMind",
        "ai_engine": AI_ENGINE_READY,
        "movies_with_posters": len(movies_with_posters),
        "total_movies_checked": len(catalog_movies)
    })

if __name__ == '__main__':
    print("🌐 CineMind - REAL MOVIE POSTERS ONLY")
    print("📡 Server: http://localhost:5000")
    print(f"🎬 {len(movies_with_posters)} movies with real posters ready!")
    print("❤️  Health: http://localhost:5000/api/health")
    app.run(debug=True, port=5000)