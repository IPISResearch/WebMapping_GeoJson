var MapService = (function() {

    // starting point for map
    var mapCoordinates = {
        x: -3,
        y: 28,
        zoom: 6
    };

    // active default baselayer
    var requestedLayerIdString = "terrain";
    var requestedFilterIdString = "";
    var requestedTimeChartString = "";

    var hasLayerPreset = false;
    var hasFilterPreset = false;
    var popupModus = "instant";

    var hash = document.location.hash.substr(1);
    var updateHashTimeout;

    if (hash.indexOf("/")>0){
        var urlparams = hash.split("/");
        if (urlparams.length>3){
            mapCoordinates.x = urlparams[0];
            mapCoordinates.y = urlparams[1];
            mapCoordinates.zoom = urlparams[2];
            requestedLayerIdString = urlparams[3];
            requestedFilterIdString = urlparams[4] || "";
            requestedTimeChartString = urlparams[5] || "";
        }
    }

    var activeLayersIds = [];
    var requestedLayerIds = requestedLayerIdString.split(",");
    var requestedFilterIds = requestedFilterIdString.split(",");
    var clusterLayer;
    var clusterData = {};


    /*

    Some docs:
     legend_prefix and legend_id

     used for reverse lookup
     legend_prefix is the id of the dom element

     optional legende_id points to the name of a field in the geojson
     the value of that field is appended to legend_prefix and the dom element with that ID has his "selected" class toggle

     */

        var layers = {
            mines:{
                id: 1,
                name: "mines",
                visible: true,
                url: Config.getIPISAPIurl("cod/mines"),
                iconType: ICONTYPE.CUSTOMMINE,
                legend_prefix: "mineral_",
                legend_id: 'mineral',
                popupTemplate: "minesPopup",
                popupUrl: function(p){return Config.getIPISAPIurl("cod/mine/" + p.id);},
                onPopup: function(p){
                    /*if (p.NOTES.length > 300){
                        p.scrollable = "scrollable";
                    }else{
                        p.scrollable = "";
                    }
                    p.formattedDate = formatDate(p.Date);
                    */
                    return p;
                },
                hoverTemplate: "minesHoverPopup",
                checkForDuplicatesIn: ['mines'],
                showClusters: false,
                hasPresetFilters:true
            },
            sellingpoints:{
                id: 2,
                name: "sellingpoints",
                visible: false,
                url: Config.getIPISAPIurl("cod/sellingpoints"),
                iconType: ICONTYPE.SELLINGPOINT,
                popupTemplate: "pdvPopup",
                popupUrl: function(p){return Config.getIPISAPIurl("cod/sellingpoint/" + p.id);},
                onPopup: function(p){
                    /*if (p.NOTES.length > 300){
                     p.scrollable = "scrollable";
                     }else{
                     p.scrollable = "";
                     }
                     p.formattedDate = formatDate(p.Date);
                     */
                    return p;
                },
                hoverTemplate: "pdvHoverPopup",
                checkForDuplicatesIn: ['sellingpoints'],
                showClusters: false,
                hasPresetFilters:false
            },
            lakes: {
                id: 3,
                name: "lakes",
                visible: false,
                url: "data/geo/lakes.geojson",
                fillType: FILLTYPE.LAKE,
                zIndex : 1,
                ignoreInUrl: true

            },
            borders:{
                id: 4,
                name: "borders",
                mapBoxId: "ipisresearch.DRC_borders",
                visible: true
            },
            places:{
                id: 5,
                name: "places",
                mapBoxId: "ipisresearch.fe4df64e",
                visible: true
            },
            armyPositions: {
                id: 6,
                name: "armyPositions",
                visible: false,
                url: "data/Groupesarmes_IPISv2.geojson",
                fillType: FILLTYPE.ARMED_GROUPS,
                zIndex : 10,
                popupTemplate: "armedGroupPopup"
            }
        };

/*

END OF CONFIG

everything should be generic

 */

        var layersToLoad = [];
        var duplicateMarkers = [];

        var init = function(){
            // init map and load datasets
            map = L.mapbox.map('map').setView([mapCoordinates.x, mapCoordinates.y], mapCoordinates.zoom);


            baseLayer.satelite = L.mapbox.tileLayer(MAPBOX_BASELAYER.satelite_no_places);
            baseLayer.terrain = L.mapbox.tileLayer(MAPBOX_BASELAYER.terrain_no_places);
            baseLayer.streets = L.mapbox.tileLayer(MAPBOX_BASELAYER.terrain_places);

            baseLayer.satelite.setZIndex(1);
            baseLayer.terrain.setZIndex(2);
            baseLayer.streets.setZIndex(3);

            // add baselayers
            var hasBaselayer = false;
            if (requestedLayerIds.length>0){
                for (var i=0;i<requestedLayerIds.length;i++){
                    var layerId = requestedLayerIds[i];
                    if (layerId.length>2 && isNaN(layerId) && baseLayer[layerId]){
                        map.addLayer(baseLayer[layerId]);
                        $("#" + layerId).addClass("active");
                        hasBaselayer = true;
                    }
                }
            }

            if (!hasBaselayer) {
                UI.setBaseLayerStyle(false);
            }

            L.control.scale().addTo(map);


            /* datalayers */

            /* don't load them all at once, load next one on onready event of the previouis one */

            // check if we have an url preset
            var loadPreset = false;
            for (var i = 0; i<requestedLayerIds.length; i++){
                var layerId = requestedLayerIds[i];
                if (!isNaN(layerId)) loadPreset = true;
            }

            var loadFilterPreset = false;
            for (var i = 0; i<requestedFilterIds.length; i++){
                var filterId = requestedFilterIds[i];
                if (!isNaN(filterId)) loadFilterPreset = true;
            }
            if (requestedFilterIds[0]=="") loadFilterPreset = false;

            hasLayerPreset = loadPreset;
            hasFilterPreset = loadFilterPreset;

            // ignore until this works with autogenerated database filters
            loadPreset = false;
            loadFilterPreset = false;

            if (loadPreset){
                // clear UI
                $(".layerlist").addClass("inactive");
                $(".layergroup").slideUp();
                $(".layergrouptitle").addClass("closed");
            }

            if (loadFilterPreset){
                $(".persistantfilter").each(function(index){
                    var filterId = this.getAttribute("data-filterId");
                    var isInFilter = $.inArray(filterId,requestedFilterIds)>-1
                    if (!isInFilter) $(this).addClass("inactive");

                    if ($(this).is(':checkbox')){
                        this.checked = isInFilter;
                    }
                });
            }


            for (var key in layers) {

                if (layers.hasOwnProperty(key)) {
                    var layer = layers[key];
                    if (loadPreset){
                        layer.visible = $.inArray("" + layer.id,requestedLayerIds) > -1;
                    }
                    //if (requestedLayerIds
                    //
                    if (layer.visible) {
                        layersToLoad.push(key);

                        // update UI
                        var uiElement = document.getElementById(layer.name);
                        if (uiElement){

                            if (layer.filterItems_notYet){
                                // generate UI

                                var max = layer.filterItems;

                            }else{
                                var $uiElement =  $(uiElement);
                                $uiElement.addClass("active");
                                $(".additional_" + layer.name).addClass("active"); // multiple buttons for same layer

                                // corresponding menu section
                                var layerList = $uiElement.next();
                                if (!layerList.hasClass("layerlist")) layerList=undefined;
                                if (layerList) {
                                    layerList.removeClass("inactive");
                                }

                                // corresponding layergroup
                                $uiElement.closest(".layergroup").slideDown();
                                $uiElement.closest(".layergrouptitle").removeClass("closed");
                            }
                        }
                    }
                }
            }

            loadNextLayer();

            map.on("click",function(){
                if (map.hasActiveDuplicateMarkers){
                    resetDuplicateMarkers();
                }
                UI.hideInfo(true);
                //popupModus = 'instant';
            });

            map.on("zoomstart",function(){
                if (map.hasActiveDuplicateMarkers){
                    resetDuplicateMarkers();
                }
            });

            map.on("zoomend",function(){
                updateHash();
            });


            map.on("moveend",function(){
                updateHash();
            });

            map.on('popupclose',function(e){
                popupModus = 'instant';
            });

     };

    function loadNextLayer(){
        if (layersToLoad.length > 0){
            var layerId = layersToLoad[0];
            layersToLoad.shift();

            addLayer(layers[layerId])
        }else{
            updateHash();
        }
    }

    function addLayer(properties){

        if (properties.mapBoxId){
            // tile layer
            dataset[properties.name] = L.mapbox.tileLayer(properties.mapBoxId);
            dataset[properties.name].setZIndex(5); // TODO: FIXME
            map.addLayer(dataset[properties.name]);
            loadNextLayer();

        }else{
            dataset[properties.name] =
            L.mapbox.featureLayer()
                .on("ready",function(){
                    if (properties.onShowHide){
                        properties.onShowHide(true);
                    }

                    if (properties.additionalFilter){
                        dataset[properties.name].setFilter(properties.additionalFilter);
                    }

                    if (properties.hasPresetFilters && hasFilterPreset){
                        UI.initLayerListFilter("incidents");
                    }

                    var visibleLayer = dataset[properties.name];

                    visibleLayer.addTo(map).setZIndex(1);


                    loadNextLayer();

                })
                .on('layeradd', function(e) {
                    var marker = e.layer;
                    if (!marker.feature) return;
                    var p = marker.feature.properties;
                    var t = marker.feature.geometry;

                    if (t.type == "Point" && properties.iconType)        marker.setIcon(getMarkerIcon(p,properties.iconType));
                    if (properties.lineType)        marker.setStyle(getLineStyle(p,properties.lineType));
                    if (properties.fillType)        properties.style = getFillStyle(p,properties.fillType);
                    if (t.type != "Point" && properties.style)           marker.setStyle(properties.style);
                    if (properties.popupTemplate){
                        if (properties.checkForDuplicatesIn){
                            // custom onclick to check for markers on the same geo position
                            marker.on("click touch",function(){
                                marker.unbindPopup();
                                var co = marker.getLatLng();

                                if (co.originalLat){
                                    // this is a duplicate marker that was previously split
                                    getMarkerPopup(marker,properties,true);
                                }else{
                                    // check for markers on same coordinates
                                    if (map.hasActiveDuplicateMarkers) resetDuplicateMarkers();

                                    duplicateMarkers = getDuplicateMarkers(marker,properties.checkForDuplicatesIn);

                                    if (duplicateMarkers.length>0){
                                        map.hasActiveDuplicateMarkers = true;
                                        duplicateMarkers.push(marker);

                                        if (properties.showClusters){
                                            var clusterDot = clusterData[getClusterKey(marker)];
                                            if (clusterDot) {
                                                clusterData.currentClusterDot = clusterDot;
                                                clusterDot.setOpacity(0);
                                            }
                                        }

                                        splitDuplicateMarkers();
                                    }else{
                                        // no duplicates
                                        map.hasActiveDuplicateMarkers = false;
                                        getMarkerPopup(marker,properties,true);
                                    }
                                }
                            })

                        }else{
                            getMarkerPopup(marker,properties,false);
                        }

                    }

                    if (properties.hoverTemplate){
                        marker.on('mouseover',function(e) {
                            if (popupModus == "instant"){
                                var popupHTML = Mustache.render(Templates[properties.hoverTemplate],p);
                                marker.unbindPopup();
                                marker.bindPopup(popupHTML).openPopup();
                            }

                        });

                        marker.on('mouseout',function(e) {
                            if (popupModus == "instant") marker.closePopup();
                        });
                    }

                    if (properties.legend_prefix){
                        marker.legende_id = properties.legend_prefix;
                        if (properties.legend_id) marker.legende_id += cleanString(marker.feature.properties[properties.legend_id]).toLowerCase();
                        marker.legende_element =  $("#" + marker.legende_id);

                        marker.on('mouseover',function(e) {
                            marker.legende_element.addClass("selected");
                        });

                        marker.on('mouseout',function(e) {
                            marker.legende_element.removeClass("selected");
                        });
                    }

                    if (properties.style && properties.style.onMouseOver && properties.style.onMouseOut){
                        marker.on('mouseover',function(e) {
                            marker.setStyle(properties.style.onMouseOver);
                        });

                        marker.on('mouseout',function(e) {
                            marker.setStyle(properties.style.onMouseOut);
                        });
                    }

                    if (properties.onAdd){
                        properties.onAdd(marker,this);
                    }
                })
                .loadURL(properties.url)
                .setZIndex(properties.zIndex);
            }

        }

        function getMarkerIcon(properties,iconType){
            // symbols from https://www.mapbox.com/maki/
            var symbol = '';
            var color = 'FF4400';
            var size = 'small'; // small, medium or large
            var type = 'marker';
            var url = '';
            var anchor = '';
            var popupAnchor;
            var customClassName='';

            if (iconType == ICONTYPE.MINE){
                size = 'mini';
                if (properties.mineral == "Gold"){
                    symbol = 'star';
                    color = 'F9FF4E';
                }
                if (properties.mineral == "Diamond"){
                    symbol = 'triangle';
                    color = '1CB1DD';
                }
                if (properties.mineral == "Diamond & gold"){
                    symbol = 'triangle-stroked';
                    color = '1fdd78';
                }
                if (properties.mineral == "Gold & diamond"){
                    symbol = 'star-stroked';
                    color = '79dd1e';
                }

                if (properties.Remarks){
                    //size = 'small';
                }else{
                    //symbol = '';
                    //customClassName = "transparent"
                }
            }

            if (iconType == ICONTYPE.CUSTOMMINE){

                var validation = properties.qualification;
                if (validation == null) validation="";
                if (validation == 'grey') validation="";

                if (validation == "") {
                    symbol = "triangle-stroked";
                }else {
                    symbol = "triangle";
                    type = "custom";

                    if (validation.indexOf('green') > -1) iconColor = "green";
                    if (validation.indexOf('yellow') > -1) iconColor = "yellow";
                    if (validation.indexOf('red') > -1) iconColor = "red";
                }

                switch(properties.mineral){
                    case "amethyst": color = '9966CB'; break;
                    case "gold": color = 'DAA520'; break;
                    case "wolframite": color = '8B4513'; break;
                    case "coltan": color = '1E90FF'; break;
                    case "monazite": color = 'B0C4DE'; break;
                    case "tourmaline": color = '006600'; break;
                    case "diamond": color = 'FFDEAD'; break;
                    case "cassiterite": color = 'FFA07A'; break;
                    case "copper": color = 'C87533'; break;
                    case "zzz_other": color = '000000'; break;
                }

                if (properties.workers > 499) {
                    size = "large";
                }

                if (properties.workers < 50){
                    size = "small";
                }

                if (type == "custom"){
                    url = "images/pins/pin-" + size.substr(0,1) + "-" + symbol + "-" + color;

                    if (iconColor != '') url += "-" + iconColor;

                    url += ".png";

                    var sizeArray;

                    if (size == "small"){
                        sizeArray = [20, 50];
                        anchor = [10, 25];
                        popupAnchor = [0, -25];
                    }
                    if (size == "medium"){
                        sizeArray = [30, 70];
                        anchor = [15, 35];
                        popupAnchor = [0, -35];
                    }
                    if (size == "large"){
                        sizeArray = [35, 90];
                        anchor = [17, 45];
                        popupAnchor = [0, -45];
                    }
                }

            }

            if (iconType == ICONTYPE.SELLINGPOINT){
                size = 'small';
                symbol = 'warehouse';
                color = '888888';

                switch(properties.mineral){
                    case "amethyst": color = '9966CB'; break;
                    case "gold": color = 'DAA520'; break;
                    case "wolframite": color = '8B4513'; break;
                    case "coltan": color = '1E90FF'; break;
                    case "monazite": color = 'B0C4DE'; break;
                    case "tourmaline": color = '006600'; break;
                    case "diamond": color = 'FFDEAD'; break;
                    case "cassiterite": color = 'FFA07A'; break;
                    case "copper": color = 'C87533'; break;
                    case "zzz_other": color = '666666'; break;
                }
            }

            if (iconType == ICONTYPE.MINERAL_OCCURENCE){
                size = 'mini';
                type = 'custom';
                symbol = 'circle-stroked';
                color = '88AA88';
                if (properties.Mineral == "Gold"){
                    symbol = 'star-stroked';
                    color = COLOR.gold;
                }
                if (properties.Mineral == "Diamond"){
                    symbol = 'circle-stroked';
                    color = COLOR.diamond;
                }
                if (properties.Mineral == "Diamond & gold"){
                    symbol = 'circle-stroked';
                    color = COLOR.diamond_gold
                }
                if (properties.Mineral == "Copper"){
                    symbol = 'circle-stroked';
                    color = COLOR.copper;
                }
                if (properties.Mineral == "Iron"){
                    symbol = 'square-stroked';
                    color = COLOR.iron;
                }
                if (properties.Mineral == "Uranium"){
                    symbol = 'square-stroked';
                    color = COLOR.uranium;
                }
                if (properties.Mineral == "Tin"){
                    symbol = 'square-stroked';
                    color = COLOR.tin;
                }
                if (properties.Mineral == "Nickel"){
                    symbol = 'square-stroked';
                    color = COLOR.nickel;
                }
            }

            if (iconType == ICONTYPE.ARMY_POSITION){
                symbol = 'police';
                color = '4285F4';
                if (properties.Army == "SAF"){
                    color = 'FF4400';
                }
            }

            if (iconType == ICONTYPE.SCHOOL){
                symbol = 'college';
                color = '218CD6';
                if (properties.GENDER == "Girls"){
                    color = 'E69242';
                }
                if (properties.GENDER == "Mixed"){
                    type = "custom";
                    url = "images/pins/school_mixed.png";
                    size = [20, 50];
                    anchor = [10, 25];
                    popupAnchor = [0, -25];
                }

            }

            if (iconType == ICONTYPE.GARDEN){
                symbol = 'garden';
                color = '457B25';
            }

            if (iconType == ICONTYPE.BOMBING){
                symbol = 'rocket';
                color = 'B42D25';
            }

            if (iconType == ICONTYPE.CLASH){
                size = 'small';
                symbol = 'fire-station';
                color = '#FFD700';
                if (properties.duplicates > 3){
                    color = '#FFAA00';
                }
                if (properties.duplicates > 10){
                    size = 'medium';
                    color = '#FF8800';
                }
                if (properties.duplicates > 30){
                    size = 'large';
                    color = '#FF0000';
                }

                if (properties.Type == "Intrastate violence"){
                    color = '#ff6c00';
                }
                if (properties.Type == "Interstate violence"){
                    color = '#ae0076';
                }
            }


            if ((iconType == ICONTYPE.KEYINCIDENT) || (iconType == ICONTYPE.INCIDENT)){
                size = 'small';
                //symbol = 'clothing-store';
                symbol = 'fire-station';
                color = '#FFD700';

                if (properties.duplicates > 10){
                    size = 'medium';
                }
                if (properties.duplicates > 30){
                    size = 'large';
                }

                /* auto generated */
                // use generateFilterCode() the generate custom filter code

                if (properties.IncidentType == "1"){color = '#FF0000'; }
                if (properties.IncidentType == "2"){color = '#FFAA00'; }
                if (properties.IncidentType == "3"){color = '#AAFF00'; }
                if (properties.IncidentType == "4"){color = '#00FF00'; }
                if (properties.IncidentType == "5"){color = '#008a5d'; }
                if (properties.IncidentType == "6"){color = '#00AAFF'; }
                if (properties.IncidentType == "7"){color = '#0000FF'; }
                if (properties.IncidentType == "8"){color = '#AA00FF'; }
                if (properties.IncidentType == "9"){color = '#ff68f5'; }
                if (properties.IncidentType == "other"){color = '#660042'; }

                /* end auto generated */
            }

            if (iconType == ICONTYPE.TEST){
                symbol = 'police';
                color = '00FF00';
                size = 'large';
            }

            if (iconType == ICONTYPE.STRONGHOLD){
                symbol = 'police';
                color = '4285F4';
                if (properties.Group == "FRC"){
                    color = 'FF4400';
                }
                if (properties.Group == "Anti-balaka"){
                    color = '026469';
                }
            }

            if (iconType == ICONTYPE.ARROWPOINT){
                var direction  = 0;
                if (properties.rotation) direction = properties.rotation;
                type = "custom";
                url = "images/arrowpointers/" +  direction + ".png";
                size = [17, 17];
                anchor = [7, 7];

            }

            if (iconType == ICONTYPE.REFUGEE){
                var iSize  = properties.Category;
                if (iSize) {
                    iSize = Math.floor(iSize)
                }else{
                    iSize = 1;
                }

                type = "custom";
                url = "images/dots/red.png";
                size = [iSize*6, iSize*6];
                anchor = [iSize*3, iSize*3];

            }

            if (size == "mini"){
                // create custom image as size should be smaller than default sizes
                type = "custom";
                url = "//a.tiles.mapbox.com/v3/marker/pin-s-" + symbol + "+" + color + ".png";
                if (symbol == '') url = "//a.tiles.mapbox.com/v3/marker/pin-s+" + color + ".png";
                size = [16, 40]; // got to love javascript, no ?
                anchor = [8, 20];
                popupAnchor = [0, -25];
            }


            if (type == 'marker'){
                return L.mapbox.marker.icon({
                    'marker-symbol': symbol,
                    'marker-color':  color,
                    'marker-size' : size
                });
            }else{
                return L.icon({
                      'iconUrl': url,
                      'iconSize': size,
                      'iconAnchor': anchor, // point of the icon which will correspond to marker's location
                      'popupAnchor': popupAnchor, // point from which the popup should open relative to the iconAnchor
                      'className': 'dot ' + customClassName
                    });
            }

        }

        function getLineStyle(properties,lineType){
            // note : rivers and roads not used anymore:  have moved to a tileLayer

            var color = "#080";
            var opacity = 0.8;
            var weight = 4;
            var dashArray = '';


                if (lineType == LINETYPE.CATTLEROUTE){
                    dashArray = "1,8";
                    switch (properties.Type){
                        case "a": color = "#079af8"; break;
                        case "c": color = "#ff0082"; break;
                        case "s": color = "#6bff6b"; break;
                        case "m": color = "#587b5b"; break;
                        case undefined: color = "#222222"; break;
                    }

                }

                if (lineType == LINETYPE.CATTLEROUTE2){
                    dashArray = "4,12";
                    weight = 2;
                    switch (properties.Type){
                        case "a": color = "#079af8"; break;
                        case "c": color = "#ff0082"; break;
                        case "s": color = "#6bff6b"; break;
                        case "m": color = "#587b5b"; break;
                        case undefined: color = "#222222"; break;
                    }

                }

                if (lineType == LINETYPE.RAILROAD){
                    color = '#000';
                    opacity = '0.5';
                    if (properties.TYPE == "Inner"){
                        weight = 2;
                        dashArray = "3,8";
                        color = "#FFF";
                        opacity = '0.8';
                    }
                }

            return {
                color: color,
                opacity: opacity,
                weight: weight,
                dashArray: dashArray
            }

        }


        function getFillStyle(properties,fillType){
            // note : rivers and roads not used anymore:  have moved to a tileLayer

            var color = "#000";


            if (fillType== FILLTYPE.MINING_CONCESSION){
                switch (properties.Minerals){
                    case "Diamond, gold": color = "#" + COLOR.diamond_gold; break;
                    case "Gold, diamond": color = "#" + COLOR.gold_diamond; break;
                    case "Gold": color = "#" + COLOR.gold; break;
                    case "Uranium": color = "#" + COLOR.uranium; break;
                    case "Iron": color = "#" + COLOR.iron; break;
                    case "Gold, iron": color = "#" + COLOR.gold_iron; break;

                }

            }


            if (fillType== FILLTYPE.PROTECTED_AREA){
                switch (properties.TYPE_ENG){
                    case "National Park": color = "#909e00"; break;
                    case "Wildlife Reserve": color = "#9e150f"; break;
                    case "Biosphere Reserve": color = "#02999e" ; break;
                    case "Integral Natural Reserve": color = "#3e289e" ; break;
                    case "Presidential Park": color = "#4a5d56" ; break;
                }

            }



            if (fillType== FILLTYPE.ETHNIC){
                switch (properties.Type){
                    case "etnic1": color = "#ae0a00"; break;
                    case "etnic2": color = "#ff0082"; break;
                    case "etnic3": color = "#fd00ff"; break;
                }

            }

            if (fillType== FILLTYPE.ARMED_INFLUENCE){
                switch (properties.Group){
                    case "group1": color = "#909e00"; break;
                    case "group2": color = "#9e150f"; break;
                    case "group3": color = "#02999e" ; break;
                }

            }

            if (fillType== FILLTYPE.ARMED_GROUPS){
                switch (properties.Type){
                    case "n": color = "#3aae67"; break;
                    case "e": color = "#ae730b"; break;
                }
            }

            if (fillType== FILLTYPE.LAKE){
                color = "#3E99D4";
                opacity = 0.7;
                fillOpacity = 0.7;
            }


            return {
                    color: color,
                    opacity: 0.8,
                    weight: 1,
                    fillColor: color,
                    fill:true,
                    fillOpacity: 0.4,
                    onMouseOver: {fillOpacity: 0.8},
                    onMouseOut: {fillOpacity: 0.4}
            }

        }

        var getMarkerPopup = function(marker,datasetProperties,andOpen){
            var p = marker.feature.properties;
            var popupHTML;

            if (datasetProperties.onPopup){
                p = datasetProperties.onPopup(p);
            }

            if (datasetProperties.popupUrl){
                // populate popup from external data
                popupHTML = Mustache.render(Templates[datasetProperties.popupTemplate + "Loading"],p);
                marker.unbindPopup().bindPopup(popupHTML);
                if (andOpen) marker.openPopup();

                popupModus = 'fixed';
                var url = datasetProperties.popupUrl(p);
                $.get(url,function(result){
                    if (result.status == "ok"){
                        result = result.result[0];

                        if (result.latitude) result.fLatitude = decimalToDegrees(result.latitude,"lat");
                        if (result.longitude) result.fLongitude = decimalToDegrees(result.longitude,"lon");

                        popupHTML = Mustache.render(Templates[datasetProperties.popupTemplate],result);
                        marker.unbindPopup().bindPopup(popupHTML);
                        if (andOpen) marker.openPopup();
                        popupModus = 'fixed';
                    }
                });

            }else{
                popupHTML = Mustache.render(Templates[datasetProperties.popupTemplate],p);
                if (datasetProperties.popupPostProcessor) popupHTML = datasetProperties.popupPostProcessor(popupHTML);
                marker.unbindPopup().bindPopup(popupHTML);
                if (andOpen) marker.openPopup();

                popupModus = 'fixed';
            }


        };

        var duplicatePointsOffsetForZoomLevel = function(zoomLevel){
            // what's this ?
            return 51.2 / Math.pow(2,zoomLevel)
        };

        var getDuplicateMarkers = function(marker,layerIds){

            var result = [];
            if (layerIds.length == 0) return result;

            var co  = marker.getLatLng();

            // TODO: allow multiple layers
            for (var layerIndex= 0; layerIndex < layerIds.length; layerIndex++){
                var layer = dataset[layerIds[layerIndex]];
                if (layer && map.hasLayer(layer)){
                    var markers = layer.getLayers();

                    for (var i=0, len=markers.length; i<len; i++){
                        var thisMarker = markers[i];
                        if (thisMarker && thisMarker != marker){
                            var thisCo = thisMarker.getLatLng();

                            // simple distance ...
                            var treshold = 0.001;

                            if ((Math.abs(thisCo.lat  - co.lat) <= treshold) && (Math.abs(thisCo.lng  - co.lng) <= treshold)){
                                result.push(thisMarker);
                            }

                        }
                    }
                }
            }

            return result;
        };

        var splitDuplicateMarkers = function(){

            var duplicateMarkerCount = duplicateMarkers.length;
            var angle = 2*Math.PI/duplicateMarkerCount; // angle is in radiants

            var moveOffset = duplicatePointsOffsetForZoomLevel(map.getZoom());

            var circleStyle = {
                color: '#FFF',
                opacity: 1,
                weight: 3,
                fillColor: '#FFF',
                fillOpacity: 0.25
            };

            var center = [0,0];
            var circleRadius = 36;

            if (duplicateMarkerCount<5){
                moveOffset = moveOffset * 0.8;
                circleRadius = circleRadius * 0.8;
            }

            if (duplicateMarkerCount>10){
                moveOffset = moveOffset * 1.5;
                circleRadius = circleRadius * 1.5;
            }

            if (duplicateMarkerCount>20){
                moveOffset = moveOffset * 2;
                circleRadius = circleRadius * 2;
            }

            if (duplicateMarkerCount>30){
                moveOffset = moveOffset * 2;
                circleRadius = circleRadius * 2;
            }

            var animationSteps = 4;
            doAnimationStep(1);

            function doAnimationStep(step){
                for (var i=0;i<duplicateMarkerCount;i++){
                    var thisMarker = duplicateMarkers[i];

                    var thisAngle = (angle*i);

                    var thisMoveOffset = (moveOffset * step)/animationSteps;
                    var x = Math.sin(thisAngle) * thisMoveOffset;
                    var y = Math.cos(thisAngle) * (thisMoveOffset/1.2);

                    var c = thisMarker.getLatLng();
                    if (step == 1){
                        c.originalLat = c.lat;
                        c.originalLng = c.lng;
                        center[0] = c.lat;
                        center[1] = c.lng;
                    }

                    c.lat = c.originalLat + y;
                    c.lng = c.originalLng + x;

                    thisMarker.setLatLng(c);
                }


                    if (dataset["duplicatePoints"] && map.hasLayer(dataset["duplicatePoints"])) {
                        map.removeLayer(dataset["duplicatePoints"]);
                        map.removeLayer(dataset["duplicatePoints2"]);
                    }

                    // outer circle
                    circleStyle.radius = (circleRadius * step)/animationSteps;
                    dataset["duplicatePoints"] = L.circleMarker(center, circleStyle).addTo(map);

                    // inner circle
                    circleStyle.radius = (1 * step)/animationSteps;
                    dataset["duplicatePoints2"] = L.circleMarker(center, circleStyle).addTo(map);


                if (step<animationSteps){
                    setTimeout(function(){
                        doAnimationStep(step+1);
                    },25);
                }

            }
        };

        var resetDuplicateMarkers = function(){
          for (var i = 0, len = duplicateMarkers.length; i<len;i++){
              var marker = duplicateMarkers[i];
              var co = marker.getLatLng();
              if (co.originalLat && co.originalLng){
                  co.lat = co.originalLat;
                  co.lng = co.originalLng;
                  co.originalLat = undefined;
                  co.originalLng = undefined;
                  marker.setLatLng(co);
              }
          }
          duplicateMarkers = [];
          map.removeLayer(dataset["duplicatePoints"]);
          map.removeLayer(dataset["duplicatePoints2"]);

          if (clusterData && clusterData.currentClusterDot) clusterData.currentClusterDot.setOpacity(1);

          map.hasActiveDuplicateMarkers = false;
        };

        /*
        Show multiple layers or load them if they are not loaded yet
         */
        function showLayers(layerIdArray){
            for (var i = 0, len = layerIdArray.length; i<len; i++){
                var layerId = layerIdArray[i];
                if (dataset[layerId]){
                    // layer already loaded
                    map.addLayer(dataset[layerId]);
                    if (layers[layerId] && layers[layerId].onShowHide) layers[layerId].onShowHide(true);
                }else{
                    if (layers[layerId]){
                        // layer is defined but not loaded yet
                        layersToLoad.push(layerId);
                    }
                }
            }
            updateHash();
            if (layersToLoad.length > 0) loadNextLayer();
        }

        /*
         Hide multiple layers
         */
        function hideLayers(layerIdArray){
            var callBack = undefined;
            for (var i = 0, len = layerIdArray.length; i<len; i++){
                var layer = dataset[layerIdArray[i]];
                var layerData = layers[layerIdArray[i]];
                if (layer && map.hasLayer(layer)) map.removeLayer(layer);
                if (layerData && layerData.onShowHide) callBack = layerData.onShowHide;

            }
            updateHash();
            if (callBack) {
                callBack(false);
            }
        }

        function clearMap(){
            var layersIds = [];
            for (var key in layers) {
                if (layers.hasOwnProperty(key)) {
                    var layer = layers[key];
                    layersIds.push(layer.name)
                }
            }
            hideLayers(layersIds);
        }

        function getLayerData(layerID){
            return layers[layerID];
        }

        function reApplyFilter(layerID,triggerEvents){
            var layer = dataset[layerID];
            if (layer && map.hasLayer(layer)) layer.setFilter(layer.getFilter());

            var layerData = MapService.getLayerData(layerID);
            if (triggerEvents){
                if (layerData && layerData.onFilter) layerData.onFilter();
            }else{
                if (layerData && layerData.showClusters) MapService.updateCluster();
            }

        }

    // updates the url Hash so links can reproduce the current map state
    function updateHash(){
        clearTimeout(updateHashTimeout);

        updateHashTimeout = setTimeout(function(){
            var zoom = map.getZoom();
            var center = map.getCenter();
            var bounds = map.getBounds();

            var latitude = center.lat;
            var longitude = center.lng;

            var layerIdString = "";
            var filterIdString = "";
            var monthIdString = "";

            for (var key in baseLayer) {
                if (baseLayer.hasOwnProperty(key)) {
                    var layer = baseLayer[key];
                    if (layer && map.hasLayer(layer)){
                        layerIdString += "," + key;
                    }
                }
            }

            for (var key in layers) {
                if (layers.hasOwnProperty(key)) {
                    var layer = layers[key];
                    if (layer && map.hasLayer(dataset[layer.name]) && !layer.ignoreInUrl){
                        layerIdString += "," + layer.id;
                    }
                }
            }
/*
            $(".persistantfilter").each(function(index) {
                var filterId = this.getAttribute("data-filterId");
                if (filterId){
                    if (!$(this).hasClass("inactive")) filterIdString += "," + filterId;
                }
            });
            if (filterIdString != "") filterIdString = filterIdString.substr(1);
*/


            var timeFilterElement = $("#timefilter");
            timeFilterElement.find(".bar").each(function(index) {
                var isActive = "1";
                if ($(this).hasClass("inactive")) isActive = "0";
                monthIdString =  monthIdString + isActive;
            });


            if (layerIdString != "") layerIdString = layerIdString.substr(1);


            window.location.hash = latitude + "/" + longitude + "/" + zoom + "/" + layerIdString + "/" + filterIdString + "/" + monthIdString;
        },50);

    }


    function returnHasFilterPreset(){
        return hasFilterPreset;
    }

    function getTimeChartPreset(){
        return requestedTimeChartString;
    }


    function buildCluster(layerId){

        if (clusterLayer) map.removeLayer(clusterLayer);
        clusterLayer = L.mapbox.featureLayer().addTo(map).setZIndex(100);

        var layer = dataset[layerId];

        clusterData = {};
        var duplicateMarkerData = {};
        var markers = layer.getLayers();

        for (var i=0, len=markers.length; i<len; i++){
            var id = getClusterKey(markers[i]);
            if (duplicateMarkerData[id]){
                duplicateMarkerData[id]++;
            }else{
                duplicateMarkerData[id]=1;
            }
        }

        for (var key in duplicateMarkerData) {
            if (duplicateMarkerData.hasOwnProperty(key)) {
                if (duplicateMarkerData[key]>1){
                    var co = key.split("_");
                    var count = duplicateMarkerData[key];

                    var clusterDot = L.marker([
                        co[0],
                        co[1]
                    ], {
                        icon: L.divIcon(getClusterIcon(count)),
                        zIndexOffset: 1000
                    });
                    clusterData[key] = clusterDot;
                    clusterDot.addTo(clusterLayer);
                }
            }
        }
    }

    function getClusterIcon(count){
        var size = 20;
        if (count > 10) size = 20;
        if (count > 20) size = 30;
        if (count > 40) size = 50;
        if (count > 80) size = 60;

        return{
            className: 'count-icon size' + size,
            html: count,
            iconSize: [size, size]
        }
    }

    function getClusterKey(marker){
        var co = marker.getLatLng();
        return Math.floor(co.lat * 100000)/100000 + "_" + Math.floor(co.lng * 100000)/100000;
    }

    function monthName(i){
        var result = i;
        switch(i){
            case "01": result =  "januari"; break;
            case "02": result =  "februari"; break;
            case "03": result =  "march"; break;
            case "04": result =  "april"; break;
            case "05": result =  "may"; break;
            case "06": result =  "june"; break;
            case "07": result =  "july"; break;
            case "08": result =  "august"; break;
            case "09": result =  "september"; break;
            case "10": result =  "october"; break;
            case "11": result =  "november"; break;
            case "12": result =  "december"; break;
        }
        return result;
    }

    function formatDate(d){
        if (d){
            var p = d.split("-");
            var d = p[2];
            if (d.substr(0,1) == "0") d = d.substr(1,1);
            return d + " " + monthName(p[1]) + " " + p[0];
        }
        return "";
    }

    function listLayer(datasetId){
        $("#datalist").removeClass("hidden");
        var container = document.getElementById("dataListContainer");
        $(container).empty();
        var layer = dataset[datasetId];
        var markers = layer.getLayers();
        var table = document.createElement("div");
        for (var i = 0, len = markers.length; i<len; i++){
            var marker = markers[i];
            var co = marker.feature.geometry.coordinates;

            var entry =  createListDataEntry(marker.feature.properties.Date,marker.feature.properties.ACTOR1,marker.feature.properties.ACTOR2,marker.feature.properties.NOTES);
            entry.setAttribute("data-co", co[1] + "|" + (co[0]+0.05));

            table.appendChild(entry);
        }
        container.appendChild(table);
    }

    function createListDataEntry(date,actor,actor2,description){
        if (actor){
            if (actor2) actor += "/" + actor2;
            if (actor.length > 50) actor = actor.substring(0,50) + "...";
        }else{
            actor = "&nbsp";
        }

        if (date){
            var d = date.split("-");
            date = d[2] + "/" + d[1] + "/" + d[0];
        }

        var tr = document.createElement("div");
        tr.className = "entry";
        var td1 = document.createElement("div");
        td1.className = "date";
        td1.innerHTML = date;
        var td2 = document.createElement("div");
        td2.className = "actor";
        td2.innerHTML = actor;
        var td3 = document.createElement("div");
        td3.className = "description";
        td3.innerHTML = description;
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        return tr;

    }

    // utility function to list all dictinct values for a set (visible) markers
    function listDistinctFields(datasetId,field){
        var layer = dataset[datasetId];
        var markers = layer.getLayers();
        var distinct = [];
        for (var i = 0, len = markers.length; i<len; i++){
            var marker = markers[i];
            var value = marker.feature.properties[field];
            if ($.inArray(value,distinct)<0){
                distinct.push(value);
            }
        }

        distinct.sort();
        console.error(distinct);
    }


    // utility function to generate a piece to the UI for filtering layers
    function generateFilterCode(datasetId,field){

        var layer = dataset[datasetId];
        var markers = layer.getLayers();
        var distinct = [];
        for (var i = 0, len = markers.length; i<len; i++){
            var marker = markers[i];
            var value = marker.feature.properties[field];
            if ($.inArray(value,distinct)<0 && (value != null)){
                distinct.push(value);
            }
        }

        distinct.sort();

        var max = distinct.length;
        var colors = generateColors(max);


        var result = "/* CSS */ \n" ;

        for (var i=0;i<max;i++){
            var s = distinct[i];
            s = cleanString(s).toLowerCase();
            s = s.split("(").join("");
            s = s.split(")").join("");

            var c = colors[i];
            var hexColor = rgbToHex(c[0],c[1],c[2]);

            result += "#" + datasetId + "_" + s + ":before{background-color: #" + hexColor + "} \n";
        }


        result += "\n/* JS Marker colors */ \n" ;
        for (var i=0;i<max;i++){
            var s = distinct[i];
            var c = colors[i];
            var hexColor = rgbToHex(c[0],c[1],c[2]);

            result += "if (properties." + field + " == \"" + s + "\"){color = '#" + hexColor + "'; }\n";
        }


        result += "\n/* HTML */ \n" ;
        for (var i=0;i<max;i++){
            var s = distinct[i];
            var cleans = cleanString(s).toLowerCase();
            result += "<div class=\"datafilter\" data-filter=\"" + field + "\" data-value=\"" + s + "\" id=\""+ datasetId + "_" + cleans + "\">"+s+"</div>\n";
        }



        var box = document.createElement("textarea");
        box.style.position = "absolute";
        box.style.width = "500px";
        box.style.height = "500px";
        box.style.zIndex = 10000;
        document.body.appendChild(box);
        box.innerHTML = result;


    }

    function updateCluster(){
        buildCluster("incidents");
    }

        return{
            init: init,
            showLayers: showLayers,
            hideLayers: hideLayers,
            clearMap: clearMap,
            getLayerData: getLayerData,
            reApplyFilter: reApplyFilter,
            updateHash: updateHash,
            hasFilterPreset: returnHasFilterPreset,
            getTimeChartPreset: getTimeChartPreset,
            listDistinctFields: listDistinctFields,
            generateFilterCode: generateFilterCode,
            listLayer: listLayer,
            updateCluster: updateCluster
        }
}());