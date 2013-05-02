qx.Class.define
("spsidgui.NewObjTypeDW",
 {
     extend : spsidgui.DialogWindow,

     construct : function() {
         this.base(arguments);
         this.templateAttrSelectors = new qx.type.Array();
         this._initWidgets();
     },

     statics :
     {
         _instance : null,

         openInstance : function(containerObjclass, parent) {
             if( ! spsidgui.NewObjTypeDW._instance ) {
                 spsidgui.NewObjTypeDW._instance = new spsidgui.NewObjTypeDW;
             }

             var w = spsidgui.NewObjTypeDW._instance;

             w.setParentWindow(parent);
             w.setCaption('Type for a new object');

             if( w.getContainerObjclass() != containerObjclass )
             {
                 w.setContainerObjclass(containerObjclass);
                 w._populateClassSelector();
                 w._populateTemplateSelectors();
             }
             
             if( w.classSelectBox.getModel().getLength() == 1 &&
                 w.templateAttrSelectors.length == 0 ) {
                 w._onOk();
             }
             else {
                 w.positionAndOpen(parent, 400, 150);
             }

             return(w);
         }
     },

     properties :
     {
         parentWindow : {
             check : "Object",
             nullable : true
         },

         containerObjclass : {
             check : "String",
             nullable : true
         }
     },

     members :
     {
         classSelectBox : null,
         templateAttrComposite : null,
         templateAttrSelectors : null,

         _initWidgets : function() {

             var model = new qx.data.Array();
             var selectBox = this.classSelectBox =
                 new qx.ui.form.VirtualSelectBox(model);
             selectBox.setWidth(200);

             selectBox.getSelection().addListener(
                 "change",
                 function() {
                     this._populateTemplateSelectors();
                 },
                 this);

             var classZone =
                 new qx.ui.container.Composite(new qx.ui.layout.HBox(6));
             classZone.add(new qx.ui.basic.Label("Object class:"));
             classZone.add(selectBox);
             this.add(classZone);
             this.add(new qx.ui.core.Spacer(0,20));

             var tmplLayout = new qx.ui.layout.Grid(6, 4);
             tmplLayout.setColumnMinWidth(0, 180);
             tmplLayout.setColumnFlex(1, 1);

             this.templateAttrComposite =
                 new qx.ui.container.Composite(tmplLayout);
             this.add(this.templateAttrComposite, {flex: 1});

             var buttonsRow = spsidgui.Application.buttonRow();

             var okButton = this.okButton = new qx.ui.form.Button("Ok");
             okButton.addListener(
                 "execute",
                 function() { this._onOk() },
                 this);
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


         _populateClassSelector : function() {
             var model = this.classSelectBox.getModel();
             model.removeAll();

             var containerClass = this.getContainerObjclass();
             var klasses = new qx.data.Array();
             var sequences = {};
             spsidgui.Schema.enumerate(
                 function(schema) {
                     if( schema.isContainedIn(containerClass) &&
                         schema.displaySequence() != undefined &&
                         ! schema.displayReadOnly() )
                     {
                         var klass = schema.getObjclass();
                         klasses.push(klass);
                         sequences[klass] = schema.displaySequence();
                     }
                     return(true);
                 });
             
             klasses.sort(
                 function(a,b) {
                     return (sequences[a] - sequences[b]);
                 }
             );
             
             model.append(klasses);
         },


         _populateTemplateSelectors : function() {
             var objclass = this.classSelectBox.getSelection().getItem(0);
             if( objclass == undefined ) {
                 return;
             }
             
             this.templateAttrSelectors.removeAll();
             var removed = this.templateAttrComposite.removeAll();
             for(var i=0; i<removed.length; i++) {
                 removed[i].dispose();
             }

             var schema = spsidgui.Schema.getInstance(objclass);
             var nRow = 0;
             var attrnames = schema.getAttributeNames();
             for(var i=0; i<attrnames.length; i++) {
                 var attr_name = attrnames[i];
                 if( schema.isAttrTemplateKey(attr_name) ) {

                     var attrLabel = new qx.ui.basic.Label(attr_name);
                     attrLabel.set({selectable : true,
                                    paddingLeft: 5});

                     var descr = schema.attrDescr(attr_name);
                     if( descr != undefined ) {
                         var tt = new qx.ui.tooltip.ToolTip(descr);
                         attrLabel.setToolTip(tt);
                     }

                     this.templateAttrComposite.add(
                         attrLabel, {row: nRow, column: 0});

                     var dict = schema.getAttrDictionary(attr_name);
                     dict = new qx.data.Array(dict);
                     
                     var selectBox =
                         new qx.ui.form.VirtualSelectBox(dict);
                     selectBox.setWidth(200);
                     selectBox.setUserData('attr_name', attr_name);
                     this.templateAttrSelectors.push(selectBox);

                     this.templateAttrComposite.add(
                         selectBox, {row: nRow, column: 1});
                 }
             }
         },


         _onOk : function() {
             var objclass = this.classSelectBox.getSelection().getItem(0);

             var templatekeys = {};
             for(var i=0; i<this.templateAttrSelectors.length; i++) {
                 var selectBox = this.templateAttrSelectors[i];
                 var attr_name = selectBox.getUserData('attr_name');
                 var val = selectBox.getSelection().getItem(0);
                 templatekeys[attr_name] = val;
             }

             this.getParentWindow().setNewObjType(objclass, templatekeys);
             this.close();
         }
     }
 });

