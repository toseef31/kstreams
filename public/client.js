const publicVapidKey = 'BOkWsflrOnCVOs19RXCMiHl-tAbRzKC3BlAwxzTo7rJYWGAgGFzDweF9jgSvlZ17AwV-fIlXPRxPVp_-Hr9gwk4';

//check for service worker
// if ('serviceWorker' in navigator) {
// 	send('you have a new messege').catch(err => console.error(err));
// }

// register sw, register push , send push
async function send() {
	var tempSubs;
	//registering service worker
	console.log('regitering service worker.....');
	const register = await navigator.serviceWorker.register('/worker.js',{
		scope:'/'
	});
	console.log('service worker register.....');
	//register push
	console.log('registering push');
	
	const _subscription = await register.pushManager.subscribe({
		userVisibleOnly:true,
		applicationServerKey:urlBase64ToUint8Array(publicVapidKey)
	}).then(function (pushSubscription){
		// console.log(pushSubscription);
        const pushSub = {
            endpoint: pushSubscription.endpoint,
            keys:{
                p256dh: pushSubscription.getKey('p256dh'),
                auth: pushSubscription.getKey('auth')
            }
		};
		
		tempSubs = pushSub;
	});

	console.log('push registered');
    console.log(tempSubs);
	// send push notifications
	console.log('sending push');
	await fetch('/subscribe',{
		method: 'POST',
		body: JSON.stringify({subscription:tempSubs,title:'title'}),
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
