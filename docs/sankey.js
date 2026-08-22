/* ============================================================
   D3 SANKEY FOR QUARTO

   Data:
   data/sankey.csv

   Columns:
   year, area, role, place, value

   Layout:
   Year → Area → Role → Place
   ============================================================ */


import * as d3 from
  "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import {
  sankey,
  sankeyJustify,
  sankeyLinkHorizontal
} from
  "https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/+esm";


/* ============================================================
   SETTINGS
   ============================================================ */

const csvFile = "data/sankey.csv";


/*
 * Colour palette
 */

const colours = {

  year:  "#CBDF90",
  area:  "#8FAD88",
  role:  "#7F9C96",
  place: "#8A8F93"

};


/*
 * Column order
 */

const groupOrder = {

  year:  0,
  area:  1,
  role:  2,
  place: 3

};


/*
 * Observable-inspired visual settings
 */

const nodeWidth = 12;
const nodePadding = 8;
const fontSize = 10;
const linkOpacity = 0.40;
const linkHoverOpacity = 0.70;


/* ============================================================
   LOAD DATA
   ============================================================ */

const data = await d3.csv(

  csvFile,

  d => ({

    year: String(d.year).trim(),
    area: String(d.area).trim(),
    role: String(d.role).trim(),
    place: String(d.place).trim(),
    value: +d.value

  })

);


/* ============================================================
   CHECK DATA
   ============================================================ */

if (!data.length) {

  throw new Error(
    "No data found in data/sankey.csv"
  );

}


if (
  data.some(
    d => !Number.isFinite(d.value)
  )
) {

  throw new Error(
    "The 'value' column contains non-numeric values."
  );

}


/* ============================================================
   CREATE LINKS
   ============================================================ */

const rawLinks = [];


for (const d of data) {


  /*
   * Year → Area
   */

  rawLinks.push({

    source: `year_${d.year}`,

    target: `area_${d.area}`,

    value: d.value

  });


  /*
   * Area → Role
   */

  rawLinks.push({

    source: `area_${d.area}`,

    target: `role_${d.role}`,

    value: d.value

  });


  /*
   * Role → Place
   */

  rawLinks.push({

    source: `role_${d.role}`,

    target: `place_${d.place}`,

    value: d.value

  });

}


/* ============================================================
   AGGREGATE DUPLICATE LINKS
   ============================================================ */

const linkMap = new Map();


for (const d of rawLinks) {

  const key =
    `${d.source}|${d.target}`;


  if (!linkMap.has(key)) {

    linkMap.set(

      key,

      {

        source: d.source,

        target: d.target,

        value: 0

      }

    );

  }


  linkMap.get(key).value += d.value;

}


const links =
  Array.from(
    linkMap.values()
  );


/* ============================================================
   CREATE NODES
   ============================================================ */

const nodeIds = Array.from(

  new Set(

    links.flatMap(

      d => [
        d.source,
        d.target
      ]

    )

  )

);


const nodes = nodeIds.map(id => {

  let group;

  let label;


  if (
    id.startsWith("year_")
  ) {

    group = "year";

    label = id.substring(5);

  }


  else if (
    id.startsWith("area_")
  ) {

    group = "area";

    label = id.substring(5);

  }


  else if (
    id.startsWith("role_")
  ) {

    group = "role";

    label = id.substring(5);

  }


  else if (
    id.startsWith("place_")
  ) {

    group = "place";

    label = id.substring(6);

  }


  return {

    id: id,

    group: group,

    label: label

  };

});


/* ============================================================
   NODE ORDER
   ============================================================ */


/*
 * Years: numerical ascending order
 */

const yearOrder = Array.from(

  new Set(
    data.map(
      d => d.year
    )
  )

).sort(

  (a, b) =>
    Number(a) - Number(b)

);


/*
 * Other categories:
 * order of first appearance in CSV
 */

const areaOrder = Array.from(

  new Set(
    data.map(
      d => d.area
    )
  )

);


const roleOrder = Array.from(

  new Set(
    data.map(
      d => d.role
    )
  )

);


const placeOrder = Array.from(

  new Set(
    data.map(
      d => d.place
    )
  )

);


const orders = {

  year: yearOrder,

  area: areaOrder,

  role: roleOrder,

  place: placeOrder

};


/* ============================================================
   NODE SORT
   ============================================================ */

function nodeSort(a, b) {


  /*
   * Keep columns in the correct order
   */

  const columnDifference =

    groupOrder[a.group] -
    groupOrder[b.group];


  if (
    columnDifference !== 0
  ) {

    return columnDifference;

  }


  /*
   * Sort nodes within each column
   */

  return (

    orders[a.group].indexOf(
      a.label
    )

    -

    orders[b.group].indexOf(
      b.label
    )

  );

}


/* ============================================================
   CONTAINER
   ============================================================ */

const container =
  document.getElementById(
    "sankey"
  );


if (!container) {

  throw new Error(
    "Could not find #sankey in the Quarto page."
  );

}


/* ============================================================
   FIXED 800 PX WIDTH
   ============================================================ */

/*
 * Your Quarto article is approximately 800px wide.
 *
 * We deliberately use 800px as the SVG's actual
 * coordinate system so that the Sankey is not
 * generated at 1400px and then visually shrunk.
 */

const width = 500;


/* ============================================================
   HEIGHT
   ============================================================ */

const nodeCounts = {

  year:
    nodes.filter(
      d => d.group === "year"
    ).length,

  area:
    nodes.filter(
      d => d.group === "area"
    ).length,

  role:
    nodes.filter(
      d => d.group === "role"
    ).length,

  place:
    nodes.filter(
      d => d.group === "place"
    ).length

};


const maxNodes = Math.max(

  ...Object.values(
    nodeCounts
  )

);


