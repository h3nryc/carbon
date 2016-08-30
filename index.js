var port = 3000
var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000);
var io = require('socket.io').listen(server);
var request = require('request');
var firebase = require("firebase");
var clientSecret = "AV3AU1AIPBEZZMCTRZUWSVUZUZOOK00MGGI3NBHO04A4FTHH&v=20130815";
var clientId = "YBQLVNSQZGPKCTLBYBZKTAJENWY1CVAOHBPMVNDGIFP1VE4Y";
var gcloud = require('google-cloud')({
  projectId: 'unum-1f4f8',
  keyFilename: 'unum-1ef2aa9c586c.json'});
var gcs = gcloud.storage();
var bucket = gcs.bucket('unum-1f4f8.appspot.com');
var fs = require('fs');
var jsonfile = require('jsonfile');
firebase.initializeApp({
  serviceAccount: "unum-1ef2aa9c586c.json",
  databaseURL: "https://unum-1f4f8.firebaseio.com"
});

console.log('Running Carbon at port '+port+'. Welcome to the server that powers unum.')
//Routing
app.use(express.static('frontend'));
app.get('/', function (req, res) {
  res.sendFile(process.env.OPENSHIFT_DATA_DIR + '/frontend/auth.html');
});

function cacheManager(){
//fistmeinthecachedaddy
  this.updateCache = function () {
    request.get({
      url: "https://api.nytimes.com/svc/topstories/v2/technology.json",
      qs: {
        'api-key': "0b5655891e394decad545c71357c88e7"
      },
  }, function(err, response, json) {
      fs.writeFile('cache.json', json,  function(err) {
   if (err) {
       return console.error(err);
   } else {
   console.log("Receiving latest json file from source");
   console.log('Attempting to upload cache to google cloud storage...');
  bucket.upload('cache.json', function(err, file) {
    if (!err) {
      console.log('Cache data uploaded successfully');
    }
  });
}
})
  })
  }
  this.requestCache = function () {
    var remoteFile = bucket.file('cache.json');

    remoteFile.createReadStream()
    .on('error', function(err) {console.log(err);})
    .on('response', function(response) {
     // Server connected and responded with the specified status and headers.
     console.log('Connected to google cloud storage...');
    })
  .on('end', function() {
    console.log('Cache data has been downloaded');
  })
  .pipe(fs.createWriteStream('cache.json'));
  }
}
var cache = new cacheManager();
cache.updateCache();
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
      json: true,
      //DELETE WHEN ON SERVER (SCHOOL PROBLEMS)
      rejectUnauthorized: false
  }, function (error, response, data) {
      //Checks for err with response
      if (!error && response.statusCode === 200) { 
      var count = 0 
      loop(count);
        function loop(count) {
         if (count < 7 ) {
          var count = count + 1
          var id = data.response.venues[count].id         
              getPic(id, function(link) {
                var pre = data.response.venues[count].name;
                var name = trunc(pre);
                
                try{
                  var type = data.response.venues[count].categories[0].shortName;
                }catch(err){
                  var type = "Venue"
                }
                var tip = data.response.venues[count].stats.tipCount;
                var address = data.response.venues[count].location.address;
                var city = data.response.venues[count].location.city;
                var vLat = data.response.venues[count].location.lat;
                var vLong = data.response.venues[count].location.lng;
                var verified = data.response.venues[count].verified

                var provider = "Foursquare"
                socket.emit('displayVenue', link,name,type,tip,address,city,vLat,vLong,verified,id,provider)
                loop(count);
              });   
         } else {
            return;         
         }
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
        json: true,
        //DELETE WHEN ON SERVER (SCHOOL PROBLEMS)
        rejectUnauthorized: false
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

  socket.on('getResturant', function(lat,long,type){
    console.log(1)
    var apiLink = "https://api.foursquare.com/v2/venues/search?ll="+lat+","+long+"&client_id="+clientId+"&client_secret="+clientSecret+"&query="+type+"%20Restaurant&limit=1&radius=4000"

    request({
        url: apiLink,
        json: true,
        //DELETE WHEN ON SERVER (SCHOOL PROBLEMS)
        rejectUnauthorized: false
    }, function (error, response, data) {
        //Checks for err with response
        if (!error && response.statusCode === 200) { 
          try{
            var id = data.response.venues[0].id;
          }catch(err){
            socket.emit('displayRest', "fail","fail","fail","fail")
            return;
          }
            
              var pre = data.response.venues[0].name;
              var name = trunc(pre)
              var lat = data.response.venues[0].location.lat;
              var long = data.response.venues[0].location.lng;
              var address = data.response.venues[0].location.address;
              var phone = data.response.venues[0].contact.phone;
              socket.emit('displayRest', name,address,phone,type,lat,long)
            
        }else{
          //Handels err
          console.log(error);
        }
    });
  })

})


function getPic(id,callback) {

  var apiLink = "https://api.foursquare.com/v2/venues/"+id+"/photos?oauth_token=4JT2ULNSGCGNV3EAMLNAHDB3HAZ043HSDTLJLWQ3ND31W2I2&v=20160826"
    request({
        url: apiLink,
        json: true,
        //DELETE WHEN ON SERVER (SCHOOL PROBLEMS)
        rejectUnauthorized: false
    }, function (error, response, data) {
        //Checks for err with response
        if (!error && response.statusCode === 200) {

          try {
            var link = data.response.photos.items[1].prefix+'900x900'+data.response.photos.items[0].suffix;
            callback(link);

          }
          catch(err) {
            var link = "https://i.imgur.com/gDGiJQE.png";
            // console.log(link)
            callback(link);
          }  
        }else{
          //Handels err
          console.log(error);
        }
    });
}






             





