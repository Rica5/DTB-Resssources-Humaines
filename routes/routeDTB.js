const express = require("express");
const routeExpDTB = express.Router();

// Space Home for Employee
routeExpDTB.route("/mySpace").get(async function (req, res) {
    res.render("PageEmployee/MySpace.html");
});
// Leave Request 
routeExpDTB.route("/RequestLeave").get(async function (req, res) {
    res.render("PageEmployee/LeaveRequest.html");
});

module.exports = routeExpDTB;