const formatMessage = require('format-message');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const ProgramModeType = require('../../extension-support/program-mode-type');

const CommonPeripheral = require('../common/common-peripheral');

/**
 * The list of USB device filters.
 * @readonly
 */
const PNPID_LIST = [
    // CH340
    'USB\\VID_1A86&PID_7523'
];

/**
 * Configuration of serialport
 * @readonly
 */
const SERIAL_CONFIG = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    dtr: false,
    rts: false
};

/**
 * Configuration for arduino-cli.
 * @readonly
 */
const DIVECE_OPT = {
    type: 'microPython',
    chip: 'k210',
    baud: '1500000',
    board: 'maixduino',
    slowMode: true, // slow download mode
    firmware: 'canmv_yahboom_v2.1.1.bin',
    rtsdtr: false
};

// block icons
const consoleIconURI = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzI2MjA4OTU4OTI1IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjE2MjMiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGQ9Ik04NTMuMzMzMzMzIDgxMC42NjY2NjcgODUzLjMzMzMzMyAyOTguNjY2NjY3IDE3MC42NjY2NjcgMjk4LjY2NjY2NyAxNzAuNjY2NjY3IDgxMC42NjY2NjcgODUzLjMzMzMzMyA4MTAuNjY2NjY3TTg1My4zMzMzMzMgMTI4QzkwMC4yNjY2NjcgMTI4IDkzOC42NjY2NjcgMTY2LjQgOTM4LjY2NjY2NyAyMTMuMzMzMzMzTDkzOC42NjY2NjcgODEwLjY2NjY2N0M5MzguNjY2NjY3IDg1Ny42IDkwMC4yNjY2NjcgODk2IDg1My4zMzMzMzMgODk2TDE3MC42NjY2NjcgODk2QzEyMy43MzMzMzMgODk2IDg1LjMzMzMzMyA4NTcuNiA4NS4zMzMzMzMgODEwLjY2NjY2N0w4NS4zMzMzMzMgMjEzLjMzMzMzM0M4NS4zMzMzMzMgMTY1Ljk3MzMzMyAxMjMuNzMzMzMzIDEyOCAxNzAuNjY2NjY3IDEyOEw4NTMuMzMzMzMzIDEyOE01NTQuNjY2NjY3IDcyNS4zMzMzMzMgNTU0LjY2NjY2NyA2NDAgNzY4IDY0MCA3NjggNzI1LjMzMzMzMyA1NTQuNjY2NjY3IDcyNS4zMzMzMzNNNDA4Ljc0NjY2NyA1NTQuNjY2NjY3IDIzNy42NTMzMzMgMzg0IDM1OC40IDM4NCA0OTkuMiA1MjQuOEM1MTUuODQgNTQxLjQ0IDUxNS44NCA1NjguNzQ2NjY3IDQ5OS4yIDU4NS4zODY2NjdMMzU5LjI1MzMzMyA3MjUuMzMzMzMzIDIzOC41MDY2NjcgNzI1LjMzMzMzMyA0MDguNzQ2NjY3IDU1NC42NjY2NjdaIiBwLWlkPSIxNjI0Ij48L3BhdGg+PC9zdmc+"
const screenIconURI = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzI2MjgyNjYxMTA0IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9Ijc4ODgiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGQ9Ik02OTIuMzExMDQgNzQ0LjYyNzJhMjQuNDg4OTYgMjQuNDg4OTYgMCAwIDEgMCA0OC45NzI4SDMzMS42ODg5NmEyNC40ODg5NiAyNC40ODg5NiAwIDAgMSAwLTQ4Ljk3MjhoMzYwLjYyMjA4ek04NDcuODcyIDIzMC40YzQwLjcxOTM2IDAgNzMuNzI4IDMzLjAwODY0IDczLjcyOCA3My43Mjh2MzQyLjI4MjI0YzAgNDAuNzE5MzYtMzMuMDA4NjQgNzMuNzI4LTczLjcyOCA3My43MjhIMTc2LjEyOGMtNDAuNzE5MzYgMC03My43MjgtMzMuMDA4NjQtNzMuNzI4LTczLjcyOFYzMDQuMTI4QzEwMi40IDI2My40MDg2NCAxMzUuNDA4NjQgMjMwLjQgMTc2LjEyOCAyMzAuNGg2NzEuNzQ0eiBtLTMyMy4xODQ2NCAxNjYuNTIyODhhMjQuNTk2NDggMjQuNTk2NDggMCAwIDAtMzQuMDg4OTYtNi42MjUyOEwzMjcuNTQ2ODggNDk5Ljg3NTg0YTI0LjQzMjY0IDI0LjQzMjY0IDAgMCAwLTYuNjA0OCAzMy45NzYzMiAyNC41OTY0OCAyNC41OTY0OCAwIDAgMCAzNC4wODg5NiA2LjYyNTI4bDE2My4wNTE1Mi0xMDkuNTc4MjQgMC4wNjY1Ni0wLjA1MTJhMjQuNDMyNjQgMjQuNDMyNjQgMCAwIDAgNi41MzgyNC0zMy45MjUxMnogbTE3MC40MTkyLTMxLjk0ODhhMjQuNTk2NDggMjQuNTk2NDggMCAwIDAtMzQuMDg4OTYtNi42MjUyOEw0NTAuNDI2ODggNDk5Ljg3NTg0YTI0LjQzMjY0IDI0LjQzMjY0IDAgMCAwLTYuNjA0OCAzMy45NzYzMiAyNC41OTY0OCAyNC41OTY0OCAwIDAgMCAzNC4wODg5NiA2LjYyNTI4bDIxMC41OTA3Mi0xNDEuNTI3MDQgMC4wNzE2OC0wLjA1MTJhMjQuNDMyNjQgMjQuNDMyNjQgMCAwIDAgNi41MzMxMi0zMy45MjUxMnoiIGZpbGw9IiMxMjk2ZGIiIHAtaWQ9Ijc4ODkiPjwvcGF0aD48L3N2Zz4="
const imageIconURI = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzI2MjgxMjUwMzAxIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjU2OTEiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGQ9Ik04MS45MiA4MS45MmgzMzAuMDc2MTZhODEuOTIgODEuOTIgMCAwIDEgNzcuNzIxNiA1Ni4wMTI4bDQ3Ljc3OTg0IDE0My4zNkE4MS45MiA4MS45MiAwIDAgMSA0NTkuNzc2IDM4OS4xMkg4MS45MmE4MS45MiA4MS45MiAwIDAgMS04MS45Mi04MS45MlYxNjMuODRhODEuOTIgODEuOTIgMCAwIDEgODEuOTItODEuOTJ6IiBmaWxsPSIjMDg5NzlDIiBwLWlkPSI1NjkyIj48L3BhdGg+PHBhdGggZD0iTTAgMjM1LjUyaDk0Mi4wOGE4MS45MiA4MS45MiAwIDAgMSA4MS45MiA4MS45MnY1NTIuOTZhODEuOTIgODEuOTIgMCAwIDEtODEuOTIgODEuOTJIODEuOTJhODEuOTIgODEuOTIgMCAwIDEtODEuOTItODEuOTJWMjM1LjUyeiIgZmlsbD0iIzM2Q0ZDOSIgcC1pZD0iNTY5MyI+PC9wYXRoPjxwYXRoIGQ9Ik0yMjUuMjggNzQyLjUyMjg4bDE4MS41ODU5Mi0xODAuMzI2NEw0OTEuNTIgNjY1LjZsMTc0LjA4LTE2My44NCAxMzMuMTIgMTEyLjY0djE5NC41NkgyMjUuMjh6IiBmaWxsPSIjQjVGNUVDIiBwLWlkPSI1Njk0Ij48L3BhdGg+PHBhdGggZD0iTTM1My4yOCA0MzUuMm0tNjYuNTYgMGE2Ni41NiA2Ni41NiAwIDEgMCAxMzMuMTIgMCA2Ni41NiA2Ni41NiAwIDEgMC0xMzMuMTIgMFoiIGZpbGw9IiNCNUY1RUMiIHAtaWQ9IjU2OTUiPjwvcGF0aD48cGF0aCBkPSJNNDkxLjUyIDY2NS42TDM1OC40IDgwOC45NkgyMjUuMjh2LTcxLjY4bDE3NC4wOC0xODQuMzJ6IiBmaWxsPSIjMDg5NzlDIiBwLWlkPSI1Njk2Ij48L3BhdGg+PC9zdmc+"
const sensorIconURI = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzI2Mjg1NTQ0NDA1IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjIyMjAwIiB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNOTMuMDkwOTA5IDIzMi43MjcyNzN2NjUxLjYzNjM2M2g4MzcuODE4MTgyVjIzMi43MjcyNzNoLTE4Ni4xODE4MThsLTY5LjgxODE4Mi05My4wOTA5MDlIMzQ5LjA5MDkwOWwtNjkuODE4MTgyIDkzLjA5MDkwOUg5My4wOTA5MDl6TTQ2LjU0NTQ1NSAxODYuMTgxODE4aDIwOS40NTQ1NDVsNjkuODE4MTgyLTkzLjA5MDkwOWgzNzIuMzYzNjM2bDY5LjgxODE4MiA5My4wOTA5MDloMjA5LjQ1NDU0NXY3NDQuNzI3MjczSDQ2LjU0NTQ1NVYxODYuMTgxODE4eiBtNDY1LjQ1NDU0NSA1MzUuMjcyNzI3YTE2Mi45MDkwOTEgMTYyLjkwOTA5MSAwIDEgMCAwLTMyNS44MTgxODEgMTYyLjkwOTA5MSAxNjIuOTA5MDkxIDAgMCAwIDAgMzI1LjgxODE4MXogbTAgNDYuNTQ1NDU1YTIwOS40NTQ1NDUgMjA5LjQ1NDU0NSAwIDEgMSAwLTQxOC45MDkwOTEgMjA5LjQ1NDU0NSAyMDkuNDU0NTQ1IDAgMCAxIDAgNDE4LjkwOTA5MXpNODE0LjU0NTQ1NSAxMzkuNjM2MzY0VjkzLjA5MDkwOWgxMTYuMzYzNjM2djQ2LjU0NTQ1NWgtMTE2LjM2MzYzNnoiIGZpbGw9IiMxMjk2ZGIiIHAtaWQ9IjIyMjAxIj48L3BhdGg+PC9zdmc+"
class Ecool extends CommonPeripheral{
    /**
     * Construct a Ecool communication object.
     * @param {Runtime} runtime - the OpenBlock runtime
     * @param {string} deviceId - the id of the extension
     * @param {string} originalDeviceId - the original id of the peripheral, like xxx_arduinoUno
     */
    constructor (runtime, deviceId, originalDeviceId) {
        super(runtime, deviceId, originalDeviceId, PNPID_LIST, SERIAL_CONFIG, DIVECE_OPT);
    }
}

