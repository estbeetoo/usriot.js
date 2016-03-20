/**
 * Created by boba on 08.03.16.
 * Protocol description: http://www.usriot.com/download/LonHand/GPIO%20control%20protocol%20V1.8.pdf
 */
var net = require('net');
var util = require('util');
var events = require('events');

function WiFiIO(options) {
    this.host = options.host || 'localhost';
    this.port = options.port || 8899;
    this.password = options.password || 'admin';
    this.debug = options.debug || false;
    this.readTimeout = options.readTimeout || 5000;
    this.socket = null;
    this.passportSent = false;
}
util.inherits(WiFiIO, events.EventEmitter);

WiFiIO.prototype.toString = function () {
    return 'WiFiIO[' + this.host + ':' + this.port + ']';
}

WiFiIO.prototype.connect = function (callback) {
    this.socket = new net.connect({host: this.host, port: this.port});
    this.socket.on('data', function (data) {
        this.debug && console.log('[%s] received: ' + JSON.stringify(data) + ', string:' + data.toString('ascii'), this);
        if (this.passportSent) {
            this.passportSent = false;
            if (data.toString('ascii') === 'OK') {
                callback && callback();
                this.emit('connected');
            }
            else {
                this.disconnect();
            }
        }
        else
            this.handleResponse(data);
    }.bind(this));
    this.socket.on('error', function (error) {
        console.log('[%s] Error: ' + JSON.stringify(error), this);
        this.disconnect();
    }.bind(this));
    this.socket.on('end', function () {
        this.debug && console.log('[%s] Socket ended', this);
        this.disconnect();
    }.bind(this));
    this.socket.on('close', function () {
        this.debug && console.log('[%s] Socket closed', this);
        this.disconnect();
    }.bind(this));
    this.socket.on('connect', function () {
        this.debug && console.log('[%s] Socket connected', this);
        this.passportSent = true;
        var helloBuf = new Buffer(this.password.length + 2);
        helloBuf.write(this.password);
        helloBuf.writeUInt8(0x0D, this.password.length);
        helloBuf.writeUInt8(0x0A, this.password.length + 1);
        this.socket.write(helloBuf);
    }.bind(this));
}

WiFiIO.prototype.handleResponse = function (data) {
    if (data.length == 2) {
        if (data[0] == 0x7F && data[1] == 0x7F) {
            this.debug && console.log('Busy');
            this.emit('busy');
        }
        else if (data[0] == 0x00 && data[1] == 0x00) {
            this.debug && console.log('Device failure');
            this.emit('error', new Error('Device failure'));
        }
    }
    else {
        if (data[0] !== 0xAA && data[1] !== 0x55) {
            this.debug && console.log('Packet header unknown, should be 2 bytes: [0xAA, 0x55]');
            this.emit('error', new Error('Packet header unknown, should be 2 bytes: [0xAA, 0x55]'));
        }
        var length = data[3] - 2;

        var packetEnd = 5 + length + 2;

        var payload = data.slice(5, 5 + length + 1);
        var parity = data[5 + length + 1];

        if (data.length > packetEnd)
            data = data.slice(packetEnd, data.length);
        else
            data = new Buffer(0);

        var parityCheck = length + 2;
        for (var i = 0; i < payload.length; i++)
            parityCheck += payload[i];
        parityCheck &= 255;
        if (parityCheck !== parity) {
            this.debug && console.log('Parity check fail');
            return this.emit('error', new Error('Parity check fail'));
        }
        this.handleCmdResponse(payload[0] - 0x80, payload.slice(1));
        //If we have remaining non empty data buffer to be handled
        if (data.length > 0)
            setImmediate(function () {
                this.handleResponse(data)
            }.bind(this));
    }
}

