qx.Class.define
("spsidgui.DisplayObject",
 {
     extend : qx.ui.container.Composite,

     construct : function(objID) {

         this.initObjectID(objID);

         var layout = new qx.ui.layout.Grid(4, 0);
         layout.setColumnMinWidth(0, 180);
         layout.setColumnFlex(0, 0);
         layout.setColumnFlex(1, 1);
         
         this.base(arguments, layout);

         var myself = this;
         var obj = spsidgui.SpsidObject.getInstance(objID);
         obj.addListener(
             "loaded", function(e) {
                 myself.buildContent();
             });

         this.buildContent();
     },
     
     properties : {
         objectID :  {
             check: "String",
             deferredInit : true
         }
     },

     members :
     {
         containerButton : null,
         contentButton : null,
         editButton : null,
         
         addControlButtons : function(container) {
             
             var objID = this.getObjectID();
             
             var refreshButton = new qx.ui.form.Button("Refresh");
             refreshButton.setUserData("objID", objID);
             refreshButton.addListener(
                 "execute", function(e) {
                     var oid = e.getTarget().getUserData("objID");
                     var obj = spsidgui.SpsidObject.getInstance(oid);
                     obj.refresh();
                 });
             container.add(refreshButton);
         
             var containerButton = new qx.ui.form.Button("Container");
             containerButton.setUserData("objID", objID);             
             containerButton.addListener(
                 "execute",
                 function(e) {
                     var oid = e.getTarget().getUserData("objID");
                     var obj = spsidgui.SpsidObject.getInstance(oid);
                     if( obj.getReady() ) {
                         var cntr = obj.getAttr('spsid.object.container');
                         if( cntr != undefined && cntr != 'NIL' ) {
                             spsidgui.ObjectWindow.openInstance(cntr);
                         }
                     }
                 });
             container.add(containerButton);
             this.containerButton = containerButton;

             var contentButton = new qx.ui.form.MenuButton("Contents");
             contentButton.setUserData("objID", objID);
             contentButton.addListener(
                 "execute",
                 function(e) {
                     var oid = e.getTarget().getUserData("objID");
                     spsidgui.ContainedObjWindow.openInstance(oid);
                 });
             container.add(contentButton);
             this.contentButton = contentButton;
                      
             var editButton = new qx.ui.form.Button("Edit");
             editButton.setUserData("objID", objID);
             editButton.addListener(
                 "execute",
                 function(e) {
                     var oid = e.getTarget().getUserData("objID");
                     spsidgui.EditObject.openInstance(oid);
                 });
             container.add(editButton);
             this.editButton = editButton;
         },
         
         buildContent : function() {

             this.clear();
             
             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             
             if( ! obj.getReady() ) {
                 return;
             }

             var d = spsidgui.DisplayObject.prepareForDisplay(obj);
             
             var nRow = 0;
             for( var i=0; i<d.attrnames.length; i++) {
                 var attr_name = d.attrnames[i];
                 
                 var attrLabel = new qx.ui.basic.Label(attr_name);
                 attrLabel.setSelectable(true);

                 if( d.tooltips[attr_name] != undefined ) {
                     var tt = new qx.ui.tooltip.ToolTip(d.tooltips[attr_name]);
                     attrLabel.setToolTip(tt);
                 }
                 
                 this.add(attrLabel, {row: nRow, column: 0});
                 
                 var valLabel = new qx.ui.basic.Label(obj.getAttr(attr_name));
                 valLabel.setSelectable(true);
                 if( d.hilite[attr_name] ) {
                     valLabel.set({font: "bold"});
                 }
                 this.add(valLabel, {row: nRow, column: 1});
                 nRow++;
             }

             // disable some buttons according to schema attributes
             var schema = spsidgui.Application.schema[
                 obj.getAttr('spsid.object.class')];
             if( schema != undefined ) {
                 if( schema['root_object'] && this.containerButton ) {
                     this.containerButton.setEnabled(false);
                 }
                 
                 if( schema['no_children'] && this.contentButton ) {
                     this.contentButton.setEnabled(false);
                 }
                 
                 if( schema['read_only'] && this.editButton ) {
                     this.editButton.setEnabled(false);
                 }
             }
         },

         clear : function() {
             var removed = this.removeAll();
             for(var i=0; i<removed.length; i++) {
                 removed[i].dispose();
             }
         }
     },

     statics :
     {
         prepareForDisplay : function (obj) {
             
             var attr = obj.getAttrCache();
             var klass = attr['spsid.object.class'];
             var schema = spsidgui.Application.schema[klass];

             var hide = {'spsid.object.id': 1,
                         'spsid.object.container': 1};
             var hilite = {};
             var tooltips = {};
             
             if( schema != undefined && schema.display != undefined ) {
                 
                 if( schema.display.info_attr != undefined ) {
                     for (var i=0; i< schema.display.info_attr.length; i++) {
                         hilite[schema.display.info_attr[i]] = true;
                     }
                 }

                 if( schema.display.name_attr != undefined ) {
                     hilite[schema.display.name_attr] = true;
                 }

                 if( schema.display.attr_help != undefined ) {
                     for(var name in schema.display.attr_help) {
                         tooltips[name] = schema.display.attr_help[name];
                     }
                 }
             }
             
             var attrnames = new Array;
             for( var attr_name in attr ) {
                 if( ! hide[attr_name] ) {
                     attrnames.push(attr_name);
                 }
             }
             attrnames.sort();
             
             return({"attrnames" : attrnames,
                     "hilite" : hilite,
                     "tooltips" : tooltips});
         }
     }
 });
                      
             

         

         
