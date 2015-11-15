var Config = (function() {

    var self = {};

    self.IPIS_API_URL = "http://ipis.annexmap.net/api/";
    self.IPIS_API_KEY = "demo";

    self.diclaimerURL = "disclaimer.html";
    self.templateURL = "templates.html";
    self.showArmy = true;

    var isSAESSCAM = true;

    if (isSAESSCAM){
        self.diclaimerURL = "disclaimer_saesscam.html";
        self.templateURL = "templates_saesscam.html";
        self.showArmy = false;
    }


    self.getIPISAPIurl = function(endpoint){
        return self.IPIS_API_URL + "data/" + endpoint + "?key=" + self.IPIS_API_KEY;
    };

    // starting point for map
    var mapCoordinates = {
        x: -0.65,
        y: 22,
        zoom: 6
    };



    return self;
}());