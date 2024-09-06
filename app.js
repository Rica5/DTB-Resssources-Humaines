const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const routeDTB = require("./routes/routeDTB.js");
const PORT = process.env.PORT || 8080;
const methodOverride = require("method-override");
const expsession = require("cookie-session");
const fileUpload = require("express-fileupload");
const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();
// Connect to MongoDB using Mongoose
mongoose.connect(process.env.DB_URI, {});

// Handle MongoDB connection events
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  // BE CAREFULL, NEVER CALL THIS SH*T
  // cloneCollectionData('cusers', 'newcusertests')
  //   .then(() => console.log('Cloning completed'))
  //   .catch((err) => console.error('Cloning failed', err));
  
});

// Function to clone data from one collection to another using native MongoDB methods
async function cloneCollectionData(sourceCollectionName, targetCollectionName) {
  try {
    return 'If you are sure, delete this line';
    // Access the collections dynamically
    const sourceCollection = mongoose.connection.db.collection(sourceCollectionName); // Use .db to access native methods
    const targetCollection = mongoose.connection.db.collection(targetCollectionName);

    // Fetch all documents from the source collection using MongoDB cursor
    const dataToClone = await sourceCollection.find({}).toArray();

    if (dataToClone.length === 0) {
      console.log('No data found in the source collection');
      return;
    }

    // Clean (delete all documents) in the target collection
    await targetCollection.deleteMany({});
    console.log(`Cleared all documents from ${targetCollectionName}`);

    // Insert the data into the target collection
    await targetCollection.insertMany(dataToClone);

    console.log(`Successfully cloned ${dataToClone.length} documents from ${sourceCollectionName} to ${targetCollectionName}`);
  } catch (error) {
    console.error('Error cloning collection data:', error);
  }
}

app.use(methodOverride("X-HTTP-Method"));
app.use(methodOverride("X-HTTP-Method-Override"));
app.use(methodOverride("X-Method-Override"));
app.use(methodOverride("_method"));
app.use(
  expsession({
    name: "session",
    keys: ["2C44-4D44-WppQ38S"],
    resave: true,
    saveUninitialized: true,
    overwrite: true,
    // Cookie Options
    maxAge: 12 * 60 * 60 * 1000, // 15 hours
  })
);

// Fichier static a utiliser
app.use(express.static("public"));
app.use(express.static("node_modules"));
app.use(express.static("public/assets"));
app.use(express.static("public/Paie"));
app.use(express.static("public/dist"));
app.use(express.static("public/src"));

// View de type html
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.set("views", __dirname + "/public");

//app.use(express.static(__dirname + "/public"));

app.use(cors());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = require("http").createServer(app);
const io = require("socket.io")(server);
io.on("connection", (socket) => {
  socket.on("actuel", (msg) => {
    socket.broadcast.emit("status", msg);
  });
  socket.on("loc", (lc) => {
    socket.broadcast.emit("locaux", lc);
  });
});
app.set("io", io);
//app.use("/", route);
app.use("/", routeDTB);


// méthode pour ne pas autoriser les appareils mobiles
const mobileAccessMiddleware = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  if (isMobile) {
    return res.status(403).send('<br><h1>Oupss! Les appareils mobiles ne sont pas autorisés.</h1>');
  }
  next();
};

// Use the mobile access middleware
app.use(mobileAccessMiddleware);
server.listen(PORT, () => {
  const port = server.address().port;
  console.log(`Express is working on port ${port}`);

  // scheduled requests
  // var task = cron.schedule('*/15 * * * *', () =>  {
  //   try {
  //     // send request for auto confirmation
  //     axios(`${process.env.APP_URL}:${PORT}/scheduled-automatic-requests-confirmation`)
  //     .then(() => {
  //       console.log("Auto sent!")
  //     });
  //     // send request for leave pending
  //     axios(`${process.env.APP_URL}:${PORT}/scheduled-leaves-requests-checker`)
  //     .then(() => {
  //       console.log("Checker sent!")
  //     });

  //   } catch (error) {
  //     console.log(error)
  //   }
  // });
  // task.start()
});

module.exports = app;