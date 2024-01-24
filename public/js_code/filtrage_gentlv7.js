var period = document.getElementById("period");
var datestart = document.getElementById("datestart");
var dateend = document.getElementById("dateend");
var searchit = document.getElementById("searchit");
var take_date = false;
var status_row = document.getElementById("status_row");
var shifttl = document.getElementById("shifttl");
var locauxtl = document.getElementById("locauxtl");
var shift = document.getElementById("shift");
var loading = document.getElementById("loading");
var users = {};
var data_status = {};
function closing() {
    document.getElementById("specific").style.display = "none";
    period.style.display = "block";
    period.value = "";
    take_date = false;
}
function change_period() {
    if (period.value == "spec") {
        document.getElementById("specific").style.display = "block";
        period.style.display = "none";
        take_date = true;
    }
    else {
        document.getElementById("specific").style.display = "none";
        period.style.display = "block";
        take_date = false;
    }
}
function go_filter() {
    document.getElementById("filter").style.display = "none";
    document.getElementById("sanim").style.display = "block";
    if (take_date) {
        filterspec();
    }
    else {
        filter();
    }

}
function filter() {
    var http = new XMLHttpRequest();
    http.open("POST", "/filter", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if (this.responseText == "error") {
                window.location = "/";
            }
            else {
                reload_table(this.responseText);
            }

        }
    };
    http.send("period=" + period.value + "&searchit=" + searchit.value);
}
function getUsers() {
    var http = new XMLHttpRequest();
    http.open("POST", "/all_userstl", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if (this.responseText == "error") {
                window.location = "/";
            }
            else {
                var data_get = JSON.parse(this.responseText);
                users = data_get[0];
                data_status = data_get[1];
                go_filter();
                render_status();
            }

        }
    };
    http.send();
}
function render_status() {
    status_row.innerHTML = "";
    users.forEach(element => {
        const isFound = data_status.filter(item => item.m_code === element.m_code);
        if (isFound.length != 0) {
            if (shiftSearch(shifttl.value, element.shift) && locationSearch(locauxtl.value, element.act_loc) && vacationExclude(element.act_stat) && giveActif(element.status)) {
                if (orangeColor(isFound[isFound.length - 1].time_end)) {
                    status_row.innerHTML += `
           <div class="col-md-1 card-code-done text-center mx-1 mt-1">
                                ${element.m_code}
                              </div>
           `
                }
                else {
                    status_row.innerHTML += `
           <div class="col-md-1 card-code-active text-center mx-1 mt-1">
                                ${element.m_code}
                              </div>
           `
                }
            }

        }
        else {
            if (shiftSearch(shifttl.value, element.shift) && locationSearch(locauxtl.value, element.act_loc) && vacationExclude(element.act_stat) && giveActif(element.status)) {
                status_row.innerHTML += `
           <div class="col-md-1 card-code-away text-center mx-1 mt-1">
                                ${element.m_code}
                              </div>
           `
            }
        }
    });
}
function shiftSearch(given, actual) {
    var shift_change = ["SHIFT 1", "SHIFT 2", "SHIFT 3"];
    if (shift_change.includes(actual) === false) {
        actual = "SHIFT AUTRES"
    }
    if (given != "") {
        if (given == actual) {
            return true
        }
        else {
            return false
        }
    }
    else {
        return true
    }
}
function locationSearch(given, actual) {
    if (given != "") {
        if (given == actual) {
            return true
        }
        else {
            return false
        }
    }
    else {
        return true
    }
}
function vacationExclude(given) {
    if (given != "VACATION") {
        return true
    }
    else {
        return false
    }
}
function giveActif(given) {
    if (given == "Actif") {
        return true
    }
    else {
        return false
    }
}
function orangeColor(given) {
    if (given != "") {
        return true
    }
    else {
        return false
    }
}

