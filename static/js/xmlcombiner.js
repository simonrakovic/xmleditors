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
        var selectedElements = [];
        $(".btn-element.selected").each(function(){
            if($(this).attr("data-parentIndex")){
                selectedElements.push({"element": $(this).data('element'), "parentElement":$(this).data('parentelement'), "parentIndex": $(this).data('parentindex')});
            }else{
                selectedElements.push({"element": $(this).data('element'), "parentElement":$(this).data('parentelement')});
            }
        });

        $.ajax({
            method: "POST",
            url: "/xmlcombiner/?step=2",
            contentType: "application/json",
            data:  JSON.stringify({"selectedElements": selectedElements})
        }).done(function(res){
            if(res.status == 'success'){
                window.location.href = res.redirectUrl;
            }
        });
    });


    $(".btn3").click(function(){
        var selectedElementsData = [];

        $(".element-data").each(function(){
            if($(this).attr("data-parentIndex")){
                selectedElementsData.push({"element": $(this).data("element"), "parentElement": $(this).data("parentelement"), "parentIndex": $(this).data("parentindex"), "elementData": $(this).find(":selected").val()});
            }else{
                selectedElementsData.push({"element": $(this).data("element"), "parentElement": $(this).data("parentelement"), "elementData": $(this).find(":selected").val()});
            }

        });

        $.ajax({
            method: "POST",
            url: "/xmlcombiner/?step=3",
            contentType: "application/json",
            data:  JSON.stringify({"selectedElementsData": selectedElementsData})
        }).done(function(res){
            if(res.status == 'success'){
                window.location.href = res.redirectUrl;
            }
        });
    });
});


///////////////////////////////////////////////////////////////////////////////////

$(function() {
    $(document).on('change', ':file', function() {

        var input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            label = input.val().replace(/\\/g, '/').replace(/.*\//, ''),
            text = $(this).parents('.input-group').find(':text');

        text.val(label);
    });
});

