const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 8080;

const corsOptions = {
  origin: '*',
  optionSuccessStatus: 200
};

app.use(cors(corsOptions));

// Optionally serve static files from the root directory
app.use(express.static(__dirname));

// Home route: send the index.html file from the root directory
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// If you have another HTML file, for example product.html, you can add a route for it
app.get('/product.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'product.html'));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
