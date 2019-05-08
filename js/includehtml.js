$(function(){
  var includes = $('[data-include]');
  jQuery.each(includes, function(){
    var file = 'externalHTML/' + $(this).data('include') + '.html';
    $(this).load(file);
  });
});
