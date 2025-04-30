// JavaScript for the Quiz module

document.addEventListener('DOMContentLoaded', function() {
    // Initialize quiz functionality
    initializeQuiz();
    
    // Initialize sliders for image editing questions
    if (document.getElementById('edit-preview')) {
        initializeImageEdit();
    }
    
    // Handle back button
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', function() {
            // Get current question ID from URL
            const currentPath = window.location.pathname;
            const currentId = parseInt(currentPath.split('/').pop());
            
            if (currentId > 1) {
                // Navigate to previous question
                window.location.href = `/quiz/${currentId - 1}`;
            }
        });
    }
});

// Initialize quiz functionality
function initializeQuiz() {
    // Handle multiple choice selection
    const optionCards = document.querySelectorAll('.option-card');
    optionCards.forEach(card => {
        card.addEventListener('click', function() {
            // Clear previous selections
            optionCards.forEach(c => c.classList.remove('selected'));
            
            // Select this option
            this.classList.add('selected');
            
            // Enable navigation buttons
            document.querySelectorAll('#next-question, #finish-quiz').forEach(btn => {
                btn.disabled = false;
            });
            
            // Save the answer
            const answer = this.getAttribute('data-value');
            saveAnswer(answer);
        });
    });
    
    // Handle navigation buttons
    const nextButton = document.getElementById('next-question');
    const finishButton = document.getElementById('finish-quiz');
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            if (!this.disabled) {
                // Get current question ID from URL
                const currentPath = window.location.pathname;
                const currentId = parseInt(currentPath.split('/').pop());
                
                // Navigate to next question
                window.location.href = `/quiz/${currentId + 1}`;
            }
        });
    }
    
    if (finishButton) {
        finishButton.addEventListener('click', function() {
            if (!this.disabled) {
                window.location.href = '/quiz/result';
            }
        });
    }
    
    // Check if user has previously answered this question
    checkPreviousAnswer();
}

// Check if the user has previously answered this question
function checkPreviousAnswer() {
    // Get current question ID from URL
    const currentPath = window.location.pathname;
    const currentId = parseInt(currentPath.split('/').pop());
    
    // Get answer from localStorage if exists
    const savedAnswer = localStorage.getItem(`quiz_${currentId}_answer`);
    
    if (savedAnswer) {
        // Select the previously chosen option
        const optionCard = document.querySelector(`.option-card[data-value="${savedAnswer}"]`);
        if (optionCard) {
            optionCard.classList.add('selected');
            
            // Enable navigation buttons
            document.querySelectorAll('#next-question, #finish-quiz').forEach(btn => {
                btn.disabled = false;
            });
        }
    }
}

// Initialize image editing functionality
function initializeImageEdit() {
    const sliders = document.querySelectorAll('.slider');
    const imagePreview = document.getElementById('edit-preview');
    const checkButton = document.getElementById('check-edit');
    const feedbackDiv = document.getElementById('edit-feedback');
    
    // Track if the user has made any adjustments
    let hasAdjusted = false;
    
    sliders.forEach(slider => {
        // Update image when slider moves
        slider.addEventListener('input', function() {
            applyImageEffects(imagePreview);
            hasAdjusted = true;
        });
    });
    
    // Handle check button click
    if (checkButton) {
        checkButton.addEventListener('click', function() {
            if (!hasAdjusted) {
                feedbackDiv.innerHTML = '<div class="alert alert-warning">Try adjusting at least one slider before checking.</div>';
                return;
            }
            
            // Collect all slider values
            const values = {};
            sliders.forEach(slider => {
                values[slider.id] = slider.value;
            });
            
            // Save the edit
            saveImageEdit(values, function(response) {
                // Check if edit matches target
                checkEditAccuracy(values);
                
                // Enable navigation buttons
                document.querySelectorAll('#next-question, #finish-quiz').forEach(btn => {
                    btn.disabled = false;
                });
            });
        });
    }
    
    // Load previously saved values if any
    loadSavedSliderValues();
    
    // Apply initial effects
    applyImageEffects(imagePreview);
}

// Load previously saved slider values
function loadSavedSliderValues() {
    // Get current question ID from URL
    const currentPath = window.location.pathname;
    const currentId = parseInt(currentPath.split('/').pop());
    
    const sliders = document.querySelectorAll('.slider');
    
    sliders.forEach(slider => {
        const sliderId = slider.id;
        const savedValue = localStorage.getItem(`quiz_${currentId}_${sliderId}`);
        
        if (savedValue) {
            slider.value = savedValue;
            
            // Enable navigation if previous values exist
            document.querySelectorAll('#next-question, #finish-quiz').forEach(btn => {
                btn.disabled = false;
            });
        }
    });
}

