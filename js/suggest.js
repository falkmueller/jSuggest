/*!
 * Suggest v1.0.0 (https://falk-m.de)
 * Copyright 2011-2017 falk-m.de
 * Released under an MIT-style license.
 */
(function(factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($) {
    
    var VERSION = "1.0.0",
        PLUGIN_NS = 'suggest_plugin';
    
    /**
    * The default configuration, and available options to configure
    */
    
    var defaults = {
        url: null,
        data: null,
        maxDisplay: 10,
        minLetter: 1,
        url_data: {},
        layerTemplate: "<ul class=\"suggest\"></ul>",
        itemTemplate: "<li></li>",
        rootSelector: "body",
        itemActiveClass: "hover",
        searchWait: 200
    };
    
    /**
    * Applies suggest behaviour to one or more jQuery objects.
    */
    $.fn.suggest = function(method) {
        var $this = $(this),
          plugin = $this.data(PLUGIN_NS);

        //Check if we are already instantiated and trying to execute a method
        if (plugin && typeof method === 'string') {
          if (plugin[method]) {
            return plugin[method].apply(plugin, Array.prototype.slice.call(arguments, 1));
          } else {
            $.error('Method ' + method + ' does not exist on jQuery.suggest');
          }
        }
        //Else update existing plugin with new options hash
        else if (plugin && typeof method === 'object') {
            plugin['option'].apply(plugin, arguments);
        }

        //Else not instantiated and trying to pass init object (or nothing)
        else if (!plugin && (typeof method === 'object' || !method)) {
           return init.apply(this, arguments);
        }

        return $this;
    };
    
    /**
    * The version of the plugin
    * @readonly
    */
    $.fn.suggest.version = VERSION;
    
    //Expose our defaults so a user could override the plugin defaults
    $.fn.suggest.defaults = defaults;

    
    
      /**
   * Initialise the plugin for each DOM element matched
   * This creates a new instance of the main suggest class for each DOM element, and then
   * saves a reference to that instance in the elements data property.
   * @internal
   */
  function init(options) {

        if (!options) {
          options = {};
        }

        //pass empty object so we dont modify the defaults
        options = $.extend({}, $.fn.suggest.defaults, options);

        //For each element instantiate the plugin
        return this.each(function() {
          var $this = $(this);

          //check if element is a input
            if($this.prop("tagName").toLowerCase() !== 'input'){
                $.error('Elements for jQuery.suggest must by inputs');
                return;
            } 

          //Check we havent already initialised the plugin
          var plugin = $this.data(PLUGIN_NS);

          if (!plugin) {
            plugin = new Suggest(this, options);
            $this.data(PLUGIN_NS, plugin);
          }
        });
    }
    
    /**
    * Main TouchSwipe Plugin Class.
    */
    function Suggest(element, options) {
        var me = this;
        
        var uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        //take a local/instacne level copy of the options - should make it this.options really...
        var options = $.extend({}, options);
        
        //jQuery wrapped element for this instance
        var $element = $(element);
        
        //private variables
        var $layer, layer_position;
        
        var construct = function (){
            //read options from element
            if ($element.data("suggest-url")){options.url = $element.data("suggest-url"); }
            
            $element.attr("autocomplete", "off");
            me.enable();
        };
        
        var timeout_onFocusout = null;
        
        me.enable = function(){
            $element.on("keyup.suggest-" + uid,me.onChange);
        };
        
        me.disable = function(){
             $element.off("keyup.suggest-" + uid);
             if($layer){
                 me.closeLayer();
             }
        }
        
        me.onFocusout = function(){
            if (timeout_onFocusout){
                clearTimeout(timeout_onFocusout);
            }
            
            timeout_onFocusout = setTimeout(me.closeLayer, 150);
        };
        
        me.closeLayer = function(){
            if(!$layer){
                return;
            }
            
            $layer.remove();
            $layer = null;
            
            $element.off("focusout.suggest-" + uid);
            $(window).off("scroll.suggest-" + uid);
            $(window).off("resize.suggest-" + uid);
            $element.off("keydown.suggest-" + uid);
            
        };
        
         me.onNavigate = function(event){
            if(!$layer){
                return true;
            }
            
            
            var item_count = $layer.children().length;
            var active_item = $layer.find("." + options.itemActiveClass);
            var active_item_index = -1;
            if(active_item.length > 0){
                active_item_index = $layer.children().index(active_item);
            }
            
            if(event.keyCode == 38){
                //up
                if(item_count == 0){ return;}
                if(active_item_index <= 0){ 
                    active_item_index = item_count - 1;
                } else {
                    active_item_index--; 
                }
                
                active_item.removeClass(options.itemActiveClass);
                active_item = $($layer.children()[active_item_index])
                active_item.addClass(options.itemActiveClass);
                active_item.trigger("click"); 
                return false;
            }
            else if(event.keyCode == 40){
                //down
                if(item_count == 0){ return;}
                if(active_item_index == -1 || active_item_index == item_count - 1){ 
                    active_item_index = 0;
                } else {
                    active_item_index++; 
                }
                
                active_item.removeClass(options.itemActiveClass);
                active_item = $($layer.children()[active_item_index])
                active_item.addClass(options.itemActiveClass);
                active_item.trigger("click"); 
                return false;
            }
            else  if(event.keyCode == 13){
                //enter
                $element.trigger("focusout");
                return false;
            }
            
            return true;
         };
        
        var timeout_onChange = null;
        
        me.onChange = function(event){
            var value = $element.val();
            
            if(timeout_onChange){
                clearTimeout(timeout_onChange);
            }
            
            if(value.length < options.minLetter){
                me.closeLayer();
                return false;
            }
            
            if (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13){
                return false;
            }
            
           timeout_onChange = setTimeout(function(){ me.search(value); }, options.searchWait);
        };
        
        me.search = function(value){
            if(options.url){
                var data = options.url_data || {};
                data.search = value;
                data.limit = options.maxDisplay;
                
                $.ajax({
                   url:  options.url,
                   data: data,
                   method: 'POST',
                   success: function(data){
                       if (!$.isArray(data) || data.length == 0){
                            me.closeLayer();
                            return;
                       }
                       
                       if(data.length > options.maxDisplay){
                           data = data.slice(0, options.maxDisplay);
                       }
                       
                       me.openLayer(data);
                   },
                   error: function(){me.closeLayer();}
                });
                //url_data
            } else if ($.isArray(options.data) && options.data.length > 0){
                
                var find = [];
                $(options.data).each(function(i, text){
                    var result= text.search(new RegExp(value, "i"));
                    if(result >= 0 && find.length < options.maxDisplay){
                        find.push(text);
                    }
                });
                me.openLayer(find);
                
            } else {
                me.closeLayer();
            }
        };
        
        me.openLayer = function(find){
            me.closeLayer();
            if(find.length == 0){
                return;
            }
            
            $layer = $(options.layerTemplate);
            
            $(find).each(function(i, text){
                var item = $(options.itemTemplate);
                item.html(text);
                item.on("click", function(){me.selectItem(text)});
                $layer.append(item);
            });
            
            $(options.rootSelector).append($layer);
            me.posLayer();
            
            $element.on("focusout.suggest-" + uid,me.onFocusout);
            $element.on("keydown.suggest-" + uid,me.onNavigate);
            $(window).on("scroll.suggest-" + uid,me.posLayer);
            $(window).on("resize.suggest-" + uid,me.posLayer);
            
        }
        
        me.selectItem = function(value){
            $element.val(value);
        };
        
        me.posLayer = function(){
            if(!$layer){
                return;
            }
            
            $layer.css("width", $element.outerWidth())
            $layer.css("left", $element.offset().left)
            $layer.css("top", $element.offset().top + $element.outerHeight())
            layer_position = "bottom";
            
            var offset_top = $element.offset().top - $(document).scrollTop();
            var offset_bottom = $(window).height() - offset_top - $element.outerHeight();
            if(($element.offset().top > $layer.outerHeight()) && (offset_bottom <= 0 || offset_top/offset_bottom > 2)){
                $layer.css("top", $element.offset().top - $layer.outerHeight());
                layer_position = "top";
            }
            
        };
        
        /**
        * Allows run time updating of the swipe configuration options.
        */
        me.option = function(property, value) {

            if (typeof property === 'object') {
              options = $.extend(options, property);
            } else if (options[property] !== undefined) {
              if (value === undefined) {
                return options[property];
              } else {
                options[property] = value;
              }
            } else if (!property) {
              return options;
            } else {
              $.error('Option ' + property + ' does not exist on jQuery.suggest.options');
            }

            return null;
        }
        
        //init
        construct();
        
    }
   
}));