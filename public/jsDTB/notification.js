
function openNotif(button) {
    let notif_div = document.querySelector('.notification-modal');
    let buttons = [...document.querySelectorAll('button.notif-btn')];
    // close modal
    if (button.classList.contains('selected')) {
        buttons.forEach(btn => 
            btn.classList.remove('selected')
        )
        notif_div.classList.replace('show', 'hide');
    } else {
        // open modal
        buttons.map(btn => btn.classList.add('selected'));

        if (notif_div.classList.contains('hide')) {
            notif_div.classList.replace('hide', 'show');
        } else {
            notif_div.classList.add('show');
            console.log('add show')
        }
        
        // click away 
        document.onclick = (e) => {
            // close the notification modal when user click outsite its content
            if (!e.target.closest('.notification-modal') && 
            !e.target.closest('.notif-btn')) {
                buttons.forEach(btn => 
                    btn.classList.remove('selected')
                )
                notif_div.classList.remove('show');
                notif_div.classList.remove('hide');
            }
        }
    }
}


function setnotification(all_notifications) {
  var count = 0;
  var notif = "";
    for (i = 0; i < all_notifications.length; i++) {
      let notification = all_notifications[all_notifications.length - (i + 1)];
        count = count + 1;
        notif += `
        <div id="${notification._id}" class="notification-item seen">
          <div  class="d-flex items-center gap-3">
            <span class="btn btn-warning btn-circle d-flex align-items-center justify-content-center">
              <i class="mdi mdi-bell text-white"></i>
            </span>
            <div>
              <h1>${notification.title}</h1>
              <p class="message">${notification.content}</p>
              <div class="date-time">
                <span>${notification.datetime}</span>
              </div>
            </div>
            </div>
        </div>`  
    }
    document.getElementById("notifContent").innerHTML = notif;
      document.getElementById("nbr-notif").innerHTML = count;
  }
  function pushNotification(theNotif,role){
      var theContent = document.getElementById("notifContent").innerHTML;
      var idNotif = "";
      role == "Gerant" ? idNotif = theNotif.idNotif : idNotif = theNotif.idNotif
      var newNotif = `
      <div id="${idNotif}" class="notification-item seen">
          <div  class="d-flex items-center gap-3">
            <span class="btn btn-warning btn-circle d-flex align-items-center justify-content-center">
              <i class="mdi mdi-bell text-white"></i>
            </span>
            <div>
              <h1>${theNotif.title}</h1>
              <p class="message">${theNotif.content}</p>
              <div class="date-time">
                <span>${theNotif.datetime}</span>
              </div>
            </div>
            </div>
        </div>
      `
      document.getElementById("notifContent").innerHTML = newNotif + theContent;
      document.getElementById("nbr-notif").innerHTML = parseInt(document.getElementById("nbr-notif").innerHTML) + 1;
  }