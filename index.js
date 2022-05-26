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

function verifyJWT(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authorization.split(' ')[1];
    console.log(token);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();

        //User database collection and API
        const usersCollection = client.db("electrico").collection("users");

        // Generate Token on UserLogin 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const option = { upsert: true };
            const doc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(filter, doc, option);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ result, token });
        })




        //Product database collection and API
        const productsCollection = client.db("electrico").collection("products");


        //Review database collection and API
        const reviewCollection = client.db("electrico").collection("review");


        //Purchase database collection and API
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