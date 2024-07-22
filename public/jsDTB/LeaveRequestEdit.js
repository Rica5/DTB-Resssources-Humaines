var edit_leaveDuration = 0;
var edit_leaveDurationTwo = 0;
var edit_deduction = 0;
var edit_defaultHours = 0;
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
    var shift = $("#edit-shift").val();
    var deductedDay = edit_deduction;


    (!startDate) ? $("#edit-startDate").css({ "border-color": "red" }) : $("#edit-startDate").css({ "border-color": "" });
    (!endDate) ? $("#edit-endDate").css({ "border-color": "red" }) : $("#edit-endDate").css({ "border-color": "" });
    // (!startTime) ? $("#edit-startTime").css({ "border-color": "red" }) : $("#edit-startTime").css({ "border-color": "" });
    // (!endTime) ? $("#edit-endTime").css({ "border-color": "red" }) : $("#edit-endTime").css({ "border-color": "" });
    (!shift) ? $("#edit-shift").css({ "border-color": "red" }) : $("#edit-shift").css({ "border-color": "" });
    // variable remplaçant le "motif" ou "recovery"
    var reason;
    // si c'est un conge
    if ($('#edit-request-type').val() === 'conge') {
        (!motif) ? $("#edit-motif").css({ "border-color": "red" }) : $("#edit-motif").css({ "border-color": "" });
        $("#edit-recovery").css({ "border-color": "" }) // remove border of recovery field
        reason = motif;
    }
    else {
        (!recovery) ? $("#edit-recovery").css({ "border-color": "red" }) : $("#edit-recovery").css({ "border-color": "" });
        $("#edit-motif").css({ "border-color": "" }) // remove border of motif field
        reason = recovery;
    }

    var dateRequest = {
        join: editJoinedFile, code: code, startDate: startDate, endDate: endDate, startTime: startTime,
        endTime: endTime, motif: motif, recovery: recovery, duration: (edit_leaveDuration + edit_leaveDurationTwo), priority: $("#edit-toggle").is(':checked')
    }
    const formData = new FormData();
    formData.append("join", editJoinedFile)
    formData.append("code", code)
    formData.append("startDate", startDate)
    formData.append("endDate", endDate)
    formData.append("shift", shift)
    formData.append("startTime", startTime)
    formData.append("endTime", endTime)
    formData.append("motif", motif)
    formData.append("recovery", recovery)
    formData.append("duration", (edit_leaveDuration + edit_defaultHours + edit_leaveDurationTwo - edit_deduction))
    formData.append("priority", $("#edit-toggle").is(':checked'))
    formData.append("leavePriority", priority);
    formData.append("deductedDay", deductedDay);
    formData.append("fileIn", editFileIn)
    if (startDate && endDate /*&& startTime && endTime*/ && reason && shift) {
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
                        $("#edit-weekend-workingdates").hide()
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

async function editDateDiff(starting, ending) {
    
    // if shift value is there
    // if starttime and endtime are empty
    let st =$('#edit-startTime').val();
    let et =$('#edit-endTime').val();

    if (ending != "") {
        // var startings = moment(moment(starting)).format("YYYY-MM-DD HH:mm");
        // var endings = moment(ending, "YYYY-MM-DD HH:mm");
        // var duration = moment.duration(endings.diff(startings));
        // var dayl = duration.asDays();
        // leaveDuration = dayl;
        edit_leaveDuration = await EditCalculateDaysIncludingHolidays(starting, ending) - 1;

        edit_defaultHours = (!et && !st) ? 1 : 0;

        $("#edit-dayNumber").text((edit_leaveDuration + edit_defaultHours + edit_leaveDurationTwo - edit_deduction) + " jour(s)")
    }
    else {
        edit_leaveDuration = 0;
        $("#edit-dayNumber").text((edit_leaveDuration + edit_leaveDurationTwo - edit_deduction) + " jour(s)")
    }
    
    // calculate by times also
    var startTime = $("#edit-startTime").val();
    var endTime = $("#edit-endTime").val();
    if (startTime && endTime)
        editHourDiff(startTime, endTime)

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
            hours <= 2 ? edit_leaveDurationTwo = 0.25 : edit_leaveDurationTwo = 0.5;
            if (edit_leaveDurationTwo == 0.25) {
                $("#edit-dayNumber").text(edit_leaveDuration ? `${edit_leaveDuration} jr ${calcul_timediff_absencetl(startTime, endTime)}` : `${calcul_timediff_absencetl(startTime, endTime)}`)
            }
            else {
                $("#edit-dayNumber").text((edit_leaveDurationTwo + edit_leaveDuration - edit_deduction) + " jour(s)")
            }

        }
        else if (hours >= 4) {
            edit_leaveDurationTwo = 1;
            $("#edit-dayNumber").text((edit_leaveDurationTwo + edit_leaveDuration - edit_deduction) + " jour(s)")
        }
        else {
            edit_leaveDurationTwo = 0;
            $("#edit-dayNumber").text((edit_leaveDurationTwo + edit_leaveDuration - edit_deduction) + " jour(s)")
        }
        editNotValid()
        
        
        if (!startTime && !endTime) {
            defaultHours = 1;
        }

    }
}
function editNotValid() {
    if (edit_leaveDuration < 0) {
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
    $('#edit-shift').val('');
    editFileIn = false
    $('#edit-fileOk').css({ "opacity": "0" });
}

function editTriggerButton() {
    $("#edit-join").click();
}

function editNotValid() {
    if (edit_leaveDuration < 0) {
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
    
    let eDate = new Date(endDate);
    let sDate = new Date(startDate);
    
    if (eDate.getFullYear() >= sDate.getFullYear()) {
        (!startDate) ? $("#edit-startDate").css({ "border-color": "" }) : (
            $("#edit-startDate").css({ "border-color": "" }),
            (endDate) ? editDateDiff(startDate, endDate) : ""
        );
    }
})
$("#edit-endDate").on('change', () => {

    var startDate = $("#edit-startDate").val()
    var endDate = $("#edit-endDate").val();

    let eDate = new Date(endDate);
    let sDate = new Date(startDate);
    
    if (eDate.getFullYear() >= sDate.getFullYear()) {
        (!endDate) ? $("#edit-endDate").css({ "border-color": "" }) : (
            $("#edit-endDate").css({ "border-color": "" }),
            (startDate) ? editDateDiff(startDate, endDate) : ""
        );
    }
})


function edit_EmptyTimes() {
    var startTime = $("#edit-startTime").val();
    var endTime = $("#edit-endTime").val();
    // no values
    if (!startTime && !endTime) {
        edit_leaveDurationTwo = 0;
        $("#edit-dayNumber").text((edit_leaveDuration + edit_leaveDurationTwo - edit_deduction) + " jour(s)")
    }
}

$('#edit-startTime').on('keydown', edit_EmptyTimes);
$('#edit-endTime').on('keydown', edit_EmptyTimes);

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
        success: async function (data) {
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
                // edit_leaveDuration = leave.duration;

                $('#edit-motif').val(leave.motif)
                $('#edit-recovery').val(leave.recovery)
                
                $('#edit-priority').val(leave.leavePriority)
                
                $('#edit-shift').val(leave.shift)
                

                $("#edit-weekend-workingdates").hide();

                await editDateDiff(leave.date_start, leave.date_end);
                await editHourDiff(leave.hour_begin, leave.hour_end);
                
                // edit_deduction = leave.deductedDay;
                // $("#edit-dayNumber").text((edit_leaveDuration + edit_leaveDurationTwo - edit_deduction) + " jour(s)")

                // when agent work on sunday or saturday
                $(`input[name="edit-start-working"][value="${leave.deductedDay}"]`).prop('checked', true);
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

/**
 * Method for fetching holidays at madagascar from api
 */
const editFetchHolidays = async (year) => {
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

/**
 * Method to calculate effective days, 
 * When the end date is friday, we add two days (saturday, sunday)
 * Also, when date is included in the holidays, we decrement per one day (-1 day)
 * @param {String} startDate start date 
 * @param {String} endDate end date
 * @param {Array of String} holidays Array of holiday from api
 * @returns number
 */

const editCalculateEffectiveDays = (startDate, endDate, holidays) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in one day
    
    // hide weekends working dates
    $("#edit-weekend-workingdates").hide();

    edit_deduction = 0;
    var weekendDays = [];

    if ($("#edit-request-type").val() === "conge") {
        // If the end date is a Friday, push it by 2 days to Sunday
        if (end.getDay() === 5) {
            // to pass on saturday
            end.setDate(end.getDate() + 1); // next day (6)
            weekendDays.push(end.toISOString());
            $("#edit-weekend-workingdates").show();
            let saturdayRadio = `
            <div>
                <input type="radio" id="edit-saturday" value="2" name="edit-start-working" date="${end.toISOString()}">
                <label for="edit-saturday">Samedi ${end.toLocaleDateString('fr')}</label>
            </div>`;
            
            // pass on sunday
            end.setDate(end.getDate() + 1); //next day (7)
            weekendDays.push(end.toISOString());
            let sundayRadio = `
            <div>
                <input type="radio" id="edit-sunday" value="1" name="edit-start-working" date="${end.toISOString()}">
                <label for="edit-sunday">Dimanche ${end.toLocaleDateString('fr')}</label>
            </div>`;
            let defaultEndDateString = formatDateToYyyDdMm(new Date(end.toISOString()));

            // add monday 
            let mondayDate = new Date(end);
            mondayDate.setDate(mondayDate.getDate() + 1);
            let mondayRadio = `
            <div>
                <input type="radio" id="edit-monday" value="0" name="edit-start-working" date="${mondayDate.toISOString()}">
                <label for="edit-monday">Lundi ${mondayDate.toLocaleDateString('fr')}</label>
            </div>`;

            // generate radio button for saturaday, sunday and monday
            $(".edit-dates-options").html(saturdayRadio + sundayRadio + mondayRadio);
            // default check
            $("#edit-monday").click();
            // change end date value
            $('#edit-endDate').val(defaultEndDateString);
        }
        // If it fall for Saturday, we add 1 day for Sunday
        if (end.getDay() === 6) {
            $("#edit-weekend-workingdates").show();
            // pass on sunday
            end.setDate(end.getDate() + 1); //next day (7)
            weekendDays.push(end.toISOString());
            let sundayRadio = `
            <div>
                <input type="radio" id="edit-sunday" value="1" name="edit-start-working" date="${end.toISOString()}">
                <label for="edit-sunday">Dimanche ${end.toLocaleDateString('fr')}</label>
            </div>`;
            let defaultEndDateString = formatDateToYyyDdMm(new Date(end.toISOString()));

            // add monday 
            let mondayDate = new Date(end);
            mondayDate.setDate(mondayDate.getDate() + 1);
            let mondayRadio = `
            <div>
                <input type="radio" id="edit-monday" value="0" name="edit-start-working" date="${mondayDate.toISOString()}">
                <label for="edit-monday">Lundi ${mondayDate.toLocaleDateString('fr')}</label>
            </div>`;
            // generate radio button for sunday and monday
            $(".edit-dates-options").html(sundayRadio + mondayRadio);
            // default check
            $("#edit-monday").click();
            // change end date value
            $('#edit-endDate').val(defaultEndDateString);
        }
    }

    // event handler
    $('input[name="edit-start-working"]').change(function() {
        let value = +$(this).val()
        let returnDate = $(this).attr('date'); // date de retour au travail
        edit_deduction = value;
        /**
         * Si congé demandé par l’employé se termine juste avant un jour férié, le férié ne sera pas déduit.
         * Par contre si le jour férié est inclus ( se trouvant entre les jours normaux) dans les congés payés pris par l’employé, il sera décompté.
         */
        for (let date of weekendDays) {
            if (returnDate > date) {
                // check next date
                if (holidays.includes(date.split('T')[0]) && date !== new Date(endDate).toISOString()) {
                    edit_deduction += 1;
                }
            }
        }
        $("#edit-dayNumber").text((edit_leaveDurationTwo + edit_leaveDuration - edit_deduction) + " jour(s)");
        // changer automatiquement la valeur du champ date de fin.
        let defaultEndDateAsDate = new Date(returnDate);
        defaultEndDateAsDate.setDate(defaultEndDateAsDate.getDate() - 1);
        $("#edit-endDate").val(formatDateToYyyDdMm(defaultEndDateAsDate));
    });
    let totalDays = Math.floor((end - start) / oneDay) + 1; // Including the end date
    let holidayCount = 0;
    
    //holidays.push('2024-06-22');
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        // Check if the day is Saturday (6) or Sunday (0)
        if (date.getDay() === 6 || date.getDay() === 0) {
            // check next date
            if (holidays.includes(date.toISOString().split('T')[0]) && date.toISOString() !== new Date(endDate).toISOString()) {
                edit_deduction += 1;
            }
        }
    }

    $("#edit-dayNumber").text((edit_leaveDurationTwo + edit_defaultHours + edit_leaveDuration - edit_deduction) + " jour(s)")
    
    return totalDays - holidayCount;
};

/**
 * Methode to calculate day difference of two dates
 * if any date between those are including in a holidays/non-working days, we apply discount (-1 day per date included)
 * @param {String} startDate start date with format yyy-mm-dd
 * @param {String} endDate end date with format yyy-mm-dd
 * @returns number
 */
const EditCalculateDaysIncludingHolidays = async (startDate, endDate) => {
    const year = new Date().getFullYear();
    const holidays = await editFetchHolidays(year);
    const effectiveDays = editCalculateEffectiveDays(startDate, endDate, holidays);
    
    console.log(`Effective days between ${startDate} and ${endDate} excluding holidays: ${effectiveDays}`);
    return effectiveDays;
};

$(function(){
    
    $("#edit-weekend-workingdates").hide();
    nextMonth = new Date()
});