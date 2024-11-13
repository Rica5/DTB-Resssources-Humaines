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
const leaveS = require('./models/ModelLeave.js')
const moment = require('moment');
const Status = require('./models/ModelClocking.js');
const ModelAvance = require("./models/ModelAvance.js");
require('dotenv').config();
// Connect to MongoDB using Mongoose
mongoose.connect(process.env.DB_URI, {});

// Handle MongoDB connection events
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  // var allconge = await leaveS.find()
  // allconge.forEach(conge => {
  //   if (conge.type == "Congé Payé ( rien à deduire )") {
  //     conge.conge_payer = conge.duration
  //   }else{
  //     conge.conge_payer = 0
  //   }
  //   console.log("conge", conge.type);
    
  //   conge.save()
  // });
  // console.log("fini");
  
  // BE CAREFULL, NEVER CALL THIS SH*T
  // cloneCollectionData('cusers', 'newcusertests')
  //   .then(() => console.log('Cloning completed'))
  //   .catch((err) => console.error('Cloning failed', err));

  // copyNonExistingRecords('cleavesolumadas', 'cleavetests');
  // generate4digitsCode()

  // copyAllCollections();
  // Call the function
  // findDuplicateRecords();
  const data = await ModelAvance.updateMany(
    { date_of_avance: new Date("2024-09-30T21:00:00.000+00:00") },
    { $set: { date_of_avance: new Date("2024-10-15T00:00:00.000+00:00") } }
  );
});

const findDuplicateRecords = async () => {
  try {
    const dateToFind = "2024-10-08";

    // Query to find records with the same `m_code`, `num_agent`, and `date`
    const records = await Status.aggregate([
      { $match: { date: dateToFind } },  // Match records with the given date
      {
        $group: {
          _id: { m_code: "$m_code", num_agent: "$num_agent", date: "$date" },  // Group by `m_code`, `num_agent`, and `date`
          count: { $sum: 1 },  // Count the occurrences
        }
      },
      { $match: { count: { $gt: 1 } } }  // Return only groups with more than 1 entry
    ]);

    console.log("Duplicate records found:", records.map(d => d._id.m_code));
    return records;
  } catch (err) {
    console.error(err);
  }
};


async function copyAllCollections() {

  const FREE_URI = "mongodb+srv://Rica:Ryane_1888@cluster0.z3s3n.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
  const PAID_URI = "mongodb+srv://dev-solumada:05lyBVqDgjleonPF@solumada.yqeyglv.mongodb.net/Timesheets?retryWrites=true&w=majority&appName=Solumada"

  try {
      // Step 1: Connect to the free MongoDB cluster
      const freeConnection = await mongoose.createConnection(FREE_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
      }).asPromise();
      console.log('Connected to the free MongoDB cluster.');

      // Step 2: Get all collections from the free cluster
      // const freeDb = freeConnection.useDb('Pointage'); // Pointage is the database name
      const freeDb = freeConnection.db; // Get the native MongoDB DB object
      const collections = await freeDb.listCollections().toArray();
      console.log(`Found ${collections.length} collections to copy.`);

      // Step 3: Connect to the paid MongoDB cluster
      const paidConnection = await mongoose.createConnection(PAID_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
      }).asPromise();
      console.log('Connected to the paid MongoDB cluster.');
      // const paidDb = paidConnection.useDb('Pointage');

      const paidDb = paidConnection.db; // Get the native MongoDB DB object

      // Step 4: Copy data from each collection
      for (let collection of collections) {
          const collectionName = collection.name;
          console.log(`Copying collection: ${collectionName}`);

          // Get the collection data from the free cluster
          const freeCollection = freeDb.collection(collectionName);
          const documents = await freeCollection.find({}).toArray();

          // Insert the data into the same collection in the paid cluster
          const paidCollection = paidDb.collection(collectionName);
          if (documents.length > 0) {
              await paidCollection.insertMany(documents);
              console.log(`Copied ${documents.length} documents to the collection: ${collectionName}`);
          } else {
              console.log(`No documents to copy for collection: ${collectionName}`);
          }
      }

      // Step 5: Close both connections
      await freeConnection.close();
      await paidConnection.close();
      console.log('All collections copied and connections closed.');

  } catch (err) {
      console.error('Error during data copy:', err);
  }
}





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

