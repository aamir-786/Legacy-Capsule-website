// Global Variables
let cart = [];
let templates = [];
let bundles = [];
let isListening = false;
let recognition = null;

// API Base URL
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

// Stripe Configuration
const stripe = Stripe('pk_test_your_stripe_publishable_key_here'); // Replace with your actual publishable key

// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    loadTemplates();
    loadBundles();
    updateCartCount();
    initializeSpeechRecognition();
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('legacyCapsuleCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
        updateCartCount();
    }
    
    // Initialize animations
    initializeAnimations();
});

// Load Templates from API
async function loadTemplates() {
    try {
        const response = await fetch(`${API_BASE}/templates`);
        templates = await response.json();
        
        const templatesGrid = document.getElementById('templatesGrid');
        if (!templatesGrid) return;
        
        templatesGrid.innerHTML = templates.map(template => `
            <div class="template-card" data-category="${template.category}">
                <div class="template-image">
                    ${getTemplateIcon(template.category)}
                </div>
                <div class="template-content">
                    <h3>${template.name}</h3>
                    <p>${template.description}</p>
                    <div class="template-price">$${template.price}</div>
                    <div class="template-buttons">
                        <button class="btn view-sample-btn" onclick="viewSample('${template.id}')">
                            <i class="fas fa-eye"></i> View Sample
                        </button>
                        <button class="btn add-to-cart-btn" onclick="addToCart('${template.id}', 'template')">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading templates:', error);
        showNotification('Error loading templates', 'error');
    }
}

// Load Bundles from API
async function loadBundles() {
    try {
        const response = await fetch(`${API_BASE}/bundles`);
        bundles = await response.json();
        
        const bundlesGrid = document.getElementById('bundlesGrid');
        if (!bundlesGrid) return;
        
        bundlesGrid.innerHTML = bundles.map(bundle => `
            <div class="bundle-card ${bundle.id === 'family-legacy' ? 'featured' : ''}">
                <h3>${bundle.name}</h3>
                <div class="bundle-price">
                    <span class="original-price">$${bundle.originalPrice}</span>
                    <span class="sale-price">$${bundle.salePrice}</span>
                </div>
                <p>${bundle.description}</p>
                <ul class="bundle-features">
                    ${bundle.templates.map(templateId => {
                        const template = templates.find(t => t.id === templateId);
                        return template ? `<li><i class="fas fa-check"></i> ${template.name}</li>` : '';
                    }).join('')}
                </ul>
                <button class="btn btn-primary" onclick="addToCart('${bundle.id}', 'bundle')">
                    <i class="fas fa-shopping-bag"></i> Get Bundle
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading bundles:', error);
        showNotification('Error loading bundles', 'error');
    }
}

// Get template icon based on category
function getTemplateIcon(category) {
    const icons = {
        personal: '💝',
        celebration: '🎉',
        family: '👨‍👩‍👧‍👦',
        memorial: '🕊️',
        legal: '📋',
        default: '📄'
    };
    return icons[category] || icons.default;
}

// Cart Functions
function addToCart(itemId, itemType) {
    let item;
    
    if (itemType === 'template') {
        item = templates.find(t => t.id === itemId);
        if (!item) return;
        
        const existingItem = cart.find(cartItem => cartItem.id === itemId && cartItem.type === 'template');
        if (existingItem) {
            showNotification(`${item.name} is already in your cart!`, 'info');
            return;
        }
        
        cart.push({
            id: itemId,
            type: 'template',
            name: item.name,
            price: item.price,
            description: item.description
        });
    } else if (itemType === 'bundle') {
        item = bundles.find(b => b.id === itemId);
        if (!item) return;
        
        const existingItem = cart.find(cartItem => cartItem.id === itemId && cartItem.type === 'bundle');
        if (existingItem) {
            showNotification(`${item.name} is already in your cart!`, 'info');
            return;
        }
        
        cart.push({
            id: itemId,
            type: 'bundle',
            name: item.name,
            price: item.salePrice,
            description: item.description
        });
    }
    
    saveCart();
    updateCartDisplay();
    updateCartCount();
    showNotification(`${item.name} added to cart!`, 'success');
    
    // Add animation to cart icon
    const cartBtn = document.querySelector('.cart-btn');
    cartBtn.classList.add('bounce');
    setTimeout(() => cartBtn.classList.remove('bounce'), 600);
}

function removeFromCart(itemId, itemType) {
    const itemIndex = cart.findIndex(item => item.id === itemId && item.type === itemType);
    if (itemIndex > -1) {
        const removedItem = cart[itemIndex];
        cart.splice(itemIndex, 1);
        saveCart();
        updateCartDisplay();
        updateCartCount();
        showNotification(`${removedItem.name} removed from cart`, 'info');
    }
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
        cartCount.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems || !cartTotal) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '0.00';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">$${item.price}</div>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.id}', '${item.type}')" title="Remove item">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    cartTotal.textContent = total.toFixed(2);
}

