const Buffer = require('buffer').Buffer;
const formatMessage = require('format-message');
const Base64Util = require('../../util/base64-util');
const SSH = require('../../io/ssh');

class RemoteLinuxPeripheral {
    constructor (runtime, deviceId) {
        this._runtime = runtime;
        this._deviceId = deviceId;
        this._connected = false;
        this._target = null;
        this._ssh = null;
        this._runtime.registerPeripheralExtension(deviceId, this);
    }

    scan () {
        // Remote Linux devices are configured by SSH credentials in the GUI.
    }

    connect (target) {
        if (this._ssh) {
            this._ssh.disconnect();
        }
        this._target = target;
        this._ssh = new SSH(this._runtime, this._deviceId, target, () => {
            this._connected = true;
        }, this.reset.bind(this));
    }

    disconnect () {
        if (this._ssh) {
            this._ssh.disconnect();
            this._ssh = null;
        }
        this._connected = false;
    }

    isConnected () {
        return this._ssh ? this._ssh.isConnected() : this._connected;
    }

    setBaudrate () {
        // Remote Linux devices do not use a serial baudrate.
    }

    write (data) {
        if (!this.isConnected() || !this._ssh) return;
        const base64Str = Buffer.from(data).toString('base64');
        this._ssh.write(base64Str, 'base64');
    }

    send (message) {
        if (!this.isConnected() || !this._ssh) return;
        const data = Base64Util.uint8ArrayToBase64(message);
        this._ssh.write(data, 'base64');
    }

    upload (code) {
        if (!this.isConnected() || !this._ssh) {
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_UPLOAD_ERROR, {
                message: formatMessage({
                    id: 'remoteLinux.upload.notConnected',
                    default: 'Remote Linux board is not connected yet.'
                })
            });
            return;
        }
        const base64Str = Buffer.from(code).toString('base64');
        this._ssh.upload(base64Str, {
            type: 'remoteLinux',
            deviceId: this._deviceId
        }, 'base64');
    }

    uploadFirmware () {
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_UPLOAD_ERROR, {
            message: formatMessage({
                id: 'remoteLinux.uploadFirmware.unsupported',
                default: 'Remote Linux devices do not support firmware upload in this mode.'
            })
        });
    }

    abortUpload () {
        if (this._ssh) {
            this._ssh.abortUpload();
        } else {
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_UPLOAD_SUCCESS, {aborted: true});
        }
    }

    reset () {
        this._connected = false;
    }
}

class RemoteLinuxDeviceBase {
    constructor (runtime, originalDeviceId) {
        this.runtime = runtime;
        this._peripheral = new RemoteLinuxPeripheral(this.runtime, this.DEVICE_ID, originalDeviceId);
    }

    getInfo () {
        return [];
    }
}

module.exports = RemoteLinuxDeviceBase;
