/*
#asset(qx/icon/Tango/16/actions/edit-find.png)
*/

qx.Class.define
("spsidgui.SelectObjectDW",
 {
     extend : spsidgui.DialogWindow,

     construct : function() {
         this.base(arguments);
         this.setShowStatusbar(true);
         this._initWidgets();
     },

     statics :
     {
         _instance : null,

         openInstance : function(widget, objclass, parent) {
             if( ! spsidgui.SelectObjectDW._instance ) {
                 spsidgui.SelectObjectDW._instance =
                     new spsidgui.SelectObjectDW;
             }

             var w = spsidgui.SelectObjectDW._instance;

             w.setUpdateWidget(widget);
             w.setObjclass(objclass);
             w.classLabel.setValue(objclass);
             w.searchField.setValue("");

             var model = new qx.data.Array();
             // fill in the list from the current value
             {
                 var objID = widget.getObjectID();
                 if( objID != undefined && objID != 'NIL' ) {
                     var obj = spsidgui.SpsidObject.getInstance(objID);
                     model.push(
                         qx.data.marshal.Json.createModel({
                             objName: obj.getObjectFullName(),
                             objID: objID
                         }));
                 }
             }
             
             // fill in the list from current selections
             for (var containerID in spsidgui.Application.currObjSelection) {
                 var map = spsidgui.Application.currObjSelection[containerID];
                 if( map.objclass == objclass ) {
                     var obj = spsidgui.SpsidObject.getInstance(map.objID);
                     if( obj.getReady() ) {
                         model.push(
                             qx.data.marshal.Json.createModel({
                                 objName: obj.getObjectFullName(),
                                 objID: map.objID
                             }));
                     }
                 }
             }
             w.resultsList.setModel(model);
             
             w.setCaption('Select an object');
             w.setStatus(
                 "Type in 3 or more first letters of an attribute value");

             w.positionAndOpen(parent, 600, 350);
             w.searchField.focus();
             return(w);
         }
     },

     properties :
     {
         updateWidget : {
             check : "Object",
             nullable : true
         },

         objclass : {
             check : "String",
             nullable : true
         }
     },

     members :
     {
         searchField : null,
         classLabel : null,
         resultsList : null,
         searchTimer : null,
         searchTimerId : null,
         okButton : null,

         _initWidgets : function() {

             var topRow =
                 new qx.ui.container.Composite(
                     new qx.ui.layout.HBox(4));

             topRow.add(new qx.ui.basic.Label("Select"));

             var classLabel = this.classLabel = new qx.ui.basic.Label();
             topRow.add(classLabel);
             topRow.add(new qx.ui.basic.Label("by prefix"));

             // search
             var searchComposlite = new qx.ui.container.Composite();
             searchComposlite.setLayout(new qx.ui.layout.HBox(3));
             searchComposlite.setAppearance("textfield");

             var searchIcon =
                 new qx.ui.basic.Image("icon/16/actions/edit-find.png");
             searchComposlite.add(searchIcon);

             var searchField = this.searchField =
                 new qx.ui.form.TextField();
             // searchField.setLiveUpdate(true);
             searchField.setAppearance("widget");
             searchField.setPlaceholder("type here...");
             searchComposlite.add(searchField, {flex: 1});
             
             topRow.add(searchComposlite, {flex: 1});

             this.add(topRow);

             var resultsList = this.resultsList = new qx.ui.list.List();
             resultsList.setLabelPath("objName");
             resultsList.getSelection().addListener(
                 "change", 
                 function(e) {
                     var sel = this.resultsList.getSelection();
                     if( sel.getLength() > 0 ) {
                         this.searchField.setValue(sel.getItem(0).getObjName());
                         this.okButton.setEnabled(true);
                     }
                     else {
                         this.okButton.setEnabled(false);
                     }
                 },
                 this);
             this.add(resultsList, {flex: 1});

             this.searchTimer = qx.util.TimerManager.getInstance();
             this.searchTimerId = null;

             searchField.addListener(
                 "input",
                 function(e)
                 {
                     if( this.searchTimerId != null )
                     {
                         this.searchTimer.stop(this.searchTimerId);
                     }

                     this.searchTimerId =
                         this.searchTimer.start(
                             this._runSearch,
                             0,
                             this,
                             e.getData(),
                             200);
                 },
                 this);

             var buttonsRow = spsidgui.Application.buttonRow();

             var okButton = this.okButton = new qx.ui.form.Button("Ok");
             okButton.addListener(
                 "execute",
                 function() {
                     var sel = this.resultsList.getSelection();
                     if( sel.getLength() > 0 ) {
                         this.getUpdateWidget().setObjectID(
                             sel.getItem(0).getObjID());
                         this.close();
                     }
                 },
                 this);
             okButton.setEnabled(false);
             buttonsRow.add(okButton);

             var cancelButton = new qx.ui.form.Button("Cancel");
             cancelButton.addListener(
                 "execute",
                 function() {
                     this.close();
                 },
                 this);
             buttonsRow.add(cancelButton);

             this.add(buttonsRow);
         },

         _runSearch : function(searchPrefix) {
             this.searchTimerId = null;
             if( searchPrefix != null &&
                 searchPrefix.length >= 3 )
             {
                 this.setStatus("Searching...");

                 var rpc = spsidgui.SpsidRPC.getInstance();
                 rpc.search_prefix(
                     function(target, result)
                     {
                         target.setStatus
                         ("Found " + result.length +  " objects");
                         var resList = new qx.data.Array();
                         for(var i=0; i<result.length; i++) {
                             var attr = result[i];
                             var obj =
                                 spsidgui.SpsidObject.getInstance(
                                     attr['spsid.object.id'], attr);
                             resList.push(
                                 qx.data.marshal.Json.createModel({
                                     objName: obj.getObjectFullName(),
                                     objID: obj.getObjectID()
                                 }));
                         }
                         target.resultsList.setModel(resList);
                     },
                     this,
                     this.getObjclass(),
                     null,
                     searchPrefix);
             }
         }
     }
 });

