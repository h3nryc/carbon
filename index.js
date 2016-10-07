var port = 3000
var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000);
var io = require('socket.io').listen(server);
var request = require('request');
var firebase = require("firebase");
var clientSecret = "AV3AU1AIPBEZZMCTRZUWSVUZUZOOK00MGGI3NBHO04A4FTHH&v=20130815";
var clientId = "YBQLVNSQZGPKCTLBYBZKTAJENWY1CVAOHBPMVNDGIFP1VE4Y";
var vcache;
var vcache_expire;
firebase.initializeApp({
  serviceAccount: "unum-b23625c915ea.json",
  databaseURL: "https://unum-1f4f8.firebaseio.com"
});

console.log('Running Carbon at port '+port+'. Welcome to the server that powers unum.com .')
//Routing
app.use(express.static('frontend'));
app.get('/', function (req, res) {
  res.sendFile(process.env.OPENSHIFT_DATA_DIR + '/frontend/auth.html');
});

function cacheManager(){
  this.updateCache = function () {
    request.get({
      url: "https://api.nytimes.com/svc/topstories/v2/home.json",
      qs: {
        'api-key': "0b5655891e394decad545c71357c88e7"
      },
  }, function(err, response, json) {
   var jsonfile = json;
   if (err) {
       return console.error(err);
   } else {
      console.log("Receiving latest json file from source");
      console.log('Attempting to upload cache to firebase...');
      var cacheRef = firebase.database().ref('/cache/main/');
      cacheRef.set(jsonfile);
    }
  })
  }

  this.requestCache = function () {
    var cacheRef = firebase.database().ref('/cache/');
      cacheRef.on('value', function(snapshot) {
        var p = snapshot.val();
        for (var key in p) {
            if (p.hasOwnProperty(key)) {
              if (key == 'main') {
                return p[key];
                vcache_expire = Date.now() += 240 * 60;
              }
          }
    }
  })
  }
  this.requestVCache = function () {
    if (Date.now() > vcache_expire) {
      vcache = cache.requestCache();
    }
    if (vcache == undefined) {
      vcache = cache.requestCache();
    } else {
      console.log(vcache)
      return vcache;
    }
  }
}
var cache = new cacheManager();


function trunc(text) {
  var pre = text.substring(0,24);
  var pre2 = pre.replace(/^F0+/i, '');
  if (text.length >= 24) {
    var final = pre2+"...";
    return final;
  } else {
    return pre2;
  }

}

function type2Emoji(type) {
	if(type == "Beach"){
		return "🏖";
	}else if (type == "Park"){
		return "🌲";
	}else if (type == "Playground"){
		return "⛳️";
	}else if (type == "Food & Drink"){
		return "🍴";
	}else if(type == "Preserve"){
		return "🍀";
	}else if(type == "Historic Site"){
		return "👴";
	}else if (type == "Pool"){
		return "🌊";
	}else if (type == "Café"){
		return "☕️";
	}
	else{
		return "🚶";
	}
}


