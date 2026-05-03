const RemoteLinuxDeviceBase = require('./remoteLinuxBase');

class RemoteLinuxK10Device extends RemoteLinuxDeviceBase {
    get DEVICE_ID () {
        return 'remoteLinuxK10';
    }
}

module.exports = RemoteLinuxK10Device;
