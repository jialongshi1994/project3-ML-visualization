const apiKey = API_KEY

const grayMap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.mapbox.com/">MapBox</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 18,
    id: 'mapbox/light-v10',
    accessToken: apiKey
})

const satelliteMap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.mapbox.com/">MapBox</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 18,
    id: 'mapbox/satellite-streets-v11',
    accessToken: apiKey
})


const outdoorsMap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.mapbox.com/">MapBox</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 18,
    id: 'mapbox/outdoors-v11',
    accessToken: apiKey
})

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return undefined;
}

// created layers
const map = L.map('map', {
    center: [
        51.505, -0.09
    ],
    zoom: 3,
    layers: [grayMap, satelliteMap, outdoorsMap]
})

// add map
grayMap.addTo(map)

// create two sets of data
const overall = new L.LayerGroup()
var cfg = {
    // radius should be small ONLY if scaleRadius is true (or small radius is intended)
    // if scaleRadius is false it will be the constant radius used in pixels
    "radius": 2,
    "maxOpacity": .8,
    // scales the radius based on map zoom
    "scaleRadius": true,
    // if set to false the heatmap uses the global maximum for colorization
    // if activated: uses the data maximum within the current map boundaries
    //   (there will always be a red spot with useLocalExtremas true)
    "useLocalExtrema": true,
    // which field name in your data represents the latitude - default "lat"
    latField: 'lat',
    // which field name in your data represents the longitude - default "lng"
    lngField: 'lng',
    // which field name in your data represents the data value - default "value"
    valueField: 'count'
};
var heatmapLayer = new HeatmapOverlay(cfg);
// defining map choices
const baseMaps = {
    Satellite: satelliteMap,
    Grayscale: grayMap,
    Outdoors: outdoorsMap
}

// define overlays
const overlays = {
    point: overall,
    heatMap: heatmapLayer
}

// add control
L
    .control
    .layers(baseMaps, overlays)
    .addTo(map)
// create legend
const legend = L.control({
    position: 'bottomright'
})
// add legend
legend.onAdd = function () {
    const div = L
        .DomUtil
        .create('div', 'info legend')

    const grades = [0, 10, 100, 1000, 10000, 100000]
    const colors = [
        '#98ee00',
        '#d4ee00',
        '#eecc00',
        '#ee9c00',
        '#ea822c',
        '#ea2c2c'
    ]
    // get colored square
    for (let i = 0; i < grades.length; i++) {
        div.innerHTML += '<i style="background: ' + colors[i] + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+')
    }
    return div
}

// add legend
legend.addTo(map)

$(document).ready(function () {
    $("#btn").click(function () {
        $.get("/init")
    })
    var html = "";

    $.get('/getTime', function (data) {
        if (data) {
            for (var i = 0; i < data.length; i++) {
                html += '<option>' + data[i].stat_date + '</option>'
            }
            $("#select").html(html)
            buildD3()
        }
    })
    $("#select").change(function () {
        buildD3();
    })
});

function buildD3() {
    var maxData = 1

    var stat_date = $("#select").children('option:selected').val();
    overall.clearLayers()

    // get geoJSON data
    d3.json('/all/' + stat_date, function (data) {
        let realData = [];
        if (data) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].Lat && data[i].Lon) {
                    realData[i] = {lat: data[i].Lat, lng: data[i].Lon,radius:getRadiusMap(data[i].Confirmed)}

                }
            }
        }
        console.log(realData)
        heatmapLayer.setData({
            max: 8,
            data: realData
        })
        //build geo data
        data = buildGeoJson(data);
        // add a GeoJSON layer
        L.geoJson(data, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng)
            },
            style: styleInfo,
            onEachFeature: function (feature, layer) {
                layer.bindPopup('country: ' + feature.properties.country
                    + '<br>active: ' + feature.properties.active
                    + '<br>Recovered: ' + feature.properties.Recovered
                    + '<br>Deaths: ' + feature.properties.Deaths
                    + '<br>Confirmed: ' + feature.properties.Confirmed
                )
            }
        }).addTo(overall)
        // add point layer
        // overall.addTo(map)
        // toMap
        heatmapLayer.addTo(map)


        function styleInfo(feature) {
            return {
                opacity: 0.8,
                fillOpacity: 0.8,
                fillColor: getColor(feature.properties.Confirmed),
                color: '#000',
                radius: getRadius(feature.properties.Confirmed),
                stroke: true,
                weight: 0.5
            }
        }

        // set marker color
        function getColor(magnitude) {
            switch (true) {
                case magnitude > 100000:
                    return '#ea4a4c'
                case magnitude > 10000:
                    return '#ea822c'
                case magnitude > 1000:
                    return '#ee9c00'
                case magnitude > 100:
                    return '#eecc00'
                case magnitude > 10:
                    return '#d4ee00'
                default:
                    return '#98ee00'
            }
        }

        function buildGeoJson(data) {
            var geoData = {
                type: "FeatureCollection",
                features: [],
            };
            if (data) {
                for (let i = 0; i < data.length; i++) {
                    if (data) {
                        geoData.features[i] = {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    data[i].Lon,
                                    data[i].Lat
                                ],
                            },
                            properties: data[i]

                        }
                        if (maxData < data[i].Confirmed) {
                            maxData = data[i].Confirmed
                        }
                    }

                }
            }
            console.log(geoData)
            return geoData;
        }
    })

    // set radius
    function getRadius(magnitude) {
        switch (true) {
            case magnitude > 100000:
                return 50
            case magnitude > 10000:
                return 25
            case magnitude > 1000:
                return 10
            case magnitude > 100:
                return 5
            case magnitude > 10:
                return 1
            default:
                return 0
        }
    }
        // set radius
    function getRadiusMap(magnitude) {
        switch (true) {
            case magnitude > 100000:
                return 10
            case magnitude > 10000:
                return 4
            case magnitude > 1000:
                return 3
            case magnitude > 100:
                return 2
            case magnitude > 10:
                return 1
            default:
                return 0
        }
    }
}