function saveCart() {
    localStorage.setItem('legacyCapsuleCart', JSON.stringify(cart));
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('open');
    }
}

// Navigation Functions
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const hamburger = document.querySelector('.hamburger');
    
    if (navMenu && hamburger) {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        
        // Close mobile menu if open
        const navMenu = document.querySelector('.nav-menu');
        const hamburger = document.querySelector('.hamburger');
        if (navMenu && hamburger) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    }
}

// Template Functions
function viewSample(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (template) {
        showNotification(`Opening sample for ${template.name}...`, 'info');
        
        // In a real implementation, this would open a PDF viewer or modal
        setTimeout(() => {
            // Create a modal or new window to show PDF sample
            const sampleModal = document.createElement('div');
            sampleModal.className = 'modal show';
            sampleModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Sample: ${template.name}</h3>
                        <button class="close-modal" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>This is a preview of the ${template.name} template.</p>
                        <div style="background: #f8f9fa; padding: 2rem; border-radius: 8px; margin: 1rem 0;">
                            <h4>Template Features:</h4>
                            <ul>
                                ${template.fields.map(field => `<li>${field.replace('_', ' ').toUpperCase()}</li>`).join('')}
                            </ul>
                        </div>
                        <p><em>The actual PDF will be fully customizable with your content, images, audio, and video.</em></p>
                        <button class="btn btn-primary" onclick="addToCart('${template.id}', 'template'); this.closest('.modal').remove();">
                            Add to Cart - $${template.price}
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(sampleModal);
        }, 500);
    }
}

// Custom Form Functions
document.getElementById('customForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        templateType: formData.get('templateType'),
        notes: formData.get('notes')
    };
    
    // Validate form
    if (!data.name || !data.email || !data.notes) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Handle file uploads
    const files = formData.get('files');
    let uploadedFiles = [];
    
    if (files && files.size > 0) {
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('files', files);
            uploadFormData.append('userId', 'temp-' + Date.now());
            
            const uploadResponse = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: uploadFormData
            });
            
            if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                uploadedFiles = uploadResult.files;
            }
        } catch (error) {
            console.error('File upload error:', error);
        }
    }
    
    // Submit quote request
    try {
        showNotification('Submitting your custom request...', 'info');
        
        const response = await fetch(`${API_BASE}/custom-quote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                files: uploadedFiles
            })
        });
        
        if (response.ok) {
            showNotification('Thank you! We will contact you within 24 hours with a custom quote.', 'success');
            e.target.reset();
        } else {
            throw new Error('Failed to submit request');
        }
    } catch (error) {
        console.error('Quote request error:', error);
        showNotification('Error submitting request. Please try again.', 'error');
    }
});

// Modal Functions
function showQuoteModal() {
    const modal = document.getElementById('quoteModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeQuoteModal() {
    const modal = document.getElementById('quoteModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showResellerModal() {
    const modal = document.getElementById('resellerModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeResellerModal() {
    const modal = document.getElementById('resellerModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Reseller Program
function joinResellerProgram() {
    showResellerModal();
}

// Handle reseller form submission
document.getElementById('resellerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        package: formData.get('package'),
        experience: formData.get('experience')
    };
    
    if (!data.name || !data.email || !data.package) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        showNotification('Submitting your application...', 'info');
        
        const response = await fetch(`${API_BASE}/reseller-signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showNotification('Application submitted successfully! We will review and contact you soon.', 'success');
            e.target.reset();
            closeResellerModal();
        } else {
            throw new Error('Failed to submit application');
        }
    } catch (error) {
        console.error('Reseller application error:', error);
        showNotification('Error submitting application. Please try again.', 'error');
    }
});

