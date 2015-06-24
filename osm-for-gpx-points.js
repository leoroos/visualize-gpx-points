
if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

gmap = null;
gsource = null;
imagecount = 0;

function style1(image){
	return new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
			anchor: [0.0, 0.1],
			// anchorXUnits: 'fraction',
			// anchorYUnits: 'pixels',
			// opacity: 0.75,
			src: image
		}))
	});
}

function style2(image){
	return new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
			// anchor: [0.5, 46],
			// anchorXUnits: 'fraction',
			// anchorYUnits: 'pixels',
			// opacity: 0.75,
			src: image
		}))
	});
}

function style3(image){
	return new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
			anchor: [0.1, 0,0],
			// anchorXUnits: 'fraction',
			// anchorYUnits: 'pixels',
			// opacity: 0.75,
			src: image
		}))
	});
}

images = [
	'./red10x10.png',
	'./blue10x10.png',
	'./lightred10x10.png',
	// './black10x10.png',
	]

function nextImage(){
	var nextImage = imagecount % images.length;
	imagecount++
	return images[nextImage];
}


function lonlat2p(lon,lat){
	return new ol.proj.transform([lon, lat], "EPSG:4326", "EPSG:3857");
}

function lonlat2osm(lon,lat){
	return new ol.geom.Point( new ol.proj.transform([lon, lat], "EPSG:4326", "EPSG:3857") );
}

function initialize()
{
	var osmSource = new ol.source.OSM();
	// var osmSource = new ol.source.MapQuest({layer: 'sat'});
	var center = [ -122, 37.5 ];

      var map = new ol.Map({
        target: 'map',
        layers: [
          new ol.layer.Tile({
            source: osmSource
          })
        ],
        view: new ol.View({
          center: lonlat2p(-122,37.5),
          zoom: 12
        })
      });
	gmap = map;



	var f2 = new ol.Feature({
	  geometry: new ol.geom.Point( lonlat2p(-122,38)),
	  name: 'meta-info f2',
	});

	style = style1(nextImage());


	gsource = new ol.source.Vector({
	  // features: [iconFeature]
	});

	var vectorLayer = new ol.layer.Vector({
	  source: gsource
	});

	map.addLayer(vectorLayer);

	registerPopup();


	// vectorSource.addFeature(f1);
	// vectorSource.addFeature(f2);

	// addPoint(style,37.5,-122, null)
}

function addPoint(style, lat, lon, tags)
{
	properties = {
	  geometry: new ol.geom.Point( lonlat2p(lon,lat)),
	  lon: lon,
	  lat: lat,
	}
	if(tags){
		var keys = Object.keys(tags);
		properties['tagnames'] = keys
		for(var i = 0; i < keys.length; i++){
			var key = keys[i];
			properties[key] = tags[key];
		}
	}

	var feature = new ol.Feature(properties);
	feature.setStyle(style);

	gsource.addFeature(feature)
}



function addMarker(position){
    markers.addMarker(new OpenLayers.Marker(position));
}

function createPosition(arrayLatLon) {
    var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
    var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
    var position       = new OpenLayers.LonLat(arrayLatLon[1], arrayLatLon[0]).transform( fromProjection, toProjection);
	return position;
}

function makePointLine(map, arrayOfLatLon, image)
{
 	for (var i = 0, len = arrayOfLatLon.length; i < len; i++) {
		latlon = arrayOfLatLon[i];
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(latlon[0], latlon[1]),
			icon: image,
		});
		marker.setMap(map);
	}
}

function toLatLng(arrayOfLatLng)
{
	var collect = [];
	for (var i = 0, len = arrayOfLatLng.length; i < len; i++) {
		collect.push(new google.maps.LatLng(arrayOfLatLng[i][0],arrayOfLatLng[i][1]))
	}
	return collect;
}

function displaygpxpoints(e,stylefunc) {
	var file = e.target.files[0];
	if (!file) {
		return;
	}
	var reader = new FileReader();
	reader.onload = function(e) {
		var contents = e.target.result;
		var trksarray = null;

		if(file.name.endsWith(".json")){
			trksarray = parseJSONFile(contents);
		}else if(file.name.endsWith(".gpx")){
			trksarray = parseGPXFile(contents);
		}

		for (var i = 0, len = trksarray.length; i < len; i++) {
			array_of_array_of_lat_lon = trksarray[i];	
			displayContents(stylefunc, array_of_array_of_lat_lon);
		}
	};
	reader.readAsText(file);
}
function parseJSONFile(contents)
{
	var array_of_array_of_lat_lon = []
	var parsedJSON = JSON.parse(contents);
	if(Array.isArray(parsedJSON)){
		for (var i = 0, len = parsedJSON.length; i < len; i++) {
			var parsedJSONObj = parsedJSON[i];
			array_of_array_of_lat_lon.push(parseJSONObjectToLatLonArray(parsedJSONObj));
		}
	}else{
		array_of_array_of_lat_lon.push(parseJSONObjectToLatLonArray(parsedJSONObj));
	}

	return array_of_array_of_lat_lon;
}

function parseJSONObjectToLatLonArray(parsedJSONObj){
	var array_of_array_of_lat_lon = [];
	var route = parsedJSONObj['route'];
	for (var i = 0, len = route.length; i < len; i++) {
		var route_entry = route[i];
		var lat = parseFloat(route_entry[ 'latitude' ]);
		var lon = parseFloat(route_entry[ 'longitude' ]);
		tags = extractTags(route_entry);
		array_of_array_of_lat_lon.push([lat,lon, tags ]);
	}
	return array_of_array_of_lat_lon;
}

