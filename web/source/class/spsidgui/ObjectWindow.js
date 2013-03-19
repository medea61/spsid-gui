qx.Class.define
("spsidgui.ObjectWindow",
 {
     extend : spsidgui.AppWindow,

     construct : function(objID) {
         this.initObjectID(objID);
         this.base(arguments);
     },
     
     properties : {
         objectID :  {
             check: "String",
             deferredInit : true
         }
     },
     
     members :
     {
         initWindow : function() {
             this.setShowStatusbar(false);
             this.setWidth(500);
             this.setHeight(300);
         },
         
         initContent : function() {
             var box = new qx.ui.container.Composite(new qx.ui.layout.VBox(0));
             
             var buttonsRow =
                 new qx.ui.container.Composite(new qx.ui.layout.HBox(4));
             buttonsRow.set({backgroundColor: "#e6e6e6", padding: 4});

             var disp = new spsidgui.DisplayObject(this.getObjectID());
             disp.addControlButtons(buttonsRow);

             var win = this;
             disp.addListener(
                 "loaded",
                 function(e) { win.setCaption(e.getData().objectName()) });
             
             box.add(buttonsRow);             
             box.add(disp);
             this.add(box);
         }
     }
 });

