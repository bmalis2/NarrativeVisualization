const scenes = [
  { id: "scene-0", start: 1927, end: 2020 },
  { id: "scene-1", start: 1927, end: 1945 },
  { id: "scene-2", start: 1946, end: 1999 },
  { id: "scene-3", start: 2000, end: 2020 },
  { id: "scene-4", start: 1927, end: 2020, type: "explore" }
];

let currentScene = 0;
let explorationChartType = "bar"; // or "line"
//load data:
const parseDate = d3.timeParse("%Y-%m-%d")
async function loadData() {
  const data = await d3.csv("SPX.csv", function (d) {
    return {
      date: parseDate(d.Date),
      open: +d.Open,
      high: +d.High,
      low: +d.Low,
      close: +d.Close,
    };
  });
  const filteredData = data.filter(d => d.date instanceof Date && !isNaN(d.close));
  console.log("Parsed data:", data.slice(0, 5)); //to verify data first 5 rows
  updateScene(currentScene, filteredData)
  d3.select("#next").on("click", () => {
    currentScene = (currentScene + 1) % scenes.length;
    updateScene(currentScene, filteredData);
  });

  d3.select("#previous").on("click", () => {
    currentScene = (currentScene - 1 + scenes.length) % scenes.length;
    updateScene(currentScene, filteredData);
  })

  d3.select("#toggle-chart").on("click", () => {
    explorationChartType = explorationChartType === "bar" ? "line" : "bar";
    updateScene(currentScene, filteredData);
  });

  d3.selectAll("#start-year-slider, #end-year-slider").on("input", function () {
    const startYear = +d3.select("#start-year-slider").property("value");
    const endYear = +d3.select("#end-year-slider").property("value");

    // Prevent invalid range
    if (startYear > endYear) return;

    // Update text display
    d3.select("#range-display").text(`${startYear}–${endYear}`);

    const filtered = filteredData.filter(d =>
      d.date.getFullYear() >= startYear && d.date.getFullYear() <= endYear
    );

    if (explorationChartType === "bar") {
      drawBarChart(filtered);
    } else {
      drawChart(filtered, "close");
    }
  });
}
//loadData();

//set up line chart:
function drawChart(data) {
  // const margin = { top: 20, right: 30, bottom: 40, left: 60 },
  //   width = 800 - margin.left - margin.right,
  //   height = 400 - margin.top - margin.bottom;
  const width = 800;
  const height = 400;

  d3.select("#chart").selectAll("*").remove()
  //set up svg
  const svg = d3.select("#chart")
    .attr("width", 800)
    .attr("height", 400)
    .append("g")
    .attr("transform", "translate(60,20)");

  //set up x and y axis
  const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([0, width - 80]);
  svg.append("g").attr("transform", `translate(0, ${height - 40})`).call(d3.axisBottom(x));

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.close)])
    .range([height - 40, 20]);
  svg.append("g").call(d3.axisLeft(y));

  //draw line:
  const line = d3.line()
    .x(d => {
      const xVal = x(d.date);
      if (isNaN(xVal)) console.log("Bad x:", d.date);
      return xVal;
    })
    .y(d => {
      const yVal = y(d.close);
      if (isNaN(yVal)) console.log("Bad y:", d.close);
      return yVal;
    });
  // Draw the line
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#0077b6")
    .attr("stroke-width", 2)
    .attr("d", line);

  //draw annotation:
  // Example: find matching points in the current data (Scene-specific)
  const blackTuesday = data.find(d =>
    d.date.getFullYear() === 1929 &&
    d.date.getMonth() === 9 &&   // October = 9
    d.date.getDate() === 29
  );

  const blackMonday = data.find(d =>
    d.date.getFullYear() === 1987 &&
    d.date.getMonth() === 9 &&
    d.date.getDate() === 19
  );

  const dotCom = data.find(d =>
    d.date.getFullYear() === 2001 &&
    d.date.getMonth() === 2 &&
    d.date.getDate() === 1
  );

  const crisis2008 = data.find(d =>
    d.date.getFullYear() === 2008 &&
    d.date.getMonth() === 8 &&
    d.date.getDate() === 15
  );

  const covid2020 = data.find(d =>
    d.date.getFullYear() === 2020 &&
    d.date.getMonth() === 3 &&
    d.date.getDate() === 15
  );


  const annotations = [
    blackTuesday && {
      note: {
        title: "Black Tuesday",
        label: "1929 market crash",
        align: "middle"
      },
      x: x(blackTuesday.date),
      y: y(blackTuesday.close),
      dx: 80,
      dy: -40
    }, blackMonday && {
      note: {
        title: "Black Monday",
        label: "1987: Largest one-day % drop",
        align: "middle"
      },
      x: x(blackMonday.date),
      y: y(blackMonday.close),
      dx: -90,
      dy: -40
    },
    dotCom && {
      note: {
        title: "Dot-Com Bubble",
        label: "2000–2002 tech crash",
        align: "middle"
      },
      x: x(dotCom.date),
      y: y(dotCom.close),
      dx: 50,
      dy: -50
    },
    crisis2008 && {
      note: {
        title: "2008 Financial Crisis",
        label: "Market fell after Lehman collapse",
        align: "middle"
      },
      x: x(crisis2008.date),
      y: y(crisis2008.close),
      dx: -15,
      dy: 40
    },
    covid2020 && {
      note: {
        title: "2020 COVID-19 Pandemic",
        label: "Market fell due to global pandemic",
        align: "middle"
      },
      x: x(covid2020.date),
      y: y(covid2020.close),
      dx: -60,
      dy: -40
    }
  ].filter(Boolean); // ✅ removes any false/null values



  // Call d3.annotation() using the library
  const makeAnnotations = d3.annotation()
    .type(d3.annotationLabel)
    .annotations(annotations);

  // Add annotations to the same <g> chart group (e.g. #chart-content or g)
  console.log(currentScene)
  if (explorationChartType != "bar" || currentScene != 4)
    svg.append("g")
      .attr("class", "annotation-group")
      .call(makeAnnotations);

}


