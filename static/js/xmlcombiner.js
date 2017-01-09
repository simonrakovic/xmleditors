/**
 * Created by simon on 4.1.2017.
 */
var selectedElements = [];
$(document).ready(function(){
    $('select[name="levels"] option:first').attr('selected','selected');
    $('select[name="levels"]').change(function(){
        $.get( "?treeLevel="+$(this).val()+"&step=1", function( data ) {
            $('select[name="elements"] option').remove();
            data.forEach(function(obj){
                $('select[name="elements"]').append(
                    "<option value='"+obj.element+"'>"+obj.element+"</option>"
                );
            });
            $.get( "?searchedElement="+$('select[name="elements"] :selected').val()+"&step=1", function( data ) {
                $("#xmlData").text(data);
                $("#xmlData").removeClass("prettyprinted");
                PR.prettyPrint();
            });

        });
    });

    $('select[name="elements"]').change(function(){
        $.get( "?searchedElement="+$(this).val()+"&step=1", function( data ) {
            $("#xmlData").text(data);
            $("#xmlData").removeClass("prettyprinted");
            PR.prettyPrint();
        });
    });

    $(".btn1").click(function(){
        $(this).attr('href',"?searchedElement="+$('select[name="elements"] :selected').val()+"&step=2")
    });

    $(".btn-element").click(function(){

        if($(this).hasClass("selected")){
            $(this).removeClass("btn-success");
            $(this).removeClass("selected");
            $(this).addClass("btn-default");
            delete selectedElements[$(this).attr("id")];
        }else{
            $(this).removeClass("btn-default");
            $(this).addClass("btn-success");
            $(this).addClass("selected");
            selectedElements[$(this).attr("id")] = $(this).text();
        }
    });

    $(".btn2").click(function(){
        $(this).attr('href',"?selectedElements="+selectedElements+"&step=3")
    });
});
