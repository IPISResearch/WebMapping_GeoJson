var Config = (function() {

    var self = {};

    self.IPIS_API_URL = "http://ipis.annexmap.net/api/";
    self.IPIS_API_KEY = "demo";

    self.diclaimerURL = "disclaimer.html";
    self.templateURL = "templates.html";
    self.showArmy = true;
    self.showVisitYears = true;
    self.usePass = true;

    if (MAPCONTEXT == "SAESSCAM"){
        self.diclaimerURL = "disclaimer_saesscam.html";
        self.templateURL = "templates_saesscam.html";
        self.showArmy = false;
        self.usePass = false;
        self.showVisitYears = false;
        self.IPIS_API_URL = "http://www.saesscam.cd/SAESSCAM/app/api/";
        //self.IPIS_API_URL = "http://192.168.0.130/www/SAESSCAM/api/";
    }

    self.getIPISAPIurl = function(endpoint){
        if (MAPCONTEXT == "SAESSCAM"){
            if (endpoint.indexOf("cod/")==0) endpoint = endpoint.substr(4);
            return self.IPIS_API_URL + "data/map/" + endpoint;
        }else{
            return self.IPIS_API_URL + "data/" + endpoint + "?key=" + self.IPIS_API_KEY;
        }

    };

    // starting point for map
    var mapCoordinates = {
        x: -0.65,
        y: 22,
        zoom: 6
    };



    return self;
}());