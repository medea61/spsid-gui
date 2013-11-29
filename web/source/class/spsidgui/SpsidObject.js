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
         },

         objectFullName : {
             init : "",
             check : "String"
         },

         objectDescr : {
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

         /* this function also updates objectDescr */
         _initObjectName : function() {

             if( ! this.isReady() ) {
                 return;
             }

             if( this.getAttr('spsid.object.container') == 'NIL' ) {
                 this.setObjectName("Root Object");
                 this.setObjectFullName("Root Object");
                 return;
             }

             var schema = this.getSchema();
             
             if( schema.displayNameAttribute() != undefined )
             {
                 this.setObjectName(
                     this.getAttr(schema.displayNameAttribute()));
             
                 this.setObjectFullName(
                     this.getAttr(schema.displayFullNameAttribute()));
                 
                 var descr_attrs = schema.displayDescrAttributes();
                 var descr = '';
                 for(var i=0; i<descr_attrs.length; i++)
                 {
                     var val = this.getAttr(descr_attrs[i]);
                     if( val != undefined )
                     {
                         if( val.length > 0 && descr.length > 0 )
                         {
                             descr += ' ';
                         }
                         descr += val;
                     }
                 }
             
                 this.setObjectDescr(descr);                    
                 return;
             }
                          
             this.setObjectName(this.getObjectID());
             this.setObjectFullName(this.getObjectID());
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

         getObjClass : function() {
             return(this.getAttr('spsid.object.class'));
         },
         
         getSchema : function() {
             return(spsidgui.Schema.getInstance(this.getObjClass()));
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
         },

         isEditable : function() {
             var schema = this.getSchema();
             if( schema.displayReadOnly() ) {
                 return false;
             }
             
             if( this.getAttr('spsid_gui.edit.locked') ) {
                 return false;
             }
             
             return true;
         },

         // check if objects can be actually created within this class
         canAddChildren : function () {

             if( ! this.getSchema().mayHaveChildren() ) {
                 return(false);
             }
             
             var containerClass = this.getObjClass();
             var found = false;
             spsidgui.Schema.enumerate(
                 function(schema) {
                     if( schema.isContainedIn(containerClass) &&
                         schema.displaySequence() != undefined &&
                         ! schema.displayReadOnly() )
                     {
                         found = true;
                     }
                     return(!found);
                 });
             return(found);
         }
     }
 });
