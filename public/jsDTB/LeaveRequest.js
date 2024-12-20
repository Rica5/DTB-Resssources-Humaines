const leaveModeValue = {
    'congé': 'Congé',
    'régularisation': "Régularisation d'absence",
    'récupération': "Récupération"
}
var PendingAndDecline = [];
var Approves = [];
var allLeave = [];
var myRequestContent;
var myUpcomingContent;
var defaultHours = 0;
var leaveDuration = 0;
var leaveDurationTwo = 0;
var deduction = 0;
var joinedFile = [];
var fileIn = false;
$("#makeRequest").click(() => {
    $("#makeRequest").attr("class", "switch-button active-btn")
    $("#myRequest").attr("class", "switch-button mx-2")
    $("#myUpcoming").attr("class", "switch-button")
    $("#container-none").hide()
    $("#container-request").hide()
    $("#container-upcoming").hide()
    $("#container-make").show()
})

$("#myRequest").click(() => {
    $("#myRequest").attr("class", "switch-button active-btn mx-2")
    $("#makeRequest").attr("class", "switch-button")
    $("#myUpcoming").attr("class", "switch-button")
    $("#container-none").hide()
    $("#container-request").show()
    $("#container-upcoming").hide()
    $("#container-make").hide()
    if (PendingAndDecline.length == 0) {
        $("#container-none").show()
        $("#container-request").hide()
    }
})

$("#myUpcoming").click(() => {
    $("#makeRequest").attr("class", "switch-button")
    $("#myRequest").attr("class", "switch-button mx-2")
    $("#myUpcoming").attr("class", "switch-button active-btn")
    $("#container-none").hide()
    $("#container-request").hide()
    $("#container-upcoming").show()
    $("#container-make").hide()
    if (Approves.length == 0) {
        $("#container-none").show()
        $("#container-upcoming").hide()
    }
})

$("#sendRequest").on('click', () => {
    $("#sendRequest").prop("disabled", true);
    var code = $("#code").text();
    var startDate = $("#startDate").val();
    var endDate = $("#endDate").val();
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();
    var motif = $("#motif").val().split('\n').join(' ');
    var recovery = $("#recovery").val();
    var shift = $('#shift').val();
    var deductedDay = deduction;


    (!startDate) ? $("#startDate").css({ "border-color": "red" }) : $("#startDate").css({ "border-color": "" });
    (!endDate) ? $("#endDate").css({ "border-color": "red" }) : $("#endDate").css({ "border-color": "" });
    // (!startTime) ? $("#startTime").css({ "border-color": "red" }) : $("#startTime").css({ "border-color": "" });
    // (!endTime) ? $("#endTime").css({ "border-color": "red" }) : $("#endTime").css({ "border-color": "" });
    (!shift) ? $("#shift").css({ "border-color": "red" }) : $("#shift").css({ "border-color": "" });
    
    // variable remplaçant le "motif" ou "recovery"
    var reason;
    // si c'est un conge
    if (['congé', 'régularisation'].includes($('#request-type').val())) {
        (!motif) ? $("#motif").css({ "border-color": "red" }) : $("#motif").css({ "border-color": "" });
        $("#recovery").css({ "border-color": "" }) // remove border of recovery field
        reason = motif;
    }
    else {
        (!recovery) ? $("#recovery").css({ "border-color": "red" }) : $("#recovery").css({ "border-color": "" });
        $("#motif").css({ "border-color": "" }) // remove border of motif field
        reason = recovery;
    }

    const formData = new FormData();
    formData.append("join", joinedFile)
    formData.append("code", code)
    formData.append("startDate", startDate)
    formData.append("endDate", endDate)
    formData.append("shift", shift)
    formData.append("startTime", startTime)
    formData.append("endTime", endTime)
    formData.append("motif", motif)
    formData.append("recovery", recovery)
    formData.append("deductedDay", deductedDay)
    formData.append("duration", (leaveDuration + defaultHours + leaveDurationTwo - deduction))
    formData.append("priority", $("#toggle").is(':checked'));
    formData.append("leavePriority", +$("#priority").val());
    formData.append("fileIn", fileIn)
    formData.append("mode", $("#request-type").val());

    $("#sendRequest").prop("disabled", false)
    if (startDate && endDate /* && startTime && endTime */ && reason && shift) {
        if (checkduplicata(allLeave, startDate, endDate, startTime, endTime)) {
            $("#notification").attr("class", "notice-denied");
            $("#notification").text("La date choisi existe déja sur l'une de vos demandes");
            $("#notification").show();
            $("#sendRequest").prop("disabled", false);
            setTimeout(() => {
                $("#notification").hide();
            }, 5000);
        }
        else {
            $('#loading').show();
            $.ajax({
                url: "/makeRequest",
                method: "POST",
                cache: false,
                contentType: false,
                processData: false,
                data: formData,
                success: function (res) {
                    if (res == "Success") {
                        $("#sendRequest").prop("disabled", false);
                        $('#loading').hide();
                        $("#notification").attr("class", "notice-success");
                        $("#notification").text("Requête envoyé avec succes");
                        $("#notification").show();
                        UpdateRequest()
                        restore();
                        setTimeout(() => {
                            $("#notification").hide();
                        }, 5000);
                    }
                    else {
                        $("#sendRequest").prop("disabled", false);
                        $('#loading').hide();
                        $("#notification").attr("class", "notice-denied");
                        $("#notification").text("Une erreur est survenue");
                        $("#notification").show();
                        setTimeout(() => {
                            $("#notification").hide();
                        }, 5000);
                    }

                }
            })
        }

    }
    else {
        $("#sendRequest").prop("disabled", false);
        $("#notification").attr("class", "notice-denied");
        $("#notification").text("Veuillez remplir correctement les champs nécessaire");
        $("#notification").show();
        setTimeout(() => {
            $("#notification").hide();
        }, 5000);
    }

});
function UpdateRequest() {
    $.ajax({
        url: "/MyRequest",
        method: "POST",
        data: {
            code: $("#code").text()
        },
        success: function (res) {
            allLeave = res.filter(leave => leave.status != "declined");
            PendingAndDecline = res.filter(leave => leave.status != "approved");
            Approves = res.filter(leave => leave.status == "approved");
            myRequestRender(PendingAndDecline)
            Approved(Approves)
        }
    })
}
UpdateRequest();
function myRequestRender(data) {
    data.sort((a, b) => b.date_start - a.date_start);
    myRequestContent = '<div class="row p-3">'
    var pendingNumber = 0;
    var declinedNumber = 0;
    var progressNumber = 0;

    data.forEach(element => {
        if (element.status == "pending") {
            renderMyRequest(element, "pending");
            pendingNumber++;
        }
        else if (element.status == "declined") {
            renderMyRequest(element, "declined");
            declinedNumber++;
        }
        else {
            renderMyRequest(element, "progress");
            progressNumber++;
        }
    });
    myRequestContent += '</div>'
    $('#container-request').html(myRequestContent);
    $("#pending").text(pendingNumber)
    $("#declined").text(declinedNumber)
    $("#progress").text(progressNumber)
}


