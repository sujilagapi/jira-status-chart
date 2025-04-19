import React, { useState } from 'react';
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
    const [focusedLine, setFocusedLine] = useState(null);

    const reverseMap = Object.fromEntries(
        Object.entries(statusMap).map(([k, v]) => [v, k])
    );

    const statusLabels = visibleStatuses
        .filter(status => statusMap[status])
        .sort((a, b) => statusMap[a] - statusMap[b]);

    const grouped = {};
    const filteredRawData = rawData.filter(d => visibleStatuses.includes(d.status));

    filteredRawData.forEach(d => {
        if (!grouped[d.issueKey]) grouped[d.issueKey] = [];
        grouped[d.issueKey].push({ x: d.date, status: d.status });
    });

    const generateColor = (i) => {
        const hue = (i * 137.508) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };

    const datasets = Object.entries(grouped).map(([issueKey, points], i) => {
        points.sort((a, b) => a.x - b.x);
        const dataPoints = [];

        for (let j = 0; j < points.length; j++) {
            const current = points[j];
            const next = points[j + 1];
            const duration = next ? (next.x - current.x) / (1000 * 60 * 60 * 24 * 7) : null;

            dataPoints.push({
                x: current.x,
                y: current.status,
                duration,
                status: current.status
            });
        }

        const isDimmed = focusedLine && focusedLine !== issueKey;

        return {
            label: issueKey,
            data: dataPoints,
            fill: false,
            tension: 0.4,
            borderColor: isDimmed ? '#ccc' : generateColor(i),
            backgroundColor: isDimmed ? '#ccc' : generateColor(i),
            borderWidth: isDimmed ? 1 : 2,
            pointRadius: isDimmed ? 2 : 3,
            hidden: false
        };
    });

    const chartConfig = {
        labels: [],
        datasets
    };
    chartConfig.datasets = datasets;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements, chart) => {
            if (elements.length > 0) {
                const datasetIndex = elements[0].datasetIndex;
                const label = chart.data.datasets[datasetIndex].label;
                setFocusedLine(label);
            } else {
                setFocusedLine(null); // reset if click outside
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: { boxWidth: 16, font: { size: 10 } }
            },
            tooltip: {
                callbacks: {
                    title: (context) => {
                        const point = context[0].raw;
                        return new Date(point.x).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                        });
                    },
                    label: (context) => {
                        const point = context.raw;
                        const durationText = point.duration != null
                            ? ` (${point.duration.toFixed(1)} weeks in ${point.status})`
                            : ` (${point.status})`;
                        return `${context.dataset.label}${durationText}`;
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
                time: {
                    unit: 'day',
                    tooltipFormat: 'dd MMM yyyy',
                    displayFormats: {
                        day: 'dd MMM',
                        month: 'MMM yyyy'
                    }
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
        <div style={{marginTop: 32, height: '80vh'}}>
            <Line data={chartConfig} options={options}/>
        </div>
    );
};

export default LineChart;
