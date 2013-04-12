/*
#asset(qx/icon/Tango/16/actions/edit-find.png)
*/

qx.Class.define
("spsidgui.SearchObjects",
 {
     extend : spsidgui.AppWindow,

     statics :
     {
         _instance : null,
         
         openInstance : function() {
             if( ! spsidgui.SearchObjects._instance ) {
                 var w = new spsidgui.SearchObjects;
                 spsidgui.SearchObjects._instance = w;
             }
             else {
                 spsidgui.SearchObjects._instance.open();
             }
             return(spsidgui.SearchObjects._instance);
         }
     },

     members :
     {
         searchTextField : null,
         classList : null,

         initWindow : function() {
             this.setCaption('Search Objects');
             this.setShowStatusbar(true);
             this.setWidth(800);
             this.setHeight(600);
         },
         
         initContent : function() {
             
             var winVBox = new qx.ui.container.Composite(
                 new qx.ui.layout.VBox(4));

             var topRowLayout = new qx.ui.layout.Grid(4,4);
             topRowLayout.setRowAlign(0, "left", "middle");
             topRowLayout.setRowFlex(1, 1);
             
             var topRow = new qx.ui.container.Composite(topRowLayout);

             topRow.add(new qx.ui.basic.Label("Find"), {row: 0, column: 0});
      
             var classList = this.classList = new qx.ui.form.SelectBox();
             classList.set({ width: 200 });
             topRow.add(classList, {row: 0, column: 1});

             // get the list of classes for searching
             var schema = spsidgui.Application.schema;
             var filtered = new Array;
             for (var klass in schema) {
                 if(schema[klass].display &&
                    schema[klass].display.sequence) {
                     filtered.push(klass);
                 }
             }
             
             filtered.sort(function(a,b) {
                 return (schema[a].display.sequence -
                         schema[b].display.sequence); });
             
             for (var i=0; i < filtered.length; i++) {
                 classList.add(new qx.ui.form.ListItem(
                     schema[filtered[i]].display.class_descr,
                     null, filtered[i]));
             }
             
             topRow.add(new qx.ui.basic.Label("by prefix"),
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
             topRow.add(searchComposlite, {row: 0, column: 3});

             winVBox.add(topRow);

             var resultsWidget = new spsidgui.ObjectList();
             winVBox.add(resultsWidget, {flex: 1});
             
             var searchTimer = qx.util.TimerManager.getInstance();
             var searchTimerId = null;             
             var statusBar = this;
             var searchField = this.searchTextField;
             var rpc = spsidgui.SpsidRPC.getInstance();
             
             statusBar.setStatus(
                 "Type in 3 or more first letters of an attribute value");
             
             searchField.addListener(
                 "changeValue",
                 function(e)
                 {
                     if( searchTimerId != null )
                     {
                         searchTimer.stop(searchTimerId);
                     }
                                          
                     searchTimerId = searchTimer.start(
                         function(userData)
                         {
                             searchTimerId = null;
                             if( userData != null && userData.length >= 3 )
                             {
                                 statusBar.setStatus("Searching...");
                                 
                                 var klasses =
                                     classList.getModelSelection().toArray();
                                 
                                 rpc.search_prefix(
                                     function(target, result)
                                     {
                                         statusBar.setStatus
                                         ("Found " + result.length +
                                          " objects");
                                         resultsWidget.setAttrList(result);
                                     },
                                     {},
                                     klasses[0],
                                     null,
                                     userData);
                             }
                         },
                         0,
                         null,
                         e.getData(),
                         200);
                 });                             
             

             // generate a refresh if classList value is changed
             classList.addListener(
                 "changeSelection",
                 function(e)
                 {
                     var val = searchField.getValue();
                     searchField.fireNonBubblingEvent(
                         "changeValue", qx.event.type.Data, [val, val]);
                 });
             
             this.add(winVBox);
             searchField.focus();
         }         
     }
 });