function type2Color(type) {
	if(type == "Beach" || type == 1){
		return "#f1c40f";
	}else if (type == "Park" || type == 2){
		return "#2ecc71";
	}else if (type == "Playground" || type == 3){
		return "#e74c3c";
	}else if (type == "Food & Drink" || type == 4){
		return "#e67e22";
	}else if(type == "Preserve"){
		return "#EF2D56";
	}else if (type == "Historic Site" || type == "Café" || type == 5){
		return '#ED7D3A';
	}else if (type == "Pool" || type == 6){
		return "#5BC0EB";
	}
	else{
		var rand = Math.floor(Math.random() * 3) + 1
		if (rand == 1) {
			return "#03FCBA";
		} else if (rand == 2) {
			return "#01FDF6";
		}else if (rand == 3){
			return "#CBBAED";
		}

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
        var count = 0;
        loop(count)
        function loop(count) {
          if (count < 6) {
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
              var phone = data.response.venues[0].contact.phone;
              var verified = data.response.venues[count].verified
              if (address == null || address == undefined) {
                var addressDis = "none"
                var address = "No address found."
              }else {
                var addressDis = "block"
              }
              var provider = "Foursquare"
              //  socket.emit('displayVenue', link,name,type,tip,address,city,vLat,vLong,verified,id,provider,count)
               socket.emit('displayVenue', ' <li onclick="loadMore('+"'"+type+"'"+','+vLat+','+vLong+','+"'"+id+"'"+','+"'"+provider+"'"+','+"'"+name+"'"+','+"'"+address+"'"+','+"'"+type2Emoji(type)+"'"+','+"'"+type2Emoji(type)+"'"+','+"'"+phone+"'"+')" style="background-color: '+type2Color(type)+';"class="food-card"> <div class="food-head"> <h2>'+type2Emoji(type)+'  '+type+'</h2> </div> <div style="background-image: url('+link+');" class="food-hero"></div> <div class="food-footer"> <h2>'+name+'</h2> <p style="margin: 0;display: '+addressDis+'">This '+type+' is located on '+address+' '+city+'</p> </div> </li>')
              loop(count);
              });
          } else {
            return;
          }
        }
      } else{
        //Handels err
        console.log(error);
      }
  });



  })

  socket.on('getEvent', function (lat,long){
    var eventKey = "HJRp25zS5jm5NJQr"
    var eventLink = "https://api.eventful.com/json/events/search?app_key="+eventKey+"&where="+lat+","+long+"&within=25&units=km&sort_order=popularity&image_sizes=large"


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
            var preImg = data.events.event[i].image.large.url;
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
              var url = data.events.event[i].url;
              var emoji = "🎉";
              var rand = Math.floor(Math.random() * 7) + 1
              socket.emit('displayEvent', ' <li onclick="loadMore('+"'"+name+"'"+','+lat+','+long+','+"'"+id+"'"+','+"'"+provider+"'"+','+"'"+name+"'"+','+"'"+venueAddress+"'"+','+"'"+emoji+"'"+','+"'"+type2Color(rand)+"'"+','+"'"+url+"'"+')" style="background-color: '+type2Color(rand)+';" class="event-card"> <div class="event-head"> <h2>🎉 Event - '+name+'</h2> </div> <div style="background-image: url('+image+');" class="event-hero"></div> <div class="event-footer"> <h2>When - '+startTime+'</h2> <p>'+venueName+' / '+venueAddress+'</p> </div> </li>')
           }
        }else{
          //Handels err
          console.log(error);
        }
    });


  })

  socket.on('getResturant', function(lat,long,type){
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

  socket.on('getNews', function(topic){
    request.get({
      url: "https://api.nytimes.com/svc/topstories/v2/home.json",
      rejectUnauthorized: false,
      qs: {
        'api-key': "0b5655891e394decad545c71357c88e7"
      },
    }, function(err, response, body) {
       body = JSON.parse(body);
         var count = 0;
         loop(count)
         function loop(count) {
           if (count < 6) {
             var count = count + 1
             var title = body.results[count].title;
             var url = body.results[count].url;
             try{
               var image = body.results[count].multimedia[3].url;
               var caption = body.results[count].multimedia[3].caption;
             }catch(err){
               var image = "https://i.imgur.com/gDGiJQE.png"
               var caption = "No Caption."
             }

             var abstract = body.results[count].abstract;
             var rand = Math.floor(Math.random() * 7) + 1
             socket.emit('displayNews', ' <li style="background-color: '+type2Color(rand)+';" class="news-card"> <div class="event-head"> <h2>📰  '+title+'</h2> </div> <div style="background-image: url('+image+');" class="event-hero"></div> <div class="event-footer"> <h3>'+caption+'</h3> <p>'+abstract+' <p>Read more..</p> </div> </li>')
             loop(count)
           } else {
             return;
           }
         }
      })
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
