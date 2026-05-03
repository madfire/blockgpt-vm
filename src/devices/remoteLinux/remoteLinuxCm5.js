const RemoteLinuxDeviceBase = require('./remoteLinuxBase');

class RemoteLinuxCm5Device extends RemoteLinuxDeviceBase {
    get DEVICE_ID () {
        return 'remoteLinuxCm5';
    }
}

module.exports = RemoteLinuxCm5Device;
