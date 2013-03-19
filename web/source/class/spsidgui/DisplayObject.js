qx.Class.define
("spsidgui.DisplayObject",
 {
     extend : qx.ui.container.Composite,

     construct : function(attr) {

         var layout = new qx.ui.layout.Grid(4, 0);
         layout.setColumnWidth(0, 250);
         layout.setColumnFlex(1, 1);
         
         this.base(arguments, layout);
         this.set({decorator: "inset"});
         
         var klass = attr['spsid.object.class'];
         var schema = spsidgui.Application.schema[klass];

         var headRow = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
         headRow.set({backgroundColor: "#eee",
                      padding: 4});

         var name_label = new qx.ui.basic.Label();

         name_label.set({decorator: "popup",
                         font: "bold",
                         textAlign: "center",
                         minWidth: 200});
                  
         if( schema && schema.display.name_attr &&
             attr[schema.display.name_attr] ) {
             name_label.setValue(attr[schema.display.name_attr]);
         }

         headRow.add(name_label);
         headRow.add(new qx.ui.core.Spacer(30));
         
         var viewButton = new qx.ui.form.Button("View");
         headRow.add(viewButton);
         
         var containerButton = new qx.ui.form.Button("Container");
         headRow.add(containerButton);
         
         var editButton = new qx.ui.form.Button("Edit");
         headRow.add(editButton);
         
         var nRow = 0;
         this.add(headRow, {row: nRow, column: 0, colSpan: 2});

         var hide = {'spsid.object.id': 1,
                     'spsid.object.container': 1};
         var hilite = {};
         if( schema.display.info_attr != undefined ) {
             for (var i=0; i< schema.display.info_attr.length; i++) {
                 hilite[schema.display.info_attr[i]] = true;
             }
         }

         var filtered = new Array;
         for( var attr_name in attr ) {
             if( ! hide[attr_name] ) {
                 filtered.push(attr_name);
             }
         }

         var sorted = filtered.sort();         
         
         for( var i=0; i<sorted.length; i++) {
             nRow++;
             this.add(new qx.ui.basic.Label(sorted[i]),
                      {row: nRow, column: 0});
             var valLabel = new qx.ui.basic.Label(attr[sorted[i]]);
             if( hilite[sorted[i]] ) {
                 valLabel.set({font: "bold"});
             }
             this.add(valLabel, {row: nRow, column: 1});
         }
     }
 });
                      
             

         

         
