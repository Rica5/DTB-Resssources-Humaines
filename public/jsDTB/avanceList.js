
class AvanceList {

    grid;
    url;
    months = [
        "Les 12 mois", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    constructor() {
        this.grid = null;
        this.url = '/api/avance/paid';
        this.month = new Date().getMonth() + 1;
        this.year = new Date().getFullYear()
    }

    async getPaidAvances() {
        const res = await fetch(`${this.url}?month=${this.month}&year=${this.year}`);
        const { data } = await res.json();
        return data;
    }   

    async downloadFile(month, year) {
        const response = await fetch(`/exportExcel?month=${month}&year=${year}`, {  
            method: 'GET',  
        });  

        if (!response.ok) {  
            throw new Error('Network response was not ok');  
        }  

        // Create a blob from the response  
        const blob = await response.blob();  

        // Create a link to download the file  
        const url = window.URL.createObjectURL(blob);  
        const a = document.createElement('a');  
        a.href = url;  
        a.download = 'exported_file.xlsx'; // This is the default file name  
        document.body.appendChild(a);  
        a.click();  
        a.remove();  
        window.URL.revokeObjectURL(url); // Clean up the URL.createObjectURL 
    }
    async initGrid() {

        if (this.grid) this.grid.destroy();

        const data = await this.getPaidAvances();
        
        this.grid = new gridjs.Grid({
            columns: ["Nom", "M-CODE", "Montant", "Date de paiement", "Status"],
            data: data.map(d => [
                `${d.user.first_name} ${d.user.last_name}`,
                d.user.m_code,
                formatNumber(d.amount_granted),
                d.validation ? moment(d.validation.received_on).format('DD/MM/YYYY [à] HH:mm') : '',
                d.status === 'paid' ? 'Payé' : ''
            ]),
            pagination: {
                enabled: true, // Enable pagination
                limit: 20 // Number of rows per page
            },
            sort: true, // Enable sorting globally
            resizable: true, // Enable resizable columns globally
        }).render(document.getElementById("wrapper"));

        // show date display
        $("#date-display").html(`${this.months[this.month]} ${this.year}`);
        // show total
        const totalAmount = data.map(s => s.amount_granted).reduce((acc, cur) => acc + cur, 0);
        $("#total-display").html(formatNumber(totalAmount));

        // hide period container if month is equal to 0
        if (this.month === 0) {
            $('#period-container').attr('hidden', '');
        } else {
            $('#period-container').removeAttr('hidden');
            let month = `${this.year}-${this.month.toString().padStart(2, "0")}`;
            // input month value
            $('#month').val(month);
            const periodData  = await this.getPeriodByMonth(month);
            this.fillInPeriodForm(periodData )
        }
        // Fonction d'exportation des données en Excel
        // document.getElementById("exportBtn").addEventListener("click", () => {
        //     const tableData = data.map(d => ({
        //         Nom: `${d.user.first_name} ${d.user.last_name}`,
        //         M_CODE: d.user.m_code,
        //         Montant: formatNumber(d.amount_granted),
        //         Date_de_paiement: d.validation ? moment(d.validation.received_on).format('DD/MM/YYYY [à] HH:mm') : '',
        //         Status: d.status === 'paid' ? 'Payé' : ''
        //     }));

        //     const worksheet = XLSX.utils.json_to_sheet(tableData);
        //     const workbook = XLSX.utils.book_new();
        //     XLSX.utils.book_append_sheet(workbook, worksheet, "Avances");
        //     const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            
        //     const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        //     saveAs(blob, "avances-data.xlsx");
        // });
    }

    // method to get period defined in month (eg url: "/api/avance/getperiod/2024-09" to get dates defined on September 2024)
    async getPeriodByMonth(month) {
        const res = await fetch('/api/avance/getperiod/' + month);
        const { data } = await res.json();
        return data;
    }

    // method to display data in the form
    fillInPeriodForm(data) {
        const f = (d) => moment(d).format('YYYY-MM-DD')
        $('#start_date').val(data ? f(data.start_date) : '');
        $('#end_date').val(data ? f(data.end_date) : '');
    }

    addFilters() {
        const self = this;
        // Create month options
        const monthOptions = [];
        
        self.months.forEach((month, index) => {
            monthOptions.push(`<option value="${index}">${month}</option>`);
        });
        // Create year options starting from 2024 to current year
        const yearOptions = [];
        const date = new Date();
        const currentYear = date.getFullYear();
        for (let year = 2024; year <= currentYear; year++) {
            yearOptions.push(`<option value="${year}">${year}</option>`);
        }

        let $month = $('#f-month');
        let $year = $('#f-year');

        $month.html(monthOptions);
        $year.html(yearOptions);

        // default values
        $month.val(date.getMonth() + 1);
        $year.val(date.getFullYear());

        // add event listener
        $month.on('change', function() {
            self.month = +$(this).val();
            (self.month==0)? $("#exportBtn").hide():$("#exportBtn").show()
            self.initGrid()
        });

        $year.on('change', function() {
            self.year = +$(this).val();
            self.initGrid()
        });

    }

}


function formatNumber(val) {
    // Remove all non-digit characters
    let value = String(val).replace(/\D/g, '');
    // Add spaces every 3 digits
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    // Get the new length of the value after formatting
    return value;
}

const av = new AvanceList();
av.initGrid();
av.addFilters()

$("#exportBtn").on("click", function (req, res) {
    let month = $('#f-month').val();
    let year = $('#f-year').val();
    av.downloadFile(month, year).catch(error => {  
        console.error('Error downloading file:', error);  
    });
})