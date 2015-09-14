var map;
var dataset = {};
var Templates={};
var baseLayer={};


var translations = {
    miningSites : "Sites miniers",
    tradeCentres : "Points de vente",
    tradeCentre : "Point de vente",
    sites: "Site(s)",
    armypresent: "Présence armée constatée",
    armynotpresent : "pas de présence armée constatée",
    armypresentinfo : "Présence armée",
    mineral: "Minerai",
    mineral2 : "Minerai 2",
    mineralsSold : "Minerais vendus",
    dateOfVisit : "Date visite",
    state : "Province",
    domain : "Territoire",
    collective: "Collectivité",
    group: "Groupement",
    village: "Village",
    amountWorkers : "Nombre de creuseurs",
    amountWells : "Nombre de puits",
    frequencyOfPassage : "Fréquence de présence",
    yesNo : "O/N",
    siteControl : "Contrôle(s) exercé(s) sur site",
    seenOnSite : "constaté sur site",
    taxation : "taxation",
    forcedSales : "achats forcés",
    forcedWorkers : "travaux forcés",
    miniralSales : "achètent des minerais",
    ownDigging : "creusent eux-mêmes",
    mainStateLocations : "Lieux de provenance<br>principaux",
    validation : "Qualification",
    long : "Longitude",
    lat : "Latitude",
    origine : "Origine",
    forcedSalesMinerais : "vente ou achat forcé de minerais",
    forcedSalesAutres : "autres ventes ou achats forcés",
    source : "Source",
    amethyst: "Améthiste",
    cassiterite: "Cassitérite",
    coltan: "Coltan",
    copper: "Cuivre",
    diamond: "Diamant",
    gold: "Or",
    monazite: "Monazite",
    tourmaline: "Tourmaline",
    wolframite: "Wolframite",
    zzz_other: "Autre",
    workergroup1: "< 50 mineurs",
    workergroup2: "> 50 mineurs",
    workergroup3: "> 500 mineurs",
    armya_local:"Group armé local",
    armyb_foreign:"Groupe armé étranger",
    armyc_fardc:"FARDC",
    armyd_fardcred:"Militaires indisciplinés",
    armyz_none:"Pas de présence armée constatée"
};



// the version number gets appended to all urls to force an update
var version = "14";
var cookieName = "disclaimerL14";

// the password to access this map is in a semi public report.
// reading the report is less work then reading this source code, no ?
var usePass = true;

$(document).ready(function(){

    if (usePass){
        var hasPass = readCookie("pass" + cookieName);
        if (hasPass){
            initApp();
        }else{
            UI.showLogin();
        }
    }else{
        initApp();
    }

});

function initApp(){
    UI.hideLogin();
    UI.showMap();
    var hasReadDisclaimer = readCookie(cookieName);
    if (hasReadDisclaimer){

    }else{
        UI.showInfo(true);
        createCookie(cookieName,true,100);
    }

    // load templates first, needed for Map build up.
    $.get('templates/templates.html?v' + version, function(templates) {
        $.each($(templates + " script"),function(index,template){
            Templates[template.id] = template.innerHTML;
        });

        UI.initData(function(){
            MapService.init();
            SearchService.init();
            UI.init();
        })
    });
}

