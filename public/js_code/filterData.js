var period = document.getElementById("period");
var datestart = document.getElementById("datestart");
var dateend = document.getElementById("dateend");
var searchit = document.getElementById("searchit");
var take_date = false;
// const queryString = window.location.search;
// const urlParams = new URLSearchParams(queryString);
// const ssearch = urlParams.get('ssearch');
// const speriod = urlParams.get('speriod');
// const sdatestart = urlParams.get('sdatestart');
// const sdateend = urlParams.get('sdateend');
// if (queryString.length != 0) {
//     if (speriod == "spec") {
//         document.getElementById("specific").style.display = "block";
//         period.style.display = "none";
//         take_date = true;
//         datestart.value = sdatestart;
//         dateend.value = sdateend;
//         searchit.value = ssearch;
//     }
//     else {
//         document.getElementById("specific").style.display = "none";
//         period.style.display = "block";
//         period.value = speriod;
//         searchit.value = ssearch;
//     }
// }
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
    http.send("period=" + period.value + "&searchit=" + searchit.value.replace(/\s/g, ''));
}
var table = $('#zero_config').DataTable(); // Replace 'yourDataTable' with the actual ID of your DataTable
function reload_table(data) {
    data = JSON.parse(data);

    var newData = []; // Array to hold the new data for DataTable

    // Assuming the server returns data as an array of objects with three properties: col1, col2, col3
    for (var i = 0; i < data.length; i++) {
        newData.push([data[i].nom, data[i].m_code, convert_date(data[i].date), data[i].locaux, data[i].entry, data[i].time_start, data[i].time_end, data[i].late_entry, data[i].worktime + " heures"])
        // Push each row to newData array
    }
    table.clear().rows.add(newData).draw(); // Set the new HTML content with three columns and redraw the DataTable
    document.getElementById("filter").style.display = "block";
    document.getElementById("sanim").style.display = "none";
    check_button(data.length);

}
function convert_date(date) {
    return moment(date).format("DD/MM/YYYY");
}
function check_button(count) {
    if (count == 0) {
        document.getElementById("generate_excel").disabled = true;
        document.getElementById("download").disabled = true;
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
    http.send("period=" + "spec" + "&datestart=" + datestart.value + "&dateend=" + dateend.value + "&searchit=" + searchit.value.replace(/\s/g, ''));
}