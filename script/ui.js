var UI = (function() {

    var delayTimeout;
    var uiFilterFunction = function(){return true};
    var optionFilterFunction = function(f){return true;};
    var labelContainer = undefined;
    var shouldShowLayers = false;
    var timeChartPreset;
    var infoVisible = false;

    var persistantfilter = 1;
    var layerListFilters = {};

    var monthNames = [ "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December" ];

    var initData = function(next){
        // build legend
        buildUIFilterListFromUrl(Config.getIPISAPIurl("cod/filterdata"),next);
    };

    var init = function(){
        // init UI events
        //setKeyIncidentFilter(true);

        var container = $("#layers");

        // layerSwitcher
        container.on("click",".baselayer",function(){
            var layerId = this.id;
            if (!$(this).hasClass("active")){
                var activeLayer = $(".baselayer.active");
                if (activeLayer.length>0){
                    activeLayer.removeClass("active");
                    if (activeLayer.get(0).id != 'none'){
                        map.removeLayer(baseLayer[activeLayer.get(0).id]);
                    }
                }
                if (layerId != "none") {
                    map.addLayer(baseLayer[layerId]);
                    setBaseLayerStyle(true);
                }else{
                    setBaseLayerStyle(false);
                }

                $(this).addClass("active");
                MapService.updateHash();

            }
        });

        container.on("click",".datalayer",function(){

            var layerIds = [];
            var dataLayers = this.getAttribute("data-layers");

            if (dataLayers && dataLayers.length>0){
                layerIds = dataLayers.split(",");
            }else{
                layerIds.push(this.id)
            }
            var layerList = $(this).next();
            if (!layerList.hasClass("layerlist")) layerList=undefined;


            if ($(this).hasClass("active")){
                $(this).removeClass("active");
                $(".additional_" + this.id).removeClass("active"); // multiple buttons for same layer
                if (layerList) layerList.addClass("inactive");
                MapService.hideLayers(layerIds);
            }else{
                $(this).addClass("active");
                $(".additional_" + this.id).addClass("active"); // multiple buttons for same layer
                if (layerList) {
                    layerList.removeClass("inactive");
                    for (var i = 0, len=layerIds.length; i<len; i++){
                        $("#" + layerIds[i]).addClass("active");
                    }
                }
                MapService.showLayers(layerIds);
            }
        });


        /*
         datafilter class should be inside a layerlist
         and contains the property the dataset should be filtered on in
         data-filter and data-value
         */
        container.on("click",".datafilter",function(){

            $(this).toggleClass("inactive");

            var layerList = $(this).closest(".layerlist");
            if (layerList){
                updateLayerListFilter(layerList);
            }
        });





        container.find("h2").on("click",function(){
            var layerGroup = $(this).next();
            if (layerGroup.hasClass("mainlayergroup")){
                $(this).toggleClass("closed");
                layerGroup.slideToggle();
            }
        });

        $("#closelayer").on("click",function(){
           $("#layers").stop().toggle("fast");
           $("#layersbutton").stop().toggle("fast");
        });

        $("#closeDataList").on("click",function(){
            $("#datalist").addClass("hidden");
        });

        $("#layersbutton").on("click",function(){
            $("#layers").stop().toggle("fast");
            $("#layersbutton").stop().toggle("fast");

            if ($("#infobox").is(":visible")){
                shouldShowLayers = false;
                $("#infolayer").click();
            }
        });

        $("#infobutton").on("click",function(){
            showInfo(true,"fast");
        });

        $("#infolayer").on("click",function(){
            $("#infobutton").stop().show("fast");
            $("#infobox").stop().hide("fast");

            if (shouldShowLayers){
                createCookie("disclaimer",true,100);
                $("#layers").stop().show("fast");
                $("#layersbutton").stop().hide("fast");
            }
        });

        // set pre configured map
        $(".mainlayergroup .map").on("click",function(){

            MapService.clearMap();

            var targetMap = this.id;

            var layerGroupTitle = undefined;
            $(".layergrouptitle").each(function(){
                if ($(this).hasClass(targetMap)){
                    $(this).removeClass("closed");
                    layerGroupTitle = $(this);
                }else{
                    $(this).addClass("closed")
                }
            });

            var layerGroup = undefined;
            $(".layergroup").each(function(){
                if ($(this).hasClass(targetMap)){
                    $(this).show();
                    layerGroup = $(this)
                }else{
                    $(this).hide();
                    $(this).find(".datalayer").removeClass("active");
                    $(this).find(".layerlist").addClass("inactive");
                }
            });

            if (layerGroup){
                layerGroup.find(".datalayer:not(.subdatalayer):not(.excludeInThematicMaps)").removeClass("active").click();
            }

            // single datalayers beloging to map
            $(".datalayer." + targetMap).removeClass("active").click();


            if (layerGroupTitle){
                $("#layersScroll").scrollTo(layerGroupTitle);
            }else{
                $("#layersScroll").scrollTo(".datalayer." + targetMap);
            }

            $(".datalayer.includeInThematicMaps").removeClass("active").click();

            if ($(this).hasClass("baselayer_satelite"))  $("#satelite").click();
            if ($(this).hasClass("baselayer_terrain"))  $("#terrain").click();
            if ($(this).hasClass("baselayer_places"))  $("#places").click();
            if ($(this).hasClass("baselayer_none"))  $("#none").click();


        });

        $("#timefilter").on("click",".bar",function(){
            var timeFilterElement = $("#timefilter");

            var bars = timeFilterElement.find(".bar.inactive");

            if (bars.length == 0){
                timeFilterElement.find(".bar").not(this).addClass("inactive");
            }else if (bars.not(this).length == 11){
                // everything is going to be inactive -> Flip
                timeFilterElement.find(".bar").removeClass("inactive");
            }else{
                $(this).toggleClass("inactive");
            }

            updateTimeChartFilter()

        });


        $("#timefilter").on("mouseover",".bar",function(){
            if (labelContainer) {
                var value = this.getAttribute("data-value");
                var date = formatDate(this.getAttribute("data-field"));
                labelContainer.innerHTML = date  + value;
            }
        });

        $("#timefilter").on("mouseout",".bar",function(){
            if (labelContainer) labelContainer.innerHTML = '';
        });


        $('#listIncidents').on("click",function(){
            if ($("#datalist").hasClass("hidden")){
                MapService.listLayer("incidents");
            }else{
                $("#datalist").addClass("hidden")
            }

        });


        $("#datalist").on("click",".entry",function(){
            var co = this.getAttribute("data-co");
            var location = co.split('|');
            map.setView(location, 13);
        });

        $("#disclaimerbutton").on("click",function(){
            showInfo(true,"fast");
        });

    };

    function setKeyIncidentFilter(active){
        //if (active){
        //    optionFilterFunction = function(f){
        //        return f.properties.Key == 'Key';
        //    };
        //}else{
            optionFilterFunction = function(f){return true;};
        //}
    }


    function updateTimeChartFilter(){
        // updates the uiFilterFunction to the current state of the TimeChart UI

        var timeFilterElement = $("#timefilter");
        bars = timeFilterElement.find(".bar.inactive");

        // update filter
        var inactiveMonths = [];
        if (bars.length > 0){
            bars.each(function(){
                var data =  this.getAttribute("data-field");
                inactiveMonths.push(data);
                uiFilterFunction = function(f){
                    var d = f.properties.Date;
                    if (d){
                        d = d.substr(0,7);
                        return $.inArray(d,inactiveMonths)<0;
                    }else{
                        return true;
                    }
                }
            })
        }else{
            uiFilterFunction = function(){return true}
        }

        MapService.updateHash();
        MapService.reApplyFilter("incidents");

        updateMarkerList();

    }

    function updateMarkerList(){
        if (!$("#datalist").hasClass("hidden")){
            MapService.listLayer("incidents");
        }
    }

    function formatDate(d){
        var year = d.substr(0,4);
        var month = parseInt(d.substr(5,2));

        if (!isNaN(month)) month = monthNames[month-1];
        return month + " " + year + ": ";
    }

    function showInfo(showLayersOnClose,speed){
        infoVisible = true;
        shouldShowLayers = showLayersOnClose;
        $("#layers").stop().hide(speed);
        $("#layersbutton").stop().show(speed);

        $("#infobutton").stop().hide(speed);
        $("#infobox").stop().show(speed);

        if ($("#infoContent").hasClass("empty")){
            $("#infoContent").load("templates/disclaimer.html?v" + version,"",function(){
                $("#infoContent").removeClass("empty");
            });
        }
    }

    function hideInfo(force){
        if (infoVisible && force){
            $("#infolayer").trigger("click");
        }
    }

    function showMap(){
        $("#mapUI").removeClass("hidden");
    }

    function showLogin(){

        $("#loginbutton").on("click",function(){
            doLogin()
        });
        $("#password").on("keyup",function(e){
            if (e && e.keyCode && e.keyCode == 13){
                doLogin();
            }
        });

        $("#login").show();
    }

    function hideLogin(){
        $("#login").hide();
    }

    function doLogin(){
        // not hacker-safe but as the password is semi-public it will do.
        var pass = $("#password").val();
        pass = pass.split(".").join("");
        pass = pass.split("/").join("");
        pass = pass.split("\\").join("");
        $.get("data/" + pass + ".json",function(result){
            if (result && result.result && result.result == "ok"){
                createCookie("pass" + cookieName,true,1000);
                initApp();
            }else{
                $("#password").val("");
            }
        }).fail(function() {
            $("#password").val("");
        })
    }


    function updateLayerListFilter(layerList){
        var layerId = layerList.data("layer");
        var layerListID = layerList.attr("id");
        if (layerId && dataset[layerId]){
            var filterList =  [];
            var hasFilter = false;
            layerList.find(".datafilter").each(function(index){
                if ($(this).hasClass("inactive")){
                    hasFilter = true;
                }else{
                    filterList.push({
                        'property': $(this).data("filter"),
                        'value': $(this).data("value")
                    })
                }
            });

            layerListFilters[layerId] = layerListFilters[layerId] || {};
            if (hasFilter){
                layerListFilters[layerId][layerListID] = function(f){
                    var result = false;
                    for (var i = 0, len = filterList.length; i<len;i++){
                        var filter = filterList[i];
                        if (f.properties[filter.property] == filter.value) result = true;
                    }
                    return result;
                }
            }else{
                layerListFilters[layerId][layerListID] = false;
            }



            // check for filter Chart
            var layerData = MapService.getLayerData(layerId);
            if (layerData && layerData.additionalFilter) {
                layerListFilters[layerId]["additional"] = layerData.additionalFilter;
            }

            dataset[layerId].setFilter(function(f){
                var result = true;
                for (var filterID in layerListFilters[layerId]){
                    if (result){
                        var filterFunction = layerListFilters[layerId][filterID];
                        if (filterFunction) result = result && filterFunction(f);
                    }
                }
                return result;
            });

            if (layerData && layerData.onFilter) layerData.onFilter();
            MapService.updateHash();
        }else{
            //console.error("dataset " +  layerId + "not loaded");
        }
    }



    initRenderTimeChart = function(delay){
        // small delay to update Timechart as these events can be triggered multiple times on load
        if (typeof delay == "undefined") delay = 100;
        clearTimeout(delayTimeout);
        delayTimeout = setTimeout(renderTimeChart,delay);

    };

    renderTimeChart = function(){
        var container = document.getElementById("timefilter");
        $(container).empty();

        var layersIds = ["incidents"];

        var counter = 0;
        var maxCounter = 1;
        var chartMonths = {};

        // reset filter
        uiFilterFunction = function(){return true};
        MapService.reApplyFilter("incidents");

        for (var index = 0; index < layersIds.length; index++){
            var layer = dataset[layersIds[index]];

            if (layer && map.hasLayer(layer)){
                var markers = layer.getLayers();

                var filter = layer.getFilter();


                for (var i = 0, len = markers.length; i<len; i++){
                    var marker = markers[i];
                    var countMeIn = true;
                    if (filter) countMeIn = filter(marker.feature);
                    if (countMeIn){
                        var monthId = marker.feature.properties.Date;

                        if (monthId){
                            monthId = monthId.substr(0,7);
                            monthId = monthId.split("/").join("-")
                            counter = chartMonths[monthId] || 0;
                            counter += 1;
                            maxCounter = Math.max(maxCounter,counter);
                            chartMonths[monthId] = counter;
                        }
                    }
                }
            }
        }

        labelContainer = document.createElement("div");
        labelContainer.className = 'labelContainer';

        var barContainer = document.createElement("div");
        barContainer.className = 'barContainer';

        var monthContainer = document.createElement("div");
        monthContainer.className = "monthContainer";

        var yearContainer = document.createElement("div");
        yearContainer.className = "yearContainer";

        /*var monthChars = "JFMAMJJASONDJFMAMJJASONDJFMAMJJASOND";*/
        var monthChars = "JFMAMJJASOND";

        var startMonth = 1;
        var monthCount = monthChars.length;

        for (var i = startMonth-1; i< monthCount; i++){
            var data = i+1;
            var year = "2014";

            if (data<10) data = "0" + data;
            data = year + '-' + data;
            counter = chartMonths[data] || 0;

            // max height = 60
            var height = (counter * 60) / maxCounter;

            var bar = document.createElement("div");
            bar.className = 'bar';

            // render chart with predfined active/inactive months
            if (timeChartPreset && timeChartPreset.length>10){
                var char = timeChartPreset[i-startMonth+1];
                if (char == "0") bar.className += " inactive";
            }

            bar.setAttribute("data-value",counter);
            bar.setAttribute("data-field",data);

            var fill =  document.createElement("div");
            fill.style.height = height + "px";

            bar.appendChild(fill);
            barContainer.appendChild(bar);

            var m = document.createElement("div");
            m.innerHTML = monthChars[i];

            monthContainer.appendChild(m);
        }

        yearContainer.innerHTML = '<div>2014</div>';

        container.appendChild(labelContainer);
        container.appendChild(barContainer);
        container.appendChild(monthContainer);
        container.appendChild(yearContainer);

        // clear preset - should this be remembered when the other filters update?
        timeChartPreset = undefined;

        updateTimeChartFilter();

    };



    function filterTimeChart(f){
        return uiFilterFunction(f);
    }

    function filterAdditionalOptions(f){
        return optionFilterFunction(f);
    }

    function initLayerListFilter(layerId){
        var layerList = $("#" + layerId + "List");

        // bit lame ...
        if (layerId == "incidents"){

            timeChartPreset = MapService.getTimeChartPreset();
        }

        updateLayerListFilter(layerList);
    }


    // build a list of filter items of a certain field in a dataset
    // the parent DOM element should have a data-layer attribute containing the datalayer to filter
    // when persistant=true then the state of the filter will be included in the url and restored on a page refresh

    function buildUIFilterList(parentId,fieldname,persistant,legend_prefix,label_prefix,dataSet){
        var container = document.getElementById(parentId);

        for (var i=0, len=dataSet.length; i<len; i++){
            var data = dataSet[i];
            var item = document.createElement("div");
            item.className = "datafilter";
            if (persistant) {
                item.className = "datafilter persistantfilter";
                item.setAttribute('data-filterId', persistantfilter);
                persistantfilter++;
            }
            item.setAttribute('data-filter', fieldname);
            item.setAttribute('data-value', data);
            item.id=legend_prefix + "_" + cleanString(data);

            item.innerHTML = translations[label_prefix + data] || label_prefix + data;



            container.appendChild(item);
        }


    }

    function buildUIFilterListFromUrl(url,next){
        $.get(url,function(result){
            if (result.status == "ok"){
                result = result.result;
                buildUIFilterList("mineralList","mineral",true,"mineral_","",result.minerals);
                buildUIFilterList("yearsList","year",false,"year_","",result.years);
                buildUIFilterList("armyList","armygroup",false,"armygroup_","army",result.armygroups);
                buildUIFilterList("workerList","workergroup",false,"workergroup_","workergroup",result.workergroups);
                if (next) next();
            }
        });
    }


    function setBaseLayerStyle(hasBaseLayer){
        if (hasBaseLayer){
            $("#none").removeClass("active");
            $("#map").removeClass("clear");
            MapService.hideLayers(["lakes"]);
        }else{
            $("#none").addClass("active");
            $("#map").addClass("clear");
            MapService.showLayers(["lakes"]);
        }
    }

    return{
        init: init,
        initData: initData,
        initRenderTimeChart : initRenderTimeChart,
        filterTimeChart : filterTimeChart,
        filterAdditionalOptions : filterAdditionalOptions,
        showInfo: showInfo,
        hideInfo: hideInfo,
        initLayerListFilter: initLayerListFilter,
        updateTimeChartFilter : updateTimeChartFilter,
        updateMarkerList : updateMarkerList,
        showLogin : showLogin,
        hideLogin : hideLogin,
        showMap : showMap,
        setBaseLayerStyle: setBaseLayerStyle
    }

}());
