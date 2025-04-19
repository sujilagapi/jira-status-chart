import React from 'react';
import statusMap from '../config/statusConfig';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    TimeScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    LinearScale,
    CategoryScale,
    Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';

ChartJS.register(TimeScale, PointElement, LineElement, Tooltip, Legend, LinearScale, CategoryScale, Filler, zoomPlugin);

const LineChart = ({ rawData, visibleStatuses, startDate, endDate }) => {
    const filteredRawData = rawData.filter(d => visibleStatuses.includes(d.status));

    const reverseMap = Object.fromEntries(
        Object.entries(statusMap).map(([k, v]) => [v, k])
    );
    const statusLabels = visibleStatuses.filter(status => statusMap[status]).sort((a, b) => statusMap[a] - statusMap[b]);

    const grouped = {};
    const durations = {};

    filteredRawData.forEach(d => {
        if (!grouped[d.issueKey]) grouped[d.issueKey] = [];
        grouped[d.issueKey].push({ x: d.date, status: d.status });
    });

    const datasets = Object.entries(grouped).map(([issueKey, points], i) => {
        points.sort((a, b) => a.x - b.x);
        const dataPoints = [];

        for (let j = 0; j < points.length; j++) {
            const current = points[j];
            const next = points[j + 1];
            let duration = null;

            if (next) {
                duration = (next.x - current.x) / (1000 * 60 * 60 * 24 * 7); // weeks
            }

            dataPoints.push({
                x: current.x,
                y: statusMap[current.status],
                duration,
                status: current.status
            });
        }

        const generateColor = (i) => {
            const hue = (i * 137.508) % 360;
            return `hsl(${hue}, 70%, 50%)`;
        };

        return {
            label: issueKey,
            data: dataPoints,
            fill: false,
            tension: 0.4,
            borderColor: generateColor(i),
            backgroundColor: generateColor(i),
            borderWidth: 2,
            pointRadius: 3
        };
    });

    const chartConfig = {
        labels: [],
        datasets
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 16,
                    font: { size: 10 }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const point = context.raw;
                        const durationText = point.duration != null ? ` (${point.status}: ${point.duration.toFixed(1)} weeks)` : '';
                        return `${context.dataset.label}${durationText}`;
                    }
                }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x'
                },
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
                time: {
                    unit: 'month',
                    tooltipFormat: 'MMM yyyy'
                },
                title: {
                    display: true,
                    text: 'Date'
                },
                min: new Date(startDate).getTime(),
                max: new Date(endDate).getTime()
            },
            y: {
                type: 'category',
                labels: statusLabels,
                reverse: true,
                title: {
                    display: true,
                    text: 'Status'
                }
            }
        }
    };

    return (
        <div style={{ marginTop: 32, height: `${visibleStatuses.length * 40}px` }}>
            <Line data={chartConfig} options={options} />
        </div>
    );
};

export default LineChart;