const margin = {top: 100, right: 40, bottom: 130, left: 65};
const h = 400 + margin.top + margin.bottom;
const w = 1300 + margin.left + margin.right;
const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

  // CHART - create svg chart area
  const chart = d3.select('#container')
                  .append('svg')
                  .attr('id', 'chart')
                  .attr('height', h)
                  .attr('width', w)
                  .style('border', 'solid');
  
  // TITLES - create and place titles
  const graphTitle = chart.append('text')
                          .attr('id', 'title')
                          .attr('y', margin.top/2 - 8)
                          .attr('x', w/2)
                          .attr('text-anchor', 'middle')
                          .text("Global Surface Temperature");
  
  const xTitle = chart.append('text')
                      .attr('id', 'x-title')
                      .attr('y', h - margin.bottom/1.8)
                      .attr('x', w/2)
                      .attr('text-anchor', 'middle')
                      .text("Years");

const subtitle = chart.append('text')
                      .attr('id', 'description')
                      .attr('x', w/2)
                      .attr('y', margin.top - 22)
                      .attr('text-anchor', 'middle')
                      .text("1753 - 2015");


// TOOLTIP
const tooltip = d3.select("#container")
                     .append('div')
                     .attr('id', 'tooltip')
                     .style('opacity', 0);

// tooltip legend
const tipLegend = d3.select('#container')
                       .append('div')
                       .attr('id', 'tooltip-legend')
                       .style('transform', `translate(500px, 265px)`)
                       .html(
                          "Date"
                          + "<br>"
                          + "Total surface temp"
                          + "<br>"
                          + "<span id='var-text'>"
                          + "Variance from base-temp of 8.66&#8451;"
                          + "</span>"
                       );


// FETCH
d3.json(url)
  .then(data => callback(data))
  .catch(error => console.log(error));

