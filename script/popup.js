var POPUP = (function() {

    var numberCodes = {
        1: "Creuser à ciel ouvert",
        2: "Creuser dans des puits ou galeries",
        3: "Plonger",
        4: "Transporter",
        5: "Laver",
        6: "Vendre",
        99: "Autre"
    };

    var numberCodesPhone = {
        1: "Airtel",
        2: "Vodacom",
        3: "Tigo",
        4: "Orange",
        5: "Africell",
        99: "Autre"
    };

    var numberCodesWork = {
        1: "Creuser à ciel ouvert",
        2: "Creuser dans des puits ou galeries",
        3: "Plonger",
        4: "Transporter",
        5: "Laver",
        6: "Vendre",
        99: "Autre"
    };

    var popupTabConfig = {
        "tab_images" : {
            title: "Photo",
            dataSet: "imageUrl",
            template: "popuptab_images"
        },
        "tab_armed_presence" : {
            title: "Présence armée",
            dataSet: "armed_presence",
            defaultValue: "Pas de présence armée constatée",
            template: "popuptab_army_presence",
            sort: true,
            hasYears: true
        },
        "tab_state_service" : {
            title: "Services",
            dataSet: "state_service",
            defaultValue: "Pas de présence des services constatée",
            template: "popuptab_state_service",
            sort: true,
            hasYears: true
        },
        "tab_women_children" : {
            title: "Femmes et enfants",
            dataSet: "women_children",
            defaultValue: "Pas de données",
            defaultValue2: "Pas de présence des femmes et enfants constatée",
            decodeField: {"womenwork": numberCodesWork,"child1518work": numberCodesWork},
            template: "popuptab_women_children",
            hasYears: true
        },
        "tab_phone_coverage" : {
            title: "Couverture téléphone",
            dataSet: "phone_coverage",
            defaultValue: "Pas de données",
            defaultValue2: "Pas de présence des couverture téléphone",
            decodeField: {"site": numberCodesPhone},
            template: "popuptab_phone_coverage",
            hasYears: true
        }
    };



    var activeTab;

    function renderPopupTab(tabId){

        activeTab = tabId;
        var tabConfig = popupTabConfig[tabId];

        var popupTab = $(".popuptab");
        popupTab.find("h3").html(tabConfig.title);
        var tabContainer = popupTab.find(".popuptabyears").empty();
        var container = popupTab.find(".popuptabcontent").empty();

        popupData = MapService.getCurrentPopupData();
        if (popupData){
            var data = popupData[tabConfig.dataSet];
            if (data){

                if (tabConfig.hasYears){
                    var tabs = renderPopupSelectionTabs(data);
                    tabContainer.html(tabs.html);

                    var content;
                    if (tabs.years.length>0){
                        content = renderPopupYear(tabs.years[0].year)
                    }else{
                        content = Mustache.render(Templates["popuptab_empty"],tabConfig);
                    }
                }else{
                    content = Mustache.render(Templates[tabConfig.template],data);
                }

                container.html(content);

            }
        }
    }

    function renderPopupSelectionTabs(data){
        var years = [];
        var hasYear = {};
        for (var i = 0, len = data.length; i<len; i++){
            var year = data[i].datasource;
            //console.warn(year);
            if (data[i].source == "mq") {
                //year = year - 2000;
            }


            if (year && ! hasYear[year]){
                var label = parseInt(year);
                if (year.indexOf("qualification")>0) label += " Qualification";

                //if (year<1000) label = "Qualification " + year;

                //if (data[i].source == "mq") {
                 //   label = "Qualification " + year;
                    //logYear = logYear + "_q";
                //}

                //console.warn(logYear );

                years.push({year: year, label: label});
                hasYear[year] = true;
            }
        }
        years.sort(function(a, b){return b.year > a.year});
        if (years.length>0) years[0].first = true;
        var html = Mustache.render(Templates["popuptab_years"],years);

        return {
            years: years,
            html: html
        }
    }

    function renderPopupYear(year){
        //year = parseInt(year);
        console.warn("rendering year " , year);
        var container = $(".popuptabcontent").empty();

        var popupData = MapService.getCurrentPopupData();
        var tabConfig = popupTabConfig[activeTab];

        if (popupData && tabConfig){
            var data = popupData[tabConfig.dataSet];
            if (data){
                if (parseInt(year) == year){
                    data = getDataByYear(data,year);
                }else{
                    data = getDataByDataSource(data,year);
                }

                data.isPDV = popupData.isPDV;

                if (tabConfig.sort) data.sort(function(a, b){return a.orderField - b.orderField});

                if (tabConfig.decodeField){
                    for (var key in tabConfig.decodeField) {
                        if (tabConfig.decodeField.hasOwnProperty(key)) {

                            if (data[0][key]){
                                var values = tabConfig.decodeField[key];
                                var decoded = data[0][key].split(" ");
                                for (var i = decoded.length-1; i>=0; i--){
                                    var val = decoded[i];
                                    if (values[val]) decoded[i] = values[val];
                                }
                                var decodedResult = decoded.join(", ");
                                decodedResult = decodedResult.split(",,").join(",");
                                data[0][key] = decodedResult;
                            }
                        }
                    }
                }

                var template = Templates[tabConfig.template];
                if (template){
                    container.html(Mustache.render(template,data));
                }else{
                    console.error("Warning: template for dataset " + tabConfig.dataSet + " not found");
                }
            }
        }
    }

    function activatePopupYear(elm,year){
        $(elm).siblings(".tab").removeClass("active");
        $(elm).addClass("active");
        renderPopupYear(year);
    }

    function getDataByYear(data,year){
       var result = [];

        for (var i = 0, len = data.length; i<len; i++){
            if (data[i].year && parseInt(data[i].year) == year){
                result.push(data[i]);
            }
        }

        return result;
    }

    function getDataByDataSource(data,year){
        var result = [];

        for (var i = 0, len = data.length; i<len; i++){
            if (data[i].datasource && data[i].datasource == year){
                result.push(data[i]);
            }
        }

        return result;
    }

    return{
        renderPopupTab: renderPopupTab,
        activatePopupYear: activatePopupYear
    }

}());
