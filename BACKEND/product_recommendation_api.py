from flask import Flask, request, jsonify
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# Hard-coded variable to store the logged-in user ID
logged_in_user_id = None

# Load user data
users_df = pd.read_csv('users_india_dynamic_multifestival.csv')
users_df['CustomerID'] = users_df['CustomerID'].astype(str).str.strip()  # Convert to string and strip spaces

def safe_eval(value):
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return parsed
        else:
            return [parsed]
    except json.JSONDecodeError:
        return [item.strip() for item in value.split(',')]

users_df['Preferred Categories'] = users_df['Preferred Categories'].apply(safe_eval)
users_df['Favorite Brands'] = users_df['Favorite Brands'].apply(safe_eval)

# Load product data
products_df = pd.read_csv('products_realistic_season_balanced.csv')

# Preprocess text data
def preprocess(text):
    return text.lower().replace(",", "").strip()

products_df['Features'] = (
    products_df['Category'].apply(preprocess) + ' ' +
    products_df['Brand'].apply(preprocess) + ' ' +
    products_df['ProductFeatures'].apply(preprocess)
)

users_df['Preferred Categories'] = users_df['Preferred Categories'].apply(lambda x: [preprocess(item) for item in x])
users_df['Favorite Brands'] = users_df['Favorite Brands'].apply(lambda x: [preprocess(item) for item in x])

# Create TF-IDF matrix for products
tfidf_vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf_vectorizer.fit_transform(products_df['Features'])

def get_user_preferences(user_id):
    user_id = str(user_id).strip()  # Ensure user_id is a string and strip spaces
    user_row = users_df[users_df['CustomerID'] == user_id]
    if user_row.empty:
        raise ValueError(f"User ID {user_id} not found in the dataset.")
    return user_row[['Preferred Categories', 'Favorite Brands']].iloc[0]

@app.route('/user-recommendations', methods=['GET'])
def user_recommendations():
    user_id = logged_in_user_id
    if not user_id:
        return jsonify({'error': 'User not logged in'}), 401

    num_recommendations = int(request.args.get('num_recommendations', 4))
    offset = int(request.args.get('offset', 0))

    recommendations = recommend_products_for_user(user_id, num_recommendations, offset)
    recommended_products = products_df[products_df['ProductID'].isin(recommendations)]
    return jsonify(recommended_products[['ProductID', 'Category', 'Brand', 'ProductFeatures', 'Price (INR)']].to_dict(orient='records'))

# Track recommended products for each user
user_recommendation_history = {}

def recommend_products_for_user(user_id, num_recommendations, offset):
    try:
        user_preferences = get_user_preferences(user_id)
        user_features = ' '.join(user_preferences['Preferred Categories'] + user_preferences['Favorite Brands'])
        user_tfidf = tfidf_vectorizer.transform([user_features])
        similarities = linear_kernel(user_tfidf, tfidf_matrix).flatten()

        if all(s == 0 for s in similarities):
            return products_df.sample(n=num_recommendations)['ProductID'].tolist()

        # Apply offset to get new recommendations
        top_indices = similarities.argsort()[::-1]

        # Track recommended products for the user
        if user_id not in user_recommendation_history:
            user_recommendation_history[user_id] = set()

        recommended_products = []
        for idx in top_indices:
            if idx not in user_recommendation_history[user_id]:
                recommended_products.append(idx)
                user_recommendation_history[user_id].add(idx)
                if len(recommended_products) >= num_recommendations:
                    break

        return products_df.iloc[recommended_products]['ProductID'].tolist()
    except ValueError as e:
        print(e)
        return []


# API endpoint to get product recommendations based on product similarity
@app.route('/recommend', methods=['GET'])
def recommend():
    product_id = request.args.get('product_id')
    recommendations = get_recommendations(product_id)
    return jsonify(recommendations)

# Function to get recommendations based on product similarity
def get_recommendations(product_id):
    try:
        idx = products_df[products_df['ProductID'] == product_id].index[0]
        sim_scores = list(enumerate(linear_kernel(tfidf_matrix[idx], tfidf_matrix).flatten()))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        sim_scores = sim_scores[1:6]  # Top 5 recommendations
        product_indices = [i[0] for i in sim_scores]
        return products_df.iloc[product_indices][['ProductID', 'Category', 'Brand', 'ProductFeatures', 'Price (INR)']].to_dict(orient='records')
    except IndexError:
        return []

# API endpoint to get all products
@app.route('/products', methods=['GET'])
def get_products():
    offset = int(request.args.get('offset', 0))
    limit = int(request.args.get('limit', 8))
    # Return the subset of products based on offset and limit
    return jsonify(products_df.iloc[offset:offset+limit][['ProductID', 'Category', 'Brand', 'ProductFeatures', 'Price (INR)']].to_dict(orient='records'))

# Add login endpoint
@app.route('/login', methods=['POST'])
def login():
    global logged_in_user_id
    data = request.get_json()
    user_id = data.get('userId')
    password = data.get('password')

    # Check if user exists
    user_exists = str(user_id).strip() in users_df['CustomerID'].values

    if user_exists and password == "users":
        logged_in_user_id = user_id  # Store user ID in the global variable
        return jsonify({'valid': True})
    else:
        return jsonify({'valid': False})

# Add logout endpoint
@app.route('/logout', methods=['POST'])
def logout():
    global logged_in_user_id
    logged_in_user_id = None  # Clear user ID from the global variable
    return jsonify({'success': True})

# API endpoint to check if user is logged in
@app.route('/check-login', methods=['GET'])
def check_login():
    if logged_in_user_id:
        return jsonify({'logged_in': True, 'userId': logged_in_user_id})
    else:
        return jsonify({'logged_in': False})
    
# API for seasonal recommendations
@app.route('/season-recommendations', methods=['GET'])
def season_recommendations():
    season = request.args.get('season')
    offset = request.args.get('offset', default=0, type=int)
    limit = request.args.get('limit', default=8, type=int)

    if not season:
        return jsonify({'error': 'Season is required'}), 400

    recommendations = recommend_season_products(season, offset, limit)
    return jsonify(recommendations)

# Preprocess 'Seasons' column
products_df['SeasonList'] = products_df['Seasons'].apply(lambda x: [season.strip().lower() for season in x.split(',')])

# TF-IDF Vectorization on Product Features for seasonal recommendation
season_vectorizer = TfidfVectorizer(stop_words='english')
season_tfidf_matrix = season_vectorizer.fit_transform(products_df['ProductFeatures'])

# Recommend products for a given season using linear_kernel
def recommend_season_products(season, offset=0, limit=8):
    season = season.lower()
    season_products = products_df[products_df['SeasonList'].apply(lambda x: season in x)].copy()

    if season_products.empty:
        season_products = products_df.copy()

    season_vector = season_vectorizer.transform([season])
    season_products['TextSimilarity'] = linear_kernel(season_vector, season_tfidf_matrix[season_products.index]).flatten()
    
    # Sort based on similarity & price
    season_products = season_products.sort_values(by=["TextSimilarity", "Price (INR)"], ascending=[False, True])

    # Apply offset and limit for pagination
    paginated_products = season_products.iloc[offset: offset + limit]

    return paginated_products.to_dict(orient='records')

if __name__ == '__main__':
    app.run(debug=True)