// methode pour afficher le shift (ex: 08:00 -> 08 heures)
function formatShift(hours = 8) {
    // let [hours] = value.split(':');
    return hours;
    return `${hours} heures`;
}


function Approved(data) {
    let _date = new Date();
    data.sort((a, b) => b.date_start - a.date_start);
    myUpcomingContent = '<div class="row p-3">'
    var approvedNumber = 0;
    data.forEach(element => {
        console.log("elemen", element);
        
        myUpcomingContent += `
            <div class="col-md-6 p-1">
            <div class="card-item">
                <div class="card-header">
                    <div class="motif">
                        <i class="fa-solid fa-person-walking-luggage mx-2"></i>
                        ${leaveModeValue[element.mode]}: ${(element.recovery !== "" && element.motif === "") ? element.recovery : element.motif}
                    </div>
                    <div class="buttons">
                    </div>
                    <div class="date-heure">
                        <div class="ask-content">
                            <h1>
                                <i class="fa-solid fa-calendar"></i>
                                Demandeur
                            </h1>
                            <div class="ask">
                                <span>Nom: ${element.nom}</span>
                                <span>Shift: ${formatShift(element.shift)}</span>
                                <span>Matricule: ${element.matr}</span>
                            </div>
                        </div>
                    </div>
                    <div class="date-heure">
                        <div class="d">
                            <h1>
                                <i class="fa-solid fa-calendar"></i>
                                Date
                            </h1>
                            <div>
                                <span>Début:</span>
                                <span>${moment(element.date_start).format("DD/MM/YYYY")}</span>
                            </div>
                            <div>
                                <span>Fin:</span>
                                <span>${moment(element.date_end).format("DD/MM/YYYY")}</span>
                            </div>
                        </div>
                        <div class="h">
                            <h1>
                                <i class="fa-solid fa-clock"></i>
                                Heure
                            </h1>
                            <div>
                                <span>Début:</span>
                                <span> ${element.hour_begin}</span>
                            </div>
                            <div>
                                <span>Fin:</span>
                                <span> ${element.hour_end}</span>
                            </div>
                        </div>
                    </div>
                    <div class="date-heure">
                        <div class="decision-direction">
                            <h1>
                                <i class="fa-solid fa-calendar"></i>
                                Décision de la direction
                            </h1>
                                ${element.conge_payer !== 0 ? `<div><span> A déduire s/ congés payés : </span> <span> ${element.conge_payer} jours</span> </div>` : ''}
                                ${element.deduire_sur_salaire !== 0 ? `<div><span>A déduire s/ salaire : </span> <span> ${element.deduire_sur_salaire} jours </span></div>` : ''}
                                ${element.permission_exceptionnelle !== 0 ? `<div><span>Permission exceptionnelle :</span> <span>  ${element.permission_exceptionnelle} jours</span></div>` : ''}
                                ${element.rien_a_deduire !== 0 ? `<div><span>Rien à déduire :</span> <span>  ${element.rien_a_deduire} jours</span></div>` : ''}
                               
                        </div>
                    </div>
                    <div class="d-flex justify-content-between">
                    <div class="duration">
                        <span>Durée:</span>
                        <span>${element.duration} ${element.duration > 1 ? "jours" : "jour"}</span>
                    </div>
                    <div class="duration">
                    <div><span> ${_date.getFullYear()}: ${(element.acc + element.conge_payer) - (element.rest + element.conge_payer)} | ${_date.getFullYear() - 1}: ${element.rest} </span> </div>
                    </div>
                    <div class="duration">
                    <div><span>Rest après autorisation | </span><span>${element.acc} </span> </div>
                    </div>
                    </div>
                </div>
                <div id="${element._id}" class="card-footer approved">
                    ${allStat[element.status]}
                </div>
            </div>
        </div>
            `
        approvedNumber++
    });
    myUpcomingContent += '</div>';
    $('#container-upcoming').html(myUpcomingContent);
    $("#approved").text(approvedNumber)
}
function decided(decision) {
    
    if (decision.includes("Congé Payé")) {
        return "A déduire s/ congé payés"
    }
    else if (decision.includes("Permission exceptionelle")) {
        return "Permission exceptionnelle"
    }
    else if (decision.includes("Repos Maladie") || decision.includes("Consultation médicale")) {
        return "Rien à déduire"
    }
    else if (decision.includes("Congé de maternité")) {
        return "Congé de maternité/paternité"
    } else if (decision.includes("Récupération")) {   
        return "Récupération" 
    } else if(decision.includes("Assistance maternelle")) {
        return "Assistance maternelle"
    }else{
        return "A déduire sur salaire"
    }
}
var allStat = {
    pending: "En attente",
    approved: "Approuvée",
    declined: "Refusée",
    progress: "En traitement",
}
function renderMyRequest(Leave, stat) {
    myRequestContent += `
    <div class="col-md-6 p-1">
        <div class="card-item">
            <div class="card-header">
                <div class="motif ${Leave.status}">
                    <i class="fa-solid fa-person-walking-luggage mx-2"></i>
                    ${leaveModeValue[Leave.mode]}: ${(Leave.recovery !== "" && Leave.motif === "") ? Leave.recovery : Leave.motif}
                </div>
                ${Leave.recovery.trim().length > 0 ? `
                <div class="motif ${Leave.status}">
                    <i class="fa-solid fa-person-walking-luggage mx-2"></i> Récupération: ${Leave.recovery}
                </div>` : ''}
                <div class="buttons">
                    ${stat == "pending" ? `
                    <div class="action-field">
                        <button class="btn btn-sm action" onclick="openEditModal('${Leave._id}')"><i class="fa-solid fa-file-pen"></i></button> 
                        <button class="btn btn-sm action ml-2"  onclick="openDeleteModal('${Leave._id}')"> <i class="fa-solid fa-square-xmark"></i></button>
                    </div>` : ''} 
                    ${stat == "declined" ? `
                    <div class="action-field">
                        <button class="btn btn-sm action ml-2"  onclick="openDeleteModal('${Leave._id}')"> <i class="fa-solid fa-square-xmark"></i></button>
                    </div>` : ''} 
                </div>
                <div class="date-heure">
                    <div class="ask-content">
                        <h1>
                            <i class="fa-solid fa-calendar"></i>
                            Demandeur
                        </h1>
                        <div class="ask">
                            <span>Nom: ${Leave.nom}</span>
                            <span>Shift: ${formatShift(Leave.shift)}</span>
                            <span>Matricule: ${Leave.matr}</span>
                        </div>
                    </div>
                </div>
                <div class="date-heure">
                    <div class="d">
                        <h1>
                            <i class="fa-solid fa-calendar"></i>
                            Date
                        </h1>
                        <div>
                            <span>Début:</span>
                            <span>${moment(Leave.date_start).format("DD/MM/YYYY")}</span>
                        </div>
                        <div>
                            <span>Fin:</span>
                            <span>${moment(Leave.date_end).format("DD/MM/YYYY")}</span>
                        </div>
                    </div>
                    <div class="h">
                        <h1>
                            <i class="fa-solid fa-clock"></i>
                            Heure
                        </h1>
                        <div>
                            <span>Début:</span>
                            <span> ${Leave.hour_begin}</span>
                        </div>
                        <div>
                            <span>Fin:</span>
                            <span> ${Leave.hour_end}</span>
                        </div>
                    </div>
                </div>
                <div class="duration">
                    <div>
                        <span>Durée:</span>
                        <span>${Leave.duration} jours</span>
                    </div>
                    <div>
                        <span>Priorité:</span>
                        <span>${Leave.priorityValue}</span>
                    </div>
                </div>
            </div>
            <div id="${Leave._id}" class="card-footer ${stat}">
                ${allStat[Leave.status]} ${Leave.status == "declined"?  ":"+Leave.comment : ""} 
            </div>
        </div>
    </div>
    `
}
var update = `
<div class="row">
<div class="col-md-9">
    <div class="row col-md-12 p-0">
        <div class="col-md-4 d-flex w-100">
            <p class="point-text">Periode solicitée :</p>
        </div>
        <div class="col-md-4 d-flex justify-content-between w-100">
            <p class="point-text ">Date début :</p>
            <input class="mx-1 date value" id="UpdateStartDate" type="date" />
        </div>
        <div class="col-md-4 d-flex justify-content-between w-100">
            <p class="point-text ">Heure :</p>
            <input class="mx-1 date value" id="UpdateStartTime" type="time" />
        </div>
    </div>
    <div class="row col-md-12 p-0">
        <div class="col-md-4 d-flex w-100">
          
        </div>
        <div class="col-md-4 d-flex justify-content-between w-100">
            <p class="point-text ">Date fin : <b class="filling">ish</b></p>
            <input class="mx-1 date value" id="UpdateEndDate" type="date" />
        </div>
        <div class="col-md-4 d-flex justify-content-between w-100">
            <p class="point-text ">Heure :</p>
            <input class="mx-1 date value" id="UpdateEndTime" type="time" />
        </div>
    </div>
</div>
<div class="col-md-3 align-items-center justify-content-center">
    <div class="day-number">
        <p class="point-text">Nb de jour :</p>
        <p id="dayNumber">7</p>
    </div>
</div>
</div>

<div class="row">
<div class="col-md-6">
    <p class="point-text mb-2">Motifs :</p>
    <textarea  class="value" id="UpdateMotif"></textarea>
</div>
<div class="col-md-6">
    <p class="point-text mb-2">Récupération :</p>
    <textarea id="UpdateRecovery"></textarea>
</div>
</div>
<div class="d-flex justify-content-end">
<button id="sendRequest" class="btn btn-md btn-info">Mettre a jour <i class="fa-solid fa-envelope"></i></button>
<div class="snippet mx-4 p-3" id="loading" data-title="dot-pulse">
    <div class="stage">
      <div class="dot-pulse"></div>
    </div>
  </div>
</div>
`