function callback(data) {
  // CLEAN DATA 
  const baseTemp = data.baseTemperature;
  const monthlyVar = data.monthlyVariance;
  const years = [];
  monthlyVar.forEach(d => {
    if (!years.includes(d.year)) {
      years.push(d.year);
    }
  });
  const temps = []; // base temp plus variances
  monthlyVar.map(d => {
    const t = (d.variance + baseTemp).toFixed(3);
    temps.push(Number(t));
  });
  const tempDomain = d3.extent(temps);
  const varianceDomain = d3.extent(monthlyVar.map(d => d.variance));

  // format variance
  function formatVar(variance) {
    if (variance > 0) {
      return "+" + variance;
    } else {
      return variance;
    }
  }

  // X-AXIS
  // set x scale
  const x = d3.scaleBand()
              .padding(0)
              .domain(years)
              .range([margin.left, w - margin.right]);
  
  // create x axis
  const xAxis = d3.axisBottom(x)
                  .tickValues(years.filter(year => {
                    return year % 10 === 0;
                  }))
                  .tickSize(10);
  
  // append x axis to chart
  chart.append('g')
       .call(xAxis)
       .attr('id', 'x-axis')
       .style('transform', `translateY(${h - margin.bottom}px`);
  
  // Y-AXIS
  // set y scale
  const monthTicks = Array(12).fill(0).map((el, i) => new Date().setMonth(i));
  const formatMonth = d3.timeFormat("%B");
  const y = d3.scaleBand()
              .padding(0)
              .domain(monthTicks.map(el => formatMonth(el)))
              .range([h - margin.bottom, margin.top]);
  
  // create y axis
  const yAxis = d3.axisLeft(y);
                  
  // append y axis to chart
  chart.append('g')
       .call(yAxis)
       .attr('id', 'y-axis')
       .style('transform', `translateX(${margin.left}px)`);
  
  
  
  // LEGEND
  
  // Create a threshold scale for discrete color mapping. 
  // Get colors using a diverging color scale. 
  // Partly following example from:  https://css-irl.info/working-with-color-scales-for-data-visualisation-in-d3/
  // This is another good example: https://bl.ocks.org/mbostock/4573883
  
  // need midpoint for diverging scale per D3 docs
  const tempDomainMidPoint = (tempDomain[1] - tempDomain[0]) /2; 
  // enter domain backwards (high to low) since color interpolater goes from red to blue
  // this way high temps map to reds, cold temps map to blues
  const colorScaleDiverging = d3.scaleDiverging([tempDomain[1], tempDomainMidPoint, tempDomain[0]], d3.interpolateRdYlBu);
  
  const thresholds = 11;
  const step = (tempDomain[1] - tempDomain[0]) / thresholds; 
  
  const thresholdDomain = d3.range(thresholds).map(d => {
    const t = (d + 1) * step + tempDomain[0];
    return Number(t.toFixed(1));
  })
  let thresholdRange = thresholdDomain.map(d => colorScaleDiverging(d));
  thresholdRange = [colorScaleDiverging(tempDomain[0]), ...thresholdRange];
  // added color for tempDomain[0] to range because it gets skipped in making the thresholdDomain with + tempDomain[0]. 
  // also must add it in for the range not domain because in a threshold scale the range needs to be n + 1 of the domain per D3 docs.
  const colorScale = d3.scaleThreshold(thresholdDomain, thresholdRange);
  
  
  // make legend svg group and place on chart
  const boxSize = 30;
  const legendWidth = boxSize * thresholds;
  const legend = chart.append('g')
                      .attr('id', 'legend')
                      .style('transform', `translate(${margin.left}px, ${h - margin.bottom/2}px`);
  
  // create legend linear x scale
  const legendX = d3.scaleLinear()
                    .domain(tempDomain)
                    .range([0, legendWidth]);
  
  // create legend x axis
  const legendAxisTicks = [Number(tempDomain[0].toFixed(1)), ...thresholdDomain];
  // added tick for tempDomain[0] since not included in the threshold domain
  const legendAxis = d3.axisBottom(legendX)
                       .tickValues(legendAxisTicks)
                       .tickFormat(d3.format('.1f'));
  
  // append axis to legend
  legend.append('g').call(legendAxis)
                    .style('transform', `translateY(${boxSize}px`);
  
  // add color boxes to legend
  legend.selectAll('rect.legend')
        .data(legendAxisTicks).enter()
        .append('rect')
        .attr('width', d => legendX(d + step) - legendX(d))
        .attr('height', boxSize)
        .attr('y', 0)
        .attr('x', d => legendX(d))
        .attr('fill', (d, i) => {
          if (i < legendAxisTicks.length - 1) {
             return colorScale(d);
          } else {
            return "none"; // this makes the overfill (13.9+) color box blank since no data
          }
        })
        .attr('stroke', (d, i) => {
          if (i < legendAxisTicks.length - 1) {
            return "black";
          } else {
            return "none"; // this makes no outline for overfill (13.9+) since no data
          }
        });
  
  // legend units title
  const legendTitle = chart.append('text')
                         .attr('id', 'legend-title')
                         .attr('x', margin.left + legendWidth + 10)
                         .attr('y', h - margin.bottom/3)
                         .html("&#8451;");

  
  // HEATMAP
  
  chart.selectAll('rect.cell')
       .data(monthlyVar).enter()
       .append('rect')
       .attr('class', 'cell')
       .attr('data-month', d => d.month - 1)
       .attr('data-year', d => d.year)
       .attr('data-temp', d => d.variance + baseTemp)
       .attr('height', y.bandwidth())
       .attr('width', x.bandwidth())
       .attr('x', d => x(d.year))
       .attr('y', d => {
          const monthIndex = d.month - 1
          const month = y.domain()[monthIndex];
          return y(month);
       })
       .attr('fill', d => {
          const temp = Number(d.variance + baseTemp);
          return colorScale(temp);
       })
  // Tooltip and Overlay on mouseover
       .on('mouseover', (event, d) => {
          // event.target.setAttribute('stroke', 'black');
          tooltip.transition().duration(0)
              .attr('data-year', d.year)
              .style('opacity', 0.8)
              .style('top', event.layerY + 'px')
              .style('left', event.layerX + 50 + 'px');
          tooltip.html(
            d.year + " - " + y.domain()[d.month - 1]
            + "<br>"
            + d3.format('.1f')(d.variance + baseTemp)
            + "&#8451;"
            + "<br>"
            + formatVar(d.variance)
            + "&#8451;"
            + " variance"
          )
          tipLegend.style('box-shadow', '0 0 10px black');
        })
        .on('mouseout', (event, d) => {
            tooltip.transition().duration(0)
                   .style('opacity', 0);
            tipLegend.style('box-shadow', 'none');
  });
}
