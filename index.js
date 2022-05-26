const express = require('express');
const app = express();
require('dotenv').config();
var jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
















app.get('/', (req, res) => {
    res.send('Welcome to Electrico')
})


app.listen(port, () => {
    console.log(`Listening to Port : ${port}`)
})