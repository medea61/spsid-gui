qx.Class.define
("spsidgui.ObjectRefWidget",
 {
     extend : qx.ui.basic.Label,

     construct : function(objID) {
         this.base(arguments);
     },

     destruct : function()
     {
         if( this.objLoadListener != null ) {
             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             obj.removeListenerById(this.objLoadListener);             
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
         objLoadListener : null,
         
         _applyObjectID : function(value, old) {
             if( old != undefined && old != 'NIL' ) {
                 if( this.objLoadListener != undefined ) {
                     var oldObj = spsidgui.SpsidObject.getInstance(old);
                     oldObj.removeListenerById(this.objLoadListener);
                     this.objLoadListener = null;
                 }
             }

             if( value != undefined && value != 'NIL' ) {
                 var obj = spsidgui.SpsidObject.getInstance(value);
                 this.objLoadListener =
                     obj.addListener(
                         "loaded", function(e) {
                             this._updateValue();
                         },
                         this);
             }
             
             this._updateValue();
         },


         _updateValue : function () {
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
         }
     }
 });

                 

             



