var port = 3000
var express = require('express');
var app = express();
var server = app.listen(process.env.OPENSHIFT_NODEJS_PORT || port, process.env.OPENSHIFT_NODEJS_IP);
var io = require('socket.io').listen(server);
var request = require('request');
var clientSecret = "AV3AU1AIPBEZZMCTRZUWSVUZUZOOK00MGGI3NBHO04A4FTHH&v=20130815";
var clientId = "YBQLVNSQZGPKCTLBYBZKTAJENWY1CVAOHBPMVNDGIFP1VE4Y";

console.log('Running Carbon at port '+port+'. Welcome to the server that powers unum.')
//Routing
app.use(express.static('frontend'));
app.get('/', function (req, res) {
  res.sendFile(process.env.OPENSHIFT_DATA_DIR + '/frontend/auth.html');
});


function trunc(text) {
  var pre = text.substring(0,24);
  if (text.length >= 24) {
    var final = pre+"...";
    return final;
  } else {
    return pre;
  }

}



// Socket DB
io.on('connection', function (socket) {
console.log('carbon - A user has connected to the server')

// Fetch Data
  socket.on('getVenue', function (lat,long) {

   var apiLink = "https://api.foursquare.com/v2/venues/search?ll="+lat+","+long+"&client_id="+clientId+"&client_secret="+clientSecret+""


    request({
      url: apiLink,
      json: true
  }, function (error, response, data) {
      //Checks for err with response
      if (!error && response.statusCode === 200) {  
         for (var i = 0; i < 6; i++) {
              var pre = data.response.venues[i].name;
              var name = trunc(pre);
              var type = data.response.venues[i].categories[0].shortName;
              var tip = data.response.venues[i].stats.tipCount;
              var address = data.response.venues[i].location.address;
              var city = data.response.venues[i].location.city;
              var vLat = data.response.venues[i].location.lat;
              var vLong = data.response.venues[i].location.lng;
              var verified = data.response.venues[i].verified
              var id = data.response.venues[i].id
              var provider = "Foursquare"
              socket.emit('displayVenue', name,type,tip,address,city,vLat,vLong,verified,id,provider)
         }
      }else{
        //Handels err
        console.log(error);
      }
  });



  })

  socket.on('getEvent', function (lat,long){
    var eventKey = "HJRp25zS5jm5NJQr"
    var eventLink = "https://api.eventful.com/json/events/search?app_key="+eventKey+"&where="+lat+","+long+"&within=25&units=km&sort_order=popularity"


    request({
        url: eventLink,
        json: true
    }, function (error, response, data) {
        //Checks for err with response
        if (!error && response.statusCode === 200) {  
           for (var i = 0; i < 6; i++) {
              var pre = data.events.event[i].title;
              var name = trunc(pre);
              var lat = data.events.event[i].latitude;
              var long = data.events.event[i].longitude;    
          try {
            var preImg = data.events.event[i].image.medium.url;
            var image = preImg.replace(/^http:\/\//i, 'https://');

          }
          catch(err) {
            var image = "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRzbjllLfcybGqvOmehP2qaxFPAs5IXz5XLolnAfu_CuXh5eFLoevIxsTuh"
          }  
              var venueName = data.events.event[i].venue_name;
              var venueAddress = data.events.event[i].venue_address;
              var startTime = data.events.event[i].start_time;
              var id = data.events.event[i].id;
              var eventfulUrl = data.events.event[i].url;
              var cityName = data.events.event[i].city_name;
              var provider = "Eventful"
              var emoji = "🎉";
              var rand = Math.floor(Math.random() * 7) + 1
              socket.emit('displayEvent', name,lat,long,id,provider,rand,emoji,eventfulUrl,startTime,venueAddress,venueName,cityName,image)
           }
        }else{
          //Handels err
          console.log(error);
        }
    });


  })

})
