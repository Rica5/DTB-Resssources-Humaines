//For working.html
var citationsMotivantes = [
    "La persévérance est la clé du succès.",
    "Travaille dur en silence, laisse le succès faire du bruit.",
    "Le succès n'est pas un accident. C'est du travail acharné, de la persévérance, de l'apprentissage, de l'étude, du sacrifice et, surtout, de l'amour de ce que vous faites.",
    "Le secret pour réussir est de commencer.",
    "Ne regardez pas l'horloge ; faites ce qu'elle fait. Continuez.",
    "Le succès n'est pas la clé du bonheur. Le bonheur est la clé du succès. Si vous aimez ce que vous faites, vous réussirez.",
    "La seule façon d'atteindre l'impossible est de croire que c'est possible.",
    "Ne reporte pas à demain ce que tu peux faire aujourd'hui.",
    "Si tu veux réussir, apprends à aimer l'effort.",
    "Le travail acharné bat le talent quand le talent ne travaille pas dur.",
    "Chaque petit travail acharné d'aujourd'hui est un gros résultat de demain.",
    "Le succès n'est pas donné, il est gagné.",
    "N'attendez pas l'opportunité, créez-la.",
    "La seule manière de faire du bon travail est d'aimer ce que vous faites.",
    "Chaque jour est une nouvelle opportunité de changer votre vie.",
    "Ne rêvez pas de succès, travaillez pour cela.",
    "Le succès ne se mesure pas à la distance que vous avez parcourue, mais aux obstacles que vous avez surmontés sur votre chemin.",
    "Soyez tellement occupé à améliorer vous-même que vous n'avez pas le temps de critiquer les autres.",
    "Le plus dur n'est pas de faire le premier pas, mais de décider de le faire.",
    "L'avenir dépend de ce que vous faites aujourd'hui.",
    "Si vous voulez réaliser quelque chose que vous n'avez jamais eu, vous devez faire quelque chose que vous n'avez jamais fait.",
    "Le succès est la somme de petits efforts répétés jour après jour.",
    "N'ayez pas peur d'aller lentement, ayez peur de vous arrêter.",
    "Les obstacles sont ces choses effrayantes que vous voyez lorsque vous détournez les yeux de votre objectif.",
    "Il n'y a pas d'ascenseur pour le succès, vous devez prendre les escaliers.",
    "Les rêves ne fonctionnent que si vous le faites.",
    "L'excellence est un art gagné par la formation et l'habitude. Nous n'excellons pas parce que nous avons la vertu ou la qualité, mais plutôt parce que nous avons agi de manière répétée. Nous sommes ce que nous faisons de manière répétée. L'excellence, alors, n'est pas un acte mais une habitude.",
    "Rien n'est impossible, le mot lui-même dit 'je suis possible'.",
    "Ne regardez pas en arrière, vous n'allez pas de cette façon.",
    "Si vous voulez que quelque chose soit fait, donnez-le à quelqu'un qui est occupé.",
    "Rien de grand n'est jamais réalisé sans enthousiasme.",
    "Les opportunités n'arrivent pas. Vous les créez.",
    "On ne devient pas riche en travaillant pour quelqu'un d'autre.",
    "L'avenir appartient à ceux qui croient en la beauté de leurs rêves.",
    "Il vaut mieux hasarder que de rester dans l'incertitude.",
    "Le succès est une science ; si vous avez les conditions, vous obtiendrez le résultat.",
    "Le succès est de tomber neuf fois et de se relever dix.",
    "Le succès ne consiste pas à ne jamais échouer, mais à ne jamais abandonner.",
    "Le succès, c'est d'aller d'échec en échec sans perdre son enthousiasme.",
    "Il n'y a pas de raccourci pour un endroit qui vaut la peine d'être atteint.",
    "La meilleure façon de prédire l'avenir est de le créer.",
    "Le succès est la somme de petits efforts répétés jour après jour.",
    "N'attendez pas l'opportunité, créez-la.",
    "La seule manière de faire du bon travail est d'aimer ce que vous faites.",
    "Chaque jour est une nouvelle opportunité de changer votre vie.",
    "Ne rêvez pas de succès, travaillez pour cela.",
    "Le succès ne se mesure pas à la distance que vous avez parcourue, mais aux obstacles que vous avez surmontés sur votre chemin.",
    "Soyez tellement occupé à améliorer vous-même que vous n'avez pas le temps de critiquer les autres.",
    "Le plus dur n'est pas de faire le premier pas, mais de décider de le faire.",
    "L'avenir dépend de ce que vous faites aujourd'hui.",
    "Si vous voulez réaliser quelque chose que vous n'avez jamais eu, vous devez faire quelque chose que vous n'avez jamais fait.",
    "Le succès est la somme de petits efforts répétés jour après jour.",
    "N'ayez pas peur d'aller lentement, ayez peur de vous arrêter.",
    "Les obstacles sont ces choses effrayantes que vous voyez lorsque vous détournez les yeux de votre objectif.",
    "Il n'y a pas d'ascenseur pour le succès, vous devez prendre les escaliers.",
    "Les rêves ne fonctionnent que si vous le faites.",
    "L'excellence est un art gagné par la formation et l'habitude. Nous n'excellons pas parce que nous avons la vertu ou la qualité, mais plutôt parce que nous avons agi de manière répétée. Nous sommes ce que nous faisons de manière répétée. L'excellence, alors, n'est pas un acte mais une habitude.",
    "Rien n'est impossible, le mot lui-même dit 'je suis possible'.",
    "Ne regardez pas en arrière, vous n'allez pas de cette façon.",
    "Si vous voulez que quelque chose soit fait, donnez-le à quelqu'un qui est occupé.",
    "Rien de grand n'est jamais réalisé sans enthousiasme.",
    "Les opportunités n'arrivent pas. Vous les créez.",
    "On ne devient pas riche en travaillant pour quelqu'un d'autre.",
    "L'avenir appartient à ceux qui croient en la beauté de leurs rêves.",
    "Il vaut mieux hasarder que de rester dans l'incertitude.",
    "Le succès est une science ; si vous avez les conditions, vous obtiendrez le résultat.",
    "Le succès est de tomber neuf fois et de se relever dix.",
    "Le succès ne consiste pas à ne jamais échouer, mais à ne jamais abandonner.",
    "Le succès, c'est d'aller d'échec en échec sans perdre son enthousiasme.",
    "Il n'y a pas de raccourci pour un endroit qui vaut la peine d'être atteint.",
    "La meilleure façon de prédire l'avenir est de le créer."
  ];
