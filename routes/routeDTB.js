const express = require("express");
const routeExpDTB = express.Router({strict:true});
const Controller = require("../ControllerDTB/DTBControllerLeaveRequest")
const ControllerSalaryAdvance = require("../ControllerUser/DTBControllerSalaryAdvance")
const ControllerNews = require("../ControllerUser/DTBControllerNews")
const ControllerAuthentification = require("../ControllerDTB/DTBAuthentification");
const ControllerScheduled = require("../ControllerDTB/DTBScheduledTasks");
const ControllerClockingUser = require("../ControllerUser/DTBClockingUser")
const ControllerStaticAdmin = require("../ControllerAdmin/DTBStaticAdminPage")
const ControllerMember = require("../ControllerAdmin/DTBMemberList")
const ControllerClockingAdmin = require("../ControllerAdmin/DTBClockingAdmin")
const ControllerCheckPaie = require("../ControllerAdmin/DTBCheckPaie")
const ControllerLateValidation = require("../ControllerDTB/DTBLateValidation")
const ControllerLeaveCRUD = require("../ControllerAdmin/DTBLeaveListAndCRUD")
const ControllerClockingTL = require("../ControllerTL/DTBClockingTL")
const ControllerRequestSalary = require("../ControllerAdmin/DTBRequestSalary")
const API = require("../ControllerDTB/api/leave-request")
const API_Avance = require("../ControllerDTB/api/avance-salaire")
const API_Solde = require("../ControllerDTB/api/solde")
const ControllerAvance = require("../ControllerDTB/DTBControllerAvance")

//Authentification route
// Default route
routeExpDTB.route("/").get(ControllerAuthentification.defaultPage);//pass
//Render page according to the User authorized
routeExpDTB.route("/login").post(ControllerAuthentification.authSolumada);//pass
// Root to get ip
routeExpDTB.route("/getip").post(ControllerAuthentification.setIp);//pass
// root for changing interface
routeExpDTB.route("/change_interface").post(ControllerAuthentification.switchInterface);//pass
// Route for not authorised
routeExpDTB.route("/not").get(ControllerAuthentification.notAuthorized);//pass
// Root for page change password
routeExpDTB.route("/changepassword").get(ControllerAuthentification.changePassword);//pass
// Route for checking mail
routeExpDTB.route("/checkmail").post(ControllerAuthentification.checkEmail);//pass
// Route for check code
routeExpDTB.route("/checkcode").post(ControllerAuthentification.checkCode);//pass
// Route for update password
routeExpDTB.route("/changepass").post(ControllerAuthentification.changePass);//pass

//Clocking user
// Default route
routeExpDTB.route("/employee").get(ControllerClockingUser.pageEmployee);//pass
// Rout for startwork
routeExpDTB.route("/startwork").post(ControllerClockingUser.startWork);//pass
// Rout for startwork
routeExpDTB.route("/changing").post(ControllerClockingUser.changingHour);//pass
// Default route
routeExpDTB.route("/statuschange").post(ControllerClockingUser.statusChange);//pass
// Default route
routeExpDTB.route("/notify").post(ControllerClockingUser.notifyExceed);//pass
// Default route
routeExpDTB.route("/handlework").post(ControllerClockingUser.handleWork);//pass
// Default route
routeExpDTB.route("/leftwork").post(ControllerClockingUser.leftWork);//pass
// Default route
routeExpDTB.route("/activity").post(ControllerClockingUser.inactivity);//pass
// Default route
routeExpDTB.route("/absent").post(ControllerClockingUser.setAbsence);//pass
// Default route
routeExpDTB.route("/forget").post(ControllerClockingUser.updateTimeForget);//pass
// Default route
routeExpDTB.route("/reason").post(ControllerClockingUser.delayDetected);//pass
// Default route
routeExpDTB.route("/gethour").post(ControllerClockingUser.getHour);//pass
// Default route
routeExpDTB.route("/change_entry").post(ControllerClockingUser.setEntry);//pass


