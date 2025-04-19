import React, { useState } from 'react';
import Papa from 'papaparse';
import LineChart from './components/LineChart';
import statusMap from './config/statusConfig';

function App() {
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('');
  const [visibleStatuses, setVisibleStatuses] = useState(Object.keys(statusMap));

  const toggleStatus = (status) => {
    setVisibleStatuses(prev =>
        prev.includes(status)
            ? prev.filter(s => s !== status)
            : [...prev, status]
    );
  };

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

        setRawData(parsed);

        const dates = parsed.map(d => d.date).sort((a, b) => a - b);
        setStartDate('2024-01-01');
        setEndDate(dates[dates.length - 1].toISOString().split('T')[0]);

        filterByDate(parsed, '2024-01-01', dates[dates.length - 1]);
      }
    });
  };

  const filterByDate = (data, start, end) => {
    const from = new Date(start);
    const to = new Date(end);
    const filtered = data.filter(item => item.date >= from && item.date <= to);
    setFilteredData(filtered);
  };

  return (
      <div style={{ padding: 32 }}>
        <h2>📊 Jira Status Over Time</h2>
        <input type="file" accept=".csv" onChange={handleFileUpload} />

        {rawData.length > 0 && (
            <>
              <div style={{ margin: '20px 0' }}>
                <label style={{ marginRight: 10 }}>From:</label>
                <input type="date" value={startDate} onChange={(e) => {
                  setStartDate(e.target.value);
                  filterByDate(rawData, e.target.value, endDate);
                }} />

                <label style={{ margin: '0 10px 0 20px' }}>To:</label>
                <input type="date" value={endDate} onChange={(e) => {
                  setEndDate(e.target.value);
                  filterByDate(rawData, startDate, e.target.value);
                }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <h4>Select Statuses to Display</h4>
                {Object.keys(statusMap).sort((a, b) => statusMap[a] - statusMap[b]).map(status => (
                    <label key={status} style={{ marginRight: 10 }}>
                      <input
                          type="checkbox"
                          checked={visibleStatuses.includes(status)}
                          onChange={() => toggleStatus(status)}
                      />
                      {status}
                    </label>
                ))}
              </div>

              <LineChart
                  rawData={filteredData}
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