const HALIFAX_CENTER = [44.6488, -63.5752];
const LAST_VISIT_KEY = "halifax-civic-map:last-visit-date";

const SOURCE_LINKS = {
  civicAddresses:
    "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/arcgis/rest/services/CivicAddresses/FeatureServer/0",
  pplc: "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/ArcGIS/rest/services/PPLC_Permits_Geolocated/FeatureServer",
  trafficStudies:
    "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/arcgis/rest/services/HRM_Traffic_Studies/FeatureServer/0",
  activeTravelways:
    "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/ArcGIS/rest/services/Active_Travelways/FeatureServer/0",
  serviceRequests:
    "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/ArcGIS/rest/services/Cityworks_Service_Requests/FeatureServer/0",
  workOrders:
    "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/ArcGIS/rest/services/Cityworks_Work_Orders/FeatureServer/0",
  nspwProjects:
    "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/ArcGIS/rest/services/NSDPW_Capital_Projects_Work_Plan_2025_2030/FeatureServer",
  nsRoads: "https://data.novascotia.ca/resource/xtdd-axm7.geojson",
  nsTrafficSections: "https://data.novascotia.ca/resource/vg5n-eehf.geojson",
  childCare: "https://data.novascotia.ca/resource/3j9v-yimg.json",
  schools: "https://data.novascotia.ca/resource/iyap-ttn5.json",
};

const LAYERS = [
  {
    id: "building",
    label: "Building permits",
    color: "#2563eb",
    url: `${SOURCE_LINKS.pplc}/0/query`,
    source: "HRM PPL&C Building Permits",
    category: "permit",
  },
  {
    id: "construction",
    label: "Construction permits",
    color: "#b7791f",
    url: `${SOURCE_LINKS.pplc}/1/query`,
    source: "HRM PPL&C Construction Permits",
    category: "permit",
  },
  {
    id: "engineering",
    label: "Engineering permits",
    color: "#7c3aed",
    url: `${SOURCE_LINKS.pplc}/2/query`,
    source: "HRM PPL&C Engineering Permits",
    category: "permit",
  },
  {
    id: "water",
    label: "Halifax Water permits",
    color: "#0ea5e9",
    url: `${SOURCE_LINKS.pplc}/3/query`,
    source: "HRM PPL&C Halifax Water Permits",
    category: "permit",
  },
  {
    id: "landuse",
    label: "Land-use approvals",
    color: "#15803d",
    url: `${SOURCE_LINKS.pplc}/4/query`,
    source: "HRM PPL&C Land Use Approvals",
    category: "permit",
  },
  {
    id: "row",
    label: "Public ROW permits",
    color: "#db2777",
    url: `${SOURCE_LINKS.pplc}/6/query`,
    source: "HRM PPL&C Public Works ROW Permits",
    category: "permit",
    defaultOn: false,
  },
  {
    id: "traffic-studies",
    label: "Traffic studies",
    color: "#b91c1c",
    url: `${SOURCE_LINKS.trafficStudies}/query`,
    source: "HRM Traffic Studies",
    category: "traffic",
  },
  {
    id: "service-requests",
    label: "Service requests",
    color: "#dc2626",
    url: `${SOURCE_LINKS.serviceRequests}/query`,
    source: "HRM Cityworks Service Requests",
    category: "disruption",
    sourceType: "arcgis-latlon-table",
    defaultOn: false,
  },
  {
    id: "work-orders",
    label: "Work orders",
    color: "#f97316",
    url: `${SOURCE_LINKS.workOrders}/query`,
    source: "HRM Cityworks Work Orders",
    category: "disruption",
    sourceType: "arcgis-webmercator-table",
    defaultOn: false,
  },
  {
    id: "nspw-road-projects",
    label: "Provincial road projects",
    color: "#ef4444",
    url: `${SOURCE_LINKS.nspwProjects}/1/query`,
    source: "NSDPW Capital Projects Work Plan 2025-2030",
    category: "project",
    defaultOn: false,
  },
  {
    id: "nspw-bridge-projects",
    label: "Provincial bridge projects",
    color: "#8b5cf6",
    url: `${SOURCE_LINKS.nspwProjects}/0/query`,
    source: "NSDPW Capital Projects Work Plan 2025-2030",
    category: "project",
    defaultOn: false,
  },
  {
    id: "active-travelways",
    label: "Active travelways",
    color: "#059669",
    url: `${SOURCE_LINKS.activeTravelways}/query`,
    source: "HRM Active Travelways",
    category: "mobility",
    defaultOn: false,
  },
  {
    id: "traffic-volume-sections",
    label: "Provincial traffic sections",
    color: "#0f766e",
    url: SOURCE_LINKS.nsTrafficSections,
    source: "Nova Scotia Traffic Volume Sections",
    category: "road",
    sourceType: "socrata-geojson",
    defaultOn: false,
  },
  {
    id: "ns-roads",
    label: "NS addressable roads",
    color: "#64748b",
    url: SOURCE_LINKS.nsRoads,
    source: "NSCAF Addressable Roads",
    category: "road",
    sourceType: "socrata-geojson",
    defaultOn: false,
  },
  {
    id: "child-care",
    label: "Child care",
    color: "#a855f7",
    url: SOURCE_LINKS.childCare,
    source: "Nova Scotia Child Care Directory",
    category: "community",
    sourceType: "socrata-point-json",
    geometryField: "georeference",
    where: "county='Halifax County'",
    defaultOn: false,
  },
  {
    id: "schools",
    label: "Public schools",
    color: "#0891b2",
    url: SOURCE_LINKS.schools,
    source: "Nova Scotia Public Schools",
    category: "community",
    sourceType: "socrata-point-json",
    geometryField: "geo_location",
    defaultOn: false,
  },
];

const DATE_FIELD_SETS = {
  any: [
    "DATE_OF_PERMIT_ISSUANCE",
    "DATE_OF_SUBMISSION",
    "COMPLETED_DATE",
    "EXPIRATION_DATE",
    "DATE_INSPECTION_COMPLETED",
    "SURVEYDATE1",
    "SURVEYDATE2",
    "ADDDATE",
    "DATE_INITIATED",
    "DATE_CLOSED",
    "ACTUAL_START_DATE",
    "ACTUAL_FINISH_DATE",
  ],
  submitted: ["DATE_OF_SUBMISSION"],
  issued: ["DATE_OF_PERMIT_ISSUANCE"],
  completed: ["COMPLETED_DATE"],
  expires: ["EXPIRATION_DATE"],
  inspection: ["DATE_INSPECTION_COMPLETED"],
  "traffic-survey": ["SURVEYDATE1", "SURVEYDATE2"],
  "record-added": ["ADDDATE", "SYS_DATE"],
};

const CLOSED_STATUS_PARTS = ["cancelled", "expired", "withdrawn"];
const STUDY_TYPE_COLORS = {
  BIKE: "#7c3aed",
  CLS: "#64748b",
  LTI: "#0891b2",
  OBSV: "#f97316",
  PED: "#16a34a",
  SDS: "#ca8a04",
  SPD: "#dc2626",
  TMC: "#2563eb",
  TSW: "#be185d",
  VOL: "#0f766e",
};

const state = {
  center: null,
  radius: 500,
  recordsByLayer: new Map(),
  rawGeoJsonByLayer: new Map(),
  leafletLayers: new Map(),
  selectedLayerIds: new Set(LAYERS.filter((layer) => layer.defaultOn !== false).map((layer) => layer.id)),
  selectedAddress: null,
  marker: null,
  radiusCircle: null,
  filters: {
    period: "all",
    dateField: "any",
    completion: "all",
    trafficType: "all",
    dateFrom: "",
    dateTo: "",
  },
  visual: {
    trafficColorBy: "speed",
    trafficSizeBy: "volume",
    trafficLines: true,
    trafficLineMetric: "volume",
    permitSignals: true,
  },
};

