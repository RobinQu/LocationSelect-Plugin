/*global ActiveXObject, geoip_latitude, geoip_longitude, jsonParse */

var com = {};
com.elfvision = {};
com.elfvision.kit = {};
com.elfvision.kit.LocationSelect = {};
com.elfvision.ajax = {};
com.elfvision.DEBUG = true;




 (function() {
    var ListModel,
    ListView,
    ListController,
    SelectGroup,
    LocationSelect,
    GeoDetect,
    ListHelper,
    XhrFactory,
    getJson,
    jsonp,
    getScript,
    debug,
    addEvent,
    delegator,
    SubjectHelper,
    isArray,
    serializeObj,
    forEach;

    debug = function() {
        if (com.elfvision.DEBUG) {
            var start = new Date().getTime();


            return function() {
                var i = 0,
                length = arguments.length,
                args = ["[DEBUG at ", (new Date().getTime() - start), " ] : "];
                for (; i < length; i++) {
                    args.push(arguments[i]);
                }
                if (window.console !== undefined && typeof window.console.log == "function") {
                   console.log.apply(console, args);
                } else {
                    
                }


            };

        } else {
            return function() {};
        }
    } ();

    delegator = function(that, func) {
        return function() {
            func.apply(that, arguments);
        };
    };

    addEvent = function(obj, event, func, that) {
        //a simple event manager using DOM Level 1
        debug("attaching event", event, "on the object", obj);
        var handler = function(e) {
            func.apply(that || obj, [e]);
        },
        e;
        if(window.jQuery !== undefined) {
            jQuery(obj).bind(event, handler);
        } else {
            if (document.addEventListener) {
                obj.addEventListener(event, handler, false);
            } else if (document.attachEvent) {
                handler = function(e) {
                    if (!e) {
                        e = window.event;
                    }
                    var event = {
                        //a synthetic event object
                        _event: e,
                        // In case we really want the IE event object
                        type: e.type,
                        target: e.srcElement,
                        currentTarget: obj,
                        relatedTarget: e.fromElement ? e.fromElement: e.toElement,
                        eventPhase: (e.srcElement == obj) ? 2: 3,
                        // Mouse coordinates
                        clientX: e.clientX,
                        clientY: e.clientY,
                        screenX: e.screenX,
                        screenY: e.screenY,
                        // Key state
                        altKey: e.altKey,
                        ctrlKey: e.ctrlKey,
                        shiftKey: e.shiftKey,
                        charCode: e.keyCode,
                        // Event-management functions
                        stopPropagation: function() {
                            this._event.cancelBubble = true;
                        },
                        preventDefault: function() {
                            this._event.returnValue = false;
                        }
                    };

                    func.apply(that || obj, [event]);

                };

                obj.attachEvent("on" + event, handler);
            }
        }



        /*
		var f1 = obj["on"+event],
			f2 = function(e) {
				var t = that || obj;
				if(f1 instanceof Function) {
					f1.apply(obj, [e]);
				}
				func.apply(t, [e]);
			};
		f1 = f2;
		*/
    };

    XhrFactory = function() {
        var factory,
        test,
        factories = [
        function() {
            return new XMLHttpRequest();
        },
        function() {
            return new ActiveXObject("Msxml2.XMLHTTP");
        },
        function() {
            return new ActiveXObject("Msxml3.XMLHTTP");
        },
        function() {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
        ];

        return {
            create: function() {
                if (factory) {
                    return factory();
                }

                for (var i = 0; i < factories.length; i++) {
                    try {
                        var test = factories[i];
                        var request = test();
                        if (request
                        /* && request.open*/
                        ) {
                            factory = test;
                            return request;
                        }
                    }
                    catch(e) {
                        continue;
                    }
                }

                //if we get here, the browser doesn't support xhr
                factory = function() {
                    throw new Error("XMLHttpRequest not supported");
                };
                factory();

            }
        };
    } ();

    getJson = function(config) {
        //debug("Get Json ",config);
        if (!config.url) {
            throw new Error("getJson : Must provide url for the request!");
        }
        var request = XhrFactory.create();
        //request.setRequestHeader("Content-Type", "application/json");
        request.onreadystatechange = function() {
            debug("Request Object ", request);
            if (request.readyState == 4) {
                // If the request is finished
                if (request.status == 200 || request.status === 0) {
                    //if the request is runned by a html local file, we cannot judge its destiny by status code, as it always returns status 0.
                    debug("JSON is successfully retrived according to ", config);
                    if (config.callback) {
                        debug("about to parse json");
                        var data = JSON.parse(request.responseText);
                        //var data = eval("(" + request.responseText + ")");
                        debug("parsed ", data);
                        config.callback.call(this, data);
                    }
                }
            }
        };
        request.open("GET", config.url + "?_=" + Math.random(), true);
        request.setRequestHeader("Cache-Control", "max-age=0,no-cache,no-store,post-check=0,pre-check=0");
        request.setRequestHeader("Expires", "Mon, 26 Jul 1997 05:00:00 GMT");
        request.send(null);

    };

    jsonp = function(url, cb) {
        var script = document.createElement('script'),
        reg,
        func;
        if (cb) {
            reg = /callback=(\w+)&*/;
            func = reg.exec(url)[1];
            window[func] = function(data) {
                cb(data);
                window[func] = null;
            };
        }
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    };

    getScript = function(fileName, callback) {
        var scriptTag = document.createElement("script");
        scriptTag.src = fileName;
        debug("getting script", fileName);
        if (callback) {
            scriptTag.onload = callback;
            scriptTag.onreadystatechange = function() {
                if (scriptTag.readyState == 4 || scriptTag.readyState == "loaded" || scriptTag.readyState == "complete") {
                    callback();
                }
            };
        }

        document.getElementsByTagName("head")[0].appendChild(scriptTag);

    };

    forEach = function(array, fun) {
        if (!Array.prototype.forEach) {
            var len = array.length >>> 0;
            if (typeof fun != "function") {
                throw new TypeError();
            }
            var thisp = arguments[1];
            for (var i = 0; i < len; i++)
            {
                if (i in array) {
                    fun.call(thisp, array[i], i, this);
                }

            }
        } else {
            return Array.prototype.forEach.call(array, fun);
        }
    };

    serializeObj = function(obj) {
        var str = [],
        unit = [];
        for (var key in obj) {
            unit = [];
            unit.push(key);
            unit.push("=");
            unit.push(obj[key]);
            str.push(unit.join(""));
        }
        return str.join("&");
    };

    isArray = function(obj) {
        if (obj && typeof obj === "object" && obj.constructor === Array) {
            return true;
        }
    };

    SubjectHelper = function() {
        this.observers = [];
        this.guid = 0;
    };

    SubjectHelper.prototype.subscribe = function(observer) {
        //debug("the subject ", this ," is subscribed by", observer);
        var guid = this.guid++;
        this.observers[guid] = observer;
        return guid;
    };

    SubjectHelper.prototype.unSubscribe = function(guid) {
        delete this.observers[guid];
    };

    SubjectHelper.prototype.notify = function(eventArgs) {
        //debug("this subject", this, " has these observers ", this.observers);
        //debug(this["observers"]);
        for (var item in this.observers) {
            var observer = this.observers[item];
            if (observer instanceof Function) {
                //debug("notifying the observer", observer);
                observer.call(this, eventArgs);
            }
            else {
                observer.update.call(this, eventArgs);
            }
        }
    };


    ListModel = function(obj) {
        this.onRowsInserted = new SubjectHelper();
        this.onRowsRemoved = new SubjectHelper();
        this.onRowsUpdated = new SubjectHelper();
        this.onSelectedIndexChanged = new SubjectHelper();
        this.items = [];
        this.selectedIndex = 0;
        this.level = obj.level || 0;
        this.label = obj.label || "Select...";
    };


    ListModel.prototype.read = function(index) {
        if (index) {
            debug("reading items[" + index + "]:", this.items[index]);
            return this.items[index];
        } else {
            return this.items;
        }
    };


    ListModel.prototype.insert = function(items) {
        if (isArray(items)) {
            items = [items];
            this.items = this.items.concat(items);
        } else {
            var item = items;
            this.items.push(item);
        }
        this.onRowsInserted.notify({
            "source": this,
            "items": items
        });
    };


    ListModel.prototype.remove = function(id) {
        var thing;
        if (id) {
            forEach(this.items,
            function(item, index) {
                if (item.id === id) {
                    thing = item;
                    this.items.splice(index, 1);
                }
            });
        } else {
            //if id is not specified, clear all
            this.items = [];
        }
        debug("notifying removing");
        this.onRowsRemoved.notify({
            "source": this,
            "items": [thing]
        });
    };

    ListModel.prototype.update = function(items) {
        items = items || [];
        debug("updating list model with ", items);
        this.items = [{
            "id": 0,
            "text": this.label
        }].concat(items);
        //this.setSelectedIndex(0);
        debug("notifying updating");
        this.onRowsUpdated.notify({
            "source": this,
            "items": items
        });
    };

    ListModel.prototype.getSelectedIndex = function() {
        return this.selectedIndex;
    };

    ListModel.prototype.setSelectedIndex = function(index) {
        var previous = this.getSelectedIndex();
        if (previous === index) {
            return;
        }
        this.selectedIndex = index;
        debug("notifying index changed", index);
        this.onSelectedIndexChanged.notify({
            source: this,
            previous: previous,
            present: index,
            previousItem: this.read(previous),
            presentItem: this.read(index),
            level: this.level
        });
    };

    ListView = function(obj) {
        this.model = obj.model;
        this.controller = obj.controller;
        this.element = obj.element;

        var updateList = delegator(this, this.rebuildList),
        updateGroup = delegator(this.controller.parent, this.controller.parent.update);


        this.model.onRowsInserted.subscribe(updateList);
        this.model.onRowsRemoved.subscribe(updateList);
        this.model.onRowsUpdated.subscribe(updateList);

        /*onSelectedIndexChanged will cause ListModel to call SelectGroup.update method once ListModel.selectedIndex is changed
		in fact, DOM Event(onChange) will cause ListModel to change its selectedIndex, while the selectedIndex is observed and once changed, will trigger the SelectGroup to load its silbling menu.
		*/
        this.model.onSelectedIndexChanged.subscribe(updateGroup);
        debug("this list item", this);

        addEvent(this.element, "change", this.controller.updateSelectedIndex, this.controller);
        //change selectedIndex in ListModel
    };

    ListView.prototype.show = function() {
        this.element.style.display = "inline-block";
    };

    ListView.prototype.hide = function() {
        this.element.style.display = "none";
    };



    ListView.prototype.rebuildList = function(e) {
        if (e && e.present && e.present === 0) {
            this.elements.list.selectedIndex = 0;
            //set html dropdown menu to default item
            return;
        }
        debug("Rebuilding list ", this);
        var list = this.element,
        items = this.model.read(),
        length = items.length,
        opt;

        list.innerHTML = "";
        debug(items.length);

        forEach(items,
        function(item, index) {
            opt = new Option();
            opt.setAttribute("value", item.id);
            opt.appendChild(document.createTextNode(item.text));
            list.appendChild(opt);
        });

        this.model.setSelectedIndex(0);
    };


    ListController = function(obj) {
        this.parent = obj.parent;
        this.model = new ListModel({
            level: obj.level,
            label: obj.label
        });
        this.view = new ListView({
            model: this.model,
            controller: this,
            element: obj.element
        });

    };

    ListController.prototype.refresh = function(data) {
        //update model with given data
        debug("refresh data with ", data);
        this.model.update(data);
    };

    ListController.prototype.updateSelectedIndex = function(e) {
        this.model.setSelectedIndex(e.target.selectedIndex);
    };

    ListController.prototype.selectByText = function(text) {
        var that = this;
        forEach(this.model.read(),
        function(item, index) {

            if (item.text.match("^" + text) == text) {
                debug("auto detected ", item, index);
                that.model.setSelectedIndex(index);
                that.view.element.selectedIndex = index;
            }
        });
    };

    ListController.prototype.getValue = function() {
        return this.model.read(this.model.getSelectedIndex()).text;
    };



    SelectGroup = function(obj) {
        this.labels = obj.labels;
        this.currentGeo = {};
        this.lists = [];
        this.elements = obj.elements;
        this.parent = obj.parent;
    };

    SelectGroup.prototype.init = function() {
        debug("init select group");

        var i = 0,
        level = this.labels.length,
        that = this;

        for (; i < level; i++) {
            //building list for SelectGroup
            this.lists.push(new ListController({
                label: this.labels[i],
                element: this.elements[i],
                level: i,
                parent: that
            }));
        }
        debug("lists built ", this);
        debug(this.parent.listHelper.find( - 1));
        this.lists[0].refresh(this.parent.listHelper.find( - 1));
        this.lists[0].view.show();
    };


    SelectGroup.prototype.update = function(e) {
        //this event is always behind ListContoller.updateSelected
        if (e.level == this.lists.length - 1) {
            // if this is not the last list
            return;
        }
        debug("Updating SelectGroup contents", this);
        if (e.present === 0) {
            //if the user undo
            var i = e.level + 1,
            length = this.lists.length;
            for (; i < length; i++) {
                this.lists[i].refresh();
                this.lists[i].view.hide();
            }
            return;
        }
        switch (e.level) {
        case 0:
            this.currentGeo.province = e.presentItem.text;
            break;
        case 1:
            this.currentGeo.city = e.presentItem.text;
            break;
        case 2:
            this.currentGeo.district = e.presentItem.text;
            break;
        }

        this.lists[e.level + 1].refresh(this.parent.listHelper.find(e.level, e.presentItem.id));
        this.lists[e.level + 1].view.show();

    };

    SelectGroup.prototype.setValues = function(values) {
        debug("setting group values", values);
        var that = this;
        forEach(values,
        function(item, index) {
            if (item) {
                that.lists[index].selectByText(item);
            }
        });
    };

    SelectGroup.prototype.getValues = function() {
        var values = [];
        forEach(this.lists,
        function(item, index) {
            values.push(item.getValue());
        });
        return values;
    };


    /*
		finnally we wrap up all parts
		config {
			element : [DOMElement,...]
			detectGeoLocation : Boolean
			listHelper : ListHelper Object
			detector ： Function
		}
	*/
    LocationSelect = function(config) {

        this.detectGeoLocation = config.detectGeoLocation === undefined ? true: config.detectGeoLocation;
        this.detector = config.detector || GeoDetect;
        this.listHelper = config.listHelper || ListHelper.getInstance({
            dataUrl: config.dataUrl
        });
        this.selectGroup = new SelectGroup({
            parent: this,
            labels: config.labels,
            elements: config.elements
        });
        var that = this;
        this.listHelper.fetch(function() {
            //callback after data feteched
            debug("exec fetech callback");
            that.selectGroup.init();

			if (that.detectGeoLocation) {
	            that.detector();
	        }
			
        });

        

    };

    LocationSelect.prototype.report = function() {
        return this.selectGroup.getValues();
    };

    /*
		arguments : 
			values : Array<String>
		descriptions : set values of all list menu by its text labels respectively. you should pass an array containing the text labels of desired option items, most importantly, in the right order.
	*/
    LocationSelect.prototype.select = function(values) {
        this.selectGroup.setValues(values);
    };

    /*
		this is a sample function to detect geolocation by IP address
		we parse users' latitude and longitude using Maxmind GeoCity API
		and then we parse user's address with the help of the lat and lng info we got
		lastly, we extract the info inside the response from Google map
		
		as you may know, due to the cross domain limits, we cannot take advantage of Google Map WebService directly. In order to work around, I manage to proxy the json data through Yahoo Query API
		yes, it actually slows down a little bit, but considering the immense file size of complete GoogleMap API scripts (if we wanna use google.maps.Geocoder class instead),
it's worthwhile.	

	if you really want to detect in your own way, you just implement your own function.
	after you get your results,  use LocationSelect.select method to explictly manipulate the values of all menu lists.
	
	*/
    GeoDetect = function() {
        debug("Detect!!!!");
        var that = this,
        queryStr;
        getScript("http://j.maxmind.com/app/geoip.js",
        function() {
            debug("Maxmind API Loaded!");
            queryStr = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%0A%20%20url%3D%22http%3A%2F%2Fmaps.google.com%2Fmaps%2Fapi%2Fgeocode%2Fjson%3Flatlng%3D" + geoip_latitude() + "%2C" + geoip_longitude() + "%26sensor%3Dfalse%26language%3Dzh-CN%22&format=json&diagnostics=true&callback=locationselectcb";

            jsonp(queryStr,
            function(data) {
                debug("Geocoder Request Completed through YQL ", data);

                if (data.query.results.json.status === "OK") {

                    var parts = data.query.results.json.results[0].address_components,
                    geo = {};
                    debug("Geocoder statuts ok", parts);
                    forEach(parts,
                    function(item, index) {
                        var type = item.types[0];
                        if (type === "locality") {
                            geo.city = item.long_name;
                        }
                        else if (type === "administrative_area_level_1") {
                            geo.province = item.long_name;
                        }
                    });
                    that.select([geo.province, geo.city]);
                }
            });

        });




    };


    /*
		ListHelper Object - a very important object to fetch, filter and cache data
		
		this should be an interface for users to implement their own ListHelper so that they can adapt to their own enviornment.	
		Considering the perfromance issuse, it should be a singleton.
		this ListHelper serves as an example and is uesed as default ListHelper if users don't assign a specific ListHelper of their own.
		ListHelper at least shuold have all methods in this class.
	*/
    ListHelper = function() {
        var instance,
        constructor = function(config) {
            //private memebers
            var dataUrl = config.dataUrl || "areas_1.0.json",
            cache = function() {
                /*
						cache variable as the storage for json records
						key is the name of record name, and value is an associative array, e.g. 
						{
							"city" : [Record...]
						}

						Record Object is a simple js object, which has following members:

						{
							id: 430010,
							text: "Wuhan"
						}

						id : Number as unique identifier
						text : String as visual identifier
					*/

                var storage = {};

                return {
                    get: function(key) {
                        //debug("feteching from cache, ", storage[key]);
                        return storage[key];
                    },
                    set: function(key, value) {
                        //debug("save to cache, ", value);
                        storage[key] = value;
                    }
                };

            } ();

            return {
                //public members
                fetch: function(callback) {
                    debug("feteching areas data");
                    var cb = function(data) {
                        //store all the geo data in the cache
                        debug("area data : ", data);
                        cache.set("province", data.province);
                        cache.set("city", data.city);
                        cache.set("district", data.district);
                        //debug("area testing with cache.get('province')", cache.get("province"));
                        callback();
                    };

                    getJson({
                        url: dataUrl,
                        callback: cb
                    });
                },
                find: function(level, id) {
                    /* 
						find data by level and id, level
						level -1 : data for options of first menu when this component is loaded
						level n(n>=0) : this query request is submitted by the n-th list menu.
						id : the unique identifier that can be used to query the descendent records. In the postal system of China, 430000 is the zip for Hubei Province, while 430010 is the city of Wuhan, which is within Hubei. If we want to query all the cities in Hubei, we should pass id with value of 430000. The query algorithm here is designed for Chinese Zipcode.
					*/
                    var results = [];
                    debug("querying by record id : ", id, "by list in level : ", level);
                    if (cache.get(id)) {
                        debug("lucky! we have it cached");
                        results = cache.get(id);
                    } else {
                        debug("finding it in areas data");
                        //if the request is submitted by first level menu
                        if (level === -1) {
                            debug("this is a query for province data");
                            results = cache.get("province");
                        } else {
                            //procced with query
                            var prefix = id.toString().substring(0, (level + 1) * 2),
                            reg = new RegExp("^" + prefix + "\\d*"),
                            candidate = level === 0 ? cache.get("city") : cache.get("district"),
                            i = 0,
                            length = candidate.length;

                            forEach(candidate,
                            function(item, index) {
                                if (reg.test(item.id)) {
                                    results.push(candidate[index]);
                                }
                            });
                        }
                    }
                    debug("Return results : ", results);
                    return results;
                }
            };
        };

        return {
            getInstance: function(config) {
                if (!instance) {
                    instance = constructor(config);
                }
                return instance;
            }
        };
    } ();

    //import to the my namespace
    com.elfvision.kit.LocationSelect = LocationSelect;
    com.elfvision.ajax.XhrFactory = XhrFactory;
    com.elfvision.ajax.getJson = getJson;
    com.elfvision.ajax.jsonp = jsonp;
    com.elfvision.ajax.getScript = getScript;

})();

if(window.jQuery !== undefined) {
	
	$.LocationSelect = {
		build : function(user_config) {
			var config = user_config, instance;
			config.elements = this.get();
			instance = new com.elfvision.kit.LocationSelect(user_config);
			$.LocationSelect.all[config.name] = instance;
			return this;
		}
	};
	
	$.LocationSelect.all = {};
	
	$.fn.LocationSelect = $.LocationSelect.build;
	
}