import React, { useRef, useEffect, useState } from 'react';
import trendingDown from './trendingDown.svg';
import trendingUp from './trendingUp.svg';
import { VictoryChart, VictoryLine, VictoryAxis } from 'victory';
import './App.css';
import moment from 'moment';
import { getXAxis, getYAxis, chartStyles } from './helpers/line';

const POLLING_INTERVAL = 15000;
const X_AXIS_INTERVAL = POLLING_INTERVAL * 10 / 1000;

function App() {
  const [data, setData] = useState([]);
  const dataRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const xAxisMidRef = useRef(moment().add(X_AXIS_INTERVAL, 'seconds'));
  const xAxisMaxRef = useRef(moment().add(X_AXIS_INTERVAL * 2, 'seconds'));
  const { xAxis, xAxisFormat } = getXAxis(
    data,
    xAxisMidRef.current,
    xAxisMaxRef.current,
  );
  
  xAxisMidRef.current = xAxis[1];
  xAxisMaxRef.current = xAxis[2];
  dataRef.current = data;

  useEffect(() => {
    if (timeoutIdRef.current) return;

    const fetchData = () => {
      fetch('https://api.coinbase.com/v2/prices/BTC-USD/buy')
      .then((resp) => resp.json())
      .then((resp) => {
        timeoutIdRef.current = setTimeout(() => {
          fetchData();
        }, POLLING_INTERVAL);
        
        setData([...dataRef.current, {
          y: +resp.data.amount,
          x: moment(),
        }]);
      });
    }

    fetchData();
  }, [data]);
  
  useEffect(() => {
    return () => {
      clearTimeout(timeoutIdRef.current)
    };
  }, []);

  let latestPrice;
  let percentChange;
  let trendingIcon;
  let percentClassName = '';
  
  if (data.length > 0) {
    latestPrice = data.length > 0 ? data[data.length - 1].y : undefined;
    const startVal = data[0].y; 
    const endVal = data[data.length - 1].y;
    
    percentChange = +`${(endVal - startVal) / startVal * 100.00}`;
    
    if (percentChange > 0) {
      trendingIcon = trendingUp;
      percentClassName = 'green';
    } else if (percentChange < 0) {
      trendingIcon = trendingDown;
      percentClassName = 'red';
    }

    percentChange = Math.abs(percentChange);
    percentChange = !percentChange ? '0.00' : percentChange.toFixed(1-Math.floor(Math.log(percentChange)/Math.log(10)));
    const flooredPrice = Math.floor(latestPrice);
    const decimals = `${(latestPrice - flooredPrice).toFixed(2)}`.split('').slice(1).join('');
    latestPrice = `${flooredPrice.toLocaleString()}${decimals}`;
  }

  const yAxis = getYAxis(data);

  return (
    <div className="App">
      <div>
        <div className="price">
          <div className="val">${latestPrice}</div>
          <div className="change">
            {trendingIcon &&
              <img src={trendingIcon} alt="trending" />
            }
            <div className={`percent ${percentClassName}`}>
              {percentChange}%
          </div>
          </div>
        </div>
        {true && (
          <div className="chart-container">
            <VictoryChart
              domainPadding={{ x: [0, 0], y: 0 }}
            >
              <VictoryAxis
                tickFormat={(x) => moment(x).format(xAxisFormat)}
                style={chartStyles.xAxis}
                tickValues={xAxis}
              />
              <VictoryAxis
                dependentAxis
                style={chartStyles.yAxis}
                tickValues={yAxis}
                tickFormat={(x) => `$${x.toLocaleString()}`}
              />
              <VictoryLine
                animate={{
                  duration: 2000,
                  onEnter: {    duration: 1000 
                  },
                }}
                data={data}
                style={chartStyles.line}
              />
            </VictoryChart>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
