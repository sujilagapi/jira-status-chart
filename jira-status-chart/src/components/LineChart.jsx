import React, { useState } from 'react';
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
    const [focusedLine, setFocusedLine] = useState(null);

    const generateColor = (i) => {
        const hue = (i * 137.508) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };

    const statusNames = Object.keys(dataByStatus).filter(status => visibleStatuses.includes(status));

    const datasets = statusNames.map((status, i) => {
        const points = dataByStatus[status];
        const avg = points.reduce((sum, p) => sum + p.count, 0) / points.length;
        const isDimmed = focusedLine && focusedLine !== status;

        return {
            label: status,
            data: [...points]
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(p => ({ x: p.date, y: p.count, avg })),
            borderColor: isDimmed ? '#ccc' : generateColor(i),
            backgroundColor: isDimmed ? '#ccc' : generateColor(i),
            borderWidth: isDimmed ? 1 : 2,
            pointRadius: isDimmed ? 2 : 3,
            tension: 0.3,
            fill: false,
            hidden: false
        };
    });

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements, chart) => {
            if (elements.length > 0) {
                const datasetIndex = elements[0].datasetIndex;
                const label = chart.data.datasets[datasetIndex].label;
                setFocusedLine(label === focusedLine ? null : label);
            } else {
                setFocusedLine(null);
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: { boxWidth: 16, font: { size: 11 } }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const { x, y, avg } = context.raw;
                        return `${context.dataset.label}: ${y} on ${new Date(x).toLocaleDateString()} (Avg: ${avg.toFixed(1)})`;
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
        <div style={{ width: '100%', height: '100%', background: '#fff', borderTop: '1px solid #eee' }}>
            <Line data={{ datasets }} options={options} />
        </div>
    );
};

export default LineChart;