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
    amethyst: "Améthyste",
    cassiterite: "Cassitérite",
    ca: "Cassiterite",
    coltan: "Coltan",
    ta: "Coltan",
    copper: "Cuivre",
    cu: "Cuivre",
    diamond: "Diamant",
    da: "Diamant",
    gold: "Or",
    or: "Or",
    monazite: "Monazite",
    tourmaline: "Tourmaline",
    wolframite: "Wolframite",
    wo: "Wolframite",
    manganese: "Manganèse",
    galena: "Galène",
    pyrite: "Pyrite",
    silver: "Argent",
    ar: "Argent",
    digenite: "Digénite",
    garnet: "Grenat",
    zzz_other: "Autre",
    zz: "Autre",
    workergroup1: "< 50",
    workergroup2: "> 50",
    workergroup3: "> 500",
    armya_local:"Groupe armé local",
    armyb_foreign:"Groupe armé étranger",
    armyc_fardc:"FARDC",
    armyd_fardcred:"Militaires indisciplinés",
    armyz_none:"Pas de présence armée constatée",
    month01:"janvier",
    month02:"février",
    month03:"mars",
    month04:"avril",
    month05:"mai",
    month06:"juin",
    month07:"juillet",
    month08:"août",
    month09:"septembre",
    month10:"octobre",
    month11:"novembre",
    month12:"décembre",
    titreType_PR: "Permis de recherche",
    titreType_PE: "Permis d'exploitation",
    titreType_ZEA: "Zones d'exploitation artisanale",
    titreType_ZIN: "Zones interdites",
    color_amethyst: "#9966CB",
    color_gold: "#DAA520",
    color_or: "#DAA520",
    color_wolframite: "#8b5928",
    color_wo: "#8b5928",
    color_coltan: "#1E90FF",
    color_ta: "#1E90FF",
    color_monazite: "#9cc6de",
    color_tourmaline: "#006600",
    color_diamond: "#FFDEAD",
    color_da: "#FFDEAD",
    color_cassiterite: "#FFA07A",
    color_ca: "#FFA07A",
    color_copper: "#C87533",
    color_cu: "#C87533",
    color_manganese: "#ed79d2",
    color_galena: "#8098a3",
    color_silver: "#C0C0C0",
    color_ar: "#C0C0C0",
    color_digenite: "#09183a",
    color_pyrite: "#dce69e",
    color_garnet: "#660820",
    color_zz: "#666666",
};

var filterCode = {
    "amethyst" : "am",
    "cassiterite" : "ca",
    "coltan": "ta",
    "copper": "cu",
    "diamond": "dia",
    "digenite" : "dig",
    "galena" : "gal",
    "garnet" : "gar",
    "gold": "au",
    "monazite": "mo",
    "pyrite" : "py",
    "silver" : "ag",
    "tourmaline": "tou",
    "wolframite" : "wo",
    "workergroup1" : "50less",
    "workergroup2" : "50plus",
    "workergroup3" : "500plus",
};

// the version number gets appended to all urls to force an update
var version = "27";
var cookieName = "disclaimerL14";

$(document).ready(function(){

    // the password to access this map is in a semi public report.
    // reading the report is less work then reading this source code, no ?

    if (Config.usePass){
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

        // auto close in 30 seconds
        setTimeout(function(){
            if ($("#infobox").is(":visible")){
                $("#infolayer").click();
            }
        },30000)
    }

    // load templates first, needed for Map build up.
    $.get('templates/'+Config.templateURL+'?v' + version, function(templates) {
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