// Apply visual effects to the image based on slider values
function applyImageEffects(imageElement) {
    if (!imageElement) return;
    
    // Get all slider values
    const exposure = document.getElementById('quiz-exposure')?.value || 50;
    const contrast = document.getElementById('quiz-contrast')?.value || 50;
    const highlights = document.getElementById('quiz-highlights')?.value || 50;
    const shadows = document.getElementById('quiz-shadows')?.value || 50;
    const warmth = document.getElementById('quiz-warmth')?.value || 50;
    const tint = document.getElementById('quiz-tint')?.value || 50;
    const saturation = document.getElementById('quiz-saturation')?.value || 50;
    
    // These are simulated effects using CSS filters
    const brightness = mapValue(exposure, 0, 100, 0.5, 1.5);
    const contrastValue = mapValue(contrast, 0, 100, 0.8, 1.5);
    const saturationValue = mapValue(saturation, 0, 100, 0.2, 1.8);
    const warmthValue = mapValue(warmth, 0, 100, -20, 20);
    const tintValue = mapValue(tint, 0, 100, -20, 20);
    
    // Apply combined filters
    imageElement.style.filter = `
        brightness(${brightness})
        contrast(${contrastValue})
        saturate(${saturationValue})
        sepia(${warmthValue / 100})
    `;
    
    // Custom color overlay for tint (green to magenta)
    let tintOverlay = 'rgba(0, 0, 0, 0)';
    if (tintValue < 0) {
        // Green tint
        tintOverlay = `rgba(0, ${Math.abs(tintValue) * 5}, 0, 0.1)`;
    } else if (tintValue > 0) {
        // Magenta tint
        tintOverlay = `rgba(${tintValue * 5}, 0, ${tintValue * 5}, 0.1)`;
    }
    
    // Create an overlay effect for the tint
    imageElement.style.boxShadow = `inset 0 0 0 2000px ${tintOverlay}`;
}

// Map value from one range to another
function mapValue(value, fromLow, fromHigh, toLow, toHigh) {
    return toLow + (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow);
}

// Save multiple choice answer to backend
function saveAnswer(answer) {
    // Get current URL
    const url = window.location.pathname;
    const questionId = parseInt(url.split('/').pop());
    
    // Store in localStorage for persistence
    localStorage.setItem(`quiz_${questionId}_answer`, answer);
    
    // Send data to backend
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: `answer=${answer}&timestamp=${new Date().toISOString()}`
    })
    .then(response => response.json())
    .catch(error => console.error('Error saving answer:', error));
}

// Save image edit values to backend
function saveImageEdit(values, callback) {
    // Get current URL
    const url = window.location.pathname;
    const questionId = parseInt(url.split('/').pop());
    
    // Store in localStorage for persistence
    for (const [key, value] of Object.entries(values)) {
        localStorage.setItem(`quiz_${questionId}_${key}`, value);
    }
    
    // Convert values to form data
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
        formData.append(key, value);
    }
    formData.append('timestamp', new Date().toISOString());
    
    // Send data to backend
    fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (callback) callback(data);
    })
    .catch(error => console.error('Error saving image edit:', error));
}

// Check how close the edit is to the target
function checkEditAccuracy(values) {
    const feedbackDiv = document.getElementById('edit-feedback');
    
    // In a real app, this would compare the values to the target values
    // For this demo, we'll simulate checking with some feedback
    
    // Get the warmth value since it's key in the second quiz question
    const warmth = parseInt(values['quiz-warmth'] || 0);
    
    if (warmth >= 70) {
        // Success - warm enough
        feedbackDiv.innerHTML = '<div class="alert alert-success">Great job! Your edit matches the target image.</div>';
        return true;
    } else if (warmth >= 50) {
        // Getting close
        feedbackDiv.innerHTML = '<div class="alert alert-info">Getting closer! Hint: Try adjusting the warmth to make the image more golden.</div>';
        return false;
    } else {
        // Not close
        feedbackDiv.innerHTML = '<div class="alert alert-warning">Your edit needs more work. Hint: The target image has a much warmer tone.</div>';
        return false;
    }
}