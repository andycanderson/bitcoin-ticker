import moment from 'moment';

const tickLabels = {
  fontSize: 6,
  padding: 3,
  fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`
};

export const chartStyles = {
  xAxis: {
    axis: {
      strokeWidth: 2,
    },
    tickLabels
  },
  yAxis: {
    axis: {
      strokeWidth: 2,
    },
    tickLabels: {
      ...tickLabels,
      fill: '#26A69A'
    }
  },
  line: {
    data: { 
      stroke: '#6200EE', 
      strokeWidth: 1
    },
    parent: { 
      border: "1px solid #ccc" 
    }
  }
}

export const getYAxis = (data) => {
  if (!data.length) return [0, 0, 0];

  let min;
  let mean; 
  let max;

  data.forEach(({ y: price }) => {
    min = min === undefined ? 
      price : Math.min(min, price);
    mean = mean === undefined ? 
      price : mean + price;
    max = max === undefined ? 
      price : Math.max(max, price);
  });

  mean = mean / data.length;

  const CHART_PAD = 100;
  const minDiff = Math.abs(mean - min);
  const maxDiff = Math.abs(max - mean);
  const diff = Math.max(minDiff, maxDiff);

  return [
    Math.floor(mean - diff - CHART_PAD), 
    Math.round(mean), 
    Math.round(mean + diff + CHART_PAD)];
}

export const getXAxis = (data, currMid, currMax) => {
  let format = 'h:mm A';

  if (!data.length) return {
    xAxis: [moment(), currMid, currMax],
    xAxisFormat: format,
  };

  let min = data[0].x || moment();
  let mid = currMid;
  let max = data[data.length - 1].x;

  if (moment(max).diff(currMax) > 0) {
    const diff = moment(max).diff(min);
    mid = moment(min).clone().add(diff, 'milliseconds');
    max = moment(min).clone().add(diff * 2, 'milliseconds');
  } else {
    max = currMax;
  }

  return {
    xAxis: [min, mid, max],
    xAxisFormat: getXAxisFormat(min, max)
  };
}

const getXAxisFormat = (min, max) => {
  const diffFn = generateMomentDiffFn(min, max);
  const FACTOR = 2;
  
  if (diffFn('hours') < FACTOR) {
    return 'h:mm A';
  } else if (diffFn('days') < FACTOR) {
    return 'h A';
  } else if (diffFn('weeks') < 2) {
    return 'dddd';
  } else if (diffFn('months') < 2) {
    return 'MMM Do';
  } else if (diffFn('years') < 2) {
    return 'MMMM';
  }
  
  return 'YYYY';
}

const generateMomentDiffFn = (min, max) => {
  /**
   * @param {string} duration one of[years, months, weeks, days, hours]
   */
  return (duration) => moment(max).diff(min, duration);
}