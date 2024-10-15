
class AvanceList {  
    // Constantes pour les URLs d'API  
    static API_URL = {  
        PAID: '/api/avance/paid',  
        PERIOD: '/api/avance/getperiod/',  
        EXPORT: '/exportExcel'  ,
        EMPLOYEE: '/list_employee'
    };  

    months = [  
        "Les 12 mois", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",  
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"  
    ];  

    constructor() {  
        this.grid = null;  
        this.month = new Date().getMonth() + 1;  
        this.year = new Date().getFullYear();
    }  

    async getAllEmployee(){
        try {
            const res = await fetch(`${AvanceList.API_URL.EMPLOYEE}`,{
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                }
            })
  
            const users = await res.json();  
            // console.log("res", res.json());
            
            return users
        } catch (error) {
            
        }
    }
    async getPaidAvances() {  
        try {  
            const res = await fetch(`${AvanceList.API_URL.PAID}?month=${this.month}&year=${this.year}`);  
            const { data } = await res.json();  
            
            return data;  
        } catch (error) {  
            console.error('Error fetching paid advances:', error);  
            return [];  
        }  
    }  


    async downloadFile(month, year) {  
        try {  
            const response = await fetch(`${AvanceList.API_URL.EXPORT}?month=${month}&year=${year}`, { method: 'GET' });  
            if (!response.ok) throw new Error('Network response was not ok');  

            const blob = await response.blob();  
            const url = window.URL.createObjectURL(blob);  
            const a = document.createElement('a');  
            const dateDisplay = $('#date-display').text().split(' ').join('_');
            a.href = url;  
            a.download = `Avance_${dateDisplay}.xlsx`;  
            document.body.appendChild(a);  
            a.click();  
            a.remove();  
            window.URL.revokeObjectURL(url);  
        } catch (error) {  
            console.error('Error downloading file:', error);  
        }  
    }  
    async initGrid() {  
        if (this.grid) {
            this.grid.destroy(); 
        } 
    
        // Récupérer les avances payées  
        const data = await this.getPaidAvances();  
                
        // S'assurer que le conteneur est vide  
        const wrapper = document.getElementById("wrapper");  
        wrapper.innerHTML = ''; // Nettoyer le conteneur  
    
        // Initialiser et rendre la grille des paiements  
        this.grid = new gridjs.Grid({  
            columns: [
                // {
                //     id: "expands",
                //     name: "Expands",
                //     width: '20px',
                //     formatter: () => gridjs.html(`<i class="fa fa-chevron-right expand-icon"></i>`)
                // },
            "Nom", "M-CODE", "Montant (MGA)", "Date de paiement", "Status", {
                id:"tiers",
                name: "Tiers collecteur",
                width: "320px"
            }],  
            data: data.map(d => [
                `${d.user.first_name} ${d.user.last_name}`,  
                d.user.m_code,  
                formatNumber(d.amount_granted),  
                d.validation ? moment(d.validation.received_on).format('DD/MM/YYYY [à] HH:mm') : '',  
                d.status === 'paid' ? 'Payé' : d.status === 'rejected' ? 'Refusé' : '',
                d.autruiInfo
            ]),
            language: { ...LangueFROption },
            pagination: {  
                enabled: true,  
                limit: 20  
            },  
            sort: true,  
            resizable: true,  
        }).render(wrapper);


        // Add the event listener for the expand icon
        wrapper.addEventListener('click', function(event) {
            if (event.target.classList.contains('expand-icon')) {
            // Call your function when the expand icon is clicked
                let el = event.target;
                
                //fetching the parent of the element
                let parent = el.parentElement.parentElement.parentElement;
                //this can be done way better but it is to show the thought process
                // <i> => <td> => <tr>
                
                //let us create a row to hold the subtable
                let tr = document.createElement('tr');
                // now we know the new tr
                    
                    //creating a tableCell
                let td = document.createElement('td');
                //making sure is spans all columns elements
                td.colSpan = '5'; // i had 5 columns
                
                //now you can do something like td.innerHTML(`<div class="card card-primary">... stuff you want </div>`)
                // I would create a function to basically create whatever you want and return that
                td.innerHTML = `<>Hello from me</>`;
                
                //adding it all to the TR
                tr.appendChild(td);
                
                //now the last and fun part
                //this wil insert a row right under the clicked row
                parent.parentNode.insertBefore(tr, parent.nextSibling);
            }
        });

          


        // Récupérer tous les employés et filtrer ceux qui ne sont pas dans les avances  
        const User = await this.getAllEmployee(); 
        const userIdsInResults = data.map(avance => avance.user._id.toString()); 

        const usersNotInResults = User.filter(user => (  
            !userIdsInResults.includes(user._id.toString()) && (user.status !== "Quitter") && (user.first_name !== "TL")
            && (user.shift !== "RH") && (user.occupation !== "Opération" )&& (user.occupation !== "Surveillant" ) 
            && (user.occupation !== "Finance") && (user.m_code !== "N/A")  
        ));  
    
    
        // Nettoyer le conteneur pour la seconde grille  
        const nonAvContainer = document.getElementById("non-av");  
        nonAvContainer.innerHTML = ''; // Nettoyer le conteneur  
    
        // Initialiser la grille pour les utilisateurs non inclus  
        this.nonAvGrid = new gridjs.Grid({  
            columns: ["Nom", "M-CODE", "Montant (MGA)"],  
            data: usersNotInResults.map(d => [  
                `${d.first_name} ${d.last_name}`,  
                d.m_code,  
                ""  
            ]) , 
            language: { ...LangueFROption },
            data: usersNotInResults.map(user => [  
                `${user.first_name} ${user.last_name}`,  
                user.m_code,  
                ""  // Montant ou autre information si nécessaire  
            ]),  
            pagination: {  
                enabled: true,  
                limit: 20  
            },  
            sort: true,  
            resizable: true,  
        }).render(nonAvContainer); 
       
  
        const filterMcode = document.getElementById("searchMCODE")
        filterMcode.addEventListener("input", ()=>{
            const filterValue = filterMcode.value.toLowerCase()

            // console.log("dfefezfds",filterValue);
            
            
            const filteredUsers = usersNotInResults.filter(user=>{
                // console.log("user", user.m_code);
                
                const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
                const firstname = `${user.last_name} ${user.first_name}`.toLowerCase()
                return  fullName.includes(filterValue) || firstname.includes(filterValue) || user.m_code.toLowerCase().includes(filterValue)
            })

            // Rendre la grille des utilisateurs non inclus  
            const nonAvData = filteredUsers.map(user => [  
                `${user.first_name} ${user.last_name}`,  
                user.m_code,  
                ""  
            ]);  
            
            if (this.nonAvGrid) {
                this.nonAvGrid.updateConfig({
                    data: nonAvData
                }).forceRender()
            }

            const filterdData = data.filter(d=>{
                const fullName = `${d.user.first_name} ${d.user.last_name}`.toLowerCase()    
                const firstname = `${d.user.last_name} ${d.user.first_name}`.toLowerCase()            
                return fullName.includes(filterValue) || firstname.includes(filterValue) || d.user.m_code.toLowerCase().includes(filterValue)
            })

            
            // Assurez-vous de mettre à jour correctement la grille  
            if (this.grid) {  
                this.grid.updateConfig({  
                    data: filterdData.map(d => [  
                        `${d.user.first_name} ${d.user.last_name}`,  
                        d.user.m_code,  
                        formatNumber(d.amount_granted),  
                        d.validation ? moment(d.validation.received_on).format('DD/MM/YYYY [à] HH:mm') : '',  
                        d.status === 'paid' ? 'Payé' : ''  
                    ])  
                }).forceRender(); // Forcer le rendu avec les nouvelles données  
            }          
        })
        
        // Affichage de la date et du montant total  
        $("#date-display").html(`${this.months[this.month]} ${this.year}`);  
        const totalAmount = data.reduce((acc, s) => acc + s.amount_granted, 0);  
        $("#total-display").html(formatNumber(totalAmount));  
    
        // Gestion de l'affichage du conteneur de période  
        if (this.month === 0) {  
            $('#period-container').attr('hidden', true);  
        } else {  
            $('#period-container').removeAttr('hidden');  
            const monthFormatted = `${this.year}-${this.month.toString().padStart(2, "0")}`;  
            $('#month').val(monthFormatted);  
            const periodData = await this.getPeriodByMonth(monthFormatted);  
            this.fillInPeriodForm(periodData);  
        }  
    }

    async getPeriodByMonth(month) {  
        try {  
            const res = await fetch(`${AvanceList.API_URL.PERIOD}${month}`);  
            const { data } = await res.json();  
            return data;  
        } catch (error) {  
            console.error('Error fetching period data:', error);  
            return {};  
        }  
    }  

    fillInPeriodForm(data) {  
        const formatDate = (date) => moment(date).format('YYYY-MM-DD');  
        $('#start_date').val(data.start_date ? formatDate(data.start_date) : '');  
        $('#end_date').val(data.end_date ? formatDate(data.end_date) : '');  
    }  

    addFilters() {  
        // Création des options pour le mois et l'année  
        const monthOptions = this.months.map((month, index) => `<option value="${index}">${month}</option>`).join('');  
        const currentYear = new Date().getFullYear();  
        const yearOptions = Array.from({ length: currentYear - 2023 + 1 }, (_, i) => 2024 + i)  
                                  .map(year => `<option value="${year}">${year}</option>`)  
                                  .join('');  

        $('#f-month').html(monthOptions).val(new Date().getMonth() + 1);  
        $('#f-year').html(yearOptions).val(currentYear);  

        // Ajout des écouteurs d'événements  
        $('#f-month').on('change', () => {  
            this.month = +$('#f-month').val();  
            $("#exportBtn").toggle(this.month !== 0);  
            this.initGrid();  
        });  

        $('#f-year').on('change', () => {  
            this.year = +$('#f-year').val();  
            this.initGrid();  
        });  
    }  
}  

