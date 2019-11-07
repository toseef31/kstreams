console.log('service worker loaded...');
self.addEventListener('push', e => {
	
	const data = e.data.json();
	console.log('push  received...');
	self.registration.showNotification(data.title,{
		//body:'hello by Peek International',
		icon:'images/image.png'
	});
});