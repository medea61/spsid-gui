/*
*/

qx.Class.define
("spsidgui.Application",
 {
     extend : qx.application.Standalone,
     
     members :
     {
         main : function()
         {
             this.base(arguments);

             qx.event.GlobalError.setErrorHandler(function(ex) {
                 console.log(ex);
             });

             var root = this.getRoot();
             spsidgui.AppWindow.desktop = root;
             this.addMenuBar(root);

             // retrieve SPSID object schema
             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.get_schema(function(result) {
                 spsidgui.Application.schema = result;
             });
         },

         // Top-level toolbar         
         addMenuBar : function(appwindow)
         {
             var frame = new qx.ui.container.Composite(new qx.ui.layout.Grow);

             var toolbar = new qx.ui.toolbar.ToolBar();
             toolbar.setSpacing(5);

             var part1 = new qx.ui.toolbar.Part();
             
             var searchButton =
                 new qx.ui.toolbar.Button("Search");
             searchButton.addListener("execute", function() {
                 new spsidgui.SearchObjects(); });
             part1.add(searchButton);

             var part2 = new qx.ui.toolbar.Part();

             var winButton = new qx.ui.toolbar.MenuButton("Windows");
             winButton.addListener("execute", function() {
                 winButton.resetMenu();
                 var root = spsidgui.AppWindow.desktop;
                 var windows = root.getWindows().concat();
                 
                 var menu = new qx.ui.menu.Menu;
                 var found = false;
                 for( var i=0; i < windows.length; i++ ) {
                     var w = windows[i];
                     var cap = w.getCaption();
                     if( cap ) {                         
                         var but = new qx.ui.menu.Button(cap);
                         but.setUserData("win", w);
                         but.addListener("execute", function(e) {
                             var win = e.getTarget().getUserData("win");
                             win.setActive(true);
                         });
                         menu.add(but);
                         found = true;
                     }
                 }
                 if( found ) {
                     winButton.setMenu(menu);
                 }
             });
             
             part2.add(winButton);
             
             toolbar.add(part1);
             toolbar.add(part2);
                          
             frame.add(toolbar);
             appwindow.add(frame);
         },
     },

     statics : {
         schema : {}
     }
 });

