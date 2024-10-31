<script>
    import * as d3 from "d3";
    
  
    let width = 450;
    let height = 450;
    let margin = 40;
  
    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    let radius = Math.min(width, height) / 2 - margin;
  
    // Create dummy data
    const data = { a: 9, b: 20, c: 30, d: 8, e: 12, f: 3, g: 7, h: 14 };
  
    // set the color scale
    const color = d3
      .scaleOrdinal()
      .domain(["a", "b", "c", "d", "e", "f", "g", "h"])
      .range(d3.schemeDark2);
  
    // Compute the position of each group on the pie:
    const pie = d3
      .pie()
      .sort(null) // Do not sort group by size
      .value((d) => d[1]);
    const data_ready = pie(Object.entries(data));
  
    // The arc generator
    const arc = d3
      .arc()
      .innerRadius(radius * 0.5) // This is the size of the donut hole
      .outerRadius(radius * 0.8);
  
    // Another arc that won't be drawn. Just for labels positioning
    const outerArc = d3
      .arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);
  </script>
  
  <svg
    {width}
    {height}
    viewBox="{-width / 2}, {-height / 2}, {width}, {height}"
    style:max-width="100%"
    style:height="auto"
  >
    <g class="chart-inner">
      {#each data_ready as slice}
        <path d={arc(slice)} fill={color(slice.data[1])} stroke="white" />
      {/each}
    </g>
  </svg>
  
  <style>
      :global(body) {
          margin: 0;
      }
  </style>
  