// Music Upload
function handleMusicUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('audio/')) {
        showNotification('Please select an audio file', 'error');
        return;
    }
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
        showNotification('File size must be less than 50MB', 'error');
        return;
    }
    
    const uploadedMusic = document.getElementById('uploadedMusic');
    const musicPlayer = document.getElementById('musicPlayer');
    
    if (uploadedMusic && musicPlayer) {
        uploadedMusic.style.display = 'block';
        
        // Create audio element
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.style.width = '100%';
        
        // Create object URL for the file
        const url = URL.createObjectURL(file);
        audio.src = url;
        
        musicPlayer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <i class="fas fa-music" style="color: #ff9a9e; font-size: 1.5rem;"></i>
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${file.name}</div>
                    <div style="font-size: 0.9rem; color: #666;">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button class="btn btn-secondary" onclick="saveAudioToTemplate('${file.name}', '${url}')">
                    <i class="fas fa-plus"></i> Add to Template
                </button>
            </div>
            <div>
                ${audio.outerHTML}
            </div>
        `;
        
        showNotification(`Audio file "${file.name}" uploaded successfully!`, 'success');
    }
}

function saveAudioToTemplate(filename, url) {
    // Store audio file reference for later use in PDF generation
    const audioData = {
        filename,
        url,
        timestamp: Date.now()
    };
    
    localStorage.setItem('uploadedAudio', JSON.stringify(audioData));
    showNotification('Audio saved! It will be included in your next PDF purchase.', 'success');
}

// Speech Recognition / AI Dictation
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isListening = true;
            showNotification('Listening... Speak now!', 'info');
            updateDictationButton();
        };
        
        recognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            const dictationText = document.getElementById('dictationText');
            if (dictationText) {
                dictationText.value = finalTranscript + interimTranscript;
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            showNotification('Speech recognition error: ' + event.error, 'error');
            isListening = false;
            updateDictationButton();
        };
        
        recognition.onend = function() {
            isListening = false;
            updateDictationButton();
            showNotification('Dictation stopped', 'info');
        };
    } else {
        console.warn('Speech recognition not supported');
    }
}

function startDictation() {
    if (!recognition) {
        showNotification('Speech recognition not supported in your browser', 'error');
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        const dictationOutput = document.getElementById('dictationOutput');
        if (dictationOutput) {
            dictationOutput.style.display = 'block';
        }
        recognition.start();
    }
}

function updateDictationButton() {
    const dictationBtn = document.querySelector('[onclick="startDictation()"]');
    if (dictationBtn) {
        if (isListening) {
            dictationBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Dictating';
            dictationBtn.classList.add('btn-secondary');
            dictationBtn.classList.remove('btn-primary');
        } else {
            dictationBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Dictating';
            dictationBtn.classList.add('btn-primary');
            dictationBtn.classList.remove('btn-secondary');
        }
    }
}

function addDictationToTemplate() {
    const dictationText = document.getElementById('dictationText');
    if (dictationText && dictationText.value.trim()) {
        // Store dictated text for later use in PDF generation
        const dictationData = {
            text: dictationText.value.trim(),
            timestamp: Date.now()
        };
        
        localStorage.setItem('dictatedText', JSON.stringify(dictationData));
        showNotification('Dictated text saved! It will be included in your next PDF purchase.', 'success');
        
        // Clear the text area
        dictationText.value = '';
        document.getElementById('dictationOutput').style.display = 'none';
    } else {
        showNotification('No text to add. Please dictate some content first.', 'warning');
    }
}

// FAQ Functions
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Checkout Function with Stripe Integration
async function goToCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    try {
        showNotification('Redirecting to secure checkout...', 'info');
        
        // Prepare customization data
        const customization = {
            dictatedText: JSON.parse(localStorage.getItem('dictatedText') || 'null'),
            uploadedAudio: JSON.parse(localStorage.getItem('uploadedAudio') || 'null'),
            timestamp: Date.now()
        };
        
        // Create Stripe checkout session
        const response = await fetch(`${API_BASE}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: cart,
                customization
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }
        
        const { sessionId } = await response.json();
        
        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId
        });
        
        if (error) {
            throw error;
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('Checkout error: ' + error.message, 'error');
        
        // Fallback: Show what would happen in a real implementation
        const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
        setTimeout(() => {
            alert(`Checkout Summary:\n\nItems: ${cart.length}\nTotal: $${total.toFixed(2)}\n\nIn a real implementation, you would be redirected to Stripe Checkout for secure payment processing.\n\nAfter payment, you would receive download links for your customized PDFs.`);
        }, 1000);
    }
}

