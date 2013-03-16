qx.Class.define
("spsidgui.AppWindow",
 {
     extend : qx.ui.window.Window,

     construct : function() {             
         this.base(arguments);

         this.setLayout(new qx.ui.layout.Grow());
         this.setHeight(400);
         this.setWidth(600);
         this.setShowStatusbar(false);
         this.setShowMinimize(false);
         
         // let the subclass adjust the windo size and layout
         this.initWindow();
         
         this.open();
         
         spsidgui.AppWindow.desktop.add(this, {
             left: spsidgui.AppWindow.next_window_left,
             top:  spsidgui.AppWindow.next_window_top});
         spsidgui.AppWindow.next_window_top += 50;
         spsidgui.AppWindow.next_window_left += 50;

         // let the subclass initialize the content
         this.initContent();
         
         return this;
     },
     
     statics : {
         desktop : null,
         next_window_top : 60,
         next_window_left : 30
     }
 });
