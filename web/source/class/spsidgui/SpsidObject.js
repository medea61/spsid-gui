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

             if( ! this.isReady() ) {
                 return;
             }

             var schema = this.getSchema();
             
             if( schema.hasDisplay() &&
                 schema.displayNameAttribute() != undefined )
             {
                 this.setObjectName(
                     this.getAttr(schema.displayNameAttribute()));
                 return;
             }
             
             if( this.getAttr('spsid.object.container') == 'NIL' ) {
                 this.setObjectName("Root Object");
                 return;
             }
             
             this.setObjectName(this.getObjectID());
         },

         newAttrCache : function(attr) {
             this.setAttrCache(attr);
             this.setReady(true);
             this._initObjectName();
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
         },
         
         getSchema : function() {
             var klass = this.getAttr('spsid.object.class');
             return(spsidgui.Schema.getInstance(klass));
         },

         getAttrListForDisplay  : function() {
             var attrnames = new qx.type.Array();
             var schema = this.getSchema();
             var attr = this.getAttrCache();
             for(var attr_name in attr) {
                 if( ! schema.isAttrHidden(attr_name) ) {
                     attrnames.push(attr_name);
                 }
             }
             attrnames.sort();
             return(attrnames);
         }
     }
 });