function extractTags(route_entry){
	var possibletags = [ "time", "speed", "odometer", "wayId", "baseNodeId", "adjNodeId" ];
	var tags = {};
	for (var i = 0, len2 = possibletags.length; i < len2; i++) {
		var tagname = possibletags[i];	
		var tag_value = route_entry[tagname];
		if(tag_value){
			tags[tagname] = tag_value;
		}
	}
	return tags;
}

function parseGPXFile(contents)
{
	var parser=new DOMParser();
	var trksarray = [];
	var xmlDoc=parser.parseFromString(contents,"text/xml");
	var trks = xmlDoc.getElementsByTagName('trk');
	for (var i = 0, len = trks.length; i < len; i++) {
		var trk=trks[i];
		var children = trk.getElementsByTagName('trkpt');
		var array_of_array_of_lat_lon = [];
		for(var j = 0 ; j < children.length; j++){
			var trkpt = children[j];
			var lat = parseFloat(trkpt.getAttribute('lat'));
			var lon = parseFloat(trkpt.getAttribute('lon'));
			var tagElements = trkpt.getElementsByTagName('tag');
			var tags = [];
			console.warn("adjust to the way tags are handled with parseJSONFile");
			for (var k = 0; k < tagElements.length; k++) {
				tagEl = tagElements[k];
				tags.push([tagEl.getAttribute('key'), tagEl.getAttribute('value')]);
			}
			array_of_array_of_lat_lon.push([lat,lon, tags]);
		}
		trksarray.push(array_of_array_of_lat_lon);
	}
	return trksarray;
}

function displayContents(stylefunc,array_of_array_of_lat_lon) {
	console.log("executing display contents");
	// var element = document.getElementById('file-content');
	var style = stylefunc(nextImage());
	for (var i = 0, len = array_of_array_of_lat_lon.length; i < len; i++) {
		lat_lon = array_of_array_of_lat_lon[i];
		addPoint(style,  lat_lon[0], lat_lon[1], lat_lon[2]);
	}
	first = array_of_array_of_lat_lon[0];
	console.log(first)
	gmap.getView().setCenter(lonlat2p(first[1], first[0]));
}

function addLatLonTogetherPoint(stylefunc)
{
	console.log("called addlatlon");
	var latlon = document.getElementById("latlontextfield").value.trim();
	var latlonAr = latlon.split(",")
	var latfloat = parseFloat(latlonAr[0]);
	var lonfloat = parseFloat(latlonAr[1]);
	addLatLonFloates(latfloat, lonfloat, stylefunc);
}

function addLatLonPoint(stylefunc)
{
	console.log("called addlatlon");
	var lat = document.getElementById("lattextfield").value;
	var latfloat = parseFloat(lat);
	var lon = document.getElementById("lontextfield").value;
	var lonfloat = parseFloat(lon);
	addLatLonFloates(latfloat, lonfloat, stylefunc);
}

function addLatLonFloates(latfloat, lonfloat, stylefunc) {
	addPoint(stylefunc(nextImage()), latfloat, lonfloat, false);
	gmap.getView().setCenter(lonlat2p(lonfloat, latfloat));
}

document.getElementById('file1-input')
  .addEventListener('change', function(e){ displaygpxpoints(e,style1) } , false);
document.getElementById('file2-input')
  .addEventListener('change', function(e){ displaygpxpoints(e,style2) } , false);
document.getElementById('file3-input')
  .addEventListener('change', function(e){ displaygpxpoints(e,style3) } , false);
document.getElementById('latlonbutton')
  .addEventListener('click', function(e){ addLatLonPoint(style1) } , false);
document.getElementById('latlontogetherbutton')
  .addEventListener('click', function(e){ addLatLonTogetherPoint(style1) } , false);

function registerPopup(){
	var map = gmap;
	var element = document.getElementById('popup');

	var popup = new ol.Overlay({
		element: element,
		positioning: 'bottom-center',
		stopEvent: false
	});
	map.addOverlay(popup);

	// display popup on click
	map.on('click', function(evt) {
		var feature = map.forEachFeatureAtPixel(evt.pixel,
			function(feature, layer) {
				return feature;
			});
		if (feature) {
			var geometry = feature.getGeometry();
			var coord = geometry.getCoordinates();
			popup.setPosition(coord);

			var content = "lat:" + feature.get('lat') + "\n";
			content += "lon:" + feature.get('lon') + "\n";
			origin = feature.get('file');

			if ( origin ) {
				content += "file: " + origin + "\n";
			}

			var tagnames = feature.get('tagnames');

			for (var i = 0, len = tagnames.length; i < len; i++) {
				content += tagnames[i] + ":" + feature.get(tagnames[i]) + "\n";
			}
			

			// content += "edgeHighway:" + feature.get('edgeHighway') + "\n";
			// content += "edgeName:" + feature.get('edgeName') + "\n";
			// content += "nodeHighway" + feature.get('nodeHighway') + "\n";
			// content += "accuEdgeDistance" + feature.get('accuEdgeDistance') + "\n";
			// content += "distancePointAccu" + feature.get("distancePointAccu") + "\n";

			$(element).popover({
				'placement': 'top',
				'html': true,
				'content': content
			});

			$(element).data('bs.popover').setContent();
			$(element).popover('show');
		} else {
			$(element).popover('destroy');
		}
	});

	// // change mouse cursor when over marker
	// map.on('pointermove', function(e) {
	// 	if (e.dragging) {
	// 		$(element).popover('destroy');
	// 		return;
	// 	}
	// 	var pixel = map.getEventPixel(e.originalEvent);
	// 	var hit = map.hasFeatureAtPixel(pixel);
	// 	map.getTarget().style.cursor = hit ? 'pointer' : '';
	// });

}
