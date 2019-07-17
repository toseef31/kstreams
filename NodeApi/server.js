const express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    mongoose = require('mongoose'),
    config = require('./config/DB');

const registrationRoute = require('./routes/registration.routes');
const groupsRoute = require('./routes/groups.routes');
 
var fs = require('fs'); 
var https = require('https');
var privateKey  = fs.readFileSync('keys/ssl.key', 'utf8');
var certificate = fs.readFileSync('keys/ssl.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

mongoose.Promise = global.Promise;
mongoose.connect(config.url, { useNewUrlParser: true }).then(
    () => { console.log('Database is connected') },
    err => { console.log('Cannot connect to the database' + err) }
);

const app = express();
app.use(express.static('assets'))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cors());
app.use('/business', registrationRoute);
app.use('/groups', groupsRoute);

// const port = process.env.PORT || 4000;
// app.listen(port, function () {
//     console.log('Listening on port ' + port);
// });

const port = process.env.PORT || 4000;

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, function () {
    console.log(' https Listening on port ' + port);
});