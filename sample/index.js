const Miriteco = require('../');

(async () => {
	const teco = new Miriteco();

	await teco.setup();
	await teco.takeoff();
	await teco.delay(10000);
	await teco.land();
})().catch(console.error);
