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

             // retrieve SPSID object schema
             spsidgui.Schema.load();

             this.addMenuBar(root);

             spsidgui.Application.currObjSelection = {};
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

             var browseButton = new qx.ui.toolbar.MenuButton("Browse");
             var browseMenu = new qx.ui.menu.Menu;
             browseButton.setMenu(browseMenu);
             
             browseMenu.addListener("appear", function(e) {
                 var menu = e.getTarget();
                 if( menu.hasChildren() ) {
                     return;
                 }
                 
                 var rootClass = spsidgui.Schema.getRootObjectClass();
                 if( rootClass == null ){
                     return;
                 }

                 var rpc = spsidgui.SpsidRPC.getInstance();
                 rpc.search_objects(
                     function(menu, result) {
                         if( result.length == 0 ) {
                             return;
                         }
                         var objID = result[0]['spsid.object.id'];

                         var rpc = spsidgui.SpsidRPC.getInstance();
                         rpc.contained_classes(
                             function(menu, result)
                             {
                                 for(var i=0; i<result.length; i++) {
                                     var klass = result[i];
                                     var schema =
                                         spsidgui.Schema.getInstance(klass);
                                     if( schema.hasDisplay() ) {
                                         var descr = schema.classDescription();
                                         var but = new qx.ui.menu.Button(descr);
                                         but.setUserData("objClass", klass);
                                         but.addListener
                                         ("execute",
                                          function(e) {
                                              var klass =
                                                  e.getTarget().getUserData(
                                                      "objClass");
                                              spsidgui.BrowseWindow.openInstance(
                                                  klass);
                                          });
                                         menu.add(but);
                                     }
                                 }
                             },
                             menu,
                             objID);
                     },
                     menu, 'NIL', rootClass);
             });
             
             part1.add(browseButton);

             
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
         currObjSelection : null,
         
         buttonRow : function() {
             var row =
                 new qx.ui.container.Composite(new qx.ui.layout.HBox(4));
             row.set({appearance: "button-row"});
             return(row);
         }
     }
 });