const isValidDate = (date) => {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    return datePattern.test(date);
}

$("#startDate").on('change', () => {

    var startDate = $("#startDate").val()
    var endDate = $("#endDate").val();

    // check if valid date
    if (isValidDate(startDate) && isValidDate(endDate)) {
        let eDate = new Date(endDate);
        let sDate = new Date(startDate);
        
        if (eDate.getFullYear() >= sDate.getFullYear()) {
            (!startDate) ? $("#startDate").css({ "border-color": "red" }) : (
                $("#startDate").css({ "border-color": "" }),
                (endDate) ? dateDiff(startDate, endDate) : ""
            );
        }
    }
})
$("#endDate").on('change', () => {

    var startDate = $("#startDate").val()
    var endDate = $("#endDate").val();

    // check if valid dates
    if (isValidDate(startDate) && isValidDate(endDate)) {
        
        let eDate = new Date(endDate);
        let sDate = new Date(startDate);
        
        if (eDate.getFullYear() >= sDate.getFullYear()) {
            (!endDate) ? $("#endDate").css({ "border-color": "red" }) : (
                $("#endDate").css({ "border-color": "" }),
                (startDate) ? dateDiff(startDate, endDate) : ""
            );
        }
    }

    // (!endDate) ? $("#endDate").css({ "border-color": "red" }) : (
    //     $("#endDate").css({ "border-color": "" }),
    //     (startDate) ? CalculateDaysIncludingHolidays(startDate, endDate) : ""
    // );
})
$("#startTime").on('change', () => {
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();
    (!startTime) ? $("#startTime").css({ "border-color": "" }) : (
        $("#startTime").css({ "border-color": "" }),
        (endTime) ? hourDiff(startTime, endTime) : ""
    );
    console.log()
    // no values
    emptyTimes();
})

