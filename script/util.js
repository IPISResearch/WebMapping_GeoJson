/* Util functions */

function getUrlParameter(param){
    if (window.location.getParameter){
        return window.location.getParameter(param);
    } else if (location.search) {
        var parts = location.search.substring(1).split('&');
        for (var i = 0; i < parts.length; i++) {
            var nv = parts[i].split('=');
            if (!nv[0]) continue;
            if (nv[0] == param) {
                return nv[1] || true;
            }
        }
    } else {
        //return $.url.param(param);
        return "";
    }
}

// Array Filter PolyFill
if (!Array.prototype.filter)
{
    Array.prototype.filter = function(fun /*, thisArg */)
    {
        "use strict";

        if (this === void 0 || this === null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++)
        {
            if (i in t)
            {
                var val = t[i];

                // NOTE: Technically this should Object.defineProperty at
                //       the next index, as push can be affected by
                //       properties on Object.prototype and Array.prototype.
                //       But that method's new, and collisions should be
                //       rare, so use the more-compatible alternative.
                if (fun.call(thisArg, val, i, t))
                    res.push(val);
            }
        }

        return res;
    };
}


// JQuery ScrollTo Plugin
// http://lions-mark.com/jquery/scrollTo/

$.fn.scrollTo = function( target, options, callback ){
    if(typeof options == 'function' && arguments.length == 2){ callback = options; options = target; }
    var settings = $.extend({
        scrollTarget  : target,
        offsetTop     : 50,
        duration      : 500,
        easing        : 'swing'
    }, options);
    return this.each(function(){
        var scrollPane = $(this);
        var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
        var scrollY=scrollTarget;
        if (typeof scrollTarget != "number"){
            if (scrollTarget && scrollTarget.offset()){
                scrollY = scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
            }else{
                scrollY = 0;
            }

        }
        scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function(){
            if (typeof callback == 'function') { callback.call(this); }
        });
    });
};

// Cookies

function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}

function cleanString(s){
    if (typeof s == "undefined") s="";
    var cleans = s;
    cleans = cleans.split("(").join("");
    cleans = cleans.split(")").join("");
    return cleans.split(' ').join('_').split('&').join('_').split(',').join('_')
}

function decimalToDegrees(decimal,LatLong){
    var limitSecondsFraction = true;

    var sign = 1;
    if (isNaN(decimal)) decimal=0;
    if (decimal<0) sign = -1;

    var kwadrantChar = "";
    if (LatLong){
        // don't use negative numbers but NSWE
        if (LatLong == "lat"){
            kwadrantChar = " N";
            if (sign<0) kwadrantChar = " S";
        }
        if (LatLong == "lon"){
            kwadrantChar = " E";
            if (sign<0) kwadrantChar = " W";
        }
        sign = 1;

    }

    var decimalAbs = Math.abs(Math.round(decimal * 1000000.));
    if(decimalAbs > (180 * 1000000)) {
        // error: Degrees Longitude must be in the range of -180 to 180.
        decimalAbs=0;
    }

    var degree = Math.floor(decimalAbs/1000000) * sign;
    var minutes = Math.floor(((decimalAbs/1000000) - Math.floor(decimalAbs/1000000)) * 60);
    var seconds = (Math.floor(((((decimalAbs/1000000) - Math.floor(decimalAbs/1000000)) * 60) - Math.floor(((decimalAbs/1000000) - Math.floor(decimalAbs/1000000)) * 60)) * 100000) *60/100000 );
    if (limitSecondsFraction) seconds = Math.round(seconds*10)/10;

    var degreeString = degree + '&deg; ' + minutes + '\' ' + seconds + '&quot;' + kwadrantChar;

    degreeString = degreeString.split(".").join(",");

    return degreeString;

}


String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};
