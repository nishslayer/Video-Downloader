require('dotenv').config();
const express = require('express');
const routes = require('./config/routes');
var cors = require('cors')
var bodyParser = require('body-parser')
const path = require('path');
var multer = require('multer');
var upload = multer();
var fs = require('fs');

var app = express();
app.use(cors());

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(bodyParser.json());

// app.use(upload.array()); 
app.use(express.static('public'));

app.use('/',routes);

app.listen(8085);