// used variables on this file
var w = document.getElementById("w");
var a = document.getElementById("a");
var l = document.getElementById("l");
var s = document.getElementById("s");
var info = document.getElementById("info");
var clock = document.getElementById("time");
var chloc = document.getElementById("locaux");
var ch_heure = document.getElementById("changing_hour");
var hour_today = document.getElementById("hour");
var citation_jour = document.getElementById("citation_jour")
a.disabled = true;
l.disabled = true;
var intervalId;
var title_break = document.getElementById("title_break");
var advice_for_you = document.getElementById("advice_for_you");
var break_advice = [
    "Des pauses courtes peuvent aider à maintenir la concentration et la productivité. Après une période de travail intense, une courte pause peut revitaliser l'esprit, améliorant ainsi la performance au travail.",
    "Prendre une pause offre l'opportunité de se détendre et de relâcher la tension mentale. Cela peut contribuer à réduire le stress et à prévenir l'épuisement professionnel.",
    "Les pauses permettent à l'esprit de se reposer et peuvent stimuler la créativité. En prenant du recul par rapport à une tâche, vous pourriez revenir avec des idées nouvelles et innovantes.",
    "Se lever, s'étirer et bouger pendant une pause contribue à améliorer la circulation sanguine, à réduire la fatigue musculaire et à prévenir les problèmes de santé liés à la sédentarité.",
    "Les pauses offrent une pause mentale, ce qui peut aider à prévenir l'épuisement mental et à maintenir une santé mentale positive.",
    "Les pauses peuvent également être l'occasion de socialiser avec des collègues. Cela favorise un environnement de travail positif et renforce les relations professionnelles.",
    " La fatigue mentale peut entraîner des erreurs. En prenant des pauses régulières, vous pouvez réduire le risque d'erreurs et maintenir une attention soutenue sur les tâches importantes."
];
var lunch_advice = [
    "Les collations fournissent une source d'énergie entre les repas principaux, ce qui peut aider à maintenir des niveaux d'énergie stables tout au long de la journée. Cela peut être particulièrement bénéfique lors de journées longues de travail.",
    "Une collation équilibrée peut soutenir la concentration et les performances mentales, aidant ainsi à rester productif et attentif aux tâches professionnelles.",
    "Les collations peuvent aider à prévenir les fringales entre les repas, ce qui peut contribuer à éviter une suralimentation excessive lors des repas principaux.",
    "La prise de collations judicieuses peut contribuer au contrôle du poids en évitant une faim excessive qui pourrait entraîner des choix alimentaires moins sains ou une suralimentation.",
    "Manger régulièrement, y compris la prise de collations, peut aider à stimuler le métabolisme et à maintenir une digestion saine.",
    "Les collations peuvent être l'occasion d'ajouter des nutriments importants à votre alimentation, tels que des fruits, des légumes, des noix ou des produits laitiers, qui peuvent manquer dans les repas principaux.",
    "Prendre quelques minutes pour une pause collation peut également servir de pause mentale, aidant à réduire le stress et à favoriser un moment de détente.",
    "Certains aliments, en particulier ceux riches en glucides complexes, peuvent stimuler la sécrétion de sérotonine, contribuant ainsi à améliorer l'humeur et la sensation de bien-être."
]
function getRandomString(array) {
    var randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}
