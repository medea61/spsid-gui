qx.Class.define
("spsidgui.DisplayObject",
 {
     extend : qx.ui.container.Composite,

     construct : function(attr) {

         var layout = new qx.ui.layout.Grid(4, 0);
         this.base(arguments, layout);

         this.set({decorator: 'separator-vertical'});
         
         var klass = attr['spsid.object.class'];
         var schema = spsidgui.Application.schema[klass];

         var name_label = new qx.ui.basic.Label();
         if( schema && schema.display.name_attr &&
             attr[schema.display.name_attr] ) {
             name_label.setValue(attr[schema.display.name_attr]);
         }

         var nRow = 0;
         this.add(name_label, {row: nRow++, column: 0, colSpan: 2});

         for( var attr_name in attr ) {
             this.add(new qx.ui.basic.Label(attr_name),
                      {row: nRow, column: 0});
             this.add(new qx.ui.basic.Label(attr[attr_name]),
                      {row: nRow, column: 1});
             nRow++;
         }
     }
 });
                      
             

         

         
