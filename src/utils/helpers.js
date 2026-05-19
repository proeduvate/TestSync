// Helper utilities

// Format currency
export function formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Format credits
export function formatCredits(credits) {
    return `${credits.toLocaleString()} credits`;
}

// Format date
export function formatDate(dateString, options = {}) {
    const date = new Date(dateString);
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    };
    return date.toLocaleDateString('en-US', defaultOptions);
}

// Format relative time
export function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(dateString);
}

// Format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get initials from name
export function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Truncate text
export function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

// Calculate days remaining
export function getDaysRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Get deadline status
export function getDeadlineStatus(deadline) {
    const days = getDaysRemaining(deadline);
    if (days < 0) return { status: 'overdue', label: 'Overdue', color: 'danger' };
    if (days === 0) return { status: 'today', label: 'Due Today', color: 'warning' };
    if (days <= 3) return { status: 'urgent', label: `${days} days left`, color: 'warning' };
    return { status: 'normal', label: `${days} days left`, color: 'info' };
}

// Generate random ID
export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Calculate password strength
export function getPasswordStrength(password) {
    let score = 0;
    if (!password) return { score: 0, label: 'None', color: 'secondary' };

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'danger' };
    if (score <= 4) return { score, label: 'Fair', color: 'warning' };
    if (score <= 5) return { score, label: 'Good', color: 'info' };
    return { score, label: 'Strong', color: 'success' };
}

// Capitalize first letter
export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Convert kebab-case to Title Case
export function kebabToTitle(string) {
    return string
        .split('-')
        .map(word => capitalize(word))
        .join(' ');
}

// Clamp number between min and max
export function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
}

// Sleep utility for async operations
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
    formatCurrency,
    formatCredits,
    formatDate,
    formatRelativeTime,
    formatFileSize,
    getInitials,
    truncateText,
    getDaysRemaining,
    getDeadlineStatus,
    generateId,
    debounce,
    throttle,
    getPasswordStrength,
    capitalize,
    kebabToTitle,
    clamp,
    sleep,
};
