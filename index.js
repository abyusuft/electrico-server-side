const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
// app.use(cors());
app.use(cors());
app.use(express.json());





// Database Connection 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kqnws.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

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
        app.get('/user/:email', verifyJWT, async (req, res) => {
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
            const insert = await productsCollection.find(product).toArray();
            res.send(insert);
        })

        app.delete('/product/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.findOne(query);
            res.send(result);
        })
        // update qty after purchase 
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const stock = req.body;
            const newStock = stock.newStockQty;
            const option = { upsert: true };
            const doc = {
                $set: { stock: newStock },
            }
            const result = await productsCollection.updateOne(filter, doc, option);
            res.send(result);
        })
        //Purchase database collection and API
        const purchaseCollection = client.db("electrico").collection("purchase");
        app.post('/purchase', verifyJWT, async (req, res) => {
            const product = req.body;
            const insert = await purchaseCollection.insertOne(product);
            res.send(insert);
        })
        // get all orders 
        app.get('/orders', async (req, res) => {
            const query = {};
            const orders = await purchaseCollection.find(query).toArray();
            res.send(orders);
        })
        // delete order 
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await purchaseCollection.deleteOne(query);
            res.send(result);
        })
        // get My Orders 
        app.get('/order/:email', async (req, res) => {
            const email = req.params.email;
            const query = { purchaseBy: email };
            const myOrders = await purchaseCollection.find(query).toArray();
            res.send(myOrders);
        })

        // get single order detail
        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await purchaseCollection.findOne({ _id: ObjectId(id) });
            res.send(result);
        })

        //Review database collection and API
        const reviewCollection = client.db("electrico").collection("review");
        // Post Review API 
        app.post('/review', verifyJWT, async (req, res) => {
            const review = req.body;
            const insert = await reviewCollection.insertOne(review);
            res.send(insert);
        })
        // Get Review API 
        app.get('/review', async (req, res) => {
            const review = {};
            const result = await reviewCollection.find(review).toArray();
            res.send(result);
        })



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