function emptyTimes() {
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();
    // no values
    if (!startTime && !endTime) {
        leaveDurationTwo = 0;
        defaultHours = 1;
    } else {
        defaultHours = 0;
    }
    $("#dayNumber").text((leaveDuration + defaultHours + leaveDurationTwo - deduction) + " jour(s)")
}

$('#startTime').on('keydown', emptyTimes);
$('#endTime').on('keydown', emptyTimes);

$("#endTime").on('change', () => {
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();

    (!endTime) ? $("#endTime").css({ "border-color": "" }) : (
        $("#endTime").css({ "border-color": "" }),
        (startTime) ? hourDiff(startTime, endTime) : ""
    );
    
    emptyTimes();

})
$("#motif").on('change', () => {
    (!motif) ? $("#motif").css({ "border-color": "red" }) : (
        $("#motif").css({ "border-color": "" })
    );
})
$('#join').on('change', function (event) {
    var selectedFile = event.target.files[0];
    if (selectedFile) {
        fileIn = true;
        joinedFile = selectedFile;
        $('#fileOk').css({ "opacity": "1" });
    }
    else {
        fileIn = false
        $('#fileOk').css({ "opacity": "0" });
    }
})
async function dateDiff(starting, ending) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    // if shift value is there
    // if starttime and endtime are empty
    let st =$('#startTime').val();
    let et =$('#endTime').val();


    if (datePattern.test(ending)) {
        // var startings = moment(moment(starting)).format("YYYY-MM-DD HH:mm");
        // var endings = moment(ending, "YYYY-MM-DD HH:mm");
        // var duration = moment.duration(endings.diff(startings));
        // var dayl = duration.asDays();
        // leaveDuration = dayl;
        leaveDuration = await CalculateDaysIncludingHolidays(starting, ending) - 1;

        defaultHours = (!et && !st) ? 1 : 0;

        $("#dayNumber").text((leaveDuration + defaultHours + leaveDurationTwo - deduction) + " jour(s)")
    }
    else {
        leaveDuration = 0;
        $("#dayNumber").text((leaveDuration + leaveDurationTwo - deduction) + " jour(s)")
    }

    // calculate by times also
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();
    if (startTime && endTime)
        hourDiff(startTime, endTime)

    notValid()
}

