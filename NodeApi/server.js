const express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    mongoose = require('mongoose'),
    config = require('./config/DB');

const registrationRoute = require('./routes/registration.routes');
const groupsRoute = require('./routes/groups.routes');

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

const port = process.env.PORT || 4000;

app.listen(port, function () {
    console.log('Listening on port ' + port);
});