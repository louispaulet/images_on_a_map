var map = L.map('mapid').setView([54.5260, 15.2551], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

var geojsonLayer = null;

function loadData(filename) {
  filename = "geojson_data/"+filename
  fetch(filename)
    .then(response => response.json())
    .then(data => {
      if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
      }
      geojsonLayer = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          var divIcon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="text-align: center;"><b>${feature.properties.name}</b><br>
                <img src="data:image/png;base64,${feature.properties.image}" style="border-radius: 8px;">
                </div>`
          });
          return L.marker(latlng, {icon: divIcon});
        }
      }).addTo(map);
    });
}

document.getElementById('dropdown').addEventListener('change', function() {
  loadData(this.value);
});

// Load default data
loadData('europe_man_batch_0.geojson');
