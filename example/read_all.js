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
  connection.readAllIO(function(error, value) {
    if (error)
      console.log('Cannot read IO status, cause: %s', error);
    else
      console.log('Status[%s] red', value);
    connection.disconnect();
    process.exit();
  });
});