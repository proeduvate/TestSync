// Form Validators

export const validators = {
    required: (value, fieldName = 'This field') => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return `${fieldName} is required`;
        }
        return null;
    },

    email: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
        }
        return null;
    },

    url: (value) => {
        if (!value) return null;
        try {
            new URL(value);
            return null;
        } catch {
            return 'Please enter a valid URL';
        }
    },

    minLength: (value, min) => {
        if (!value) return null;
        if (value.length < min) {
            return `Must be at least ${min} characters`;
        }
        return null;
    },

    maxLength: (value, max) => {
        if (!value) return null;
        if (value.length > max) {
            return `Must be no more than ${max} characters`;
        }
        return null;
    },

    password: (value) => {
        if (!value) return null;
        if (value.length < 8) {
            return 'Password must be at least 8 characters';
        }
        if (!/[A-Z]/.test(value)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(value)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(value)) {
            return 'Password must contain at least one number';
        }
        return null;
    },

    passwordMatch: (value, confirmValue) => {
        if (value !== confirmValue) {
            return 'Passwords do not match';
        }
        return null;
    },

    number: (value) => {
        if (!value) return null;
        if (isNaN(Number(value))) {
            return 'Must be a valid number';
        }
        return null;
    },

    min: (value, min) => {
        if (!value) return null;
        if (Number(value) < min) {
            return `Must be at least ${min}`;
        }
        return null;
    },

    max: (value, max) => {
        if (!value) return null;
        if (Number(value) > max) {
            return `Must be no more than ${max}`;
        }
        return null;
    },

    date: (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return 'Please enter a valid date';
        }
        return null;
    },

    futureDate: (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return 'Please enter a valid date';
        }
        if (date <= new Date()) {
            return 'Date must be in the future';
        }
        return null;
    },

    otp: (value) => {
        if (!value) return 'OTP is required';
        if (!/^\d{6}$/.test(value)) {
            return 'OTP must be 6 digits';
        }
        return null;
    },
};

// Validate form with multiple fields
export function validateForm(values, rules) {
    const errors = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
        for (const rule of fieldRules) {
            const error = rule(values[field], values);
            if (error) {
                errors[field] = error;
                break; // Stop at first error for this field
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

export default validators;
