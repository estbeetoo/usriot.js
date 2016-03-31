/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var USRIoT = require('../');
var connection = new USRIoT(config);
connection.connect(function(error) {
  if (error)
    return console.log('Error connecting: ' + error);
  console.log('Connected successfully!');
  connection.on('response', function(response){
    console.log('Response[%s] red', JSON.stringify(response));
    connection.disconnect();
    process.exit();
  });
  connection.readAllIO(function(error, value) {
    if (error)
      console.log('Cannot read IO status, cause: %s', error);
    else
      console.log('Status[%s] red', value);
  });
});