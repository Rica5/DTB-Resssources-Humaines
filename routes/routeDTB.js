const express = require("express");
const routeExpDTB = express.Router();
const Controller = require("../ControllerDTB/DTBController")

// Space Home for Employee
routeExpDTB.route("/mySpace").get(Controller.getHomePage);
// Leave Request 
routeExpDTB.route("/RequestLeave").get(Controller.getLeaveRequest);
// Leave Request 
routeExpDTB.route("/makeRequest").post(Controller.makeLeaveRequest);
//Get all request
routeExpDTB.route("/MyRequest").post(Controller.getMyRequest);
//See pending request
routeExpDTB.route("/leavePending").get(Controller.seePending);
//Get all request
routeExpDTB.route("/allRequest").post(Controller.getPending);
//Response Request
routeExpDTB.route("/requestAnswer").post(Controller.answerRequest);

module.exports = routeExpDTB;