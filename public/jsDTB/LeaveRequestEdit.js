var leaveDuration = 0;
var leaveDurationTwo = 0;
var editJoinedFile = [];
var editFileIn = false;
var oldStartDate = '';
var oldEndDate = ''

$("#editRequest").on('click', () => {
    $("#editRequest").prop("disabled", true);
    var code = $("#code").text();
    var startDate = $("#edit-startDate").val();
    var endDate = $("#edit-endDate").val();
    var startTime = $("#edit-startTime").val();
    var endTime = $("#edit-endTime").val();
    var motif = $("#edit-motif").val();
    var recovery = $("#edit-recovery").val();
    var priority = +$("#edit-priority").val();


    (!startDate) ? $("#edit-startDate").css({ "border-color": "red" }) : $("#edit-startDate").css({ "border-color": "" });
    (!endDate) ? $("#edit-endDate").css({ "border-color": "red" }) : $("#edit-endDate").css({ "border-color": "" });
    (!startTime) ? $("#edit-startTime").css({ "border-color": "red" }) : $("#edit-startTime").css({ "border-color": "" });
    (!endTime) ? $("#edit-endTime").css({ "border-color": "red" }) : $("#edit-endTime").css({ "border-color": "" });
    (!motif) ? $("#edit-motif").css({ "border-color": "red" }) : $("#edit-motif").css({ "border-color": "" });
    const formData = new FormData();

    var dateRequest = {
        join: editJoinedFile, code: code, startDate: startDate, endDate: endDate, startTime: startTime,
        endTime: endTime, motif: motif, recovery: recovery, duration: (leaveDuration + leaveDurationTwo), priority: $("#edit-toggle").is(':checked')
    }
    formData.append("join", editJoinedFile)
    formData.append("code", code)
    formData.append("startDate", startDate)
    formData.append("endDate", endDate)
    formData.append("startTime", startTime)
    formData.append("endTime", endTime)
    formData.append("motif", motif)
    formData.append("recovery", recovery)
    formData.append("duration", (leaveDuration + leaveDurationTwo))
    formData.append("priority", $("#edit-toggle").is(':checked'))
    formData.append("leavePriority", priority);
    formData.append("fileIn", editFileIn)
    if (startDate && endDate && startTime && endTime && motif) {
        if (checkduplicata2(allLeave, startDate, endDate, oldStartDate, oldEndDate)) {
            $("#notification").attr("class", "notice-denied");
            $("#notification").text("La date choisi existe déja sur l'une de vos demandes");
            $("#notification").show();
            $("#editRequest").prop("disabled", false);
            // hide modal
            toggleEditModal();
            setTimeout(() => {
                $("#notification").hide();
            }, 5000);
        }
        else {
            $('#edit-loading').show();
            let leaveId = $('#hidden-id').val();
            $.ajax({
                url: `/UpdateRequestLeave/${leaveId}`,
                method: "PUT",
                cache: false,
                contentType: false,
                processData: false,
                data: formData,
                success: function (res) {
                    if (res == "Success") {
                        $("#editRequest").prop("disabled", false);
                        $('#edit-loading').hide();
                        $("#notification").attr("class", "notice-success");
                        $("#notification").text("Requête modifiée avec succes");
                        $("#notification").show();
                        
                        // Replace the old request to the updated request
                        UpdateRequest();
                        // hide modal
                        toggleEditModal();
                        editRestore();
                        setTimeout(() => {
                            $("#notification").hide();
                        }, 5000);
                    }
                    else {
                        $("#editRequest").prop("disabled", false);
                        $('#edit-loading').hide();
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
        $("#editRequest").prop("disabled", false);
        $("#notification").attr("class", "notice-denied");
        $("#notification").text("Veuillez remplir correctement les champs nécessaire");
        $("#notification").show();
        setTimeout(() => {
            $("#notification").hide();
        }, 5000);
    }

});

function editDateDiff(starting, ending) {
    if (ending != "") {
        // var startings = moment(moment(starting)).format("YYYY-MM-DD HH:mm");
        // var endings = moment(ending, "YYYY-MM-DD HH:mm");
        // var duration = moment.duration(endings.diff(startings));
        // var dayl = duration.asDays();
        // leaveDuration = dayl;
        leaveDuration = CalculateDaysIncludingHolidays(starting, ending) - 1;
        $("#edit-dayNumber").text((leaveDuration + leaveDurationTwo) + " jour(s)")
    }
    else {
        leaveDuration = 0;
        $("#edit-dayNumber").text((leaveDuration + leaveDurationTwo) + " jour(s)")
    }
    editNotValid()
}

function editHourDiff(startTime, endTime) {
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
        if (hours <= 4) {
            hours <= 2 ? leaveDurationTwo = 0.25 : leaveDurationTwo = 0.5;
            if (leaveDurationTwo == 0.25) {
                $("#edit-dayNumber").text(leaveDuration ? `${leaveDuration} jr ${calcul_timediff_absencetl(startTime, endTime)}` : `${calcul_timediff_absencetl(startTime, endTime)}`)
            }
            else {
                $("#edit-dayNumber").text((leaveDurationTwo + leaveDuration) + " jour(s)")
            }

        }
        else if (hours >= 4) {
            leaveDurationTwo = 1;
            $("#edit-dayNumber").text((leaveDurationTwo + leaveDuration) + " jour(s)")
        }
        else {
            leaveDurationTwo = 0;
            $("#edit-dayNumber").text((leaveDurationTwo + leaveDuration) + " jour(s)")
        }
        editNotValid()

    }
}
function editNotValid() {
    if (leaveDuration < 0) {
        $("#editRequest").prop("disabled", true)
        $("#notification").attr("class", "notice-denied");
        $("#notification").text("Erreur d'entrée sur la date");
        $("#notification").show();
        setTimeout(() => {
            $("#notification").hide();
        }, 5000);
    }
    else {
        $("#editRequest").prop("disabled", false)
    }
}

function editRestore() {
    $("#edit-startDate").val("");
    $("#edit-endDate").val("");
    $("#edit-startTime").val("");
    $("#edit-endTime").val("");
    $("#edit-motif").val("");
    $("#edit-recovery").val("");
    $('#edit-toggle').prop('checked', false);
    $("#edit-dayNumber").text("0");
    $("#edit-priority").val('2')
    $('#edit-join').val('');
    editFileIn = false
    $('#edit-fileOk').css({ "opacity": "0" });
}

function editTriggerButton() {
    $("#edit-join").click();
}

function editNotValid() {
    if (leaveDuration < 0) {
        $("#editRequest").prop("disabled", true)
        $("#notification").attr("class", "notice-denied");
        $("#notification").text("Erreur d'entrée sur la date");
        $("#notification").show();
        setTimeout(() => {
            $("#notification").hide();
        }, 5000);
    }
    else {
        $("#editRequest").prop("disabled", false)
    }
}

/*
    EditLeave Modal
*/


$("#edit-startDate").on('change', () => {

    var startDate = $("#edit-startDate").val()
    var endDate = $("#edit-endDate").val();

    (!startDate) ? $("#edit-startDate").css({ "border-color": "red" }) : (
        $("#edit-startDate").css({ "border-color": "" }),
        (endDate) ? editDateDiff(startDate, endDate) : ""
    );
})
$("#edit-endDate").on('change', () => {

    var startDate = $("#edit-startDate").val()
    var endDate = $("#edit-endDate").val();

    (!endDate) ? $("#edit-endDate").css({ "border-color": "red" }) : (
        $("#edit-endDate").css({ "border-color": "" }),
        (startDate) ? editDateDiff(startDate, endDate) : ""
    );
})
$("#edit-startTime").on('change', () => {
    var startTime = $("#edit-startTime").val();
    var endTime = $("#edit-endTime").val();
    (!startTime) ? $("#edit-startTime").css({ "border-color": "red" }) : (
        $("#edit-startTime").css({ "border-color": "" }),
        (endTime) ? editHourDiff(startTime, endTime) : ""
    );

})
$("#edit-endTime").on('change', () => {
    var startTime = $("#edit-startTime").val();
    var endTime = $("#edit-endTime").val();

    (!endTime) ? $("#edit-endTime").css({ "border-color": "red" }) : (
        $("#edit-endTime").css({ "border-color": "" }),
        (startTime) ? editHourDiff(startTime, endTime) : ""
    );

})
$("#edit-motif").on('change', () => {
    (!motif) ? $("#edit-motif").css({ "border-color": "red" }) : (
        $("#edit-motif").css({ "border-color": "" })
    );
})
$('#edit-join').on('change', function (event) {
    var selectedFile = event.target.files[0];
    if (selectedFile) {
        editFileIn = true;
        editJoinedFile = selectedFile;
        $('#edit-fileOk').css({ "opacity": "1" });
    }
    else {
        editFileIn = false
        $('#edit-fileOk').css({ "opacity": "0" });
    }
})

function openEditModal(id) {
    // restore first
    editRestore();
    // send request to the server
    $.ajax({
        url: `/RequestLeave/${id}`, // Replace this with your API endpoint
        type: "GET",
        dataType: "json",
        success: function (data) {
            // This function will be called if the request is successful
            if (data.ok) {
                // Display the retrieved data to the console
                const leave = data.leave;

                if (leave.status !== "pending") {
                    return alert('Votre congé a été déjà en cours de traitement.');
                }

                oldStartDate = leave.date_start;
                oldEndDate = leave.date_end;

                // set the hidden id
                $('#hidden-id').val(id);

                $('#edit-startDate').val(leave.date_start)
                $('#edit-endDate').val(leave.date_end)

                $('#edit-startTime').val(leave.hour_begin)
                $('#edit-endTime').val(leave.hour_end)

                $('#edit-dayNumber').text(`${leave.duration} ${leave.duration > 1 ? "jours" : "jour"}`)
                leaveDuration = leave.duration;

                $('#edit-motif').val(leave.motif)
                $('#edit-recovery').val(leave.recovery)

                $('#edit-toggle').attr('checked', leave.priority)
                // Process the data as needed
                toggleEditModal();
            }
        },
        error: function (xhr, status, error) {
            // This function will be called if there is an error with the request
            console.error(error); // Log the error to the console
        }
    });
}

function toggleEditModal() {
    $('.edit-leave-modal').toggleClass("open")
}
