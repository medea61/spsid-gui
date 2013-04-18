qx.Class.define
("spsidgui.ObjectLog",
 {
     extend : qx.ui.container.Scroll,

     construct : function(objID) {
         this.base(arguments);
         
         this.contentWidget =
             new qx.ui.container.Composite(new qx.ui.layout.VBox(6));
         this.add(this.contentWidget);
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
             apply : "_applyObjectID"
         }
     },

     members :
     {
         contentWidget : null,

         _applyObjectID : function(objID, oldObjID)
         {
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

                 if( obj.isReady() ) {
                     this.buildContent();
                 }
             }
         },

         buildContent : function() {
             var removed = this.contentWidget.removeAll();
             for(var i=0; i<removed.length; i++) {
                 removed[i].dispose();
             }

             var objID = this.getObjectID();
             if( objID == null ) {
                 return;
             }
             
             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.get_object_log(
                 function(target, result)
                 {
                     for(var i=0; i<result.length; i++) {
                         target._addLogEntry(result[i]);
                     }
                 },
                 this,
                 objID);
         },

         
         _addLogEntry : function(entry) {
             var htmlLabel = new qx.ui.basic.Label();
             htmlLabel.set({
                 rich: true,
                 selectable: true});
             
             var d = new Date(parseInt(entry['time']));
             
             htmlLabel.setValue
             ("<div>" + d.toLocaleString() +
              " by " + entry['user'] + "</div>" +
              '<div style="margin-left:20px">' + entry['msg'] + "</div>");
             
             this.contentWidget.add(htmlLabel);
         },

         _onObjectLoaded : function () {
             this.buildContent();
         },
         
         _onObjectDeleted : function() {
             this.destroy();
         }

     }
 });
                      
             

         

         
