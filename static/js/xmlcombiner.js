/**
 * Created by simon on 4.1.2017.
 */

$(document).ready(function(){
    $('select[name="levels"]').change(function(){
        $.get( "?treeLevel="+$(this).val(), function( data ) {
            $('select[name="elements"] option').remove();
            data.forEach(function(obj){
                $('select[name="elements"]').append(
                    "<option value='"+obj.element+"'>"+obj.element+"</option>"
                );
            });
            $.get( "?searchedElement="+$('select[name="elements"] :selected').val(), function( data ) {
                $("#xmlData").text(data)
            });

        });
    });

    $('select[name="elements"]').change(function(){
        $.get( "?searchedElement="+$(this).val(), function( data ) {
            $("#xmlData").text(data)
        });
    });
});
