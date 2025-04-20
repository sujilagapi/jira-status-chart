import React, { useState } from 'react';
import Papa from 'papaparse';
import LineChart from './components/LineChart';
import statusMap from './config/statusConfig';

function App() {
  const [dataByStatus, setDataByStatus] = useState({});
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('');
  const [visibleStatuses, setVisibleStatuses] = useState(Object.keys(statusMap));
  const [mode, setMode] = useState('cumulative'); // "cumulative" | "event"

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map(row => ({
          issueKey: row['Issue Key'],
          date: new Date(row['Date']),
          status: row['Status']
        }));

        processData(parsed, mode);
      }
    });
  };

  const processData = (parsed, viewMode) => {
    const grouped = {};
    parsed.forEach(row => {
      if (!grouped[row.issueKey]) grouped[row.issueKey] = [];
      grouped[row.issueKey].push(row);
    });

    const dailyStatusCounts = {};

    Object.values(grouped).forEach(issueRows => {
      issueRows.sort((a, b) => a.date - b.date);
      for (let i = 0; i < issueRows.length; i++) {
        const current = issueRows[i];
        const next = issueRows[i + 1];
        const start = new Date(current.date);
        const end = next ? new Date(next.date) : new Date();

        if (viewMode === 'cumulative') {
          let d = new Date(start);
          while (d <= end) {
            const key = d.toISOString().split('T')[0];
            if (!dailyStatusCounts[key]) dailyStatusCounts[key] = {};
            if (!dailyStatusCounts[key][current.status]) dailyStatusCounts[key][current.status] = 0;
            dailyStatusCounts[key][current.status]++;
            d.setDate(d.getDate() + 1);
          }
        } else if (viewMode === 'event') {
          const key = start.toISOString().split('T')[0];
          if (!dailyStatusCounts[key]) dailyStatusCounts[key] = {};
          if (!dailyStatusCounts[key][current.status]) dailyStatusCounts[key][current.status] = 0;
          dailyStatusCounts[key][current.status]++;
        }
      }
    });

    const statusSeries = {};
    Object.keys(dailyStatusCounts).forEach(date => {
      Object.keys(dailyStatusCounts[date]).forEach(status => {
        if (!statusSeries[status]) statusSeries[status] = [];
        statusSeries[status].push({ date, count: dailyStatusCounts[date][status] });
      });
    });

    setDataByStatus(statusSeries);

    const allDates = Object.keys(dailyStatusCounts).sort();
    setStartDate(allDates[0]);
    setEndDate(allDates[allDates.length - 1]);
    setVisibleStatuses(Object.keys(statusSeries));
  };

  const toggleStatus = (status) => {
    setVisibleStatuses(prev =>
        prev.includes(status)
            ? prev.filter(s => s !== status)
            : [...prev, status]
    );
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setDataByStatus({}); // Reset view
    setTimeout(() => {
      document.querySelector('input[type="file"]').dispatchEvent(new Event('change', { bubbles: true }));
    }, 0);
  };

  return (
      <div style={{ padding: 32 }}>
        <h2>📊 Jira Status Trends Over Time</h2>

        <input type="file" accept=".csv" onChange={handleFileUpload} />

        <div style={{ marginTop: 16 }}>
          <label style={{ marginRight: 10 }}>From:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <label style={{ marginLeft: 20, marginRight: 10 }}>To:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div style={{ margin: '20px 0' }}>
          <label>
            <input
                type="radio"
                checked={mode === 'cumulative'}
                onChange={() => handleModeChange('cumulative')}
            />
            📈 Status Duration (Cumulative)
          </label>
          <label style={{ marginLeft: 20 }}>
            <input
                type="radio"
                checked={mode === 'event'}
                onChange={() => handleModeChange('event')}
            />
            📍 Status Change Events Only
          </label>
        </div>

        {Object.keys(dataByStatus).length > 0 && (
            <>
              <div style={{marginBottom: 16}}>
                <h4>Select Statuses to Show</h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  background: '#f9f9f9'
                }}>
                  {Object.keys (dataByStatus).map (status => (
                      <label key={status} style={{marginRight: 12, marginBottom: 6}}>
                        <input
                            type="checkbox"
                            checked={visibleStatuses.includes (status)}
                            onChange={() => toggleStatus (status)}
                        />
                        {status}
                      </label>
                  ))}
                </div>
              </div>

              <LineChart
                  dataByStatus={dataByStatus}
                  visibleStatuses={visibleStatuses}
                  startDate={startDate}
                  endDate={endDate}
              />
            </>
        )}
      </div>
  );
}

export default App;