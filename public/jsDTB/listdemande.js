
// method to fetch list of requests
function fetchList(month) {
    let year = $("#year").val();

    $(".list-group > li").each((i, li) => $(li).removeClass('active'));
    $(`#li-${month}`).addClass('active');

    fetch(`/filterLeaveRequest?month=${month}&year=${year}`)
    .then(async res => {
        const {ok, data} = await res.json();
        console.log(data)
        if (ok)
            renderLeaveRequests(data);
    })
    .catch(err => console.log(err))
    .finally(() => {
        // stop loading
    });
}

function renderLeaveRequests(data = []) {
    $('#allRequests').html(renderAllRequest(data));
}


function renderAllRequest(Leave){
    let mappedLeave = Leave.map(leave => {
        userActive = users.find(user => user.m_code == leave.m_code)

        
      let code = leave.m_code;
      let acc = userActive.leave_taked;
      let rest = userActive.remaining_leave
      let duration = leave.duration
      let auth = userActive.leave_stat
      let save = userActive.save_at
    return `
    <div id="${leave._id}" class="content-leave">
            <div class="code-person p_${leave.leavePriority}">
                <div>
                    <p id="codeUser" class="code-text">${leave.m_code}</p>
                    <p class='text-duration'>${leave.duration} ${leave.duration > 1 ? "jours" : "jour"}</p>
                    <div> 
                    <p class="priority">${leave.priorityValue}</p>
                    </div>
                </div>
            </div>
            <div class="leave-infos">
                <p id="motif" class="text-center">Motif: ${leave.motif}</p>
                ${
                    leave.recovery.trim().length > 0 ? `<p id="motif" class="text-center">Récupération: ${leave.recovery}</p>` : ''
                }
                <div class="date-heure">
                    <div class="ask-content">
                        <h1>
                            <i class="fa-solid fa-calendar"></i>
                            Demandeur
                        </h1>
                        <div class="ask">
                            <span>Nom: ${leave.nom}</span>
                            <span>Shift: ${getShift(leave.m_code)}</span>
                            <span>Matricule: ${leave.matr}</span>
                        </div>
                    </div>
                </div>
                <div class="date-heure">
                    <div class="d">
                        <h1>
                            <i class="fa-solid fa-calendar"></i>
                            Date
                        </h1>
                        <div>
                            <span>Début:</span>
                            <span>${convertDate(leave.date_start)}</span>
                        </div>
                        <div>
                            <span>Fin:</span>
                            <span>${convertDate(leave.date_end)}</span>
                        </div>
                    </div>
                    <div class="h">
                        <h1>
                            <i class="fa-solid fa-clock"></i>
                            Heure
                        </h1>
                        <div>
                            <span>Début:</span>
                            <span> ${leave.hour_begin}</span>
                        </div>
                        <div>
                            <span>Fin:</span>
                            <span> ${leave.hour_end}</span>
                        </div>
                    </div>
                </div>
                
                <div class="date-heure">
                    <div class="ask-content">
                        <h1>
                            <i class="fa-solid fa-calendar"></i>
                            Status / solde de ${code}
                        </h1>
                        <div class="ask">
                            <span>${moment().add(-1,"years").format("YYYY")}: ${rest}</span>
                            <span>${moment().format("YYYY")}: ${(acc - rest)}</span>
                            <span>Reste après autorisation: ${(acc - duration)}</span>
                        </div>
                    </div>
                </div> 
                    
                ${approvingList(leave.validation, leave._id)}
                ${
                    leave.validation.filter(v => !v.approbation).length > 0 ?
                    `<div>
                        <p style="text-decoration:underline;">Commentaires:</p>
                        <ul>
                        ${leave.validation.map(v => (
                            !v.approbation ?
                                `<li>${v.user.usuel}: <span class="text-danger">${v.comment}</span></li>`
                            : ""
                        )).join('')}
                        </ul>
                    </div>`
                    :
                    ""
                }
            </div>
        </div>
    `
    });

    return mappedLeave.join('');
}


function getShift(code){
    var shift = ["SHIFT 1","SHIFT 2","SHIFT 3"];
    var value = ""
    var theUser = users.filter(employe => employe.m_code == code);
    shift.includes(theUser.shift) ? value = theUser.shift : value = "08 heures";
    return value
}


function convertDate(given){
    return moment(given).format("DD/MM/YYYY")
}

function approvingList(all, id){
    var lists = "";
    all.forEach(element => {
        if (element.approbation) {
            lists += `<span><i class="fa-solid fa-circle-check""></i> ${element.user.usuel}</span>`
        } else {
            lists += `<span><i  style="color: red;" class="fa-solid fa-times-circle"></i> ${element.user.usuel}</span>`
        }
    });
    
    return `<div class="d-flex approving-list">${lists}</div> <input type="hidden" id="val-${id}" value="${all.map(u => u.user._id).join('|')}"  />`
}

fetchList('');