
document.addEventListener('DOMContentLoaded', async function() {
    // const res = await fetch('/api/leave-requests');
    // const data = await res.json();
    

    function fetchData(page) {
        console.log('fu')
        fetch(`/api/leave-requests?page=${page}&size=10`)
            .then(response => response.json())
            .then(data => {
                grid.resetData(data.data); // Update grid with fetched data
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
    
    class AvisRenderer {
        constructor(props) {
            this.el = document.createElement('span');
            this.render = debounce(this.render.bind(this), 100);
            this.hasRendered = false; // Flag to track initial render
            this.initialRender(props)
        }

        getElement() {
            return this.el;
        }

        initialRender(props) {
            if (this.hasRendered) return;

            const { value, grid, rowKey, columnInfo } = props;
            const { target, userId } = columnInfo.renderer.options;
            
            const single = value.find(v => v.user.occupation === target || v.user._id ===  userId);
            if (!single) return;
            // Use the column's alignment property, defaulting to center
            this.el.innerHTML = `${single.approbation ? '' : single.comment}`;

            this.hasRendered = true;
        }

        render() {

        }
    }
    

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
                align: 'center'
            },
            {
                header: 'M-CODE',
                name: 'm_code',
                align: 'center'
            },
            {
                header: 'Projet',
                name: 'motif',
                align: 'center'
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
                align: 'center'
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
                align: 'center'
            },
            {
                header: 'Avis chef de projet',
                name: 'validation',
                renderer: {
                    type: AvisRenderer,
                    options: {
                        target: 'Surveillant'
                    }
                },
                align: 'center'
            },
            {
                header: 'Avis ROP',
                name: 'validation',
                renderer: {
                    type: AvisRenderer,
                    options: {
                        target: 'Opération',
                        userId: '64954ef126461078597606cd', /*id safidy surveillant*/
                    }
                },
                align: 'center'
            },
            {
                header: 'Avis RH',
                name: 'validation',
                renderer: {
                    type: AvisRenderer,
                    options: {
                        target: 'Admin'
                    }
                },
                align: 'center'
            }
        ],
        columnOptions: {
            resizable: true
        },
        data: {
            api: {
                readData: { url: '/api/leave-requests', method: 'GET', then: data => console.log(data) },
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

})