function formatNumber(val) {  
    return String(val).replace(/\D/g, '')  
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');  
}  


function buildSubTable(el) {
    //fetching the parent of the element
    let parent = el.parentElement.ParentElement.parentElement;
    //this can be done way better but it is to show the thought process
    // <i> => <td> => <tr>
    
    //let us create a row to hold the subtable
    let tr = document.createElement('tr');
    // now we know the new tr
        
        //creating a tableCell
    let td = document.createElement('td');
    //making sure is spans all columns elements
    td.colSpan = '5'; // i had 5 columns
    
    //now you can do something like td.innerHTML(`<div class="card card-primary">... stuff you want </div>`)
    // I would create a function to basically create whatever you want and return that
    td.appendChild(theFunctionYouNeedToBuildTheHTML())
    
    //adding it all to the TR
    tr.appendChild(td);
    
    //now the last and fun part
    //this wil insert a row right under the clicked row
    parent.parentNode.insertBefore(tr, parent.nextSibling);
}

const av = new AvanceList();  
av.initGrid();  
av.addFilters();  

$("#exportBtn").on("click", async () => {  
    const month = $('#f-month').val();  
    const year = $('#f-year').val();  
    try {  
        await av.downloadFile(month, year);  
    } catch (error) {  
        console.error('Error downloading file:', error);  
    }  
});



$("#avance-liste").on("click", function () {
    $("#wrapper").attr("style", "")
    $("#non-av").attr("style", "display: none")
    $("#avance-liste").addClass("active-btn")
    $("#non-avance").removeClass("active-btn")
})
$("#non-avance").on("click", function () {
    $("#non-av").attr("style", "")
    $("#wrapper").attr("style", "display: none")
    $("#avance-liste").removeClass("active-btn")
    $("#non-avance").addClass("active-btn")
})

const LangueFROption = {
    'search': {
        'placeholder': 'Rechercher...'
    },
    'pagination': {
        'previous': 'Précédent',
        'next': 'Suivant',
        'showing': 'Affichage de',
        'results': () => 'résultats',
        // Customize 'to' and 'of'
        'to': () => 'à',  // Change 'to' to 'à'
        'of': () => 'sur'  // Change 'of' to 'sur'
    },
    'loading': 'Chargement...',
    'noRecordsFound': 'Aucun enregistrement trouvé',
    'error': 'Une erreur est survenue',
}