// Function to copy not existing documents to an another collection
async function copyNonExistingRecords(sourceCollectionName, destinationCollectionName) {
  try {

    const SourceCollection = mongoose.connection.db.collection(sourceCollectionName); // Use .db to access native methods
    const DestinationCollection = mongoose.connection.db.collection(destinationCollectionName);

    // Fetch all records from the source collection
    const sourceRecords = await SourceCollection.find({
      date_start: { 
        $regex: "^2024" // (2024 volana janvier ) 2023 fotsiny raha année iray 
      }
    }).toArray();


    for (const record of sourceRecords) {
      // Check if a document with the same date_start, date_end, and m_code exists in the destination collection
      const exists = await DestinationCollection.findOne({
        date_start: record.date_start,
        date_end: record.date_end,
        m_code: record.m_code,
      });

      if (!exists) {
        // Copy the record to the destination collection
        await DestinationCollection.insertOne(record);
        console.log(`Copied record with m_code: ${record.m_code}`);
      } else {
        console.log(`Record with m_code: ${record.m_code} already exists.`);
      }
    }

    console.log('Data copy completed!');
    // Close the connection
    // mongoose.connection.close();
  } catch (error) {
    console.error('Error copying records:', error);
  }
}

// generer des codes à 4 chiffres
async function generate4digitsCode() {
  const SourceCollection = mongoose.connection.db.collection('cusertests'); // Use .db to access native methods

  // Fetch all records from the source collection
  const sourceRecords = await SourceCollection.find({
    $or: [
      { digit_code: "0000" }, // Filter for '0000'
      { digit_code: { $exists: false } }, // Filter for empty (not set)
      { digit_code: "" } // Filter for empty string
    ]
  }).toArray();

  
  function generateUniqueCodes(numEmployees) {
    const uniqueCodes = new Set();
  
    while (uniqueCodes.size < numEmployees) {
      // Generate a random 4-digit number
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      
      // Add it to the set (duplicates will be ignored)
      uniqueCodes.add(randomCode.toString());
    }
  
    // Convert the set to an array and return it
    return Array.from(uniqueCodes);
  }
  
  // Generate unique 4-digit codes for 150 employees
  const employeeCodes = generateUniqueCodes(sourceRecords.length);
  // loop for codes
  sourceRecords.forEach(async (employee, i) => {
    employee.digit_code = employeeCodes[i];
    // Update the employee's digit_code using $set
    // return
    const updated = await SourceCollection.findOneAndUpdate(
      {
        _id: employee._id, // Query by employee ID
        $or: [
          { digit_code: "0000" }, // Filter for '0000'
          { digit_code: { $exists: false } }, // Filter for empty (not set)
          { digit_code: "" } // Filter for empty string
        ]
      },
      { $set: { digit_code: employeeCodes[i] } } // Update operation
    );
  })
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

// const UserSchema = require("./models/ModelMember");
// const ancienUser = require("./models/User");

// This function fetches data from UserAncien
(async () => {
  try {
    // const userAnc = await ancienUser.find();  // Correct usage
    // var userNew = await UserSchema.find()
    // for (let anc of userAnc) {
    //   // Trouver l'utilisateur correspondant dans userNew
    //   const newUser = userNew.find(u => u._id.equals(anc._id)); // Supposant que `_id` est l'identifiant commun
    //   console.log("loading...");
      
    //   if (newUser) {
    //     // Mettre à jour le status et user_ht de userNew
    //     await UserSchema.updateOne(
    //       { _id: newUser._id },
    //       { $set: { status: anc.status, entry: anc.entry, user_ht: anc.user_ht, act_loc: anc.act_loc, act_stat: anc.act_stat, late: anc.late } }
    //     );
    //   }
    // }
    console.log("fin");
  } catch (error) {
    console.error("Error fetching userAnc data:", error);
  }
})();

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