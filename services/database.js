// Load secret information (like passwords) from a hidden file
require("dotenv").config();

// Import the tool that lets us talk to MySQL databases
const mysql = require("mysql2");

// Create a connection to our MySQL database with our login details
const config = mysql.createConnection({
    host: "atp.fhstp.ac.at",              // Where our database lives (school server)
    port: 8007,                           // Which door to use to connect
    user: process.env.DB_USERNAME,       // Our database username (kept secret)
    password: process.env.DB_PASSWORD,   // Our database password (kept secret)
    database: process.env.DB_USERNAME,   // Which database to use (same as username)
});

// Try to connect to the database
config.connect(function(err) {
    if (err) throw err;                   // If connection fails, stop and show error
    console.log("Connected!");            // If successful, tell us we're connected
});

// Share this database connection with other parts of our app
module.exports = {config};
/*module.exports = config;*/