class OpenBlockEcoolDevice {
    /**
     * @return {string} - the ID of this extension.
     */
    get DEVICE_ID () {
        return 'ecool';
    }
    /**
     * Construct a set of Arduino blocks.
     * @param {Runtime} runtime - the OpenBlock runtime.
     * @param {string} originalDeviceId - the original id of the peripheral, like xxx_arduinoUno
     */
    constructor (runtime, originalDeviceId) {
        /**
         * The OpenBlock runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Create a new K210 peripheral instance
        this._peripheral = new Ecool(this.runtime, this.DEVICE_ID, originalDeviceId);
    }

    /**
     * @returns {Array.<object>} metadata for this extension and its blocks.
     */
    getInfo () {
        return [
        {   
            id: 'screen',
            name: formatMessage({
                id: 'ecool.category.screen',
                default: 'Screen',
                description: 'The name of the ecool device screen category'
            }),
            menuIconURI: screenIconURI,
            color1: '#1296db',
            // 创建块，包含 屏幕初始化，屏幕旋转，屏幕镜像，屏幕显示，屏幕设置颜色，屏幕清屏，
            blocks: [
                // 屏幕初始化
                {
                    opcode: 'screenInit',
                    text: formatMessage({
                        id: 'ecool.screen.screenInit',
                        default: 'Screen init',
                        description: 'ecool screen init'
                    }),
                    blockType: BlockType.COMMAND
                },
                // 屏幕旋转
                {
                    opcode: 'screenRotate',
                    text: formatMessage({
                        id: 'ecool.screen.screenRotate',
                        default: 'Screen rotate [ANGLE]',
                        description: 'ecool screen rotate'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        ANGLE: {
                            type: ArgumentType.ANGLE,
                            defaultValue: 0
                        }
                    }
                },
                // 屏幕镜像
                {
                    opcode: 'screenMirror',
                    text: formatMessage({
                        id: 'ecool.screen.screenMirror',
                        default: 'Screen mirror [MODE]',
                        description: 'ecool screen mirror'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MODE: {
                            type: ArgumentType.NUMBER,
                            menu: 'mirrorMode',
                            defaultValue: 0
                        }
                    }
                },
                // 屏幕显示 红，绿，蓝，紫，黄，青，白，黑，
                {
                    opcode: 'screenShow',
                    text: formatMessage({
                        id: 'ecool.screen.screenShow',
                        default: 'Screen show color [COLOR]',
                        description: 'ecool screen show'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        COLOR: {
                            type: ArgumentType.STRING,
                            menu: 'color',
                            defaultValue: 'RED'
                        }
                    }
                },
                // 屏幕设置颜色R数值，G数值，B数值
                {
                    opcode: 'screenSet',
                    text: formatMessage({
                        id: 'ecool.screen.screenSet',
                        default: 'Screen set R [R] G [G] B [B]',
                        description: 'ecool screen set'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        R: {
                            type: ArgumentType.UINT8_NUMBER,
                            defaultValue: 255
                        },
                        G: {
                            type: ArgumentType.UINT8_NUMBER,
                            defaultValue: 0
                        },
                        B: {
                            type: ArgumentType.UINT8_NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                // 屏幕显示image
                {
                    opcode: 'screenShowImage',
                    text: formatMessage({
                        id: 'ecool.screen.screenShowImage',
                        default: 'Screen show image [IMAGE]',
                        description: 'ecool screen show image'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        IMAGE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'your_image_path'
                        }}
                },
                // 屏幕清屏
                {
                    opcode: 'screenClear',
                    text: formatMessage({
                        id: 'ecool.screen.screenClear',
                        default: 'Screen clear',
                        description: 'ecool screen clear'
                    }),
                    blockType: BlockType.COMMAND
                }

            ],
            menus: {
                mirrorMode: {
                    items: [
                        {
                            text: formatMessage({
                                id: 'ecool.screen.mirrorMode.normal',
                                default: 'Normal',
                                description: 'ecool screen mirror mode normal'
                            }),
                            value: 0
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.screen.mirrorMode.flip',
                                default: 'Flip',
                                description: 'ecool screen mirror mode flip'
                            }),
                            value: 1
                        }
                    ]
                },
                color: {
                    items: [
                        {
                            text: formatMessage({
                                id: 'ecool.screen.color.red',
                                default: 'Red',
                                description: 'ecool screen color red'
                            }),
                            value: 'RED'
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.screen.color.green',
                                default: 'Green',
                                description: 'ecool screen color green'
                            }),
                            value: 'GREEN'
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.screen.color.blue',
                                default: 'Blue',
                                description: 'ecool screen color blue'
                            }),
                            value: 'BLUE'
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.screen.color.purple',
                                default: 'Purple',
                                description: 'ecool screen color purple'
                            }),
                            value: 'PURPLE'
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.screen.color.yellow',
                                default: 'Yellow',
                                description: 'ecool screen color yellow'
                            }),
                            value: 'YELLOW'
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.screen.color.cyan',
                                default: 'Cyan',
                                description: 'ecool screen color cyan'
                            }),
                            value: 'CYAN'
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.screen.color.white',
                                default: 'White',
                                description: 'ecool screen color white'
                            }),
                            value: 'WHITE'
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.screen.color.black',
                                default: 'Black',
                                description: 'ecool screen color black'
                            }),
                            value: 'BLACK'
                        }
                    ]
                }


            }
        },
        // image
        {
            id: 'image',
            name: formatMessage({
                id: 'ecool.category.image',
                default: 'Image',
                description: 'The name of the ecool device image category'
            }),
            menuIconURI: imageIconURI,
            color1: '#36CFC9',
            blocks: [
                // img = image.Image()
                {
                    opcode: 'imageInit',
                    text: formatMessage({
                        id: 'ecool.image.imageInit',
                        default: 'Image Set [IMAGE]',
                        description: 'ecool image init'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        IMAGE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'image.Image()',
                            description: 'ecool image set value'
                        }
                    }


                },
                {
                    opcode: 'image',
                    text: formatMessage({
                        id: 'ecool.image.image',
                        default: 'Image',
                        description: 'ecool image'
                    }),
                    disableMonitor: true,
                    blockType: BlockType.REPORTER,
                },
                // image.draw_string
                {
                    opcode: 'imageDrawString',
                    text: formatMessage({
                        id: 'ecool.image.imageDrawString',
                        default: 'Image Draw String: [TEXT] X: [X] Y: [Y] Size: [SIZE] Color: [COLOR]',
                        description: 'ecool image draw string'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello MicroPython!'
                        },
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        SIZE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 2
                        },
                        COLOR: {
                            type: ArgumentType.COLOR,
                            defaultValue: ''
                        }
                    }
                },
                // image.draw_rectangle
                {
                    opcode: 'imageDrawRectangle',
                    text: formatMessage({
                        id: 'ecool.image.imageDrawRectangle',
                        default: 'Image Draw Rectangle: X: [X] Y: [Y] W: [W] H: [H] Color: [COLOR] T: [THICKNESS] Fill: [FILL]',
                        description: 'ecool image draw rectangle'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        W: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        },
                        H: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        },
                        COLOR: {
                            type: ArgumentType.COLOR,
                            defaultValue: ''
                        },
                        THICKNESS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        FILL: {
                            type: ArgumentType.STRING,
                            menu: 'fill',
                            defaultValue: 1
                        }
                    }
                },


            ],
            menus: { 
                // fill 值：0 为空心，1 为实心
                fill: {
                    items: [
                        {
                            text: formatMessage({
                                id: 'ecool.image.fill.empty',
                                default: 'Empty',
                                description: 'ecool image fill empty'
                            }),
                            value: 0
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.image.fill.solid',
                                default: 'Solid',
                                description: 'ecool image fill solid'
                            }),
                            value: 1
                        }
                    ]
                }
            }
        },
        // sensor
        {
            id: 'sensor',
            name: formatMessage({
                id: 'ecool.category.sensor',
                default: 'Sensor',
                description: 'The name of the ecool device sensor category'
            }),
            menuIconURI: sensorIconURI,
            color1: '#1296db',
            blocks: [
                {
                    opcode: 'sensorinit',
                    text: formatMessage({
                        id: 'ecool.sensor.sensorinit',
                        default: 'Sensor Init: Format[PIX] Size[SIZE] SkipFrame[SKIPFRAME]',
                        description: 'ecool sensor init'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PIX: {
                            type: ArgumentType.STRING,
                            menu: 'pix',
                            defaultValue: 'RGB565'
                        },
                        SIZE: {
                            type: ArgumentType.STRING,
                            menu: 'size',
                            defaultValue: 'QVGA'
                        },
                        SKIPFRAME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100
                        }
                    }
                },
                // snapshot
                {
                    opcode: 'snapshot',
                    text: formatMessage({
                        id: 'ecool.sensor.snapshot',
                        default: 'Sensor Snapshot',
                        description: 'ecool sensor snapshot'
                    }),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true
                },
            ],
            menus: { 
                pix: {
                    items: [
                        {
                            text: formatMessage({
                                id: 'ecool.sensor.pix.RGB565',
                                default: 'RGB565',
                                description: 'ecool sensor pix RGB565'
                            }),
                            value: 'RGB565'
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.sensor.pix.GRAYSCALE',
                                default: 'GRAYSCALE',
                                description: 'ecool sensor pix GRAYSCALE'
                            }),
                            value: 'GRAYSCALE'
                        }
                    ]
                },
                size: {
                    items: [
                        {
                            text: formatMessage({
                                id: 'ecool.sensor.size.320x240',
                                default: '320x240',
                                description: 'ecool sensor size 320x240'
                            }),
                            value: 'QVGA'
                        },
                        {
                            text: formatMessage({
                                id: 'ecool.sensor.size.160x120',
                                default: '160x120',
                                description: 'ecool sensor size 160x120'
                            }),
                            value: 'QQVGA'
                        }
                    ]
                }
            }

        },
        {
            id: 'console',
            name: formatMessage({
                id: 'ecool.category.console',
                default: 'Console',
                description: 'The name of the ecool device console category'
            }),
            menuIconURI: consoleIconURI,
            color1: '#666666',
            color2: '#0BF56A',
            blocks: [
                // time.clock()
                {
                    opcode: 'consoleTimeClock',
                    text: formatMessage({
                        id: 'ecool.console.consoleTimeClock',
                        default: 'Creat a clock',
                        description: 'ecool console time.clock()'
                    }),
                    blockType: BlockType.COMMAND,

                },
                // clock.tick()
                {
                    opcode: 'consoleTimeTick',
                    text: formatMessage({
                        id: 'ecool.console.consoleTimeTick',
                        default: 'clock tick',
                        description: 'ecool console clock.tick()'
                    }),
                    blockType: BlockType.COMMAND,

                },
                // clock.fps()
                {
                    opcode: 'consoleFps',
                    text: formatMessage({
                        id: 'ecool.console.consoleFps',
                        default: 'clock fps',
                        description: 'ecool console clock.fps()'
                    }),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true

                },
                {
                    opcode: 'consolePrint',
                    text: formatMessage({
                        id: 'ecool.console.consolePrint',
                        default: 'print [TEXT]',
                        description: 'ecool console print'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello MicroPython!'
                        }
                    }
                },
                {
                    opcode: 'consoleExecfile',
                    text: formatMessage({
                        id: 'ecool.console.consoleExecfile',
                        default: 'exec python file : [TEXT]',
                        description: 'ecool console Execfile'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'your_python_code.py'
                        }
                    }
                },
                {
                    opcode: 'consoleReboot',
                    text: formatMessage({
                        id: 'ecool.console.consoleReboot',
                        default: 'Reboot board',
                        description: 'ecool console Reboot'
                    }),
                    blockType: BlockType.COMMAND,
                }
            ],
            menus: { }
        }
        ];
    }
}

module.exports = OpenBlockEcoolDevice;