function hourDiff(startTime, endTime) {
    var hours = 0;
    var minutes = 0;

    console.log('change')
    
    if (endTime != "") {

        startTime = moment(startTime, "HH:mm:ss a");
        endTime = moment(endTime, "HH:mm:ss a");
        var duration = moment.duration(endTime.diff(startTime));
        //duration in hours
        var hours_fictif = 0;
        var minutes_fictif = 0;
        hours_fictif += parseInt(duration.asHours());

        // duration in minutes
        minutes_fictif += parseInt(duration.asMinutes()) % 60;
        if (minutes_fictif < 0) {
            hours_fictif = hours_fictif - 1;
            minutes_fictif = 60 + minutes_fictif;
        }
        while (minutes_fictif > 60) {
            hours_fictif += 1;
            minutes_fictif = minutes_fictif - 60;
        }
        if (hours_fictif < 0) {
            hours_fictif = hours_fictif + 24;
        }
        hours += hours_fictif;
        minutes += minutes_fictif;
        if (hours <= 4) {
            hours <= 2 ? leaveDurationTwo = 0.25 : leaveDurationTwo = 0.5;
            if (leaveDurationTwo == 0.25) {
                $("#dayNumber").text(leaveDuration ? `${leaveDuration} jr ${calcul_timediff_absencetl(startTime, endTime)}` : `${calcul_timediff_absencetl(startTime, endTime)}`)
            }
            else {
                $("#dayNumber").text((leaveDurationTwo + leaveDuration - deduction) + " jour(s)")
            }

        }
        else if (hours >= 4) {
            leaveDurationTwo = 1;
            $("#dayNumber").text((leaveDurationTwo + leaveDuration - deduction) + " jour(s)")
        }
        else {
            leaveDurationTwo = 0;
            $("#dayNumber").text((leaveDurationTwo + leaveDuration - deduction) + " jour(s)")
        }
        notValid()

        
        if (!startTime && !endTime) {
            defaultHours = 1;
            console.log('ato')
        }

    }
}
function calcul_timediff_absencetl(startTime, endTime) {
    if (startTime != "") {
        startTime = moment(startTime, "HH:mm:ss a");
        endTime = moment(endTime, "HH:mm:ss a");
        var duration = moment.duration(endTime.diff(startTime));
        //duration in hours
        var hours_fictif = 0;
        var minutes_fictif = 0;
        hours_fictif += parseInt(duration.asHours());

        // duration in minutes
        minutes_fictif += parseInt(duration.asMinutes()) % 60;
        if (minutes_fictif < 0) {
            hours_fictif = hours_fictif - 1;
            minutes_fictif = 60 + minutes_fictif;
        }
        while (minutes_fictif > 60) {
            hours_fictif += 1;
            minutes_fictif = minutes_fictif - 60;
        }
        if (hours_fictif < 0) {
            hours_fictif = hours_fictif + 24;
        }
        if (hours_fictif == 0) {
            return minutes_fictif + " minutes";
        }
        else if (minutes_fictif == 0) {
            return hours_fictif + " heures";
        }
        else {
            return hours_fictif + " heures " + minutes_fictif + " minutes";
        }
    }
    else {
        return "heure non défini"
    }
}
function dateWrite(startTime, endTime) {
    dateDiff(startTime, endTime);
    hourDiff(startTime, endTime)
}
function replaceElementByIdPending(id, newData) {
    const index = PendingAndDecline.findIndex(item => item._id === id);

    if (index !== -1) {
        // Replace the element at the found index with the new data
        PendingAndDecline[index] = { ...PendingAndDecline[index], ...newData };
        myRequestRender(PendingAndDecline)
    }
}
function dropElementById(id) {
    PendingAndDecline = PendingAndDecline.filter(item => item._id != id);
    myRequestRender(PendingAndDecline)
}
function dropElementByIdApprove(id) {
    Approves = Approves.filter(item => item._id != id);
    Approved(Approves);
}
function restore() {
    $("#startDate").val("");
    $("#endDate").val("");
    $("#startTime").val("");
    $("#endTime").val("");
    $("#motif").val("");
    $("#recovery").val("");
    $('#toggle').prop('checked', false);
    $("#dayNumber").text("0");
    $("#priority").val("2");
    $('#join').val('');
    $('#shift').val('');
    fileIn = false
    $('#fileOk').css({ "opacity": "0" });
    
    $("#weekend-workingdates").hide();
}

