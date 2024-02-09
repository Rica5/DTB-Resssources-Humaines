
function openNotif(button) {
    let notif_div = document.querySelector('.notification-modal');
    console.log(notif_div)
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
        console.log(buttons)

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
    var notif = "";
    for (i = 0; i < all_notifications.length; i++) {
      let notification = all_notifications[all_notifications.length - (i + 1)];
      if (
        i != 8 &&
        notification != ""
      ) {
          notif += `
          <div id="${i}" class="notification-item seen">
            <div class="d-flex items-center gap-3">
              <span class="btn btn-warning btn-circle d-flex align-items-center justify-content-center">
                <i class="mdi mdi-bell text-white"></i>
              </span>
              <div>
                <h1>${notification.title}</h1>
                <p class="message">${notification.message}</p>
                <div class="date-time">
                  <span>${notification.date}</span>
                </div>
              </div>
          </div>`
      } else {
        break;
      }
    }
    document.getElementById("notifContent").innerHTML = notif;
    if (all_notifications[0] != "") {
      document.getElementById("nbr-notif").innerHTML =
        all_notifications.length;
    } else {
      document.getElementById("nbr-notif").innerHTML =
        all_notifications.length - 1;
    }
  }