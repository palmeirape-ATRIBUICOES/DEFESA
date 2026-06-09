const https = require('https');

function request(url, options = {}, body = '') {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function main() {
  try {
    const randomStr = Math.random().toString(36).substring(2, 10);
    const recipient = `thiag-defesa-${randomStr}`;
    const email = `${recipient}@inboxkitten.com`;
    console.log(`Using email: ${email}`);

    console.log('Creating KVdb.io bucket...');
    const kvdbRes = await request('https://kvdb.io', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, `email=${encodeURIComponent(email)}`);

    if (kvdbRes.statusCode !== 200 && kvdbRes.statusCode !== 201) {
      throw new Error(`Failed to create bucket: status ${kvdbRes.statusCode}, body: ${kvdbRes.data}`);
    }

    const bucketId = kvdbRes.data.trim();
    console.log(`Bucket ID created: ${bucketId}`);

    console.log('Waiting for verification email from KVdb.io (polling InboxKitten)...');
    let activationUrl = null;

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 4000));
      const listRes = await request(`https://inboxkitten.com/api/v1/mail/list?recipient=${recipient}`);
      const messages = JSON.parse(listRes.data);
      if (messages && messages.length > 0) {
        const msg = messages.find(m => m.envelope.sender.includes('kvdb') || m.message.headers.subject.toLowerCase().includes('welcome'));
        if (msg) {
          const region = msg.storage.region;
          const key = msg.storage.key;
          console.log(`Found email! Region: ${region}, Key: ${key}`);

          // Fetch message HTML
          const htmlRes = await request(`https://inboxkitten.com/api/v1/mail/getHtml?region=${region}&key=${key}`);
          const bodyText = htmlRes.data;

          // Find direct activation link
          const urlRegex = /https:\/\/kvdb\.io\/login\?token=[a-zA-Z0-9\-\_\/\.\?\#\&\=\%]+/g;
          const match = bodyText.match(urlRegex);
          if (match) {
            activationUrl = match[0];
            console.log(`Found activation URL: ${activationUrl}`);
            break;
          } else {
            console.log('Direct activation URL not found in email body');
          }
        }
      }
      console.log(`Poll ${i+1}/20: No activation email yet...`);
    }

    if (!activationUrl) {
      throw new Error('Verification email not received or activation link not found.');
    }

    console.log('Activating bucket...');
    const actRes = await request(activationUrl);
    console.log(`Activation response status: ${actRes.statusCode}`);

    console.log('Testing write access...');
    const testPayload = JSON.stringify({ test: "success", timestamp: Date.now() });
    const writeRes = await request(`https://kvdb.io/${bucketId}/test_activation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testPayload);

    if (writeRes.statusCode === 200 || writeRes.statusCode === 201) {
      console.log('SUCCESS! Bucket is fully activated and writable.');
      console.log(`Your new Bucket URL is: https://kvdb.io/${bucketId}/notes`);
      console.log('--------------------------------------------------');
      console.log(`BUCKET_ID=${bucketId}`);
      console.log('--------------------------------------------------');
    } else {
      console.log(`Write test failed with status ${writeRes.statusCode}: ${writeRes.data}`);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
