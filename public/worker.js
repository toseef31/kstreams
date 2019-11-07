console.log('service worker loaded...');
self.addEventListener('push', e => {
	//console.log(e);	console.log(e.data.json);
	const data = e.data.json();
	console.log('push  received...');
	self.registration.showNotification(data.title,{
		//body:'hello by Peek International',
		icon:'images/image.png'
	});
});