const publicVapidKey = 'BEU-89R8Bp4KeZEjOSQtFj-3aBvwgFE8iJ20y4CG2H4Mwip9jaX8dkldWsOPJtnp7fcqnQR1FbzVZeQ1YD7N5tA';

// check for service worker
if ('serviceWorker' in navigator) {
	//send('you have a new messege').catch(err => console.error(err));
}
// register sw, register push , send push
async function send(title) {
	//registering service worker
	console.log('regitering service worker.....');
	const register = await navigator.serviceWorker.register('/worker.js',{
		scope:'/'
	});
	console.log('service worker register.....');
	//register push
	console.log('registering push');
	
	const subscription = await register.pushManager.subscribe({
		userVisibleOnly:true,
		applicationServerKey:urlBase64ToUint8Array(publicVapidKey)
	});
	console.log('push registered');

	// send push notifications
	console.log('sending push');
	await fetch('/subscribe',{
		method: 'POST',
		body: JSON.stringify({subscription:subscription,title:title}),
		headers:{
			'content-type':'application/json'
		}
	});
	console.log('push send');	
}
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
