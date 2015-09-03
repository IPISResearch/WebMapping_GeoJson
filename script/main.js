var map;
var dataset = {};
var Templates={};
var baseLayer={};

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

        MapService.init();
        SearchService.init();
        UI.init();
    });
}