// API
routeExpDTB.route('/api/leave-requests').get(API.getLeaves);
// avance API
routeExpDTB.route('/api/avance').post(API_Avance.createAvance);
routeExpDTB.route('/api/avance/all/:urgent?').get(API_Avance.getAllDemand)
routeExpDTB.route('/api/avance/request').get(API_Avance.getAllDemand)
routeExpDTB.route('/api/avance/demande/:id?').get(API_Avance.getOneDemande)
routeExpDTB.route('/api/avance/paid').get(API_Avance.getPaidDemands)
routeExpDTB.route('/api/avance/check_access').get(API_Avance.checkUrgenceAccess)
routeExpDTB.route('/exportExcel').get(API_Avance.exportFile)
routeExpDTB.route('/api/avance/addperiod').post(API_Avance.addPeriodDates)
routeExpDTB.route('/api/avance/giveaccess').post(API_Avance.giveAccess)
routeExpDTB.route('/api/avance/verify-code').post(API_Avance.checkAvanceCode)
routeExpDTB.route('/api/avance/getperiod/:month').get(API_Avance.getPeriodInMonth)
routeExpDTB.route('/api/avance/reject/:id').post(API_Avance.refuseRequest)
routeExpDTB.route('/api/avance/delete/:id?').delete(API_Avance.deleteAvance)
routeExpDTB.route('/api/avance/validate').post(API_Avance.validateAvance)
routeExpDTB.route('/api/avance/employe-confirm/:id').post(API_Avance.employeeConfirmRequest)
routeExpDTB.route('/api/avance/complete/:id').post(API_Avance.completeRequest)
routeExpDTB.route('/api/avance/:id?').get(API_Avance.getListByUserId).put(API_Avance.updateAvance);
routeExpDTB.route('/api/solde/:id?').put(API_Solde.updateSolde)
routeExpDTB.route('/api/avance/verification/:id?').get(API_Avance.verificationDemand)
routeExpDTB.route('/api/avance/payer/:id?').get(API_Avance.payerAvance)
routeExpDTB.route('/api/avance/updateAllCongeAnnee').post(API_Avance.updateAllCongeAnnee)
routeExpDTB.route("/api/avance/updateCode").post(ControllerMember.updateCode)
routeExpDTB.route('/avance/verification/:id?').get(ControllerAvance.getVerificationPage)
//administrator avance
routeExpDTB.route('/advancesalarylist').get(ControllerRequestSalary.getListSalaryAdvance)
routeExpDTB.route('/requestsalary').get(ControllerRequestSalary.requestSalaryAdvance)
routeExpDTB.route('/acces-avanceurgent').get(ControllerRequestSalary.getAccesUrgentSalary)

// Space Home for Employee
routeExpDTB.route("/mySpace").get(Controller.getHomePage);
// Leave Request 
routeExpDTB.route("/RequestLeave").get(Controller.getLeaveRequest);
// Leave Request 
routeExpDTB.route("/makeRequest").post(Controller.makeLeaveRequest);
//Attached file
routeExpDTB.route("/joinFileLeave").post(Controller.attachedFile);
routeExpDTB.route("/joinFileLeaveAnother").post(Controller.attachedFileAnother);
routeExpDTB.route("/deleteFileLeave").post(Controller.deleteFile)
//Get all request
routeExpDTB.route("/MyRequest").post(Controller.getMyRequest);
//See pending request
routeExpDTB.route("/leavePending").get(Controller.seePending);
//See procedeed requests
routeExpDTB.route("/leaveTreated").get(Controller.seeTreatedLeave);
//filter leave requests by date and month
routeExpDTB.route("/filterLeaveRequest").get(Controller.getLeaveRequestFiltered);
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
// Get leave by id
routeExpDTB.route("/RequestLeave/:id").get(Controller.getLeaveRequestById);
// Update Leave
routeExpDTB.route("/UpdateRequestLeave/:id").put(Controller.updateLeaveRequest);
// Cancel Leave
routeExpDTB.route("/CancelRequestLeave/:id").post(Controller.cancelLeaveRequest);
// SUIVI Leave
routeExpDTB.route("/suivi-conge").get(Controller.leaveTracking);


//Salary Advance
routeExpDTB.route("/SalaryAdvance").get(ControllerSalaryAdvance.getSalaryAdvance);
//Solumada News
routeExpDTB.route("/News").get(ControllerNews.getPageNews);


