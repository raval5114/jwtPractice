const accountSid = 'AC8cefd6e4b161832706eb75b4df592a91';
const authToken = '0d5b7bb0c5f33d1430187c60ca5fcb44';
const client = require('twilio')(accountSid, authToken);
client.messages
    .create({
        to: '+18777804236'
    })
    .then(message => console.log(message.sid));