const map = L.map("map", {
  zoomControl: true,
  preferCanvas: true,
}).setView(HALIFAX_CENTER, 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const layerToggleEl = document.getElementById("layer-toggles");
const legendEl = document.getElementById("legend");
const summaryEl = document.getElementById("summary");
const statusPillEl = document.getElementById("status-pill");
const radiusInput = document.getElementById("radius-input");
const searchInput = document.getElementById("place-input");
const suggestionEl = document.getElementById("address-suggestions");
const searchForm = document.getElementById("search-form");
const refreshButton = document.getElementById("refresh-button");
const periodFilter = document.getElementById("period-filter");
const dateFieldFilter = document.getElementById("date-field-filter");
const completionFilter = document.getElementById("completion-filter");
const trafficTypeFilter = document.getElementById("traffic-type-filter");
const dateFromFilter = document.getElementById("date-from-filter");
const dateToFilter = document.getElementById("date-to-filter");
const customDateRow = document.getElementById("custom-date-row");
const trafficColorBy = document.getElementById("traffic-color-by");
const trafficSizeBy = document.getElementById("traffic-size-by");
const trafficLineMetric = document.getElementById("traffic-line-metric");
const trafficLinesToggle = document.getElementById("traffic-lines-toggle");
const permitSignalsToggle = document.getElementById("permit-signals-toggle");

initLayerToggles();
renderLegend();

map.on("click", (event) => {
  setSelectedPlace(event.latlng.lat, event.latlng.lng, "Selected map point");
  refreshData();
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  setStatus("Searching...");
  const result = state.selectedAddress?.label === query ? state.selectedAddress : await searchAddress(query);
  if (!result) {
    setStatus("No match found");
    return;
  }

  hideSuggestions();
  setSelectedPlace(result.lat, result.lon, result.label || result.display_name);
  map.setView([result.lat, result.lon], radiusZoom());
  await refreshData();
});

refreshButton.addEventListener("click", () => refreshData());
searchInput.addEventListener("input", debounce(handleAddressInput, 250));
searchInput.addEventListener("focus", () => {
  if (suggestionEl.childElementCount) suggestionEl.classList.add("is-open");
});
document.addEventListener("click", (event) => {
  if (!searchForm.contains(event.target)) hideSuggestions();
});
radiusInput.addEventListener("change", () => {
  state.radius = Number(radiusInput.value);
  if (state.center) {
    updateSelectionGraphics();
    refreshData();
  }
});

[periodFilter, dateFieldFilter, completionFilter, trafficTypeFilter, dateFromFilter, dateToFilter].forEach((input) => {
  input.addEventListener("change", () => {
    readFilters();
    redrawFromRawData();
  });
});

[trafficColorBy, trafficSizeBy, trafficLineMetric, trafficLinesToggle, permitSignalsToggle].forEach((input) => {
  input.addEventListener("change", () => {
    readVisualSettings();
    redrawFromRawData();
  });
});

document.querySelectorAll("[data-since-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    applySincePreset(button.dataset.sincePreset);
    redrawFromRawData();
  });
});

async function geocode(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ca");
  url.searchParams.set("q", `${query}, Halifax Regional Municipality, Nova Scotia`);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Geocode failed: ${response.status}`);
  const results = await response.json();
  if (!results.length) return null;

  return {
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
    display_name: results[0].display_name,
  };
}

async function searchAddress(query) {
  const civicMatches = await queryCivicAddresses(query, 1);
  if (civicMatches.length) return civicMatches[0];
  const result = await geocode(query);
  if (!result) return null;

  return {
    lat: result.lat,
    lon: result.lon,
    label: result.display_name,
  };
}

async function handleAddressInput() {
  const query = searchInput.value.trim();
  state.selectedAddress = null;
  if (query.length < 3) {
    hideSuggestions();
    return;
  }

  try {
    const suggestions = await queryCivicAddresses(query, 8);
    renderAddressSuggestions(suggestions);
  } catch (error) {
    console.error(error);
    hideSuggestions();
  }
}

async function queryCivicAddresses(query, limit) {
  const parsed = parseAddressQuery(query);
  if (!parsed.street) return [];

  const url = new URL(`${SOURCE_LINKS.civicAddresses}/query`);
  url.searchParams.set("f", "geojson");
  url.searchParams.set("where", civicAddressWhere(parsed));
  url.searchParams.set("outFields", "OBJECTID,FULL_CIVIC,CIV_NUM,CIV_ALPHA,STR_NAME,STR_TYPE,GSA_NAME,PID");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("orderByFields", "STR_NAME ASC,CIV_NUM ASC");
  url.searchParams.set("resultRecordCount", String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Civic address search returned ${response.status}`);
  const geojson = await response.json();
  if (geojson.error) throw new Error(geojson.error.message || "Civic address search failed");

  return (geojson.features || [])
    .filter((feature) => feature.geometry?.coordinates?.length >= 2)
    .map((feature) => {
      const props = feature.properties || {};
      const [lon, lat] = feature.geometry.coordinates;
      const label = formatCivicAddress(props);
      return { lat, lon, label, props };
    });
}

function parseAddressQuery(query) {
  const cleaned = query
    .toUpperCase()
    .replace(/\b(HALIFAX|NOVA SCOTIA|NS|CANADA|HRM)\b/g, " ")
    .replace(/[,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const numbered = cleaned.match(/^(\d+)\s+(.+)$/);
  if (numbered) return { civicNumber: Number(numbered[1]), street: numbered[2] };
  return { civicNumber: null, street: cleaned };
}

function civicAddressWhere(parsed) {
  const street = sqlString(parsed.street.split(/\s+/)[0]);
  const clauses = [`UPPER(STR_NAME) LIKE '${street}%'`, "MUN_CODE = 'HRM'"];
  if (parsed.civicNumber) clauses.unshift(`CIV_NUM = ${parsed.civicNumber}`);
  return clauses.join(" AND ");
}

function renderAddressSuggestions(suggestions) {
  if (!suggestions.length) {
    hideSuggestions();
    return;
  }

  suggestionEl.innerHTML = suggestions
    .map(
      (suggestion, index) => `<button class="suggestion-button" type="button" role="option" data-index="${index}">
        <span class="suggestion-main">${escapeHtml(suggestion.label)}</span>
        <span class="suggestion-sub">HRM civic address${suggestion.props?.PID ? ` - PID ${escapeHtml(suggestion.props.PID)}` : ""}</span>
      </button>`,
    )
    .join("");
  suggestionEl.classList.add("is-open");

  suggestionEl.querySelectorAll(".suggestion-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const suggestion = suggestions[Number(button.dataset.index)];
      state.selectedAddress = suggestion;
      searchInput.value = suggestion.label;
      hideSuggestions();
      setSelectedPlace(suggestion.lat, suggestion.lon, suggestion.label);
      map.setView([suggestion.lat, suggestion.lon], radiusZoom());
      await refreshData();
    });
  });
}

function hideSuggestions() {
  suggestionEl.classList.remove("is-open");
}

function formatCivicAddress(props) {
  const civic = firstValue(props, ["FULL_CIVIC", "CIV_NUM"]);
  const street = [props.STR_NAME, props.STR_TYPE].filter(Boolean).join(" ");
  const community = props.GSA_NAME || "HRM";
  return [civic, street].filter(Boolean).join(" ") + (community ? `, ${community}` : "");
}

function setSelectedPlace(lat, lon, label) {
  state.center = { lat, lon, label };
  updateSelectionGraphics();
  setStatus("Place selected");
}

function updateSelectionGraphics() {
  if (!state.center) return;
  const latLng = [state.center.lat, state.center.lon];

  if (!state.marker) {
    state.marker = L.marker(latLng).addTo(map);
  } else {
    state.marker.setLatLng(latLng);
  }

  state.marker.bindPopup(`<strong>${escapeHtml(state.center.label)}</strong>`).openPopup();

  if (!state.radiusCircle) {
    state.radiusCircle = L.circle(latLng, {
      radius: state.radius,
      color: "#0f766e",
      fillColor: "#0f766e",
      fillOpacity: 0.08,
      weight: 2,
    }).addTo(map);
  } else {
    state.radiusCircle.setLatLng(latLng);
    state.radiusCircle.setRadius(state.radius);
  }
}

