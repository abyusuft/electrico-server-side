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

        // Generate Token on UserLogin and send user to database
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const option = { upsert: true };
            const doc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(filter, doc, option);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '6h' });
            res.send({ result, token });
        })

        // get user from database
        app.get('/users', async (req, res) => {
            const query = {};
            const cursor = usersCollection.find(query);
            const user = await cursor.toArray();
            res.send(user);
        });
        // Get single user profile data 
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const cursor = await usersCollection.findOne({ email: email });
            res.send(cursor);
        });

        // admin verification for admin action
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAcc = await usersCollection.findOne({ email: requester });
            if (requesterAcc.role === 'admin') {
                next();
            }
            else {
                return res.status(403).send({ message: "Forbidden" });
            }
        }
        app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const doc = {
                $set: { role: 'admin' },
            }
            const result = await usersCollection.updateOne(filter, doc);
            res.send(result);
        })


        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })


        //Product database collection and API
        const productsCollection = client.db("electrico").collection("products");
        app.post('/product', async (req, res) => {
            const product = req.body;
            const insert = await productsCollection.insertOne(product);
            res.send(insert);
        })
        // Get all product for Manage Product page 
        app.get('/product', async (req, res) => {
            const product = {}
            const insert = await productsCollection.insertOne(product).toArray();
            res.send(insert);
        })


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