import sqlite3
from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os

app = Flask(__name__)

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')


# Initialize DB (IMPORTANT for Render)
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS wishes
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  message TEXT NOT NULL,
                  emoji TEXT,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()


# HOME PAGE
@app.route('/')
def index():
    return render_template('index.html')


# GET ALL WISHES
@app.route('/api/wishes', methods=['GET'])
def get_wishes():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, message, emoji, timestamp FROM wishes ORDER BY timestamp DESC")
    
    wishes = []
    for row in c.fetchall():
        wishes.append({
            'id': row[0],
            'name': row[1],
            'message': row[2],
            'emoji': row[3],
            'timestamp': row[4]
        })
    
    conn.close()
    return jsonify(wishes)


# DELETE WISH
@app.route('/api/wishes/<int:wish_id>', methods=['DELETE'])
def delete_wish(wish_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM wishes WHERE id = ?", (wish_id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})


# ADD WISH
@app.route('/api/wishes', methods=['POST'])
def add_wish():
    data = request.json

    name = data.get('name')
    message = data.get('message')
    emoji = data.get('emoji', '')

    if not name or not message:
        return jsonify({'error': 'Name and message are required'}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO wishes (name, message, emoji) VALUES (?, ?, ?)",
        (name, message, emoji)
    )
    conn.commit()
    conn.close()

    return jsonify({'status': 'success'})


# ✅ IMPORTANT: Always initialize DB (Render fix)
init_db()

@app.route('/')
def index():
    return "WORKING DA 🔥"