var ref = new Firebase("https://unum-1f4f8.firebaseio.com/users/");
ref.once("value", function(snapshot) {
  snapshot.forEach(function(childSnapshot) {
    var key = childSnapshot.key();
    console.log(key);
    var childData = childSnapshot.val();
  });
});