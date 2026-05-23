import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../../services/api';
import { formatCredits, formatDate, getDeadlineStatus } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { FiSearch, FiFilter, FiCalendar, FiClock, FiChevronDown } from 'react-icons/fi';
import './Marketplace.css';

function Marketplace() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [selectedTestType, setSelectedTestType] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(false);

    const testingLevels = [
        { id: 'basic', name: 'Basic' },
        { id: 'intermediate', name: 'Intermediate' },
        { id: 'expert', name: 'Expert' },
    ];

    useEffect(() => {
        async function fetchTasks() {
            try {
                const res = await tasksAPI.marketplace();
                setTasks(res.tasks || []);
            } catch (err) {
                console.error('Failed to load marketplace:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchTasks();
    }, []);

    const testTypes = ['UI Testing', 'Functional', 'Performance', 'Security', 'Usability'];

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = (task.appName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.companyName || task.developerCompany || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = selectedLevel === 'all' || (task.level || task.testingLevel || '').toLowerCase() === selectedLevel;
        const matchesType = selectedTestType === 'all' || (task.testTypes || []).includes(selectedTestType);
        return matchesSearch && matchesLevel && matchesType;
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.postedAt) - new Date(a.postedAt);
        if (sortBy === 'credits-high') return b.credits - a.credits;
        if (sortBy === 'credits-low') return a.credits - b.credits;
        if (sortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
        return 0;
    });

    return (
        <div className="marketplace-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Task Marketplace</h1>
                    <p className="page-subtitle">Find and accept testing tasks to earn credits</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="search-filters">
                <div className="search-box">
                    <FiSearch className="search-icon" size={18} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search tasks by name or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <button
                    className="filter-toggle"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FiFilter size={18} />
                    Filters
                    <FiChevronDown
                        size={16}
                        style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0)' }}
                    />
                </button>

                <div className="sort-select">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="form-input"
                    >
                        <option value="newest">Newest First</option>
                        <option value="credits-high">Highest Credits</option>
                        <option value="credits-low">Lowest Credits</option>
                        <option value="deadline">Deadline Soon</option>
                    </select>
                </div>
            </div>

            {showFilters && (
                <div className="filter-panel">
                    <div className="filter-group">
                        <label className="filter-label">Testing Level</label>
                        <div className="filter-options">
                            <button
                                className={`filter-option ${selectedLevel === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedLevel('all')}
                            >
                                All Levels
                            </button>
                            {testingLevels.map(level => (
                                <button
                                    key={level.id}
                                    className={`filter-option ${selectedLevel === level.id ? 'active' : ''}`}
                                    onClick={() => setSelectedLevel(level.id)}
                                >
                                    {level.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Test Type</label>
                        <div className="filter-options">
                            <button
                                className={`filter-option ${selectedTestType === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedTestType('all')}
                            >
                                All Types
                            </button>
                            {testTypes.map(type => (
                                <button
                                    key={type}
                                    className={`filter-option ${selectedTestType === type ? 'active' : ''}`}
                                    onClick={() => setSelectedTestType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Results Count */}
            <div className="results-count">
                <span>{filteredTasks.length} tasks available</span>
            </div>

            {/* Tasks Grid */}
            <div className="tasks-grid">
                {filteredTasks.map(task => {
                    const deadline = getDeadlineStatus(task.deadline);
                    return (
                        <div key={task._id || task.id} className="card task-card">
                            <div className="task-card-header">
                                <Badge variant="primary">{task.level || task.testingLevel}</Badge>
                                <span className="spots-left">{task.openSlots || '?'} spots left</span>
                            </div>

                            <div className="task-card-body">
                                <h3 className="task-name">{task.appName}</h3>
                                <p className="task-company">{task.companyName || task.developerCompany || ''}</p>

                                <div className="task-test-types">
                                    {task.testTypes.map(type => (
                                        <span key={type} className="test-type-tag">{type}</span>
                                    ))}
                                </div>

                                <p className="task-description">{task.description}</p>

                                <div className="task-meta-row">
                                    <div className="task-meta-item">
                                        <FiCalendar size={14} />
                                        <span>Deadline: {formatDate(task.deadline)}</span>
                                    </div>
                                    <Badge variant={deadline.color} size="sm">{deadline.label}</Badge>
                                </div>

                                <div className="task-meta-row">
                                    <div className="task-meta-item">
                                        <FiClock size={14} />
                                        <span>Est. {task.estimatedTime}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="task-card-footer">
                                <div className="task-credits">
                                    <span className="credits-amount">{formatCredits(task.credits || task.budget || 0)}</span>
                                    <span className="credits-text">Credits</span>
                                </div>
                                <Link to={`/tester/task/${task._id || task.id}`}>
                                    <Button variant="primary">View & Accept</Button>
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredTasks.length === 0 && (
                <div className="empty-results">
                    <p>No tasks found matching your criteria.</p>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedLevel('all');
                            setSelectedTestType('all');
                        }}
                    >
                        Clear Filters
                    </Button>
                </div>
            )}
        </div>
    );
}

export default Marketplace;
