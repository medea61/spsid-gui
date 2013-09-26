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
             
             var root = this.getRoot();
             spsidgui.AppWindow.desktop = root;
             this.addMenuBar(root);

             // retrieve SPSID object schema
             spsidgui.Schema.load();
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
                 spsidgui.SearchObjects.openInstance(); });
             part1.add(searchButton);

             var rootButton =
                 new qx.ui.toolbar.Button("Root");
             rootButton.addListener("execute", function() {
                 var klass = spsidgui.Schema.getRootObjectClass();
                 if( klass == null ){
                     return;
                 }
                 
                 var rpc = spsidgui.SpsidRPC.getInstance();
                 rpc.search_objects(
                     function(target, result) {
                         if( result.length > 0 ) {
                             var oid = result[0]['spsid.object.id'];
                             spsidgui.ObjectWindow.openInstance(oid);
                         }
                     },
                     {},
                     'NIL', klass);
             });
             part1.add(rootButton);

             
             var part2 = new qx.ui.toolbar.Part();

             var winButton = new qx.ui.toolbar.MenuButton("Windows");
             var winMenu = new qx.ui.menu.Menu;
             winButton.setMenu(winMenu);
             
             winMenu.addListener("appear", function(e) {
                 var menu = e.getTarget();
                 var removed = menu.removeAll();
                 for(var i=0; i<removed.length; i++) {
                     removed[i].dispose();
                 }
                 
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
         buttonRow : function() {
             var row =
                 new qx.ui.container.Composite(new qx.ui.layout.HBox(4));
             row.set({appearance: "button-row"});
             return(row);
         }
     }
 });

