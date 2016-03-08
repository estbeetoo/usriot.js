# Node.js client library to communicate with [USR IoT devices](http://www.usriot.com)#



### Usage

```
var WiFiIO = require('wifiio.js');
var connection = new WiFiIO({host: 'localhost', port: 8899});
connection.connect(function () {
    console.log('Connected successfully!');
    connection.invertIO(3, function () {
        connection.disconnect();
        process.exit();
    });
});
```

Look for more examples here: [/example](/example)

### Author

Alexander Borovsky, [BeeToo](http://beetoo.me)

### TODOs

* Take a look at C# library: [https://github.com/JohnMasen/USRWin](https://github.com/JohnMasen/USRWin)
* Add more test suites with mockup device
* Add response parsing
* Add keep-alive and auto reconnect
* Add send queue
* Implement multiple channels command, such as ```0x07 BBBB select multiple channel clear```

### Official Protocol documentation
* http://www.usriot.com/download/LonHand/GPIO%20control%20protocol%20V1.8.pdf
* http://www.usriot.com/gpio-communication-protocol-v1-8/