import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FiStar, FiAward, FiCheckCircle } from 'react-icons/fi';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import './RecommendedTestersWidget.css'; // Optional styling

function RecommendedTestersWidget() {
    const [testers, setTesters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecommendedTesters() {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, name, average_rating, total_evaluations, completed_tests, company')
                    .eq('role', 'tester')
                    .order('average_rating', { ascending: false })
                    .limit(5);
                
                if (error) throw error;
                setTesters(data || []);
            } catch (err) {
                console.error('Failed to fetch recommended testers', err);
            } finally {
                setLoading(false);
            }
        }
        fetchRecommendedTesters();
    }, []);

    if (loading) return <Loader />;

    if (testers.length === 0) {
        return (
            <div className="card recommended-testers-widget">
                <div className="card-header">
                    <h3 className="card-title">Recommended Testers</h3>
                </div>
                <div className="empty-state">
                    <p>No testers with AI ratings yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card recommended-testers-widget">
            <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiAward className="text-warning" /> Recommended Testers
                </h3>
            </div>
            <div className="tester-list">
                {testers.map((tester) => (
                    <div key={tester.id} className="tester-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                        <div className="tester-info">
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{tester.name || 'Anonymous Tester'}</h4>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: '#666' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FiCheckCircle /> {tester.completed_tests || 0} tasks
                                </span>
                                {tester.company && <span>• {tester.company}</span>}
                            </div>
                        </div>
                        <div className="tester-rating" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Badge variant="warning" style={{ fontSize: '0.9rem' }}>
                                <FiStar style={{ marginRight: '4px' }} />
                                {(tester.average_rating || 0).toFixed(1)}
                            </Badge>
                            <span style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
                                {tester.total_evaluations || 0} AI Evals
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RecommendedTestersWidget;
