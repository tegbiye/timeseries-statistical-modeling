import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Form } from 'react-bootstrap';

function App() {
  const [prices, setPrices] = useState([]);
  const [events, setEvents] = useState([]);
  const [changePoints, setChangePoints] = useState([]);
  const [metrics, setMetrics] = useState({ volatility: 0, avg_changes: [] });
  const [startDate, setStartDate] = useState(new Date('1987-05-20'));
  const [endDate, setEndDate] = useState(new Date('2025-08-18'));
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    const pricesRes = await axios.get(`http://localhost:5000/api/prices?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
    setPrices(pricesRes.data.map(d => ({ ...d, Date: new Date(d.Date).getTime() })));  // Convert to timestamp for Recharts
    const eventsRes = await axios.get('http://localhost:5000/api/events');
    setEvents(eventsRes.data);
    const cpRes = await axios.get('http://localhost:5000/api/change_points');
    setChangePoints(cpRes.data);
    const metricsRes = await axios.get('http://localhost:5000/api/metrics');
    setMetrics(metricsRes.data);
  };

  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <h1>Brent Oil Price Dashboard</h1>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={4}>
          <Form.Label>Start Date</Form.Label>
          <DatePicker selected={startDate} onChange={date => setStartDate(date)} className="form-control" />
        </Col>
        <Col md={4}>
          <Form.Label>End Date</Form.Label>
          <DatePicker selected={endDate} onChange={date => setEndDate(date)} className="form-control" />
        </Col>
        <Col md={4}>
          <Form.Label>Select Event to Highlight</Form.Label>
          <Form.Select onChange={e => setSelectedEvent(e.target.value)}>
            <option value="">None</option>
            {events.map((ev, i) => <option key={i} value={ev.Date}>{ev.Event}</option>)}
          </Form.Select>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <LineChart width={window.innerWidth * 0.9} height={400} data={prices}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Date" type="number" domain={['dataMin', 'dataMax']} tickFormatter={time => new Date(time).toLocaleDateString()} />
                <YAxis />
                <Tooltip labelFormatter={time => new Date(time).toLocaleDateString()} />
                <Legend />
                <Line type="monotone" dataKey="Price" stroke="#8884d8" dot={false} />
                {changePoints.map((cp, i) => (
                  <ReferenceLine key={`cp${i}`} x={new Date(cp.date).getTime()} stroke="red" label="Change Point" />
                ))}
                {events.map((ev, i) => (
                  <ReferenceLine key={`ev${i}`} x={new Date(ev.date).getTime()} stroke="green" label={ev.event} />
                ))}
                {selectedEvent && <ReferenceLine x={new Date(selectedEvent).getTime()} stroke="orange" label="Selected Event" />}
              </LineChart>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>Key Metrics</Card.Header>
            <Card.Body>
              <p>Volatility (Std Dev): ${metrics.volatility.toFixed(2)}</p>
              <ul>
                {metrics.avg_changes.map((ch, i) => (
                  <li key={i}>{ch.event}: {ch.change_percent.toFixed(2)}% change</li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>Events List</Card.Header>
            <Card.Body>
              <ul>
                {events.map((ev, i) => (
                  <li key={i} onClick={() => setSelectedEvent(ev.Date)} style={{ cursor: 'pointer' }}>
                    {ev.Date}: {ev.Event} - {ev.Description}
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;