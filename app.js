const fs = require('fs');
if (fs.existsSync('.env')) {
  require('dotenv').config();
}

const express = require('express');
const app = express();

const path = require('path');

const index = require('./routes/index');
const hash = require('./routes/hash');
const processVideo = require('./routes/process');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Server running on port ' + port);
});

app.use('/', index);
app.use('/hash', hash);
app.use('/process', processVideo);
app.use('*', function(req, res) {
  res.redirect('/');
});

module.exports = app;
