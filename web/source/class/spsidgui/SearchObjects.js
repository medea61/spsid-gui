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

             var model = new qx.data.Array();
             var classList = this.classList =
                 new qx.ui.form.VirtualSelectBox(model);
             classList.setLabelPath("classDescr");
             classList.setWidth(200);
             topRow.add(classList, {row: 0, column: 1});

             // get the list of classes for searching
             var klasses = new qx.data.Array();
             var sequences = {};
             var descriptions = {};
             spsidgui.Schema.enumerate(
                 function(schema) {
                     if( schema.isFullTextSearchPossible() && 
                         schema.displaySequence() != undefined )
                     {
                         var klass = schema.getObjclass();
                         klasses.push(klass);
                         sequences[klass] = schema.displaySequence();
                         descriptions[klass] = schema.classDescription();
                     }
                     return(true);
                 });
             
             klasses.sort(
                 function(a,b) {
                     return (sequences[a] - sequences[b]);
                 }
             );
             
             for (var i=0; i < klasses.length; i++) {
                 var klass = klasses.getItem(i);
                 model.push(
                     qx.data.marshal.Json.createModel({
                         classDescr : descriptions[klass],
                         className : klass}));
             }
             
             topRow.add(new qx.ui.basic.Label("by substring"),
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
                 "input",
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
                                 var sel = classList.getSelection().getItem(0);
                                 rpc.search_fulltext(
                                     function(target, result)
                                     {
                                         statusBar.setStatus
                                         ("Found " + result.length +
                                          " objects");
                                         resultsWidget.setAttrList(result);
                                     },
                                     {},
                                     sel.getClassName(),
                                     userData);
                             }
                         },
                         0,
                         null,
                         e.getData(),
                         200);
                 });                             
             

             // generate a refresh if classList value is changed
             classList.getSelection().addListener(
                 "change", 
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

