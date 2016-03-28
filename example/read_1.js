/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var WiFiIO = require('../');
var connection = new WiFiIO(config);
connection.connect(function(error) {
  if (error)
    return console.log('Error connecting: ' + error);
  console.log('Connected successfully!');
  connection.readIO(1, function(value, error) {
    if (error)
      throw new Error('Cannot read IO status, cause: ' + error);
    console.log('Status[%s] red', value);
    connection.disconnect();
    process.exit();
  });
});