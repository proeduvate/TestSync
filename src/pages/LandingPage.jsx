import { BsCurrencyRupee } from 'react-icons/bs';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiZap, FiArrowRight, FiCheck, FiCode, FiSearch, FiClipboard, FiMessageSquare, FiShield, FiUsers, FiStar, FiTrendingUp, FiMail, FiPhone, FiMapPin, FiSend, FiMenu, FiX, FiChevronDown, FiPlay, FiAward, FiTarget, FiLayers, FiBarChart2, FiGlobe } from 'react-icons/fi';
import './LandingPage.css';

/* ─── Intersection Observer hook for scroll animations ─── */
function useInView(options = {}) {
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
            { threshold: 0.15, ...options }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, isInView];
}

/* ─── Animated counter ─── */
function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0);
    const [ref, inView] = useInView();
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [inView, end, duration]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Data ─── */
const NAV_LINKS = [
    { label: 'About', href: '#about' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Services', href: '#services' },
    { label: 'Contact', href: '#contact' },
];

const STATS = [
    { value: 2500, suffix: '+', label: 'Active Testers', icon: <FiUsers /> },
    { value: 15000, suffix: '+', label: 'Bugs Caught', icon: <FiTarget /> },
    { value: 98, suffix: '%', label: 'Client Satisfaction', icon: <FiStar /> },
    { value: 500, suffix: '+', label: 'Projects Delivered', icon: <FiTrendingUp /> },
];

const HOW_IT_WORKS = [
    {
        step: '01',
        title: 'Create Your Task',
        desc: 'Developers describe the software, define testing parameters, and set a budget for the testing engagement.',
        icon: <FiClipboard />,
    },
    {
        step: '02',
        title: 'Testers Pick It Up',
        desc: 'Qualified testers browse the marketplace, claim tasks matching their expertise, and start testing immediately.',
        icon: <FiSearch />,
    },
    {
        step: '03',
        title: 'Submit Feedback',
        desc: 'Testers submit detailed bug reports, screenshots, and improvement suggestions through an intuitive interface.',
        icon: <FiMessageSquare />,
    },
    {
        step: '04',
        title: 'Review & Pay',
        desc: 'Developers review the feedback, approve results, and testers receive payment through the integrated wallet.',
        icon: <BsCurrencyRupee />,
    },
];

const SERVICES = [
    {
        icon: <FiCode />,
        title: 'Functional Testing',
        desc: 'Verify every feature works as intended across all user flows and edge cases.',
        color: 'var(--primary-500)',
    },
    {
        icon: <FiGlobe />,
        title: 'Cross-Browser Testing',
        desc: 'Ensure compatibility across Chrome, Firefox, Safari, Edge, and mobile browsers.',
        color: 'var(--secondary-500)',
    },
    {
        icon: <FiShield />,
        title: 'Security Testing',
        desc: 'Identify vulnerabilities, XSS, CSRF, and authentication flaws before hackers do.',
        color: 'var(--error-500)',
    },
    {
        icon: <FiBarChart2 />,
        title: 'Performance Testing',
        desc: 'Load testing, stress testing, and optimization insights for peak performance.',
        color: 'var(--warning-500)',
    },
    {
        icon: <FiLayers />,
        title: 'UI/UX Review',
        desc: 'Expert design feedback on usability, accessibility, and overall user experience.',
        color: '#a855f7',
    },
    {
        icon: <FiAward />,
        title: 'Regression Testing',
        desc: 'Ensure new updates don\'t break existing functionality with thorough regression checks.',
        color: 'var(--accent-500)',
    },
];

const TESTIMONIALS = [
    {
        name: 'Kadhirvel',
        role: 'Full-Stack Developer',
        text: 'TestFlow helped us catch 40+ critical bugs before launch. The tester marketplace is a game-changer for indie developers like me.',
        avatar: 'KV',
    },
    {
        name: 'Elavarasi',
        role: 'QA Lead',
        text: 'As a tester, I love the flexibility. I pick tasks that match my expertise, submit thorough reports, and get paid fairly. Excellent platform!',
        avatar: 'EV',
    },
    {
        name: 'Gunasekaran',
        role: 'Startup Founder',
        text: 'We reduced our QA costs by 60% while improving coverage. TestFlow\'s structured feedback system is incredibly efficient.',
        avatar: 'GS',
    },
];

/* ──────────────────────────────────────────────
   LANDING PAGE COMPONENT
   ────────────────────────────────────────────── */
export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [contactSubmitted, setContactSubmitted] = useState(false);

    /* track scroll for navbar bg */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* close mobile menu on link click */
    const handleNavClick = () => setMobileMenuOpen(false);

    const handleContactSubmit = (e) => {
        e.preventDefault();
        setContactSubmitted(true);
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => setContactSubmitted(false), 4000);
    };

    /* section refs for animations */
    const [aboutRef, aboutInView] = useInView();
    const [howRef, howInView] = useInView();
    const [servicesRef, servicesInView] = useInView();
    const [testimonialsRef, testimonialsInView] = useInView();
    const [contactRef, contactInView] = useInView();

    return (
        <div className="landing-page">
            {/* ─── NAVBAR ─── */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`} id="landing-navbar">
                <div className="landing-nav-inner">
                    <Link to="/" className="landing-logo" id="landing-logo">
                        <div className="landing-logo-icon"><FiZap size={22} /></div>
                        <span className="landing-logo-text">TestFlow</span>
                    </Link>

                    <div className="landing-nav-links" id="landing-nav-links">
                        {NAV_LINKS.map(link => (
                            <a key={link.href} href={link.href} className="landing-nav-link">
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <div className="landing-nav-actions">
                        <Link to="/login" className="landing-btn-ghost" id="landing-login-btn">Sign In</Link>
                        <Link to="/signup" className="landing-btn-primary" id="landing-signup-btn">
                            Get Started <FiArrowRight size={16} />
                        </Link>
                    </div>

                    <button
                        className="landing-mobile-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                        id="landing-mobile-menu-btn"
                    >
                        {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>

                {/* Mobile menu */}
                <div className={`landing-mobile-menu ${mobileMenuOpen ? 'open' : ''}`} id="landing-mobile-menu">
                    {NAV_LINKS.map(link => (
                        <a key={link.href} href={link.href} className="landing-mobile-link" onClick={handleNavClick}>
                            {link.label}
                        </a>
                    ))}
                    <div className="landing-mobile-actions">
                        <Link to="/login" className="landing-btn-ghost" onClick={handleNavClick}>Sign In</Link>
                        <Link to="/signup" className="landing-btn-primary" onClick={handleNavClick}>
                            Get Started <FiArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─── HERO ─── */}
            <section className="landing-hero" id="hero">
                <div className="landing-hero-glow glow-1" />
                <div className="landing-hero-glow glow-2" />
                <div className="landing-hero-glow glow-3" />

                <div className="landing-hero-content">
                    <div className="landing-hero-badge">
                        <FiZap size={14} />
                        <span>The Future of Software Quality Assurance</span>
                    </div>

                    <h1 className="landing-hero-title" id="landing-hero-title">
                        Ship Flawless Software,<br />
                        <span className="gradient-text">Every Single Time.</span>
                    </h1>

                    <p className="landing-hero-subtitle">
                        Connect with expert testers, get comprehensive bug reports, and deliver
                        quality software your users will love — all through one powerful platform.
                    </p>

                    <div className="landing-hero-actions">
                        <Link to="/signup" className="landing-btn-primary landing-btn-lg" id="hero-cta-primary">
                            Start Testing Free <FiArrowRight size={18} />
                        </Link>
                        <a href="#how-it-works" className="landing-btn-outline landing-btn-lg" id="hero-cta-secondary">
                            <FiPlay size={16} /> See How It Works
                        </a>
                    </div>

                    <div className="landing-hero-trust">
                        <div className="landing-hero-avatars">
                            {['AM', 'PS', 'RK', 'SK', 'NJ'].map((initial, i) => (
                                <div key={i} className="landing-hero-avatar" style={{ animationDelay: `${i * 0.1}s` }}>
                                    {initial}
                                </div>
                            ))}
                        </div>
                        <div className="landing-hero-trust-text">
                            <div className="landing-hero-stars">
                                {[...Array(5)].map((_, i) => <FiStar key={i} size={14} />)}
                            </div>
                            <span>Trusted by 2,500+ developers & testers</span>
                        </div>
                    </div>
                </div>

                <div className="landing-hero-visual">
                    <div className="landing-hero-card card-1">
                        <div className="hero-card-icon" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-400)' }}>
                            <FiCode size={20} />
                        </div>
                        <div>
                            <div className="hero-card-label">New Task Created</div>
                            <div className="hero-card-value">E-commerce Checkout Flow</div>
                        </div>
                    </div>
                    <div className="landing-hero-card card-2">
                        <div className="hero-card-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success-500)' }}>
                            <FiCheck size={20} />
                        </div>
                        <div>
                            <div className="hero-card-label">Bug Report Approved</div>
                            <div className="hero-card-value">+₹2,000 earned</div>
                        </div>
                    </div>
                    <div className="landing-hero-card card-3">
                        <div className="hero-card-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning-500)' }}>
                            <FiTrendingUp size={20} />
                        </div>
                        <div>
                            <div className="hero-card-label">Quality Score</div>
                            <div className="hero-card-value">98.5% — Excellent</div>
                        </div>
                    </div>
                </div>

                <div className="landing-scroll-indicator">
                    <FiChevronDown size={20} />
                </div>
            </section>

            {/* ─── STATS BAR ─── */}
            <section className="landing-stats" id="stats">
                <div className="landing-stats-inner">
                    {STATS.map((stat, i) => (
                        <div key={i} className="landing-stat-item">
                            <div className="landing-stat-icon">{stat.icon}</div>
                            <div className="landing-stat-value">
                                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                            </div>
                            <div className="landing-stat-label">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── ABOUT ─── */}
            <section className={`landing-section ${aboutInView ? 'in-view' : ''}`} id="about" ref={aboutRef}>
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">About TestFlow</span>
                        <h2 className="landing-section-title">
                            Quality Assurance,<br />
                            <span className="gradient-text">Reimagined.</span>
                        </h2>
                        <p className="landing-section-subtitle">
                            TestFlow bridges the gap between developers who need reliable testing and skilled
                            testers looking for meaningful work. Our marketplace-driven approach ensures
                            fast turnaround, comprehensive coverage, and fair compensation.
                        </p>
                    </div>

                    <div className="landing-about-grid">
                        <div className="landing-about-card">
                            <div className="about-card-icon" style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))' }}>
                                <FiCode size={24} />
                            </div>
                            <h3>For Developers</h3>
                            <p>Post testing tasks, set your budget, and receive structured bug reports from vetted testers. Focus on building while we handle QA.</p>
                            <ul className="about-card-list">
                                <li><FiCheck size={14} /> Create & manage test tasks</li>
                                <li><FiCheck size={14} /> Structured feedback reports</li>
                                <li><FiCheck size={14} /> Transparent pricing</li>
                            </ul>
                        </div>
                        <div className="landing-about-card">
                            <div className="about-card-icon" style={{ background: 'linear-gradient(135deg, var(--secondary-600), var(--secondary-400))' }}>
                                <FiSearch size={24} />
                            </div>
                            <h3>For Testers</h3>
                            <p>Browse available tasks, pick projects matching your skills, submit thorough reports, and earn money through our integrated wallet.</p>
                            <ul className="about-card-list">
                                <li><FiCheck size={14} /> Browse task marketplace</li>
                                <li><FiCheck size={14} /> Flexible work schedule</li>
                                <li><FiCheck size={14} /> Instant wallet payouts</li>
                            </ul>
                        </div>
                        <div className="landing-about-card">
                            <div className="about-card-icon" style={{ background: 'linear-gradient(135deg, var(--accent-600), var(--accent-400))' }}>
                                <FiShield size={24} />
                            </div>
                            <h3>Managed by Admins</h3>
                            <p>Our admin team oversees quality, verifies users, manages disputes, and ensures the marketplace stays trustworthy and efficient.</p>
                            <ul className="about-card-list">
                                <li><FiCheck size={14} /> User verification</li>
                                <li><FiCheck size={14} /> Task moderation</li>
                                <li><FiCheck size={14} /> Analytics dashboard</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className={`landing-section landing-section-alt ${howInView ? 'in-view' : ''}`} id="how-it-works" ref={howRef}>
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">How It Works</span>
                        <h2 className="landing-section-title">
                            Four Simple Steps to<br />
                            <span className="gradient-text">Better Software.</span>
                        </h2>
                        <p className="landing-section-subtitle">
                            From task creation to payment — our streamlined process makes
                            professional software testing accessible to everyone.
                        </p>
                    </div>

                    <div className="landing-steps-grid">
                        {HOW_IT_WORKS.map((item, i) => (
                            <div key={i} className="landing-step-card" style={{ animationDelay: `${i * 0.15}s` }}>
                                <div className="step-number">{item.step}</div>
                                <div className="step-icon">{item.icon}</div>
                                <h3>{item.title}</h3>
                                <p>{item.desc}</p>
                                {i < HOW_IT_WORKS.length - 1 && <div className="step-connector" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── SERVICES ─── */}
            <section className={`landing-section ${servicesInView ? 'in-view' : ''}`} id="services" ref={servicesRef}>
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">Our Services</span>
                        <h2 className="landing-section-title">
                            Comprehensive Testing<br />
                            <span className="gradient-text">Services We Offer.</span>
                        </h2>
                        <p className="landing-section-subtitle">
                            From functionality to security, our diverse tester community
                            covers every aspect of software quality assurance.
                        </p>
                    </div>

                    <div className="landing-services-grid">
                        {SERVICES.map((svc, i) => (
                            <div key={i} className="landing-service-card" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="service-icon" style={{ color: svc.color, background: `${svc.color}15` }}>
                                    {svc.icon}
                                </div>
                                <h3>{svc.title}</h3>
                                <p>{svc.desc}</p>
                                <div className="service-line" style={{ background: svc.color }} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── TESTIMONIALS ─── */}
            <section className={`landing-section landing-section-alt ${testimonialsInView ? 'in-view' : ''}`} id="testimonials" ref={testimonialsRef}>
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">Testimonials</span>
                        <h2 className="landing-section-title">
                            Loved by Developers<br />
                            <span className="gradient-text">& Testers Alike.</span>
                        </h2>
                    </div>

                    <div className="landing-testimonials-grid">
                        {TESTIMONIALS.map((t, i) => (
                            <div key={i} className="landing-testimonial-card" style={{ animationDelay: `${i * 0.15}s` }}>
                                <div className="testimonial-stars">
                                    {[...Array(5)].map((_, j) => <FiStar key={j} size={14} />)}
                                </div>
                                <p className="testimonial-text">"{t.text}"</p>
                                <div className="testimonial-author">
                                    <div className="testimonial-avatar">{t.avatar}</div>
                                    <div>
                                        <div className="testimonial-name">{t.name}</div>
                                        <div className="testimonial-role">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CONTACT ─── */}
            <section className={`landing-section ${contactInView ? 'in-view' : ''}`} id="contact" ref={contactRef}>
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">Contact Us</span>
                        <h2 className="landing-section-title">
                            Have Questions?<br />
                            <span className="gradient-text">We'd Love to Help.</span>
                        </h2>
                        <p className="landing-section-subtitle">
                            Reach out to our team for any inquiries about the platform,
                            partnerships, or enterprise solutions.
                        </p>
                    </div>

                    <div className="landing-contact-grid">
                        <div className="landing-contact-info">
                            <div className="contact-info-card">
                                <div className="contact-info-icon"><FiMail size={20} /></div>
                                <div>
                                    <h4>Email Us</h4>
                                    <p>support@testflow.io</p>
                                    <p>enterprise@testflow.io</p>
                                </div>
                            </div>
                            <div className="contact-info-card">
                                <div className="contact-info-icon"><FiPhone size={20} /></div>
                                <div>
                                    <h4>Call Us</h4>
                                    <p>+91 98765 43210</p>
                                    <p>Mon – Fri, 9am – 6pm IST</p>
                                </div>
                            </div>
                            <div className="contact-info-card">
                                <div className="contact-info-icon"><FiMapPin size={20} /></div>
                                <div>
                                    <h4>Visit Us</h4>
                                    <p>ProEduvate Technologies</p>
                                    <p>Chennai, Tamil Nadu, India</p>
                                </div>
                            </div>
                        </div>

                        <form className="landing-contact-form" onSubmit={handleContactSubmit} id="contact-form">
                            <div className="contact-form-group">
                                <label htmlFor="contact-name">Your Name</label>
                                <input
                                    type="text"
                                    id="contact-name"
                                    placeholder="Anbarasan"
                                    value={contactForm.name}
                                    onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="contact-form-group">
                                <label htmlFor="contact-email">Email Address</label>
                                <input
                                    type="email"
                                    id="contact-email"
                                    placeholder="you@example.com"
                                    value={contactForm.email}
                                    onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="contact-form-group">
                                <label htmlFor="contact-message">Message</label>
                                <textarea
                                    id="contact-message"
                                    rows="5"
                                    placeholder="Tell us how we can help..."
                                    value={contactForm.message}
                                    onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                                    required
                                />
                            </div>
                            <button type="submit" className="landing-btn-primary landing-btn-lg contact-submit-btn" id="contact-submit-btn">
                                <FiSend size={16} /> Send Message
                            </button>
                            {contactSubmitted && (
                                <div className="contact-success">
                                    <FiCheck size={16} /> Message sent successfully! We'll get back to you soon.
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </section>

            {/* ─── CTA BANNER ─── */}
            <section className="landing-cta" id="cta-banner">
                <div className="landing-cta-glow" />
                <div className="landing-cta-inner">
                    <h2>Ready to Ship Better Software?</h2>
                    <p>
                        Join thousands of developers and testers who trust TestFlow
                        for reliable, affordable, and fast software quality assurance.
                    </p>
                    <div className="landing-cta-actions">
                        <Link to="/signup" className="landing-btn-white landing-btn-lg" id="cta-signup-btn">
                            Create Free Account <FiArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="landing-btn-outline-white landing-btn-lg" id="cta-login-btn">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="landing-footer" id="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-footer-brand">
                        <Link to="/" className="landing-logo">
                            <div className="landing-logo-icon"><FiZap size={20} /></div>
                            <span className="landing-logo-text">TestFlow</span>
                        </Link>
                        <p>
                            Connecting developers with expert testers for comprehensive
                            software quality assurance. Ship with confidence.
                        </p>
                    </div>

                    <div className="landing-footer-links">
                        <div className="footer-link-group">
                            <h4>Platform</h4>
                            <a href="#about">About</a>
                            <a href="#how-it-works">How It Works</a>
                            <a href="#services">Services</a>
                            <a href="#testimonials">Testimonials</a>
                        </div>
                        <div className="footer-link-group">
                            <h4>Account</h4>
                            <Link to="/login">Sign In</Link>
                            <Link to="/signup">Create Account</Link>
                        </div>
                        <div className="footer-link-group">
                            <h4>Contact</h4>
                            <a href="mailto:support@testflow.io">support@testflow.io</a>
                            <a href="tel:+919876543210">+91 98765 43210</a>
                            <a href="#contact">Contact Form</a>
                        </div>
                    </div>
                </div>

                <div className="landing-footer-bottom">
                    <p>&copy; {new Date().getFullYear()} TestFlow by ProEduvate. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
