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
             var winMenu = new qx.ui.menu.Menu;
             winButton.setMenu(winMenu);
             
             winMenu.addListener("appear", function(e) {
                 var menu = e.getTarget();
                 menu.removeAll();
                     
                 var root = spsidgui.AppWindow.desktop;
                 var windows = root.getWindows().concat();
                 
                 var filtered = new Array();
                 for( var i=0; i < windows.length; i++ ) {
                     var w = windows[i];
                     if( w.isVisible() ) {
                         if( w.getCaption() ) {
                             filtered.push(w);
                         }
                     }
                 }
                 
                 filtered.sort(
                     function(a,b) {
                         return(
                             a.getCaption().localeCompare(b.getCaption()));
                     });
                 
                 for(var i=0; i<filtered.length; i++) {
                     var but = new qx.ui.menu.Button(
                         filtered[i].getCaption());
                     but.setUserData("win", filtered[i]);
                     but.addListener("execute", function(e) {
                         var win = e.getTarget().getUserData("win");
                         win.setActive(true);
                     });
                     menu.add(but);
                 }
             });
             
             part2.add(winButton);
             
             toolbar.add(part1);
             toolbar.add(part2);
                          
             frame.add(toolbar);
             appwindow.add(frame);
         }
     },

     statics : {
         schema : {}
     }
 });