function generate() {
    loading.style.display = "block";
    var http = new XMLHttpRequest();
    http.open("POST", "/generatetl", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if (this.responseText == "error") {
                window.location = "/";
            }
            else {
                loading.style.display = "none";
                window.location = "/download";
            }

        }
    };
    http.send("date=" + datestart.value + "&shift=" + shift.value);
}

var table = $('#zero_config').DataTable(); // Replace 'yourDataTable' with the actual ID of your DataTable
function reload_table(data) {
    data = JSON.parse(data);

    var newData = []; // Array to hold the new data for DataTable

    // Assuming the server returns data as an array of objects with three properties: col1, col2, col3
    for (var i = 0; i < data.length; i++) {
        var shifts = getShift(data[i].m_code);
        if (shift.value != "") {
            if (shifts == shift.value) {
                newData.push([data[i].m_code, shifts, convert_date(data[i].date), data[i].locaux, data[i].entry, data[i].time_start, render_lunch(data[i].start_break, data[i].end_break, shifts, 20, 15), render_lunch(data[i].start_lunch, data[i].end_lunch, shifts, 40, 30), data[i].time_end, data[i].late_entry, data[i].worktime + " heures"])
            }
            else {

            }
        }
        else {
            newData.push([data[i].m_code, shifts, convert_date(data[i].date), data[i].locaux, data[i].entry, data[i].time_start, render_lunch(data[i].start_break, data[i].end_break, shifts, 20, 15), render_lunch(data[i].start_lunch, data[i].end_lunch, shifts, 40, 30), data[i].time_end, data[i].late_entry, data[i].worktime + " heures"])
        }

        // Push each row to newData array
    }
    table.clear().rows.add(newData).draw(); // Set the new HTML content with three columns and redraw the DataTable
    document.getElementById("filter").style.display = "block";
    document.getElementById("sanim").style.display = "none";
    check_button(data.length);

}
function render_lunch(start, end, shift, late, delay) {
    var shift_change = ["SHIFT 1", "SHIFT 2", "SHIFT 3"]
    if (shift_change.includes(shift)) {
        return `${start} - ${end} <br>
        ${give_late(calcul_timediff_lunchtl(start, end), late, delay)}               
        `
    }
    else {
        return `${start} - ${end} <br>
        ${calcul_timediff_lunchtl(start, end)}
        `
    }
}
function give_late(given, lates, delay) {
    var string = given;
    var late = parseInt(given.split(" ")[0]);
    if (late >= lates) {
        string += ` <br>(${late - delay} minutes de retard)`
    }
    return string
}
function calcul_timediff_lunchtl(startTime, endTime) {
    if (startTime != "?" && endTime != "?") {
        startTime = moment(startTime, "HH:mm:ss a");
        endTime = moment(endTime, "HH:mm:ss a");
        var duration = moment.duration(endTime.diff(startTime));
        var minutes_fictif = 0;

        // duration in minutes
        minutes_fictif += parseInt(duration.asMinutes());
        return minutes_fictif + " minutes";
    }
    else {
        return "0"
    }
}
function getShift(code) {
    var shift_change = ["SHIFT 1", "SHIFT 2", "SHIFT 3"]
    const results = users.filter(item => item.m_code === code);
    if (shift_change.includes(results[0].shift)) {
        return results[0].shift
    }
    else {
        return "SHIFT AUTRES"
    }

}
function convert_date(date) {
    return moment(date).format("DD/MM/YYYY");
}
function check_button(count) {
    if (count == 0) {
        document.getElementById("generate_excel").disabled = true;
    }
    else {
        document.getElementById("generate_excel").disabled = false;
    }
}

function filterspec() {
    var http = new XMLHttpRequest();
    http.open("POST", "/filter", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if (this.responseText == "error") {
                window.location = "/";
            }
            else {
                reload_table(this.responseText);
            }
        }
    };
    http.send("period=" + "spec" + "&datestart=" + datestart.value + "&dateend=" + dateend.value + "&searchit=" + searchit.value);
}
getUsers();