function updateScene(sceneIndex, fullData) {
  const scene = scenes[sceneIndex];

  // Hide all scene descriptions
  d3.selectAll(".scene").classed("active", false);
  d3.select(`#scene-${sceneIndex}`).classed("active", true);

  // Clear previous chart
  d3.select("#chart").selectAll("*").remove();

  if (scene.type === "explore") {
    d3.select("#explore-controls").style("display", "block");
    d3.select("#year-range-controls").style("display", "block");
    d3.select("#chart").select("#chart-content").remove();
    const chartDescription = explorationChartType === "bar"
      ? "Showing yearly trading Range (Highest Trading Value - Lowest Trading Value)."
      : "Showing daily closing price.";

    d3.select("#chart-description").text(chartDescription);
    const start = +d3.select("#start-year-slider").property("value");
    const end = +d3.select("#end-year-slider").property("value");

    const filtered = fullData.filter(d =>
      d.date.getFullYear() >= start && d.date.getFullYear() <= end
    );
    if (explorationChartType === "bar") {
      drawBarChart(filtered);
      d3.select("#toggle-chart").text("Switch to Line Chart");
    } else {
      drawChart(filtered);
      d3.select("#toggle-chart").text("Switch to Bar Chart");
    }

    return;
  }

  // Otherwise draw line chart for filtered time range
  d3.select("#explore-controls").style("display", "none");
  d3.select("#year-range-controls").style("display", "none");
  const filtered = fullData.filter(d =>
    d.date.getFullYear() >= scene.start &&
    d.date.getFullYear() <= scene.end
  );

  drawChart(filtered, "close");
}
function drawBarChart(data) {
  const width = 800;
  const height = 400;

  // Clear previous content inside chart SVG
  d3.select("#chart").select("#chart-content").remove();

  // Set up SVG group
  const svg = d3.select("#chart")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("id", "chart-content")
    .attr("transform", "translate(60,20)");

  const innerWidth = width - 80;  // same as in line chart
  const innerHeight = height - 60;

  // Group data by year (1923-2020)
  const nested = d3.groups(
    data.filter(d => d.date.getFullYear() >= 1923 && d.date.getFullYear() <= 2020),
    d => d.date.getFullYear()
  );

  // Build summarized data per year
  const yearData = nested.map(([year, entries]) => {
    const high = d3.max(entries, d => d.high);
    const low = d3.min(entries, d => d.low);
    return {
      year: +year,
      range: high - low
    };
  });

  // Set up scales
  const x = d3.scaleBand()
    .domain(yearData.map(d => d.year))
    .range([0, innerWidth])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(yearData, d => d.range)])
    .range([innerHeight, 0]);

  // X-axis
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  // Y-axis
  g.append("g").call(d3.axisLeft(y));

  // Bars
  g.selectAll("rect")
    .data(yearData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.range))
    .attr("width", x.bandwidth())
    .attr("height", d => innerHeight - y(d.range))
    .attr("fill", "#f8961e");

}


loadData();