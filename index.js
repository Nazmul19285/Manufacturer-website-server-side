const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const res = require('express/lib/response');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mepvj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const productsCollection = client.db("pedaler").collection("products");
    const ordersCollection = client.db("pedaler").collection("orders");
    const reviewsCollection = client.db("pedaler").collection("reviews");
    const usersCollection = client.db("pedaler").collection("users");

    // payment
    app.post('/create-payment-intent', async (req, res) => {
      const order = req.body;
      const price = order.price;
      const amount = price*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})
    });

    // create user
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = {email: email};
      const options = { upsert: true};
      const updatedDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    });

    // get an user with email
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    })

    // update an user with email
    app.patch('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const updatedDoc = {
        $set: user
      };
      const updatedUser = await usersCollection.updateOne(query, updatedDoc);
      res.send(updatedUser);
    });

    // get all products
    app.get('/products', async (req, res) => {
      const query = {};
      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    // get all orders
    app.get('/orders', async (req, res) => {
      const query = {};
      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    // get all reviews
    app.get('/reviews', async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // get all users
    app.get('/users', async (req, res) => {
      const query = {};
      const cursor = usersCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });

    // get a product with id
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productsCollection.findOne(query);
      res.send(product);
    });

    // place an order
    app.post('/orders', async (req, res) => {
      const newOrder = req.body;
      const result = await ordersCollection.insertOne(newOrder);
      res.send(result);
    });

    // add a product
    app.post('/products', async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    // place a review
    app.post('/reviews', async (req, res) => {
      const newReview = req.body;
      const result = await reviewsCollection.insertOne(newReview);
      res.send(result);
    });

    // get a user's orders
    app.get('/userorders', async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    });

    // get products by category
    app.get('/category', async (req, res) => {
      const category = req.query.category;
      const query = { category: category };
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    // Delete an order
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    });

    // Delete a product
    app.delete('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // get an order with id
    app.get('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      res.send(order);
    });

    // update an order with id
    app.patch('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const paymentInfo = req.body;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: paymentInfo,
      };
      const updatedOrder = await ordersCollection.updateOne(query, updatedDoc);
      res.send(updatedOrder);
    });

    // update an product with id
    app.patch('/products/:id', async (req, res) => {
      const id = req.params.id;
      const product = req.body;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: product
      };
      const updatedProduct = await productsCollection.updateOne(query, updatedDoc);
      res.send(updatedProduct);
    });

  }
  finally {

  }

}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from pedaler')
})

app.listen(port, () => {
  console.log(`Pedaler app listening on port ${port}`)
})