var ref = new firebase("https://unum-1f4f8.firebaseio.com/");
var usersRef = firebase.database().ref('/users/');
usersRef.on('child_added', function(data) {
    $('.user-card-inner').append('<div class="user-label">'+data.key+'</div>');
});