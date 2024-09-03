class SalaryAvanceUI {

    baseurl = '/api/avance';

    constructor(id, employeeId, amount, dateRequested, status) {
        this.id = id;
        this.employeeId = employeeId;
        this.amount = amount;
        this.dateRequested = dateRequested;
        this.status = status;
    }

    async getList() {
        const response = await fetch(`${this.baseurl}/${employeeId}`);
        return response.json();
    }

    async send(data) {
        const response = await fetch(`${this.baseurl}/send`);
        return response.json();
    }

    loadDataTable(id, url) {

            let table = $('#' + id).DataTable({
                ajax: {
                    url: url,
                    dataSrc: "data"
                },
                columns: [
                    { 
                        "data": "date",
                        "render": function(data, type, row) {
                            // Use Moment.js to format the date
                            return moment(data).format('DD/MM/YYYY'); // Custom format
                        }
                    },
                    { 
                        "data": "date_of_avance",
                        "render": function(data, type, row) {
                            // Use Moment.js to format the date
                            return moment(data).format('MMM YYYY'); // Custom format
                        }
                    },
                    { "data": "desired_amount" },
                    { "data": "amount_granted" },
                    { "data": "status" },
                    { 
                        "data": "null",
                        "render": function(data, type, row) {
                            // Use Moment.js to format the date
                            return `<button id="#edit_${row._id}" class="edit_btn">Edit</button>`; // Custom format
                        }
                    },
                ]
            }); // Initialiser DataTables sur la table


            // Detect when DataTable has finished loading
            table.on('init', function() {
                // add click listener on edit buttons
                $(`#${id} .edit_btn`).each((i, btn) => {
                    console.log(i)
                    $(btn).on('click', function() {
                        // handle edit
                        alert(this.id)
                    });
                });
            });
        
    }
}

const ui = new SalaryAvanceUI();
ui.loadDataTable("listeDemande", '/api/avance');