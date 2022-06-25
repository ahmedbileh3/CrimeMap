// Icons for the map
const PINK_ICON = 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png';
const ORANGE_ICON = 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png';
const RED_ICON = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
const YELLOW_ICON = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';

var locations = [];
var map;
var isCrimeTypePopulated = false;
var markerCluster;
var markers = [];

$(document).ready(function() {
    // Hide the multiselect drop downs
    // Will shown once data is loaded
    $('#crimeType').hide();
    $('#month').hide();
});


// Initialize map
function initMap() {
    // Center of the map (initially displayed)
    var location = {lat:52.4820 , lng:-1.8964 };
   
    // Create map
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 13,
        center: location
    });

    // Create the polygon
    createPolygon();

    // Load data from the firebase database
    loadData();
}

function loadData() {
    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    var firebaseConfig = {
        apiKey: "AIzaSyCEFWoxkSdGaSVk4q-WG8goITpVUImuj_A",
        authDomain: "crimemap-7f1f4.firebaseapp.com",
        databaseURL: "https://crimemap-7f1f4-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "crimemap-7f1f4",
        storageBucket: "crimemap-7f1f4.appspot.com",
        messagingSenderId: "691778980820",
        appId: "1:691778980820:web:516fa57140fc451b886441",
        measurementId: "G-H60T6JG3PF"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    // Get data from firebase database
    firebase.database().ref().once('value', function(snapshot) {
        // Check whether the data exists
        if (snapshot.val() !== null) {
            // Store all the locations in the array
            locations = snapshot.val();

            // Create markers for the locations
            createMarkers();
        }
    });
}

function createMarkers() {
    // Clear previous markers
    if (markerCluster) {
        markerCluster.clearMarkers();
    }
    
    var selectedTypes = $('#crimeType').val();
    var selectedMonths = $('#month').val();


    // Create markers
    var crimeTypes = [];
    markers = [];
    for (var i=0; i<locations.length; i++) {
        // Get location
        var location = locations[i];
        var filtered = false;

        // Filter locations
        if ((selectedTypes.length <= 0 || selectedTypes.indexOf(location["Crime type"]) > -1) &&
            ((selectedMonths.length <= 0 || selectedMonths.indexOf(location.month) > -1))) {
            filtered = true;
        }
        

        // If filtered, then display marker with relevant color
        if (filtered) {
            // Choose relevant icon based on the color
            var icon;
            switch (location.Colours.trim()) {
                case "PINK":
                    icon = PINK_ICON;
                    break;

                case "ORANGE":
                    icon = ORANGE_ICON;
                    break;

                case "YELLOW":
                    icon = YELLOW_ICON;
                    break;

                default:
                    icon = RED_ICON;
                    break;
            }

            // Latitude/longitude of the location
            var latLng = {lat: location.Latitude, lng: location.Longitude};
            
            // Create marker
            var marker = new google.maps.Marker({
                position: latLng,
                index: i,
                icon: {
                    url: icon
                }
            });

            // If crime type drop down list not populated already, then populate the array for the drop down
            if (!isCrimeTypePopulated) {
                if (crimeTypes.indexOf(location["Crime type"].trim()) <= -1) {
                    crimeTypes.push(location["Crime type"].trim());
                }
            }

            // Handle marker click
            addMarkerClick(marker);

            // Handle marker mouse over
            marker.addListener('click', function () {
                // Get location details of the marker
                var location = locations[this.index];
                var content = getContent(location);

                // Display details of the marker in the side panel
                $('#details').html(content);
            });


            // Add marker to the array
            markers.push(marker);
        }

        showTotalCount();
    }

    if (!isCrimeTypePopulated) {
        isCrimeTypePopulated = true;

        // Populate crime type drop down list
        for (var i=0; i<crimeTypes.length; i++) {
            var type = crimeTypes[i];
            $('#crimeType').append('<option value="' + type + '">' + type + '</option>');
        }
        
        
         //$('#crimeType').multiselect('destroy').multiselect('refresh');
        initDropDowns();
        
        
    }

    // Add a marker clusterer to manage the markers.
    markerCluster = new MarkerClusterer(map, markers, {
        // imagePath: "./images/m",
        //"https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
        styles: [
            {
              width: 53,
              height: 52,
              url: "./images/m1.png",
              textColor: "white",
              textSize: 18
            },
            {
              width: 56,
              height: 55,
              url: "./images/m2.png",
              textColor: "white",
              textSize: 18
            },
            {
              width: 66,
              height: 65,
              url: "./images/m3.png",
              textColor: "white",
              textSize: 18
            },
            {
                width: 78,
                height: 77,
                url: "./images/m3.png",
                textColor: "white",
                textSize: 18
            },
            {
                width: 90,
                height: 89,
                url: "./images/m5.png",
                textColor: "white",
                textSize: 18
            }
          ],
        clusterClass: "custom-cluster"
    });

    google.maps.event.addListener(markerCluster, 'mouseover', function(cluster) {
        // Get all markers of the cluster
        var clusterMarkers = cluster.getMarkers();

        // All content related to the cluster
        var content = "";

        /*
        for (var i = 0; i < clusterMarkers.length; i++) {
            // Get marker from the cluster
            var currentMarker = clusterMarkers[i];

            // Get details of the marker location
            var location = locations[currentMarker.index];

            // Get content of the location
            content += getContent(location);
        }
        */

        var total = [];
        for (var i = 0; i < clusterMarkers.length; i++) {
            // Get marker from the cluster
            var currentMarker = clusterMarkers[i];

            // Get details of the marker location
            var location = locations[currentMarker.index];

            // Get crime type
            var crimeType = location["Crime type"];

            // Check whether the crime type already exists
            var notFound = true;
            for (var j=0; j<total.length; j++) {
                var rec = total[j];
                if (rec.crime === crimeType) {
                    rec.count++;
                    notFound = false;
                    break;
                }
            }

            if (notFound) {
                total.push({crime: crimeType, count: 1});
            }
        }

        // Sort the records
        total.sort((a, b) => a.count - b.count);

        content = '<table>';
        for (var i=total.length - 1; i>=0; i--) {
            var rec = total[i];
            content += "<tr><td>" + rec.crime + ": </td><th>" + rec.count + "</th></tr>";
        }
        content += '</table>';

        // Display all content of this cluster in the details section of the side panel
        $('#details').html(content);
        
        // Show total count for the filtered crimes
        $('#crimeTotal').html('Total <strong>' + cluster.getMarkers().length + '</strong> crimes reported here.');
        
        // Change image of the cluster
        $(cluster.clusterIcon_.div_).find("img").attr("src", $(cluster.clusterIcon_.div_).find("img").attr("src").replace(".png", "_hover.png"));
    });

    google.maps.event.addListener(markerCluster, 'mouseout', function(cluster) {
        // Change image of the cluster
        $(cluster.clusterIcon_.div_).find("img").attr("src", $(cluster.clusterIcon_.div_).find("img").attr("src").replace("_hover", ""));
        
        showTotalCount();
    });
}

function createPolygon() {
    // Create path of the polygon
    var polygonPath = [
        {"lat":52.457623967186635,"lng":-1.8876724365234354},{"lat":52.46348126276423,"lng":-1.8753128173828104},
        {"lat":52.46954692600878,"lng":-1.870506298828123},{"lat":52.47540263536094,"lng":-1.8639831665039042},
        {"lat":52.48209392058145,"lng":-1.862266552734373},{"lat":52.48920229616319,"lng":-1.863639843749998},
        {"lat":52.49484636436741,"lng":-1.8742828491210917},{"lat":52.49860867408796,"lng":-1.886985791015623},
        {"lat":52.500071707596135,"lng":-1.904838574218748},{"lat":52.50132569756838,"lng":-1.9168548706054667},
        {"lat":52.49798164482367,"lng":-1.9233780029296854},{"lat":52.49003850012334,"lng":-1.9271545532226542},
        {"lat":52.48439381485535,"lng":-1.9333343627929667},{"lat":52.479584807874915,"lng":-1.9388275268554667},
        {"lat":52.47707555206774,"lng":-1.9415741088867167},{"lat":52.467037097765505,"lng":-1.9250946166992167},
        {"lat":52.46201701192342,"lng":-1.9113617065429667},{"lat":52.45720555911287,"lng":-1.893852246093748}
    ];

    // Create and specify options for the polygon
    var polygon = new google.maps.Polygon({
        path: polygonPath,
        strokeColor: 'darkblue',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        fillOpacity: 0,
        zIndex: 1,
        map: map
    });
}

function getContent(location) {
    // Create a table for the location details
    var content = '<table class="table table-condensed">' +
        "<tr><th>Crime Type: </th><td>" + location["Crime type"] + "</td></tr>" +
        "<tr><th>Category: </th><td>" + location["Last outcome category"] + "</td></tr>" +
        "<tr><th>Location: </th><td>" + location.Location + "</td></tr>" +
        "<tr><th>Reported By: </th><td>" + location["Reported by"] + "</td><tr>" +
        "<tr><th>Month: </th><td>" + location.month + "</td></tr>" +
        "</table><hr />";

    // Return the location details
    return content;
}

function showTotalCount() {
    // Show total count for the filtered crimes
    $('#crimeTotal').html('Total <strong>' + markers.length + '</strong> crimes reported here.');
    $('#details').html('');
}

function addMarkerClick(marker) {
    marker.addListener('click', function () {
        marker.setAnimation(google.maps.Animation.BOUNCE);

        setTimeout(function() {
            marker.setAnimation(null);
        }, 2000);
    });
    
            
}

function initDropDowns() {
    $('#crimeType').show();
    $('#month').show();

    $('#month').multiselect({nonSelectedText: 'All Months'});
    $('#crimeType').multiselect({nonSelectedText: 'All Crimes'});
    
}
        document.querySelectorAll('.accordion__button').forEach(button => {
            
            button.addEventListener('click', () => {
            
                button.classList.toggle('accordion__button--active');
                
           });
            
             
        });

function openPage() {
            var x = document.getElementById("search").value;

            if (x === "Drugs") {
                window.open("crimes.html");
                
                
                window.open("accordion__button accordion__button--active");


            }

            if (x === "Bicycle theft") {
                window.open("crimes.html");
            }

        }

// Load google charts
google.load("visualization", "1.1", {packages:["corechart"]});
google.setOnLoadCallback(drawStuff);

// Draw the chart and set the chart values
function drawStuff() {
    
    var data = new google.visualization.arrayToDataTable([
        ['City', 'Crimes', { role: "style"  }],
        ['Violent Crime',317, '#F29811'],
        ['Public Order', 77, '#DC53B3'],   
        ['Vehicle Crime', 51, '#F29811'],
        ['Criminal Damage Arson', 51, 'red'],
        ['Other Theft', 40, 'yellow'],
        ['Drugs', 35, '#F29811'],
        ['Burglary', 30, '#F29811'],
        ['Shoplifting', 30, 'yellow'],
        ['Robbery', 28, '#F29811'],
        ['Possession of Weapons', 12, 'red'],
        ['Theft from the person', 12, 'yellow'],
        ['Other Crime', 7, 'yellow'],
        ['Bicycle Theft', 4, '#DC53B3']
    ]);
    
      // Optional; add a title and set the width and height of the chart
      var options = {
        title: 'Number of Crime types in 2021',
        chartArea: {width: '50%'},
        hAxis: {
          title: 'Crime Types',
          minValue: 0
        },
        vAxis: {
          title: 'Number of Crimes'
        }
      };
      // Display the chart inside the <div> element with id="piechart"
      var chart = new google.visualization.BarChart(document.getElementById('chart_div'));

      chart.draw(data, options);
    }