function checkduplicata(leave, sd, ed, st, et) {
    var value = false;
    for (l = 0; l < leave.length; l++) {
        var all_date = date_concerning(
            moment(leave[l].date_start + ' ' + leave[l].hour_begin).format("YYYY-MM-DD HH:mm"),
            moment(leave[l].date_end + ' ' + leave[l].hour_end).format("YYYY-MM-DD HH:mm")
        );
        if (
            all_date.includes(moment(sd + ' ' + st).format("YYYY-MM-DD HH:mm")) ||
            all_date.includes(moment(ed + ' ' + et).format("YYYY-MM-DD HH:mm"))
        ) {
            value = true;
        }
    }
    return value;
}

function date_concerning(dateTime1, dateTime2) {
    var all_date_times = [];
    if (dateTime1 === dateTime2) {
        all_date_times.push(dateTime1);
    } else {
        while (dateTime1 <= dateTime2) {
            all_date_times.push(dateTime1);
            dateTime1 = moment(dateTime1).add(1, "minutes").format("YYYY-MM-DD HH:mm");
        }
    }
    return all_date_times;
}
function checkduplicata2(leave, sd, ed, sd1, ed1, st, et, st1, et1) {
    var value = false;
    var all_date = date_concerning2(
        moment(sd + ' ' + st).format("YYYY-MM-DD HH:mm"),
        moment(ed + ' ' + et).format("YYYY-MM-DD HH:mm"),
        moment(sd1 + ' ' + st1).format("YYYY-MM-DD HH:mm"),
        moment(ed1 + ' ' + set1).format("YYYY-MM-DD HH:mm")
    );
    for (l = 0; l < leave.length; l++) {
        if (
            all_date.includes(moment(leave[l].date_start + ' ' + leave[l].hour_begin).format("YYYY-MM-DD HH:mm")) ||
            all_date.includes(moment(leave[l].date_end  + ' ' + leave[l].hour_end).format("YYYY-MM-DD HH:mm"))
        ) {
            value = true;
        }
    }
    return value;
}

function date_concerning2(dateTime1, dateTime2, dateTime3, dateTime4) {
    var all_date_times = [];
    var not_in = date_concerning(dateTime3, dateTime4);
    
    if (dateTime1 === dateTime2) {
        if (!not_in.includes(dateTime1)) {
            all_date_times.push(dateTime1);
        }
    } else {
        while (dateTime1 <= dateTime2) {
            if (!not_in.includes(dateTime1)) {
                all_date_times.push(dateTime1);
            }
            dateTime1 = moment(dateTime1).add(1, "minutes").format("YYYY-MM-DD HH:mm");
        }
    }
    return all_date_times;
}