// Handle successful payment (would be called from success page)
async function handlePaymentSuccess(sessionId) {
    try {
        // Generate PDFs for purchased items
        for (const item of cart) {
            if (item.type === 'template') {
                const response = await fetch(`${API_BASE}/generate-pdf`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        templateId: item.id,
                        customization: {
                            dictatedText: JSON.parse(localStorage.getItem('dictatedText') || 'null'),
                            uploadedAudio: JSON.parse(localStorage.getItem('uploadedAudio') || 'null')
                        },
                        sessionId
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    showNotification(`${item.name} is ready for download!`, 'success');
                    
                    // Create download link
                    const downloadLink = document.createElement('a');
                    downloadLink.href = result.downloadUrl;
                    downloadLink.download = result.filename;
                    downloadLink.click();
                }
            }
        }
        
        // Clear cart after successful purchase
        cart = [];
        saveCart();
        updateCartDisplay();
        updateCartCount();
        
        // Clear stored customization data
        localStorage.removeItem('dictatedText');
        localStorage.removeItem('uploadedAudio');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDFs. Please contact support.', 'error');
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1003;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#10b981';
        case 'error': return '#ef4444';
        case 'warning': return '#f59e0b';
        default: return '#3b82f6';
    }
}

// Animation Functions
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .template-card, .bundle-card, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(255, 154, 158, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Close cart when clicking outside
document.addEventListener('click', function(e) {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartBtn = document.querySelector('.cart-btn');
    
    if (cartSidebar && cartSidebar.classList.contains('open')) {
        if (!cartSidebar.contains(e.target) && !cartBtn.contains(e.target)) {
            cartSidebar.classList.remove('open');
        }
    }
});

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    // Close cart with Escape key
    if (e.key === 'Escape') {
        const cartSidebar = document.getElementById('cartSidebar');
        const modals = document.querySelectorAll('.modal.show');
        
        if (cartSidebar && cartSidebar.classList.contains('open')) {
            cartSidebar.classList.remove('open');
        }
        
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        
        // Stop dictation if active
        if (isListening && recognition) {
            recognition.stop();
        }
    }
});

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateForm(formData) {
    const errors = [];
    
    if (!formData.name || formData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!formData.email || !validateEmail(formData.email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!formData.notes || formData.notes.trim().length < 10) {
        errors.push('Description must be at least 10 characters long');
    }
    
    return errors;
}

// Initialize tooltips and other interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Add loading states to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.classList.contains('loading') && !this.onclick?.toString().includes('toggle')) {
                this.classList.add('loading');
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 1000);
            }
        });
    });
    
    // Add bounce animation to cart icon
    const style = document.createElement('style');
    style.textContent = `
        .bounce {
            animation: bounce 0.6s ease;
        }
        
        @keyframes bounce {
            0%, 20%, 60%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            80% { transform: translateY(-5px); }
        }
    `;
    document.head.appendChild(style);
});

// Performance optimization: Lazy load images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', lazyLoadImages);

// Error handling for API calls
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('An error occurred. Please try again.', 'error');
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}