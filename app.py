from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import json
import os
import datetime
from datetime import timedelta

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this in production
app.permanent_session_lifetime = timedelta(days=1)  # Set session expiration

# Load JSON data
def load_json(filename):
    with open(os.path.join('data', filename), 'r') as f:
        return json.load(f)

@app.route('/')
def home():
    # Reset session data when user starts
    session.clear()
    session.permanent = True  # Make session persistent
    
    # Store starting timestamp
    session['start_time'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    return render_template('home.html')

@app.route('/learn/<int:lesson_id>')
def learn(lesson_id):
    # Record when user enters this page with timestamp
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    session[f'learn_{lesson_id}_time'] = timestamp
    
    # Calculate time spent on previous lesson if applicable
    if lesson_id > 1 and f'learn_{lesson_id-1}_time' in session:
        prev_time = datetime.datetime.strptime(session[f'learn_{lesson_id-1}_time'], "%Y-%m-%d %H:%M:%S")
        current_time = datetime.datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        time_spent = (current_time - prev_time).total_seconds()
        session[f'learn_{lesson_id-1}_duration'] = time_spent
    
    # Load learning content
    try:
        learn_content = load_json('learn_content.json')
        
        # Make sure lesson_id is valid
        if lesson_id < 1 or lesson_id > len(learn_content):
            return "Lesson not found", 404
            
        content = learn_content[lesson_id - 1]
        
        # Check if this is the last page
        is_last = (lesson_id == len(learn_content))
        
        return render_template('learn.html', 
                               content=content, 
                               lesson_id=lesson_id,
                               next_id=lesson_id + 1,
                               prev_id=lesson_id - 1,
                               is_last=is_last,
                               total_lessons=len(learn_content))
    except Exception as e:
        return str(e), 500

@app.route('/quiz/<int:question_id>', methods=['GET', 'POST'])
def quiz(question_id):
    # Record when user enters this page
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    session[f'quiz_{question_id}_time'] = timestamp
    
    # Calculate time spent on previous question if applicable
    if question_id > 1 and f'quiz_{question_id-1}_time' in session:
        prev_time = datetime.datetime.strptime(session[f'quiz_{question_id-1}_time'], "%Y-%m-%d %H:%M:%S")
        current_time = datetime.datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        time_spent = (current_time - prev_time).total_seconds()
        session[f'quiz_{question_id-1}_duration'] = time_spent
    
    if request.method == 'POST':
        # Store the user's answer
        answer = request.form.get('answer')
        if answer:
            session[f'quiz_{question_id}_answer'] = answer
        
        # Store any slider values if applicable
        for key in request.form:
            if key.startswith('quiz-'):
                session[key] = request.form[key]
        
        return jsonify({'status': 'success'})
    
    # Load quiz content
    try:
        quiz_content = load_json('quiz_content.json')
        
        # Make sure question_id is valid
        if question_id < 1 or question_id > len(quiz_content):
            return "Question not found", 404
            
        question = quiz_content[question_id - 1]
        
        # Check if this is the last question
        is_last = (question_id == len(quiz_content))
        
        return render_template('quiz.html', 
                               question=question, 
                               question_id=question_id,
                               next_id=question_id + 1,
                               prev_id=question_id - 1,
                               is_last=is_last,
                               total_questions=len(quiz_content))
    except Exception as e:
        return str(e), 500

@app.route('/quiz/result')
def quiz_result():
    # Record completion time for the last question
    if session.get('quiz_5_time'):  # Assuming 5 is the last question
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prev_time = datetime.datetime.strptime(session['quiz_5_time'], "%Y-%m-%d %H:%M:%S")
        current_time = datetime.datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        time_spent = (current_time - prev_time).total_seconds()
        session['quiz_5_duration'] = time_spent
    
    # Calculate score based on stored answers
    quiz_content = load_json('quiz_content.json')
    total_questions = len(quiz_content)
    correct_answers = 0
    
    # Store question details for the results page
    question_results = []
    
    for i, question in enumerate(quiz_content):
        question_id = i + 1
        user_answer = session.get(f'quiz_{question_id}_answer')
        is_correct = False
        
        if user_answer and user_answer == question.get('correct_answer'):
            correct_answers += 1
            is_correct = True
        
        # Calculate time spent on this question
        time_spent = session.get(f'quiz_{question_id}_duration')
        time_spent_str = f"{time_spent:.1f} seconds" if time_spent else "N/A"
        
        question_results.append({
            'id': question_id,
            'question': question.get('question_text'),
            'user_answer': user_answer,
            'correct_answer': question.get('correct_answer'),
            'is_correct': is_correct,
            'time_spent': time_spent_str
        })
    
    score = int((correct_answers / total_questions) * 100)
    
    # Calculate total time spent on quiz
    total_time = 0
    for i in range(1, total_questions + 1):
        time_spent = session.get(f'quiz_{i}_duration')
        if time_spent:
            total_time += time_spent
    
    # Format total time
    minutes = int(total_time // 60)
    seconds = int(total_time % 60)
    total_time_formatted = f"{minutes} minutes, {seconds} seconds"
    
    # Calculate time spent on learning
    learn_content = load_json('learn_content.json')
    total_learn_time = 0
    for i in range(1, len(learn_content) + 1):
        time_spent = session.get(f'learn_{i}_duration')
        if time_spent:
            total_learn_time += time_spent
    
    minutes = int(total_learn_time // 60)
    seconds = int(total_learn_time % 60)
    total_learn_time_formatted = f"{minutes} minutes, {seconds} seconds"
    
    return render_template('quiz_result.html', 
                           score=score,
                           correct=correct_answers,
                           total=total_questions,
                           question_results=question_results,
                           total_time=total_time_formatted,
                           total_learn_time=total_learn_time_formatted)

@app.route('/save_edit', methods=['POST'])
def save_edit():
    # Save the user's edit settings (slider values)
    for key in request.form:
        if key.startswith('slider_'):
            session[key] = request.form[key]
    
    return jsonify({'status': 'success'})

@app.route('/user_stats')
def user_stats():
    """View for admin to see user statistics (for demo purposes)"""
    stats = {}
    
    # Get all session data
    for key in session:
        stats[key] = session[key]
    
    return render_template('user_stats.html', stats=stats)

if __name__ == '__main__':
    app.run(debug=True)