function triggerButton() {
    $("#join").click();
}
function itCount(theType) {
    if (theType.includes("Congé Payé")) {
        return true
    }
    else {
        return false
    }
}
function notValid() {
    if (leaveDuration < 0) {
        $("#sendRequest").prop("disabled", true)
        $("#notification").attr("class", "notice-denied");
        $("#notification").text("Erreur d'entrée sur la date");
        $("#notification").show();
        setTimeout(() => {
            $("#notification").hide();
        }, 5000);
    }
    else {
        $("#sendRequest").prop("disabled", false)
    }
}
// Delete modal
function openDeleteModal(id) {
    $('#delete-id').val(id);
    toggleDeleteModal();
}

function toggleDeleteModal() {
    $('.delete-modal').toggleClass('open');
}

function cancelLeaveRequest() {
    const id = $('#delete-id').val()
    // send request to the server
    $.ajax({
        url: `/CancelRequestLeave/${id}`, // Replace this with your API endpoint
        type: "POST",
        dataType: "json",
        success: function (data) {
            // This function will be called if the request is successful
            if (data.ok) {
                toggleDeleteModal();
                UpdateRequest();
                $("#notification").attr("class", "notice-success");
                $("#notification").text("Requête annulée avec succes");
                $("#notification").show();
                setTimeout(() => {
                    $("#notification").hide();
                }, 5000);
            } else {
                console.log(data.message)
            }
        },
        error: function (xhr, status, error) {
            // This function will be called if there is an error with the request
            console.error(error); // Log the error to the console
        }
    });
}

/**
 * Method for fetching holidays at madagascar from api
 */
const fetchHolidays = async (year) => {
    try {
        const country = 'MG';
        const url = `https://api.api-ninjas.com/v1/holidays?&country=${country}&year=${year}&type=major_holiday`;
        const response = await fetch(url, { headers: { 'X-Api-Key' : 'E1em8oPufQabcXhLRNSpuw==1ViChCD8i2kk34Cv' }});
        const data = await response.json();
        return data.map(holiday => holiday.date);
    } catch (error) {
        return [];
    }
};


// function to convert date to yyyy-mm-dd
function formatDateToYyyDdMm(date) {
    const year = date.getFullYear();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based in JavaScript

    return `${year}-${month}-${day}`;
}

/**
 * Method to calculate effective days, 
 * When the end date is friday, we add two days (saturday, sunday)
 * Also, when date is included in the holidays, we decrement per one day (-1 day)
 * @param {String} startDate start date 
 * @param {String} endDate end date
 * @param {Array of String} holidays Array of holiday from api
 * @returns number
 */

