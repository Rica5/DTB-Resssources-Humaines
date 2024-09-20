
document.addEventListener('DOMContentLoaded', async function() {
    // const res = await fetch('/api/leave-requests');
    // const data = await res.json();
    let Data = [];
    const transformedData = data => data.map(item => {
        const validationObj = {
            validationTL: '',
            validationROP: '',
            validationRH: ''
        };
        
        item.validation.forEach(validation => {
            const { occupation, _id } = validation.user;
            const approbationText = validation.approbation ? 'OK' : validation.comment;
    
            if (occupation === 'Admin') {
                validationObj.validationRH = approbationText;
            } else if (occupation === 'Opération' || _id === "64954ef126461078597606cd") {
                validationObj.validationROP = approbationText;
            } else if (occupation === 'Surveillant') {
                validationObj.validationTL = approbationText;
            }
        });
        item.code = item.m_code
    
        return {
            ...item,
            ...validationObj
        };
    });
    
    function fetchData(month, year) {
        fetch(`/api/leave-requests?month=${month}&year=${year}`)
            .then(response => response.json())
            .then(data => {
                Data = transformedData([...data.data]);
                grid.resetData(Data); // Update grid with fetched data
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    class DateFormatRenderer {
        constructor(props) {
            this.el = document.createElement('span');
            this.render = debounce(this.render.bind(this), 100);
            this.render(props)
        }

        getElement() {
            return this.el;
        }

        render(props) {
            const { value, columnInfo } = props;
            const { format, locale } = columnInfo.renderer.options;
            // Use the column's alignment property, defaulting to center
            let date = moment(value).locale(locale || 'fr').format(format || 'YYYY-MM-DD')
            this.el.innerHTML = `${date}`
        }
    }
    
    class ProjectRenderer {
        constructor(props) {
            this.el = document.createElement('span');
            this.render = debounce(this.render.bind(this), 100);
            this.render(props)
        }

        getElement() {
            return this.el;
        }

        render(props) {
            const { value } = props;
            // Use the column's alignment property, defaulting to center
            let data = USERS.find(u => u.m_code === value)
            this.el.innerHTML = `${data?.project}`
        }
    }
    
    class ObservationRenderer {
        constructor(props) {
            this.el = document.createElement('span');
            this.render(props)
        }

        getElement() {
            return this.el;
        }

        render(props) {
            const { value } = props;
            // Use the column's alignment property, defaulting to center
            console.log(props)
            this.el.innerHTML = `${value}`
        }
    }
    const grid = new tui.Grid({
        el: $('#grid').get(0), // Container element
        rowKey: "id",
        scrollX: false,
        scrollY: false,
        minBodyHeight: 30,
        rowHeaders: ['rowNum'],
        pageOptions: {
            useClient: true,
            perPage: 17,     // Number of rows per page
            totalCount: 50
        },
        columns: [
            {
                header: 'Date',
                name: 'sendingDate',
                renderer: {
                    type: DateFormatRenderer,
                    options: {
                        format: 'DD-MMM-YYYY'
                    }
                },
                align: 'center'
            },
            {
                header: 'Shift',
                name: 'shift',
                width: 50,
                align: 'center'
            },
            {
                header: 'Prénom',
                name: 'nom',
                align: 'center',
            },
            {
                header: 'M-CODE',
                name: 'm_code',
                align: 'center'
            },
            {
                header: 'Projet',
                name: 'code',
                renderer: {
                    type: ProjectRenderer
                },
                align: 'center',
            },
            {
                header: 'Motifs',
                name: 'motif',
                align: 'center'
            },
            {
                header: 'Début',
                name: 'date_start',
                renderer: {
                    type: DateFormatRenderer,
                    options: {
                        format: 'DD/MM/YYYY'
                    }
                },
                align: 'center',
                editor: "datePicker"
            },
            {
                header: 'Fin',
                name: 'date_end',
                renderer: {
                    type: DateFormatRenderer,
                    options: {
                        format: 'DD/MM/YYYY'
                    }
                },
                align: 'center',
                editor: "datePicker"
            },
            {
                header: 'Avis chef de projet',
                name: 'validationTL',
                renderer: {
                    // type: AvisRendererTL,
                },
                align: 'center'
            },
            {
                header: 'Avis ROP',
                name: 'validationROP',
                renderer: {
                    // type: AvisRendererROP,
                },
                align: 'center'
            },
            {
                header: 'Avis RH',
                name: 'validationRH',
                renderer: {
                    // type: AvisRendererRH,
                },
                align: 'center'
            },
            {
                header: 'Observation',
                name: 'duration',
                renderer: {
                    // type: ObservationRenderer,
                },
                formatter: function({ row }) {
                    const { duration, type } = row;
                    return `${duration}j ${type ? getFrPrefix(type).toLowerCase() : ''}`
                },
                align: 'left'
            },
        ],
        columnOptions: {
            resizable: true
        },
        data: {
            api: {
                readData: { url: '/api/leave-requests ', method: 'GET', then: data => console.log(data) },
                createData: { url: '/api/createData', method: 'POST' },
                updateData: { url: '/api/updateData', method: 'PUT' },
                modifyData: { url: '/api/modifyData', method: 'PUT' },
                deleteData: { url: '/api/deleteData', method: 'DELETE' }
            }
        },
        rowClassName: (row) => {  
            console.log(row)
            return row.someCondition ? 'highlight-row' : '';  
        }  
    });

    function getFrPrefix(text) {
        // Define vowels in French
        const vowels = ['a', 'e', 'i', 'o', 'u', 'y', 'é', 'è', 'ê', 'à', 'ù', 'ï', 'î', 'ô'];
    
        // Trim any leading spaces and convert to lowercase to avoid case sensitivity
        const firstLetter = text.trim().charAt(0).toLowerCase();
    
        // Check if the first letter is a vowel
        if (vowels.includes(firstLetter)) {
            return `d'${text}`;
        } else {
            return `de ${text}`;
        }
    }

    // Add an event listener for cell value changes
    grid.on('afterChange', (event) => {
        event.changes.forEach(change => {
            console.log(`Cell changed - row: ${change.rowKey}, column: ${change.columnName}, new value: ${change.value}`);
            const rowKey = grid.getFocusedCell().rowKey
            console.log(rowKey)
        // Add your custom logic here
        // For example, update the UI or trigger some actions when the value changes
        });
    });


    // Fetch initial data
    let date = new Date();
    fetchData(date.getMonth(), date.getFullYear());
    $('#year').val(date.getFullYear());
    $('#month').val(date.getMonth() + 1);
    
    // instance.resetData(newData); // Call API of instance's public method

    // tui.Grid.applyTheme('striped'); // Call API of static method
    
    function searchGrid() {  
        const searchValue = document.getElementById('searchInput').value.toLowerCase();  
        const filteredData = Data.filter(item =>   
            item.m_code.toLowerCase().includes(searchValue) ||   
            item.nom.toLowerCase().includes(searchValue)  
        );  
        grid.resetData(filteredData);  
    }  

    function filterSearch() {
        let month = Number($('#month').val()) - 1;
        let year = ($('#year').val());
        fetchData(month, year);
    }

    // Event listener for search input  
    document.getElementById('searchInput').addEventListener('input', searchGrid);  
    document.getElementById('month').addEventListener('change', filterSearch);  
    document.getElementById('year').addEventListener('change', filterSearch);  

})