import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './Chart.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Default chart options
const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                color: '#94a3b8',
                padding: 20,
                font: {
                    family: 'Inter, sans-serif',
                    size: 12,
                },
            },
        },
        tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: {
                family: 'Inter, sans-serif',
                size: 14,
                weight: 600,
            },
            bodyFont: {
                family: 'Inter, sans-serif',
                size: 12,
            },
        },
    },
    scales: {
        x: {
            grid: {
                color: 'rgba(51, 65, 85, 0.5)',
                drawBorder: false,
            },
            ticks: {
                color: '#64748b',
                font: {
                    family: 'Inter, sans-serif',
                    size: 11,
                },
            },
        },
        y: {
            grid: {
                color: 'rgba(51, 65, 85, 0.5)',
                drawBorder: false,
            },
            ticks: {
                color: '#64748b',
                font: {
                    family: 'Inter, sans-serif',
                    size: 11,
                },
            },
        },
    },
};

const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right',
            labels: {
                color: '#94a3b8',
                padding: 15,
                font: {
                    family: 'Inter, sans-serif',
                    size: 12,
                },
                usePointStyle: true,
            },
        },
        tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
        },
    },
    cutout: '70%',
};

function Chart({ type = 'line', data, options = {}, height = 300, title }) {
    const chartOptions = type === 'doughnut'
        ? { ...doughnutOptions, ...options }
        : { ...defaultOptions, ...options };

    const chartData = {
        ...data,
        datasets: data.datasets?.map((dataset, index) => ({
            ...dataset,
            borderColor: dataset.borderColor || getDefaultColor(index),
            backgroundColor: dataset.backgroundColor || getDefaultBgColor(index),
            borderWidth: dataset.borderWidth || 2,
            tension: dataset.tension ?? 0.4,
            fill: dataset.fill ?? (type === 'line'),
            pointRadius: dataset.pointRadius ?? 4,
            pointHoverRadius: dataset.pointHoverRadius ?? 6,
        })) || [],
    };

    const ChartComponent = type === 'bar' ? Bar : type === 'doughnut' ? Doughnut : Line;

    return (
        <div className="chart-wrapper">
            {title && <h4 className="chart-title">{title}</h4>}
            <div className="chart-container" style={{ height }}>
                <ChartComponent data={chartData} options={chartOptions} />
            </div>
        </div>
    );
}

function getDefaultColor(index) {
    const colors = ['#6366f1', '#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[index % colors.length];
}

function getDefaultBgColor(index) {
    const colors = [
        'rgba(99, 102, 241, 0.1)',
        'rgba(20, 184, 166, 0.1)',
        'rgba(59, 130, 246, 0.1)',
        'rgba(245, 158, 11, 0.1)',
        'rgba(239, 68, 68, 0.1)',
        'rgba(139, 92, 246, 0.1)',
    ];
    return colors[index % colors.length];
}

export default Chart;
