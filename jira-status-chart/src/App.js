import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import LineChart from './components/LineChart';
import statusMap from './config/statusConfig';

const styles = {
  label: {
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    color: '#333'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: 8,
    fontFamily: 'Inter, sans-serif'
  },
  input: {
    fontSize: '14px',
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #ccc',
    outline: 'none',
    fontFamily: 'Inter, sans-serif'
  },
  radioGroup: {
    display: 'flex',
    gap: '20px',
    marginTop: 10,
    alignItems: 'center'
  },
  fileInput: {
    padding: '10px',
    border: '2px dashed #ccc',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    width: '100%',
    marginTop: 10,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif'
  },
  checkboxContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    maxHeight: '72px',
    overflowY: 'auto',
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    background: '#f9f9f9',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif'
  }
};

function App() {
  const [dataByStatus, setDataByStatus] = useState({});
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('');
  const [visibleStatuses, setVisibleStatuses] = useState(Object.keys(statusMap));
  const [mode, setMode] = useState('cumulative');
  const [rawCsvData, setRawCsvData] = useState([]);

  useEffect(() => {
    fetch('/jira_status_over_time.csv')
        .then(res => res.text())
        .then(text => {
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const parsed = results.data.map(row => ({
                issueKey: row['Issue Key'],
                date: new Date(row['Date']),
                status: row['Status']
              }));
              setRawCsvData(parsed);
              processData(parsed, mode);
            }
          });
        });
  }, []);

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
        setRawCsvData(parsed);
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
    if (rawCsvData.length > 0) {
      processData(rawCsvData, newMode);
    }
  };

  return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ padding: '16px 32px', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#1f2937' }}>📊 Jira Status Trends Over Time</h2>

          <input type="file" accept=".csv" onChange={handleFileUpload} style={styles.fileInput} />

          <div style={{ marginTop: 12 }}>
            <label style={{ marginRight: 10, ...styles.label }}>From:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.input} />
            <label style={{ margin: '0 10px 0 20px', ...styles.label }}>To:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.input} />
          </div>

          <div style={styles.radioGroup}>
            <label style={styles.label}>
              <input
                  type="radio"
                  checked={mode === 'cumulative'}
                  onChange={() => handleModeChange('cumulative')}
              />
              📈 Cumulative
            </label>
            <label style={styles.label}>
              <input
                  type="radio"
                  checked={mode === 'event'}
                  onChange={() => handleModeChange('event')}
              />
              📍 Events Only
            </label>
          </div>

          {Object.keys(dataByStatus).length > 0 && (
              <div style={{marginTop: 16}}>
                <h4 style={styles.sectionTitle}>Select Statuses:</h4>
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',  // 👈 ensures left alignment
                  gap: 12,
                  marginBottom: 8
                }}>
                  <button
                      onClick={() => setVisibleStatuses (Object.keys (dataByStatus))}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        borderRadius: 6,
                        backgroundColor: '#f0f8ff',
                        border: '1px solid #007bff',
                        color: '#007bff',
                        cursor: 'pointer'
                      }}
                  >
                    ✅ Select All
                  </button>
                  <button
                      onClick={() => setVisibleStatuses ([])}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        borderRadius: 6,
                        backgroundColor: '#fff0f0',
                        border: '1px solid #dc3545',
                        color: '#dc3545',
                        cursor: 'pointer'
                      }}
                  >
                    ❌ Clear Selection
                  </button>
                </div>
                <div style={styles.checkboxContainer}>
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
          )}
        </div>

        <div style={{flex: 1, minHeight: 0}}>
          <LineChart
              dataByStatus={dataByStatus}
              visibleStatuses={visibleStatuses}
              startDate={startDate}
              endDate={endDate}
          />
        </div>
      </div>
  );
}

export default App;