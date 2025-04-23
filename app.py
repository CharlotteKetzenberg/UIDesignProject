from flask import Flask, render_template, request, jsonify, session
import json
import os
import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this in production

# Load JSON data
def load_json(filename):
    with open(os.path.join('data', filename), 'r') as f:
        return json.load(f)

@app.route('/')
def home():
    # Reset session data when user starts
    session.clear()
    return render_template('home.html')

@app.route('/learn/<int:lesson_id>')
def learn(lesson_id):
    # Record when user enters this page
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    session[f'learn_{lesson_id}_time'] = timestamp
    
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
                               is_last=is_last)
    except Exception as e:
        return str(e), 500

@app.route('/quiz/<int:question_id>', methods=['GET', 'POST'])
def quiz(question_id):
    # Record when user enters this page
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    session[f'quiz_{question_id}_time'] = timestamp
    
    if request.method == 'POST':
        # Store the user's answer
        answer = request.form.get('answer')
        session[f'quiz_{question_id}_answer'] = answer
        
        # Store any slider values if applicable
        for key in request.form:
            if key.startswith('slider_'):
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
                               is_last=is_last)
    except Exception as e:
        return str(e), 500

@app.route('/quiz/result')
def quiz_result():
    # Calculate score based on stored answers
    quiz_content = load_json('quiz_content.json')
    total_questions = len(quiz_content)
    correct_answers = 0
    
    for i, question in enumerate(quiz_content):
        user_answer = session.get(f'quiz_{i+1}_answer')
        if user_answer and user_answer == question.get('correct_answer'):
            correct_answers += 1
    
    score = int((correct_answers / total_questions) * 100)
    
    return render_template('quiz_result.html', 
                           score=score,
                           correct=correct_answers,
                           total=total_questions)

@app.route('/save_edit', methods=['POST'])
def save_edit():
    # Save the user's edit settings (slider values)
    for key in request.form:
        if key.startswith('slider_'):
            session[key] = request.form[key]
    
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)