/*
 * Compact but readable.
 */

const height = Math.max(

  450,

  maxNodes * 28

);


/* ============================================================
   MARGINS
   ============================================================ */

const marginTop = 20;

const marginRight = 20;

const marginBottom = 20;

const marginLeft = 20;


/* ============================================================
   SANKEY LAYOUT
   ============================================================ */

const layout = sankey()

  .nodeId(
    d => d.id
  )

  .nodeAlign(
    sankeyJustify
  )

  .nodeSort(
    nodeSort
  )

  .nodeWidth(
    nodeWidth
  )

  .nodePadding(
    nodePadding
  )

  .extent([

    [
      marginLeft,
      marginTop
    ],

    [
      width - marginRight,
      height - marginBottom
    ]

  ]);


/* ============================================================
   CALCULATE GRAPH
   ============================================================ */

const graph = layout({

  nodes:

    nodes.map(
      d => ({ ...d })
    ),

  links:

    links.map(
      d => ({ ...d })
    )

});


/* ============================================================
   SVG
   ============================================================ */

const svg = d3.select(
  "#sankey"
)

.append("svg")

.attr(
  "width",
  width
)

.attr(
  "height",
  height
)

.attr(
  "viewBox",
  `0 0 ${width} ${height}`
)

.attr(
  "role",
  "img"
)

.attr(
  "aria-label",
  "Sankey diagram showing flows from year to area, role and place."
);


/* ============================================================
   COLOUR FUNCTION
   ============================================================ */

function nodeColour(d) {

  return colours[
    d.group
  ];

}


/* ============================================================
   COLUMN HEADINGS
   ============================================================ */

const columnTitles = {

  year: "Year",

  area: "Area",

  role: "Role",

  place: "Place"

};


for (
  const group of
  [
    "year",
    "area",
    "role",
    "place"
  ]
) {


  const groupNodes =
    graph.nodes.filter(

      d =>
        d.group === group

    );


  if (
    !groupNodes.length
  ) {

    continue;

  }


  const x =
    d3.mean(

      groupNodes,

      d =>
        (
          d.x0 +
          d.x1
        ) / 2

    );


  svg.append("text")

    .attr(
      "class",
      "column-label"
    )

    .attr(
      "x",
      x
    )

    .attr(
      "y",
      18
    )

    .attr(
      "text-anchor",
      "middle"
    )

    .attr(
      "font-family",
      "sans-serif"
    )

    .attr(
      "font-size",
      11
    )

    .attr(
      "font-weight",
      600
    )

    .attr(
      "fill",
      "#555"
    )

    .text(
      columnTitles[group]
    );

}


/* ============================================================
   LINKS
   ============================================================ */

const linkGroup = svg.append("g")

  .attr(
    "fill",
    "none"
  )

  .attr(
    "stroke-opacity",
    linkOpacity
  )

  .style(
    "mix-blend-mode",
    "multiply"
  );


const link = linkGroup

  .selectAll("path")

  .data(
    graph.links
  )

  .join("path")

  .attr(
    "class",
    "sankey-link"
  )

  .attr(
    "d",
    sankeyLinkHorizontal()
  )

  .attr(
    "stroke",
    d =>
      nodeColour(
        d.source
      )
  )

  .attr(
    "stroke-width",
    d =>
      Math.max(
        1,
        d.width
      )
  );


/* ============================================================
   LINK TOOLTIP
   ============================================================ */

link.append("title")

  .text(

    d =>

      `${d.source.label} → ${d.target.label}\n` +

      `Value: ${d3.format(",")(d.value)}`

  );


/* ============================================================
   LINK HOVER
   ============================================================ */

link

  .on(
    "mouseenter",
    function() {

      d3.select(this)

        .attr(
          "stroke-opacity",
          linkHoverOpacity
        );

    }
  )

  .on(
    "mouseleave",
    function() {

      d3.select(this)

        .attr(
          "stroke-opacity",
          linkOpacity
        );

    }
  );


/* ============================================================
   NODES
   ============================================================ */

const node = svg.append("g")

  .selectAll("g")

  .data(
    graph.nodes
  )

  .join("g")

  .attr(
    "class",
    "sankey-node"
  );


/* ============================================================
   NODE RECTANGLES
   ============================================================ */

node.append("rect")

  .attr(
    "x",
    d => d.x0
  )

  .attr(
    "y",
    d => d.y0
  )

  .attr(
    "width",
    d =>
      d.x1 - d.x0
  )

  .attr(
    "height",
    d =>
      d.y1 - d.y0
  )

  .attr(
    "fill",
    d =>
      nodeColour(d)
  )

  .attr(
    "stroke",
    "none"
  );


/* ============================================================
   NODE TOOLTIPS
   ============================================================ */

node.append("title")

  .text(

    d => {

      const group =

        d.group
          .charAt(0)
          .toUpperCase() +

        d.group.slice(1);


      return (

        `${group}: ${d.label}`

      );

    }

  );


/* ============================================================
   NODE LABELS
   ============================================================ */

node.append("text")

  .attr(
    "class",
    "node-label"
  )

  .attr(
    "x",

    d =>

      d.x0 <
      width / 2

        ? d.x1 + 6

        : d.x0 - 6

  )

  .attr(
    "y",

    d =>

      (
        d.y0 +
        d.y1
      ) / 2

  )

  .attr(
    "dy",
    "0.35em"
  )

  .attr(
    "text-anchor",

    d =>

      d.x0 <
      width / 2

        ? "start"

        : "end"

  )

  .attr(
    "font-family",
    "sans-serif"
  )

  .attr(
    "font-size",
    fontSize
  )

  .attr(
    "fill",
    "#333"
  )

  .text(
    d => d.label
  );