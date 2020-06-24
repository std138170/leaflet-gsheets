/* global L Tabletop */  

/*
 * Script to display two tables from Google Sheets as point and polygon layers using Leaflet
 * The Sheets are then imported using Tabletop.js and overwrite the initially laded layers
 */

// init() is called as soon as the page loads
function init() {
  // PASTE YOUR URLs HERE
  // these URLs come from Google Sheets 'shareable link' form
  // the first is the polygon layer and the second the points
  var polyURL =
    "https://docs.google.com/spreadsheets/d/1oEqTuABZmsyKeekjT0pz_tJ6rkHqHuhrHPFRE1sg1zs/edit?usp=sharing"; 
  var pointsURL =
    "https://docs.google.com/spreadsheets/d/1FRTbi2gymt7wpCRD31j-arn23ZYMapYklRFlJjMQj3I/edit?usp=sharing";

  Tabletop.init({ key: polyURL, callback: addPolygons, simpleSheet: true });
  Tabletop.init({ key: pointsURL, callback: addPoints, simpleSheet: true }); // simpleSheet assumes there is only one table and automatically sends its data
}
window.addEventListener("DOMContentLoaded", init);

// Create a new Leaflet map centered on the continental US
var map = L.map("map").setView([40, -100], 4);

// This is the Carto Positron basemap
var basemap = L.tileLayer(
  "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution:
      "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='http://cartodb.com/attributions'>CartoDB</a>",
    subdomains: "abcd",
    maxZoom: 19
  }
);
basemap.addTo(map);

var sidebar = L.control
  .sidebar({
    container: "sidebar",
    closeButton: true,
    position: "right"
  })
  .addTo(map);

let panelID = "my-info-panel";
var panelContent = {
  id: panelID,
  tab: "<i class='fa fa-bars active'></i>",
  pane: "<p id='sidebar-content'></p>",
  title: "<h2 id='sidebar-title'>No state selected</h2>"
};
sidebar.addPanel(panelContent);

map.on("click", function() {
  sidebar.close(panelID);
});

// These are declared outisde the functions so that the functions can check if they already exist
var polygonLayer;
var pointGroupLayer;
var mycoordinates;

// The form of data must be a JSON representation of a table as returned by Tabletop.js
// addPolygons first checks if the map layer has already been assigned, and if so, deletes it and makes a fresh one
// The assumption is that the locally stored JSONs will load before Tabletop.js can pull the external data from Google Sheets
function addPolygons(data) {
  if (polygonLayer != null) {
    // If the layer exists, remove it and continue to make a new one with data
    polygonLayer.remove();
  }

  // Need to convert the Tabletop.js JSON into a GeoJSON
  // Start with an empty GeoJSON of type FeatureCollection
  // All the rows will be inserted into a single GeoJSON
  var geojsonStates = {
    type: "FeatureCollection",
    features: []
  };

  for (var row in data) {
    // The Sheets data has a column 'include' that specifies if that row should be mapped
    if (data[row].include == "y") {
      var coords = JSON.parse(data[row].geometry);

      geojsonStates.features.push({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: coords
        },
        properties: {
          name: data[row].name,
          summary: data[row].summary,
          state: data[row].state,
          local: data[row].local
        }
      });
    }
  }

  // The polygons are styled slightly differently on mouse hovers
  var polygonStyle = { color: "#2ca25f", fillColor: "#99d8c9", weight: 1.5 };
  var polygonHoverStyle = { color: "green", fillColor: "#2ca25f", weight: 3 };

  polygonLayer = L.geoJSON(geojsonStates, {
    onEachFeature: function(feature, layer) {
      layer.on({
        mouseout: function(e) {
          e.target.setStyle(polygonStyle);
        },
        mouseover: function(e) {
          e.target.setStyle(polygonHoverStyle);
        },
        click: function(e) {
          // This zooms the map to the clicked polygon
          // map.fitBounds(e.target.getBounds());

          // if this isn't added, then map.click is also fired!
          L.DomEvent.stopPropagation(e);

          document.getElementById("sidebar-title").innerHTML =
            e.target.feature.properties.name;
          document.getElementById("sidebar-content").innerHTML =
            e.target.feature.properties.summary;
          sidebar.open(panelID);
        }
      });
    },
    style: polygonStyle
  }).addTo(map);
}

