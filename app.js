/**
 * PWA Get Started - Main Application JavaScript
 * Vanilla JavaScript - No libraries required!
 */

// ============================================
// Service Worker Registration
// ============================================
async function registerServiceWorker() {
    const swIcon = document.getElementById('swIcon');
    const swTitle = document.getElementById('swTitle');
    const swStatus = document.getElementById('swStatus');
    const swDetails = document.getElementById('swDetails');

    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw-workbox.js', {
                scope: './'
            });

            console.log('ServiceWorker registration successful:', registration.scope);

            // Update UI
            swIcon.textContent = '✅';
            swTitle.textContent = 'Service Worker Active';
            swStatus.textContent = 'Your app can now work offline!';
            swDetails.textContent = `Scope: ${registration.scope}`;

            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('New service worker installing...');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('New content available, please refresh.');
                    }
                });
            });

            updateChecklistItem('check-sw', 'success', '✅');
            updateChecklistItem('check-offline', 'success', '✅');

        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
            swIcon.textContent = '❌';
            swTitle.textContent = 'Service Worker Failed';
            swStatus.textContent = error.message;
            updateChecklistItem('check-sw', 'error', '❌');
            updateChecklistItem('check-offline', 'error', '❌');
        }
    } else {
        swIcon.textContent = '⚠️';
        swTitle.textContent = 'Service Worker Not Supported';
        swStatus.textContent = 'Your browser does not support Service Workers';
        updateChecklistItem('check-sw', 'warning', '⚠️');
        updateChecklistItem('check-offline', 'warning', '⚠️');
    }
}

// ============================================
// PWA Install Prompt
// ============================================
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');
const installBtnAction = document.getElementById('installBtnAction');

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt fired');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install buttons
    if (installBtn) installBtn.style.display = 'inline-flex';
    if (installBtnAction) installBtnAction.style.display = 'inline-flex';
});

async function handleInstallClick() {
    if (!deferredPrompt) {
        console.log('No install prompt available');
        return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
    }
    
    deferredPrompt = null;
    if (installBtn) installBtn.style.display = 'none';
    if (installBtnAction) installBtnAction.style.display = 'none';
}

if (installBtn) {
    installBtn.addEventListener('click', handleInstallClick);
}
if (installBtnAction) {
    installBtnAction.addEventListener('click', handleInstallClick);
}

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
});

// ============================================
// Online/Offline Detection
// ============================================
const offlineToast = document.getElementById('offlineToast');
const onlineToast = document.getElementById('onlineToast');

function showToast(toast, duration = 4000) {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function updateOnlineStatus() {
    if (navigator.onLine) {
        showToast(onlineToast);
    } else {
        showToast(offlineToast);
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ============================================
// PWA Checklist Verification
// ============================================
function updateChecklistItem(id, status, icon) {
    const item = document.getElementById(id);
    if (item) {
        item.classList.remove('success', 'warning', 'error');
        item.classList.add(status);
        const iconEl = item.querySelector('.check-icon');
        if (iconEl) iconEl.textContent = icon;
    }
}

async function verifyPWAChecklist() {
    // Check HTTPS
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isSecure) {
        updateChecklistItem('check-https', 'success', '✅');
    } else {
        updateChecklistItem('check-https', 'warning', '⚠️');
    }

    // Check Manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        try {
            const response = await fetch(manifestLink.href);
            if (response.ok) {
                const manifest = await response.json();
                console.log('Manifest loaded:', manifest);
                updateChecklistItem('check-manifest', 'success', '✅');

                // Check Icons
                if (manifest.icons && manifest.icons.length >= 2) {
                    const has192 = manifest.icons.some(i => i.sizes && i.sizes.includes('192'));
                    const has512 = manifest.icons.some(i => i.sizes && i.sizes.includes('512'));
                    if (has192 && has512) {
                        updateChecklistItem('check-icons', 'success', '✅');
                    } else {
                        updateChecklistItem('check-icons', 'warning', '⚠️');
                    }
                } else {
                    updateChecklistItem('check-icons', 'warning', '⚠️');
                }
            } else {
                updateChecklistItem('check-manifest', 'error', '❌');
            }
        } catch (error) {
            console.error('Failed to fetch manifest:', error);
            updateChecklistItem('check-manifest', 'error', '❌');
        }
    } else {
        updateChecklistItem('check-manifest', 'error', '❌');
    }

    // Check Viewport
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta && viewportMeta.content.includes('width=device-width')) {
        updateChecklistItem('check-viewport', 'success', '✅');
    } else {
        updateChecklistItem('check-viewport', 'warning', '⚠️');
    }
}

// ============================================
// Interactive Property Highlighting
// ============================================
function setupPropertyHighlighting() {
    const properties = document.querySelectorAll('.property');
    const codeBlock = document.getElementById('manifestCode');
    
    properties.forEach(prop => {
        prop.addEventListener('mouseenter', () => {
            const propertyName = prop.dataset.property;
            // Add visual feedback
            prop.style.background = 'rgba(102, 126, 234, 0.3)';
        });
        
        prop.addEventListener('mouseleave', () => {
            prop.style.background = '';
        });
    });
}

// ============================================
// Smooth Scroll for Navigation
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
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

// ============================================
// Intersection Observer for Animations
// ============================================
function setupScrollAnimations() {
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

    // Observe all animated elements
    document.querySelectorAll('.card, .feature-item, .action-card, .property').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ============================================
// Initialize App
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 PWA Get Started Demo initialized');
    
    // Register Service Worker
    registerServiceWorker();
    
    // Verify PWA Checklist
    verifyPWAChecklist();
    
    // Setup interactive features
    setupPropertyHighlighting();
    setupScrollAnimations();
    
    // Log PWA display mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Running in standalone mode (installed PWA)');
    } else {
        console.log('Running in browser mode');
    }
});

// ============================================
// Debug: Log all PWA-related events
// ============================================
if (process?.env?.NODE_ENV === 'development' || location.hostname === 'localhost') {
    window.addEventListener('load', () => {
        console.log('Page fully loaded');
        console.log('Service Worker supported:', 'serviceWorker' in navigator);
        console.log('Push supported:', 'PushManager' in window);
        console.log('Notifications supported:', 'Notification' in window);
    });
}
