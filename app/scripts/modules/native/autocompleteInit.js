import {cityLookup} from "../../main.js";
import {positionLookup} from "../../main.js";

$("#locationSearch").autocomplete({
  source:cityLookup['cities'],
  select: function(event, ui) {
    $(".dropdown-menu").val(ui.item.term);
    $(this).data("uiItem",ui.item.value);
  }
}).bind("blur",function(){
  $(this).val($(this).data("uiItem"));
})

$('#positionSearch').autocomplete({
  source: positionLookup[0]
})

