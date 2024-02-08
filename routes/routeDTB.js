const express = require("express");
const routeExpDTB = express.Router();
const Controller = require("../ControllerDTB/DTBControllerLeaveRequest")
const ControllerSalaryAdvance = require("../ControllerDTB/DTBControllerSalaryAdvance")
const ControllerNews = require("../ControllerDTB/DTBControllerNews")

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
//getNotifications
routeExpDTB.route("/getNotifications").post(Controller.getNotifications);
// Remove notification
routeExpDTB.route("/remove-notification/:id").delete(Controller.removeNotification);
// Remove all notifications
routeExpDTB.route("/removeall-notification").delete(Controller.removeAllNotification);
// Mark as read notification
routeExpDTB.route("/markAsRead-notification/:id").put(Controller.markAsReadNotification);
// Mark as read all notifications
routeExpDTB.route("/markAsReadAll-notification").put(Controller.markAsReadAllNotification);


//Salary Advance
routeExpDTB.route("/SalaryAdvance").get(ControllerSalaryAdvance.getSalaryAdvance);
//Solumada News
routeExpDTB.route("/News").get(ControllerNews.getPageNews);

module.exports = routeExpDTB;