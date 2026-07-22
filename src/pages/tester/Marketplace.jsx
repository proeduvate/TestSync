import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI, reputationAPI } from '../../services/api';
import { formatCredits, formatDate, getDeadlineStatus } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiFilter, FiCalendar, FiClock, FiChevronDown, FiGrid, FiList, FiAward, FiStar } from 'react-icons/fi';
import './Marketplace.css';

function Marketplace() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedTestTypes, setSelectedTestTypes] = useState([]);
    const [sortBy, setSortBy] = useState('reputation-match');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('marketplace_view_mode') || 'grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [testerRep, setTesterRep] = useState({ score: 0, level: 'New Tester', skills: [] });
    const ITEMS_PER_PAGE = 15;
    const popoverRef = useRef(null);

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

        // Fetch tester reputation for smart sorting
        if (user?.id) {
            reputationAPI.getTesterScore(user.id)
                .then(rep => setTesterRep(rep))
                .catch(() => {});
        }
    }, [user?.id]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLevelChange = (levelId) => {
        setSelectedLevels(prev => 
            prev.includes(levelId) 
                ? prev.filter(l => l !== levelId) 
                : [...prev, levelId]
        );
    };

    const handleTestTypeChange = (type) => {
        setSelectedTestTypes(prev => 
            prev.includes(type) 
                ? prev.filter(t => t !== type) 
                : [...prev, type]
        );
    };

    const handleResetFilters = () => {
        setSelectedLevels([]);
        setSelectedTestTypes([]);
        setSortBy('newest');
    };

    const testTypes = ['UI Testing', 'Functional', 'Performance', 'Security', 'Usability'];

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedLevels, selectedTestTypes, sortBy]);

    const getTaskMatchScore = (task) => {
        const testerSkills = (testerRep.skills || []).map(s => s.toLowerCase());
        const taskTypes = (task.testTypes || []).map(t => t.toLowerCase());
        const taskLevel = (task.testingLevel || '').toLowerCase();
        const skillMatch = taskTypes.filter(t => testerSkills.some(s => s.includes(t) || t.includes(s))).length;
        const levelBonus = testerRep.level === 'Elite Tester' ? 30 : testerRep.level === 'Trusted Tester' ? 20 : testerRep.level === 'Normal Tester' ? 10 : 0;
        return skillMatch * 25 + levelBonus + (testerRep.score || 0) * 0.3;
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = (task.appName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.companyName || task.developerCompany || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesLevel = selectedLevels.length === 0 || 
            selectedLevels.includes((task.level || task.testingLevel || '').toLowerCase());
            
        const matchesType = selectedTestTypes.length === 0 || 
            (task.testTypes || []).some(type => selectedTestTypes.includes(type));
            
        return matchesSearch && matchesLevel && matchesType;
    }).sort((a, b) => {
        if (sortBy === 'reputation-match') return getTaskMatchScore(b) - getTaskMatchScore(a);
        if (sortBy === 'newest') return new Date(b.postedAt) - new Date(a.postedAt);
        if (sortBy === 'credits-high') return b.credits - a.credits;
        if (sortBy === 'credits-low') return a.credits - b.credits;
        if (sortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
        return 0;
    });

    const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTasks = filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="marketplace-page">
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

                <div className="filters-container" ref={popoverRef}>
                    <button
                        className={`filter-toggle ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FiFilter size={18} />
                        Filters
                        <FiChevronDown
                            size={16}
                            style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0)' }}
                        />
                    </button>

                    {showFilters && (
                        <div className="filters-popout">
                            {/* Sort By Group */}
                            <div className="popout-group">
                                <label className="popout-label">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="form-input popout-select"
                                >
                                    <option value="reputation-match">🏆 Best Match for You</option>
                                    <option value="newest">Newest First</option>
                                    <option value="credits-high">Highest Credits</option>
                                    <option value="credits-low">Lowest Credits</option>
                                    <option value="deadline">Deadline Soon</option>
                                </select>
                            </div>

                            {/* Testing Level Group */}
                            <div className="popout-group">
                                <label className="popout-label">Testing Level</label>
                                <div className="checkbox-options">
                                    {testingLevels.map(level => (
                                        <label key={level.id} className="checkbox-option">
                                            <input
                                                type="checkbox"
                                                checked={selectedLevels.includes(level.id)}
                                                onChange={() => handleLevelChange(level.id)}
                                            />
                                            <span>{level.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Test Type Group */}
                            <div className="popout-group">
                                <label className="popout-label">Test Type</label>
                                <div className="checkbox-options">
                                    {testTypes.map(type => (
                                        <label key={type} className="checkbox-option">
                                            <input
                                                type="checkbox"
                                                checked={selectedTestTypes.includes(type)}
                                                onChange={() => handleTestTypeChange(type)}
                                            />
                                            <span>{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Reset Button */}
                            {(selectedLevels.length > 0 || selectedTestTypes.length > 0 || sortBy !== 'newest') && (
                                <button className="popout-reset-btn" onClick={handleResetFilters}>
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="view-toggle">
                    <button
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => {
                            setViewMode('grid');
                            localStorage.setItem('marketplace_view_mode', 'grid');
                        }}
                        title="Grid View"
                    >
                        <FiGrid size={18} />
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                        onClick={() => {
                            setViewMode('table');
                            localStorage.setItem('marketplace_view_mode', 'table');
                        }}
                        title="Table View"
                    >
                        <FiList size={18} />
                    </button>
                </div>
            </div>

            {/* Tasks Grid */}
            {/* Tasks Grid / Table View */}
            {viewMode === 'grid' ? (
                <div className="tasks-grid">
                    {paginatedTasks.map((task, idx) => {
                        const deadline = getDeadlineStatus(task.deadline);
                        const matchScore = getTaskMatchScore(task);
                        const isTopMatch = sortBy === 'reputation-match' && idx < 3 && matchScore > 20;
                        return (
                            <div key={task._id || task.id} className={`card task-card ${isTopMatch ? 'top-match-card' : ''}`}>
                                <div className="task-card-header">
                                    <Badge variant="primary">{task.level || task.testingLevel}</Badge>
                                    <span className="spots-left">{task.openSlots || '?'} spots left</span>
                                    {isTopMatch && (
                                        <span className="top-match-badge"><FiStar size={11} /> Best Match</span>
                                    )}
                                </div>

                                <div className="task-card-body">
                                    <h3 className="task-name">{task.appName}</h3>
                                    <p className="task-company">{task.companyName || task.developerCompany || ''}</p>

                                    <div className="task-test-types">
                                        {task.testTypes.map(type => (
                                            <span key={type} className="test-type-tag">{type}</span>
                                        ))}
                                    </div>

                                    <div className="task-meta-row">
                                        <div className="task-meta-item">
                                            <FiCalendar size={14} />
                                            <span>Deadline: {formatDate(task.deadline)}</span>
                                        </div>
                                        <Badge variant={deadline.color} size="sm">{deadline.label}</Badge>
                                    </div>
                                </div>

                                <div className="task-card-footer">
                                    <div className="task-credits">
                                        <span className="credits-amount">{(task.credits || task.budget || 0).toLocaleString()}</span>
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
            ) : (
                <div className="table-wrapper">
                    <table className="table marketplace-table">
                        <thead>
                            <tr>
                                <th>Task & Developer</th>
                                <th>Type of Testing</th>
                                <th>Deadline</th>
                                <th>Credits</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTasks.map(task => {
                                const deadline = getDeadlineStatus(task.deadline);
                                return (
                                    <tr key={task._id || task.id}>
                                        <td>
                                            <div className="task-primary-info">
                                                <span className="task-title-bold">{task.appName}</span>
                                                <span className="task-dev-small">{task.companyName || task.developerCompany || ''}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="task-test-types">
                                                {task.testTypes.map(type => (
                                                    <span key={type} className="test-type-tag">{type}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="task-deadline-cell">
                                                <span className="task-deadline-date">{formatDate(task.deadline)}</span>
                                                <Badge variant={deadline.color} size="sm">{deadline.label}</Badge>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="task-credits-cell">
                                                <span className="credits-amount">{(task.credits || task.budget || 0).toLocaleString()}</span>
                                                <span className="credits-text"> Credits</span>
                                            </div>
                                        </td>
                                        <td>
                                            <Link to={`/tester/task/${task._id || task.id}`}>
                                                <Button variant="primary" size="sm">View & Accept</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="pagination">
                    <Button 
                        variant="secondary" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <span className="pagination-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button 
                        variant="secondary" 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </Button>
                </div>
            )}

            {filteredTasks.length === 0 && (
                <div className="empty-results">
                    <p>No tasks found matching your criteria.</p>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedLevels([]);
                            setSelectedTestTypes([]);
                            setSortBy('newest');
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
