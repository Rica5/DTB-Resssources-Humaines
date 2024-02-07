var PendingAndDecline = [];
var Approves = [];
var myRequestContent;
var myUpcomingContent;
var leaveDuration = 0;
var leaveDurationTwo = 0;
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
    $("#sendRequest").prop("disabled",true);
    var code = $("#code").text();
    var startDate = $("#startDate").val();
    var endDate = $("#endDate").val();
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();
    var motif = $("#motif").val();
    var recovery = $("#recovery").val();


    (!startDate) ? $("#startDate").css({ "border-color": "red" }) : $("#startDate").css({ "border-color": "" });
    (!endDate) ? $("#endDate").css({ "border-color": "red" }) : $("#endDate").css({ "border-color": "" });
    (!startTime) ? $("#startTime").css({ "border-color": "red" }) : $("#startTime").css({ "border-color": "" });
    (!endTime) ? $("#endTime").css({ "border-color": "red" }) : $("#endTime").css({ "border-color": "" });
    (!motif) ? $("#motif").css({ "border-color": "red" }) : $("#motif").css({ "border-color": "" });
    var dateRequest = { code: code, startDate: startDate, endDate: endDate, startTime: startTime, endTime: endTime, motif: motif, recovery: recovery, duration: (leaveDuration + leaveDurationTwo), priority: $("#toggle").is(':checked') }
    if (startDate && endDate && startTime && endTime && motif) {
        $('#loading').show();
        $.ajax({
            url: "/makeRequest",
            method: "POST",
            data: dateRequest,
            success: function (res) {
                $("#sendRequest").prop("disabled",false);
                $('#loading').hide();
                $("#notification").show();
                UpdateRequest()
                restore();
                setTimeout(() => {
                    $("#notification").hide();
                }, 5000);
            }
        })
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
            PendingAndDecline = res.filter(leave => leave.status != "approved");
            Approves = res.filter(leave => leave.status == "approved");
            myRequestRender(PendingAndDecline)
            Approved(Approves)
        }
    })
}
UpdateRequest();
function myRequestRender(data) {
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
function Approved(data) {
        myUpcomingContent = '<div class="row p-3">'
        var approvedNumber = 0;
        data.forEach(element => {
            myUpcomingContent += `
            <div class="col-md-6 p-1">
            <div class="card-item">
                <div class="card-header">
                    <div class="motif">
                        <i class="fa-solid fa-person-walking-luggage mx-2"></i> ${element.motif}
                    </div>
                    <div class="buttons">
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
                    <div class="d-flex justify-content-between">
                    <div class="duration">
                        <span>Durée:</span>
                        <span>${element.duration} jours</span>
                    </div>
                    <div class="duration">
                        <span>Rest =></span>
                        <span>Accumulée: ${element.acc} | ouvert: ${element.rest}</span>
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
var allStat = {
    pending: "En attente",
    approved: "Approuver",
    declined: "Refuser",
    progress: "En traitement",
}
function renderMyRequest(Leave, stat) {
    myRequestContent += `
    <div class="col-md-6 p-1">
        <div class="card-item">
            <div class="card-header">
                <div class="motif ${Leave.status}">
                    <i class="fa-solid fa-person-walking-luggage mx-2"></i> ${Leave.motif}
                </div>
                <div class="buttons">
                    ${stat == "pending" ? `
                    <div class="action-field">
                        <button class="btn btn-sm action"><i class="fa-solid fa-file-pen"></i></button> 
                        <button class="btn btn-sm action ml-2"> <i class="fa-solid fa-square-xmark"></i></button>
                    </div>` : ''} 
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
                    <span>Durée:</span>
                    <span>${Leave.duration} jours</span>
                </div>
            </div>
            <div id="${Leave._id}" class="card-footer ${stat}">
                ${allStat[Leave.status]}
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


$("#startDate").on('change', () => {

    var startDate = $("#startDate").val()
    var endDate = $("#endDate").val();

    (!startDate) ? $("#startDate").css({ "border-color": "red" }) : (
        $("#startDate").css({ "border-color": "" }),
        (endDate) ? dateDiff(startDate, endDate) : ""
    );
})
$("#endDate").on('change', () => {

    var startDate = $("#startDate").val()
    var endDate = $("#endDate").val();

    (!endDate) ? $("#endDate").css({ "border-color": "red" }) : (
        $("#endDate").css({ "border-color": "" }),
        (startDate) ? dateDiff(startDate, endDate) : ""
    );
})
$("#startTime").on('change', () => {
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();
    (!startTime) ? $("#startTime").css({ "border-color": "red" }) : (
        $("#startTime").css({ "border-color": "" }),
        (endTime) ? hourDiff(startTime, endTime) : ""
    );

})
$("#endTime").on('change', () => {
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();

    (!endTime) ? $("#endTime").css({ "border-color": "red" }) : (
        $("#endTime").css({ "border-color": "" }),
        (startTime) ? hourDiff(startTime, endTime) : ""
    );

})
$("#motif").on('change', () => {
    (!motif) ? $("#motif").css({ "border-color": "red" }) : (
        $("#motif").css({ "border-color": "" })
    );
})

function dateDiff(starting, ending) {
    if (ending != "") {
        var startings = moment(moment(starting)).format("YYYY-MM-DD HH:mm");
        var endings = moment(ending, "YYYY-MM-DD HH:mm");
        var duration = moment.duration(endings.diff(startings));
        var dayl = duration.asDays();
        leaveDuration = dayl;
        $("#dayNumber").text((leaveDuration + leaveDurationTwo) + " jour(s)")
    }
    else {
        leaveDuration = 0;
        $("#dayNumber").text((leaveDuration + leaveDurationTwo) + " jour(s)")
    }
}

function hourDiff(startTime, endTime) {
    var hours = 0;
    var minutes = 0;
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
        if (hours < 6) {
            leaveDurationTwo = 0.5;
            $("#dayNumber").text((leaveDurationTwo + leaveDuration) + " jour(s)")
        }
        else if (hours >= 6) {
            leaveDurationTwo = 1;
            $("#dayNumber").text((leaveDurationTwo + leaveDuration) + " jour(s)")
        }
        else {
            leaveDurationTwo = 0;
            $("#dayNumber").text((leaveDurationTwo + leaveDuration) + " jour(s)")
        }
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
function restore(){
    $("#startDate").val("");
    $("#endDate").val("");
    $("#startTime").val("");
    $("#endTime").val("");
    $("#motif").val("");
    $("#recovery").val("");
    $('#toggle').prop('checked', false);
    $("#dayNumber").text("0");
}