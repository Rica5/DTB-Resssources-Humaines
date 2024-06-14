const ModelLeaveRequest = require("../models/ModelLeaveRequest");
const ModelMember = require("../models/ModelMember");
const Methods = require("../ControllerDTB/GlobalMethods")
const moment = require('moment');

const Expiration = 48; // hours


// Method to notify RH and ROP when some requests had not been processed yet.
async function checkNotTakenLeavesRequests(req, res) {
    try {
        
        // select leaves not taken yet from db
        const leavesRequests = await ModelLeaveRequest.find(
            { status: { $in: ["pending", "progress"]}
        })
        .populate('validation.user')
        .sort({
            leavePriority: 'asc',
            date_start: 'asc'
        });

        // make sure we finish looping through the records
        await Promise.all([
            leavesRequests.map(async (request) => {

                // date 48 hours, expiration date, 
                let dueDate = moment(request.datetime, "DD/MM/YYYY HH:mm:ss")
                .add(Expiration, 'hours')
                .locale('fr')
                .calendar()
                .toLowerCase();

                // Create notification
                const notification = {
                    title: `<span style="color: red;">Congé en attente<span>`,
                    content: `La demande de congé de ${request.m_code} n'a pas encore été prise en compte. Veuillez prendre votre décision avant ${dueDate}. <br>
                        <b>Date de congé:</b> ${moment(request.date_start).format("DD/MM/YYYY")} au ${moment(request.date_end).format("DD/MM/YYYY")}.`,
                    datetime: moment().format("DD/MM/YYYY hh:mm:ss")
                }

                // send to ROP when validation is 1
                // when validation length is 1, it means that only the TL saw the Request
                if (request.validation.length <= 1) {
                    // "Send notification to ROP"
                    if (request.validation.length === 0) notification.content += '<br>Pour validation par les Team Leaders.'
                    /* push notification... */
                    var concerned = ["Opération", "Surveillant"];
                    await Methods.setGlobalAdminNotifications(notification, concerned, true, req);
                }

                // send to TL when validation is 2
                // when validation length is >= 2, it means that only the TL and ROP saw and accepted the Request
                else if (request.validation.length >= 2) {
                    // "Send notification to RH"
                    /* push notification... */
                    var concerned = ["Admin"];
                    await Methods.setGlobalAdminNotifications(notification, concerned, true, req);
                }
            })
        ]);

        res.json({
            ok: true,
            data: leavesRequests
        });

    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            message: 'Server error'
        });
    } 
}



// Method to do automatic request confirmation
async function automaticRequestConfirmation(req, res) {
    try {

        // check all leave that had been confirmed yet
        const leavesRequests = await ModelLeaveRequest.find(
            { status: { $in: ["progress", "pending"]}
        })
        .populate('validation.user')
        .sort({
            leavePriority: 'asc',
            date_start: 'asc'
        });

        const ConfirmedRequests = [];
        // make sure we finish looping through the records
        await Promise.all([
            leavesRequests.map(async (request) => {

                // leave request creation date
                const creationDate = moment(request.datetime, "DD/MM/YYYY HH:mm:ss")
        
                // Get the current date and time
                const now = moment();
        
                // Subtract 48 hours from the current date and time
                const pastDate = now.subtract(Expiration, 'hours');
        
                // Compare the given date with the resulting date
                if (creationDate.isBefore(pastDate)) {
                    /* Do the confirmation here */
                    console.log('The given date is more than 48 hours in the past.');

                    // push request to be send in the resposnse
                    ConfirmedRequests.push(request);
                    // accept the request... (to croscheck with Ricardo)


                    // send notification for all...
                    const notification = {
                        title: `<span style="color:green;">Confirmation automatique de la demande de congé</span>`,
                        content: `Le congé de ${request.m_code} a été automatiquement confirmé car il n'a pas été traité dans les ${Expiration} heures imparties.`,
                        datetime: moment().format("DD/MM/YYYY hh:mm:ss")
                    }

                    // send notification to Admin, ROP, TL
                    var concerned = ["Admin", "Surveillant", "Opération"];
                    await Methods.setGlobalAdminNotifications(notification, concerned, true, req);


                    // send notification to the requester
                    let content = `Votre congé, dont les datee sont du ${moment(request.date_start).format("DD/MM/YYYY")} au ${moment(request.date_end).format("DD/MM/YYYY")}, a été automatiquement confirmé car il n'a pas été traité dans les ${Expiration} heures imparties.`;
                    let title = `<span style="color: green;">Congé accepté</span>`;
                    Methods.setEachUserNotification(request.m_code, title, content, req);

                } else {
                    console.log('The given date is within the last 48 hours.');
                }
                
            })
        ]);

        
        res.json({
            ok: true,
            data: ConfirmedRequests
        });

        
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            message: 'Server error'
        });
    }
}

module.exports = { checkNotTakenLeavesRequests, automaticRequestConfirmation }