// addPoints is a bit simpler, as no GeoJSON is needed for the points
// It does the same check to overwrite the existing points layer once the Google Sheets data comes along
function addPoints(data) {
  if (pointGroupLayer != null) {
    pointGroupLayer.remove();
  }
  pointGroupLayer = L.layerGroup().addTo(map);

  // Choose marker type. Options are:
  // (these are case-sensitive, defaults to marker!)
  // marker: standard point with an icon
  // circleMarker: a circle with a radius set in pixels
  // circle: a circle with a radius set in meters
  var markerType = "marker";

  // Marker radius
  // Wil be in pixels for circleMarker, metres for circle
  // Ignore for point
  var markerRadius = 100;
 
  //////XXXXXXXXXXXXXXXXX
 // var myIcon = L.icon({
    //iconUrl: 'https://github.com/std138170/leaflet-gsheets/blob/master/css/images/myicon.png'});
    //shadowUrl: 'leaf-shadow.png',

    //iconSize: [38, 95] }); // size of the icon
   // shadowSize:   [50, 64], // size of the shadow
  //  iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    //shadowAnchor: [4, 62],  // the same for the shadow
   // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
//});
  
  ///////XXXXXXXXXXXXXXXXx
//alert("Ασχετο");
	var xi=0;
  for (var row = 0; row < data.length; row++) {
    var marker;
    if (markerType == "circleMarker") {
      marker = L.circleMarker([data[row].lat, data[row].lon], {radius: markerRadius});
    } else if (markerType == "circle") {
      marker = L.circle([data[row].lat, data[row].lon], {radius: markerRadius});
    } else {
	   // var distance = toRadian(data[row].lat);
	 var distance = getDistance([data[row].lat, data[row].lon], [mycoordinates.lat, mycoordinates.lon]);
	    xi=xi+1;
	  //  alert("Έξω από το if" +xi);
	   alert("Distance    " +distance);
	// if (distance < 1 )
	//    {
		  alert("Μέσα στο if" +xi);
     		 marker = L.marker([data[row].lat, data[row].lon]);
	  //  }
    }
    marker.addTo(pointGroupLayer);

    // UNCOMMENT THIS LINE TO USE POPUPS
   // marker.bindPopup('<h2>' + data[row].location + '</h2>There's a ' + data[row].level + ' ' + data[row].category + ' here');

    // COMMENT THE NEXT 14 LINES TO DISABLE SIDEBAR FOR THE MARKERS
    marker.feature = {
      properties: {
        location: data[row].location,
        category: data[row].category
      }
    };
    marker.on({
      click: function(e) {
        L.DomEvent.stopPropagation(e);
        document.getElementById("sidebar-title").innerHTML =
          e.target.feature.properties.location;
        document.getElementById("sidebar-content").innerHTML =
          e.target.feature.properties.category;
        sidebar.open(panelID);
      }
    });

    // AwesomeMarkers is used to create fancier icons
    var icon = L.AwesomeMarkers.icon({
     // iconUrl: 'https://github.com/std138170/leaflet-gsheets/blob/master/css/images/marker-icon.png',
      icon: "info-sign", 
      iconColor: "white",
      markerColor: getColor(data[row].category),
      prefix: "glyphicon",
      extraClasses: "fa-rotate-0"
    });
    if (!markerType.includes("circle")) {
      marker.setIcon(icon);
    }
  }
}

// Returns different colors depending on the string passed
// Used for the points layer
function getColor(type) {
  switch (type) {
  case "Coffee Shop":
    return "green";
  case "Restaurant":
    return "blue";
  default:
    return "green";
  }
}
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXxΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧΧχ

map.locate({setView: true, maxZoom: 16});
function onLocationFound(e) {
    var radius = e.accuracy;
    //e.accuracy
  mycoordinates = e.latlng;
var mycords = toRadian(mycoordinates.lat);
    L.marker(e.latlng).addTo(map)
        .bindPopup("Your coordinates are!!! " + mycords).openPopup();

    L.circle(e.latlng, radius).addTo(map);
}
function onLocationError(e) {
    alert("Location permission denied");
}
//alert("Test 1 ");
map.on('locationerror', onLocationError);
var myIcon = L.icon({
	iconUrl: 'https://github.com/std138170/leaflet-gsheets/blob/master/myicon.png',
        iconSize: [30, 40],
        shadowSize: [68, 95],
        shadowAnchor: [22, 94]
        });

//var Colosseum  = L.marker([41.890209, 12.492231], {icon: myIcon}).bindPopup("Κολοσαίο!!!!!");
//Colosseum.addTo(map);
//L.marker([39.3812, 22.253],{icon: myIcon}).addTo(map);
//

map.on('locationfound', onLocationFound);

	
//alert("Test   2  ");
//var mydistance = getDistance([37, -120], [39, -100]);
 function getDistance(origin, destination) 
    {
alert("Μεσα στη συναρτηση ");
	//return distance in meters
        var lon1 = toRadian(origin[1]),
        lat1 = toRadian(origin[0]),
        lon2 = toRadian(destination[1]),
        lat2 = toRadian(destination[0]);

        var deltaLat = lat2 - lat1;
        var deltaLon = lon2 - lon1;

        var a = Math.pow(Math.sin(deltaLat/2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon/2), 2);
        var c = 2 * Math.asin(Math.sqrt(a));
        var EARTH_RADIUS = 6371;
        return c * EARTH_RADIUS * 1000;
    }
function toRadian(degree)
    {
        return degree*Math.PI/180;
    }
//alert("Test 4 " +mydistance);
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

