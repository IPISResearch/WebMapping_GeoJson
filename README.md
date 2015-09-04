# WebMapping_GeoJson

Features: 
 - connects to mapbox
 - loads data from geojson files
 - toggle layers based on property type - triggered by html data attributes / ids
 - auto filters based on html data properties
 - auto data graph generation
 - auto expand markers with same geo coordinates
 - stores state of map in url
 - simple login if needed
 - search function (auto generated from datafiles)
 - display info as popup or list
 - cookie based disclaimer/readme popup
 
Quickstart:
 - add datafiles
 - setup layers and properties in mapService.js
 - update layers styles ( getMarkerIcon - getLineStyle - getFillStyle in mapService)
 - generate search data through searchService.buildSearchIndex()
 - generate UI through mapService.generateFilterCode()
 - setup info popups (mustache template)
 - update UI, readme, disclaimer, ...
