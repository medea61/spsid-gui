qx.Class.define
("spsidgui.DisplayObject",
 {
     extend : qx.ui.container.Composite,

     construct : function(obj) {

         this.initSpsidObject(obj);
         
         var layout = new qx.ui.layout.Grid(4, 0);
         layout.setColumnMinWidth(0, 200);
         layout.setColumnFlex(0, 1);
         layout.setColumnFlex(1, 1);
         
         this.base(arguments, layout);
         this.buildContent();
     },
     
     properties : {
         spsidObject :  {
             check: "Object",
             deferredInit : true
         }
     },

     members :
     {
         objectName : function() {
             return( this.getSpsidObject().getObjectName() );
         },

         addControlButtons : function(container) {
             var disp = this;
             
             var refreshButton = new qx.ui.form.Button("Refresh");
             refreshButton.addListener(
                 "execute", function() { disp.refresh() });
             container.add(refreshButton);
         
             var containerButton = new qx.ui.form.Button("Container");
             containerButton.addListener(
                 "execute",
                 function() {
                     var attr = disp.getAttrCache();
                     if( attr != undefined &&
                         attr['spsid.object.container'] != 'NIL' ) {
                         new spsidgui.ObjectWindow(
                             attr['spsid.object.container']);
                     }
                 });
             container.add(containerButton);

             var contentButton = new qx.ui.form.Button("Contents");
             contentButton.addListener(
                 "execute",
                 function() {
                     // TODO
                 });
             container.add(contentButton);
                      
             var editButton = new qx.ui.form.Button("Edit");
             editButton.addListener(
                 "execute",
                 function() {
                     // TODO
                 });
             container.add(editButton);             
         },
         
         buildContent : function() {

             this.removeAll();
             
             if( ! this.getSpsidObject().getReady() ) {
                 var myself = this;
                 this.getSpsidObject().addListener(
                     "loaded", function(e) {
                         myself.buildContent();
                     });
                 return;
             }
                                                   
             var attr = this.getSpsidObject().getAttrCache();
             var klass = attr['spsid.object.class'];
             var schema = spsidgui.Application.schema[klass];

             var hide = {'spsid.object.id': 1,
                         'spsid.object.container': 1};
             var hilite = {};

             if( schema != undefined && schema.display != undefined ) {
                 
                 if( schema.display.info_attr != undefined ) {
                     for (var i=0; i< schema.display.info_attr.length; i++) {
                         hilite[schema.display.info_attr[i]] = true;
                     }
                 }

                 if( schema.display.name_attr != undefined ) {
                     hilite[schema.display.name_attr] = true;
                 }
             }
             
             var filtered = new Array;
             for( var attr_name in attr ) {
                 if( ! hide[attr_name] ) {
                     filtered.push(attr_name);
                 }
             }
             
             var sorted = filtered.sort();         
             
             var nRow = 0;
             for( var i=0; i<sorted.length; i++) {
                 var attrLabel = new qx.ui.basic.Label(sorted[i]);
                 attrLabel.setSelectable(true);
                 this.add(attrLabel, {row: nRow, column: 0});
                 
                 var valLabel = new qx.ui.basic.Label(attr[sorted[i]]);
                 valLabel.setSelectable(true);
                 if( hilite[sorted[i]] ) {
                     valLabel.set({font: "bold"});
                 }
                 this.add(valLabel, {row: nRow, column: 1});
                 nRow++;
             }             
         },

         refresh : function() {
             this.getSpsidObject().refresh();
             this.buildContent();
         }
     }
 });
                      
             

         

         
