qx.Class.define
("spsidgui.DialogWindow",
 {
     extend : qx.ui.window.Window,

     construct : function(caption) {             
         this.base(arguments, caption);

         this.setModal(true);
         this.setShowStatusbar(false);
         this.setShowMinimize(false);
         this.setShowClose(false);
         this.setShowMaximize(false);
         this.setUseMoveFrame(true);

         this.setLayout(new qx.ui.layout.VBox(4));
     },

     members:
     {
         positionAndOpen : function(parent, width, height) {

             var bounds = parent.getBounds();
             var centerX = Math.round(bounds.left + bounds.width/2);
             var centerY = Math.round(bounds.top + bounds.height/2);

             this.setHeight(height);
             this.setWidth(width);
             
             spsidgui.AppWindow.desktop.add(this, {
                 left: Math.round(centerX - width/2),
                 top:  Math.round(centerY - height/2)});
             
             this.open();
         }
     }
 });
