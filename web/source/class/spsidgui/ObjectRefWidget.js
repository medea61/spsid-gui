qx.Class.define
("spsidgui.ObjectRefWidget",
 {
     extend : qx.ui.basic.Label,

     construct : function(objID) {
         this.base(arguments);
     },

     destruct : function()
     {
         var objID = this.getObjectID();
         var obj = spsidgui.SpsidObject.getInstance(objID);
         if( obj != undefined ) {
             obj.removeListener("loaded", this._onObjectLoaded, this);
             obj.removeListener("deleted", this._onObjectDeleted, this);
         }
     },

     properties : {
         objectID :  {
             check: "String",
             nullable : true,
             apply : "_applyObjectID",
             event : "changeObjectID"
         }
     },

     members :
     {
         _applyObjectID : function(objID, oldObjID) {
             if( oldObjID != undefined && oldObjID != 'NIL' ) {
                 var oldObj = spsidgui.SpsidObject.getInstance(oldObjID);
                 if( oldObj != undefined ) {
                     oldObj.removeListener("loaded",
                                           this._onObjectLoaded, this);
                     oldObj.removeListener("deleted",
                                           this._onObjectDeleted, this);
                 }
             }

             if( objID != undefined && objID != 'NIL' ) {
                 var obj = spsidgui.SpsidObject.getInstance(objID);
                 obj.addListener("loaded", this._onObjectLoaded, this);
                 obj.addListener("deleted", this._onObjectDeleted, this);
             }
             
             this._onObjectLoaded();
         },

         _onObjectLoaded : function () {
             var objID = this.getObjectID();
             var valUpdated = false;
             if( objID != undefined && objID != 'NIL') {
                 var obj = spsidgui.SpsidObject.getInstance(objID);
                 if( obj.getReady() ) {
                     this.setValue(obj.getObjectName());
                     valUpdated = true;
                 }
             }

             if( ! valUpdated ) {
                 this.setValue('NIL');
             }
         },

         _onObjectDeleted : function() {
             this.setObjectID(null);
             this.setValue('NIL');
         }
     }
 });

                 

             



