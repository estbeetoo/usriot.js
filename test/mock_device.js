/**
 * Created by boba on 30.03.16.
 * Original source: https://github.com/JohnMasen/USRWin/blob/master/MockDevice/app.js
 */
console.log('Mock USR IoT device starting...');
var net = require('net');
var udp = require('dgram');
var ip = require('ip');

var udpServer = udp.createSocket('udp4', console.log('udp server created'));
var discoveryMsg = new Buffer([0xff, 0x01, 0x01, 0x02]);
var udpResponse = new Buffer([0xFF, 0x24, 0x1, 0x0D, 0x44, 0x0A, 0x21, 0xED, 0xB1, 0xD8, 0xB0, 0x4C, 0xE0, 0x7E, 0xA3, 0x1, 0x0, 0x1, 0x0, 0x55, 0x53, 0x52, 0x2D, 0x57, 0x53, 0x61, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x8C]);
var tcpLogin = new Buffer([0x61, 0x64, 0x6D, 0x69, 0x6E, 0x0D, 0x0A]);
var tcpResourceDiscover = new Buffer([0x55, 0xAA, 0x0, 0x2, 0x0, 0x7E, 0x80]);
var tcpResourceDiscoverResponse = new Buffer([0xAA, 0x55, 0x0, 0x7, 0x0, 0xFE, 0x2, 0x0, 0x0, 0x0, 0x0, 0x7]);
var tcpResourceQuery = new Buffer([0x55, 0xAA, 0x0, 0x2, 0x0, 0x0A, 0x0C]);
var tcpResourceResult = new Buffer([0xAA, 0x55, 0x0, 0x3, 0x0, 0x8A, 0x0, 0x8D]);
var tcpResource1Reverse = new Buffer([0x55, 0xAA, 0x00, 0x03, 0x00, 0x03, 0x01, 0x07]);
var tcpResource1ON = new Buffer([0xAA, 0x55, 0x00, 0x04, 0x00, 0x83, 0x01, 0x01, 0x89]);
var tcpResource1OFF = new Buffer([0xAA, 0x55, 0x00, 0x04, 0x00, 0x83, 0x01, 0x00, 0x88]);
var tcpInternalError = new Buffer([0x0, 0x0]);
var isResource1On = false;

var addr = ip.address();
ip.toBuffer(addr, udpResponse, 5);//setup IP in UDP response to server ip

udpServer.on('listening', function(){
    var address = udpServer.address();
    console.log('listening udp on '+address.address+':'+address.port);
});

udpServer.on('message', function (msg, rinfo){
    console.log('udpmsg:',msg);
    if (discoveryMsg.compare(msg) == 0) {
        udpServer.send(udpResponse, 0, udpResponse.length, rinfo.port, rinfo.address, function (err) {
            if (err != 0) {
                console.log(err);
            }
        });
    }
});

udpServer.on('error', function (err){
        console.log(err);
    }
)
udpServer.bind(1901);

var tcpServer = net.createServer(function (socket) {
    console.log('CONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);
    socket.on('data', function (data) {
        var response = tcpInternalError;
        console.log("TCP Received:", data);
        if (data.compare(tcpLogin)==0) {
            response = "OK";
        }
        if (data.compare(tcpResourceDiscover)==0) {
            response = tcpResourceDiscoverResponse;
        }
        if (data.compare(tcpResourceQuery) == 0) {
            response = tcpResourceResult;
        }
        if (data.compare(tcpResource1Reverse) == 0) {
            isResource1On = isResource1On?false:true;
            if (isResource1On) {
                response = tcpResource1ON;
            }
            else {
                response = tcpResource1OFF;
            }
        }
        socket.write(response);
        console.log("TCP sent:", response);
    });
});
tcpServer.listen(8899);
console.log("TCP listening at 8899");