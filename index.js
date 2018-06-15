const dgram = require('dgram');
const { EventEmitter } = require('events');
const crc = require('./crc');

const commander = dgram.createSocket('udp4');
// const video = dgram.createSocket('udp4');
const HOST = '192.168.10.1';
const PORT = 8889;

module.exports = class Miriteco extends EventEmitter {

    /**
     * @param {string} command
     * @param {number|string} value
     */
	static format(command, value) {
		return `${command} ${value}`;
	}

	static FORWARD_FLIP() {
		return 'f';
	}

	static FRONT_LEFT_FLIP() {
		return 'fl';
	}

	static FRONT_RIGHT_FLIP() {
		return 'fr';
	}

	static BACK_FLIP() {
		return 'b';
	}

	static BACK_LEFT_FLIP() {
		return 'bl';
	}

	static BACK_RIGHT_FLIP() {
		return 'rb';
	}

	static RIGHT_FLIP() {
		return 'r';
	}

	static LEFT_FLIP() {
		return 'l';
	}

	/**
	 * See https://github.com/hybridgroup/gobot/blob/635adea96f788ab19bf77470b075f8db44d34fa0/platforms/dji/tello/driver.go#L802
	 * @param {number} cmd
	 * @param {number} pktType
	 * @param {number} len
	 */
	static _createPacket(cmd, pktType, len) {
		const l = len + 11;
		let b = new Buffer([0xcc, l << 3, 0]);

		// See https://gobot.io/blog/2018/04/20/hello-tello-hacking-drones-with-go/

		b = Buffer.concat([b, new Buffer([crc.crc8(b)])]);
		b = Buffer.concat([b, new Buffer([pktType, cmd, 0])]);

		// Sequence number
		b = Buffer.concat([b, new Buffer([0, 1])]);

		const crc16 = new Buffer(2);
		crc16.fill(0);
		crc16.writeUInt16LE(crc.crc16(b));
		b = Buffer.concat([b, crc16]);

		return b;
	}

	constructor() {
		super();

		// video.on('listening', () => {
		// 	console.log('listen to video');
		// });

		// video.on('message', (msg) => {
		// 	console.log('video: ', msg.length);
		// });

		// video.on('error', (err) => {
		// 	console.log('video error:', err);
		// });

		// video.on('close', () => {
		// 	console.log('close');
		// });

		// video.bind(8890);

		commander.on('message', (msg) => {
			const req = this.queue.shift();

			this.emit('message', { req, res: msg.toString() });
		});

		this.queue = [];
	}

    /**
     * @param {Buffer} message
     */
	async _send(message) {
		const { length } = message;

		return new Promise((resolve, reject) => {
			commander.send(message, 0, length, PORT, HOST, (err, bytes) => {
				if (err) {
					reject(err);
				} else {
					resolve(bytes);
				}
			});
		});
	}

    /**
     * @param {string} str
     */
	async _sendAsBuffer(str) {
		this.queue.push(str);

		return this._send(new Buffer(str));
	}

	async _videoStart() {
		this.queue.push('videoStart');
		return await this._send(Miriteco._createPacket(0x25, 0x60, 0));
	}

	async setup() {
		return await this._sendAsBuffer('command');
	}

	async takeoff() {
		return await this._sendAsBuffer('takeoff');
	}

	async land() {
		return await this._sendAsBuffer('land');
	}

	/**
	 * @param {number} value [20 - 500 cm]
	 */
	async up(value) {
		return await this._sendAsBuffer(Miriteco.format('up', value));
	}

	/**
	 * @param {number} value [20 - 500 cm]
	 */
	async down(value) {
		return await this._sendAsBuffer(Miriteco.format('down', value));
	}

	/**
	 * @param {number} value [20 - 500 cm]
	 */
	async left(value) {
		return await this._sendAsBuffer(Miriteco.format('left', value));
	}

	/**
	 * @param {number} value [20 - 500 cm]
	 */
	async right(value) {
		return await this._sendAsBuffer(Miriteco.format('right', value));
	}

	/**
	 * @param {number} value [20 - 500 cm]
	 */
	async forward(value) {
		return await this._sendAsBuffer(Miriteco.format('forward', value));
	}

	/**
	 * @param {number} value [20 - 500 cm]
	 */
	async back(value) {
		return await this._sendAsBuffer(Miriteco.format('back', value));
	}

	/**
	 * @param {number} angle [1 - 3600 °]
	 */
	async clockwise(angle) {
		return await this._sendAsBuffer(Miriteco.format('cw', angle));
	}

	/**
	 * @param {number} angle [1 - 3600 °]
	 */
	async counterClockwise(angle) {
		return await this._sendAsBuffer(Miriteco.format('ccw', angle));
	}

	/**
	 * @param {string} str
	 */
	async flip(str) {
		return await this._sendAsBuffer(Miriteco.format('flip', str));
	}

	/**
	 * @param {number} value [1- 100 cm/s]
	 */
	async setSpeed(value) {
		return await this._sendAsBuffer(Miriteco.format('speed', value));
	}

	async requestBattery() {
		return await this._sendAsBuffer('battery?');
	}

	async requestSpeed() {
		return await this._sendAsBuffer('speed?');
	}

	async requestTime() {
		return await this._sendAsBuffer('time?');
	}

	/**
	 * @param {number} ms
	 */
	async delay(ms) {
		return new Promise((resolve) => setTimeout(() => resolve(), ms));
	}
};
