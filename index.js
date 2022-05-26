const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
var jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());





// Database Connection 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kqnws.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect();

        //Database Collections 
        const productsCollection = client.db("electrico").collection("products");
        const reviewCollection = client.db("electrico").collection("review");
        const purchaseCollection = client.db("electrico").collection("purchase");

    }
    finally {

    }

}

run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Welcome to Electrico')
})


app.listen(port, () => {
    console.log(`Listening to Port : ${port}`)
})