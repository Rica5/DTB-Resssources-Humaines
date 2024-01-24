var datestart = document.getElementById("datestart");
datestart.value = moment().format("YYYY-MM-DD");
var all_absence = [];

var table = $('#zero_config').DataTable(); // Replace 'yourDataTable' with the actual ID of your DataTable
function reloading() {
    var http = new XMLHttpRequest();
    http.open("POST", "/absences", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if (this.responseText != "retour") {
                all_absence = JSON.parse(this.responseText);
                reload_table(this.responseText);
                filter();
            }
        }
    };
    http.send();
}
function filter() {
    console.log("Change")
    const results = all_absence.filter(item => item.date === moment(datestart.value).format("YYYY-MM-DD"));
    if (results.length != 0) {
        console.log(JSON.stringify(results))
        reload_table(JSON.stringify(results));
    }
    else {
        table.clear().draw();
    }
}
function reload_table(data) {
    data = JSON.parse(data);
    var newData = []; // Array to hold the new data for DataTable
    // Assuming the server returns data as an array of objects with three properties: col1, col2, col3
    for (var i = 0; i < data.length; i++) {

        newData.push([data[i].nom, data[i].m_code, convert_date(data[i].date), data[i].time_start, data[i].return, data[i].reason])
        // Push each row to newData array
    }
    table.clear().rows.add(newData).draw(); // Set the new HTML content with three columns and redraw the DataTable

}
function renderFiltrage(data) {

}
function convert_date(date) {
    return moment(date).format("DD/MM/YYYY");
}
reloading();