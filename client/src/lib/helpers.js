function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(new Error(response.statusText))
  }
}

function json(response) {
  return response.json()
}

function renderNewMarkers(map, venueType, data){
  let source = `${venueType}Data`;

  map.addSource(source, {
    type: "geojson",
    data: data,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50
  });

  map.addLayer({
    "id": "unclustered-points-" + venueType,
    "type": "symbol",
    "source": source,
    "filter": ["!has", "point_count"],
    "layout": {
        "icon-image": "icon_mkr_" + venueType,
        "visibility": "none"
    }
  });

  let palette = {
    'restaurant': '#2ab7ca',
    'park': '#7ed321',
    'event': '#d0021b'
  };

  map.addLayer({
    "id": "cluster-" + venueType,
    "type": "circle",
    "source": source,
    "paint": {
      "circle-color": palette[venueType],
      "circle-radius": 18
    },
    "layout": {
      "visibility": "none"
    },
    "filter": ["has", "point_count"],
  });

  map.addLayer({
    "id": "cluster-count-" + venueType,
    "type": "symbol",
    "source": source,
    "layout": {
      "visibility": "none",
      "text-field": "{point_count}",
      "text-font": [
        "DIN Offc Pro Medium",
        "Arial Unicode MS Bold"
      ],
      "text-size": 12
    }
  });

  // for each coorespnding button in nav bar
    // add onclick behavior to toggle layer visibility
  let button = document.getElementsByClassName(venueType)[0];
  let markerLayers = [`unclustered-points-${venueType}`, `cluster-${venueType}`, `cluster-count-${venueType}`];

  button.onclick = function(e) {
    markerLayers.forEach(function(markerLayer){
      let visibility = map.getLayoutProperty(markerLayer, 'visibility');
      if (visibility === 'visible') {
        map.setLayoutProperty(markerLayer, 'visibility', 'none');
      } else {
        map.setLayoutProperty(markerLayer, 'visibility', 'visible');
      }
    });
  };
}

function renderMarkers(map, venue, update){
  fetch( `/api/venues/${venue}` )
    .then(status)
    .then(json)
    .then( (venueData) => {
      if (!update) renderNewMarkers(map, venue, venueData);
      else updateOldMarkers(map, venue, venueData);
    })
    .catch( function(e) {
      console.log(`error fetching ${venue} data:\n`, e);
    })
}

function updateOldMarkers(map, venueType, data){
  map.getSource(`${venueType}Data`).setData(data);
}

function saveReview(review, map, venue) {
  fetch('/api/venues', {
    method: 'PUT',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(review)
  })
  .then(status)
  .then(json)
  .then(function(data){
    console.log('Request succeeded with JSON response', data);
  })
  .then(renderMarkers(map, venue, true))
  .catch(function (error) {
    console.log('Request failed', error);
  });
}

function renderMapbox(cb){
  // fetch mapbox private token from server's config
  fetch( 'http://localhost:3000/api/keys' )
    .then(status)
    .then(json)
    .then( (token) => cb(token) )
    .catch( function(e){
      console.log('error fetching mapbox token:\n', e);
    })
};

module.exports = {
  saveReview: saveReview,
  renderMarkers: renderMarkers,
  renderMapbox: renderMapbox
}