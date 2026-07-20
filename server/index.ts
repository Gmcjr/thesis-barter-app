const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join('client', 'dist')));
app.use(express.json());

app.listen(port, () => {
  console.info(`
    App listening on:
    - http://localhost:3000
    - http://127.0.0.1:3000
    `);
});
