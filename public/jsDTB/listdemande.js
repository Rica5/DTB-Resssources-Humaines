
// method to fetch list of requests
function fetchList(month) {
    let year = $("#year").val();

    $(".list-group > li").each((i, li) => $(li).removeClass('active'));
    $(`#li-${month}`).addClass('active');

    fetch(`/filterLeaveRequest?month=${month}&year=${year}`)
    .then(async res => {
        const {ok, data} = await res.json();
        // var don = data.filter(m => m.m_code == "M-SE" && m.date_start == "2024-09-30")
        // console.log("done", don);
        
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

function getProjects(code){
    var theUser = users.find(employe => employe.m_code == code);
    
    return theUser ? theUser.project : ""
}

function filterDemandeTrait() {
    var mcodeDemandeTraite = $("#mcodeDemandeTraite").val().toUpperCase()
    var shiftDemandeTraite = $("#shiftDemandeTraite").val().toUpperCase()
    var projetDemandeTraite = $("#projetDemandeTraite").val().toUpperCase()
    $("#allRequests > div").each((index,div)=>{
        var item = $(div)
        var mcode = item.attr("m-code");
        var shift = item.attr("shift");
        var projet = item.attr("project");

        if (mcode.includes(mcodeDemandeTraite) && shift.includes(shiftDemandeTraite) && projet.includes(projetDemandeTraite)) {
            item.attr("style", "display:flex")
            
        }else{
            item.attr("style", "display:none")

        }
        
    })
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
      let projects = getProjects(code)
      
    return `
    <div id="${leave._id}" class="content-leave" m-code="${leave.m_code}" shift="${leave.shift}" project="${projects}">
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
                            <span>Shift: ${leave.shift}</span>
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
                            <span>${moment().add(-1,"years").format("YYYY")}: ${leave.rest}</span>
                            <span>${moment().format("YYYY")}: ${(leave.acc - leave.rest)}</span>
                            <span>Reste après autorisation: ${(leave.acc)}</span>
                        </div>
                    </div>
                </div> 
                <div class="date-heure">
                    <div class="ask-content">
                        <h1>
                            <i class="fa-solid fa-calendar"></i>
                            Projet de ${code}
                        </h1>
                        <div class="ask">
                            <span>${getProjects(code)}</span>
                        </div>
                    </div>
                </div> 
                <div class="date-heure">
                    <div class="ask-content">
                        <h1>
                            <i class="fa-solid fa-calendar"></i>
                            Décision de la direction
                        </h1>
                        <div class="ask">
                        
                                ${leave.conge_payer !== 0 ? `<div><span> A déduire s/ congés payés : </span> <span> ${leave.conge_payer} jours</span> </div>` : ''}
                                ${leave.deduire_sur_salaire !== 0 ? `<div><span>A déduire s/ salaire : </span> <span> ${leave.deduire_sur_salaire} jours </span></div>` : ''}
                                ${leave.permission_exceptionnelle !== 0 ? `<div><span>Permission exceptionnelle :</span> <span>  ${leave.permission_exceptionnelle} jours</span></div>` : ''}
                                ${leave.rien_a_deduire !== 0 ? `<div><span>Rien à déduire :</span> <span>  ${leave.rien_a_deduire} jours</span></div>` : ''}
                               
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