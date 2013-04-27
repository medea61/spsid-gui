qx.Class.define
("spsidgui.NewObjTypeDW",
 {
     extend : spsidgui.DialogWindow,

     construct : function() {
         this.base(arguments);
         this._initWidgets();
     },

     statics :
     {
         _instance : null,

         openInstance : function(containerID, parent) {
             if( ! spsidgui.NewObjTypeDW._instance ) {
                 spsidgui.NewObjTypeDW._instance = new spsidgui.NewObjTypeDW;
             }

             var w = spsidgui.NewObjTypeDW._instance;
             w.setContainerID(containerID);
             w.setParentWindow(parent);
             w.setCaption('Type for a new object');
             w.positionAndOpen(parent, 400, 350);
             return(w);
         }
     },

     properties :
     {
         parentWindow : {
             check : "Object",
             nullable : true
         },

         containerID : {
             check : "String",
             nullable : true
         }
     },

     members :
     {
         _initWidgets : function() {
             
         }
     }
 });

