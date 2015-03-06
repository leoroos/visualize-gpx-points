gmap = null
imagecount = 0;

images = [
	{
		url: 'red5x5.png',
		size: new google.maps.Size(23,23),
	},

	{
		url: 'blue5x5.png',
		size: new google.maps.Size(20,20),
	},

	{
		url: 'lightred5x5.png',
		size: new google.maps.Size(20,20),
	}
]

function nextImage(){
	var nextImage = imagecount % images.length;
	imagecount++
	return images[nextImage];
}


function initialize() 
{
	var mbrdnalatlng = [37.386305,-122.035973];
	var mapProp = {
		// center:new google.maps.LatLng(51.508742,-0.120850),
		// zoom:5,

		center:new google.maps.LatLng(mbrdnalatlng[0], mbrdnalatlng[1]),
		zoom:14,
	};
	var map=new google.maps.Map(document.getElementById("googleMap"),mapProp);
	gmap = map


	makePointLine(map, [ mbrdnalatlng ], nextImage());

	console.log("got executed successfully");
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

function readSingleFile(e) {
	console.log("executing read single file");
	console.log(e);
	var file = e.target.files[0];
	if (!file) {
		return;
	}
	var reader = new FileReader();
	reader.onload = function(e) {
		var contents = e.target.result;
		displayContents(contents);
	};
	reader.readAsText(file);
}

function displayContents(contents) {
	console.log("executing display contents");
	// var element = document.getElementById('file-content');
	// element.innerHTML = contents;
	var parser=new DOMParser();
	var xmlDoc=parser.parseFromString(contents,"text/xml");
	var children = xmlDoc.getElementsByTagName('trkpt');
	var arrayOfLatLon = []
	for(var i = 0 ; i < children.length; i++){
		var trkpt = children[i];
		var lat = parseFloat(trkpt.getAttribute('lat'));
		var lon = parseFloat(trkpt.getAttribute('lon'));
		arrayOfLatLon.push([lat,lon]);
	}

	makePointLine(gmap, arrayOfLatLon, nextImage());
	console.log(xmlDoc);
}

document.getElementById('file-input')
  .addEventListener('change', readSingleFile, false);

google.maps.event.addDomListener(window, 'load', initialize);
