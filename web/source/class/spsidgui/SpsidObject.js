qx.Class.define
("spsidgui.SpsidObject",
 {
     extend : qx.core.Object,
     
     construct : function(objID, attr) {
         this.initObjectID(objID);
         if( attr != undefined ) {
             this.setAttrCache(attr);
             this._initObjectName();
             this.setReady(true);
         }
         else {
             this._fetchAttributes();
         }
     },

     properties : {
         ready : {
             check : "Boolean",
             init : false
         },
         
         objectID :  {
             check: "String",
             deferredInit : true
         },
         
         attrCache : {
             init : null,
             nullable : true,
             check: "Map"
         },

         objectName : {
             init : "",
             check : "String"
         }
     },

     events :
     {
         "loaded": "qx.event.type.Data"
     },

     members :
     {
         _fetchAttributes : function() {
             var rpc = spsidgui.SpsidRPC.getInstance();
             var myself = this;
             rpc.get_object(
                 function(attr) {
                     myself.setAttrCache(attr);
                     myself._initObjectName();
                     myself.setReady(true);
                     myself.fireDataEvent("loaded");
                 },
                 this.getObjectID());
         },

         _initObjectName : function() {
             var attr = this.getAttrCache();
             if( attr == undefined ) {
                 return;
             }

             var klass = attr['spsid.object.class'];
             var schema = spsidgui.Application.schema[klass];
             
             if( schema != undefined &&
                 schema.display != undefined &&
                 schema.display.name_attr != undefined &&
                 attr[schema.display.name_attr] != undefined ) {
                 
                 this.setObjectName(attr[schema.display.name_attr]);
                 return;
             }
             
             if( attr['spsid.object.container'] == 'NIL' ) {
                 this.setObjectName("Root Object");
                 return;
             }
         },
         
         refresh : function() {
             this.setAttrCache(null);
             this.setReady(false);
             this._fetchAttributes();
         }
     }
 });