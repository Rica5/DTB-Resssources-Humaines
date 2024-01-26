const express = require("express");
const routeExpDTB = express.Router();
const Controller = require("../ControllerDTB/DTBController")

// Space Home for Employee
routeExpDTB.route("/mySpace").get(Controller.getHomePage);
// Leave Request 
routeExpDTB.route("/RequestLeave").get(Controller.getLeaveRequest);
// Leave Request 
routeExpDTB.route("/makeRequest").post(Controller.makeLeaveRequest);

module.exports = routeExpDTB;