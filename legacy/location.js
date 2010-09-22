(function($) {
	$.LocationSelect = {
		defaults : {
				data: "areas.json",
				autoDetect : false
		},
		build : function(user_opts) {
			var options = $.extend($.LocationSelect.defaults, user_opts);
			return $(this).each(function() {
				var specs = {
					holder : $(this),
					selectors: {},
					_province : "",
					_city : "",
					_pCode : "",
					_cCode : "",
					opts : options
				};
				specs.holder.append('<select name="province"><option value="0">请选择一个省或直辖市</option></select><select name="city"><option value="0">请选择一个市</option></select><select name="district"><option value="0">请选择一个地区</option></select>');
				try{
					$.LocationSelect.init(specs);
				} catch(e) {
					setTimeout(function() {
						$.LocationSelect.init(specs);
					},1000);
				}
			});
		},
		data : {
			province : [],
			city: [],
			district: []
		},
		setDefaultLocation: function(specs){
		    var geocoder = new GClientGeocoder();
		    var userLatLng = new google.maps.LatLng(geoip_latitude(), geoip_longitude());
		    geocoder.getLocations(userLatLng, function(response){
		        if (!response || response.Status.code != 200) {
		            app.debug("no results from reverse geocoding!");
		        }
		        else {
		            var node = response.Placemark[0];
		            
		            specs._province = node.AddressDetails.Country.AdministrativeArea.AdministrativeAreaName;
		            specs._city = node.AddressDetails.Country.AdministrativeArea.Locality.LocalityName;
		            
		            $.each($.LocationSelect.data.province, function(i, item){
		                if (item.name == specs._province) {
		                    specs._pCode = item.code;
		                }
		            });
		            specs.selectors.province[0].value = specs._pCode;
		            
		            $.each($.LocationSelect.data.city, function(i, item){
		                if (item.code.startsWith(specs._pCode.substring(0, 2))) {
		                    specs.selectors.city.append("<option value='" + item.code + "'>" + item.name + "</option>");
		                    if (item.name == specs._city) {
		                        specs._cCode = item.code;
		                    }
		                }
		            });
		            specs.selectors.city[0].value = specs._cCode;
		            specs.selectors.city.change();
		        }
		    });
		    
		},
		init: function(specs){
		    specs.selectors.province = specs.holder.find("select[name='province']");
		    specs.selectors.city = specs.holder.find("select[name='city']");
		    specs.selectors.district = specs.holder.find("select[name='district']");
			
			$.getJSON(specs.opts.data, function(data){
			    $.LocationSelect.data.province = data.province;
			    $.LocationSelect.data.district = data.district;
			    $.LocationSelect.data.city = data.city;
			    
			    $(specs.selectors.city).change(function(evt){
			        fetch(evt.target);
			    });
			    $(specs.selectors.province).change(function(evt){
			        fetch(evt.target);
			    });
			    $.each($.LocationSelect.data.province, function(i, item){
			        var str = "<option value='" + item.code + "'>" + item.name + "</option>";
			        specs.selectors.province.append(str);
			    });
			    
			    if(specs.opts.autoDetect) {
			    	$.LocationSelect.setDefaultLocation(specs);
			    }
			    
			});
			
		    function fetch(target){
		        var _start, //leading string of code
					 _result = new Array(), //filtered result array
					 _d, //data to be inserted
					 _s, //the selector that requested the fetching
					 _o, //html string of default option element
					 n = target.value;//value of option code in the former select element
		 		
		        if (zero(n) == 4) {//省份 获取 城市信息
		            _start = n.substring(0, 2);
		            _s = specs.selectors.city;
		            _d = $.LocationSelect.data.city;
		            /*
		            if (!specs._pCode || !specs._cCode) {
		                _o = "<option value='0'>请选择一个城市</option>";
		            }*/
		            $(specs.selectors.district).find("option[value!='0']").remove();
		            
		        }
		        else {// 城市 获取 区域信息
		            _s = specs.selectors.district;
		            _start = n.substring(0, 4);
		            _d = $.LocationSelect.data.district;
		            /*
		            if (!specs._pCode || !specs._cCode) {
		                _o = "<option value='0'>请选择一个区</option>";
		            }*/
		        }
		        $(_s).find("option[value!='0']").remove();
		        if (_o) 
		            $(_s).append(_o);
		        $.each(_d, function(i, item){
		            if (item.code.startsWith(_start)) {
		                _result.push(item);
		            }
		        });
		        $.each(_result, function(i, item){
		            var str = "<option value='" + _result[i].code + "'>" + _result[i].name + "</option>";
		            $(_s).append(str);
		        });
		        
		        /*
		         * how many zero are the in the end of a string
		         */
		        function zero(a){
		            
		            if (a) {
						var i = a.length, n = 0;
		                while (i > 0) {
		                    i--;
		                    if (a.charAt(i) == "0") 
		                        n++;
		                }
		            }
		            return n;
		        };
		    };
		},
		get: function(){
		    var holder = $(this),
		    	province = holder.find("select[name='province']"),
		    	city = holder.find("select[name='city']"),
		    	district = holder.find("select[name='district']"),
		    	info = {
		        "province": province.val() == 0 ? "" : province[0].options[province[0].selectedIndex].text,
		        "city": city.val() == 0 ? "" : city[0].options[city[0].selectedIndex].text,
		        "district": district.val() == 0 ? "" : district[0].options[district[0].selectedIndex].text
		    };
		    return info;
		}
	}
	
	$.fn.LocationSelect = $.LocationSelect.build;
	$.fn.getLocation = $.LocationSelect.get;
	
	if (!String.prototype.startsWith) {
	    String.prototype.startsWith = function(str){
	        if (str) 
	            return this.substring(0, str.length) == str;
	    };
	}
})(jQuery);