WiFiIO.prototype.handleCmdResponse = function (cmd, parameter /*Buffer*/) {
    switch (cmd) {
        case 0x01:
        case 0x02:
        case 0x03:
            this.emit('output.' + parameter[0], parameter[1]);
            break;
        case 0x04:
            this.emit('output.all', '000000000000');
            break;
        case 0x05:
            this.emit('output.all', '111111111111');
            break;
        case 0x13:
            break;
        case 0x14:
            var status = 0;
            for (var i = 0; i < parameter.length; i++)
                status += parameter[i] << i;
            status = status.toString(2);
            while (status.length < 12)
                status = '0' + status;
            this.emit('input.all', status);
            break;
        case 0x06:
        case 0x0a:
            var status = 0;
            for (var i = 0; i < parameter.length; i++)
                status += parameter[i] << i;
            status = status.toString(2);
            while (status.length < 12)
                status = '0' + status;
            this.emit('output.all', status);
            break;
        case 0x70:
            var info = {
                functions: {
                    webpage_configurated: false,
                    resource_number_configurable: false,
                    wifi: false,
                    wired: false,
                    gprs: false,
                    smartlink: false,
                    timing_task: false
                },
                model: 0,
                hardware_version: null,
                software_version: null
            };

            info.functions.webpage_configurated = (parameter[0] & (1 << 0)) != 0;
            info.functions.resource_number_configurable = (parameter[0] & (1 << 1)) != 0;
            info.functions.wifi = (parameter[0] & (1 << 2)) != 0;
            info.functions.wired = (parameter[0] & (1 << 3)) != 0;
            info.functions.gprs = (parameter[0] & (1 << 4)) != 0;
            info.functions.smartlink = (parameter[0] & (1 << 5)) != 0;
            info.functions.timing_task = (parameter[0] & (1 << 6)) != 0;

            switch (parameter[1]) {
                case 1:
                    info.model = 'IOT1';
                    break;
                case 2:
                    info.model = 'WIFI IO MINI';
                    break;
                case 3:
                    info.model = 'GPRS RTU';
                    break;
                case 4:
                    info.model = 'WIFI-IO-83';
                    break;
                case 5:
                    info.model = 'IOT2';
                    break;
                default:
                    info.model = 'unknown[' + parameter[i] + ']';
            }

            info.hardware_version = 'v' + (parameter[2] & 255) + '.' + (parameter[3] & 255);
            info.software_version = 'v' + (parameter[4] & 255) + '.' + (parameter[5] & 255);

            this.emit('deviceinfo', info);
            break;
        default:
            console.log('[WARN] Cmd[' + cmd.toString(16) + '] is not implemented or unsupported by current device');
    }
}
WiFiIO.prototype.invertIO = function (ioNumber, callback) {
    this.socket.write(this.preparePacketRS232(0x03, parseInt(ioNumber)), callback);
}
WiFiIO.prototype.openIO = function (ioNumber, callback) {
    this.socket.write(this.preparePacketRS232(0x02, parseInt(ioNumber)), callback);
}
WiFiIO.prototype.closeIO = function (ioNumber, callback) {
    this.socket.write(this.preparePacketRS232(0x01, parseInt(ioNumber)), callback);
}
WiFiIO.prototype.clearAll = WiFiIO.prototype.closeAll = function (callback) {
    this.socket.write(this.preparePacketRS232(0x04), callback);
}
WiFiIO.prototype.setAll = WiFiIO.prototype.openAll = function (callback) {
    this.socket.write(this.preparePacketRS232(0x05), callback);
}
WiFiIO.prototype.invertAll = function (callback) {
    this.socket.write(this.preparePacketRS232(0x06), callback);
}
WiFiIO.prototype.readIO = function (ioNumber, callback) {
    this.socket.write(this.preparePacketRS232(0x13, ioNumber), function () {
        this.once('input.' + ioNumber.toString(), getReadHandlerFunc(callback, this.readTimeout));
    }.bind(this));
}
WiFiIO.prototype.readAllIO = function (callback) {
    this.socket.write(this.preparePacketRS232(0x14), function () {
        this.once('input.all', getReadHandlerFunc(callback, this.readTimeout));
    }.bind(this));
}
WiFiIO.prototype.readDeviceInfo = function (callback) {
    this.socket.write(this.preparePacketRS232(0x70), function () {
        this.once('deviceinfo', getReadHandlerFunc(callback, this.readTimeout));
    }.bind(this));
}

function getReadHandlerFunc(callback, timeout) {
    var timeout = setTimeout(function () {
        callback(null, new Error('Timeout'));
    }, timeout);
    return function (value) {
        clearTimeout(timeout);
        callback(value);
    }
}

WiFiIO.prototype.preparePacketRS232 = function (cmd, parameter) {
    var parameterBuf = null;
    if (parameter === null || parameter === undefined) {
        parameter = 0;
        parameterBuf = new Buffer(0);
    }
    else if (typeof(parameter) !== 'number')
        throw Error('Expecting parameter of number type');
    else {
        parameterBuf = new Buffer(1);
        parameterBuf.writeUInt8(parameter, 0);
    }

    var length = parameterBuf.length + 2;
    var packet = new Buffer(7 + parameterBuf.length);
    packet.writeUInt8(0x55, 0);
    packet.writeUInt8(0xAA, 1);
    packet.writeUInt8(0x00, 2);
    packet.writeUInt8(length, 3);
    packet.writeUInt8(0x00, 4);
    packet.writeUInt8(parseInt(cmd) & 255, 5);
    for (var i = 0; i < parameterBuf.length; i++)
        packet.writeUInt8(parameterBuf[i], 6 + i);
    packet.writeUInt8(length + parseInt(cmd) + parameter, 6 + parameterBuf.length);
    this.debug && console.log('Packet[%s] prepared', JSON.stringify(packet));
    return packet;
}
WiFiIO.prototype.preparePacketIP = function (cmd, parameter) {
    if (typeof(parameter) !== 'number')
        throw Error('Expecting parameter of number type');

    var parameterBuf = new Buffer(1);
    parameterBuf.writeUInt8(parseInt(parameter), 0);

    var packet = new Buffer(1 + parameterBuf.length);
    packet.writeUInt8(parseInt(cmd) & 255, 0);

    for (var i = 0; i < parameterBuf.length; i++)
        packet.writeUInt8(parameterBuf[i], 1 + i);
    this.debug && console.log('Packet[%s] prepared', JSON.stringify(packet));
    return packet;
}

WiFiIO.prototype.disconnect = function () {
    if (this.socket) {
        this.emit('disconnected');
        this.socket.end();
        this.socket = null;
    }
    this.passportSent = false;
}


module.exports = WiFiIO;