async function refreshData() {
  if (!state.center) {
    setStatus("Select a place first");
    return;
  }

  state.radius = Number(radiusInput.value);
  refreshButton.disabled = true;
  setStatus("Fetching public data...");
  clearDataLayers();

  const activeLayers = LAYERS.filter((layer) => state.selectedLayerIds.has(layer.id));
  const fetches = activeLayers.map(async (layer) => {
    try {
      const geojson = await queryLayer(layer, state.center, state.radius);
      state.rawGeoJsonByLayer.set(layer.id, geojson);
    } catch (error) {
      state.rawGeoJsonByLayer.set(layer.id, { type: "FeatureCollection", features: [] });
      state.recordsByLayer.set(layer.id, []);
      console.error(error);
      renderLayerError(layer, error);
    }
  });

  await Promise.all(fetches);
  redrawFromRawData();
  window.localStorage.setItem(LAST_VISIT_KEY, isoDate(new Date()));
  setStatus("Updated");
  refreshButton.disabled = false;
}

async function queryLayer(layer, center, radiusMeters) {
  if (layer.sourceType === "socrata-geojson") return querySocrataGeoJson(layer, center, radiusMeters);
  if (layer.sourceType === "socrata-point-json") return querySocrataPointJson(layer, center, radiusMeters);
  if (layer.sourceType === "arcgis-latlon-table") return queryArcGisLatLonTable(layer, center, radiusMeters);
  if (layer.sourceType === "arcgis-webmercator-table") return queryArcGisWebMercatorTable(layer, center, radiusMeters);
  return queryArcGisLayer(layer, center, radiusMeters);
}

