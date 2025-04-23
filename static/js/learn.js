// JavaScript for the Learning module

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the sliders
    initializeSliders();
    
    // Handle next button click
    const nextButton = document.querySelector('.btn-primary');
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            // Save the current state before navigating
            saveCurrentState();
        });
    }
});

// Initialize sliders with event listeners
function initializeSliders() {
    const sliders = document.querySelectorAll('.slider');
    const imagePreview = document.querySelector('.image-preview');
    
    sliders.forEach(slider => {
        // Update visual feedback when slider moves
        slider.addEventListener('input', function() {
            applyImageEffects(imagePreview);
            
            // Show a visual indicator of which slider is being adjusted
            highlightSliderLabel(this);
        });
        
        // Save the value when user stops adjusting
        slider.addEventListener('change', function() {
            saveSliderValue(this.id, this.value);
        });
    });
    
    // Apply initial effects
    applyImageEffects(imagePreview);
}

// Highlight the label of the slider being adjusted
function highlightSliderLabel(slider) {
    // Reset all labels
    document.querySelectorAll('.form-label').forEach(label => {
        label.style.fontWeight = 'normal';
        label.style.color = '';
    });
    
    // Highlight the current label
    const label = document.querySelector(`label[for="${slider.id}"]`);
    if (label) {
        label.style.fontWeight = 'bold';
        label.style.color = '#0d6efd';
    }
}

// Apply visual effects to the image based on slider values
function applyImageEffects(imageElement) {
    if (!imageElement) return;
    
    // Get all slider values
    const exposure = document.getElementById('exposure').value;
    const contrast = document.getElementById('contrast').value;
    const highlights = document.getElementById('highlights').value;
    const shadows = document.getElementById('shadows').value;
    const warmth = document.getElementById('warmth').value;
    const tint = document.getElementById('tint').value;
    const saturation = document.getElementById('saturation').value;
    
    // These are simulated effects using CSS filters
    // In a real app, these would be more sophisticated
    const brightness = mapValue(exposure, 0, 100, 0.5, 1.5);
    const contrastValue = mapValue(contrast, 0, 100, 0.8, 1.5);
    const highlightsValue = mapValue(highlights, 0, 100, 0.8, 1.2);
    const shadowsValue = mapValue(shadows, 0, 100, 0.8, 1.2);
    const warmthValue = mapValue(warmth, 0, 100, -20, 20);
    const tintValue = mapValue(tint, 0, 100, -20, 20);
    const saturationValue = mapValue(saturation, 0, 100, 0.2, 1.8);
    
    // Apply combined filters
    imageElement.style.filter = `
        brightness(${brightness})
        contrast(${contrastValue})
        saturate(${saturationValue})
        sepia(${warmthValue / 100})
    `;
    
    // Custom color overlay for tint (green to magenta)
    // This is a simplified effect for demonstration
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

// Save slider value to backend
function saveSliderValue(sliderId, value) {
    // Send data to backend
    fetch('/save_edit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: `slider_${sliderId}=${value}&timestamp=${new Date().toISOString()}`
    })
    .then(response => response.json())
    .catch(error => console.error('Error saving slider value:', error));
}

// Save current state before navigating
function saveCurrentState() {
    const sliders = document.querySelectorAll('.slider');
    const data = {};
    
    sliders.forEach(slider => {
        data[`slider_${slider.id}`] = slider.value;
    });
    
    data.timestamp = new Date().toISOString();
    
    // Use navigator.sendBeacon for reliable data sending during page navigation
    const formData = new URLSearchParams(data).toString();
    navigator.sendBeacon('/save_edit', formData);
}