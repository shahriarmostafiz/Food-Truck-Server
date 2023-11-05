const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;

const admin = process.env.ADMIN;
const adminKey = process.env.PASSWORD;
const SECRET = process.env.ACCESS;
// console.log("admin", admin);
// console.log("adminKey", adminKey);
// console.log("SECRET", SECRET);

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${admin}:${adminKey}@cluster1.rubdhat.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const foodCollection = client.db("Food-Truck").collection("allfoods");

async function run() {
  try {
    // auth apis
    app.post("/api/v1/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, SECRET, { expiresIn: "1h" });
      res.send(token);
    });

    // food apis
    app.get("/api/v1/allfoods", async (req, res) => {
      const sortObj = {};

      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;
      const limit = Number(req.query.limit);
      if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder;
      }
      const cursor = foodCollection.find().limit(limit).sort(sortObj);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello Food Truck");
});
app.listen(port, () => {
  console.log(`Serving food truck on port ${port}`);
});