async function queryArcGisLayer(layer, center, radiusMeters) {
  const url = new URL(layer.url);
  const params = {
    f: "geojson",
    where: "1=1",
    outFields: "*",
    returnGeometry: "true",
    geometry: `${center.lon},${center.lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(radiusMeters),
    units: "esriSRUnit_Meter",
    outSR: "4326",
    resultRecordCount: "2000",
  };

  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`${layer.label} returned ${response.status}`);
  const geojson = await response.json();

  if (geojson.error) {
    throw new Error(geojson.error.message || `${layer.label} query failed`);
  }

  return geojson;
}

async function queryArcGisLatLonTable(layer, center, radiusMeters) {
  const bbox = bboxForRadius(center, radiusMeters);
  const where = [
    `LATITUDE >= ${bbox.south}`,
    `LATITUDE <= ${bbox.north}`,
    `LONGITUDE >= ${bbox.west}`,
    `LONGITUDE <= ${bbox.east}`,
  ].join(" AND ");
  const json = await queryArcGisTable(layer, where, "REQUEST_ID DESC", 2000);
  return filterGeoJsonByRadius(tableFeaturesToGeoJson(json, (props) => [numberValue(props.LONGITUDE), numberValue(props.LATITUDE)]), center, radiusMeters);
}

async function queryArcGisWebMercatorTable(layer, center, radiusMeters) {
  const bbox = webMercatorBboxForRadius(center, radiusMeters);
  const where = [
    `X_COORDINATE >= ${bbox.west}`,
    `X_COORDINATE <= ${bbox.east}`,
    `Y_COORDINATE >= ${bbox.south}`,
    `Y_COORDINATE <= ${bbox.north}`,
  ].join(" AND ");
  const json = await queryArcGisTable(layer, where, "DATE_INITIATED DESC", 2000);
  return filterGeoJsonByRadius(
    tableFeaturesToGeoJson(json, (props) => webMercatorToLonLat(numberValue(props.X_COORDINATE), numberValue(props.Y_COORDINATE))),
    center,
    radiusMeters,
  );
}

async function queryArcGisTable(layer, where, orderByFields, resultRecordCount) {
  const url = new URL(layer.url);
  url.searchParams.set("f", "json");
  url.searchParams.set("where", where);
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("resultRecordCount", String(resultRecordCount));
  if (orderByFields) url.searchParams.set("orderByFields", orderByFields);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`${layer.label} returned ${response.status}`);
  const json = await response.json();
  if (json.error) throw new Error(json.error.message || `${layer.label} query failed`);
  return json;
}

function tableFeaturesToGeoJson(json, coordinateGetter) {
  const features = (json.features || [])
    .map((feature) => {
      const props = feature.attributes || feature.properties || {};
      const coords = coordinateGetter(props);
      if (!coords || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) return null;
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: coords },
        properties: props,
      };
    })
    .filter(Boolean);
  return { type: "FeatureCollection", features };
}

async function querySocrataGeoJson(layer, center, radiusMeters) {
  const bbox = bboxForRadius(center, radiusMeters);
  const url = new URL(layer.url);
  url.searchParams.set("$limit", "5000");
  url.searchParams.set("$where", `within_box(the_geom,${bbox.north},${bbox.west},${bbox.south},${bbox.east})`);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`${layer.label} returned ${response.status}`);
  const geojson = await response.json();
  if (geojson.error) throw new Error(geojson.message || `${layer.label} query failed`);
  return filterGeoJsonByRadius(geojson, center, radiusMeters);
}

async function querySocrataPointJson(layer, center, radiusMeters) {
  const url = new URL(layer.url);
  url.searchParams.set("$limit", "5000");
  if (layer.where) url.searchParams.set("$where", layer.where);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`${layer.label} returned ${response.status}`);
  const records = await response.json();
  if (!Array.isArray(records)) throw new Error(`${layer.label} did not return a record list`);

  const geojson = {
    type: "FeatureCollection",
    features: records
      .map((props) => {
        const geometry = props[layer.geometryField];
        const coords = geometry?.coordinates;
        if (!coords || coords.length < 2) return null;
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [Number(coords[0]), Number(coords[1])] },
          properties: props,
        };
      })
      .filter(Boolean),
  };

  return filterGeoJsonByRadius(geojson, center, radiusMeters);
}

function bboxForRadius(center, radiusMeters) {
  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lon + lonDelta,
    west: center.lon - lonDelta,
  };
}

function webMercatorBboxForRadius(center, radiusMeters) {
  const bbox = bboxForRadius(center, radiusMeters);
  const sw = lonLatToWebMercator(bbox.west, bbox.south);
  const ne = lonLatToWebMercator(bbox.east, bbox.north);
  return {
    west: sw[0],
    south: sw[1],
    east: ne[0],
    north: ne[1],
  };
}

function lonLatToWebMercator(lon, lat) {
  const x = (lon * 20037508.34) / 180;
  const boundedLat = clamp(lat, -85.05112878, 85.05112878);
  const y = Math.log(Math.tan(((90 + boundedLat) * Math.PI) / 360)) / (Math.PI / 180);
  return [x, (y * 20037508.34) / 180];
}

function webMercatorToLonLat(x, y) {
  const lon = (x / 20037508.34) * 180;
  const lat = (Math.atan(Math.exp(((y / 20037508.34) * 180 * Math.PI) / 180)) * 360) / Math.PI - 90;
  return [lon, lat];
}

function filterGeoJsonByRadius(geojson, center, radiusMeters) {
  return {
    ...geojson,
    features: (geojson.features || []).filter((feature) => featureWithinRadius(feature, center, radiusMeters)),
  };
}

function featureWithinRadius(feature, center, radiusMeters) {
  return coordinatesForFeature(feature).some(
    ([lon, lat]) => haversineMeters(center.lat, center.lon, Number(lat), Number(lon)) <= radiusMeters,
  );
}

function coordinatesForFeature(feature) {
  const geometry = feature.geometry || {};
  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "LineString" || geometry.type === "MultiPoint") return geometry.coordinates || [];
  if (geometry.type === "MultiLineString" || geometry.type === "Polygon") return (geometry.coordinates || []).flat();
  if (geometry.type === "MultiPolygon") return (geometry.coordinates || []).flat(2);
  return [];
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const radius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clearDataLayers() {
  state.leafletLayers.forEach((leafletLayer) => map.removeLayer(leafletLayer));
  state.leafletLayers.clear();
  state.recordsByLayer.clear();
  state.rawGeoJsonByLayer.clear();
}

function clearRenderedLayers() {
  state.leafletLayers.forEach((leafletLayer) => map.removeLayer(leafletLayer));
  state.leafletLayers.clear();
  state.recordsByLayer.clear();
}

function redrawFromRawData() {
  if (!state.center) {
    updateCustomDateControls();
    renderLayerCounts();
    return;
  }

  updateCustomDateControls();
  clearRenderedLayers();

  for (const layer of LAYERS.filter((entry) => state.selectedLayerIds.has(entry.id))) {
    const rawGeojson = state.rawGeoJsonByLayer.get(layer.id);
    if (!rawGeojson) continue;
    const filteredGeojson = filterGeoJson(layer, rawGeojson);
    state.recordsByLayer.set(layer.id, filteredGeojson.features || []);
    if (filteredGeojson.features?.length) renderGeoJsonLayer(layer, filteredGeojson);
  }

  renderLayerCounts();
  renderSummary();
}

function readFilters() {
  state.filters.period = periodFilter.value;
  state.filters.dateField = dateFieldFilter.value;
  state.filters.completion = completionFilter.value;
  state.filters.trafficType = trafficTypeFilter.value;
  state.filters.dateFrom = dateFromFilter.value;
  state.filters.dateTo = dateToFilter.value;
  updateCustomDateControls();
}

function readVisualSettings() {
  state.visual.trafficColorBy = trafficColorBy.value;
  state.visual.trafficSizeBy = trafficSizeBy.value;
  state.visual.trafficLines = trafficLinesToggle.checked;
  state.visual.trafficLineMetric = trafficLineMetric.value;
  state.visual.permitSignals = permitSignalsToggle.checked;
}

function applySincePreset(preset) {
  const today = isoDate(new Date());
  if (preset === "clear") {
    periodFilter.value = "all";
    dateFromFilter.value = "";
    dateToFilter.value = "";
  } else if (preset === "year") {
    periodFilter.value = "custom";
    dateFromFilter.value = `${new Date().getFullYear()}-01-01`;
    dateToFilter.value = today;
  } else if (preset === "last-visit") {
    const lastVisit = window.localStorage.getItem(LAST_VISIT_KEY);
    if (lastVisit) {
      periodFilter.value = "custom";
      dateFromFilter.value = lastVisit;
      dateToFilter.value = today;
    } else {
      periodFilter.value = "30";
      dateFromFilter.value = "";
      dateToFilter.value = "";
    }
  } else {
    periodFilter.value = preset;
    dateFromFilter.value = "";
    dateToFilter.value = "";
  }

  readFilters();
}

function updateCustomDateControls() {
  customDateRow.hidden = state.filters.period !== "custom";
}

function filterGeoJson(layer, geojson) {
  const features = (geojson.features || []).filter((feature) => recordMatchesFilters(layer, feature));
  return { ...geojson, features };
}

function recordMatchesFilters(layer, feature) {
  const props = feature.properties || {};
  if (!matchesDateFilter(props)) return false;
  if (layer.category === "permit" && !matchesPermitStatusFilter(props)) return false;
  if (layer.category === "traffic" && !matchesTrafficTypeFilter(props)) return false;
  return true;
}

function matchesTrafficTypeFilter(props) {
  if (state.filters.trafficType === "all") return true;
  return String(props.STUDY_TYPE || "").toUpperCase() === state.filters.trafficType;
}

function matchesDateFilter(props) {
  const range = currentDateRange();
  if (!range) return true;

  return dateValuesForFilter(props).some((date) => date >= range.from && date <= range.to);
}

function dateValuesForFilter(props) {
  const fields = DATE_FIELD_SETS[state.filters.dateField] || DATE_FIELD_SETS.any;
  return fields.map((field) => parseDate(props[field])).filter(Boolean);
}

function currentDateRange() {
  const now = new Date();
  if (state.filters.period === "all") return null;
  if (state.filters.period === "custom") {
    const from = state.filters.dateFrom ? startOfDay(new Date(`${state.filters.dateFrom}T00:00:00`)) : null;
    const to = state.filters.dateTo ? endOfDay(new Date(`${state.filters.dateTo}T00:00:00`)) : null;
    if (!from && !to) return null;
    return {
      from: from || new Date(0),
      to: to || endOfDay(now),
    };
  }

  const days = Number(state.filters.period);
  if (!days) return null;
  const from = startOfDay(new Date(now));
  from.setDate(from.getDate() - days);
  return { from, to: endOfDay(now) };
}

function matchesPermitStatusFilter(props) {
  const mode = state.filters.completion;
  if (mode === "all") return true;

  const status = String(firstValue(props, ["PERMIT_STATUS", "Permit_Status", "STATUS"]) || "").toLowerCase();
  const completedDate = parseDate(props.COMPLETED_DATE);
  const isCompleted = status.includes("completed") || Boolean(completedDate);
  const isClosed = CLOSED_STATUS_PARTS.some((part) => status.includes(part));

  if (mode === "completed") return isCompleted;
  if (mode === "closed") return isClosed || status.includes("completed");
  if (mode === "open") return !isCompleted && !isClosed;
  return true;
}

function renderGeoJsonLayer(layer, geojson) {
  if (layer.category === "traffic" && state.visual.trafficLines) {
    renderTrafficStreetLines(layer, geojson.features || []);
  }

  const leafletLayer = L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, pointStyleForFeature(layer, feature)),
    style: (feature) => polygonStyleForFeature(layer, feature),
    onEachFeature: (feature, marker) => {
      marker.bindPopup(renderPopup(layer, feature.properties || {}));
    },
  }).addTo(map);

  state.leafletLayers.set(layer.id, leafletLayer);
}

function pointStyleForFeature(layer, feature) {
  if (layer.category === "traffic") return trafficPointStyle(feature.properties || {});
  if (layer.category === "permit" && state.visual.permitSignals) return permitPointStyle(layer, feature.properties || {});
  if (layer.category === "disruption") return disruptionPointStyle(layer, feature.properties || {});
  if (layer.category === "project") return projectPointStyle(layer, feature.properties || {});
  if (layer.category === "community") return communityPointStyle(layer, feature.properties || {});
  return {
    radius: 6,
    fillColor: layer.color,
    color: "#ffffff",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.82,
  };
}

function polygonStyleForFeature(layer, feature) {
  if (layer.category === "road") {
    return {
      color: layer.color,
      fillColor: layer.color,
      fillOpacity: 0.05,
      weight: layer.id === "traffic-volume-sections" ? 4 : 1.4,
      opacity: layer.id === "traffic-volume-sections" ? 0.72 : 0.4,
    };
  }
  if (layer.category === "mobility") {
    return {
      color: activeTravelwayColor(feature.properties || {}, layer.color),
      fillColor: layer.color,
      fillOpacity: 0.05,
      weight: 2.6,
      opacity: 0.78,
      dashArray: "5 4",
    };
  }
  if (layer.category === "project") {
    return {
      color: projectColor(feature.properties || {}, layer.color),
      fillColor: layer.color,
      fillOpacity: 0.14,
      weight: 4,
      opacity: 0.78,
    };
  }
  return {
    color: layer.color,
    fillColor: layer.color,
    fillOpacity: 0.2,
    weight: feature?.geometry?.type === "Point" ? 1 : 2,
  };
}

function disruptionPointStyle(layer, props) {
  const status = String(firstValue(props, ["STATUS"]) || "").toLowerCase();
  const priority = String(firstValue(props, ["PRIORITY"]) || "").toLowerCase();
  const open = status && !/(complete|closed|cancelled)/i.test(status);
  return {
    radius: priority.includes("high") ? 10 : open ? 8 : 5,
    fillColor: open ? layer.color : "#94a3b8",
    color: priority.includes("high") ? "#7f1d1d" : "#ffffff",
    weight: priority.includes("high") ? 2.4 : 1.2,
    opacity: 1,
    fillOpacity: open ? 0.86 : 0.58,
  };
}

function projectPointStyle(layer, props) {
  return {
    radius: 8,
    fillColor: projectColor(props, layer.color),
    color: "#ffffff",
    weight: 1.5,
    opacity: 1,
    fillOpacity: 0.86,
  };
}

function communityPointStyle(layer, props) {
  const capacity = numberValue(props.total_licence_capacity);
  return {
    radius: Number.isFinite(capacity) ? clamp(5 + Math.sqrt(capacity) / 2, 5, 13) : 6,
    fillColor: layer.color,
    color: "#ffffff",
    weight: 1.2,
    opacity: 1,
    fillOpacity: 0.8,
  };
}

function projectColor(props, fallback) {
  const duration = String(firstValue(props, ["PRJ_DUR", "PRJ_YR_ST"]) || "");
  if (duration.includes("2025")) return "#dc2626";
  if (duration.includes("2026")) return "#ea580c";
  if (duration.includes("2027")) return "#2563eb";
  if (duration.includes("2028")) return "#16a34a";
  if (duration.includes("2029")) return "#ca8a04";
  return fallback;
}

function activeTravelwayColor(props, fallback) {
  const code = String(props.ASSETCODE || "").toUpperCase();
  if (code === "SDW") return "#ca8a04";
  if (code === "MUT") return "#0f766e";
  if (code === "TRL") return "#16a34a";
  if (code === "CRSWAK") return "#2563eb";
  return fallback;
}

function trafficPointStyle(props) {
  const color = colorForTrafficMetric(props, state.visual.trafficColorBy);
  return {
    radius: trafficPointRadius(props),
    fillColor: color,
    color: "#ffffff",
    weight: 1.25,
    opacity: 1,
    fillOpacity: 0.78,
  };
}

function trafficPointRadius(props) {
  if (state.visual.trafficSizeBy === "fixed") return 5;
  const value = trafficMetricValue(props, state.visual.trafficSizeBy);
  if (!Number.isFinite(value)) return 5;
  if (state.visual.trafficSizeBy === "speed") return clamp(4 + (value - 30) / 7, 4, 12);
  return clamp(4 + Math.sqrt(value) / 13, 4, 16);
}

function permitPointStyle(layer, props) {
  const signal = permitSignal(props);
  const border = signal.flags.includes("stale") || signal.flags.includes("friction")
    ? "#dc2626"
    : signal.flags.includes("new")
      ? "#f59e0b"
      : signal.flags.includes("housing")
        ? "#16a34a"
        : "#ffffff";
  return {
    radius: clamp(5 + signal.score * 1.1, 5, 14),
    fillColor: layer.color,
    color: border,
    weight: signal.score > 0 ? 2.4 : 1,
    opacity: 1,
    fillOpacity: signal.score > 0 ? 0.88 : 0.72,
  };
}

function renderTrafficStreetLines(layer, features) {
  const lineFeatures = trafficLineFeatures(features);
  if (!lineFeatures.length) return;

  const lineLayer = L.geoJSON(
    { type: "FeatureCollection", features: lineFeatures },
    {
      style: (feature) => ({
        color: feature.properties.color,
        weight: feature.properties.weight,
        opacity: 0.56,
        lineCap: "round",
        lineJoin: "round",
      }),
      onEachFeature: (feature, marker) => {
        marker.bindPopup(renderTrafficLinePopup(feature.properties));
      },
    },
  ).addTo(map);

  state.leafletLayers.set(`${layer.id}-lines`, lineLayer);
}

function trafficLineFeatures(features) {
  const groups = new Map();
  for (const feature of features) {
    const props = feature.properties || {};
    const street = normalizeStreetName(props.STREETNAME1);
    const coords = feature.geometry?.coordinates;
    if (!street || !coords || coords.length < 2) continue;
    if (!groups.has(street)) groups.set(street, []);
    groups.get(street).push(feature);
  }

  return Array.from(groups.entries())
    .filter(([, entries]) => entries.length >= 2)
    .map(([street, entries]) => trafficLineFeature(street, entries))
    .filter(Boolean);
}

function trafficLineFeature(street, entries) {
  const points = entries
    .map((feature) => ({
      feature,
      coords: feature.geometry.coordinates,
    }))
    .filter((entry) => entry.coords?.length >= 2);
  if (points.length < 2) return null;

  const lonRange = range(points.map((point) => point.coords[0]));
  const latRange = range(points.map((point) => point.coords[1]));
  points.sort((a, b) => (lonRange >= latRange ? a.coords[0] - b.coords[0] : a.coords[1] - b.coords[1]));

  const values = points
    .map((point) => trafficMetricValue(point.feature.properties || {}, state.visual.trafficLineMetric))
    .filter(Number.isFinite);
  const avg = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : points.length;
  const colorMetricProps = representativeTrafficProps(points);

  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: points.map((point) => point.coords),
    },
    properties: {
      street,
      studies: points.length,
      metric: state.visual.trafficLineMetric,
      average: avg,
      color: colorForTrafficMetric(colorMetricProps, state.visual.trafficColorBy),
      weight: lineWeight(avg, state.visual.trafficLineMetric, points.length),
    },
  };
}

function representativeTrafficProps(points) {
  const props = {};
  const speedValues = [];
  const volumeValues = [];
  const years = [];
  for (const point of points) {
    const source = point.feature.properties || {};
    const speed = trafficMetricValue(source, "speed");
    const volume = trafficMetricValue(source, "volume");
    const year = trafficMetricValue(source, "year");
    if (Number.isFinite(speed)) speedValues.push(speed);
    if (Number.isFinite(volume)) volumeValues.push(volume);
    if (Number.isFinite(year)) years.push(year);
    props.STUDY_TYPE ||= source.STUDY_TYPE;
  }
  if (speedValues.length) props.F85TH_PER = average(speedValues);
  if (volumeValues.length) props.AAWT = average(volumeValues);
  if (years.length) props.YEAR = Math.max(...years);
  return props;
}

function lineWeight(value, metric, count) {
  if (metric === "speed") return clamp(2 + (value - 30) / 6, 2, 11);
  if (metric === "count") return clamp(2 + count * 1.4, 2, 12);
  return clamp(2 + Math.sqrt(value || 0) / 9, 2, 14);
}

function renderTrafficLinePopup(props) {
  const metricLabel = props.metric === "volume" ? "Avg volume" : props.metric === "speed" ? "Avg speed" : "Study count";
  return `<div class="popup">
    <div class="popup-title">${escapeHtml(props.street)} traffic sketch</div>
    <div class="popup-row"><strong>Studies:</strong> ${escapeHtml(props.studies)}</div>
    <div class="popup-row"><strong>${escapeHtml(metricLabel)}:</strong> ${escapeHtml(formatNumber(props.average))}</div>
    <div class="popup-row"><strong>Boundary:</strong> Interpolated between study points; not continuous measured road data.</div>
  </div>`;
}

function trafficMetricValue(props, metric) {
  if (metric === "speed") return numberValue(props.F85TH_PER);
  if (metric === "volume") return numberValue(props.AAWT);
  if (metric === "year") {
    const year = numberValue(props.YEAR);
    if (Number.isFinite(year)) return year;
    const surveyDate = parseDate(firstValue(props, ["SURVEYDATE1", "SURVEYDATE2", "ADDDATE"]));
    return surveyDate ? surveyDate.getFullYear() : NaN;
  }
  if (metric === "count") return 1;
  return NaN;
}

function colorForTrafficMetric(props, metric) {
  if (metric === "study-type") {
    return STUDY_TYPE_COLORS[String(props.STUDY_TYPE || "").toUpperCase()] || "#64748b";
  }

  const value = trafficMetricValue(props, metric);
  if (!Number.isFinite(value)) return "#64748b";

  if (metric === "speed") {
    if (value >= 60) return "#b91c1c";
    if (value >= 50) return "#ea580c";
    if (value >= 40) return "#ca8a04";
    return "#15803d";
  }

  if (metric === "volume") {
    if (value >= 7000) return "#b91c1c";
    if (value >= 4000) return "#ea580c";
    if (value >= 1500) return "#ca8a04";
    return "#15803d";
  }

  const currentYear = new Date().getFullYear();
  if (value >= currentYear - 1) return "#2563eb";
  if (value >= currentYear - 4) return "#0f766e";
  return "#64748b";
}

function permitSignal(props) {
  const reasons = [];
  const flags = [];
  let score = 0;

  const status = String(firstValue(props, ["PERMIT_STATUS", "Permit_Status", "STATUS"]) || "").toLowerCase();
  const issued = parseDate(firstValue(props, ["DATE_OF_PERMIT_ISSUANCE", "ISSUED_DATE", "Issued_Date"]));
  const submitted = parseDate(props.DATE_OF_SUBMISSION);
  const completed = parseDate(props.COMPLETED_DATE);
  const expires = parseDate(props.EXPIRATION_DATE);
  const value = numberValue(props.ESTIMATED_PROJECT_VALUE);
  const units = numberValue(props.NET_NEW_UNITS);
  const workType = String(firstValue(props, ["PRIMARY_WORK_TYPE", "WORK_TYPE", "PERMIT_NAME", "PRIMARY_WORK_SCOPE"]) || "");
  const dateForAge = issued || submitted;
  const open = !completed && !status.includes("completed") && !CLOSED_STATUS_PARTS.some((part) => status.includes(part));

  if (isNewInCurrentRange(props)) {
    score += 3;
    flags.push("new");
    reasons.push("new");
  }
  if (open) {
    score += 1;
    flags.push("open");
    reasons.push("open");
  }
  if (open && dateForAge && daysBetween(dateForAge, new Date()) > 365) {
    score += 3;
    flags.push("stale");
    reasons.push("stale open");
  }
  if (Number.isFinite(value) && value >= 1000000) {
    score += 3;
    flags.push("high-value");
    reasons.push(`$${Math.round(value / 100000) / 10}M`);
  } else if (Number.isFinite(value) && value >= 250000) {
    score += 1;
    flags.push("value");
    reasons.push("$250k+");
  }
  if (Number.isFinite(units) && units > 0) {
    score += Math.min(4, 1 + units);
    flags.push("housing");
    reasons.push(`+${units} units`);
  }
  if (/(incomplete|revision|requested|review)/i.test(status)) {
    score += 2;
    flags.push("friction");
    reasons.push("review/friction");
  }
  if (open && expires) {
    const daysToExpiry = daysBetween(new Date(), expires);
    if (daysToExpiry >= 0 && daysToExpiry <= 90) {
      score += 2;
      flags.push("expiring");
      reasons.push("expiring soon");
    }
  }
  if (/(demolition|new|addition|change of use|conversion)/i.test(workType)) {
    score += 1;
    flags.push("notable-work");
    reasons.push(workType.trim().slice(0, 28));
  }

  return { score, reasons: unique(reasons).slice(0, 4), flags };
}

function isNewInCurrentRange(props) {
  const range = currentDateRange();
  if (!range) return false;
  return dateValuesForFilter(props).some((date) => date >= range.from && date <= range.to);
}

function renderLayerError(layer, error) {
  const existing = summaryEl.innerHTML;
  summaryEl.innerHTML =
    existing +
    `<div class="summary-card"><h3>${escapeHtml(layer.label)}</h3><p class="muted">Could not fetch this layer: ${escapeHtml(error.message)}</p></div>`;
}

function renderPopup(layer, props) {
  const title = firstValue(props, [
    "PERMIT_NUMBER",
    "Permit_Number",
    "PERMIT_NAME",
    "Permit_Name",
    "EVENT_UNIQUE_ID",
    "REQUEST_ID",
    "WORK_ORDER_ID",
    "PROJECT_NAME",
    "PRJ_DESC",
    "sect_desc",
    "street",
    "facility_name",
    "school_name",
    "OBJECTID",
    "ObjectId",
  ]);
  const rows = popupRows(layer, props)
    .map(([label, value]) => `<div class="popup-row"><strong>${label}:</strong> ${escapeHtml(formatValue(value))}</div>`)
    .join("");

  const badges = layer.category === "permit" && state.visual.permitSignals ? renderPermitBadges(props) : "";

  return `<div class="popup">
    <div class="popup-title">${escapeHtml(layer.label)}${title ? ` - ${escapeHtml(formatValue(title))}` : ""}</div>
    ${badges}
    ${rows}
    <div class="popup-row"><strong>Source:</strong> ${escapeHtml(layer.source)}</div>
  </div>`;
}

function renderPermitBadges(props) {
  const signal = permitSignal(props);
  if (!signal.reasons.length) return "";
  return `<div class="badge-row">${signal.reasons
    .map((reason) => `<span class="signal-badge">${escapeHtml(reason)}</span>`)
    .join("")}</div>`;
}

function popupRows(layer, props) {
  if (layer.category === "traffic") {
    return compactRows(props, [
      ["Study type", "STUDY_TYPE"],
      ["Request", "REQ_NUM"],
      ["Street 1", "STREETNAME1"],
      ["Street 2", "STREETNAME2"],
      ["Survey date", "SURVEYDATE1"],
      ["85th percentile speed", "F85TH_PER"],
      ["Average weekly traffic", "AAWT"],
      ["File", "HYPERLINK"],
    ]);
  }

  if (layer.category === "disruption") {
    return compactRows(props, [
      ["Status", "STATUS"],
      ["Priority", "PRIORITY"],
      ["Category", "REQUEST_CATEGORY", "ASSET_TYPE"],
      ["Description", "DESCRIPTION", "PROJECT_NAME"],
      ["Address", "ADDRESS", "COMMUNITY"],
      ["Initiated", "DATE_INITIATED"],
      ["Started", "ACTUAL_START_DATE"],
      ["Closed/finished", "DATE_CLOSED", "ACTUAL_FINISH_DATE"],
      ["Cause", "WORK_ORDER_CAUSE"],
      ["Resolution", "RESOLUTION"],
      ["Responsible dept", "DEPT_RESPONSIBILITY"],
      ["Work order", "WORK_ORDER", "WORK_ORDER_ID"],
    ]);
  }

  if (layer.category === "project") {
    return compactRows(props, [
      ["Type", "PRJ_TYPE"],
      ["Status", "PRJ_STAT"],
      ["Duration", "PRJ_DUR"],
      ["Year start", "PRJ_YR_ST"],
      ["Year end", "PRJ_YR_END"],
      ["Description", "PRJ_DESC"],
      ["Length", "Shape__Length"],
    ]);
  }

  if (layer.category === "mobility") {
    return compactRows(props, [
      ["Name", "MNAME", "LOCATION"],
      ["Asset", "ASSETCODE", "ASSETGRP"],
      ["Owner", "OWNER"],
      ["Material", "MAT"],
      ["Status", "ASSETSTAT"],
      ["Length", "LENGTH", "Shape__Length"],
      ["Width", "WIDTH"],
      ["Install year", "INSTYR"],
      ["Winter maintained", "WINT_MAINT"],
      ["Accessible", "ACCESSIBLE"],
    ]);
  }

  if (layer.category === "road") {
    return compactRows(props, [
      ["Street/section", "street", "sect_desc"],
      ["Community", "comm"],
      ["Road class", "roadclass"],
      ["Owner", "owner"],
      ["Highway", "anum"],
      ["Section ID", "section_id", "segid"],
      ["Direction", "dir"],
      ["Length", "shape_leng", "sectkm_dat"],
      ["County", "county"],
    ]);
  }

  if (layer.category === "community") {
    return compactRows(props, [
      ["Name", "facility_name", "school_name"],
      ["Type", "facility_type", "board_name"],
      ["Grades/ages", "age_range", "start_grade"],
      ["End grade", "end_grade"],
      ["Address", "address", "civic_address_line_1"],
      ["City", "city", "civic_address_line_2"],
      ["Capacity", "total_licence_capacity"],
      ["Annual inspection", "annual_inspection"],
      ["Unannounced inspection", "annual_unannounced_inspection"],
      ["Phone", "phone", "telephone"],
      ["Email", "email"],
    ]);
  }

  return compactRows(props, [
    ["Status", "PERMIT_STATUS", "Permit_Status", "STATUS"],
    ["Work type", "PRIMARY_WORK_TYPE", "Primary_Work_Type", "WORK_TYPE"],
    ["Scope", "PRIMARY_WORK_SCOPE", "Primary_Work_Scope", "WORK_SCOPE"],
    ["Address", "CIVIC_ADDRESS", "Civic_Address", "ADDRESS", "LOCATION", "STREET_NAME"],
    ["Submitted", "DATE_OF_SUBMISSION"],
    ["Issued", "DATE_OF_PERMIT_ISSUANCE", "ISSUED_DATE", "Issued_Date"],
    ["Completed", "COMPLETED_DATE"],
    ["Expires", "EXPIRATION_DATE"],
    ["Description", "WORK_DESCRIPTION", "Work_Description", "DESCRIPTION"],
    ["Net new units", "NET_NEW_UNITS", "Net_New_Units"],
    ["Estimated value", "ESTIMATED_PROJECT_VALUE", "Estimated_Project_Value"],
  ]);
}

function compactRows(props, definitions) {
  return definitions
    .map(([label, ...keys]) => [label, firstValue(props, keys)])
    .filter(([, value]) => value !== undefined && value !== null && value !== "");
}

function firstValue(props, keys) {
  for (const key of keys) {
    if (props[key] !== undefined && props[key] !== null && props[key] !== "") {
      return props[key];
    }
  }
  return undefined;
}

function renderSummary() {
  const activeLayerCounts = LAYERS.map((layer) => ({
    layer,
    count: state.recordsByLayer.get(layer.id)?.length || 0,
    rawCount: state.rawGeoJsonByLayer.get(layer.id)?.features?.length || 0,
  })).filter(({ count }) => count > 0);

  const total = activeLayerCounts.reduce((sum, { count }) => sum + count, 0);
  const rawTotal = LAYERS.filter((layer) => state.selectedLayerIds.has(layer.id)).reduce(
    (sum, layer) => sum + (state.rawGeoJsonByLayer.get(layer.id)?.features?.length || 0),
    0,
  );
  const permitTotal = activeLayerCounts
    .filter(({ layer }) => layer.category === "permit")
    .reduce((sum, { count }) => sum + count, 0);
  const trafficStudyTotal = activeLayerCounts
    .filter(({ layer }) => layer.category === "traffic")
    .reduce((sum, { count }) => sum + count, 0);
  const disruptionTotal = activeLayerCounts
    .filter(({ layer }) => layer.category === "disruption")
    .reduce((sum, { count }) => sum + count, 0);
  const projectTotal = activeLayerCounts
    .filter(({ layer }) => layer.category === "project")
    .reduce((sum, { count }) => sum + count, 0);

  const cards = [];

  cards.push(`<div class="summary-card">
    <h3>${escapeHtml(state.center.label)}</h3>
    <p class="muted">Radius: ${state.radius.toLocaleString()} m. Showing ${total.toLocaleString()} of ${rawTotal.toLocaleString()} returned public records. ${escapeHtml(activeFiltersDescription())}</p>
  </div>`);

  cards.push(`<div class="summary-card">
    <h3>What looks active nearby</h3>
    <ul>
      <li>${permitTotal.toLocaleString()} permit-related records across selected HRM PPL&C layers.</li>
      <li>${trafficStudyTotal.toLocaleString()} traffic-study records in the selected radius.</li>
      <li>${disruptionTotal.toLocaleString()} operational service/work records and ${projectTotal.toLocaleString()} provincial project records in selected layers.</li>
      <li>${activeLayerCounts.length ? "Most active selected layers: " + describeTopLayers(activeLayerCounts) + "." : "No records returned for the selected layers and radius."}</li>
      ${cappedLayers(activeLayerCounts).length ? `<li>Query cap warning: ${escapeHtml(cappedLayers(activeLayerCounts).join(", "))} hit the configured record cap, so narrow the radius or date-filter it before relying on completeness.</li>` : ""}
    </ul>
  </div>`);

  const recentPermits = newestPermitRecords(5);
  cards.push(`<div class="summary-card">
    <h3>Recent permit signals</h3>
    ${
      recentPermits.length
        ? `<ul>${recentPermits
            .map(
              ({ layer, props }) =>
                `<li>${escapeHtml(layer.label)}: ${escapeHtml(formatPermitLine(props))}</li>`,
            )
            .join("")}</ul>`
        : `<p class="muted">No permit records with recognizable dates were returned.</p>`
    }
  </div>`);

  const notablePermits = notablePermitRecords(6);
  cards.push(`<div class="summary-card">
    <h3>Most notable permit signals</h3>
    ${
      notablePermits.length
        ? `<ul>${notablePermits
            .map(
              ({ layer, props, signal }) =>
                `<li>${escapeHtml(layer.label)}: ${escapeHtml(formatPermitLine(props))} <span class="inline-muted">${escapeHtml(signal.reasons.join(", "))}</span></li>`,
            )
            .join("")}</ul>`
        : `<p class="muted">No notable permit signal badges in the current filtered records.</p>`
    }
  </div>`);

  const trafficSignals = trafficSignalSummary();
  if (trafficSignals) {
    cards.push(`<div class="summary-card">
      <h3>Traffic signals</h3>
      <ul>${trafficSignals.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>`);
  }

  const disruptionSignals = disruptionSignalSummary();
  if (disruptionSignals) {
    cards.push(`<div class="summary-card">
      <h3>Disruption signals</h3>
      <ul>${disruptionSignals.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>`);
  }

  const areaSignals = areaContextSummary();
  if (areaSignals) {
    cards.push(`<div class="summary-card">
      <h3>Area context</h3>
      <ul>${areaSignals.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>`);
  }

  cards.push(`<div class="summary-card">
    <h3>What not to conclude</h3>
    <ul>
      <li>A permit point does not prove work is happening today.</li>
      <li>Missing records do not prove nothing is planned or happening.</li>
      <li>Traffic studies show where HRM has measured speed/counts; they do not normalize all nearby road risk.</li>
      <li>Cityworks records can be operationally noisy; open, complete, future-dated, and stale records all need inspection before being treated as current disruption.</li>
      <li>Flood datasets found in HRM ArcGIS search are not active here because the feature services require tokens.</li>
      <li>This is a public-data briefing, not a legal, title, engineering, or property-level conclusion.</li>
    </ul>
  </div>`);

  summaryEl.innerHTML = cards.join("");
}

function describeTopLayers(activeLayerCounts) {
  return activeLayerCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(({ layer, count }) => `${layer.label} (${count})`)
    .join(", ");
}

function cappedLayers(activeLayerCounts) {
  return activeLayerCounts
    .filter(({ layer, count }) => count >= layerResultCap(layer))
    .map(({ layer, count }) => `${layer.label} (${count.toLocaleString()})`);
}

function layerResultCap(layer) {
  if (layer.sourceType === "socrata-geojson" || layer.sourceType === "socrata-point-json") return 5000;
  if (layer.sourceType === "arcgis-latlon-table") return 2000;
  if (layer.sourceType === "arcgis-webmercator-table") return 2000;
  return 2000;
}

function newestPermitRecords(limit) {
  const records = [];
  for (const layer of LAYERS.filter((entry) => entry.category === "permit")) {
    const features = state.recordsByLayer.get(layer.id) || [];
    features.forEach((feature) => {
      const props = feature.properties || {};
      const date = parseDate(
        firstValue(props, [
          "DATE_OF_PERMIT_ISSUANCE",
          "DATE_OF_SUBMISSION",
          "COMPLETED_DATE",
          "EXPIRATION_DATE",
          "DATE_INSPECTION_COMPLETED",
          "ISSUED_DATE",
          "Issued_Date",
        ]),
      );
      if (date) records.push({ layer, props, date });
    });
  }

  return records.sort((a, b) => b.date - a.date).slice(0, limit);
}

function notablePermitRecords(limit) {
  const records = [];
  for (const layer of LAYERS.filter((entry) => entry.category === "permit")) {
    const features = state.recordsByLayer.get(layer.id) || [];
    features.forEach((feature) => {
      const props = feature.properties || {};
      const signal = permitSignal(props);
      if (signal.score > 0) records.push({ layer, props, signal });
    });
  }

  return records.sort((a, b) => b.signal.score - a.signal.score).slice(0, limit);
}

function trafficSignalSummary() {
  const features = state.recordsByLayer.get("traffic-studies") || [];
  if (!features.length) return null;

  const speeds = features.map((feature) => trafficMetricValue(feature.properties || {}, "speed")).filter(Number.isFinite);
  const volumes = features.map((feature) => trafficMetricValue(feature.properties || {}, "volume")).filter(Number.isFinite);
  const lines = trafficLineFeatures(features);
  const items = [`${features.length.toLocaleString()} traffic studies shown after filters.`];

  if (speeds.length) {
    items.push(`${speeds.length.toLocaleString()} studies include 85th-percentile speed; highest visible value is ${formatNumber(Math.max(...speeds))}.`);
  }
  if (volumes.length) {
    items.push(`${volumes.length.toLocaleString()} studies include average weekly traffic; highest visible value is ${formatNumber(Math.max(...volumes))}.`);
  }
  if (state.visual.trafficLines && lines.length) {
    const thickest = lines.sort((a, b) => b.properties.weight - a.properties.weight)[0];
    items.push(`${lines.length.toLocaleString()} same-street sketch lines drawn; strongest line signal is ${thickest.properties.street}.`);
  }

  return items;
}

function disruptionSignalSummary() {
  const serviceRequests = state.recordsByLayer.get("service-requests") || [];
  const workOrders = state.recordsByLayer.get("work-orders") || [];
  const roadProjects = state.recordsByLayer.get("nspw-road-projects") || [];
  const bridgeProjects = state.recordsByLayer.get("nspw-bridge-projects") || [];
  const allOperational = [...serviceRequests, ...workOrders];
  const allProjects = [...roadProjects, ...bridgeProjects];
  if (!allOperational.length && !allProjects.length) return null;

  const items = [];
  if (allOperational.length) {
    const open = allOperational.filter((feature) => isOperationalOpen(feature.properties || {}));
    const highPriority = allOperational.filter((feature) => /high/i.test(String((feature.properties || {}).PRIORITY || "")));
    const topTypes = topPropertyValues(allOperational, ["REQUEST_CATEGORY", "ASSET_TYPE", "DESCRIPTION"], 3);
    items.push(`${allOperational.length.toLocaleString()} Cityworks service/work records shown; ${open.length.toLocaleString()} look open or active from status fields.`);
    if (highPriority.length) items.push(`${highPriority.length.toLocaleString()} records are marked high priority.`);
    if (topTypes.length) items.push(`Most common operational signals: ${topTypes.join(", ")}.`);
  }

  if (allProjects.length) {
    const durations = topPropertyValues(allProjects, ["PRJ_DUR"], 3);
    items.push(`${allProjects.length.toLocaleString()} NSDPW road/bridge project records shown${durations.length ? `, mainly ${durations.join(", ")}` : ""}.`);
  }

  return items;
}

function areaContextSummary() {
  const childCare = state.recordsByLayer.get("child-care") || [];
  const schools = state.recordsByLayer.get("schools") || [];
  const travelways = state.recordsByLayer.get("active-travelways") || [];
  const nsRoads = state.recordsByLayer.get("ns-roads") || [];
  const trafficSections = state.recordsByLayer.get("traffic-volume-sections") || [];
  if (!childCare.length && !schools.length && !travelways.length && !nsRoads.length && !trafficSections.length) return null;

  const items = [];
  if (childCare.length) {
    const capacity = childCare
      .map((feature) => numberValue((feature.properties || {}).total_licence_capacity))
      .filter(Number.isFinite)
      .reduce((sum, value) => sum + value, 0);
    items.push(`${childCare.length.toLocaleString()} child-care facilities shown${capacity ? ` with ${capacity.toLocaleString()} listed licensed spaces` : ""}.`);
  }
  if (schools.length) items.push(`${schools.length.toLocaleString()} public schools shown.`);
  if (travelways.length) {
    const types = topPropertyValues(travelways, ["ASSETCODE"], 4);
    items.push(`${travelways.length.toLocaleString()} active-travelway segments shown${types.length ? ` (${types.join(", ")})` : ""}.`);
  }
  if (trafficSections.length) {
    const highways = topPropertyValues(trafficSections, ["anum"], 4);
    items.push(`${trafficSections.length.toLocaleString()} provincial traffic-volume road sections shown${highways.length ? `, including ${highways.join(", ")}` : ""}.`);
  }
  if (nsRoads.length) {
    const roadClasses = topPropertyValues(nsRoads, ["roadclass"], 4);
    items.push(`${nsRoads.length.toLocaleString()} addressable road segments shown${roadClasses.length ? ` by classes ${roadClasses.join(", ")}` : ""}.`);
  }

  return items;
}

function isOperationalOpen(props) {
  const status = String(props.STATUS || "").toLowerCase();
  if (!status) return false;
  return !/(complete|closed|cancelled)/i.test(status);
}

function topPropertyValues(features, keys, limit) {
  const counts = new Map();
  for (const feature of features) {
    const props = feature.properties || {};
    const value = firstValue(props, keys);
    if (!value) continue;
    const normalized = String(value).trim();
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => `${value} (${count})`);
}

function formatPermitLine(props) {
  const date = formatValue(
    firstValue(props, [
      "DATE_OF_PERMIT_ISSUANCE",
      "DATE_OF_SUBMISSION",
      "COMPLETED_DATE",
      "EXPIRATION_DATE",
      "DATE_INSPECTION_COMPLETED",
      "ISSUED_DATE",
      "Issued_Date",
    ]),
  );
  const type = firstValue(props, ["PRIMARY_WORK_TYPE", "Primary_Work_Type", "WORK_TYPE", "PERMIT_NAME"]);
  const address = firstValue(props, ["CIVIC_ADDRESS", "Civic_Address", "ADDRESS", "LOCATION", "STREET_NAME"]);
  return [date, type, address].filter(Boolean).map(formatValue).join(" - ");
}

function initLayerToggles() {
  layerToggleEl.innerHTML = LAYERS.map(
    (layer) => `<label class="layer-toggle">
      <input type="checkbox" data-layer-id="${layer.id}" ${layer.defaultOn === false ? "" : "checked"} />
      <span class="swatch" style="background:${layer.color}"></span>
      <span>${layer.label}</span>
      <span id="count-${layer.id}" class="count">0</span>
    </label>`,
  ).join("");

  layerToggleEl.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", () => {
      const layerId = input.dataset.layerId;
      if (input.checked) {
        state.selectedLayerIds.add(layerId);
      } else {
        state.selectedLayerIds.delete(layerId);
      }
      if (state.center) {
        if (input.checked && !state.rawGeoJsonByLayer.has(layerId)) {
          refreshData();
        } else {
          redrawFromRawData();
        }
      } else {
        renderLayerCounts();
      }
    });
  });
}

function renderLayerCounts() {
  LAYERS.forEach((layer) => {
    const el = document.getElementById(`count-${layer.id}`);
    if (el) el.textContent = String(state.recordsByLayer.get(layer.id)?.length || 0);
  });
}

function renderLegend() {
  legendEl.innerHTML =
    "<strong>Selected layers</strong>" +
    LAYERS.map(
      (layer) => `<div class="legend-row">
        <span class="swatch" style="background:${layer.color}"></span>
        <span>${layer.label}</span>
      </div>`,
    ).join("");
}

function setStatus(text) {
  statusPillEl.textContent = text;
}

function radiusZoom() {
  if (state.radius <= 250) return 16;
  if (state.radius <= 500) return 15;
  if (state.radius <= 1000) return 14;
  if (state.radius <= 2000) return 13;
  if (state.radius <= 5000) return 12;
  if (state.radius <= 10000) return 11;
  return 10;
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number" && value > 946684800000 && value < 4102444800000) {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
}

function parseDate(value) {
  if (!value) return null;
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function activeFiltersDescription() {
  const periodLabels = {
    all: "all dates",
    30: "last 30 days",
    90: "last 90 days",
    180: "last 6 months",
    365: "last year",
    custom: customDateDescription(),
  };
  const dateLabels = {
    any: "any relevant date",
    submitted: "permit submitted date",
    issued: "permit issued date",
    completed: "permit completed date",
    expires: "permit expiration date",
    inspection: "inspection completed date",
    "traffic-survey": "traffic survey date",
    "record-added": "record added date",
  };
  const completionLabels = {
    all: "all permit statuses",
    open: "open/uncompleted permits",
    completed: "completed permits",
    closed: "closed, expired, or withdrawn permits",
  };
  const trafficType = state.filters.trafficType === "all" ? "all traffic-study types" : `${state.filters.trafficType} traffic studies`;

  return `Filters: ${periodLabels[state.filters.period] || "selected dates"} on ${
    dateLabels[state.filters.dateField] || "selected date"
  }; ${completionLabels[state.filters.completion] || "selected permit statuses"}; ${trafficType}.`;
}

function customDateDescription() {
  if (state.filters.dateFrom && state.filters.dateTo) return `${state.filters.dateFrom} to ${state.filters.dateTo}`;
  if (state.filters.dateFrom) return `from ${state.filters.dateFrom}`;
  if (state.filters.dateTo) return `through ${state.filters.dateTo}`;
  return "custom dates";
}

function debounce(callback, delayMs) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delayMs);
  };
}

function sqlString(value) {
  return String(value).replaceAll("'", "''");
}

function numberValue(value) {
  if (value === undefined || value === null || value === "") return NaN;
  const number = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(number) ? number : NaN;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function range(values) {
  if (!values.length) return 0;
  return Math.max(...values) - Math.min(...values);
}

function daysBetween(start, end) {
  return Math.round((end - start) / 86400000);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "";
  return Math.round(value).toLocaleString();
}

function normalizeStreetName(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
