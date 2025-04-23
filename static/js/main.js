// Main JavaScript for the ColorCorrect app

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add active class to current navigation item
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        
        if (
            (currentPath === '/' && linkPath === '/') ||
            (currentPath.includes('/learn') && linkPath.includes('/learn')) ||
            (currentPath.includes('/quiz') && linkPath.includes('/quiz'))
        ) {
            link.classList.add('active');
            link.style.color = '#0d6efd';
        }
    });
});

// General utility functions
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error retrieving from localStorage:', error);
        return null;
    }
}

// Handle form submissions with AJAX
function setupFormHandlers() {
    const forms = document.querySelectorAll('form[data-ajax="true"]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const formData = new FormData(form);
            const url = form.getAttribute('action');
            const method = form.getAttribute('method') || 'POST';
            
            fetch(url, {
                method: method,
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                // Handle the response
                if (data.redirect) {
                    window.location.href = data.redirect;
                }
                
                if (data.message) {
                    showMessage(data.message, data.status || 'info');
                }
                
                // Custom callback if defined
                const callback = form.getAttribute('data-callback');
                if (callback && window[callback]) {
                    window[callback](data);
                }
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                showMessage('There was an error submitting the form. Please try again.', 'error');
            });
        });
    });
}

// Simple message display
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    
    if (!messageContainer) {
        // Create message container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'message-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    messageElement.innerHTML = message;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');
    messageElement.appendChild(closeButton);
    
    document.getElementById('message-container').appendChild(messageElement);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupFormHandlers();
});