import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { supportAPI } from '../../services/api';
import { useToast } from './Toast';
import './HelpModal.css';

function HelpModal({ isOpen, onClose }) {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('general');
    const [isLoading, setIsLoading] = useState(false);
    const { success, error } = useToast();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!subject || !message) {
            error('Missing Information', 'Please fill in all required fields.');
            return;
        }

        setIsLoading(true);
        try {
            await supportAPI.createTicket({ subject, message, category });
            success('Request Sent', 'Your query has been submitted to the administrator.');
            setSubject('');
            setMessage('');
            setCategory('general');
            onClose();
        } catch (err) {
            error('Submission Failed', err.message || 'Failed to send request');
        } finally {
            setIsLoading(false);
        }
    };

    const footer = (
        <div className="help-modal-footer">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
                Send Request
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Need Help?"
            footer={footer}
            size="md"
        >
            <form className="help-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="category" className="form-label">Category</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="form-input select-input"
                    >
                        <option value="general">General Query</option>
                        <option value="bug">Report a Bug</option>
                        <option value="billing">Billing/Credits Issue</option>
                        <option value="account">Account Support</option>
                        <option value="feature">Feature Request</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="subject" className="form-label">Subject</label>
                    <input
                        type="text"
                        id="subject"
                        placeholder="Briefly describe your issue"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="message" className="form-label">Message</label>
                    <textarea
                        id="message"
                        placeholder="Provide more details about your concern..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="form-input textarea-input"
                        rows="5"
                        required
                    />
                </div>
            </form>
        </Modal>
    );
}

export default HelpModal;
