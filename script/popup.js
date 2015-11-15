var POPUP = (function() {

    var popupTabConfig = {
        "tab_armed_presence" : {
            title: "Présence armée",
            dataSet: "armed_presence",
            defaultValue: "Pas de présence armée constatée",
            template: "popuptab_army_presence",
            sort: true
        },
        "tab_state_service" : {
            title: "Services de l'Etat",
            dataSet: "state_service",
            defaultValue: "Pas de présence des services de l'état constatée",
            template: "popuptab_state_service",
            sort: true
        },
        "tab_women_children" : {
            title: "Femmes et enfants",
            dataSet: "women_children",
            defaultValue: "Pas de données",
            defaultValue2: "Pas de présence des femmes et enfants constatée",
            template: "popuptab_women_children"
        },
        "tab_phone_coverage" : {
            title: "Couverture téléphone",
            dataSet: "phone_coverage",
            defaultValue: "Pas de données",
            defaultValue2: "Pas de présence des couverture téléphone",
            template: "popuptab_phone_coverage"
        }
    };

    var numberCodes = {
        1: "Creuser à ciel ouvert",
        2: "Creuser dans des puits ou galeries",
        3: "Plonger",
        4: "Transporter",
        5: "Laver",
        6: "Vendre",
        99: "Autre"
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
            console.error("dataset",tabConfig.dataSet);
            console.error("data",data);
            if (data){
                var tabs = renderPopupSelectionTabs(data);
                tabContainer.html(tabs.html);

                var content;
                if (tabs.years.length>0){
                    content = renderPopupYear(tabs.years[0].year)
                }else{
                    content = Mustache.render(Templates["popuptab_empty"],tabConfig);
                }
                container.html(content);
            }
        }
    }

    function renderPopupSelectionTabs(data){
        var years = [];
        var hasYear = {};
        for (var i = 0, len = data.length; i<len; i++){
            var year = parseInt(data[i].year);
            if (year && ! hasYear[year]){
                var label = year;
                if (year<1000) label = "Qualification " + year;
                years.push({year: year, label: label});
                hasYear[year] = true;
            }
        }
        years.sort(function(a, b){return b.year- a.year});
        if (years.length>0) years[0].first = true;
        var html = Mustache.render(Templates["popuptab_years"],years);

        return {
            years: years,
            html: html
        }
    }

    function renderPopupYear(year){
        year = parseInt(year);
        console.log("rendering year " , year);
        var container = $(".popuptabcontent").empty();

        var popupData = MapService.getCurrentPopupData();
        var tabConfig = popupTabConfig[activeTab];

        if (popupData && tabConfig){
            var data = popupData[tabConfig.dataSet];
            if (data){
                data = getDataByYear(data,year);
                if (tabConfig.sort) data.sort(function(a, b){return a.orderField - b.orderField});

                console.log(data);

                var template = Templates[tabConfig.template];
                if (template){
                    container.html(Mustache.render(template,data));
                }else{
                    console.error("Warning: template for dataset " + tabConfig.dataSet + " not found")
                    console.error(tabConfig)
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

    return{
        renderPopupTab: renderPopupTab,
        activatePopupYear: activatePopupYear
    }

}());
