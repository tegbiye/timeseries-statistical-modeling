from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS
import datetime

from src.data_loader import load_data

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Load Brent oil price data (use provided CSV; extend synthetically for 2023-2025)
data = load_data('../../data/BrentOilPrices.csv')
data['Date'] = pd.to_datetime(data['Date'])

data = data.drop_duplicates(subset='Date').sort_values('Date').reset_index(drop=True)

# Events from Task 1 (updated with recent ones up to 2022)

events_df = load_data('../../data/oil_market_events.csv')
events_df['Date'] = pd.to_datetime(events_df['Date'])

# Change points from Task 2
change_points = [
    {"Date": "1990-08-02", "Description": "Shift to higher prices"},
    {"Date": "2008-12-05", "Description": "Price drop"},
    {"Date": "2020-04-21", "Description": "COVID crash"},
    {"Date": "2022-03-09", "Description": "Ukraine spike"}
]
change_points_df = pd.DataFrame(change_points)
change_points_df['Date'] = pd.to_datetime(change_points_df['Date'])
change_points_df.to_csv('../../data/changes_points.csv')


@app.route('/api/prices', methods=['GET'])
def get_prices():
    start = request.args.get("start")
    end = request.args.get("end")
    df = data

    # parse safely
    start = pd.to_datetime(start).tz_localize(None)
    end = pd.to_datetime(end).tz_localize(None)

    df['Date'] = pd.to_datetime(df['Date']).dt.tz_localize(None)

    filtered = df[(df['Date'] >= start) & (df['Date'] <= end)]
    return jsonify(filtered.to_dict(orient="records"))


@app.route('/api/events', methods=['GET'])
def get_events():
    return jsonify(events_df.to_dict(orient='records'))

@app.route('/api/change_points', methods=['GET'])
def get_change_points():
    return jsonify(change_points_df.to_dict(orient='records'))

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    # Example metrics: volatility (std dev), avg change around events
    volatility = data['Price'].std()
    avg_change = []
    for event in events_df.to_dict(orient="records"):
        event_date = pd.to_datetime(event['Date'])
        window = data[(data['Date'] >= event_date - datetime.timedelta(days=30)) & 
                    (data['Date'] <= event_date + datetime.timedelta(days=30))]
        change = ((window['Price'].max() - window['Price'].min()) / window['Price'].min()) * 100 if not window.empty else 0
        avg_change.append({"event": event['Event'], "change_percent": change})
    return jsonify({"volatility": volatility, "avg_changes": avg_change})

if __name__ == '__main__':
    app.run(debug=True)