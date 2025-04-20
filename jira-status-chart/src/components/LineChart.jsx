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

    const minTime = new Date(startDate).getTime();
    const maxTime = new Date(endDate).getTime();
    const minZoomRange = 24 * 60 * 60 * 1000;             // 1 day
    const maxZoomRange = 365 * 24 * 60 * 60 * 1000;       // 1 year

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
                backgroundColor: '#222',
                cornerRadius: 8,
                titleFont: {
                    size: 20,
                    weight: 'bold',
                    family: 'Arial'
                },
                bodyFont: {
                    size: 18,
                    family: 'Arial'
                },
                padding: 16,
                displayColors: true,
                titleAlign: 'center',
                bodyAlign: 'left',
                callbacks: {
                    title: (context) => {
                        const rawDate = context[0].raw.x;
                        return new Date(rawDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        });
                    },
                    label: (context) => {
                        const { y } = context.raw;
                        const status = context.dataset.label;
                        return `${y} ${status}`;
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
                    mode: 'x',
                    limits: {
                        x: {
                            min: minTime,
                            max: maxTime,
                            minRange: minZoomRange,
                            maxRange: maxZoomRange
                        }
                    },
                    onZoom: ({ chart }) => {
                        const xScale = chart.scales.x;
                        const range = xScale.max - xScale.min;

                        if (range < minZoomRange) {
                            const center = (xScale.min + xScale.max) / 2;
                            xScale.options.min = center - minZoomRange / 2;
                            xScale.options.max = center + minZoomRange / 2;
                            chart.update();
                            return false;
                        }

                        if (range > maxZoomRange) {
                            const center = (xScale.min + xScale.max) / 2;
                            xScale.options.min = center - maxZoomRange / 2;
                            xScale.options.max = center + maxZoomRange / 2;
                            chart.update();
                            return false;
                        }
                    }
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
                min: minTime,
                max: maxTime
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