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
    this.timeout = options.timeout || 5000;
    this.socket = null;
    this.passportSent = false;
    this.queue = [];
}
util.inherits(WiFiIO, events.EventEmitter);

WiFiIO.prototype.toString = function () {
    return 'WiFiIO[' + this.host + ':' + this.port + ']';
}

WiFiIO.prototype.connect = function (callback) {
    this.socket = new net.connect({host: this.host, port: this.port});
    this.socket.on('data', function (data) {
        this.debug && console.log('[%s] received: ' + JSON.stringify(data) + ', string:' + data.toString('ascii'), this);
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
        this._send(helloBuf, function (error, response) {
            if (error) {
                error = new Error('Error sending passport, cause: %s', error);
                this.debug && console.log(error.toString);
                this.disconnect();
                return callback && callback(error);
            }
            if (!response)
                return;
            this.passportSent = false;
            if (response.toString('ascii') === 'OK') {
                callback && callback();
                this.emit('connected');
            }
            else {
                error = new Error('Passport was rejected');
                this.debug && console.log(error.toString);
                this.disconnect();
                return callback && callback(error);
            }
        }.bind(this));

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

WiFiIO.prototype.handleCmdResponse = function (packet, parameter /*Buffer*/) {
    switch (packet) {
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
            var oldStatus = 0;
            for (var i = 0; i < parameter.length; i++)
                oldStatus += parameter[i] << i;
            oldStatus = oldStatus.toString(2);
            var status = '';
            for (var i = 0; i < oldStatus.length; i++)
                status += (parseInt(oldStatus.charAt(i)) & 1).toString();
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
            console.log('[WARN] Cmd[' + packet.toString(16) + '] is not implemented or unsupported by current device');
    }
}
WiFiIO.prototype.invertIO = function (ioNumber, callback) {
    this._send(this._buildPacket(0x03, parseInt(ioNumber)), callback);
}
WiFiIO.prototype.openIO = function (ioNumber, callback) {
    this._send(this._buildPacket(0x02, parseInt(ioNumber)), callback);
}
WiFiIO.prototype.closeIO = function (ioNumber, callback) {
    this._send(this._buildPacket(0x01, parseInt(ioNumber)), callback);
}
WiFiIO.prototype.clearAll = WiFiIO.prototype.closeAll = function (callback) {
    this._send(this._buildPacket(0x04), callback);
}
WiFiIO.prototype.setAll = WiFiIO.prototype.openAll = function (callback) {
    this._send(this._buildPacket(0x05), callback);
}
WiFiIO.prototype.invertAll = function (callback) {
    this._send(this._buildPacket(0x06), callback);
}
WiFiIO.prototype.readIO = function (ioNumber, callback) {
    this._send(this._buildPacket(0x13, parseInt(ioNumber)), function () {
        this.once('input.' + ioNumber.toString(), callback);
    }.bind(this), callback);
}
WiFiIO.prototype.readAllIO = function (callback) {
    this._send(this._buildPacket(0x14), function () {
        this.once('input.all', callback);
    }.bind(this), callback);
}
WiFiIO.prototype.readDeviceInfo = function (callback) {
    this._send(this._buildPacket(0x70), function () {
        this.once('deviceinfo', callback);
    }.bind(this), callback);
}

var lastSent = null;

function handleQueue(transport) {
    stopSendTimeout();
    var item = transport.queue[0];
    //If it's true, handleQueue being called twice for same queue state. For sure: it's send timeout. Call callback and schedule next handleQueue
    if (lastSent && item && lastSent.id === item.id)
        return item.callbackInner(new Error('Send timeout'), null);
    if (item !== null && item !== undefined) {
        transport.debug && console.log('usriot: sending item[%s]', JSON.stringify(item));
        item.callbackInner = buildCallbackInner(item, transport);
        lastSent = item;
        resetSendTimeout(transport);
        transport.socket.write(item.packet, item.callbackInner.bind(this));
    }
}

WiFiIO.prototype._send = function (packet, callback, callbackWithoutEE) {
    if (packet === '' || packet === null)
        return callback && callback(new Error('Empty command parameter'));
    this.queue.push({id: nextId(), packet: packet, callback: callback, callbackWithoutEE: callbackWithoutEE});
    this.queue.length === 1 && handleQueue(this);
}

/*
 Not always telnet-client's socket fire timeout event, when there are no response after command sent
 That's why one startint timeout timer after each packet sent.
 */
var sendTimeout;
function resetSendTimeout(transport) {
    sendTimeout = setTimeout(function () {
        handleQueue(transport);
    }, transport.timeout || 1500);
}
function stopSendTimeout() {
    clearTimeout(sendTimeout);
}

var id = 1;
function nextId() {
    id++;
    if (id > 65535)
        id = 1;
    return id;
}

function buildCallbackInner(_item, _transport) {
    return function (item, transport) {
        return function (error, response) {
            transport.debug && console.log('usriot: callbackInner(%s, %s) for item[%s]', JSON.stringify(error), JSON.stringify(response), JSON.stringify(item));
            stopSendTimeout();
            if (item.callbackCalled)
                return false;
            item.callbackCalled = true;
            setImmediate(function () {
                handleQueue(transport);
            });
            if (lastSent && lastSent.id === item.id) {
                transport.debug && console.log('usriot: clearing lastSent');
                lastSent = null;
            }
            transport.queue.shift();
            if (error && item.callbackWithoutEE)
                item.callbackWithoutEE && item.callbackWithoutEE(error, response);
            else
                item.callback && item.callback(error, response);
        }
    }(_item, _transport);
}

WiFiIO.prototype._buildPacket = function (packet, parameter) {
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
    packet.writeUInt8(parseInt(packet) & 255, 5);
    for (var i = 0; i < parameterBuf.length; i++)
        packet.writeUInt8(parameterBuf[i], 6 + i);
    packet.writeUInt8(length + parseInt(packet) + parameter, 6 + parameterBuf.length);
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