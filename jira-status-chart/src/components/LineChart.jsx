import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    TimeScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
    CategoryScale
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, zoomPlugin, CategoryScale);

const LineChart = ({ dataByStatus, visibleStatuses, startDate, endDate }) => {
    const generateColor = (i) => {
        const hue = (i * 137.508) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };

    const statusNames = Object.keys(dataByStatus).filter(status => visibleStatuses.includes(status));

    const datasets = statusNames.map((status, i) => {
        const points = dataByStatus[status];
        const avg = points.reduce((sum, p) => sum + p.count, 0) / points.length;

        return {
            label: status,
            data: [...points]
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(p => ({ x: p.date, y: p.count, avg })),
            borderColor: generateColor(i),
            backgroundColor: generateColor(i),
            fill: false,
            tension: 0.3,
            pointRadius: 2
        };
    });

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const { x, y, avg } = context.raw;
                        return `${context.dataset.label}: ${y} issues on ${new Date(x).toLocaleDateString()} (Avg: ${avg.toFixed(1)})`;
                    }
                }
            },
            zoom: {
                pan: { enabled: true, mode: 'x' },
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'x'
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                title: { display: true, text: 'Date' },
                min: new Date(startDate).getTime(),
                max: new Date(endDate).getTime()
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Issue Count' }
            }
        }
    };

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Line data={{ datasets }} options={options} />
        </div>
    );
};

export default LineChart;