citation_jour.textContent = getRandomString(citationsMotivantes)
var countdown = 0;
var totalTiersDeSeconde = 0;
var startTime = Date.now();

var minutes = document.getElementById("minutes")
var secondes = document.getElementById("secondes")
var tiers = document.getElementById("tiers")

function updateTimer() {
    var tempsEcouléEnTiersDeSeconde = Math.floor((Date.now() - startTime) / 16.67);
    var tempsRestantEnTiersDeSeconde = totalTiersDeSeconde - tempsEcouléEnTiersDeSeconde;
    var minutes_clock = Math.floor(tempsRestantEnTiersDeSeconde / 3600); // 
    var secondes_clock = Math.floor((tempsRestantEnTiersDeSeconde % 3600) / 60); // 
    var tiersDeSeconde = tempsRestantEnTiersDeSeconde % 60;

    minutes.textContent = minutes_clock < 10 ? "0" + minutes_clock : minutes_clock;
    secondes.textContent = secondes_clock < 10 ? "0" + secondes_clock : secondes_clock;
    tiers.textContent = tiersDeSeconde < 10 ? "0" + tiersDeSeconde : tiersDeSeconde;

    if (tempsRestantEnTiersDeSeconde <= 0 ) {
        clearInterval(intervalId);
       intervalId =  setInterval(tolerance,1000)
    }

}
function tolerance(){
    var tempsEcouléEnTiersDeSeconde = Math.floor((Date.now() - startTime) / 16.67);
    var tempsRestantEnTiersDeSeconde = totalTiersDeSeconde - tempsEcouléEnTiersDeSeconde;
    if ((tempsRestantEnTiersDeSeconde / 60) < -300){
        send_notif();
        alert("Vous avez depassé votre temp de pause")
        clearInterval(intervalId)
    }
}
function send_notif() {
    var http = new XMLHttpRequest();
    http.open("POST", "/notify", true);
    http.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );
    http.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        
      }
    };
    http.send("code="+code_user);
  }

function openModal() {
    var continuing = localStorage.getItem('clocking');
    if (continuing){
        startTime  =  continuing
    }
    else {
        startTime = Date.now()
        localStorage.setItem('clocking',startTime);
    }
    totalTiersDeSeconde = countdown * 60 * 60
    document.getElementById("modalForm").style.display = "block";
    intervalId = setInterval(updateTimer, 16.67);
}
function closeModal() {
    localStorage.removeItem('clocking');
    document.getElementById("modalForm").style.display = "none";
    clearInterval(intervalId);
    working();
}
var day = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
//When working is choosed
function workings() {
    a.disabled = false;
    l.disabled = false;
    w.disabled = true;
    s.setAttribute("class", "login10w-form-btn");
    s.innerHTML = "TRAVAILLER";
    chloc.style.display = "none";
    showButtons();
    info.style.display = "block";
    info.innerHTML = "Lieu de travail : " + chloc.value + " " + hour_today.value + " heures <br>" + time_today;
}
function showButtons() {
    w.style.display = "block";
    a.style.display = "block";
    l.style.display = "block";
    ch_heure.style.display = "block";
}
//Choosing Absent 
function aways() {
    w.disabled = false;
    l.disabled = false;
    a.disabled = true;
    s.setAttribute("class", "login10away-form-btn");
    s.innerHTML = "ABSENT(E)";
    chloc.style.display = "none";
    showButtons();
    info.style.display = "block";
    info.innerHTML = "Lieu de travail " + chloc.value + " " + hour_today.value + " heures <br>" + time_today;
}
//Press lefting button
function lefts() {
    w.disabled = false;
    a.disabled = false;
    l.disabled = true;
    chloc.style.display = "block";
    ch_heure.style.display = "none";
    info.style.display = "none";
    chloc.value = "Not defined";
    s.setAttribute("class", "login101-form-btn");
    s.innerHTML = "PARTI";
    w.style.display = "none";
    a.style.display = "none";
    l.style.display = "none";
}
var datetime = null;
