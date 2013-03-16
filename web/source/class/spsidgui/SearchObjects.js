/*
#asset(qx/icon/Tango/16/actions/edit-find.png)
*/

qx.Class.define
("spsidgui.SearchObjects",
 {
     extend : spsidgui.AppWindow,
     
     members :
     {
         searchTextField : null,
         classList : null,

         initWindow : function() {
             this.setCaption('Search Objects');
             this.setShowStatusbar(true);
             this.setWidth(800);
         },
         
         initContent : function() {

             var winLayout = new qx.ui.layout.Grid(4, 4);
             winLayout.setRowAlign(0, "left", "middle");
             winLayout.setRowFlex(1, 1);
             
             var winGrid = new qx.ui.container.Composite(winLayout);

             winGrid.add(new qx.ui.basic.Label("Find"), {row: 0, column: 0});
      
             var classList = this.classList = new qx.ui.form.SelectBox();
             classList.set({ width: 150 });
             winGrid.add(classList, {row: 0, column: 1});

             // get the list of classes for searching
             var schema = spsidgui.Application.schema;
             var filtered = new Array;
             for (var klass in schema) {
                 if(schema[klass].display &&
                    schema[klass].display.sequence) {
                     filtered.push(klass);
                 }
             }
             
             var sorted =
                 filtered.sort(function(a,b) {
                     return (schema[a].display.sequence -
                             schema[b].display.sequence); });
             
             for (var i=0; i < sorted.length; i++) {
                 classList.add(new qx.ui.form.ListItem(
                     schema[sorted[i]].display.class_descr,
                     null, sorted[i]));
             }

             winGrid.add(new qx.ui.basic.Label("by prefix"),
                         {row: 0, column: 2});

             // search
             var searchComposlite = new qx.ui.container.Composite();
             searchComposlite.setLayout(new qx.ui.layout.HBox(3));
             searchComposlite.setAppearance("textfield");             

             var searchIcon =
                 new qx.ui.basic.Image("icon/16/actions/edit-find.png");
             searchComposlite.add(searchIcon);

             var searchField = this.searchTextField =
                 new qx.ui.form.TextField();
             searchField.setLiveUpdate(true);
             searchField.setAppearance("widget");
             searchField.setPlaceholder("type here...");
             searchComposlite.add(searchField, {flex: 1});

             var searchTimer = qx.util.TimerManager.getInstance();
             var searchTimerId = null;             
             var statusBar = this;
             var searchField = this.searchTextField;
             var rpc = spsidgui.SpsidRPC.getInstance();

             searchField.addListener(
                 "changeValue",
                 function(e)
                 {
                     if( searchTimerId != null )
                     {
                         searchTimer.stop(searchTimerId);
                     }
                     
                     statusBar.setStatus("Searching...");
                     
                     searchTimerId = searchTimer.start(
                         function(userData)
                         {
                             searchTimerId = null;
                             if( userData != null && userData.length > 0 )
                             {
                                 var klasses =
                                     classList.getModelSelection().toArray();
                                 
                                 rpc.search_prefix(
                                     function(result)
                                     {
                                         statusBar.setStatus(
                                             "Search results: " +
                                                 result.length + " objects");
                                     },
                                     klasses[0],
                                     userData);
                             }
                         },
                         0,
                         null,
                         e.getData(),
                         200);
                 });                             
             
             winGrid.add(searchComposlite, {row: 0, column: 3});

             this.add(winGrid);
         }         
     }
 });

