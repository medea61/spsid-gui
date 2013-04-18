qx.Class.define
("spsidgui.SpsidObject",
 {
     extend : qx.core.Object,
     
     construct : function(objID, attr) {
         this.initObjectID(objID);
         if( attr != undefined ) {
             this.newAttrCache(attr);
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
         "loaded": "qx.event.type.Data",
         "deleted": "qx.event.type.Data"
     },

     statics :
     {
         _instances : {},
         _deletedObjects : {},
         
         getInstance : function(objID, attr) {
             if( spsidgui.SpsidObject._deletedObjects[objID] ) {
                 return(null);
             }
             
             if( ! spsidgui.SpsidObject._instances[objID] ) {
                 var o = new spsidgui.SpsidObject(objID, attr);
                 spsidgui.SpsidObject._instances[objID] = o;
                 return(o);
             }
             else {
                 if( attr != undefined ) {
                     spsidgui.SpsidObject._instances[objID].newAttrCache(attr);
                 }
                 return(spsidgui.SpsidObject._instances[objID]);
             }
         }
     },
         
     members :
     {
         _fetchAttributes : function() {
             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.get_object(
                 function(myself, attr) {
                     myself.newAttrCache(attr);
                 },
                 this,
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

         newAttrCache : function(attr) {
             this.setAttrCache(attr);
             this._initObjectName();
             this.setReady(true);
             this.fireDataEvent("loaded");
         },
             
         
         refresh : function() {
             this.setAttrCache(null);
             this.setReady(false);
             this._fetchAttributes();
         },

         getAttr : function (name) {
             var attr = this.getAttrCache();
             if( attr == undefined ) {
                 return;
             }
             return(attr[name]);
         },

         deleteObject : function() {
             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.delete_object(
                 function(target) {
                     target.fireDataEvent("deleted");
                     var objID = target.getObjectID();
                     delete spsidgui.SpsidObject._instances[objID];
                     spsidgui.SpsidObject._deletedObjects[objID] = true;
                     target.dispose();
                 },
                 this,
                 this.getObjectID());
         }
     }
 });