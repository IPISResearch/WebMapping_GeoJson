var SearchService = (function() {

    var dataset = [];
    var searchInput;
    var searchResultElement;
    var searchPage = 0;
    var searchResults;


    var init = function(){
        searchInput = $("#searchForm").find("input");
        searchResultElement = document.getElementById("searchresults");

        loadSearchData();
        attachUI();
    };

    var loadSearchData = function(){
        //$.get("data/search/places.json?v" + version,function(result){
        //    dataset = result;
        //});


        $.get(Config.getIPISAPIurl("cod/searchdata") + "?v" + version,function(result){
            dataset = result.result;
        });

    };

     /*
        returns an array of search results
     */

    var searchFor = function(searchString){

        function contains(searchString) {
            return function(element) {
                return element.s.indexOf(searchString) >= 0;
            }
        }

        searchPage = 0;
        searchResults = dataset.filter(contains(searchString.toLowerCase()));

        return searchResults;
    };

    var attachUI = function(){

        $("#searchbox").find(".control-search").on("click",function(){
            $("#searchpanel").toggle();

            if ($("#searchpanel").is(":visible")){
                searchInput.focus();
            }
        });

        $("#searchForm").on("submit",function(){
            var searchString = searchInput.val();
            if (searchString != ""){
                listSearchResults(searchFor(searchString));
            }else{
                hideSearchResults();
            }
           return false;
        });

        // remove if too heavy
        searchInput.on("keyup",function(){
            var searchString = searchInput.val();
            if (searchString != ""){
                listSearchResults(searchFor(searchString));
            }else{
                hideSearchResults();
            }
            return false;
        });

        $("#searchresults").on("click",".result",function(){
            var co = this.getAttribute("data-co");
            var location = co.split(',');
            map.setView(location, 13);
        });

        $("#searchresults").on("click",".more",function(){
            searchPage++;
            listSearchResults(searchResults);
        });

        $("#searchresults").on("click",".less",function(){
            searchPage--;
            searchPage = Math.max(searchPage,0);
            listSearchResults(searchResults);
        })
    };

    var listSearchResults = function(results){
        var resultLen = results.length;
        var resulsPerPage = 18;
        var page = searchPage;
        var startIndex = resulsPerPage * page;
        var endIndex = Math.min((startIndex+resulsPerPage),resultLen);

        var len = endIndex - startIndex;
        $(searchResultElement).empty();


        $(searchResultElement).empty();
        for (var i = startIndex; i < endIndex ; i++){

            var result = results[i];
            var div = document.createElement("div");
            div.className = "result i" + result.i;
            div.innerHTML = result.s;
            div.setAttribute("data-co", result.y + "," + result.x);
            searchResultElement.appendChild(div);
        }

        var footerHTML = resultLen + " results";
        if (resultLen == 1) footerHTML = "1 results";

        if (page>0){
            footerHTML = footerHTML +  ' <span class="less"><<<</span>  ' + (startIndex+1)  + "-" + endIndex;
            if (resultLen > endIndex) footerHTML = footerHTML +  ' <span class="more">>>></span>';
        }else{
            if (resultLen > endIndex) footerHTML = footerHTML +  ' (<span class="more">' + (resultLen-endIndex) + ' more</span>)';
        }


        var footer = document.createElement("div");
        footer.className = "footer";
        footer.innerHTML = footerHTML;
        searchResultElement.appendChild(footer);

        $(searchResultElement).show();

    };

    var hideSearchResults = function(){
        $(searchResultElement).hide();
    };

    // usage: SearchService.buildSearchIndex('base_places.json')
    var buildSearchIndex = function(baseDataUrl){

        $.get("data/search/" + baseDataUrl,function(result){

            var filterDuplicates = true;
            var itemsCache = {};

            baseData = result;
            var searchData = [];
            for (var i = 0, len = baseData.features.length; i<len; i++){
                var feature = baseData.features[i];
                var properties = feature.properties;
                var co = feature.geometry.coordinates;

                properties.Type = 1;

                var searchItem = {
                    "s":properties.LOCATION.toLowerCase(),
                    "i":properties.Type,
                    "x":co[0],
                    "y":co[1]
                };

                var addItem = true;
                if (filterDuplicates){
                    if (typeof itemsCache[searchItem.s] == "undefined"){
                        itemsCache[searchItem.s] = true;
                    }else{
                        addItem = false;
                    }
                }
                if (addItem) searchData.push(searchItem);
            }

            var box = document.createElement("textarea");
            box.style.position = "absolute";
            box.style.width = "500px";
            box.style.height = "500px";
            box.style.zIndex = 10000;
            document.body.appendChild(box);
            box.innerHTML = JSON.stringify(searchData);

        });
    };


    // usage: SearchService.buildSearchIndex('base_places.json')
    var buildSearchIndexFromUrl = function(baseDataUrl){


        $.get("data/search/" + baseDataUrl,function(result){

            var filterDuplicates = true;
            var itemsCache = {};

            baseData = result;
            var searchData = [];
            for (var i = 0, len = baseData.features.length; i<len; i++){
                var feature = baseData.features[i];
                var properties = feature.properties;
                var co = feature.geometry.coordinates;

                properties.Type = 1;

                var searchItem = {
                    "s":properties.LOCATION.toLowerCase(),
                    "i":properties.Type,
                    "x":co[0],
                    "y":co[1]
                };

                var addItem = true;
                if (filterDuplicates){
                    if (typeof itemsCache[searchItem.s] == "undefined"){
                        itemsCache[searchItem.s] = true;
                    }else{
                        addItem = false;
                    }
                }
                if (addItem) searchData.push(searchItem);
            }

            var box = document.createElement("textarea");
            box.style.position = "absolute";
            box.style.width = "500px";
            box.style.height = "500px";
            box.style.zIndex = 10000;
            document.body.appendChild(box);
            box.innerHTML = JSON.stringify(searchData);

        });
    };

    var sortSearchIndex = function(){
        console.log("sorting", dataset);
        dataset.sort(function(a,b){
            console.log(a.s, b.s)
            return a.s > b.s
        })

        var box = document.createElement("textarea");
        box.style.position = "absolute";
        box.style.width = "500px";
        box.style.height = "500px";
        box.style.zIndex = 10000;
        document.body.appendChild(box);
        box.innerHTML = JSON.stringify(dataset);
    };

    return{
        init: init,
        searchFor: searchFor,
        buildSearchIndex: buildSearchIndex,
        sortSearchIndex: sortSearchIndex
    }

}());