const calculateEffectiveDays = (startDate, endDate, holidays) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in one day
    
    // hide weekends working dates
    $("#weekend-workingdates").hide();

    deduction = 0;

    var weekendDays = [];

    // SI LE TYPE DE REQUEST EST UN <<CONGE>>
    if ($('#request-type').val() === "congé") {
        // If the end date is a Friday, push it by 2 days to Sunday
        if (end.getDay() === 5) {
            // to pass on saturday
            end.setDate(end.getDate() + 1); // next day (6)
            weekendDays.push(end.toISOString());
            $("#weekend-workingdates").show();
            let saturdayRadio = `
            <div>
                <input type="radio" id="saturday" value="2" name="start-working" date="${end.toISOString()}">
                <label for="saturday">Samedi ${end.toLocaleDateString('fr')}</label>
            </div>`;

            // pass on sunday
            end.setDate(end.getDate() + 1); //next day (7)
            weekendDays.push(end.toISOString());

            let sundayRadio = `
            <div>
                <input type="radio" id="sunday" value="1" name="start-working" date="${end.toISOString()}">
                <label for="sunday">Dimanche ${end.toLocaleDateString('fr')}</label>
            </div>`;
            let defaultEndDateString = formatDateToYyyDdMm(new Date(end.toISOString()));

            // add monday 
            let mondayDate = new Date(end);
            mondayDate.setDate(mondayDate.getDate() + 1);
            let mondayRadio = `
            <div>
                <input type="radio" id="monday" value="0" name="start-working" date="${mondayDate.toISOString()}">
                <label for="monday">Lundi ${mondayDate.toLocaleDateString('fr')}</label>
            </div>`;

            // generate radio button for saturaday, sunday and monday
            $(".dates-options").html(saturdayRadio + sundayRadio + mondayRadio);
            // default check
            $("#monday").click();
            // change end date value
            if (isValidDate(defaultEndDateString))
                $('#endDate').val(defaultEndDateString);
        }
        // If it fall for Saturday, we add 1 day for Sunday
        if (end.getDay() === 6) {
            $("#weekend-workingdates").show();
            // pass on sunday
            end.setDate(end.getDate() + 1); //next day (7)
            weekendDays.push(end.toISOString());
            let sundayRadio = `
            <div>
                <input type="radio" id="sunday" value="1" name="start-working" date="${end.toISOString()}">
                <label for="sunday">Dimanche ${end.toLocaleDateString('fr')}</label>
            </div>`;
            let defaultEndDateString = formatDateToYyyDdMm(new Date(end.toISOString()));

            // add monday 
            let mondayDate = new Date(end);
            mondayDate.setDate(mondayDate.getDate() + 1);
            let mondayRadio = `
            <div>
                <input type="radio" id="monday" value="0" name="start-working" date="${mondayDate.toISOString()}">
                <label for="monday">Lundi ${mondayDate.toLocaleDateString('fr')}</label>
            </div>`;
            // generate radio button for sunday and monday
            $(".dates-options").html(sundayRadio + mondayRadio);
            // default check
            $("#monday").click();
            // change end date value
            if (isValidDate(defaultEndDateString))
                $('#endDate').val(defaultEndDateString);
        }
    }

    // event handler
    $('input[name="start-working"]').change(function() {
        let value = +$(this).val();
        let returnDate = $(this).attr('date'); // date de retour au travail
        deduction = value;
        /**
         * Si congé demandé par l’employé se termine juste avant un jour férié, le férié ne sera pas déduit.
         * Par contre si le jour férié est inclus ( se trouvant entre les jours normaux) dans les congés payés pris par l’employé, il sera décompté.
         */
        for (let date of weekendDays) {
            if (returnDate > date) {
                // check next date
                if (holidays.includes(date.split('T')[0]) && date !== new Date(endDate).toISOString()) {
                    deduction += 1;
                }
            }
        }
        // changer automatiquement la valeur du champ date de fin.
        let defaultEndDateAsDate = new Date(returnDate);
        defaultEndDateAsDate.setDate(defaultEndDateAsDate.getDate() - 1);
        
        console.log(isValidDate(defaultEndDateAsDate), defaultEndDateAsDate)

        // if (isValidDate(defaultEndDateAsDate))
            $("#endDate").val(formatDateToYyyDdMm(defaultEndDateAsDate));


        $("#dayNumber").text((leaveDurationTwo + defaultHours + leaveDuration - deduction) + " jour(s)");
    });
    
    let totalDays = Math.floor((end - start) / oneDay) + 1; // Including the end date
    let holidayCount = 0;

    // holidays.push('2024-06-22');
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        // Check if the day is Saturday (6) or Sunday (0)
        if (date.getDay() === 6 || date.getDay() === 0) {
            // check next date
            if (holidays.includes(date.toISOString().split('T')[0]) && date.toISOString() !== new Date(endDate).toISOString()) {
                deduction += 1;
            }
        }
    }

    $("#dayNumber").text((leaveDurationTwo + defaultHours + leaveDuration - deduction) + " jour(s)");
    
    return totalDays - holidayCount;
};

/**
 * Methode to calculate day difference of two dates
 * if any date between those are including in a holidays/non-working days, we apply discount (-1 day per date included)
 * @param {String} startDate start date with format yyy-mm-dd
 * @param {String} endDate end date with format yyy-mm-dd
 * @returns number
 */
const CalculateDaysIncludingHolidays = async (startDate, endDate) => {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(startDate) && datePattern.test(endDate)) {
        const year = new Date().getFullYear();
        const holidays = await fetchHolidays(year);
        const effectiveDays = calculateEffectiveDays(startDate, endDate, holidays);
    
        console.log(`Effective days between ${startDate} and ${endDate} excluding holidays: ${effectiveDays}`);
        return effectiveDays < 0 ? 0 : effectiveDays;
    }
    return 0;
};

$(function(){
    var dtToday = new Date();
    
    var month = dtToday.getMonth() + 1;
    var day = dtToday.getDate();
    var year = dtToday.getFullYear();
    const padS = (s) => `${s}`.padStart(2, "0");

    month = padS(month);
    day = padS(day);
    
    var min = year + '-' + month + '-' + day;
    dtToday.setMonth(dtToday.getMonth() + 3);

    var max = `${dtToday.getFullYear()}-${padS(dtToday.getMonth() + 1)}-${padS(dtToday.getDay())}`;

    // or instead:
    // var min = dtToday.toISOString().substr(0, 10);

    // $('#startDate').attr('min', min);
    // $('#endDate').attr('min', min);
    // $('#edit-startDate').attr('min', min);
    // $('#edit-endDate').attr('min', min);
    
    // $('#startDate').attr('max', max);
    // $('#endDate').attr('max', max);
    // $('#edit-startDate').attr('max', max);
    // $('#edit-endDate').attr('max', max);

    
    $("#weekend-workingdates").hide();

    nextMonth = new Date()
});

//Update 04/07/24

function getShift(code){
    var shift = ["SHIFT 1","SHIFT 2","SHIFT 3"];
    var value = ""
    var theUser = users.filter(employe => employe.m_code == code);
    shift.includes(theUser.shift) ? value = theUser.shift : value = "08 heures";
    return value
}