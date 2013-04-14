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
             apply : "_applyObjectID"
         }
     },

     members :
     {
         objLoadListener : null,
         contentWidget : null,

         _applyObjectID : function(objID, oldObjID)
         {
             if( oldObjID != null && this.objLoadListener != null ) {
                 var obj = spsidgui.SpsidObject.getInstance(oldObjID);
                 obj.removeListenerById(this.objLoadListener);
             }

             var obj = spsidgui.SpsidObject.getInstance(objID);
             
             this.objLoadListener =
                 obj.addListener(
                     "loaded", function(e) {
                         this.buildContent();
                     },
                     this);

             if( obj.isReady() ) {
                 this.buildContent();
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
         }             
     }
 });
                      
             

         

         