//Administrator Route
// Route for home page
routeExpDTB.route("/home").get(ControllerStaticAdmin.getDashboardPage);//pass
// Route for status page
routeExpDTB.route("/management").get(ControllerStaticAdmin.getPageStatusUser);//pass
// Route for absence list 
routeExpDTB.route("/absencelist").get(ControllerStaticAdmin.getPageAbsenceList);//pass
// Route for getting absence list 
routeExpDTB.route("/absences").post(ControllerStaticAdmin.getAbsenceList);//pass
//Admin user list 
// Route for get page User list
routeExpDTB.route("/userlist").get(ControllerMember.getPageUserList);//pass
// Route for getting all member
routeExpDTB.route("/list_employee").post(ControllerMember.allMember);//pass
// Route for adding member
routeExpDTB.route("/addemp").post(ControllerMember.addMember);//pass
// Route for getUser info
routeExpDTB.route("/getuser").post(ControllerMember.getUser);//pass
// Route for updating user
routeExpDTB.route("/updateuser").post(ControllerMember.updateUser);//pass
// Route for deleting user
routeExpDTB.route("/dropuser").post(ControllerMember.deleteUser);//pass
// Route for reactivate user
routeExpDTB.route("/reactivate").post(ControllerMember.reactivateUser);//pass
// Route for update profil
routeExpDTB.route("/profil").post(ControllerMember.changeProfil);//pass
//Admin pointage
//Route page pointage
routeExpDTB.route("/details").get(ControllerClockingAdmin.getPageClocking);//pass
//Route page pointage
routeExpDTB.route("/filter").post(ControllerClockingAdmin.filterData);//pass
//Route page pointage
routeExpDTB.route("/generate").post(ControllerClockingAdmin.generateExcel);//pass
//Admin paie
// Route for page check paie
routeExpDTB.route("/fiche").get(ControllerCheckPaie.getPagePaie);//pass
// Route for uploading file
routeExpDTB.route("/paie").post(ControllerCheckPaie.uploadPaie);//pass
// Route for empty file
routeExpDTB.route("/empty").get(ControllerCheckPaie.emptyPaie);//pass
//Admin validation late
// Get late validation
routeExpDTB.route("/validelate").get(ControllerLateValidation.getLateValidationAdmin);//pass
// Get all delay
routeExpDTB.route("/lates").post(ControllerLateValidation.allDelays);//pass
// Confirm delay
routeExpDTB.route("/validate").post(ControllerLateValidation.confirmDelay);//pass
// Confirm multiple
routeExpDTB.route("/valide_all").post(ControllerLateValidation.confirmMultiple);//pass
// Exception delay
routeExpDTB.route("/exception").post(ControllerLateValidation.exceptionDelay);//pass
// Exception Multiple
routeExpDTB.route("/exception_all").post(ControllerLateValidation.exceptionMultiple);//pass
// denied delay
routeExpDTB.route("/denied").post(ControllerLateValidation.abortDelay);//pass
// denied multiple
routeExpDTB.route("/denied_all").post(ControllerLateValidation.abortMultiple);//pass
//Admin leavelist 
// Get late validation
routeExpDTB.route("/leavelist").get(ControllerLeaveCRUD.getPageLeavelist);//pass
// Get all_leave
routeExpDTB.route("/list_leave").post(ControllerLeaveCRUD.retrieveLeaveList);//pass
// Retrieve report
routeExpDTB.route("/leave_report").post(ControllerLeaveCRUD.LeaveReport);//pass
// Download file
routeExpDTB.route("/download").get(ControllerLeaveCRUD.downloadFile);//pass
//Admin create leave
// Get page create leave
routeExpDTB.route("/leaves").get(ControllerLeaveCRUD.getPageDefine);//pass
// Create leave
routeExpDTB.route("/takeleave").post(ControllerLeaveCRUD.createLeave);//pass
// edit leave
routeExpDTB.route("/editleave").post(ControllerLeaveCRUD.editLeave);//pass
//Abort leave
routeExpDTB.route("/delete_leave").post(ControllerLeaveCRUD.abortLeave);//pass
//Leave info
routeExpDTB.route("/getuser_leave").post(ControllerLeaveCRUD.leaveInfo);//pass
// print leave
routeExpDTB.route("/print_leave/:id").post(ControllerLeaveCRUD.printLeave);//pass


//Opération
routeExpDTB.route("/conge").get(ControllerLeaveCRUD.getLeaveOperation);//pass

// Finance Page

routeExpDTB.route("/finance").get(ControllerStaticAdmin.getPageFinance)
routeExpDTB.route("/financeList").get(ControllerStaticAdmin.getListAvanceFinance)
//TL Page
//Get status TL
routeExpDTB.route("/managementtl").get(ControllerStaticAdmin.getPageTl);//pass
//Get page Recap
routeExpDTB.route("/leaverecap").get(ControllerLeaveCRUD.getPageRecap);//pass
// Get page clocking TL
routeExpDTB.route("/pointagetl").get(ControllerClockingTL.getPageClockingTL);//pass
// Get page generate TL
routeExpDTB.route("/generatetl").post(ControllerClockingTL.generateClockingTL);//pass
// Get page all user
routeExpDTB.route("/all_userstl").post(ControllerClockingTL.allUserForTL);//pass
//GEt page absence TL
routeExpDTB.route("/absencetl").get(ControllerStaticAdmin.pageAbsenceTL);//pass
// Validation TL
routeExpDTB.route("/validelatetl").get(ControllerLateValidation.getlateValidationTL);//pass

//AUTOMATIC TASKS (to notify ROP or RH if desicion has not been taken yet)
routeExpDTB.route("/scheduled-leaves-requests-checker").get(ControllerScheduled.checkNotTakenLeavesRequests);//pass
routeExpDTB.route("/scheduled-automatic-requests-confirmation").get(ControllerScheduled.automaticRequestConfirmation);//pass

routeExpDTB.route("/getDemandeGerant").get(API.getListGerantDemandC)



//Logout
routeExpDTB.route("/exit_u").get(ControllerAuthentification.logOut);
//Logout
routeExpDTB.route("/exit_a").get(ControllerAuthentification.logOut);

module.exports = routeExpDTB;