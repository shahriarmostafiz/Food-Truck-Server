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

// custom middlware
const verifyToken = async (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ access: "unauthorized" });
  } else {
    jwt.verify(token, SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({ access: "unauthorized" });
      }
      req.user = decoded;
      next();
    });
  }
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
const userCollection = client.db("Food-Truck").collection("allUsers");

async function run() {
  try {
    // auth apis
    app.post("/api/v1/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, SECRET, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: false,
        })
        .send({ success: true });
    });
    app.post("/api/v1/users", async (req, res) => {
      const user = req.body;
      console.log(user);
    });
    app.post("/api/v1/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out this user", user);
      res.clearCookie("token", { maxAge: 0 }).send({ logout: true });
    });

    // food apis
    app.get("/api/v1/allfoods", async (req, res) => {
      const sortObj = {};
      const queryObj = {};
      const search = req.query.search;
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;
      const page = parseInt(req.query.page);
      const limit = Number(req.query.limit);
      if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder;
      }
      if (search) {
        queryObj.food_name = search;
      }

      const cursor = foodCollection
        .find(queryObj)
        .skip(page * limit)
        .limit(limit)
        .sort(sortObj);
      const result = await cursor.toArray();
      res.send(result);
    });

    // food count api
    app.get("/api/v1/allfoodcount", async (req, res) => {
      const count = await foodCollection.estimatedDocumentCount();
      console.log(count);
      res.send({ count: count });
    });
    // get single food api
    app.get("/api/v1/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    // update food database
    app.post("/api/v1/foods/food/:id", async (req, res) => {
      const id = req.params.id;
    });

    app.post("/api/v1/order/:id", async (req, res) => {
      const id = req.params.id;
      const order = req.body;
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
