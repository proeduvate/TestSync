import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { tasksAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { BsCurrencyRupee } from 'react-icons/bs';
import { FiGlobe, FiCalendar, FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi';
import './CreateTask.css';

const testTypes = [
    { id: 'functional', name: 'Functional Testing', description: 'Verify features work as expected' },
    { id: 'usability', name: 'Usability Testing', description: 'Evaluate user experience and interface' },
    { id: 'security', name: 'Security Testing', description: 'Identify vulnerabilities and security flaws' },
    { id: 'performance', name: 'Performance Testing', description: 'Test speed, scalability, and stability' },
    { id: 'accessibility', name: 'Accessibility Testing', description: 'Ensure compliance with a11y standards' },
    { id: 'compatibility', name: 'Compatibility Testing', description: 'Test across browsers and devices' },
];

const testingLevels = [
    { id: 'basic', name: 'Basic', description: 'General functional testing', creditMultiplier: 1 },
    { id: 'intermediate', name: 'Intermediate', description: 'Detailed testing with edge cases', creditMultiplier: 1.5 },
    { id: 'expert', name: 'Expert', description: 'In-depth testing with security focus', creditMultiplier: 2 },
];

function CreateTask() {
    const navigate = useNavigate();
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        appUrl: '',
        appName: '',
        description: '',
        testingLevel: 'intermediate',
        selectedTestTypes: [],
        deadline: '',
        requiredTesters: 3,
    });
    const [errors, setErrors] = useState({});

    const steps = [
        { id: 1, title: 'App Details', icon: FiGlobe },
        { id: 2, title: 'Testing Options', icon: FiCheck },
        { id: 3, title: 'Budget & Deadline', icon: BsCurrencyRupee },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleTestTypeToggle = (typeId) => {
        setFormData(prev => ({
            ...prev,
            selectedTestTypes: prev.selectedTestTypes.includes(typeId)
                ? prev.selectedTestTypes.filter(t => t !== typeId)
                : [...prev.selectedTestTypes, typeId],
        }));
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!formData.appUrl) newErrors.appUrl = 'App URL is required';
            else if (!/^https?:\/\/.+/.test(formData.appUrl)) {
                newErrors.appUrl = 'Please enter a valid URL';
            }
            if (!formData.appName) newErrors.appName = 'App name is required';
        }

        if (step === 2) {
            if (formData.selectedTestTypes.length === 0) {
                newErrors.testTypes = 'Select at least one test type';
            }
        }

        if (step === 3) {
            if (!formData.deadline) {
                newErrors.deadline = 'Deadline is required';
            } else if (new Date(formData.deadline) <= new Date()) {
                newErrors.deadline = 'Deadline must be in the future';
            }
            if (!formData.requiredTesters || formData.requiredTesters < 1) {
                newErrors.requiredTesters = 'At least 1 tester is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(3)) return;

        setIsLoading(true);
        // Simulate delay before redirecting to payment
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);

        navigate('/developer/payments', {
            state: {
                task: { ...formData, budget: calculatedBudget },
                amount: calculatedBudget * 1.1 // Include platform fee
            }
        });
    };

    const selectedLevel = testingLevels.find(l => l.id === formData.testingLevel);

    const calculateBudget = () => {
        const baseTesterCost = 500 + (formData.selectedTestTypes.length * 50);
        const levelMultiplier = selectedLevel?.creditMultiplier || 1;
        const costPerTester = baseTesterCost * levelMultiplier;
        return costPerTester * formData.requiredTesters;
    };

    const calculatedBudget = calculateBudget();

    return (
        <div className="create-task-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <FiArrowLeft size={18} />
                    <span>Back</span>
                </button>
                <div>
                    <h1 className="page-title">Create Testing Task</h1>
                    <p className="page-subtitle">Post a new task for testers to complete</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="steps-container">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`step ${currentStep >= step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                    >
                        <div className="step-indicator">
                            {currentStep > step.id ? <FiCheck size={18} /> : <step.icon size={18} />}
                        </div>
                        <span className="step-title">{step.title}</span>
                        {index < steps.length - 1 && <div className="step-connector" />}
                    </div>
                ))}
            </div>

            {/* Form Card */}
            <div className="card form-card">
                {/* Step 1: App Details */}
                {currentStep === 1 && (
                    <div className="form-step">
                        <h3 className="step-heading">App/Website Details</h3>
                        <p className="step-description">Provide information about what you want tested.</p>

                        <div className="form-group">
                            <label className="form-label">App/Website URL *</label>
                            <div className="input-with-icon">
                                <FiGlobe className="input-icon" />
                                <input
                                    type="url"
                                    name="appUrl"
                                    className={`form-input ${errors.appUrl ? 'error' : ''}`}
                                    placeholder="https://example.com"
                                    value={formData.appUrl}
                                    onChange={handleChange}
                                />
                            </div>
                            {errors.appUrl && <p className="form-error">{errors.appUrl}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">App/Website Name *</label>
                            <input
                                type="text"
                                name="appName"
                                className={`form-input ${errors.appName ? 'error' : ''}`}
                                placeholder="My Awesome App"
                                value={formData.appName}
                                onChange={handleChange}
                            />
                            {errors.appName && <p className="form-error">{errors.appName}</p>}
                        </div>


                    </div>
                )}

                {/* Step 2: Testing Options */}
                {currentStep === 2 && (
                    <div className="form-step">
                        <h3 className="step-heading">Testing Options</h3>
                        <p className="step-description">Choose the testing level and types you need.</p>

                        <div className="form-group">
                            <label className="form-label">Testing Level</label>
                            <div className="level-selector">
                                {testingLevels.map(level => (
                                    <label
                                        key={level.id}
                                        className={`level-option ${formData.testingLevel === level.id ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="testingLevel"
                                            value={level.id}
                                            checked={formData.testingLevel === level.id}
                                            onChange={handleChange}
                                        />
                                        <div className="level-card">
                                            <span className="level-name">{level.name}</span>
                                            <span className="level-desc">{level.description}</span>
                                            <span className="level-multiplier">{level.creditMultiplier}x credits</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Test Types *</label>
                            {errors.testTypes && <p className="form-error">{errors.testTypes}</p>}
                            <div className="test-types-grid">
                                {testTypes.map(type => (
                                    <label
                                        key={type.id}
                                        className={`test-type-option ${formData.selectedTestTypes.includes(type.id) ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.selectedTestTypes.includes(type.id)}
                                            onChange={() => handleTestTypeToggle(type.id)}
                                        />
                                        <div className="test-type-content">
                                            <span className="test-type-name">{type.name}</span>
                                            <span className="test-type-desc">{type.description}</span>
                                        </div>
                                        <span className="test-type-check">
                                            <FiCheck size={16} />
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 'var(--space-6)' }}>
                            <label className="form-label">Specific Testing Instructions (Optional)</label>
                            <textarea
                                name="description"
                                className="form-input form-textarea"
                                placeholder="E.g., Please focus on the checkout flow, test on slow network, look for UI glitches on mobile, etc."
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                            />
                        </div>
                    </div>
                )}

                {/* Step 3: Budget & Deadline */}
                {currentStep === 3 && (
                    <div className="form-step">
                        <h3 className="step-heading">Budget & Deadline</h3>
                        <p className="step-description">Set your budget and project timeline.</p>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Number of Testers *</label>
                                <input
                                    type="number"
                                    name="requiredTesters"
                                    className={`form-input ${errors.requiredTesters ? 'error' : ''}`}
                                    placeholder="3"
                                    min="1"
                                    max="50"
                                    value={formData.requiredTesters}
                                    onChange={handleChange}
                                />
                                {errors.requiredTesters && <p className="form-error">{errors.requiredTesters}</p>}
                                <p className="form-hint">Total testers needed for this project.</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Deadline *</label>
                            <div className="input-with-icon">
                                <FiCalendar className="input-icon" />
                                <input
                                    type="date"
                                    name="deadline"
                                    className={`form-input ${errors.deadline ? 'error' : ''}`}
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            {errors.deadline && <p className="form-error">{errors.deadline}</p>}
                        </div>

                        {/* Summary */}
                        <div className="task-summary">
                            <h4>Task Summary</h4>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <span className="summary-label">App</span>
                                    <span className="summary-value">{formData.appName}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Testing Level</span>
                                    <span className="summary-value">{selectedLevel?.name}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Test Types</span>
                                    <span className="summary-value">{formData.selectedTestTypes.length} selected</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Target Testers</span>
                                    <span className="summary-value">{formData.requiredTesters} testers</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Calculated Budget</span>
                                    <span className="summary-value">{formatCurrency(calculatedBudget)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Platform Fee (10%)</span>
                                    <span className="summary-value">{formatCurrency(calculatedBudget * 0.1)}</span>
                                </div>
                                <div className="summary-item total">
                                    <span className="summary-label">Total Amount</span>
                                    <span className="summary-value">{formatCurrency(calculatedBudget * 1.1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                    {currentStep > 1 && (
                        <Button variant="secondary" onClick={handleBack}>
                            <FiArrowLeft size={16} />
                            Back
                        </Button>
                    )}
                    <div className="form-actions-right">
                        {currentStep < 3 ? (
                            <Button variant="primary" onClick={handleNext}>
                                Continue
                                <FiArrowRight size={16} />
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
                                Proceed to Payment
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateTask;
