
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
    
        return {
            ...item,
            ...validationObj
        };
    });
    
    function fetchData(page) {
        fetch(`/api/leave-requests?page=${page}&size=10`)
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
    
    const DateEditor = {
        type: 'custom',
        options: {
            editorConstructor: function(props) {
                const input = document.createElement('input');
                input.type = 'date';
                input.value = props.value || '';
                input.addEventListener('change', function() {
                    props.onChange(input.value);
                });
                return input;
            },
            getValue: function() {
                return this.el.value;
            }
        }
    };

    const grid = new tui.Grid({
        el: $('#grid').get(0), // Container element
        scrollX: false,
        scrollY: false,
        minBodyHeight: 30,
        // rowHeaders: ['rowNum'],
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
                        format: 'DD-MMM.-YYYY'
                    }
                },
                align: 'center'
            },
            {
                header: 'Shift',
                name: 'shift',
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
                name: 'status',
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
        ],
        columnOptions: {
            resizable: true
        },
        data: {
            api: {
                readData: { url: '/api/leave- ', method: 'GET', then: data => console.log(data) },
                createData: { url: '/api/createData', method: 'POST' },
                updateData: { url: '/api/updateData', method: 'PUT' },
                modifyData: { url: '/api/modifyData', method: 'PUT' },
                deleteData: { url: '/api/deleteData', method: 'DELETE' }
            }
        }
    });


    // Fetch initial data
    fetchData(1);
    
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

    // Event listener for search input  
    document.getElementById('searchInput').addEventListener('input', searchGrid);  

})